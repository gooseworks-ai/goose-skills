#!/usr/bin/env python3
"""ElevenLabs voiceover (TTS) ROUTED THROUGH THE PROXY (bills the Ads agent). Voice +
text from the template recipe. gen_vo.py --text "..." --voice dMyQqiVXTU80dDl2eNK8 --out vo.mp3"""
import argparse
from media_proxy import eleven_tts
ap = argparse.ArgumentParser(); ap.add_argument("--text", required=True); ap.add_argument("--voice", required=True)
ap.add_argument("--model", default="eleven_v3"); ap.add_argument("--out", required=True)
a = ap.parse_args(); eleven_tts(a.text, a.voice, a.out, a.model); print(a.out)
