#!/usr/bin/env python3
"""Generate ambient sleep music via ElevenLabs Music API (FAL proxy).

Endpoint: fal-ai/elevenlabs/music
Target: 17s, instrumental, calm ambient — matches Som's sleep brand tone.
"""
import sys
from pathlib import Path
import urllib.request

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT.parent.parent.parent / "skills" / "atoms" / "_shared"))
from fal_helpers import load_fal_key

load_fal_key()
import fal_client

OUT_DIR = PROJECT / "working" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)
OUT = OUT_DIR / "music-raw.mp3"

PROMPT = (
    "Calm ambient sleep music. Soft warm synth pads with gentle bell tones. "
    "Dreamy, ethereal atmosphere. Slow tempo around 60 BPM. "
    "Restorative and peaceful, premium spa-like calm. "
    "No drums, no percussion, no active melody — just sustained atmospheric pads. "
    "Suitable for a sleep supplement ad in the style of premium DTC wellness brands. "
    "Instrumental only, no vocals."
)


def main():
    print(f"Firing fal-ai/elevenlabs/music")
    print(f"  prompt length: {len(PROMPT)} chars")
    handler = fal_client.submit(
        "fal-ai/elevenlabs/music",
        arguments={
            "prompt": PROMPT,
            "music_length_ms": 17000,
            "force_instrumental": True,
        },
    )
    print(f"  request_id={handler.request_id}")
    result = handler.get()
    print(f"  result keys: {list(result.keys())}")
    url = result.get("audio", {}).get("url") or result.get("audio_url")
    if not url:
        print(f"  result: {result}")
        sys.exit("ERROR: no audio URL in result")
    print(f"  downloading → {OUT.relative_to(PROJECT)}")
    urllib.request.urlretrieve(url, OUT)
    print(f"  saved {OUT.relative_to(PROJECT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
