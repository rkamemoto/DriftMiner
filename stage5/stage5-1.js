"use strict";
// Drift Miner — Stage 5 "Heart Run"
// Level 5-1: vessel outskirts (top-down). Boss: Hangar Warden (walker).
(() => {
const canvas = document.getElementById("stageFiveCanvas");
const ctx = canvas.getContext("2d");
const W = 960, H = 640, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const params = new URLSearchParams(location.search);

// ---------------------------------------------------------------- save data
const SAVE_KEY = "driftMinerStage5";
const WEAPONS = ["spread", "homing", "flak", "wingmen"];
const MAX_LV = 5;
const CAP_COST = { 2: 60, 3: 120, 4: 200, 5: 320 };
function defaultSave() { return { bank: 0, caps: { spread: 2, homing: 2, flak: 2, wingmen: 2 }, cleared: [] }; }
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (s && s.caps) return Object.assign(defaultSave(), s, { caps: Object.assign(defaultSave().caps, s.caps) });
  } catch (e) { /* storage unavailable */ }
  return defaultSave();
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
let save = loadSave();

// ---------------------------------------------------------------- synth audio
const Sfx = { ctx: null, master: null, noise: null, last: {} };
function audio() {
  if (!Sfx.ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      Sfx.ctx = new AC();
      Sfx.master = Sfx.ctx.createGain();
      Sfx.master.gain.value = .32;
      const comp = Sfx.ctx.createDynamicsCompressor();
      Sfx.master.connect(comp).connect(Sfx.ctx.destination);
      const len = Sfx.ctx.sampleRate;
      const buf = Sfx.ctx.createBuffer(1, len, len);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      Sfx.noise = buf;
    } catch (e) { return null; }
  }
  if (Sfx.ctx.state === "suspended") Sfx.ctx.resume();
  return Sfx.ctx;
}
function tone({ type = "square", f0 = 440, f1 = 0, dur = .1, vol = .2, delay = 0, attack = .004 }) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(Sfx.master);
  o.start(t); o.stop(t + dur + .03);
}
function noise({ dur = .2, vol = .3, f0 = 2000, f1 = 200, q = 1, delay = 0, type = "lowpass" }) {
  const a = audio(); if (!a || !Sfx.noise) return;
  const t = a.currentTime + delay;
  const s = a.createBufferSource(); s.buffer = Sfx.noise; s.loop = true;
  const fl = a.createBiquadFilter(); fl.type = type; fl.Q.value = q;
  fl.frequency.setValueAtTime(f0, t);
  fl.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl).connect(g).connect(Sfx.master);
  s.start(t, Math.random() * .5); s.stop(t + dur + .03);
}
const SFX_GAP = { shot: 75, hit: 45, debris: 40, eshot: 110, ping: 90, missile: 120, flak: 90, burst: 70, step: 120 };
function sfx(name) {
  if (!Sfx.ctx) return;
  const now = performance.now();
  const gap = SFX_GAP[name] || 0;
  if (gap && now - (Sfx.last[name] || 0) < gap) return;
  Sfx.last[name] = now;
  switch (name) {
    case "shot": tone({ type: "triangle", f0: 1250, f1: 820, dur: .05, vol: .035 }); break;
    case "flak": tone({ type: "square", f0: 320, f1: 140, dur: .08, vol: .05 }); break;
    case "burst": noise({ dur: .18, vol: .12, f0: 1600, f1: 200 }); break;
    case "missile": noise({ dur: .22, vol: .07, f0: 900, f1: 3200, type: "bandpass", q: 3 }); tone({ type: "sawtooth", f0: 180, f1: 420, dur: .16, vol: .03 }); break;
    case "eshot": tone({ type: "sine", f0: 560, f1: 360, dur: .1, vol: .045 }); break;
    case "hit": noise({ dur: .04, vol: .06, f0: 5000, f1: 2500, type: "highpass" }); break;
    case "ping": tone({ type: "sine", f0: 1900, f1: 1500, dur: .06, vol: .04 }); break;
    case "boom": noise({ dur: .45, vol: .3, f0: 1800, f1: 70 }); tone({ type: "sine", f0: 130, f1: 38, dur: .4, vol: .22 }); break;
    case "bigboom": noise({ dur: 1.3, vol: .5, f0: 2600, f1: 35 }); tone({ type: "sine", f0: 95, f1: 24, dur: 1.2, vol: .4 }); noise({ dur: .6, vol: .25, f0: 6000, f1: 800, type: "highpass", delay: .05 }); break;
    case "pickup": [520, 660, 880].forEach((f, i) => tone({ type: "triangle", f0: f, dur: .09, vol: .09, delay: i * .055 })); break;
    case "levelup": [520, 780, 1040, 1560].forEach((f, i) => tone({ type: "square", f0: f, dur: .1, vol: .05, delay: i * .06 })); tone({ type: "sine", f0: 2080, dur: .35, vol: .05, delay: .24 }); break;
    case "bonus": tone({ type: "sine", f0: 1320, f1: 1980, dur: .18, vol: .07 }); tone({ type: "sine", f0: 1980, f1: 2640, dur: .18, vol: .05, delay: .09 }); break;
    case "debris": tone({ type: "triangle", f0: 1700, f1: 2400, dur: .045, vol: .045 }); break;
    case "hurt": tone({ type: "sawtooth", f0: 190, f1: 55, dur: .32, vol: .18 }); noise({ dur: .25, vol: .18, f0: 1200, f1: 100 }); break;
    case "lifelost": [440, 330, 247, 165].forEach((f, i) => tone({ type: "square", f0: f, f1: f * .92, dur: .16, vol: .08, delay: i * .12 })); break;
    case "bomb": noise({ dur: 1.4, vol: .5, f0: 3200, f1: 50 }); tone({ type: "sine", f0: 70, f1: 28, dur: 1.2, vol: .5 }); tone({ type: "sawtooth", f0: 900, f1: 60, dur: .7, vol: .06 }); break;
    case "heart":
      tone({ type: "sine", f0: 55, f1: 38, dur: 1.5, vol: .5 });
      tone({ type: "sine", f0: 110, f1: 82, dur: 1.0, vol: .25 });
      [660, 990, 1320, 1980].forEach((f, i) => tone({ type: "triangle", f0: f, dur: .5, vol: .05, delay: .08 + i * .07 }));
      noise({ dur: .9, vol: .18, f0: 300, f1: 5000, type: "bandpass", q: 2 });
      break;
    case "heartready": tone({ type: "sine", f0: 660, dur: .14, vol: .07 }); tone({ type: "sine", f0: 990, dur: .22, vol: .07, delay: .12 }); break;
    case "warn": for (let i = 0; i < 4; i++) tone({ type: "square", f0: i % 2 ? 470 : 620, f1: i % 2 ? 620 : 470, dur: .34, vol: .07, delay: i * .36 }); break;
    case "stomp": tone({ type: "sine", f0: 75, f1: 30, dur: .35, vol: .45 }); noise({ dur: .3, vol: .25, f0: 500, f1: 50 }); break;
    case "step": tone({ type: "sine", f0: 60, f1: 40, dur: .12, vol: .12 }); break;
    case "charge": tone({ type: "sawtooth", f0: 140, f1: 1200, dur: 1.35, vol: .07 }); for (let i = 0; i < 3; i++) tone({ type: "square", f0: 880, dur: .08, vol: .06, delay: i * .35 }); break;
    case "lock": tone({ type: "square", f0: 1320, dur: .07, vol: .08 }); tone({ type: "square", f0: 1320, dur: .07, vol: .08, delay: .12 }); tone({ type: "square", f0: 1760, dur: .12, vol: .08, delay: .24 }); break;
    case "laser": tone({ type: "sawtooth", f0: 95, f1: 80, dur: 1.1, vol: .12 }); noise({ dur: 1.1, vol: .14, f0: 1800, f1: 1400, type: "bandpass", q: 4 }); break;
    case "shieldbreak": noise({ dur: .8, vol: .3, f0: 7000, f1: 300, type: "highpass" }); [1800, 1400, 1100, 800].forEach((f, i) => tone({ type: "triangle", f0: f, f1: f * .6, dur: .2, vol: .06, delay: i * .05 })); break;
    case "start": [330, 440, 554, 660, 880].forEach((f, i) => tone({ type: "triangle", f0: f, dur: .14, vol: .08, delay: i * .07 })); break;
    case "select": tone({ type: "triangle", f0: 880, dur: .05, vol: .05 }); break;
    case "buy": [660, 880, 1320].forEach((f, i) => tone({ type: "square", f0: f, dur: .08, vol: .05, delay: i * .05 })); break;
    case "deny": tone({ type: "square", f0: 180, f1: 150, dur: .15, vol: .07 }); break;
    case "tally": tone({ type: "triangle", f0: 1400, dur: .03, vol: .03 }); break;
    case "clear": [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone({ type: "triangle", f0: f, dur: .2, vol: .08, delay: i * .11 })); break;
  }
}

// ---------------------------------------------------------------- input
const keys = new Set();
const actions = new Set();
const act = a => actions.add(a);
const KEYMAP = {
  " ": ["bomb", "confirm"], x: "bomb", e: "heart", c: "heart", p: "pause", escape: "pause",
  enter: "confirm",
  arrowleft: "left", a: "left", arrowright: "right", d: "right", arrowup: "up", w: "up", arrowdown: "down", s: "down"
};
addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  audio();
  if (!e.repeat && KEYMAP[k]) [].concat(KEYMAP[k]).forEach(act);
  keys.add(k);
});
addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => keys.clear());
const mouse = { x: 0, y: 0, click: false };
function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
}
canvas.addEventListener("mousemove", ev => { const p = canvasPoint(ev); mouse.x = p.x; mouse.y = p.y; mouse.moved = true; });
canvas.addEventListener("click", ev => { audio(); const p = canvasPoint(ev); mouse.x = p.x; mouse.y = p.y; mouse.click = true; });

const pad = { prev: [], axes: [0, 0], focus: false, navX: 0, navY: 0 };
function pollPad() {
  let list = [];
  if (!pad.blocked) { try { list = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { pad.blocked = true; } }
  const p = Array.from(list || []).find(Boolean);
  if (!p) { pad.axes = [0, 0]; pad.focus = false; return; }
  const cur = p.buttons.map(b => !!(b && (b.pressed || b.value > .5)));
  const edge = i => cur[i] && !pad.prev[i];
  let ax = p.axes[0] || 0, ay = p.axes[1] || 0;
  const rawX = ax, rawY = ay;
  if (Math.abs(ax) < .18) ax = 0;
  if (Math.abs(ay) < .18) ay = 0;
  if (cur[14]) ax = -1; if (cur[15]) ax = 1; if (cur[12]) ay = -1; if (cur[13]) ay = 1;
  pad.axes = [ax, ay];
  pad.focus = !!(cur[5] || cur[7]);
  if (cur.some(Boolean)) audio();
  if (edge(1) || edge(2)) act("bomb");
  if (edge(3) || edge(4)) act("heart");
  if (edge(9)) act("pause");
  if (edge(0)) act("confirm");
  if (edge(14)) act("left"); if (edge(15)) act("right"); if (edge(12)) act("up"); if (edge(13)) act("down");
  const nx = Math.abs(rawX) > .6 ? Math.sign(rawX) : 0, ny = Math.abs(rawY) > .6 ? Math.sign(rawY) : 0;
  if (nx && nx !== pad.navX) act(nx < 0 ? "left" : "right");
  if (ny && ny !== pad.navY) act(ny < 0 ? "up" : "down");
  pad.navX = nx; pad.navY = ny;
  pad.prev = cur;
}
function moveInput() {
  let x = pad.axes[0], y = pad.axes[1];
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;
  if (keys.has("arrowup") || keys.has("w")) y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) y += 1;
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  return { x, y, focus: keys.has("shift") || pad.focus };
}

// ---------------------------------------------------------------- alien glyph script (same script as the Stage 4 consoles)
function alienRng(seed) {
  return () => {
    seed = Math.imul(seed ^ (seed >>> 15), seed | 1) ^ (seed + Math.imul(seed ^ (seed >>> 7), seed | 61));
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
}
function drawAlienGlyph(seed, gx, gy, s, color) {
  const r = alienRng(Math.imul(seed, 2654435761) >>> 0);
  const pts = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) pts.push([gx + i * s / 2, gy + j * s / 3]);
  const pick = () => pts[Math.floor(r() * 12)];
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.3, s / 8); ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(gx + s / 2, gy); ctx.lineTo(gx + s / 2, gy + s * .3); ctx.stroke();
  const n = 3 + Math.floor(r() * 3);
  for (let k = 0; k < n; k++) { const a = pick(), b = pick(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  if (r() < .5) { const c = pick(); ctx.beginPath(); ctx.arc(c[0], c[1], s / 10, 0, TAU); ctx.fill(); }
  if (r() < .3) { const c = pick(); ctx.beginPath(); ctx.arc(c[0], c[1], s / 5, 0, TAU); ctx.stroke(); }
}
function alienTextWidth(text, s) {
  const words = String(text).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  let w = 0;
  for (const word of words) w += Math.ceil(word.length / 2) * s * 1.25 + s * .8;
  return Math.max(0, w - s * .8 - s * .25);
}
function drawAlienText(text, tx, ty, s, color, align = "left") {
  if (align === "center") tx -= alienTextWidth(text, s) / 2;
  else if (align === "right") tx -= alienTextWidth(text, s);
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 5;
  let cx = tx;
  const words = String(text).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of words) {
    for (let i = 0; i < w.length; i += 2) {
      drawAlienGlyph(w.charCodeAt(i) * 131 + (w.charCodeAt(i + 1) || 7) * 17 + w.length, cx, ty, s, color);
      cx += s * 1.25;
    }
    cx += s * .8;
  }
  ctx.restore();
  return cx - tx;
}
// English HUD text (top-aligned like the glyph helpers)
function drawLabel(text, x, y, size, color, align = "left", weight = 700) {
  ctx.save();
  ctx.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = "top";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${Math.round(size * .08)}px`;
  ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
const fmt = n => Math.max(0, Math.floor(n)).toLocaleString("en-US");
// Alien numerals: every digit has its own fixed glyph, boxed by a small tick so digits read as numbers.
function numberWidth(n, s) { return String(Math.max(0, Math.floor(n))).length * s * .95; }
function drawAlienNumber(n, x, y, s, color, align = "left") {
  const str = String(Math.max(0, Math.floor(n)));
  const w = numberWidth(n, s);
  if (align === "right") x -= w; else if (align === "center") x -= w / 2;
  ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 4;
  for (let i = 0; i < str.length; i++) {
    const d = str.charCodeAt(i) - 48, gx = x + i * s * .95;
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, s / 10); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(gx, y + s + 2); ctx.lineTo(gx + s * .7, y + s + 2); ctx.stroke();
    // digit body: a dot-count row + a glyph stroke pattern, unique per digit
    drawAlienGlyph(d * 7919 + 4099, gx, y, s * .72, color);
  }
  ctx.restore();
  return w;
}

// ---------------------------------------------------------------- relic-style powerup icons (Stage 2 look)
const WEAPON_NAMES = { spread: "Spread Shot", homing: "Homing Missile", flak: "Flak Cannon", wingmen: "Wingmen", bomb: "Bomb", shield: "Force Shield" };
const PU_COLOR = { spread: "#ffd36e", homing: "#a97cff", flak: "#ffb44a", wingmen: "#7ee3a1", bomb: "#ff8f70", shield: "#6fe0ff" };
function drawPowerIcon(type, x, y, s = 1, spin = 0, halo = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const c = PU_COLOR[type] || "#fff";
  if (halo) {
    ctx.fillStyle = c + "38"; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
    ctx.strokeStyle = c + "99"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.stroke();
  }
  ctx.rotate(spin);
  ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (type === "spread") {
    for (let i = -2; i <= 2; i++) { const a = -Math.PI / 2 + i * .38; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 3, 6 + Math.sin(a) * 3); ctx.lineTo(Math.cos(a) * 13, 6 + Math.sin(a) * 13); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 7, 3.5, 0, TAU); ctx.fill();
  } else if (type === "homing") {
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(9, 8); ctx.lineTo(0, 4); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill();
  } else if (type === "flak") {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = TAU * i / 8, r = i % 2 === 0 ? 12 : 6; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill();
  } else if (type === "wingmen") {
    ctx.fillRect(-9, -5, 18, 10); ctx.fillStyle = "#20352c"; ctx.fillRect(-3, -2, 6, 4);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-14, -6); ctx.moveTo(9, 0); ctx.lineTo(14, -6); ctx.stroke();
  } else if (type === "shield") {
    ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; i ? ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11) : ctx.moveTo(Math.cos(a) * 11, Math.sin(a) * 11); } ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = .45; ctx.fill(); ctx.globalAlpha = 1;
  } else if (type === "bomb") {
    ctx.beginPath(); ctx.arc(0, 2, 9, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#f4f0e8"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, -6); ctx.quadraticCurveTo(8, -13, 13, -11); ctx.stroke();
    ctx.fillStyle = "#fff2a8"; ctx.beginPath(); ctx.arc(13, -11, 2.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function drawDebrisIcon(x, y, r, gold, spin = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(spin);
  ctx.fillStyle = gold ? "#f2c45b" : "#9db3bd";
  ctx.fillRect(-r, -r * .6, r * 2, r * 1.2);
  ctx.fillStyle = "rgba(104, 214, 199, 0.55)";
  ctx.fillRect(-r * .35, -r * .25, r * .7, r * .5);
  ctx.restore();
}
// Painted art from the game's asset folder (the artifact build supplies these inline)
function loadArt(src) { const i = new Image(); i.src = (window.__S5_ART && window.__S5_ART[src]) || src; return i; }
const ART = {
  ship: loadArt("assets/player-ship-sheet.png"),
  crystal: loadArt("../stage4/assets/level8-control-room/power-crystal-item-v1.png"),
  enemies: loadArt("assets/enemy-ships-sheet-v2.png"),
  hull: loadArt("assets/hull-5-1-painted.webp"),
  warden: loadArt("assets/hangar-warden-sheet.png")
};
const artReady = i => i.complete && i.naturalWidth > 0;
function drawCrystal(x, y, h) {
  if (!artReady(ART.crystal)) return;
  const w = h * 146 / 225;
  ctx.drawImage(ART.crystal, x - w / 2, y - h / 2, w, h);
}
function heartPath(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * .9);
  ctx.bezierCurveTo(x - s * 1.25, y + s * .05, x - s * .85, y - s * .95, x, y - s * .35);
  ctx.bezierCurveTo(x + s * .85, y - s * .95, x + s * 1.25, y + s * .05, x, y + s * .9);
  ctx.closePath();
}
function drawUiIcon(kind, x, y, s, color) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, s / 7); ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (kind === "play") { ctx.beginPath(); ctx.moveTo(-s * .35, -s * .45); ctx.lineTo(s * .45, 0); ctx.lineTo(-s * .35, s * .45); ctx.closePath(); ctx.fill(); }
  else if (kind === "pause") { ctx.fillRect(-s * .35, -s * .42, s * .24, s * .84); ctx.fillRect(s * .11, -s * .42, s * .24, s * .84); }
  else if (kind === "replay") { ctx.beginPath(); ctx.arc(0, 0, s * .38, -Math.PI * .2, Math.PI * 1.45); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * .38, -s * .38); ctx.lineTo(s * .34, -s * .06); ctx.lineTo(s * .06, -s * .2); ctx.closePath(); ctx.fill(); }
  else if (kind === "home") { ctx.beginPath(); ctx.moveTo(-s * .45, 0); ctx.lineTo(0, -s * .42); ctx.lineTo(s * .45, 0); ctx.moveTo(-s * .32, -s * .08); ctx.lineTo(-s * .32, s * .42); ctx.lineTo(s * .32, s * .42); ctx.lineTo(s * .32, -s * .08); ctx.stroke(); }
  else if (kind === "check") { ctx.beginPath(); ctx.moveTo(-s * .4, 0); ctx.lineTo(-s * .1, s * .3); ctx.lineTo(s * .42, -s * .32); ctx.stroke(); }
  else if (kind === "lock") { ctx.strokeRect(-s * .3, -s * .05, s * .6, s * .45); ctx.beginPath(); ctx.arc(0, -s * .05, s * .2, Math.PI, 0); ctx.stroke(); }
  else if (kind === "arrow") { ctx.beginPath(); ctx.moveTo(-s * .4, 0); ctx.lineTo(s * .35, 0); ctx.moveTo(s * .08, -s * .28); ctx.lineTo(s * .38, 0); ctx.lineTo(s * .08, s * .28); ctx.stroke(); }
  else if (kind === "move") { for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(s * .18, -s * .1); ctx.lineTo(s * .42, 0); ctx.lineTo(s * .18, s * .1); ctx.closePath(); ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, s * .1, 0, TAU); ctx.fill(); }
  else if (kind === "focus") { ctx.beginPath(); ctx.arc(0, 0, s * .36, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * .1, 0, TAU); ctx.fill(); }
  else if (kind === "heart") { if (artReady(ART.crystal)) drawCrystal(0, 0, s * 1.15); else { heartPath(0, 0, s * .42); ctx.fill(); } }
  else if (kind === "sealed") { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; i ? ctx.lineTo(Math.cos(a) * s * .45, Math.sin(a) * s * .45) : ctx.moveTo(Math.cos(a) * s * .45, Math.sin(a) * s * .45); } ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * .2, 0); ctx.lineTo(s * .2, 0); ctx.stroke(); }
  ctx.restore();
}
function keycap(label, x, y, w = 30) {
  ctx.save();
  ctx.fillStyle = "rgba(12,24,32,.9)"; ctx.strokeStyle = "rgba(143,240,255,.55)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 14, w, 28, 6) : ctx.rect(x - w / 2, y - 14, w, 28); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#dff7ff"; ctx.font = "700 13px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}
function padButton(label, color, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(12,24,32,.9)"; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = color; ctx.font = "700 12px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 1);
  ctx.restore();
}

// ---------------------------------------------------------------- world / background (alien vessel outskirts)
const SEG = 128;
const world = { scroll: 0, speed: 62, time: 0 };
const stars = Array.from({ length: 170 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .3, a: Math.random() * .6 + .2, p: Math.random() < .5 ? .25 : .5 }));
// Hull edge x-positions at a segment boundary (continuous between segments).
function hullLeft(i) { return 120 + Math.sin(i * .33) * 55 + Math.sin(i * 1.7) * 14 + (hash(i * 3.1) - .5) * 18 + (i % 29 > 25 ? 90 : 0); }
function hullRight(i) { return W - (120 + Math.sin(i * .27 + 1.3) * 55 + Math.sin(i * 1.3 + .4) * 14 + (hash(i * 5.7) - .5) * 18 + (i % 31 > 27 ? 90 : 0)); }
function segTop(i) { return world.scroll - (i + 1) * SEG + H; }
function drawSpace() {
  ctx.fillStyle = "#03060d"; ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(140, 200, 10, 140, 200, 360);
  g1.addColorStop(0, "rgba(93,35,132,.26)"); g1.addColorStop(1, "rgba(3,6,13,0)");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(840, 480, 10, 840, 480, 380);
  g2.addColorStop(0, "rgba(32,83,142,.24)"); g2.addColorStop(1, "rgba(3,6,13,0)");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  for (const s of stars) {
    const y = (s.y + world.scroll * s.p) % H;
    ctx.globalAlpha = s.a; ctx.fillStyle = "#dff7ff"; ctx.fillRect(s.x, y, s.r, s.r);
  }
  ctx.globalAlpha = 1;
}
function drawHullSegment(i) {
  const top = segTop(i), bot = top + SEG;
  const l0 = hullLeft(i), l1 = hullLeft(i + 1), r0 = hullRight(i), r1 = hullRight(i + 1);
  const h = hash(i + .5), h2 = hash(i * 7.3 + 2);
  ctx.save();
  // hull plate body
  ctx.beginPath();
  ctx.moveTo(l0, bot); ctx.lineTo(l1, top); ctx.lineTo(r1, top); ctx.lineTo(r0, bot); ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, "#141b25"); g.addColorStop(.5, "#1f2a38"); g.addColorStop(1, "#141b25");
  ctx.fillStyle = g; ctx.fill();
  ctx.clip();
  // panel seams
  ctx.strokeStyle = "rgba(90,116,140,.28)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, top + .5); ctx.lineTo(W, top + .5); ctx.stroke();
  const cols = 3 + Math.floor(h * 3);
  for (let c = 1; c < cols; c++) {
    const x = lerp(Math.min(l0, l1), Math.max(r0, r1), c / cols) + (hash(i * 11 + c) - .5) * 30;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
    ctx.fillStyle = "rgba(140,170,190,.25)";
    ctx.fillRect(x - 5, top + 6, 2, 2); ctx.fillRect(x + 3, top + 6, 2, 2); ctx.fillRect(x - 5, bot - 8, 2, 2); ctx.fillRect(x + 3, bot - 8, 2, 2);
  }
  // darker inset plates
  ctx.fillStyle = "rgba(8,12,18,.35)";
  const px = lerp(l0, r0, .2 + h2 * .4);
  ctx.fillRect(px, top + 18, 90 + h * 70, SEG - 40);
  ctx.strokeStyle = "rgba(120,150,175,.18)"; ctx.strokeRect(px, top + 18, 90 + h * 70, SEG - 40);
  // feature
  const cx = (l0 + r0) / 2 + (h2 - .5) * 180;
  if (h < .16) {
    // vent grill
    ctx.fillStyle = "rgba(4,7,11,.8)"; ctx.fillRect(cx - 50, top + 30, 100, 60);
    ctx.strokeStyle = "rgba(104,214,199,.25)";
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(cx - 44, top + 36 + k * 8); ctx.lineTo(cx + 44, top + 36 + k * 8); ctx.stroke(); }
    ctx.fillStyle = "rgba(255,120,80," + (.08 + .06 * Math.sin(world.time * 3 + i)) + ")"; ctx.fillRect(cx - 50, top + 30, 100, 60);
  } else if (h < .3) {
    // hangar hatch with chevrons
    ctx.fillStyle = "#0b1017"; ctx.fillRect(cx - 70, top + 14, 140, SEG - 28);
    ctx.strokeStyle = "#3b4e62"; ctx.lineWidth = 2; ctx.strokeRect(cx - 70, top + 14, 140, SEG - 28);
    ctx.beginPath(); ctx.moveTo(cx, top + 14); ctx.lineTo(cx, bot - 14); ctx.stroke();
    ctx.fillStyle = "rgba(242,196,91,.55)";
    for (let k = 0; k < 4; k++) {
      const yy = top + 26 + k * 22;
      ctx.beginPath(); ctx.moveTo(cx - 60, yy); ctx.lineTo(cx - 48, yy); ctx.lineTo(cx - 40, yy + 8); ctx.lineTo(cx - 52, yy + 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 60, yy); ctx.lineTo(cx + 48, yy); ctx.lineTo(cx + 40, yy + 8); ctx.lineTo(cx + 52, yy + 8); ctx.fill();
    }
    const blink = Math.sin(world.time * 4 + i) > 0;
    ctx.fillStyle = blink ? "#ff5a6e" : "#3a1820";
    ctx.beginPath(); ctx.arc(cx - 76, top + 20, 3, 0, TAU); ctx.arc(cx + 76, top + 20, 3, 0, TAU); ctx.fill();
  } else if (h < .46) {
    // glowing conduit
    const x = cx;
    ctx.strokeStyle = "rgba(20,30,40,1)"; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
    ctx.strokeStyle = h2 < .5 ? "rgba(63,216,216,.55)" : "rgba(176,130,214,.6)"; ctx.lineWidth = 4;
    ctx.shadowBlur = 10; ctx.shadowColor = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke(); ctx.shadowBlur = 0;
    const py = top + ((world.time * 120 + i * 40) % SEG);
    ctx.fillStyle = "#e8ffff"; ctx.beginPath(); ctx.arc(x, py, 3, 0, TAU); ctx.fill();
  } else if (h < .58) {
    // sensor dome
    const rg = ctx.createRadialGradient(cx - 8, top + 56, 4, cx, top + 64, 34);
    rg.addColorStop(0, "#6b5a86"); rg.addColorStop(1, "#1b1626");
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(cx, top + 64, 32, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(176,130,214,.5)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "rgba(255,154,104," + (.4 + .4 * Math.sin(world.time * 2 + i)) + ")";
    ctx.beginPath(); ctx.arc(cx, top + 64, 6, 0, TAU); ctx.fill();
  } else if (h < .7) {
    // alien glyph marking painted on hull
    ctx.globalAlpha = .28;
    drawAlienText("outer ring " + (i % 7), cx - 60, top + 50, 16, "#b082d6");
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // edge trim + lights
  ctx.save();
  ctx.lineWidth = 3; ctx.strokeStyle = "#3b4e62";
  ctx.beginPath(); ctx.moveTo(l0, bot); ctx.lineTo(l1, top); ctx.moveTo(r0, bot); ctx.lineTo(r1, top); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = "rgba(176,130,214,.55)"; ctx.shadowBlur = 8; ctx.shadowColor = "#b082d6";
  ctx.beginPath(); ctx.moveTo(l0 + 6, bot); ctx.lineTo(l1 + 6, top); ctx.moveTo(r0 - 6, bot); ctx.lineTo(r1 - 6, top); ctx.stroke();
  ctx.shadowBlur = 0;
  if (i % 2 === 0) {
    const on = Math.sin(world.time * 5 + i * 1.7) > .3;
    ctx.fillStyle = on ? "#69e9ff" : "#123038";
    ctx.beginPath(); ctx.arc(lerp(l0, l1, .5) + 12, top + SEG / 2, 2.5, 0, TAU); ctx.arc(lerp(r0, r1, .5) - 12, top + SEG / 2, 2.5, 0, TAU); ctx.fill();
  }
  // outer struts / antennae hanging off the edge
  if (hash(i * 2.9) < .22) {
    const side = hash(i * 4.1) < .5 ? -1 : 1, ex = side < 0 ? l0 : r0, len = 40 + hash(i) * 60;
    ctx.strokeStyle = "#2c3a4a"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(ex, top + 60); ctx.lineTo(ex + side * len, top + 40); ctx.stroke();
    ctx.fillStyle = "#ff5a6e"; ctx.globalAlpha = .5 + .5 * Math.sin(world.time * 6 + i);
    ctx.beginPath(); ctx.arc(ex + side * len, top + 40, 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
// Painted-style hull strip (seamless, 960 x 2560) + animated lights and conduit pulses on top
const HULL_L = 2560;
function drawHullArt() {
  // painted hull (two Codex paintings blended into one seamless loop)
  const Lh = ART.hull.naturalHeight, s = world.scroll % Lh;
  ctx.drawImage(ART.hull, 0, s);
  ctx.drawImage(ART.hull, 0, s - Lh);
  // slow drifting light sweep so the hull feels alive
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const sy = ((world.time * 40) % (H + 400)) - 200, g = ctx.createLinearGradient(0, sy - 160, 0, sy + 160);
  g.addColorStop(0, "rgba(120,90,200,0)"); g.addColorStop(.5, "rgba(120,90,200,.05)"); g.addColorStop(1, "rgba(120,90,200,0)");
  ctx.fillStyle = g; ctx.fillRect(0, sy - 160, W, 320);
  ctx.restore();
}
function drawBackground() {
  if (G && G.side && mode !== "title") { drawCanyon(); return; }
  drawSpace();
  if (artReady(ART.hull)) drawHullArt();
  else {
    const i0 = Math.floor(world.scroll / SEG) - 1, i1 = Math.ceil((world.scroll + H) / SEG) + 1;
    for (let i = Math.max(0, i0); i <= i1; i++) drawHullSegment(i);
  }
  // soft vignette on the far edges
  const v = ctx.createLinearGradient(0, 0, W, 0);
  v.addColorStop(0, "rgba(0,0,0,.45)"); v.addColorStop(.12, "rgba(0,0,0,0)"); v.addColorStop(.88, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- game state
let G = null;
let mode = "title";        // title | play | over | clear | shop | next
let modeT = 0;
function freshPlayer() {
  return {
    x: W / 2, y: H - 90, hull: 100, maxHull: 100, lives: 3, inv: 2, alive: true, respawn: 0, enterT: 0,
    primary: "pulse", lv: { spread: 0, homing: 0, flak: 0, wingmen: 0 },
    bombs: 2, fireCd: 0, flakCd: 0, missileCd: .4, missileSide: 1, wingCd: 0, sparkCd: 0,
    debris: 0, score: 0, heart: 0, heartReady: false, tilt: 0,
    wing: [{ x: W / 2 - 42, y: H - 70 }, { x: W / 2 + 42, y: H - 70 }]
  };
}
const HEART_MAX = 60;
function startLevel(level = 1, atBoss = false) {
  if (typeof level === "boolean") { atBoss = level; level = 1; }
  const side = level === 2;
  world.speed = side ? 90 : 62; world.scroll = 0;
  G = {
    level, side, flatten: 0,
    t: 0, player: freshPlayer(), enemies: [], bullets: [], ebullets: [], drops: [], debris: [], fx: [], pops: [],
    texts: [], boss: null, script: side ? buildScript52() : buildScript(), scriptIdx: 0, shake: 0, flash: 0, flashColor: "#ffffff",
    bossTriggered: false, warn: 0, waves: [], paused: false, kills: 0, overT: 0, clearDelay: 0, bossKilled: false
  };
  mode = "play"; modeT = 0;
  if (side) { const p = G.player; p.x = 150; p.y = H / 2; p.trail = []; p.shield = 0; p.wing.forEach(w => { w.x = p.x; w.y = p.y; }); }
  if (atBoss) {
    const p = G.player;
    p.lv = { spread: 2, homing: 1, flak: 0, wingmen: 1 }; p.primary = "spread"; p.bombs = 3; p.heart = 40;
    G.t = side ? SCRIPT52_END : SCRIPT_END; G.scriptIdx = G.script.length; side ? startLeviathan() : startBoss();
  }
}

// ---------------------------------------------------------------- effects
function spark(x, y, color, n = 8, spd = 180, life = .5, size = 2.5) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = spd * (.3 + Math.random());
    G.fx.push({ k: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (.6 + Math.random() * .6), max: life, color, size });
  }
}
function explode(x, y, size = 1, palette = ["#ffd36e", "#ff8f5a", "#f06d72"]) {
  G.fx.push({ k: "flash", x, y, r: 26 * size, life: .18, max: .18 });
  G.fx.push({ k: "ring", x, y, r: 6, grow: 180 * size, life: .4, max: .4, color: palette[0] });
  for (let i = 0; i < 10 * size; i++) {
    const a = Math.random() * TAU, v = 60 + Math.random() * 190 * size;
    G.fx.push({ k: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .35 + Math.random() * .45, max: .8, color: palette[i % palette.length], size: 2 + Math.random() * 2.5 * size });
  }
  for (let i = 0; i < 4 * size; i++) G.fx.push({ k: "smoke", x: x + rand(-10, 10) * size, y: y + rand(-10, 10) * size, vx: rand(-20, 20), vy: rand(-20, 20) + world.speed * .5, r: rand(8, 16) * size, life: .9, max: .9 });
}
function addPop(x, y, type, lv, cap, bonus) { G.pops.push({ x, y, type, lv, cap, bonus, life: 1.3, max: 1.3 }); }
function shake(v) { G.shake = Math.max(G.shake, v); }
function flash(v, color = "#ffffff") { G.flash = Math.max(G.flash, v); G.flashColor = color; }

// ---------------------------------------------------------------- player & weapons
const PLAYER_SPEED = 330, FOCUS_SPEED = 165;
function wlv(type) { return G.player.lv[type]; }
function pushBullet(b) { G.bullets.push(Object.assign({ life: 2, r: 4, dmg: 1, kind: "pulse", lv: 1 }, b)); }
function firePrimary(p) {
  const prim = p.primary, L = prim === "pulse" ? 0 : wlv(prim);
  if (prim === "spread" && L > 0) {
    const n = [3, 5, 7, 7, 9][L - 1], step = [.19, .16, .14, .13, .11][L - 1], dmg = [1, 1.15, 1.3, 1.55, 1.8][L - 1], r = [3.5, 4.5, 5.5, 6.2, 7][L - 1];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i - (n - 1) / 2) * step;
      pushBullet({ x: p.x + Math.cos(a) * 10, y: p.y - 16, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, dmg, r, kind: "spread", lv: L });
    }
    p.fireCd = .12;
  } else {
    // base pulse (twin) — with flak, a single center pulse keeps up the stream
    if (prim === "flak") pushBullet({ x: p.x, y: p.y - 20, vx: 0, vy: -820, dmg: 1, r: 3 });
    else { pushBullet({ x: p.x - 7, y: p.y - 16, vx: 0, vy: -820, dmg: 1, r: 3 }); pushBullet({ x: p.x + 7, y: p.y - 16, vx: 0, vy: -820, dmg: 1, r: 3 }); }
    p.fireCd = .11;
  }
  sfx("shot");
}
function fireFlak(p) {
  const L = wlv("flak");
  const shells = L >= 5 ? [-16, 0, 16] : L >= 3 ? [-12, 12] : [0];
  for (const off of shells) pushBullet({ x: p.x + off, y: p.y - 18, vx: off * 4, vy: -560, fuse: .72, dmg: [3.5, 4.5, 6, 7.5, 9][L - 1], blast: [34, 44, 56, 64, 74][L - 1], r: [5, 6, 7, 8, 9][L - 1], kind: "flak", lv: L });
  p.flakCd = [.32, .27, .22, .2, .18][L - 1];
  sfx("flak");
}
function fireMissiles(p) {
  const L = wlv("homing");
  const sides = L === 1 ? [p.missileSide] : L >= 5 ? [-1, 0, 1] : [-1, 1];
  p.missileSide *= -1;
  for (const s of sides) pushBullet({ x: G.side ? p.x : p.x + s * 14, y: G.side ? p.y + s * 12 : p.y, vx: G.side ? 110 : s * 170, vy: G.side ? s * 170 : -110, kind: "missile", lv: L, dmg: [3, 3.6, 4.5, 5.2, 6][L - 1], r: [4, 5, 6, 6.5, 7][L - 1], speed: 160, maxSpeed: [480, 520, 570, 610, 650][L - 1], turn: [4, 5, 6.2, 7, 8][L - 1], life: 3, trail: [] });
  p.missileCd = [.85, .7, .55, .48, .42][L - 1];
  sfx("missile");
}
function fireWingmen(p) {
  const L = wlv("wingmen");
  for (const w of p.wing) {
    const dmg = [.8, .9, 1, 1.15, 1.3][L - 1];
    if (L >= 2) { pushBullet({ x: w.x - 4, y: w.y - 10, vx: 0, vy: -800, dmg, r: 3, kind: "wing", lv: L }); pushBullet({ x: w.x + 4, y: w.y - 10, vx: 0, vy: -800, dmg, r: 3, kind: "wing", lv: L }); }
    else pushBullet({ x: w.x, y: w.y - 10, vx: 0, vy: -800, dmg, r: 3, kind: "wing", lv: L });
  }
  p.wingCd = .17;
}
function fireSparks(p) {
  for (const w of p.wing) pushBullet({ x: w.x, y: w.y - 8, vx: rand(-60, 60), vy: -260, kind: "missile", spark: true, lv: 1, dmg: 1.5, r: 3, speed: 260, maxSpeed: 560, turn: 7, life: 2, trail: [] });
  p.sparkCd = .7;
}
function applyPowerup(type, x, y) {
  const p = G.player;
  if (type === "shield") {
    if (p.shield < 3) { p.shield = 3; sfx("levelup"); addPop(x, y, "shield", 0, 0, false); }
    else { p.score += 1000; p.debris += 5; sfx("bonus"); addPop(x, y, "shield", 0, 0, true); }
    return;
  }
  if (type === "bomb") {
    if (p.bombs < 6) { p.bombs++; sfx("pickup"); addPop(x, y, "bomb", 0, 0, false); }
    else { p.score += 1000; p.debris += 5; sfx("bonus"); addPop(x, y, "bomb", 0, 0, true); }
    return;
  }
  if (type === "spread" || type === "flak") p.primary = type;
  const cap = save.caps[type];
  if (p.lv[type] < cap) {
    p.lv[type]++;
    sfx(p.lv[type] > 1 ? "levelup" : "pickup");
    addPop(x, y, type, p.lv[type], cap, false);
    if (type === "wingmen" && p.lv[type] === 1) { p.wing[0].x = p.x; p.wing[0].y = p.y; p.wing[1].x = p.x; p.wing[1].y = p.y; }
  } else {
    p.score += 1000; p.debris += 5;
    sfx("bonus");
    addPop(x, y, type, p.lv[type], cap, true);
  }
}
function useBomb() {
  const p = G.player;
  if (!p.alive || p.bombs <= 0 || G.waves.some(w => w.kind === "bomb")) return;
  p.bombs--;
  p.inv = Math.max(p.inv, 1.6);
  G.waves.push({ kind: "bomb", x: p.x, y: p.y, t: 0, dur: .9 });
  for (const b of G.ebullets) spark(b.x, b.y, "#ffd3b0", 2, 80, .3, 2);
  G.ebullets.length = 0;
  for (const e of G.enemies) if (onScreen(e)) damageEnemy(e, 30);
  bossAreaDamage(45, 0);
  sfx("bomb"); shake(14); flash(.55, "#ffd9b8");
}
function useHeart() {
  const p = G.player;
  if (!p.alive || p.heart < HEART_MAX) return;
  p.heart = 0; p.heartReady = false;
  p.inv = Math.max(p.inv, 1.2);
  G.waves.push({ kind: "heart", x: p.x, y: p.y, t: 0, dur: 1.2 });
  for (const b of G.ebullets) spark(b.x, b.y, "#f1c8ff", 2, 90, .35, 2);
  G.ebullets.length = 0;
  for (const e of G.enemies) if (onScreen(e) && !e.dead) killEnemy(e, true);
  bossAreaDamage(0, 1);
  sfx("heart"); shake(18); flash(.8, "#e6b8ff");
}
function bossAreaDamage(flat, pulse) {
  const b = G.boss; if (!b || b.state !== "fight") return;
  if (b.kind === "leviathan") {
    for (const s of b.segs) if (s.sac && s.sac.alive) damageSac(s, pulse ? s.sac.max * .3 : flat);
    if (b.ph2) damageLevHead(pulse ? b.maxCore * .08 : flat);
  } else {
    for (const a of b.arms) if (a.alive) damageArm(a, pulse ? a.max * .3 : flat);
    if (bossCoreOpen()) damageCore(pulse ? b.maxCore * .08 : flat);
  }
}
function hurtPlayer(amount) {
  const p = G.player;
  if (!p.alive || p.inv > 0) return;
  if (p.shield > 0) { p.shield--; p.inv = .6; sfx("ping"); sfx("hit"); spark(p.x, p.y, "#6fe0ff", 16, 220, .45, 2.5); G.fx.push({ k: "ring", x: p.x, y: p.y, r: 20, grow: 120, life: .35, max: .35, color: "#6fe0ff", width: 4 }); return; }
  p.hull -= amount;
  p.inv = 1.4;
  sfx("hurt"); shake(9); flash(.35, "#ff6070");
  spark(p.x, p.y, "#9ff5e8", 14, 220, .5, 2.5);
  // lose part of the carried debris — it scatters and can be grabbed back
  const lost = Math.floor(p.debris * .2);
  if (lost > 0) {
    p.debris -= lost;
    const pieces = Math.min(10, lost);
    for (let i = 0; i < pieces; i++) {
      const v = Math.floor(lost / pieces) + (i < lost % pieces ? 1 : 0);
      const a = Math.random() * TAU, s = rand(160, 300);
      G.debris.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value: v, gold: v >= 5, spin: Math.random() * TAU, delay: .7, life: 7 });
    }
  }
  if (p.hull <= 0) {
    p.hull = 0; p.lives--; p.alive = false; p.respawn = 1.5;
    explode(p.x, p.y, 2.2, ["#9ff5e8", "#68d6c7", "#f1c8ff", "#ffffff"]);
    sfx("bigboom"); sfx("lifelost"); shake(20);
    if (p.lives <= 0) G.overT = 2.2;
  }
}
function updatePlayer(dt) {
  if (G.side) return updatePlayerSide(dt);
  const p = G.player;
  if (!p.alive) {
    if (p.lives > 0) {
      p.respawn -= dt;
      if (p.respawn <= 0) { p.alive = true; p.hull = p.maxHull; p.inv = 2.8; p.x = W / 2; p.y = H + 40; p.enterT = .6; p.bombs = Math.max(p.bombs, 2); }
    }
    return;
  }
  p.inv = Math.max(0, p.inv - dt);
  const m = moveInput();
  if (p.enterT > 0) { p.enterT -= dt; p.y = lerp(p.y, H - 90, 1 - Math.pow(.001, dt)); }
  else {
    const sp = m.focus ? FOCUS_SPEED : PLAYER_SPEED;
    p.x = clamp(p.x + m.x * sp * dt, 24, W - 24);
    p.y = clamp(p.y + m.y * sp * dt, 60, H - 28);
  }
  p.focus = m.focus;
  p.tilt = lerp(p.tilt, m.x, 1 - Math.pow(.0005, dt));
  // weapons (auto-fire)
  p.fireCd -= dt; if (p.fireCd <= 0) firePrimary(p);
  if (p.primary === "flak" && wlv("flak") > 0) { p.flakCd -= dt; if (p.flakCd <= 0) fireFlak(p); }
  if (wlv("homing") > 0) { p.missileCd -= dt; if (p.missileCd <= 0) fireMissiles(p); }
  if (wlv("wingmen") > 0) {
    const off = [[-44, 18], [44, 18]];
    p.wing.forEach((w, i) => { const k = 1 - Math.pow(.0008, dt); w.x = lerp(w.x, p.x + off[i][0], k); w.y = lerp(w.y, p.y + off[i][1], k); });
    p.wingCd -= dt; if (p.wingCd <= 0) fireWingmen(p);
    if (wlv("wingmen") >= 3) { p.sparkCd -= dt; if (p.sparkCd <= 0) { fireSparks(p); p.sparkCd = [.7, .7, .7, .5, .35][wlv("wingmen") - 1]; } }
  }
  if (p.heart >= HEART_MAX && !p.heartReady) { p.heartReady = true; sfx("heartready"); }
}

// ---------------------------------------------------------------- enemies (Stage 2/3 alien ships)
const ETYPES = {
  scout:       { hp: 3,  r: 16, scale: 1,    color: "#f06d72", core: "#ffd4d6", speed: 150, score: 100, heart: 1, debris: [1, 2], shape: "dart" },
  interceptor: { hp: 2,  r: 13, scale: .85,  color: "#ff9a68", core: "#ffd4d6", speed: 230, score: 120, heart: 1, debris: [1, 1], shape: "dart" },
  stinger:     { hp: 2,  r: 17, scale: 1.12, color: "#d66cff", core: "#f1c8ff", speed: 230, score: 150, heart: 1, debris: [2, 3], gold: .3, shape: "wing" },
  armored:     { hp: 22, r: 24, scale: 1.3,  color: "#b082d6", core: "#ffd4d6", speed: 75,  score: 400, heart: 3, debris: [3, 5], shape: "dart", plated: true },
  carrier:     { hp: 11, r: 24, scale: 1.4,  color: "#f2c45b", core: "#fff2a8", speed: 85,  score: 500, heart: 2, debris: [2, 4], shape: "dart", plated: true },
  turret:      { hp: 16,  r: 18, ground: true, speed: 0, score: 250, heart: 2, debris: [2, 3] }
};
function spawnEnemy(type, x, y, pattern, opts = {}) {
  const d = ETYPES[type];
  const e = Object.assign({ type, x, y, px: x, py: y, vx: 0, vy: d.speed, hp: d.hp, maxHp: d.hp, r: d.r, pattern, age: 0, fireCd: rand(.9, 2.2), heading: Math.PI / 2, flash: 0, x0: x, phase: Math.random() * TAU, shoots: Math.random() < .55 }, opts);
  if (type === "stinger" && G.t > 55) { e.hp = e.maxHp = 3; }
  G.enemies.push(e);
  return e;
}
const eSpeedMul = () => 1 + Math.min(.35, G.t / 300);
function enemyShoot(x, y, angle, speed = 200, r = 5, color = "#ff5fae") {
  G.ebullets.push({ x, y, vx: Math.cos(angle) * speed * eSpeedMul(), vy: Math.sin(angle) * speed * eSpeedMul(), r, color, age: 0 });
}
const aimAt = (x, y) => Math.atan2(G.player.y - y, G.player.x - x);
function updateEnemy(e, dt) {
  if (G.side) return updateEnemySide(e, dt);
  e.age += dt; e.flash = Math.max(0, e.flash - dt);
  const d = ETYPES[e.type];
  const ox = e.x, oy = e.y;
  switch (e.pattern) {
    case "down": e.y += d.speed * dt; break;
    case "sine": e.y += d.speed * .85 * dt; e.x = e.x0 + Math.sin(e.age * 2.3 + e.phase) * (e.amp || 90); break;
    case "dive": {
      if (!e.locked) {
        e.y += d.speed * .8 * dt;
        if (e.y > (e.lockY || 120)) { e.locked = true; const a = aimAt(e.x, e.y); e.vx = Math.cos(a) * 120; e.vy = Math.sin(a) * 120; }
      } else {
        const sp = Math.min(380, Math.hypot(e.vx, e.vy) + 420 * dt), a = Math.atan2(e.vy, e.vx);
        e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp;
        e.x += e.vx * dt; e.y += e.vy * dt;
      }
      break;
    }
    case "side": {
      // enter from a side, curling toward the bottom
      if (e.ang === undefined) e.ang = e.dir > 0 ? .15 : Math.PI - .15;
      const target = Math.PI / 2 - e.dir * .5;
      e.ang += clamp(target - e.ang, -1.25 * dt, 1.25 * dt);
      e.x += Math.cos(e.ang) * d.speed * dt; e.y += Math.sin(e.ang) * d.speed * dt;
      if (!e.shot && e.age > .9 && e.y > 40) { e.shot = true; enemyShoot(e.x, e.y, aimAt(e.x, e.y), 210); sfx("eshot"); }
      break;
    }
    case "hover": {
      if (e.age < (e.hold || 6)) { e.y = lerp(e.y, e.stopY || 150, 1 - Math.pow(.2, dt)); e.x = e.x0 + Math.sin(e.age * .9 + e.phase) * 40; }
      else e.y += d.speed * 1.4 * dt;
      break;
    }
    case "ground": e.y += world.speed * dt; break;
  }
  if (e.pattern === "ground") e.heading = aimAt(e.x, e.y);
  else if (e.pattern === "hover") e.heading = Math.PI / 2 + clamp((e.x - ox) / (dt || 1) / 300, -.35, .35);
  else {
    const dx = e.x - ox, dy = e.y - oy;
    if (dx || dy) e.heading = Math.atan2(dy, dx);
  }
  // firing
  if (e.y > 20 && e.y < H * .72 && G.player.alive) {
    e.fireCd -= dt;
    if (e.fireCd <= 0) {
      if (e.type === "scout" && e.shoots) { enemyShoot(e.x, e.y + 10, aimAt(e.x, e.y), 200); e.fireCd = rand(2.2, 3.4); sfx("eshot"); }
      else if (e.type === "armored") { const a = aimAt(e.x, e.y); for (let k = -1; k <= 1; k++) enemyShoot(e.x, e.y + 16, a + k * .2, 185, 6); e.fireCd = 1.8; sfx("eshot"); }
      else if (e.type === "carrier") { for (let k = 0; k < 8; k++) enemyShoot(e.x, e.y, e.age + k * TAU / 8, 130, 5, "#ffc36e"); e.fireCd = 2.6; sfx("eshot"); }
      else if (e.type === "turret") { const a = aimAt(e.x, e.y); enemyShoot(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, a, 210); e.second = .14; e.fireCd = 2.3; sfx("eshot"); }
      else e.fireCd = 99;
    }
  }
  if (e.second > 0) { e.second -= dt; if (e.second <= 0 && G.player.alive) { const a = aimAt(e.x, e.y); enemyShoot(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, a, 210); } }
  if (e.y > H + 60 || e.x < -90 || e.x > W + 90 || e.y < -260) { if (e.age > 1) { e.gone = true; if (e.group) e.group.failed = true; } }
}
function damageEnemy(e, dmg) {
  if (e.dead) return;
  e.hp -= dmg; e.flash = .07;
  sfx("hit");
  if (e.hp <= 0) killEnemy(e, false);
}
function killEnemy(e, byHeart) {
  if (e.dead) return;
  e.dead = true;
  const d = ETYPES[e.type], p = G.player;
  G.kills++;
  p.score += d.score;
  if (!byHeart) p.heart = Math.min(HEART_MAX, p.heart + d.heart);
  explode(e.x, e.y, e.type === "armored" || e.type === "carrier" || e.type === "turret" ? 1.5 : 1, e.type === "stinger" ? ["#f1c8ff", "#d66cff", "#ffffff"] : undefined);
  sfx(e.type === "armored" || e.type === "carrier" ? "boom" : "burst");
  if (e.type === "armored" || e.type === "carrier") shake(5);
  const n = irand(d.debris[0], d.debris[1]);
  for (let i = 0; i < n; i++) {
    const gold = Math.random() < (d.gold || .12);
    const a = Math.random() * TAU, s = rand(30, 110);
    G.debris.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value: gold ? 5 : 1, gold, spin: Math.random() * TAU, delay: 0, life: 9 });
  }
  if (e.drop) G.drops.push({ type: e.drop, x: e.x, y: e.y, age: 0, x0: e.x, y0: e.y });
  // squadron bonus: wipe out a whole group before any of it escapes
  const g = e.group;
  if (g && !g.failed && !g.paid) {
    g.killed++;
    if (g.killed >= g.total) {
      g.paid = true;
      const bonus = g.total * 4, pieces = Math.ceil(bonus / 5);
      for (let i = 0; i < pieces; i++) { const a = i / pieces * TAU, s = rand(90, 170); G.debris.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value: 5, gold: true, spin: Math.random() * TAU, delay: .15, life: 9 }); }
      G.fx.push({ k: "ring", x: e.x, y: e.y, r: 10, grow: 260, life: .5, max: .5, color: "#f2c45b", width: 4 });
      sfx("bonus"); sfx("pickup");
    }
  }
}

// ---------------------------------------------------------------- level 5-1 script (fleet thickens as you go)
const SCRIPT_END = 104;
function buildScript() {
  const s = [];
  const at = (t, fn) => s.push({ t, fn });
  const grp = total => ({ total, killed: 0, failed: false, paid: false });
  const line = (type, n, x0, dx, pattern, opts = {}) => { const group = grp(n); for (let i = 0; i < n; i++) spawnEnemy(type, x0 + i * dx, -30 - (opts.stagger || 0) * i, pattern, Object.assign({ phase: i * .5, group }, opts)); };
  const vee = (type, n, cx, pattern = "down") => { const group = grp(n); for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; spawnEnemy(type, cx + k * 46, -30 - Math.abs(k) * 34, pattern, { lockY: 110 + Math.abs(k) * 20, group }); } };
  const side = (type, n, from) => { const dir = from === "left" ? 1 : -1, group = grp(n); for (let i = 0; i < n; i++) spawnEnemy(type, from === "left" ? -30 - i * 44 : W + 30 + i * 44, 40 + i * 26, "side", { dir, group }); };
  const carrier = (drop, x) => spawnEnemy("carrier", x, -40, "hover", { drop, stopY: 130, hold: 7 });
  const armored = (x, stopY = 160) => spawnEnemy("armored", x, -40, "hover", { stopY, hold: 8 });
  const turrets = xs => { const group = grp(xs.length); xs.forEach(x => spawnEnemy("turret", x, -30, "ground", { fireCd: rand(1.2, 2.4), group })); };
  const divers = (n, gap) => { let group = null; for (let i = 0; i < n; i++) at(G_t_now + i * gap, () => { if (!group || i === 0) group = grp(n); spawnEnemy("interceptor", rand(160, W - 160), -30, "dive", { lockY: rand(90, 170), group }); }); };
  let G_t_now = 0;
  // opening
  at(2, () => line("scout", 5, W / 2 - 160, 80, "down", { stagger: 18 }));
  at(5.5, () => line("scout", 5, W / 2 - 160, 80, "sine", { amp: 70 }));
  at(8.5, () => side("stinger", 4, "left"));
  at(11, () => carrier("spread", W * .32));
  at(13, () => turrets([W * .3, W * .7]));
  at(15, () => vee("interceptor", 5, W * .68, "dive"));
  at(18, () => side("stinger", 4, "right"));
  at(21, () => line("scout", 6, 210, 108, "sine"));
  at(24, () => { armored(W * .3); armored(W * .7, 190); });
  at(28, () => carrier("wingmen", W * .64));
  at(30, () => vee("interceptor", 7, W * .4, "dive"));
  at(33, () => turrets([W * .24, W * .5, W * .76]));
  at(35, () => { side("stinger", 4, "left"); side("stinger", 4, "right"); });
  at(39, () => line("scout", 8, 150, 94, "down", { stagger: 14 }));
  at(42, () => carrier("homing", W * .5));
  at(44, () => { armored(W * .22, 150); armored(W * .5, 200); armored(W * .78, 150); });
  G_t_now = 48; divers(6, .45);
  at(52, () => carrier("flak", W * .36));
  at(54, () => turrets([W * .32, W * .68]));
  at(56, () => { side("stinger", 5, "left"); side("stinger", 5, "right"); });
  at(60, () => line("scout", 8, 150, 94, "sine", { amp: 60 }));
  at(63, () => carrier("bomb", W * .68));
  at(65, () => { armored(W * .35, 170); vee("interceptor", 5, W * .7, "dive"); });
  at(70, () => { vee("scout", 9, W * .5, "down"); });
  at(73, () => turrets([W * .22, W * .42, W * .62, W * .82]));
  at(74, () => carrier("spread", W * .26));
  at(77, () => { side("stinger", 6, "left"); side("stinger", 6, "right"); });
  at(81, () => { armored(W * .3, 150); armored(W * .7, 150); line("scout", 6, 230, 100, "sine", { amp: 50 }); });
  at(85, () => carrier("wingmen", W * .6));
  G_t_now = 87; divers(8, .35);
  at(91, () => { vee("interceptor", 7, W * .35, "dive"); side("stinger", 5, "right"); });
  at(94, () => carrier("homing", W * .45));
  at(95, () => turrets([W * .3, W * .5, W * .7]));
  at(97, () => { line("scout", 9, 110, 92, "down", { stagger: 10 }); });
  at(SCRIPT_END - 3, () => { G.warn = 3.2; sfx("warn"); });
  at(SCRIPT_END, () => startBoss());
  return s.sort((a, b) => a.t - b.t);
}

// ---------------------------------------------------------------- boss: Hangar Warden (walker)
const LEGS = [
  { hx: -62, hy: -30, rx: -132, ry: -82, g: 0 },
  { hx: 62, hy: -30, rx: 132, ry: -82, g: 1 },
  { hx: -60, hy: 36, rx: -128, ry: 100, g: 1 },
  { hx: 60, hy: 36, rx: 128, ry: 100, g: 0 }
];
const LASER_WARN = 1.45;
function startBoss() {
  if (G.bossTriggered) return;
  G.bossTriggered = true;
  if (G.warn <= 0) { G.warn = 3.2; sfx("warn"); }
  const b = {
    x: W / 2, y: -230, state: "wait", t: 0, moveT: 0, stomp: 0, stompCd: 6, fanCd: 3.2, spiralT: 0, spiralCd: 0, spiralAng: 0,
    laser: null, laserCd: 5, minionCd: 8, hpCore: 820, maxCore: 820, flash: 0, pingT: 0, eyeT: 0, ph2: false, ph2T: 0, dieT: 0, boomCd: 0,
    arms: [-1, 1].map((side, i) => ({ side, hp: 330, max: 330, alive: true, flash: 0, cd: 1.2 + i * .8, burst: 0, burstCd: 0, aim: side < 0 ? Math.PI : 0 }))
  };
  b.feet = LEGS.map(l => ({ x: b.x + l.rx, y: b.y + l.ry, step: 0, sx: 0, sy: 0, tx: 0, ty: 0, lift: 0 }));
  G.boss = b;
}
const armPos = (b, a) => ({ x: b.x + a.side * 90 + Math.cos(a.aim) * 34, y: b.y + 8 + Math.sin(a.aim) * 34 });
const bossCoreOpen = () => G.boss && G.boss.state === "fight" && G.boss.ph2;
function damageArm(a, dmg) {
  const b = G.boss;
  if (!a.alive || !b || b.state !== "fight") return;
  a.hp -= dmg; a.flash = .06; sfx("hit");
  if (a.hp <= 0) {
    a.alive = false; a.hp = 0;
    const p = armPos(b, a);
    explode(p.x, p.y, 2.4); sfx("bigboom"); shake(14);
    G.player.score += 3000;
    for (let i = 0; i < 6; i++) { const ang = Math.random() * TAU; G.debris.push({ x: p.x, y: p.y, vx: Math.cos(ang) * 120, vy: Math.sin(ang) * 120, value: i < 2 ? 5 : 1, gold: i < 2, spin: 0, delay: 0, life: 9 }); }
    if (!b.arms.some(x => x.alive)) {
      b.ph2 = true; b.ph2T = 1.4; b.laser = null; b.laserCd = 3; b.spiralCd = 1.5; b.stompCd = 4;
      sfx("shieldbreak"); flash(.6, "#fff2a8");
      for (let i = 0; i < 24; i++) spark(b.x, b.y + 8, "#8ff7ff", 1, 320, .6, 3);
    }
  }
}
function damageCore(dmg) {
  const b = G.boss;
  if (!b || b.state !== "fight") return;
  b.hpCore -= dmg; b.flash = .06; sfx("hit");
  if (b.hpCore <= 0) {
    b.hpCore = 0; b.state = "dying"; b.dieT = 0; b.laser = null;
    G.ebullets.length = 0;
    for (const e of G.enemies) if (!e.dead) killEnemy(e, true);
    sfx("boom"); shake(10);
  }
}
function updateBoss(dt) {
  const b = G.boss, p = G.player;
  b.t += dt; b.flash = Math.max(0, b.flash - dt); b.pingT = Math.max(0, b.pingT - dt); b.eyeT += dt;
  for (const a of b.arms) a.flash = Math.max(0, a.flash - dt);
  if (b.state === "wait") { if (G.warn <= 0) { b.state = "enter"; b.t = 0; } }
  else if (b.state === "enter") {
    b.y = lerp(-230, 214, ease(clamp(b.t / 3.4, 0, 1)));
    if (b.t >= 3.4) { b.state = "fight"; b.t = 0; }
  } else if (b.state === "fight") {
    const sp = b.ph2 ? .62 : .45, amp = b.ph2 ? 250 : 200;
    if (!b.laser && b.ph2T <= 0) b.moveT += dt;
    b.x = W / 2 + Math.sin(b.moveT * sp) * amp;
    b.y = 214 + Math.sin(b.moveT * 1.1) * 10;
    b.ph2T = Math.max(0, b.ph2T - dt);
    const core = { x: b.x, y: b.y + 8 };
    // arms: aimed 3-round bursts
    for (const a of b.arms) {
      if (!a.alive) continue;
      const pvx = b.x + a.side * 90, pvy = b.y + 8;
      const want = a.side < 0 ? clamp(aimAt(pvx, pvy), 1.85, Math.PI) : clamp(aimAt(pvx, pvy), 0, 1.3);
      a.aim = lerp(a.aim, want, 1 - Math.pow(.05, dt));
      const tip = { x: pvx + Math.cos(a.aim) * 62, y: pvy + Math.sin(a.aim) * 62 };
      a.cd -= dt;
      if (a.cd <= 0 && a.burst === 0) { a.burst = 3; a.burstCd = 0; a.cd = 1.7; }
      if (a.burst > 0) { a.burstCd -= dt; if (a.burstCd <= 0) { { const o = (a.burst % 2 ? 8 : -8); enemyShoot(tip.x - Math.sin(a.aim) * o, tip.y + Math.cos(a.aim) * o, a.aim, 235, 6, "#ff7a66"); } a.burst--; a.burstCd = .11; sfx("eshot"); } }
    }
    if (!b.ph2) {
      b.fanCd -= dt;
      if (b.fanCd <= 0) { for (let k = 0; k < 9; k++) enemyShoot(core.x, core.y + 30, Math.PI / 2 + (k - 4) * .22, 165, 6, "#ffc36e"); b.fanCd = 3.6; sfx("eshot"); }
    } else if (b.ph2T <= 0) {
      // phase 2: rotating spiral streams + aimed laser + hangar minions
      b.spiralCd -= dt;
      if (b.spiralCd <= 0) { b.spiralT = 2.8; b.spiralCd = 5; }
      if (b.spiralT > 0 && !b.laser) {
        b.spiralT -= dt;
        b.spiralEmit = (b.spiralEmit || 0) - dt;
        if (b.spiralEmit <= 0) {
          b.spiralAng += .33;
          for (let k = 0; k < 3; k++) enemyShoot(core.x, core.y, b.spiralAng + k * TAU / 3, 150, 5, "#ff5fae");
          b.spiralEmit = .085; sfx("eshot");
        }
      }
      b.laserCd -= dt;
      if (!b.laser && b.laserCd <= 0 && b.spiralT <= 0) { b.laser = { t: 0, ang: clamp(aimAt(core.x, core.y + 30), .35, Math.PI - .35), fired: false }; sfx("charge"); }
      b.minionCd -= dt;
      if (b.minionCd <= 0) { spawnEnemy("interceptor", b.x - 120, b.y + 60, "dive", { lockY: b.y + 90 }); spawnEnemy("interceptor", b.x + 120, b.y + 60, "dive", { lockY: b.y + 90 }); b.minionCd = 9; }
    }
    if (b.laser) {
      const L = b.laser; L.t += dt;
      if (L.t < 1.1) L.ang = lerp(L.ang, clamp(aimAt(core.x, core.y + 30), .35, Math.PI - .35), 1 - Math.pow(.3, dt));
      if (L.t >= 1.1 && !L.locked) { L.locked = true; sfx("lock"); }
      if (L.t >= LASER_WARN && !L.fired) { L.fired = true; sfx("laser"); shake(6); }
      if (L.t >= LASER_WARN && L.t < LASER_WARN + 1.1 && p.alive) {
        const ox = core.x, oy = core.y + 30, dx = Math.cos(L.ang), dy = Math.sin(L.ang), wx = p.x - ox, wy = p.y - oy;
        const along = wx * dx + wy * dy, perp = Math.abs(wx * dy - wy * dx);
        if (along > 0 && perp < 20) hurtPlayer(30);
      }
      if (L.t >= LASER_WARN + 1.1) { b.laser = null; b.laserCd = 7; }
    }
    // stomp: shockwave + bullet ring
    b.stompCd -= dt;
    if (b.stompCd <= 0 && !b.laser) { b.stomp = .55; b.stompCd = b.ph2 ? 5 : 6.5; b.stomped = false; }
    if (b.stomp > 0) {
      b.stomp -= dt;
      if (b.stomp < .25 && !b.stomped) {
        b.stomped = true; sfx("stomp"); shake(10);
        G.fx.push({ k: "ring", x: b.x, y: b.y + 20, r: 40, grow: 520, life: .7, max: .7, color: "#b082d6", width: 6 });
        const n = b.ph2 ? 20 : 14, off = Math.random() * TAU;
        for (let k = 0; k < n; k++) enemyShoot(b.x, b.y + 20, off + k * TAU / n, 135, 6, "#d66cff");
      }
    }
    // body contact
    if (p.alive && Math.hypot(p.x - b.x, p.y - b.y - 8) < 92) hurtPlayer(35);
  } else if (b.state === "dying") {
    b.dieT += dt;
    b.boomCd -= dt;
    if (b.boomCd <= 0) { explode(b.x + rand(-90, 90), b.y + rand(-60, 70), rand(1, 1.8)); sfx("boom"); shake(8); b.boomCd = .14; }
    if (b.dieT > 2.6) {
      explode(b.x, b.y, 4, ["#fff2a8", "#ffd36e", "#f06d72", "#ffffff"]);
      sfx("bigboom"); shake(26); flash(1, "#fff6dc");
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * TAU, s = rand(80, 260), gold = i < 10;
        G.debris.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value: gold ? 5 : 1, gold, spin: 0, delay: .3, life: 12 });
      }
      G.player.score += 20000;
      G.boss = null; G.bossKilled = true; G.clearDelay = 3.2;
      return;
    }
  }
  // legs: feet stay planted on the hull and step in diagonal pairs
  for (let i = 0; i < 4; i++) {
    const l = LEGS[i], f = b.feet[i];
    if (f.step > 0) {
      f.step += dt / .26;
      const k = Math.min(1, f.step);
      f.x = lerp(f.sx, f.tx, ease(k)); f.y = lerp(f.sy, f.ty, ease(k)); f.lift = Math.sin(k * Math.PI);
      if (k >= 1) { f.step = 0; f.lift = 0; if (b.state === "fight" || b.state === "enter") sfx("step"); }
    } else {
      f.y += world.speed * dt;
      const tx = b.x + l.rx, ty = b.y + l.ry;
      const otherStepping = b.feet.some((o, j) => o.step > 0 && LEGS[j].g !== l.g);
      if (b.state !== "dying" && !otherStepping && Math.hypot(f.x - tx, f.y - ty) > 38) {
        f.step = .0001; f.sx = f.x; f.sy = f.y; f.tx = tx + (tx - f.x) * .45; f.ty = ty + (ty - f.y) * .45;
      }
    }
  }
}

// ---------------------------------------------------------------- targets for player shots
function collectTargets() {
  const t = [];
  for (const e of G.enemies) if (!e.dead && onScreen(e)) t.push({ x: e.x, y: e.y, r: e.r, e });
  const b = G.boss;
  if (b && b.kind === "leviathan") {
    if (b.state === "fight") {
      for (const s of b.segs) { if (s.sac && s.sac.alive) t.push({ x: s.x, y: s.y, r: s.r * .7, sac: s }); else t.push({ x: s.x, y: s.y, r: s.r * .85, seg: s }); }
      t.push({ x: b.x, y: b.y, r: 34, head: true });
    }
  } else if (b && b.state === "fight") {
    for (const a of b.arms) if (a.alive) { const p = armPos(b, a); t.push({ x: p.x, y: p.y, r: 36, arm: a }); }
    t.push({ x: b.x, y: b.y + 8, r: 34, core: true });
  }
  return t;
}
function hitTarget(tg, dmg) {
  if (tg.sac) return damageSac(tg.sac, dmg);
  if (tg.head) return damageLevHead(dmg);
  if (tg.seg) { if (Math.random() < .3) spark(tg.x, tg.y, "#d9c8ff", 2, 90, .15, 1.6); return; }
  if (tg.e) damageEnemy(tg.e, dmg);
  else if (tg.arm) damageArm(tg.arm, dmg);
  else if (tg.core) {
    if (bossCoreOpen()) damageCore(dmg);
    else { G.boss.pingT = .15; sfx("ping"); }
  }
}
function nearestTarget(x, y) {
  let best = null, bd = Infinity;
  for (const tg of collectTargets()) {
    if (tg.core && !bossCoreOpen()) continue;
    if (tg.seg || (tg.head && !G.boss.ph2)) continue;
    const d = Math.hypot(tg.x - x, tg.y - y) - (G.side ? (tg.x > x ? 0 : 200) : (tg.y < y ? 0 : 200));
    if (d < bd) { bd = d; best = tg; }
  }
  return best;
}
function flakBurst(b) {
  G.fx.push({ k: "ring", x: b.x, y: b.y, r: 6, grow: b.blast * 3.2, life: .28, max: .28, color: "#ffb44a", width: 3 + b.lv });
  G.fx.push({ k: "flash", x: b.x, y: b.y, r: b.blast * .8, life: .14, max: .14, color: "rgba(255,190,110," });
  spark(b.x, b.y, "#ffd36e", 4 + b.lv * 2, 160, .3, 2);
  for (const tg of collectTargets()) if (Math.hypot(tg.x - b.x, tg.y - b.y) < b.blast + tg.r) hitTarget(tg, b.dmg);
  sfx("burst");
}
function updateBullets(dt) {
  const targets = collectTargets();
  for (const b of G.bullets) {
    b.life -= dt;
    if (b.kind === "missile") {
      if (!b.target || (b.target.e && b.target.e.dead) || (b.target.arm && !b.target.arm.alive) || (b.target.core && !bossCoreOpen()) || (b.target.sac && !b.target.sac.sac.alive) || (!G.boss && (b.target.sac || b.target.head || b.target.core || b.target.arm))) b.target = nearestTarget(b.x, b.y);
      let ang = Math.atan2(b.vy, b.vx);
      if (b.target) {
        const tgt = b.target, bs = G.boss;
        const tx = tgt.e ? tgt.e.x : tgt.arm ? armPos(bs, tgt.arm).x : tgt.sac ? tgt.sac.x : bs ? bs.x : b.x;
        const ty = tgt.e ? tgt.e.y : tgt.arm ? armPos(bs, tgt.arm).y : tgt.sac ? tgt.sac.y : bs ? bs.y : b.y - 100;
        const want = Math.atan2(ty - b.y, tx - b.x);
        let dA = ((want - ang + Math.PI * 3) % TAU) - Math.PI;
        ang += clamp(dA, -b.turn * dt, b.turn * dt);
      }
      b.speed = Math.min(b.maxSpeed, b.speed + 900 * dt);
      b.vx = Math.cos(ang) * b.speed; b.vy = Math.sin(ang) * b.speed;
      b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > (b.spark ? 5 : 9)) b.trail.shift();
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.kind === "flak") { b.fuse -= dt; if (b.fuse <= 0) { flakBurst(b); b.dead = true; continue; } }
    if (b.y < -40 || b.y > H + 40 || b.x < -40 || b.x > W + 40 + (b.len || 0) || b.life <= 0) { b.dead = true; continue; }
    if (b.kind === "beam") { // piercing charge beam: hits each target once along its length
      for (const tg of targets) { const ref = tg.e || tg.sac || tg.seg || tg.arm || tg.core || tg.head; if (b.hits.has(ref) || (tg.e && tg.e.dead)) continue;
        if (Math.abs(tg.y - b.y) < tg.r + b.r && tg.x > b.x - b.len - tg.r && tg.x < b.x + tg.r) { b.hits.add(ref); hitTarget(tg, b.dmg); spark(tg.x, tg.y, "#bff8ff", 5, 160, .25, 2); if (tg.seg) { b.dead = true; break; } } }
      continue;
    }
    for (const tg of targets) {
      if (tg.e && tg.e.dead) continue;
      if (Math.hypot(tg.x - b.x, tg.y - b.y) < tg.r + b.r) {
        if (b.kind === "flak") flakBurst(b);
        else { hitTarget(tg, b.dmg); spark(b.x, b.y, b.kind === "missile" ? "#d7b8ff" : b.kind === "spread" ? "#ffe6a0" : "#bff8ff", 2, 120, .18, 1.8); }
        b.dead = true; break;
      }
    }
  }
  G.bullets = G.bullets.filter(b => !b.dead);
}
function updateEnemyBullets(dt) {
  const p = G.player;
  for (const b of G.ebullets) {
    b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < -20 || b.x > W + 20 || b.y < -40 || b.y > H + 20) { b.dead = true; continue; }
    if (p.alive && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 4) { b.dead = true; hurtPlayer(20); }
  }
  G.ebullets = G.ebullets.filter(b => !b.dead);
}

// ---------------------------------------------------------------- per-frame play update
function updatePickups(dt) {
  const p = G.player;
  for (const d of G.drops) {
    d.age += dt;
    if (G.side) { d.x -= 52 * dt; d.y = (d.y0 ?? d.y) + Math.sin(d.age * 1.8) * 34; }
    else { d.y += 52 * dt; d.x = d.x0 + Math.sin(d.age * 1.8) * 34; }
    if (p.alive && Math.hypot(d.x - p.x, d.y - p.y) < 30) { d.dead = true; applyPowerup(d.type, d.x, d.y); }
    if (d.y > H + 30 || d.x < -30) d.dead = true;
  }
  G.drops = G.drops.filter(d => !d.dead);
  const vacuum = G.bossKilled;
  for (const d of G.debris) {
    d.life -= dt; d.spin += dt * 3;
    d.delay = Math.max(0, d.delay - dt);
    const dx = p.x - d.x, dy = p.y - d.y, dist = Math.hypot(dx, dy);
    if (p.alive && d.delay <= 0 && (dist < 110 || vacuum)) {
      const pull = vacuum ? 900 : 700;
      d.vx = lerp(d.vx, dx / (dist || 1) * pull, 1 - Math.pow(.02, dt));
      d.vy = lerp(d.vy, dy / (dist || 1) * pull, 1 - Math.pow(.02, dt));
    } else {
      if (G.side) { d.vy *= Math.pow(.25, dt); d.vx = lerp(d.vx, -world.speed, 1 - Math.pow(.25, dt)); } else { d.vx *= Math.pow(.25, dt); d.vy = lerp(d.vy, world.speed, 1 - Math.pow(.25, dt)); }
    }
    d.x += d.vx * dt; d.y += d.vy * dt;
    if (p.alive && d.delay <= 0 && dist < 20) { d.dead = true; p.debris += d.value; p.score += 10 * d.value; sfx("debris"); }
    if (d.y > H + 30 || d.x < -30 || d.life <= 0) d.dead = true;
  }
  G.debris = G.debris.filter(d => !d.dead);
}
function updateFx(dt) {
  for (const f of G.fx) {
    f.life -= dt;
    if (f.k === "spark") { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= Math.pow(.08, dt); f.vy *= Math.pow(.08, dt); }
    else if (f.k === "smoke") { f.x += f.vx * dt; f.y += f.vy * dt; f.r += 14 * dt; }
    else if (f.k === "ring") f.r += f.grow * dt;
  }
  G.fx = G.fx.filter(f => f.life > 0);
  if (G.fx.length > 900) G.fx.splice(0, G.fx.length - 900);
  for (const q of G.texts) { q.life -= dt; q.y -= 36 * dt; }
  G.texts = G.texts.filter(q => q.life > 0);
  for (const q of G.pops) { q.life -= dt; q.y -= 30 * dt; }
  G.pops = G.pops.filter(q => q.life > 0);
  for (const w of G.waves) w.t += dt;
  G.waves = G.waves.filter(w => w.t < w.dur);
  G.shake = Math.max(0, G.shake - dt * 30);
  G.flash = Math.max(0, G.flash - dt * 2.2);
}
function updatePlay(dt) {
  world.time += dt;
  const bossOn = !!G.boss || G.bossKilled;
  world.speed = lerp(world.speed, G.side ? (bossOn ? 40 : 90) : (bossOn ? 24 : 62), 1 - Math.pow(.3, dt));
  world.scroll += world.speed * dt;
  if (!G.bossTriggered) G.t += dt;
  while (G.scriptIdx < G.script.length && G.script[G.scriptIdx].t <= G.t) G.script[G.scriptIdx++].fn();
  G.warn = Math.max(0, G.warn - dt);
  if (actions.has("bomb")) useBomb();
  if (actions.has("heart")) useHeart();
  updatePlayer(dt);
  updateBullets(dt);
  for (const e of G.enemies) {
    updateEnemy(e, dt);
    const p = G.player;
    if (!e.dead && !e.gone && p.alive && !ETYPES[e.type].ground && Math.hypot(e.x - p.x, e.y - p.y) < e.r + 10) { hurtPlayer(30); damageEnemy(e, 10); }
  }
  G.enemies = G.enemies.filter(e => !e.dead && !e.gone);
  if (G.boss) (G.boss.kind === "leviathan" ? updateLeviathan : updateBoss)(dt);
  updateEnemyBullets(dt);
  updatePickups(dt);
  updateFx(dt);
  if (G.overT > 0) { G.overT -= dt; if (G.overT <= 0) { mode = "over"; modeT = 0; menuSel = 0; } }
  if (G.bossKilled && G.clearDelay > 0) {
    G.clearDelay -= dt;
    if (G.clearDelay <= 0) enterClear();
  }
}

// ---------------------------------------------------------------- clear / shop / next
let menuSel = 0;
let titleLevel = Math.max(1, Math.min(2, Number(params.get("level")) || 1));
let clearInfo = null;
function enterClear() {
  const p = G.player;
  clearInfo = { from: save.bank, to: save.bank + p.debris, shown: save.bank, carried: p.debris, score: p.score, tick: 0 };
  save.bank += p.debris;
  const lvName = "5-" + G.level; if (!save.cleared.includes(lvName)) save.cleared.push(lvName);
  writeSave();
  G.bullets.length = 0; G.ebullets.length = 0; G.enemies.length = 0; G.drops.length = 0; G.debris.length = 0;
  mode = "clear"; modeT = 0;
  sfx("clear");
}
function shopItems() { return [...WEAPONS, "go"]; }
function capCost(type) { const c = save.caps[type]; return c >= MAX_LV ? null : CAP_COST[c + 1]; }
function buy(type) {
  const cost = capCost(type);
  if (cost == null || save.bank < cost) { sfx("deny"); shopDeny = { type, t: .4 }; return; }
  save.bank -= cost; save.caps[type]++; writeSave();
  sfx("buy"); shopFlash = { type, t: .6 };
}
let shopDeny = null, shopFlash = null;
const SHOP_CARD = i => i < 4 ? { x: 88 + i * 172, y: 214, w: 152, h: 262 } : { x: 790, y: 214, w: 92, h: 262 };
const NEXT_BTN = i => ({ x: W / 2 - 150 + i * 190, y: 420, w: 110, h: 80 });
function inRect(pt, r) { return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h; }
function update(dt) {
  modeT += dt;
  if (mode === "title") {
    world.time += dt; world.scroll += 40 * dt;
    const unlocked = save.cleared.includes("5-1") ? 2 : 1;
    if ((actions.has("left") || actions.has("right")) && unlocked > 1) { titleLevel = titleLevel === 1 ? 2 : 1; sfx("select"); }
    if (actions.has("confirm") || mouse.click) { sfx("start"); startLevel(Math.min(titleLevel, unlocked), params.get("debug") === "boss"); }
  } else if (mode === "play") {
    if (actions.has("pause")) { G.paused = !G.paused; sfx("select"); }
    if (mouse.click && G.paused) G.paused = false;
    if (!G.paused) updatePlay(dt);
  } else if (mode === "over") {
    world.time += dt; world.scroll += 20 * dt; updateFx(dt);
    if (actions.has("left") || actions.has("right")) { menuSel = 1 - menuSel; sfx("select"); }
    let pick = actions.has("confirm") && modeT > .6 ? menuSel : -1;
    if (mouse.click) for (let i = 0; i < 2; i++) if (inRect(mouse, NEXT_BTN(i))) pick = i;
    if (pick === 0) { sfx("start"); startLevel(G.level); } else if (pick === 1) location.href = "../index.html";
  } else if (mode === "clear") {
    world.time += dt; world.scroll += 24 * dt; updateFx(dt);
    const c = clearInfo;
    if (modeT > 1.2 && c.shown < c.to) {
      c.tick -= dt;
      if (c.tick <= 0) { c.shown = Math.min(c.to, c.shown + Math.max(1, Math.ceil((c.to - c.from) / 60))); c.tick = .025; sfx("tally"); }
    }
    if ((actions.has("confirm") || mouse.click) && modeT > 1.2) {
      if (c.shown < c.to) c.shown = c.to;
      else { mode = "shop"; modeT = 0; menuSel = 0; sfx("select"); }
    }
  } else if (mode === "shop") {
    world.time += dt; world.scroll += 24 * dt;
    const items = shopItems();
    if (actions.has("left")) { menuSel = (menuSel + items.length - 1) % items.length; sfx("select"); }
    if (actions.has("right")) { menuSel = (menuSel + 1) % items.length; sfx("select"); }
    let pick = actions.has("confirm") ? menuSel : -1;
    if (mouse.moved) for (let i = 0; i < items.length; i++) if (inRect(mouse, SHOP_CARD(i))) menuSel = i;
    if (mouse.click) for (let i = 0; i < items.length; i++) if (inRect(mouse, SHOP_CARD(i))) { menuSel = i; pick = i; }
    if (pick >= 0) {
      if (items[pick] === "go") { mode = "next"; modeT = 0; menuSel = 0; sfx("start"); }
      else buy(items[pick]);
    }
    if (shopDeny) { shopDeny.t -= dt; if (shopDeny.t <= 0) shopDeny = null; }
    if (shopFlash) { shopFlash.t -= dt; if (shopFlash.t <= 0) shopFlash = null; }
  } else if (mode === "next") {
    world.time += dt; world.scroll += 24 * dt;
    if (actions.has("left") || actions.has("right")) { menuSel = 1 - menuSel; sfx("select"); }
    let pick = actions.has("confirm") && modeT > .3 ? menuSel : -1;
    if (mouse.moved) for (let i = 0; i < 2; i++) if (inRect(mouse, NEXT_BTN(i))) menuSel = i;
    if (mouse.click) for (let i = 0; i < 2; i++) if (inRect(mouse, NEXT_BTN(i))) pick = i;
    if (pick === 0) { sfx("start"); startLevel(G.level === 1 ? 2 : G.level); } else if (pick === 1) location.href = "../index.html";
  }
}

// ---------------------------------------------------------------- drawing: enemies (drawEnemyShip from Stage 3)
const ENEMY_SPRITE = { scout: [0, 58], interceptor: [1, 56], stinger: [2, 70], armored: [3, 92], carrier: [4, 92], turret: [5, 56] };
function drawEnemySprite(type, x0, y0, rot, flash) {
  const [idx, size] = ENEMY_SPRITE[type], cell = 128;
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(rot);
  ctx.drawImage(ART.enemies, idx * cell, 0, cell, cell, -size / 2, -size / 2, size, size);
  if (flash) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .7; ctx.drawImage(ART.enemies, idx * cell, 0, cell, cell, -size / 2, -size / 2, size, size); }
  ctx.restore();
}
function drawEnemyShip(e) {
  if (e.type === "wreck") return drawWreck(e);
  const d = ETYPES[e.type];
  if (!artReady(ART.enemies)) return;
  // soft drop shadow on the hull below
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(e.x + 10, e.y + 14, d.r * 1.1, d.r * .8, 0, 0, TAU); ctx.fill();
  drawEnemySprite(e.type, e.x, e.y, e.heading - Math.PI / 2, e.flash > 0);
  if (e.type === "carrier") {
    ctx.save(); ctx.globalAlpha = .55 + .35 * Math.sin(world.time * 6);
    drawPowerIcon(e.drop, e.x, e.y - 42, .6, world.time * 2);
    ctx.restore();
  }
  if (d.plated && e.hp < e.maxHp) {
    ctx.fillStyle = "rgba(37,19,26,.82)"; ctx.fillRect(e.x - 18, e.y - 48, 36, 4);
    ctx.fillStyle = "#68d6c7"; ctx.fillRect(e.x - 18, e.y - 48, 36 * clamp(e.hp / e.maxHp, 0, 1), 4);
  }
}
function drawTurret(e) {
  if (!artReady(ART.enemies)) return;
  drawEnemySprite("turret", e.x, e.y, 0, e.flash > 0);
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.heading);
  ctx.fillStyle = "#1d1826"; ctx.strokeStyle = "#07050b"; ctx.lineWidth = 2;
  ctx.fillRect(6, -8, 22, 5); ctx.strokeRect(6, -8, 22, 5); ctx.fillRect(6, 3, 22, 5); ctx.strokeRect(6, 3, 22, 5);
  ctx.fillStyle = "#f06d72"; ctx.shadowBlur = 8; ctx.shadowColor = "#f06d72";
  ctx.beginPath(); ctx.arc(28, -5.5, 2.2, 0, TAU); ctx.arc(28, 5.5, 2.2, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- drawing: boss
function drawLeg(hx, hy, fx, fy, lift, side) {
  const L1 = 86, dx = fx - hx, dy = fy - hy, dd = Math.min(Math.hypot(dx, dy), L1 * 1.95);
  const mx = (hx + fx) / 2, my = (hy + fy) / 2, k = Math.sqrt(Math.max(0, L1 * L1 - (dd / 2) ** 2));
  let nx = -dy / (dd || 1), ny = dx / (dd || 1);
  if (nx * side < 0) { nx = -nx; ny = -ny; }
  const kx = mx + nx * k * .6, ky = my + ny * k * .6;
  const fs = 1 + lift * .25;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = "#1a1224"; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
  ctx.strokeStyle = "#4a3563"; ctx.lineWidth = 14; ctx.stroke();
  ctx.strokeStyle = "#1a1224"; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
  ctx.strokeStyle = "#5b4178"; ctx.lineWidth = 9; ctx.stroke();
  ctx.strokeStyle = "rgba(176,130,214,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
  ctx.fillStyle = "#2a1d3a"; ctx.strokeStyle = "#b082d6"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(kx, ky, 10, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f06d72"; ctx.beginPath(); ctx.arc(kx, ky, 3, 0, TAU); ctx.fill();
  // clawed foot
  ctx.save(); ctx.translate(fx, fy); ctx.scale(fs, fs);
  if (lift < .05) { ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(0, 4, 20, 10, 0, 0, TAU); ctx.fill(); }
  ctx.strokeStyle = "#1a1224"; ctx.lineWidth = 7;
  for (const a of [-.9, 0, .9]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * 18 * side, Math.cos(a) * 16); ctx.stroke(); }
  ctx.strokeStyle = "#7a5b9e"; ctx.lineWidth = 3;
  for (const a of [-.9, 0, .9]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(a) * 18 * side, Math.cos(a) * 16); ctx.stroke(); }
  ctx.fillStyle = "#3a2b4a"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawBossVector(b) {
  const squash = b.stomp > 0 ? 1 - .06 * Math.sin((1 - b.stomp / .55) * Math.PI) : 1;
  // legs first (they're under the body)
  for (let i = 0; i < 4; i++) { const l = LEGS[i], f = b.feet[i]; drawLeg(b.x + l.hx, b.y + l.hy, f.x, f.y, f.lift, Math.sign(l.hx)); }
  ctx.save(); ctx.translate(b.x, b.y); ctx.scale(squash, squash);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(8, 14, 98, 78, 0, 0, TAU); ctx.fill();
  // carapace
  const g = ctx.createLinearGradient(0, -80, 0, 80);
  g.addColorStop(0, "#6a4a8c"); g.addColorStop(.55, "#3a2852"); g.addColorStop(1, "#1f1530");
  ctx.fillStyle = g; ctx.strokeStyle = "#b082d6"; ctx.lineWidth = 3; ctx.shadowBlur = 16; ctx.shadowColor = "#8a5cc0";
  ctx.beginPath();
  ctx.moveTo(0, -84); ctx.lineTo(56, -66); ctx.lineTo(90, -24); ctx.lineTo(84, 38); ctx.lineTo(46, 76); ctx.lineTo(0, 88);
  ctx.lineTo(-46, 76); ctx.lineTo(-84, 38); ctx.lineTo(-90, -24); ctx.lineTo(-56, -66); ctx.closePath();
  ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  // plate ribs
  ctx.strokeStyle = "rgba(234,215,255,.35)"; ctx.lineWidth = 2;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 22, -76 + Math.abs(k) * 6); ctx.lineTo(k * 30, -38); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-70, 40); ctx.lineTo(-38, 64); ctx.lineTo(38, 64); ctx.lineTo(70, 40); ctx.stroke();
  // hangar bay stripes
  ctx.fillStyle = "rgba(242,196,91,.5)";
  for (let k = 0; k < 4; k++) { ctx.fillRect(-60 + k * 8, -58 + k * 4, 5, 14); ctx.fillRect(55 - k * 8, -58 + k * 4, 5, 14); }
  // red running lights
  const blink = Math.sin(world.time * 7) > 0;
  ctx.fillStyle = blink ? "#ff5a6e" : "#4a1a24";
  for (const [lx, ly] of [[-70, -30], [70, -30], [-60, 52], [60, 52], [0, -74]]) { ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, TAU); ctx.fill(); }
  // glyph plate
  ctx.globalAlpha = .6; drawAlienText("warden", -28, 58, 11, "#ead7ff"); ctx.globalAlpha = 1;
  // arms / cannon pods
  for (const a of b.arms) {
    ctx.save(); ctx.translate(a.side * 88, 16);
    if (a.alive) {
      ctx.fillStyle = a.flash > 0 ? "#ffffff" : "#4a3563"; ctx.strokeStyle = "#d9b8ff"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-24, -32, 48, 60, 12) : ctx.rect(-24, -32, 48, 60); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(a.aim - Math.PI / 2);
      ctx.fillStyle = "#1a1224"; ctx.strokeStyle = "#f06d72"; ctx.lineWidth = 2;
      ctx.fillRect(-12, 10, 9, 40); ctx.strokeRect(-12, 10, 9, 40); ctx.fillRect(3, 10, 9, 40); ctx.strokeRect(3, 10, 9, 40);
      ctx.fillStyle = "#ff7a66"; ctx.shadowBlur = 10; ctx.shadowColor = "#ff7a66";
      const glow = a.burst > 0 ? 4.5 : 2.5;
      ctx.beginPath(); ctx.arc(-7.5, 52, glow, 0, TAU); ctx.arc(7.5, 52, glow, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#f06d72"; ctx.beginPath(); ctx.arc(0, -8, 7, 0, TAU); ctx.fill();
      // arm hp ring
      ctx.strokeStyle = "rgba(104,214,199,.8)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, -8, 12, -Math.PI / 2, -Math.PI / 2 + TAU * a.hp / a.max); ctx.stroke();
    } else {
      ctx.fillStyle = "#1a1224"; ctx.strokeStyle = "#5b4178"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-20, -24); ctx.lineTo(8, -30); ctx.lineTo(22, -6); ctx.lineTo(10, 16); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (Math.random() < .3) G.fx.push({ k: "smoke", x: b.x + a.side * 88 + rand(-8, 8), y: b.y + 10, vx: rand(-10, 10), vy: rand(20, 50), r: rand(6, 10), life: .8, max: .8 });
      if (Math.random() < .08) spark(b.x + a.side * 88, b.y + 10, "#ffd36e", 3, 120, .3, 2);
    }
    ctx.restore();
  }
  // core eye
  const open = b.ph2;
  ctx.save(); ctx.translate(0, 8);
  ctx.fillStyle = "#120c1c"; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
  if (!open) {
    ctx.fillStyle = "#5a3d2a"; ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff2a8"; ctx.globalAlpha = .5 + .2 * Math.sin(world.time * 3);
    ctx.beginPath(); ctx.ellipse(0, 0, 18, 3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    // hex shield
    ctx.save(); ctx.rotate(world.time * .6);
    ctx.strokeStyle = b.pingT > 0 ? "rgba(220,255,255,.95)" : "rgba(104,214,220,.6)"; ctx.lineWidth = b.pingT > 0 ? 4 : 2.5;
    ctx.shadowBlur = 12; ctx.shadowColor = "#39e0e6";
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; i ? ctx.lineTo(Math.cos(a) * 38, Math.sin(a) * 38) : ctx.moveTo(Math.cos(a) * 38, Math.sin(a) * 38); } ctx.closePath(); ctx.stroke();
    ctx.restore();
  } else {
    const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
    rg.addColorStop(0, "#ffffff"); rg.addColorStop(.35, b.flash > 0 ? "#ffffff" : "#fff2a8"); rg.addColorStop(1, "#f2a23b");
    ctx.fillStyle = rg; ctx.shadowBlur = 24; ctx.shadowColor = "#ffd36e";
    ctx.beginPath(); ctx.arc(0, 0, 25 + Math.sin(world.time * 9) * 1.5, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
    const pa = aimAt(b.x, b.y + 8);
    ctx.fillStyle = "#2a0d10"; ctx.beginPath(); ctx.ellipse(Math.cos(pa) * 8, Math.sin(pa) * 8, 4, 14, pa + Math.PI / 2, 0, TAU); ctx.fill();
  }
  ctx.restore();
  if (b.state === "dying") { ctx.fillStyle = `rgba(255,240,200,${.2 + .2 * Math.sin(b.dieT * 30)})`; ctx.beginPath(); ctx.arc(0, 0, 90, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function drawBossLaser(b) {
  if (b.laser) {
    const L = b.laser, ox = b.x, oy = b.y + 38, dx = Math.cos(L.ang), dy = Math.sin(L.ang), len = 1200;
    ctx.save();
    if (L.t < LASER_WARN) {
      const k = L.t / LASER_WARN, locked = L.t >= 1.1, blink = Math.abs(Math.sin(L.t * (locked ? 26 : 12)));
      // danger lane showing exactly where the beam will hit
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(L.ang);
      ctx.fillStyle = `rgba(255,50,70,${(locked ? .22 : .1) + .12 * blink})`; ctx.fillRect(0, -22, len, 44);
      ctx.strokeStyle = `rgba(255,90,110,${.5 + .5 * blink})`; ctx.lineWidth = 2; ctx.setLineDash([16, 10]);
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(len, -22); ctx.moveTo(0, 22); ctx.lineTo(len, 22); ctx.stroke(); ctx.setLineDash([]);
      // hazard chevrons marching down the lane
      ctx.fillStyle = `rgba(255,200,120,${.35 + .4 * blink})`;
      for (let d = 60 + (L.t * 240) % 60; d < len; d += 60) { ctx.beginPath(); ctx.moveTo(d, -12); ctx.lineTo(d + 14, 0); ctx.lineTo(d, 12); ctx.lineTo(d + 6, 0); ctx.fill(); }
      ctx.restore();
      // energy gathering into the eye
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + L.t * 3, rr = 90 * (1 - ((L.t * 1.5 + i * .1) % 1));
        ctx.fillStyle = "rgba(255,200,140,.8)"; ctx.beginPath(); ctx.arc(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr, 3, 0, TAU); ctx.fill(); }
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 20 + k * 40); g.addColorStop(0, "rgba(255,240,200,.95)"); g.addColorStop(1, "rgba(255,90,110,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, 20 + k * 40, 0, TAU); ctx.fill();
      ctx.restore();
    } else {
      const k = 1 - clamp((L.t - LASER_WARN - .9) / .2, 0, 1), wdt = (30 + Math.sin(world.time * 40) * 4) * k;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,90,110,.35)"; ctx.lineWidth = wdt * 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + dx * len, oy + dy * len); ctx.stroke();
      ctx.strokeStyle = "#ff8f70"; ctx.lineWidth = wdt; ctx.shadowBlur = 30; ctx.shadowColor = "#ff5a6e"; ctx.stroke();
      ctx.strokeStyle = "#fff6e0"; ctx.lineWidth = wdt * .35; ctx.stroke();
    }
    ctx.restore();
  }
}


// ---------------------------------------------------------------- boss: painted Hangar Warden (Codex art)
const WK = 330 / 640, W_CORE = [320, 304];
const W_CAN = { w: 147, h: 151, piv: [137.3, 97.3], L: 640, R: 787 };
function drawBoss(b) {
  if (b.kind === "leviathan") return drawLeviathan(b);
  if (artReady(ART.warden)) drawBossArt(b); else drawBossVector(b);
  drawBossLaser(b);
}
function drawBossArt(b) {
  const k = WK, squash = b.stomp > 0 ? 1 - .05 * Math.sin((1 - b.stomp / .55) * Math.PI) : 1;
  const walking = b.state === "enter" || (b.state === "fight" && !b.laser);
  const tilt = walking ? Math.sin(b.moveT * 5 + b.t * (b.state === "enter" ? 6 : 0)) * .03 : 0;
  ctx.save(); ctx.translate(b.x, b.y + 8);
  if (b.state === "dying") ctx.translate(rand(-3, 3), rand(-3, 3));
  ctx.rotate(tilt); ctx.scale(squash, squash);
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(16, 30, 150, 132, 0, 0, TAU); ctx.fill();
  const body = () => ctx.drawImage(ART.warden, 0, 0, 640, 640, -W_CORE[0] * k, -W_CORE[1] * k, 640 * k, 640 * k);
  body();
  if (b.flash > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .45; body(); ctx.restore(); }
  // swivelling arm cannons
  for (const a of b.arms) {
    const right = a.side > 0, sx = right ? W_CAN.R : W_CAN.L, px = right ? W_CAN.w - W_CAN.piv[0] : W_CAN.piv[0];
    ctx.save(); ctx.translate(a.side * 90, 0);
    ctx.fillStyle = "#07060b"; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
    let rot = right ? a.aim : a.aim - Math.PI;
    if (!a.alive) rot += a.side * .45;
    ctx.rotate(rot);
    if (!a.alive) ctx.filter = "brightness(.35) saturate(.4)";
    const draw = () => ctx.drawImage(ART.warden, sx, 0, W_CAN.w, W_CAN.h, -px * k, -W_CAN.piv[1] * k, W_CAN.w * k, W_CAN.h * k);
    draw(); ctx.filter = "none";
    if (a.alive && a.flash > 0) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .6; draw(); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1; }
    if (a.alive && a.burst > 0) { ctx.globalCompositeOperation = "lighter"; for (const oy of [-8, 8]) { const g = ctx.createRadialGradient(a.side * 70, oy, 0, a.side * 70, oy, 14); g.addColorStop(0, "rgba(255,200,150,.9)"); g.addColorStop(1, "rgba(255,90,60,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.side * 70, oy, 14, 0, TAU); ctx.fill(); } }
    ctx.restore();
    if (!a.alive) {
      const p = armPos(b, a);
      if (Math.random() < .3) G.fx.push({ k: "smoke", x: p.x + rand(-8, 8), y: p.y, vx: rand(-10, 10), vy: rand(20, 50), r: rand(6, 11), life: .8, max: .8 });
      if (Math.random() < .08) spark(p.x, p.y, "#ffd36e", 3, 120, .3, 2);
    }
  }
  // core: petals closed behind a shield until both arms are gone, then the eye opens
  if (!b.ph2) {
    // armored petals shrug off shots: a brief cyan glint when hit
    if (b.pingT > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, `rgba(160,240,255,${b.pingT * 3})`); g.addColorStop(1, "rgba(160,240,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill(); ctx.restore(); }
  } else {
    const open = clamp(1 - b.ph2T / 1.4, 0, 1);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 44); g.addColorStop(0, "rgba(255,255,240,1)"); g.addColorStop(.4, `rgba(255,220,120,${.8 * open})`); g.addColorStop(1, "rgba(255,120,60,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill(); ctx.restore();
    const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 24); rg.addColorStop(0, "#ffffff"); rg.addColorStop(.35, b.flash > 0 ? "#ffffff" : "#fff2a8"); rg.addColorStop(1, "#e0852b");
    ctx.globalAlpha = open; ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, 22 + Math.sin(world.time * 9) * 1.2, 0, TAU); ctx.fill();
    const pa = aimAt(b.x, b.y + 8);
    ctx.fillStyle = "#2a0d10"; ctx.beginPath(); ctx.ellipse(Math.cos(pa) * 7, Math.sin(pa) * 7, 3.5, 13, pa + Math.PI / 2, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (b.state === "dying") { ctx.fillStyle = `rgba(255,240,200,${.15 + .15 * Math.sin(b.dieT * 30)})`; ctx.beginPath(); ctx.arc(0, 0, 120, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- drawing: player
function drawPlayerShip(x, y, tilt, alpha = 1, heartGlow = 0, h = 74) {
  if (!artReady(ART.ship)) return;
  const fw = 116, fh = 194, s = h / fh, frame = Math.floor(world.time * 14) % 2;
  const sx = 1 - Math.abs(tilt) * .16;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(6, 12, fw * s * .42, fh * s * .36, 0, 0, TAU); ctx.fill();
  ctx.scale(sx, 1);
  ctx.drawImage(ART.ship, frame * fw, 0, fw, fh, -fw * s / 2, -fh * s / 2, fw * s, fh * s);
  // the stolen power crystal glows through the cockpit orb
  const pulse = .55 + .45 * Math.sin(world.time * (heartGlow > 0 ? 9 : 3));
  ctx.globalCompositeOperation = "lighter";
  const r = 9 + heartGlow * 5 * pulse;
  const g = ctx.createRadialGradient(0, 1, 0, 0, 1, r);
  g.addColorStop(0, `rgba(240,190,255,${.55 + .35 * pulse})`); g.addColorStop(.5, `rgba(190,90,255,${.35 + .25 * pulse})`); g.addColorStop(1, "rgba(150,60,255,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 1, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawWingman(w, lv) {
  if (!artReady(ART.ship)) return;
  const fw = 116, fh = 194, h = 34 + (lv - 1) * 5, s = h / fh, frame = Math.floor(world.time * 14 + 1) % 2;
  ctx.save(); ctx.translate(w.x, w.y);
  ctx.shadowBlur = 12; ctx.shadowColor = "#7ee3a1";
  ctx.drawImage(ART.ship, frame * fw, 0, fw, fh, -fw * s / 2, -fh * s / 2, fw * s, fh * s);
  ctx.shadowBlur = 0; ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(126,227,161,.55)"; ctx.beginPath(); ctx.arc(0, 1, 4, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawPlayer() {
  const p = G.player;
  if (!p.alive) return;
  const blink = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
  if (G.side) {
    if (p.lv.wingmen > 0) p.wing.forEach(w => { ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(Math.PI / 2); drawWingman({ x: 0, y: 0 }, p.lv.wingmen); ctx.restore(); });
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 2); drawPlayerShip(0, 0, p.tilt, blink ? .35 : 1, p.heartReady ? 1 : 0); ctx.restore();
    if (p.charge > 0 && p.primary === "flak" && wlv("flak") > 0) { const need = [1.1, 1, .9, .8, .7][wlv("flak") - 1], k = Math.min(1, p.charge / need);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(p.x + 34, p.y, 0, p.x + 34, p.y, 6 + k * 14); g.addColorStop(0, `rgba(255,255,255,${k})`); g.addColorStop(1, "rgba(111,224,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x + 34, p.y, 6 + k * 14, 0, TAU); ctx.fill(); ctx.restore(); }
  } else {
    if (p.lv.wingmen > 0) p.wing.forEach(w => drawWingman(w, p.lv.wingmen));
    drawPlayerShip(p.x, p.y, p.tilt, blink ? .35 : 1, p.heartReady ? 1 : 0);
  }
  if (p.shield > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = `rgba(111,224,255,${.35 + .15 * p.shield + .1 * Math.sin(world.time * 6)})`; ctx.lineWidth = 2 + p.shield; ctx.shadowBlur = 14; ctx.shadowColor = "#6fe0ff"; ctx.beginPath(); ctx.arc(p.x, p.y, 42, 0, TAU); ctx.stroke(); ctx.restore(); }
  if (p.focus) {
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.fillStyle = "#ff5fae"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}

// ---------------------------------------------------------------- drawing: shots, pickups, fx
function drawBullets() {
  ctx.save();
  for (const b of G.bullets) {
    if (b.kind === "pulseH" || b.kind === "wingH") {
      const c = b.kind === "wingH" ? "#7ee3a1" : "#68d6c7";
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = c;
      ctx.beginPath(); ctx.moveTo(b.x - 12, b.y); ctx.lineTo(b.x + 4, b.y); ctx.stroke();
      ctx.fillStyle = "#e8ffff"; ctx.beginPath(); ctx.arc(b.x + 4, b.y, 2.2, 0, TAU); ctx.fill();
    } else if (b.kind === "beam") {
      const g = ctx.createLinearGradient(b.x - b.len, 0, b.x, 0); g.addColorStop(0, "rgba(120,230,255,0)"); g.addColorStop(.6, "rgba(150,240,255,.8)"); g.addColorStop(1, "#ffffff");
      ctx.fillStyle = g; ctx.shadowBlur = 20; ctx.shadowColor = "#6fe0ff";
      ctx.beginPath(); ctx.ellipse(b.x - b.len / 2, b.y, b.len / 2, b.r, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(b.x - b.len * .35, b.y, b.len * .35, b.r * .35, 0, 0, TAU); ctx.fill();
    } else if (b.kind === "pulse" || b.kind === "wing") {
      const c = b.kind === "wing" ? "#7ee3a1" : "#68d6c7";
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = c;
      ctx.beginPath(); ctx.moveTo(b.x, b.y + 12); ctx.lineTo(b.x, b.y - 4); ctx.stroke();
      ctx.fillStyle = "#e8ffff"; ctx.beginPath(); ctx.arc(b.x, b.y - 4, 2.2, 0, TAU); ctx.fill();
    } else if (b.kind === "spread") {
      const a = Math.atan2(b.vy, b.vx), c = ["#ffd36e", "#ffe28f", "#fff1bf", "#fff6d8", "#ffffff"][b.lv - 1];
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
      ctx.shadowBlur = 8 + b.lv * 4; ctx.shadowColor = "#ffb44a"; ctx.fillStyle = c;
      ctx.beginPath(); ctx.ellipse(0, 0, b.r * 2.2, b.r, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.r * .8, 0, b.r * .45, 0, TAU); ctx.fill();
      ctx.restore();
    } else if (b.kind === "flak") {
      ctx.shadowBlur = 10 + b.lv * 4; ctx.shadowColor = "#ff8b45";
      ctx.fillStyle = "#ffb35c"; ctx.strokeStyle = "#fff0b0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,168,74,.7)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r); ctx.lineTo(b.x, b.y + b.r * 4); ctx.stroke();
    } else if (b.kind === "missile") {
      const c = b.spark ? "#b8ffcf" : ["#a97cff", "#bf9bff", "#dcc8ff", "#ebdfff", "#ffffff"][b.lv - 1];
      ctx.shadowBlur = 0;
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i], k = (i + 1) / b.trail.length;
        ctx.fillStyle = b.spark ? `rgba(126,227,161,${k * .5})` : `rgba(169,124,255,${k * .5})`;
        ctx.beginPath(); ctx.arc(t.x, t.y, b.r * k * .9, 0, TAU); ctx.fill();
      }
      const a = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = c; ctx.shadowBlur = 10; ctx.shadowColor = c;
      const s = b.r / 4;
      ctx.beginPath(); ctx.moveTo(0, -9 * s); ctx.lineTo(5 * s, 6 * s); ctx.lineTo(0, 3 * s); ctx.lineTo(-5 * s, 6 * s); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
function drawEnemyBullets() {
  ctx.save();
  for (const b of G.ebullets) {
    ctx.fillStyle = b.color; ctx.shadowBlur = 10; ctx.shadowColor = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + .8 * Math.sin(b.age * 20), 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#fff4fb"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * .45, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function drawPickups() {
  for (const d of G.debris) {
    if (d.life < 2 && Math.floor(d.life * 10) % 2 === 0) continue;
    drawDebrisIcon(d.x, d.y, d.gold ? 6 : 4.5, d.gold, d.spin);
  }
  for (const d of G.drops) {
    ctx.save(); ctx.shadowBlur = 16; ctx.shadowColor = PU_COLOR[d.type];
    drawPowerIcon(d.type, d.x, d.y, 1 + .08 * Math.sin(d.age * 6), d.type === "flak" || d.type === "spread" ? 0 : d.age * 1.5);
    ctx.restore();
  }
}
function drawFx() {
  ctx.save();
  for (const f of G.fx) {
    const k = clamp(f.life / f.max, 0, 1);
    if (f.k === "spark") { ctx.globalAlpha = k; ctx.fillStyle = f.color; ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size); }
    else if (f.k === "smoke") { ctx.globalAlpha = k * .35; ctx.fillStyle = "#3a3444"; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); }
    else if (f.k === "ring") { ctx.globalAlpha = k; ctx.strokeStyle = f.color; ctx.lineWidth = (f.width || 3) * k + 1; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.stroke(); }
    else if (f.k === "flash") { ctx.globalAlpha = k; ctx.fillStyle = f.color ? f.color + k + ")" : "rgba(255,245,210," + k + ")"; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1.4 - k * .4), 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  // bomb / heart shockwaves
  for (const w of G.waves) {
    const k = w.t / w.dur, r = ease(k) * 1100;
    ctx.save();
    if (w.kind === "bomb") {
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = "#ffd9b8"; ctx.lineWidth = 26 * (1 - k) + 2; ctx.shadowBlur = 30; ctx.shadowColor = "#ff8f70";
      ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = "#ff8f70"; ctx.lineWidth = 8 * (1 - k); ctx.beginPath(); ctx.arc(w.x, w.y, r * .7, 0, TAU); ctx.stroke();
    } else {
      ctx.globalAlpha = (1 - k) * .9;
      ctx.fillStyle = `rgba(214,108,255,${.18 * (1 - k)})`; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#f1c8ff"; ctx.lineWidth = 34 * (1 - k) + 2; ctx.shadowBlur = 40; ctx.shadowColor = "#d66cff";
      ctx.beginPath(); ctx.arc(w.x, w.y, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = "#c56cff"; ctx.lineWidth = 10 * (1 - k);
      ctx.beginPath(); ctx.arc(w.x, w.y, r * .8, 0, TAU); ctx.stroke();
      // rays
      ctx.globalAlpha = (1 - k) * .5; ctx.strokeStyle = "#ffe6ff"; ctx.lineWidth = 3;
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + k; ctx.beginPath(); ctx.moveTo(w.x + Math.cos(a) * r * .2, w.y + Math.sin(a) * r * .2); ctx.lineTo(w.x + Math.cos(a) * r, w.y + Math.sin(a) * r); ctx.stroke(); }
      ctx.globalAlpha = 1 - k; ctx.shadowBlur = 30; drawCrystal(w.x, w.y, 70 + k * 120);
    }
    ctx.restore();
  }
  // level-up / bonus pops
  for (const q of G.pops) {
    const k = q.life / q.max;
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 2);
    drawPowerIcon(q.type, q.x, q.y, 1.1, 0);
    if (q.bonus) { ctx.fillStyle = "#fff2a8"; ctx.font = "700 18px system-ui"; drawDebrisIcon(q.x + 26, q.y, 6, true, 0); drawLabel("+5", q.x + 36, q.y - 8, 15, "#fff2a8"); }
    else if (q.cap) drawPips(q.x - 32, q.y + 24, q.lv, q.cap, PU_COLOR[q.type], 8);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- HUD (glyphs & icons only)
function drawPips(x, y, lv, cap, color, s = 7, gap = 5) {
  for (let i = 0; i < MAX_LV; i++) {
    const cx = x + i * (s + gap);
    ctx.save();
    ctx.translate(cx + s / 2, y); ctx.rotate(Math.PI / 4);
    if (i < lv) { ctx.fillStyle = color; ctx.shadowBlur = 6; ctx.shadowColor = color; ctx.fillRect(-s / 2, -s / 2, s, s); }
    else if (i < cap) { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.strokeRect(-s / 2, -s / 2, s, s); }
    else { ctx.strokeStyle = "rgba(160,170,180,.35)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(-s / 2, -s / 2, s, s); }
    ctx.restore();
  }
}
function panel(x, y, w, h) {
  ctx.save(); ctx.fillStyle = "rgba(6,14,20,.62)"; ctx.strokeStyle = "rgba(104,214,199,.28)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke(); ctx.restore();
}
function drawHUD() {
  const p = G.player;
  // hull + lives (top left)
  panel(12, 12, 250, 50);
  drawLabel("HULL", 20, 20, 12, "#9ff5e8");
  const hk = clamp(p.hull / p.maxHull, 0, 1);
  ctx.fillStyle = "rgba(37,19,26,.9)"; ctx.fillRect(62, 22, 186, 10);
  ctx.fillStyle = hk > .5 ? "#68d6c7" : hk > .25 ? "#f2c45b" : "#ff5a6e"; ctx.fillRect(62, 22, 186 * hk, 10);
  ctx.strokeStyle = "rgba(143,240,255,.4)"; ctx.strokeRect(62, 22, 186, 10);
  for (let i = 0; i < 5; i++) { const x = 62 + i * 37.2; ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x, 22, 1, 10); }
  if (p.shield > 0) for (let i = 0; i < p.shield; i++) drawPowerIcon("shield", 110 + i * 22, 47, .5, 0, false);
  for (let i = 0; i < Math.max(0, p.lives); i++) { ctx.save(); ctx.translate(30 + i * 22, 47); ctx.scale(.4, .4); drawPlayerShip(0, 0, 0, 1, 0); ctx.restore(); }
  // score (top center)
  drawLabel(fmt(p.score), W / 2, 14, 20, "#dff7ff", "center");
  // debris (top right, left of the home button)
  panel(W - 196, 12, 136, 36);
  drawDebrisIcon(W - 176, 30, 7, true, .3);
  drawLabel(fmt(p.debris), W - 72, 20, 17, "#f2c45b", "right");
  // bombs (bottom left)
  panel(12, H - 52, 30 + Math.max(1, p.bombs) * 26, 40);
  for (let i = 0; i < p.bombs; i++) drawPowerIcon("bomb", 32 + i * 26, H - 32, .62, 0, false);
  if (!p.bombs) { ctx.globalAlpha = .3; drawPowerIcon("bomb", 32, H - 32, .62, 0, false); ctx.globalAlpha = 1; }
  // power crystal meter (bottom center): fills from the bottom as it charges
  const hx = 34, hy = H - 104, fillK = p.heart / HEART_MAX, ch = 62;
  if (artReady(ART.crystal)) {
    const cw = ch * 146 / 225;
    ctx.save(); ctx.globalAlpha = .22; ctx.filter = "grayscale(1)"; ctx.drawImage(ART.crystal, hx - cw / 2, hy - ch / 2, cw, ch); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(hx - cw, hy + ch / 2 - ch * fillK, cw * 2, ch * fillK); ctx.clip();
    if (p.heartReady) { ctx.shadowBlur = 20 + 12 * Math.sin(world.time * 8); ctx.shadowColor = "#d66cff"; }
    ctx.drawImage(ART.crystal, hx - cw / 2, hy - ch / 2, cw, ch); ctx.restore();
  }
  if (p.heartReady) {
    ctx.save(); ctx.globalAlpha = .6 + .4 * Math.sin(world.time * 8);
    drawLabel("PULSE READY  [E]", hx + 28, hy - 8, 13, "#f1c8ff");
    ctx.restore();
  }
  // weapons (bottom right)
  const wx0 = W - 12 - WEAPONS.length * 62;
  panel(wx0 - 6, H - 62, WEAPONS.length * 62 + 6, 50);
  WEAPONS.forEach((t, i) => {
    const x = wx0 + i * 62 + 28, lv = p.lv[t];
    ctx.save(); ctx.globalAlpha = lv > 0 ? 1 : .35;
    drawPowerIcon(t, x, H - 44, .62, 0, lv > 0);
    ctx.restore();
    drawPips(x - 20, H - 21, lv, save.caps[t], PU_COLOR[t], 5, 3);
    if (p.primary === t) { ctx.strokeStyle = PU_COLOR[t]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 20, H - 62); ctx.lineTo(x + 20, H - 62); ctx.stroke(); }
  });
  // boss bar
  const b = G.boss;
  if (b && b.state !== "wait") {
    const parts = b.kind === "leviathan" ? b.segs.filter(s => s.sac).map(s => ({ hp: Math.max(0, s.sac.hp), max: s.sac.max })) : b.arms;
    const tot = parts.reduce((s, a) => s + Math.max(0, a.hp), 0) + b.hpCore, max = parts.reduce((s, a) => s + a.max, 0) + b.maxCore;
    panel(W / 2 - 230, 44, 460, 30);
    drawLabel(LEVELS[G.level].boss, W / 2 - 220, 51, 13, "#f06d72");
    const bx = W / 2 - 60, bw = 280;
    ctx.fillStyle = "rgba(37,19,26,.9)"; ctx.fillRect(bx, 53, bw, 10);
    ctx.fillStyle = b.ph2 ? "#ffd36e" : "#f06d72"; ctx.fillRect(bx, 53, bw * tot / max, 10);
    ctx.strokeStyle = "rgba(255,200,200,.4)"; ctx.strokeRect(bx, 53, bw, 10);
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(bx + bw * b.maxCore / max, 53, 2, 10);
  }
  // warning banner
  if (G.warn > 0) {
    const a = .5 + .5 * Math.sin(world.time * 12);
    ctx.save();
    ctx.fillStyle = `rgba(80,8,16,${.55 * a + .2})`; ctx.fillRect(0, H / 2 - 44, W, 88);
    ctx.fillStyle = "#f2c45b";
    for (let x = -80 + (world.time * 120) % 40; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, H / 2 - 44); ctx.lineTo(x + 18, H / 2 - 44); ctx.lineTo(x + 28, H / 2 - 34); ctx.lineTo(x + 10, H / 2 - 34); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, H / 2 + 34); ctx.lineTo(x + 18, H / 2 + 34); ctx.lineTo(x + 28, H / 2 + 44); ctx.lineTo(x + 10, H / 2 + 44); ctx.fill();
    }
    ctx.globalAlpha = .6 + .4 * a;
    drawLabel("WARNING: " + LEVELS[G.level].boss + " APPROACHING", W / 2, H / 2 - 15, 28, "#ff7a66", "center");
    ctx.restore();
  }
  if (G.paused) {
    ctx.fillStyle = "rgba(3,7,17,.6)"; ctx.fillRect(0, 0, W, H);
    drawUiIcon("pause", W / 2, H / 2 - 16, 56, "#9ff5e8");
    drawLabel("PAUSED", W / 2, H / 2 + 30, 22, "#9ff5e8", "center");
  }
}

// ================================================================ LEVEL 5-2 · DEBRIS CANYON (side-scroll)
const LEVELS = {
  1: { name: "VESSEL OUTSKIRTS", boss: "HANGAR WARDEN" },
  2: { name: "DEBRIS CANYON", boss: "CANYON LEVIATHAN" }
};
const SIDE_NAMES = { spread: "Scatter Core", homing: "Homing Missile", flak: "Charge Beam", wingmen: "Option Pods" };
const onScreen = e => G.side ? e.x < W + 30 && e.x > -30 : e.y > -30;
ETYPES.wreck = { hp: 6, r: 22, speed: 0, score: 80, heart: 1, debris: [1, 2], gold: .2 };

// ---------------------------------------------------------------- canyon terrain (world x = screen x + scroll)
function canyonRaw(wx, top) {
  const s = top ? 0 : 1.7;
  let h = 70 + 38 * Math.sin(wx / 390 + s) + 26 * Math.sin(wx / 151 + s * 2.3) + 10 * Math.sin(wx / 47 + s);
  const pinch = Math.max(0, Math.sin(wx / 1300 + (top ? 0 : .6))) ** 6 * 70; // narrow passages now and then
  return h + pinch;
}
function canyonTop(sx) { const f = G ? G.flatten || 0 : 0; return lerp(canyonRaw(sx + world.scroll, true), 18, f); }
function canyonBot(sx) { const f = G ? G.flatten || 0 : 0; return H - lerp(canyonRaw(sx + world.scroll, false), 18, f); }

const canyonStars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + .3, a: Math.random() * .6 + .2, p: Math.random() < .5 ? .08 : .18 }));
function drawCanyon() {
  // deep space + nebula
  ctx.fillStyle = "#04060d"; ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(W * .7, H * .4, 20, W * .7, H * .4, 520);
  g1.addColorStop(0, "rgba(120,50,150,.28)"); g1.addColorStop(.5, "rgba(40,60,120,.14)"); g1.addColorStop(1, "rgba(4,6,13,0)");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  for (const s of canyonStars) { const x = ((s.x - world.scroll * s.p) % W + W) % W; ctx.globalAlpha = s.a; ctx.fillStyle = "#dff7ff"; ctx.fillRect(x, s.y, s.r, s.r); }
  ctx.globalAlpha = 1;
  // far drifting wreckage silhouettes (parallax .35)
  for (let i = 0; i < 7; i++) {
    const wx = i * 420 + 130, x = ((wx - world.scroll * .35) % (7 * 420) + 7 * 420) % (7 * 420) - 200, y = 140 + (i * 97) % 340;
    ctx.save(); ctx.translate(x, y); ctx.rotate(i * .7 + world.time * .03 * (i % 2 ? 1 : -1)); ctx.fillStyle = "rgba(30,34,52,.8)"; ctx.strokeStyle = "rgba(90,100,140,.25)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-40, -8); ctx.lineTo(30, -16); ctx.lineTo(46, 4); ctx.lineTo(10, 14); ctx.lineTo(-34, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,150,80,.25)"; ctx.fillRect(-20, -4, 4, 3); ctx.fillRect(4, -8, 4, 3);
    ctx.restore();
  }
  // mid canyon ridges (parallax .6)
  for (const [top, col] of [[true, "#1a1422"], [false, "#18121f"]]) {
    ctx.beginPath(); ctx.moveTo(0, top ? 0 : H);
    for (let x = 0; x <= W + 8; x += 12) { const wx = x + world.scroll * .6; const h = 110 + 40 * Math.sin(wx / 260 + (top ? 0 : 2)) + 20 * Math.sin(wx / 90); ctx.lineTo(x, top ? h : H - h); }
    ctx.lineTo(W, top ? 0 : H); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  // near canyon walls
  for (const top of [true, false]) {
    const edge = x => top ? canyonTop(x) : canyonBot(x);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-10, top ? -10 : H + 10);
    for (let x = -10; x <= W + 10; x += 8) ctx.lineTo(x, edge(x));
    ctx.lineTo(W + 10, top ? -10 : H + 10); ctx.closePath();
    const g = ctx.createLinearGradient(0, top ? 0 : H, 0, top ? 170 : H - 170);
    g.addColorStop(0, "#120d18"); g.addColorStop(.6, "#2a2233"); g.addColorStop(1, "#4a3c55");
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    // rock strata
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
    for (let k = 1; k < 6; k++) { ctx.beginPath(); for (let x = -10; x <= W + 10; x += 16) { const wx = x + world.scroll; const y = (top ? edge(x) - k * 22 : edge(x) + k * 22) + Math.sin(wx / 70 + k) * 5; x < -5 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
    // embedded crystals and wreckage
    const step = 90, off = world.scroll % step;
    for (let x = -off - step; x < W + step; x += step) {
      const wi = Math.round((x + world.scroll) / step), h = hash(wi * (top ? 3.1 : 7.7));
      const ex = x + h * 60, ey = edge(ex);
      if (h < .35) { // glowing crystal cluster
        const col = h < .17 ? "rgba(90,230,255," : "rgba(200,120,255,";
        ctx.save(); ctx.translate(ex, ey + (top ? -6 : 6)); ctx.scale(1, top ? 1 : -1);
        for (let c = 0; c < 3; c++) { ctx.save(); ctx.rotate((c - 1) * .45); ctx.fillStyle = col + ".85)"; ctx.shadowBlur = 14; ctx.shadowColor = col + "1)";
          ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(0, 22 + c * 6); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.restore();
      } else if (h < .55) { // twisted girder sticking out
        ctx.save(); ctx.translate(ex, ey); ctx.rotate((top ? 1 : -1) * (.9 + h));
        ctx.fillStyle = "#3a4152"; ctx.strokeStyle = "#0b0d12"; ctx.lineWidth = 2;
        ctx.fillRect(-4, -2, 44, 8); ctx.strokeRect(-4, -2, 44, 8);
        ctx.strokeStyle = "rgba(160,170,190,.35)"; for (let k = 2; k < 40; k += 8) { ctx.beginPath(); ctx.moveTo(k, -1); ctx.lineTo(k + 5, 5); ctx.stroke(); }
        ctx.restore();
      } else if (h < .68) { // half-buried hull plate with a lit window
        ctx.save(); ctx.translate(ex, ey + (top ? -10 : 10)); ctx.rotate((h - .6) * 3);
        ctx.fillStyle = "#2c3140"; ctx.strokeStyle = "#07080c"; ctx.lineWidth = 2; ctx.fillRect(-22, -12, 44, 24); ctx.strokeRect(-22, -12, 44, 24);
        ctx.fillStyle = `rgba(255,172,58,${.5 + .3 * Math.sin(world.time * 3 + wi)})`; ctx.fillRect(-8, -4, 10, 6);
        ctx.restore();
      }
    }
    ctx.restore();
    // rim light on the wall edge
    ctx.save(); ctx.beginPath(); for (let x = -10; x <= W + 10; x += 8) x < -5 ? ctx.moveTo(x, edge(x)) : ctx.lineTo(x, edge(x));
    ctx.strokeStyle = "rgba(190,150,230,.45)"; ctx.lineWidth = 2.5; ctx.shadowBlur = 10; ctx.shadowColor = "#b082d6"; ctx.stroke(); ctx.restore();
  }
}

// ---------------------------------------------------------------- side-scroll player
function updatePlayerSide(dt) {
  const p = G.player;
  if (!p.alive) {
    if (p.lives > 0) { p.respawn -= dt; if (p.respawn <= 0) { p.alive = true; p.hull = p.maxHull; p.inv = 2.8; p.x = -40; p.y = H / 2; p.enterT = .7; p.bombs = Math.max(p.bombs, 2); p.trail = []; } }
    return;
  }
  p.inv = Math.max(0, p.inv - dt);
  const m = moveInput();
  if (p.enterT > 0) { p.enterT -= dt; p.x = lerp(p.x, 150, 1 - Math.pow(.001, dt)); }
  else {
    const sp = m.focus ? FOCUS_SPEED : PLAYER_SPEED;
    p.x = clamp(p.x + m.x * sp * dt, 30, W * .72);
    p.y = clamp(p.y + m.y * sp * dt, 24, H - 24);
  }
  // canyon walls hurt and push you back in
  const top = canyonTop(p.x) + 16, bot = canyonBot(p.x) - 16;
  if (p.y < top) { p.y = top; if (p.inv <= 0) { hurtPlayer(20); spark(p.x, p.y - 10, "#d9b8ff", 10, 180, .4, 2); } }
  if (p.y > bot) { p.y = bot; if (p.inv <= 0) { hurtPlayer(20); spark(p.x, p.y + 10, "#d9b8ff", 10, 180, .4, 2); } }
  p.focus = m.focus;
  p.tilt = lerp(p.tilt, m.y, 1 - Math.pow(.0005, dt));
  // trail for option pods
  p.trail = p.trail || [];
  if (!p.trail.length || Math.hypot(p.trail[0].x - p.x, p.trail[0].y - p.y) > 3) { p.trail.unshift({ x: p.x, y: p.y }); if (p.trail.length > 80) p.trail.pop(); }
  // weapons (auto-fire)
  p.fireCd -= dt; if (p.fireCd <= 0) fireSidePrimary(p);
  if (p.primary === "flak" && wlv("flak") > 0) {
    const L = wlv("flak"), need = [1.1, 1, .9, .8, .7][L - 1];
    p.charge = (p.charge || 0) + dt;
    if (p.charge >= need) { p.charge = 0; fireChargeBeam(p, L); }
  } else p.charge = 0;
  if (wlv("homing") > 0) { p.missileCd -= dt; if (p.missileCd <= 0) fireMissiles(p); }
  const L = wlv("wingmen");
  if (L > 0) {
    const n = L >= 4 ? 3 : 2;
    p.wing = p.wing.slice(0, n); while (p.wing.length < n) p.wing.push({ x: p.x, y: p.y });
    p.wing.forEach((w, i) => { const t = p.trail[Math.min(p.trail.length - 1, (i + 1) * 12)] || p; w.x = lerp(w.x, t.x, 1 - Math.pow(.0001, dt)); w.y = lerp(w.y, t.y, 1 - Math.pow(.0001, dt)); });
    p.wingCd -= dt; if (p.wingCd <= 0) fireOptions(p, L);
    if (L >= 3) { p.sparkCd -= dt; if (p.sparkCd <= 0) { for (const w of p.wing) pushBullet({ x: w.x + 8, y: w.y, vx: 260, vy: rand(-60, 60), kind: "missile", spark: true, lv: 1, dmg: 1.5, r: 3, speed: 260, maxSpeed: 560, turn: 7, life: 2, trail: [] }); p.sparkCd = [.7, .7, .7, .5, .35][L - 1]; } }
  }
  if (p.heart >= HEART_MAX && !p.heartReady) { p.heartReady = true; sfx("heartready"); }
}
function fireSidePrimary(p) {
  const prim = p.primary, L = prim === "pulse" ? 0 : wlv(prim);
  if (prim === "spread" && L > 0) { // Scatter Core: forward fan
    const n = [3, 5, 7, 7, 9][L - 1], step = [.19, .16, .14, .13, .11][L - 1], dmg = [1, 1.15, 1.3, 1.55, 1.8][L - 1], r = [3.5, 4.5, 5.5, 6.2, 7][L - 1];
    for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * step; pushBullet({ x: p.x + 18, y: p.y + Math.sin(a) * 10, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, dmg, r, kind: "spread", lv: L }); }
    p.fireCd = .12;
  } else {
    if (prim === "flak") pushBullet({ x: p.x + 22, y: p.y, vx: 820, vy: 0, dmg: 1, r: 3, kind: "pulseH" });
    else { pushBullet({ x: p.x + 18, y: p.y - 7, vx: 820, vy: 0, dmg: 1, r: 3, kind: "pulseH" }); pushBullet({ x: p.x + 18, y: p.y + 7, vx: 820, vy: 0, dmg: 1, r: 3, kind: "pulseH" }); }
    p.fireCd = .11;
  }
  sfx("shot");
}
function fireChargeBeam(p, L) {
  pushBullet({ x: p.x + 30, y: p.y, vx: 1100, vy: 0, kind: "beam", lv: L, dmg: [6, 8, 10, 12, 15][L - 1], r: [9, 11, 13, 15, 18][L - 1], len: [90, 110, 130, 150, 180][L - 1], hits: new Set(), life: 1.2 });
  sfx("laser"); shake(3);
}
function fireOptions(p, L) {
  const dmg = [.8, .9, 1, 1.15, 1.3][L - 1];
  for (const w of p.wing) {
    if (L >= 2) { pushBullet({ x: w.x + 10, y: w.y - 4, vx: 800, vy: 0, dmg, r: 3, kind: "wingH", lv: L }); pushBullet({ x: w.x + 10, y: w.y + 4, vx: 800, vy: 0, dmg, r: 3, kind: "wingH", lv: L }); }
    else pushBullet({ x: w.x + 10, y: w.y, vx: 800, vy: 0, dmg, r: 3, kind: "wingH", lv: L });
  }
  p.wingCd = .17;
}

// ---------------------------------------------------------------- side-scroll enemies
function updateEnemySide(e, dt) {
  e.age += dt; e.flash = Math.max(0, e.flash - dt);
  const d = ETYPES[e.type], ox = e.x, oy = e.y;
  switch (e.pattern) {
    case "left": e.x -= d.speed * dt; break;
    case "sineL": e.x -= d.speed * .85 * dt; e.y = e.y0 + Math.sin(e.age * 2.3 + e.phase) * (e.amp || 90); break;
    case "diveL":
      if (!e.locked) { e.x -= d.speed * .8 * dt; if (e.x < (e.lockX || W * .72)) { e.locked = true; const a = aimAt(e.x, e.y); e.vx = Math.cos(a) * 120; e.vy = Math.sin(a) * 120; } }
      else { const sp = Math.min(380, Math.hypot(e.vx, e.vy) + 420 * dt), a = Math.atan2(e.vy, e.vx); e.vx = Math.cos(a) * sp; e.vy = Math.sin(a) * sp; e.x += e.vx * dt; e.y += e.vy * dt; }
      break;
    case "arc": {
      if (e.ang === undefined) e.ang = e.dir > 0 ? Math.PI / 2 + .15 : -Math.PI / 2 - .15;
      const target = Math.PI - e.dir * .45;
      let da = ((target - e.ang + Math.PI * 3) % TAU) - Math.PI;
      e.ang += clamp(da, -1.3 * dt, 1.3 * dt);
      e.x += Math.cos(e.ang) * d.speed * dt; e.y += Math.sin(e.ang) * d.speed * dt;
      if (!e.shot && e.age > .9 && e.x < W - 40) { e.shot = true; enemyShoot(e.x, e.y, aimAt(e.x, e.y), 210); sfx("eshot"); }
      break;
    }
    case "hoverR":
      if (e.age < (e.hold || 6)) { e.x = lerp(e.x, e.stopX || W * .8, 1 - Math.pow(.2, dt)); e.y = e.y0 + Math.sin(e.age * .9 + e.phase) * 40; }
      else e.x -= d.speed * 1.6 * dt;
      break;
    case "wall": e.x -= world.speed * dt; e.y = e.onTop ? canyonTop(e.x) + 12 : canyonBot(e.x) - 12; break;
    case "drift": e.x -= (world.speed + e.vx) * dt; e.y += e.vy * dt; e.spin += e.vs * dt; break;
  }
  if (e.pattern === "wall") e.heading = aimAt(e.x, e.y);
  else if (e.pattern === "hoverR") e.heading = Math.PI + clamp((e.y - oy) / (dt || 1) / 300, -.35, .35);
  else if (e.pattern !== "drift") { const dx = e.x - ox, dy = e.y - oy; if (dx || dy) e.heading = Math.atan2(dy, dx); }
  if (e.x < W - 20 && e.x > W * .22 && G.player.alive) {
    e.fireCd -= dt;
    if (e.fireCd <= 0) {
      if (e.type === "scout" && e.shoots) { enemyShoot(e.x - 10, e.y, aimAt(e.x, e.y), 200); e.fireCd = rand(2.2, 3.4); sfx("eshot"); }
      else if (e.type === "armored") { const a = aimAt(e.x, e.y); for (let k = -1; k <= 1; k++) enemyShoot(e.x - 16, e.y, a + k * .2, 185, 6); e.fireCd = 1.8; sfx("eshot"); }
      else if (e.type === "carrier") { for (let k = 0; k < 8; k++) enemyShoot(e.x, e.y, e.age + k * TAU / 8, 130, 5, "#ffc36e"); e.fireCd = 2.6; sfx("eshot"); }
      else if (e.type === "turret") { const a = aimAt(e.x, e.y); enemyShoot(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, a, 210); e.second = .14; e.fireCd = 2.3; sfx("eshot"); }
      else e.fireCd = 99;
    }
  }
  if (e.second > 0) { e.second -= dt; if (e.second <= 0 && G.player.alive) { const a = aimAt(e.x, e.y); enemyShoot(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, a, 210); } }
  if (e.x < -90 || e.x > W + 160 || e.y < -140 || e.y > H + 140) { if (e.age > 1) { e.gone = true; if (e.group) e.group.failed = true; } }
}
function drawWreck(e) {
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.spin);
  ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(8, 10, e.r, e.r * .7, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(-e.r, -e.r, e.r, e.r); g.addColorStop(0, e.flash > 0 ? "#fff" : "#6b7388"); g.addColorStop(1, "#262a35");
  ctx.fillStyle = g; ctx.strokeStyle = "#07080c"; ctx.lineWidth = 2.5;
  ctx.beginPath(); e.shape.forEach(([a, r], i) => { const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-e.r * .6, -2); ctx.lineTo(e.r * .5, 3); ctx.stroke();
  ctx.fillStyle = "rgba(255,150,70,.7)"; ctx.fillRect(-4, -e.r * .4, 6, 3);
  ctx.fillStyle = "#9aa3b8"; ctx.fillRect(e.r * .2, -e.r * .3, 3, 3); ctx.fillRect(-e.r * .4, e.r * .2, 3, 3);
  ctx.restore();
}

// ---------------------------------------------------------------- 5-2 script
const SCRIPT52_END = 102;
function buildScript52() {
  const s = [], at = (t, fn) => s.push({ t, fn });
  const grp = total => ({ total, killed: 0, failed: false, paid: false });
  const R0 = W + 40;
  const col = (type, n, y0, dy, pattern, opts = {}) => { const group = grp(n); for (let i = 0; i < n; i++) spawnEnemy(type, R0 + (opts.stagger || 0) * i, y0 + i * dy, pattern, Object.assign({ phase: i * .5, group, y0: y0 + i * dy }, opts)); };
  const train = (type, n, y, pattern, opts = {}) => { const group = grp(n); for (let i = 0; i < n; i++) spawnEnemy(type, R0 + i * 46, y, pattern, Object.assign({ phase: i * .45, group, y0: y }, opts)); };
  const vee = (type, n, cy) => { const group = grp(n); for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; spawnEnemy(type, R0 + Math.abs(k) * 34, cy + k * 44, "diveL", { lockX: W * .7 - Math.abs(k) * 20, group }); } };
  const arcs = (n, fromTop) => { const group = grp(n); for (let i = 0; i < n; i++) spawnEnemy("stinger", W * .82 - i * 30, fromTop ? -30 - i * 40 : H + 30 + i * 40, "arc", { dir: fromTop ? 1 : -1, group }); };
  const carrier = (drop, y) => spawnEnemy("carrier", R0, y, "hoverR", { drop, stopX: W * .8, hold: 7, y0: y });
  const armored = (y) => spawnEnemy("armored", R0, y, "hoverR", { stopX: W * .78, hold: 8, y0: y });
  const walls = list => { const group = grp(list.length); list.forEach(([dx, onTop]) => spawnEnemy("turret", R0 + dx, 0, "wall", { onTop, fireCd: rand(1.2, 2.4), group })); };
  const field = (n, spread = 1) => { for (let i = 0; i < n; i++) { const r = rand(16, 28), shape = Array.from({ length: 7 }, (_, k) => [k * TAU / 7 + rand(-.2, .2), r * rand(.65, 1.1)]);
    spawnEnemy("wreck", R0 + i * rand(60, 110) * spread, rand(canyonTop(W) + 40, canyonBot(W) - 40), "drift", { r, shape, vx: rand(-20, 60), vy: rand(-18, 18), spin: rand(0, TAU), vs: rand(-1.2, 1.2) }); } };
  at(2, () => train("scout", 5, H * .4, "sineL", { amp: 60 }));
  at(5, () => field(5));
  at(7.5, () => arcs(4, true));
  at(10, () => carrier("spread", H * .45));
  at(12, () => walls([[0, false], [140, false], [280, true]]));
  at(15, () => vee("interceptor", 5, H * .5));
  at(18, () => arcs(4, false));
  at(20, () => field(6));
  at(22, () => train("scout", 6, H * .62, "sineL", { amp: 50 }));
  at(25, () => { armored(H * .35); armored(H * .65); });
  at(28, () => carrier("wingmen", H * .5));
  at(30, () => col("scout", 5, H * .25, 60, "left", { stagger: 30 }));
  at(33, () => walls([[0, true], [120, true], [240, false], [360, false]]));
  at(35, () => { arcs(4, true); arcs(4, false); });
  at(39, () => field(8, .8));
  at(41, () => carrier("homing", H * .4));
  at(43, () => { armored(H * .3); armored(H * .5); armored(H * .7); });
  at(47, () => vee("interceptor", 7, H * .45));
  at(50, () => carrier("flak", H * .55));
  at(52, () => walls([[0, false], [100, true], [200, false], [300, true]]));
  at(55, () => { arcs(5, true); arcs(5, false); });
  at(59, () => train("scout", 8, H * .5, "sineL", { amp: 110 }));
  at(62, () => carrier("shield", H * .5));
  at(64, () => field(9, .7));
  at(66, () => { armored(H * .4); vee("interceptor", 5, H * .6); });
  at(70, () => col("scout", 7, H * .2, 55, "left", { stagger: 16 }));
  at(73, () => carrier("spread", H * .35));
  at(75, () => walls([[0, true], [90, false], [180, true], [270, false]]));
  at(78, () => { arcs(6, true); arcs(6, false); });
  at(82, () => { armored(H * .3); armored(H * .7); train("scout", 6, H * .5, "sineL", { amp: 70 }); });
  at(85, () => carrier("bomb", H * .5));
  at(87, () => field(10, .6));
  at(90, () => { vee("interceptor", 7, H * .4); arcs(5, false); });
  at(94, () => carrier("homing", H * .55));
  at(96, () => train("scout", 9, H * .5, "sineL", { amp: 130 }));
  at(SCRIPT52_END - 3, () => { G.warn = 3.2; sfx("warn"); });
  at(SCRIPT52_END, () => startLeviathan());
  return s.sort((a, b) => a.t - b.t);
}

// ---------------------------------------------------------------- boss: Canyon Leviathan (bio-serpent)
const LEV_N = 16, LEV_SP = 30, LEV_SACS = [3, 6, 9, 12];
function startLeviathan() {
  if (G.bossTriggered) return;
  G.bossTriggered = true;
  if (G.warn <= 0) { G.warn = 3.2; sfx("warn"); }
  const b = { kind: "leviathan", state: "wait", t: 0, moveT: 0, x: W + 260, y: H / 2, vx: -200, vy: 0, ang: Math.PI,
    hpCore: 900, maxCore: 900, ph2: false, ph2T: 0, flash: 0, pingT: 0, spitCd: 2.4, spineCd: 4.5, lunge: null, lungeCd: 7, dieT: 0, boomCd: 0, dieIdx: LEV_N - 1, segs: [] };
  for (let i = 0; i < LEV_N; i++) b.segs.push({ x: b.x + (i + 1) * LEV_SP, y: b.y, r: 30 - i * 1.15, sac: LEV_SACS.includes(i) ? { hp: 140, max: 140, alive: true, flash: 0 } : null, dead: false });
  G.boss = b;
}
function levSacs(b) { return b.segs.filter(s => s.sac && s.sac.alive); }
function damageSac(seg, dmg) {
  const b = G.boss; if (!b || b.state !== "fight" || !seg.sac.alive) return;
  seg.sac.hp -= dmg; seg.sac.flash = .06; sfx("hit");
  if (seg.sac.hp <= 0) {
    seg.sac.alive = false; explode(seg.x, seg.y, 2.2, ["#c8ff7a", "#ffd36e", "#f06d72"]); sfx("bigboom"); shake(12); G.player.score += 3000;
    for (let i = 0; i < 5; i++) { const a = Math.random() * TAU; G.debris.push({ x: seg.x, y: seg.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, value: i < 2 ? 5 : 1, gold: i < 2, spin: 0, delay: 0, life: 9 }); }
    if (!levSacs(b).length) { b.ph2 = true; b.ph2T = 1.2; b.lungeCd = 2.5; sfx("shieldbreak"); flash(.5, "#e8ffb0"); spark(b.x, b.y, "#c8ff7a", 24, 300, .6, 3); }
  }
}
function damageLevHead(dmg) {
  const b = G.boss; if (!b || b.state !== "fight") return;
  if (!b.ph2) { b.pingT = .15; sfx("ping"); return; }
  b.hpCore -= dmg; b.flash = .06; sfx("hit");
  if (b.hpCore <= 0) { b.hpCore = 0; b.state = "dying"; b.dieT = 0; b.lunge = null; G.ebullets.length = 0; for (const e of G.enemies) if (!e.dead) killEnemy(e, true); sfx("boom"); shake(10); }
}
function updateLeviathan(dt) {
  const b = G.boss, p = G.player;
  b.t += dt; b.flash = Math.max(0, b.flash - dt); b.pingT = Math.max(0, b.pingT - dt); b.ph2T = Math.max(0, b.ph2T - dt);
  for (const s of b.segs) if (s.sac) s.sac.flash = Math.max(0, s.sac.flash - dt);
  G.flatten = Math.min(1, (G.flatten || 0) + dt * .4);
  let tx = b.x, ty = b.y, maxSp = 230;
  if (b.state === "wait") { if (G.warn <= 0) { b.state = "enter"; b.t = 0; } }
  else if (b.state === "enter") { tx = W * .72; ty = H / 2 + Math.sin(b.t * 2) * 60; if (b.t > 3.2) { b.state = "fight"; b.t = 0; } }
  else if (b.state === "fight") {
    b.moveT += dt;
    tx = W * .7 + Math.cos(b.moveT * .55) * 160; ty = H / 2 + Math.sin(b.moveT * 1.1) * 175;
    // lunge: rear back, telegraph a lane, then strike across the canyon
    b.lungeCd -= dt;
    if (!b.lunge && b.lungeCd <= 0) b.lunge = { t: 0, y: clamp(p.y, 90, H - 90), phase: "aim" };
    if (b.lunge) {
      const L = b.lunge; L.t += dt;
      if (L.phase === "aim") { tx = W - 90; ty = L.y; maxSp = 420; if (L.t < .8) L.y = lerp(L.y, clamp(p.y, 90, H - 90), 1 - Math.pow(.2, dt)); if (L.t >= .8 && !L.locked) { L.locked = true; sfx("lock"); } if (L.t >= 1.15) { L.phase = "strike"; L.t = 0; sfx("laser"); shake(6); } }
      else if (L.phase === "strike") { tx = -200; ty = L.y; maxSp = 950; if (b.x < 110 || L.t > 1.3) { L.phase = "back"; L.t = 0; } }
      else { tx = W * .75; ty = H / 2; maxSp = 380; if (L.t > 1.4) { b.lunge = null; b.lungeCd = b.ph2 ? 6 : 9; } }
    }
    if (!b.lunge && b.ph2T <= 0) {
      b.spitCd -= dt;
      if (b.spitCd <= 0) { const a = aimAt(b.x, b.y), n = b.ph2 ? 7 : 5; for (let k = 0; k < n; k++) enemyShoot(b.x + Math.cos(b.ang) * 30, b.y + Math.sin(b.ang) * 30, a + (k - (n - 1) / 2) * .16, 200, 6, "#c8ff7a"); b.spitCd = b.ph2 ? 1.8 : 2.4; sfx("eshot"); }
      b.spineCd -= dt;
      if (b.spineCd <= 0) {
        b.segs.forEach((s, i) => { if (i % 2 || i < 2) return; const prev = i ? b.segs[i - 1] : b, a = Math.atan2(s.y - prev.y, s.x - prev.x); for (const sgn of [-1, 1]) enemyShoot(s.x, s.y, a + sgn * Math.PI / 2, 150, 5, "#e0c8ff"); });
        b.spineCd = b.ph2 ? 3.2 : 4.5; sfx("eshot");
      }
    }
    if (p.alive) { if (Math.hypot(p.x - b.x, p.y - b.y) < 40) hurtPlayer(35); for (const s of b.segs) if (Math.hypot(p.x - s.x, p.y - s.y) < s.r * .8 + 6) { hurtPlayer(25); break; } }
  } else if (b.state === "dying") {
    b.dieT += dt; b.boomCd -= dt; tx = b.x; ty = b.y; maxSp = 30;
    if (b.boomCd <= 0 && b.dieIdx >= 0) { const s = b.segs[b.dieIdx]; s.dead = true; explode(s.x, s.y, 1.6, ["#c8ff7a", "#ffd36e", "#f06d72"]); sfx("boom"); shake(8); b.dieIdx--; b.boomCd = .12; }
    if (b.dieIdx < 0 && b.dieT > 2.4) {
      explode(b.x, b.y, 4, ["#fff2a8", "#c8ff7a", "#f06d72", "#ffffff"]); sfx("bigboom"); shake(26); flash(1, "#f4ffdc");
      for (let i = 0; i < 18; i++) { const a = Math.random() * TAU, s = rand(80, 260), gold = i < 10; G.debris.push({ x: b.x, y: b.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, value: gold ? 5 : 1, gold, spin: 0, delay: .3, life: 12 }); }
      G.player.score += 20000; G.boss = null; G.bossKilled = true; G.clearDelay = 3.2; return;
    }
  }
  // steer the head toward its target
  const dx = tx - b.x, dy = ty - b.y, dist = Math.hypot(dx, dy) || 1;
  const want = Math.min(maxSp, dist * 3);
  b.vx = lerp(b.vx, dx / dist * want, 1 - Math.pow(.02, dt)); b.vy = lerp(b.vy, dy / dist * want, 1 - Math.pow(.02, dt));
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (Math.hypot(b.vx, b.vy) > 20) b.ang = Math.atan2(b.vy, b.vx);
  // body follows like a rope
  let prev = b;
  for (const s of b.segs) { const ax = s.x - prev.x, ay = s.y - prev.y, d = Math.hypot(ax, ay) || 1; if (d > LEV_SP) { s.x = prev.x + ax / d * LEV_SP; s.y = prev.y + ay / d * LEV_SP; } s.ang = Math.atan2(prev.y - s.y, prev.x - s.x); prev = s; }
}
function drawLeviathan(b) {
  // lunge telegraph lane
  if (b.lunge && b.lunge.phase === "aim") {
    const L = b.lunge, locked = L.t >= .8, blink = Math.abs(Math.sin(L.t * (locked ? 26 : 12)));
    ctx.save(); ctx.fillStyle = `rgba(200,255,120,${(locked ? .2 : .08) + .1 * blink})`; ctx.fillRect(0, L.y - 34, W, 68);
    ctx.strokeStyle = `rgba(210,255,140,${.5 + .5 * blink})`; ctx.lineWidth = 2; ctx.setLineDash([16, 10]);
    ctx.beginPath(); ctx.moveTo(0, L.y - 34); ctx.lineTo(W, L.y - 34); ctx.moveTo(0, L.y + 34); ctx.lineTo(W, L.y + 34); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = `rgba(230,255,170,${.3 + .4 * blink})`;
    for (let d = W - 60 - (L.t * 240) % 60; d > 0; d -= 60) { ctx.beginPath(); ctx.moveTo(d, L.y - 12); ctx.lineTo(d - 14, L.y); ctx.lineTo(d, L.y + 12); ctx.lineTo(d - 6, L.y); ctx.fill(); }
    ctx.restore();
  }
  // body, tail first
  for (let i = b.segs.length - 1; i >= 0; i--) {
    const s = b.segs[i]; if (s.dead) continue;
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.ang || Math.PI);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(8, 12, s.r * 1.15, s.r * .85, 0, 0, TAU); ctx.fill();
    // spines
    ctx.fillStyle = "#d9cfae"; ctx.strokeStyle = "#07050b"; ctx.lineWidth = 2;
    for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-s.r * .4, sg * s.r * .7); ctx.lineTo(-s.r * 1.1, sg * s.r * 1.45); ctx.lineTo(s.r * .1, sg * s.r * .8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    const g = ctx.createLinearGradient(0, -s.r, 0, s.r); g.addColorStop(0, "#7d6f95"); g.addColorStop(.5, "#3d3350"); g.addColorStop(1, "#1a1424");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, s.r * 1.1, s.r * .9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 2; for (const k of [-.45, .1]) { ctx.beginPath(); ctx.ellipse(k * s.r, 0, s.r * .35, s.r * .8, 0, -1.2, 1.2); ctx.stroke(); }
    ctx.strokeStyle = "rgba(230,215,255,.3)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, s.r * .95, s.r * .75, 0, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
    ctx.fillStyle = "rgba(255,90,190,.35)"; ctx.fillRect(-s.r * .15, -s.r * .12, s.r * .3, s.r * .24);
    if (s.sac && s.sac.alive) {
      const pulse = .85 + .15 * Math.sin(world.time * 6 + i);
      const sg = ctx.createRadialGradient(-3, -4, 1, 0, 0, s.r * .62 * pulse); sg.addColorStop(0, s.sac.flash > 0 ? "#ffffff" : "#f4ffc0"); sg.addColorStop(.5, "#b6f05a"); sg.addColorStop(1, "#3c6a18");
      ctx.fillStyle = sg; ctx.shadowBlur = 16; ctx.shadowColor = "#b6f05a"; ctx.beginPath(); ctx.arc(0, 0, s.r * .62 * pulse, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "#1c3008"; ctx.lineWidth = 2; ctx.stroke();
    } else if (s.sac) { ctx.fillStyle = "#1a0f14"; ctx.beginPath(); ctx.arc(0, 0, s.r * .5, 0, TAU); ctx.fill(); if (Math.random() < .2) G.fx.push({ k: "smoke", x: s.x, y: s.y, vx: rand(-10, 10), vy: rand(-30, -10), r: rand(5, 9), life: .7, max: .7 }); }
    ctx.restore();
  }
  // head
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.ang);
  if (b.state === "dying") ctx.translate(rand(-3, 3), rand(-3, 3));
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(8, 14, 50, 34, 0, 0, TAU); ctx.fill();
  const open = b.ph2 ? .5 + .5 * Math.abs(Math.sin(world.time * 3)) : .15;
  ctx.strokeStyle = "#07050b"; ctx.lineWidth = 2.5;
  for (const sg of [-1, 1]) { // mandibles
    ctx.save(); ctx.rotate(sg * open * .5); ctx.fillStyle = "#d9cfae";
    ctx.beginPath(); ctx.moveTo(10, sg * 10); ctx.quadraticCurveTo(46, sg * 22, 60, sg * 4); ctx.lineTo(40, sg * 12); ctx.quadraticCurveTo(26, sg * 14, 10, sg * 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  if (b.ph2) { const mg = ctx.createRadialGradient(24, 0, 2, 24, 0, 26); mg.addColorStop(0, "#fffbe0"); mg.addColorStop(.5, "#c8ff7a"); mg.addColorStop(1, "rgba(120,200,60,0)"); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(24, 0, 26, 0, TAU); ctx.fill(); }
  const hg = ctx.createLinearGradient(0, -34, 0, 34); hg.addColorStop(0, b.flash > 0 ? "#fff" : "#8f80a8"); hg.addColorStop(.5, "#4a3d60"); hg.addColorStop(1, "#1d1628");
  ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(34, 0); ctx.quadraticCurveTo(26, -30, -10, -32); ctx.quadraticCurveTo(-40, -26, -44, 0); ctx.quadraticCurveTo(-40, 26, -10, 32); ctx.quadraticCurveTo(26, 30, 34, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  // armored crest (cracks open in phase 2)
  ctx.fillStyle = b.ph2 ? "#2a2034" : "#6a5d80"; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-6, -18); ctx.lineTo(-36, -10); ctx.lineTo(-36, 10); ctx.lineTo(-6, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (b.ph2) { ctx.strokeStyle = "rgba(200,255,120,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-8, -6); ctx.lineTo(-20, 4); ctx.lineTo(-32, -3); ctx.stroke(); }
  if (b.pingT > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(200,240,255,${b.pingT * 3})`; ctx.beginPath(); ctx.arc(-8, 0, 30, 0, TAU); ctx.fill(); ctx.restore(); }
  for (const sg of [-1, 1]) { ctx.fillStyle = "#ffac3a"; ctx.shadowBlur = 10; ctx.shadowColor = "#ffac3a"; ctx.beginPath(); ctx.ellipse(8, sg * 16, 5, 3, sg * .3, 0, TAU); ctx.fill(); } ctx.shadowBlur = 0;
  ctx.fillStyle = "#d9cfae"; for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-20, sg * 28); ctx.lineTo(-44, sg * 50); ctx.lineTo(-30, sg * 24); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- screens
function dim(a = .55) { ctx.fillStyle = `rgba(3,7,17,${a})`; ctx.fillRect(0, 0, W, H); }
function button(r, selected, draw) {
  ctx.save();
  ctx.fillStyle = selected ? "rgba(20,52,60,.95)" : "rgba(8,20,28,.85)";
  ctx.strokeStyle = selected ? "#9ff5e8" : "rgba(104,214,199,.35)"; ctx.lineWidth = selected ? 2.5 : 1.5;
  if (selected) { ctx.shadowBlur = 16; ctx.shadowColor = "#68d6c7"; }
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(r.x, r.y, r.w, r.h, 10) : ctx.rect(r.x, r.y, r.w, r.h); ctx.fill(); ctx.stroke();
  ctx.restore();
  draw();
}
function drawTitle() {
  dim(.45);
  const t = world.time;
  ctx.save();
  // big heart
  ctx.shadowBlur = 40 + 12 * Math.sin(t * 3); ctx.shadowColor = "#d66cff";
  drawCrystal(W / 2, 185 + Math.sin(t * 1.6) * 5, 170);
  ctx.restore();
  drawPlayerShip(W / 2, 318 + Math.sin(t * 2) * 5, Math.sin(t) * .3, 1, 1, 84);
  drawLabel("HEART RUN", W / 2, 22, 44, "#9ff5e8", "center", 800);
  { const unlocked = save.cleared.includes("5-1") ? 2 : 1, lv = Math.min(titleLevel, unlocked);
    drawLabel((unlocked > 1 ? "◀  " : "") + "STAGE 5-" + lv + "  ·  " + LEVELS[lv].name + (unlocked > 1 ? "  ▶" : ""), W / 2, 366, 15, "#c9a6ef", "center"); }
  // controls legend (keycaps + pad buttons + icons)
  const rows = [
    { icon: "move", label: "MOVE", keys: ["W", "A", "S", "D"], pad: ["L", "#9ff5e8"] },
    { icon: "focus", label: "SLOW MOVE", keys: ["⇧"], pad: ["RB", "#9ff5e8"] },
    { icon: "bomb", label: "BOMB", keys: ["Space"], pad: ["B", "#ff8f70"] },
    { icon: "heart", label: "CRYSTAL PULSE", keys: ["E"], pad: ["Y", "#d66cff"] },
    { icon: "pause", label: "PAUSE", keys: ["P"], pad: ["≡", "#9ff5e8"] }
  ];
  const x0 = W / 2 - 160, y0 = 400;
  rows.forEach((r, i) => {
    const y = y0 + i * 36;
    drawLabel(r.label, x0 - 28, y - 8, 14, "#cfe9ee", "right");
    if (r.icon === "bomb") drawPowerIcon("bomb", x0, y, .7, 0, false);
    else drawUiIcon(r.icon, x0, y, 26, r.icon === "heart" ? "#d66cff" : "#9ff5e8");
    r.keys.forEach((k, j) => keycap(k, x0 + 50 + j * 36 + (k.length > 1 ? 26 : 0), y, k.length > 1 ? 82 : 30));
    if (r.pad) padButton(r.pad[0], r.pad[1], x0 + 250, y);
  });
  const a = .5 + .5 * Math.sin(t * 4);
  ctx.save(); ctx.globalAlpha = .5 + .5 * a;
  drawUiIcon("play", W / 2 + 230, 470, 44, "#9ff5e8");
  drawLabel("START", W / 2 + 230, 408, 16, "#9ff5e8", "center");
  keycap("Enter", W / 2 + 230, 520, 60); padButton("A", "#7ee3a1", W / 2 + 230, 556);
  ctx.restore(); ctx.save();
  drawLabel("Fly the Power Crystal home. The alien fleet is right behind you.", W / 2, 76, 15, "#d7e6f0", "center", 500);
  ctx.restore();
}
function drawOver() {
  dim(.6);
  drawLabel("SHIP DESTROYED", W / 2, 190, 40, "#ff7a66", "center", 800);
  drawLabel("SCORE  " + fmt(G.player.score), W / 2, 262, 22, "#dff7ff", "center");
  button(NEXT_BTN(0), menuSel === 0, () => { drawUiIcon("replay", NEXT_BTN(0).x + 55, NEXT_BTN(0).y + 32, 36, "#9ff5e8"); drawLabel("RETRY", NEXT_BTN(0).x + 55, NEXT_BTN(0).y + 56, 13, "#9ff5e8", "center"); });
  button(NEXT_BTN(1), menuSel === 1, () => { drawUiIcon("home", NEXT_BTN(1).x + 55, NEXT_BTN(1).y + 32, 36, "#9ff5e8"); drawLabel("MENU", NEXT_BTN(1).x + 55, NEXT_BTN(1).y + 56, 13, "#9ff5e8", "center"); });
}
function drawClear() {
  dim(.55);
  const c = clearInfo, t = modeT;
  ctx.save(); ctx.globalAlpha = clamp(t / .6, 0, 1);
  drawUiIcon("check", W / 2, 130, 70, "#7ee3a1");
  drawLabel(LEVELS[G.level].boss + " DESTROYED", W / 2, 182, 34, "#7ee3a1", "center", 800);
  drawLabel("SCORE  " + fmt(c.score), W / 2, 246, 22, "#dff7ff", "center");
  // debris tally: carried -> bank
  panel(W / 2 - 200, 310, 400, 110);
  drawDebrisIcon(W / 2 - 160, 345, 9, false, .3);
  drawLabel(fmt(c.carried), W / 2 - 138, 332, 24, "#f2c45b"); drawLabel("COLLECTED", W / 2 - 170, 376, 12, "#c9b27a");
  drawUiIcon("arrow", W / 2, 345, 34, "#9ff5e8");
  drawDebrisIcon(W / 2 + 60, 345, 11, true, -.2); drawDebrisIcon(W / 2 + 72, 352, 8, false, .5);
  drawLabel(fmt(c.shown), W / 2 + 92, 332, 24, "#f2c45b");
  drawLabel("DEBRIS BANK", W / 2 + 50, 376, 12, "#c9b27a");
  if (t > 1.5 && c.shown >= c.to) { ctx.globalAlpha = .5 + .5 * Math.sin(world.time * 4); drawUiIcon("play", W / 2, 470, 40, "#9ff5e8"); drawLabel("Press Enter or A to visit the Weapon Forge", W / 2, 498, 15, "#9ff5e8", "center", 600); }
  ctx.restore();
}
function drawShop() {
  dim(.6);
  drawLabel("WEAPON FORGE", W / 2, 50, 34, "#f2c45b", "center", 800); drawLabel("Spend debris to raise a weapon's max level", W / 2, 92, 15, "#c9b27a", "center", 500);
  // vault
  panel(W / 2 - 110, 118, 220, 50);
  drawDebrisIcon(W / 2 - 76, 143, 11, true, -.2); drawDebrisIcon(W / 2 - 64, 150, 8, false, .5);
  drawLabel(fmt(save.bank), W / 2 - 40, 129, 24, "#f2c45b");
  shopItems().forEach((it, i) => {
    const r = SHOP_CARD(i), sel = menuSel === i;
    const shakeX = shopDeny && shopDeny.type === it ? Math.sin(shopDeny.t * 60) * 5 : 0;
    ctx.save(); ctx.translate(shakeX, 0);
    button(r, sel, () => {
      const cx = r.x + r.w / 2;
      if (it === "go") { drawUiIcon("arrow", cx, r.y + r.h / 2 - 10, 50, "#9ff5e8"); drawLabel("DONE", cx, r.y + r.h / 2 + 22, 14, "#9ff5e8", "center"); return; }
      const cap = save.caps[it], cost = capCost(it), col = PU_COLOR[it];
      if (shopFlash && shopFlash.type === it) { ctx.save(); ctx.globalAlpha = shopFlash.t; ctx.fillStyle = col; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.restore(); }
      ctx.save(); ctx.shadowBlur = 20; ctx.shadowColor = col; drawPowerIcon(it, cx, r.y + 62, 1.9, 0); ctx.restore();
      drawLabel(WEAPON_NAMES[it].toUpperCase(), cx, r.y + 104, 14, col, "center"); drawLabel("/ " + SIDE_NAMES[it], cx, r.y + 122, 11, "#aeb7bd", "center", 500); drawLabel("MAX LV " + cap, cx, r.y + 138, 12, "#aeb7bd", "center", 600);
      drawPips(cx - 43, r.y + 158, cap, cap, col, 11, 8);
      if (cost == null) { drawUiIcon("check", cx, r.y + 204, 28, "#7ee3a1"); drawLabel("MAXED", cx, r.y + 224, 12, "#7ee3a1", "center"); }
      else {
        const afford = save.bank >= cost;
        // next pip preview
        ctx.save(); ctx.globalAlpha = .45 + .35 * Math.sin(world.time * 5);
        ctx.translate(cx - 43 + cap * 19 + 5.5, r.y + 158); ctx.rotate(Math.PI / 4); ctx.fillStyle = col; ctx.fillRect(-5.5, -5.5, 11, 11);
        ctx.restore();
        drawDebrisIcon(cx - 34, r.y + 214, 8, true, 0);
        drawLabel(fmt(cost), cx - 22, r.y + 203, 20, afford ? "#f2c45b" : "#7d6a50");
        if (!afford) drawUiIcon("lock", cx + 46, r.y + 212, 22, "#7d6a50");
      }
    });
    ctx.restore();
  });
}
function drawNext() {
  dim(.6);
  const nextLv = G.level + 1, ready = !!LEVELS[nextLv];
  drawLabel("NEXT: STAGE 5-" + nextLv + (ready ? "  ·  " + LEVELS[nextLv].name : ""), W / 2, 140, 26, "#c9a6ef", "center", 800);
  if (!ready) drawLabel("Coming soon", W / 2, 180, 16, "#aeb7bd", "center", 500);
  drawUiIcon("sealed", W / 2, 280, 110, "rgba(176,130,214,.8)");
  ctx.globalAlpha = .5 + .5 * Math.sin(world.time * 2);
  drawCrystal(W / 2, 280, 64);
  ctx.globalAlpha = 1;
  button(NEXT_BTN(0), menuSel === 0, () => { drawUiIcon(ready ? "play" : "replay", NEXT_BTN(0).x + 55, NEXT_BTN(0).y + 32, 36, "#9ff5e8"); drawLabel(ready ? "LAUNCH" : "RETRY", NEXT_BTN(0).x + 55, NEXT_BTN(0).y + 56, 13, "#9ff5e8", "center"); });
  button(NEXT_BTN(1), menuSel === 1, () => { drawUiIcon("home", NEXT_BTN(1).x + 55, NEXT_BTN(1).y + 32, 36, "#9ff5e8"); drawLabel("MENU", NEXT_BTN(1).x + 55, NEXT_BTN(1).y + 56, 13, "#9ff5e8", "center"); });
}

// ---------------------------------------------------------------- main draw
function draw() {
  ctx.save();
  if (G && G.shake > 0 && mode === "play") ctx.translate(rand(-G.shake, G.shake), rand(-G.shake, G.shake));
  drawBackground();
  if (G && mode !== "title") {
    for (const e of G.enemies) if (ETYPES[e.type].ground) drawTurret(e);
    drawPickups();
    if (G.boss) drawBoss(G.boss);
    for (const e of G.enemies) if (!ETYPES[e.type].ground) drawEnemyShip(e);
    drawBullets();
    if (mode === "play") drawPlayer();
    drawEnemyBullets();
    drawFx();
  }
  ctx.restore();
  if (G && G.flash > 0) { ctx.save(); ctx.globalAlpha = Math.min(.85, G.flash); ctx.fillStyle = G.flashColor; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (mode === "title") drawTitle();
  else if (mode === "play") drawHUD();
  else if (mode === "over") drawOver();
  else if (mode === "clear") drawClear();
  else if (mode === "shop") drawShop();
  else if (mode === "next") drawNext();
}

let lastTs = 0;
function frame(ts) {
  const dt = Math.min(.033, (ts - lastTs) / 1000 || 0);
  lastTs = ts;
  try { pollPad(); } catch (e) { pad.blocked = true; }
  try { update(dt); draw(); }
  catch (err) { console.error(err); }
  actions.clear(); mouse.click = false; mouse.moved = false;
  requestAnimationFrame(frame);
}
// test hooks (used by automated checks; harmless in play)
window.__s5 = { get G() { return G; }, get mode() { return mode; }, startLevel, get save() { return save; }, step: (dt, noDraw) => { update(dt); if (!noDraw) draw(); actions.clear(); mouse.click = false; } };
if (params.get("debug") === "boss") { startLevel(titleLevel, true); } else if (params.get("level")) { startLevel(titleLevel); }
requestAnimationFrame(frame);
})();
