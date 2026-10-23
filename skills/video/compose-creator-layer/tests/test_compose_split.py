"""compose.py split-screen options: the seam divider shows on split beats only, and a bad
divider is refused before ffmpeg runs (free: local ffmpeg only, no network).

Run: python3 -m pytest skills/ads/capabilities/compose-creator-layer/tests -q
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "compose.py"
W, H, SEAM = 270, 480, 240

pytestmark = pytest.mark.skipif(not (shutil.which("ffmpeg") and shutil.which("ffprobe")),
                                reason="ffmpeg/ffprobe not installed")


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str, args)], check=True)


def pixel(video, t, x, y):
    """RGB at (x, y) at time t (a 2x2 block: yuv420p chroma cannot be cropped to one pixel)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(video), "-frames:v", "1",
                          "-vf", "crop=2:2:%d:%d" % (x, y), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         capture_output=True, check=True).stdout
    return tuple(raw[:3])


def fixtures(tmp_path):
    layer, creator, beats = tmp_path / "layer.mp4", tmp_path / "creator.mp4", tmp_path / "beats.json"
    ff("-f", "lavfi", "-i", "color=c=gray:size=%dx%d:rate=30:duration=4" % (W, H),
       "-c:v", "libx264", "-pix_fmt", "yuv420p", layer)
    ff("-f", "lavfi", "-i", "color=c=green:size=540x960:rate=30:duration=4",
       "-f", "lavfi", "-i", "sine=frequency=300:duration=4",
       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", creator)
    beats.write_text(json.dumps({"size": [W, H], "fps": 30, "seam": SEAM, "creator_side": "bottom",
                                 "beats": [{"start": 0, "end": 2, "state": "split"},
                                           {"start": 2, "end": 4, "state": "product"}]}))
    return layer, creator, beats


def run(tmp_path, layer, creator, beats, *extra):
    return subprocess.run([sys.executable, str(SCRIPT), "--layer", str(layer), "--beats", str(beats),
                           "--creator", str(creator), "--out", str(tmp_path / "out.mp4"), *extra],
                          capture_output=True, text=True)


def test_divider_shows_on_split_beats_only(tmp_path):
    layer, creator, beats = fixtures(tmp_path)
    proc = run(tmp_path, layer, creator, beats, "--zoom", "1.2", "--divider", "#FF0000", "--divider-px", "6")
    assert proc.returncode == 0, proc.stderr
    r, g, b = pixel(tmp_path / "out.mp4", 1.0, W // 2, SEAM)
    assert r > 180 and g < 80 and b < 80, (r, g, b)
    r, g, b = pixel(tmp_path / "out.mp4", 3.0, W // 2, SEAM)
    assert not (r > 180 and g < 80), (r, g, b)


def test_bad_divider_is_refused(tmp_path):
    layer, creator, beats = fixtures(tmp_path)
    proc = run(tmp_path, layer, creator, beats, "--divider", "red")
    assert proc.returncode != 0 and "#RRGGBB" in proc.stderr
    assert not (tmp_path / "out.mp4").exists()
