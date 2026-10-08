"""scripts/trim_clips.py cuts the windows it is asked for (free: local ffmpeg only, no network).

Run: python3 -m pytest skills/ads/packs/video-ad-formats/stitch-videos-ffmpeg/tests -q
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "trim_clips.py"
FRAME = 1 / 30

pytestmark = pytest.mark.skipif(not (shutil.which("ffmpeg") and shutil.which("ffprobe")),
                                reason="ffmpeg/ffprobe not installed")


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout)


def test_cuts_each_window_and_records_bad_specs(tmp_path):
    src = tmp_path / "src.mp4"
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                    "-f", "lavfi", "-i", "testsrc=size=160x284:rate=30:duration=4",
                    "-f", "lavfi", "-i", "sine=frequency=440:duration=4",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", str(src)], check=True)
    clips = tmp_path / "clips.json"
    clips.write_text(json.dumps([
        {"name": "Hook Shot", "start": 0.5, "end": 2.0},
        {"name": "middle", "start": "00:02", "duration": 1},
        {"name": "backwards", "start": 1, "end": 0.5},
        {"name": "tail", "start": 3.5, "duration": 2},
    ]))
    out = tmp_path / "out"
    proc = subprocess.run([sys.executable, str(SCRIPT), "--source", str(src), "--clips", str(clips),
                           "--output-dir", str(out)], capture_output=True, text=True)
    assert proc.returncode == 0, proc.stderr

    assert abs(duration(out / "hook-shot.mp4") - 1.5) <= 2 * FRAME
    assert abs(duration(out / "middle.mp4") - 1.0) <= 2 * FRAME
    assert not (out / "backwards.mp4").exists()

    manifest = json.loads((out / "manifest.json").read_text())
    assert manifest["status"] == "needs human review"
    assert any(e.startswith("backwards:") for e in manifest["errors"])
    assert any(w.startswith("tail:") and "past the end" in w for w in manifest["warnings"])
