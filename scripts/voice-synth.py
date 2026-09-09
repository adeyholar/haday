#!/usr/bin/env python3
"""Fill the HaDay voice corpus with a neural human voice (Microsoft Hila / Jenny).

Owner recordings in the Voice bank still win at play time.
Swap --he-voice / --en-voice to try another engine voice later (Avri, Azure, clone).
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "audio" / "neural"
CORPUS = OUT / "corpus.json"


async def one(text: str, voice: str, dest: Path, rate: str) -> bool:
    if dest.exists() and dest.stat().st_size > 800:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    try:
        comm = edge_tts.Communicate(text, voice, rate=rate)
        await comm.save(str(tmp))
        tmp.replace(dest)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  fail {dest.name}: {exc}", file=sys.stderr)
        if tmp.exists():
            tmp.unlink()
        return False


async def run(args: argparse.Namespace) -> int:
    items = json.loads(CORPUS.read_text())
    sem = asyncio.Semaphore(args.jobs)
    manifest: dict[str, dict[str, str]] = {}
    made = 0

    async def job(item: dict, part: str, text: str, voice: str) -> None:
        nonlocal made
        if not text.strip():
            return
        name = f"{item['id']}.{part}.mp3"
        dest = OUT / name
        async with sem:
            if await one(text, voice, dest, args.rate):
                made += 1
        if dest.exists() and dest.stat().st_size > 800:
            manifest.setdefault(item["id"], {})[part] = f"/audio/neural/{name}"
            for alias in item.get("aliases") or []:
                manifest.setdefault(alias, {})[part] = f"/audio/neural/{name}"

    tasks = []
    for item in items:
        tasks.append(job(item, "he", item.get("speakHe") or "", args.he_voice))
        tasks.append(job(item, "en", item.get("speakEn") or "", args.en_voice))
    await asyncio.gather(*tasks)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=0))
    print(f"neural {len(manifest)} ids, wrote {made} new files → {OUT}")
    from subprocess import run

    n = run([sys.executable, str(ROOT / "scripts" / "voice-normalize.py"), "--dir", str(OUT)])
    return n.returncode


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--he-voice", default="he-IL-HilaNeural")
    p.add_argument("--en-voice", default="en-US-JennyNeural")
    p.add_argument("--rate", default="-8%")
    p.add_argument("--jobs", type=int, default=4)
    args = p.parse_args()
    if not CORPUS.exists():
        print("Run: node scripts/export-voice-corpus.mjs", file=sys.stderr)
        return 1
    return asyncio.run(run(args))


if __name__ == "__main__":
    raise SystemExit(main())
