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
const W = img.width;
function lum(x, y) {
  x = Math.round(x); y = Math.round(y);
  const i = (y * W + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
}
function gradY(x, y) {
  // vertical Sobel (row gradient) -- picks up horizontal-ish seams
  return (lum(x-1,y+1)+2*lum(x,y+1)+lum(x+1,y+1)) - (lum(x-1,y-1)+2*lum(x,y-1)+lum(x+1,y-1));
}

// scan columns across the panel width, look for the strongest gradient peak
// in the y=55-80 band (above the cavity's own strong edge around y=82-90)
const pts = [];
for (let x = 592; x <= 646; x++) {
  let bestY = null, bestMag = 0;
  for (let y = 52; y <= 80; y++) {
    const g = Math.abs(gradY(x, y));
    if (g > bestMag) { bestMag = g; bestY = y; }
  }
  if (bestMag > 15) pts.push({ x, y: bestY, mag: bestMag });
}
console.log("points found:", pts.length);
console.log(JSON.stringify(pts));

function linfit(points) {
  const n = points.length;
  let sx=0,sy=0,sxx=0,sxy=0;
  for (const p of points) { sx+=p.x; sy+=p.y; sxx+=p.x*p.x; sxy+=p.x*p.y; }
  const m = (n*sxy - sx*sy)/(n*sxx - sx*sx);
  const b = (sy - m*sx)/n;
  return {m,b};
}
if (pts.length > 4) {
  const fit = linfit(pts);
  console.log("fit: y =", fit.m, "* x +", fit.b);
  console.log("at x=592:", fit.m*592+fit.b, " at x=646:", fit.m*646+fit.b);
}
