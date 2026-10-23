#!/usr/bin/env python3
"""render-cosmic-mythology-voiceover — the FREE, deterministic assembly, as a RUNNABLE script.

Given the atempo VO, the stills, and the bound recipe config, this produces the 1080x1920 master:
weighted beat-sync sequencing -> Ken-Burns per still -> concat -> VO composite -> hook overlay ->
caption burn (-> optional end card). No paid calls, no API keys. $0. A re-cut reuses the same VO +
stills.

  render.py --config config.json --vo working/vo2/vo_atempo.mp3 --stills-dir working/stills \
            --out working/final.mp4 [--words working/vo2/words.json] [--endcard working/endcard.png]

TEXT WITHOUT drawtext/libass: stock Homebrew ffmpeg frequently lacks BOTH the `drawtext` and the
`subtitles`/libass filters, so this renderer burns the hook + captions as timed PIL PNG overlays
(ffmpeg `overlay=...:enable='between(t,st,en)'` for captions, `fade=...:alpha=1` for the hook) —
the recipe's documented fallback. It needs only Pillow + a stock ffmpeg (no text filters required).

CONFIG (the bound recipe.config): reads fps, crf, width, height, sequence{cuts[],zoom_end,
fade_in_first_s,fade_out_last_s}, hook{text,font_fallback,font_size,fade_in_s,hold_until_s,
fade_out_s,placement,font_color}, captions{position,font_color}. Each sequence cut is
{still,zoom_out,weight}; stills-dir holds <still>.png (or .jpg). words.json is optional word-level
timing ([{word|text,start,end}, ...], groq/fal shapes both accepted); without it captions are skipped.
"""
import argparse
import json
import os
import subprocess
import textwrap

from PIL import Image, ImageDraw, ImageFont

# ---- font resolution (portable across macOS + Linux) --------------------------------------------
_HOOK_FONTS = [
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
]
_CAP_FONTS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def _first_font(paths, size):
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("ffmpeg/ffprobe FAILED: " + " ".join(cmd[:6]) + "\n" + r.stderr[-1800:])
    return r


def dur(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                       "-of", "default=noprint_wrappers=1:nokey=1", path]).stdout.strip())


def still_path(stills_dir, sid):
    for ext in (".png", ".jpg", ".jpeg"):
        p = os.path.join(stills_dir, sid + ext)
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"still '{sid}' not found in {stills_dir}")


def ken_burns(img, out, N, zoom_out, zoom_end, fps, W, H, crf, fade_in=0.0, fade_out=0.0):
    seg = N / fps
    zamt = zoom_end - 1.0
    z = f"{zoom_end:.4f}-{zamt:.4f}*on/{N}" if zoom_out else f"1.0000+{zamt:.4f}*on/{N}"
    vf = (f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
          f"zoompan=z='{z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={fps}")
    if fade_in:
        vf += f",fade=t=in:st=0:d={fade_in}"
    if fade_out:
        vf += f",fade=t=out:st={max(0, seg - fade_out):.3f}:d={fade_out}"
    vf += ",format=yuv420p"
    run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(fps),
         "-t", f"{seg:.4f}", "-i", img, "-vf", vf, "-frames:v", str(N),
         "-c:v", "libx264", "-crf", str(crf), "-preset", "medium", "-pix_fmt", "yuv420p", out])


def render_hook_png(cfg_hook, W, H, out):
    text = cfg_hook.get("text", "").strip()
    if not text:
        return None
    size = int(cfg_hook.get("font_size", 62)) + 12  # a touch larger reads better at 1080w
    font = _first_font(list(cfg_hook.get("font_fallback", [])) + _HOOK_FONTS, size)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # wrap to ~24 chars so a long hook stacks to 2 lines
    lines = textwrap.fill(text, width=24).split("\n")
    line_h = int(size * 1.24)
    y0 = int(H * 0.13)
    for i, line in enumerate(lines):
        bb = d.textbbox((0, 0), line, font=font)
        x = (W - (bb[2] - bb[0])) // 2 - bb[0]
        y = y0 + i * line_h
        d.text((x + 3, y + 3), line, font=font, fill=(0, 0, 0, 180))       # soft shadow
        d.text((x, y), line, font=font, fill=(255, 255, 255, 255))
    im.save(out)
    return out


def build_caption_cues(words, video_dur, chunk=3):
    cues = []
    i = 0
    while i < len(words):
        grp = words[i:i + chunk]
        txt = " ".join((w.get("word") or w.get("text") or "").strip() for w in grp).strip()
        st = float(grp[0].get("start", 0) or 0)
        en = min(float(grp[-1].get("end", st + 0.4) or st + 0.4), video_dur)
        if en <= st:
            en = st + 0.4
        if txt:
            cues.append((st, en, txt))
        i += chunk
    return cues


def render_caption_png(text, cfg_caps, W, H, font, out):
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lines = textwrap.fill(text.upper(), width=22).split("\n")
    lh = int(font.size * 1.22)
    yb = int(H * (0.80 if cfg_caps.get("position", "bottom") == "bottom" else 0.5))
    fill = cfg_caps.get("font_color", "#FFFFFF")
    for i, line in enumerate(lines):
        bb = d.textbbox((0, 0), line, font=font)
        x = (W - (bb[2] - bb[0])) // 2 - bb[0]
        y = yb + i * lh
        for dx in (-3, 0, 3):                                # black outline for legibility
            for dy in (-3, 0, 3):
                if dx or dy:
                    d.text((x + dx, y + dy), line, font=font, fill=(0, 0, 0, 220))
        d.text((x, y), line, font=font, fill=fill)
    im.save(out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--vo", required=True)
    ap.add_argument("--stills-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--words", help="optional word-timing JSON for captions")
    ap.add_argument("--endcard", help="optional end-card PNG to append (~2.6s)")
    ap.add_argument("--work", default=None, help="scratch dir (default: <out dir>/_render)")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    W = int(cfg.get("width", 1080))
    H = int(cfg.get("height", 1920))
    fps = int(cfg.get("fps", 30))
    crf = int(cfg.get("crf", 18))
    seq = cfg["sequence"]
    cuts = seq["cuts"]
    zoom_end = float(seq.get("zoom_end", 1.10))
    fade_in_first = float(seq.get("fade_in_first_s", 0.4))
    fade_out_last = float(seq.get("fade_out_last_s", 0.6))

    work = a.work or os.path.join(os.path.dirname(os.path.abspath(a.out)) or ".", "_render")
    kb_dir = os.path.join(work, "kb")
    ovl_dir = os.path.join(work, "ovl")
    os.makedirs(kb_dir, exist_ok=True)
    os.makedirs(ovl_dir, exist_ok=True)

    vo_dur = dur(a.vo)
    sumw = sum(float(c.get("weight", 1.0)) for c in cuts)
    frames = [max(6, round(vo_dur * float(c.get("weight", 1.0)) / sumw * fps)) for c in cuts]
    total_frames = sum(frames)
    print(f"[render] vo={vo_dur:.3f}s cuts={len(cuts)} total={total_frames/fps:.3f}s {W}x{H}@{fps}")

    # 1) Ken-Burns per cut
    for i, (c, N) in enumerate(zip(cuts, frames)):
        img = still_path(a.stills_dir, c["still"])
        ken_burns(img, os.path.join(kb_dir, f"kb_{i:02d}.mp4"), N, bool(c.get("zoom_out")),
                  zoom_end, fps, W, H, crf,
                  fade_in=fade_in_first if i == 0 else 0.0,
                  fade_out=fade_out_last if i == len(cuts) - 1 else 0.0)

    # 2) concat
    concat_txt = os.path.join(kb_dir, "concat.txt")
    with open(concat_txt, "w") as f:
        for i in range(len(cuts)):
            f.write(f"file 'kb_{i:02d}.mp4'\n")
    bg = os.path.join(work, "bg.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concat_txt,
         "-c", "copy", bg])
    bg_dur = dur(bg)

    # 3) overlays: hook (alpha-faded) + captions (timed), then VO under the picture.
    # ii = the ffmpeg input INDEX of the last-added input (bg=0, vo=1); a `-loop 1 -t X -i p`
    # image input is 6 tokens, not 2, so track the index explicitly (never derive it from len()).
    inputs = ["-i", bg, "-i", a.vo]
    ii = 1
    fc, prev = [], "0:v"
    hook = cfg.get("hook", {})
    hook_png = render_hook_png(hook, W, H, os.path.join(ovl_dir, "hook.png"))
    if hook_png:
        fi = hook.get("fade_in_s", 0.5)
        hold = hook.get("hold_until_s", 2.4)
        fo = hook.get("fade_out_s", 0.6)
        inputs += ["-loop", "1", "-t", f"{bg_dur:.3f}", "-i", hook_png]
        ii += 1
        fc.append(f"[{ii}:v]format=rgba,fade=t=in:st=0.3:d={fi}:alpha=1,"
                  f"fade=t=out:st={hold}:d={fo}:alpha=1[hk]")
        fc.append(f"[{prev}][hk]overlay=0:0[bh]")
        prev = "bh"

    cues = []
    if a.words and os.path.exists(a.words):
        wj = json.load(open(a.words))
        words = wj.get("words", wj) if isinstance(wj, dict) else wj
        cues = build_caption_cues(words, bg_dur)
    else:
        print("[render] no --words: captions skipped")
    cap_font = _first_font(_CAP_FONTS, 60)
    for ci, (st, en, txt) in enumerate(cues):
        p = render_caption_png(txt, cfg.get("captions", {}), W, H, cap_font,
                               os.path.join(ovl_dir, f"cap_{ci:03d}.png"))
        inputs += ["-loop", "1", "-t", f"{bg_dur:.3f}", "-i", p]
        ii += 1
        nxt = f"c{ci}"
        fc.append(f"[{prev}][{ii}:v]overlay=0:0:enable='between(t,{st:.3f},{en:.3f})'[{nxt}]")
        prev = nxt

    reel = os.path.join(work, "reel.mp4") if a.endcard else a.out
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + inputs
    if fc:
        cmd += ["-filter_complex", ";".join(fc), "-map", f"[{prev}]"]
    else:
        cmd += ["-map", "0:v"]
    cmd += ["-map", "1:a", "-c:v", "libx264", "-crf", str(max(crf, 20)), "-preset", "medium",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest",
            "-movflags", "+faststart", reel]
    run(cmd)

    # 4) optional end card appended (fades up from black, silent tail)
    if a.endcard:
        ec_dur, N = 2.6, round(2.6 * fps)
        ec_mp4 = os.path.join(work, "endcard.mp4")
        vf = (f"scale={W*2}:{H*2}:force_original_aspect_ratio=increase,crop={W*2}:{H*2},"
              f"zoompan=z='1.00+0.04*on/{N}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={fps},"
              f"fade=t=in:st=0:d=0.5,format=yuv420p")
        run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(fps),
             "-t", f"{ec_dur}", "-i", a.endcard, "-f", "lavfi", "-t", f"{ec_dur}",
             "-i", "anullsrc=r=44100:cl=mono", "-vf", vf, "-frames:v", str(N),
             "-c:v", "libx264", "-crf", str(max(crf, 20)), "-preset", "medium", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", "-shortest", ec_mp4])
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", reel, "-i", ec_mp4,
             "-filter_complex", "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]",
             "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", str(max(crf, 20)),
             "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
             "-movflags", "+faststart", a.out])

    # poster + size report
    poster = os.path.splitext(a.out)[0] + "-thumb.jpg"
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "1.2", "-i", a.out, "-frames:v", "1",
         "-q:v", "3", poster])
    out_dur = dur(a.out)
    size = os.path.getsize(a.out)
    print(f"[render] OUT {a.out} {out_dur:.2f}s {size} bytes ({size/out_dur/1e6*8:.2f} Mbps) | poster {poster}")
    if size / out_dur > 1_000_000:  # ~>1MB/s → re-encode advised (see the master skill's QC gate)
        print("[render] WARNING: >~1MB/s — re-encode (-crf 23 / -maxrate 4M) before publishing")


if __name__ == "__main__":
    main()
