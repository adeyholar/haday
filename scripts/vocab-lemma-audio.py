#!/usr/bin/env python3
"""Isolated lemma audio: Eliran Wong lex_ (Gen 1–7) then Lingua Libre CC0/CC-BY."""
from __future__ import annotations

import json
import re
import subprocess
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/audio/vocab"
CONS = {chr(c) for c in range(0x05D0, 0x05EB)}
SKIP_IDS = {"ha", "we", "be", "ke", "le", "she"}
UA = "HaDay/1.0 (BIBL 630 class app; https://github.com/adeyholar/haday)"
COMMONS = "https://commons.wikimedia.org/w/api.php"
ELIRAN_ZIP = "https://github.com/eliranwong/MP3_BHS5_word-by-word/raw/main/01_Genesis_1-7.zip"


def strip_marks(s: str) -> str:
    out = []
    for ch in unicodedata.normalize("NFC", s):
        o = ord(ch)
        if 0x0591 <= o <= 0x05C7:
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
    items = []
    for block in re.findall(r"\{[^{}]+\}", text[start:end]):
        hid = re.search(r'id: "([^"]+)"', block)
        he = re.search(r'hebrew: "([^"]+)"', block)
        if not hid or not he:
            continue
        alts = re.findall(r'"([^"]+)"', (re.search(r"hebrewAlts: \[([^\]]*)\]", block) or [None, ""])[1] or "")
        items.append({"id": hid.group(1), "hebrew": he.group(1), "alts": alts})
    letters = re.findall(r'id: "([^"]+)", letter: "([^"]+)"', (ROOT / "src/lib/alphabet.ts").read_text())
    for hid, he in letters:
        items.append({"id": f"ch1-{hid}", "hebrew": he, "alts": []})
    return items


def forms(item: dict) -> tuple[set[str], set[str]]:
    raw = [item["hebrew"], *item["alts"]]
    return {strip_marks(x) for x in raw if strip_marks(x)}, {cons(x) for x in raw if cons(x)}


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as res:
        return json.loads(res.read().decode("utf-8"))


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as res, dest.open("wb") as f:
        while True:
            chunk = res.read(64 * 1024)
            if not chunk:
                break
            f.write(chunk)


def to_mp3(src: Path, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ac", "1", "-ar", "22050", "-b:a", "48k", str(dest)],
        capture_output=True,
    )
    return r.returncode == 0 and dest.exists() and dest.stat().st_size > 400


def lingua_index() -> list[tuple[str, str]]:
    cache = Path("/tmp/lexshop/ll-index.json")
    if cache.exists():
        return [tuple(x) for x in json.loads(cache.read_text())]
    rows: list[tuple[str, str]] = []
    cont = None
    while True:
        q = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": "Category:Lingua_Libre_pronunciation-heb",
            "cmtype": "file",
            "cmlimit": "500",
            "format": "json",
        }
        if cont:
            q["cmcontinue"] = cont
        data = get_json(COMMONS + "?" + urllib.parse.urlencode(q))
        for m in data.get("query", {}).get("categorymembers", []):
            title = m.get("title") or ""
            word = title
            word = re.sub(r"^File:LL-Q9288 \(heb\)-[^-]+-", "", word)
            word = re.sub(r"\.(wav|ogg|mp3)$", "", word, flags=re.I)
            word = word.replace("_", " ").strip()
            if " " in word or not cons(word):
                continue
            rows.append((cons(word), title))
        cont = data.get("continue", {}).get("cmcontinue")
        if not cont:
            break
        time.sleep(0.15)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(rows), encoding="utf-8")
    return rows


def commons_file_url(title: str) -> str:
    name = title.replace("File:", "", 1).replace(" ", "_")
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name, safe="()-.")


def fetch_eliran_gen() -> dict[tuple[int, int, int], list[Path]]:
    """verse (ch,v,wordi) -> lex mp3, by sorting BHSA node ids in the verse."""
    zpath = Path("/tmp/lexshop/01_Genesis_1-7.zip")
    zpath.parent.mkdir(parents=True, exist_ok=True)
    if not zpath.exists() or zpath.stat().st_size < 1000:
        print("download Eliran Genesis 1–7")
        download(ELIRAN_ZIP, zpath)
    dest = Path("/tmp/lexshop/gen1-7")
    dest.mkdir(parents=True, exist_ok=True)
    subprocess.run(["unzip", "-qo", str(zpath), "-d", str(dest)], check=False)
    by_verse: dict[tuple[int, int], list[Path]] = {}
    for p in dest.rglob("lex_BHS5_*.mp3"):
        m = re.search(r"lex_BHS5_1_(\d+)_(\d+)_(\d+)\.mp3$", p.name)
        if not m:
            continue
        ch, v, node = int(m.group(1)), int(m.group(2)), int(m.group(3))
        by_verse.setdefault((ch, v), []).append((node, p))
    out: dict[tuple[int, int, int], Path] = {}
    for (ch, v), items in by_verse.items():
        items.sort()
        for i, (_n, p) in enumerate(items):
            out[(ch, v, i)] = p
    return out


def main() -> None:
    vocab = [it for it in parse_vocab() if it["id"] not in SKIP_IDS]
    need = []
    by_cons: dict[str, list[str]] = {}
    for it in vocab:
        niq, cc = forms(it)
        if not cc:
            continue
        need.append(it)
        for c in cc:
            by_cons.setdefault(c, []).append(it["id"])
    chosen: dict[str, dict] = {}
    OUT.mkdir(parents=True, exist_ok=True)
    existing_json = ROOT / "src/lib/vocab-clips.json"

    # 1. Eliran Wong lex_ in Genesis 1–7 (isolated lexeme TTS / word files)
    try:
        dump = json.loads((ROOT / "public/tanakh/books/Gen.json").read_text())
        eliran = fetch_eliran_gen()
        for chs, verses in dump["chapters"].items():
            ch = int(chs)
            if ch > 7:
                continue
            for row in verses:
                words = row.get("words") or []
                v = int(row.get("v") or 0)
                if len([eliran.get((ch, v, i)) for i in range(len(words))]) != len(words):
                    continue
                if any(eliran.get((ch, v, i)) is None for i in range(len(words))):
                    continue
                for wi, w in enumerate(words):
                    if "־" in w:
                        continue
                    c = cons(w)
                    ids = by_cons.get(c) or []
                    src = eliran.get((ch, v, wi))
                    if not src or not ids:
                        continue
                    sm = strip_marks(w)
                    for hid in ids:
                        if hid in chosen:
                            continue
                        dest = OUT / f"{hid}.mp3"
                        dest.write_bytes(src.read_bytes())
                        chosen[hid] = {
                            "src": f"/audio/vocab/{hid}.mp3",
                            "start": 0,
                            "end": 0,
                            "he": sm,
                            "kind": "lemma",
                            "source": "eliran",
                            "credit": "Open Hebrew Bible Project (Eliran Wong), CC BY-NC 4.0",
                        }
        print(f"eliran {sum(1 for v in chosen.values() if v['source']=='eliran')}")
    except Exception as err:
        print("eliran skip", err)

    # 2. Lingua Libre isolated words
    print("index Lingua Libre")
    ll = lingua_index()
    print("lingua files", len(ll))
    want_cons = {c for it in need if it["id"] not in chosen for c in forms(it)[1]}
    title_for = {}
    for c, title in ll:
        if c in want_cons and c not in title_for:
            title_for[c] = title
    for it in need:
        if it["id"] in chosen:
            continue
        _, cc = forms(it)
        title = next((title_for[c] for c in cc if c in title_for), None)
        if not title:
            continue
        dest = OUT / f"{it['id']}.mp3"
        if dest.exists() and dest.stat().st_size > 400:
            chosen[it["id"]] = {
                "src": f"/audio/vocab/{it['id']}.mp3",
                "start": 0,
                "end": 0,
                "he": it["hebrew"],
                "kind": "lemma",
                "source": "lingualibre",
                "credit": "Lingua Libre / Wikimedia Commons (CC0 or CC BY-SA)",
            }
            continue
        url = commons_file_url(title)
        raw = Path("/tmp/lexshop/ll") / f"{it['id']}{Path(urllib.parse.urlparse(url).path).suffix or '.wav'}"
        try:
            download(url, raw)
        except urllib.error.HTTPError as err:
            print("dl fail", it["id"], err)
            if err.code == 429:
                time.sleep(25)
            else:
                time.sleep(0.4)
            continue
        except Exception as err:
            print("dl fail", it["id"], err)
            continue
        if not to_mp3(raw, dest):
            continue
        chosen[it["id"]] = {
            "src": f"/audio/vocab/{it['id']}.mp3",
            "start": 0,
            "end": 0,
            "he": it["hebrew"],
            "kind": "lemma",
            "source": "lingualibre",
            "credit": "Lingua Libre / Wikimedia Commons (CC0 or CC BY-SA)",
        }
        time.sleep(0.45)

    dest = ROOT / "src/lib/vocab-clips.json"
    dest.write_text(json.dumps(chosen, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "CREDIT.txt").write_text(
        "Isolated Hebrew lemma audio for HaDay Listen.\n"
        "Open Hebrew Bible Project by Eliran Wong — CC BY-NC 4.0 "
        "(https://github.com/eliranwong/MP3_BHS5_word-by-word).\n"
        "Lingua Libre recordings on Wikimedia Commons — CC0 / CC BY-SA.\n",
        encoding="utf-8",
    )
    n_e = sum(1 for v in chosen.values() if v.get("source") == "eliran")
    n_l = sum(1 for v in chosen.values() if v.get("source") == "lingualibre")
    print(f"clips {len(chosen)}/{len(need)} eliran={n_e} lingua={n_l} -> {dest}")
    missing = [it["id"] for it in need if it["id"] not in chosen]
    print("missing", missing)


if __name__ == "__main__":
    main()
