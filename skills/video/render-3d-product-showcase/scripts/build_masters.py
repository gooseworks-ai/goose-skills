#!/usr/bin/env python3
"""build_masters.py — the FREE, deterministic assembly (no paid calls, no keys).

Given the delivered beat clips + the end-card PNG + one instrumental bed, this
trims each beat to its window, normalizes every segment to the 720x1280 brand
canvas (strips the i2v model's auto-audio with -an), hard-concats in beat order
(no dissolves), and mixes the music bed at loudnorm I=-16 -> the h264+aac master.
Re-cuts reuse the existing beats and cost $0.

  build_masters.py --config config.json \
      --clips working/clips --endcard working/endcard.png \
      --music working/music.mp3 --out working/master.mp4

Expected inputs in --clips: beat1.mp4, beat2.mp4, beat3.mp4 (raw i2v takes;
beat3 optional / skipped when reveal_variant == rotation_only).

Per-beat trim window comes from config beats[].{duration_sec, trim_start}
(trim_start defaults to 0.0 for the rotation/macro beats and 1.0 for the Veo3
reveal so its 8s take lands on rise -> peak -> early settle).
"""
import argparse
import json
import pathlib
import subprocess
import sys
import tempfile

TS = "12800"  # shared video_track_timescale so concat -c copy is safe


def _run(cmd):
    subprocess.run(cmd, check=True)


def _dur(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def _normalize(src, dst, bg, dur, fps, trim_start, is_still):
    vf = (f"scale=720:1280:force_original_aspect_ratio=decrease,"
          f"pad=720:1280:(ow-iw)/2:(oh-ih)/2:color={bg},setsar=1,fps={fps},format=yuv420p")
    base = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    if is_still:
        base += ["-loop", "1", "-t", str(dur), "-i", str(src)]
    else:
        base += ["-ss", str(trim_start), "-t", str(dur), "-i", str(src)]
    base += ["-vf", vf, "-c:v", "libx264", "-crf", "18", "-preset", "medium",
             "-pix_fmt", "yuv420p", "-video_track_timescale", TS, "-an", str(dst)]
    _run(base)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--clips", default="working/clips")
    ap.add_argument("--endcard", default="working/endcard.png")
    ap.add_argument("--music", default=None)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    bg = cfg.get("studio_look", {}).get("bg", "#000000").replace("#", "0x")
    fps = cfg.get("fps", 24)
    clips = pathlib.Path(a.clips)
    reveal = cfg.get("reveal_variant", "")
    beats = cfg.get("beats", [])

    tmpdir = pathlib.Path(tempfile.mkdtemp(prefix="3dps_"))
    segs = []
    # video beats 1..3 (raw clips), then the end card still
    beat_files = {"beat-01-hero-rotation": "beat1.mp4",
                  "beat-02-macro-detail": "beat2.mp4",
                  "beat-03-reveal": "beat3.mp4"}
    default_trim = {"beat-03-reveal": 1.0}
    for b in beats:
        bid = b.get("id", "")
        dur = float(b.get("duration_sec", 4))
        if b.get("is_end_card"):
            seg = tmpdir / "seg_endcard.mp4"
            _normalize(a.endcard, seg, bg, dur, fps, 0.0, is_still=True)
            segs.append(seg)
            continue
        if bid == "beat-03-reveal" and reveal == "rotation_only":
            continue  # no reveal beat for rotation_only products
        src = clips / beat_files.get(bid, f"{bid}.mp4")
        if not src.exists():
            sys.exit(f"missing beat clip: {src}")
        trim_start = float(b.get("trim_start", default_trim.get(bid, 0.0)))
        seg = tmpdir / f"seg_{bid}.mp4"
        _normalize(src, seg, bg, dur, fps, trim_start, is_still=False)
        segs.append(seg)

    # hard-concat
    concat_txt = tmpdir / "concat.txt"
    concat_txt.write_text("".join(f"file '{s}'\n" for s in segs))
    silent = tmpdir / "silent_master.mp4"
    _run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-f", "concat",
          "-safe", "0", "-i", str(concat_txt), "-c", "copy", str(silent)])
    total = _dur(silent)

    if not a.music:
        _run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(silent),
              "-c", "copy", a.out])
        print(a.out, f"{total:.1f}s (no music)")
        return

    fade_out = max(0.0, total - 0.6)
    afilter = (f"[1:a]afade=t=in:st=0:d=0.3,afade=t=out:st={fade_out:.2f}:d=0.6,"
               f"loudnorm=I=-16:TP=-1.5:LRA=11,apad[a]")
    _run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
          "-i", str(silent), "-i", a.music, "-filter_complex", afilter,
          "-map", "0:v", "-map", "[a]", "-t", f"{total:.3f}",
          "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", a.out])
    print(a.out, f"{total:.1f}s")


if __name__ == "__main__":
    sys.exit(main())
