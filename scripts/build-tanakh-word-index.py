#!/usr/bin/env python3
"""Verse lists for each folded Hebrew spelling in the Tanakh.

Search expands a typed word with proclitics and wayyiqtol prefixes at query
time. This file stores exact spellings only — not guessed roots.
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "public" / "tanakh" / "books"
CATALOG = ROOT / "src" / "lib" / "tanakh-catalog.json"
OUT = ROOT / "public" / "tanakh" / "word-index.json"

CONS = {chr(i) for i in range(0x05D0, 0x05EB)}
FINALS = str.maketrans({"ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ"})
MAQQEF = "\u05BE"


def letter_key(s: str) -> str:
    return "".join(ch for ch in s if ch in CONS).translate(FINALS)


def main() -> None:
    catalog = json.loads(CATALOG.read_text())
    bucket: dict[str, dict] = defaultdict(lambda: {"n": 0, "refs": []})
    tokens = 0
    for bid in [b["id"] for b in catalog]:
        path = BOOKS / f"{bid}.json"
        if not path.exists():
            print("missing", bid)
            continue
        book = json.loads(path.read_text())
        for ch, verses in book["chapters"].items():
            for vs in verses:
                ref = f"{bid}.{ch}.{vs['v']}"
                verse_keys: set[str] = set()
                for raw in vs.get("words") or []:
                    for part in raw.replace(MAQQEF, " ").split():
                        tokens += 1
                        cons = letter_key(part)
                        if len(cons) >= 2:
                            verse_keys.add(cons)
                for key in verse_keys:
                    row = bucket[key]
                    row["n"] += 1
                    row["refs"].append(ref)

    entries = {key: {"n": row["n"], "r": row["refs"]} for key, row in bucket.items()}
    payload = {"v": 1, "tokens": tokens, "e": entries}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    print(f"keys {len(entries)} tokens {tokens} bytes {OUT.stat().st_size}")
    for sample in ("אמר", "ויאמר", "ארצ", "הארצ", "משה", "יהוה", "אלהימ", "בראשית"):
        row = entries.get(sample)
        if not row:
            print("miss", sample)
            continue
        print(sample, "n", row["n"], "first", row["r"][:3])


if __name__ == "__main__":
    main()
