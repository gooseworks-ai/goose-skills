"""Tests for stitch.sh: where the SFX come from, and how loud the mix is.

Run: python3 -m pytest tests/   (needs ffmpeg + bash; no network)
Regenerate scripts/sfx-embedded.json after changing an mp3 in assets/sfx:
     python3 tests/test_stitch.py --write-embedded
Every clip is synthesised here with ffmpeg; each test states the case it covers.
"""
import base64
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

CAP = Path(__file__).resolve().parent.parent
ASSETS = CAP / "assets" / "sfx"
EMBEDDED = CAP / "scripts" / "sfx-embedded.json"
SFX_NAMES = ("imessage-receive.mp3", "imessage-send.mp3")

# What the GooseWorks catalog sync drops (BINARY_FILE_EXTENSIONS in the app's
# predefined-skills-sync.service.ts). A catalog fetch delivers everything else.
CATALOG_DROPS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".tiff", ".pdf", ".zip", ".tar",
    ".gz", ".bz2", ".7z", ".woff", ".woff2", ".ttf", ".eot", ".otf", ".mp3", ".mp4", ".wav",
    ".mov", ".avi", ".webm",
}

# Two receive chimes 1.44s apart (the QA-13 thread), a receive on top of a send,
# two receives stacked 0.3s apart (worst case), and a soft cue.
CUES = [
    {"t": 0.50, "name": "receive", "soft": False},
    {"t": 2.50, "name": "send", "soft": False},
    {"t": 4.00, "name": "receive", "soft": False},
    {"t": 5.44, "name": "receive", "soft": False},
    {"t": 7.00, "name": "send", "soft": False},
    {"t": 7.20, "name": "receive", "soft": False},
    {"t": 9.00, "name": "receive", "soft": False},
    {"t": 9.30, "name": "receive", "soft": False},
    {"t": 11.00, "name": "receive", "soft": True},
]
QUIET = (1.95, 0.4)  # after the first receive has decayed, before the send

pytestmark = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg not installed")


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


@pytest.fixture(scope="module")
def clips(tmp_path_factory):
    d = tmp_path_factory.mktemp("clips")
    ffmpeg("-f", "lavfi", "-i", "testsrc=size=1080x1920:rate=30:duration=12",
           "-pix_fmt", "yuv420p", "-c:v", "libx264", str(d / "chat.mp4"))
    ffmpeg("-f", "lavfi", "-i", "color=c=white:size=1080x1920:rate=30:duration=1.5",
           "-pix_fmt", "yuv420p", "-c:v", "libx264", str(d / "end.mp4"))
    # A loud bed (~-4.5 dBFS peak), like a mastered track.
    ffmpeg("-f", "lavfi", "-i", "sine=f=220:d=4", "-f", "lavfi", "-i", "sine=f=277:d=4",
           "-f", "lavfi", "-i", "sine=f=330:d=4", "-filter_complex",
           "[0][1][2]amix=inputs=3:normalize=0,volume=2.4,aformat=channel_layouts=stereo",
           "-c:a", "libmp3lame", str(d / "music.mp3"))
    (d / "cues.json").write_text(json.dumps(CUES))
    return d


def catalog_copy(dest, keep_embedded=True):
    """The capability as a catalog fetch delivers it: text files only, no assets/sfx."""
    for f in CAP.rglob("*"):
        rel = f.relative_to(CAP)
        if not f.is_file() or f.suffix.lower() in CATALOG_DROPS:
            continue
        if any(part.startswith(".") or part in ("node_modules", "__pycache__") for part in rel.parts):
            continue
        if rel.as_posix() == "scripts/sfx-embedded.json" and not keep_embedded:
            continue
        (dest / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dest / rel)
    return dest / "scripts" / "stitch.sh"


def stitch(stitch_sh, clips, out, *extra):
    return subprocess.run(
        ["bash", str(stitch_sh), "--chat", str(clips / "chat.mp4"), "--end", str(clips / "end.mp4"),
         "--sfx", str(clips / "cues.json"), "--out", str(out), *extra],
        capture_output=True, text=True)


def true_peak(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af",
                          "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"True peak:\s*\n\s*Peak:\s+(-?[\d.]+|-inf)", err).group(1))


def window(path, start, dur):
    """(max, mean) dB of a short window."""
    err = subprocess.run(["ffmpeg", "-hide_banner", "-ss", str(start), "-t", str(dur), "-i", str(path),
                          "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    mx = re.search(r"max_volume: (-?[\d.]+|-inf)", err).group(1)
    mn = re.search(r"mean_volume: (-?[\d.]+|-inf)", err).group(1)
    return float(mx), float(mn)


def assert_cues_audible(out):
    for c in CUES:
        mx, _ = window(out, c["t"], 0.3)
        assert mx > -15, f"{c['name']} cue at {c['t']}s is missing (max {mx} dB)"
    assert window(out, *QUIET)[0] < -20, "audio between cues should be near silent"


def test_embedded_sfx_match_assets():
    """sfx-embedded.json is the same bytes as assets/sfx (a catalog fetch only gets the json)."""
    files = json.loads(EMBEDDED.read_text())["files"]
    assert sorted(files) == sorted(SFX_NAMES)
    for name in SFX_NAMES:
        real = (ASSETS / name).read_bytes()
        assert real[:3] == b"ID3", f"{name} in assets/sfx is not an mp3 (LFS pointer?)"
        data = base64.b64decode(files[name]["base64"])
        assert data == real, f"{name}: embedded copy is stale, run --write-embedded"
        assert hashlib.sha256(data).hexdigest() == files[name]["sha256"]
        assert files[name]["bytes"] == len(real)


def test_catalog_fetched_copy_renders_real_sfx(clips, tmp_path):
    """No assets/ dir (what catalog_fetch delivers): stitch decodes the embedded SFX."""
    stitch_sh = catalog_copy(tmp_path / "cap")
    assert not (tmp_path / "cap" / "assets").exists()
    out = tmp_path / "final.mp4"
    r = stitch(stitch_sh, clips, out)
    assert r.returncode == 0, r.stderr
    assert_cues_audible(out)
    assert true_peak(out) < -1.0


def test_stacked_chimes_do_not_clip(clips, tmp_path):
    """Full checkout: overlapping receive chimes peak below -1 dBTP (was ~0 dBTP, flat-topped)."""
    out = tmp_path / "final.mp4"
    r = stitch(CAP / "scripts" / "stitch.sh", clips, out)
    assert r.returncode == 0, r.stderr
    assert true_peak(out) < -1.0
    assert_cues_audible(out)
    # A lone receive chime stays clearly audible. The level is the one approved in the
    # GOOSE-3741 audit renders (about -10.4 dB mean in this window, -11.4 LUFS on a
    # full Graza render); the old +4 dB mix was heard as too loud next to them.
    assert window(out, CUES[0]["t"], 0.35)[1] > -12.0


def test_music_bed_mix_stays_below_minus_1_dbtp(clips, tmp_path):
    out = tmp_path / "final.mp4"
    r = stitch(CAP / "scripts" / "stitch.sh", clips, out, "--music", str(clips / "music.mp3"), "--also-1x1")
    assert r.returncode == 0, r.stderr
    assert true_peak(out) < -1.0
    assert window(out, *QUIET)[1] > -30, "the music bed should be audible between cues"
    for c in CUES[:2]:
        assert window(out, c["t"], 0.3)[0] > window(out, *QUIET)[0], "SFX should sit above the bed"
    assert (tmp_path / "final-1x1.mp4").exists()


def test_no_sfx_anywhere_fails_clearly(clips, tmp_path):
    stitch_sh = catalog_copy(tmp_path / "cap", keep_embedded=False)
    r = stitch(stitch_sh, clips, tmp_path / "final.mp4")
    assert r.returncode != 0
    assert "imessage-send.mp3" in r.stderr and "sfx-embedded.json" in r.stderr and "--sfx-dir" in r.stderr


def test_damaged_embedded_copy_fails_clearly(clips, tmp_path):
    stitch_sh = catalog_copy(tmp_path / "cap")
    emb = tmp_path / "cap" / "scripts" / "sfx-embedded.json"
    doc = json.loads(emb.read_text())
    doc["files"]["imessage-send.mp3"]["base64"] = doc["files"]["imessage-send.mp3"]["base64"][:2000]
    emb.write_text(json.dumps(doc))
    r = stitch(stitch_sh, clips, tmp_path / "final.mp4")
    assert r.returncode != 0
    assert "imessage-send.mp3" in r.stderr and "sha256" in r.stderr


def test_truncated_embedded_copy_fails_clearly(clips, tmp_path):
    """An agent that saves only part of the fetched json gets the same clear message, not a traceback."""
    stitch_sh = catalog_copy(tmp_path / "cap")
    emb = tmp_path / "cap" / "scripts" / "sfx-embedded.json"
    text = emb.read_text()
    emb.write_text(text[: len(text) // 2])
    r = stitch(stitch_sh, clips, tmp_path / "final.mp4")
    assert r.returncode != 0
    assert "is damaged" in r.stderr and "Re-fetch render-imessage-chat" in r.stderr
    assert "Traceback" not in r.stderr


def test_sfx_dir_missing_a_file_names_it(clips, tmp_path):
    d = tmp_path / "sfx"
    d.mkdir()
    shutil.copy2(ASSETS / "imessage-send.mp3", d)
    r = stitch(CAP / "scripts" / "stitch.sh", clips, tmp_path / "final.mp4", "--sfx-dir", str(d))
    assert r.returncode != 0
    assert f"{d}/imessage-receive.mp3" in r.stderr


def write_embedded():
    files = {}
    for name in SFX_NAMES:
        b = (ASSETS / name).read_bytes()
        assert b[:3] == b"ID3", f"{name} is not an mp3 (run git lfs pull?)"
        files[name] = {"bytes": len(b), "sha256": hashlib.sha256(b).hexdigest(),
                       "base64": base64.b64encode(b).decode()}
    doc = json.loads(EMBEDDED.read_text()) if EMBEDDED.exists() else {}
    doc["files"] = files
    EMBEDDED.write_text(json.dumps(doc, indent=2) + "\n")
    print(f"wrote {EMBEDDED}")


if __name__ == "__main__" and "--write-embedded" in sys.argv:
    write_embedded()
