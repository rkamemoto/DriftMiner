"""Deterministic rock-oriented offline synthesizer for Drift Miner Stage 5."""
from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np

SR = 44_100
PEAK_TARGET = 10 ** (-1 / 20)  # -1 dBFS


def midi(n: float) -> float:
    return 440.0 * 2.0 ** ((n - 69.0) / 12.0)


def pan_gains(pan: float) -> tuple[float, float]:
    x = (max(-1.0, min(1.0, pan)) + 1.0) * math.pi / 4.0
    return math.cos(x), math.sin(x)


def add(buf: np.ndarray, signal: np.ndarray, start: float, gain=1.0, pan=0.0) -> None:
    pos = int(round(start * SR))
    if pos >= len(buf) or pos + len(signal) <= 0:
        return
    cut0 = max(0, -pos)
    pos = max(0, pos)
    sig = signal[cut0 : cut0 + len(buf) - pos]
    if not len(sig):
        return
    if sig.ndim == 1:
        gl, gr = pan_gains(pan)
        buf[pos : pos + len(sig), 0] += sig * (gain * gl)
        buf[pos : pos + len(sig), 1] += sig * (gain * gr)
    else:
        buf[pos : pos + len(sig)] += sig * gain


def fade_envelope(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n, np.float32)
    a = min(n, max(1, int(attack * SR)))
    r = min(n, max(1, int(release * SR)))
    e[:a] *= np.sin(np.linspace(0, math.pi / 2, a, dtype=np.float32)) ** 2
    e[-r:] *= np.cos(np.linspace(0, math.pi / 2, r, dtype=np.float32)) ** 2
    return e


def karplus_strong(freq: float, duration: float, rng: np.random.Generator,
                   decay=0.996, brightness=0.52) -> np.ndarray:
    """Blockwise Karplus-Strong string: a noise delay line repeatedly averaged."""
    n = max(2, int(duration * SR))
    period = max(2, int(round(SR / freq)))
    ring = rng.uniform(-1, 1, period).astype(np.float32)
    ring = ring * brightness + np.roll(ring, 1) * (1 - brightness)
    out = np.empty(n, np.float32)
    pos = 0
    block = ring
    while pos < n:
        take = min(period, n - pos)
        out[pos : pos + take] = block[:take]
        block = (0.5 * (block + np.roll(block, 1)) * decay).astype(np.float32)
        pos += take
    out *= fade_envelope(n, 0.002, min(0.08, duration * 0.3))
    return out


def biquad_coeff(kind: str, freq: float, q=0.707, gain_db=0.0):
    """RBJ audio-EQ-cookbook coefficients, normalized so a0 == 1."""
    w0 = 2 * math.pi * freq / SR
    c, s = math.cos(w0), math.sin(w0)
    alpha = s / (2 * q)
    if kind == "lowpass":
        b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
        a0, a1, a2 = 1 + alpha, -2 * c, 1 - alpha
    elif kind == "highpass":
        b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
        a0, a1, a2 = 1 + alpha, -2 * c, 1 - alpha
    elif kind == "peak":
        A = 10 ** (gain_db / 40)
        b0, b1, b2 = 1 + alpha * A, -2 * c, 1 - alpha * A
        a0, a1, a2 = 1 + alpha / A, -2 * c, 1 - alpha / A
    else:
        raise ValueError(kind)
    return np.array([b0, b1, b2, a1, a2], np.float64) / a0


def biquad(x: np.ndarray, coeff) -> np.ndarray:
    b0, b1, b2, a1, a2 = coeff
    y = np.empty_like(x, dtype=np.float32)
    x1 = x2 = y1 = y2 = 0.0
    for i, sample in enumerate(x):
        v = b0 * sample + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        y[i] = v
        x2, x1, y2, y1 = x1, sample, y1, v
    return y


def cabinet(x: np.ndarray) -> np.ndarray:
    """Fast FIR cabinet approximation; RBJ biquads above remain available for offline EQ."""
    if len(x) < 8:
        return x.astype(np.float32)
    # DC/rumble removal near 90 Hz.
    rumble = np.convolve(x, np.ones(97, np.float32) / 97, mode="same")
    hp = x - rumble
    # Speaker-cone rolloff near 5 kHz and a broad upper-mid presence bump.
    lp = np.convolve(hp, np.hanning(13).astype(np.float32) / np.hanning(13).sum(), mode="same")
    mid_smooth = np.convolve(lp, np.ones(31, np.float32) / 31, mode="same")
    low_mid = np.convolve(lp, np.ones(111, np.float32) / 111, mode="same")
    return (lp + 0.28 * (lp - mid_smooth) - 0.12 * low_mid).astype(np.float32)


def guitar_note(note: float, duration: float, rng: np.random.Generator,
                lead=False, palm=False, bend=0.0) -> np.ndarray:
    ring = karplus_strong(midi(note), duration, rng,
                          decay=0.988 if palm else 0.9972,
                          brightness=0.38 if palm else 0.62)
    pregain = 11.0 if palm else (22.0 if lead else 15.0)
    shaped = np.tanh(ring * pregain + 0.08 * (ring * pregain) ** 2)
    shaped = cabinet(shaped)
    if lead and len(shaped) > 100:
        t = np.arange(len(shaped), dtype=np.float32) / SR
        vib_depth = (2 ** (28 / 1200) - 1) * (1 - np.exp(-t * 5.0))
        ratio = 1 + vib_depth * np.sin(2 * math.pi * 5.4 * t)
        if bend:
            ratio *= 2 ** ((bend * np.minimum(1, t / 0.16)) / 12)
        src = np.minimum(len(shaped) - 1.001, np.cumsum(ratio) - ratio[0])
        shaped = np.interp(src, np.arange(len(shaped)), shaped).astype(np.float32)
    return shaped * fade_envelope(len(shaped), 0.002, 0.06 if palm else 0.14)


def power_chord(root: float, duration: float, rng: np.random.Generator,
                palm=True) -> np.ndarray:
    n = int(duration * SR)
    out = np.zeros(n, np.float32)
    for semis, delay, level in ((0, 0.0, 1.0), (7, 0.007, 0.78), (12, 0.013, 0.55)):
        s = guitar_note(root + semis, max(0.05, duration - delay), rng, palm=palm)
        i = int(delay * SR)
        out[i : min(n, i + len(s))] += s[: n - i] * level
    return np.tanh(out * 0.82).astype(np.float32)


def bass_note(note: float, duration: float, rng: np.random.Generator) -> np.ndarray:
    f = midi(note)
    n = int(duration * SR)
    t = np.arange(n, dtype=np.float32) / SR
    pluck = karplus_strong(f, duration, rng, decay=0.996, brightness=0.34)
    saw = 2 * ((f * t) % 1) - 1
    sub = np.sin(2 * math.pi * f * t)
    x = 0.38 * pluck + 0.25 * saw + 0.46 * sub
    x = np.tanh(x * 2.1)
    kernel = np.hanning(17).astype(np.float32)
    kernel /= kernel.sum()
    x = np.convolve(x, kernel, mode="same")
    return x * fade_envelope(n, 0.004, min(0.11, duration * 0.3))


def kick(rng: np.random.Generator, velocity=1.0) -> np.ndarray:
    dur = 0.34
    t = np.arange(int(dur * SR), dtype=np.float32) / SR
    phase = 2 * math.pi * (45 * t + (150 - 45) * (1 - np.exp(-t * 26)) / 26)
    body = np.sin(phase) * np.exp(-t * 13)
    click = rng.normal(0, 1, len(t)).astype(np.float32) * np.exp(-t * 95) * 0.16
    return (body + click) * (0.85 * velocity)


def snare(rng: np.random.Generator, velocity=1.0) -> np.ndarray:
    dur = 0.32
    t = np.arange(int(dur * SR), dtype=np.float32) / SR
    noise = rng.normal(0, 1, len(t)).astype(np.float32)
    noise -= np.convolve(noise, np.ones(25, np.float32) / 25, mode="same")
    body = np.sin(2 * math.pi * 195 * t) * np.exp(-t * 18)
    return (noise * np.exp(-t * 15) * 0.38 + body * 0.62) * velocity


def hat(rng: np.random.Generator, velocity=1.0, open_hat=False) -> np.ndarray:
    dur = 0.24 if open_hat else 0.065
    t = np.arange(int(dur * SR), dtype=np.float32) / SR
    x = rng.normal(0, 1, len(t)).astype(np.float32)
    x -= np.convolve(x, np.ones(7, np.float32) / 7, mode="same")
    return x * np.exp(-t * (15 if open_hat else 60)) * (0.24 * velocity)


def crash(rng: np.random.Generator, velocity=1.0) -> np.ndarray:
    dur = 1.8
    t = np.arange(int(dur * SR), dtype=np.float32) / SR
    x = rng.normal(0, 1, len(t)).astype(np.float32)
    x -= np.convolve(x, np.ones(11, np.float32) / 11, mode="same")
    shimmer = 0.55 + 0.45 * np.sin(2 * math.pi * 8.7 * t) ** 2
    return x * np.exp(-t * 2.2) * shimmer * (0.22 * velocity)


def tom(rng: np.random.Generator, freq=120.0, velocity=1.0) -> np.ndarray:
    dur = 0.36
    t = np.arange(int(dur * SR), dtype=np.float32) / SR
    phase = 2 * math.pi * (freq * t + 34 * (1 - np.exp(-t * 16)) / 16)
    return np.sin(phase) * np.exp(-t * 10) * (0.55 * velocity)


def synth_pad(notes, duration: float, gain=1.0, choir=False) -> np.ndarray:
    n = int(duration * SR)
    t = np.arange(n, dtype=np.float32) / SR
    out = np.zeros(n, np.float32)
    for j, note in enumerate(notes):
        f = midi(note)
        for det in (-0.0035, 0.0035):
            out += np.sin(2 * math.pi * f * (1 + det) * t + j * 0.7) * (0.12 if choir else 0.1)
        if choir:
            out += 0.05 * np.sin(2 * math.pi * f * 2.02 * t)
    out *= fade_envelope(n, min(0.35, duration * 0.2), min(0.5, duration * 0.25))
    if choir:
        formant_a = out - np.convolve(out, np.ones(21, np.float32) / 21, mode="same")
        formant_b = out - np.convolve(out, np.ones(9, np.float32) / 9, mode="same")
        out = out + .30 * formant_a + .16 * formant_b
    return out * gain


def stereo_delay(buf: np.ndarray, seconds: float, feedback=0.22, taps=3) -> None:
    dry = buf.copy()
    d = int(seconds * SR)
    for tap_no in range(1, taps + 1):
        shift = d * tap_no
        if shift >= len(buf):
            break
        amount = feedback ** tap_no
        buf[shift:, 0] += dry[:-shift, tap_no % 2] * amount
        buf[shift:, 1] += dry[:-shift, 1 - (tap_no % 2)] * amount


def schroeder_reverb(buf: np.ndarray, wet=0.08) -> None:
    dry = buf.copy()
    result = np.zeros_like(buf)
    for delay_s, fb in ((0.0297, 0.58), (0.0371, 0.52), (0.0411, 0.49), (0.0437, 0.46)):
        d = int(delay_s * SR)
        line = dry.copy()
        for tap_no in range(1, 7):
            shift = d * tap_no
            if shift >= len(buf):
                break
            result[shift:] += line[:-shift] * (fb ** tap_no)
    buf += result * wet


def master(buf: np.ndarray) -> np.ndarray:
    buf = buf.astype(np.float64, copy=False)
    buf -= np.mean(buf, axis=0, keepdims=True)
    # Gentle block RMS compression; attack/release are implicit in 50% overlap.
    block, hop = 4096, 2048
    gain = np.ones(len(buf), np.float64)
    weight = np.zeros(len(buf), np.float64)
    window = np.hanning(block)
    threshold = 10 ** (-17 / 20)
    for pos in range(0, max(1, len(buf) - block + 1), hop):
        part = buf[pos : pos + block]
        rms = math.sqrt(float(np.mean(part * part)) + 1e-12)
        g = 1.0 if rms <= threshold else (threshold / rms) ** 0.24
        gain[pos : pos + block] += window * g
        weight[pos : pos + block] += window
    gain /= np.maximum(1.0, weight + 1.0)
    buf *= gain[:, None]
    buf = np.tanh(buf * 1.08)
    peak = float(np.max(np.abs(buf)))
    if peak:
        buf *= PEAK_TARGET / peak
    return buf.astype(np.float32)


def write_wav(path: Path, buf: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = np.int16(np.clip(buf, -1, 1) * 32767)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
