// Builds the Stage 4 door hover masks by tracing the doors off the room art,
// so the highlight follows what is actually painted:
//
//   node tools/build_stage4_door_masks.mjs
//
// Room 3 open utility door: flood the dark doorway in the door-open painting,
// down to the threshold seam, with the sides and bottom pinned straight and
// the arched top kept as traced.
//
// Room 4 stall doors: flood the door leaf from its middle, bounded by the dark seam
// around it, then pin the sides to straight verticals and smooth top and
// bottom, so hinges, handles and the porthole don't dent the silhouette.
//
// Room 4 exit door: its seams are too faint to flood, so each edge is traced by
// following the darkest pixel along the seam (the left wall is in strong
// perspective, so top and bottom are sloped lines), then median-smoothed.
//
// Output is 960x640 masks, drawn at 0,0 like the other full-room masks.
import fs from "node:fs";
import zlib from "node:zlib";

const UTILITY_DIR = "assets/stage4/level3-utility-closet";
const BATHROOM_DIR = "assets/stage4/level4-bathroom";
const W = 960, H = 640;

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
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const stride = width * bpp;
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
  return { width, height, bpp, data: out };
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  const chunk = (type, dataBuf) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(dataBuf.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, dataBuf])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, dataBuf, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); ihdr.writeUInt8(6, 9);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))
  ]);
}

// Luminance at canvas resolution, area-averaged down from the source art.
function canvasLuminance(img) {
  const sx = img.width / W, sy = img.height / H;
  const lum = new Float32Array(W * H);
  const srcLum = (x, y) => {
    const i = (y * img.width + x) * img.bpp;
    return .299 * img.data[i] + .587 * img.data[i + 1] + .114 * img.data[i + 2];
  };
  for (let y = 0; y < H; y++) {
    const fy0 = y * sy, fy1 = fy0 + sy;
    for (let x = 0; x < W; x++) {
      const fx0 = x * sx, fx1 = fx0 + sx;
      let sum = 0, area = 0;
      for (let py = Math.floor(fy0); py < Math.ceil(fy1); py++) {
        const wy = Math.min(fy1, py + 1) - Math.max(fy0, py);
        for (let px = Math.floor(fx0); px < Math.ceil(fx1); px++) {
          const wx = Math.min(fx1, px + 1) - Math.max(fx0, px);
          sum += srcLum(px, py) * wx * wy;
          area += wx * wy;
        }
      }
      lum[y * W + x] = sum / area;
    }
  }
  return lum;
}

// Median then moving average; null entries are skipped.
function smooth(values, med, avg) {
  const pick = (arr, i, r) => {
    const w = [];
    for (let k = -r; k <= r; k++) if (arr[i + k] != null) w.push(arr[i + k]);
    return w;
  };
  const m = values.map((v, i) => {
    if (v == null) return null;
    const w = pick(values, i, med >> 1).sort((a, b) => a - b);
    return w[w.length >> 1];
  });
  return m.map((v, i) => {
    if (v == null) return null;
    const w = pick(m, i, avg >> 1);
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
}

// A vertical door edge: the most common traced x is the edge itself. Every
// row between the first and last that sit on it is set exactly to it; the
// rows beyond are the corner curves and keep their (lightly smoothed) trace.
// "On it" allows 2px so a hinge just below a corner (right stall, top left)
// is not mistaken for part of the corner curve.
function mostCommon(values) {
  const counts = new Map();
  for (const v of values) if (v != null) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

function straightSide(values) {
  const edge = mostCommon(values);
  const onEdge = (v) => v != null && Math.abs(v - edge) <= 2;
  const first = values.findIndex(onEdge), last = values.findLastIndex(onEdge);
  const corners = smooth(values, 5, 3);
  return values.map((v, i) => (v == null ? null : i >= first && i <= last ? edge : corners[i]));
}

function stallDoorMask(lum, { x0, y0, x1, y1, seed, threshold = 125, minRun = 8, grow = 1 }) {
  // Dark seams, thickened by a pixel so the flood can't slip through gaps.
  const seam = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (lum[y * W + x] >= threshold) continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= x0 && X <= x1 && Y >= y0 && Y <= y1) seam[Y * W + X] = 1;
    }
  }
  const leaf = new Uint8Array(W * H);
  const stack = [seed[1] * W + seed[0]];
  leaf[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    for (const [X, Y] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (X < x0 || X > x1 || Y < y0 || Y > y1) continue;
      const j = Y * W + X;
      if (!seam[j] && !leaf[j]) { leaf[j] = 1; stack.push(j); }
    }
  }
  // The side edges are straight verticals that hinges and handle plates
  // notch inward (the right handle plate for ~60 rows), so no smoothing
  // window rides over them cleanly. Pin each side to its traced x along the
  // whole straight run and keep the trace only where it curves into the
  // rounded corners. Top and bottom carry the corners and the perspective
  // lean, so they are only smoothed.
  return regionMask(leaf, { x0, y0, x1, y1, minRun, grow }, {
    left: straightSide, right: straightSide,
    top: (v) => smooth(v, 15, 7), bottom: (v) => smooth(v, 15, 7)
  });
}

function utilityDoorwayMask(lum) {
  // The open doorway is near-black against the lit frame, which gives clean
  // jambs and arch. The corridor floor lightens toward the sill, so the
  // flood fades out above it; the bottom is instead the threshold seam
  // (y=185), where the open and closed paintings stop differing.
  const SILL = 185;
  const roi = { x0: 412, y0: 40, x1: 525, y1: SILL };
  const region = new Uint8Array(W * H);
  const stack = [100 * W + 470];
  region[stack[0]] = 1;
  while (stack.length) {
    const i = stack.pop(), x = i % W, y = (i / W) | 0;
    for (const [X, Y] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (X < roi.x0 || X > roi.x1 || Y < roi.y0 || Y > roi.y1) continue;
      const j = Y * W + X;
      if (!region[j] && lum[j] < 20) { region[j] = 1; stack.push(j); }
    }
  }
  // The jambs are straight all the way down to the sill and only the arch
  // curves, so the sides run at their traced x the full height (the arch's
  // corners come from the top edge) and the bottom is the sill.
  const jamb = (v) => v.map(() => mostCommon(v));
  const mask = regionMask(region, { ...roi, minRun: 8, grow: 0 }, {
    left: jamb, right: jamb, bottom: (v) => v.map(() => SILL),
    top: (v) => smooth(v, 9, 5)
  });
  // The arch traces as a chamfer that meets the jambs at a hard angle; the
  // painted arch curves through there. Round the top corners off to match.
  return roundTopCorners(mask, roi, 8);
}

// Morphological opening with a disc: rounds convex corners to `radius`
// without moving straight edges. Only rows above the sill are touched, so
// the square bottom corners stay square.
function roundTopCorners(mask, { x0, y0, x1, y1 }, radius) {
  const disc = [];
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (dx * dx + dy * dy <= radius * radius) disc.push([dx, dy]);
  }
  const inside = (m, x, y) => x >= 0 && x < W && y >= 0 && y < H && m[y * W + x];
  const eroded = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    // Rows below the mask count as inside, so the sill doesn't erode.
    if (disc.every(([dx, dy]) => y + dy > y1 ? inside(mask, x + dx, y1) : inside(mask, x + dx, y + dy))) eroded[y * W + x] = 1;
  }
  const opened = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!eroded[y * W + x]) continue;
    for (const [dx, dy] of disc) {
      const X = x + dx, Y = y + dy;
      if (X >= x0 && X <= x1 && Y >= y0 && Y <= y1) opened[Y * W + X] = 1;
    }
  }
  return opened;
}

// Turns a traced region into a clean mask: each edge (left/right per row,
// top/bottom per column) is cleaned up by its own function, and the mask is
// what lies inside all four.
function regionMask(region, { x0, y0, x1, y1, minRun, grow }, edges) {
  const left = [], right = [], top = [], bottom = [];
  for (let y = y0; y <= y1; y++) {
    let l = null, r = null, n = 0;
    for (let x = x0; x <= x1; x++) if (region[y * W + x]) { n++; if (l == null) l = x; r = x; }
    left.push(n >= minRun ? l : null); right.push(n >= minRun ? r : null);
  }
  for (let x = x0; x <= x1; x++) {
    let t = null, b = null, n = 0;
    for (let y = y0; y <= y1; y++) if (region[y * W + x]) { n++; if (t == null) t = y; b = y; }
    top.push(n >= minRun ? t : null); bottom.push(n >= minRun ? b : null);
  }
  const sL = edges.left(left), sR = edges.right(right), sT = edges.top(top), sB = edges.bottom(bottom);
  const mask = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y++) {
    const l = sL[y - y0], r = sR[y - y0];
    if (l == null) continue;
    for (let x = x0; x <= x1; x++) {
      const t = sT[x - x0], b = sB[x - x0];
      if (t == null) continue;
      if (x >= l - grow && x <= r + grow && y >= t - grow && y <= b + grow) mask[y * W + x] = 1;
    }
  }
  return mask;
}

function exitDoorMask(lum) {
  const darkest = (cands) => cands.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  // Seam guides measured off the art: the leaf's top and bottom slope down
  // toward the room's left edge, its left seam is vertical at x=37 and the
  // jamb shadow on its right bottoms out at x=102.
  const LEFT_SEAM = 37, x0 = LEFT_SEAM + 1, x1 = 100;
  const top = [], bottom = [];
  for (let x = x0; x <= x1; x++) {
    const guideTop = Math.round(190 + (100 - x) * .78), guideBottom = Math.round(421 + (100 - x) * .9);
    const ct = [], cb = [];
    for (let y = guideTop - 6; y <= guideTop + 6; y++) ct.push([y, lum[y * W + x]]);
    for (let y = guideBottom - 6; y <= guideBottom + 6; y++) cb.push([y, lum[y * W + x]]);
    top.push(darkest(ct)); bottom.push(darkest(cb));
  }
  const right = [];
  for (let y = 188; y <= 482; y++) {
    const cr = [];
    for (let x = 97; x <= 106; x++) cr.push([x, lum[y * W + x]]);
    right.push(darkest(cr));
  }
  const sT = smooth(top, 7, 3), sB = smooth(bottom, 7, 3), sR = smooth(right, 15, 5);
  const mask = new Uint8Array(W * H);
  for (let x = x0; x <= x1; x++) {
    for (let y = Math.ceil(sT[x - x0]) + 1; y <= Math.floor(sB[x - x0]) - 1; y++) {
      // Stop where the jamb shadow starts, a couple of pixels before its core.
      if (x <= sR[y - 188] - 2) mask[y * W + x] = 1;
    }
  }
  return mask;
}

function writeMask(path, mask) {
  const rgba = Buffer.alloc(W * H * 4);
  let n = 0;
  for (let i = 0; i < W * H; i++) if (mask[i]) { rgba.fill(255, i * 4, i * 4 + 4); n++; }
  fs.writeFileSync(path, encodePng(W, H, rgba));
  console.log(`wrote ${path} (${n} px)`);
}

const loadLum = (path) => canvasLuminance(decodePng(fs.readFileSync(path)));

const utilityOpen = loadLum(`${UTILITY_DIR}/utility-closet-background-door-open-v1.png`);
writeMask(`${UTILITY_DIR}/utility-center-doorway-highlight-mask-v1.png`, utilityDoorwayMask(utilityOpen));

const bathroom = loadLum(`${BATHROOM_DIR}/bathroom-background-faucets-interactable-v3.png`);
writeMask(`${BATHROOM_DIR}/stall-door-left-highlight-mask-v1.png`, stallDoorMask(bathroom, { x0: 668, y0: 24, x1: 832, y1: 352, seed: [750, 200] }));
writeMask(`${BATHROOM_DIR}/stall-door-right-highlight-mask-v1.png`, stallDoorMask(bathroom, { x0: 836, y0: 34, x1: 959, y1: 392, seed: [905, 230] }));
writeMask(`${BATHROOM_DIR}/bathroom-exit-highlight-mask-v2.png`, exitDoorMask(bathroom));
