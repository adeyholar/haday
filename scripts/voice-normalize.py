#!/usr/bin/env python3
"""Match Hebrew and English clip loudness, trim lead-in, add Hebrew gain.

Run after synth or after dropping another engine's MP3s into public/audio/neural.
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEURAL = ROOT / "public" / "audio" / "neural"

# Speech on a phone: -16 LUFS. Hebrew gets extra gain — Hila sits behind Jenny
# even when mean dB looks similar, and short citation forms have more padding.
HE_EXTRA_DB = 5.0
EN_EXTRA_DB = 1.5


def ffmpeg_ok(src: Path, dest: Path, extra_db: float) -> bool:
    chain = (
        "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-34dB:detection=peak,"
        "areverse,"
        "silenceremove=start_periods=1:start_duration=0.04:start_threshold=-34dB:detection=peak,"
        "areverse,"
        "loudnorm=I=-16:TP=-1.5:LRA=8:linear=true,"
        f"volume={extra_db}dB,"
        "alimiter=limit=0.89:attack=3:release=30"
    )
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(src),
        "-af",
        chain,
        "-ar",
        "24000",
        "-ac",
        "1",
        "-b:a",
        "64k",
        str(dest),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not dest.exists() or dest.stat().st_size < 600:
        if dest.exists():
            dest.unlink()
        return False
    return True


def normalize_one(path: Path) -> str:
    extra = HE_EXTRA_DB if path.name.endswith(".he.mp3") else EN_EXTRA_DB
    tmp = path.with_suffix(".norm.mp3")
    ok = ffmpeg_ok(path, tmp, extra)
    if not ok:
        return f"fail {path.name}"
    tmp.replace(path)
    return f"ok {path.name}"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dir", type=Path, default=NEURAL)
    p.add_argument("--jobs", type=int, default=6)
    p.add_argument("files", nargs="*", type=Path)
    args = p.parse_args()
    files = args.files or sorted(args.dir.glob("*.mp3"))
    files = [f for f in files if f.suffix == ".mp3" and ".norm." not in f.name and f.name not in {"corpus.json"}]
    if not files:
        print("no mp3s", file=sys.stderr)
        return 1
    failed = 0
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futs = [pool.submit(normalize_one, f) for f in files]
        for i, fut in enumerate(as_completed(futs), 1):
            msg = fut.result()
            if msg.startswith("fail"):
                failed += 1
                print(msg, file=sys.stderr)
            if i % 80 == 0:
                print(f"  {i}/{len(files)}")
    print(f"normalized {len(files) - failed}/{len(files)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
