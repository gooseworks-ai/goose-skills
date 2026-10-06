#!/usr/bin/env python3
"""Make a runnable neutral demo locally. No network, keys or paid generation.

Optional --font supplies a real licensed font for the labels and text-hook test.
The colored fixture is a timing/provenance demonstration, not a customer ad.
"""
import argparse
import json
from pathlib import Path
from replace_hook import ffmpeg, file_hash, text_layer


def make_demo(destination, font=None):
    destination.mkdir(parents=True, exist_ok=True)
    original, hook = destination / "original.mp4", destination / "replacement-hook.mp4"
    filters = ["[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]"]
    output = "[v]"
    if font:
        labels = destination / "body-label.png"
        text_layer("ORIGINAL BODY\nSame captions. Same ending.", font, 320, 568, "#ffffff", labels, at_bottom=True)
        filters.append("[v][4:v]overlay=0:0:enable='gte(t,2.4)':shortest=1[labelled]")
        output = "[labelled]"
    inputs = ["-f", "lavfi", "-i", "color=c=#bb3344:s=320x568:r=30:d=2.4",
           "-f", "lavfi", "-i", "testsrc2=s=320x568:r=30:d=3.2",
           "-f", "lavfi", "-i", "color=c=#227755:s=320x568:r=30:d=1.4",
           "-f", "lavfi", "-i", "aevalsrc=0.12*sin(2*PI*330*t)+0.03*sin(2*PI*660*t):s=48000:d=7"]
    if font:
        inputs += ["-loop", "1", "-framerate", "30", "-i", labels]
    ffmpeg(*inputs, "-filter_complex", ";".join(filters), "-map", output, "-map", "3:a", "-c:v", "libx264", "-crf", "18",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", original)
    ffmpeg("-f", "lavfi", "-i", "color=c=#7744dd:s=240x426:r=24:d=1.5",
           "-f", "lavfi", "-i", "sine=frequency=880:sample_rate=44100:duration=1.5",
           "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", hook)
    (destination / "captions.srt").write_text("1\n00:00:00,300 --> 00:00:01,900\nOriginal opening\n\n2\n00:00:02,600 --> 00:00:04,700\nOriginal body\n\n3\n00:00:05,800 --> 00:00:06,900\nOriginal ending\n")
    config = {"source": {"path": "original.mp4", "sha256": file_hash(original), "project_id": "demo-source-project", "render_id": "demo-original-v1"},
              "hook_end_sec": 2.4, "hook": {"path": "replacement-hook.mp4"},
              "words": [{"start": 0.3, "end": 1.9, "word": "Opening"}, {"start": 2.6, "end": 4.7, "word": "Body"}],
              "captions": {"path": "captions.srt", "output_path": "replaced.srt"}, "output": {"path": "replaced.mp4"}}
    (destination / "config.json").write_text(json.dumps(config, indent=2) + "\n")
    return config


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--font", type=Path)
    args = parser.parse_args()
    make_demo(args.out_dir.resolve(), args.font.resolve() if args.font else None)
    print(f"Demo ready. Run: python3 scripts/replace_hook.py --config '{args.out_dir.resolve() / 'config.json'}'")
