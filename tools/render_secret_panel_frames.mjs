import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(ROOT, "assets", "stage4", "level4-bathroom");
const OUT = path.join(ROOT, "tmp", "secret-panel-frames");
fs.mkdirSync(OUT, { recursive: true });

// ---------- minimal PNG decode (8-bit RGB/RGBA, non-interlaced) ----------
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
      if (data.readUInt8(12) !== 0) throw new Error("interlaced png not supported");
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported color type ${colorType}`);
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
    if (channels === 4) {
      rgba.set(out.subarray(p, p + 4), i * 4);
    } else if (channels === 3) {
      rgba[i * 4] = out[p]; rgba[i * 4 + 1] = out[p + 1]; rgba[i * 4 + 2] = out[p + 2]; rgba[i * 4 + 3] = 255;
    } else if (channels === 1) {
      const v = out[p];
      rgba[i * 4] = v; rgba[i * 4 + 1] = v; rgba[i * 4 + 2] = v; rgba[i * 4 + 3] = 255;
    } else if (channels === 2) {
      const v = out[p];
      rgba[i * 4] = v; rgba[i * 4 + 1] = v; rgba[i * 4 + 2] = v; rgba[i * 4 + 3] = out[p + 1];
    }
  }
  return { width, height, data: rgba };
}

// ---------- minimal PNG encode (8-bit RGBA, filter 0) ----------
function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    raw.set(Buffer.from(data.buffer, data.byteOffset + y * stride, stride), y * (stride + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });

  function chunk(type, dataBuf) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(dataBuf.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, dataBuf])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, dataBuf, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ---------- image helpers ----------
function makeCanvas(w, h) {
  return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
}

function alphaComposite(dst, src) {
  for (let i = 0; i < dst.data.length; i += 4) {
    const sa = src.data[i + 3] / 255;
    if (sa === 0) continue;
    const da = dst.data[i + 3] / 255;
    const outA = sa + da * (1 - sa);
    for (let c = 0; c < 3; c++) {
      const sv = src.data[i + c], dv = dst.data[i + c];
      dst.data[i + c] = outA === 0 ? 0 : (sv * sa + dv * da * (1 - sa)) / outA;
    }
    dst.data[i + 3] = outA * 255;
  }
}

function polygonMask(w, h, quad) {
  const mask = new Uint8ClampedArray(w * h);
  const ys = quad.map(p => p[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(h - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y++) {
    const yc = y + 0.5;
    const xs = [];
    for (let i = 0; i < quad.length; i++) {
      const [x1, y1] = quad[i];
      const [x2, y2] = quad[(i + 1) % quad.length];
      if ((y1 <= yc && y2 > yc) || (y2 <= yc && y1 > yc)) {
        xs.push(x1 + ((yc - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i += 2) {
      const xStart = Math.max(0, Math.round(xs[i]));
      const xEnd = Math.min(w - 1, Math.round(xs[i + 1]));
      for (let x = xStart; x <= xEnd; x++) mask[y * w + x] = 255;
    }
  }
  return mask;
}

function applyMask(img, mask) {
  const out = makeCanvas(img.width, img.height);
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const m = mask[i] / 255;
    out.data[p] = img.data[p];
    out.data[p + 1] = img.data[p + 1];
    out.data[p + 2] = img.data[p + 2];
    out.data[p + 3] = img.data[p + 3] * m;
  }
  return out;
}

function scaleMultAlpha(img, mult) {
  const out = makeCanvas(img.width, img.height);
  out.data.set(img.data);
  for (let i = 3; i < out.data.length; i += 4) out.data[i] = out.data[i] * mult;
  return out;
}

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
        const p00 = data[(y0 * w + x0) * 4 + c];
        const p10 = data[(y0 * w + x1) * 4 + c];
        const p01 = data[(y1 * w + x0) * 4 + c];
        const p11 = data[(y1 * w + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bot = p01 + (p11 - p01) * fx;
        out.data[o + c] = top + (bot - top) * fy;
      }
    }
  }
  return out;
}

function pasteInto(dstW, dstH, img, px, py) {
  const out = makeCanvas(dstW, dstH);
  for (let y = 0; y < img.height; y++) {
    const dy = y + py;
    if (dy < 0 || dy >= dstH) continue;
    for (let x = 0; x < img.width; x++) {
      const dx = x + px;
      if (dx < 0 || dx >= dstW) continue;
      const s = (y * img.width + x) * 4;
      const d = (dy * dstW + dx) * 4;
      out.data[d] = img.data[s];
      out.data[d + 1] = img.data[s + 1];
      out.data[d + 2] = img.data[s + 2];
      out.data[d + 3] = img.data[s + 3];
    }
  }
  return out;
}

function crop(img, x, y, w, h) {
  const out = makeCanvas(w, h);
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const sx = x + xx, sy = y + yy;
      const d = (yy * w + xx) * 4;
      if (sx < 0 || sx >= img.width || sy < 0 || sy >= img.height) continue;
      const s = (sy * img.width + sx) * 4;
      out.data[d] = img.data[s]; out.data[d + 1] = img.data[s + 1];
      out.data[d + 2] = img.data[s + 2]; out.data[d + 3] = img.data[s + 3];
    }
  }
  return out;
}

// ---------- affine parallelogram warp (bend-free: no axis-aligned clip vs skewed content) ----------
function bilinearSample(img, x, y) {
  if (x < 0 || y < 0 || x > img.width - 1 || y > img.height - 1) return [0, 0, 0, 0];
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(img.width - 1, x0 + 1), y1 = Math.min(img.height - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c++) {
    const p00 = img.data[(y0 * img.width + x0) * 4 + c];
    const p10 = img.data[(y0 * img.width + x1) * 4 + c];
    const p01 = img.data[(y1 * img.width + x0) * 4 + c];
    const p11 = img.data[(y1 * img.width + x1) * 4 + c];
    const top = p00 + (p10 - p00) * fx;
    const bot = p01 + (p11 - p01) * fx;
    out[c] = top + (bot - top) * fy;
  }
  return out;
}

// Build an undistorted rectangular texture by inverse-sampling the source image
// across the O,U,V parallelogram basis. Once built, this texture has ZERO relation
// to the skewed quad's screen-space shape -- it's a plain rectangle -- so re-warping
// it back through a scaled/translated O,U,V never fights an axis-aligned clip.
function buildTexture(src, O, U, V, texW, texH) {
  const tex = makeCanvas(texW, texH);
  for (let j = 0; j < texH; j++) {
    const t = (j + 0.5) / texH;
    for (let i = 0; i < texW; i++) {
      const s = (i + 0.5) / texW;
      const x = O[0] + s * U[0] + t * V[0];
      const y = O[1] + s * U[1] + t * V[1];
      const [r, g, b, a] = bilinearSample(src, x, y);
      const d = (j * texW + i) * 4;
      tex.data[d] = r; tex.data[d + 1] = g; tex.data[d + 2] = b; tex.data[d + 3] = a;
    }
  }
  return tex;
}

// Inverse of buildTexture: stamp the rectangular texture onto the canvas through
// O,U,V (which may be smaller/shifted than the original -- that's the shrink/slide).
function warpTextureOnto(dst, tex, O, U, V, alphaMult = 1) {
  const det = U[0] * V[1] - V[0] * U[1];
  if (Math.abs(det) < 1e-6) return;
  const invDet = 1 / det;
  const corners = [O, [O[0] + U[0], O[1] + U[1]], [O[0] + V[0], O[1] + V[1]], [O[0] + U[0] + V[0], O[1] + U[1] + V[1]]];
  const minX = Math.max(0, Math.floor(Math.min(...corners.map(p => p[0]))));
  const maxX = Math.min(dst.width - 1, Math.ceil(Math.max(...corners.map(p => p[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...corners.map(p => p[1]))));
  const maxY = Math.min(dst.height - 1, Math.ceil(Math.max(...corners.map(p => p[1]))));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - O[0], dy = y + 0.5 - O[1];
      const s = (dx * V[1] - V[0] * dy) * invDet;
      const t = (U[0] * dy - dx * U[1]) * invDet;
      if (s < 0 || s > 1 || t < 0 || t > 1) continue;
      const [r, g, b, a] = bilinearSample(tex, s * tex.width, t * tex.height);
      const sa = (a / 255) * alphaMult;
      if (sa <= 0) continue;
      const d = (y * dst.width + x) * 4;
      const da = dst.data[d + 3] / 255;
      const outA = sa + da * (1 - sa);
      for (let c = 0; c < 3; c++) {
        dst.data[d + c] = outA === 0 ? 0 : (dst.data[d + c] * da * (1 - sa) + [r, g, b][c] * sa) / outA;
      }
      dst.data[d + 3] = outA * 255;
    }
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }

// ---------- production animation logic (mirrors stage4.js) ----------
const CANVAS_W = 960, CANVAS_H = 640;
// Top edge's independently-measured slope (0.045) didn't match the bottom
// edge's (0.174) -- reused the bottom's slope for the top line instead,
// anchored at the same top-left point, so the two long edges are parallel.
const RIGHT_X = 650; // +2px, then +1px more per feedback
const LEFT_X = 587; // -2px per feedback
const BOTTOM_SLOPE = (240.2 - 229.8) / (647 - 587.2);
const TL = [LEFT_X, 71.4];
const TR = [RIGHT_X, TL[1] + BOTTOM_SLOPE * (RIGHT_X - TL[0])];
const QUAD = [TL, TR, [RIGHT_X, 240.2], [LEFT_X - 1.8, 229.8]];
// Parallelogram basis from three corners (TL, TR, BL); BR is implied and only
// off by a few px on this hand-traced quad, which the affine approximation absorbs.
const O0 = QUAD[0];
const U0 = [QUAD[1][0] - QUAD[0][0], QUAD[1][1] - QUAD[0][1]];
const V0 = [QUAD[3][0] - QUAD[0][0], QUAD[3][1] - QUAD[0][1]];
const MASK = polygonMask(CANVAS_W, CANVAS_H, QUAD);

const closedBuf = fs.readFileSync(path.join(ASSETS, "bathroom-background-faucets-interactable-v3.png"));
const openBuf = fs.readFileSync(path.join(ASSETS, "bathroom-secret-panel-open-user-reference-v1.png"));
const closedImg = decodePng(closedBuf);
const openImg = decodePng(openBuf);

function toCanvas(decoded) {
  return { width: decoded.width, height: decoded.height, data: decoded.data };
}
function toCanvasSize(decoded, w, h) {
  const canvas = toCanvas(decoded);
  return canvas.width === w && canvas.height === h ? canvas : resizeBilinear(canvas, w, h);
}
const CLOSED = toCanvasSize(closedImg, CANVAS_W, CANVAS_H);
const OPEN_REF = toCanvasSize(openImg, CANVAS_W, CANVAS_H);

const OPEN_CLIPPED = applyMask(OPEN_REF, MASK);

// The top edge now extends above the dark cavity into the header/rivet strip,
// which the open-reference art never actually drew as removed -- it's still
// plain wall art there. No new art exists for "header gone", so per instruction:
// blend that strip into the interior's dark tone. Tracked per-column relative
// to each column's own top-of-mask row (the top edge is diagonal), not a flat
// cutoff -- a flat cutoff left a grey wedge where the diagonal crossed it.
function darkenHeaderStrip(canvas, mask, w, h, bandHeight) {
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (!mask[i]) continue;
    const lum = 0.299 * canvas.data[p] + 0.587 * canvas.data[p + 1] + 0.114 * canvas.data[p + 2];
    if (lum < 50) { sr += canvas.data[p]; sg += canvas.data[p + 1]; sb += canvas.data[p + 2]; n++; }
  }
  const dark = n ? [sr / n, sg / n, sb / n] : [18, 18, 22];
  for (let x = 0; x < w; x++) {
    let topY = -1;
    for (let y = 0; y < h; y++) {
      if (mask[y * w + x]) { topY = y; break; }
    }
    if (topY < 0) continue;
    for (let y = topY; y < topY + bandHeight && y < h; y++) {
      const i = y * w + x, p = i * 4;
      if (!mask[i]) continue;
      canvas.data[p] = dark[0]; canvas.data[p + 1] = dark[1]; canvas.data[p + 2] = dark[2];
    }
  }
  return dark;
}
const interiorDark = darkenHeaderStrip(OPEN_CLIPPED, MASK, CANVAS_W, CANVAS_H, 20);

// Nudging the quad outward (per the left/right pixel tweaks) pulled in a thin
// sliver of the door-frame trim on the right (light, inside the mask) and
// exposed a couple of dark seam/rivet marks on the wall just outside the mask
// on the left. Clean both: lighten-inside-mask -> interior dark tone,
// darken-outside-mask -> the wall's own tone, each within a few px of the edge.
function borderPixels(mask, w, h, wantInside) {
  const out = new Uint8ClampedArray(mask.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const here = !!mask[i];
      if (here !== wantInside) continue;
      let nearOpposite = false;
      for (let dy = -3; dy <= 3 && !nearOpposite; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -3; dx <= 3; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          if (!!mask[ny * w + nx] !== here) { nearOpposite = true; break; }
        }
      }
      if (nearOpposite) out[i] = 255;
    }
  }
  return out;
}
function fixEdgeSlivers(openClipped, closedBg, mask, w, h, interiorDarkColor) {
  const insideBand = borderPixels(mask, w, h, true);
  const outsideBand = borderPixels(mask, w, h, false);
  let wr = 0, wg = 0, wb = 0, wn = 0;
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (mask[i] || outsideBand[i]) continue; // sample plain wall, away from any edge
    wr += closedBg.data[p]; wg += closedBg.data[p + 1]; wb += closedBg.data[p + 2]; wn++;
  }
  const wall = wn ? [wr / wn, wg / wn, wb / wn] : [190, 190, 195];
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    // inside the mask (visible via openClipped, which composites over closedBg): flatten stray light pixels
    const openLum = 0.299 * openClipped.data[p] + 0.587 * openClipped.data[p + 1] + 0.114 * openClipped.data[p + 2];
    if (insideBand[i] && openLum > 90) {
      openClipped.data[p] = interiorDarkColor[0]; openClipped.data[p + 1] = interiorDarkColor[1]; openClipped.data[p + 2] = interiorDarkColor[2];
    }
    // just outside the mask (visible via closedBg directly, openClipped is transparent there): flatten stray dark pixels
    const closedLum = 0.299 * closedBg.data[p] + 0.587 * closedBg.data[p + 1] + 0.114 * closedBg.data[p + 2];
    if (outsideBand[i] && closedLum < 100) {
      closedBg.data[p] = wall[0]; closedBg.data[p + 1] = wall[1]; closedBg.data[p + 2] = wall[2];
    }
  }
}
fixEdgeSlivers(OPEN_CLIPPED, CLOSED, MASK, CANVAS_W, CANVAS_H, interiorDark);

const TEX_W = 140, TEX_H = 340;
const PLATE_TEX = buildTexture(CLOSED, O0, U0, V0, TEX_W, TEX_H);

// Phase A (0 -> RECEDE_PORTION): panel shrinks straight back into the recess, still centered.
// Phase B (RECEDE_PORTION -> 1): the receded panel slides sideways until it clears the opening.
const RECEDE_PORTION = 0.45;
const RECEDE_SCALE = 0.5;
const SLIDE_DISTANCE = 1.15; // in units of the ORIGINAL U vector length

function drawReveal(progress) {
  const frame = makeCanvas(CANVAS_W, CANVAS_H);
  frame.data.set(CLOSED.data);
  alphaComposite(frame, OPEN_CLIPPED);

  if (progress >= 1) return frame;

  let scale, slideT;
  if (progress <= RECEDE_PORTION) {
    scale = lerp(1, RECEDE_SCALE, easeOutQuad(progress / RECEDE_PORTION));
    slideT = 0;
  } else {
    scale = RECEDE_SCALE;
    slideT = easeOutQuad((progress - RECEDE_PORTION) / (1 - RECEDE_PORTION));
  }

  const center = [O0[0] + 0.5 * U0[0] + 0.5 * V0[0], O0[1] + 0.5 * U0[1] + 0.5 * V0[1]];
  const U = [U0[0] * scale, U0[1] * scale];
  const V = [V0[0] * scale, V0[1] * scale];
  // "Slide left" = move opposite the U direction (U points from the recess's
  // near/faucet-side edge toward its far edge).
  const shiftedCenter = [center[0] - slideT * SLIDE_DISTANCE * U0[0], center[1] - slideT * SLIDE_DISTANCE * U0[1]];
  const O = [shiftedCenter[0] - 0.5 * U[0] - 0.5 * V[0], shiftedCenter[1] - 0.5 * U[1] - 0.5 * V[1]];

  warpTextureOnto(frame, PLATE_TEX, O, U, V, 1);
  return frame;
}

const FRAMES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const CROP = { x: 500, y: 10, w: 220, h: 290 };

const crops = FRAMES.map(p => crop(drawReveal(p), CROP.x, CROP.y, CROP.w, CROP.h));

const cols = 4;
const rows = Math.ceil(crops.length / cols);
const pad = 4;
const barH = 6;
const cellW = CROP.w + pad, cellH = CROP.h + barH + pad;
const sheet = makeCanvas(cellW * cols, cellH * rows);
sheet.data.fill(30, 0, sheet.data.length);
for (let i = 3; i < sheet.data.length; i += 4) sheet.data[i] = 255;

for (let i = 0; i < crops.length; i++) {
  const col = i % cols, row = Math.floor(i / cols);
  const x = col * cellW, y = row * cellH;
  const framed = pasteInto(sheet.width, sheet.height, crops[i], x, y);
  alphaComposite(sheet, framed);
  const barW = Math.round((FRAMES[i]) * CROP.w);
  for (let by = 0; by < barH; by++) {
    for (let bx = 0; bx < CROP.w; bx++) {
      const d = ((y + CROP.h + by) * sheet.width + (x + bx)) * 4;
      const on = bx < barW;
      sheet.data[d] = on ? 120 : 60;
      sheet.data[d + 1] = on ? 220 : 60;
      sheet.data[d + 2] = on ? 255 : 60;
      sheet.data[d + 3] = 255;
    }
  }
}

fs.writeFileSync(path.join(OUT, "contact_sheet.png"), encodePng(sheet));

// diagnostic: draw the exact magenta QUAD on top of the rendered (uncropped) frame
function setPx(img, x, y, rgba) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const d = (y * img.width + x) * 4;
  img.data[d] = rgba[0]; img.data[d + 1] = rgba[1]; img.data[d + 2] = rgba[2]; img.data[d + 3] = 255;
}
function drawThickLine(img, x0, y0, x1, y1, color, thickness) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy), 1) * 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, cx = x0 + dx * t, cy = y0 + dy * t;
    for (let ox = -thickness; ox <= thickness; ox++) for (let oy = -thickness; oy <= thickness; oy++) {
      if (ox * ox + oy * oy <= thickness * thickness) setPx(img, cx + ox, cy + oy, color);
    }
  }
}
function drawQuadOutline(img, quad, color, thickness) {
  for (let i = 0; i < quad.length; i++) {
    const [x0, y0] = quad[i], [x1, y1] = quad[(i + 1) % quad.length];
    drawThickLine(img, x0, y0, x1, y1, color, thickness);
  }
}
const fullFrame1 = drawReveal(1.0);
const overlaid = { width: CANVAS_W, height: CANVAS_H, data: Uint8ClampedArray.from(fullFrame1.data) };
drawQuadOutline(overlaid, QUAD, [255, 0, 255], 1);
const overlaidCrop = crop(overlaid, 500, 10, 220, 290);
const overlaidZoomed = resizeBilinear(overlaidCrop, 220 * 3, 290 * 3);
fs.writeFileSync(path.join(OUT, "final_hole_with_quad_overlay.png"), encodePng(overlaidZoomed));
console.log("wrote final_hole_with_quad_overlay.png (magenta = QUAD drawn directly on the rendered progress=1 frame)");

FRAMES.forEach((p, i) => {
  fs.writeFileSync(path.join(OUT, `frame_${p.toFixed(1)}.png`), encodePng(crops[i]));
});
console.log("frames:", FRAMES.join(", "));
console.log("grid:", cols, "cols x", rows, "rows, reading left-to-right top-to-bottom = progress 0.0 -> 1.0");
console.log("wrote", path.join(OUT, "contact_sheet.png"));
