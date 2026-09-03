#!/usr/bin/env python3
"""Build per-book Tanakh JSON (Hebrew WLC + WEB English) for HaDay reading."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path("/workspace")
OUT_DIR = ROOT / "public" / "tanakh" / "books"
CATALOG_OUT = ROOT / "src" / "lib" / "tanakh-catalog.json"
AUDIO_MAP_OUT = ROOT / "src" / "lib" / "tanakh-audio-map.json"

HE_URL = "https://raw.githubusercontent.com/adeyholar/tanakh_ai_tutor/main/data/tanakh/hebrew_bible_with_nikkud.json"
WEB_BASE = "https://raw.githubusercontent.com/TehShrike/world-english-bible/master/json"

BOOKS = [
    ("Gen", "Genesis", "בְּרֵאשִׁית", "torah", 50, "genesis"),
    ("Exod", "Exodus", "שְׁמוֹת", "torah", 40, "exodus"),
    ("Lev", "Leviticus", "וַיִּקְרָא", "torah", 27, "leviticus"),
    ("Num", "Numbers", "בְּמִדְבַּר", "torah", 36, "numbers"),
    ("Deut", "Deuteronomy", "דְּבָרִים", "torah", 34, "deuteronomy"),
    ("Josh", "Joshua", "יְהוֹשֻׁעַ", "neviim", 24, "joshua"),
    ("Judg", "Judges", "שׁוֹפְטִים", "neviim", 21, "judges"),
    ("1Sam", "1 Samuel", "שְׁמוּאֵל א", "neviim", 31, "1samuel"),
    ("2Sam", "2 Samuel", "שְׁמוּאֵל ב", "neviim", 24, "2samuel"),
    ("1Kgs", "1 Kings", "מְלָכִים א", "neviim", 22, "1kings"),
    ("2Kgs", "2 Kings", "מְלָכִים ב", "neviim", 25, "2kings"),
    ("Isa", "Isaiah", "יְשַׁעְיָהוּ", "neviim", 66, "isaiah"),
    ("Jer", "Jeremiah", "יִרְמְיָהוּ", "neviim", 52, "jeremiah"),
    ("Ezek", "Ezekiel", "יְחֶזְקֵאל", "neviim", 48, "ezekiel"),
    ("Hos", "Hosea", "הוֹשֵׁעַ", "neviim", 14, "hosea"),
    ("Joel", "Joel", "יוֹאֵל", "neviim", 4, "joel"),
    ("Amos", "Amos", "עָמוֹס", "neviim", 9, "amos"),
    ("Obad", "Obadiah", "עֹבַדְיָה", "neviim", 1, "obadiah"),
    ("Jonah", "Jonah", "יוֹנָה", "neviim", 4, "jonah"),
    ("Mic", "Micah", "מִיכָה", "neviim", 7, "micah"),
    ("Nah", "Nahum", "נַחוּם", "neviim", 3, "nahum"),
    ("Hab", "Habakkuk", "חֲבַקּוּק", "neviim", 3, "habakkuk"),
    ("Zeph", "Zephaniah", "צְפַנְיָה", "neviim", 3, "zephaniah"),
    ("Hag", "Haggai", "חַגַּי", "neviim", 2, "haggai"),
    ("Zech", "Zechariah", "זְכַרְיָה", "neviim", 14, "zechariah"),
    ("Mal", "Malachi", "מַלְאָכִי", "neviim", 3, "malachi"),
    ("Ps", "Psalms", "תְּהִלִּים", "ketuvim", 150, "psalms"),
    ("Prov", "Proverbs", "מִשְׁלֵי", "ketuvim", 31, "proverbs"),
    ("Job", "Job", "אִיּוֹב", "ketuvim", 42, "job"),
    ("Song", "Song of Songs", "שִׁיר הַשִּׁירִים", "ketuvim", 8, "songofsolomon"),
    ("Ruth", "Ruth", "רוּת", "ketuvim", 4, "ruth"),
    ("Lam", "Lamentations", "אֵיכָה", "ketuvim", 5, "lamentations"),
    ("Eccl", "Ecclesiastes", "קֹהֶלֶת", "ketuvim", 12, "ecclesiastes"),
    ("Esth", "Esther", "אֶסְתֵּר", "ketuvim", 10, "esther"),
    ("Dan", "Daniel", "דָּנִיֵּאל", "ketuvim", 12, "daniel"),
    ("Ezra", "Ezra", "עֶזְרָא", "ketuvim", 10, "ezra"),
    ("Neh", "Nehemiah", "נְחֶמְיָה", "ketuvim", 13, "nehemiah"),
    ("1Chr", "1 Chronicles", "דִּבְרֵי הַיָּמִים א", "ketuvim", 29, "1chronicles"),
    ("2Chr", "2 Chronicles", "דִּבְרֵי הַיָּמִים ב", "ketuvim", 36, "2chronicles"),
]

AUDIO_FILES = {
    "Gen": "01-Gen_{ch:02d}.mp3",
    "Exod": "02-Exo_{ch:02d}.mp3",
    "Lev": "03-Lev_{ch:02d}.mp3",
    "Num": "04-Num_{ch:02d}.mp3",
    "Deut": "05-Deut_{ch:02d}.mp3",
    "Josh": "06-Josh_{ch:02d}.mp3",
    "Judg": "07-Judg_{ch:02d}.mp3",
    "1Sam": "08-1Sam_{ch:02d}.mp3",
    "2Sam": "09-2Sam_{ch:02d}.mp3",
    "1Kgs": "10-1Kgs_{ch:02d}.mp3",
    "2Kgs": "11-2Kgs_{ch:02d}.mp3",
    "Isa": "12-Isa_{ch:02d}.mp3",
    "Jer": "13-Jer_{ch:02d}.mp3",
    "Ezek": "14-Ezek_{ch:02d}.mp3",
    "Hos": "15-Hosea_{ch:02d}.mp3",
    "Joel": "16-Joel_{ch:02d}.mp3",
    "Amos": "17-Amos_{ch:02d}.mp3",
    "Obad": "18-Obad.mp3",
    "Jonah": "19-Jonah_{ch:02d}.mp3",
    "Mic": "20-Micha_{ch:02d}.mp3",
    "Nah": "21-Nahum_{ch:02d}.mp3",
    "Hab": "22-Habak_{ch:02d}.mp3",
    "Zeph": "23-Zeph_{ch:02d}.mp3",
    "Hag": "24-Haggai_{ch:02d}.mp3",
    "Zech": "25-Zech_{ch:02d}.mp3",
    "Mal": "26-Malachi_{ch:02d}.mp3",
    "Ps": "27-Psa_{ch:03d}.mp3",
    "Job": "28-Job_{ch:02d}.mp3",
    "Prov": "29-Prov_{ch:02d}.mp3",
    "Ruth": "30-Ruth_{ch:02d}.mp3",
    "Song": "31-Song_{ch:02d}.mp3",
    "Eccl": "32-Eccles_{ch:02d}.mp3",
    "Lam": "33-Lamen_{ch:02d}.mp3",
    "Esth": "34-Esther_{ch:02d}.mp3",
    "Dan": "35-Daniel_{ch:02d}.mp3",
    "Ezra": "36-Ezra_{ch:02d}.mp3",
    "Neh": "37-Nehem_{ch:02d}.mp3",
    "1Chr": "38-1Chron_{ch:02d}.mp3",
    "2Chr": "39-2Chron_{ch:02d}.mp3",
}

MARKER = re.compile(r"^[\s{פס}]+$")
HE_LETTER = re.compile(r"[\u05D0-\u05EA]")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "HaDayTanakhBuilder/1.0"})
    with urllib.request.urlopen(req, timeout=120) as res:
        return res.read()


def clean_word(w: str) -> str:
    w = w.strip().replace("\u05c3", "")  # sof pasuq
    w = w.strip("׃")
    return w


def clean_words(words: list[str]) -> list[str]:
    out: list[str] = []
    for raw in words:
        w = clean_word(str(raw))
        if not w or not HE_LETTER.search(w):
            continue
        if w in ("פ", "ס", "{פ}", "{ס}", "פ}", "{פ", "ס}", "{ס"):
            continue
        out.append(w)
    return out


def web_verses(blob: list[dict]) -> dict[tuple[int, int], str]:
    verses: dict[tuple[int, int], list[str]] = {}
    for item in blob:
        if not isinstance(item, dict):
            continue
        if "value" not in item:
            continue
        c = item.get("chapterNumber")
        v = item.get("verseNumber")
        val = item.get("value")
        if not isinstance(c, int) or not isinstance(v, int) or not isinstance(val, str):
            continue
        verses.setdefault((c, v), []).append(val)
    return {k: re.sub(r"\s+", " ", " ".join(parts)).strip() for k, parts in verses.items()}


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Downloading Hebrew Tanakh…")
    he = json.loads(fetch(HE_URL).decode("utf-8"))
    catalog = []
    audio_map: dict[str, dict[str, str]] = {}
    for bid, en, he_name, section, chapters, web_name in BOOKS:
        print(f"  {bid}…")
        book_he = he.get(bid)
        if not isinstance(book_he, list):
            raise SystemExit(f"Missing Hebrew book {bid}")
        web = json.loads(fetch(f"{WEB_BASE}/{web_name}.json").decode("utf-8"))
        en_map = web_verses(web)
        chs: dict[str, list[dict]] = {}
        files: dict[str, str] = {}
        n_ch = min(chapters, len(book_he))
        for i in range(n_ch):
            raw_verses = book_he[i]
            if not isinstance(raw_verses, list):
                continue
            rows = []
            for vi, verse in enumerate(raw_verses, start=1):
                if isinstance(verse, list):
                    words = clean_words([str(x) for x in verse])
                elif isinstance(verse, str):
                    words = clean_words(verse.split())
                else:
                    continue
                if not words:
                    continue
                rows.append(
                    {
                        "v": vi,
                        "he": " ".join(words),
                        "en": en_map.get((i + 1, vi), ""),
                        "words": words,
                    }
                )
            if rows:
                chs[str(i + 1)] = rows
            tmpl = AUDIO_FILES[bid]
            files[str(i + 1)] = "18-Obad.mp3" if bid == "Obad" else tmpl.format(ch=i + 1)
        payload = {
            "id": bid,
            "en": en,
            "he": he_name,
            "section": section,
            "heSource": "Westminster Leningrad Codex (public domain).",
            "enSource": "World English Bible (public domain).",
            "chapters": chs,
        }
        (OUT_DIR / f"{bid}.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        catalog.append(
            {
                "id": bid,
                "en": en,
                "he": he_name,
                "section": section,
                "chapters": len(chs),
                "verses": sum(len(v) for v in chs.values()),
            }
        )
        audio_map[bid] = files
        print(f"    {len(chs)} chapters, {sum(len(v) for v in chs.values())} verses")
    CATALOG_OUT.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    AUDIO_MAP_OUT.write_text(json.dumps({"files": audio_map}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("Wrote", CATALOG_OUT)
    print("Wrote", AUDIO_MAP_OUT)
    print("Books in", OUT_DIR)


if __name__ == "__main__":
    main()
