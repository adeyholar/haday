#!/usr/bin/env python3
"""Kaldi MFA follow-along — same method as Murillo.

Pairs each Shmuelof chapter WAV with the nikkud lab, maps Hebrew to English
ARPAbet (Biblehub-style, יהוה as Adonay), then:

    mfa align corpus hebrew_arpa.dict english_us_arpa out/

TextGrid word intervals become public/tanakh/align/<book>.json.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(os.environ.get("HADAY_ROOT", Path(__file__).resolve().parents[1]))
AUDIO_DIR = ROOT / "public/audio/tanakh"
CACHE = Path("/tmp/tanakh-mp3")
WORK = Path("/tmp/mfa-tanakh")
ALIGN_DIR = ROOT / "public/tanakh/align"
MAP = json.loads((ROOT / "src/lib/tanakh-audio-map.json").read_text())["files"]
BATCH = 4
CANON = [
    "Gen", "Exod", "Lev", "Num", "Deut",
    "Josh", "Judg", "1Sam", "2Sam", "1Kgs", "2Kgs",
    "Isa", "Jer", "Ezek",
    "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
    "Ps", "Prov", "Job", "Song", "Ruth", "Lam", "Eccl", "Esth", "Dan", "Ezra", "Neh", "1Chr", "2Chr",
]
ENGINE = "mfa-kaldi-v1"

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
QAMETS_QATAN = "\u05C7"
SHIN_DOT = "\u05C1"
SIN_DOT = "\u05C2"
MAQEF = "\u05BE"
SOF_PASUQ = "\u05C3"
VOWELS = {
    SHEVA, HATEF_SEGOL, HATEF_PATAH, HATEF_QAMETS, HIRIQ, TSERE, SEGOL,
    PATAH, QAMETS, HOLAM, HOLAM_HASER, QUBUTS, QAMETS_QATAN,
}
YHWH_CONS = "יהוה"
ADONAY = ["AE0", "D", "AH0", "N", "EY1"]

V_PHONE = {
    SHEVA: "AH",
    HATEF_SEGOL: "EH",
    HATEF_PATAH: "AE",
    HATEF_QAMETS: "AA",
    HIRIQ: "IH",
    TSERE: "EY",
    SEGOL: "EH",
    PATAH: "AE",
    QAMETS: "AA",
    HOLAM: "OW",
    HOLAM_HASER: "OW",
    QUBUTS: "UW",
    QAMETS_QATAN: "AO",
}


def is_yhwh(word: str) -> bool:
    cons = "".join(ch for ch in word if ch in CONS)
    return cons == YHWH_CONS


def lab_token(word: str) -> str:
    """Orthography MFA sees — niqqud kept, te'amim / sof pasuq / maqef stripped."""
    out = []
    for ch in unicodedata.normalize("NFC", word):
        if ch in (MAQEF, SOF_PASUQ, "-", "־"):
            continue
        cat = unicodedata.category(ch)
        # Mn: niqqud kept; skip te'amim (also Mn) by codepoint range.
        if 0x0591 <= ord(ch) <= 0x05AF:
            continue
        if ord(ch) in (0x05BD, 0x05BF, 0x05C0, 0x05C4, 0x05C5):
            continue
        if ch in "[](){}*'\"" or cat.startswith("P"):
            continue
        out.append(ch)
    token = "".join(out).strip()
    return token or "AH"


def arpa_word(word: str) -> list[str]:
    if is_yhwh(word):
        return list(ADONAY)

    chars = list(unicodedata.normalize("NFC", word))
    clusters: list[tuple[str, str, bool, bool, bool]] = []
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
        clusters.append(
            (
                ch,
                joined,
                DAGESH in marks,
                SHIN_DOT in marks,
                SIN_DOT in marks,
            )
        )

    phones: list[str] = []
    vowel_idx: list[int] = []
    for n, (cons, marks, dagesh, shin, sin) in enumerate(clusters):
        vowels = [m for m in marks if m in VOWELS]
        shureq = cons == "ו" and dagesh and not vowels
        holem_vav = cons == "ו" and any(v in (HOLAM, HOLAM_HASER) for v in vowels) and len(vowels) == 1
        if shureq:
            phones.append("UW")
            vowel_idx.append(len(phones) - 1)
            continue
        if holem_vav:
            phones.append("OW")
            vowel_idx.append(len(phones) - 1)
            continue

        cphone = cons_arpa(cons, dagesh, shin, sin, bool(vowels), n == 0, n == len(clusters) - 1)
        if cphone:
            phones.extend(cphone.split())

        if not vowels:
            if cons == "י" and phones and phones[-1].startswith("IH"):
                phones[-1] = "IY"
                continue
            if cons == "ו" and phones and phones[-1].startswith("OW"):
                continue
            if cons in "אהוי" and phones:
                continue
            continue

        furtive = (
            n == len(clusters) - 1
            and cons in "חעה"
            and PATAH in vowels
            and any(x != PATAH for x in vowels)
        )
        if furtive:
            other = next(x for x in vowels if x != PATAH)
            phones.append(V_PHONE.get(other, "AH"))
            vowel_idx.append(len(phones) - 1)
            phones.append("AE")
            vowel_idx.append(len(phones) - 1)
        else:
            phones.append(V_PHONE.get(vowels[0], "AH"))
            vowel_idx.append(len(phones) - 1)

    if not phones:
        phones = ["AH"]
        vowel_idx = [0]
    # Last vowel stressed, others unstressed — Murillo dict style.
    out = []
    last_v = vowel_idx[-1] if vowel_idx else -1
    for i, p in enumerate(phones):
        if p in V_PHONE.values() or p in {"UW", "OW", "AH", "AE", "AA", "EH", "EY", "IH", "AO"}:
            stress = "1" if i == last_v else "0"
            out.append(p + stress if not p[-1].isdigit() else p)
        else:
            out.append(p)
    return out


def cons_arpa(cons: str, dagesh: bool, shin: bool, sin: bool, has_vowel: bool, first: bool, last: bool) -> str:
    if cons == "א":
        return ""
    if cons == "ע":
        return ""
    if cons == "ב":
        return "B" if dagesh or first else "V"
    if cons == "ג":
        return "G"
    if cons == "ד":
        return "D"
    if cons == "ה":
        return "" if last and not has_vowel else "HH"
    if cons == "ו":
        return "V"
    if cons == "ז":
        return "Z"
    if cons == "ח":
        return "HH"
    if cons == "ט":
        return "T"
    if cons == "י":
        return "Y"
    if cons in "כך":
        return "K" if dagesh else "HH"
    if cons == "ל":
        return "L"
    if cons in "מם":
        return "M"
    if cons in "נן":
        return "N"
    if cons == "ס":
        return "S"
    if cons in "פף":
        return "P" if dagesh else "F"
    if cons in "צץ":
        return "T S"
    if cons == "ק":
        return "K"
    if cons == "ר":
        return "R"
    if cons == "ש":
        if sin:
            return "S"
        return "SH"
    if cons in "ת":
        return "T"
    return "K"


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


def audio_mp3(book: str, chapter: int) -> Path:
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
    print(f"  download {book} {chapter} {url}", flush=True)
    tmp = cache.with_suffix(cache.suffix + ".part")
    req = urllib.request.Request(url, headers={"User-Agent": "HaDayMFA/1.0"})
    last = None
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as res, tmp.open("wb") as fh:
                fh.write(res.read())
            if tmp.stat().st_size < 20_000:
                tmp.unlink(missing_ok=True)
                raise RuntimeError("tiny mp3")
            tmp.replace(cache)
            return cache
        except Exception as exc:
            last = exc
            tmp.unlink(missing_ok=True)
    raise RuntimeError(str(last))


def wav_16k(mp3: Path, wav: Path) -> None:
    wav.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(mp3), "-ac", "1", "-ar", "16000", "-acodec", "pcm_s16le", str(wav),
        ]
    )


def duration_sec(wav: Path) -> float:
    import wave

    with wave.open(str(wav), "rb") as fh:
        return round(fh.getnframes() / float(fh.getframerate() or 16000), 2)


def heading_end_wav(wav: Path) -> float:
    """Skip Shmuelof's spoken book/chapter title — MFA must not eat it as verse 1."""
    import numpy as np
    from numpy.lib.stride_tricks import sliding_window_view

    sr, hop, n_fft = 16000, 160, 512
    dt = hop / sr
    raw = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
        stderr=subprocess.DEVNULL,
    )
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if len(samples) < n_fft:
        samples = np.pad(samples, (0, n_fft - len(samples)))
    frames = np.ascontiguousarray(sliding_window_view(samples, n_fft)[::hop])
    energy = np.sqrt(np.mean(frames * frames, axis=1) + 1e-12)
    energy = np.convolve(energy, np.ones(5) / 5, mode="same")
    e_p = float(np.percentile(energy, 90) or 1e-6)
    energy = np.clip(energy / e_p, 0, 2.5)
    duration = len(samples) / sr
    speech = energy > 0.12
    sils: list[tuple[float, float, float]] = []
    on = False
    st = 0
    for i, quiet in enumerate(~speech):
        if quiet and not on:
            on, st = True, i
        elif not quiet and on:
            d = (i - st) * dt
            if d >= 0.28:
                sils.append((st * dt, i * dt, d))
            on = False
    voiced = np.flatnonzero(energy > 0.16)
    t0 = float(voiced[0]) * dt if len(voiced) else 2.0
    cands = [(a, b, d) for a, b, d in sils if d >= 0.85 and t0 - 0.1 <= a <= min(35.0, t0 + 32.0) and b >= t0 + 0.7]
    if cands:
        return float(max(cands, key=lambda s: (s[2], s[1]))[1])
    if t0 < 1.5:
        later = [b for a, b, d in sils if d >= 0.55 and 1.5 <= b <= 22]
        if later:
            return float(later[0])
    t = max(t0, 2.0) if t0 < 1.5 else t0
    return max(0.5, min(float(t), 40.0))


def trim_heading(src: Path, dest: Path, t0: float) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", f"{t0:.3f}", "-i", str(src),
            "-ac", "1", "-ar", "16000", "-acodec", "pcm_s16le", str(dest),
        ]
    )


def extract_span(src: Path, dest: Path, t0: float, t1: float) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.check_call(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-ss", f"{max(0.0, t0):.3f}", "-t", f"{max(0.2, t1 - t0):.3f}",
            "-i", str(src),
            "-ac", "1", "-ar", "16000", "-acodec", "pcm_s16le", str(dest),
        ]
    )


def frame_energy(wav: Path, hop: int = 160, n_fft: int = 512):
    import numpy as np
    from numpy.lib.stride_tricks import sliding_window_view

    sr = 16000
    raw = subprocess.check_output(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
        stderr=subprocess.DEVNULL,
    )
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    if len(samples) < n_fft:
        samples = np.pad(samples, (0, n_fft - len(samples)))
    frames = np.ascontiguousarray(sliding_window_view(samples, n_fft)[::hop])
    energy = np.sqrt(np.mean(frames * frames, axis=1) + 1e-12)
    energy = np.convolve(energy, np.ones(5) / 5, mode="same")
    e_p = float(np.percentile(energy, 90) or 1e-6)
    energy = np.clip(energy / e_p, 0, 2.5)
    return energy, hop / sr, len(samples) / sr


def silence_regions(wav: Path, min_dur: float = 0.22) -> list[tuple[float, float, float]]:
    energy, dt, _ = frame_energy(wav)
    speech = energy > 0.12
    sils: list[tuple[float, float, float]] = []
    on = False
    st = 0
    for i, quiet in enumerate(~speech):
        if quiet and not on:
            on, st = True, i
        elif not quiet and on:
            d = (i - st) * dt
            if d >= min_dur:
                sils.append((st * dt, i * dt, d))
            on = False
    return sils


def snap_to_silence(sils: list[tuple[float, float, float]], target: float, lo: float, hi: float) -> float:
    cands = [(a, b, d) for a, b, d in sils if lo <= (a + b) / 2 <= hi]
    if not cands:
        return min(max(target, lo), hi)
    best = min(cands, key=lambda s: (abs((s[0] + s[1]) / 2 - target), -s[2]))
    return float((best[0] + best[1]) / 2)


def split_long_parts(rows: list[dict], wav: Path, max_sec: float = 480.0) -> list[tuple[list[dict], float, float]]:
    """Cut a long chapter into ~8-minute verse groups at nearby silences."""
    dur = duration_sec(wav)
    n_words = sum(len(r["words"]) for r in rows) or 1
    n_parts = max(2, int(dur // max_sec) + 1)
    targets = [n_words * (i + 1) / n_parts for i in range(n_parts - 1)]
    cuts: list[int] = []
    acc = 0
    ti = 0
    for i, row in enumerate(rows):
        acc += len(row["words"])
        if ti < len(targets) and acc >= targets[ti] and i + 1 < len(rows):
            cuts.append(i + 1)
            ti += 1
    bounds = [0, *cuts, len(rows)]
    groups = [rows[bounds[i] : bounds[i + 1]] for i in range(len(bounds) - 1)]
    word_cuts = []
    acc = 0
    for g in groups[:-1]:
        acc += sum(len(r["words"]) for r in g)
        word_cuts.append(dur * acc / n_words)
    sils = silence_regions(wav, min_dur=0.22)
    times: list[float] = []
    prev = 8.0
    for i, t in enumerate(word_cuts):
        hi = dur - 8.0
        lo = min(hi - 1.0, prev + 20.0)
        window_lo = max(lo, t - 25.0)
        window_hi = min(hi, t + 25.0)
        if window_hi <= window_lo:
            snapped = min(max(t, lo), hi)
        else:
            snapped = snap_to_silence(sils, t, window_lo, window_hi)
        times.append(max(lo, min(snapped, hi)))
        prev = times[-1]
    parts = []
    t0 = 0.0
    for i, g in enumerate(groups):
        t1 = times[i] if i < len(times) else dur
        if t1 <= t0 + 5:
            t1 = min(dur, t0 + max(30.0, dur / n_parts))
        parts.append((g, t0, t1))
        t0 = t1
    if parts:
        g, a, _ = parts[-1]
        parts[-1] = (g, a, dur)
    return parts


def write_dict(words: list[str], path: Path) -> None:
    seen: dict[str, str] = {}
    for w in words:
        tok = lab_token(w)
        if tok in seen:
            continue
        phones = " ".join(arpa_word(w))
        seen[tok] = phones
    lines = [f"{tok}\t{ph}" for tok, ph in sorted(seen.items())]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def parse_textgrid(path: Path) -> tuple[list[tuple[float, float, str]], list[tuple[float, float, str]]]:
    from praatio import textgrid as tgio

    tg = tgio.openTextgrid(str(path), includeEmptyIntervals=True)
    words: list[tuple[float, float, str]] = []
    phones: list[tuple[float, float, str]] = []
    for name in tg.tierNames:
        tier = tg.getTier(name)
        low = name.lower()
        rows = [(float(e.start), float(e.end), (e.label or "").strip()) for e in tier.entries]
        if "phone" in low:
            phones = rows
        elif "word" in low:
            words = rows
    if not words and tg.tierNames:
        tier = tg.getTier(tg.tierNames[0])
        words = [(float(e.start), float(e.end), (e.label or "").strip()) for e in tier.entries]
    return words, phones


def spoken_intervals(rows: list[tuple[float, float, str]]) -> list[tuple[float, float, str]]:
    skip = {"", "sil", "spn", "sp", "<unk>", "unk", "<eps>"}
    out = []
    for a, b, lab in rows:
        if lab.lower() in skip:
            continue
        # Trailing garbage: last word stretched across the leftover silence.
        if b - a > 4.0 and out:
            continue
        out.append((a, b, lab))
    return out


def map_word_times(
    tokens: list[str],
    intervals: list[tuple[float, float, str]],
    duration: float,
) -> list[float]:
    spoken = spoken_intervals(intervals)
    starts = [0.0] * len(tokens)
    if not tokens:
        return []
    if not spoken:
        step = duration / max(1, len(tokens))
        return [round(i * step, 3) for i in range(len(tokens))]
    # Greedy: walk spoken intervals in order onto lab tokens.
    j = 0
    for i, tok in enumerate(tokens):
        if j < len(spoken):
            starts[i] = spoken[j][0]
            j += 1
        elif i:
            starts[i] = starts[i - 1] + 0.2
        else:
            starts[i] = spoken[0][0]
    return [round(x, 3) for x in starts]


def phone_clusters(
    word_starts: list[float],
    next_end: float,
    tokens: list[str],
    phone_iv: list[tuple[float, float, str]],
) -> list[list[float]]:
    out: list[list[float]] = []
    for i, t0 in enumerate(word_starts):
        t1 = word_starts[i + 1] if i + 1 < len(word_starts) else next_end
        inside = [round(a, 3) for a, b, lab in phone_iv if t0 - 0.01 <= a < t1 - 0.01 and lab.lower() not in {"", "sil", "sp"}]
        if not inside:
            n = max(1, len(arpa_word(tokens[i])))
            if n == 1:
                inside = [t0]
            else:
                span = max(0.05, t1 - t0)
                inside = [round(t0 + span * k / n, 3) for k in range(n)]
        else:
            inside[0] = round(t0, 3)
        out.append(inside)
    return out


def chapter_meta(
    book: str,
    ch: str,
    verses: list[dict],
    words_iv: list[tuple[float, float, str]],
    phones_iv: list[tuple[float, float, str]],
    duration: float,
) -> dict:
    tokens: list[str] = []
    cuts = [0]
    for row in verses:
        tokens.extend(row["words"])
        cuts.append(len(tokens))
    starts = map_word_times(tokens, words_iv, duration)
    # verse start = first word of that verse
    verse_starts = []
    word_times = []
    phone_times = []
    for i in range(len(verses)):
        chunk = starts[cuts[i] : cuts[i + 1]]
        toks = tokens[cuts[i] : cuts[i + 1]]
        end = starts[cuts[i + 1]] if cuts[i + 1] < len(starts) else duration
        word_times.append(chunk)
        phone_times.append(phone_clusters(chunk, end, toks, phones_iv))
        verse_starts.append(round(chunk[0], 2) if chunk else round(verse_starts[-1] + 0.8 if verse_starts else 2.0, 2))
    return {
        "src": public_src(book, int(ch)),
        "duration": duration,
        "verses": verse_starts,
        "words": word_times,
        "phones": phone_times,
        "aligned": True,
        "engine": ENGINE,
    }


def mfa_bin() -> list[str]:
    return ["micromamba", "run", "-n", "mfa", "mfa"]


def align_corpus(corpus: Path, dict_path: Path, out_dir: Path, num_jobs: int = 2) -> None:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    env = os.environ.copy()
    env["MAMBA_ROOT_PREFIX"] = "/opt/micromamba"
    cmd = mfa_bin() + [
        "align",
        str(corpus),
        str(dict_path),
        "english_us_arpa",
        str(out_dir),
        "--clean",
        "--overwrite",
        "--no_tokenization",
        "--single_speaker",
        "--beam", "100",
        "--retry_beam", "400",
        "--num_jobs", str(num_jobs),
        "--output_format", "long_textgrid",
        "--temporary_directory", "/tmp/mfa-work",
    ]
    print("  " + " ".join(cmd), flush=True)
    subprocess.check_call(cmd, env=env)


def find_textgrid(out_dir: Path, stem: str) -> Path | None:
    hits = list(out_dir.rglob(f"{stem}.TextGrid"))
    return hits[0] if hits else None


def ingest_textgrids(
    book: str,
    stems: list[tuple[str, str, list[dict], float]],
    speaker: Path,
    aligned_dir: Path,
    out: dict,
    out_path: Path,
) -> list[str]:
    failed: list[str] = []
    for ch, stem, rows, t_head in stems:
        tg = find_textgrid(aligned_dir, stem)
        wav = speaker / f"{stem}.wav"
        if tg is None:
            print(f"  FAIL no TextGrid {book} {ch}", flush=True)
            failed.append(ch)
            wav.unlink(missing_ok=True)
            continue
        dur = round(t_head + duration_sec(wav), 2)
        words_iv, phones_iv = parse_textgrid(tg)
        shift = max(0.0, t_head - 0.15)
        words_iv = [(a + shift, b + shift, lab) for a, b, lab in words_iv]
        phones_iv = [(a + shift, b + shift, lab) for a, b, lab in phones_iv]
        meta = chapter_meta(book, ch, rows, words_iv, phones_iv, dur)
        out[ch] = meta
        spoken = spoken_intervals(words_iv)
        print(
            f"  MFA {book} {ch} v{len(meta['verses'])} start={meta['verses'][0]} "
            f"spoken={len(spoken)} lab={sum(len(r['words']) for r in rows)} dur={dur}",
            flush=True,
        )
        out_path.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
        wav.unlink(missing_ok=True)
        (speaker / f"{stem}.lab").unlink(missing_ok=True)
    return failed


LONG_SEC = 540.0  # split chapters longer than 9 minutes to avoid Kaldi OOM


def align_long_chapter(
    book: str,
    ch: str,
    rows: list[dict],
    t_head: float,
    wav: Path,
    out: dict,
    out_path: Path,
) -> list[str]:
    parts = split_long_parts(rows, wav, max_sec=480.0)
    print(
        f"  split {book} {ch} dur={duration_sec(wav):.0f}s parts={len(parts)} "
        f"verses={[len(g) for g, _, _ in parts]}",
        flush=True,
    )
    speaker = WORK / "corpus" / "shmuelof"
    part_dir = WORK / "corpus" / "shmuelof"
    # Keep original wav; write parts next to it then align only the parts.
    lab_words: list[str] = []
    stems: list[tuple[str, list[dict], float]] = []
    for i, (group, t0, t1) in enumerate(parts):
        stem = f"{book}_{int(ch):03d}_p{i}"
        extract_span(wav, part_dir / f"{stem}.wav", t0, t1)
        flat = [w for r in group for w in r["words"]]
        (part_dir / f"{stem}.lab").write_text(" ".join(lab_token(w) for w in flat) + "\n", encoding="utf-8")
        lab_words.extend(flat)
        stems.append((stem, group, t0))
    orig_stem = wav.stem
    (part_dir / f"{orig_stem}.wav").unlink(missing_ok=True)
    (part_dir / f"{orig_stem}.lab").unlink(missing_ok=True)
    dict_path = WORK / "hebrew_arpa.dict"
    write_dict(lab_words, dict_path)
    aligned_dir = WORK / "aligned"
    try:
        align_corpus(WORK / "corpus", dict_path, aligned_dir, num_jobs=1)
    except subprocess.CalledProcessError as exc:
        print(f"  FAIL mfa long {book} {ch} {exc}", flush=True)
        return [ch]
    words_iv: list[tuple[float, float, str]] = []
    phones_iv: list[tuple[float, float, str]] = []
    shift = max(0.0, t_head - 0.15)
    for stem, group, t0 in stems:
        tg = find_textgrid(aligned_dir, stem)
        if tg is None:
            print(f"  FAIL no TextGrid {book} {ch} {stem}", flush=True)
            return [ch]
        w, p = parse_textgrid(tg)
        off = shift + t0
        words_iv.extend((a + off, b + off, lab) for a, b, lab in w)
        phones_iv.extend((a + off, b + off, lab) for a, b, lab in p)
        (part_dir / f"{stem}.wav").unlink(missing_ok=True)
        (part_dir / f"{stem}.lab").unlink(missing_ok=True)
    last = words_iv[-1][1] if words_iv else shift
    dur = round(max(last + 0.4, shift + parts[-1][2]), 2)
    meta = chapter_meta(book, ch, rows, words_iv, phones_iv, dur)
    out[ch] = meta
    spoken = spoken_intervals(words_iv)
    print(
        f"  MFA {book} {ch} v{len(meta['verses'])} start={meta['verses'][0]} "
        f"spoken={len(spoken)} lab={sum(len(r['words']) for r in rows)} dur={dur} split={len(parts)}",
        flush=True,
    )
    out_path.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    wav.unlink(missing_ok=True)
    return []


def prepare_chapter(book: str, ch: str, rows: list[dict], speaker: Path) -> tuple[str, str, list[dict], float, list[str]]:
    flat = [w for row in rows for w in row["words"]]
    mp3 = audio_mp3(book, int(ch))
    stem = f"{book}_{int(ch):03d}"
    full = speaker / f"{stem}_full.wav"
    wav = speaker / f"{stem}.wav"
    wav_16k(mp3, full)
    t_head = heading_end_wav(full)
    trim_heading(full, wav, max(0.0, t_head - 0.15))
    full.unlink(missing_ok=True)
    lab = " ".join(lab_token(w) for w in flat)
    (speaker / f"{stem}.lab").write_text(lab + "\n", encoding="utf-8")
    print(f"  prepared {book} {ch} head={t_head:.2f}s {wav.stat().st_size} words={len(flat)}", flush=True)
    return ch, stem, rows, t_head, flat


def run_batch(book: str, dump: dict, chapters: list[str], out: dict, out_path: Path) -> list[str]:
    speaker = WORK / "corpus" / "shmuelof"
    if speaker.exists():
        shutil.rmtree(speaker)
    speaker.mkdir(parents=True)
    lab_words: list[str] = []
    stems: list[tuple[str, str, list[dict], float]] = []
    failed: list[str] = []
    for ch in chapters:
        try:
            ch, stem, rows, t_head, flat = prepare_chapter(book, ch, dump["chapters"][ch], speaker)
            wav = speaker / f"{stem}.wav"
            if duration_sec(wav) >= LONG_SEC:
                print(f"  long {book} {ch} {duration_sec(wav):.0f}s — split path", flush=True)
                failed.extend(align_long_chapter(book, ch, rows, t_head, wav, out, out_path))
                continue
            lab_words.extend(flat)
            stems.append((ch, stem, rows, t_head))
        except Exception as exc:
            print(f"  FAIL prepare {book} {ch} {exc}", flush=True)
            failed.append(ch)
    if not stems:
        return failed or list(chapters)
    dict_path = WORK / "hebrew_arpa.dict"
    write_dict(lab_words, dict_path)
    print(f"  dict {len(dict_path.read_text().splitlines())} entries batch={','.join(c for c,_,_,_ in stems)}", flush=True)
    aligned_dir = WORK / "aligned"
    try:
        align_corpus(WORK / "corpus", dict_path, aligned_dir)
    except subprocess.CalledProcessError as exc:
        print(f"  FAIL mfa batch {book} {chapters} {exc}", flush=True)
        if len(stems) == 1:
            ch, stem, rows, t_head = stems[0]
            wav = speaker / f"{stem}.wav"
            if wav.exists() and duration_sec(wav) >= 180:
                print(f"  retry-split {book} {ch}", flush=True)
                return failed + align_long_chapter(book, ch, rows, t_head, wav, out, out_path)
            return failed + [ch]
        more = []
        for ch, stem, rows, t_head in stems:
            more.extend(run_batch(book, dump, [ch], out, out_path))
        return failed + more
    return failed + ingest_textgrids(book, stems, speaker, aligned_dir, out, out_path)


def align_book(book: str, chapters: list[str] | None = None, force: bool = False) -> None:
    dump = json.loads((ROOT / f"public/tanakh/books/{book}.json").read_text())
    all_ch = sorted(dump["chapters"], key=lambda x: int(x))
    want = chapters or all_ch
    ALIGN_DIR.mkdir(parents=True, exist_ok=True)
    out_path = ALIGN_DIR / f"{book}.json"
    out: dict = {}
    if out_path.exists():
        try:
            out = json.loads(out_path.read_text())
        except json.JSONDecodeError:
            out = {}

    need = []
    for ch in want:
        hit = out.get(ch) or {}
        stale = hit.get("engine") != ENGINE or not hit.get("aligned")
        if force or stale or len(hit.get("verses") or []) != len(dump["chapters"][ch]):
            need.append(ch)
    print(f"{book}: {len(want)} requested, {len(need)} to MFA-align", flush=True)
    if not need:
        return

    failed: list[str] = []
    for i in range(0, len(need), BATCH):
        chunk = need[i : i + BATCH]
        failed.extend(run_batch(book, dump, chunk, out, out_path))

    if book == "Gen":
        slim = {k: out[k] for k in ["1", "2", "3", "4", "5"] if k in out}
        if slim:
            (ROOT / "src/lib/tanakh-audio.json").write_text(json.dumps(slim, separators=(",", ":")), encoding="utf-8")
    done = sum(1 for ch in dump["chapters"] if (out.get(ch) or {}).get("engine") == ENGINE)
    print(f"{book}: kaldi {done}/{len(dump['chapters'])} failed={failed}", flush=True)


def progress() -> None:
    n = 0
    k = 0
    for book in CANON:
        path = ALIGN_DIR / f"{book}.json"
        dump = json.loads((ROOT / f"public/tanakh/books/{book}.json").read_text())
        n += len(dump["chapters"])
        if not path.exists():
            continue
        out = json.loads(path.read_text())
        k += sum(1 for ch in dump["chapters"] if (out.get(ch) or {}).get("engine") == ENGINE)
    print(f"CANON kaldi {k}/{n}", flush=True)


def main() -> None:
    args = sys.argv[1:]
    force = "--force" in args
    args = [a for a in args if a != "--force"]
    if not args or args[0] in ("--all", "all"):
        for book in CANON:
            try:
                align_book(book, force=force)
            except Exception as exc:
                print(f"FAIL book {book} {exc}", flush=True)
            progress()
        return
    book = args[0]
    chapters = args[1].split(",") if len(args) > 1 else None
    align_book(book, chapters, force=force)
    progress()


if __name__ == "__main__":
    main()
