# Stage 5 music renderer

Deterministic NumPy/standard-library soundtrack generator for Drift Miner's Stage 5.
It renders 44.1 kHz stereo WAV masters, then calls FFmpeg for Vorbis and MP3.

## Requirements and commands

- Python 3 with NumPy
- FFmpeg and FFprobe on `PATH`, or set the `FFMPEG` environment variable to
  `ffmpeg.exe`. A portable binary can alternatively be placed at
  `tools/stage5_music/ffmpeg/bin/ffmpeg.exe`.

From the repository root:

```powershell
python tools/stage5_music/render.py
python tools/stage5_music/render.py --track boss
```

WAV masters and three-repeat loop checks are written to
`tools/stage5_music/out/` and are not game assets. Final `.ogg` and `.mp3`
files plus `loops.json` are written to `stage5/assets/music/`.

The generator uses fixed per-track seeds. It also canonicalizes Ogg stream
serial numbers and repairs Ogg page CRCs so rerenders are byte-for-byte stable.

## Track data

| Track | Use | BPM | Key | Duration | loopStart | loopEnd |
|---|---|---:|---|---:|---:|---:|
| `bgm-title` | Title, level select, Forge | 140 | E minor | 34.2857 s | 6.8571 | 34.2857 |
| `bgm-5-1` | Vessel Outskirts | 172 | E minor / G major | 69.7674 s | 2.7907 | 69.7674 |
| `bgm-5-2` | Debris Canyon | 180 | D Dorian | 69.3333 s | 5.3333 | 69.3333 |
| `bgm-5-3` | Fleet Blockade | 168 | C minor | 74.2857 s | 5.7143 | 74.2857 |
| `bgm-5-4` | Nebula Run | 196 | F# minor / A major | 63.6735 s | 4.8980 | 63.6735 |
| `bgm-5-5` | Heart of Darkness | 160 | B Phrygian | 78.0000 s | 6.0000 | 78.0000 |
| `bgm-boss` | Bosses 5-1 through 5-4 | 180 | A minor | 48.0000 s | 5.3333 | 48.0000 |
| `bgm-boss-final` | Hive Warden | 184 | B minor | 73.0435 s | 10.4348 | 73.0435 |
| `jingle-clear` | Level cleared | 172 | E major | 5.4000 s | — | — |
| `jingle-gameover` | Game over | 72 | E minor | 4.6000 s | — | — |

## Validation results

- Every looping body is a whole number of bars.
- The body is rendered twice internally and the steady-state second pass is kept.
- Three-repeat WAVs are generated as `out/loopcheck-*.wav`.
- All loop seam jumps are below each track's 99.9th-percentile ordinary
  sample-to-sample jump (largest measured ratio: 0.809).
- Every master peaks at -1.00 dBFS with no clipped samples.
- `ffprobe` durations match the table and every `loopEnd` is within the file.
- Every Ogg is below 1.4 MiB, comfortably under the 3 MB target.
- Two complete consecutive renders produced identical SHA-256 hashes for all
  20 encoded files and `loops.json`.


## Google Flow Music set (the game's default)

The Flow Music WAV downloads live in `stage5/assets/music/*.wav`. Turn them into
game files with:

```powershell
python tools/stage5_music/prepare_flow.py
```

It finds a seamless loop in each track, crossfades the seam, cuts the two jingles
down (Flow returned full-length songs), and writes `.ogg` + `.mp3` and `loops.json`
to `stage5/assets/music/flow/`.

In game, **M** (or the pad's View button) cycles the music: Flow, then Codex, then off.
`stage5.html?music=codex` also picks a set. The choice is remembered.
