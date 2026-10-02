#!/usr/bin/env python3
"""Five finished looks from ONE generated take. Free.

    python build_looks.py                 # all five
    python build_looks.py --looks subway  # one

The take costs ~$3.64 and the graphics cost nothing, so the cheap axis of variation is the
brand layer, not the generation. These five are not five palettes of the same idea: each is a
different published grammar, measured off the reference set in `../refs/REFERENCES.md`.

  clean    what we shipped. Title, two burned answers, a gold payoff, a dark end card.
  subway   SubwayTakes: a brand-colour bar across the top for the whole video, a location pill,
           small sentence-case captions on a plate low in the frame, an occupation pill per
           speaker. The most "this is a series" of the five.
  karaoke  TikTok-native. Two or three words at a time, huge, centred, heavy stroke, changing
           about four times a second. Nothing else on screen.
  bare     No captions at all under the speech. A title for two seconds, then the end card.
           The honest control: if the video does not work here, graphics were carrying it.
  doc      Documentary lower third: a thin bar, sentence case, no shouting, a muted grade.

Every treatment writes text with PIL. No model renders a letter, ever.
"""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import brandkit
import paths

HERE = paths.HERE
ROOT = paths.ROOT
# The brand layer used to be hardcoded here too: one client's asset folder, one take filename,
# one series header, one end card and four lines of dialogue. All of it now comes from
# brands/<slug>.json via resolve(); nothing below names a brand. See format_spec.py for why.
CFG = None
TAKE = None                          # the approved base for this brand; never re-rolled
# SRC / OUTDIR / CTRL are resolved per run in main(), not at import, because the take lives in
# the RUN folder and not next to the script. They are module-level names because check-cut.py
# imports this module for LINES and CUTS.
SRC = OUTDIR = CTRL = RUN = None
W, H = 1080, 1920
SAFE_TOP, SAFE_BOT = 285, 1635
def resolve_font(weight):
    names = {"black": ("ariblk.ttf", "Arial Black.ttf", "DejaVuSans-Bold.ttf"),
             "bold": ("arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"),
             "regular": ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf")}[weight]
    roots = (Path("C:/Windows/Fonts"), Path("/System/Library/Fonts/Supplemental"),
             Path("/usr/share/fonts/truetype/dejavu"))
    for root in roots:
        for name in names:
            candidate = root / name
            if candidate.is_file():
                return str(candidate)
    raise RuntimeError(f"No {weight} TrueType font found. Install Arial or DejaVu Sans.")


BLACK, BOLD, REG = (resolve_font(w) for w in ("black", "bold", "regular"))
GOLD, CREAM, INK = (203, 161, 79), (252, 246, 239), (12, 12, 12)

# The take's OWN internal cuts, MEASURED off the render and stored in the brand config, never
# calculated from the script. Every caption is clamped inside the shot it belongs to. Letting one
# run 0.3s past its cut printed the previous person's words over the next person's face, which is
# the fault that got the assembled version rejected and is just as possible inside a single take.
# Empty until resolve() runs, because they belong to a take and a take belongs to a brand.
CUTS = []
# Caption rows are (start, end, shouted, style, occupation pill, sentence case). `sent` is written
# out in the config rather than derived: title-casing the shouted line gave "Gonna Kill Me.",
# which reads as a band name.
LINES = []


def run(c, **k):
    subprocess.run([str(x) for x in c], check=True, **k)


def heavy(text, size, fill, font=None, italic=True, outline=6, alpha=235):
    f = ImageFont.truetype(font or BLACK, size)
    tw = int(ImageDraw.Draw(Image.new("RGBA", (10, 10))).textlength(text, font=f))
    pad = outline * 2 + size
    img = Image.new("RGBA", (tw + pad * 2, int(size * 1.9)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for dx in range(-outline, outline + 1, 2):
        for dy in range(-outline, outline + 1, 2):
            if dx or dy:
                d.text((pad + dx, size * 0.28 + dy), text, font=f, fill=(12, 12, 12, alpha))
    d.text((pad, size * 0.28), text, font=f, fill=fill + (255,))
    if italic:
        sh = 0.22
        img = img.transform((img.width + int(img.height * sh), img.height), Image.AFFINE,
                            (1, sh, -sh * img.height, 0, 1, 0), resample=Image.BICUBIC)
    return img


def fit(text, size, fill, max_w, **kw):
    """Shrink until it fits. The first renderer centred without ever checking width, so
    "WAIT, THAT'S WATER." at 96px was ~1140px on a 1080 frame and lost a letter at each edge."""
    while size > 30:
        img = heavy(text, size, fill, **kw)
        if img.width <= max_w:
            return img
        size -= 4
    return heavy(text, 30, fill, **kw)


def plate(canvas, box, fill=(10, 10, 10, 170), r=18):
    lay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle(box, radius=r, fill=fill)
    canvas.alpha_composite(lay)


def place(canvas, img, y):
    assert SAFE_TOP <= y and y + img.height <= SAFE_BOT, f"caption at y={y}..{y + img.height}"
    assert img.width <= W - 60, "caption wider than the frame"
    canvas.alpha_composite(img, ((W - img.width) // 2, y))


# ── the five treatments ────────────────────────────────────────────────────────────────────
def t_clean(text, style, job, sent):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if style == "title":
        y = 380
        for row in text.split("|"):
            t = fit(row, 66, CREAM, W - 90)
            c.alpha_composite(t, ((W - t.width) // 2, y))
            y += 86
    else:
        col, size = (GOLD, 96) if style == "payoff" else (CREAM, 78)
        t = fit(text, size, col, W - 90)
        place(c, t, 1400 - t.height // 2)
    return c


def subway_brand_layer():
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # the series bar: on screen the whole video, which is what makes a vox pop read as a format
    plate(c, (0, 300, W, 386), fill=(24, 24, 24, 235), r=0)
    f = ImageFont.truetype(BLACK, 40)
    d = ImageDraw.Draw(c)
    hdr = CFG["brand_layer"]["series_header"]
    if d.textlength(hdr, font=f) > W - 120:
        raise ValueError("series_header is wider than the safe area; shorten it")
    d.text(((W - d.textlength(hdr, font=f)) // 2, 316), hdr, font=f, fill=GOLD + (255,))
    return c


def t_subway(text, style, job, sent):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    body = sent
    fb = ImageFont.truetype(BOLD, 52)
    words, rows, cur = body.split(), [], ""
    for wd in words:
        if d.textlength((cur + " " + wd).strip(), font=fb) <= W - 220:
            cur = (cur + " " + wd).strip()
        else:
            rows.append(cur)
            cur = wd
    rows.append(cur)
    top = 1330 - len(rows) * 34
    plate(c, (80, top - 26, W - 80, top + len(rows) * 66 + 18))
    for i, row in enumerate(rows):
        d.text(((W - d.textlength(row, font=fb)) // 2, top + i * 66), row, font=fb,
               fill=(255, 255, 255, 255))
    if job:
        fj = ImageFont.truetype(BLACK, 34)
        jw = int(d.textlength(job, font=fj)) + 52
        plate(c, (80, top - 116, 80 + jw, top - 52), fill=GOLD + (255,), r=32)
        d.text((106, top - 106), job, font=fj, fill=(18, 18, 18, 255))
    assert top + len(rows) * 66 + 18 < SAFE_BOT
    return c


def t_karaoke(text, style, job, sent):
    return None   # built per word-group in build(), not as one still


def t_bare(text, style, job, sent):
    if style != "title":
        return None
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    y = 380
    for row in text.split("|"):
        t = fit(row, 60, CREAM, W - 90)
        c.alpha_composite(t, ((W - t.width) // 2, y))
        y += 80
    return c


def t_doc(text, style, job, sent):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    body = sent
    f = ImageFont.truetype(REG, 46)
    rows, cur = [], ""
    for wd in body.split():
        if d.textlength((cur + " " + wd).strip(), font=f) <= W - 260:
            cur = (cur + " " + wd).strip()
        else:
            rows.append(cur)
            cur = wd
    rows.append(cur)
    top = 1380
    plate(c, (110, top - 22, W - 110, top + len(rows) * 58 + 14), fill=(16, 18, 20, 190), r=6)
    lay = Image.new("RGBA", c.size, (0, 0, 0, 0))
    ImageDraw.Draw(lay).rectangle((110, top - 22, 118, top + len(rows) * 58 + 14), fill=GOLD + (255,))
    c.alpha_composite(lay)
    for i, row in enumerate(rows):
        d.text((150, top + i * 58), row, font=f, fill=(238, 238, 238, 255))
    assert top + len(rows) * 58 + 14 < SAFE_BOT
    return c


TREAT = {"clean": t_clean, "subway": t_subway, "karaoke": t_karaoke, "bare": t_bare, "doc": t_doc}
# `doc` is the muted treatment. It used to get its mute from `--strength 0.95`, i.e. from the
# fitted per-channel LUT -- the one thing in this chain already MEASURED to swing the black point
# wherever the colour reference happens to sit (4804 to Klemens gave 16.1, 4806 to Salary
# Transparent gave 26.6, against a real band of 7.0 to 10.3, which is why --strength defaults to
# 0 everywhere else). Measured 2026-09-30 on the shipped seed-4815 take, `doc` came out at a
# 1st-percentile of 2.0 while the other four looks sat at 9.0: the one look with a LUT blend was
# the one look out of band, in the crushed direction, and it had been out of band since it was
# written. The mute is now a saturation scalar, which moves colour and nothing else.
GRADE = {"doc": ["--saturation", "0.78", "--unsharp", "0.05"]}


def grade_args(look):
    """The grade flags for one look: the per-look overrides above, plus the SOLVED black lift and
    saturation for this brand's take if the config carries them.

    Added 2026-09-30. Before this, every look inherited `phone_look_video.py`'s default black lift
    of 0.030, and that constant was measured on SEED 4806. On the shipped seed 4815 it lands the
    finished render at a 1st-percentile of 10.0 against a real band of 7.0 to 10.3 -- inside it,
    but hard against the ceiling, so a different take or a re-encode tips it out. This is the same
    shape as the ambience-bed constants that were measured on seed 4802 and, on seed 4815, landed
    in the middle of a spoken line (SKILL.md Critical knowledge 13): a number measured on one
    generation must not outlive it. `fit_grade.py --write-brand` solves it per take by measuring
    the render and stores it in brand_layer.grade; solved for 4815 it is 0.0240 -> 8.78, the
    middle of the band. If the config has no solved grade the old default still applies, and the
    only cost is being back where we were.
    """
    g = (CFG or {}).get("brand_layer", {}).get("grade") or {}
    extra = []
    if g.get("black_lift") is not None:
        extra += ["--black-lift", f"{float(g['black_lift']):.4f}"]
    if g.get("saturation") is not None and abs(float(g["saturation"]) - 1.0) > 1e-3:
        extra += ["--saturation", f"{float(g['saturation']):.4f}"]
    return extra + GRADE.get(look, [])


def karaoke_cards(td):
    """Two or three words at a time, huge, centred. Groups share their line's span and are
    clamped to the take's own cut, same as every other treatment."""
    out = []
    for s, e, text, style, _, _sent in LINES:
        body = text.replace("|", " ")
        words = body.split()
        n = 2 if len(words) <= 4 else 3
        groups = [" ".join(words[i:i + n]) for i in range(0, len(words), n)]
        cut = next((c for c in CUTS if s < c < e), e)
        span = (min(e, cut) - s) / len(groups)
        for i, g in enumerate(groups):
            col = GOLD if style == "payoff" else CREAM
            c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            t = fit(g, 118, col, W - 80, outline=8)
            place(c, t, 960 - t.height // 2)
            p = td / f"k{len(out)}.png"
            c.save(p)
            out.append((s + i * span, s + (i + 1) * span - 0.02, p))
    return out


def end_card(path, brand_layer=None):
    img = Image.new("RGB", (W, H), INK).convert("RGBA")
    bl = brand_layer if brand_layer is not None else CFG["brand_layer"]
    lw, ly = 720, 520
    logo_h = 0
    if bl.get("logo"):
        # The logo is the real brand file, never a rendered word: no model renders a letter and
        # neither does PIL guess a wordmark.
        logo = Image.open(paths.ROOT / bl["logo"]).convert("RGBA")
        logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
        white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
        white.putalpha(logo.split()[3])
        img.alpha_composite(white, ((W - lw) // 2, ly))
        logo_h = logo.height
    y = max(SAFE_TOP, ly + logo_h + 130)
    rows = bl["end_card"]
    if not rows:
        raise ValueError("brand_layer.end_card needs at least one line")
    max_h = SAFE_BOT - y - 20
    for size in range(66, 19, -2):
        rendered = [heavy(row, size, CREAM if i == 0 else GOLD, italic=False, outline=5)
                    for i, row in enumerate(rows)]
        if max(t.width for t in rendered) <= W - 120 and sum(t.height for t in rendered) + 20 * (len(rows) - 1) <= max_h:
            break
    else:
        raise ValueError("end-card copy does not fit the safe area; shorten it")
    for t in rendered:
        img.alpha_composite(t, ((W - t.width) // 2, y))
        y += t.height + 20
    img.convert("RGB").save(path)


def build(look, captions=True):
    """captions=False builds the CONTROL: the identical file through the identical encode chain
    with the caption overlays left out. check_cut.py measures the render against it, so the only
    thing that can differ is a caption. A control encoded any other way differs in every pixel,
    because the concat pass is bitrate-capped, and then the whole frame reads as a caption."""
    if SRC is None:
        raise RuntimeError("call resolve(run) first: the take lives in the run folder")
    OUTDIR.mkdir(parents=True, exist_ok=True)
    CTRL.mkdir(parents=True, exist_ok=True)
    OUT = (OUTDIR / f"street-{CFG['slug']}-{look}.mp4") if captions else control_path(look)
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        graded = td / "g.mp4"
        run([sys.executable, HERE / "phone_look_video.py", SRC, graded, "--run", RUN, *grade_args(look)])

        cards = []
        if not captions:
            pass
        elif look == "karaoke":
            cards = karaoke_cards(td)
        else:
            for i, (s, e, text, style, job, sent) in enumerate(LINES):
                img = TREAT[look](text, style, job, sent)
                if img is None:
                    continue
                # never let a caption outlive the shot it belongs to
                cut = next((c for c in CUTS if s < c < e), e)
                p = td / f"c{i}.png"
                img.save(p)
                cards.append((s, min(e, cut), p))

        # Keep series branding through caption gaps and in the caption-free control.
        if look == "subway":
            p = td / "series.png"
            subway_brand_layer().save(p)
            cards.insert(0, (None, None, p))
        ins, filt, last = ["-i", str(graded)], [], "0:v"
        for i, (s, e, p) in enumerate(cards, start=1):
            ins += ["-i", str(p)]
            enable = "" if s is None else f":enable='between(t,{s:.2f},{e:.2f})'"
            filt.append(f"[{last}][{i}:v]overlay=0:0{enable}[v{i}]")
            last = f"v{i}"
        capped = td / "capped.mp4"
        run(["ffmpeg", "-v", "error", "-y", *ins,
             *(["-filter_complex", ";".join(filt), "-map", f"[{last}]"] if filt else ["-map", "0:v"]),
             "-map", "0:a", "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p",
             # the Seedance source is 96kHz, which the AAC decoder complains about downstream
             "-af", "aresample=48000", "-c:a", "aac", "-b:a", "192k",
             "-video_track_timescale", "30000", capped])

        ep = td / "end.png"
        end_card(ep)
        # The end card's room tone and the bed below both come from the take's OWN speech-free
        # window, recorded in the brand config because it is a property of the TAKE. It was two
        # hardcoded timestamps (8.0s and 7.6s) measured on seed 4802; on the shipped seed 4815
        # 7.6s is the middle of a spoken line, so those numbers would have looped speech under
        # the whole video. That is the documented "random background noises" fault, reintroduced
        # by a constant that outlived the take it was measured on.
        gap_s, gap_d = CFG["brand_layer"]["ambience_gap"]
        amb = td / "amb.m4a"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{gap_s}", "-t", "2.2", "-i", SRC, "-vn",
             "-af", "aresample=48000,lowpass=f=2200,volume=-10dB,afade=t=in:d=0.25,"
                    "afade=t=out:st=1.95:d=0.25", "-c:a", "aac", "-b:a", "160k", amb])
        endclip = td / "end.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-t", "2.2", "-i", ep, "-i", amb,
             "-vf", f"scale={W}:{H},gblur=sigma=0.7,noise=c0s=4:c0f=t+u,format=yuv420p",
             "-c:v", "libx264", "-crf", "17", "-c:a", "aac", "-b:a", "192k",
             "-video_track_timescale", "30000", "-shortest", endclip])

        # MEASURED: one generation fixes the location but not the room tone. Seedance changes
        # ambience across its own internal cuts too (mean 18.0dB on this take, against 5.9dB on
        # the real reference), so the bed is needed even here. It comes from the take's own
        # speech-free gap, so it is the same street on the same afternoon.
        bed = td / "bed.m4a"
        run(["ffmpeg", "-v", "error", "-y", "-stream_loop", "-1", "-ss", f"{gap_s}",
             "-t", f"{gap_d}",
             "-i", SRC, "-vn", "-af", "aresample=48000,highpass=f=80,lowpass=f=4000,volume=-4dB",
             "-t", "40", "-c:a", "aac", "-b:a", "160k", bed])
        bedded = td / "bedded.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", capped, "-i", bed, "-filter_complex",
             "[1:a]aformat=channel_layouts=stereo:sample_rates=48000[b];"
             "[0:a][b]amix=inputs=2:normalize=0[a]", "-map", "0:v", "-map", "[a]",
             "-c:v", "copy", "-shortest", "-c:a", "aac", "-b:a", "192k", bedded])

        lst = td / "l.txt"
        lst.write_text(f"file '{bedded.as_posix()}'\nfile '{endclip.as_posix()}'", encoding="utf-8")
        pre = td / "pre.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
             "-c:v", "libx264", "-b:v", "3400k", "-maxrate", "3800k", "-bufsize", "6800k",
             "-pix_fmt", "yuv420p", "-preset", "medium",
             "-af", "bass=g=3:f=110,treble=g=3:f=3200,alimiter=limit=0.9:level=false",
             "-c:a", "aac", "-b:a", "192k", pre])

        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(pre), "-af",
                            "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True)
        m = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
        ln = ("loudnorm=I=-14:TP=-2.0:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s"
              ":measured_thresh=%s:offset=%s:linear=true"
              % (m["input_i"], m["input_tp"], m["input_lra"], m["input_thresh"],
                 m["target_offset"]))
        stage = td / "stage.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-c:v", "copy",
             # the limiter goes AFTER loudnorm: linear mode applies a fixed gain and does not
             # itself cap peaks, which pushed true peak to -0.1 dBTP
             "-af", ln + ",aresample=48000,alimiter=limit=0.79:level=false",
             "-c:a", "aac", "-b:a", "160k", stage])
        # One measured corrective gain on the FINISHED file. Linear loudnorm undershoots by
        # about 0.4 LU on this stack every time, and a set of videos watched back to back must
        # not step in level. Measured, never assumed, and read from JSON rather than a regex,
        # which used to crash on a "+" sign on exactly the files that needed catching.
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(stage), "-af",
                            "loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True)
        m2 = json.loads(r.stderr[r.stderr.rindex("{"):r.stderr.rindex("}") + 1])
        gain = -14.0 - float(m2["input_i"])
        run(["ffmpeg", "-v", "error", "-y", "-i", stage, "-c:v", "copy",
             "-af", f"volume={gain:.2f}dB,alimiter=limit=0.79:level=false",
             "-c:a", "aac", "-b:a", "160k", OUT])
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(OUT)], capture_output=True, text=True).stdout.strip()
    print(f"  {OUT.name}  {float(d):.2f}s  {OUT.stat().st_size // 1024} KB")


def control_path(look):
    """The caption-free control for one look.

    Named per brand, because two brands in one run folder would otherwise share one control file
    and the safe-zone check would difference a render against another brand's grade. The
    unprefixed legacy name is kept for a brand whose controls already exist under it, so the
    default brand's file names stay stable across the split; a new brand always gets a prefixed
    one. The control MUST come through the identical encode chain as the render with the overlays
    left out: a control encoded any other way differs in every pixel, because the concat pass is
    bitrate-capped, and then the whole frame reads as a caption.
    """
    new = CTRL / f"graded-{CFG['slug']}-{look}.mp4"
    legacy = CTRL / f"graded-{look}.mp4"
    return new if new.exists() or not legacy.exists() else legacy


def configure_brand_layer(bl):
    """Apply approved palette/fonts for either a single take or an episode."""
    global GOLD, CREAM, INK, BLACK, BOLD, REG
    palette = bl.get("palette") or {}
    def colour(key, default):
        value = palette.get(key, default)
        if isinstance(value, str):
            value = value.removeprefix("#")
            if len(value) != 6:
                raise ValueError(f"palette.{key} must be #RRGGBB or three RGB values")
            value = tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
        if len(value) != 3 or any(not isinstance(c, int) or not 0 <= c <= 255 for c in value):
            raise ValueError(f"palette.{key} must have three RGB values in 0..255")
        return tuple(value)
    GOLD = colour("accent", (203, 161, 79))
    CREAM = colour("text", (252, 246, 239))
    INK = colour("background", (12, 12, 12))
    fonts = bl.get("fonts") or {}
    BLACK, BOLD, REG = (str(paths.ROOT / fonts[w]) if fonts.get(w) else resolve_font(w)
                        for w in ("black", "bold", "regular"))


def resolve(run=None, brand=None):
    """Point SRC / OUTDIR / CTRL and the brand layer at a run folder. Also used by check-cut.py."""
    global SRC, OUTDIR, CTRL, RUN, CFG, TAKE, CUTS, LINES, GOLD, CREAM, INK, BLACK, BOLD, REG
    CFG = brandkit.load(brand)
    bl = CFG["brand_layer"]
    configure_brand_layer(bl)
    TAKE = f"{brandkit.take_name(CFG)}.mp4"
    CUTS = list(bl["cuts"] or [])
    LINES = [tuple(r) for r in bl.get("captions") or []]
    L = paths.layout(run)
    RUN = L["run"]
    SRC, OUTDIR, CTRL = L["takes"] / TAKE, L["looks"], L["graded"]
    return L


if __name__ == "__main__":
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--brand", default=None, help="brand slug in brands/ (default liquid-death)")
    ap.add_argument("--looks", default=",".join(TREAT))
    ap.add_argument("--dry-run", action="store_true",
                    help="resolve paths, render every caption LAYER to PNG and assert the safe "
                         "zone, but run no ffmpeg and touch no network")
    A = ap.parse_args()
    looks = A.looks.split(",")
    for look in looks:
        if look not in TREAT:
            raise SystemExit(f"no look {look!r}. Known: {', '.join(TREAT)}")
    L = resolve(A.run, A.brand)
    print(f"brand      {CFG['brand']}  ({CFG['_path']})")
    if not CUTS:
        raise SystemExit(
            f"{CFG['brand']} has no measured cuts in brand_layer.cuts. Cuts are MEASURED off the "
            f"take with ffmpeg scene detection, never calculated from the script: a caption "
            f"clamped to a number derived from the dialogue printed one person's words over the "
            f"next person's face, which is the fault the assembled cut was rejected for. "
            f"Generate the take, measure its cuts, then fill them in.")
    if not LINES:
        raise SystemExit(f"{CFG['brand']} has no brand_layer.captions")
    if not CFG["brand_layer"].get("ambience_gap"):
        raise SystemExit(f"{CFG['brand']} has no measured brand_layer.ambience_gap. The ambience "
                         f"bed has to come from a speech-free window in THIS take; cutting it "
                         f"over speech loops that speech under the whole video.")
    print(f"run folder {L['run']}")
    print(f"take       {SRC}{'' if SRC.exists() else '   MISSING'}")
    print(f"output     {OUTDIR}")
    print(f"controls   {CTRL}")
    if A.dry_run:
        # Everything that can fail without ffmpeg: the fonts, the brand files, the caption
        # geometry and the cut clamping. The place() and plate() asserts are the real test --
        # a caption wider than the frame or outside y=285..1635 raises here, for free, before
        # any encode and long before any generation.
        import tempfile
        if not SRC.exists():
            print("NOTE: no take, so no ffmpeg stage could run anyway. Layers still checked.")
        with tempfile.TemporaryDirectory() as td:
            td = Path(td)
            for look in looks:
                n = 0
                if look == "karaoke":
                    n = len(karaoke_cards(td))
                else:
                    for s, e, text, style, job, sent in LINES:
                        img = TREAT[look](text, style, job, sent)
                        if img is None:
                            continue
                        cut = next((c for c in CUTS if s < c < e), e)
                        assert min(e, cut) > s, f"{look}: {text!r} clamped to zero length"
                        n += 1
                end_card(td / f"end-{look}.png")
                print(f"  {look}: {n} caption layers + end card OK, all inside "
                      f"y={SAFE_TOP}..{SAFE_BOT}")
        raise SystemExit("\ndry run. No ffmpeg, no network, nothing written to the run folder.")
    if not SRC.exists():
        raise SystemExit(f"no take at {SRC}. Generate it with single_gen.py (PAID, ~$3.64) or "
                         f"pass --run at the folder that holds it.")
    for look in looks:
        print(f"{look}:")
        build(look, captions=True)
        build(look, captions=False)
