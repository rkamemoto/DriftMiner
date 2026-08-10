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
function nearestZoom(buf, w, h, zoom) {
  const outW = w*zoom, outH = h*zoom;
  const out = Buffer.alloc(outW*outH*4);
  for (let y=0;y<outH;y++) for (let x=0;x<outW;x++) {
    const s=(Math.floor(y/zoom)*w+Math.floor(x/zoom))*4, d=(y*outW+x)*4;
    buf.copy(out,d,s,s+4);
  }
  return {width:outW,height:outH,data:out};
}
function setPx(buf, w, h, x, y, rgb) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const d = (y*w+x)*4;
  buf[d]=rgb[0]; buf[d+1]=rgb[1]; buf[d+2]=rgb[2]; buf[d+3]=255;
}

const DIGITS = {
  0:["111","101","101","101","111"],1:["010","110","010","010","111"],2:["111","001","111","100","111"],
  3:["111","001","111","001","111"],4:["101","101","111","001","001"],5:["111","100","111","001","111"],
  6:["111","100","111","101","111"],7:["111","001","010","010","010"],8:["111","101","111","101","111"],
  9:["111","101","111","001","111"],
};
function drawDigit(buf,w,h,x,y,d,color,scale){const rows=DIGITS[d];for(let r=0;r<rows.length;r++)for(let c=0;c<rows[r].length;c++){if(rows[r][c]!=="1")continue;for(let sy=0;sy<scale;sy++)for(let sx=0;sx<scale;sx++)setPx(buf,w,h,x+c*scale+sx,y+r*scale+sy,color);}}
function drawNumber(buf,w,h,x,y,n,color,scale){const s=String(n);for(let i=0;i<s.length;i++)drawDigit(buf,w,h,x+i*(4*scale),y,s[i],color,scale);}

const img = decodePng(fs.readFileSync(path.join(ASSETS, "bathroom-secret-panel-open-user-reference-v1.png")));
const W = img.width, H = img.height;

// crop a generous region above+through the current top edge
const CROP = { x: 555, y: 20, w: 110, h: 220 };
const cropped = Buffer.alloc(CROP.w * CROP.h * 4);
for (let y = 0; y < CROP.h; y++) img.data.copy(cropped, y*CROP.w*4, (CROP.y+y)*W*4 + CROP.x*4, (CROP.y+y)*W*4 + (CROP.x+CROP.w)*4);

const zoom = 5;
const zoomed = nearestZoom(cropped, CROP.w, CROP.h, zoom);

// Same slope as the measured/true top edge (panel is in isometric perspective,
// not flat) -- only the vertical offset (y at x=620) differs per candidate.
const SLOPE = 0.0878;
const candidates = [50, 60, 70, 81.6, 90]; // y-at-x=620 for each candidate line
const colors = { 50: [255,60,60], 60: [255,180,0], 70: [255,255,0], 81.6: [0,255,255], 90: [255,0,255] };
for (const yAt620 of candidates) {
  const b = yAt620 - SLOPE * 620;
  const color = colors[yAt620];
  for (let zx = 0; zx < zoomed.width; zx++) {
    const nx = CROP.x + zx / zoom;
    const ny = SLOPE * nx + b;
    const zy = (ny - CROP.y) * zoom;
    setPx(zoomed.data, zoomed.width, zoomed.height, zx, zy, color);
    setPx(zoomed.data, zoomed.width, zoomed.height, zx, zy + 1, color);
  }
  const labelY = (SLOPE * CROP.x + b - CROP.y) * zoom;
  drawNumber(zoomed.data, zoomed.width, zoomed.height, 4, labelY - 20, Math.round(yAt620), color, 3);
}

fs.writeFileSync(path.join(OUT, "top_candidates.png"), encodePng(zoomed));
console.log("wrote top_candidates.png. candidates (native y):", candidates.join(", "), "-- cyan(81.6) is the current measured line");
