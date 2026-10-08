// Generates the four Stage 6 music stingers with ElevenLabs (prompts from audio-task-stage6-stingers.md) into tmp/ai-stingers/,
// several takes each, plus tmp/ai-stingers/index.html for listening side by side. Picked takes are then copied into stage6/assets/audio/.
// Needs the ELEVENLABS_API_KEY environment variable. Usage: node tools/generate_stage6_stingers.mjs [victory defeat relic runwin] [--takes 4]
import { mkdirSync, writeFileSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "tmp", "ai-stingers");
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY is not set."); process.exit(1); }

const STYLE = "retro-futuristic sci-fi adventure, warm analog synth lead and pads with a light orchestral layer, no vocals";
const STINGERS = {
  victory: { api: "sfx", secs: 2.2, text: `Short triumphant sci-fi video game victory jingle, bright analog synth lead with brass stab, quick rising three-note motif ending on a major chord, light electronic percussion hit, upbeat and adventurous, ${STYLE}` },
  defeat: { api: "sfx", secs: 3, text: `Short sci-fi video game defeat jingle, slow descending synth melody in a minor key, low strings, a soft fading power-down tone at the end, somber but not scary, ${STYLE}` },
  relic: { api: "sfx", secs: 1.6, text: `Short magical sci-fi item discovery sound, shimmering ascending synth arpeggio with crystal chimes and a soft glowing pad swell, mysterious and rewarding, ${STYLE}` },
  runwin: { api: "music", secs: 7, text: `Triumphant sci-fi adventure victory fanfare for the end of a video game run, heroic synth and orchestral brass melody building to a big final major chord, timpani roll and cymbal swell, warm analog pads, celebratory and epic, ${STYLE}` }
};

const args = process.argv.slice(2), ti = args.indexOf("--takes");
const takes = ti >= 0 ? Number(args[ti + 1]) || 4 : 4;
const names = args.filter(a => STINGERS[a]);

async function generate(s) {
  const music = s.api === "music";
  const url = music ? "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128" : "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128";
  const body = music ? { prompt: s.text, music_length_ms: Math.round(s.secs * 1000), force_instrumental: true } : { text: s.text, duration_seconds: s.secs, prompt_influence: .5 };
  const r = await fetch(url, { method: "POST", headers: { "xi-api-key": KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 300)}`);
  return Buffer.from(await r.arrayBuffer());
}

mkdirSync(OUT, { recursive: true });
for (const name of names.length ? names : Object.keys(STINGERS)) {
  const have = readdirSync(OUT).filter(f => f.startsWith(name + "-")).length;   // new takes are numbered after any earlier ones
  for (let i = 1; i <= takes; i++) {
    const file = `${name}-${String(have + i).padStart(2, "0")}.mp3`;
    try { writeFileSync(join(OUT, file), await generate(STINGERS[name])); console.log("saved", file); }
    catch (e) { console.error("failed", file, e.message); if (/^(401|403)/.test(e.message)) process.exit(1); }
  }
}

// listening page: every take, grouped by stinger
const files = readdirSync(OUT).filter(f => f.endsWith(".mp3")).sort();
const group = n => files.filter(f => f.startsWith(n + "-")).map(f => `<div class="take"><span>${f}</span><audio controls preload="auto" src="${f}"></audio></div>`).join("");
writeFileSync(join(OUT, "index.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Stage 6 AI stingers</title>
<style>body{margin:0;padding:24px;background:#08101c;color:#f7edcf;font:15px system-ui,sans-serif}h1{color:#75f5ee;font-size:1.3rem}h2{color:#ffd365;font-size:1.05rem;margin:22px 0 8px}.take{display:flex;gap:12px;align-items:center;margin:6px 0}.take span{width:140px;font-family:monospace}</style></head>
<body><h1>Stage 6 AI stingers — pick one take of each</h1>${Object.keys(STINGERS).map(n => `<h2>${n}</h2>${group(n) || "<p>none yet</p>"}`).join("")}</body></html>`);
console.log(`\n${files.length} takes in tmp/ai-stingers/ — listen at http://127.0.0.1:8765/tmp/ai-stingers/index.html`);
