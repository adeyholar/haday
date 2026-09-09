#!/usr/bin/env python3
"""Feed MP3s from another engine into the voice module.

Drop files named {id}.he.mp3 and/or {id}.en.mp3 into
public/audio/neural/inbox/ then run:

  python3 scripts/voice-import.py

They are loudness-matched and copied over the neural bank. Playback order stays:
owner recording → these clips → Eliran → browser TTS.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEURAL = ROOT / "public" / "audio" / "neural"
INBOX = NEURAL / "inbox"
CORPUS = NEURAL / "corpus.json"
MANIFEST = NEURAL / "manifest.json"


def rebuild_manifest() -> None:
    items = json.loads(CORPUS.read_text()) if CORPUS.exists() else []
    by_id = {i["id"]: i for i in items}
    man: dict[str, dict[str, str]] = {}
    for mp3 in sorted(NEURAL.glob("*.mp3")):
        name = mp3.name
        if name.count(".") < 2:
            continue
        stem, part, _ext = name.rsplit(".", 2)
        if part not in {"he", "en"}:
            continue
        url = f"/audio/neural/{name}"
        man.setdefault(stem, {})[part] = url
        aliases = (by_id.get(stem) or {}).get("aliases") or []
        for a in aliases:
            man.setdefault(a, {})[part] = url
    MANIFEST.write_text(json.dumps(man, ensure_ascii=False, indent=0))
    print(f"manifest {len(man)} ids")


def main() -> int:
    INBOX.mkdir(parents=True, exist_ok=True)
    files = sorted(INBOX.glob("*.mp3"))
    if not files:
        print(f"Put {{id}}.he.mp3 / {{id}}.en.mp3 in {INBOX}", file=sys.stderr)
        return 1
    copied = 0
    for src in files:
        dest = NEURAL / src.name
        shutil.copy2(src, dest)
        copied += 1
    print(f"copied {copied} from inbox")
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "voice-normalize.py"), "--dir", str(NEURAL)], check=False)
    rebuild_manifest()
    return r.returncode


if __name__ == "__main__":
    raise SystemExit(main())
