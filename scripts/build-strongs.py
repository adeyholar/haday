#!/usr/bin/env python3
"""Build offline Strong's lookups and per-verse tags for the Tanakh reader.

Dictionaries: adeyholar/strongs (Open Scriptures). CC-BY-SA on the JSON text.
Verse tags: Open Scriptures Hebrew Bible morphology (CC BY 4.0), lemma numbers only.
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEX = ROOT / "public" / "lexicon"
TAGS = ROOT / "public" / "tanakh" / "strongs"
BOOKS = ROOT / "public" / "tanakh" / "books"
HEB_URL = "https://raw.githubusercontent.com/adeyholar/strongs/master/hebrew/strongs-hebrew-dictionary.js"
GRK_URL = "https://raw.githubusercontent.com/adeyholar/strongs/master/greek/strongs-greek-dictionary.js"
WLC = "https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/{}.xml"

CONS = re.compile(r"[\u05d0-\u05ea]")


def get(url: str) -> str:
    with urllib.request.urlopen(url, timeout=120) as res:
        return res.read().decode("utf-8")


def js_object(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}")
    return json.loads(text[start : end + 1])


def clip(value: object, n: int = 280) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    text = text.replace("{", "").replace("}", "")
    if len(text) > n:
        return text[: n - 1].rstrip() + "…"
    return text


def compact(raw: dict, kind: str) -> dict:
    out = {}
    for key, row in raw.items():
        if not isinstance(row, dict):
            continue
        num = "".join(ch for ch in key if ch.isdigit())
        if not num:
            continue
        ident = f"{kind}{int(num)}"
        word = row.get("lemma") or ""
        translit = row.get("xlit") or row.get("translit") or ""
        pron = row.get("pron") or translit
        out[ident] = {
            "w": clip(word, 80),
            "x": clip(translit, 80),
            "p": clip(pron, 80),
            "d": clip(row.get("strongs_def") or "", 220),
            "k": clip(row.get("kjv_def") or "", 180),
            "r": clip(row.get("derivation") or "", 160),
        }
    return out


def strong_of(lemma: str) -> str:
    num = ""
    for part in lemma.replace(" ", "/").split("/"):
        digits = "".join(ch for ch in part if ch.isdigit())
        if digits:
            num = str(int(digits))
    return f"H{num}" if num else ""


def cons(text: str) -> str:
    return "".join(CONS.findall(text))


def verse_tags(oshb: list[tuple[str, str]], ours: list[str]) -> list[str]:
    if len(oshb) == len(ours):
        return [strong_of(lem) for lem, _word in oshb]
    out: list[str] = []
    i = 0
    for word in ours:
        want = cons(word)
        if not want or i >= len(oshb):
            out.append("")
            continue
        got = ""
        chosen = ""
        start = i
        while i < len(oshb) and len(got) < len(want):
            lem, surface = oshb[i]
            got += cons(surface)
            sid = strong_of(lem)
            if sid:
                chosen = sid
            i += 1
        if got == want:
            out.append(chosen)
        else:
            out.append("")
            i = start + 1
    return out


def wlc_verses(xml: str) -> dict[str, dict[str, list[tuple[str, str]]]]:
    chapters: dict[str, dict[str, list[tuple[str, str]]]] = {}
    for verse in re.finditer(r'<verse\b[^>]*osisID="([A-Za-z0-9]+)\.(\d+)\.(\d+)"[^>]*>(.*?)</verse>', xml, re.S):
        _book, ch, vs, body = verse.groups()
        words = []
        for attrs, surface in re.findall(r"<w\b([^>]*)>(.*?)</w>", body, re.S):
            lem = re.search(r'lemma="([^"]*)"', attrs)
            surface = re.sub(r"<[^>]+>", "", surface)
            words.append((lem.group(1) if lem else "", surface))
        chapters.setdefault(ch, {})[vs] = words
    return chapters


def main() -> None:
    LEX.mkdir(parents=True, exist_ok=True)
    TAGS.mkdir(parents=True, exist_ok=True)
    print("dictionaries")
    heb = compact(js_object(get(HEB_URL)), "H")
    grk = compact(js_object(get(GRK_URL)), "G")
    (LEX / "strongs-hebrew.json").write_text(json.dumps(heb, ensure_ascii=False, separators=(",", ":")))
    (LEX / "strongs-greek.json").write_text(json.dumps(grk, ensure_ascii=False, separators=(",", ":")))
    print(f"hebrew {len(heb)} greek {len(grk)}")

    matched = 0
    missed = 0
    for path in sorted(BOOKS.glob("*.json")):
        book = path.stem
        print("tags", book)
        xml = get(WLC.format(book))
        oshb = wlc_verses(xml)
        dump = json.loads(path.read_text())
        out: dict[str, dict[str, list[str]]] = {}
        for ch, rows in dump["chapters"].items():
            chapter: dict[str, list[str]] = {}
            for row in rows:
                vs = str(row["v"])
                ours = row.get("words") or []
                src = oshb.get(ch, {}).get(vs, [])
                tags = verse_tags(src, ours)
                if len(tags) == len(ours) and any(tags):
                    matched += 1
                else:
                    missed += 1
                chapter[vs] = tags
            out[ch] = chapter
        (TAGS / f"{book}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
    print(f"verses tagged {matched} weak {missed}")


if __name__ == "__main__":
    main()
