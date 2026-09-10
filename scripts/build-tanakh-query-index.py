#!/usr/bin/env python3
"""Scan Masoretic Tanakh dumps into a compact admin query index.

Tags follow class rules, not a commercial lexicon:
  hatuf / gadol  — qamets hatuf (closed unaccented) vs qamets gadol
  ms / mp / fs / fp / dual — ending shape after common prefixes
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "public" / "tanakh" / "books"
OUT = ROOT / "public" / "tanakh" / "query-index.json"

QAMETS = "\u05B8"
QAMETS_QATAN = "\u05C7"
SHEWA = "\u05B0"
METEG = "\u05BD"
MAQQEF = "\u05BE"
HOLEM = "\u05B9"
HOLEM_HASER = "\u05BA"
SHUREQ = "\u05BC"  # dagesh; shureq is vav + dagesh when vav has no other vowel
HIREQ = "\u05B4"
ACCENT = {chr(i) for i in range(0x0591, 0x05B0)}
CONS = {chr(i) for i in range(0x05D0, 0x05EB)}
FULL = {
    SHEWA,
    "\u05B1",
    "\u05B2",
    "\u05B3",
    HIREQ,
    "\u05B5",
    "\u05B6",
    "\u05B7",
    QAMETS,
    HOLEM,
    HOLEM_HASER,
    "\u05BB",
    QAMETS_QATAN,
}

PREFIX_RE = re.compile(
    r"^"
    r"(וַ|וָ|וְ|וֵ|וִ|וּ|וֹ)?"
    r"(הַ|הָ|הַֽ|הֶ|בַּ|בָּ|בְּ|בְּ|בַ|בָ|בְ|כַּ|כָּ|כְּ|כְּ|לַ|לָ|לְ|לְּ|מֵ|מִ|מִֽ)?"
    r"(הַ|הָ|הֶ)?"
)


def strip_acc(s: str) -> str:
    return "".join(
        ch
        for ch in s
        if ch not in ACCENT and ch not in "\u05c0\u05c3\u05c6" and ch != METEG
    )


def letters(s: str) -> str:
    return "".join(ch for ch in s if ch in CONS)


def clusters(s: str) -> list[str]:
    s = strip_acc(s).replace(MAQQEF, "")
    out: list[str] = []
    cur = ""
    for ch in s:
        if ch in CONS:
            if cur:
                out.append(cur)
            cur = ch
        else:
            cur += ch
    if cur:
        out.append(cur)
    return out


def kind(cl: str) -> str:
    if QAMETS_QATAN in cl:
        return "qatan"
    vowels = [ch for ch in cl if ch in FULL]
    if QAMETS in cl:
        return "qamets"
    if vowels == [SHEWA]:
        return "shewa"
    if any(v != SHEWA for v in vowels):
        return "full"
    # mater: vav with holem/dagesh (shureq), yod with hireq already in FULL
    if cl[0] == "ו" and ("\u05bc" in cl or HOLEM in cl or HOLEM_HASER in cl):
        return "full"
    if cl[0] == "י" and HIREQ in cl:
        return "full"
    return "none"


def is_onset(cl: str) -> bool:
    return kind(cl) == "none"


def qamets_tags(word: str) -> set[str]:
    tags: set[str] = set()
    if QAMETS_QATAN in word:
        tags.add("hatuf")
    proclitic = MAQQEF in word
    pieces = word.split(MAQQEF) if MAQQEF in word else [word]
    for piece in pieces:
        cls = clusters(piece)
        if not cls:
            continue
        # fold onset-only consonants onto the next cluster
        folded: list[str] = []
        buf = ""
        for cl in cls:
            if is_onset(cl):
                buf += cl
                continue
            folded.append(buf + cl)
            buf = ""
        if buf:
            if folded:
                folded[-1] += buf
            else:
                folded.append(buf)
        vowel_i = [i for i, cl in enumerate(folded) if kind(cl) in {"qamets", "qatan", "full", "shewa"}]
        last_v = vowel_i[-1] if vowel_i else -1
        for i, cl in enumerate(folded):
            k = kind(cl)
            if k not in {"qamets", "qatan"}:
                continue
            if k == "qatan":
                tags.add("hatuf")
                continue
            body = letters("".join(folded))
            # Prefix-stripped כל with qamets is the textbook hatuf (kol, not kāl).
            if body.endswith("כל") and body[-2:] == "כל" and len(body) <= 4 and i == 0:
                tags.add("hatuf")
                continue
            nxt = folded[i + 1] if i + 1 < len(folded) else ""
            closed = False
            if nxt:
                nk = kind(nxt)
                closed = nk == "shewa" or nk == "none"
            else:
                extra_cons = [ch for ch in cl[1:] if ch in CONS]
                he_mater = any(ch == "ה" for ch in extra_cons) and len(extra_cons) == 1
                closed = bool(extra_cons) and not he_mater
            meteg = METEG in cl
            last = i == last_v
            accented = meteg or last
            if proclitic and i == 0 and piece is pieces[0]:
                accented = meteg  # maqqef chain is unaccented unless meteg
            if closed and not accented:
                tags.add("hatuf")
            else:
                tags.add("gadol")
    return tags


def stem(word: str) -> str:
    w = strip_acc(word).replace(MAQQEF, "")
    m = PREFIX_RE.match(w)
    return w[m.end() :] if m else w


def ending_tags(word: str) -> set[str]:
    s = stem(word)
    cons = letters(s)
    tags: set[str] = set()
    if re.search(r"ַיִם$|ָיִם$|ֵיִם$", s) or cons.endswith("ים") and "ַיִ" in s:
        # dual: ay diphthong + mem. Avoid plain hireq-yod-mem.
        if re.search(r"[ַָ]יִם$", s) or re.search(r"ַיִם$", s):
            tags.add("dual")
            return tags
    if re.search(r"ִים$", s) or (cons.endswith("ים") and "ִי" in s):
        tags.add("mp")
        return tags
    if re.search(r"וֹת$|ֹת$", s) or cons.endswith("ות"):
        tags.add("fp")
        return tags
    if re.search(r"ָה$", s) or (cons.endswith("ה") and QAMETS in s[-3:]):
        tags.add("fs")
        return tags
    if re.search(r"ַת$|ֶת$|ִית$", s) or cons.endswith("ת"):
        tags.add("fs")
        return tags
    if cons:
        tags.add("ms")
    return tags


def add_form(bucket: dict, word: str, ref: str, tags: set[str]) -> None:
    w = strip_acc(word)
    row = bucket[w]
    row["n"] += 1
    row["tags"] |= tags
    if ref not in row["refs"] and len(row["refs"]) < 3:
        row["refs"].append(ref)


def main() -> None:
    bucket: dict[str, dict] = defaultdict(lambda: {"n": 0, "tags": set(), "refs": []})
    files = sorted(BOOKS.glob("*.json"))
    tokens = 0
    for path in files:
        book = json.loads(path.read_text())
        bid = book["id"]
        for ch, verses in book["chapters"].items():
            for vs in verses:
                ref = f"{bid}.{ch}.{vs['v']}"
                for raw in vs.get("words") or []:
                    tokens += 1
                    tags = qamets_tags(raw) | ending_tags(raw)
                    add_form(bucket, raw, ref, tags)
    forms = []
    for w, row in bucket.items():
        tags = set(row["tags"])
        n = row["n"]
        keep = bool(tags & {"hatuf", "dual", "fp", "mp", "fs"})
        if "gadol" in tags and n >= 3:
            keep = True
        if "ms" in tags and n >= 5:
            keep = True
        if not keep:
            continue
        forms.append({"w": w, "n": n, "t": sorted(tags), "r": row["refs"]})
    forms.sort(key=lambda x: (-x["n"], x["w"]))
    payload = {"v": 1, "tokens": tokens, "forms": forms}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    counts = defaultdict(int)
    for f in forms:
        for t in f["t"]:
            counts[t] += 1
    print(f"tokens {tokens} unique {len(forms)} → {OUT} ({OUT.stat().st_size // 1024} KB)")
    print("tags", dict(counts))
    # sanity
    for sample in ("חָכְמָה", "כָּל", "דָּבָר", "יָד", "קָרְבָּן"):
        hits = [f for f in forms if letters(f["w"]) == letters(sample)]
        print(sample, [(h["w"], h["t"][:6], h["n"]) for h in hits[:3]])


if __name__ == "__main__":
    main()
