// Rebuilds stage6/assets/ui-icons-sheet.png as a clean 8x4 grid of 96x96 cells.
// The generated sheet had a gutter erased through every row line (ending at y 103 / 199 / 295, starting at a different
// height per icon), slicing each icon into a main piece and a tail, with slivers of neighbouring icons leaking in.
// Each icon is rejoined (blank rows at the cut removed), cleaned to its own pixels and centred in its cell.
// The erased pixels themselves are gone; the rejoined icons are slightly shorter than drawn.
// Usage: node tools/clean_stage6_ui_icons.mjs <in.png> <out.png>
import fs from "node:fs";
import zlib from "node:zlib";

function decodePng(buf) {
  let offset = 8, width, height, colorType, depth, interlace;
  const idat = [];
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset), type = buf.toString("ascii", offset + 4, offset + 8), data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === "IHDR") { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    offset += 12 + len;
  }
  if (depth !== 8 || colorType !== 6 || interlace) throw new Error(`unsupported PNG (depth ${depth}, colour type ${colorType}, interlace ${interlace})`);
  const raw = zlib.inflateSync(Buffer.concat(idat)), bpp = 4, stride = width * bpp, out = Buffer.alloc(height * stride);
  let ro = 0, prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[ro++], row = raw.subarray(ro, ro + stride), o = out.subarray(y * stride, y * stride + stride);
    ro += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? o[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      o[x] = v & 0xff;
    }
    prev = o;
  }
  return { width, height, data: out };
}
function encodePng({ width, height, data }) {
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) data.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  const chunk = (type, d) => {
    const len = Buffer.alloc(4), t = Buffer.from(type, "ascii"), crc = Buffer.alloc(4);
    len.writeUInt32BE(d.length); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, d])) >>> 0);
    return Buffer.concat([len, t, d, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const [, , inPath, outPath] = process.argv;
const orig = decodePng(fs.readFileSync(inPath));
// the same 16px gutter was erased down every column line (x 88-103, 184-199, ...), clipping icons that reach past their
// cell's side: drop those columns first so the clipped edges (the energy orb's left side) rejoin their icon
const keepX = [];
for (let x = 0; x < orig.width; x++) { const m = x % 96; if (!(m >= 88 || (m < 8 && x >= 96))) keepX.push(x); }
const SW = keepX.length, src = { data: Buffer.alloc(SW * orig.height * 4) };
for (let y = 0; y < orig.height; y++) keepX.forEach((x, i) => orig.data.copy(src.data, (y * SW + i) * 4, (y * orig.width + x) * 4, (y * orig.width + x) * 4 + 4));
// cell c's own columns in the collapsed image
const CX = [...Array(8)].map((_, c) => [keepX.indexOf(c * 96 + (c ? 8 : 0)), keepX.indexOf(c * 96 + 87) + 1]);
const alpha = (x, y) => src.data[(y * SW + x) * 4 + 3];
const rowHas = (c, y) => { for (let x = CX[c][0]; x < CX[c][1]; x++) if (alpha(x, y) > 24) return true; return false; };
// per row: main piece and the tail below the erased gutter (row 3 holds the companions, which start below the third gutter)
const ROWS = [[[0, 88], [104, 120]], [[120, 184], [200, 212]], [[212, 280], [296, 304]], [[296, 384]]];
const out = Buffer.alloc(768 * 384 * 4);

// each icon is read through a window M px wider than its cell on both sides: some art (the energy orb) spills into the
// neighbouring cell, and the main icon is the biggest blob whose centre lies inside the cell itself
const M = 24;
for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
  const segs = (r === 2 && c < 2 ? ROWS[2].slice(0, 1) : ROWS[r]).map(s => s.slice());
  segs.forEach((s, i) => {
    if (i < segs.length - 1) while (s[1] > s[0] && !rowHas(c, s[1] - 1)) s[1]--;
    if (i > 0) while (s[0] < s[1] && !rowHas(c, s[0])) s[0]++;
  });
  // stack the pieces into a window buffer
  const h = segs.reduce((n, [a, b]) => n + b - a, 0);
  if (!h) continue;
  const CW = CX[c][1] - CX[c][0], WW = CW + 2 * M, cell = Buffer.alloc(WW * h * 4), wx0 = CX[c][0] - M;
  let y = 0;
  for (const [a, b] of segs) for (let sy = a; sy < b; sy++, y++) for (let x = 0; x < WW; x++) {
    const sx = wx0 + x;
    if (sx >= 0 && sx < SW) src.data.copy(cell, (y * WW + x) * 4, (sy * SW + sx) * 4, (sy * SW + sx) * 4 + 4);
  }
  // connected components on 2px blocks (4px merged a neighbour's sliver into the shield's glow)
  const B = 2, bw = Math.ceil(WW / B), bh = Math.ceil(h / B), mass = new Uint32Array(bw * bh);
  for (let yy = 0; yy < h; yy++) for (let x = 0; x < WW; x++) if (cell[(yy * WW + x) * 4 + 3] > 24) mass[((yy / B) | 0) * bw + ((x / B) | 0)]++;
  const lab = new Int32Array(bw * bh).fill(-1), comps = [];
  for (let i = 0; i < mass.length; i++) {
    if (!mass[i] || lab[i] >= 0) continue;
    const k0 = { m: 0, sx: 0, x0: 1e9, y0: 1e9, x1: -1, y1: -1 }, id = comps.length, st = [i];
    comps.push(k0); lab[i] = id;
    while (st.length) {
      const k = st.pop(), bx = k % bw, by = (k / bw) | 0;
      k0.m += mass[k]; k0.sx += bx * mass[k]; k0.x0 = Math.min(k0.x0, bx); k0.x1 = Math.max(k0.x1, bx); k0.y0 = Math.min(k0.y0, by); k0.y1 = Math.max(k0.y1, by);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = bx + dx, ny = by + dy;
        if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;
        const nk = ny * bw + nx;
        if (mass[nk] && lab[nk] < 0) { lab[nk] = id; st.push(nk); }
      }
    }
  }
  const inCell = k => { const cx = (k.sx / k.m + .5) * B; return cx >= M && cx < M + CW; };
  const big = comps.reduce((a, k) => inCell(k) && (!a || k.m > a.m) ? k : a, null);
  if (!big || big.m < 200) continue;
  // small bits survive only inside the main icon's box grown by 8px (sparkles), so neighbour slivers don't skew centring
  const keep = comps.map(k => k === big || (k.x0 >= big.x0 - 8 / B && k.x1 <= big.x1 + 8 / B && k.y0 >= big.y0 - 8 / B && k.y1 <= big.y1 + 8 / B));
  // exact pixel bounds of the kept pixels
  let x0 = WW, y0 = h, x1 = -1, y1 = -1;
  for (let yy = 0; yy < h; yy++) for (let x = 0; x < WW; x++) {
    const p = (yy * WW + x) * 4;
    if (!keep[lab[((yy / B) | 0) * bw + ((x / B) | 0)]]) { cell[p + 3] = 0; continue; }
    if (cell[p + 3]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, yy); y1 = Math.max(y1, yy); }
  }
  const w = x1 - x0 + 1, ih = y1 - y0 + 1;
  if (w > 96 || ih > 96) throw new Error(`icon ${c},${r} is ${w}x${ih}, larger than its cell`);
  const ox = c * 96 + ((96 - w) >> 1), oy = r * 96 + ((96 - ih) >> 1);
  for (let yy = 0; yy < ih; yy++) for (let x = 0; x < w; x++) {
    const sp = ((y0 + yy) * WW + x0 + x) * 4;
    if (cell[sp + 3]) cell.copy(out, ((oy + yy) * 768 + ox + x) * 4, sp, sp + 4);
  }
  console.log(`cell ${c},${r}: ${w}x${ih}`);
}
fs.writeFileSync(outPath, encodePng({ width: 768, height: 384, data: out }));
console.log("wrote", outPath);

