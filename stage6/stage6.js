"use strict";
// Drift Miner — Stage 6 "Landfall": turn-based deckbuilder. Phase 1 = Zone 1 only (ends at the Landing Sentinel).
(() => {
const canvas = document.getElementById("stageSixCanvas");
const ctx = canvas.getContext("2d");
const W = 960, H = 640, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const params = new URLSearchParams(location.search);
const FONT = "'Segoe UI', Arial, sans-serif";

// ---------------------------------------------------------------- save data
const SAVE_KEY = "driftMinerStage6";
function defaultSave() { return { bank: 0, forge: { hp: 0, relicLocker: 0, trim: 0, survey: 0, supply: 0, satchel: 0 }, stats: { runs: 0, wins: 0, bestZone: 0 }, run: null }; }
function loadSave() {
  const d = defaultSave();
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (s) { d.bank = s.bank || 0; Object.assign(d.forge, s.forge); Object.assign(d.stats, s.stats); d.run = s.run || null; }
  } catch (e) { /* storage unavailable */ }
  return d;
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
const save = loadSave();
if (params.has("bank")) { save.bank = Math.max(0, Number(params.get("bank")) || 0); writeSave(); }

// ---------------------------------------------------------------- seeded rng (mulberry32)
function makeRng(seed) {
  let a = seed >>> 0;
  return {
    next() { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; },
    get state() { return a; },
    set state(v) { a = v >>> 0; }
  };
}
let rng = makeRng(1);
const rr = (a, b) => a + Math.floor(rng.next() * (b - a + 1));
const pick = arr => arr[Math.floor(rng.next() * arr.length)];
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// ---------------------------------------------------------------- art (every draw keeps its shape fallback when artReady() is null)
// Art loads by default (?art=0 forces the placeholders). Images load lazily on first use and a missing file just stays null.
const ART_ON = params.get("art") !== "0";
const ART_FILES = {
  miner: "assets/miner-sheet.png", companions: "assets/companions-sheet.png",
  ship: "assets/player-ship-sheet.png", tiles: "assets/tiles-sheet.png", mapIcons: "assets/map-icons-sheet.png", relics: "assets/relics-sheet.png", ui: "assets/ui-icons-sheet.png",
  bg1: "assets/bg-zone1.webp", bg2: "assets/bg-zone2.webp", bg3: "assets/bg-zone3.webp",
  bgHub: "assets/bg-hub.webp", bgCamp: "assets/bg-camp.webp", bgBench: "assets/bg-workbench.webp", // NOTE: Codex swapped these two files (bg-event.webp holds the trader stall, bg-trader.webp the glyph stones); mapped by content until the files are swapped back
  bgTrader: "assets/bg-event.webp", bgEvent: "assets/bg-trader.webp",
  ev_probe: "assets/event-probe.png", ev_sporePool: "assets/event-sporePool.png", ev_mouse: "assets/event-mouse.png"
};
// enemies: key "e_<id>"; the Zone 2/3 files are registered now so Phase 2 picks them up
for (const id of ["crawler", "spitter", "worm", "drone", "sentinel", "sporeMother", "stalker", "leech", "broodKnight", "thornback", "hiveGuard", "psionicDrone", "mimic", "warden", "homeCore", "turret"]) ART_FILES["e_" + id] = `assets/enemy-${id}.png`;
for (const f of ["basic", "drill", "blaster", "bomb", "radiation", "sword", "companion", "uplink", "utility"]) ART_FILES["card_" + f] = `assets/cards-${f}.png`;
const ART = {}, ART_FAIL = {};
function loadArt(k) { const i = new Image(); i.onerror = () => { ART_FAIL[k] = true; }; i.src = ART_FILES[k]; ART[k] = i; return i; }
function artReady(k) {
  if (!ART_ON || !ART_FILES[k] || ART_FAIL[k]) return null;
  const i = ART[k] || loadArt(k);
  return i.complete && i.naturalWidth > 0 ? i : null;
}
// sheets whose cells overlap or leak into neighbours are cleaned at load: each cell keeps only its own connected blob
// (blobs closer than `bridge` blocks of 4px count as one, so a weapon tip or shield edge stays with its pose)
const SHEETS = { miner: { cols: 4, rows: 1, cw: 384, ch: 512, bridge: 5 }, companions: { cols: 4, rows: 1, cw: 256, ch: 256, bridge: 5 } };
// icon sheets: the art leaks ~10px into the top of the row below, so rows after the first skip that strip
// (the ui sheet was rebuilt clean by tools/clean_stage6_ui_icons.mjs and needs no inset)
const TOP_INSET = { mapIcons: 14, relics: 14 };
const cellCache = {};
function buildCells(key) {
  if (cellCache[key] !== undefined) return cellCache[key];
  const sp = SHEETS[key], img = artReady(key);
  if (!sp || !img) return null;
  let out = null;
  try {
    const W_ = img.naturalWidth, H_ = img.naturalHeight, cv = document.createElement("canvas");
    cv.width = W_; cv.height = H_;
    const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, W_, H_).data, B = 4, bw = Math.ceil(W_ / B), bh = Math.ceil(H_ / B), mass = new Uint32Array(bw * bh);
    for (let y = 0; y < H_; y++) for (let x = 0; x < W_; x++) if (data[(y * W_ + x) * 4 + 3] > 24) mass[(y >> 2) * bw + (x >> 2)]++;
    const lab = new Int32Array(bw * bh).fill(-1), comps = [];
    for (let i = 0; i < mass.length; i++) {
      if (!mass[i] || lab[i] >= 0) continue;
      const id = comps.length, c = { id, m: 0, sx: 0, sy: 0, x0: 1e9, y0: 1e9, x1: -1, y1: -1 };
      comps.push(c);
      const st = [i]; lab[i] = id;
      while (st.length) {
        const k = st.pop(), bx = k % bw, by = (k / bw) | 0, m = mass[k];
        c.m += m; c.sx += bx * m; c.sy += by * m; c.x0 = Math.min(c.x0, bx); c.x1 = Math.max(c.x1, bx); c.y0 = Math.min(c.y0, by); c.y1 = Math.max(c.y1, by);
        for (let dy = -sp.bridge; dy <= sp.bridge; dy++) for (let dx = -sp.bridge; dx <= sp.bridge; dx++) {
          const nx = bx + dx, ny = by + dy;
          if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) continue;
          const nk = ny * bw + nx;
          if (mass[nk] && lab[nk] < 0) { lab[nk] = id; st.push(nk); }
        }
      }
    }
    out = [];
    for (let r = 0; r < sp.rows; r++) for (let c = 0; c < sp.cols; c++) {
      let best = null;
      for (const k of comps) {
        const cx = (k.sx / k.m + .5) * B, cy = (k.sy / k.m + .5) * B;
        if (cx >= c * sp.cw && cx < (c + 1) * sp.cw && cy >= r * sp.ch && cy < (r + 1) * sp.ch && (!best || k.m > best.m)) best = k;
      }
      if (!best || best.m < 200) { out[r * sp.cols + c] = null; continue; }
      const x0 = best.x0 * B, y0 = best.y0 * B, x1 = Math.min(W_, (best.x1 + 1) * B), y1 = Math.min(H_, (best.y1 + 1) * B), w = x1 - x0, h = y1 - y0;
      const cc = document.createElement("canvas"); cc.width = w; cc.height = h;
      const cg = cc.getContext("2d"), im = cg.createImageData(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const sx = x0 + x, sy = y0 + y;
        if (lab[(sy >> 2) * bw + (sx >> 2)] !== best.id) continue;
        const si = (sy * W_ + sx) * 4, di = (y * w + x) * 4;
        im.data[di] = data[si]; im.data[di + 1] = data[si + 1]; im.data[di + 2] = data[si + 2]; im.data[di + 3] = data[si + 3];
      }
      cg.putImageData(im, 0, 0);
      out[r * sp.cols + c] = { cv: cc, ox: x0 - c * sp.cw, oy: y0 - r * sp.ch };
    }
  } catch (e) { out = null; }
  cellCache[key] = out;
  return out;
}
// draws cell (col,row) of a sheet with cell size cw x ch into dx,dy,dw,dh; returns false if the sheet isn't loaded
function drawCell(key, col, row, cw, ch, dx, dy, dw, dh, g = ctx) {
  const img = artReady(key);
  if (!img) return false;
  const sp = SHEETS[key], cells = sp ? buildCells(key) : null;
  if (cells) {
    const c = cells[row * sp.cols + col];
    if (c) { const kx = dw / cw, ky = dh / ch; g.drawImage(c.cv, dx + c.ox * kx, dy + c.oy * ky, c.cv.width * kx, c.cv.height * ky); }
    return true;
  }
  const ins = row > 0 ? (TOP_INSET[key] || 0) : 0, k = dh / ch;
  g.drawImage(img, col * cw, row * ch + ins, cw, ch - ins, dx, dy + ins * k, dw, dh - ins * k);
  return true;
}
const uiIcon = (col, row, cx, cy, sz, g = ctx) => drawCell("ui", col, row, 96, 96, cx - sz / 2, cy - sz / 2, sz, sz, g);
// redraws a sprite as a flat colour (clipped to its own shape) added on top: used for hit flashes
const flashCv = document.createElement("canvas");
function flashSprite(bx, by, bw, bh, color, alpha, fn) {
  if (alpha <= 0) return;
  flashCv.width = Math.max(1, Math.ceil(bw)); flashCv.height = Math.max(1, Math.ceil(bh));
  const g = flashCv.getContext("2d");
  g.setTransform(1, 0, 0, 1, -bx, -by); fn(g); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "source-atop"; g.fillStyle = color; g.fillRect(0, 0, flashCv.width, flashCv.height); g.globalCompositeOperation = "source-over";
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha *= alpha; ctx.drawImage(flashCv, bx, by); ctx.restore();
}
// tight alpha bounds of a single-image sprite, so enemies stand on the ground line regardless of canvas padding
const trimCache = {};
function trimBox(key, img) {
  if (trimCache[key]) return trimCache[key];
  let box = { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
  try {
    const cv = document.createElement("canvas"); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, cv.width, cv.height).data;
    let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 >= 0) box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch (e) { /* keep the full image */ }
  trimCache[key] = box;
  return box;
}
// 3:2 backdrop with a dark wash so panels and text stay readable
function backdrop(key, dark) {
  const im = artReady(key);
  if (!im) return false;
  ctx.drawImage(im, 0, 0, W, H);
  ctx.fillStyle = `rgba(5,8,14,${dark})`; ctx.fillRect(0, 0, W, H);
  return true;
}
function scrapText(x, y, n, size = 17) {
  if (uiIcon(3, 2, x + 11, y, 24)) T(String(n), x + 28, y, size, "#ffe27a", "left", true);
  else T(`Scrap ${n}`, x, y, size, "#ffe27a", "left", true);
  if (over(x, y - 12, 70, 24)) setTip([{ t: "Scrap", d: "Spent at the Trader. Unspent Scrap is banked when the run ends." }], x + 30, y + 14);
}
[ "miner", "companions", "ui", "tiles", "mapIcons", "relics", "bg1", "bgHub" ].forEach(artReady);

// ---------------------------------------------------------------- data: cards
const FAM = {
  basic: { n: "Basic", c: "#7d8a99" }, drill: { n: "Drill", c: "#d9822b" }, blaster: { n: "Blaster", c: "#2fb7cc" },
  bomb: { n: "Bomb", c: "#c94242" }, radiation: { n: "Radiation", c: "#58b447" }, sword: { n: "Laser Sword", c: "#9262d8" },
  companion: { n: "Companion", c: "#b8946a" }, uplink: { n: "Ship Uplink", c: "#4a7fd6" }, utility: { n: "Utility", c: "#8b8d94" },
  status: { n: "Status", c: "#4a4350" }
};
const FAM_ORDER = Object.keys(FAM);
const RAR_COL = { B: "#aab", C: "#c8ccd2", U: "#5aa7ff", R: "#ffcc4a", S: "#777" };
const RAR_ORD = { B: 0, C: 1, U: 2, R: 3, S: 4 };

// v entries are numbers or [base, upgraded]; fx(x, v) queues actions through the primitives on x.
const CARDS = {
  strike: { n: "Strike", f: "basic", r: "B", c: 1, t: "attack", tg: 1, v: [[6, 9]], tx: v => `Deal ${v[0]}.`, fx: (x, v) => x.hit(x.t, v[0]) },
  guard: { n: "Guard", f: "basic", r: "B", c: 1, t: "skill", v: [[5, 8]], tx: v => `Gain ${v[0]} Block.`, fx: (x, v) => x.block(v[0]) },
  // Drill
  pilotBore: { n: "Pilot Bore", f: "drill", r: "C", c: 1, t: "attack", tg: 1, v: [[6, 9]], tx: v => `Deal ${v[0]}. Gain 1 Charge. If this kills, Mine 1.`, fx: (x, v) => { const t = x.t; x.hit(t, v[0]); x.q(() => { if (t && t.hp <= 0) x.mine(1); }); x.charge(1); } },
  windUp: { n: "Wind Up", f: "drill", r: "C", c: 1, t: "skill", v: [[2, 3]], tx: v => `Gain 5 Block. Gain ${v[0]} Charge. Mine 1.`, fx: (x, v) => { x.block(5); x.charge(v[0]); x.mine(1); } },
  rockBreaker: { n: "Rock Breaker", f: "drill", r: "C", c: 2, t: "attack", tg: 1, v: [[10, 14]], tx: v => `Deal ${v[0]}. Release: +3 damage per Charge. Mine 1.`, fx: (x, v) => { x.hit(x.t, () => v[0] + x.release(3)); x.mine(1); } },
  impactDrill: { n: "Impact Drill", f: "drill", r: "U", c: 2, t: "attack", tg: 1, v: [[5, 6]], tx: v => `Release: deal 8 + ${v[0]} per Charge.`, fx: (x, v) => x.hit(x.t, () => 8 + x.release(v[0])) },
  boreShield: { n: "Bore Shield", f: "drill", r: "U", c: 1, t: "skill", v: [[3, 5]], tx: v => `Gain ${v[0]} Block + 2 per Charge (does not spend Charge).`, fx: (x, v) => x.block(() => v[0] + 2 * C.charge) },
  overclock: { n: "Overclock", f: "drill", r: "U", c: 0, t: "skill", v: [[1, 2]], tx: v => `Gain ${v[0]} Charge. Draw 1.`, fx: (x, v) => { x.charge(v[0]); x.draw(1); } },
  deepCore: { n: "Deep Core", f: "drill", r: "R", c: 2, cu: 1, ore: { ag: 1 }, t: "attack", ex: 1, tx: () => "Deal 20 to ALL enemies. Release: +4 per Charge to all.", fx: x => x.q(() => { const b = x.release(4); x.all(20 + b); }) },
  perpetual: { n: "Perpetual Motion", f: "drill", r: "R", c: 2, cu: 1, t: "power", tx: () => "At the start of your turn, gain 1 Charge.", fx: () => { } },
  // Blaster
  snapShot: { n: "Snap Shot", f: "blaster", r: "C", c: 0, t: "attack", tg: 1, heat: 1, v: [[3, 5]], tx: v => `Deal ${v[0]}.`, fx: (x, v) => x.hit(x.t, v[0]) },
  doubleTap: { n: "Double Tap", f: "blaster", r: "C", c: 1, t: "attack", tg: 1, heat: 1, v: [[4, 5]], tx: v => `Deal ${v[0]} twice.`, fx: (x, v) => x.hit(x.t, v[0], 2) },
  suppress: { n: "Suppressing Fire", f: "blaster", r: "C", c: 1, t: "attack", tg: 1, heat: 1, v: [[1, 2]], tx: v => `Deal 5. Apply ${v[0]} Weak.`, fx: (x, v) => { x.hit(x.t, 5); x.apply(x.t, "weak", v[0]); } },
  rapidFire: { n: "Rapid Fire", f: "blaster", r: "U", c: 1, t: "attack", tg: 1, heat: 2, v: [3, [3, 4]], tx: v => `Deal ${v[0]} ${v[1] === 3 ? "three" : "four"} times.`, fx: (x, v) => x.hit(x.t, v[0], v[1]) },
  ventHeat: { n: "Vent Heat", f: "blaster", r: "U", c: 1, t: "skill", v: [[3, 4]], tx: v => `Lose all Heat. Gain ${v[0]} Block per Heat lost.`, fx: (x, v) => x.q(() => { const h = C.heat; C.heat = 0; x.block(h * v[0]); }) },
  heatSink: { n: "Heat Sink", f: "blaster", r: "U", c: 1, cu: 0, t: "power", tx: () => "Whenever you gain an Overheat, draw 2.", fx: () => { } },
  meltdown: { n: "Meltdown", f: "blaster", r: "R", c: 2, t: "attack", tg: 1, v: [[6, 8]], tx: v => `Deal ${v[0]} per Heat. Lose all Heat.`, fx: (x, v) => x.q(() => { const h = C.heat; C.heat = 0; x.hit(x.t, h * v[0]); }) },
  redLine: { n: "Red Line", f: "blaster", r: "R", c: 2, cu: 1, t: "power", tx: () => "Blaster cards deal +3 damage and add +1 extra Heat.", fx: () => { } },
  // Bomb
  grenade: { n: "Grenade", f: "bomb", r: "C", c: 1, t: "attack", v: [[6, 9]], tx: v => `Deal ${v[0]} to ALL enemies. Take 2.`, fx: (x, v) => { x.all(v[0]); x.self(2); } },
  shaped: { n: "Shaped Charge", f: "bomb", r: "C", c: 1, t: "attack", tg: 1, v: [[12, 16]], tx: v => `Deal ${v[0]}. Take 3.`, fx: (x, v) => { x.hit(x.t, v[0]); x.self(3); } },
  cluster: { n: "Cluster Bomb", f: "bomb", r: "U", c: 2, t: "attack", v: [5, [2, 3]], tx: v => `Deal ${v[0]} to ALL enemies ${v[1] === 2 ? "twice" : "3 times"}. Take 3.`, fx: (x, v) => { x.all(v[0], v[1]); x.self(3); } },
  rocket: { n: "Rocket", f: "bomb", r: "U", c: 2, t: "attack", tg: 1, v: [[14, 18], [4, 6]], tx: v => `Deal ${v[0]} to target and ${v[1]} to other enemies. Take 3.`, fx: (x, v) => { x.hit(x.t, v[0]); x.others(x.t, v[1]); x.self(3); } },
  blastShield: { n: "Blast Shield", f: "bomb", r: "R", c: 2, cu: 1, t: "power", tx: () => "You no longer take self-damage from cards.", fx: () => { } },
  carpet: { n: "Carpet Bomb", f: "bomb", r: "R", c: 2, ore: { ag: 1 }, t: "attack", ex: 1, v: [[8, 4]], tx: v => `Deal 10 to ALL enemies 3 times. Take ${v[0]}.`, fx: (x, v) => { x.all(10, 3); x.self(v[0]); } },
  // Radiation
  hotRock: { n: "Hot Rock", f: "radiation", r: "C", c: 1, t: "attack", tg: 1, v: [[3, 5]], tx: v => `Deal 4. Apply ${v[0]} Radiation.`, fx: (x, v) => { x.hit(x.t, 4); x.apply(x.t, "rad", v[0]); } },
  contaminate: { n: "Contaminate", f: "radiation", r: "C", c: 1, t: "skill", v: [[3, 5]], tx: v => `Apply ${v[0]} Radiation to ALL enemies.`, fx: (x, v) => x.apply("all", "rad", v[0]) },
  halfLife: { n: "Half-Life", f: "radiation", r: "U", c: 1, t: "skill", tg: 1, ex: [1, 0], tx: () => "Double target's Radiation.", fx: x => x.q(() => { if (alive(x.t)) { const n = x.t.rad; if (n > 0) applyStatus(x.t, "rad", n); } }) },
  radPulse: { n: "Rad Pulse", f: "radiation", r: "U", c: 2, t: "skill", v: [[5, 7]], tx: v => `Apply ${v[0]} Radiation to ALL enemies. Apply 2 Radiation to yourself.`, fx: (x, v) => { x.apply("all", "rad", v[0]); x.apply("self", "rad", 2); } },
  fallout: { n: "Fallout", f: "radiation", r: "R", c: 2, t: "power", v: [[2, 3]], tx: v => `At end of your turn, apply ${v[0]} Radiation to ALL enemies.`, fx: () => { } },
  // Laser Sword
  slash: { n: "Slash", f: "sword", r: "C", c: 1, t: "attack", tg: 1, v: [[7, 10]], tx: v => `Deal ${v[0]}. If Sword this turn, draw 1.`, fx: (x, v) => { x.hit(x.t, v[0]); if (x.sword) x.draw(1); } },
  parry: { n: "Parry", f: "sword", r: "C", c: 1, t: "skill", tg: 1, v: [[6, 9]], tx: v => `Gain ${v[0]} Block. If Sword this turn, deal ${v[0]}.`, fx: (x, v) => { x.block(v[0]); if (x.sword) x.hit(x.t, v[0]); } },
  arcSweep: { n: "Arc Sweep", f: "sword", r: "U", c: 1, t: "attack", v: [[6, 8]], tx: v => `Deal ${v[0]} to ALL enemies. Apply 1 Weak to ALL.`, fx: (x, v) => { x.all(v[0]); x.apply("all", "weak", 1); } },
  flurry: { n: "Flurry", f: "sword", r: "U", c: 2, t: "attack", tg: 1, v: [[4, 5]], tx: v => `Deal ${v[0]} five times.`, fx: (x, v) => x.hit(x.t, v[0], 5) },
  saberDance: { n: "Saber Dance", f: "sword", r: "R", c: 1, t: "power", v: [[3, 5]], tx: v => `Whenever you play a Sword card, gain ${v[0]} Block.`, fx: () => { } },
  // Companion
  goodBoy: { n: "Good Boy", f: "companion", r: "C", c: 1, t: "skill", v: [[3, 5]], tx: v => `Summon Dog (${v[0]}).`, fx: (x, v) => x.summon("dog", v[0]) },
  mouseHelper: { n: "Mouse Helper", f: "companion", r: "C", c: 1, t: "skill", v: [[3, 5]], tx: v => `Summon Mouse (${v[0]}).`, fx: (x, v) => x.summon("mouse", v[0]) },
  fetch: { n: "Fetch!", f: "companion", r: "U", c: 0, t: "skill", v: [[0, 1]], tx: v => `If Dog is out, it attacks twice now; otherwise summon Dog (3).${v[0] ? " Draw 1." : ""}`, fx: (x, v) => { x.q(() => { if (C.comp.dog > 0) { dogAttack(); dogAttack(); } else x.summon("dog", 3); }); if (v[0]) x.draw(1); } },
  burrow: { n: "Burrow", f: "companion", r: "U", c: 1, t: "skill", v: [[6, 8]], tx: v => `Gain ${v[0]} Block. If Mouse is out, gain ${v[0]} more.`, fx: (x, v) => x.block(() => v[0] + (C.comp.mouse > 0 ? v[0] : 0)) },
  packLeader: { n: "Pack Leader", f: "companion", r: "R", c: 2, cu: 1, t: "power", tx: () => "Companions act twice each turn.", fx: () => { } },
  // Ship Uplink
  spread: { n: "Spread Volley", f: "uplink", r: "U", c: 2, t: "attack", v: [[6, 8]], tx: v => `Deal ${v[0]} to ALL enemies twice.`, fx: (x, v) => x.all(v[0], 2) },
  homing: { n: "Homing Swarm", f: "uplink", r: "U", c: 1, t: "attack", v: [[4, 5]], tx: v => `Deal 3 to a random enemy ${v[0]} times.`, fx: (x, v) => x.rand(3, v[0]) },
  flak: { n: "Flak Screen", f: "uplink", r: "U", c: 2, t: "skill", v: [[12, 16], [4, 6]], tx: v => `Gain ${v[0]} Block. Deal ${v[1]} to ALL enemies.`, fx: (x, v) => { x.block(v[0]); x.all(v[1]); } },
  wingmen: { n: "Wingmen", f: "uplink", r: "R", c: 2, cu: 1, t: "power", tx: () => "At the start of your turn, deal 4 to a random enemy twice.", fx: () => { } },
  // Utility
  digIn: { n: "Dig In", f: "utility", r: "C", c: 1, t: "skill", v: [[8, 11]], tx: v => `Gain ${v[0]} Block.`, fx: (x, v) => x.block(v[0]) },
  flare: { n: "Flare", f: "utility", r: "C", c: 1, cu: 0, t: "skill", tx: () => "Draw 2. Apply 1 Vulnerable to ALL enemies.", fx: x => { x.draw(2); x.apply("all", "vuln", 1); } },
  speedBurst: { n: "Speed Burst", f: "utility", r: "C", c: 0, t: "skill", ex: 1, v: [[0, 1]], tx: v => `Gain 1 Energy.${v[0] ? " Draw 1." : ""}`, fx: (x, v) => { x.energy(1); if (v[0]) x.draw(1); } },
  magnet: { n: "Magnet", f: "utility", r: "U", c: 1, cu: 0, t: "skill", tx: () => "Put a card from your discard pile into your hand.", fx: x => x.choosePile("disc", 1, cs => { for (const c of cs) { C.disc.splice(C.disc.indexOf(c), 1); toHand(c); } }) },
  survey: { n: "Survey", f: "utility", r: "U", c: 1, t: "skill", v: [[3, 4]], tx: v => `Draw ${v[0]}. Discard 1.`, fx: (x, v) => { x.draw(v[0]); x.chooseHand(1, cs => { for (const c of cs) { C.hand.splice(C.hand.indexOf(c), 1); C.disc.push(c); } }); } },
  converter: { n: "Converter", f: "utility", r: "U", c: 1, t: "skill", ex: [1, 0], tx: () => "Next turn, gain 2 Energy.", fx: x => x.energyNext(2) },
  fieldRepairs: { n: "Field Repairs", f: "utility", r: "R", c: 1, t: "skill", ex: 1, v: [[8, 12]], tx: v => `Heal ${v[0]}.`, fx: (x, v) => x.heal(v[0]) },
  // Ore cards
  copperSlug: { n: "Copper Slug", f: "blaster", r: "C", c: 0, ore: { cu: 1 }, t: "attack", tg: 1, heat: 1, v: [[9, 12]], tx: v => `Deal ${v[0]}.`, fx: (x, v) => x.hit(x.t, v[0]) },
  oreCannon: { n: "Ore Cannon", f: "uplink", r: "U", c: 2, t: "attack", tg: 1, v: [[4, 5]], tx: v => `Deal ${v[0]} per Copper you hold (does not spend it).`, fx: (x, v) => x.hit(x.t, () => v[0] * run.ore.cu) },
  silverLining: { n: "Silver Lining", f: "utility", r: "U", c: 1, ore: { ag: 1 }, t: "skill", v: [[15, 20]], tx: v => `Gain ${v[0]} Block. Draw 2.`, fx: (x, v) => { x.block(v[0]); x.draw(2); } },
  smelter: { n: "Smelter", f: "drill", r: "U", c: 1, cu: 0, t: "power", tx: () => "Whenever you Mine, gain 3 Block.", fx: () => { } },
  goldRush: { n: "Gold Rush", f: "utility", r: "R", c: 0, ore: { au: 1 }, t: "skill", ex: 1, v: [[3, 4]], tx: v => `Gain 3 Energy. Draw ${v[0]}.`, fx: (x, v) => { x.energy(3); x.draw(v[0]); } },
  // Status
  overheat: { n: "Overheat", f: "status", r: "S", c: 0, t: "status", unplayable: 1, tx: () => "Unplayable. At end of turn, if in hand: take 3 damage and Exhaust.", fx: () => { } },
  spore: { n: "Spore", f: "status", r: "S", c: 0, t: "status", unplayable: 1, tx: () => "Unplayable. Exhausts at end of turn if in hand.", fx: () => { } }
};
// card art: sheet "card_<family>" cells are 320x140, 4 columns (order follows the art task)
const CARD_ART = {
  strike: ["basic", 0], guard: ["basic", 1], overheat: ["basic", 2], spore: ["basic", 3],
  pilotBore: ["drill", 0], windUp: ["drill", 1], rockBreaker: ["drill", 2], impactDrill: ["drill", 3], boreShield: ["drill", 4], overclock: ["drill", 5], deepCore: ["drill", 6], perpetual: ["drill", 7], smelter: ["drill", 8],
  snapShot: ["blaster", 0], doubleTap: ["blaster", 1], suppress: ["blaster", 2], rapidFire: ["blaster", 3], ventHeat: ["blaster", 4], heatSink: ["blaster", 5], meltdown: ["blaster", 6], redLine: ["blaster", 7], copperSlug: ["blaster", 8],
  grenade: ["bomb", 0], shaped: ["bomb", 1], cluster: ["bomb", 2], rocket: ["bomb", 3], blastShield: ["bomb", 4], carpet: ["bomb", 5],
  hotRock: ["radiation", 0], contaminate: ["radiation", 1], halfLife: ["radiation", 2], radPulse: ["radiation", 3], fallout: ["radiation", 4],
  slash: ["sword", 0], parry: ["sword", 1], arcSweep: ["sword", 2], flurry: ["sword", 3], saberDance: ["sword", 4],
  goodBoy: ["companion", 0], mouseHelper: ["companion", 1], fetch: ["companion", 2], burrow: ["companion", 3], packLeader: ["companion", 4],
  spread: ["uplink", 0], homing: ["uplink", 1], flak: ["uplink", 2], wingmen: ["uplink", 3], oreCannon: ["uplink", 4],
  digIn: ["utility", 0], flare: ["utility", 1], speedBurst: ["utility", 2], magnet: ["utility", 3], survey: ["utility", 4], converter: ["utility", 5], fieldRepairs: ["utility", 6], silverLining: ["utility", 7], goldRush: ["utility", 8]
};
for (const id in CARD_ART) CARDS[id].artCell = CARD_ART[id];
const REWARD_IDS = Object.keys(CARDS).filter(id => ["C", "U", "R"].includes(CARDS[id].r));
const RAR_RANK = { B: 0, C: 1, U: 2, R: 3, S: 4 };
// plain-card accessors (one half); fused cards route through the wrappers below
const cardVals = (c) => (CARDS[c.id].v || []).map(e => Array.isArray(e) ? e[c.up ? 1 : 0] : e);
const pBase = c => { const d = CARDS[c.id]; return c.up && d.cu != null ? d.cu : d.c; };
const pExh = c => { const e = CARDS[c.id].ex; return Array.isArray(e) ? !!e[c.up ? 1 : 0] : !!e; };
function pText(c) {
  const d = CARDS[c.id]; let s = d.tx(cardVals(c));
  if (d.heat) s += ` +${d.heat} Heat.`;
  if (pExh(c)) s += " Exhaust.";
  return s;
}
const pName = c => CARDS[c.id].n + (c.up ? "+" : "");
const halves = c => c.fuse || [c];

// fusion recipes (first match wins; family order doesn't matter). pre() runs before the halves, fx() after.
const famPair = (A, B, p, q) => (A.f === p && B.f === q) || (A.f === q && B.f === p);
const RECIPES = [
  { m: (A, B) => famPair(A, B, "drill", "blaster"), name: () => "Plasma Bore", tx: () => "Gain 1 Charge.", fx: x => x.charge(1) },
  { m: (A, B) => famPair(A, B, "drill", "bomb"), name: () => "Seismic Charge", tx: () => "Deal 4 to ALL enemies.", fx: x => x.all(4) },
  { m: (A, B) => famPair(A, B, "blaster", "sword"), name: () => "Arc Blade", tx: () => "Draw 1.", fx: x => x.draw(1) },
  { m: (A, B) => famPair(A, B, "bomb", "radiation"), name: () => "Dirty Bomb", tx: () => "Apply 2 Radiation to ALL enemies.", fx: x => x.apply("all", "rad", 2) },
  { m: (A, B) => famPair(A, B, "sword", "companion"), name: () => "Hunting Party", tx: () => "Dog attacks once (summon Dog 2 if it isn't out).", fx: x => x.q(() => { if (C.comp.dog > 0) dogAttack(); else x.summon("dog", 2); }) },
  { m: (A, B) => famPair(A, B, "radiation", "utility"), name: () => "Isotope Kit", tx: () => "Mine 1.", fx: x => x.mine(1) },
  { m: (A, B) => A.f === "uplink" || B.f === "uplink", name: (A, B) => "Orbital " + (A.f === "uplink" ? B.n : A.n), tx: () => "Gain 4 Block.", fx: x => x.block(4) },
  { m: (A, B) => A.f === "basic" && B.f === "basic", name: () => "Field Kit", tx: () => "Gain 1 Charge.", fx: x => x.charge(1) },
  { m: (A, B) => A.f === B.f && A.f !== "basic", name: A => A.n + "-Mk II", tx: att => att ? "+3 damage on the first hit." : "+3 Block.", pre: (fz, att) => { if (att) fz.first = 3; }, fx: (x, att) => { if (!att) x.block(3); } }
];
const fusedCache = new Map();
function D(c) {
  if (!c.fuse) return CARDS[c.id];
  const [a, b] = c.fuse, key = a.id + (a.up ? "+" : "") + "|" + b.id + (b.up ? "+" : "");
  let d = fusedCache.get(key);
  if (!d) {
    const A = CARDS[a.id], B = CARDS[b.id], rec = RECIPES.find(r => r.m(A, B)) || null, ore = { cu: 0, ag: 0, au: 0 };
    for (const h of [A, B]) for (const k in (h.ore || {})) ore[k] += h.ore[k];
    d = { fused: true, rec, f: A.f, f2: B.f, r: RAR_RANK[A.r] >= RAR_RANK[B.r] ? A.r : B.r, ore,
      t: A.t === "attack" || B.t === "attack" ? "attack" : "skill", tg: A.tg || B.tg ? 1 : 0, c: Math.max(0, pBase(a) + pBase(b) - 1),
      n: rec ? rec.name(A, B) : `${A.n} + ${B.n}` };
    fusedCache.set(key, d);
  }
  return d;
}
const baseCost = c => c.fuse ? D(c).c : pBase(c);
const isExh = c => halves(c).some(pExh);
function cardText(c) {
  if (!c.fuse) return pText(c);
  const d = D(c);
  return pText(c.fuse[0]) + "\n--\n" + pText(c.fuse[1]) + (d.rec ? "\n" + d.rec.tx(d.t === "attack") : "");
}
function cardName(c) {
  if (!c.fuse) return pName(c);
  const d = D(c);
  return d.rec ? d.n + (c.fuse[0].up && c.fuse[1].up ? "+" : "") : `${pName(c.fuse[0])} + ${pName(c.fuse[1])}`;
}
const canUpgrade = c => halves(c).some(h => !h.up && CARDS[h.id].t !== "status");
const upgradeCard = c => { halves(c).forEach(h => { h.up = true; }); };
const isFusable = c => !c.fuse && !["power", "status"].includes(CARDS[c.id].t);
const oreList = d => ["cu", "ag", "au"].filter(k => d.ore && d.ore[k]);

// ---------------------------------------------------------------- data: keywords, relics
const KW = [
  ["Block", /block/i, "Absorbs damage. Clears at the start of its owner's turn."],
  ["Weak", /weak/i, "Deals 25% less attack damage. -1 stack at end of the owner's turn."],
  ["Vulnerable", /vulnerable/i, "Takes 50% more attack damage. -1 stack at end of the owner's turn."],
  ["Strength", /strength/i, "+N damage per hit. Permanent for the combat."],
  ["Exhaust", /exhaust/i, "Removed from the deck for the rest of the combat."],
  ["Charge", /charge|release/i, "Counter that persists through the combat. Cards with Release spend all Charge for bonus damage."],
  ["Heat", /heat|blaster/i, "Blaster cards add Heat. At 5 Heat it resets to 0 and adds an Overheat card to your hand."],
  ["Overheat", /overheat/i, "Unplayable. At end of turn, if in hand: take 3 damage and Exhaust it."],
  ["Radiation", /radiation/i, "At the start of the afflicted unit's turn, lose HP equal to stacks (ignores Block), then -1 stack."],
  ["Companion", /summon|dog|mouse|companions/i, "Dog: at end of turn, deals its value to a random enemy. Mouse: at end of turn, gives you its value as Block. Max one of each; summoning again adds the value."],
  ["Mine", /mine/i, "Gain N Copper."],
  ["Power", /power/i, "Stays in effect for the combat once played; goes to neither pile."]
];
const STATUS = {
  weak: { ico: [0, 0], l: "W", col: "#a77ed4", n: "Weak", d: "Deals 25% less attack damage. -1 at end of turn." },
  vuln: { ico: [1, 0], l: "V", col: "#e08a3a", n: "Vulnerable", d: "Takes 50% more attack damage. -1 at end of turn." },
  str: { ico: [2, 0], l: "S", col: "#e05050", n: "Strength", d: "+1 damage per hit per stack." },
  rad: { ico: [3, 0], l: "R", col: "#66cc55", n: "Radiation", d: "Lose HP equal to stacks at start of turn (ignores Block), then -1." }
};
const RELICS = {
  impactDrill: { n: "Impact Drill", d: "Start each combat with 2 Charge.", col: "#d9822b" },
  blasterR: { n: "Blaster", d: "Overheat triggers at 7 Heat instead of 5.", col: "#2fb7cc" },
  bombR: { n: "Bomb", d: "At the start of each combat, deal 5 to ALL enemies.", col: "#c94242" },
  dogR: { n: "Dog", d: "Start each combat with Dog (3).", col: "#b8946a" },
  mouseR: { n: "Mouse", d: "Start each combat with Mouse (3).", col: "#a89a8a" },
  radR: { n: "Radiation", d: "At the start of each combat, apply 2 Radiation to ALL enemies.", col: "#58b447" },
  rocketR: { n: "Rocket Launcher", d: "Every 3rd Attack you play deals double damage.", col: "#e0602f" },
  magnetR: { n: "Magnet", d: "Ore veins give +1 ore.", col: "#c0c0d0" },
  thirdEye: { n: "3rd Eye", d: "Draw 2 extra cards on your first turn. Dig Map reveal radius is 2.", col: "#a070e0" },
  flareR: { n: "Flare", d: "On your first turn, apply 1 Vulnerable to ALL enemies.", col: "#ffb040" },
  swordR: { n: "Laser Sword", d: "The first Sword card you play each turn costs 0.", col: "#9262d8" },
  converterR: { n: "Converter", d: "Heal 5 at the end of each combat.", col: "#4fd0a0" },
  burstR: { n: "Speed Burst", d: "Gain 1 extra Energy on your first turn.", col: "#f0e060" }
};
const RELIC_IDS = Object.keys(RELICS);
const RELIC_ICON = { impactDrill: 0, blasterR: 1, bombR: 2, dogR: 3, mouseR: 4, radR: 5, rocketR: 6, magnetR: 7, thirdEye: 8, flareR: 9, swordR: 10, converterR: 11, burstR: 12 };
const initials = n => n.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ---------------------------------------------------------------- data: enemies / encounters
// move: dmg+hits attack, block (self), allyBlock, str (self buff), apply {status:n} on player
const ENEMIES = {
  crawler: { n: "Spore Crawler", artScale: 1.45, hp: [12, 16], shape: "blob", col: "#a0b84a", w: 90, h: 64, moves: [{ n: "Bite", dmg: 5 }, { n: "Bite", dmg: 5 }, { n: "Spores", apply: { weak: 1 } }] },
  spitter: { n: "Acid Spitter", artScale: 1.5, hp: [20, 24], shape: "spiky", col: "#c8d040", w: 100, h: 90, moves: [{ n: "Spit", dmg: 8 }, { n: "Corrode", dmg: 3, apply: { vuln: 2 } }] },
  worm: { n: "Burrow Worm", artScale: 1.35, hp: [30, 34], shape: "worm", col: "#b07a4a", w: 120, h: 100, moves: [{ n: "Burrow", block: 10 }, { n: "Lunge", dmg: 12 }] },
  droneA: { n: "Shield Drone", fly: 1, artScale: 1.3, hp: [35, 35], shape: "drone", col: "#7aa8d8", w: 90, h: 90, moves: [{ n: "Shield Ally", allyBlock: 10 }, { n: "Zap", dmg: 9 }] },
  droneB: { n: "Shield Drone", fly: 1, artScale: 1.3, hp: [35, 35], shape: "drone", col: "#8ac0e0", w: 90, h: 90, moves: [{ n: "Zap", dmg: 7, hits: 2 }, { n: "Shield Ally", allyBlock: 10 }] },
  sentinel: {
    n: "Landing Sentinel", hp: [140, 140], shape: "boss", col: "#d0703a", w: 200, h: 190, boss: 1,
    moves: [{ n: "Scan", apply: { vuln: 2 } }, { n: "Cannon", dmg: 22 }, { n: "Sweep", dmg: 6, hits: 3 }, { n: "Fortify", block: 20, str: 2 }],
    overdrive: { n: "Overdrive", str: 3 }
  }
};
const ENC = {
  z1: {
    easy: [["crawler", "crawler"], ["spitter"], ["crawler", "spitter"]],
    normal: [["crawler", "crawler", "crawler"], ["worm", "crawler"], ["spitter", "spitter"], ["worm", "spitter"]],
    elite: [["droneA", "droneB"]],
    boss: [["sentinel"]]
  }
};
const NODE_INFO = {
  battle: { n: "Battle", l: "B", col: "#d05a4a" }, elite: { n: "Elite Battle", l: "E", col: "#e0a030" }, boss: { n: "Boss", l: "!", col: "#e03030" },
  event: { n: "Event", l: "?", col: "#5aa7ff" }, camp: { n: "Field Camp", l: "C", col: "#58b447" }, trader: { n: "Salvage Trader", l: "$", col: "#e0c040" },
  cache: { n: "Relic Cache", l: "R", col: "#b070e0" },
  cu: { n: "Copper Vein", l: "", col: "#d9822b" }, ag: { n: "Silver Vein", l: "", col: "#c8ccd2" }, au: { n: "Gold Vein", l: "", col: "#ffcc4a" }
};
const ORE = { cu: { n: "Copper", col: "#d9822b", scrap: 3, buy: 20, sell: 8 }, ag: { n: "Silver", col: "#c8ccd2", scrap: 10, buy: 60, sell: 25 }, au: { n: "Gold", col: "#ffcc4a", scrap: 30, buy: 150, sell: 70 } };
const ORE_KEYS = ["cu", "ag", "au"];
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ZONES = ["Landing Zone", "Spore Wilds", "Hive Gate"];
const ZONE_TINT = [["#2a1710", "#4a2512"], ["#14261a", "#274a2a"], ["#1c1230", "#33204f"]];

// ---------------------------------------------------------------- forge
const FORGE = [
  { key: "hp", name: "Reinforced Suit", max: 10, cost: n => 200 + 60 * n, desc: "+5 max HP per level" },
  { key: "relicLocker", name: "Relic Locker", max: 1, cost: () => 400, desc: "At run start, choose 1 of 3 random relics" },
  { key: "trim", name: "Trim the Deck", max: 3, cost: n => [300, 450, 600][n], desc: "Start with one fewer Strike per level" },
  { key: "survey", name: "Wider Survey", max: 1, cost: () => 800, desc: "Card rewards offer 4 choices" },
  { key: "supply", name: "Supply Drop", max: 4, cost: () => 150, desc: "+50 starting Scrap per level" },
  { key: "satchel", name: "Ore Satchel", max: 3, cost: n => [200, 300, 400][n], desc: "Start each run with +2 Copper per level" }
];

// ---------------------------------------------------------------- run state
let run = null;               // save.run: plain data, persisted
let C = null;                 // combat (not persisted)
const S = { padMode: false, focusKey: null, fpt: null, screen: "hub", modal: null, time: 0, toast: null, end: null, confirmAbandon: 0, scroll: 0, dig: null, walk: null, face: null, mfloats: [], bench: { sel: [] } };
const hasRelic = id => !!run && run.relics.includes(id);
function saveRun() { if (!run) return; run.rngState = rng.state; save.run = run; writeSave(); }
function gainScrap(n) { run.scrap += n; return n; }
function gainOre(k, n) { run.ore[k] += n; if (C) { C.oreGain[k] += n; addFloat(C.P, `+${n} ${ORE[k].n}`, ORE[k].col); } return n; }
const mine = n => { gainOre("cu", n); if (C && C.pw.smelter) { const b = 3 * C.pw.smelter; C.P.block += b; addFloat(C.P, `+${b} Block`, "#9cc8ff"); } };
function unownedRelics() { return RELIC_IDS.filter(r => !run.relics.includes(r)); }
function grantRelic(id) { if (!run.relics.includes(id)) run.relics.push(id); }
function addCard(id, up = false) { run.deck.push({ id, up }); }

function newRun(seedOverride) {
  const seed = seedOverride != null ? seedOverride : (params.has("seed") ? Number(params.get("seed")) || 1 : Math.floor(Math.random() * 999999) + 1);
  rng = makeRng(seed);
  const f = save.forge;
  const deck = [];
  if (params.get("deck") === "all") { for (const id of Object.keys(CARDS)) if (CARDS[id].t !== "status") deck.push({ id, up: false }); }
  else {
    for (let i = 0; i < 5 - f.trim; i++) deck.push({ id: "strike", up: false });
    for (let i = 0; i < 4; i++) deck.push({ id: "guard", up: false });
    deck.push({ id: "pilotBore", up: false });
  }
  const maxhp = 70 + 5 * f.hp;
  run = { seed, rngState: 0, zone: 1, map: null, cur: null, hp: maxhp, maxhp, deck, relics: [], scrap: 50 * f.supply, removals: 0, pending: null, alert: 0, ambushDue: 0, ore: { cu: 2 * f.satchel, ag: 0, au: 0 } };
  if (params.has("ore")) { const n = Math.max(0, Number(params.get("ore")) || 0); run.ore = { cu: n, ag: n, au: n }; }
  if (params.get("relics") === "all") run.relics = RELIC_IDS.slice();
  run.map = genDigMap();
  save.stats.runs++;
  if (f.relicLocker && params.get("relics") !== "all") {
    const pool = shuffle(RELIC_IDS.slice()).slice(0, 3);
    run.pending = { screen: "reward", locker: true, scrap: 0, cards: [], relicChoices: pool };
  }
  if (params.get("bench") === "1") run.pending = { screen: "bench" };
  saveRun();
}

// ---------------------------------------------------------------- dig map
const MW = 9, MH = 11, TILE = 52, GX = 24, GY = 34;
const tileAt = (x, y) => run.map.tiles[y * MW + x];
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
function genDigMap() {
  const protectedT = (x, y) => x === 4 && (y === 0 || y === 9 || y === 10);
  for (let attempt = 0; attempt < 200; attempt++) {
    const tiles = [];
    for (let i = 0; i < MW * MH; i++) tiles.push({ k: "dirt", c: null, dug: false, used: false });
    const T_ = (x, y) => tiles[y * MW + x];
    const target = Math.round(MW * MH * .15);
    let n = 0, guard = 0;
    while (n < target && guard++ < 500) {
      let x = rr(0, MW - 1), y = rr(1, MH - 2);
      const size = rr(2, 4);
      for (let s = 0; s < size && n < target; s++) {
        if (inMap(x, y) && !protectedT(x, y) && T_(x, y).k === "dirt") { T_(x, y).k = "bedrock"; n++; }
        const d = rr(0, 3); x += [1, -1, 0, 0][d]; y += [0, 0, 1, -1][d];
      }
    }
    T_(4, 10).k = "lair"; T_(4, 10).c = "boss";
    T_(4, 0).dug = true;
    T_(4, 9).c = "camp";
    // the lair must be reachable from the pod through non-bedrock tiles, entering only via the camp tile above it
    const seen = new Set([4]), q = [[4, 0]];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!inMap(nx, ny) || seen.has(ny * MW + nx) || T_(nx, ny).k === "bedrock") continue;
        if (T_(nx, ny).k === "lair" && !(x === 4 && y === 9)) continue;
        seen.add(ny * MW + nx); q.push([nx, ny]);
      }
    }
    if (!seen.has(10 * MW + 4)) continue;
    const place = (c, count, minY, maxY) => {
      for (let k = 0; k < count; k++) {
        const cand = [];
        tiles.forEach((t, i) => { const x = i % MW, y = (i / MW) | 0; if (t.k === "dirt" && !t.c && !t.dug && y >= minY && y <= maxY && !protectedT(x, y)) cand.push(t); });
        if (cand.length) pick(cand).c = c;
      }
    };
    place("au", 2, 7, 9); place("ag", 4, 4, 9); place("elite", 2, 5, 9); place("trader", 1, 3, 7); place("camp", 1, 4, 7);
    place("cache", 1, 3, 9); place("event", 3, 0, 9); place("battle", 9, 1, 9); place("cu", 10, 0, 9);
    return { w: MW, h: MH, tiles, px: 4, py: 0 };
  }
  throw new Error("dig map generation failed");
}
function isRevealed(x, y) {
  if (params.get("reveal") === "1") return true;
  const t = tileAt(x, y);
  if (t.k === "lair" || t.dug) return true;
  const R = hasRelic("thirdEye") ? 2 : 1;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (inMap(x + dx, y + dy) && tileAt(x + dx, y + dy).dug) return true;
  return false;
}
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a tile the tunnel network touches (can be reached by walking + digging)
function canReach(x, y) {
  const t = tileAt(x, y);
  if (t.dug || t.k === "bedrock" || !isRevealed(x, y)) return false;
  if (t.k === "lair") return tileAt(4, 9).dug;
  return NB4.some(([dx, dy]) => inMap(x + dx, y + dy) && tileAt(x + dx, y + dy).dug);
}
// a tile the player can dig right now: reachable, and directly next to the player (the lair only from the camp above it)
function canDig(x, y) {
  if (!canReach(x, y)) return false;
  const m = run.map;
  if (tileAt(x, y).k === "lair") return m.px === 4 && m.py === 9;
  return Math.abs(x - m.px) + Math.abs(y - m.py) === 1;
}
// shortest walk over dug tiles from (sx,sy) to any tile satisfying goal; returns steps (without the start) or null
function dugPath(sx, sy, goal) {
  const start = sy * MW + sx, prev = new Map([[start, -1]]), q = [start];
  while (q.length) {
    const k = q.shift(), x = k % MW, y = (k / MW) | 0;
    if (goal(x, y)) { const path = []; for (let c = k; c !== start; c = prev.get(c)) path.unshift({ x: c % MW, y: (c / MW) | 0 }); return path; }
    for (const [dx, dy] of NB4) {
      const nx = x + dx, ny = y + dy, nk = ny * MW + nx;
      if (inMap(nx, ny) && !prev.has(nk) && tileAt(nx, ny).dug) { prev.set(nk, k); q.push(nk); }
    }
  }
  return null;
}
function rollCards(kind, n) {
  const odds = kind === "boss" ? [0, 0, 1] : kind === "elite" ? [.5, .4, .1] : [.65, .3, .05];
  const out = [];
  for (let k = 0; k < n; k++) {
    const r = rng.next(), rar = r < odds[0] ? "C" : r < odds[0] + odds[1] ? "U" : "R";
    const pool = REWARD_IDS.filter(id => CARDS[id].r === rar && !out.includes(id));
    out.push(pick(pool));
  }
  return out;
}

const chooseEncounter = (kind, row) => kind === "boss" ? pick(ENC.z1.boss) : kind === "elite" ? pick(ENC.z1.elite) : pick(row <= 3 ? ENC.z1.easy : ENC.z1.normal);
function makeStock() {
  const cards = [];
  for (const [rar, n] of [["C", 3], ["U", 1], ["R", 1]]) {
    const ids = [];
    while (ids.length < n) { const id = pick(REWARD_IDS.filter(x => CARDS[x].r === rar)); if (!ids.includes(id) && !cards.some(c => c.id === id)) ids.push(id); }
    for (const id of ids) cards.push({ id, up: false, price: { C: 50, U: 75, R: 150 }[rar], sold: false });
  }
  const relics = shuffle(unownedRelics()).slice(0, 2).map(id => ({ id, price: rr(15, 25) * 10, sold: false }));
  return { cards, relics, ore: { cu: 5, ag: 2, au: 1 } };
}
const traderStock = () => tileAt(run.cur.x, run.cur.y).stock;
function mapFloat(x, y, text, col) { S.mfloats.push({ x: GX + x * TILE + TILE / 2, y: GY + y * TILE + TILE / 2, text, col, t: 0 }); }
function makePending(c, y) {
  if (["battle", "elite", "boss"].includes(c)) return { screen: "combat", kind: c, enc: chooseEncounter(c, y) };
  if (c === "event") return { screen: "event", id: pick(Object.keys(EVENTS)), res: null };
  if (c === "camp") return { screen: "camp" };
  if (c === "cache") {
    const pool = unownedRelics(), id = pool.length ? pick(pool) : null;
    if (id) grantRelic(id); else gainScrap(50);
    return { screen: "cache", relic: id };
  }
  if (c === "trader") { const t = tileAt(run.cur.x, run.cur.y); if (!t.stock) t.stock = makeStock(); return { screen: "trader" }; }
  return null;
}
function digTile(x, y) {
  if (S.dig || S.modal || !canDig(x, y)) return;
  const t = tileAt(x, y), from = { x: run.map.px, y: run.map.py };
  t.dug = true; run.map.px = x; run.map.py = y;
  run.alert++; if (run.alert % 8 === 0) run.ambushDue++;
  run.cur = { x, y };
  const c = t.c;
  if (ORE_KEYS.includes(c)) {
    const n = (c === "cu" ? rr(2, 3) : c === "ag" ? rr(1, 2) : 1) + (hasRelic("magnetR") ? 1 : 0);
    gainOre(c, n); t.used = true; mapFloat(x, y, `+${n} ${ORE[c].n}`, ORE[c].col);
  }
  run.pending = makePending(c, y);
  // an ambush only lands on plain dirt or ore veins, never on another content tile
  if (!run.pending && (!c || ORE_KEYS.includes(c)) && run.ambushDue > 0) {
    run.ambushDue--;
    run.pending = { screen: "combat", kind: "ambush", enc: chooseEncounter("battle", 9) };
  }
  if (!run.pending) run.cur = null;
  saveRun();
  S.face = null; S.walk = null;
  S.dig = { t: 0, from, to: { x, y }, dur: .2 };
}
const mapBusy = () => !!(S.dig || S.walk || S.modal || S.screen !== "map" || !run);
function walkPath(path, then) { S.walk = { path: path.slice(), then: then || null }; S.face = null; }
// click: walk through the tunnel; an un-dug tile is selected by the first click (walking next to it if needed) and dug by the second
function clickTile(x, y) {
  if (mapBusy()) return;
  const m = run.map, t = tileAt(x, y);
  if (t.dug) {
    S.face = null;
    if (x === m.px && y === m.py) { if (t.c === "trader") openTrader(x, y); return; }
    const p = dugPath(m.px, m.py, (a, b) => a === x && b === y);
    if (p) walkPath(p, t.c === "trader" ? () => openTrader(x, y) : null);
    return;
  }
  if (canDig(x, y)) { if (S.face && S.face.x === x && S.face.y === y) digTile(x, y); else S.face = { x, y }; return; }
  if (!canReach(x, y)) { S.face = null; return; }
  const p = dugPath(m.px, m.py, (a, b) => Math.abs(a - x) + Math.abs(b - y) === 1 && (tileAt(x, y).k !== "lair" || (a === 4 && b === 9)));
  if (p) walkPath(p, () => { if (canDig(x, y)) S.face = { x, y }; });
}
// arrows / d-pad: step through dug tiles; pointing at an un-dug tile only faces it until A is pressed
function moveDir(dx, dy) {
  if (mapBusy()) return;
  const m = run.map, nx = m.px + dx, ny = m.py + dy;
  if (!inMap(nx, ny)) { S.face = null; return; }
  const t = tileAt(nx, ny);
  if (t.dug) walkPath([{ x: nx, y: ny }]);
  else S.face = canDig(nx, ny) ? { x: nx, y: ny } : null;
}
function confirmMap() {
  if (mapBusy()) return;
  const m = run.map;
  if (S.face && canDig(S.face.x, S.face.y)) { digTile(S.face.x, S.face.y); return; }
  const t = tileAt(m.px, m.py);
  if (t.dug && t.c === "trader") openTrader(m.px, m.py);
}
function updateMap(dt) {
  if (S.dig) { S.dig.t += dt; if (S.dig.t >= (S.dig.dur || .2)) { S.dig = null; if (run && run.pending) openPending(); } }
  if (!S.dig && S.walk && run && S.screen === "map") {
    const st = S.walk.path.shift();
    if (st) { const from = { x: run.map.px, y: run.map.py }; run.map.px = st.x; run.map.py = st.y; S.dig = { t: 0, from, to: st, dur: .1 }; }
    else { const th = S.walk.then; S.walk = null; saveRun(); if (th) th(); }
  }
  if (S.mfloats.length) { for (const f of S.mfloats) f.t += dt; S.mfloats = S.mfloats.filter(f => f.t < 1.2); }
}
// ---------------------------------------------------------------- controller / keyboard focus navigation
// Every clickable region drawn last frame is a focus target. The D-pad (or arrow keys) snaps to the nearest target in that
// direction, A / Enter activates it, B backs out. While a pad is in use the "mouse" is parked on the focused target, so hover
// lifts, tooltips and target highlights all work unchanged.
const posKey = h => `p${h.x | 0},${h.y | 0},${h.w | 0},${h.h | 0}`;
function focusables(list) {
  let L = list.filter(h => !h.nf);
  if (S.screen === "combat" && C && !S.modal && !C.choose && C.sel >= 0 && C.hand[C.sel] && D(C.hand[C.sel]).tg) L = L.filter(h => h.k && h.k.startsWith("en:"));
  return L;
}
function defaultFocus(L) {
  if (S.screen === "combat" && C && !S.modal && !C.choose) {
    const hs = L.filter(h => h.k && h.k.startsWith("hand:"));
    if (hs.length) return hs[(hs.length - 1) >> 1];
  }
  let best = null, bd = 1e9;
  for (const h of L) { const d = Math.hypot(h.x + h.w / 2 - 480, h.y + h.h / 2 - 320); if (d < bd) { bd = d; best = h; } }
  return best;
}
function resolveFocus(L) {
  if (!L.length) return null;
  if (S.focusKey) {
    const m = L.find(h => (h.k || posKey(h)) === S.focusKey);
    if (m) return m;
    if (S.fpt) {
      let best = null, bd = 1e9;
      for (const h of L) { const d = Math.hypot(h.x + h.w / 2 - S.fpt.x, h.y + h.h / 2 - S.fpt.y); if (d < bd) { bd = d; best = h; } }
      return best;
    }
  }
  return defaultFocus(L);
}
function setFocus(h) { S.focusKey = h.k || posKey(h); S.fpt = { x: h.x + h.w / 2, y: h.y + h.h / 2 }; }
function focusAt(key, x, y) { S.focusKey = key; S.fpt = { x, y }; }
function navMove(dx, dy) {
  const L = focusables(prevHits), cur = resolveFocus(L);
  if (!cur) return;
  const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
  let best = null, bs = 1e9;
  for (const h of L) {
    if (h === cur) continue;
    const ddx = h.x + h.w / 2 - cx, ddy = h.y + h.h / 2 - cy, along = dx ? ddx * dx : ddy * dy;
    if (along <= 4) continue;
    const s = along + (dx ? Math.abs(ddy) : Math.abs(ddx)) * 2.2;
    if (s < bs) { bs = s; best = h; }
  }
  if (best) setFocus(best);
  else if (dy && (S.modal || S.screen === "bench" || (C && C.choose))) S.scroll += dy * 130;   // nothing further: scroll the card grid
  else setFocus(cur);
}
function navActivate() {
  const L = focusables(prevHits), cur = resolveFocus(L);
  if (!cur) return;
  const comb = S.screen === "combat" && C && !S.modal && !C.choose;
  if (comb && C.sel >= 0 && cur.k && cur.k.startsWith("hand:")) {
    // a selected card that needs no target plays on a second A
    const sc = C.hand[C.sel];
    if (sc && "hand:" + sc.uid === cur.k && !D(sc).tg) { if (canAct()) playCard(C.sel, null); return; }
  }
  cur.fn();
  if (comb && C.sel >= 0 && C.hand[C.sel] && D(C.hand[C.sel]).tg) { const e = livingEnemies()[0]; if (e) focusAt("en:" + e.uid, e.x, e.y - e.def.h / 2); }   // pick a target next
  else if (comb && cur.k && cur.k.startsWith("en:")) S.focusKey = null;                                                                               // card played: back to the hand
}
function padMove(dx, dy) {
  const wasOn = S.padMode; S.padMode = true;
  if (S.screen === "map" && !S.modal) { moveDir(dx, dy); return; }
  if (!wasOn) { const cur = resolveFocus(focusables(prevHits)); if (cur) setFocus(cur); return; }
  navMove(dx, dy);
}
function padA() {
  const wasOn = S.padMode; S.padMode = true;
  if (S.screen === "map" && !S.modal) { confirmMap(); return; }
  if (!wasOn) { const cur = resolveFocus(focusables(prevHits)); if (cur) setFocus(cur); return; }
  navActivate();
}
function padB() {
  S.padMode = true;
  if (C && S.screen === "combat" && !S.modal && !C.choose && C.sel >= 0) { const sc = C.hand[C.sel]; C.sel = -1; if (sc) S.focusKey = "hand:" + sc.uid; return; }
  if (S.modal) { if (S.modal.cancel) S.modal = null; return; }
  if (C && C.choose) return;
  // B = return: leave the shop / workbench, or go back to the Forge from the run-end screen
  if (run && (S.screen === "trader" || S.screen === "bench")) completeNode();
  else if (S.screen === "runEnd") S.screen = "hub";
}
function padX() { if (run && S.screen !== "hub" && S.screen !== "runEnd" && !S.modal && !(C && C.choose)) { S.padMode = true; openDeck(); } }
const pad = { dir: null, t: 0, a: false, b: false, x: false, y: false };
window.addEventListener("gamepadconnected", e => { S.toast = { text: "Controller connected: " + e.gamepad.id.slice(0, 44), t: 4 }; });
window.addEventListener("gamepaddisconnected", () => { S.toast = { text: "Controller disconnected", t: 3 }; });
function pollPad(dt) {
  if (!navigator.getGamepads) return;
  const gp = [...navigator.getGamepads()].find(g => g && g.connected);
  if (!gp) return;
  const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = i => gp.axes[i] || 0;
  let dx = 0, dy = 0;
  if (b(14) || ax(0) < -.5) dx = -1; else if (b(15) || ax(0) > .5) dx = 1; else if (b(12) || ax(1) < -.5) dy = -1; else if (b(13) || ax(1) > .5) dy = 1;
  // non-standard pads report the d-pad as a hat on axis 9 (up -1, then clockwise in steps of 2/7; 3.29 when released)
  if (!dx && !dy && gp.mapping !== "standard" && gp.axes.length > 9) {
    const h = gp.axes[9];
    if (h < 1.1) { const k = Math.round((h + 1) * 3.5); dx = [0, 1, 1, 1, 0, -1, -1, -1][k] || 0; dy = [-1, -1, 0, 1, 1, 1, 0, -1][k] || 0; }
  }
  const key = dx + "," + dy;
  if (!(dx || dy)) pad.dir = null;
  else if (pad.dir !== key) { pad.dir = key; pad.t = .28; padMove(dx, dy); }
  else { pad.t -= dt; if (pad.t <= 0) { pad.t = .14; padMove(dx, dy); } }
  const a = b(0), bb = b(1), xx = b(2), yy = b(3);
  if (a && !pad.a) padA();
  if (bb && !pad.b) padB();
  // X opens the deck. Y: holding it for 1 s in combat ends the turn (a bar fills across End Turn)
  if (xx && !pad.x) padX();
  if (S.screen === "combat" && C && !S.modal && !C.choose) {
    if (yy) {
      if (!pad.y) { pad.yT = 0; pad.yFired = false; }
      if (canAct() && !pad.yFired) { pad.yT += dt; S.endHold = clamp(pad.yT / 1, 0, 1); if (pad.yT >= 1) { pad.yFired = true; S.endHold = 0; S.padMode = true; endTurn(); } }
      else if (!canAct()) { pad.yT = 0; S.endHold = 0; }
    } else S.endHold = 0;
  } else S.endHold = 0;
  pad.a = a; pad.b = bb; pad.x = xx; pad.y = yy;
}
function openTrader(x, y) {
  if (S.dig || S.modal) return;
  S.walk = null; run.cur = { x, y }; run.pending = { screen: "trader" }; saveRun(); openPending();
}
function openPending() {
  const p = run.pending;
  if (!p) { S.screen = "map"; return; }
  S.modal = null; S.scroll = 0;
  if (p.screen === "combat") startCombat(p.enc, p.kind);
  else S.screen = p.screen;
}
function completeNode() {
  if (run.cur) { const t = tileAt(run.cur.x, run.cur.y); if (t.c !== "trader") t.used = true; run.cur = null; }
  run.pending = null;
  S.modal = null; S.screen = "map";
  saveRun();
}
const oreScrapValue = r => ORE_KEYS.reduce((s, k) => s + r.ore[k] * ORE[k].scrap, 0);
function endRun(win) {
  const oreScrap = oreScrapValue(run), gain = run.scrap + oreScrap + (win ? 200 : 0);
  save.bank += gain;
  if (win) save.stats.wins++;
  save.stats.bestZone = Math.max(save.stats.bestZone, run.zone);
  S.end = { win, gain, seed: run.seed, scrap: run.scrap, ore: Object.assign({}, run.ore), oreScrap };
  save.run = null; run = null; C = null; S.modal = null;
  S.screen = "runEnd";
  writeSave();
}

// ---------------------------------------------------------------- combat engine
const alive = e => e && e.hp > 0 && !e.dead;
const livingEnemies = () => C.enemies.filter(alive);
const unitXY = u => u.isP ? { x: 200, y: 263 } : { x: u.x, y: u.y - u.def.h * .5 };
function addFloat(u, text, col) { const p = unitXY(u); C.floats.push({ x: p.x + (Math.random() - .5) * 24, y: p.y - 40, text, col, t: 0 }); }

function act(fn, d = .18) {
  const a = { fn, d };
  if (C.ins >= 0) C.Q.splice(C.ins++, 0, a); else C.Q.push(a);
}
const val = n => typeof n === "function" ? n() : n;

function startCombat(encIds, kind) {
  const n = encIds.length;
  const xs = n === 1 ? [700] : n === 2 ? [620, 800] : [520, 670, 820];
  C = {
    kind, over: null, overT: 0, phase: "busy", turn: 0, Q: [], timer: .4, ins: -1, floats: [], sel: -1, choose: null, flash: 0, hoverCard: -1,
    P: { isP: true, hp: run.hp, maxhp: run.maxhp, block: 0, str: 0, weak: 0, vuln: 0, rad: 0, hitT: 0, pose: 0, poseT: 0 },
    enemies: [], draw: [], hand: [], disc: [], exh: [], energy: 0, nextEnergy: 0, charge: 0, heat: 0,
    comp: { dog: 0, mouse: 0 }, pw: {}, pwv: {}, swordN: 0, atkN: 0, uid: 1, banner: null, dogT: 0, mouseT: 0, oreGain: { cu: 0, ag: 0, au: 0 }
  };
  encIds.forEach((id, i) => {
    const d = ENEMIES[id], hp = rr(d.hp[0], d.hp[1]);
    C.enemies.push({ id, def: d, hp, maxhp: hp, block: 0, str: 0, weak: 0, vuln: 0, rad: 0, mi: 0, override: null, dead: false, fade: 1, hitT: 0, lungeT: 0, x: xs[i], y: 325, odDone: false, uid: i });
  });
  for (const c of run.deck) C.draw.push(Object.assign(JSON.parse(JSON.stringify(c)), { uid: C.uid++, appear: 1 }));
  shuffle(C.draw);
  S.screen = "combat"; S.modal = null;
  if (kind === "ambush") { C.banner = { t: 1.6, text: "AMBUSH!" }; C.timer = 1.4; }
  if (hasRelic("impactDrill")) C.charge = 2;
  if (hasRelic("dogR")) C.comp.dog = 3;
  if (hasRelic("mouseR")) C.comp.mouse = 3;
  if (hasRelic("bombR")) act(() => { for (const e of livingEnemies()) strike(e, 5, true); }, .3);
  if (hasRelic("radR")) act(() => { for (const e of livingEnemies()) applyStatus(e, "rad", 2); }, .2);
  startPlayerTurn();
}

function mkCard(id) { return { id, up: false, uid: C.uid++, appear: 0 }; }
function toHand(c) { c.appear = 0; if (C.hand.length >= 10) C.disc.push(c); else C.hand.push(c); }
function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (C.hand.length >= 10) break;
    if (!C.draw.length) { if (!C.disc.length) break; C.draw = shuffle(C.disc); C.disc = []; }
    const c = C.draw.pop(); c.appear = 0; C.hand.push(c);
  }
}
function applyStatus(u, key, n) {
  if (!n) return;
  u[key] += n;
  addFloat(u, `${STATUS[key].n} ${n > 0 ? "+" : ""}${n}`, STATUS[key].col);
}
// raw damage to hp after block; returns hp actually lost
function takeDamage(t, n, pierce) {
  if (n <= 0 && !pierce) { addFloat(t, "0", "#aab"); return 0; }
  let blocked = 0;
  if (!pierce && t.block > 0) { blocked = Math.min(t.block, n); t.block -= blocked; n -= blocked; }
  if (n > 0) { t.hp -= n; t.hitT = .25; if (t.isP) C.flash = .35; addFloat(t, `-${n}`, "#ff6a5a"); }
  else if (blocked) addFloat(t, "Blocked", "#9cc8ff");
  return n;
}
function calcDmg(src, tgt, base, mult = 1) {
  let d = base + (src.str || 0);
  if (src.weak > 0) d *= .75;
  if (tgt.vuln > 0) d *= 1.5;
  return Math.max(0, Math.floor(d * mult));
}
// player attack hit on enemy t (x = card context for bonus/double)
function strike(t, n, raw, x) {
  if (!alive(t)) return 0;
  if (raw) return takeDamage(t, n, false);
  let first = 0;
  if (x && x.fz && x.fz.first) { first = x.fz.first; x.fz.first = 0; }
  return takeDamage(t, calcDmg(C.P, t, n + (x ? x.bonus : 0) + first, x && x.dbl ? 2 : 1), false);
}
function dogAttack() {
  const v = C.comp.dog; if (v <= 0) return;
  C.dogT = .3;
  const t = pick(livingEnemies()); if (!t) return;
  strike(t, v, true);
}

function makeCtx(card, target, fz) {
  const x = { card, t: target, bonus: 0, dbl: false, sword: false, fz: fz || null };
  const times = (hits, fn, d) => { for (let i = 0; i < hits; i++) act(fn, d); };
  x.q = fn => act(fn, 0);
  x.hit = (t, n, hits = 1) => times(hits, () => strike(t, val(n), false, x), .16);
  x.all = (n, hits = 1) => times(hits, () => { const v = val(n); for (const e of livingEnemies()) strike(e, v, false, x); }, .22);
  x.rand = (n, hits = 1) => times(hits, () => { const e = pick(livingEnemies()); if (e) strike(e, val(n), false, x); }, .14);
  x.others = (t, n) => act(() => { for (const e of livingEnemies()) if (e !== t) strike(e, n, false, x); }, .2);
  x.self = n => act(() => { if (!C.pw.blastShield) takeDamage(C.P, n, false); }, .2);
  x.block = n => act(() => { const v = val(n); C.P.block += v; addFloat(C.P, `+${v} Block`, "#9cc8ff"); }, .16);
  x.apply = (t, key, n) => act(() => {
    if (t === "self") applyStatus(C.P, key, n);
    else if (t === "all") for (const e of livingEnemies()) applyStatus(e, key, n);
    else if (alive(t)) applyStatus(t, key, n);
  }, .16);
  x.draw = n => act(() => drawCards(n), .15);
  x.energy = n => act(() => { C.energy += n; addFloat(C.P, `+${n} Energy`, "#ffe27a"); }, .12);
  x.energyNext = n => act(() => { C.nextEnergy += n; addFloat(C.P, `+${n} Energy next turn`, "#ffe27a"); }, .12);
  x.heal = n => act(() => { const h = Math.min(n, C.P.maxhp - C.P.hp); C.P.hp += h; addFloat(C.P, `+${h} HP`, "#6aff8a"); }, .2);
  x.charge = n => act(() => { C.charge += n; addFloat(C.P, `+${n} Charge`, "#ffa44a"); }, .12);
  x.mine = n => act(() => mine(n), .12);
  x.release = per => { const b = C.charge * per; C.charge = 0; return b; };
  x.summon = (kind, v) => act(() => { C.comp[kind] += v; addFloat(C.P, `${kind === "dog" ? "Dog" : "Mouse"} ${C.comp[kind]}`, "#e8c890"); }, .2);
  x.addHand = id => act(() => toHand(mkCard(id)), .12);
  x.addDiscard = id => act(() => C.disc.push(mkCard(id)), .12);
  x.chooseHand = (n, then) => act(() => { if (C.hand.length) openChoose("Choose a card from your hand", C.hand, n, then); }, 0);
  x.choosePile = (pile, n, then) => act(() => { const p = pile === "disc" ? C.disc : pile === "draw" ? C.draw : C.exh; if (p.length) openChoose("Choose a card", p, n, then); }, 0);
  return x;
}
function openChoose(title, cards, n, then) {
  S.scroll = 0;
  C.choose = { title, cards: cards.slice(), n: Math.min(n, cards.length), picked: [], then };
}
function finishChoose() {
  const ch = C.choose; C.choose = null;
  C.ins = 0; ch.then(ch.picked); C.ins = -1;
  C.timer = .15;
}

function halfCost(h) {
  const d = CARDS[h.id];
  if (d.f === "sword" && C.swordN === 0 && hasRelic("swordR")) return 0;
  return pBase(h);
}
function costOf(c) {
  if (D(c).unplayable) return 99;
  if (!c.fuse) return halfCost(c);
  return Math.max(0, halfCost(c.fuse[0]) + halfCost(c.fuse[1]) - 1);
}
const oreOK = c => { const o = D(c).ore; return !o || ORE_KEYS.every(k => !o[k] || run.ore[k] >= o[k]); };
const canPay = c => costOf(c) <= C.energy && oreOK(c);
const canAct = () => C && !S.modal && !C.choose && !C.over && C.phase === "player" && !C.Q.length && C.timer <= 0;
function shakeCard(c) { c.shake = .35; }

function playCard(idx, target) {
  const card = C.hand[idx], d = D(card);
  if (d.unplayable || !canPay(card)) { shakeCard(card); return false; }
  C.energy -= costOf(card);
  C.P.pose = d.t === "attack" ? 1 : 2; C.P.poseT = .3;
  if (d.ore) for (const k of ORE_KEYS) if (d.ore[k]) run.ore[k] -= d.ore[k];
  C.hand.splice(idx, 1);
  C.sel = -1;
  const fz = { first: 0 }, att = d.t === "attack";
  if (d.rec && d.rec.pre) d.rec.pre(fz, att);
  const hs = halves(card);
  for (const h of hs) {
    const hd = CARDS[h.id], x = makeCtx(h, target, fz);
    x.sword = C.swordN > 0;
    if (hd.f === "sword") {
      if (C.pw.saberDance) { const v = C.pwv.saberDance; act(() => { C.P.block += v; addFloat(C.P, `+${v} Block`, "#9cc8ff"); }, .15); }
      C.swordN++;
    }
    if (hd.t === "attack") { C.atkN++; if (hasRelic("rocketR") && C.atkN % 3 === 0) { x.dbl = true; addFloat(C.P, "Rocket x2!", "#ff9a4a"); } }
    if (hd.f === "blaster" && hd.t === "attack" && C.pw.redLine) x.bonus = 3 * C.pw.redLine;
    hd.fx(x, cardVals(h));
    if (hd.heat) { const n = hd.heat + (C.pw.redLine || 0); act(() => addHeat(n), .12); }
  }
  if (d.rec) d.rec.fx(makeCtx(hs[0], target, fz), att);
  if (d.t === "power") {
    C.pw[card.id] = (C.pw[card.id] || 0) + 1;
    C.pwv[card.id] = (C.pwv[card.id] || 0) + (cardVals(card)[0] || 0);
    addFloat(C.P, d.n, "#ffe27a");
  } else act(() => { (isExh(card) ? C.exh : C.disc).push(card); }, 0);
  return true;
}
function addHeat(n) {
  C.heat += n;
  const thr = hasRelic("blasterR") ? 7 : 5;
  if (C.heat >= thr) {
    C.heat = 0;
    addFloat(C.P, "OVERHEAT!", "#ff6030");
    toHand(mkCard("overheat"));
    if (C.pw.heatSink) drawCards(2 * C.pw.heatSink);
  }
}

function startPlayerTurn() {
  act(() => { C.turn++; C.phase = "busy"; C.P.block = 0; C.sel = -1; C.swordN = 0; if (C.turn > 1) C.banner = { t: 1.1, text: "Your Turn" }; }, .05);
  act(() => { if (C.P.rad > 0) { takeDamage(C.P, C.P.rad, true); C.P.rad--; } }, .2);
  act(() => {
    if (C.pw.perpetual) { C.charge += C.pw.perpetual; addFloat(C.P, `+${C.pw.perpetual} Charge`, "#ffa44a"); }
    if (C.pw.wingmen) for (let k = 0; k < C.pw.wingmen; k++) for (let h = 0; h < 2; h++) act(() => { const e = pick(livingEnemies()); if (e) strike(e, 4, false); }, .15);
  }, .1);
  act(() => { drawCards(5 + (C.turn === 1 && hasRelic("thirdEye") ? 2 : 0)); }, .3);
  act(() => {
    C.energy = 3 + (C.turn === 1 && hasRelic("burstR") ? 1 : 0) + C.nextEnergy; C.nextEnergy = 0;
    if (C.turn === 1 && hasRelic("flareR")) for (const e of livingEnemies()) applyStatus(e, "vuln", 1);
  }, .1);
  act(() => { if (!C.over) C.phase = "player"; }, 0);
}

function endTurn() {
  if (!canAct()) return;
  C.phase = "enemy"; C.sel = -1;
  act(() => {
    for (const c of C.hand.slice()) {
      if (c.id === "overheat") { C.hand.splice(C.hand.indexOf(c), 1); C.exh.push(c); takeDamage(C.P, 3, false); }
      else if (c.id === "spore") { C.hand.splice(C.hand.indexOf(c), 1); C.exh.push(c); }
    }
  }, .25);
  act(() => { C.disc.push(...C.hand); C.hand = []; }, .2);
  act(() => {
    const reps = C.pw.packLeader ? 2 : 1;
    for (let r = 0; r < reps; r++) {
      if (C.comp.dog > 0) act(() => dogAttack(), .25);
      if (C.comp.mouse > 0) act(() => { C.mouseT = .3; C.P.block += C.comp.mouse; addFloat(C.P, `+${C.comp.mouse} Block`, "#9cc8ff"); }, .2);
    }
  }, 0);
  act(() => { if (C.pw.fallout) for (const e of livingEnemies()) applyStatus(e, "rad", C.pwv.fallout); }, .25);
  act(() => { C.P.weak = Math.max(0, C.P.weak - 1); C.P.vuln = Math.max(0, C.P.vuln - 1); C.banner = { t: 1.1, text: "Enemy Turn" }; }, .3);
  for (const e of C.enemies) {
    act(() => { if (!alive(e)) return; e.block = 0; if (e.rad > 0) { takeDamage(e, e.rad, true); e.rad--; } }, .15);
    act(() => { if (alive(e)) execMove(e); }, .3);
    act(() => {
      if (!alive(e)) return;
      e.weak = Math.max(0, e.weak - 1); e.vuln = Math.max(0, e.vuln - 1);
      if (e.override) e.override = null; else e.mi = (e.mi + 1) % e.def.moves.length;
    }, .05);
  }
  startPlayerTurn();
}

const moveOf = e => e.override || e.def.moves[e.mi];
function execMove(e) {
  const m = moveOf(e);
  e.lungeT = .4;
  addFloat(e, m.n, "#ffd9a0");
  if (m.dmg) for (let h = 0; h < (m.hits || 1); h++) act(() => { if (alive(e)) takeDamage(C.P, calcDmg(e, C.P, m.dmg), false); }, .2);
  act(() => {
    if (!alive(e)) return;
    if (m.apply) for (const k in m.apply) applyStatus(C.P, k, m.apply[k]);
    if (m.block) { e.block += m.block; addFloat(e, `+${m.block} Block`, "#9cc8ff"); }
    if (m.str) applyStatus(e, "str", m.str);
    if (m.allyBlock) {
      let al = livingEnemies().filter(o => o !== e); if (!al.length) al = [e];
      for (const o of al) { o.block += m.allyBlock; addFloat(o, `+${m.allyBlock} Block`, "#9cc8ff"); }
    }
  }, .1);
}
// sentinel enrages once at half HP: swaps its next move for Overdrive without losing its place in the cycle
function refreshIntents() {
  for (const e of C.enemies) if (alive(e) && e.def.overdrive && !e.odDone && e.hp <= e.maxhp / 2) {
    e.odDone = true; e.override = e.def.overdrive;
    C.banner = { t: 1.2, text: "Overdrive!" };
  }
}
function afterAction() {
  for (const e of C.enemies) if (!e.dead && e.hp <= 0) { e.dead = true; e.hp = 0; addFloat(e, "Defeated", "#ffd24a"); gainOre("cu", 1); }
  refreshIntents();
  if (C.P.hp <= 0) { C.P.hp = 0; C.over = "lost"; C.overT = 1; C.Q.length = 0; C.choose = null; return; }
  if (C.enemies.every(e => e.dead)) { C.over = "won"; C.overT = .9; C.Q.length = 0; C.choose = null; }
}

function updateCombat(dt) {
  if (C.over) {
    C.overT -= dt;
    if (C.overT <= 0) { const r = C.over; C.over = "done"; r === "won" ? onWin() : onLose(); return; }
  } else if (!C.choose) {
    C.timer -= dt;
    while (C.timer <= 0 && C.Q.length && !C.choose && !C.over) {
      const a = C.Q.shift(); C.ins = 0; a.fn(); C.ins = -1; C.timer = a.d; afterAction();
    }
    if (!C.Q.length && !C.over) afterAction();
  }
  for (const e of C.enemies) { e.hitT = Math.max(0, e.hitT - dt); e.lungeT = Math.max(0, e.lungeT - dt); if (e.dead) e.fade = Math.max(0, e.fade - dt * 2.2); }
  C.P.hitT = Math.max(0, C.P.hitT - dt); C.flash = Math.max(0, C.flash - dt);
  C.P.poseT = Math.max(0, C.P.poseT - dt); C.dogT = Math.max(0, C.dogT - dt); C.mouseT = Math.max(0, C.mouseT - dt);
  for (const c of C.hand) { c.appear = Math.min(1, c.appear + dt * 5); if (c.shake) c.shake = Math.max(0, c.shake - dt); }
  for (const f of C.floats) f.t += dt;
  C.floats = C.floats.filter(f => f.t < 1.1);
  if (C.banner) { C.banner.t -= dt; if (C.banner.t <= 0) C.banner = null; }
}

function onWin() {
  if (hasRelic("converterR")) C.P.hp = Math.min(C.P.maxhp, C.P.hp + 5);
  run.hp = C.P.hp;
  const kind = C.kind;
  if (kind === "elite") gainOre("ag", 1);
  if (kind === "boss") gainOre("au", 1);
  const oreG = Object.assign({}, C.oreGain);
  C = null;
  if (kind === "boss") { run.scrap += 75; run.zone = 1; endRun(true); return; }
  const scrap = gainScrap(kind === "elite" ? rr(30, 40) : kind === "ambush" ? rr(10, 20) : rr(15, 25));
  const pend = { screen: "reward", scrap, cards: kind === "ambush" ? [] : rollCards(kind, save.forge.survey ? 4 : 3), relic: null, ore: oreG, ambush: kind === "ambush" };
  if (kind === "elite") { const pool = unownedRelics(); if (pool.length) { pend.relic = pick(pool); grantRelic(pend.relic); } }
  run.pending = pend;
  saveRun(); S.screen = "reward";
}
function onLose() { run.hp = 0; endRun(false); }

// ---------------------------------------------------------------- events
const EVENTS = {
  probe: {
    img: "probe", title: "Crashed Probe", text: "A battered survey probe lies half-buried in the dust, its hatch still warm.",
    choices: [
      { label: "Take a random relic", fn: () => { const pool = unownedRelics(); if (pool.length) { const id = pick(pool); grantRelic(id); return `You pull the ${RELICS[id].n} relic from the wreck.`; } return `Nothing useful left. +${gainScrap(60)} Scrap.`; } },
      { label: "Strip it for 60 Scrap", fn: () => `You strip the probe for parts. +${gainScrap(60)} Scrap.` }
    ]
  },
  pool: {
    img: "sporePool", title: "Spore Pool", text: "A glowing pool of spores bubbles at the edge of the landing zone. It smells sweet.",
    choices: [
      { label: "Drink: heal 15", fn: () => { const h = Math.min(15, run.maxhp - run.hp); run.hp += h; return `The spores taste like honey. +${h} HP.`; } },
      {
        label: "Wade through: take 6 damage, remove a card", fn: () => {
          run.hp -= 6;
          if (run.hp <= 0) { run.hp = 0; endRun(false); return null; }
          openModal({ title: "Remove a card from your deck", cards: run.deck, n: 1, onDone: ([c]) => { run.deck.splice(run.deck.indexOf(c), 1); run.pending.res = `The spores eat away ${cardName(c)}. -6 HP.`; saveRun(); } });
          return null;
        }
      }
    ]
  },
  mouse: {
    img: "mouse", title: "Stranded Mouse", text: "A tiny alien creature cowers under a rock, one leg caught in a crack.",
    choices: [
      { label: "Take it along: add Mouse Helper to the deck", fn: () => { addCard("mouseHelper"); return "The mouse scampers into your pack. Mouse Helper added."; } },
      { label: "Leave it: nothing happens", fn: () => "You leave the mouse where it is." }
    ]
  }
};

// ---------------------------------------------------------------- ui toolkit
const M = { x: -1, y: -1 };
let hits = [], prevHits = [], hitsOff = false, tip = null;
const over = (x, y, w, h) => !hitsOff && M.x >= x && M.x <= x + w && M.y >= y && M.y <= y + h;
function hit(x, y, w, h, fn, o) { if (!hitsOff) hits.push({ x, y, w, h, fn, k: o && o.k, nf: o && o.nf, fr: o && o.fr }); }
function rp(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function T(s, x, y, size = 14, col = "#fff", align = "left", bold = false) {
  ctx.font = `${bold ? "bold " : ""}${size}px ${FONT}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
}
function wrap(s, maxW) {
  const out = []; let line = "";
  for (const w of s.split(" ")) {
    const t = line ? line + " " + w : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function btn(x, y, w, h, label, fn, o = {}) {
  const hv = !o.off && over(x, y, w, h);
  rp(x, y, w, h, 8); ctx.fillStyle = o.off ? "#151a22" : hv ? (o.hi || "#2d4660") : (o.bg || "#1b2a3b"); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = o.off ? "#3a4048" : (o.bd || "#68d6c7"); ctx.stroke();
  const ic = o.icon && artReady("ui");
  T(label, x + w / 2 + (ic ? 10 : 0), y + h / 2 + 1, o.size || 16, o.off ? "#667" : "#fff", "center", true);
  if (ic) uiIcon(o.icon[0], o.icon[1], x + 18, y + h / 2, 22);
  if (!o.off) hit(x, y, w, h, fn);
}
function setTip(items, ax, ay) { tip = { items, ax, ay }; }
function drawTip() {
  if (!tip || !tip.items.length) return;
  ctx.font = `12px ${FONT}`;
  const pw = 236, blocks = tip.items.map(it => ({ t: it.t, lines: wrap(it.d || "", pw - 20) }));
  const h = blocks.reduce((s, b) => s + 22 + b.lines.length * 15 + 6, 8);
  let x = tip.ax, y = tip.ay;
  if (x + pw > W - 6) x = tip.ax - pw - 30;
  x = clamp(x, 6, W - pw - 6); y = clamp(y, 6, H - h - 6);
  rp(x, y, pw, h, 8); ctx.fillStyle = "rgba(10,14,22,.96)"; ctx.fill(); ctx.strokeStyle = "#68d6c7"; ctx.lineWidth = 1.5; ctx.stroke();
  let cy = y + 8;
  for (const b of blocks) {
    T(b.t, x + 10, cy + 10, 13, "#ffd24a", "left", true); cy += 22;
    ctx.font = `12px ${FONT}`;
    for (const l of b.lines) { T(l, x + 10, cy + 6, 12, "#d6dde8"); cy += 15; }
    cy += 6;
  }
}
function cardTips(card) {
  const d = D(card), s = cardText(card) + " " + d.t, out = [];
  for (const [n, re, desc] of KW) if (re.test(s)) out.push({ t: n, d: desc });
  return out.slice(0, 5);
}

// ---------------------------------------------------------------- card / relic drawing
// cover-fits one 320x140 art cell into dx,dy,dw,dh (card-local coordinates); false when the card has no art or the sheet isn't loaded
function blitCardArt(c, dx, dy, dw, dh) {
  const a = CARDS[c.id].artCell;
  if (!a) return false;
  const img = artReady("card_" + a[0]);
  if (!img) return false;
  const col = a[1] % 4, row = (a[1] / 4) | 0, k = Math.max(dw / 320, dh / 140), sw = dw / k, sh = dh / k;
  ctx.drawImage(img, col * 320 + (320 - sw) / 2, row * 140 + (140 - sh) / 2, sw, sh, dx, dy, dw, dh);
  return true;
}
// fills the 100x44 art window; fused cards show half A on the left and half B on the right with a bright diagonal seam
function drawCardArt(card) {
  ctx.save(); rp(-50, -37, 100, 44, 6); ctx.clip();
  let ok;
  if (!card.fuse) ok = blitCardArt(card, -50, -37, 100, 44);
  else {
    ctx.save(); ctx.beginPath(); ctx.moveTo(-50, -37); ctx.lineTo(8, -37); ctx.lineTo(-8, 7); ctx.lineTo(-50, 7); ctx.closePath(); ctx.clip();
    const a = blitCardArt(card.fuse[0], -50, -37, 64, 44); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.moveTo(8, -37); ctx.lineTo(50, -37); ctx.lineTo(50, 7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.clip();
    const b = blitCardArt(card.fuse[1], -14, -37, 64, 44); ctx.restore();
    ok = a && b;
    if (ok) { ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -37); ctx.lineTo(-8, 7); ctx.stroke(); }
  }
  ctx.restore();
  return ok;
}
function drawCard(card, cx, cy, s, o = {}) {
  const d = D(card), fam = FAM[d.f];
  ctx.save(); ctx.translate(cx, cy); if (o.ang) ctx.rotate(o.ang); ctx.scale(s, s);
  if (o.dim) ctx.globalAlpha = .5;
  if (o.glow) { rp(-65, -90, 130, 180, 14); ctx.fillStyle = "rgba(255,226,122,.35)"; ctx.fill(); }
  rp(-60, -85, 120, 170, 10);
  const g = ctx.createLinearGradient(0, -85, 0, 85); g.addColorStop(0, fam.c); g.addColorStop(1, "#1c1e26");
  ctx.fillStyle = g; ctx.fill();
  if (d.fused) {
    // fused frame: lower-right half in the second family's color
    ctx.save(); rp(-60, -85, 120, 170, 10); ctx.clip();
    const g2 = ctx.createLinearGradient(0, -85, 0, 85); g2.addColorStop(0, FAM[d.f2].c); g2.addColorStop(1, "#1c1e26");
    ctx.beginPath(); ctx.moveTo(60, -85); ctx.lineTo(60, 85); ctx.lineTo(-60, 85); ctx.closePath(); ctx.fillStyle = g2; ctx.fill();
    ctx.restore();
  }
  rp(-60, -85, 120, 170, 10); ctx.lineWidth = o.glow ? 3 : 2; ctx.strokeStyle = o.glow ? "#ffe27a" : "#0d0f14"; ctx.stroke();
  // name
  let fs = 12; ctx.font = `bold ${fs}px ${FONT}`;
  const nm = cardName(card);
  while (fs > 6.5 && ctx.measureText(nm).width > 68) { fs -= .5; ctx.font = `bold ${fs}px ${FONT}`; }
  T(nm, 10, -68, fs, halves(card).some(h => h.up) ? "#8dff95" : "#fff", "center", true);
  // cost
  const cost = o.cost != null ? o.cost : baseCost(card);
  if (d.t !== "status") {
    ctx.beginPath(); ctx.arc(-46, -70, 14, 0, TAU); ctx.fillStyle = "#14233b"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = o.costCol || "#ffd24a"; ctx.stroke();
    T(String(cost), -46, -69, 16, o.costCol || "#fff", "center", true);
  }
  // ore pips under the energy circle
  let px = -52;
  for (const k of ORE_KEYS) for (let i = 0; i < ((d.ore && d.ore[k]) || 0); i++) {
    if (!uiIcon(ORE_KEYS.indexOf(k), 2, px, -50, 12)) { ctx.beginPath(); ctx.arc(px, -50, 4, 0, TAU); ctx.fillStyle = ORE[k].col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = o.oreBad ? "#ff4a4a" : "#0d0f14"; ctx.stroke(); }
    else if (o.oreBad) { ctx.beginPath(); ctx.arc(px, -50, 6.5, 0, TAU); ctx.lineWidth = 1.5; ctx.strokeStyle = "#ff4a4a"; ctx.stroke(); }
    px += 9;
  }
  T(d.fused && d.f !== d.f2 ? `${d.t.toUpperCase()} · ${fam.n.toUpperCase()} + ${FAM[d.f2].n.toUpperCase()}` : `${d.t.toUpperCase()} · ${fam.n.toUpperCase()}`, 8, -46, d.fused && d.f !== d.f2 ? 6.5 : 8.5, "rgba(255,255,255,.75)", "center", true);
  // art box
  rp(-50, -37, 100, 44, 6); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fill();
  if (!drawCardArt(card)) { ctx.globalAlpha *= .55; T(d.fused ? fam.n[0] + FAM[d.f2].n[0] : fam.n[0], 0, -14, 34, "#fff", "center", true); ctx.globalAlpha = o.dim ? .5 : 1; }
  // text (shrinks to fit; fused cards get a divider between the halves)
  rp(-53, 11, 106, 62, 6); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill();
  const parts = cardText(card).split("\n");
  let fsz = 10.5, rows = [], th = 0;
  for (;;) {
    ctx.font = `${fsz}px ${FONT}`; rows = [];
    for (const p of parts) { if (p === "--") rows.push(null); else rows.push(...wrap(p, 98)); }
    th = rows.reduce((a, r) => a + (r === null ? 5 : fsz * 1.18), 0);
    if (th <= 58 || fsz <= 6.5) break;
    fsz -= .5;
  }
  let cy2 = 42 - th / 2;
  for (const r of rows) {
    if (r === null) { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-44, cy2 + 2.5); ctx.lineTo(44, cy2 + 2.5); ctx.stroke(); cy2 += 5; }
    else { const lh = fsz * 1.18; T(r, 0, cy2 + lh / 2, fsz, "#f2f2f2", "center"); cy2 += lh; }
  }
  ctx.beginPath(); ctx.arc(0, 79, 3.5, 0, TAU); ctx.fillStyle = RAR_COL[d.r]; ctx.fill();
  ctx.restore();
}
function drawRelic(id, x, y, r, tipOn = true) {
  const d = RELICS[id];
  const art = artReady("relics");
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = art ? "rgba(14,16,24,.75)" : d.col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = art ? d.col : "#0d0f14"; ctx.stroke();
  const ri = RELIC_ICON[id];
  if (art && ri !== undefined) drawCell("relics", ri % 5, (ri / 5) | 0, 128, 128, x - r * 1.05, y - r * 1.05, r * 2.1, r * 2.1);
  else T(initials(d.n), x, y + 1, r * .85, "#10141c", "center", true);
  if (tipOn && over(x - r, y - r, r * 2, r * 2)) {
    const extra = id === "rocketR" && C ? ` (${C.atkN % 3}/3)` : "";
    setTip([{ t: d.n, d: d.d + extra }], x + r + 6, y + r);
  }
}
function drawRelicRow(x, y) {
  run.relics.forEach((id, i) => drawRelic(id, x + 14 + i * 30, y, 13));
}
function statusRow(u, cx, y) {
  const keys = ["str", "weak", "vuln", "rad"].filter(k => u[k] > 0);
  const x0 = cx - (keys.length - 1) * 15;
  keys.forEach((k, i) => {
    const st = STATUS[k], x = x0 + i * 30;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fillStyle = "#12161e"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = st.col; ctx.stroke();
    if (!uiIcon(st.ico[0], st.ico[1], x, y, 24)) T(st.l, x, y, 12, st.col, "center", true);
    T(String(u[k]), x + 9, y + 10, 11, "#fff", "center", true);
    if (over(x - 12, y - 12, 24, 24)) setTip([{ t: `${st.n} ${u[k]}`, d: st.d }], x + 16, y);
  });
}
function hpBar(u, cx, y, w) {
  rp(cx - w / 2, y, w, 14, 5); ctx.fillStyle = "#2a1414"; ctx.fill();
  const f = clamp(u.hp / u.maxhp, 0, 1);
  if (f > 0) { rp(cx - w / 2, y, Math.max(8, w * f), 14, 5); ctx.fillStyle = f > .5 ? "#4cae4c" : f > .25 ? "#d0a030" : "#d04040"; ctx.fill(); }
  ctx.lineWidth = 1.5; ctx.strokeStyle = "#0d0f14"; rp(cx - w / 2, y, w, 14, 5); ctx.stroke();
  T(`${Math.max(0, u.hp)}/${u.maxhp}`, cx, y + 7.5, 11, "#fff", "center", true);
  if (u.block > 0) {
    const bx = cx - w / 2 - 18, by = y + 7;
    if (!uiIcon(6, 0, bx, by + 1, 46)) {
    ctx.beginPath(); ctx.moveTo(bx - 11, by - 12); ctx.lineTo(bx + 11, by - 12); ctx.lineTo(bx + 11, by + 3); ctx.lineTo(bx, by + 14); ctx.lineTo(bx - 11, by + 3); ctx.closePath();
    ctx.fillStyle = "#3a78c8"; ctx.fill(); ctx.strokeStyle = "#cfe4ff"; ctx.lineWidth = 2; ctx.stroke();
    }
    // dark outline so the number reads over the bright shield art
    ctx.font = `bold 20px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineJoin = "round"; ctx.lineWidth = 4; ctx.strokeStyle = "#0d0f14"; ctx.strokeText(String(u.block), bx, by + 1);
    T(String(u.block), bx, by + 1, 20, "#fff", "center", true);
    if (over(bx - 16, by - 16, 32, 34)) setTip([{ t: "Block " + u.block, d: KW[0][2] }], bx + 16, by);
  }
}

// ---------------------------------------------------------------- enemy / player shapes
function drawIntentIcon(kind, x, y) {
  const ic = { attack: [0, 1], block: [1, 1], debuff: [2, 1], buff: [3, 1], summon: [4, 1], charging: [5, 1] }[kind] || [6, 1];
  if (uiIcon(ic[0], ic[1], x, y, 28)) return;
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 3; ctx.lineCap = "round";
  if (kind === "attack") {
    ctx.strokeStyle = "#ff7a6a"; ctx.beginPath(); ctx.moveTo(-9, 9); ctx.lineTo(9, -9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, -1); ctx.lineTo(1, 9); ctx.stroke();
  } else if (kind === "block") {
    ctx.fillStyle = "#4a90e0"; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, -9); ctx.lineTo(9, 2); ctx.lineTo(0, 11); ctx.lineTo(-9, 2); ctx.closePath(); ctx.fill();
  } else if (kind === "debuff" || kind === "buff") {
    const up = kind === "buff"; ctx.strokeStyle = up ? "#ffd24a" : "#c090ff"; const s = up ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(0, -9 * s); ctx.lineTo(0, 9 * s); ctx.moveTo(-7, 2 * s); ctx.lineTo(0, 9 * s); ctx.lineTo(7, 2 * s); ctx.stroke();
  } else {
    ctx.fillStyle = "#7affc0"; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 10, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function intentInfo(e) {
  const m = moveOf(e), kinds = [];
  let num = "";
  if (m.dmg) { const d = calcDmg(e, C.P, m.dmg); kinds.push("attack"); num = m.hits > 1 ? `${d}×${m.hits}` : String(d); }
  if (m.block || m.allyBlock) kinds.push("block");
  if (m.apply) kinds.push("debuff");
  if (m.str) kinds.push("buff");
  return { m, kinds, num };
}
const enemyArtKey = id => "e_" + (id.startsWith("drone") ? "drone" : id);
function enemyTop(e) {
  const d = e.def;
  return artReady(enemyArtKey(e.id)) ? d.h * (d.boss ? 1.15 : 1.25) * (d.artScale || 1) + (d.fly ? d.h * .2 + 6 : 0) : d.h;
}
function drawEnemyBody(e, x, y) {
  const d = e.def, t = S.time, col = d.col;
  const key = enemyArtKey(e.id), img = artReady(key);
  if (img) {
    // trimmed art scaled to the enemy's visible height, feet on the ground line; flyers hover and bob
    const tb = trimBox(key, img), th = d.h * (d.boss ? 1.15 : 1.25) * (d.artScale || 1), sc = th / tb.h, w = tb.w * sc;
    const lift = d.fly ? d.h * .2 + Math.sin(t * 2 + e.uid) * 6 : 0, dx = x - w / 2, dy = y - th - lift;
    ctx.save(); if (e.id === "warden" && e.uid % 2) ctx.filter = "hue-rotate(40deg)";
    ctx.drawImage(img, tb.x, tb.y, tb.w, tb.h, dx, dy, w, th); ctx.restore();
    if (e.hitT > 0) flashSprite(dx - 6, dy - 6, w + 12, th + 12, "#ffffff", e.hitT * 2, g => g.drawImage(img, tb.x, tb.y, tb.w, tb.h, dx, dy, w, th));
    return true;
  }
  ctx.lineWidth = 3; ctx.strokeStyle = "#0d0f14"; ctx.fillStyle = col;
  if (d.shape === "blob") {
    const sq = Math.sin(t * 3 + e.uid) * 2;
    ctx.beginPath(); ctx.ellipse(x, y - 30, 45 + sq, 32 - sq, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e8f0a0"; for (const [dx, dy] of [[-20, -45], [25, -50], [10, -18]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, 4, 0, TAU); ctx.fill(); }
    for (const dx of [-13, 13]) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + dx, y - 34, 8, 0, TAU); ctx.fill(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x + dx - 2, y - 33, 4, 0, TAU); ctx.fill(); }
  } else if (d.shape === "spiky") {
    ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 34 : 50; ctx.lineTo(x + Math.cos(a) * r, y - 48 + Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3a4a10"; ctx.beginPath(); ctx.arc(x, y - 48, 28, 0, TAU); ctx.fill();
    ctx.fillStyle = "#ffef60"; for (const dx of [-11, 11]) { ctx.beginPath(); ctx.arc(x + dx, y - 54, 6, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = "#ffef60"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 40, 11, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
  } else if (d.shape === "worm") {
    for (let i = 0; i < 5; i++) {
      const sx = x + 48 - i * 24, sy = y - 24 - Math.max(0, Math.sin(i * .9 + t * 2) * 16) - (i === 0 ? 20 : 0), r = i === 0 ? 27 : 21;
      ctx.fillStyle = i % 2 ? "#9a6a3c" : col; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill(); ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x + 40, y - 56, 6, 0, TAU); ctx.fill(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x + 38, y - 55, 3, 0, TAU); ctx.fill();
  } else if (d.shape === "drone") {
    const by = y - 55 + Math.sin(t * 3 + e.uid * 2) * 6;
    ctx.beginPath(); ctx.arc(x, by, 34, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#cfe4ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, by, 46, 11, -.2, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 8, by, 11, 0, TAU); ctx.fillStyle = "#ff4a3a"; ctx.fill();
    ctx.fillStyle = "#ffd0c0"; ctx.beginPath(); ctx.arc(x - 11, by - 3, 3.5, 0, TAU); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(x - 80, y - 70); ctx.lineTo(x + 70, y - 90); ctx.lineTo(x + 95, y - 25); ctx.lineTo(x - 90, y - 25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#6a3a20"; ctx.fillRect(x - 70, y - 25, 34, 30); ctx.fillRect(x + 40, y - 25, 34, 30);
    ctx.fillStyle = "#3a3a44"; ctx.fillRect(x - 128, y - 70, 60, 16); ctx.strokeRect(x - 128, y - 70, 60, 16);
    ctx.fillStyle = "#2a1410"; ctx.beginPath(); ctx.arc(x - 10, y - 100, 38, Math.PI, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = e.override || e.odDone ? "#ff3020" : "#ffb040"; ctx.beginPath(); ctx.arc(x - 10, y - 104, 12 + Math.sin(t * 4) * 2, 0, TAU); ctx.fill();
  }
}
function drawEnemy(e) {
  const d = e.def;
  const lunge = e.lungeT > 0 ? -Math.sin(e.lungeT / .4 * Math.PI) * 50 : 0;
  const shake = e.hitT > 0 ? (Math.random() - .5) * 10 : 0;
  ctx.save(); ctx.globalAlpha = e.fade;
  const drewArt = drawEnemyBody(e, e.x + lunge + shake, e.y);
  if (e.hitT > 0 && !drewArt) { ctx.globalAlpha = e.fade * e.hitT * 2; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(e.x + lunge, e.y - d.h * .5, d.w * .5, d.h * .5, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  if (e.dead) return;
  const sel = C.sel >= 0 && C.hand[C.sel] && D(C.hand[C.sel]).tg;
  const hv = over(e.x - d.w / 2, e.y - d.h, d.w, d.h + 6);
  if (sel) { ctx.strokeStyle = hv ? "#ffe27a" : "rgba(255,226,122,.45)"; ctx.lineWidth = hv ? 4 : 2; rp(e.x - d.w / 2 - 6, e.y - d.h - 6, d.w + 12, d.h + 16, 10); ctx.stroke(); }
  hpBar(e, e.x, e.y + 14, Math.max(80, d.w * .9));
  statusRow(e, e.x, e.y + 44);
  T(d.n, e.x, e.y + 66, 12, "#cfd6e2", "center", true);
  const info = intentInfo(e), iy = e.y - enemyTop(e) - 28;
  const parts = info.kinds.length; ctx.font = `bold 20px ${FONT}`;
  const wTot = parts * 26 + (info.num ? ctx.measureText(info.num).width + 22 : 0);
  let ix = e.x - wTot / 2 + 13;
  info.kinds.forEach(k => { drawIntentIcon(k, ix, iy); ix += 26; });
  if (info.num) T(info.num, ix - 6, iy, 20, "#ff9a8a", "left", true);
  if (over(e.x - 40, iy - 16, 80, 32)) setTip([{ t: info.m.n, d: describeMove(info.m, info.num) }], e.x + 44, iy);
}
function describeMove(m, num) {
  const p = [];
  if (m.dmg) p.push(`Attacks for ${num}.`);
  if (m.block) p.push(`Gains ${m.block} Block.`);
  if (m.allyBlock) p.push(`Gives ${m.allyBlock} Block to its ally.`);
  if (m.apply) p.push("Applies " + Object.keys(m.apply).map(k => `${m.apply[k]} ${STATUS[k].n}`).join(", ") + ".");
  if (m.str) p.push(`Gains ${m.str} Strength.`);
  return p.join(" ");
}
function drawPlayer() {
  const x = 200, y = 325, P = C.P;
  const sh = P.hitT > 0 ? (Math.random() - .5) * 8 : 0;
  const art = artReady("miner");
  ctx.save();
  ctx.translate(sh, 0);
  if (art) {
    // cell 1 idle, 2 attack, 3 skill, 4 hurt; feet sit ~57px above the cell bottom, the cell is centred on x
    const pose = P.hitT > 0 ? 3 : P.poseT > 0 ? P.pose : 0, s = .39, dx = x - 192 * s, dy = y - 455 * s;
    drawCell("miner", pose, 0, 384, 512, dx, dy, 384 * s, 512 * s);
    if (C.flash > 0) flashSprite(dx - 30, dy - 10, 384 * s + 90, 512 * s + 20, "#ff2a1a", C.flash * 1.2, g => drawCell("miner", pose, 0, 384, 512, dx, dy, 384 * s, 512 * s, g));
  } else {
    ctx.lineWidth = 3; ctx.strokeStyle = "#0d0f14";
    ctx.fillStyle = "#3a4a60"; ctx.fillRect(x - 17, y - 36, 14, 36); ctx.fillRect(x + 3, y - 36, 14, 36); ctx.strokeRect(x - 17, y - 36, 14, 36); ctx.strokeRect(x + 3, y - 36, 14, 36);
    ctx.fillStyle = "#e0902a"; ctx.fillRect(x - 22, y - 92, 44, 58); ctx.strokeRect(x - 22, y - 92, 44, 58);
    ctx.fillStyle = "#8a8f98"; ctx.beginPath(); ctx.moveTo(x + 22, y - 76); ctx.lineTo(x + 70, y - 66); ctx.lineTo(x + 22, y - 54); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e8eef5"; ctx.beginPath(); ctx.arc(x, y - 112, 24, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1a3a5a"; ctx.beginPath(); ctx.ellipse(x + 8, y - 112, 14, 11, 0, 0, TAU); ctx.fill();
    if (C.flash > 0) { ctx.fillStyle = `rgba(255,40,30,${C.flash * 1.2})`; ctx.fillRect(x - 40, y - 150, 90, 150); }
  }
  ctx.restore();
  hpBar(P, x, y + 14, 130);
  statusRow(P, x, y + 44);
  // companions: sheet cells 1 dog idle, 2 dog attacking, 3 mouse idle, 4 mouse shielding (feet ~31px above the cell bottom)
  const cs = .41, companions = artReady("companions");
  if (C.comp.dog > 0) {
    const dx = 85, dy = y - 4;
    if (companions) drawCell("companions", C.dogT > 0 ? 1 : 0, 0, 256, 256, dx - 128 * cs, dy - 225 * cs, 256 * cs, 256 * cs);
    else {
      ctx.fillStyle = "#c89a5a"; ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(dx, dy - 14, 20, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(dx + 20, dy - 24, 9, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillRect(dx - 14, dy - 6, 5, 10); ctx.fillRect(dx + 8, dy - 6, 5, 10);
    }
    const ty = companions ? dy - 82 : dy - 42;
    T(String(C.comp.dog), dx, ty, 15, "#ffe0a8", "center", true);
    if (over(dx - 34, ty - 12, 70, dy - ty + 16)) setTip([{ t: "Dog " + C.comp.dog, d: "At end of your turn, deals " + C.comp.dog + " to a random enemy." }], dx + 40, ty);
  }
  if (C.comp.mouse > 0) {
    const mx = 305, my = y - 2;
    if (companions) drawCell("companions", C.mouseT > 0 ? 3 : 2, 0, 256, 256, mx - 128 * cs, my - 225 * cs, 256 * cs, 256 * cs);
    else {
      ctx.fillStyle = "#b8b0a8"; ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(mx, my - 8, 12, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(mx + 12, my - 12, 6, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#d89a9a"; ctx.beginPath(); ctx.moveTo(mx - 12, my - 8); ctx.quadraticCurveTo(mx - 24, my - 2, mx - 28, my - 14); ctx.stroke();
    }
    const ty = companions ? my - 82 : my - 30;
    T(String(C.comp.mouse), mx, ty, 15, "#ffe0a8", "center", true);
    if (over(mx - 34, ty - 12, 70, my - ty + 14)) setTip([{ t: "Mouse " + C.comp.mouse, d: "At end of your turn, gives you " + C.comp.mouse + " Block." }], mx + 40, ty);
  }
}

// ---------------------------------------------------------------- combat screen
function handLayout() {
  const n = C.hand.length, sp = n <= 1 ? 0 : Math.min(100, 520 / (n - 1)), x0 = 478 - sp * (n - 1) / 2;
  return C.hand.map((c, i) => {
    const dx = i - (n - 1) / 2, a = clamp(c.appear, 0, 1), e = ease(a);
    return { c, i, x: lerp(70, x0 + i * sp, e), y: lerp(600, 562 + dx * dx * 1.1, e), ang: dx * .028 * e };
  });
}
function drawCombat() {
  const tint = ZONE_TINT[(run ? run.zone : 1) - 1];
  const bg = artReady("bg" + (run ? run.zone : 1));
  if (bg) {
    // scaled up 8% and anchored to the bottom, so the scenery sits ~50px higher behind the units
    ctx.drawImage(bg, -37.5, -50, W * 1.078, H * 1.078);
    const sg = ctx.createLinearGradient(0, H * .6, 0, H); sg.addColorStop(0, "rgba(0,0,0,0)"); sg.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = sg; ctx.fillRect(0, H * .6, W, H * .4);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, tint[0]); g.addColorStop(.62, tint[1]); g.addColorStop(.63, "#1a110c"); g.addColorStop(1, "#0b0807");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.moveTo(0, 400); for (let x = 0; x <= W; x += 60) ctx.lineTo(x, 380 + Math.sin(x * .02) * 14); ctx.lineTo(W, 410); ctx.lineTo(0, 410); ctx.fill();
  }
  for (const e of C.enemies) if (e.fade > 0) drawEnemy(e);
  drawPlayer();

  // top-left HUD
  T(`HP ${C.P.hp}/${C.P.maxhp}`, 14, 20, 17, "#ff8a7a", "left", true);
  scrapText(140, 20, run.scrap);
  oreHud(270, 20);
  drawRelicRow(14, 56);
  let cy = 90;
  const chip = (label, col, tipItem, ico) => {
    const hasI = ico && artReady("ui");
    ctx.font = `bold 13px ${FONT}`; const w = ctx.measureText(label).width + 18 + (hasI ? 20 : 0);
    rp(14, cy - 11, w, 22, 8); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    if (hasI) uiIcon(ico[0], ico[1], 28, cy, 22);
    T(label, 14 + w / 2 + (hasI ? 10 : 0), cy + 1, 13, col, "center", true);
    if (over(14, cy - 11, w, 22)) setTip([tipItem], 14 + w + 8, cy);
    cy += 28;
  };
  if (C.charge > 0) chip(`Charge ${C.charge}`, "#ffa44a", { t: "Charge", d: KW[5][2] }, [4, 0]);
  if (C.heat > 0) chip(`Heat ${C.heat}/${hasRelic("blasterR") ? 7 : 5}`, "#4ad0e8", { t: "Heat", d: KW[6][2] }, [5, 0]);
  if (hasRelic("rocketR")) chip(`Rocket ${C.atkN % 3}/3`, "#ff9a4a", { t: "Rocket Launcher", d: RELICS.rocketR.d });
  for (const id in C.pw) chip(`${CARDS[id].n}${C.pw[id] > 1 ? " x" + C.pw[id] : ""}`, "#ffe27a", { t: CARDS[id].n, d: CARDS[id].tx([C.pwv[id] / C.pw[id]]) });

  btn(806, 10, 92, 28, `Deck ${run.deck.length}`, openDeck, { size: 13, icon: [5, 2] });
  T(`${ZONES[run.zone - 1]} · Turn ${C.turn}`, 590, 18, 13, "rgba(255,255,255,.55)", "center");

  // hand
  const lay = handLayout(), act0 = canAct();
  let hov = -1;
  if (!hitsOff) {
    const prev = C.hoverCard >= 0 ? lay[C.hoverCard] : null;
    if (prev && (over(prev.x - 75, 392, 150, 212) || over(prev.x - 60, prev.y - 85, 120, 170))) hov = C.hoverCard;
    else for (let k = lay.length - 1; k >= 0; k--) { const l = lay[k]; if (over(l.x - 60, l.y - 85, 120, 170)) { hov = k; break; } }
  }
  if (S.padMode && S.focusKey && S.focusKey.startsWith("hand:")) { const fi = lay.findIndex(l => "hand:" + l.c.uid === S.focusKey); if (fi >= 0) hov = fi; }
  C.hoverCard = hov;
  hit(0, 0, W, 470, () => {
    if (!canAct() || C.sel < 0) return;
    const c = C.hand[C.sel], le = livingEnemies();
    if (!D(c).tg) playCard(C.sel, null); else if (le.length === 1) playCard(C.sel, le[0]);
  }, { nf: 1 });
  // enemy hits were registered earlier; re-register them above the background hit
  for (const e of C.enemies) if (!e.dead) hit(e.x - e.def.w / 2, e.y - e.def.h, e.def.w, e.def.h + 6, () => {
    if (!canAct() || C.sel < 0) return;
    const c = C.hand[C.sel]; if (D(c).tg) playCard(C.sel, e);
  }, { k: "en:" + e.uid });
  for (const l of lay) {
    if (l.i === hov || l.i === C.sel) continue;
    const afford = canPay(l.c) && !D(l.c).unplayable;
    const sk = l.c.shake ? Math.sin(l.c.shake * 60) * 6 : 0;
    drawCard(l.c, l.x + sk, l.y, 1, { ang: l.ang, cost: costOf(l.c) >= 99 ? 0 : costOf(l.c), costCol: costOf(l.c) < baseCost(l.c) ? "#7dff8a" : afford ? null : "#ff6a6a", oreBad: !oreOK(l.c), dim: !afford });
  }
  const lifted = [hov, C.sel].filter((v, i, a) => v >= 0 && a.indexOf(v) === i);
  for (const k of lifted) {
    const l = lay[k]; if (!l) continue;
    const afford = canPay(l.c) && !D(l.c).unplayable;
    const sk = l.c.shake ? Math.sin(l.c.shake * 60) * 6 : 0;
    drawCard(l.c, l.x + sk, k === C.sel ? 492 : 497, 1.18, { cost: costOf(l.c) >= 99 ? 0 : costOf(l.c), costCol: costOf(l.c) < baseCost(l.c) ? "#7dff8a" : afford ? null : "#ff6a6a", oreBad: !oreOK(l.c), glow: k === C.sel });
  }
  for (const l of lay) hit(l.x - 60, l.y - 85, 120, 170, () => selectCard(l.i), { k: "hand:" + l.c.uid, fr: { x: l.x - 75, y: 392, w: 150, h: 212 } });
  if (hov >= 0) hit(lay[hov].x - 75, 392, 150, 212, () => selectCard(hov), { nf: 1 });
  if (hov >= 0 && !C.choose) setTip(cardTips(lay[hov].c), lay[hov].x + 92, 380);
  // targeting arrow
  if (C.sel >= 0 && C.hand[C.sel] && D(C.hand[C.sel]).tg && act0) {
    const sx = lay[C.sel] ? lay[C.sel].x : 480, sy = 335;
    ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 4; ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + M.x) / 2, Math.min(sy, M.y) - 90, M.x, M.y); ctx.stroke(); ctx.setLineDash([]);
    const a = Math.atan2(M.y - (Math.min(sy, M.y) - 90 + M.y) / 2, M.x - (sx + M.x) / 2);
    ctx.fillStyle = "#ffe27a"; ctx.beginPath(); ctx.moveTo(M.x, M.y); ctx.lineTo(M.x - 16 * Math.cos(a - .45), M.y - 16 * Math.sin(a - .45)); ctx.lineTo(M.x - 16 * Math.cos(a + .45), M.y - 16 * Math.sin(a + .45)); ctx.fill();
  }

  // energy / piles / end turn
  const og = ctx.createRadialGradient(66, 540, 4, 70, 548, 36); og.addColorStop(0, "#ffe9a0"); og.addColorStop(1, "#d98a20");
  if (!uiIcon(7, 0, 70, 548, 84)) { ctx.beginPath(); ctx.arc(70, 548, 34, 0, TAU); ctx.fillStyle = og; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#0d0f14"; ctx.stroke(); }
  // the orb's moons sit above it, so the sphere itself is ~2px below the icon centre
  T(`${C.energy}/3`, 70, 551, 24, "#2a1a08", "center", true);
  if (over(36, 514, 68, 68)) setTip([{ t: "Energy", d: "Spent to play cards. Refills to 3 each turn." }], 110, 520);
  const pile = (label, arr, x, y, w, title, icon) => btn(x, y, w, 30, `${label} ${arr.length}`, () => openPile(title, arr), { size: 13, icon });
  pile("Draw", C.draw, 24, 598, 92, "Draw pile (random order)", [6, 2]);
  pile("Discard", C.disc, 848, 540, 92, "Discard pile", [7, 2]);
  pile("Exhaust", C.exh, 848, 576, 92, "Exhausted");
  btn(822, 484, 118, 44, "End Turn", endTurn, { off: !act0, bg: "#2a4a2a", hi: "#3f7040", bd: "#8aff9a" });
  if (S.endHold > 0) { ctx.save(); rp(822, 484, 118, 44, 8); ctx.clip(); ctx.fillStyle = "rgba(255,226,122,.6)"; ctx.fillRect(822, 484, 118 * S.endHold, 44); ctx.restore(); rp(822, 484, 118, 44, 8); ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 3; ctx.stroke(); }

  // floats
  for (const f of C.floats) {
    ctx.globalAlpha = clamp(1.1 - f.t, 0, 1);
    T(f.text, f.x, f.y - f.t * 38, 18, f.col, "center", true);
    ctx.globalAlpha = 1;
  }
  if (C.banner) {
    const a = clamp(Math.min(C.banner.t * 2.5, 1), 0, 1);
    ctx.globalAlpha = a; ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, 250, W, 70);
    T(C.banner.text, 480, 285, 40, "#ffe27a", "center", true); ctx.globalAlpha = 1;
  }
  if (C.over === "won" || C.over === "lost") {
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
    T(C.over === "won" ? "Victory" : "Defeated", 480, 300, 52, C.over === "won" ? "#8dff95" : "#ff7a6a", "center", true);
  }
}
function selectCard(i) {
  if (!canAct()) return;
  const c = C.hand[i];
  if (!c) return;
  if (C.sel === i) { C.sel = -1; return; }
  if (D(c).unplayable || !canPay(c)) { shakeCard(c); return; }
  C.sel = i;
}
function openPile(title, arr) {
  const cards = arr.slice();
  if (arr === C.draw) cards.sort((a, b) => FAM_ORDER.indexOf(D(a).f) - FAM_ORDER.indexOf(D(b).f) || D(a).n.localeCompare(D(b).n));
  openModal({ title: `${title} (${cards.length})`, cards, n: 0, cancel: true });
}
function openDeck() {
  const cards = run.deck.slice().sort((a, b) => FAM_ORDER.indexOf(D(a).f) - FAM_ORDER.indexOf(D(b).f) || RAR_ORD[D(a).r] - RAR_ORD[D(b).r] || D(a).n.localeCompare(D(b).n));
  openModal({ title: `Deck (${cards.length})`, cards, n: 0, cancel: true });
}
function openModal(m) { S.scroll = 0; S.modal = Object.assign({ picked: [], cancel: false, n: 0 }, m); }

// generic card grid used by deck/pile viewers, camp upgrade, removals, and in-combat choices
function drawGrid(g, isChoose) {
  ctx.fillStyle = "rgba(5,8,14,.9)"; ctx.fillRect(0, 0, W, H);
  T(g.title, 480, 34, 24, "#fff", "center", true);
  if (g.preview) T("Hover a card to compare, click to upgrade it", 480, 58, 13, "#9ab", "center");
  const cols = g.preview ? 6 : 8, s = .85, cw = 120 * s + 10, ch = 170 * s + 12;
  const x0 = g.preview ? 40 + cw / 2 : (W - cols * cw) / 2 + cw / 2, top = 100;
  const rows = Math.ceil(g.cards.length / cols), maxScroll = Math.max(0, rows * ch - 480);
  S.scroll = clamp(S.scroll, 0, maxScroll);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 70, W, 520); ctx.clip();
  let hoverCard = null;
  g.cards.forEach((c, i) => {
    const cx = x0 + (i % cols) * cw, cy = top + 85 * s + Math.floor(i / cols) * ch - S.scroll;
    if (cy < 0 || cy > H + 100) return;
    const inView = cy > 60 && cy < 600;
    const hv = inView && over(cx - 60 * s, cy - 85 * s, 120 * s, 170 * s);
    const picked = g.picked.includes(c);
    drawCard(c, cx, cy, hv ? s * 1.1 : s, { glow: picked });
    if (hv) { hoverCard = c; setTip(cardTips(c), cx + 70, cy - 60); }
    if (inView && g.n > 0) hit(cx - 60 * s, Math.max(70, cy - 85 * s), 120 * s, Math.min(170 * s, 590 - (cy - 85 * s)), () => gridPick(g, c, isChoose), { k: "g:" + i });
  });
  ctx.restore();
  if (g.preview === "upgrade" && hoverCard && canUpgrade(hoverCard)) {
    T("Before", 830, 100, 14, "#9ab", "center", true); drawCard(hoverCard, 830, 205, 1);
    T("After", 830, 330, 14, "#8dff95", "center", true); drawCard({ id: hoverCard.id, up: true }, 830, 435, 1);
  }
  if (maxScroll > 0) T("Scroll for more", 480, 598, 12, "#789", "center");
  if (g.n > 1 && g.picked.length === g.n) btn(420, 592, 120, 38, "Confirm", () => { if (isChoose) finishChoose(); else { const m = S.modal; S.modal = null; m.onDone(m.picked); } }, { bg: "#2a4a2a", bd: "#8aff9a" });
  if (g.cancel) btn(820, 592, 120, 38, g.n > 0 ? "Cancel" : "Close", () => { S.modal = null; });
}
function gridPick(g, c, isChoose) {
  if (g.n === 1) { g.picked = [c]; if (isChoose) finishChoose(); else { const m = S.modal; S.modal = null; m.onDone([c]); } return; }
  const k = g.picked.indexOf(c);
  if (k >= 0) g.picked.splice(k, 1); else if (g.picked.length < g.n) g.picked.push(c);
}

// ---------------------------------------------------------------- hub
function buyForge(it) {
  const lv = save.forge[it.key];
  if (lv >= it.max) return;
  const cost = it.cost(lv);
  if (save.bank < cost) { S.toast = { text: "Not enough Scrap", t: 1.6 }; return; }
  save.bank -= cost; save.forge[it.key]++; writeSave();
}
function startNewRun() {
  if (save.run && S.confirmAbandon <= 0) { S.confirmAbandon = 4; return; }
  if (save.run) { save.bank += save.run.scrap + oreScrapValue(save.run); save.run = null; writeSave(); }
  newRun();
  openPending();
}
function continueRun() {
  try {
    run = save.run; rng = makeRng(run.seed); rng.state = run.rngState;
    if (!run.map || !run.map.tiles || !run.deck || !run.ore) throw new Error("bad run");
  } catch (e) { run = null; save.run = null; writeSave(); return; }
  openPending();
}
function drawHub() {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1a1008"); g.addColorStop(1, "#080605"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); backdrop("bgHub", .45);
  T("THE FORGE", 40, 44, 34, "#ffb050", "left", true);
  T("Landfall — fight on foot toward the alien Home Base", 40, 76, 14, "#a89a8a");
  T(`Banked Scrap: ${save.bank}`, 920, 100, 20, "#ffe27a", "right", true);
  FORGE.forEach((it, i) => {
    const y = 116 + i * 74, lv = save.forge[it.key], maxed = lv >= it.max, cost = maxed ? 0 : it.cost(lv);
    rp(40, y, 590, 64, 10); ctx.fillStyle = "rgba(10,12,18,.72)"; ctx.fill(); ctx.strokeStyle = "rgba(255,176,80,.4)"; ctx.lineWidth = 1.5; ctx.stroke();
    T(it.name, 56, y + 20, 18, "#fff", "left", true);
    T(it.desc, 56, y + 44, 13, "#b8aa9a");
    T(`Lv ${lv}/${it.max}`, 450, y + 32, 14, "#ffd9a0", "right", true);
    btn(470, y + 12, 144, 40, maxed ? "Maxed" : `Buy · ${cost}`, () => buyForge(it), { off: maxed || save.bank < cost, size: 15, bd: "#ffb050" });
  });
  rp(660, 116, 260, 170, 10); ctx.fillStyle = "rgba(10,12,18,.72)"; ctx.fill();
  T("Stats", 676, 140, 18, "#fff", "left", true);
  T(`Runs: ${save.stats.runs}`, 676, 172, 15, "#d8d0c8"); T(`Wins: ${save.stats.wins}`, 676, 198, 15, "#d8d0c8");
  T(`Best zone: ${save.stats.bestZone || "-"}`, 676, 224, 15, "#d8d0c8");
  T(`Max HP: ${70 + 5 * save.forge.hp}`, 676, 250, 15, "#d8d0c8");
  if (save.run) btn(660, 310, 260, 54, "Continue Run", continueRun, { bg: "#2a4a2a", hi: "#3f7040", bd: "#8aff9a", size: 20 });
  btn(660, save.run ? 380 : 310, 260, 54, "Make Landfall", startNewRun, { bg: "#4a2a14", hi: "#7a4420", bd: "#ffb050", size: 20 });
  if (S.confirmAbandon > 0) T("Abandon current run? Click again", 790, save.run ? 452 : 382, 13, "#ff9a8a", "center", true);
  if (S.toast) T(S.toast.text, 480, 600, 18, "#ff9a8a", "center", true);
}

// ---------------------------------------------------------------- ore hud / dig map
function oreHud(x, y) {
  ORE_KEYS.forEach((k, i) => {
    const cx = x + i * 58;
    rp(cx, y - 11, 52, 22, 8); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fill(); ctx.strokeStyle = ORE[k].col; ctx.lineWidth = 2; ctx.stroke();
    if (!uiIcon(i, 2, cx + 12, y, 21)) { ctx.beginPath(); ctx.arc(cx + 12, y, 5.5, 0, TAU); ctx.fillStyle = ORE[k].col; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#0d0f14"; ctx.stroke(); }
    T(String(run.ore[k]), cx + 23, y + 1, 14, "#fff", "left", true);
    if (over(cx, y - 11, 52, 22)) setTip([{ t: `${ORE[k].n} ${run.ore[k]}`, d: k === "cu" ? "Common ore. Mined, dropped by enemies, and spent on cards and the Workbench." : k === "ag" ? "Uncommon ore. Found in silver veins and dropped by elites." : "Rare ore. Found in gold veins and dropped by bosses." }], cx + 30, y + 14);
  });
}
const MAP_ICON = { battle: 0, elite: 1, event: 2, camp: 3, trader: 4, cache: 5, cu: 6, ag: 7, au: 8, pod: 9, boss: 10 };
function drawTileIcon(c, cx, cy, r, alpha = 1) {
  const mi = MAP_ICON[c];
  if (mi !== undefined && artReady("mapIcons")) {
    const sz = r * 2.4; ctx.globalAlpha *= alpha;
    drawCell("mapIcons", mi % 6, (mi / 6) | 0, 128, 128, cx - sz / 2, cy - sz / 2, sz, sz);
    ctx.globalAlpha = 1; return;
  }
  const info = NODE_INFO[c]; if (!info) return;
  ctx.globalAlpha *= alpha; ctx.beginPath();
  if (ORE_KEYS.includes(c)) { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.lineTo(cx + Math.cos(a) * r * .72, cy + Math.sin(a) * r * .72); } ctx.closePath(); }
  else if (c === "elite" || c === "boss") { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + Math.PI / 6; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); }
  else if (c === "event" || c === "cache") { ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); }
  else if (c === "camp" || c === "trader") ctx.rect(cx - r * .85, cy - r * .85, r * 1.7, r * 1.7);
  else ctx.arc(cx, cy, r, 0, TAU);
  ctx.fillStyle = info.col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14"; ctx.stroke();
  T(info.l || ORE[c].n.slice(0, 2), cx, cy + 1, ORE_KEYS.includes(c) ? r * .6 : r * .95, "#10141c", "center", true);
  ctx.globalAlpha = 1;
}
function mapHud() {
  const m = run.map;
  T(ZONES[run.zone - 1], 730, 40, 26, "#fff", "center", true);
  T("Dig toward the Sentinel's lair", 730, 64, 13, "rgba(255,255,255,.55)", "center");
  T(`HP ${run.hp}/${run.maxhp}`, 540, 100, 17, "#ff8a7a", "left", true);
  scrapText(660, 100, run.scrap);
  oreHud(540, 132);
  btn(826, 116, 100, 30, `Deck ${run.deck.length}`, openDeck, { size: 13, icon: [5, 2] });
  // hive alert
  const a = run.alert % 8;
  const hiveIc = uiIcon(4, 2, 552, 176, 24);
  T(`Hive Alert ${a} / 8`, hiveIc ? 568 : 540, 176, 15, "#ffb0a0", "left", true);
  if (run.ambushDue > 0) T("AMBUSH DUE", 926, 176, 14, Math.sin(S.time * 8) > 0 ? "#ff5a4a" : "#ffb0a0", "right", true);
  rp(540, 188, 386, 16, 6); ctx.fillStyle = "#2a1210"; ctx.fill();
  if (a > 0) { rp(540, 188, Math.max(10, 386 * a / 8), 16, 6); ctx.fillStyle = a >= 6 ? "#ff4a3a" : "#c8402e"; ctx.fill(); }
  ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 1.5; rp(540, 188, 386, 16, 6); ctx.stroke();
  if (over(540, 170, 386, 36)) setTip([{ t: "Hive Alert", d: "Every dig raises it. Each time it reaches a multiple of 8, an Ambush strikes on your next dig into plain dirt or an ore vein." }], 560, 214);
  drawRelicRow(526, 236);
  // legend
  T("Legend", 540, 276, 14, "#cfc6bb", "left", true);
  const leg = ["battle", "elite", "event", "camp", "trader", "cache", "cu", "ag", "au", "boss"];
  leg.forEach((c, i) => {
    const lx = 548 + (i % 2) * 200, ly = 306 + ((i / 2) | 0) * 34;
    drawTileIcon(c, lx + 12, ly, 13);
    T(NODE_INFO[c].n, lx + 32, ly + 1, 13, "#d8d0c8");
  });
  T("Move: click a tunnel tile, or arrows / WASD / D-pad.", 540, 474, 13, "#b8aa9a");
  T("Select an un-dug tile, then click it again or press A (Enter) to dig.", 540, 494, 13, "#b8aa9a");
  T("Bedrock can't be dug. The lair opens from the camp above it.", 540, 514, 13, "#b8aa9a");
  if (S.toast) { ctx.globalAlpha = clamp(S.toast.t, 0, 1); T(S.toast.text, 730, 560, 17, "#ffe27a", "center", true); ctx.globalAlpha = 1; }
}
function drawMap() {
  const tint = ZONE_TINT[run.zone - 1], m = run.map;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, tint[1]); g.addColorStop(1, tint[0]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  rp(GX - 6, GY - 6, MW * TILE + 12, MH * TILE + 12, 8); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fill();
  let hoverTile = null;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tileAt(x, y), px = GX + x * TILE, py = GY + y * TILE, cx = px + TILE / 2, cy = py + TILE / 2, rev = isRevealed(x, y), h = hash(x * 31 + y * 17);
    if (t.k === "lair") continue;
    const tilesArt = artReady("tiles"), tv = hash(x * 31 + y * 17) < .5 ? 0 : 1;
    // tile sheet cells are 128x256 strips: use the middle square. 1-2 fog, 3-4 dirt, 5-6 tunnel, 7-8 bedrock
    if (tilesArt) ctx.drawImage(tilesArt, ((!rev ? 0 : t.k === "bedrock" ? 6 : t.dug ? 4 : 2) + tv) * 128, 64, 128, 128, px, py, TILE, TILE);
    if (tilesArt) {
      // fog is darkened and tunnels get a warm wash and a rim so the four tile states read at a glance
      if (!rev) { ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(px, py, TILE, TILE); }
      else if (t.dug && t.k !== "bedrock") { ctx.fillStyle = "rgba(210,130,60,.14)"; ctx.fillRect(px, py, TILE, TILE); ctx.strokeStyle = "rgba(0,0,0,.65)"; ctx.lineWidth = 2; ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6); }
    }
    if (!rev) {
      if (tilesArt) continue;
      ctx.fillStyle = `rgb(${26 + h * 14 | 0},${21 + h * 10 | 0},${19 + h * 8 | 0})`; ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = "rgba(255,255,255,.05)";
      for (let k = 0; k < 4; k++) ctx.fillRect(px + 6 + hash(x * 7 + y * 13 + k) * (TILE - 14), py + 6 + hash(x * 11 + y * 5 + k * 3) * (TILE - 14), 2, 2);
      continue;
    }
    if (tilesArt) { /* tile art already drawn */ }
    else if (t.k === "bedrock") {
      ctx.fillStyle = "#4a5260"; ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 6, py + TILE - 8); ctx.lineTo(px + TILE - 8, py + 6); ctx.moveTo(px + 6, py + TILE / 2); ctx.lineTo(px + TILE / 2, py + 6); ctx.stroke();
    } else if (t.dug) {
      ctx.fillStyle = "#1b120c"; ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 2; ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
    } else {
      ctx.fillStyle = `rgb(${118 + h * 16 | 0},${74 + h * 12 | 0},${42 + h * 8 | 0})`; ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(px + 1, py + TILE - 8, TILE - 2, 7);
    }
    const reopen = t.dug && t.c === "trader";
    if (t.c && t.k !== "bedrock") {
      const ia = t.used ? .4 : t.dug && !reopen ? .5 : 1, ar = artReady("mapIcons");
      if (ar) { ctx.globalAlpha = ia; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fillStyle = "rgba(12,7,4,.55)"; ctx.fill(); ctx.globalAlpha = 1; }
      drawTileIcon(t.c, cx, cy, ar ? 18 : 15, ia);
    }
    const can = canDig(x, y), reach = canReach(x, y), face = S.face && S.face.x === x && S.face.y === y;
    if (reach) {
      const pr = .5 + .5 * Math.sin(S.time * 5);
      ctx.strokeStyle = can ? `rgba(255,226,122,${.55 + pr * .45})` : "rgba(255,226,122,.28)"; ctx.lineWidth = can ? 2.5 : 1.5; ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
    }
    if (face && can) {
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
      ctx.beginPath(); ctx.arc(px + TILE - 12, py + 12, 9, 0, TAU); ctx.fillStyle = "#3aa04a"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14"; ctx.stroke();
      T("A", px + TILE - 12, py + 13, 12, "#fff", "center", true);
    }
    if (reach || t.dug) hit(px, py, TILE, TILE, () => clickTile(x, y));
    if (over(px, py, TILE, TILE)) hoverTile = { t, x, y, can, reach, reopen };
  }
  // start tile: the player's landed ship (Stage 5 sheet frame 1, cropped above the engine flames)
  const ship = artReady("ship");
  if (ship) { const sh = TILE * 1.6, sw = sh * 116 / 150; ctx.drawImage(ship, 0, 0, 116, 150, GX + 4.5 * TILE - sw / 2, GY + TILE - 2 - sh, sw, sh); }
  else drawTileIcon("pod", GX + 4 * TILE + TILE / 2, GY + TILE / 2, 20);
  if (over(GX + 4 * TILE, GY, TILE, TILE)) hoverTile = { ship: true, x: 4, y: 0 };
  // boss lair: always visible
  const lx = GX + 4 * TILE, ly = GY + 10 * TILE, lcx = lx + TILE / 2, lcy = ly + TILE / 2;
  const glow = ctx.createRadialGradient(lcx, lcy, 4, lcx, lcy, 52); glow.addColorStop(0, "rgba(255,90,40,.9)"); glow.addColorStop(1, "rgba(255,60,20,0)");
  ctx.fillStyle = glow; ctx.fillRect(lx - 30, ly - 30, TILE + 60, TILE + 40);
  if (!drawCell("mapIcons", 4, 1, 128, 128, lcx - TILE * .8, lcy - TILE * .8 - 4, TILE * 1.6, TILE * 1.6)) {
  ctx.fillStyle = "#2a0c08"; ctx.fillRect(lx + 1, ly + 1, TILE - 2, TILE - 2);
  ctx.beginPath(); ctx.ellipse(lcx, lcy, 22, 20 + Math.sin(S.time * 3) * 1.5, 0, 0, TAU); ctx.fillStyle = "#ff5a2a"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#0d0f14"; ctx.stroke();
  ctx.fillStyle = "#2a0c08"; ctx.beginPath(); ctx.ellipse(lcx, lcy + 2, 13, 11, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = "#ffe8c0"; for (let k = 0; k < 5; k++) { const tx = lcx - 12 + k * 6; ctx.beginPath(); ctx.moveTo(tx, lcy - 8); ctx.lineTo(tx + 3, lcy - 8); ctx.lineTo(tx + 1.5, lcy - 1); ctx.fill(); }
  }
  T(ENEMIES.sentinel.n, lcx, ly + TILE + 14, 13, "#ff9a7a", "center", true);
  if (canReach(4, 10)) {
    ctx.strokeStyle = `rgba(255,226,122,${canDig(4, 10) ? .6 + .4 * Math.sin(S.time * 5) : .3})`; ctx.lineWidth = 3; ctx.strokeRect(lx + 2, ly + 2, TILE - 4, TILE - 4);
    hit(lx, ly, TILE, TILE, () => clickTile(4, 10));
    if (S.face && S.face.x === 4 && S.face.y === 10 && canDig(4, 10)) { ctx.beginPath(); ctx.arc(lx + TILE - 12, ly + 12, 9, 0, TAU); ctx.fillStyle = "#3aa04a"; ctx.fill(); T("A", lx + TILE - 12, ly + 13, 12, "#fff", "center", true); }
  }
  if (over(lx, ly, TILE, TILE)) hoverTile = { t: tileAt(4, 10), x: 4, y: 10, can: canDig(4, 10), reach: canReach(4, 10), lair: true };
  // player token
  let tx = run.map.px, ty = run.map.py;
  if (S.dig) { const k = ease(clamp(S.dig.t / (S.dig.dur || .2), 0, 1)); tx = lerp(S.dig.from.x, S.dig.to.x, k); ty = lerp(S.dig.from.y, S.dig.to.y, k); }
  const kx = GX + tx * TILE + TILE / 2, ky = GY + ty * TILE + TILE / 2;
  // miner idle pose, feet near the tile bottom (cell feet sit at y≈455 of 512)
  const ms = .115;
  if (!drawCell("miner", 0, 0, 384, 512, kx - 192 * ms, ky + 22 - 455 * ms, 384 * ms, 512 * ms)) {
    ctx.fillStyle = "#e0902a"; ctx.fillRect(kx - 8, ky - 2, 16, 15); ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 2; ctx.strokeRect(kx - 8, ky - 2, 16, 15);
    ctx.beginPath(); ctx.arc(kx, ky - 7, 9, 0, TAU); ctx.fillStyle = "#e8eef5"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1a3a5a"; ctx.beginPath(); ctx.ellipse(kx + 3, ky - 7, 5, 4, 0, 0, TAU); ctx.fill();
  }
  for (const f of S.mfloats) { ctx.globalAlpha = clamp(1.2 - f.t, 0, 1); T(f.text, f.x, f.y - 10 - f.t * 36, 16, f.col, "center", true); ctx.globalAlpha = 1; }
  if (hoverTile) {
    const ht = hoverTile, rev = isRevealed(ht.x, ht.y);
    if (ht.ship) setTip([{ t: "Your Ship", d: "Your landing site. Dig down from here toward the Sentinel's lair." }], GX + ht.x * TILE + TILE + 6, GY + ht.y * TILE);
    else if (rev) {
      const name = ht.lair ? ENEMIES.sentinel.n + " (Boss)" : ht.t.k === "bedrock" ? "Bedrock" : ht.t.c ? NODE_INFO[ht.t.c].n : "Dirt";
      const d = ht.can ? "Click to select, click again (or press A) to dig." : ht.reach ? "Click to walk over and select it." : ht.reopen ? "Click to walk over and trade." : ht.t.k === "bedrock" ? "Can't be dug." : ht.t.dug ? (ht.t.used ? "Used. Click to walk here." : "Click to walk here.") : ht.lair ? "Dig the camp tile above it first." : "Not next to a tunnel.";
      setTip([{ t: name, d }], GX + ht.x * TILE + TILE + 6, GY + ht.y * TILE);
    }
  }
  mapHud();
}

// ---------------------------------------------------------------- reward / camp / trader / event / cache / end
function panelBg(c0 = "#1a1410", c1 = "#0b0908", bgKey, dark = .45) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); if (bgKey) backdrop(bgKey, dark); }
function oreGainText(o, cx, y) {
  const parts = ORE_KEYS.filter(k => o && o[k]).map(k => ({ s: `+${o[k]} ${ORE[k].n}`, col: ORE[k].col }));
  if (!parts.length) return;
  ctx.font = `bold 16px ${FONT}`;
  const widths = parts.map(p => ctx.measureText(p.s).width), tot = widths.reduce((a, b) => a + b, 0) + (parts.length - 1) * 18;
  let x = cx - tot / 2;
  parts.forEach((p, i) => { T(p.s, x, y, 16, p.col, "left", true); x += widths[i] + 18; });
}
function drawReward() {
  const p = run.pending; panelBg("#1a1810", "#0b0a08", "bg" + run.zone, .55);
  if (p.locker) {
    T("Relic Locker", 480, 70, 32, "#ffb050", "center", true); T("Choose 1 relic to start the run with", 480, 106, 15, "#b8aa9a", "center");
    p.relicChoices.forEach((id, i) => {
      const x = 200 + i * 280, y = 300;
      rp(x - 120, y - 110, 240, 220, 12); ctx.fillStyle = over(x - 120, y - 110, 240, 220) ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.07)"; ctx.fill(); ctx.strokeStyle = "#ffb050"; ctx.stroke();
      drawRelic(id, x, y - 50, 32, false);
      T(RELICS[id].n, x, y + 10, 18, "#fff", "center", true);
      ctx.font = `13px ${FONT}`; wrap(RELICS[id].d, 210).forEach((l, k) => T(l, x, y + 40 + k * 17, 13, "#cfc6bb", "center"));
      hit(x - 120, y - 110, 240, 220, () => { grantRelic(id); run.pending = null; saveRun(); S.screen = "map"; });
    });
    return;
  }
  T(p.ambush ? "Ambush Survived" : "Battle Won", 480, 80, 32, "#8dff95", "center", true);
  T(`+${p.scrap} Scrap`, 480, 114, 20, "#ffe27a", "center", true);
  oreGainText(p.ore, 480, 140);
  if (p.relic) { drawRelic(p.relic, 360, 172, 18); T(`Relic gained: ${RELICS[p.relic].n}`, 390, 172, 16, "#d8c8ff", "left", true); }
  mapHud2();
  if (p.ambush) { btn(380, 300, 200, 52, "Continue", () => completeNode(), { size: 18 }); return; }
  T("Choose a card", 480, 208, 18, "#fff", "center", true);
  const n = p.cards.length, sp = 160, x0 = 480 - sp * (n - 1) / 2;
  let hovTip = null;
  p.cards.forEach((id, i) => {
    const card = { id, up: false }, x = x0 + i * sp, y = 350, hv = over(x - 72, y - 102, 144, 204);
    drawCard(card, x, y - (hv ? 10 : 0), hv ? 1.3 : 1.2);
    if (hv) hovTip = [card, x + 90, y - 60];
    hit(x - 72, y - 102, 144, 204, () => { addCard(id); completeNode(); });
  });
  if (hovTip) setTip(cardTips(hovTip[0]), hovTip[1], hovTip[2]);
  btn(380, 540, 200, 48, "Skip", () => completeNode(), { size: 18 });
}
function mapHud2() { T(`HP ${run.hp}/${run.maxhp}`, 14, 20, 17, "#ff8a7a", "left", true); scrapText(150, 20, run.scrap); oreHud(280, 20); drawRelicRow(14, 56); btn(806, 10, 92, 28, `Deck ${run.deck.length}`, openDeck, { size: 13, icon: [5, 2] }); }
function drawCamp() {
  panelBg("#10200f", "#070c06", "bgCamp", .35);
  T("Field Camp", 480, 70, 34, "#8dff95", "center", true);
  T("Rest, or spend ore at the Workbench. Not both.", 480, 108, 15, "#a8c8a0", "center");
  const big = (x, title, sub, fn, off) => {
    rp(x, 190, 300, 240, 14); ctx.fillStyle = over(x, 190, 300, 240) && !off ? "rgba(255,255,255,.15)" : "rgba(8,14,10,.68)"; ctx.fill(); ctx.strokeStyle = off ? "#445" : "#8aff9a"; ctx.lineWidth = 2; ctx.stroke();
    T(title, x + 150, 270, 30, off ? "#778" : "#fff", "center", true);
    ctx.font = `15px ${FONT}`; wrap(sub, 250).forEach((l, i) => T(l, x + 150, 320 + i * 20, 15, "#b8d0b0", "center"));
    if (!off) hit(x, 190, 300, 240, fn);
  };
  const heal = Math.ceil(run.maxhp * .3);
  big(130, "Rest", `Heal ${heal} HP (30% of max)`, () => { const h = Math.min(heal, run.maxhp - run.hp); run.hp += h; S.toast = { text: `Rested: +${h} HP`, t: 2.5 }; completeNode(); });
  big(530, "Workbench", "Upgrade a card (3 Copper) or fuse two cards into one with ore.", () => { run.pending = { screen: "bench" }; S.bench = { sel: [] }; S.scroll = 0; S.screen = "bench"; saveRun(); });
  mapHud2();
}

// ---------------------------------------------------------------- workbench
const fuseCost = (a, b) => { const r = Math.max(RAR_RANK[D(a).r], RAR_RANK[D(b).r]); return r <= 1 ? { cu: 4 } : r === 2 ? { cu: 2, ag: 1 } : { ag: 2, au: 1 }; };
const canAffordOre = cost => ORE_KEYS.every(k => !cost[k] || run.ore[k] >= cost[k]);
const oreCostText = cost => ORE_KEYS.filter(k => cost[k]).map(k => `${cost[k]} ${ORE[k].n}`).join(" + ");
function drawBench() {
  panelBg("#1a1208", "#0a0705", "bgBench", .4);
  const B = S.bench, sel = B.sel.filter(c => run.deck.includes(c));
  B.sel = sel;
  T("Workbench", 30, 30, 26, "#ffb050", "left", true);
  oreHud(190, 30);
  const cards = run.deck.slice().sort((a, b) => FAM_ORDER.indexOf(D(a).f) - FAM_ORDER.indexOf(D(b).f) || RAR_RANK[D(a).r] - RAR_RANK[D(b).r] || D(a).n.localeCompare(D(b).n));
  const cols = 5, s = .78, cw = 120 * s + 8, ch = 170 * s + 10, x0 = 22 + cw / 2, top = 70;
  const rows = Math.ceil(cards.length / cols), maxScroll = Math.max(0, rows * ch - 520);
  S.scroll = clamp(S.scroll, 0, maxScroll);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 60, 548, 540); ctx.clip();
  let hov = null;
  cards.forEach((c, i) => {
    const cx = x0 + (i % cols) * cw, cy = top + 85 * s + Math.floor(i / cols) * ch - S.scroll;
    if (cy < -100 || cy > H + 100) return;
    const inView = cy > 55 && cy < 610, hv = inView && over(cx - 60 * s, cy - 85 * s, 120 * s, 170 * s);
    drawCard(c, cx, cy, hv ? s * 1.08 : s, { glow: sel.includes(c) });
    if (hv) { hov = [c, cx + 70, cy - 60]; }
    if (inView) hit(cx - 60 * s, Math.max(60, cy - 85 * s), 120 * s, Math.min(170 * s, 600 - (cy - 85 * s)), () => {
      const k = B.sel.indexOf(c);
      if (k >= 0) B.sel.splice(k, 1); else { B.sel.push(c); if (B.sel.length > 2) B.sel.shift(); }
    }, { k: "b:" + i });
  });
  ctx.restore();
  if (maxScroll > 0) T("Scroll for more", 285, 612, 12, "#789", "center");
  // right panel
  rp(562, 62, 380, 556, 12); ctx.fillStyle = "rgba(10,7,4,.68)"; ctx.fill();
  T("Select 1 card to upgrade, or 2 to fuse", 752, 84, 14, "#cfc6bb", "center");
  [0, 1].forEach(i => {
    const x = 650 + i * 150, y = 190;
    if (sel[i]) drawCard(sel[i], x, y, .85);
    else { ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 2; rp(x - 51, y - 72, 102, 144, 8); ctx.stroke(); ctx.setLineDash([]); T(i ? "Slot B" : "Slot A", x, y, 14, "rgba(255,255,255,.4)", "center"); }
  });
  T("+", 725, 190, 30, "#ffb050", "center", true);
  const both = sel.length === 2, okFuse = both && sel.every(isFusable);
  let result = null, fcost = null;
  if (okFuse) { result = { fuse: [{ id: sel[0].id, up: sel[0].up }, { id: sel[1].id, up: sel[1].up }] }; fcost = fuseCost(sel[0], sel[1]); }
  T("Result", 752, 292, 13, "#9ab", "center", true);
  if (result) drawCard(result, 752, 390, .85); else { ctx.setLineDash([6, 5]); ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.lineWidth = 2; rp(752 - 51, 390 - 72, 102, 144, 8); ctx.stroke(); ctx.setLineDash([]); }
  let msg = "";
  if (both && !okFuse) msg = "Powers, Status and fused cards can't be fused.";
  else if (okFuse) msg = `Fuse cost: ${oreCostText(fcost)}`;
  else if (sel.length === 1) msg = canUpgrade(sel[0]) ? "Upgrade cost: 3 Copper" : "Already upgraded.";
  T(msg, 752, 484, 14, okFuse && !canAffordOre(fcost) ? "#ff8a7a" : "#ffe27a", "center", true);
  const canUp = sel.length === 1 && canUpgrade(sel[0]) && run.ore.cu >= 3;
  btn(574, 504, 172, 44, "Upgrade · 3 Cu", () => {
    run.ore.cu -= 3; upgradeCard(sel[0]); B.sel = []; saveRun(); S.toast = { text: "Card upgraded", t: 1.8 };
  }, { off: !canUp, size: 15, bd: "#8aff9a" });
  const canFu = okFuse && canAffordOre(fcost);
  btn(758, 504, 172, 44, "Fuse", () => {
    for (const k of ORE_KEYS) run.ore[k] -= fcost[k] || 0;
    for (const c of sel) run.deck.splice(run.deck.indexOf(c), 1);
    run.deck.push(result); B.sel = []; saveRun(); S.toast = { text: `Fused: ${D(result).n}`, t: 2.2 };
  }, { off: !canFu, size: 16, bd: "#ffb050" });
  btn(664, 560, 176, 44, "Done", () => completeNode(), { size: 17 });
  if (S.toast) { ctx.globalAlpha = clamp(S.toast.t, 0, 1); T(S.toast.text, 752, 628, 14, "#ffe27a", "center", true); ctx.globalAlpha = 1; }
  if (hov) setTip(cardTips(hov[0]), hov[1], hov[2]);
}

function drawTrader() {
  const p = traderStock(); panelBg("#1a1608", "#0a0904", "bgTrader", .4);
  T("Salvage Trader", 480, 66, 30, "#ffe27a", "center", true);
  let hovTip = null;
  p.cards.forEach((c, i) => {
    const x = 130 + i * 175, y = 190, hv = over(x - 62, y - 88, 124, 176) && !c.sold, afford = run.scrap >= c.price;
    if (!c.sold) drawCard(c, x, y - (hv ? 6 : 0), hv ? 1.1 : 1); else { ctx.globalAlpha = .25; drawCard(c, x, y, 1); ctx.globalAlpha = 1; T("SOLD", x, y, 22, "#fff", "center", true); }
    if (!c.sold) { T(`${c.price} Scrap`, x, y + 108, 16, afford ? "#ffe27a" : "#ff7a6a", "center", true); hit(x - 62, y - 88, 124, 176, () => buyCard(c)); }
    if (hv) hovTip = [c, x + 80, y - 70];
  });
  T("Relics", 140, 322, 16, "#cfc6bb", "left", true);
  p.relics.forEach((r, i) => {
    const x = 180 + i * 190, y = 372, afford = run.scrap >= r.price;
    if (r.sold) { ctx.globalAlpha = .25; drawRelic(r.id, x, y, 26, false); ctx.globalAlpha = 1; T("SOLD", x, y, 14, "#fff", "center", true); return; }
    drawRelic(r.id, x, y, 26);
    T(RELICS[r.id].n, x, y + 38, 13, "#fff", "center", true);
    T(`${r.price} Scrap`, x, y + 56, 15, afford ? "#ffe27a" : "#ff7a6a", "center", true);
    hit(x - 26, y - 26, 52, 52, () => buyRelic(r));
  });
  // ore market
  T("Buy ore", 40, 470, 15, "#cfc6bb", "left", true);
  T("Sell ore", 40, 520, 15, "#cfc6bb", "left", true);
  ORE_KEYS.forEach((k, i) => {
    const bx = 130 + i * 175, left = p.ore[k];
    btn(bx, 452, 162, 36, `${ORE[k].n} · ${ORE[k].buy} (${left} left)`, () => {
      if (run.scrap < ORE[k].buy || p.ore[k] <= 0) return;
      run.scrap -= ORE[k].buy; p.ore[k]--; run.ore[k]++; saveRun();
    }, { off: left <= 0 || run.scrap < ORE[k].buy, size: 13, bd: ORE[k].col });
    btn(bx, 502, 162, 36, `${ORE[k].n} · +${ORE[k].sell} (have ${run.ore[k]})`, () => {
      if (run.ore[k] <= 0) return;
      run.ore[k]--; run.scrap += ORE[k].sell; saveRun();
    }, { off: run.ore[k] <= 0, size: 13, bd: ORE[k].col });
  });
  const rc = 75 + 25 * run.removals;
  btn(600, 340, 300, 56, `Remove a card · ${rc} Scrap`, () => openModal({
    title: `Remove a card (${rc} Scrap)`, cards: run.deck, n: 1, cancel: true,
    onDone: ([c]) => { if (run.scrap < rc) return; run.scrap -= rc; run.removals++; run.deck.splice(run.deck.indexOf(c), 1); saveRun(); }
  }), { off: run.scrap < rc || run.deck.length < 2, size: 16, bd: "#ffe27a" });
  btn(680, 560, 220, 50, "Leave", () => completeNode(), { size: 18 });
  if (hovTip) setTip(cardTips(hovTip[0]), hovTip[1], hovTip[2]);
  if (S.toast) { ctx.globalAlpha = clamp(S.toast.t, 0, 1); T(S.toast.text, 480, 612, 16, "#ff9a8a", "center", true); ctx.globalAlpha = 1; }
  mapHud2();
}
function buyCard(c) { if (run.scrap < c.price) { S.toast = { text: "Not enough Scrap", t: 1.6 }; return; } run.scrap -= c.price; c.sold = true; addCard(c.id); saveRun(); }
function buyRelic(r) { if (run.scrap < r.price) { S.toast = { text: "Not enough Scrap", t: 1.6 }; return; } run.scrap -= r.price; r.sold = true; grantRelic(r.id); saveRun(); }
function drawEvent() {
  const p = run.pending, ev = EVENTS[p.id]; panelBg("#0e1424", "#06080f", "bgEvent", .4);
  const im = artReady("ev_" + ev.img), ty = im ? 408 : 190;
  if (im) {
    // illustration (960x400 scaled to 720x300) with the event title on a band across its bottom
    ctx.save(); rp(120, 76, 720, 300, 14); ctx.clip(); ctx.drawImage(im, 120, 76, 720, 300);
    const bg = ctx.createLinearGradient(0, 316, 0, 376); bg.addColorStop(0, "rgba(0,0,0,0)"); bg.addColorStop(1, "rgba(0,0,0,.8)"); ctx.fillStyle = bg; ctx.fillRect(120, 316, 720, 60);
    ctx.restore();
    rp(120, 76, 720, 300, 14); ctx.strokeStyle = "#9ac0ff"; ctx.lineWidth = 2; ctx.stroke();
    T(ev.title, 480, 352, 30, "#9ac0ff", "center", true);
  } else T(ev.title, 480, 100, 34, "#9ac0ff", "center", true);
  ctx.font = `17px ${FONT}`;
  wrap(p.res || ev.text, 700).forEach((l, i) => T(l, 480, ty + i * 24, 17, "#dfe6f2", "center"));
  if (p.res) btn(380, im ? 480 : 400, 200, 52, "Continue", () => completeNode(), { size: 18 });
  else ev.choices.forEach((c, i) => btn(180, (im ? 470 : 330) + i * (im ? 58 : 76), 600, im ? 50 : 58, c.label, () => {
    const r = c.fn();
    if (r != null) { p.res = r; saveRun(); }
  }, { size: 17, bd: "#9ac0ff" }));
  mapHud2();
}
function drawCache() {
  const p = run.pending; panelBg("#1a1024", "#0a060e", "bgEvent", .4);
  T("Relic Cache", 480, 90, 34, "#d8a8ff", "center", true);
  if (p.relic) {
    drawRelic(p.relic, 480, 220, 44);
    T(RELICS[p.relic].n, 480, 296, 24, "#fff", "center", true);
    ctx.font = `16px ${FONT}`; wrap(RELICS[p.relic].d, 460).forEach((l, i) => T(l, 480, 330 + i * 22, 16, "#d8d0e0", "center"));
  } else T("The cache is empty... +50 Scrap.", 480, 240, 18, "#d8d0e0", "center");
  btn(380, 450, 200, 52, "Continue", () => completeNode(), { size: 18 });
  mapHud2();
}
function drawRunEnd() {
  const e = S.end; panelBg(e.win ? "#10240f" : "#240f0f", "#060606");
  T(e.win ? "Landing Sentinel Down" : "Run Over", 480, 110, 44, e.win ? "#8dff95" : "#ff8a7a", "center", true);
  if (e.win) T("Victory! Zone 2 coming soon.", 480, 165, 22, "#ffe27a", "center", true);
  T(`Scrap kept: ${e.scrap}${e.win ? "   Victory bonus: +200" : ""}`, 480, 230, 18, "#ffe27a", "center", true);
  if (e.oreScrap > 0) {
    T(`Leftover ore smelted: +${e.oreScrap} Scrap`, 480, 262, 18, "#ffd9a0", "center", true);
    T(ORE_KEYS.filter(k => e.ore[k]).map(k => `${e.ore[k]} ${ORE[k].n} (${ORE[k].scrap} each)`).join("   "), 480, 288, 14, "#cfc6bb", "center");
  } else T("No leftover ore to smelt.", 480, 262, 15, "#9a9088", "center");
  T(`Scrap banked: ${e.gain}`, 480, 330, 22, "#ffe27a", "center", true);
  T(`Total banked: ${save.bank}`, 480, 362, 16, "#d8d0c8", "center");
  T(`Seed: ${e.seed}`, 480, 396, 18, "#9ab", "center", true);
  btn(360, 450, 240, 56, "Return to the Forge", () => { S.screen = "hub"; }, { size: 18 });
}

// ---------------------------------------------------------------- frame / input
function drawScene() {
  switch (S.screen) {
    case "hub": drawHub(); break;
    case "map": drawMap(); break;
    case "combat": if (C) drawCombat(); break;
    case "reward": drawReward(); break;
    case "camp": drawCamp(); break;
    case "bench": drawBench(); break;
    case "trader": drawTrader(); break;
    case "event": drawEvent(); break;
    case "cache": drawCache(); break;
    case "runEnd": drawRunEnd(); break;
  }
}
function draw() {
  prevHits = hits; hits = []; tip = null; hitsOff = false;
  // a new screen / overlay starts with fresh focus
  const fscr = S.screen + (S.modal ? "m" : "") + (C && C.choose ? "c" : "");
  if (S.focusScreen !== fscr) { S.focusScreen = fscr; S.focusKey = null; S.fpt = null; }
  const padNav = S.padMode && !(S.screen === "map" && !S.modal);
  if (padNav && S.fpt) { M.x = S.fpt.x; M.y = S.fpt.y; }
  const chooseG = S.screen === "combat" && C && C.choose ? { title: C.choose.title, cards: C.choose.cards, n: C.choose.n, picked: C.choose.picked, cancel: false } : null;
  const grid = chooseG || S.modal;
  hitsOff = !!grid;
  ctx.clearRect(0, 0, W, H);
  drawScene();
  hitsOff = false;
  if (grid) { tip = null; drawGrid(grid, !!chooseG); }
  if (padNav) {
    const cur = resolveFocus(focusables(hits));
    if (cur) {
      setFocus(cur);
      const r = cur.fr || cur;
      ctx.save(); ctx.strokeStyle = `rgba(255,226,122,${.65 + .35 * Math.sin(S.time * 6)})`; ctx.lineWidth = 3; rp(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 10); ctx.stroke(); ctx.restore();
    }
  }
  drawTip();
  canvas.style.cursor = hits.some(h => M.x >= h.x && M.x <= h.x + h.w && M.y >= h.y && M.y <= h.y + h.h && !(h.w === W && h.h === 470)) ? "pointer" : "default";
}
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  S.time += dt;
  if (S.toast) { S.toast.t -= dt; if (S.toast.t <= 0) S.toast = null; }
  if (S.confirmAbandon > 0) S.confirmAbandon -= dt;
  updateMap(dt); pollPad(dt);
  if (S.screen === "combat" && C) updateCombat(dt);
  draw();
  requestAnimationFrame(frame);
}
function mouseXY(e) { S.padMode = false; const r = canvas.getBoundingClientRect(); M.x = (e.clientX - r.left) * W / r.width; M.y = (e.clientY - r.top) * H / r.height; }
canvas.addEventListener("mousemove", mouseXY);
canvas.addEventListener("click", e => {
  mouseXY(e);
  for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (M.x >= h.x && M.x <= h.x + h.w && M.y >= h.y && M.y <= h.y + h.h) { h.fn(); return; } }
});
canvas.addEventListener("contextmenu", e => { e.preventDefault(); if (C && S.screen === "combat") C.sel = -1; });
canvas.addEventListener("wheel", e => { if (S.modal || (C && C.choose) || S.screen === "bench") { S.scroll += e.deltaY * .6; e.preventDefault(); } }, { passive: false });
window.addEventListener("keydown", e => {
  if (e.key === "Escape") { if (S.modal && S.modal.cancel) S.modal = null; else if (C) C.sel = -1; return; }
  if (S.screen === "map" && run && !S.modal) {
    const dirs = { ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], d: [1, 0], D: [1, 0], ArrowUp: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], s: [0, 1], S: [0, 1] };
    if (dirs[e.key]) { e.preventDefault(); moveDir(...dirs[e.key]); return; }
    if (e.key === "Enter" || e.key === " " || e.key === "f" || e.key === "F") { e.preventDefault(); confirmMap(); return; }
  }
  if (!(S.screen === "map" && run && !S.modal)) {
    const ad = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (ad[e.key]) { e.preventDefault(); padMove(...ad[e.key]); return; }
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); padA(); return; }
  }
  if (S.screen !== "combat" || !C || S.modal) return;
  if (e.key === "e" || e.key === "E") { endTurn(); return; }
  if (/^[0-9]$/.test(e.key)) { const i = e.key === "0" ? 9 : Number(e.key) - 1; if (i < C.hand.length) selectCard(i); }
});

// ---------------------------------------------------------------- boot
function bootFight(key) {
  newRun();
  const k = key.toLowerCase();
  let enc, kind = "battle";
  if (k.includes("sentinel")) { enc = ["sentinel"]; kind = "boss"; }
  else if (k.includes("drone")) { enc = ["droneA", "droneB"]; kind = "elite"; }
  else enc = key.split(",").filter(id => ENEMIES[id]);
  if (!enc || !enc.length) enc = ["crawler", "spitter"];
  run.pending = { screen: "combat", kind, enc }; run.cur = null;
  saveRun(); openPending();
}
if (save.run && !(save.run.map && save.run.map.tiles && save.run.ore)) { save.run = null; writeSave(); S.toast = { text: "Old run discarded after update", t: 6 }; }
if (params.has("fight")) bootFight(params.get("fight"));
requestAnimationFrame(frame);
window.__s6 = { get run() { return run; }, get C() { return C; }, S, CARDS, RELICS, ENEMIES, save, playCard, endTurn, canAct, finishChoose, costOf, padMove, padA, padB, digTile, canDig, canReach, clickTile, moveDir, confirmMap, updateMap, tileAt, openTrader, openPending, completeNode, draw, canPay, D, gainOre, step: dt => { S.time += dt; if (C) updateCombat(dt); updateMap(dt); pollPad(dt); } };
})();
