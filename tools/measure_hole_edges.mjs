import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "assets", "stage4", "level4-bathroom");
const OUT = path.join(ROOT, "tmp", "secret-panel-frames");

function decodePng(buf) {
  let offset = 8, width, height, colorType;
  const idatChunks = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); colorType = data.readUInt8(9); }
    else if (type === "IDAT") idatChunks.push(data);
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
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += bpp) {
    if (channels === 4) out.copy(rgba, i * 4, p, p + 4);
    else if (channels === 3) { rgba[i*4]=out[p]; rgba[i*4+1]=out[p+1]; rgba[i*4+2]=out[p+2]; rgba[i*4+3]=255; }
  }
  return { width, height, data: rgba };
}

const img = decodePng(fs.readFileSync(path.join(ASSETS, "bathroom-secret-panel-open-user-reference-v1.png")));
const W = img.width, H = img.height;
function lum(x, y) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return 255;
  const i = (y * W + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
}

const THRESH = 60; // dark interior is much darker than the wall in this art

// search rows for left/right edges of the dark span (near-known area x560-660)
const rowResults = [];
for (let y = 90; y <= 235; y++) {
  let left = null, right = null;
  for (let x = 560; x <= 670; x++) {
    if (lum(x, y) < THRESH) { left = x; break; }
  }
  for (let x = 670; x >= 560; x--) {
    if (lum(x, y) < THRESH) { right = x; break; }
  }
  if (left !== null && right !== null && right - left > 20) rowResults.push({ y, left, right });
}

// search columns for top/bottom edges of the dark span
const colResults = [];
for (let x = 592; x <= 646; x++) {
  let top = null, bottom = null;
  for (let y = 70; y <= 260; y++) {
    if (lum(x, y) < THRESH) { top = y; break; }
  }
  for (let y = 260; y >= 70; y--) {
    if (lum(x, y) < THRESH) { bottom = y; break; }
  }
  if (top !== null && bottom !== null && bottom - top > 20) colResults.push({ x, top, bottom });
}

function linfit(points, xKey, yKey) {
  const n = points.length;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of points) { sx += p[xKey]; sy += p[yKey]; sxx += p[xKey] * p[xKey]; sxy += p[xKey] * p[yKey]; }
  const m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const b = (sy - m * sx) / n;
  return { m, b };
}

// Left edge: x as function of y (mostly vertical) -> fit x = m*y + b using early portion (avoid trash-can occlusion near bottom)
function medianOf(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}
function rejectOutliers(pts, valueKey, tolerance) {
  const med = medianOf(pts.map(p => p[valueKey]));
  return pts.filter(p => Math.abs(p[valueKey] - med) <= tolerance);
}

// A pipe/prop silhouette to the left of the opening occasionally reads as
// "dark" too and derails a naive left-to-right scan -- filter those rows out
// rather than let them drag the line fit.
let leftPts = rowResults.filter(r => r.y < 170).map(r => ({ y: r.y, x: r.left }));
leftPts = rejectOutliers(rejectOutliers(leftPts, "x", 8), "x", 3);
let rightPts = rowResults.map(r => ({ y: r.y, x: r.right }));
rightPts = rejectOutliers(rejectOutliers(rightPts, "x", 8), "x", 3);
let topPts = colResults.map(c => ({ x: c.x, y: c.top }));
topPts = rejectOutliers(rejectOutliers(topPts, "y", 8), "y", 3);
// bottom-left is occluded by the trash can prop in this art -- only trust the
// unobstructed right portion for the bottom edge's slope/position.
let bottomPts = colResults.filter(c => c.x >= 615).map(c => ({ x: c.x, y: c.bottom }));
bottomPts = rejectOutliers(rejectOutliers(bottomPts, "y", 8), "y", 3);

const leftFit = linfit(leftPts, "y", "x");   // x = m*y + b
const rightFit = linfit(rightPts, "y", "x"); // x = m*y + b
const topFit = linfit(topPts, "x", "y");     // y = m*x + b
const bottomFit = linfit(bottomPts, "x", "y"); // y = m*x + b

function intersectVertLine_HorizLine(vert, horiz) {
  // vert: x = vert.m*y + vert.b ; horiz: y = horiz.m*x + horiz.b
  // substitute: x = vert.m*(horiz.m*x + horiz.b) + vert.b
  const x = (vert.m * horiz.b + vert.b) / (1 - vert.m * horiz.m);
  const y = horiz.m * x + horiz.b;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

const TL = intersectVertLine_HorizLine(leftFit, topFit);
const TR = intersectVertLine_HorizLine(rightFit, topFit);
const BR = intersectVertLine_HorizLine(rightFit, bottomFit);
const BL = intersectVertLine_HorizLine(leftFit, bottomFit);

console.log("leftPts:", JSON.stringify(leftPts));
console.log("row samples:", rowResults.length, "col samples:", colResults.length);
console.log("leftFit(x=m*y+b):", leftFit);
console.log("rightFit(x=m*y+b):", rightFit);
console.log("topFit(y=m*x+b):", topFit);
console.log("bottomFit(y=m*x+b):", bottomFit);
console.log("MEASURED_QUAD =", JSON.stringify([TL, TR, BR, BL]));

// visual verification: draw both quads on the raw open art
function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) { raw[y*(stride+1)]=0; data.copy(raw, y*(stride+1)+1, y*stride, y*stride+stride); }
  const idat = zlib.deflateSync(raw, { level: 6 });
  function chunk(type, dataBuf) {
    const len = Buffer.alloc(4); len.writeUInt32BE(dataBuf.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, dataBuf])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, dataBuf, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8,8); ihdr.writeUInt8(6,9); ihdr.writeUInt8(0,10); ihdr.writeUInt8(0,11); ihdr.writeUInt8(0,12);
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
function setPx(buf, w, h, x, y, rgb) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const d = (y * w + x) * 4;
  buf[d] = rgb[0]; buf[d+1] = rgb[1]; buf[d+2] = rgb[2]; buf[d+3] = 255;
}
function drawThickLine(buf, w, h, x0, y0, x1, y1, color, thickness) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, cx = x0 + dx * t, cy = y0 + dy * t;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) setPx(buf, w, h, cx+ox, cy+oy, color);
  }
}
function drawQuad(buf, w, h, quad, color) {
  for (let i = 0; i < quad.length; i++) {
    const [x0,y0] = quad[i], [x1,y1] = quad[(i+1)%quad.length];
    drawThickLine(buf, w, h, x0, y0, x1, y1, color);
  }
}
const OLD_QUAD = [[585, 72], [653, 80], [651, 250], [585, 237]];
const annotated = Buffer.from(img.data);
drawQuad(annotated, W, H, OLD_QUAD, [255, 0, 255]);
drawQuad(annotated, W, H, [TL, TR, BR, BL], [50, 255, 50]);

function crop(buf, w, h, x, y, cw, ch) {
  const out = Buffer.alloc(cw * ch * 4);
  for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) {
    const sx = x+xx, sy = y+yy;
    if (sx<0||sx>=w||sy<0||sy>=h) continue;
    const s=(sy*w+sx)*4, d=(yy*cw+xx)*4;
    buf.copy(out, d, s, s+4);
  }
  return out;
}
function nearestZoom(buf, w, h, zoom) {
  const outW = w*zoom, outH = h*zoom;
  const out = Buffer.alloc(outW*outH*4);
  for (let y=0;y<outH;y++) for (let x=0;x<outW;x++) {
    const s=(Math.floor(y/zoom)*w+Math.floor(x/zoom))*4, d=(y*outW+x)*4;
    buf.copy(out,d,s,s+4);
  }
  return {width:outW,height:outH,data:out};
}
const cropBuf = crop(annotated, W, H, 555, 40, 130, 230);
const zoomed = nearestZoom(cropBuf, 130, 230, 4);
fs.writeFileSync(path.join(OUT, "measured_vs_old_quad.png"), encodePng(zoomed));
console.log("wrote measured_vs_old_quad.png (magenta=old, green=measured via edge detection)");
