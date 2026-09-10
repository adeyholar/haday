#!/usr/bin/env python3
"""Scan Masoretic Tanakh dumps into a compact admin query index.

Tags follow class rules (endings, shewa, qamets, surface verb person), not a commercial lexicon.
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
HATEPH_SEGOL = "\u05B1"
HATEPH_PATAH = "\u05B2"
HATEPH_QAMETS = "\u05B3"
METEG = "\u05BD"
MAQQEF = "\u05BE"
HOLEM = "\u05B9"
HOLEM_HASER = "\u05BA"
HIREQ = "\u05B4"
TSERE = "\u05B5"
SEGOL = "\u05B6"
PATHACH = "\u05B7"
QIBBUTS = "\u05BB"
DAGESH = "\u05BC"
ACCENT = {chr(i) for i in range(0x0591, 0x05B0)}
CONS = {chr(i) for i in range(0x05D0, 0x05EB)}
FULL = {
    SHEWA,
    HATEPH_SEGOL,
    HATEPH_PATAH,
    HATEPH_QAMETS,
    HIREQ,
    TSERE,
    SEGOL,
    PATHACH,
    QAMETS,
    HOLEM,
    HOLEM_HASER,
    QIBBUTS,
    QAMETS_QATAN,
}
SHORT = {PATHACH, SEGOL, HIREQ, QIBBUTS, QAMETS_QATAN}
LONG = {TSERE, HOLEM, HOLEM_HASER}
HATEPH = {HATEPH_SEGOL, HATEPH_PATAH, HATEPH_QAMETS}

PREFIX_RE = re.compile(
    r"^"
    r"(וַ|וָ|וְ|וֵ|וִ|וּ|וֹ)?"
    r"(הַ|הָ|הַֽ|הֶ|בַּ|בָּ|בְּ|בְּ|בַ|בָ|בְ|כַּ|כָּ|כְּ|כְּ|לַ|לָ|לְ|לְּ|מֵ|מִ|מִֽ)?"
    r"(הַ|הָ|הֶ)?"
)

KEEP_ALWAYS = {
    "hatuf",
    "dual",
    "fp",
    "mp",
    "fs",
    "shewaPair",
    "shewaVocal",
    "shewaSilent",
    "wayy",
    "v3ms",
    "v3fs",
    "v2ms",
    "v2fs",
    "v3mp",
    "v2mp",
    "v2fp",
    "v1cs",
    "v1cp",
    "hateph",
    "cst",
    "qal",
    "piel",
    "pual",
    "niphal",
    "hiphil",
    "hophal",
    "hithpael",
    "qatal",
    "yiqtol",
    "weqatal",
    "infcst",
    "pron",
    "ptcp",
    "impv",
}


def strip_acc(s: str) -> str:
    return "".join(
        ch for ch in s if ch not in ACCENT and ch not in "\u05c0\u05c3\u05c6" and ch != METEG
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
    if any(ch in HATEPH for ch in cl):
        return "hateph"
    if QAMETS in cl:
        return "qamets"
    if vowels == [SHEWA]:
        return "shewa"
    if any(v != SHEWA for v in vowels):
        return "full"
    if cl[0] == "ו" and (DAGESH in cl or HOLEM in cl or HOLEM_HASER in cl):
        return "full"
    if cl[0] == "י" and HIREQ in cl:
        return "full"
    return "none"


def is_onset(cl: str) -> bool:
    return kind(cl) == "none"


def fold_clusters(piece: str) -> list[str]:
    cls = clusters(piece)
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
    return folded


def prev_length(cl: str) -> str:
    """short | long | shewa | other — for the shewa rule."""
    if QAMETS_QATAN in cl:
        return "short"
    if any(ch in SHORT for ch in cl) and QAMETS not in cl:
        return "short"
    if any(ch in LONG for ch in cl):
        return "long"
    if QAMETS in cl:
        return "long"
    if kind(cl) == "shewa":
        return "shewa"
    if kind(cl) == "hateph":
        return "short"
    return "other"


def qamets_tags(word: str) -> set[str]:
    tags: set[str] = set()
    if QAMETS_QATAN in word:
        tags.add("hatuf")
    proclitic = MAQQEF in word
    pieces = word.split(MAQQEF) if MAQQEF in word else [word]
    for p_i, piece in enumerate(pieces):
        folded = fold_clusters(piece)
        if not folded:
            continue
        vowel_i = [i for i, cl in enumerate(folded) if kind(cl) in {"qamets", "qatan", "full", "shewa", "hateph"}]
        last_v = vowel_i[-1] if vowel_i else -1
        for i, cl in enumerate(folded):
            k = kind(cl)
            if k not in {"qamets", "qatan"}:
                continue
            if k == "qatan":
                tags.add("hatuf")
                continue
            body = letters("".join(folded))
            if body.endswith("כל") and len(body) <= 4 and i == 0:
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
            if proclitic and i == 0 and p_i == 0:
                accented = meteg
            if closed and not accented:
                tags.add("hatuf")
            else:
                tags.add("gadol")
    return tags


def shewa_tags(word: str) -> set[str]:
    tags: set[str] = set()
    if any(ch in HATEPH for ch in word):
        tags.add("hateph")
    folded = fold_clusters(word.split(MAQQEF)[0])
    shewa_i = [i for i, cl in enumerate(folded) if kind(cl) == "shewa"]
    if not shewa_i:
        return tags
    tags.add("shewa")
    if len(shewa_i) == 1:
        tags.add("shewaOne")
    if any(shewa_i[j] + 1 == shewa_i[j + 1] for j in range(len(shewa_i) - 1)):
        tags.add("shewaPair")
    for i in shewa_i:
        if i == 0:
            tags.add("shewaVocal")
            continue
        if i + 1 < len(folded) and kind(folded[i - 1]) == "shewa":
            tags.add("shewaVocal")  # second of two
            continue
        if i + 1 < len(folded) and kind(folded[i + 1]) == "shewa":
            tags.add("shewaSilent")  # first of two
            continue
        plen = prev_length(folded[i - 1])
        if QAMETS in folded[i - 1] or QAMETS_QATAN in folded[i - 1]:
            tags.add("shewaSilent")
        elif plen == "short":
            tags.add("shewaSilent")
        elif plen == "long":
            tags.add("shewaVocal")
        else:
            tags.add("shewaSilent")
    return tags


def stem(word: str) -> str:
    w = strip_acc(word).replace(MAQQEF, "")
    m = PREFIX_RE.match(w)
    return w[m.end() :] if m else w


NOT_FS = {"את", "יהוה", "עתה", "תחת"}


def ending_tags(word: str) -> set[str]:
    s = stem(word)
    cons = letters(s)
    tags: set[str] = set()
    if cons in NOT_FS:
        if cons:
            tags.add("ms")
        return tags
    if re.search(r"[ַָ]יִם$", s):
        tags.add("dual")
        tags.add("pl")
        return tags
    if re.search(r"ִים$", s) or (cons.endswith("ים") and "ִי" in s):
        tags.add("mp")
        tags.add("pl")
        return tags
    if re.search(r"וֹת$|ֹת$", s) or cons.endswith("ות"):
        tags.add("fp")
        tags.add("pl")
        return tags
    if re.search(r"ָה$", s) or (cons.endswith("ה") and QAMETS in s[-3:]):
        tags.add("fs")
        return tags
    if re.search(r"ַת$|ֶת$|ִית$", s):
        tags.add("fs")
        return tags
    if cons:
        tags.add("ms")
    return tags


def verb_tags(word: str) -> set[str]:
    """Surface person tags. Narrative wayyiqtol is the cleanest; qatal/yiqtol are shape guesses."""
    tags: set[str] = set()
    w = strip_acc(word).replace(MAQQEF, "")
    cons = letters(w)
    if not cons:
        return tags
    if re.match(r"^וַ[ייתנ]", w) or cons.startswith("וי") or cons.startswith("ות") or cons.startswith("ונ"):
        if re.match(r"^וַי", w) or cons.startswith("וי"):
            tags.add("wayy")
            if cons.endswith("ו") and len(cons) > 4:
                tags.add("v3mp")
                tags.add("pl")
            else:
                tags.add("v3ms")
        elif re.match(r"^וַת", w) or cons.startswith("ות"):
            tags.add("wayy")
            if cons.endswith("ו") and len(cons) > 4:
                tags.add("v2mp")
                tags.add("pl")
            elif cons.endswith("י") and len(cons) > 4:
                tags.add("v2fs")
            else:
                tags.add("v3fs")
        elif cons.startswith("ונ"):
            tags.add("wayy")
            tags.add("v1cp")
            tags.add("pl")
        return tags

    # yiqtol prefixes (no vav-consecutive)
    if re.match(r"^י[\u05b0-\u05bb]", w) or (cons.startswith("י") and re.match(r"^יִ|^יַ|^יֵ|^יָ|^יְ", w)):
        if cons.endswith("ו") and len(cons) > 3:
            tags.add("v3mp")
            tags.add("pl")
        else:
            tags.add("v3ms")
        return tags
    if re.match(r"^ת[\u05b0-\u05bb]", w):
        if cons.endswith("ו") and len(cons) > 3:
            tags.add("v2mp")
            tags.add("pl")
        elif cons.endswith("י") and len(cons) > 3:
            tags.add("v2fs")
        else:
            tags.add("v2ms")  # same shape as 3fs yiqtol; also tag 3fs
            tags.add("v3fs")
        return tags
    if re.match(r"^א[\u05b0-\u05bb]", w) and len(cons) >= 3:
        tags.add("v1cs")
        return tags
    if re.match(r"^נ[\u05b0-\u05bb]", w) and len(cons) >= 3:
        tags.add("v1cp")
        tags.add("pl")
        return tags

    # qatal suffixes
    if re.search(r"תִּי$|תִי$|תי$", w) or cons.endswith("תי"):
        tags.add("v1cs")
    elif re.search(r"תֶּם$|תם$", w) or cons.endswith("תם"):
        tags.add("v2mp")
        tags.add("pl")
    elif re.search(r"תֶּן$|תן$", w) or cons.endswith("תן"):
        tags.add("v2fp")
        tags.add("pl")
    elif re.search(r"נוּ$", w) or cons.endswith("נו"):
        tags.add("v1cp")
        tags.add("pl")
    elif re.search(r"ת[\u05bc]?ְ$", w):
        tags.add("v2fs")
    elif re.search(r"ת[\u05bc]?ָ$", w):
        tags.add("v2ms")
    elif re.search(r"וּ$", w) and cons.endswith("ו") and len(cons) >= 4:
        tags.add("v3mp")
        tags.add("pl")
    return tags


def prefix_tags(word: str) -> set[str]:
    w = strip_acc(word)
    tags: set[str] = set()
    if re.match(r"^הַ|^הָ|^הֶ", w):
        tags.add("article")
    if re.match(r"^וְ|^וּ|^וַ|^וָ|^וֵ|^וִ|^וֹ", w):
        tags.add("vav")
    return tags


STEM_CODE = {
    "q": "qal",
    "N": "niphal",
    "p": "piel",
    "P": "pual",
    "h": "hiphil",
    "H": "hophal",
    "t": "hithpael",
    "Q": "qalpass",
}
ASPECT_CODE = {
    "p": "qatal",
    "q": "weqatal",
    "i": "yiqtol",
    "w": "wayy",
    "h": "coh",
    "j": "juss",
    "v": "impv",
    "r": "ptcp",
    "s": "ptcp",
    "a": "infabs",
    "c": "infcst",
}

OSHB_DIR = Path("/tmp/oshb")
OSHB_BASE = "https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/{book}.xml"
OSHB_BOOKS = [
    "Gen",
    "Exod",
    "Lev",
    "Num",
    "Deut",
    "Josh",
    "Judg",
    "1Sam",
    "2Sam",
    "1Kgs",
    "2Kgs",
    "Isa",
    "Jer",
    "Ezek",
    "Hos",
    "Joel",
    "Amos",
    "Obad",
    "Jonah",
    "Mic",
    "Nah",
    "Hab",
    "Zeph",
    "Hag",
    "Zech",
    "Mal",
    "Ps",
    "Prov",
    "Job",
    "Song",
    "Ruth",
    "Lam",
    "Eccl",
    "Esth",
    "Dan",
    "Ezra",
    "Neh",
    "1Chr",
    "2Chr",
]


def morph_tags(code: str) -> set[str]:
    tags: set[str] = set()
    if not code:
        return tags
    parts = code.split("/")
    for i, raw in enumerate(parts):
        p = raw[1:] if i == 0 and raw[:1] in "HA" else raw
        if not p:
            continue
        pos = p[0]
        if pos == "V" and len(p) >= 3:
            tags.add("verb")
            stem = STEM_CODE.get(p[1])
            aspect = ASPECT_CODE.get(p[2])
            if stem:
                tags.add(stem)
            if aspect:
                tags.add(aspect)
            if len(p) >= 6 and p[3] in "123":
                tags.add(f"v{p[3]}{p[4]}{p[5]}")
                if p[4] == "f":
                    tags.add("femVerb")
        elif pos == "N" and len(p) >= 5:
            tags.add("noun")
            if p[-1] == "c":
                tags.add("cst")
            elif p[-1] == "a":
                tags.add("abs")
            if len(p) >= 4 and p[3] == "d":
                tags.add("dual")
                tags.add("pl")
        elif pos == "A" and len(p) >= 5:
            tags.add("adj")
            if p[-1] == "c":
                tags.add("cst")
            elif p[-1] == "a":
                tags.add("abs")
        elif pos == "P":
            tags.add("pron")
    return tags


def fetch_oshb_book(book: str) -> Path:
    OSHB_DIR.mkdir(parents=True, exist_ok=True)
    dest = OSHB_DIR / f"{book}.xml"
    if dest.exists() and dest.stat().st_size > 1000:
        return dest
    import urllib.request

    url = OSHB_BASE.format(book=book)
    print(f"  fetch OSHB {book}")
    urllib.request.urlretrieve(url, dest)
    return dest


def overlay_oshb(bucket: dict) -> int:
    """Join Open Scriptures Hebrew morphology onto the WLC forms (CC BY 4.0).

    Aramaic rows are skipped. Tags that fire on under 20% of a spelling (rare
    homographs) stay off so כָּל is not treated as a verb.
    """
    import xml.etree.ElementTree as ET
    from collections import Counter

    ns = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"
    freq: dict[str, Counter] = defaultdict(Counter)
    seen: dict[str, int] = defaultdict(int)
    tagged = 0
    for book in OSHB_BOOKS:
        try:
            path = fetch_oshb_book(book)
        except Exception as exc:  # noqa: BLE001
            print("OSHB skip", book, exc)
            continue
        root = ET.parse(path).getroot()
        for verse in root.iter(f"{ns}verse"):
            osis = verse.get("osisID")
            if not osis:
                continue
            ref = osis
            for w in verse.findall(f"{ns}w"):
                if w.get("type") == "x-ketiv":
                    continue
                morph = w.get("morph") or ""
                if morph.startswith("A"):
                    continue
                raw = (w.text or "").replace("/", "")
                if not raw:
                    continue
                tags = morph_tags(morph)
                if not tags:
                    continue
                wkey = strip_acc(raw)
                freq[wkey].update(tags)
                seen[wkey] += 1
                row = bucket[wkey]
                if ref not in row["refs"] and len(row["refs"]) < 3:
                    row["refs"].append(ref)
                if row["n"] == 0:
                    row["n"] = 1
                tagged += 1
    for wkey, counts in freq.items():
        n = seen[wkey] or 1
        floor = max(1, int(0.2 * n))
        keep = {tag for tag, c in counts.items() if c >= floor}
        bucket[wkey]["tags"] |= keep
    return tagged


def is_kol_family(word: str) -> bool:
    body = letters(stem(word))
    return body.endswith("כל") and 2 <= len(body) <= 5


def chain_phrase(raw: str, nxt: str, tags: set[str]) -> str | None:
    """Kol and other proclitic hatuf need the next word — otherwise kol vs kāl is a guess."""
    if "hatuf" not in tags or not nxt:
        return None
    if not (is_kol_family(raw) or MAQQEF in raw):
        return None
    left = strip_acc(raw).replace(MAQQEF, "")
    right = strip_acc(nxt).split(MAQQEF)[0]
    if not left or not right:
        return None
    return f"{left}{MAQQEF}{right}"


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
                words = vs.get("words") or []
                for i, raw in enumerate(words):
                    tokens += 1
                    tags = qamets_tags(raw) | ending_tags(raw) | shewa_tags(raw) | prefix_tags(raw)
                    add_form(bucket, raw, ref, tags)
                    nxt = words[i + 1] if i + 1 < len(words) else ""
                    phrase = chain_phrase(raw, nxt, tags)
                    if phrase:
                        add_form(bucket, phrase, ref, tags | {"chain"})
    print("OSHB overlay", overlay_oshb(bucket), "words")
    for w, row in list(bucket.items()):
        if MAQQEF in w:
            continue
        if "hatuf" in row["tags"] and is_kol_family(w):
            row["tags"].discard("hatuf")
    forms = []
    for w, row in bucket.items():
        tags = set(row["tags"])
        n = row["n"]
        keep = bool(tags & KEEP_ALWAYS)
        if "gadol" in tags and n >= 3:
            keep = True
        if "ms" in tags and n >= 5:
            keep = True
        if "shewa" in tags and n >= 6:
            keep = True
        if "pl" in tags and n >= 3:
            keep = True
        if not keep:
            continue
        forms.append({"w": w, "n": n, "t": sorted(tags), "r": row["refs"]})
    forms.sort(key=lambda x: (-x["n"], x["w"]))
    payload = {"v": 4, "tokens": tokens, "source": "WLC+OSHB", "forms": forms}
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    counts = defaultdict(int)
    for f in forms:
        for t in f["t"]:
            counts[t] += 1
    print(f"tokens {tokens} unique {len(forms)} → {OUT} ({OUT.stat().st_size // 1024} KB)")
    print("tags", dict(sorted(counts.items(), key=lambda kv: -kv[1])))
    for sample in ("חָכְמָה", "כָּל", "כָּל־נֶפֶשׁ", "וַיֹּאמֶר"):
        hits = [f for f in forms if letters(f["w"]) == letters(sample)]
        print(sample, [(h["w"], h["t"], h["n"]) for h in hits[:2]])


if __name__ == "__main__":
    main()
