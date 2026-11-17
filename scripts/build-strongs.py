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
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEX = ROOT / "public" / "lexicon"
TAGS = ROOT / "public" / "tanakh" / "strongs"
BOOKS = ROOT / "public" / "tanakh" / "books"
ALIGN = ROOT / "public" / "tanakh" / "align"
WLC = ROOT / "data" / "wlc"
GAPS = ROOT / "docs" / "wlc-rebase-verse-gaps.txt"
ALIGN_GAPS = ROOT / "docs" / "wlc-align-count-mismatches.txt"
OVERRIDES = ROOT / "data" / "lemma-overrides.json"
NOTES = ROOT / "public" / "tanakh" / "ketiv-qere.json"
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


PART = re.compile(r"^(\d+)(?:\s+[a-z])?\+?$")
PREFIX = re.compile(r"^[bcdiklms]$")


def strong_parts(lemma: str) -> list[str]:
    out = []
    for segment in str(lemma or "").split("/"):
        piece = segment.strip()
        if not piece or PREFIX.fullmatch(piece):
            continue
        match = PART.fullmatch(piece)
        if match:
            out.append(str(int(match.group(1))))
    return out


def qere_content_numbers(qere: list[dict] | None) -> list[str]:
    out: list[str] = []
    for item in qere or []:
        out.extend(strong_parts(item.get("lemma") or ""))
    return out


def ketiv_qere_numbers(words: list[dict], index: int) -> list[str] | None:
    """Every qere number that counts for this ketiv. An empty qere uses the adjacent ketiv."""
    word = words[index]
    if word.get("kq_role") != "ketiv":
        return None
    own = word.get("qere") or []
    if own:
        return qere_content_numbers(own)
    nums: list[str] = []
    if index > 0 and words[index - 1].get("kq_role") == "ketiv":
        nums.extend(qere_content_numbers(words[index - 1].get("qere")))
    if index + 1 < len(words) and words[index + 1].get("kq_role") == "ketiv":
        nums.extend(qere_content_numbers(words[index + 1].get("qere")))
    return nums


def load_overrides() -> dict[tuple[str, int], dict]:
    raw = json.loads(OVERRIDES.read_text())
    return {(row["ref"], int(row["index"])): row for row in raw["overrides"]}


def read_surfaces(word: dict | None) -> str:
    if not word or word.get("kq_role") != "ketiv":
        return ""
    return " ".join(item.get("surface") or "" for item in (word.get("qere") or []) if item.get("surface"))


def ketiv_read_surface(words: list[dict], index: int) -> str:
    """Own qere, else the next ketiv's qere, else the previous. Same rule as src/lib/ketiv-qere.ts."""
    word = words[index] if 0 <= index < len(words) else None
    if not word or word.get("kq_role") != "ketiv":
        return ""
    own = read_surfaces(word)
    if own:
        return own
    if index + 1 < len(words):
        nxt = read_surfaces(words[index + 1])
        if nxt:
            return nxt
    if index > 0:
        return read_surfaces(words[index - 1])
    return ""


def ketiv_display(words: list[dict], index: int) -> dict[str, str] | None:
    """The read form, with the written form noted, when they differ. No note when no read form exists."""
    word = words[index]
    if word.get("kq_role") != "ketiv":
        return None
    q = ketiv_read_surface(words, index)
    if not q:
        return None
    k = word.get("surface") or ""
    if q == k:
        return None
    return {"q": q, "k": k}


def pack(
    lemma: str,
    morph: str,
    qere_nums: list[str] | None = None,
    override: dict | None = None,
) -> str:
    """One Strong’s number, then the morph. Two numbers, a ketiv whose number is not in the qere, or an override with no lemma, leave the morph only."""
    morph = str(morph or "").strip()
    if override is not None and override.get("grammar") is None and override.get("scripture") is None:
        return morph
    parts = strong_parts(lemma)
    if len(parts) != 1:
        return morph
    if qere_nums is not None and parts[0] not in qere_nums:
        return morph
    sid = f"H{parts[0]}"
    return f"{sid}|{morph}" if morph else sid


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
    overrides = load_overrides()
    notes: dict[str, dict[str, dict[str, str]]] = {}
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
                chapter_tags[vs] = [
                    pack(
                        word.get("lemma") or "",
                        word.get("morph") or "",
                        ketiv_qere_numbers(token_words, word_index),
                        overrides.get((ref, word_index)),
                    )
                    for word_index, word in enumerate(token_words)
                ]
                verse_notes: dict[str, dict[str, str]] = {}
                for word_index, word in enumerate(token_words):
                    shown = ketiv_display(token_words, word_index)
                    if shown:
                        verse_notes[str(word_index)] = shown
                if verse_notes:
                    notes[ref] = verse_notes
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

    NOTES.write_text(json.dumps(notes, ensure_ascii=False, separators=(",", ":"), sort_keys=True))
    print(f"ketiv notes {sum(len(row) for row in notes.values())}")
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
