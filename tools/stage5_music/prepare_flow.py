"""Turn the Google Flow Music WAV masters into game-ready Stage 5 music.

    python tools/stage5_music/prepare_flow.py

Reads   stage5/assets/music/<track>.wav   (Flow Music downloads)
Writes  stage5/assets/music/flow/<track>.ogg + .mp3 and flow/loops.json

For each looping track it finds the best loop: two points (start in the first
~30 s, end in the last ~45 s) where the music matches, measured on log-band
spectra over a 6 s window, then aligned to the sample by waveform correlation.
The file is cut at loopEnd and the last 40 ms are crossfaded into the audio just
before loopStart, so jumping loopEnd -> loopStart is click-free.

The two jingles came back from Flow as full songs, so they are cut down:
jingle-clear keeps its opening fanfare, jingle-gameover keeps its ring-out ending.
Needs Python 3 + NumPy, and FFmpeg on PATH (or FFMPEG=path/to/ffmpeg).
"""
import json
import os
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "stage5" / "assets" / "music"
DST = SRC / "flow"
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")

LOOPS = ["bgm-title", "bgm-5-1", "bgm-5-2", "bgm-5-3", "bgm-5-4", "bgm-5-5", "bgm-boss", "bgm-boss-final"]
# jingle cuts: (start, end) in seconds; negative = from the end of the file
JINGLES = {
    "jingle-clear": {"start": 0.0, "end": 5.5, "fade_in": 0.0, "fade_out": 1.2},
    "jingle-gameover": {"start": -6.5, "end": None, "fade_in": 0.15, "fade_out": 0.0},
}
HOP, NF = 512, 2048
XFADE = 0.04


def load(path):
    with wave.open(str(path)) as w:
        sr, n, ch, width = w.getframerate(), w.getnframes(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(n)
    if width != 2:
        raise SystemExit(f"{path.name}: expected 16-bit PCM, got {8 * width}-bit")
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32).reshape(-1, ch) / 32768, sr


def save_wav(path, x, sr):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())


def band_features(mono, sr):
    frames = (len(mono) - NF) // HOP
    idx = np.arange(NF)[None, :] + HOP * np.arange(frames)[:, None]
    spec = np.abs(np.fft.rfft(mono[idx] * np.hanning(NF), axis=1))
    freqs = np.fft.rfftfreq(NF, 1 / sr)
    edges = np.geomspace(40, 16000, 49)
    bands = np.stack([spec[:, (freqs >= edges[i]) & (freqs < edges[i + 1])].sum(1) for i in range(48)], 1)
    logb = np.log1p(bands * 10)
    flux = np.concatenate([[0], np.maximum(0, np.diff(logb, axis=0)).sum(1)])
    return logb, flux


def estimate_bpm(flux, sr, lo=120, hi=210):
    f = flux - flux.mean(); fps = sr / HOP
    ac = np.correlate(f, f, "full")[len(f) - 1:]
    lags = np.arange(len(ac))
    scores = [(sum(np.interp(60 / b * fps * k, lags, ac) for k in (1, 2, 4, 8)), b) for b in np.arange(lo, hi, 0.25)]
    return float(max(scores)[1])


def find_loop(x, sr, min_len=40.0):
    mono = x.mean(1)
    logb, flux = band_features(mono, sr)
    dec = 4  # search on ~23 fps frames, then refine to the sample
    coarse = logb[:len(logb) // dec * dec].reshape(-1, dec, logb.shape[1]).mean(1)
    unit = coarse / (np.linalg.norm(coarse, axis=1, keepdims=True) + 1e-9)
    cf = sr / HOP / dec; win = int(3 * cf); dur = len(x) / sr
    s0, s1 = max(win, int(1.0 * cf)), int(min(30, dur / 3) * cf)
    e0, e1 = int((dur - 45) * cf), min(int((dur - 3.5) * cf), len(unit) - win)
    sim = unit[np.arange(s0 - win, s1 + win)] @ unit[np.arange(e0 - win, e1 + win)].T
    score = np.zeros((s1 - s0, e1 - e0))
    for k in range(2 * win):  # mean similarity along each diagonal = how well the 6 s around s matches the 6 s around e
        score += sim[k:k + s1 - s0, k:k + e1 - e0]
    score /= 2 * win
    S, E = np.meshgrid(np.arange(s0, s1), np.arange(e0, e1), indexing="ij")
    score[(E - S) / cf < min_len] = -1
    i, j = np.unravel_index(np.argmax(score), score.shape)
    start = (s0 + i) * dec * HOP; end0 = (e0 + j) * dec * HOP
    ref = mono[start:start + int(0.3 * sr)]; reach = int(0.06 * sr)
    best = max(range(-reach, reach + 1, 2),
               key=lambda d: np.dot(ref, mono[end0 + d:end0 + d + len(ref)]) / (np.linalg.norm(mono[end0 + d:end0 + d + len(ref)]) + 1e-9))
    return start, end0 + best, float(score[i, j]), estimate_bpm(flux, sr)


def bake_loop(x, sr, start, end):
    y = x[:end].copy(); n = int(XFADE * sr)
    t = np.linspace(0, np.pi / 2, n)[:, None]
    y[end - n:end] = x[end - n:end] * np.cos(t) + x[start - n:start] * np.sin(t)
    return y


def encode(wav_path, name):
    for ext, args in (("ogg", ["-c:a", "libvorbis", "-q:a", "4"]), ("mp3", ["-c:a", "libmp3lame", "-q:a", "4"])):
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", str(wav_path), *args, str(DST / f"{name}.{ext}")], check=True)


def main():
    DST.mkdir(parents=True, exist_ok=True)
    loops = {}
    with tempfile.TemporaryDirectory() as tmp:
        for name in LOOPS:
            x, sr = load(SRC / f"{name}.wav")
            start, end, score, bpm = find_loop(x, sr)
            y = bake_loop(x, sr, start, end)
            wav = Path(tmp) / f"{name}.wav"; save_wav(wav, y, sr); encode(wav, name)
            loops[name] = {"bpm": round(bpm, 2), "loopStart": round(start / sr, 4), "loopEnd": round(end / sr, 4)}
            print(f"{name:15s} {bpm:6.2f} BPM  loop {start / sr:7.3f}-{end / sr:7.3f} s"
                  f"  ({(end - start) / sr:5.1f} s, {(end - start) / sr * bpm / 240:5.1f} bars, match {score:.3f})")
        for name, cut in JINGLES.items():
            x, sr = load(SRC / f"{name}.wav")
            a = int((cut["start"] if cut["start"] >= 0 else len(x) / sr + cut["start"]) * sr)
            b = len(x) if cut["end"] is None else int(cut["end"] * sr)
            y = x[a:b].copy()
            if cut["fade_in"]: n = int(cut["fade_in"] * sr); y[:n] *= np.linspace(0, 1, n)[:, None]
            if cut["fade_out"]: n = int(cut["fade_out"] * sr); y[-n:] *= np.linspace(1, 0, n)[:, None] ** 2
            wav = Path(tmp) / f"{name}.wav"; save_wav(wav, y, sr); encode(wav, name)
            print(f"{name:15s} cut {a / sr:.2f}-{b / sr:.2f} s ({len(y) / sr:.1f} s)")
    (DST / "loops.json").write_text(json.dumps(loops, indent=2) + "\n")


if __name__ == "__main__":
    main()
