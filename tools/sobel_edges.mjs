import fs from "node:fs";
import zlib from "node:zlib";

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

const [,, input, xArg, yArg, wArg, hArg, zoomArg, output] = process.argv;
const img = decodePng(fs.readFileSync(input));
const cx = Number(xArg), cy = Number(yArg), cw = Number(wArg), ch = Number(hArg), zoom = Number(zoomArg);

function lum(x, y) {
  x = Math.max(0, Math.min(img.width - 1, x));
  y = Math.max(0, Math.min(img.height - 1, y));
  const i = (y * img.width + x) * 4;
  return 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
}

const mag = new Float32Array(cw * ch);
let maxMag = 0;
for (let yy = 0; yy < ch; yy++) {
  for (let xx = 0; xx < cw; xx++) {
    const x = cx + xx, y = cy + yy;
    const gx = (lum(x+1,y-1)+2*lum(x+1,y)+lum(x+1,y+1)) - (lum(x-1,y-1)+2*lum(x-1,y)+lum(x-1,y+1));
    const gy = (lum(x-1,y+1)+2*lum(x,y+1)+lum(x+1,y+1)) - (lum(x-1,y-1)+2*lum(x,y-1)+lum(x+1,y-1));
    const m = Math.sqrt(gx*gx + gy*gy);
    mag[yy*cw+xx] = m;
    if (m > maxMag) maxMag = m;
  }
}

const heat = Buffer.alloc(cw * ch * 4);
for (let i = 0; i < cw*ch; i++) {
  const v = Math.min(255, (mag[i] / (maxMag * 0.5)) * 255); // boost faint edges
  heat[i*4] = v; heat[i*4+1] = v; heat[i*4+2] = v; heat[i*4+3] = 255;
}
const zoomed = nearestZoom(heat, cw, ch, zoom);
fs.writeFileSync(output, encodePng(zoomed));
console.log(`wrote ${output}, maxMag=${maxMag.toFixed(1)}`);
