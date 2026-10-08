"""Render all Stage 5 music, or one track with: python render.py --track boss"""
from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import subprocess
import zlib
from pathlib import Path

import numpy as np

from songs import JINGLES, TRACKS
from synth import (PEAK_TARGET, SR, add, bass_note, crash, guitar_note, hat,
                   kick, master, power_chord, schroeder_reverb, snare,
                   stereo_delay, synth_pad, tom, write_wav)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ASSETS = ROOT / "stage5" / "assets" / "music"
OUT = HERE / "out"


def rng_for(name: str) -> np.random.Generator:
    return np.random.default_rng(zlib.crc32(("drift-miner-stage5-" + name).encode()))


def human(rng, amount=0.003):
    return float(rng.uniform(-amount, amount))


def rhythm_positions(style: str):
    if style == "syncopated":
        return [0, .5, 1.5, 2, 3, 3.5]
    if style == "gallop":
        return [0, .5, .75, 1, 1.5, 1.75, 2, 2.5, 2.75, 3, 3.5, 3.75]
    if style in ("heavy", "boss", "final"):
        return [0, .5, 1, 1.5, 2, 2.5, 3, 3.25, 3.5, 3.75]
    return [0, .5, 1, 1.5, 2, 2.5, 3, 3.5]


def add_drums(buf, start, beat, rng, style, bar_no, section):
    kick_beats = [0, 2]
    if style in ("gallop", "boss", "final") or section == "solo":
        kick_beats += [1.5, 2.5, 3, 3.5]
    elif style == "syncopated":
        kick_beats += [1.5, 3.25]
    elif style == "march":
        kick_beats += [1, 3]
    for q in sorted(set(kick_beats)):
        add(buf, kick(rng, rng.uniform(.9, 1.08)), start + q * beat, .48)
    for q in (1, 3):
        add(buf, snare(rng, rng.uniform(.92, 1.08)), start + q * beat + human(rng), .31,
            -.08 if q == 1 else .08)
        if style == "march":
            for r in (.25, .5, .75):
                add(buf, snare(rng, .45), start + (q + r) * beat + human(rng), .13, .12)
    div = 4 if style in ("gallop", "final") or section == "solo" else 2
    for k in range(4 * div):
        vel = rng.uniform(.82, 1.08) * (1.12 if k % div == 0 else .82)
        add(buf, hat(rng, vel), start + k * beat / div + human(rng), .22,
            -.35 if k % 2 else .35)
    if bar_no % 4 == 0:
        add(buf, crash(rng, 1.0), start + human(rng), .42, -.22 if bar_no % 8 else .22)
    if bar_no % 8 == 7:
        for k, f in enumerate((155, 130, 105, 82)):
            add(buf, tom(rng, f, rng.uniform(.9, 1.1)), start + (3 + k * .25) * beat + human(rng), .30,
                -.5 + k / 3)


def add_rhythm(buf, start, beat, root, rng, style, section, bar_no):
    positions = rhythm_positions(style)
    for idx, q in enumerate(positions):
        chord_root = root
        if style in ("heavy", "boss", "final") and idx % 7 == 6:
            chord_root += 1
        duration = beat * (.42 if len(positions) <= 8 else .23)
        palm = section != "chorus" or idx % 4 != 0
        # Two independently excited takes, hard-panned, with a few ms of timing difference.
        left = power_chord(chord_root, duration, rng, palm=palm)
        right = power_chord(chord_root, duration, rng, palm=palm)
        add(buf, left, start + q * beat + human(rng), .093, -.93)
        add(buf, right, start + q * beat + human(rng), .093, .93)
    # Picked bass follows eighths and walks into the next phrase.
    for k in range(8):
        walk = 2 if (k == 7 and bar_no % 4 == 3) else 0
        b = bass_note(root - 12 + walk, beat * .43, rng)
        add(buf, b, start + k * beat / 2 + human(rng, .002), .16, -.05)


def add_lead(buf, start, beat, root, motif, rng, style, section, bar_no):
    if section == "breakdown":
        steps = 4
    elif section == "solo":
        steps = 16
    else:
        steps = 8
    for k in range(steps):
        idx = (bar_no * (steps // 2) + k) % len(motif)
        note = root + 24 + motif[idx]
        if section == "chorus":
            note += 5 if k % 4 == 3 else 0
        if section == "solo":
            note += 12 if k in (5, 13) else 0
        length = beat * (.78 if steps == 4 else (.21 if steps == 16 else .39))
        bend = 1.0 if (k == steps - 1 and style in ("boss", "final", "heavy")) else 0.0
        sig = guitar_note(note, length, rng, lead=True, bend=bend)
        add(buf, sig, start + k * 4 * beat / steps + human(rng), .083,
            math.sin((bar_no * steps + k) * 1.3) * .34)


def add_bar(buf, start, beat, root, spec, rng, bar_no):
    loop_bar = bar_no % spec["loop"]
    section = "verse" if loop_bar < 16 else "chorus" if loop_bar < 32 else "breakdown" if loop_bar < 40 else "solo"
    add_rhythm(buf, start, beat, root, rng, spec["style"], section, bar_no)
    add_drums(buf, start, beat, rng, spec["style"], bar_no, section)
    add_lead(buf, start, beat, root, spec["motif"], rng, spec["style"], section, bar_no)
    if bar_no % 2 == 0:
        pad_notes = [root + 12, root + 19, root + (15 if section != "chorus" else 16)]
        pad = synth_pad(pad_notes, 8 * beat - .02, .7,
                        choir=spec["style"] == "final")
        add(buf, pad, start, .035 if spec["style"] != "final" else .052,
            -.15 if bar_no % 4 else .15)


def arrange_intro(buf, spec, beat, rng):
    bar = 4 * beat
    for b in range(spec["intro"]):
        start = b * bar
        root = spec["root"] + spec["prog"][b % len(spec["prog"])]
        # Build from riff-only to full kit.
        if b >= max(1, spec["intro"] // 2):
            add_drums(buf, start, beat, rng, spec["style"], b, "verse")
        else:
            for q in (2.5, 3, 3.5, 3.75):
                add(buf, snare(rng, .7), start + q * beat + human(rng), .20)
        add_rhythm(buf, start, beat, root, rng, spec["style"], "verse", b)
        if b == spec["intro"] - 1:
            add(buf, crash(rng), start + 3.75 * beat, .33)


def smooth_loop(body: np.ndarray, samples=2048):
    n = min(samples, len(body) // 8)
    w = np.sin(np.linspace(0, math.pi / 2, n, dtype=np.float32)) ** 2
    body[-n:] = body[-n:] * (1 - w[:, None]) + body[:n] * w[:, None]


def render_loop_track(key: str, spec: dict):
    beat = 60.0 / spec["bpm"]
    bar = 4 * beat
    intro_s = spec["intro"] * bar
    body_s = spec["loop"] * bar
    internal_s = intro_s + body_s * 2 + 2.2
    buf = np.zeros((int(math.ceil(internal_s * SR)), 2), np.float32)
    rng = rng_for(key)
    arrange_intro(buf, spec, beat, rng)
    for pass_no in range(2):
        base = intro_s + pass_no * body_s
        for b in range(spec["loop"]):
            root = spec["root"] + spec["prog"][(b // 2) % len(spec["prog"])]
            add_bar(buf, base + b * bar, beat, root, spec, rng, b)
    stereo_delay(buf, beat / 2, .20 if spec["style"] != "final" else .24, 3)
    schroeder_reverb(buf, .045 if spec["style"] in ("heavy", "final") else .06)
    intro_n, body_n = int(round(intro_s * SR)), int(round(body_s * SR))
    second = intro_n + body_n
    intro = buf[:intro_n].copy()
    body = buf[second : second + body_n].copy()
    # Make the one-time intro transition into the steady-state second loop pass.
    join = min(1024, len(intro), len(body))
    w = np.sin(np.linspace(0, math.pi / 2, join, dtype=np.float32)) ** 2
    body[:join] = intro[-join:] * (1 - w[:, None]) + body[:join] * w[:, None]
    smooth_loop(body)
    out = master(np.concatenate((intro, body)))
    # Compression can slightly change endpoint gain, so re-smooth and restore -1 dBFS.
    smooth_loop(out[intro_n:])
    peak = float(np.max(np.abs(out)))
    out *= PEAK_TARGET / max(peak, 1e-9)
    loop_start = intro_n / SR
    loop_end = len(out) / SR
    return out, loop_start, loop_end


def render_jingle(key: str, spec: dict):
    rng = rng_for(key)
    sec = spec["seconds"]
    beat = 60 / spec["bpm"]
    buf = np.zeros((int((sec + 1.2) * SR), 2), np.float32)
    if key == "clear":
        roots = [40, 45, 47, 52]
        melody = [40, 47, 52, 56, 59, 64]
        for i, root in enumerate(roots):
            add(buf, power_chord(root, .8, rng, palm=False), i * beat * 1.25, .12, -.7)
            add(buf, power_chord(root, .8, rng, palm=False), i * beat * 1.25 + .005, .12, .7)
            kick_t = i * beat * 1.25
            add(buf, kick(rng), kick_t, .35)
            add(buf, crash(rng), kick_t, .28)
        for i, p in enumerate(melody):
            add(buf, guitar_note(p + 12, beat * .75, rng, lead=True), i * beat * .55,
                .10, -.3 + .12 * i)
    else:
        roots = [40, 38, 36, 35]
        for i, root in enumerate(roots):
            t = i * .82
            add(buf, power_chord(root, 1.15, rng, palm=False), t, .10, -.65)
            add(buf, power_chord(root, 1.15, rng, palm=False), t + .006, .10, .65)
            add(buf, bass_note(root - 12, 1.2, rng), t, .15)
            add(buf, tom(rng, 120 - i * 15), t, .18)
        add(buf, guitar_note(47, 1.7, rng, lead=True, bend=-1), 2.45, .07)
    schroeder_reverb(buf, .09)
    out = master(buf[: int(sec * SR)])
    # Natural ring-out reaches exact zero to avoid a file-end click.
    n = int(.18 * SR)
    out[-n:] *= np.linspace(1, 0, n, dtype=np.float32)[:, None]
    return out


def find_ffmpeg():
    candidates = [os.environ.get("FFMPEG"), shutil.which("ffmpeg"),
                  str(ROOT / "tools" / "stage5_music" / "ffmpeg" / "bin" / "ffmpeg.exe")]
    for candidate in candidates:
        if candidate and Path(candidate).exists():
            return str(candidate)
    raise FileNotFoundError("ffmpeg not found; set FFMPEG or place it under tools/stage5_music/ffmpeg/bin")


def canonicalize_ogg(path: Path):
    """Replace FFmpeg's random Ogg serial and repair page CRCs for byte-stable output."""
    data = bytearray(path.read_bytes())
    serial = zlib.crc32(path.stem.encode("utf-8")) & 0xFFFFFFFF
    table = []
    for i in range(256):
        r = i << 24
        for _ in range(8):
            r = ((r << 1) ^ 0x04C11DB7) & 0xFFFFFFFF if r & 0x80000000 else (r << 1) & 0xFFFFFFFF
        table.append(r)
    pos = 0
    while pos < len(data):
        if data[pos : pos + 4] != b"OggS":
            raise ValueError(f"Invalid Ogg page at byte {pos}: {path}")
        segments = data[pos + 26]
        header = 27 + segments
        body = sum(data[pos + 27 : pos + 27 + segments])
        end = pos + header + body
        data[pos + 14 : pos + 18] = serial.to_bytes(4, "little")
        data[pos + 22 : pos + 26] = b"\0\0\0\0"
        crc = 0
        for byte in data[pos:end]:
            crc = ((crc << 8) & 0xFFFFFFFF) ^ table[((crc >> 24) & 0xFF) ^ byte]
        data[pos + 22 : pos + 26] = crc.to_bytes(4, "little")
        pos = end
    path.write_bytes(data)


def encode(wav: Path, base: Path):
    ffmpeg = find_ffmpeg()
    commands = [
        [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-fflags", "+bitexact", "-i", str(wav),
         "-map_metadata", "-1", "-flags:a", "+bitexact", "-serial_offset", "0",
         "-c:a", "libvorbis", "-q:a", "5", str(base.with_suffix(".ogg"))],
        [ffmpeg, "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
         "-map_metadata", "-1", "-c:a", "libmp3lame", "-q:a", "3", str(base.with_suffix(".mp3"))],
    ]
    for command in commands:
        subprocess.run(command, check=True)
    canonicalize_ogg(base.with_suffix(".ogg"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--track", choices=list(TRACKS) + list(JINGLES))
    args = parser.parse_args()
    ASSETS.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    loop_file = ASSETS / "loops.json"
    loops = json.loads(loop_file.read_text()) if loop_file.exists() else {}
    selected_tracks = {args.track: TRACKS[args.track]} if args.track in TRACKS else TRACKS if not args.track else {}
    selected_jingles = {args.track: JINGLES[args.track]} if args.track in JINGLES else JINGLES if not args.track else {}
    for key, spec in selected_tracks.items():
        print(f"rendering {key} ({spec['bpm']} BPM, {spec['key']})", flush=True)
        audio, loop_start, loop_end = render_loop_track(key, spec)
        wav = OUT / f"{spec['file']}.wav"
        write_wav(wav, audio)
        encode(wav, ASSETS / spec["file"])
        loops[spec["file"]] = {"bpm": spec["bpm"], "loopStart": round(loop_start, 4),
                               "loopEnd": round(loop_end, 4)}
        body = audio[int(round(loop_start * SR)) : int(round(loop_end * SR))]
        write_wav(OUT / f"loopcheck-{spec['file']}.wav", np.tile(body, (3, 1)))
    for key, spec in selected_jingles.items():
        print(f"rendering {key} ({spec['bpm']} BPM, {spec['key']})", flush=True)
        audio = render_jingle(key, spec)
        wav = OUT / f"{spec['file']}.wav"
        write_wav(wav, audio)
        encode(wav, ASSETS / spec["file"])
    loop_file.write_text(json.dumps(dict(sorted(loops.items())), indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
