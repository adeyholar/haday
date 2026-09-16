#!/usr/bin/env python3
"""Hebrew letter-name clips for Hear.

shin / sin / tav use English GuyNeural (sheen / seen / tahv). Avri mis-says
שִׁין / שִׂין / תָּו as shi-n / si-n / te-af.
"""
from __future__ import annotations

import argparse
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
SAY_OVERRIDE: dict[str, tuple[str, str]] = {
    "shin": ("en-US-GuyNeural", "sheen"),
    "sin": ("en-US-GuyNeural", "seen"),
    "tav": ("en-US-GuyNeural", "tahv"),
}
FFMPEG_AF = (
    "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.08:"
    "stop_periods=1:stop_threshold=-40dB:stop_silence=0.18,loudnorm=I=-16:LRA=11:TP=-1.5"
)
# English overrides are already short words — do not eat the tail.
FFMPEG_AF_EN = (
    "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.08,"
    "loudnorm=I=-16:LRA=11:TP=-1.5"
)


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


def one(letter_id: str, he: str) -> str:
    raw = OUT / f"{letter_id}.raw.mp3"
    dest = OUT / f"{letter_id}.mp3"
    voice, text = SAY_OVERRIDE.get(letter_id, (VOICE, he))
    rate = "-10%" if letter_id in SAY_OVERRIDE else "-8%"
    af = FFMPEG_AF_EN if letter_id in SAY_OVERRIDE else FFMPEG_AF
    run(["edge-tts", "--voice", voice, f"--rate={rate}", "--text", text, "--write-media", str(raw)])
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw),
            "-af",
            af,
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
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", default="", help="comma ids, e.g. shin,sin,tav")
    args = parser.parse_args()
    wanted = {x.strip() for x in args.only.split(",") if x.strip()}
    manifest_path = OUT / "manifest.json"
    manifest: dict[str, str] = {}
    if wanted and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
    for letter_id, he in NAMES:
        if wanted and letter_id not in wanted:
            continue
        print("clip", letter_id, SAY_OVERRIDE.get(letter_id, (VOICE, he)), flush=True)
        manifest[letter_id] = one(letter_id, he)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("wrote", len(wanted or NAMES), "clips")


if __name__ == "__main__":
    main()
