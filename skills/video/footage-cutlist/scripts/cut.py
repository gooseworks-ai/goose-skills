#!/usr/bin/env python3
"""Render the cut list into the PRODUCT LAYER: a full-size, silent track where every beat's
footage sits in its box and the creator's area is left as a flat plate. Free, local.

    cut.py --cutlist cutlist.json --out layer.mp4 [--draft]

compose-creator-layer then drops the creator into the plate. Rendering the footage first
is deliberate: it is free, and it constrains everything above it, so the user approves the
product layer before any paid take exists.

Framing (per beat `fit`, for the plain look):
  width  fit the whole frame inside the box (by width, or by height if that overflows) and
         fill the rest with `bg`. The default, because footage with copy in it must never
         be cropped: cropping a panel into a narrower aspect slices through the words.
  cover  fill the box and crop the overflow, keeping `focus` [x,y] centred. Only for
         footage whose subject survives the crop.
  crop   cut a source box `crop` [x0,y0,x1,y1] (fractions) first, then fit it by width. For
         a subject that is small or off-centre in a big screen recording.

`look: "screen"` instead frames the footage as a filmed screen (see filmed.py): `crop` picks
the source region and `screen` {rot, keystone, fill, fit, drift} sets the geometry; `mask`
boxes are blurred in the source. For screen inserts and walkthroughs.

bg: "auto" samples the footage's own corner colour so the letterbox and the footage read as
one surface and the only visible edge is the seam. "blur" fills with a darkened blurred
copy of the same frame. "#rrggbb" is a flat colour.

`transition: {"dissolve_frames": 7}` at the top level cross-dissolves every beat into the
next (6-7 frames reads as the camera being re-aimed; a hard cut between two screens reads as
an edit). Each beat renders the extra frames, so the total length still equals the cut list.

Sources may be videos or still images (a screenshot holds for its whole slot; give it
`look: "screen"` so the drift keeps it alive).
"""
import argparse
import pathlib
import shutil
import subprocess
import tempfile

from _common import sample_bg, save
from cutlist import box_for, check_or_die

PLATE = "0x1A1A1A"


def even(v):
    return max(2, int(round(v / 2.0)) * 2)


def plain_chain(spec, b, W, H, fps, dur, bgmode):
    """Filter graph (input 0 = the source window) producing [v], W x H, `dur` seconds."""
    y, bh = box_for(spec, b)
    src = spec["_sources"][b["source"]]
    sw, sh = src["width"], src["height"]
    fit = b.get("fit", "width")
    pre = "[0:v]setpts=(PTS-STARTPTS)/%.6f,fps=%d" % (b["speed"], fps)
    if src.get("still"):
        pre = "[0:v]fps=%d" % fps
    if fit == "crop":
        x0, y0, x1, y1 = b["crop"]
        cw, ch = even((x1 - x0) * sw), even((y1 - y0) * sh)
        pre += ",crop=%d:%d:%d:%d" % (cw, ch, int(x0 * sw), int(y0 * sh))
        sw, sh = cw, ch
        fit = "width"
    base = "color=c=%s:s=%dx%d:r=%d:d=%.4f" % (PLATE, W, H, fps, dur)
    if fit == "cover":
        s = max(W / sw, bh / sh)
        rw, rh = even(sw * s), even(sh * s)
        fx, fy = b.get("focus", [0.5, 0.5])
        ox = min(max(int(fx * rw - W / 2), 0), rw - W)
        oy = min(max(int(fy * rh - bh / 2), 0), rh - bh)
        return ";".join(["%s,scale=%d:%d:flags=lanczos,crop=%d:%d:%d:%d,setsar=1[f]" % (pre, rw, rh, W, bh, ox, oy),
                         base + "[z]", "[z][f]overlay=0:%d:shortest=1,setsar=1[v]" % y])
    s = min(W / sw, bh / sh)
    rw, rh = even(sw * s), even(sh * s)
    ox, oy = (W - rw) // 2, y + (bh - rh) // 2
    bg = b.get("bg") or bgmode
    if bg == "blur":
        return ";".join([
            "%s,split[fa][fb]" % pre,
            "[fa]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,gblur=sigma=30,"
            "eq=brightness=-0.18,setsar=1[bl]" % (W, bh, W, bh),
            "[fb]scale=%d:%d:flags=lanczos,setsar=1[f]" % (rw, rh),
            base + "[z]", "[z][bl]overlay=0:%d:shortest=1[zb]" % y,
            "[zb][f]overlay=%d:%d:shortest=1,setsar=1[v]" % (ox, oy)])
    col = sample_bg(src["path"], b["in"] + 0.1) if bg == "auto" else "0x" + bg.lstrip("#")
    return ";".join(["%s,scale=%d:%d:flags=lanczos,setsar=1[f]" % (pre, rw, rh),
                     base + ",drawbox=x=0:y=%d:w=%d:h=%d:color=%s:t=fill[z]" % (y, W, bh, col),
                     "[z][f]overlay=%d:%d:shortest=1,setsar=1[v]" % (ox, oy)])


def src_args(src, b, dur):
    if src.get("still"):
        return ["-loop", "1", "-t", "%.4f" % (dur + 0.2), "-i", src["path"]]
    return ["-ss", "%.3f" % b["in"], "-t", "%.3f" % (dur * b["speed"] + 0.25), "-i", src["path"]]


def render_screen(spec, b, idx, W, H, fps, nframes, out, enc):
    """Frame loop through filmed.ScreenLook, piped straight into ffmpeg."""
    import numpy as np
    from PIL import Image
    from filmed import ScreenLook
    y, bh = box_for(spec, b)
    src = spec["_sources"][b["source"]]
    look = ScreenLook(W, bh, b.get("screen"), seed=idx * 1000 + 7)
    sw, sh = src["width"], src["height"]
    dur = nframes / float(fps)
    dec = subprocess.Popen(["ffmpeg", "-v", "error", *src_args(src, b, dur), "-vf",
                            ("fps=%d" % fps) if src.get("still") else
                            "setpts=(PTS-STARTPTS)/%.6f,fps=%d" % (b["speed"], fps),
                            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE,
                           stderr=subprocess.DEVNULL)
    encp = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                             "-s", "%dx%d" % (W, H), "-r", str(fps), "-i", "-", "-c:v", "libx264",
                             *enc, "-pix_fmt", "yuv420p", str(out)], stdin=subprocess.PIPE)
    canvas = Image.new("RGB", (W, H), (26, 26, 26))
    fsz = sw * sh * 3
    last = None
    for k in range(nframes):
        buf = dec.stdout.read(fsz)
        if len(buf) == fsz:
            last = Image.frombuffer("RGB", (sw, sh), buf, "raw", "RGB", 0, 1)
        if last is None:
            raise SystemExit("%s: no frames decoded from %s" % (b["id"], src["path"]))
        fr = look.render(last, k / float(fps), k, crop=b.get("crop"), masks=b.get("mask"))
        canvas.paste(fr, (0, y))
        encp.stdin.write(np.asarray(canvas).tobytes())
    dec.kill()          # it may still be decoding frames past the slot; they are not needed
    dec.stdout.close()
    dec.wait()
    encp.stdin.close()
    if encp.wait():
        raise SystemExit("encode failed for %s" % b["id"])


def render_photo(spec, b, W, H, fps, nframes, out, enc):
    from PIL import Image
    from photo import render
    y, bh = box_for(spec, b)
    src = Image.open(spec["_sources"][b["source"]]["path"]).convert("RGB")
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
                          "-s", f"{W}x{H}", "-r", str(fps), "-i", "-", "-an", "-c:v", "libx264",
                          *enc, "-pix_fmt", "yuv420p", str(out)], stdin=subprocess.PIPE)
    try:
        for k in range(nframes):
            canvas = Image.new("RGB", (W,H), (26,26,26))
            progress = (k/fps) / (b["end"]-b["start"])
            canvas.paste(render(src, W, bh, b, progress, b.get("bg") or spec["bg"]), (0,y))
            p.stdin.write(canvas.tobytes())
    finally:
        p.stdin.close()
    if p.wait():
        raise RuntimeError("photo encoding failed")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cutlist", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--draft", action="store_true", help="fast, half-size, for review only")
    x = ap.parse_args()
    spec = check_or_die(x.cutlist)
    W, H = spec["size"]
    fps = int(spec["fps"])
    N = int((spec.get("transition") or {}).get("dissolve_frames", 0))
    enc = ["-preset", "ultrafast", "-crf", "24"] if x.draft else ["-preset", "medium", "-crf", "12"]
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="cut-"))
    parts, beats = [], spec["beats"]
    try:
        for i, b in enumerate(beats):
            slot = b["end"] - b["start"]
            nfr = int(round(b["end"] * fps)) - int(round(b["start"] * fps)) + (N if i < len(beats) - 1 else 0)
            dur = nfr / float(fps)
            part = tmp / ("p%02d.mp4" % i)
            if b["state"] == "creator":
                cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                       "color=c=%s:s=%dx%d:r=%d:d=%.4f" % (PLATE, W, H, fps, dur),
                       "-frames:v", str(nfr), "-c:v", "libx264", *enc, "-pix_fmt", "yuv420p", str(part)]
                subprocess.run(cmd, check=True)
            elif b.get("look") == "photo":
                render_photo(spec, b, W, H, fps, nfr, part, enc)
            elif b.get("look") == "screen":
                render_screen(spec, b, i, W, H, fps, nfr, part, enc)
            else:
                src = spec["_sources"][b["source"]]
                subprocess.run(["ffmpeg", "-v", "error", "-y", *src_args(src, b, dur), "-filter_complex",
                                plain_chain(spec, b, W, H, fps, dur, spec["bg"]), "-map", "[v]",
                                "-frames:v", str(nfr), "-an", "-c:v", "libx264", *enc, "-pix_fmt", "yuv420p",
                                str(part)], check=True)
            parts.append((part, nfr))
            print("  %-4s %6.2f-%6.2f  %-7s %s" % (b["id"], b["start"], b["end"], b["state"],
                  "" if b["state"] == "creator" else "%s @%.2f %s%s" % (b["source"], b["in"],
                  b.get("look") or b.get("fit", "width"), "" if abs(b["speed"] - 1) < 0.01 else " %.2fx" % b["speed"])))
        cmd = ["ffmpeg", "-v", "error", "-y"]
        for p, _ in parts:
            cmd += ["-i", str(p)]
        norm = ["[%d:v]fps=%d,settb=AVTB,setpts=PTS-STARTPTS,format=yuv420p[n%d]" % (i, fps, i)
                for i in range(len(parts))]
        if N and len(parts) > 1:
            d = N / float(fps)
            chain, prev, acc = [], "[n0]", 0
            for i in range(1, len(parts)):
                acc += int(round(beats[i - 1]["end"] * fps)) - int(round(beats[i - 1]["start"] * fps))
                lab = "[x%d]" % i
                chain.append("%s[n%d]xfade=transition=fade:duration=%.4f:offset=%.4f%s"
                             % (prev, i, d, acc / float(fps), lab))
                prev = lab
            graph = ";".join(norm + chain) + ";%sformat=yuv420p%s[v]" % (prev, ",scale=%d:%d" % (W // 2, H // 2) if x.draft else "")
        else:
            graph = ";".join(norm) + ";%sconcat=n=%d:v=1:a=0%s,format=yuv420p[v]" % (
                "".join("[n%d]" % i for i in range(len(parts))), len(parts),
                ",scale=%d:%d" % (W // 2, H // 2) if x.draft else "")
        cmd += ["-filter_complex", graph, "-map", "[v]", "-an", "-r", str(fps), "-c:v", "libx264", *enc,
                "-movflags", "+faststart", x.out]
        subprocess.run(cmd, check=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    layer = {k: v for k, v in spec.items() if not k.startswith("_")}
    layer["layer"] = str(pathlib.Path(x.out).resolve())
    layer["draft"] = bool(x.draft)
    save(pathlib.Path(x.out).with_suffix(".json"), layer)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                              "csv=p=0", x.out], capture_output=True, text=True).stdout)
    print("[cut] %d beats, %.2fs (cut list %.2fs)%s %s -> %s  (+ %s)"
          % (len(beats), d, spec["duration"], " %d-frame dissolves" % N if N else "",
             "DRAFT" if x.draft else "%dx%d" % (W, H), x.out, pathlib.Path(x.out).with_suffix(".json").name))
    if abs(d - spec["duration"]) > 0.1:
        raise SystemExit("rendered %.2fs but the cut list is %.2fs" % (d, spec["duration"]))


if __name__ == "__main__":
    main()
