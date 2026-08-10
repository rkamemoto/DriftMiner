import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "assets", "stage4", "level4-bathroom");
const OUT = path.join(ROOT, "tmp", "secret-panel-frames");
fs.mkdirSync(OUT, { recursive: true });

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a png");
  let offset = 8, width, height, bitDepth, colorType;
  const idatChunks = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8); colorType = data.readUInt8(9);
    } else if (type === "IDAT") idatChunks.push(data);
    else if (type === "IEND") break;
    offset += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = channels, stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let rawOffset = 0, prevRow = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    const row = raw.subarray(rawOffset, rawOffset + stride);
    rawOffset += stride;
    const outRow = out.subarray(y * stride, y * stride + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? outRow[x - bpp] : 0, b = prevRow[x], c = x >= bpp ? prevRow[x - bpp] : 0;
      let value = row[x];
      if (filter === 1) value = (value + a) & 0xff;
      else if (filter === 2) value = (value + b) & 0xff;
      else if (filter === 3) value = (value + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        value = (value + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
      outRow[x] = value;
    }
    prevRow = outRow;
  }
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += bpp) {
    if (channels === 4) rgba.set(out.subarray(p, p + 4), i * 4);
    else if (channels === 3) { rgba[i*4]=out[p]; rgba[i*4+1]=out[p+1]; rgba[i*4+2]=out[p+2]; rgba[i*4+3]=255; }
  }
  return { width, height, data: rgba };
}

function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(Buffer.from(data.buffer, data.byteOffset + y * stride, stride), y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  function chunk(type, dataBuf) {
    const len = Buffer.alloc(4); len.writeUInt32BE(dataBuf.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, dataBuf])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, dataBuf, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); ihdr.writeUInt8(6, 9); ihdr.writeUInt8(0, 10); ihdr.writeUInt8(0, 11); ihdr.writeUInt8(0, 12);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function makeCanvas(w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; }
function resizeBilinear(img, newW, newH) {
  const out = makeCanvas(newW, newH);
  const { width: w, height: h, data } = img;
  for (let y = 0; y < newH; y++) {
    const sy = ((y + 0.5) / newH) * h - 0.5;
    const y0 = Math.max(0, Math.min(h - 1, Math.floor(sy))), y1 = Math.max(0, Math.min(h - 1, y0 + 1));
    const fy = sy - y0;
    for (let x = 0; x < newW; x++) {
      const sx = ((x + 0.5) / newW) * w - 0.5;
      const x0 = Math.max(0, Math.min(w - 1, Math.floor(sx))), x1 = Math.max(0, Math.min(w - 1, x0 + 1));
      const fx = sx - x0;
      const o = (y * newW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = data[(y0*w+x0)*4+c], p10 = data[(y0*w+x1)*4+c], p01 = data[(y1*w+x0)*4+c], p11 = data[(y1*w+x1)*4+c];
        const top = p00+(p10-p00)*fx, bot = p01+(p11-p01)*fx;
        out.data[o+c] = top+(bot-top)*fy;
      }
    }
  }
  return out;
}

const CANVAS_W = 960, CANVAS_H = 640;
function toCanvasSize(decoded, w, h) {
  const canvas = { width: decoded.width, height: decoded.height, data: decoded.data };
  return canvas.width === w && canvas.height === h ? canvas : resizeBilinear(canvas, w, h);
}

const closedImg = decodePng(fs.readFileSync(path.join(ASSETS, "bathroom-background-faucets-interactable-v3.png")));
const openImg = decodePng(fs.readFileSync(path.join(ASSETS, "bathroom-secret-panel-open-user-reference-v1.png")));
const CLOSED = toCanvasSize(closedImg, CANVAS_W, CANVAS_H);
const OPEN_REF = toCanvasSize(openImg, CANVAS_W, CANVAS_H);

// Search window around the traced closed-panel quad -- generous margin since
// the open-art panel is reportedly shifted, not just mis-traced by a few px.
const SEARCH = { x: 480, y: 0, w: 260, h: 360 };

function diffMap() {
  const map = new Float32Array(SEARCH.w * SEARCH.h);
  for (let y = 0; y < SEARCH.h; y++) {
    for (let x = 0; x < SEARCH.w; x++) {
      const gx = SEARCH.x + x, gy = SEARCH.y + y;
      const i = (gy * CANVAS_W + gx) * 4;
      const dr = CLOSED.data[i] - OPEN_REF.data[i];
      const dg = CLOSED.data[i+1] - OPEN_REF.data[i+1];
      const db = CLOSED.data[i+2] - OPEN_REF.data[i+2];
      map[y * SEARCH.w + x] = Math.sqrt(dr*dr + dg*dg + db*db);
    }
  }
  return map;
}

const map = diffMap();
let maxV = 0;
for (const v of map) maxV = Math.max(maxV, v);
const THRESH = maxV * 0.35;

// connected-component: largest blob above threshold
const w = SEARCH.w, h = SEARCH.h;
const visited = new Uint8Array(w * h);
let best = null, bestSize = 0;
for (let sy = 0; sy < h; sy++) {
  for (let sx = 0; sx < w; sx++) {
    const idx = sy * w + sx;
    if (visited[idx] || map[idx] < THRESH) continue;
    const stack = [idx];
    visited[idx] = 1;
    let minX = sx, maxX = sx, minY = sy, maxY = sy, size = 0;
    while (stack.length) {
      const cur = stack.pop();
      const cy = Math.floor(cur / w), cx = cur % w;
      size++;
      minX = Math.min(minX, cx); maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy); maxY = Math.max(maxY, cy);
      const neighbors = [cur - 1, cur + 1, cur - w, cur + w];
      for (const n of neighbors) {
        if (n < 0 || n >= w * h) continue;
        if (cx === 0 && n === cur - 1) continue;
        if (cx === w - 1 && n === cur + 1) continue;
        if (visited[n] || map[n] < THRESH) continue;
        visited[n] = 1;
        stack.push(n);
      }
    }
    if (size > bestSize) { bestSize = size; best = { minX, maxX, minY, maxY, size }; }
  }
}

console.log("max diff:", maxV.toFixed(1), "threshold:", THRESH.toFixed(1));
if (best) {
  const box = {
    x: SEARCH.x + best.minX, y: SEARCH.y + best.minY,
    w: best.maxX - best.minX, h: best.maxY - best.minY, pixels: best.size,
  };
  console.log("largest diff blob bounding box (native coords):", box);
} else {
  console.log("no blob found above threshold");
}

// Save the diff heatmap for visual sanity check.
const heat = makeCanvas(w, h);
for (let i = 0; i < w * h; i++) {
  const v = Math.min(255, (map[i] / maxV) * 255);
  const d = i * 4;
  heat.data[d] = v; heat.data[d+1] = v * 0.3; heat.data[d+2] = 255 - v; heat.data[d+3] = 255;
}
const heatZoomed = resizeBilinear(heat, w * 2, h * 2);
fs.writeFileSync(path.join(OUT, "diff_heatmap.png"), encodePng(heatZoomed));
console.log("wrote", path.join(OUT, "diff_heatmap.png"), "(search window origin native:", SEARCH.x, SEARCH.y, ", 2x zoom)");

// annotated comparison: old traced quad (magenta) vs auto-detected diff box (green) on the open art
function setPx(img, x, y, rgba) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const d = (y * img.width + x) * 4;
  img.data[d] = rgba[0]; img.data[d+1] = rgba[1]; img.data[d+2] = rgba[2]; img.data[d+3] = 255;
}
function drawThickLine(img, x0, y0, x1, y1, color, thickness) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, cx = x0 + dx * t, cy = y0 + dy * t;
    for (let ox = -thickness; ox <= thickness; ox++) for (let oy = -thickness; oy <= thickness; oy++) {
      if (ox*ox+oy*oy <= thickness*thickness) setPx(img, cx+ox, cy+oy, color);
    }
  }
}
function drawQuad(img, quad, color, thickness) {
  for (let i = 0; i < quad.length; i++) {
    const [x0,y0] = quad[i], [x1,y1] = quad[(i+1)%quad.length];
    drawThickLine(img, x0, y0, x1, y1, color, thickness);
  }
}
function crop(img, x, y, cw, ch) {
  const out = makeCanvas(cw, ch);
  for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) {
    const sx = x+xx, sy = y+yy, d = (yy*cw+xx)*4;
    if (sx<0||sx>=img.width||sy<0||sy>=img.height) continue;
    const s = (sy*img.width+sx)*4;
    out.data[d]=img.data[s]; out.data[d+1]=img.data[s+1]; out.data[d+2]=img.data[s+2]; out.data[d+3]=255;
  }
  return out;
}

const OLD_QUAD = [[585, 72], [653, 80], [651, 250], [585, 237]];
const openAnnotated = { width: CANVAS_W, height: CANVAS_H, data: Uint8ClampedArray.from(OPEN_REF.data) };
drawQuad(openAnnotated, OLD_QUAD, [255, 0, 255], 1);
if (best) {
  const bx = SEARCH.x + best.minX, by = SEARCH.y + best.minY;
  const bw = best.maxX - best.minX, bh = best.maxY - best.minY;
  const NEW_QUAD = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]];
  drawQuad(openAnnotated, NEW_QUAD, [0, 255, 0], 1);
  console.log("NEW_QUAD (axis-aligned, from diff detection):", JSON.stringify(NEW_QUAD));
}
const CROP2 = { x: 520, y: 10, w: 200, h: 300 };
const zoom2 = 3;
const annotatedCrop = resizeBilinear(crop(openAnnotated, CROP2.x, CROP2.y, CROP2.w, CROP2.h), CROP2.w * zoom2, CROP2.h * zoom2);
fs.writeFileSync(path.join(OUT, "open_art_old_vs_detected.png"), encodePng(annotatedCrop));
console.log("wrote", path.join(OUT, "open_art_old_vs_detected.png"), "(magenta=old traced quad, green=auto-detected diff box)");
