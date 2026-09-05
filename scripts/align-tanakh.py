#!/usr/bin/env python3
"""Forced-align Tanakh audio the way Murillo's MFA demo does.

Montreal Forced Aligner is Kaldi HMM/GMM: a Hebrew→English-phone lexicon,
optional silence between words, יהוה spoken as אֲדֹנָי, then Viterbi on the
recording. We cannot ship Kaldi here, so this script keeps that same search:

  • G2P from niqqud (Biblehub-style English phones, duration priors)
  • יהוה → Adonay for timing only
  • optional SIL, longer after etnachta / zaqef / sof pasuq (te'amim)
  • verse DP that will not crush a long verse into a mid-verse rest
  • HSMM Viterbi (speech vs silence + onset flux) inside each verse

Audio is Abraham Shmuelof / Talking Bibles via Mechon Mamre — same reader
as https://murillocjr.github.io/tanakh-read-along-site/forced-alignment/montreal-forced-aligner
"""
from __future__ import annotations

import json
import math
import os
import sys
import subprocess
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.lib.stride_tricks import sliding_window_view

ROOT = Path(os.environ.get("HADAY_ROOT", Path(__file__).resolve().parents[1]))
AUDIO_DIR = ROOT / "public/audio/tanakh"
CACHE = Path("/tmp/tanakh-mp3")
ALIGN_DIR = ROOT / "public/tanakh/align"
MAP = json.loads((ROOT / "src/lib/tanakh-audio-map.json").read_text())["files"]
ENGINE = "mfa-hsmm-v3"

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
HATEF_SEGOL = "\u05B1"
HATEF_PATAH = "\u05B2"
HATEF_QAMETS = "\u05B3"
HIRIQ = "\u05B4"
TSERE = "\u05B5"
SEGOL = "\u05B6"
PATAH = "\u05B7"
QAMETS = "\u05B8"
HOLAM = "\u05B9"
HOLAM_HASER = "\u05BA"
QUBUTS = "\u05BB"
DAGESH = "\u05BC"
METEG = "\u05BD"
QAMETS_QATAN = "\u05C7"
SHIN_DOT = "\u05C1"
SIN_DOT = "\u05C2"
MAQEF = "\u05BE"
SOF_PASUQ = "\u05C3"
MATRES = set("אהוי")
VOWELS = {
    SHEVA, HATEF_SEGOL, HATEF_PATAH, HATEF_QAMETS, HIRIQ, TSERE, SEGOL,
    PATAH, QAMETS, HOLAM, HOLAM_HASER, QUBUTS, QAMETS_QATAN,
}
HATEF = {HATEF_SEGOL, HATEF_PATAH, HATEF_QAMETS}
SHORT = {HIRIQ, SEGOL, PATAH, QUBUTS, QAMETS_QATAN}
LONG = {TSERE, QAMETS, HOLAM, HOLAM_HASER}

# Te'amim that mark a real rest in Shmuelof's reading.
ETNACHTA = "\u0591"
SEGOLTA = "\u0592"
SHALSHELET = "\u0593"
ZAQEF_QATAN = "\u0594"
ZAQEF_GADOL = "\u0595"
REVIA = "\u0597"
PAZER = "\u05A1"
TELISHA_GEDOLA = "\u05A0"
GERSHAYIM = "\u059E"
KARNEI = "\u059E"
TIFCHA = "\u0596"
PASHTA = "\u0599"
YETIV = "\u059A"
TEVIR = "\u059B"
GERESH = "\u059C"
GERESH_MUQDAM = "\u059D"
ZARQA = "\u0598"
TELISHA_QETANA = "\u05A9"
LONG_PAUSE = {ETNACHTA, ZAQEF_QATAN, ZAQEF_GADOL, REVIA, SEGOLTA, SHALSHELET, PAZER, TELISHA_GEDOLA, GERSHAYIM}
MED_PAUSE = {TIFCHA, PASHTA, YETIV, TEVIR, GERESH, GERESH_MUQDAM, ZARQA, TELISHA_QETANA}

YHWH_CONS = "יהוה"


@dataclass
class Phone:
    cls: str  # "V" | "C" | "SIL"
    dmin: int
    dexp: int
    dmax: int
    cluster: int = 0
    word: int = -1
    onset: bool = False
    optional: bool = False


def sec_frames(sec: float, lo: int = 0) -> int:
    return max(lo, int(round(sec / DT)))


def is_yhwh(word: str) -> bool:
    cons = "".join(ch for ch in word if ch in CONS)
    return cons == YHWH_CONS


def pause_kind(word: str, last: bool) -> str:
    if last:
        return "verse"
    marks = set(word)
    if marks & LONG_PAUSE:
        return "long"
    if marks & MED_PAUSE:
        return "med"
    return "short"


def sil_phone(kind: str, word: int, cluster: int = 0) -> Phone:
    # Optional silence, longer after disjunctives — MFA's optional-SIL, with
    # te'amim telling us where the reader actually rests.
    if kind == "verse":
        return Phone("SIL", 0, sec_frames(0.50), sec_frames(8.0), cluster, word, optional=True)
    if kind == "long":
        return Phone("SIL", 0, sec_frames(0.28), sec_frames(0.95), cluster, word, optional=True)
    if kind == "med":
        return Phone("SIL", 0, sec_frames(0.14), sec_frames(0.72), cluster, word, optional=True)
    return Phone("SIL", 0, sec_frames(0.04), sec_frames(0.28), cluster, word, optional=True)


def vowel_dur(v: str) -> tuple[int, int, int]:
    if v == SHEVA:
        return sec_frames(0.04, 3), sec_frames(0.07), sec_frames(0.16)
    if v in HATEF:
        return sec_frames(0.05, 4), sec_frames(0.09), sec_frames(0.18)
    if v in LONG:
        return sec_frames(0.09, 7), sec_frames(0.15), sec_frames(0.38)
    return sec_frames(0.07, 5), sec_frames(0.12), sec_frames(0.28)
    if v == SHEVA:
        return sec_frames(0.03, 2), sec_frames(0.055), sec_frames(0.14)
    if v in HATEF:
        return sec_frames(0.04, 3), sec_frames(0.07), sec_frames(0.16)
    if v in LONG:
        return sec_frames(0.07, 5), sec_frames(0.13), sec_frames(0.32)
    return sec_frames(0.055, 4), sec_frames(0.10), sec_frames(0.24)


def cons_dur(strong: bool = False) -> tuple[int, int, int]:
    if strong:
        return sec_frames(0.04, 3), sec_frames(0.07), sec_frames(0.16)
    return sec_frames(0.035, 3), sec_frames(0.06), sec_frames(0.14)
    if strong:
        return sec_frames(0.03, 2), sec_frames(0.055), sec_frames(0.14)
    return sec_frames(0.025, 2), sec_frames(0.045), sec_frames(0.12)


def cons_phone(cons: str, dagesh: bool, shin: bool, sin: bool) -> str | None:
    """Map a Hebrew consonant to an English-like class used only for duration/onset."""
    if cons == "א":
        return None if not dagesh else "C"
    if cons == "ע":
        return None
    if cons == "ב":
        return "C"
    if cons == "פ":
        return "C"
    if cons == "כ" or cons == "ק":
        return "C"
    if cons == "ת" or cons == "ט" or cons == "ד":
        return "C"
    if cons == "ו":
        return "C"
    if cons == "י":
        return "C"
    if cons == "ה" or cons == "ח":
        return "C"
    if cons == "ש":
        return "C"
    return "C"


def g2p(word: str) -> list[Phone]:
    """Hebrew word → phone sequence. יהוה is timed as spoken Adonay (MFA lexicon)."""
    if is_yhwh(word):
        # Murillo dict: אֲדֹנָי AE0 D AH0 N EY1
        phones = [
            Phone("V", *vowel_dur(HATEF_PATAH), cluster=0, onset=True),
            Phone("C", *cons_dur(True), cluster=1),
            Phone("V", *vowel_dur(HOLAM), cluster=1),
            Phone("C", *cons_dur(), cluster=2),
            Phone("V", *vowel_dur(TSERE), cluster=2),
        ]
        return phones

    chars = list(word.replace(MAQEF, "").replace(SOF_PASUQ, ""))
    raw: list[tuple[str, str, list[str], bool, bool, bool]] = []
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
        joined = "".join(marks)
        vowels = [m for m in marks if m in VOWELS]
        raw.append((ch, joined, vowels, DAGESH in marks, SHIN_DOT in marks, SIN_DOT in marks))

    out: list[Phone] = []
    for n, (cons, marks, vowels, dagesh, shin, sin) in enumerate(raw):
        shureq = cons == "ו" and dagesh and not vowels
        holem_vav = cons == "ו" and any(v in (HOLAM, HOLAM_HASER) for v in vowels) and len(vowels) == 1
        onset = n == 0
        if shureq:
            out.append(Phone("V", *vowel_dur(QUBUTS), cluster=n, onset=onset))
            continue
        if holem_vav:
            out.append(Phone("V", *vowel_dur(HOLAM), cluster=n, onset=onset))
            continue
        if not vowels:
            if cons in MATRES and out:
                continue
            out.append(Phone("C", *cons_dur(), cluster=n, onset=onset and not out))
            continue
        ckind = cons_phone(cons, dagesh, shin, sin)
        if ckind:
            out.append(Phone("C", *cons_dur(dagesh), cluster=n, onset=onset))
            onset = False
        v = vowels[0]
        # Furtive patah: vowel sounds *before* final het/ayin/he.
        furtive = (
            n == len(raw) - 1
            and cons in "חעה"
            and PATAH in vowels
            and any(x != PATAH for x in vowels)
        )
        if furtive:
            other = next(x for x in vowels if x != PATAH)
            out.append(Phone("V", *vowel_dur(other), cluster=n, onset=onset))
            out.append(Phone("V", *vowel_dur(PATAH), cluster=n))
        else:
            out.append(Phone("V", *vowel_dur(v), cluster=n, onset=onset))
    return out or [Phone("V", sec_frames(0.08, 4), sec_frames(0.14), sec_frames(0.28), 0, onset=True)]


def phone_weight(word: str) -> float:
    return float(sum(max(p.dexp, 1) for p in g2p(word)) or 1.0)


def word_tokens(words: list[str]) -> list[Phone]:
    tokens: list[Phone] = [
        Phone("SIL", 0, sec_frames(0.04), sec_frames(1.6), optional=True),
    ]
    for wi, w in enumerate(words):
        phones = g2p(w)
        for j, p in enumerate(phones):
            p.word = wi
            if j == 0:
                p.onset = True
        tokens.extend(phones)
        tokens.append(sil_phone(pause_kind(w, wi == len(words) - 1), wi, phones[-1].cluster if phones else 0))
    return tokens


def decode(path: Path) -> np.ndarray:
    raw = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        stderr=subprocess.DEVNULL,
    )
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def features(samples: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    if len(samples) < N_FFT:
        samples = np.pad(samples, (0, N_FFT - len(samples)))
    frames = np.ascontiguousarray(sliding_window_view(samples, N_FFT)[::HOP])
    window = np.hanning(N_FFT).astype(np.float32)
    energy = np.sqrt(np.mean(frames * frames, axis=1) + 1e-12).astype(np.float32)
    spec = np.abs(np.fft.rfft(frames * window, axis=1))
    diff = np.diff(spec, axis=0, prepend=spec[:1])
    flux = np.maximum(diff, 0.0).sum(axis=1).astype(np.float32)
    k = np.ones(5, dtype=np.float32) / 5
    energy = np.convolve(energy, k, mode="same")
    flux = np.convolve(flux, np.array([0.15, 0.2, 0.3, 0.2, 0.15], dtype=np.float32), mode="same")
    e_p = float(np.percentile(energy, 90) or 1e-6)
    f_p = float(np.percentile(flux, 90) or 1e-6)
    energy = np.clip(energy / e_p, 0, 2.5)
    flux = np.clip(flux / f_p, 0, 3.0)
    p_speech = 1.0 / (1.0 + np.exp(-10.0 * (energy - 0.13)))
    return energy.astype(np.float32), flux.astype(np.float32), p_speech.astype(np.float32)


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


def heading_end(energy: np.ndarray, duration: float) -> float:
    voiced = np.flatnonzero(energy > 0.16)
    t0 = float(voiced[0]) * DT if len(voiced) else 2.0
    sils = silences(energy, 0.28)
    cands = [
        (a, b, d)
        for a, b, d in sils
        if d >= 0.85 and t0 - 0.1 <= a <= min(35.0, t0 + 32.0) and b >= t0 + 0.7
    ]
    if cands:
        # Book/chapter announcement, then the longest rest, then verse 1.
        a, b, d = max(cands, key=lambda s: (s[2], s[1]))
        return float(b)
    if t0 < 1.5:
        later = [b for a, b, d in sils if d >= 0.55 and 1.5 <= b <= 22]
        if later:
            return float(later[0])
    return max(t0, 2.0) if t0 < 1.5 else t0


def speech_prefix(p_speech: np.ndarray) -> np.ndarray:
    voiced = (p_speech > 0.45).astype(np.float64) * DT
    return np.concatenate([[0.0], np.cumsum(voiced)])


def span_speech(pref: np.ndarray, t0: float, t1: float) -> float:
    i0 = max(0, min(len(pref) - 1, int(t0 / DT)))
    i1 = max(i0, min(len(pref) - 1, int(t1 / DT)))
    return float(pref[i1] - pref[i0])


def detect_verse_starts(
    energy: np.ndarray,
    p_speech: np.ndarray,
    weights: list[float],
    duration: float,
) -> list[float]:
    """Assign each verse a speech-mass window. Etnachta rests cannot steal a verse."""
    n = len(weights)
    t_head = heading_end(energy, duration)
    t_end = duration
    voiced = np.flatnonzero(p_speech > 0.45)
    if len(voiced):
        t_end = min(duration, (int(voiced[-1]) + 8) * DT)
    if n <= 1:
        return [round(t_head, 3)]

    sils = silences(energy, 0.22)
    cands = [t_head]
    for a, b, d in sils:
        if b > t_head + 0.25 and b < t_end - 0.2:
            cands.append(float(b))
    cands.append(t_end)
    # unique, sorted, min 80ms apart
    uniq: list[float] = []
    for t in sorted(cands):
        if not uniq or t - uniq[-1] >= 0.08:
            uniq.append(t)
    cands = uniq
    C = len(cands)
    if C < n + 1:
        # not enough rests — fall back to proportional speech
        return _spread_speech(p_speech, weights, t_head, t_end)

    pref = speech_prefix(p_speech)
    total_speech = span_speech(pref, t_head, t_end)
    w = np.maximum(np.asarray(weights, dtype=np.float64), 0.08)
    expected = (w / w.sum()) * max(total_speech, 0.4)

    pause_before = [0.0] * C
    for i in range(1, C):
        pause_before[i] = max(0.0, cands[i] - cands[i - 1])
        # actual silence just before this candidate
        for a, b, d in sils:
            if abs(b - cands[i]) < 0.04:
                pause_before[i] = d
                break

    def cost(vi: int, i: int, j: int) -> float:
        speech = span_speech(pref, cands[i], cands[j])
        exp = float(expected[vi])
        ratio = speech / max(exp, 0.15)
        c = (math.log(max(ratio, 0.04))) ** 2
        if ratio < 0.38:
            c += 5.0 * (0.38 - ratio)
        if ratio > 2.4:
            c += 2.4 * (ratio - 2.4)
        wall = cands[j] - cands[i]
        if vi > 0:
            c -= 1.15 * math.log(1.0 + pause_before[i] / 0.22)
            if pause_before[i] >= 0.50:
                c -= 2.6
            if pause_before[i] >= 0.80:
                c -= 1.8
            if pause_before[i] < 0.20:
                c += 2.4
        # 12 words can be ~3.5s; 17 words cannot be 1.6s
        min_wall = 0.19 * max(4.0, weights[vi] / 7.5)
        if wall < min_wall:
            c += 16.0 * (1.0 - wall / max(min_wall, 0.2))
        min_sp = 0.14 * max(4.0, weights[vi] / 7.5)
        if speech < min_sp:
            c += 9.0 * (1.0 - speech / max(min_sp, 0.15))
        left_v = n - vi - 1
        if left_v > 0:
            left_s = span_speech(pref, cands[j], t_end)
            need = float(expected[vi + 1 :].sum())
            if left_s < 0.38 * need:
                c += 8.0 * (0.38 - left_s / max(need, 0.1))
        return c

    INF = 1e18
    dp = np.full((n + 1, C), INF)
    bp = np.full((n + 1, C), -1, np.int32)
    dp[1, 0] = 0.0
    for k in range(1, n):
        for i in range(C - 1):
            prev = dp[k, i]
            if prev >= INF:
                continue
            # bound search: next start shouldn't be wildly far
            exp_wall = max(1.2, float(expected[k - 1]) * 3.6)
            hi_t = cands[i] + exp_wall + 10.0
            for j in range(i + 1, C):
                if cands[j] > hi_t and j > i + 1:
                    break
                val = prev + cost(k - 1, i, j)
                if val < dp[k + 1, j]:
                    dp[k + 1, j] = val
                    bp[k + 1, j] = i

    best = INF
    last_i = 0
    for i in range(C - 1):
        if dp[n, i] >= INF:
            continue
        val = dp[n, i] + cost(n - 1, i, C - 1)
        if val < best:
            best = val
            last_i = i
    if best >= INF:
        return _spread_speech(p_speech, weights, t_head, t_end)

    idx = [0] * n
    idx[n - 1] = last_i
    for k in range(n, 1, -1):
        idx[k - 2] = int(bp[k, idx[k - 1]])
    return [round(cands[i], 3) for i in idx]


def _spread_speech(p_speech: np.ndarray, weights: list[float], t0: float, t1: float) -> list[float]:
    n = len(weights)
    i0 = max(0, int(t0 / DT))
    i1 = min(len(p_speech), max(i0 + 8, int(t1 / DT)))
    mass = np.maximum(p_speech[i0:i1] - 0.35, 0.0)
    if float(mass.sum()) < 1e-4:
        step = (t1 - t0) / max(n, 1)
        return [round(t0 + i * step, 3) for i in range(n)]
    cum = np.cumsum(mass)
    total = float(cum[-1])
    w = np.maximum(np.asarray(weights, dtype=np.float64), 0.08)
    w = w / w.sum()
    out = [round(t0, 3)]
    for i in range(1, n):
        tgt = float(w[:i].sum()) * total
        idx = int(np.searchsorted(cum, tgt))
        out.append(round(t0 + idx * DT, 3))
    return out


def prefix_costs(p_speech: np.ndarray, energy: np.ndarray, flux: np.ndarray) -> dict[str, np.ndarray]:
    p = np.clip(p_speech.astype(np.float64), 1e-4, 1 - 1e-4)
    speech = -np.log(p)
    sil = -np.log(1.0 - p)
    vow = speech - 0.10 * np.clip(energy, 0, 2.0)
    cons = speech - 0.22 * np.clip(flux, 0, 3.0)
    onset = cons - 0.55 * np.clip(flux, 0, 3.0)
    def pref(arr: np.ndarray) -> np.ndarray:
        return np.concatenate([[0.0], np.cumsum(arr)])
    return {"V": pref(vow), "C": pref(cons), "SIL": pref(sil), "ON": pref(onset)}


def dur_cost(d: int, tok: Phone) -> float:
    std = max(3.0, 0.50 * tok.dexp)
    z = (d - tok.dexp) / std
    w = 0.07 if tok.cls == "SIL" else 0.28
    return w * z * z


def viterbi(tokens: list[Phone], costs: dict[str, np.ndarray], t0: float, t1: float) -> list[tuple[int, int]]:
    """HSMM Viterbi. Returns (start_frame, end_frame) global indices per token."""
    i0 = max(0, int(t0 / DT))
    i1 = min(len(costs["V"]) - 1, max(i0 + 8, int(t1 / DT)))
    T = i1 - i0
    n = len(tokens)
    if n == 0 or T <= 1:
        return [(i0, i1)] * max(n, 1)

    INF = 1e15
    prev = np.full(T + 1, INF)
    prev[0] = 0.0
    back_s = np.full((n, T + 1), -1, np.int32)

    for ti, tok in enumerate(tokens):
        cur = np.full(T + 1, INF)
        key = "ON" if tok.onset and tok.cls != "SIL" else tok.cls
        P = costs[key]
        # local prefix: P_local[k] = sum of frames i0 .. i0+k-1
        # costs prefixes are global over frames 0..F, length F+1
        if tok.optional:
            cur[:] = prev
            back_s[ti] = np.arange(T + 1, dtype=np.int32)
        dmin = 0 if tok.optional else max(1, tok.dmin)
        dmax = min(tok.dmax, T)
        for d in range(max(dmin, 1), dmax + 1):
            # frame cost of [s, s+d) where s is local
            # global frames [i0+s, i0+s+d)
            fc = P[i0 + d : i0 + T + 1] - P[i0 : i0 + T + 1 - d]
            cand = prev[: T + 1 - d] + fc + dur_cost(d, tok)
            sl = cur[d:]
            better = cand < sl
            if np.any(better):
                sl[better] = cand[better]
                back_s[ti, d:][better] = np.nonzero(better)[0].astype(np.int32)
        prev = cur

    end = int(np.argmin(prev))
    if not np.isfinite(prev[end]) or prev[end] >= INF / 10:
        return []
    # prefer finishing near T (use remaining silence cheaply)
    # already argmin — if several, pick later by scanning from end
    for e in range(T, -1, -1):
        if prev[e] <= prev[end] + 0.8:
            end = e
            break

    spans: list[tuple[int, int]] = [(0, 0)] * n
    e = end
    for ti in range(n - 1, -1, -1):
        s = int(back_s[ti, e])
        if s < 0:
            s = e
        spans[ti] = (i0 + s, i0 + e)
        e = s
    return spans


def snap_onset(energy: np.ndarray, flux: np.ndarray, t: float, floor: float, ceil: float) -> float:
    lo = max(0, int(floor / DT))
    hi = min(len(energy) - 1, int(ceil / DT))
    i = int(np.clip(t / DT, lo, hi))
    if energy[i] < 0.12:
        for j in range(i, min(hi, i + 18)):
            if energy[j] > 0.18:
                return max(floor, min(ceil, j * DT))
        return max(floor, min(ceil, t))
    peak = float(energy[i] + 0.4 * flux[i])
    thr = max(0.16, peak * 0.28)
    hit = i
    for j in range(i, max(lo, i - 6) - 1, -1):
        if energy[j] + 0.3 * flux[j] < thr:
            hit = min(hi, j + 1)
            break
        hit = j
    return max(floor, min(ceil, hit * DT))


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


def speech_islands(mask: np.ndarray, min_dur: float = 0.12) -> list[tuple[int, int]]:
    min_n = max(3, int(min_dur / DT))
    out: list[tuple[int, int]] = []
    on = False
    st = 0
    for i, s in enumerate(mask):
        if s and not on:
            on = True
            st = i
        elif not s and on:
            if i - st >= min_n:
                out.append((st, i))
            on = False
    if on and len(mask) - st >= min_n:
        out.append((st, len(mask)))
    return out


def word_min_exp(word: str) -> tuple[float, float]:
    phones = g2p(word)
    dmin = sum(p.dmin for p in phones) * DT
    dexp = sum(p.dexp for p in phones) * DT
    nv = sum(1 for p in phones if p.cls == "V")
    dmin = max(dmin, 0.20 if nv <= 1 else 0.32, 0.12 * max(1, nv))
    dexp = max(dexp, dmin + 0.06)
    return dmin, dexp


def align_words(
    words: list[str],
    energy: np.ndarray,
    flux: np.ndarray,
    p_speech: np.ndarray,
    costs: dict[str, np.ndarray],
    t0: float,
    t1: float,
    verse_final: list[bool] | None = None,
) -> tuple[list[float], list[list[float]]]:
    """Walk speech frames with phone-duration priors and te'amim rests (MFA optional-SIL)."""
    n = len(words)
    if n == 0:
        return [], []
    i0 = max(0, int(t0 / DT))
    i1 = min(len(p_speech), max(i0 + 8, int(t1 / DT)))
    speech = (p_speech > 0.42) | (energy > 0.16)
    # drop single-frame clicks so a rest is one rest
    k = np.array([1, 1, 1, 1, 1], dtype=np.float32) / 5
    speech = np.convolve(speech.astype(np.float32), k, mode="same") >= 0.55
    mins: list[float] = []
    exps: list[float] = []
    kinds: list[str] = []
    for j, w in enumerate(words):
        dmin, dexp = word_min_exp(w)
        mins.append(dmin)
        exps.append(dexp)
        kinds.append(pause_kind(w, bool(verse_final[j]) if verse_final is not None else j == n - 1))
    islands = [(max(a, i0), min(b, i1)) for a, b in speech_islands(speech) if min(b, i1) - max(a, i0) >= 3]
    if not islands:
        wts = [phone_weight(w) for w in words]
        starts = spread_times(wts, t0, t1 - 0.04)
        phones = []
        for j, w in enumerate(words):
            parts = g2p(w)
            w0 = starts[j]
            w1 = starts[j + 1] if j + 1 < n else t1
            phones.append(spread_times([max(p.dexp, 1) for p in parts], w0, w1) if len(parts) > 1 else [w0])
        return starts, phones

    verse_speech = sum((b - a) * DT for a, b in islands) or 1.0
    tot_exp = sum(exps) or 1.0
    scale = float(np.clip(verse_speech / tot_exp, 0.78, 1.35))
    exps = [e * scale for e in exps]

    starts_f: list[int] = []
    ii = 0
    pos = islands[0][0]
    for j in range(n):
        while ii < len(islands) and islands[ii][1] <= pos:
            ii += 1
        if ii >= len(islands):
            leftover = n - j
            step = max(6, int((i1 - pos) / max(leftover, 1)))
            for k in range(j, n):
                starts_f.append(min(i1 - 1, pos + (k - j) * step))
            break
        if pos < islands[ii][0]:
            pos = islands[ii][0]
        starts_f.append(pos)
        need = max(4, int(exps[j] / DT))
        min_need = max(3, int(mins[j] / DT))
        got = 0
        kind = kinds[j]
        while got < need and ii < len(islands):
            a, b = islands[ii]
            pos = max(pos, a)
            take = min(need - got, b - pos)
            pos += take
            got += take
            if pos < b:
                break
            gap = (islands[ii + 1][0] - b) * DT if ii + 1 < len(islands) else 9.0
            ii += 1
            if got >= min_need and (
                (kind in {"long", "verse", "med"} and gap >= 0.20)
                or gap >= 0.36
                or got >= 0.84 * need
            ):
                break
            if ii < len(islands):
                pos = islands[ii][0]
    if len(starts_f) < n:
        last = starts_f[-1] if starts_f else i0
        while len(starts_f) < n:
            last = min(i1 - 1, last + 8)
            starts_f.append(last)

    word_start = [max(t0, sf * DT) for sf in starts_f]
    for j in range(n):
        lo = t0 if j == 0 else word_start[j - 1] + 0.06
        hi = (word_start[j + 1] - 0.05) if j + 1 < n else t1 - 0.02
        if hi <= lo:
            hi = lo + 0.04
        word_start[j] = snap_onset(energy, flux, word_start[j], lo, hi)
    for j in range(1, n):
        if word_start[j] < word_start[j - 1] + 0.08:
            word_start[j] = word_start[j - 1] + 0.08

    phone_times: list[list[float]] = []
    for j, w in enumerate(words):
        parts = g2p(w)
        w0 = word_start[j]
        w1 = word_start[j + 1] if j + 1 < n else t1
        clusters = []
        seen_c = set()
        wts = []
        for p in parts:
            if p.cluster in seen_c:
                wts[-1] += max(p.dexp, 1)
            else:
                seen_c.add(p.cluster)
                clusters.append(p.cluster)
                wts.append(max(p.dexp, 1))
        if len(wts) <= 1:
            phone_times.append([round(w0, 3)])
        else:
            phone_times.append(spread_times(wts, w0, w1))
    return [round(x, 3) for x in word_start], phone_times


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
        if local.exists() and local.stat().st_size > 20_000:
            return local
    CACHE.mkdir(parents=True, exist_ok=True)
    name = mechon_file(book, chapter)
    cache = CACHE / name
    if cache.exists() and cache.stat().st_size > 20_000:
        return cache
    url = f"https://mechon-mamre.org/mp3/{name}"
    req = urllib.request.Request(url, headers={"User-Agent": "HaDayHebraicAlign/1.0"})
    print(f"  download {book} {chapter} {url}", flush=True)
    tmp = cache.with_suffix(cache.suffix + ".part")
    last_err: Exception | None = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as res, tmp.open("wb") as fh:
                fh.write(res.read())
            if tmp.stat().st_size < 20_000:
                tmp.unlink(missing_ok=True)
                raise RuntimeError(f"tiny file {tmp.stat().st_size if tmp.exists() else 0}")
            tmp.replace(cache)
            return cache
        except Exception as exc:
            last_err = exc
            tmp.unlink(missing_ok=True)
    raise RuntimeError(str(last_err))


def align_chapter(
    book: str,
    ch: str,
    verses: list[dict],
    samples: np.ndarray,
    energy: np.ndarray,
    flux: np.ndarray,
    p_speech: np.ndarray,
) -> dict:
    duration = round(len(samples) / SR, 2)
    t_head = heading_end(energy, duration)
    voiced = np.flatnonzero(p_speech > 0.45)
    t_end = min(duration, (int(voiced[-1]) + 12) * DT) if len(voiced) else duration
    flat: list[str] = []
    finals: list[bool] = []
    cuts = [0]
    for row in verses:
        ww = row["words"]
        for j, w in enumerate(ww):
            flat.append(w)
            finals.append(j == len(ww) - 1)
        cuts.append(len(flat))
    dummy: dict[str, np.ndarray] = {}
    wstarts, pstarts = align_words(flat, energy, flux, p_speech, dummy, t_head, t_end, finals)
    word_times = [wstarts[cuts[i] : cuts[i + 1]] for i in range(len(verses))]
    phone_times = [pstarts[cuts[i] : cuts[i + 1]] for i in range(len(verses))]
    starts = []
    for i in range(len(verses)):
        if word_times[i]:
            starts.append(round(word_times[i][0], 2))
        elif starts:
            starts.append(round(starts[-1] + 0.8, 2))
        else:
            starts.append(round(t_head, 2))
    return {
        "src": public_src(book, int(ch)),
        "duration": duration,
        "verses": starts,
        "words": word_times,
        "phones": phone_times,
        "aligned": True,
        "engine": ENGINE,
    }


def quality_line(book: str, ch: str, meta: dict, verses: list[dict]) -> str:
    vs = meta["verses"] + [meta["duration"]]
    packed = 0
    short_v = 0
    gaps = []
    for i, row in enumerate(verses):
        span = vs[i + 1] - vs[i]
        n = len(row["words"])
        if n >= 8 and span < max(2.2, 0.22 * n):
            short_v += 1
        w = meta["words"][i]
        if len(w) >= 4:
            g = [w[j + 1] - w[j] for j in range(len(w) - 1)]
            med = sorted(g)[len(g) // 2]
            gaps.append(med)
            if med < 0.08:
                packed += 1
    med_gap = sorted(gaps)[len(gaps) // 2] if gaps else 0
    return (
        f"aligned {book} {ch} v{len(meta['verses'])} start={meta['verses'][0]} "
        f"dur={meta['duration']} packed={packed} crushed_verses={short_v} med_gap={med_gap:.3f}"
    )


def align_book(book: str, force: bool = False) -> None:
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

    def fetch(ch: str) -> tuple[str, Path | None, str]:
        try:
            return ch, audio_path(book, int(ch)), ""
        except Exception as exc:
            return ch, None, str(exc)

    need = []
    for ch in chapters:
        hit = out.get(ch) or {}
        stale = hit.get("engine") != ENGINE or not hit.get("aligned")
        if force or stale or len(hit.get("verses") or []) != len(dump["chapters"][ch]):
            need.append(ch)
    print(f"{book}: {len(chapters)} chapters, {len(need)} to align", flush=True)
    if not need:
        print(f"  skip {book} complete", flush=True)
        return

    paths: dict[str, Path] = {}
    with ThreadPoolExecutor(max_workers=4) as pool:
        for fut in as_completed([pool.submit(fetch, ch) for ch in need]):
            ch, path, err = fut.result()
            if path is None:
                print(f"  FAIL download {book} {ch} {err}", flush=True)
                continue
            try:
                size = path.stat().st_size
            except FileNotFoundError:
                print(f"  FAIL missing {book} {ch}", flush=True)
                continue
            paths[ch] = path
            print(f"  ready {book} {ch} {size}", flush=True)

    for ch in need:
        rows = dump["chapters"][ch]
        path = paths.get(ch)
        if path is None:
            continue
        try:
            samples = decode(path)
            energy, flux, p_speech = features(samples)
            meta = align_chapter(book, ch, rows, samples, energy, flux, p_speech)
            out[ch] = meta
            print(quality_line(book, ch, meta, rows), flush=True)
            out_path.write_text(json.dumps(out, separators=(",", ":")))
        except Exception as exc:
            print(f"  FAIL align {book} {ch} {exc}", flush=True)
        finally:
            if CACHE in path.parents and path.exists():
                path.unlink()

    if book == "Gen":
        slim = {k: out[k] for k in ["1", "2", "3", "4", "5"] if k in out}
        (ROOT / "src/lib/tanakh-audio.json").write_text(json.dumps(slim, separators=(",", ":")))
    print("wrote", out_path, "bytes", out_path.stat().st_size, "chapters", len(out), flush=True)


def catalog_ids() -> list[str]:
    return [b["id"] for b in json.loads((ROOT / "src/lib/tanakh-catalog.json").read_text())]


def books_from_args(args: list[str]) -> tuple[list[str], bool]:
    force = False
    rest = []
    for a in args:
        if a in {"--force", "-f"}:
            force = True
        else:
            rest.append(a)
    all_ids = catalog_ids()
    if not rest or rest == ["all"]:
        return all_ids, force
    if rest[0] in {"torah-mal", "to-malachi"}:
        out = []
        for bid in all_ids:
            out.append(bid)
            if bid == "Mal":
                break
        return out, force
    if rest[0] == "torah":
        return ["Gen", "Exod", "Lev", "Num", "Deut"], force
    return rest, force


def main() -> None:
    books, force = books_from_args(sys.argv[1:])
    print("batch", " ".join(books), "force" if force else "", "root", ROOT, flush=True)
    for book in books:
        align_book(book, force=force)
    print("batch done", flush=True)


if __name__ == "__main__":
    main()
