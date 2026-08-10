import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT = path.resolve("tmp/secret-panel-frames");

function decodePng(buf) {
  let offset = 8, width, height;
  const idatChunks = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); }
    else if (type === "IDAT") idatChunks.push(data);
    else if (type === "IEND") break;
    offset += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = 4, stride = width * bpp;
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
  return { width, height, data: out };
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
function resizeNearest(buf, w, h, newW, newH) {
  const out = Buffer.alloc(newW * newH * 4);
  for (let y = 0; y < newH; y++) for (let x = 0; x < newW; x++) {
    const sx = Math.min(w-1, Math.floor(x*w/newW)), sy = Math.min(h-1, Math.floor(y*h/newH));
    const s = (sy*w+sx)*4, d = (y*newW+x)*4;
    buf.copy(out, d, s, s+4);
  }
  return out;
}

const img = decodePng(fs.readFileSync(path.join(OUT, "diff_heatmap.png")));
// crop top strip (search window was x480-740,y0-360 native, 2x zoom -> full img 520x720)
const cropX = 0, cropY = 0, cropW = img.width, cropH = 220;
const cropped = Buffer.alloc(cropW * cropH * 4);
for (let y = 0; y < cropH; y++) img.data.copy(cropped, y*cropW*4, (cropY+y)*img.width*4, (cropY+y)*img.width*4 + cropW*4);
const zoomed = resizeNearest(cropped, cropW, cropH, cropW * 2, cropH * 2);
fs.writeFileSync(path.join(OUT, "heatmap_top_zoom.png"), encodePng({ width: cropW*2, height: cropH*2, data: zoomed }));
console.log("wrote heatmap_top_zoom.png");
