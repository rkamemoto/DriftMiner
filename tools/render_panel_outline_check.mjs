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
  let offset = 8;
  let width, height, bitDepth, colorType;
  const idatChunks = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
    } else if (type === "IDAT") idatChunks.push(data);
    else if (type === "IEND") break;
    offset += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = channels;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);
  let rawOffset = 0;
  let prevRow = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    const row = raw.subarray(rawOffset, rawOffset + stride);
    rawOffset += stride;
    const outRow = out.subarray(y * stride, y * stride + stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? outRow[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;
      let value = row[x];
      if (filter === 1) value = (value + a) & 0xff;
      else if (filter === 2) value = (value + b) & 0xff;
      else if (filter === 3) value = (value + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        value = (value + pred) & 0xff;
      }
      outRow[x] = value;
    }
    prevRow = outRow;
  }
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += bpp) {
    if (channels === 4) rgba.set(out.subarray(p, p + 4), i * 4);
    else if (channels === 3) { rgba[i*4]=out[p]; rgba[i*4+1]=out[p+1]; rgba[i*4+2]=out[p+2]; rgba[i*4+3]=255; }
    else if (channels === 1) { const v=out[p]; rgba[i*4]=v; rgba[i*4+1]=v; rgba[i*4+2]=v; rgba[i*4+3]=255; }
    else if (channels === 2) { const v=out[p]; rgba[i*4]=v; rgba[i*4+1]=v; rgba[i*4+2]=v; rgba[i*4+3]=out[p+1]; }
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
    const y0 = Math.max(0, Math.min(h - 1, Math.floor(sy)));
    const y1 = Math.max(0, Math.min(h - 1, y0 + 1));
    const fy = sy - y0;
    for (let x = 0; x < newW; x++) {
      const sx = ((x + 0.5) / newW) * w - 0.5;
      const x0 = Math.max(0, Math.min(w - 1, Math.floor(sx)));
      const x1 = Math.max(0, Math.min(w - 1, x0 + 1));
      const fx = sx - x0;
      const o = (y * newW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = data[(y0 * w + x0) * 4 + c], p10 = data[(y0 * w + x1) * 4 + c];
        const p01 = data[(y1 * w + x0) * 4 + c], p11 = data[(y1 * w + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx, bot = p01 + (p11 - p01) * fx;
        out.data[o + c] = top + (bot - top) * fy;
      }
    }
  }
  return out;
}

function setPx(img, x, y, rgba) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const d = (y * img.width + x) * 4;
  img.data[d] = rgba[0]; img.data[d + 1] = rgba[1]; img.data[d + 2] = rgba[2]; img.data[d + 3] = rgba[3];
}

function blendPx(img, x, y, rgb, alpha01) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const d = (y * img.width + x) * 4;
  img.data[d] = img.data[d] * (1 - alpha01) + rgb[0] * alpha01;
  img.data[d + 1] = img.data[d + 1] * (1 - alpha01) + rgb[1] * alpha01;
  img.data[d + 2] = img.data[d + 2] * (1 - alpha01) + rgb[2] * alpha01;
  img.data[d + 3] = 255;
}

function drawThickLine(img, x0, y0, x1, y1, color, thickness) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x0 + dx * t, cy = y0 + dy * t;
    for (let ox = -thickness; ox <= thickness; ox++) {
      for (let oy = -thickness; oy <= thickness; oy++) {
        if (ox * ox + oy * oy <= thickness * thickness) setPx(img, cx + ox, cy + oy, color);
      }
    }
  }
}

function drawQuadOutline(img, quad, color, thickness = 1) {
  for (let i = 0; i < quad.length; i++) {
    const [x0, y0] = quad[i];
    const [x1, y1] = quad[(i + 1) % quad.length];
    drawThickLine(img, x0, y0, x1, y1, color, thickness);
  }
  // corner markers so we can see which vertex is which
  const markerColors = [[255, 40, 40, 255], [40, 255, 40, 255], [40, 140, 255, 255], [255, 220, 40, 255]];
  quad.forEach(([x, y], i) => {
    for (let ox = -2; ox <= 2; ox++) for (let oy = -2; oy <= 2; oy++) setPx(img, x + ox, y + oy, markerColors[i]);
  });
}

function crop(img, x, y, w, h) {
  const out = makeCanvas(w, h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const sx = x + xx, sy = y + yy, d = (yy * w + xx) * 4;
    if (sx < 0 || sx >= img.width || sy < 0 || sy >= img.height) continue;
    const s = (sy * img.width + sx) * 4;
    out.data[d]=img.data[s]; out.data[d+1]=img.data[s+1]; out.data[d+2]=img.data[s+2]; out.data[d+3]=img.data[s+3];
  }
  return out;
}

// ---------- tiny 3x5 bitmap digit font, for coordinate labels ----------
const DIGITS = {
  0: ["111", "101", "101", "101", "111"],
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"],
  7: ["111", "001", "010", "010", "010"],
  8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"],
};
function drawDigit(img, x, y, digit, color, scale) {
  const rows = DIGITS[digit];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] !== "1") continue;
      for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) {
        setPx(img, x + c * scale + sx, y + r * scale + sy, color);
      }
    }
  }
}
function drawNumber(img, x, y, n, color, scale) {
  const s = String(n);
  for (let i = 0; i < s.length; i++) drawDigit(img, x + i * (3 * scale + scale), y, s[i], color, scale);
}

function drawCoordGrid(img, cropX, cropY, cropW, cropH, zoom, step, color) {
  for (let nx = Math.ceil(cropX / step) * step; nx <= cropX + cropW; nx += step) {
    const zx = (nx - cropX) * zoom;
    for (let zy = 0; zy < cropH * zoom; zy++) blendPx(img, zx, zy, color, 0.35);
    drawNumber(img, zx + 3, 2, nx, [...color, 255], 2);
  }
  for (let ny = Math.ceil(cropY / step) * step; ny <= cropY + cropH; ny += step) {
    const zy = (ny - cropY) * zoom;
    for (let zx = 0; zx < cropW * zoom; zx++) blendPx(img, zx, zy, color, 0.35);
    drawNumber(img, 2, zy + 3, ny, [...color, 255], 2);
  }
}

const CANVAS_W = 960, CANVAS_H = 640;
const QUAD = [[585, 72], [653, 80], [651, 250], [585, 237]]; // TL(red) TR(green) BR(blue) BL(yellow)
const NEW_QUAD = [[589, 82], [653, 86], [648, 249], [589, 248]]; // re-measured directly off the open-art edges

function toCanvasSize(decoded, w, h) {
  const canvas = { width: decoded.width, height: decoded.height, data: decoded.data };
  return canvas.width === w && canvas.height === h ? canvas : resizeBilinear(canvas, w, h);
}

const closedImg = decodePng(fs.readFileSync(path.join(ASSETS, "bathroom-background-faucets-interactable-v3.png")));
const openImg = decodePng(fs.readFileSync(path.join(ASSETS, "bathroom-secret-panel-open-user-reference-v1.png")));
const CLOSED = toCanvasSize(closedImg, CANVAS_W, CANVAS_H);
const OPEN_REF = toCanvasSize(openImg, CANVAS_W, CANVAS_H);

const closedOutlined = { width: CANVAS_W, height: CANVAS_H, data: Uint8ClampedArray.from(CLOSED.data) };
const openOutlined = { width: CANVAS_W, height: CANVAS_H, data: Uint8ClampedArray.from(OPEN_REF.data) };
drawQuadOutline(closedOutlined, QUAD, [255, 0, 255, 255], 1);
drawQuadOutline(openOutlined, QUAD, [255, 0, 255, 255], 1);

const CROP = { x: 540, y: 30, w: 160, h: 260 };
const zoom = 3;
const closedCrop = resizeBilinear(crop(closedOutlined, CROP.x, CROP.y, CROP.w, CROP.h), CROP.w * zoom, CROP.h * zoom);
const openCrop = resizeBilinear(crop(openOutlined, CROP.x, CROP.y, CROP.w, CROP.h), CROP.w * zoom, CROP.h * zoom);

const gap = 12;
const combo = makeCanvas(closedCrop.width * 2 + gap, closedCrop.height);
combo.data.fill(20);
for (let i = 3; i < combo.data.length; i += 4) combo.data[i] = 255;
function paste(dst, src, px, py) {
  for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) {
    const s = (y * src.width + x) * 4, d = ((py + y) * dst.width + (px + x)) * 4;
    dst.data[d]=src.data[s]; dst.data[d+1]=src.data[s+1]; dst.data[d+2]=src.data[s+2]; dst.data[d+3]=255;
  }
}
paste(combo, closedCrop, 0, 0);
paste(combo, openCrop, closedCrop.width + gap, 0);

fs.writeFileSync(path.join(OUT, "quad_outline_check.png"), encodePng(combo));
console.log("wrote", path.join(OUT, "quad_outline_check.png"));
console.log("left = closed art with traced quad, right = open art with SAME quad");
console.log("corner colors: TL=red TR=green BR=blue BL=yellow");

// full-frame wide comparison to see overall framing/scale differences
const wideScale = 0.75;
const closedWide = resizeBilinear(closedOutlined, Math.round(CANVAS_W * wideScale), Math.round(CANVAS_H * wideScale));
const openWide = resizeBilinear(openOutlined, Math.round(CANVAS_W * wideScale), Math.round(CANVAS_H * wideScale));
const wideGap = 12;
const wideCombo = makeCanvas(closedWide.width * 2 + wideGap, closedWide.height);
wideCombo.data.fill(20);
for (let i = 3; i < wideCombo.data.length; i += 4) wideCombo.data[i] = 255;
paste(wideCombo, closedWide, 0, 0);
paste(wideCombo, openWide, closedWide.width + wideGap, 0);
fs.writeFileSync(path.join(OUT, "quad_outline_wide.png"), encodePng(wideCombo));
console.log("wrote", path.join(OUT, "quad_outline_wide.png"));

// gridded, labeled zoom on the OPEN reference art so exact corner coords can be read off
const GRID_CROP = { x: 520, y: 10, w: 200, h: 300 };
const gridZoom = 3;
const gridStep = 20;
const openGridCrop = crop(openOutlined, GRID_CROP.x, GRID_CROP.y, GRID_CROP.w, GRID_CROP.h);
const openGridZoomed = resizeBilinear(openGridCrop, GRID_CROP.w * gridZoom, GRID_CROP.h * gridZoom);
drawCoordGrid(openGridZoomed, GRID_CROP.x, GRID_CROP.y, GRID_CROP.w, GRID_CROP.h, gridZoom, gridStep, [255, 255, 0]);
fs.writeFileSync(path.join(OUT, "open_art_grid.png"), encodePng(openGridZoomed));
console.log("wrote", path.join(OUT, "open_art_grid.png"));

// old (magenta) vs re-measured (cyan) quad on the raw open art
const openReQuad = { width: CANVAS_W, height: CANVAS_H, data: Uint8ClampedArray.from(OPEN_REF.data) };
drawQuadOutline(openReQuad, QUAD, [255, 0, 255, 255], 1);
drawQuadOutline(openReQuad, NEW_QUAD, [0, 255, 255, 255], 1);
const reQuadCrop = resizeBilinear(crop(openReQuad, GRID_CROP.x, GRID_CROP.y, GRID_CROP.w, GRID_CROP.h), GRID_CROP.w * gridZoom, GRID_CROP.h * gridZoom);
fs.writeFileSync(path.join(OUT, "open_art_new_quad.png"), encodePng(reQuadCrop));
console.log("wrote", path.join(OUT, "open_art_new_quad.png"), "(magenta=old quad, cyan=re-measured quad)");
