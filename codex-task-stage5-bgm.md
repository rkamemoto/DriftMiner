# Codex audio task: Stage 5 BGM (shmup rock soundtrack)

Save every file in **`driftminer/stage5/assets/music/`** using the exact filenames below. Put the generator in **`driftminer/tools/stage5_music/`**. When you're done, tell Claude "dropped". Claude will wire the files into the game. **Do not edit `stage5.js`, `stage5-1.js` or `stage5.html`.**

---

## What the game is

**Drift Miner** is a browser game where each stage is a different genre. **Stage 5** is a vertical/side-scrolling **shoot-'em-up**: the hero flies a small ship through an alien fleet to the alien homeworld. The levels are:

| Level | Name | View | Mood | Boss |
|---|---|---|---|---|
| 5-1 | Vessel Outskirts | top-down | "Here we go." Launch energy, heroic | Hangar Warden (giant walker) |
| 5-2 | Debris Canyon | side-scroll | Twisty, tight, dodging rocks; syncopated, driving | Canyon Leviathan (bio-serpent) |
| 5-3 | Fleet Blockade | top-down | Full-scale war, militaristic, relentless | Blockade Cruiser (battleship) |
| 5-4 | Nebula Run | side-scroll, fastest scroll speed | Pure speed, euphoric, shimmering | Nebula Stalker (dashing hunter) |
| 5-5 | Heart of Darkness | top-down, alien homeworld | Dark, heavy, ominous but still fast | Hive Warden (final boss) |

## Sound direction (all tracks)

**Frenetic, upbeat, rock.** Think 90s arcade/console shmup rock: *Thunder Force IV*, *Sonic 3 / Mega Man X* guitar BGMs, *Gradius V*-era rock, Mick Gordon-lite energy. Not orchestral, not chiptune, not EDM.

- **Lead electric guitar** carries the melody: distorted, singing, with vibrato on long notes, slides into notes, and occasional fast runs and pinch-harmonic-style squeals at phrase ends.
- **Rhythm guitar**: palm-muted chugging 8ths/16ths on power chords (root + fifth + octave), double-tracked and panned hard left/right.
- **Bass**: picked, gritty, locked to the kick, following the guitar roots and walking at phrase turns.
- **Drums**: punchy kick, cracking snare with room, tight closed hi-hats or ride on 8ths/16ths, crash on every phrase downbeat, tom fills every 4 or 8 bars. Use double-kick runs in the hot sections.
- **Optional color**: a synth pad or arpeggio under the guitars for the space feel. Keep it under the guitars.
- Prefer **minor keys with major lifts** (Aeolian or Dorian, with bVI–bVII–I cadences) for the heroic arcade sound.
- Melodies must be **hummable**: a clear 4- or 8-bar hook that comes back.
- Mix for a game: don't over-compress, and leave room in the 1–4 kHz band for SFX. Peak at −1 dBFS, and aim for roughly −14 LUFS integrated.

## How to make the audio (important)

You can't generate audio with a model, so **write a deterministic offline synthesizer/sequencer in Python** that renders the tracks to files. Use **only `numpy` plus the standard library** (`wave`, `struct`, `math`, `random` with a fixed seed). Then use **`ffmpeg`** to encode. Don't use scipy or other pip packages; they may not be installed.

Layout:

```
tools/stage5_music/
  synth.py        # instruments + effects
  songs.py        # the note data for every track (patterns, sections, arrangement)
  render.py       # `python3 tools/stage5_music/render.py` renders all tracks; `--track boss` renders one
  README.md       # how to re-render, plus a table of tempo/key/loop points per track
```

Instrument recipes (these matter most for how good it sounds):

1. **Electric guitar.** Use a **Karplus-Strong plucked string** (noise burst into a delay line with a lowpass averaging filter) for each string, not a raw sawtooth. For power chords, sum the root + 5th + octave strings with 5–15 ms strum offsets.
   - **Distortion**: pre-gain (×8 to ×30), then `tanh` or asymmetric soft clip, then a **cabinet sim**: a 4×12 cabinet approximated by a highpass around 90 Hz, a lowpass around 5 kHz, a gentle peak around 1.5–2.5 kHz and a dip around 400 Hz. Write simple biquad filters by hand in numpy (RBJ cookbook formulas).
   - **Palm mute**: shorter decay, darker string filter, lower pre-gain.
   - **Lead**: single notes, more gain, **vibrato** (±20–40 cents at 5–6 Hz, fading in on held notes), **pitch slides/bends** (render by resampling or by modulating the delay-line length), plus a short stereo delay (about 1/8 note, 25% feedback) and a little reverb.
   - **Double-tracking**: render rhythm parts twice with different random seeds and ±5 ms timing jitter, then pan them hard L/R.
2. **Bass**: Karplus-Strong or saw+sub sine, light overdrive, lowpass around 2.5 kHz.
3. **Drums**, all synthesized:
   - Kick: a sine pitch drop from 150 to 45 Hz plus a click transient.
   - Snare: a 180–220 Hz tone body plus bandpassed noise, plus a short reverb.
   - Hats: highpassed noise with a 30–80 ms decay.
   - Crash: long highpassed noise.
   - Toms: tuned sine drops.
   - Add slight **velocity humanization** (±10%) and ±3 ms timing jitter on everything except the kick.
4. **Reverb**: a simple Schroeder/Freeverb (comb + allpass) in numpy is fine.
5. **Master bus**: gentle bus compression (a simple RMS compressor is fine), then a soft limiter, then normalize to −1 dBFS peak.

Render in **44.1 kHz stereo**, then encode **both**:
- `.ogg` (Vorbis, `ffmpeg -c:a libvorbis -q:a 5`)
- `.mp3` (`ffmpeg -c:a libmp3lame -q:a 3`), as a fallback for Safari

## Looping rules (the game loops these seamlessly)

- Each looping track = **intro + loop body**. Render the intro once, then the loop body.
- The loop body must be an **exact whole number of bars**, and its tail must flow back into its own start musically (same chord/energy on both sides of the seam).
- To make the seam click-free, **render the loop body twice in a row internally**, then keep the second pass. Reverb and delay tails from the end then spill naturally into the start. Export intro + one clean loop body.
- In `tools/stage5_music/README.md`, record **`loopStart` and `loopEnd` in seconds (to 4 decimals) for every track**. Also write them to **`stage5/assets/music/loops.json`**:

```json
{
  "bgm-5-1": { "bpm": 172, "loopStart": 5.5814, "loopEnd": 95.8140 },
  "...": {}
}
```

- Don't fade out looping tracks. Jingles can end with a natural ring-out.

## Track list

| File (without extension) | Use | BPM | Key (suggested) | Length | Loops |
|---|---|---|---|---|---|
| `bgm-title` | Stage 5 title / level select / Forge shop | 140 | E minor | 4-bar intro + 16-bar loop | yes |
| `bgm-5-1` | Level 5-1 Vessel Outskirts | 168–176 | E minor → G major lift in chorus | 2-bar drum-fill intro + 48–64-bar loop | yes |
| `bgm-5-2` | Level 5-2 Debris Canyon | 176–184 | D Dorian | intro + 48–64-bar loop | yes |
| `bgm-5-3` | Level 5-3 Fleet Blockade | 168 | C minor, march-like snare rolls | intro + 48–64-bar loop | yes |
| `bgm-5-4` | Level 5-4 Nebula Run | 190–200 | F# minor, galloping 16ths | intro + 48–64-bar loop | yes |
| `bgm-5-5` | Level 5-5 Heart of Darkness | 160 | B Phrygian / drop-tuned low B chugs | intro + 48–64-bar loop | yes |
| `bgm-boss` | Boss fights in 5-1 to 5-4 | 180 | A minor, tense half-step riffs | 4-bar intro + 32-bar loop | yes |
| `bgm-boss-final` | Hive Warden (5-5) | 184 | B minor, double-kick, choir-like pad | 8-bar intro + 48-bar loop | yes |
| `jingle-clear` | Level cleared | 172 | resolves to a major chord | 4–6 s | no |
| `jingle-gameover` | Game over | slow | minor, descending | 3–5 s | no |

Section plan for each level track (bars at the given BPM):
- **Intro** (2–4 bars): drum fill or a riff on its own, building in.
- **A** (16 bars): main riff + lead hook.
- **B** (16 bars): new chord progression, lead goes higher, more energy.
- **Breakdown** (8 bars): half-time feel or a solo bass/drum groove; keep it moving (it's a shooter, so no silence).
- **Solo / climax** (8–16 bars): shred-style lead with fast runs over double-kick, then a turnaround back to A.

Per-track hooks so they sound different from each other:
- **5-1**: big, heroic, anthemic open-string riff. The "theme of Stage 5"; reuse its hook as a motif in `bgm-title` and `jingle-clear`.
- **5-2**: syncopated, stop-start riffs (dodging feel), with a call-and-response between lead and rhythm guitar.
- **5-3**: militaristic snare rolls, unison guitar+bass riffs, a battle-march chorus.
- **5-4**: fastest track, galloping rhythm (8th + two 16ths), shimmering synth arpeggio on top, euphoric major-key chorus.
- **5-5**: heaviest. Low chugs, dissonant tritone/half-step bends, an eerie pad. Still upbeat tempo; it's the final push.
- **Boss**: menacing chromatic riff and a siren-like lead bend. Quote the 5-1 hook distorted in minor.
- **Final boss**: the 5-1 hook in full minor-key epic form, with a choir-style pad (stacked detuned sines with a formant-ish bandpass) and blast-beat moments.

## Deliverables checklist

```
stage5/assets/music/
  bgm-title.ogg        bgm-title.mp3
  bgm-5-1.ogg          bgm-5-1.mp3
  bgm-5-2.ogg          bgm-5-2.mp3
  bgm-5-3.ogg          bgm-5-3.mp3
  bgm-5-4.ogg          bgm-5-4.mp3
  bgm-5-5.ogg          bgm-5-5.mp3
  bgm-boss.ogg         bgm-boss.mp3
  bgm-boss-final.ogg   bgm-boss-final.mp3
  jingle-clear.ogg     jingle-clear.mp3
  jingle-gameover.ogg  jingle-gameover.mp3
  loops.json
tools/stage5_music/
  synth.py  songs.py  render.py  README.md
```

- Keep **each .ogg under about 3 MB** (looping tracks around 1:30–2:30 total is plenty).
- Rendering must be **deterministic**: the same script gives the same files.
- **Self-check before you say "dropped"**:
  1. Run `render.py` from a clean state and confirm every file exists.
  2. Use `ffprobe` to print each file's duration, and confirm `loopEnd` ≤ duration.
  3. For each looping track, render a test file of `[loopStart..loopEnd]` repeated 3 times (`tools/stage5_music/out/loopcheck-<name>.wav`, which is not committed). Confirm there's no click at the seams: the sample-to-sample jump at the seam shouldn't be much bigger than the track's typical jump.
  4. Confirm the peak is ≤ −1 dBFS and there's no clipping.
  5. List the BPM, key, duration and loop points of each track in your reply.
