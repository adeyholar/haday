#!/usr/bin/env python3
"""Waveform-align a Tanakh book (MVP: Genesis) onto Shmuelof audio.

Downloads Mechon Mamre MP3s to a cache, finds sof-pasuk rests, then places
each word on cumulative speech energy. Writes public/tanakh/align/{book}.json.
"""
from __future__ import annotations

import json
import sys
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np

ROOT = Path("/workspace")
AUDIO_META = json.loads((ROOT / "src/lib/tanakh-audio.json").read_text())
AUDIO_DIR = ROOT / "public/audio/tanakh"
CACHE = Path("/tmp/tanakh-mp3")
ALIGN_DIR = ROOT / "public/tanakh/align"
MAP = json.loads((ROOT / "src/lib/tanakh-audio-map.json").read_text())["files"]

MECHON = {
    "Gen": "01", "Exod": "02", "Lev": "03", "Num": "04", "Deut": "05",
    "Josh": "06", "Judg": "07", "1Sam": "08a", "2Sam": "08b",
    "1Kgs": "09a", "2Kgs": "09b", "Isa": "10", "Jer": "11", "Ezek": "12",
    "Hos": "13", "Joel": "14", "Amos": "15", "Obad": "16", "Jonah": "17",
    "Mic": "18", "Nah": "19", "Hab": "20", "Zeph": "21", "Hag": "22",
    "Zech": "23", "Mal": "24", "1Chr": "25a", "2Chr": "25b", "Ps": "26",
    "Job": "27", "Prov": "28", "Ruth": "29", "Song": "30", "Eccl": "31",
    "Lam": "32", "Esth": "33", "Dan": "34", "Ezra": "35a", "Neh": "35b",
}

SR = 16000
HOP = 160
N_FFT = 512
DT = HOP / SR

CONS = set(chr(c) for c in range(0x05D0, 0x05EB))
SHEVA = "\u05B0"
HATEF = set("\u05B1\u05B2\u05B3")
SHORT = set("\u05B4\u05B6\u05B7\u05BB\u05C7")
LONG = set("\u05B5\u05B8\u05B9\u05BA")
DAGESH = "\u05BC"
METEG = "\u05BD"
MATRES = set("אהוי")
VOWELS = {SHEVA, *HATEF, *SHORT, *LONG}


def clusters(word: str) -> list[tuple[str, float]]:
    chars = list(word)
    raw = []
    i = 0
    while i < len(chars):
        ch = chars[i]
        if ch not in CONS:
            i += 1
            continue
        i += 1
        marks: list[str] = []
        while i < len(chars) and chars[i] not in CONS:
            marks.append(chars[i])
            i += 1
        raw.append((ch, "".join(marks), [m for m in marks if m in VOWELS], DAGESH in marks))
    out: list[tuple[str, float]] = []
    for n, (cons, marks, vowels, dagesh) in enumerate(raw):
        shureq = cons == "ו" and dagesh and not vowels
        holem_vav = cons == "ו" and any(v in LONG for v in vowels) and len(vowels) == 1
        if not vowels and not shureq:
            if out:
                g, w = out[-1]
                out[-1] = (g + cons + marks, w + (0.08 if cons in MATRES else 0.28))
            else:
                out.append((cons + marks, 0.34))
            continue
        w = 0.34
        if shureq:
            w = 1.18
        elif holem_vav:
            w = 1.28
        else:
            v = vowels[0]
            if v == SHEVA:
                prev_short = n > 0 and any(x in SHORT or x == SHEVA for x in raw[n - 1][2])
                w += 0.0 if prev_short and n > 0 else 0.42
            elif v in HATEF:
                w += 0.52
            elif v in SHORT:
                w += 0.88
            elif v in LONG:
                w += 1.22 + (0.12 if METEG in marks else 0)
        if dagesh and not shureq:
            w += 0.08 if cons in MATRES else 0.22
        out.append((cons + marks, max(0.12, w)))
    return out or [(word, 1.0)]


def phone_weight(word: str) -> float:
    return float(sum(w for _, w in clusters(word)) or 1.0)


def decode(path: Path) -> np.ndarray:
    raw = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        stderr=subprocess.DEVNULL,
    )
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def features(samples: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    window = np.hanning(N_FFT).astype(np.float32)
    n = max(1, 1 + (len(samples) - N_FFT) // HOP)
    energy = np.empty(n, dtype=np.float32)
    mag_prev = None
    flux = np.zeros(n, dtype=np.float32)
    for i in range(n):
        frame = samples[i * HOP : i * HOP + N_FFT]
        if len(frame) < N_FFT:
            frame = np.pad(frame, (0, N_FFT - len(frame)))
        energy[i] = float(np.sqrt(np.mean(frame * frame) + 1e-12))
        spec = np.abs(np.fft.rfft(frame * window))
        if mag_prev is not None:
            flux[i] = float(np.maximum(spec - mag_prev, 0.0).sum())
        mag_prev = spec
    if n >= 5:
        kernel = np.ones(5, dtype=np.float32) / 5
        energy = np.convolve(energy, kernel, mode="same")
        flux = np.convolve(flux, np.array([0.15, 0.2, 0.3, 0.2, 0.15], dtype=np.float32), mode="same")
    e_p = float(np.percentile(energy, 90) or 1e-6)
    f_p = float(np.percentile(flux, 90) or 1e-6)
    energy = np.clip(energy / e_p, 0, 2.5)
    flux = np.clip(flux / f_p, 0, 3.0)
    return energy, flux


def snap_onset(energy: np.ndarray, flux: np.ndarray, t: float, floor: float, ceil: float) -> float:
    lo = max(0, int(floor / DT))
    hi = min(len(energy) - 1, int(ceil / DT))
    i = int(np.clip(t / DT, lo, hi))
    peak = float(energy[i] + 0.5 * flux[i])
    thr = max(0.08, peak * 0.18)
    hit = i
    for j in range(i, max(lo, i - 10) - 1, -1):  # at most 100ms back
        if energy[j] + 0.3 * flux[j] < thr:
            hit = min(hi, j + 1)
            break
        hit = j
    return max(floor, min(ceil, hit * DT))


def energy_starts(weights: list[float], energy: np.ndarray, flux: np.ndarray, t0: float) -> list[float]:
    """Word/phone starts from cumulative voiced energy. Silence does not eat duration."""
    n = len(weights)
    T = len(energy)
    if n == 0:
        return []
    if n == 1 or T <= 1:
        # first voiced frame
        voiced = np.flatnonzero((energy + 0.2 * flux) > 0.14)
        t = t0 + (int(voiced[0]) * DT if len(voiced) else 0.0)
        return [round(t, 3)]

    w = np.asarray(weights, dtype=np.float64)
    w = np.maximum(w, 0.08)
    w = w / w.sum()
    score = np.clip(energy + 0.4 * flux, 0, None)
    score[score < 0.10] = 0.0
    if float(score.sum()) <= 1e-6:
        step = (T * DT) / n
        return [round(t0 + i * step, 3) for i in range(n)]

    cum = np.cumsum(score)
    total = float(cum[-1])
    voiced = np.flatnonzero(score > 0)
    first = int(voiced[0])
    last = int(voiced[-1])
    starts_idx = [first]
    for i in range(1, n):
        tgt = float(w[:i].sum()) * total
        idx = int(np.searchsorted(cum, tgt))
        prev_w = float(w[i - 1])
        min_step = 12 if prev_w >= 0.9 else 8  # 120ms full syllable, 80ms clitic
        idx = int(np.clip(idx, starts_idx[-1] + min_step, last))
        # pull back at most 80ms to the rise of this energy step
        peak = float(score[idx])
        thr = max(0.08, peak * 0.18)
        hit = idx
        for j in range(idx, max(starts_idx[-1] + 6, idx - 8) - 1, -1):
            if score[j] < thr:
                hit = j + 1
                break
            hit = j
        starts_idx.append(int(hit))
    return [round(t0 + i * DT, 3) for i in starts_idx]


def spread_times(weights: list[float], t0: float, t1: float) -> list[float]:
    w = np.maximum(np.asarray(weights, dtype=np.float64), 0.08)
    w = w / w.sum()
    span = max(0.2, t1 - t0)
    t = t0
    out = []
    for wi in w:
        out.append(round(float(t), 3))
        t += span * float(wi)
    return out


def align_items(items: list[float], energy: np.ndarray, flux: np.ndarray, t0: float, t1: float) -> list[float]:
    i0 = max(0, int(t0 / DT))
    i1 = min(len(energy), max(i0 + 8, int(t1 / DT)))
    return energy_starts(items, energy[i0:i1], flux[i0:i1], i0 * DT)


def mechon_file(book: str, chapter: int) -> str:
    prefix = MECHON[book]
    if book == "Ps":
        if chapter < 100:
            code = f"{chapter:02d}"
        else:
            tens, ones = divmod(chapter, 10)
            code = f"{chr(ord('a') + tens - 10)}{ones}"
        return f"t26{code}.mp3"
    return f"t{prefix}{chapter:02d}.mp3"


def public_src(book: str, chapter: int) -> str:
    if book == "Gen" and 1 <= chapter <= 5:
        return f"/audio/tanakh/01-Gen_{chapter:02d}.mp3"
    return f"https://mechon-mamre.org/mp3/{mechon_file(book, chapter)}"


def audio_path(book: str, chapter: int) -> Path:
    mapped = (MAP.get(book) or {}).get(str(chapter))
    if mapped:
        local = AUDIO_DIR / mapped
        if local.exists():
            return local
    CACHE.mkdir(parents=True, exist_ok=True)
    name = mapped or mechon_file(book, chapter)
    cache = CACHE / name
    if cache.exists() and cache.stat().st_size > 20_000:
        return cache
    url = f"https://mechon-mamre.org/mp3/{mechon_file(book, chapter)}"
    req = urllib.request.Request(url, headers={"User-Agent": "HaDayHebracicAlign/1.0"})
    print(f"  download {book} {chapter} {url}")
    with urllib.request.urlopen(req, timeout=90) as res, cache.open("wb") as fh:
        fh.write(res.read())
    return cache


def silences(energy: np.ndarray, min_dur: float = 0.28) -> list[tuple[float, float, float]]:
    speech = energy > 0.12
    segs: list[tuple[float, float, float]] = []
    on = False
    st = 0
    for i, quiet in enumerate(~speech):
        if quiet and not on:
            on = True
            st = i
        elif not quiet and on:
            d = (i - st) * DT
            if d >= min_dur:
                segs.append((st * DT, i * DT, d))
            on = False
    if on:
        d = (len(energy) - st) * DT
        if d >= min_dur:
            segs.append((st * DT, len(energy) * DT, d))
    return segs


def detect_verse_starts(energy: np.ndarray, weights: list[float], duration: float) -> list[float]:
    n = len(weights)
    sils = silences(energy, 0.28)
    voiced = np.flatnonzero(energy > 0.16)
    t0 = float(voiced[0]) * DT if len(voiced) else 2.0
    # Spoken heading, then a rest, then verse 1.
    for a, b, d in sils:
        if d >= 0.9 and t0 - 0.15 <= a <= t0 + 20 and b >= t0 + 0.8:
            t0 = b
            break
    if t0 < 1.5:
        later = [b for a, b, d in sils if d >= 0.55 and 1.5 <= b <= 22]
        t0 = later[0] if later else max(t0, 2.0)
    if n <= 1:
        return [round(t0, 3)]
    w = np.maximum(np.asarray(weights, dtype=np.float64), 0.08)
    w = w / w.sum()
    body = max(1.0, duration - t0 - 0.25)
    expected_end = t0 + np.cumsum(w) * body
    starts = [round(t0, 3)]
    for i in range(n - 1):
        target = float(expected_end[i])
        prev = starts[-1]
        lo = prev + 0.55
        hi = min(duration - 0.35, float(expected_end[min(i + 1, n - 1)]) + 0.4)
        cands = [(a, b, d) for a, b, d in sils if lo <= b <= hi]
        if not cands:
            starts.append(round(max(lo, min(hi, target)), 3))
            continue
        best = min(cands, key=lambda s: abs(s[1] - target) - 0.18 * s[2])
        starts.append(round(best[1], 3))
    return starts


def align_chapter(
    book: str,
    ch: str,
    verses: list[dict],
    samples: np.ndarray,
    energy: np.ndarray,
    flux: np.ndarray,
    gold: list[float] | None,
) -> dict:
    duration = round(len(samples) / SR, 2)
    weights = [sum(phone_weight(w) for w in row["words"]) or 1.0 for row in verses]
    if gold and len(gold) == len(verses):
        starts = [float(x) for x in gold]
    else:
        starts = detect_verse_starts(energy, weights, duration)
        if len(starts) != len(verses):
            starts = starts[: len(verses)]
            while len(starts) < len(verses):
                starts.append(round(starts[-1] + (duration - starts[-1]) / (len(verses) - len(starts) + 1), 3))
    word_times: list[list[float]] = []
    phone_times: list[list[list[float]]] = []
    for i, row in enumerate(verses):
        t0 = starts[i]
        t1 = starts[i + 1] if i + 1 < len(starts) else duration
        words: list[str] = row["words"]
        wts = [phone_weight(w) for w in words]
        wstarts = align_items(wts, energy, flux, t0, t1)
        if wstarts and len(wstarts) >= 4:
            span = (wstarts[-1] - wstarts[0]) / max(1, len(wstarts) - 1)
            if span < 0.085 and (t1 - t0) / len(wstarts) >= 0.10:
                wstarts = spread_times(wts, t0, t1 - 0.05)
        word_times.append(wstarts)
        verse_phones: list[list[float]] = []
        for j, word in enumerate(words):
            parts = clusters(word)
            w0 = wstarts[j]
            w1 = wstarts[j + 1] if j + 1 < len(wstarts) else t1
            if len(parts) <= 1:
                verse_phones.append([w0])
            else:
                verse_phones.append(align_items([p[1] for p in parts], energy, flux, w0, w1))
        phone_times.append(verse_phones)
    return {
        "src": public_src(book, int(ch)),
        "duration": duration,
        "verses": [round(x, 2) for x in starts],
        "words": word_times,
        "phones": phone_times,
        "aligned": True,
    }


def main() -> None:
    book = sys.argv[1] if len(sys.argv) > 1 else "Gen"
    dump = json.loads((ROOT / f"public/tanakh/books/{book}.json").read_text())
    chapters = sorted(dump["chapters"], key=lambda x: int(x))
    ALIGN_DIR.mkdir(parents=True, exist_ok=True)
    out_path = ALIGN_DIR / f"{book}.json"
    out: dict = {}
    if out_path.exists():
        try:
            out = json.loads(out_path.read_text())
        except json.JSONDecodeError:
            out = {}

    def fetch(ch: str) -> tuple[str, Path]:
        return ch, audio_path(book, int(ch))

    need = [
        ch
        for ch in chapters
        if not (out.get(ch) or {}).get("aligned") or len((out.get(ch) or {}).get("verses") or []) != len(dump["chapters"][ch])
    ]
    print(f"{book}: {len(chapters)} chapters, {len(need)} to align")
    paths: dict[str, Path] = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        futs = [pool.submit(fetch, ch) for ch in (need or chapters[:1])]
        for fut in as_completed(futs):
            ch, path = fut.result()
            paths[ch] = path
            print(f"  ready {book} {ch} {path.stat().st_size}")

    for ch in chapters:
        rows = dump["chapters"][ch]
        if ch not in need and out.get(ch):
            continue
        path = paths.get(ch) or audio_path(book, int(ch))
        samples = decode(path)
        energy, flux = features(samples)
        gold = AUDIO_META[ch]["verses"] if book == "Gen" and ch in AUDIO_META else None
        meta = align_chapter(book, ch, rows, samples, energy, flux, gold)
        out[ch] = meta
        print(f"aligned {book} {ch} v{len(meta['verses'])} start={meta['verses'][0]} dur={meta['duration']}")
        out_path.write_text(json.dumps(out, separators=(",", ":")))

    if book == "Gen":
        slim = {k: out[k] for k in ["1", "2", "3", "4", "5"] if k in out}
        (ROOT / "src/lib/tanakh-audio.json").write_text(json.dumps(slim, separators=(",", ":")))
        print("updated src/lib/tanakh-audio.json for Genesis 1–5 tests")
    print("wrote", out_path, "bytes", out_path.stat().st_size, "chapters", len(out))


if __name__ == "__main__":
    main()
