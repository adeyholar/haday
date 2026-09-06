#!/usr/bin/env python3
"""Pick one Shmuelof clip per BBH lemma: citation form only (יָם, never בַּיָּם)."""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONS = {chr(c) for c in range(0x05D0, 0x05EB)}
CANON = [
    "Gen", "Exod", "Lev", "Num", "Deut",
    "Josh", "Judg", "1Sam", "2Sam", "1Kgs", "2Kgs",
    "Isa", "Jer", "Ezek",
    "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
    "Ps", "Prov", "Job", "Song", "Ruth", "Lam", "Eccl", "Esth", "Dan", "Ezra", "Neh", "1Chr", "2Chr",
]
SKIP_IDS = {"ha", "we", "be", "ke", "le", "she"}
BOOK_EN = {b["id"]: b["en"] for b in json.loads((ROOT / "src/lib/tanakh-catalog.json").read_text())}


def strip_marks(s: str) -> str:
    out = []
    for ch in unicodedata.normalize("NFC", s):
        o = ord(ch)
        if 0x0591 <= o <= 0x05AF:
            continue
        if o in (0x05BD, 0x05BF, 0x05C0, 0x05C3, 0x05C4, 0x05C5, 0x05BE):
            continue
        if ch in "־-[](){}*'\"":
            continue
        out.append(ch)
    return "".join(out)


def cons(s: str) -> str:
    return "".join(ch for ch in strip_marks(s) if ch in CONS)


def parse_vocab() -> list[dict]:
    text = (ROOT / "src/lib/vocab.ts").read_text()
    start = text.index("export const VOCAB")
    end = text.index("export const CHAPTERS")
    body = text[start:end]
    items = []
    for block in re.findall(r"\{[^{}]+\}", body):
        hid = re.search(r'id: "([^"]+)"', block)
        he = re.search(r'hebrew: "([^"]+)"', block)
        if not hid or not he:
            continue
        alts = re.findall(r'"([^"]+)"', (re.search(r"hebrewAlts: \[([^\]]*)\]", block) or [None, ""])[1] or "")
        pos = (re.search(r'pos: "([^"]+)"', block) or [None, ""])[1]
        chap = int((re.search(r"chapter: (\d+)", block) or [None, "0"])[1])
        items.append({"id": hid.group(1), "hebrew": he.group(1), "alts": alts, "pos": pos, "chapter": chap})
    return items


def lemma_forms(item: dict) -> tuple[set[str], set[str]]:
    raw = [item["hebrew"], *item["alts"]]
    niq = {strip_marks(x) for x in raw if strip_marks(x)}
    cc = {cons(x) for x in raw if cons(x)}
    return niq, cc


def word_end(times: list[float], wi: int, verse_end: float) -> float:
    if wi + 1 < len(times):
        return float(times[wi + 1])
    return float(verse_end)


def score(dur: float, exact: bool, book_i: int, last: bool) -> float:
    if dur < 0.16 or dur > 2.4:
        return -1
    n = 40 if exact else 10
    if 0.22 <= dur <= 1.35:
        n += 35
    elif 0.18 <= dur <= 1.8:
        n += 18
    else:
        n -= 8
    n += max(0, 24 - book_i) * 0.4
    if last and dur > 1.2:
        n -= 12
    return n


def main() -> None:
    vocab = parse_vocab()
    need = []
    by_cons: dict[str, list[tuple[str, set[str]]]] = {}
    for it in vocab:
        if it["id"] in SKIP_IDS:
            continue
        niq, cc = lemma_forms(it)
        if not cc or max(len(c) for c in cc) < 2:
            continue
        need.append(it["id"])
        for c in cc:
            by_cons.setdefault(c, []).append((it["id"], niq))

    best: dict[str, tuple[float, dict]] = {}
    for bi, book in enumerate(CANON):
        dump = json.loads((ROOT / f"public/tanakh/books/{book}.json").read_text())
        aln = json.loads((ROOT / f"public/tanakh/align/{book}.json").read_text())
        for ch, verses in dump["chapters"].items():
            a = aln.get(ch) or {}
            src = a.get("src") or ""
            wtimes = a.get("words") or []
            vstarts = a.get("verses") or []
            duration = float(a.get("duration") or 0)
            if not src or not wtimes:
                continue
            for vi, row in enumerate(verses):
                words = row.get("words") or []
                times = wtimes[vi] if vi < len(wtimes) else []
                if not times:
                    continue
                if vi + 1 < len(vstarts):
                    vend = float(vstarts[vi + 1])
                elif duration:
                    vend = duration
                else:
                    vend = float(times[-1]) + 0.5
                tlist = [float(x) for x in times]
                for wi, w in enumerate(words):
                    if "־" in w or "-" in w:
                        continue
                    c = cons(w)
                    cands = by_cons.get(c)
                    if not cands:
                        continue
                    t0 = tlist[wi] if wi < len(tlist) else None
                    if t0 is None:
                        continue
                    t1 = word_end(tlist, wi, vend)
                    dur = t1 - t0
                    last = wi == len(words) - 1
                    sm = strip_marks(w)
                    for hid, niq in cands:
                        exact = sm in niq
                        n = score(dur, exact, bi, last)
                        if n < 0:
                            continue
                        end = t1 if dur <= 1.85 else t0 + 0.95
                        hit = {
                            "src": src,
                            "book": book,
                            "bookEn": BOOK_EN.get(book, book),
                            "ch": int(ch),
                            "v": int(row.get("v") or vi + 1),
                            "start": round(max(0.0, t0 - 0.04), 3),
                            "end": round(end + 0.05, 3),
                            "he": sm,
                        }
                        prev = best.get(hid)
                        if prev is None or n > prev[0]:
                            best[hid] = (n, hit)

    out = {k: v[1] for k, v in sorted(best.items())}
    dest = ROOT / "src/lib/vocab-clips.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"clips {len(out)}/{len(need)} -> {dest}")
    missing = [hid for hid in need if hid not in out]
    print("missing", missing)


if __name__ == "__main__":
    main()
