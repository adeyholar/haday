#!/usr/bin/env python3
"""Build offline Strong's lookups and per-verse tags for the Tanakh reader.

Dictionaries: adeyholar/strongs (Open Scriptures). CC-BY-SA on the JSON text.
Verse tags and Hebrew words: pinned data/wlc (haday-hebrew-data v1.2.0,
OSHB morphology CC BY 4.0). English in public/tanakh/books stays the World
English Bible and is joined only by book, chapter, and verse.

Do not fetch openscriptures/morphhb master. Do not run scripts/build-tanakh.py.
"""

from __future__ import annotations

import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEX = ROOT / "public" / "lexicon"
TAGS = ROOT / "public" / "tanakh" / "strongs"
BOOKS = ROOT / "public" / "tanakh" / "books"
ALIGN = ROOT / "public" / "tanakh" / "align"
WLC = ROOT / "data" / "wlc"
GAPS = ROOT / "docs" / "wlc-rebase-verse-gaps.txt"
ALIGN_GAPS = ROOT / "docs" / "wlc-align-count-mismatches.txt"
GRK_URL = "https://raw.githubusercontent.com/adeyholar/strongs/master/greek/strongs-greek-dictionary.js"


def get(url: str) -> str:
    import urllib.request

    with urllib.request.urlopen(url, timeout=120) as res:
        return res.read().decode("utf-8")


def js_object(text: str) -> dict:
    start = text.find("{")
    end = text.rfind("}")
    return json.loads(text[start : end + 1])


def clip(value: object, n: int = 280) -> str:
    import re

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
    for part in str(lemma or "").replace(" ", "/").split("/"):
        digits = "".join(ch for ch in part if ch.isdigit())
        if digits:
            num = str(int(digits))
    return f"H{num}" if num else ""


def pack(lemma: str, morph: str) -> str:
    sid = strong_of(lemma)
    morph = str(morph or "").strip()
    if sid and morph:
        return f"{sid}|{morph}"
    return sid or morph


def read_wlc_chapter(book: str, chapter: str) -> dict | None:
    path = WLC / book / f"{chapter}.json.gz"
    if not path.exists():
        return None
    return json.loads(gzip.decompress(path.read_bytes()))


def written_words(verse: dict) -> list[dict]:
    """Ketiv and ordinary words. A nested qere is not a token on the line."""
    return [word for word in verse.get("words") or [] if word.get("kq_role") != "qere"]


def written_line(words: list[dict]) -> str:
    return "".join((word.get("surface") or "") + (word.get("trailer") or "") for word in words)


def main() -> None:
    LEX.mkdir(parents=True, exist_ok=True)
    TAGS.mkdir(parents=True, exist_ok=True)
    print("dictionaries")
    grk_path = LEX / "strongs-greek.json"
    if grk_path.exists():
        print("greek lexicon already present")
    else:
        grk = compact(js_object(get(GRK_URL)), "G")
        grk_path.write_text(json.dumps(grk, ensure_ascii=False, separators=(",", ":")))
        print(f"greek {len(grk)}")
    print("hebrew chunks: node scripts/split-strongs-hebrew.mjs")

    gaps: list[str] = []
    align_gaps: list[str] = []
    rewritten = 0
    kept = 0
    for path in sorted(BOOKS.glob("*.json")):
        book = path.stem
        dump = json.loads(path.read_text())
        old_tags = {}
        tag_path = TAGS / f"{book}.json"
        if tag_path.exists():
            old_tags = json.loads(tag_path.read_text())
        align = {}
        align_path = ALIGN / f"{book}.json"
        if align_path.exists():
            align = json.loads(align_path.read_text())

        wlc_refs: set[str] = set()
        if (WLC / book).is_dir():
            for chapter_path in sorted((WLC / book).glob("*.json.gz")):
                chapter = json.loads(gzip.decompress(chapter_path.read_bytes()))
                for verse in chapter.get("verses") or []:
                    ref = str(verse.get("ref") or "")
                    if ref:
                        wlc_refs.add(ref)

        out_tags: dict[str, dict[str, list[str]]] = {}
        book_refs: set[str] = set()
        for ch, rows in dump["chapters"].items():
            chapter_tags: dict[str, list[str]] = {}
            wlc = read_wlc_chapter(book, ch)
            by_verse: dict[str, dict] = {}
            if wlc:
                for verse in wlc.get("verses") or []:
                    ref = str(verse.get("ref") or "")
                    parts = ref.split(".")
                    if len(parts) >= 3:
                        by_verse[parts[-1]] = verse
            stamps = ((align.get(ch) or {}).get("words") or [])
            for index, row in enumerate(rows):
                vs = str(row["v"])
                ref = f"{book}.{ch}.{vs}"
                book_refs.add(ref)
                src = by_verse.get(vs)
                if src is None:
                    gaps.append(f"books-only {ref}")
                    kept_words = row.get("words") or []
                    previous = (old_tags.get(ch) or {}).get(vs) or []
                    chapter_tags[vs] = previous if len(previous) == len(kept_words) else [""] * len(kept_words)
                    kept += 1
                    continue
                token_words = written_words(src)
                surfaces = [word.get("surface") or "" for word in token_words]
                line = written_line(token_words)
                if line != (src.get("text") or ""):
                    gaps.append(f"line-mismatch {ref}")
                row["words"] = surfaces
                row["he"] = line
                chapter_tags[vs] = [pack(word.get("lemma") or "", word.get("morph") or "") for word in token_words]
                rewritten += 1
                if index < len(stamps) and len(stamps[index]) != len(surfaces):
                    align_gaps.append(f"{ref} align {len(stamps[index])} words {len(surfaces)}")
            for vs, verse in by_verse.items():
                ref = str(verse.get("ref") or f"{book}.{ch}.{vs}")
                if ref not in book_refs:
                    gaps.append(f"wlc-only {ref}")
            out_tags[ch] = chapter_tags
        for ref in sorted(wlc_refs):
            if ref not in book_refs:
                # Recorded above per chapter when the chapter file exists.
                # A whole missing chapter still needs a line.
                parts = ref.split(".")
                if len(parts) >= 2 and parts[1] not in dump["chapters"]:
                    gaps.append(f"wlc-only {ref}")
        path.write_text(json.dumps(dump, ensure_ascii=False, separators=(",", ":")))
        tag_path.write_text(json.dumps(out_tags, ensure_ascii=False, separators=(",", ":")))
        print("tags", book, "rewritten-in-progress")

    # De-duplicate gap lines (per-verse loop and the chapter sweep can overlap).
    seen: set[str] = set()
    unique_gaps: list[str] = []
    for line in gaps:
        if line in seen:
            continue
        seen.add(line)
        unique_gaps.append(line)
    GAPS.write_text(
        "\n".join(
            [
                f"verses rewritten {rewritten}",
                f"books-only kept {kept}",
                f"gap lines {len(unique_gaps)}",
                *unique_gaps,
                "",
            ]
        )
    )
    ALIGN_GAPS.write_text(
        "\n".join(
            [
                f"align word-count mismatches {len(align_gaps)}",
                "Existing verse-level fallback in src/lib/reading.ts re-spaces these. Timestamps were not invented.",
                *align_gaps,
                "",
            ]
        )
    )
    print(f"verses rewritten {rewritten} books-only {kept} gaps {len(unique_gaps)} align-mismatches {len(align_gaps)}")


if __name__ == "__main__":
    main()
