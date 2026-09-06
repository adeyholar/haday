#!/usr/bin/env python3
"""Citation-form clips from Eliran Wong lex_ files, keyed by BHSA word index — not WLC order."""
from __future__ import annotations

import json
import re
import subprocess
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/audio/vocab"
CSV = Path("/tmp/lexshop/bhs-strong.csv")
ZIP_DIR = Path("/tmp/lexshop/eliran-zips")
UA = "HaDay/1.0 (BIBL 630 class app; https://github.com/adeyholar/haday)"
CONS = {chr(c) for c in range(0x05D0, 0x05EB)}
PREFIX = set("בכלהומש")
SKIP_IDS = {"ha", "we", "be", "ke", "le", "she"}
CANON = [
    "Gen", "Exod", "Lev", "Num", "Deut",
    "Josh", "Judg", "1Sam", "2Sam", "1Kgs", "2Kgs",
    "Isa", "Jer", "Ezek",
    "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab", "Zeph", "Hag", "Zech", "Mal",
    "Ps", "Prov", "Job", "Song", "Ruth", "Lam", "Eccl", "Esth", "Dan", "Ezra", "Neh", "1Chr", "2Chr",
]
BOOK_NO = {b: i + 1 for i, b in enumerate(CANON)}
GEN_ZIPS = [
    "01_Genesis_1-7.zip",
    "01_Genesis_8-14.zip",
    "01_Genesis_15-21.zip",
    "01_Genesis_22-28.zip",
    "01_Genesis_29-35.zip",
    "01_Genesis_36-42.zip",
    "01_Genesis_43-49.zip",
    "01_Genesis_50.zip",
]
ZIP_BASE = "https://github.com/eliranwong/MP3_BHS5_word-by-word/raw/main/"


def cons(s: str) -> str:
    return "".join(ch for ch in unicodedata.normalize("NFC", s) if ch in CONS)


def parse_vocab() -> list[tuple[str, str, str]]:
    text = (ROOT / "src/lib/vocab.ts").read_text()
    start = text.index("export const VOCAB")
    end = text.index("export const CHAPTERS")
    items = []
    for block in re.findall(r"\{[^{}]+\}", text[start:end]):
        hid = re.search(r'id: "([^"]+)"', block)
        he = re.search(r'hebrew: "([^"]+)"', block)
        if not hid or not he or hid.group(1) in SKIP_IDS:
            continue
        items.append((hid.group(1), he.group(1), cons(he.group(1))))
    return items


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as res, dest.open("wb") as f:
        while True:
            chunk = res.read(256 * 1024)
            if not chunk:
                break
            f.write(chunk)


def ensure_csv() -> None:
    if CSV.exists() and CSV.stat().st_size > 1_000_000:
        return
    url = "https://raw.githubusercontent.com/eliranwong/OpenHebrewBible/master/002-BHS-with-Strong-no/BHS-with-Strong-no.csv"
    print("download BHS-Strong map")
    download(url, CSV)


def bhsa_hits() -> dict[str, tuple[str, int, int, int, int, str]]:
    """lemma id -> (book, ch, v, word_in_verse, bhs_sort, hebrew)."""
    counts = json.loads((ROOT / "src/lib/tanakh-verse-counts.json").read_text())
    by_cons: dict[str, list[str]] = {}
    heb_of: dict[str, str] = {}
    for hid, heb, c in parse_vocab():
        by_cons.setdefault(c, []).append(hid)
        heb_of[hid] = heb
    hits: dict[str, tuple[str, int, int, int, int, str]] = {}
    book_i = ch = v = 1
    wi = 0
    with CSV.open(encoding="utf-8") as f:
        next(f)
        for line in f:
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            try:
                sort_id = int(parts[0])
            except ValueError:
                continue
            m = re.search(r"<H>(.*?)<h>", parts[1])
            if not m:
                continue
            he = m.group(1)
            wi += 1
            if book_i > len(CANON):
                break
            book = CANON[book_i - 1]
            c = cons(he)
            if c and not (len(c) == 1 and c in PREFIX):
                for hid in by_cons.get(c, []):
                    hits.setdefault(hid, (book, ch, v, wi, sort_id, he))
            if "׃" in line:
                vmax = counts[book][ch - 1]
                wi = 0
                if v < vmax:
                    v += 1
                elif ch < len(counts[book]):
                    ch += 1
                    v = 1
                else:
                    book_i += 1
                    ch = 1
                    v = 1
    return hits


def zip_for(book: str, ch: int) -> str | None:
    if book != "Gen":
        return None
    for name in GEN_ZIPS:
        m = re.search(r"Genesis_(\d+)(?:-(\d+))?\.zip$", name)
        if not m:
            continue
        a = int(m.group(1))
        b = int(m.group(2) or m.group(1))
        if a <= ch <= b:
            return name
    return None


def main() -> None:
    ensure_csv()
    hits = bhsa_hits()
    gen = {k: v for k, v in hits.items() if v[0] == "Gen"}
    print(f"hits {len(hits)} genesis {len(gen)}")
    needed = {zip_for(b, c) for b, c, *_rest in gen.values()}
    needed.discard(None)
    ZIP_DIR.mkdir(parents=True, exist_ok=True)
    extracted = Path("/tmp/lexshop/eliran-gen")
    extracted.mkdir(parents=True, exist_ok=True)
    for name in sorted(needed):
        zpath = ZIP_DIR / name
        if not zpath.exists() or zpath.stat().st_size < 1000:
            print("download", name)
            download(ZIP_BASE + name, zpath)
        print("unzip", name)
        subprocess.run(["unzip", "-qo", str(zpath), "-d", str(extracted)], check=False)

    index: dict[int, Path] = {}
    for p in extracted.rglob("lex_BHS5_1_*.mp3"):
        m = re.search(r"lex_BHS5_1_\d+_\d+_(\d+)\.mp3$", p.name)
        if m:
            index[int(m.group(1))] = p

    OUT.mkdir(parents=True, exist_ok=True)
    chosen: dict[str, dict] = {}
    for hid, (book, ch, v, wi, sort_id, he) in gen.items():
        src = index.get(sort_id)
        if not src or not src.exists():
            continue
        dest = OUT / f"{hid}.mp3"
        dest.write_bytes(src.read_bytes())
        if dest.stat().st_size < 800:
            dest.unlink()
            continue
        chosen[hid] = {
            "src": f"/audio/vocab/{hid}.mp3",
            "start": 0,
            "end": 0,
            "he": he,
            "kind": "lemma",
            "source": "eliran",
            "credit": "Open Hebrew Bible Project (Eliran Wong), CC BY-NC 4.0",
            "book": "Gen",
            "ch": ch,
            "v": v,
        }

    keep = {f"{hid}.mp3" for hid in chosen}
    keep.add("CREDIT.txt")
    for p in OUT.iterdir():
        if p.is_file() and p.name not in keep:
            p.unlink()

    (OUT / "CREDIT.txt").write_text(
        "Isolated Hebrew lexeme audio from Open Hebrew Bible Project by Eliran Wong,\n"
        "CC BY-NC 4.0. https://github.com/eliranwong/MP3_BHS5_word-by-word\n"
        "Matched to BBH citation form via BHS word index (not a verse excerpt).\n",
        encoding="utf-8",
    )
    (ROOT / "src/lib/vocab-clips.json").write_text(
        json.dumps(chosen, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"eliran clips {len(chosen)} / genesis hits {len(gen)}")
    missing = [hid for hid in gen if hid not in chosen]
    print("no file", missing[:20], "count", len(missing))


if __name__ == "__main__":
    main()
