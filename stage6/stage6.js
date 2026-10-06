"use strict";
// Drift Miner — Stage 6 "Landfall": turn-based deckbuilder. Zones 1-2 are playable (the run ends at Thornback); Zone 3 is data still to come.
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
  mapAntidote: "assets/map-antidote.png", mapBeacon: "assets/map-beacon.png", mapOverrideKey: "assets/map-override-key.png", mapHiveMap: "assets/map-hive-map.png", // missing files fall back to canvas icons
  ev_probe: "assets/event-probe.png", ev_sporePool: "assets/event-sporePool.png", ev_mouse: "assets/event-mouse.png"
};
// enemies: key "e_<id>"; the Zone 2/3 files are registered now so Phase 2 picks them up
for (const id of ["crawler", "spitter", "worm", "drone", "sentinel", "sporeMother", "stalker", "leech", "broodKnight", "thornback", "puffcap", "bloomshade", "rotHound", "rotHulk", "sporeBat", "burrowGrub", "mycelidWeaver", "glowcap", "mireLurker", "bloomMatriarch", "hiveWorker", "acidSprayer", "larvaCluster", "hiveLarva", "sentryEye", "spineLancer", "swarmer", "mindLeech", "resinSpitter", "hiveOverseer", "gateJuggernaut", "hiveGuard", "psionicDrone", "mimic", "warden", "homeCore", "turret"]) ART_FILES["e_" + id] = `assets/enemy-${id}.png`;
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
  rad: { ico: [3, 0], l: "R", col: "#66cc55", n: "Radiation", d: "Lose HP equal to stacks at start of turn (ignores Block), then -1." },
  thorns: { l: "T", col: "#7fbf5a", n: "Thorns", d: "Whenever you hit this enemy with an attack, take N damage." },
  watch: { l: "Wa", col: "#e0607a", n: "Watch", d: "From your 4th card each turn, every card you play costs you N HP (ignores Block)." },
  plated: { l: "P", col: "#9aa4b8", n: "Plated", d: "Its Block doesn't expire.", nonum: 1 },
  shielded: { l: "Sh", col: "#5ad0ff", n: "Shielded", d: "Takes 50% damage while a Turret stands.", nonum: 1 }
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
// move: dmg+hits attack, block (self), allyBlock, str (self buff), apply {status:n} on player; also summon [ids], drain, addDisc {card:n},
// thornsTemp, perSpore (+dmg per Spore card held), heal, allyStr. def: thorns (passive), onDeath (move-shaped), overdrive (half-HP swap-in move)
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
  },
  // Zone 2: Spore Wilds
  sporeMother: { n: "Spore Mother", artScale: 1.4, hp: [40, 44], shape: "blob", col: "#7a9a4a", w: 110, h: 100, moves: [{ n: "Spawn", summon: ["crawler"] }, { n: "Lash", dmg: 10 }] },
  stalker: { n: "Stalker", artScale: 1.4, hp: [36, 40], shape: "spiky", col: "#8a5a9a", w: 100, h: 90, moves: [{ n: "Stalk", str: 3, block: 6 }, { n: "Pounce", dmg: 8 }] },
  leech: { n: "Leech", artScale: 1.4, hp: [26, 30], shape: "worm", col: "#9a4a5a", w: 90, h: 70, moves: [{ n: "Drain", dmg: 7, drain: 1 }, { n: "Latch", apply: { weak: 2 } }] },
  broodKnight: {
    n: "Brood Knight", artScale: 1.25, hp: [90, 90], shape: "spiky", col: "#6a7a8a", w: 140, h: 130,
    moves: [{ n: "Shield Bash", dmg: 12, block: 8 }, { n: "Rally", str: 2 }, { n: "Cleave", dmg: 20 }],
    overdrive: { n: "Call the Brood", summon: ["crawler", "crawler"], banner: "The Brood answers!" }
  },
  thornback: {
    n: "Thornback", hp: [220, 220], shape: "boss", col: "#5a7a3a", w: 200, h: 170, boss: 1, thorns: 3,
    moves: [{ n: "Spike Volley", dmg: 5, hits: 4 }, { n: "Spore Cloud", addDisc: { spore: 2 } }, { n: "Curl", block: 30, thornsTemp: 2 }, { n: "Crush", dmg: 28 }]
  },
  puffcap: { n: "Puffcap", hp: [16, 20], shape: "mushroom", col: "#4fb3a0", w: 70, h: 60, moves: [{ n: "Spore Puff", addDisc: { spore: 1 } }, { n: "Headbutt", dmg: 6 }], onDeath: { n: "Burst", addDisc: { spore: 1 } } },
  bloomshade: { n: "Bloomshade", fly: 1, hp: [26, 30], shape: "bloom", col: "#d05aa8", w: 90, h: 100, moves: [{ n: "Pollen", apply: { vuln: 2 } }, { n: "Choke", dmg: 4, perSpore: 2 }] },
  rotHound: { n: "Rot Hound", hp: [30, 34], shape: "hound", col: "#6f7a3a", w: 110, h: 70, moves: [{ n: "Maul", dmg: 7, hits: 2 }, { n: "Lick Wounds", heal: 8, block: 5 }] },
  rotHulk: { n: "Rot Hulk", hp: [100, 100], shape: "hulk", col: "#5a6a3a", w: 150, h: 140, moves: [{ n: "Fungal Slam", dmg: 18 }, { n: "Rot Spray", addDisc: { spore: 2 }, apply: { weak: 2 } }, { n: "Regrow", heal: 15, block: 10 }] },
  sporeBat: { n: "Spore Bat", fly: 1, hp: [14, 18], shape: "bat", col: "#6a5a8a", w: 70, h: 56, moves: [{ n: "Screech", apply: { weak: 1 } }, { n: "Swoop", dmg: 4, hits: 2 }] },
  burrowGrub: { n: "Burrow Grub", hp: [24, 28], shape: "grub", col: "#c8b48a", w: 110, h: 70, thorns: 1, moves: [{ n: "Harden", block: 12 }, { n: "Gnaw", dmg: 9 }] },
  mycelidWeaver: { n: "Mycelid Weaver", hp: [28, 32], shape: "weaver", col: "#8a9a6a", w: 110, h: 90, moves: [{ n: "Knit", allyBlock: 8 }, { n: "Spore Lash", dmg: 6, addDisc: { spore: 1 } }] },
  glowcap: { n: "Glowcap Shaman", hp: [30, 34], shape: "shaman", col: "#4a3a5a", w: 70, h: 100, moves: [{ n: "Blessing", allyStr: 2 }, { n: "Spark", dmg: 5, apply: { rad: 2 } }] },
  mireLurker: { n: "Mire Lurker", hp: [44, 48], shape: "lurker", col: "#3e5a4a", w: 150, h: 70, moves: [{ n: "Submerge", block: 14 }, { n: "Ambush Bite", dmg: 16 }, { n: "Drag", dmg: 6, apply: { vuln: 1 } }] },
  bloomMatriarch: {
    n: "Bloom Matriarch", hp: [95, 95], shape: "matriarch", col: "#b0306a", w: 150, h: 150,
    moves: [{ n: "Pollen Storm", apply: { weak: 2, vuln: 2 } }, { n: "Strangle", dmg: 8, perSpore: 3 }, { n: "Overgrow", heal: 12, allyBlock: 10 }],
    overdrive: { n: "Seed the Wind", summon: ["bloomshade"], banner: "The Matriarch blooms!" }
  },
  // Zone 3: Hive Gate
  hiveGuard: { n: "Hive Guard", artScale: 1.4, hp: [50, 50], shape: "spiky", col: "#7a5a9a", w: 100, h: 75, moves: [{ n: "Guard", allBlock: 12 }, { n: "Spear", dmg: 14 }] },
  psionicDrone: { n: "Psionic Drone", fly: 1, artScale: 1.3, hp: [32, 32], shape: "drone", col: "#a07ad8", w: 90, h: 90, moves: [{ n: "Static", apply: { weak: 2, vuln: 2 } }, { n: "Spike", dmg: 10 }] },
  mimic: { n: "Mimic", artScale: 1.4, hp: [45, 45], shape: "blob", col: "#8a6a3a", w: 100, h: 80, moves: [{ n: "Reflect", reflect: 20 }, { n: "Bite", dmg: 13 }] },
  warden: { n: "Warden", artScale: 1.2, hp: [70, 70], shape: "spiky", col: "#5a6a8a", w: 120, h: 110, bond: { str: 5, heal: 20, banner: "The Warden avenges its twin!" }, moves: [{ n: "Hammer", dmg: 15 }, { n: "Ward", allBlock: 15 }] },
  hiveWorker: { n: "Hive Worker", artScale: 1.25, hp: [20, 24], shape: "worker", col: "#8a6a9a", w: 90, h: 70, moves: [{ n: "Repair", healAlly: 8 }, { n: "Pinch", dmg: 6 }] },
  acidSprayer: { n: "Acid Sprayer", artScale: 1.4, hp: [28, 32], shape: "sprayer", col: "#5a8a5a", w: 100, h: 70, moves: [{ n: "Acid Jet", dmg: 6, apply: { vuln: 1 } }, { n: "Melt Armor", breakBlock: 1, dmg: 8 }] },
  larvaCluster: { n: "Larva Cluster", artScale: 1.15, hp: [20, 22], shape: "larvaCluster", col: "#d8c8a8", w: 100, h: 80, moves: [{ n: "Pulse", block: 5 }, { n: "Pulse", block: 5 }, { n: "Hatch", summon: ["hiveLarva", "hiveLarva"], selfDestruct: 1 }] },
  hiveLarva: { n: "Hive Larva", artScale: 1.2, hp: [8, 10], shape: "larva", col: "#e0d0b0", w: 50, h: 40, moves: [{ n: "Nibble", dmg: 3, hits: 2 }] },
  sentryEye: { n: "Sentry Eye", artScale: 1.1, fly: 1, hp: [30, 34], shape: "eye", col: "#c8c0d8", w: 90, h: 90, watch: 3, moves: [{ n: "Focus", block: 8 }, { n: "Glare", dmg: 9 }] },
  spineLancer: { n: "Spine Lancer", hp: [34, 38], shape: "lancer", col: "#6a4a7a", w: 90, h: 120, moves: [{ n: "Wind Up", charging: 1 }, { n: "Impale", dmg: 24 }] },
  swarmer: { n: "Hive Swarmer", artScale: 1.2, hp: [10, 12], shape: "swarmer", col: "#9a5a7a", w: 50, h: 50, moves: [{ n: "Bite", dmg: 4 }], onDeath: { n: "Frenzy", allyStr: 1 } },
  mindLeech: { n: "Mind Leech", artScale: 1.3, hp: [24, 28], shape: "mindLeech", col: "#7a4aa0", w: 90, h: 70, moves: [{ n: "Siphon", dmg: 6, drain: 1 }, { n: "Mind Fog", apply: { weak: 2 }, block: 6 }] },
  resinSpitter: { n: "Resin Spitter", artScale: 1.2, hp: [26, 30], shape: "resin", col: "#c88a3a", w: 90, h: 80, moves: [{ n: "Gum Up", drainEnergy: 1 }, { n: "Spit", dmg: 8 }] },
  hiveOverseer: { n: "Hive Overseer", hp: [110, 110], shape: "overseer", col: "#4a2a5a", w: 140, h: 160, moves: [{ n: "Summon Workers", summon: ["hiveWorker", "hiveWorker"] }, { n: "Psi Lash", dmg: 10, apply: { weak: 2 } }, { n: "Command", allyStr: 2, allBlock: 8 }] },
  gateJuggernaut: { n: "Gate Juggernaut", artScale: 1.1, hp: [120, 120], shape: "juggernaut", col: "#3a3a4a", w: 170, h: 140, keepBlock: 1, moves: [{ n: "Plate Up", block: 15 }, { n: "Ram", dmg: 20 }, { n: "Grind", dmg: 6, hits: 3 }] },
  turret: { n: "Turret", artScale: .9, hp: [40, 40], shape: "spiky", col: "#6a7080", w: 80, h: 90, noLoot: 1, moves: [{ n: "Laser", dmg: 8 }] },
  homeCore: {
    n: "Home Base Core", hp: [300, 300], shape: "boss", col: "#7a4aa0", w: 220, h: 200, artScale: .85, boss: 1, noLoot: 1, shieldedBy: "turret", endsFight: 1,
    phases: [
      { at: 300, moves: [{ n: "Charging", charging: 1 }, { n: "Beam", dmg: 30 }] },
      { at: 200, moves: [{ n: "Pulse", dmg: 6, apply: { rad: 3 } }], banner: "Core breach: Phase 2", summon: ["hiveGuard", "hiveGuard"] },
      { at: 100, moves: [{ n: "Hammer", dmg: 15 }, { n: "Barrage", dmg: 5, hits: 2 }], banner: "Core critical: Phase 3", turnStr: 2 }
    ]
  }
};
const ENC = {
  z1: {
    easy: [["crawler", "crawler"], ["spitter"], ["crawler", "spitter"]],
    normal: [["crawler", "crawler", "crawler"], ["worm", "crawler"], ["spitter", "spitter"], ["worm", "spitter"]],
    elite: [["droneA", "droneB"]],
    boss: [["sentinel"]]
  },
  z2: {
    easy: [["stalker"], ["leech", "crawler"], ["puffcap", "puffcap"], ["bloomshade"], ["sporeBat", "sporeBat"], ["burrowGrub"]],
    normal: [["sporeMother"], ["stalker", "leech"], ["leech", "leech"], ["stalker", "crawler", "crawler"], ["sporeMother", "crawler"],
      ["rotHound", "puffcap"], ["bloomshade", "puffcap", "puffcap"], ["rotHound", "bloomshade"],
      ["mireLurker"], ["mycelidWeaver", "rotHound"], ["glowcap", "stalker"], ["glowcap", "puffcap", "puffcap"],
      ["sporeBat", "sporeBat", "bloomshade"], ["mycelidWeaver", "burrowGrub"]],
    elite: [["broodKnight"], ["rotHulk"], ["bloomMatriarch"]],
    boss: [["thornback"]]
  },
  z3: {
    easy: [["hiveGuard"], ["psionicDrone", "swarmer", "swarmer"], ["hiveWorker", "acidSprayer"], ["larvaCluster"], ["swarmer", "swarmer", "swarmer"]],
    normal: [["hiveGuard", "psionicDrone"], ["mimic"], ["mimic", "hiveWorker"], ["spineLancer", "hiveWorker"], ["sentryEye", "acidSprayer"],
      ["resinSpitter", "hiveGuard"], ["mindLeech", "mindLeech"], ["larvaCluster", "larvaCluster"], ["hiveGuard", "swarmer", "swarmer"],
      ["sentryEye", "spineLancer"], ["psionicDrone", "resinSpitter"]],
    elite: [["warden", "warden"], ["hiveOverseer"], ["gateJuggernaut"]],
    patrol: [["hiveGuard", "hiveGuard"], ["hiveGuard", "swarmer", "swarmer"], ["hiveGuard", "hiveWorker"]],
    boss: [["turret", "homeCore", "turret"]]
  }
};
const bossName = () => ENEMIES[ENC["z" + run.zone].boss[0].find(id => ENEMIES[id].boss)].n;
const ZONE_GOAL = ["Dig toward the Sentinel's lair", "Dig toward the Thornback's den", "Dig toward the Home Base Core"];
const ALWAYS = ["crawler", "hiveLarva"], ROSTER_SIZE = { 2: 7, 3: 7 };
// which monsters live on a Zone 2 / 3 map this time (seeded); the filtered lists are stored on the map as map.enc
function pickRoster(zone) {
  const z = ENC["z" + zone], ids = [...new Set([...z.easy, ...z.normal].flat())].filter(id => !ALWAYS.includes(id));
  const ok = (list, set) => list.filter(enc => enc.every(id => set.has(id) || ALWAYS.includes(id)));
  let easy = z.easy, normal = z.normal;
  for (let i = 0; i < 50; i++) {
    const set = new Set(shuffle(ids.slice()).slice(0, ROSTER_SIZE[zone])), e = ok(z.easy, set), n = ok(z.normal, set);
    if (e.length >= 2 && n.length >= 3) { easy = e; normal = n; break; }
  }
  return { easy, normal, elite: shuffle(z.elite.slice()).slice(0, 2) };
}
const sightings = enc => [...new Set([...enc.easy, ...enc.normal, ...enc.elite].flat())].filter(id => !ALWAYS.includes(id)).map(id => ENEMIES[id].n).sort();
const NODE_INFO = {
  battle: { n: "Battle", l: "B", col: "#d05a4a" }, elite: { n: "Elite Battle", l: "E", col: "#e0a030" }, boss: { n: "Boss", l: "!", col: "#e03030" },
  event: { n: "Event", l: "?", col: "#5aa7ff" }, camp: { n: "Field Camp", l: "C", col: "#58b447" }, trader: { n: "Salvage Trader", l: "$", col: "#e0c040" },
  cache: { n: "Relic Cache", l: "R", col: "#b070e0" }, antidote: { n: "Spore Antidote", l: "+", col: "#7affc0" },
  beacon: { n: "Psionic Beacon", l: "*", col: "#9a7aff" }, overrideKey: { n: "Override Key", l: "K", col: "#ffcf4a" }, hiveMap: { n: "Hive Map", l: "M", col: "#5ad0ff" },
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
  run = { seed, rngState: 0, zone: 1, map: null, cur: null, hp: maxhp, maxhp, deck, relics: [], scrap: 50 * f.supply, removals: 0, pending: null, alert: 0, ambushDue: 0, shipRest: false, antidote: false, ore: { cu: 2 * f.satchel, ag: 0, au: 0 } };
  if (params.has("ore")) { const n = Math.max(0, Number(params.get("ore")) || 0); run.ore = { cu: n, ag: n, au: n }; }
  if (params.get("relics") === "all") run.relics = RELIC_IDS.slice();
  run.map = genDigMap(1);
  save.stats.runs++;
  if (f.relicLocker && params.get("relics") !== "all") {
    const pool = shuffle(RELIC_IDS.slice()).slice(0, 3);
    run.pending = { screen: "reward", locker: true, scrap: 0, cards: [], relicChoices: pool };
  }
  if (params.get("bench") === "1") run.pending = { screen: "bench" };
  const zp = Number(params.get("zone"));
  if (zp >= 2 && zp <= 3) { const pend = run.pending; enterZone(zp); run.pending = pend; }   // debug: skip ahead, keeping any Relic Locker choice first
  saveRun();
}
function enterZone(z) {
  run.zone = z;
  const h = Math.min(Math.ceil(run.maxhp * .3), run.maxhp - run.hp); run.hp += h;
  run.map = genDigMap(z); run.cur = null; run.pending = null; run.queued = null;
  run.alert = 0; run.ambushDue = 0; run.antidote = false; run.overrideKey = false; run.hiveMap = false;
  S.toast = { text: `${ZONES[z - 1]} — healed ${h} HP`, t: 3 };
  S.screen = "map"; S.face = null; S.walk = null; saveRun();
}

// ---------------------------------------------------------------- dig map
const MW = 9, MH = 11, TILE = 52, GX = 24, GY = 34;
const tileAt = (x, y) => run.map.tiles[y * MW + x];
const inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const protectedT = (x, y) => x === 4 && (y === 0 || y === 9 || y === 10);
function genDigMap(zone = 1) {
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
        if (T_(nx, ny).k === "lair") { if (x === 4 && y === 9) seen.add(ny * MW + nx); continue; }   // the lair is reached but never walked through
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
    if (zone === 2) {
      // the Spore Antidote: one empty, reachable dirt tile in the bottom third (placed first so nothing else crowds it out)
      const cand = [];
      tiles.forEach((t, i) => { const x = i % MW, y = (i / MW) | 0; if (t.k === "dirt" && !t.c && y >= 8 && !protectedT(x, y) && seen.has(i)) cand.push(t); });
      if (!cand.length) continue;
      pick(cand).c = "antidote";
    }
    if (zone === 3) {
      // unique reachable tiles first (so nothing crowds them out): Override Key (rows 8-10), Hive Map (rows 3-6), 3 Beacons (rows 2-8, 3+ apart, none next to the Key)
      const pickIdx = (minY, maxY, ok = () => true) => {
        const cand = [];
        tiles.forEach((t, i) => { const x = i % MW, y = (i / MW) | 0; if (t.k === "dirt" && !t.c && !protectedT(x, y) && seen.has(i) && y >= minY && y <= maxY && ok(x, y)) cand.push(i); });
        return cand.length ? pick(cand) : -1;
      };
      const ki = pickIdx(8, 10), mi = ki < 0 ? -1 : (tiles[ki].c = "overrideKey", pickIdx(3, 6));
      if (mi < 0) continue;
      tiles[mi].c = "hiveMap";
      const kx = ki % MW, ky = (ki / MW) | 0, beacons = [];
      for (let b = 0; b < 3; b++) {
        const i = pickIdx(2, 8, (x, y) => beacons.every(j => Math.abs(x - j % MW) + Math.abs(y - ((j / MW) | 0)) >= 3) && Math.max(Math.abs(x - kx), Math.abs(y - ky)) > 1);
        if (i < 0) break;
        tiles[i].c = "beacon"; beacons.push(i);
      }
      if (beacons.length < 3) continue;
    }
    place("au", 2, 7, 9); place("ag", 4, 4, 9); place("elite", 2, 5, 9); place("trader", 1, 3, 7); place("camp", 1, 4, 7);
    place("cache", 1, 3, 9); place("event", 3, 0, 9); place("battle", 9, 1, 9); place("cu", 10, 0, 9);
    const map = { w: MW, h: MH, tiles, px: 4, py: 0 };
    if (zone === 2) {
      // spore overlay flags: content stays on the tile underneath
      const cand = []; tiles.forEach((t, i) => { const x = i % MW, y = (i / MW) | 0; if (t.k === "dirt" && !t.dug && y >= 2 && y <= 8 && !protectedT(x, y) && t.c !== "antidote") cand.push(t); });
      shuffle(cand).slice(0, 3).forEach(t => { t.spore = true; });
      map.sporeIn = 3;
    }
    if (zone === 3) {
      // two hive tunnels (random walks of 4-6 dirt tiles, no content) that patrols walk; the player digs them like plain dirt
      const okH = (x, y) => y >= 2 && y <= 8 && (t => t.k === "dirt" && !t.c && !t.hive)(T_(x, y)) && !protectedT(x, y) && Math.abs(x - 4) + y > 2;
      const carve = () => {
        for (let tries = 0; tries < 40; tries++) {
          const cand = []; tiles.forEach((t, i) => { if (okH(i % MW, (i / MW) | 0)) cand.push(i); });
          if (!cand.length) return null;
          const len = rr(4, 6), path = [pick(cand)];
          while (path.length < len) {
            const lx = path[path.length - 1] % MW, ly = (path[path.length - 1] / MW) | 0;
            const opts = NB4.map(([dx, dy]) => [lx + dx, ly + dy]).filter(([a, b]) => inMap(a, b) && okH(a, b) && !path.includes(b * MW + a));
            if (!opts.length) break;
            const [a, b] = pick(opts); path.push(b * MW + a);
          }
          if (path.length >= 4) { path.forEach(i => { tiles[i].hive = true; }); return path; }
        }
        return null;
      };
      const t1 = carve(), t2 = t1 && carve();
      if (!t2) continue;
      map.patrols = [t1, t2].map((path, n) => { const i = pick(path); return { x: i % MW, y: (i / MW) | 0, id: n + 1, lastX: -1, lastY: -1 }; });
      map.patrolSeq = 2;
    }
    if (zone >= 2) map.enc = pickRoster(zone);
    return map;
  }
  throw new Error("dig map generation failed");
}
function isRevealed(x, y) {
  if (params.get("reveal") === "1") return true;
  const t = tileAt(x, y);
  if (t.k === "lair" || t.dug) return true;
  if (run.zone === 3) {   // psionic fog: only felt bedrock, the Hive Map, a lit Beacon's radius 2, or (3rd Eye) radius 1 around tunnels
    if (t.felt || run.hiveMap) return true;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (!inMap(x + dx, y + dy)) continue;
      const n = tileAt(x + dx, y + dy);
      if (n.c === "beacon" && n.dug) return true;
      if (n.dug && hasRelic("thirdEye") && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
    }
    return false;
  }
  const R = hasRelic("thirdEye") ? 2 : 1;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (inMap(x + dx, y + dy) && tileAt(x + dx, y + dy).dug) return true;
  return false;
}
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a tile the tunnel network touches (can be reached by walking + digging); in Zone 3's fog hidden tiles next to a tunnel count too (they may turn out to be bedrock)
function canReach(x, y) {
  const t = tileAt(x, y), fog = run.zone === 3, rev = isRevealed(x, y);
  if (t.dug || (t.k === "bedrock" && !(fog && !rev)) || (!fog && !rev)) return false;
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

function chooseEncounter(kind, row) {
  const z = ENC["z" + run.zone], e = run.map && run.map.enc || z;   // Zone 2/3 maps carry their own randomised roster
  return kind === "boss" ? pick(z.boss) : kind === "elite" ? pick(e.elite) : pick(row <= 3 ? e.easy : e.normal);
}
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
// Zone 2 spores: t.spore is an overlay flag only, the tile keeps its content
const hasSpores = () => run.zone === 2;
const canSpore = (x, y) => inMap(x, y) && (t => !t.dug && t.k === "dirt" && !t.spore && t.c !== "antidote" && !protectedT(x, y))(tileAt(x, y));
function spreadSpores() {
  const m = run.map, snap = [];
  m.tiles.forEach((t, i) => { if (t.spore) snap.push([i % MW, (i / MW) | 0]); });
  m.sporeIn = 3;
  let total = snap.length;
  const fresh = [], elig = (x, y) => NB4.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => canSpore(a, b));
  const infect = (a, b) => { tileAt(a, b).spore = true; fresh.push([a, b]); total++; };
  for (const [x, y] of snap) if (total < 25 && rng.next() < .5) { const el = elig(x, y); if (el.length) { const [a, b] = pick(el); infect(a, b); } }
  if (!fresh.length && total < 25) {   // every spread does something
    const all = snap.flatMap(([x, y]) => elig(x, y));
    if (all.length) { const [a, b] = pick(all); infect(a, b); }
  }
  S.toast = { text: "The spores spread", t: 2 };
  for (const [a, b] of fresh) if (isRevealed(a, b)) mapFloat(a, b, "Spores!", "#8fe06a");
}
function digAntidote(t, x, y) {
  run.antidote = true; t.used = true;
  let n = 0;
  for (let i = run.deck.length - 1; i >= 0; i--) if (run.deck[i].id === "spore") { run.deck.splice(i, 1); n++; }
  S.toast = { text: n ? `Spore Antidote! Removed ${n} Spore card${n === 1 ? "" : "s"}. Spores no longer affect you.` : "Spore Antidote! No Spore cards to remove. Spores no longer affect you.", t: 4 };
  mapFloat(x, y, "Antidote", "#7affc0");
}
// Zone 3 patrols: Hive Guard squads that walk hive tunnels and the player's dug tiles, one step per dig
const patrolAt = (x, y) => (run.map.patrols || []).find(p => p.x === x && p.y === y) || null;
const walkableP = (x, y) => inMap(x, y) && (t => (t.hive || t.dug) && t.k !== "lair")(tileAt(x, y));
function patrolPath(p) {   // shortest walkable route from the patrol to the player, as steps without the start, or null
  const m = run.map, start = p.y * MW + p.x, goal = m.py * MW + m.px, prev = new Map([[start, -1]]), q = [start];
  while (q.length) {
    const k = q.shift();
    if (k === goal) { const path = []; for (let c = k; c !== start; c = prev.get(c)) path.unshift({ x: c % MW, y: (c / MW) | 0 }); return path; }
    for (const [dx, dy] of NB4) { const nx = (k % MW) + dx, ny = ((k / MW) | 0) + dy, nk = ny * MW + nx; if (walkableP(nx, ny) && !prev.has(nk)) { prev.set(nk, k); q.push(nk); } }
  }
  return null;
}
const hunting = p => { const pa = patrolPath(p); return !!pa && pa.length > 0 && pa.length <= 6; };
function movePatrols() {
  const m = run.map, occ = new Set(m.patrols.map(p => p.y * MW + p.x));
  for (const p of m.patrols) {
    const path = patrolPath(p);
    let to = null;
    if (path && path.length && path.length <= 6) to = path[0];
    else {
      const opts = NB4.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy })).filter(o => walkableP(o.x, o.y)), fresh = opts.filter(o => !(o.x === p.lastX && o.y === p.lastY));
      const pool = fresh.length ? fresh : opts; if (pool.length) to = pick(pool);
    }
    if (!to || occ.has(to.y * MW + to.x)) continue;   // stuck, or another patrol is there: wait
    occ.delete(p.y * MW + p.x); p.lastX = p.x; p.lastY = p.y; p.x = to.x; p.y = to.y; occ.add(to.y * MW + to.x);
  }
}
function spawnPatrol() {
  const m = run.map; if (m.patrols.length >= 3) return;
  const cand = []; m.tiles.forEach((t, i) => { const x = i % MW, y = (i / MW) | 0; if (t.hive && !patrolAt(x, y) && Math.abs(x - m.px) + Math.abs(y - m.py) >= 4) cand.push({ x, y }); });
  if (cand.length) { const c = pick(cand); m.patrols.push({ x: c.x, y: c.y, id: ++m.patrolSeq, lastX: -1, lastY: -1 }); }
}
const patrolFight = p => ({ screen: "combat", kind: "patrol", enc: pick(ENC.z3.patrol), patrolId: p.id });
function digTile(x, y) {
  if (S.dig || S.modal || !canDig(x, y)) return;
  const t = tileAt(x, y), from = { x: run.map.px, y: run.map.py };
  if (t.k === "bedrock") { t.felt = true; S.face = null; mapFloat(x, y, "Solid rock", "#b8aab0"); saveRun(); return; }   // hidden by Zone 3's fog: bumped, nothing is spent
  t.dug = true; run.map.px = x; run.map.py = y;
  run.alert++; if (run.alert % 8 === 0) run.ambushDue++;
  run.cur = { x, y };
  const c = t.c;
  if (c === "overrideKey") { run.overrideKey = true; t.used = true; mapFloat(x, y, "Override Key", "#ffcf4a"); S.toast = { text: "Override Key! The Core's turrets will be offline.", t: 4 }; }
  if (c === "hiveMap") { run.hiveMap = true; t.used = true; mapFloat(x, y, "Hive Map", "#5ad0ff"); S.toast = { text: "Hive Map! The whole Gate is revealed, patrols included.", t: 4 }; }
  if (c === "beacon") { t.used = true; mapFloat(x, y, "Beacon lit", "#b8a0ff"); }
  if (t.spore) {
    t.spore = false;
    if (run.antidote) mapFloat(x, y, "Cleansed", "#7affc0");
    else { addCard("spore"); mapFloat(x, y, "+1 Spore", "#8fe06a"); }
  }
  if (c === "antidote") digAntidote(t, x, y);
  else if (hasSpores() && !run.antidote && --run.map.sporeIn <= 0) spreadSpores();
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
  if (run.zone === 3) {
    const stood = patrolAt(x, y);   // dug onto a patrol's tile, or one steps onto ours after the dig
    movePatrols();
    if (run.alert % 8 === 0) spawnPatrol();
    const touch = stood || patrolAt(x, y);
    if (touch) {   // the patrol fight comes first, then whatever the tile held
      run.queued = run.pending; run.pending = patrolFight(touch);
      if (!run.queued) run.cur = null;
    }
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
  else if (m.px === 4 && m.py === 0 && !S.face) shipRest();
}
// Zone 1 ship: one free full heal per run
function shipRest() {
  if (run.zone !== 1 || run.shipRest || run.hp >= run.maxhp) return;
  const h = run.maxhp - run.hp; run.hp = run.maxhp; run.shipRest = true;
  S.toast = { text: `Rested aboard the ship: +${h} HP`, t: 2.5 }; saveRun();
}
function updateMap(dt) {
  if (S.dig) { S.dig.t += dt; if (S.dig.t >= (S.dig.dur || .2)) { S.dig = null; if (run && run.pending) openPending(); } }
  if (!S.dig && S.walk && run && S.screen === "map") {
    const st = S.walk.path.shift();
    if (st) {
      const from = { x: run.map.px, y: run.map.py }; run.map.px = st.x; run.map.py = st.y; S.dig = { t: 0, from, to: st, dur: .1 };
      const pt = run.zone === 3 && patrolAt(st.x, st.y);
      if (pt) { S.walk = null; run.cur = null; run.pending = patrolFight(pt); saveRun(); }   // walked into a patrol
    }
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
  if (run.queued) { run.pending = run.queued; run.queued = null; S.modal = null; saveRun(); openPending(); return; }   // a patrol fight came first: now the tile's own content
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

const SLOTS = [null, [700], [620, 800], [520, 670, 820], [450, 580, 710, 840]];
const mkEnemy = (id, uid, x) => {
  const d = ENEMIES[id], hp = rr(d.hp[0], d.hp[1]);
  return { id, def: d, hp, maxhp: hp, block: 0, str: 0, weak: 0, vuln: 0, rad: 0, mi: 0, override: null, dead: false, fade: 1, hitT: 0, lungeT: 0, x, tx: x, y: 325, odDone: false, uid, phase: 0, dmgTaken: 0 };
};
// x positions for a line-up: fixed slots by count, but a wide boss (the Home Base Core) gets room (3 enemies: turret, Core, turret use [545, 720, 895], tuned from the brief's 560/880 for the art widths)
function slotsFor(L) {
  const n = L.length;
  if (!L.some(e => e.def.boss && e.def.w >= 200)) return SLOTS[n];
  if (n === 3 && L[1].def.boss) return [545, 720, 895];
  const pos = []; let x = 0;
  L.forEach((e, i) => { if (i) x += (L[i - 1].def.w + e.def.w) / 2 + 8; pos.push(x); });
  const mid = (pos[0] + pos[n - 1]) / 2, shift = Math.min(0, 880 - (700 + pos[n - 1] - mid));
  return pos.map(p => 700 + p - mid + shift);
}
// spreads the living enemies over the slots for their count; updateCombat eases x toward tx
function relayout() { const L = livingEnemies(), xs = slotsFor(L); if (xs) L.forEach((e, i) => { e.tx = xs[i]; }); }
const isShielded = e => !e.isP && !!e.def.shieldedBy && C.enemies.some(o => alive(o) && o.id === e.def.shieldedBy);
function summonEnemies(src, ids) {
  const fresh = [];
  for (const id of ids) {
    if (livingEnemies().length >= 4) { addFloat(src, "No room", "#aab"); break; }
    const e = mkEnemy(id, C.enemies.length, src.x); e.summoned = true; e.fade = 0; C.enemies.push(e); fresh.push(e);
    relayout();
  }
  for (const e of fresh) e.x = e.tx;
}
const thornsOf = e => e.isP ? 0 : (e.def.thorns || 0) + (e.thornsTemp || 0);
const sporeCount = () => [...C.hand, ...C.draw, ...C.disc].filter(c => c.id === "spore").length;
const baseDmg = m => m.dmg + (m.perSpore || 0) * sporeCount();
function healEnemy(e, n) { const h = Math.min(n, e.maxhp - e.hp); e.hp += h; if (h > 0) addFloat(e, `+${h}`, "#6aff8a"); }
function addToDisc(id, n) { for (let i = 0; i < n; i++) C.disc.push({ id, up: false, uid: C.uid++, appear: 1 }); addFloat(C.P, `+${n} ${CARDS[id].n}`, "#8fe06a"); }

function startCombat(allIds, kind) {
  const encIds = kind === "boss" && run.zone === 3 && run.overrideKey ? allIds.filter(id => id !== "turret") : allIds;   // the Override Key takes the turrets offline
  const xs = slotsFor(encIds.map(id => ({ def: ENEMIES[id] })));
  C = {
    kind, over: null, overT: 0, phase: "busy", turn: 0, Q: [], timer: .4, ins: -1, floats: [], sel: -1, choose: null, flash: 0, hoverCard: -1,
    P: { isP: true, hp: run.hp, maxhp: run.maxhp, block: 0, str: 0, weak: 0, vuln: 0, rad: 0, hitT: 0, pose: 0, poseT: 0 },
    enemies: [], draw: [], hand: [], disc: [], exh: [], energy: 0, nextEnergy: 0, charge: 0, heat: 0,
    comp: { dog: 0, mouse: 0 }, pw: {}, pwv: {}, swordN: 0, atkN: 0, played: 0, uid: 1, banner: null, dogT: 0, mouseT: 0, oreGain: { cu: 0, ag: 0, au: 0 }
  };
  encIds.forEach((id, i) => C.enemies.push(mkEnemy(id, i, xs[i])));
  for (const c of run.deck) C.draw.push(Object.assign(JSON.parse(JSON.stringify(c)), { uid: C.uid++, appear: 1 }));
  shuffle(C.draw);
  S.screen = "combat"; S.modal = null;
  if (kind === "ambush" || kind === "patrol") { C.banner = { t: 1.6, text: kind === "patrol" ? "PATROL!" : "AMBUSH!" }; C.timer = 1.4; }
  else if (encIds.length < allIds.length) { C.banner = { t: 1.6, text: "Turrets offline" }; C.timer = 1.4; }
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
  if (isShielded(t)) n = Math.floor(n / 2);   // the Core takes half while a Turret stands, from every source
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
  if (raw) { t.dmgTaken = (t.dmgTaken || 0) + n; return takeDamage(t, n, false); }
  let first = 0;
  if (x && x.fz && x.fz.first) { first = x.fz.first; x.fz.first = 0; }
  const dmg = calcDmg(C.P, t, n + (x ? x.bonus : 0) + first, x && x.dbl ? 2 : 1);
  t.dmgTaken = (t.dmgTaken || 0) + dmg;   // the Mimic reflects what you dealt last turn
  const lost = takeDamage(t, dmg, false), th = thornsOf(t);
  if (th > 0) act(() => takeDamage(C.P, th, false), .15);   // every card hit pays Thorns (Dog / relic damage is raw and doesn't)
  return lost;
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
  // Sentry Eyes zap you for every card played after the 3rd each turn, through Block
  C.played++;
  if (C.played > 3) act(() => { for (const e of livingEnemies()) if (e.def.watch) takeDamage(C.P, e.def.watch, true); }, .15);
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
  act(() => { C.turn++; C.phase = "busy"; C.P.block = 0; C.sel = -1; C.swordN = 0; C.played = 0; for (const e of C.enemies) e.dmgTaken = 0; if (C.turn > 1) C.banner = { t: 1.1, text: "Your Turn" }; }, .05);
  act(() => { if (C.P.rad > 0) { takeDamage(C.P, C.P.rad, true); C.P.rad--; } }, .2);
  act(() => {
    if (C.pw.perpetual) { C.charge += C.pw.perpetual; addFloat(C.P, `+${C.pw.perpetual} Charge`, "#ffa44a"); }
    if (C.pw.wingmen) for (let k = 0; k < C.pw.wingmen; k++) for (let h = 0; h < 2; h++) act(() => { const e = pick(livingEnemies()); if (e) strike(e, 4, false); }, .15);
  }, .1);
  act(() => { drawCards(5 + (C.turn === 1 && hasRelic("thirdEye") ? 2 : 0)); }, .3);
  act(() => {
    C.energy = Math.max(0, 3 + (C.turn === 1 && hasRelic("burstR") ? 1 : 0) + C.nextEnergy); C.nextEnergy = 0;
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
  // all enemy Block / temp Thorns expire together as the phase starts, so a support's ally Block (Knit, Shield Ally) survives whoever acts after it
  act(() => { for (const e of C.enemies) { if (!e.def.keepBlock) e.block = 0; e.thornsTemp = 0; } }, 0);
  for (const e of C.enemies) {
    act(() => {
      if (!alive(e)) return;
      if (e.rad > 0) { takeDamage(e, e.rad, true); e.rad--; }
      const ph = e.def.phases && e.def.phases[e.phase];
      if (ph && ph.turnStr && alive(e)) applyStatus(e, "str", ph.turnStr);   // Core Phase 3 grows stronger every enemy phase
    }, .15);
    act(() => { if (alive(e)) execMove(e); }, .3);
    act(() => {
      if (!alive(e)) return;
      e.weak = Math.max(0, e.weak - 1); e.vuln = Math.max(0, e.vuln - 1);
      if (e.override) e.override = null; else e.mi = (e.mi + 1) % movesOf(e).length;
    }, .05);
  }
  startPlayerTurn();
}

const movesOf = e => e.def.phases ? e.def.phases[e.phase].moves : e.def.moves;
const moveOf = e => e.override || movesOf(e)[e.mi];
function execMove(e) {
  const m = moveOf(e);
  e.lungeT = .4;
  addFloat(e, m.n, "#ffd9a0");
  if (m.breakBlock) act(() => { if (alive(e) && C.P.block > 0) { C.P.block = 0; addFloat(C.P, "Armor melted", "#ff9a6a"); } }, .15);
  if (m.dmg) for (let h = 0; h < (m.hits || 1); h++) act(() => {
    if (!alive(e)) return;
    const lost = takeDamage(C.P, calcDmg(e, C.P, baseDmg(m)), false);
    if (m.drain && lost > 0) healEnemy(e, lost);
  }, .2);
  act(() => {
    if (!alive(e)) return;
    if (m.apply) for (const k in m.apply) applyStatus(C.P, k, m.apply[k]);
    if (m.block) { e.block += m.block; addFloat(e, `+${m.block} Block`, "#9cc8ff"); }
    if (m.str) applyStatus(e, "str", m.str);
    if (m.heal) healEnemy(e, m.heal);
    if (m.allyBlock) {
      let al = livingEnemies().filter(o => o !== e); if (!al.length) al = [e];
      for (const o of al) { o.block += m.allyBlock; addFloat(o, `+${m.allyBlock} Block`, "#9cc8ff"); }
    }
    if (m.allyStr) {
      let al = livingEnemies().filter(o => o !== e); if (!al.length) al = [e];
      for (const o of al) { o.str += m.allyStr; addFloat(o, `+${m.allyStr} Str`, STATUS.str.col); }
    }
    if (m.addDisc) for (const k in m.addDisc) addToDisc(k, m.addDisc[k]);
    if (m.thornsTemp) { e.thornsTemp = (e.thornsTemp || 0) + m.thornsTemp; addFloat(e, `+${m.thornsTemp} Thorns`, STATUS.thorns.col); }
    if (m.summon) summonEnemies(e, m.summon);
    if (m.allBlock) for (const o of livingEnemies()) { o.block += m.allBlock; addFloat(o, `+${m.allBlock} Block`, "#9cc8ff"); }
    if (m.reflect) { const b = Math.min(e.dmgTaken || 0, m.reflect); if (b > 0) { e.block += b; addFloat(e, `+${b} Block`, "#9cc8ff"); } }
    if (m.healAlly) { const al = livingEnemies().filter(o => o !== e); healEnemy((al.length ? al : [e]).reduce((a, b) => b.hp < a.hp ? b : a), m.healAlly); }
    if (m.drainEnergy) { C.nextEnergy -= m.drainEnergy; addFloat(C.P, `-${m.drainEnergy} Energy next turn`, "#ffe27a"); }
  }, .1);
  if (m.selfDestruct) act(() => { if (alive(e)) { e.dead = true; e.hp = 0; addFloat(e, "Burst", "#ffd24a"); } }, .15);   // no loot, no onDeath
}
// enemies with an overdrive (Sentinel, Brood Knight, Bloom Matriarch) swap it in once at half HP, without losing their place in the cycle;
// phased enemies (the Home Base Core) switch move list at each HP threshold, interrupting the current intent
function refreshIntents() {
  for (const e of C.enemies) {
    if (!alive(e)) continue;
    if (e.def.overdrive && !e.odDone && e.hp <= e.maxhp / 2) {
      e.odDone = true; e.override = e.def.overdrive;
      C.banner = { t: 1.2, text: e.def.overdrive.banner || "Overdrive!" };
    }
    const ph = e.def.phases;
    while (ph && e.phase + 1 < ph.length && e.hp <= ph[e.phase + 1].at) {
      const p = ph[++e.phase];
      e.mi = 0; e.override = null; C.banner = { t: 1.4, text: p.banner };
      if (p.summon) summonEnemies(e, p.summon);
    }
  }
}
function afterAction() {
  for (const e of C.enemies) if (!e.dead && e.hp <= 0) {
    e.dead = true; e.hp = 0; addFloat(e, "Defeated", "#ffd24a");
    if (!e.summoned && !e.def.noLoot) gainOre("cu", 1);
    const od = e.def.onDeath;
    if (od) {
      addFloat(e, od.n, "#8fe06a");
      for (const k in od.addDisc) addToDisc(k, od.addDisc[k]);
      if (od.allyStr) for (const o of livingEnemies()) { o.str += od.allyStr; addFloat(o, `+${od.allyStr} Str`, STATUS.str.col); }
    }
    const b = e.def.bond, kin = b ? livingEnemies().filter(o => o.id === e.id) : [];   // Wardens avenge each other
    if (kin.length) { for (const o of kin) { o.str += b.str; healEnemy(o, b.heal); addFloat(o, `+${b.str} Str`, STATUS.str.col); } C.banner = { t: 1.4, text: b.banner }; }
    if (e.def.endsFight) for (const o of C.enemies) if (!o.dead) { o.dead = true; o.hp = 0; addFloat(o, "Shut down", "#9ad0ff"); }   // the Core falls: everything else powers down, no loot
  }
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
  for (const e of C.enemies) {
    e.hitT = Math.max(0, e.hitT - dt); e.lungeT = Math.max(0, e.lungeT - dt);
    if (e.dead) e.fade = Math.max(0, e.fade - dt * 2.2);
    else {
      if (e.fade < 1) e.fade = Math.min(1, e.fade + dt * 3);
      if (e.x !== e.tx) e.x = Math.abs(e.tx - e.x) < .5 ? e.tx : lerp(e.x, e.tx, 1 - Math.exp(-dt * 14));
    }
  }
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
  if (kind === "patrol" && run.pending && run.pending.patrolId != null) run.map.patrols = run.map.patrols.filter(p => p.id !== run.pending.patrolId);   // the squad is gone
  if (kind === "boss" && run.zone >= 3) { run.scrap += 75; endRun(true); return; }   // the last zone's boss (the Home Base Core) ends the run
  const scrap = gainScrap(kind === "elite" ? rr(30, 40) : kind === "boss" ? 75 : kind === "ambush" ? rr(10, 20) : rr(15, 25));
  const pend = { screen: "reward", scrap, cards: kind === "ambush" ? [] : rollCards(kind, save.forge.survey ? 4 : 3), relic: null, ore: oreG, ambush: kind === "ambush", nextZone: kind === "boss" };
  if (kind === "elite" || kind === "boss") { const pool = unownedRelics(); if (pool.length) { pend.relic = pick(pool); grantRelic(pend.relic); } }
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
  // passives (Thorns, Watch, Plated, Shielded) are computed from the enemy's definition, not stored as stacks
  const sv = k => k === "thorns" ? thornsOf(u) : k === "watch" ? (u.isP ? 0 : u.def.watch || 0) : k === "plated" ? (u.isP || !u.def.keepBlock ? 0 : 1) : k === "shielded" ? (isShielded(u) ? 1 : 0) : u[k];
  const keys = ["str", "weak", "vuln", "rad", "thorns", "watch", "plated", "shielded"].filter(k => sv(k) > 0);
  const x0 = cx - (keys.length - 1) * 15;
  keys.forEach((k, i) => {
    const st = STATUS[k], x = x0 + i * 30, n = sv(k);
    ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fillStyle = "#12161e"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = st.col; ctx.stroke();
    if (!st.ico || !uiIcon(st.ico[0], st.ico[1], x, y, 24)) T(st.l, x, y, st.l.length > 1 ? 10 : 12, st.col, "center", true);
    if (!st.nonum) T(String(n), x + 9, y + 10, 11, "#fff", "center", true);
    if (over(x - 12, y - 12, 24, 24)) setTip([{ t: st.nonum ? st.n : `${st.n} ${n}`, d: st.d.replace(/\bN\b/, n) }], x + 16, y);
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
  if (m.dmg) { const d = calcDmg(e, C.P, baseDmg(m)); kinds.push("attack"); num = m.hits > 1 ? `${d}×${m.hits}` : String(d); }
  if (m.block || m.allyBlock || m.allBlock || m.reflect) kinds.push("block");
  if (m.apply || m.addDisc || m.breakBlock || m.drainEnergy) kinds.push("debuff");
  if (m.str || m.heal || m.allyStr || m.thornsTemp || m.healAlly) kinds.push("buff");
  if (m.summon) kinds.push("summon");
  if (m.charging) kinds.push("charging");
  return { m, kinds, num };
}
const enemyArtKey = id => "e_" + (id.startsWith("drone") ? "drone" : id);
function enemyTop(e) {
  const d = e.def;
  return artReady(enemyArtKey(e.id)) ? d.h * (d.boss ? 1.15 : 1.25) * (d.artScale || 1) + (d.fly ? d.h * .2 + 6 : 0) : d.h;
}
function eyeAt(x, y, r = 7) {
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x - r * .25, y + r * .1, r * .5, 0, TAU); ctx.fill();
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
  } else if (d.shape === "mushroom") {
    const bob = Math.sin(t * 3 + e.uid) * 2.5;
    ctx.beginPath(); ctx.moveTo(x - 11, y); ctx.lineTo(x - 9, y - 34); ctx.lineTo(x + 9, y - 34); ctx.lineTo(x + 11, y); ctx.closePath(); ctx.fillStyle = "#efe3c0"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 34 + bob, 36, 26, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d6f3ec"; for (const [dx, dy, r] of [[-18, -44, 5], [4, -54, 4], [19, -42, 5]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy + bob, r, 0, TAU); ctx.fill(); }
    eyeAt(x - 5, y - 18, 4.5); eyeAt(x + 5, y - 18, 4.5);
  } else if (d.shape === "bloom" || d.shape === "matriarch") {
    const big = d.shape === "matriarch", k = big ? 1.5 : 1, cy = y - 58 * k + Math.sin(t * 2 + e.uid) * 4;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 14 * k, cy + 34 * k, 6 * k, 13 * k, s * .6, 0, TAU); ctx.fillStyle = "#5a9a3a"; ctx.fill(); ctx.stroke(); }
    if (big) for (let i = 0; i < 8; i++) {   // ring of pulsing buds
      const a = i / 8 * TAU + t * .4, r = (5 + Math.sin(t * 4 + i) * 1.6) * k;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 47 * k, cy + Math.sin(a) * 47 * k, r, 0, TAU); ctx.fillStyle = "#e0709a"; ctx.fill(); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + Math.sin(t * 2 + i) * .12;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 24 * k, cy + Math.sin(a) * 24 * k, 17 * k, 11 * k, a, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x, cy, 17 * k, 0, TAU); ctx.fillStyle = "#f2d04a"; ctx.fill(); ctx.stroke();
    eyeAt(x - 7 * k, cy - 2 * k, 5 * k); eyeAt(x + 7 * k, cy - 2 * k, 5 * k);
  } else if (d.shape === "hound") {
    const br = Math.sin(t * 3 + e.uid) * 1.5;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 36, y - 38); ctx.lineTo(x + 56, y - 46); ctx.lineTo(x + 52, y - 38); ctx.closePath(); ctx.fill(); ctx.stroke();   // tail
    for (const dx of [-30, -14, 14, 28]) { ctx.fillStyle = "#58612e"; ctx.fillRect(x + dx - 4, y - 20, 9, 20); ctx.strokeRect(x + dx - 4, y - 20, 9, 20); }
    ctx.beginPath(); ctx.ellipse(x + 6, y - 34, 40, 19 + br, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.fillRect(x - 56, y - 56, 34, 26); ctx.strokeRect(x - 56, y - 56, 34, 26);   // blocky head
    ctx.fillStyle = "#58612e"; ctx.fillRect(x - 56, y - 32, 30, 9); ctx.strokeRect(x - 56, y - 32, 30, 9);   // jaw
    ctx.fillStyle = "#f4f0d0"; for (const dx of [-52, -44, -36]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 32); ctx.lineTo(x + dx + 3, y - 32); ctx.lineTo(x + dx + 1.5, y - 37); ctx.fill(); }
    eyeAt(x - 38, y - 48, 5);
    ctx.fillStyle = "#9be05a"; for (const dx of [-14, 4, 22]) { ctx.beginPath(); ctx.arc(x + dx, y - 51 + br, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
  } else if (d.shape === "hulk") {
    const br = Math.sin(t * 2 + e.uid) * 2;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(x + s * 62, y - 50, 17, 42, s * -.15, 0, TAU); ctx.fillStyle = "#4e5d31"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + s * 66, y - 12, 16, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(x, y - 66, 60, 54 + br, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 14, y - 96 + br, 19, 0, TAU); ctx.fillStyle = "#4e5d31"; ctx.fill(); ctx.stroke();
    eyeAt(x - 21, y - 98 + br, 3.5); eyeAt(x - 8, y - 98 + br, 3.5);
    for (const [dx, dy, r] of [[18, -90, 7], [-28, -58, 6], [28, -52, 8], [-6, -34, 5], [40, -74, 5]]) {   // pulsing pustules
      const pu = .5 + .5 * Math.sin(t * 3 + dx);
      ctx.beginPath(); ctx.arc(x + dx, y + dy, r + pu * 1.5, 0, TAU); ctx.fillStyle = `rgba(${150 + pu * 60 | 0},255,${100 + pu * 40 | 0},${.7 + pu * .3})`; ctx.fill(); ctx.stroke();
    }
  } else if (d.shape === "bat") {
    const fl = Math.sin(t * 11 + e.uid * 2), cy = y - 38 + Math.sin(t * 2 + e.uid) * 4;
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(x + s * 12, cy - 4); ctx.rotate(s * (-.35 + fl * .5));
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 38, -12); ctx.lineTo(s * 34, 8); ctx.lineTo(s * 22, 3); ctx.lineTo(s * 12, 13); ctx.closePath();
      ctx.fillStyle = "#54467a"; ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = col; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 6, cy - 12); ctx.lineTo(x + s * 14, cy - 26); ctx.lineTo(x + s * 15, cy - 9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, cy, 17, 0, TAU); ctx.fill(); ctx.stroke();
    eyeAt(x - 6, cy - 3, 6); eyeAt(x + 6, cy - 3, 6);
    ctx.fillStyle = "#fff"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 5 - 2, cy + 9); ctx.lineTo(x + s * 5 + 2, cy + 9); ctx.lineTo(x + s * 5, cy + 15); ctx.fill(); }
  } else if (d.shape === "grub") {
    const seg = [[34, 16, 0], [10, 19, 1], [-14, 20, 2]];
    for (const [dx, r, i] of seg) {
      const sy = y - 24 - r * .2 - Math.max(0, Math.sin(t * 3 + i * 1.1 + e.uid)) * 4;
      ctx.beginPath(); ctx.arc(x + dx, sy, r, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + dx, sy - 2, r * .55, r * .9, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.fillStyle = "#8a7a56"; ctx.fill(); ctx.stroke();
    }
    const hx = x - 42, hy = y - 28;
    ctx.beginPath(); ctx.arc(hx, hy, 21, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx - 10, hy + 2, 10, 0, TAU); ctx.fillStyle = "#3a2418"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff"; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.arc(hx - 10 + Math.cos(a) * 9, hy + 2 + Math.sin(a) * 9, 1.8, 0, TAU); ctx.fill(); }
    eyeAt(hx + 4, hy - 14, 4);
  } else if (d.shape === "weaver") {
    ctx.lineCap = "round";
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
      const sw = Math.sin(t * 2.5 + i + e.uid) * 3, kx = x + s * (18 + i * 10), ky = y - 82 + i * 8, fx = x + s * (34 + i * 11) + sw;
      ctx.strokeStyle = "rgba(236,242,222,.4)"; ctx.lineWidth = 1.5;   // pale thread from the knee to the ground
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.quadraticCurveTo(kx + sw * 2, (ky + y) / 2, kx + sw, y + 2); ctx.stroke();
      ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x + s * 8, y - 52 + i * 3); ctx.lineTo(kx, ky); ctx.lineTo(fx, y); ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.beginPath(); ctx.ellipse(x + 8, y - 54, 24, 18, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 18, y - 56, 13, 0, TAU); ctx.fill(); ctx.stroke();
    eyeAt(x - 22, y - 59, 4); eyeAt(x - 13, y - 59, 4);
  } else if (d.shape === "shaman") {
    const pu = .5 + .5 * Math.sin(t * 3 + e.uid);
    ctx.strokeStyle = "#6a4a2a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 28, y); ctx.lineTo(x + 28, y - 74); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x - 14, y - 52); ctx.lineTo(x + 14, y - 52); ctx.lineTo(x + 24, y); ctx.closePath(); ctx.fillStyle = col; ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 62, 16, 0, TAU); ctx.fillStyle = "#3a2c4a"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 60, 9, 10, 0, 0, TAU); ctx.fillStyle = "#120c18"; ctx.fill();
    ctx.fillStyle = "#e8ff7a"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * 4, y - 61, 2, 0, TAU); ctx.fill(); }
    const gl = ctx.createRadialGradient(x, y - 80, 4, x, y - 80, 40); gl.addColorStop(0, `rgba(210,255,90,${.3 + pu * .35})`); gl.addColorStop(1, "rgba(210,255,90,0)");
    ctx.fillStyle = gl; ctx.fillRect(x - 44, y - 124, 88, 88);
    ctx.beginPath(); ctx.ellipse(x, y - 74, 26, 17, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = `rgb(${190 + pu * 30 | 0},${230 + pu * 20 | 0},${70 + pu * 20 | 0})`; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 28, y - 76, 5 + pu * 1.5, 0, TAU); ctx.fillStyle = "#e8ff7a"; ctx.fill(); ctx.stroke();
  } else if (d.shape === "lurker") {
    const sink = e.block > 0 ? 14 : 0;
    ctx.beginPath(); ctx.ellipse(x, y - 22 + sink, 68, 26, 0, Math.PI, TAU); ctx.lineTo(x + 68, y + 4); ctx.lineTo(x - 68, y + 4); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    for (const s of [-1, 1]) {
      const sw = Math.sin(t * 2 + s + e.uid) * 4, ex = x + s * 24 + sw, ey = y - 66 + sink;
      ctx.strokeStyle = "#2c4234"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + s * 20, y - 40 + sink); ctx.lineTo(ex, ey); ctx.stroke();
      eyeAt(ex, ey, 8);
    }
    ctx.strokeStyle = "#1a2a20"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 54, y - 18 + sink); ctx.quadraticCurveTo(x, y - 4 + sink, x + 54, y - 18 + sink); ctx.stroke();
    ctx.fillStyle = "#e8e4d0"; for (let i = -4; i <= 4; i++) { const tx = x + i * 11, ty = y - 11 + sink - Math.abs(i) * 1.4; ctx.beginPath(); ctx.moveTo(tx - 2, ty - 1); ctx.lineTo(tx + 2, ty - 1); ctx.lineTo(tx, ty + 5); ctx.fill(); }
  } else if (d.shape === "worker") {
    const bob = Math.sin(t * 5 + e.uid) * 1.5;
    ctx.lineCap = "round";
    for (const dx of [-14, 0, 14]) { const sw = Math.sin(t * 6 + dx) * 3; ctx.beginPath(); ctx.moveTo(x + dx, y - 22); ctx.lineTo(x + dx - 6 + sw, y - 9); ctx.lineTo(x + dx - 8 + sw, y); ctx.stroke(); }
    ctx.lineCap = "butt";
    ctx.beginPath(); ctx.ellipse(x + 24, y - 28, 19, 14, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 2, y - 28 + bob, 13, 11, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 26, y - 32 + bob, 13, 0, TAU); ctx.fill(); ctx.stroke();
    eyeAt(x - 29, y - 36 + bob, 4.5);
    const gl = ctx.createRadialGradient(x - 44, y - 22, 1, x - 44, y - 22, 14); gl.addColorStop(0, "rgba(255,200,80,.9)"); gl.addColorStop(1, "rgba(255,170,40,0)");
    ctx.fillStyle = gl; ctx.fillRect(x - 60, y - 38, 32, 32);
    ctx.beginPath(); ctx.arc(x - 44, y - 22, 8, 0, TAU); ctx.fillStyle = "#f0a830"; ctx.fill(); ctx.stroke();   // amber resin blob
  } else if (d.shape === "sprayer") {
    const pu = .5 + .5 * Math.sin(t * 3 + e.uid);
    for (const dx of [-24, -4, 18]) { ctx.fillStyle = "#3e6a3e"; ctx.fillRect(x + dx - 3, y - 14, 7, 14); ctx.strokeRect(x + dx - 3, y - 14, 7, 14); }
    ctx.beginPath(); ctx.ellipse(x, y - 32, 42, 24, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 4, y - 54); ctx.lineTo(x - 4, y - 12); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 14, y - 56, 13 + pu * 2, 0, TAU); ctx.fillStyle = `rgb(${130 + pu * 40 | 0},255,${80 + pu * 30 | 0})`; ctx.fill(); ctx.stroke();   // swollen acid sac
    ctx.beginPath(); ctx.arc(x - 38, y - 32, 12, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#3a3a44"; ctx.fillRect(x - 62, y - 36, 24, 8); ctx.strokeRect(x - 62, y - 36, 24, 8);   // nozzle snout
    eyeAt(x - 36, y - 40, 4);
  } else if (d.shape === "larvaCluster") {
    const sw = 1 + e.mi * .07 + Math.sin(t * 2 + e.uid) * .02;   // swells toward the hatch
    ctx.save(); ctx.translate(x, y); ctx.scale(sw, sw);
    [[-26, -14, 17], [4, -12, 19], [30, -14, 16], [-12, -40, 17], [16, -40, 18], [2, -62, 15]].forEach(([dx, dy, r], i) => {
      ctx.globalAlpha = e.fade * .92; ctx.beginPath(); ctx.ellipse(dx, dy, r, r * 1.12, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
      ctx.globalAlpha = e.fade; ctx.fillStyle = "#4a3a4a"; ctx.beginPath(); ctx.ellipse(dx + Math.sin(t * 4 + i * 2) * 3, dy + Math.cos(t * 3 + i) * 3, r * .4, r * .55, Math.sin(t + i), 0, TAU); ctx.fill();   // something wriggles inside
    });
    ctx.restore();
  } else if (d.shape === "larva") {
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 12 - i * 12, y - 10 - Math.max(0, Math.sin(t * 5 + i)) * 3, 9 - i, 0, TAU); ctx.fillStyle = i % 2 ? "#d0c0a0" : col; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x - 16, y - 10, 4, 0, TAU); ctx.fillStyle = "#3a1a1a"; ctx.fill();
    eyeAt(x - 9, y - 18, 3);
  } else if (d.shape === "eye") {
    const by = y - 58 + Math.sin(t * 2.5 + e.uid) * 5, off = clamp((200 - x) / 40, -1, 1) * 9;   // the iris tracks the player
    ctx.lineCap = "round"; ctx.strokeStyle = "#8a7aa0"; ctx.lineWidth = 4;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 9, by + 26); ctx.quadraticCurveTo(x + i * 12 + Math.sin(t * 3 + i) * 5, by + 40, x + i * 10 + Math.sin(t * 2 + i) * 6, by + 52); ctx.stroke(); }
    ctx.lineCap = "butt"; ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, by, 30, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + off, by, 17, 0, TAU); ctx.fillStyle = "#d02a2a"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + off, by, 7, 0, TAU); ctx.fillStyle = "#111"; ctx.fill();
  } else if (d.shape === "lancer") {
    const ch = moveOf(e).charging, kick = ch ? Math.sin(t * 20) * 1.5 : 0;
    ctx.beginPath(); ctx.ellipse(x + 6, y - 58, 17, 38, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 2, y - 104, 13, 0, TAU); ctx.fill(); ctx.stroke();
    eyeAt(x - 7, y - 106, 4.5);
    ctx.lineCap = "round"; ctx.lineWidth = 5; ctx.strokeStyle = "#0d0f14";
    for (const dx of [-6, 14]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 26); ctx.lineTo(x + dx - 6, y - 12); ctx.lineTo(x + dx - 4, y); ctx.stroke(); }
    const ax = ch ? x + 20 + kick : x - 56, ay = ch ? y - 104 : y - 70;   // the spike arm pulls back while winding up
    ctx.beginPath(); ctx.moveTo(x - 2, y - 82); ctx.lineTo(ax, ay); ctx.stroke(); ctx.strokeStyle = "#e8e0f0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 2, y - 82); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.lineCap = "butt"; ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3;
  } else if (d.shape === "swarmer") {
    const fl = Math.abs(Math.sin(t * 40 + e.uid));
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 6, y - 32 - fl * 4, 15, 7 + fl * 6, s * -.5, 0, TAU); ctx.fillStyle = "rgba(230,200,240,.7)"; ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(x, y - 22 + Math.sin(t * 6 + e.uid) * 2, 12, 15, 0, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    eyeAt(x - 4, y - 26, 4);
  } else if (d.shape === "mindLeech") {
    const sg = [[30, 20, 14], [12, 28, 16], [-8, 30, 15], [-24, 40, 13], [-38, 52, 11]];
    sg.forEach(([dx, dy, r], i) => { const sy = y - dy - Math.sin(t * 3 + i * .8) * 2; ctx.beginPath(); ctx.arc(x + 4 - dx + 20, sy, r, 0, TAU); ctx.fillStyle = i % 2 ? "#6a3a90" : col; ctx.fill(); ctx.stroke(); });
    const pu = .5 + .5 * Math.sin(t * 4 + e.uid);
    ctx.beginPath(); ctx.arc(x - 28, y - 62, 11 + pu, 0, TAU); ctx.fillStyle = `rgb(${220 + pu * 30 | 0},${150 + pu * 40 | 0},255)`; ctx.fill(); ctx.stroke();   // glowing brain bulb
    ctx.strokeStyle = "#7a4aa0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 28, y - 62, 6, .3, 4); ctx.stroke(); ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3;
    eyeAt(x - 30, y - 46, 4);
  } else if (d.shape === "resin") {
    ctx.beginPath(); ctx.arc(x + 6, y - 34, 30, 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 26, y - 44, 15, 0, TAU); ctx.fillStyle = "#8a5a2a"; ctx.fill(); ctx.stroke();
    eyeAt(x - 30, y - 50, 5);
    ctx.strokeStyle = "#e0a040"; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 2 + i) * 2, ln = 14 + i * 7 + Math.max(0, Math.sin(t * 1.5 + i * 2)) * 8; ctx.beginPath(); ctx.moveTo(x - 36 + i * 5, y - 34); ctx.lineTo(x - 36 + i * 5 + sw, y - 34 + ln); ctx.stroke(); ctx.beginPath(); ctx.arc(x - 36 + i * 5 + sw, y - 34 + ln + 2, 2.5, 0, TAU); ctx.fillStyle = "#e0a040"; ctx.fill(); }
    ctx.strokeStyle = "#0d0f14";
  } else if (d.shape === "overseer") {
    const pu = .5 + .5 * Math.sin(t * 3 + e.uid);
    ctx.beginPath(); ctx.moveTo(x - 48, y); ctx.lineTo(x - 22, y - 116); ctx.lineTo(x + 22, y - 116); ctx.lineTo(x + 48, y); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    ctx.lineCap = "round"; ctx.lineWidth = 5; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * 20, y - 104); ctx.lineTo(x + s * 54, y - 126 - Math.sin(t * 2 + s) * 4); ctx.stroke(); } ctx.lineCap = "butt"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y - 132, 17, 21, 0, 0, TAU); ctx.fillStyle = "#6a4a7a"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#6a4a7a"; for (const dx of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(x + dx - 5, y - 148); ctx.lineTo(x + dx, y - 166 + Math.abs(dx) * .4); ctx.lineTo(x + dx + 5, y - 148); ctx.fill(); ctx.stroke(); }   // crest
    eyeAt(x - 7, y - 134, 4.5); eyeAt(x + 7, y - 134, 4.5);
    const gl = ctx.createRadialGradient(x, y - 84, 2, x, y - 84, 26); gl.addColorStop(0, `rgba(235,140,255,${.5 + pu * .4})`); gl.addColorStop(1, "rgba(235,140,255,0)");
    ctx.fillStyle = gl; ctx.fillRect(x - 30, y - 114, 60, 60);
    ctx.beginPath(); ctx.moveTo(x, y - 96); ctx.lineTo(x + 9, y - 84); ctx.lineTo(x, y - 72); ctx.lineTo(x - 9, y - 84); ctx.closePath(); ctx.fillStyle = "#f0a0ff"; ctx.fill(); ctx.stroke();   // psionic gem
  } else if (d.shape === "juggernaut") {
    const b = clamp(e.block / 20, 0, 1), plate = `rgb(${110 + b * 90 | 0},${110 + b * 90 | 0},${130 + b * 90 | 0})`;   // plates brighten with Block
    for (const dx of [-56, -22, 14, 48]) { ctx.fillStyle = "#2a2a34"; ctx.fillRect(x + dx, y - 22, 12, 22); ctx.strokeRect(x + dx, y - 22, 12, 22); }
    ctx.beginPath(); ctx.ellipse(x + 6, y - 62, 82, 54, 0, Math.PI, TAU); ctx.lineTo(x + 88, y - 22); ctx.lineTo(x - 76, y - 22); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(x + 6, y - 22, 80 - i * 18, 52 - i * 9, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.strokeStyle = plate; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 3; }
    ctx.beginPath(); ctx.arc(x - 84, y - 40, 17, 0, TAU); ctx.fillStyle = "#2c2c38"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e0d8c0"; for (const dy of [-10, 6]) { ctx.beginPath(); ctx.moveTo(x - 94, y - 40 + dy); ctx.lineTo(x - 114, y - 46 + dy); ctx.lineTo(x - 96, y - 34 + dy); ctx.fill(); ctx.stroke(); }
    eyeAt(x - 82, y - 46, 5);
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
  if (d.onDeath && over(e.x - 60, e.y + 57, 120, 18)) setTip([{ t: d.n, d: `On death: ${d.onDeath.n}. ${describeMove(d.onDeath)}` }], e.x + 66, e.y + 50);
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
  if (m.breakBlock) p.push("Removes all your Block.");
  if (m.charging) p.push("Winding up a big attack.");
  if (m.dmg) p.push(`Attacks for ${num}.`);
  if (m.drain) p.push("Heals for unblocked damage.");
  if (m.perSpore) p.push(`+${m.perSpore} per Spore card you hold.`);
  if (m.block) p.push(`Gains ${m.block} Block.`);
  if (m.allyBlock) p.push(`Gives ${m.allyBlock} Block to its ally.`);
  if (m.allBlock) p.push(`Gives ${m.allBlock} Block to all enemies.`);
  if (m.reflect) p.push(`Gains Block equal to the damage you dealt it last turn (max ${m.reflect}).`);
  if (m.healAlly) p.push(`Heals its most wounded ally for ${m.healAlly}.`);
  if (m.drainEnergy) p.push(`You start your next turn with ${m.drainEnergy} less Energy.`);
  if (m.apply) p.push("Applies " + Object.keys(m.apply).map(k => `${m.apply[k]} ${STATUS[k].n}`).join(", ") + ".");
  if (m.str) p.push(`Gains ${m.str} Strength.`);
  if (m.heal) p.push(`Heals ${m.heal}.`);
  if (m.allyStr) p.push(`Gives ${m.allyStr} Strength to its allies.`);
  if (m.addDisc) p.push("Shuffles " + Object.keys(m.addDisc).map(k => `${m.addDisc[k]} ${CARDS[k].n}`).join(", ") + " into your discard pile.");
  if (m.thornsTemp) p.push(`Gains ${m.thornsTemp} Thorns this round.`);
  if (m.summon) {
    const cnt = {}; m.summon.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; });
    p.push("Summons " + Object.keys(cnt).map(id => cnt[id] > 1 ? `${cnt[id]} ${ENEMIES[id].n}s` : `a ${ENEMIES[id].n}`).join(" and ") + ".");
  }
  if (m.selfDestruct) p.push("Then it bursts.");
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
// translucent green wash plus pale puffs; px,py is the tile's top-left, seed keeps each tile's puffs fixed
function sporeOverlay(px, py, size, seed) {
  const pu = .5 + .5 * Math.sin(S.time * 2 + seed * 6), n = 5 + (hash(seed + 3.3) * 3 | 0);
  ctx.fillStyle = `rgba(90,200,80,${.22 + pu * .1})`; ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  for (let k = 0; k < n; k++) {
    const sx = px + 5 + hash(seed * 19 + k * 3.1) * (size - 10), sy = py + 5 + hash(seed * 7 + k * 5.7) * (size - 10), r = (1.8 + hash(seed + k * 9.1) * 2.6) * (size / 52) + pu * .8;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fillStyle = `rgba(190,255,170,${.45 + pu * .25})`; ctx.fill();
  }
}
// canvas vial for the Spore Antidote until assets/map-antidote.png exists
function drawAntidote(cx, cy, r, alpha) {
  const im = artReady("mapAntidote");
  ctx.save(); ctx.globalAlpha *= alpha;
  if (im) { const sz = r * 2.4; ctx.drawImage(im, cx - sz / 2, cy - sz / 2, sz, sz); ctx.restore(); return; }
  ctx.translate(cx, cy); const s = r / 15;
  ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14";
  ctx.beginPath(); ctx.moveTo(-4 * s, -13 * s); ctx.lineTo(4 * s, -13 * s); ctx.lineTo(4 * s, -6 * s); ctx.lineTo(11 * s, 8 * s); ctx.quadraticCurveTo(13 * s, 14 * s, 7 * s, 14 * s);
  ctx.lineTo(-7 * s, 14 * s); ctx.quadraticCurveTo(-13 * s, 14 * s, -11 * s, 8 * s); ctx.lineTo(-4 * s, -6 * s); ctx.closePath();
  ctx.fillStyle = "#cdf3f0"; ctx.fill();
  ctx.save(); ctx.clip(); ctx.fillStyle = "#3ed36a"; ctx.fillRect(-14 * s, 0, 28 * s, 16 * s); ctx.restore();
  ctx.stroke();
  ctx.fillStyle = "#b08a5a"; ctx.fillRect(-5 * s, -17 * s, 10 * s, 4 * s); ctx.strokeRect(-5 * s, -17 * s, 10 * s, 4 * s);
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.moveTo(-4 * s, 7 * s); ctx.lineTo(4 * s, 7 * s); ctx.moveTo(0, 3 * s); ctx.lineTo(0, 11 * s); ctx.stroke();
  ctx.restore();
}
// Zone 3's one-off tiles: art file if present, else a canvas icon
function uniqueArt(key, cx, cy, r) { const im = artReady(key); if (!im) return false; const sz = r * 2.4; ctx.drawImage(im, cx - sz / 2, cy - sz / 2, sz, sz); return true; }
function drawBeacon(cx, cy, r, alpha, lit) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const s = r / 15, pu = .5 + .5 * Math.sin(S.time * 3 + cx);
  if (lit) { const gl = ctx.createRadialGradient(cx, cy - 3 * s, 2, cx, cy - 3 * s, 28 * s); gl.addColorStop(0, `rgba(170,130,255,${.55 + pu * .3})`); gl.addColorStop(1, "rgba(170,130,255,0)"); ctx.fillStyle = gl; ctx.fillRect(cx - 30 * s, cy - 32 * s, 60 * s, 60 * s); }
  if (!uniqueArt("mapBeacon", cx, cy, r)) {
    ctx.translate(cx, cy); ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14";
    ctx.beginPath(); ctx.moveTo(-10 * s, 14 * s); ctx.lineTo(10 * s, 14 * s); ctx.lineTo(6 * s, 8 * s); ctx.lineTo(-6 * s, 8 * s); ctx.closePath(); ctx.fillStyle = "#2a2438"; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -15 * s); ctx.lineTo(8 * s, -3 * s); ctx.lineTo(0, 8 * s); ctx.lineTo(-8 * s, -3 * s); ctx.closePath(); ctx.fillStyle = lit ? "#d8c4ff" : "#7a5ad0"; ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.moveTo(-2 * s, -10 * s); ctx.lineTo(-5 * s, -3 * s); ctx.stroke();
  }
  ctx.restore();
}
function drawKeyIcon(cx, cy, r, alpha) {
  ctx.save(); ctx.globalAlpha *= alpha;
  if (!uniqueArt("mapOverrideKey", cx, cy, r)) {
    const s = r / 15; ctx.translate(cx, cy); ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14";
    rp(-13 * s, -9 * s, 26 * s, 18 * s, 3 * s); ctx.fillStyle = "#ffcf4a"; ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#6a4a10"; ctx.fillRect(-13 * s, -4 * s, 26 * s, 4 * s);
    ctx.fillStyle = "#5aff7a"; ctx.beginPath(); ctx.arc(8 * s, 4.5 * s, 2.6 * s, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#b8901c"; ctx.fillRect(-10 * s, 3 * s, 9 * s, 3.5 * s);
  }
  ctx.restore();
}
function drawHiveMapIcon(cx, cy, r, alpha) {
  ctx.save(); ctx.globalAlpha *= alpha;
  if (!uniqueArt("mapHiveMap", cx, cy, r)) {
    const s = r / 15, pu = .5 + .5 * Math.sin(S.time * 4); ctx.translate(cx, cy); ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(40,140,190,.55)"; ctx.fillRect(-13 * s, -13 * s, 26 * s, 26 * s);
    ctx.strokeStyle = "rgba(120,220,255,.6)"; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const k of [-4.3, 4.3]) { ctx.moveTo(k * s, -13 * s); ctx.lineTo(k * s, 13 * s); ctx.moveTo(-13 * s, k * s); ctx.lineTo(13 * s, k * s); }
    ctx.stroke(); ctx.strokeStyle = "#5ad0ff"; ctx.lineWidth = 2; ctx.strokeRect(-13 * s, -13 * s, 26 * s, 26 * s);
    ctx.beginPath(); ctx.arc(3 * s, -3 * s, (3 + pu * 1.5) * s, 0, TAU); ctx.fillStyle = "#e8fbff"; ctx.fill();
  }
  ctx.restore();
}
function drawPatrolIcon(cx, cy, hgt) {
  const key = "e_hiveGuard", img = artReady(key);
  if (img) { const tb = trimBox(key, img), sc = hgt / tb.h, w = tb.w * sc; ctx.drawImage(img, tb.x, tb.y, tb.w, tb.h, cx - w / 2, cy - hgt / 2, w, hgt); return; }
  const s = hgt / 44; ctx.save(); ctx.translate(cx, cy); ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14";
  ctx.beginPath(); ctx.arc(0, 2 * s, 17 * s, Math.PI, TAU); ctx.lineTo(15 * s, 18 * s); ctx.lineTo(-15 * s, 18 * s); ctx.closePath(); ctx.fillStyle = "#2a2236"; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -18 * s); ctx.lineTo(4 * s, -26 * s); ctx.lineTo(-4 * s, -26 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ff3a3a"; ctx.beginPath(); ctx.ellipse(0, 3 * s, 10 * s, 3.5 * s, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
function hiveVeins(px, py, size, seed) {
  ctx.strokeStyle = "rgba(170,105,230,.42)"; ctx.lineWidth = 1.6 * size / 52;
  for (let k = 0; k < 3; k++) {
    const a = hash(seed + k * 4.1), b = hash(seed * 2 + k * 7.3);
    ctx.beginPath(); ctx.moveTo(px + a * size, py); ctx.bezierCurveTo(px + b * size, py + size * .35, px + (1 - a) * size, py + size * .65, px + b * size * .8 + size * .1, py + size); ctx.stroke();
  }
}
function drawTileIcon(c, cx, cy, r, alpha = 1, lit = false) {
  if (c === "antidote") { drawAntidote(cx, cy, r, alpha); return; }
  if (c === "beacon") { drawBeacon(cx, cy, r, alpha, lit); return; }
  if (c === "overrideKey") { drawKeyIcon(cx, cy, r, alpha); return; }
  if (c === "hiveMap") { drawHiveMapIcon(cx, cy, r, alpha); return; }
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
  if (m.enc && over(590, 22, 280, 36)) setTip([{ t: "Sightings", d: sightings(m.enc).join(", ") }], 560, 66);   // this map's monster roster
  T(ZONE_GOAL[run.zone - 1] || "", 730, 64, 13, "rgba(255,255,255,.55)", "center");
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
  if (hasSpores()) {
    if (run.antidote) T("Antidote active: spores are harmless", 540, 216, 13, "#7affc0", "left", true);
    else T(`Spores spread in ${m.sporeIn} dig${m.sporeIn === 1 ? "" : "s"}`, 540, 216, 13, "#8fe06a", "left", true);
  }
  if (run.zone === 3) {
    const vis = (m.patrols || []).filter(p => isRevealed(p.x, p.y));
    T(vis.length || run.hiveMap ? `Patrols: ${vis.length} (hunting: ${vis.filter(hunting).length})` : "Patrols: ?", 540, 216, 13, "#ff6a5a", "left", true);
  }
  drawRelicRow(526, 236);
  // legend (Zone 2 adds spores and the Antidote; Zone 3 adds five entries and goes to 3 columns)
  T("Legend", 540, 276, 14, "#cfc6bb", "left", true);
  const leg = ["battle", "elite", "event", "camp", "trader", "cache", "cu", "ag", "au", "boss"];
  if (hasSpores()) leg.push("spore", "antidote");
  if (run.zone === 3) leg.push("beacon", "overrideKey", "hiveMap", "patrol", "hive");
  const cols = run.zone === 3 ? 3 : 2, rowH = run.zone === 3 ? 34 : leg.length > 10 ? 28 : 34, fs = run.zone === 3 ? 12 : 13, ir = run.zone === 3 ? 11 : 13;
  leg.forEach((c, i) => {
    const lx = cols === 3 ? 544 + (i % 3) * 130 : 548 + (i % 2) * 200, ly = 306 + ((i / cols) | 0) * rowH;
    if (c === "spore") {
      rp(lx - 1, ly - 13, 26, 26, 5); ctx.fillStyle = "#7a4a2a"; ctx.fill(); sporeOverlay(lx - 1, ly - 13, 26, 5.5);
      T("Spored tile", lx + 32, ly + 1, fs, "#d8d0c8");
    } else if (c === "patrol") { drawPatrolIcon(lx + 11, ly, 24); T("Hive Patrol", lx + 28, ly + 1, fs, "#d8d0c8"); }
    else if (c === "hive") { rp(lx - 1, ly - 11, 24, 24, 5); ctx.fillStyle = "#7a4a2a"; ctx.fill(); hiveVeins(lx - 1, ly - 11, 24, 3.7); T("Hive tunnel", lx + 28, ly + 1, fs, "#d8d0c8"); }
    else { drawTileIcon(c, lx + 12, ly, ir); T(NODE_INFO[c].n, lx + (cols === 3 ? 28 : 32), ly + 1, fs, "#d8d0c8"); }
  });
  if (run.zone === 1 && m.px === 4 && m.py === 0 && !run.shipRest) {
    const full = run.hp >= run.maxhp;
    btn(605, 526, 250, 30, full ? "Already at full HP" : "Rest in Ship: full heal", shipRest, { off: full, size: 14, bd: "#8aff9a" });
  }
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
      if (!tilesArt) {
        ctx.fillStyle = `rgb(${26 + h * 14 | 0},${21 + h * 10 | 0},${19 + h * 8 | 0})`; ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = "rgba(255,255,255,.05)";
        for (let k = 0; k < 4; k++) ctx.fillRect(px + 6 + hash(x * 7 + y * 13 + k) * (TILE - 14), py + 6 + hash(x * 11 + y * 5 + k * 3) * (TILE - 14), 2, 2);
      }
      if (run.zone === 3 && canReach(x, y)) {   // fog frontier: next to a tunnel, contents unknown (it may even be bedrock)
        const can = canDig(x, y), face = S.face && S.face.x === x && S.face.y === y, pr = .5 + .5 * Math.sin(S.time * 5);
        ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = can ? `rgba(205,190,255,${.6 + pr * .4})` : "rgba(205,190,255,.38)"; ctx.lineWidth = can ? 2.5 : 1.5; ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6); ctx.restore();
        if (face && can) {
          ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
          ctx.beginPath(); ctx.arc(px + TILE - 12, py + 12, 9, 0, TAU); ctx.fillStyle = "#3aa04a"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#0d0f14"; ctx.stroke();
          T("A", px + TILE - 12, py + 13, 12, "#fff", "center", true);
        }
        hit(px, py, TILE, TILE, () => clickTile(x, y));
        if (over(px, py, TILE, TILE)) hoverTile = { t, x, y, can, reach: true, fog: true };
      }
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
    if (t.spore && !t.dug) sporeOverlay(px, py, TILE, x * 31 + y * 17);
    if (t.hive) hiveVeins(px, py, TILE, x * 31 + y * 17);
    const reopen = t.dug && t.c === "trader";
    if (t.c && t.k !== "bedrock") {
      const beacon = t.c === "beacon", ia = beacon ? 1 : t.used ? .4 : t.dug && !reopen ? .5 : 1, ar = artReady("mapIcons");
      if (ar) { ctx.globalAlpha = ia; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fillStyle = "rgba(12,7,4,.55)"; ctx.fill(); ctx.globalAlpha = 1; }
      drawTileIcon(t.c, cx, cy, ar ? 18 : 15, ia, beacon && t.dug);   // a lit Beacon glows
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
  // start tile: Zone 1 shows the player's landed ship (Stage 5 sheet frame 1, cropped above the engine flames); later zones show the tunnel mouth
  const ship = artReady("ship"), sx0 = GX + 4 * TILE;
  if (run.zone > 1) {
    const mx = sx0 + TILE / 2, my = GY + TILE / 2 + 2;
    ctx.fillStyle = "#07050a"; ctx.strokeStyle = "#0d0f14"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(mx, my, 17, 12, 0, 0, TAU); ctx.fill();
    for (let k = 0; k < 11; k++) { const a = k / 11 * TAU + .3; ctx.beginPath(); ctx.arc(mx + Math.cos(a) * 19, my + Math.sin(a) * 14, 5 + hash(k * 3.1) * 2, 0, TAU); ctx.fillStyle = hash(k * 7.7) < .5 ? "#7a7268" : "#625b52"; ctx.fill(); ctx.stroke(); }
  } else if (ship) { const sh = TILE * 1.6, sw = sh * 116 / 150; ctx.drawImage(ship, 0, 0, 116, 150, GX + 4.5 * TILE - sw / 2, GY + TILE - 2 - sh, sw, sh); }
  else drawTileIcon("pod", sx0 + TILE / 2, GY + TILE / 2, 20);
  if (over(sx0, GY, TILE, TILE)) hoverTile = { ship: run.zone === 1, tunnel: run.zone > 1, x: 4, y: 0 };
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
  T(bossName(), lcx, ly + TILE + 14, 13, "#ff9a7a", "center", true);
  if (canReach(4, 10)) {
    ctx.strokeStyle = `rgba(255,226,122,${canDig(4, 10) ? .6 + .4 * Math.sin(S.time * 5) : .3})`; ctx.lineWidth = 3; ctx.strokeRect(lx + 2, ly + 2, TILE - 4, TILE - 4);
    hit(lx, ly, TILE, TILE, () => clickTile(4, 10));
    if (S.face && S.face.x === 4 && S.face.y === 10 && canDig(4, 10)) { ctx.beginPath(); ctx.arc(lx + TILE - 12, ly + 12, 9, 0, TAU); ctx.fillStyle = "#3aa04a"; ctx.fill(); T("A", lx + TILE - 12, ly + 13, 12, "#fff", "center", true); }
  }
  if (over(lx, ly, TILE, TILE)) hoverTile = { t: tileAt(4, 10), x: 4, y: 10, can: canDig(4, 10), reach: canReach(4, 10), lair: true };
  // Zone 3 patrols: only seen where the fog is lifted (the Hive Map shows them all, plus where they're heading)
  if (run.zone === 3) for (const p of m.patrols || []) {
    if (!isRevealed(p.x, p.y)) continue;
    const pcx = GX + p.x * TILE + TILE / 2, pcy = GY + p.y * TILE + TILE / 2, hunt = hunting(p), gl = ctx.createRadialGradient(pcx, pcy + 14, 2, pcx, pcy + 14, 24);
    gl.addColorStop(0, "rgba(255,50,40,.55)"); gl.addColorStop(1, "rgba(255,50,40,0)"); ctx.fillStyle = gl; ctx.fillRect(pcx - 26, pcy - 12, 52, 52);
    drawPatrolIcon(pcx, pcy - 2, 44);
    if (hunt) T("!", pcx + 15, pcy - 18, 18, Math.sin(S.time * 8) > 0 ? "#ff3a3a" : "#ff9a8a", "center", true);
    if (run.hiveMap) {
      const nx = hunt ? patrolPath(p)[0] : null;
      if (nx) { const dx = nx.x - p.x, dy = nx.y - p.y, ax = pcx + dx * 24, ay = pcy + dy * 24; ctx.fillStyle = "rgba(255,120,100,.85)"; ctx.beginPath(); ctx.moveTo(ax + dx * 8, ay + dy * 8); ctx.lineTo(ax - dy * 6, ay + dx * 6); ctx.lineTo(ax + dy * 6, ay - dx * 6); ctx.closePath(); ctx.fill(); }
      else T("?", pcx + 16, pcy - 16, 16, "rgba(255,200,190,.8)", "center", true);
    }
    if (over(pcx - 22, pcy - 24, 44, 48)) hoverTile = { patrol: true, x: p.x, y: p.y };
  }
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
    if (ht.ship) setTip([{ t: "Your Ship", d: run.shipRest ? "Already rested this run." : "Rest here once per run for a full heal." }], GX + ht.x * TILE + TILE + 6, GY + ht.y * TILE);
    else if (ht.tunnel) setTip([{ t: "Tunnel", d: `The shaft you came down from the ${ZONES[run.zone - 2]}.` }], GX + ht.x * TILE + TILE + 6, GY + ht.y * TILE);
    else if (ht.patrol) setTip([{ t: "Hive Patrol", d: "Moves one tile each time you dig. Hunts you within 6 tiles. Touching it starts a fight." }], GX + ht.x * TILE + TILE + 6, GY + ht.y * TILE);
    else if (ht.fog) setTip([{ t: "Unknown", d: "The psionic fog hides what's here. Dig to find out." }], GX + ht.x * TILE + TILE + 6, GY + ht.y * TILE);
    else if (rev) {
      const name = ht.lair ? bossName() + " (Boss)" : ht.t.k === "bedrock" ? "Bedrock" : ht.t.c ? NODE_INFO[ht.t.c].n : "Dirt";
      let d = ht.can ? "Click to select, click again (or press A) to dig." : ht.reach ? "Click to walk over and select it." : ht.reopen ? "Click to walk over and trade." : ht.t.k === "bedrock" ? "Can't be dug." : ht.t.dug ? (ht.t.used ? "Used. Click to walk here." : "Click to walk here.") : ht.lair ? "Dig the camp tile above it first." : "Not next to a tunnel.";
      const desc = { antidote: "Removes all Spore cards from your deck, stops the spread, and makes spored tiles harmless to dig.", beacon: "Lights up the fog around it once dug.", overrideKey: "Shuts down the Home Base Core's turrets for the final fight.", hiveMap: "Reveals the entire map and all patrols." }[ht.t.c];
      if (desc && !ht.t.dug) d = desc + " " + d;
      if (ht.t.spore && !ht.t.dug) d += run.antidote ? " Spored: harmless now. Digging here cleanses it." : " Spored: digging here adds a Spore card to your deck.";
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
  T(p.ambush ? "Ambush Survived" : p.nextZone ? "Boss Defeated" : "Battle Won", 480, 80, 32, "#8dff95", "center", true);
  const leave = () => p.nextZone ? enterZone(run.zone + 1) : completeNode();
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
    hit(x - 72, y - 102, 144, 204, () => { addCard(id); leave(); });
  });
  if (hovTip) setTip(cardTips(hovTip[0]), hovTip[1], hovTip[2]);
  btn(380, 540, 200, 48, p.nextZone ? "Descend" : "Skip", leave, { size: 18 });
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
  T(e.win ? "Home Base Core Down" : "Run Over", 480, 110, 44, e.win ? "#8dff95" : "#ff8a7a", "center", true);
  if (e.win) T("Victory! The Home Base has fallen.", 480, 165, 22, "#ffe27a", "center", true);
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
  else if (k.includes("thornback")) { enc = ["thornback"]; kind = "boss"; }
  else if (k.includes("homecore")) { enc = ["turret", "homeCore", "turret"]; kind = "boss"; }
  else if (k.includes("drone")) { enc = ["droneA", "droneB"]; kind = "elite"; }
  else enc = key.split(",").filter(id => ENEMIES[id]);
  if (!enc || !enc.length) enc = ["crawler", "spitter"];
  run.pending = { screen: "combat", kind, enc }; run.cur = null;
  saveRun(); openPending();
}
if (save.run && !(save.run.map && save.run.map.tiles && save.run.ore)) { save.run = null; writeSave(); S.toast = { text: "Old run discarded after update", t: 6 }; }
if (params.has("fight")) bootFight(params.get("fight"));
requestAnimationFrame(frame);
window.__s6 = { get run() { return run; }, get C() { return C; }, S, CARDS, RELICS, ENEMIES, save, playCard, endTurn, canAct, finishChoose, costOf, padMove, padA, padB, digTile, canDig, canReach, clickTile, moveDir, confirmMap, updateMap, tileAt, openTrader, openPending, completeNode, enterZone, shipRest, movePatrols, spawnPatrol, patrolAt, hunting, isRevealed, draw, canPay, D, gainOre, step: dt => { S.time += dt; if (C) updateCombat(dt); updateMap(dt); pollPad(dt); } };
})();
