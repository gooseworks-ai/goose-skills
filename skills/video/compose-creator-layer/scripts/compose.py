#!/usr/bin/env python3
"""Drop the creator into the product layer: the creator's zone on split beats, the whole
frame on creator beats, hidden on product beats. The creator's voice is the audio. Free.

    compose.py --layer layer.mp4 --beats cutlist.aligned.json --creator creator.mp4 \
        --out reel.mp4 [--music bed.mp3 --music-db -20] [--head 0.30] \
        [--zoom 1.15] [--divider '#3366FF' --divider-px 4]

--layer is footage-cutlist cut.py output, rendered from the SAME (aligned) cut list as
--beats, so the two timelines agree. --creator is create-creator-takes-h3 join_takes.py
output (one continuous creator track, reel time from 0).

The creator is scaled to COVER each area and cropped, with the head kept near the top
third (--head is where the crop sits vertically: 0 = keep the top, 0.5 = centre). The crop
is computed from the take's real size; a hard-coded input height once cropped the top half
of an upscaled take and blew it up.

Split screen (the split-screen creator look): --zoom pushes in on the creator inside their
zone so a webcam-distance take reads head-to-shoulders (1.15 to 1.2; tune by eye, it is a free
re-run), and --divider draws a brand-colour bar across the seam on split beats only.

NO GRADE. Matching the take's saturation or warmth to a number was tried twice on the
reference build and both looked wrong; the take goes in as generated.

Audio (--audio):
  creator  (default) the creator's own voice, loudness-normalised to -14 LUFS; an optional
           --music bed is mixed under it and ducked (sidechain) so the voice always leads.
  music    the --music bed alone (a voiceless format, e.g. a screen walkthrough for a
           paid placement), normalised to -14 LUFS with a fade out.
  none     a SILENT master (organic posts where the track is added in-platform at upload,
           which is licensed for organic use; a paid ad cannot use that library).
The creator track may be shorter than the reel (a 2.3s reaction hook): it only shows during
its own `creator` beats.
"""
import argparse
import json
import pathlib
import re
import subprocess


def zone(spec):
    W, H = spec["size"]
    seam = spec.get("seam") or H // 2
    if spec.get("creator_side", "bottom") == "bottom":
        return seam, H - seam
    return 0, seam


def even(n):
    return max(2, int(round(n / 2.0)) * 2)


def cover(label, out, w, h, head, zoom=1.0):
    """Scale to cover a w x h area (times zoom, to push in) and crop it, the crop's top at head."""
    sw, sh = even(w * zoom), even(h * zoom)
    return ("%s scale=%d:%d:force_original_aspect_ratio=increase:flags=lanczos,"
            "crop=%d:%d:(iw-%d)/2:(ih-%d)*%.3f,setsar=1%s" % (label, sw, sh, w, h, w, h, head, out))


def divider(seam, px, color, wins):
    """A colour bar centred on the seam, drawn only while the split beats show."""
    return "drawbox=x=0:y=%d:w=iw:h=%d:color=%s@1:t=fill:enable='%s'" % (
        seam - px // 2, px, color, enable(wins))


def windows(beats, state):
    return [(b["start"], b["end"]) for b in beats if b.get("state", "split") == state]


def enable(wins):
    return "+".join("between(t,%.3f,%.3f)" % (s, e - 0.001) for s, e in wins) or "0"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--layer", required=True)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--creator", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--music")
    ap.add_argument("--music-db", type=float, default=-20.0)
    ap.add_argument("--head", type=float, default=0.30)
    ap.add_argument("--audio", choices=["creator", "music", "none"], default="creator")
    ap.add_argument("--zoom", type=float, default=1.0,
                    help="push in on the creator inside the split zone (1.0 = cover only)")
    ap.add_argument("--divider", help="brand colour of the seam bar on split beats, #RRGGBB")
    ap.add_argument("--divider-px", type=int, default=4, help="seam bar height in px (even)")
    a = ap.parse_args()
    if not 1.0 <= a.zoom <= 2.0:
        raise SystemExit("--zoom must be between 1.0 and 2.0")
    if a.divider is not None and not re.fullmatch(r"#[0-9A-Fa-f]{6}", a.divider):
        raise SystemExit("--divider must be a #RRGGBB colour")
    if a.divider_px < 2 or a.divider_px % 2:
        raise SystemExit("--divider-px must be an even number of pixels, 2 or more")
    spec = json.loads(pathlib.Path(a.beats).read_text(encoding="utf-8"))
    lj = pathlib.Path(a.layer).with_suffix(".json")
    if lj.exists() and json.loads(lj.read_text()).get("draft"):
        raise SystemExit("%s is a --draft layer; re-run cut.py without --draft" % a.layer)
    W, H = spec["size"]
    fps = int(spec.get("fps", 30))
    total = spec["beats"][-1]["end"]
    zy, zh = zone(spec)
    split_w, full_w = windows(spec["beats"], "split"), windows(spec["beats"], "creator")
    fc = ["[1:v]trim=0:%.3f,setpts=PTS-STARTPTS,fps=%d,split=2[ca][cb]" % (total, fps),
          cover("[ca]", "[cz]", W, zh, a.head, a.zoom),
          cover("[cb]", "[cf]", W, H, a.head),
          "[0:v]trim=0:%.3f,setpts=PTS-STARTPTS,setsar=1[bg]" % total,
          "[bg][cz]overlay=0:%d:enable='%s'[v1]" % (zy, enable(split_w)),
          "[v1][cf]overlay=0:0:enable='%s'%s,format=yuv420p[v]" % (
              enable(full_w),
              "," + divider(spec.get("seam") or H // 2, a.divider_px, a.divider, split_w) if a.divider else ""),
          ]
    inputs = ["-i", a.layer, "-i", a.creator]
    amap = ["-map", "[a]"]
    if a.audio == "creator":
        fc.append("[1:a]atrim=0:%.3f,asetpts=PTS-STARTPTS,aresample=48000[vo]" % total)
        if a.music:
            inputs += ["-stream_loop", "-1", "-i", a.music]
            fc += ["[vo]asplit=2[vo1][vo2]",
                   "[2:a]atrim=0:%.3f,asetpts=PTS-STARTPTS,aresample=48000,volume=%.1fdB,"
                   "afade=t=out:st=%.3f:d=0.8[m]" % (total, a.music_db, max(0, total - 0.8)),
                   "[m][vo2]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[md]",
                   "[vo1][md]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]"]
        else:
            fc.append("[vo]loudnorm=I=-14:TP=-1.5:LRA=11[a]")
    elif a.audio == "music":
        if not a.music:
            raise SystemExit("--audio music needs --music")
        inputs += ["-stream_loop", "-1", "-i", a.music]
        fc.append("[2:a]atrim=0:%.3f,asetpts=PTS-STARTPTS,aresample=48000,afade=t=out:st=%.3f:d=0.8,"
                  "loudnorm=I=-14:TP=-1.5:LRA=11[a]" % (total, max(0, total - 0.8)))
    else:
        amap = ["-an"]
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc),
                    "-map", "[v]", *amap, "-t", "%.3f" % total, "-r", str(fps),
                    "-c:v", "libx264", "-crf", "12", "-preset", "medium", "-c:a", "aac", "-b:a", "192k",
                    "-ar", "48000", "-movflags", "+faststart", a.out], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                              a.out], capture_output=True, text=True).stdout)
    print("[compose] %.2fs  %dx%d  creator zone y=%d h=%d  split %d / full %d / product %d beats -> %s"
          % (d, W, H, zy, zh, len(split_w), len(full_w),
             len(spec["beats"]) - len(split_w) - len(full_w), a.out))


if __name__ == "__main__":
    main()
