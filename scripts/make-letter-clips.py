#!/usr/bin/env python3
"""Hebrew letter-name clips for Hear. he-IL-AvriNeural. shin/sin are שִׁין / שִׂין, not English shi-n."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path("/workspace")
OUT = ROOT / "public" / "audio" / "letters"
OUT.mkdir(parents=True, exist_ok=True)

# Traditional names — same list as src/lib/voice-corpus.ts LETTER_HE_NAME
NAMES: list[tuple[str, str]] = [
    ("alef", "אָלֶף"),
    ("bet", "בֵּית"),
    ("gimel", "גִּימֶל"),
    ("dalet", "דָּלֶת"),
    ("he", "הֵא"),
    ("vav", "וָו"),
    ("zayin", "זַיִן"),
    ("het", "חֵית"),
    ("tet", "טֵית"),
    ("yod", "יוֹד"),
    ("kaf", "כַּף"),
    ("lamed", "לָמֶד"),
    ("mem", "מֵם"),
    ("nun", "נוּן"),
    ("samekh", "סָמֶךְ"),
    ("ayin", "עַיִן"),
    ("pe", "פֵּא"),
    ("tsade", "צָדֵי"),
    ("qof", "קוֹף"),
    ("resh", "רֵישׁ"),
    ("shin", "שִׁין"),
    ("sin", "שִׂין"),
    ("tav", "תָּו"),
]

VOICE = "he-IL-AvriNeural"


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


def one(letter_id: str, he: str) -> str:
    raw = OUT / f"{letter_id}.raw.mp3"
    dest = OUT / f"{letter_id}.mp3"
    run(["edge-tts", "--voice", VOICE, "--rate=-8%", "--text", he, "--write-media", str(raw)])
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw),
            "-af",
            "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.08:stop_periods=1:stop_threshold=-40dB:stop_silence=0.18,loudnorm=I=-16:LRA=11:TP=-1.5",
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "4",
            str(dest),
        ]
    )
    raw.unlink(missing_ok=True)
    return f"/audio/letters/{letter_id}.mp3"


def main() -> None:
    manifest: dict[str, str] = {}
    for letter_id, he in NAMES:
        print("clip", letter_id, he, flush=True)
        manifest[letter_id] = one(letter_id, he)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("wrote", len(manifest), "clips")


if __name__ == "__main__":
    main()
