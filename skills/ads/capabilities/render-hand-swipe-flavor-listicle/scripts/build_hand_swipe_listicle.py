#!/usr/bin/env python3
"""render-hand-swipe-flavor-listicle — FREE deterministic assembly ($0, no paid calls, no keys).

Composites a green-screen HAND-SWIPE clip (a real-looking hand, made upstream by the
create-video-fal capability, or a reusable clip you already have) over the brand's REAL
product cutouts, which slide RIGHT-TO-LEFT between flavors on flat flavor-matched color
fields under a persistent title. Optional instrumental music bed. No VO.

The hand is keyed with a GREEN-DOMINANCE alpha key (transparent only where green clearly
beats red AND blue: g > green_margin * max(r, b)). It is brightness-invariant, so it
survives a muddy/uneven AI "green screen" that spills onto the skin, where ffmpeg's
colorkey/chromakey either leave green garbage or make the hand vanish over warm colors.

Needs: python3 + Pillow, ffmpeg + ffprobe on PATH. Nothing else.

Usage:
  python3 build_hand_swipe_listicle.py config.json                 # -> config "output"
  python3 build_hand_swipe_listicle.py config.json --out final.mp4 # override output
  python3 build_hand_swipe_listicle.py config.json --stills DIR    # one PNG per card, no video
  python3 build_hand_swipe_listicle.py config.json --work DIR      # keep intermediates in DIR

Relative paths inside config.json resolve against the config file's own directory.
Config schema: see config.example.json next to this script.
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

# ------------------------------------------------------------------ args + config
ap = argparse.ArgumentParser(description="Render the hand-swipe flavor listicle (free, deterministic).")
ap.add_argument("config", help="render config.json (see config.example.json)")
ap.add_argument("--out", help="output mp4 (overrides config 'output'; relative to the CWD)")
ap.add_argument("--stills", help="write one PNG per flavor card (+ end card) to this dir and exit")
ap.add_argument("--work", help="scratch dir for intermediates (default: a temp dir, removed after)")
A = ap.parse_args()

CFG_PATH = Path(A.config).resolve()
cfg = json.loads(CFG_PATH.read_text())
BASE = CFG_PATH.parent


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def warn(msg):
    print(f"WARNING: {msg}", file=sys.stderr)


def is_placeholder(v):
    return isinstance(v, str) and v.strip().startswith(("<input:", "<brand:", "<choice:"))


def rel(p):
    """Resolve a config path against the config file's directory."""
    pp = Path(p).expanduser()
    return pp if pp.is_absolute() else (BASE / pp)


def need_file(label, p):
    if not p or is_placeholder(p):
        die(f"config '{label}' is missing or still a placeholder ({p!r})")
    fp = rel(p)
    if not fp.is_file():
        die(f"config '{label}' file not found: {fp}")
    return fp


W, H, FPS = int(cfg.get("width", 1080)), int(cfg.get("height", 1920)), int(cfg.get("fps", 30))

TITLE_TEXT = cfg.get("title")
if not TITLE_TEXT or is_placeholder(TITLE_TEXT):
    die("config 'title' is required (the persistent header line, e.g. 'N Flavors of <Brand>')")
TITLE_SIZE = int(cfg.get("title_size", 118))
TITLE_Y = int(cfg.get("title_y", 200))
TITLE_COLOR = cfg.get("title_color", "#FFFFFF")
TITLE_UNDERLINE = cfg.get("title_underline", True)

FLAVORS = cfg.get("flavors") or []
if len(FLAVORS) < 2:
    die("config 'flavors' needs at least 2 entries: [{\"bg\": \"#hex\", \"can\": \"cutout.png\"}, ...]")
for i, fl in enumerate(FLAVORS):
    if "can" not in fl and "image" in fl:      # accept 'image' as an alias for 'can'
        fl["can"] = fl["image"]
    if not fl.get("bg") or is_placeholder(fl.get("bg")):
        die(f"flavors[{i}].bg is required (a flat hex color, e.g. '#2FA84F')")
    fl["_can_path"] = need_file(f"flavors[{i}].can", fl.get("can"))

END_CARD = cfg.get("end_card")
END_CARD_PATH = need_file("end_card", END_CARD) if END_CARD and not is_placeholder(END_CARD) else None
END_HOLD = int(cfg.get("end_card_hold_frames", 60))

CAN_H = int(cfg.get("can_height", 950))
CAN_CY = int(cfg.get("can_center_y", 940))

# hand tuning — engineering defaults validated on the demo build. The hand's LOOK is the
# clip itself (recipe choices.hand), not these numbers.
hcfg = cfg.get("hand") or {}
TRIM_A = float(hcfg.get("trim_start", 0.0))
TRIM_B = float(hcfg.get("trim_end", 1.0))
SPEED = float(hcfg.get("speed", 1.0))
HAND_SCALE = float(hcfg.get("scale", 0.45))      # smaller => fingertip reaches lower up the frame
KEY_MARGIN = float(hcfg.get("green_margin", 1.12))
if TRIM_B <= TRIM_A:
    die(f"hand.trim_end ({TRIM_B}) must be greater than hand.trim_start ({TRIM_A})")
if SPEED <= 0:
    die("hand.speed must be > 0")

SCFG = cfg.get("slide") or {}
SLIDE_FRAMES = int(SCFG.get("frames", 12))
_dir = str(SCFG.get("direction", "right-to-left")).strip().lower()
if _dir not in ("right-to-left", "rtl", "left"):
    warn(f"slide.direction {SCFG.get('direction')!r} is ignored: this format always slides RIGHT-TO-LEFT")

# music: a path string, OR the recipe-style object {path|file, trim_intro_sec, volume}.
# null / absent / false => a deliberately silent master. Anything else MUST resolve to a real
# file: a music object with no usable path used to render silent with exit 0, which hid a
# missing bed. volume is a gain applied AFTER loudnorm (1.0 = -18 LUFS, the demo level).
MUSIC_RAW = cfg.get("music")
MUSIC_TRIM = float(cfg.get("music_trim_intro", 2.5))
MUSIC_VOL = float(cfg.get("music_volume", 1.0))
MUSIC_PATH = None
if isinstance(MUSIC_RAW, dict):
    mp = MUSIC_RAW.get("path") or MUSIC_RAW.get("file")
    MUSIC_TRIM = float(MUSIC_RAW.get("trim_intro_sec", MUSIC_TRIM))
    MUSIC_VOL = float(MUSIC_RAW.get("volume", MUSIC_VOL))
    if not mp or (isinstance(mp, str) and not mp.strip()) or is_placeholder(mp):
        die(f"config 'music' is an object but music.path is empty or a placeholder ({mp!r}). Set music.path "
            "to the create-music-elevenlabs output file, or set \"music\": null for a silent cut.")
    MUSIC_PATH = need_file("music.path", mp)
elif isinstance(MUSIC_RAW, str):
    if not MUSIC_RAW.strip() or is_placeholder(MUSIC_RAW):
        die(f"config 'music' is empty or a placeholder ({MUSIC_RAW!r}). Pass the music file, "
            "or set \"music\": null for a silent cut.")
    MUSIC_PATH = need_file("music", MUSIC_RAW)
elif MUSIC_RAW not in (None, False):
    die(f"config 'music' must be a path, an object with 'path', or null (got {MUSIC_RAW!r})")
if MUSIC_TRIM < 0:
    die("music.trim_intro_sec must be >= 0")
if MUSIC_VOL <= 0:
    die("music.volume must be > 0 (set \"music\": null for a silent cut)")

if A.out:
    OUT = Path(A.out).resolve()
else:
    OUT = rel(cfg.get("output") or "hand-swipe-listicle.mp4")


# ------------------------------------------------------------------ helpers
def run(c):
    r = subprocess.run([str(x) for x in c], capture_output=True, text=True)
    if r.returncode:
        print("FAIL", " ".join(map(str, c[:8])), file=sys.stderr)
        print(r.stderr[-1600:], file=sys.stderr)
        raise SystemExit(1)
    return r


def probe(p, entries, want):
    """ffprobe the first video stream; returns exactly `want` values or stops with a clear error."""
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
                          "-show_entries", f"stream={entries}", "-of", "default=nk=1:nw=1", str(p)],
                         capture_output=True, text=True).stdout.split()
    vals = [v for v in out if v != "N/A"]
    if len(vals) != want:
        die(f"could not read {entries} from {p} (got {out!r}); the clip may be empty or unreadable")
    return vals


def media_duration(p):
    """Container duration in seconds (None if ffprobe can't read it)."""
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nk=1:nw=1", str(p)], capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None


def hexrgb(s):
    s = str(s).lstrip("#")
    if len(s) == 3:
        s = "".join(ch * 2 for ch in s)
    try:
        return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16))
    except ValueError:
        die(f"bad hex color {s!r}")


def even(x):
    return max(2, int(x) // 2 * 2)


def ease(t):  # ease-in-out cubic
    return 4 * t * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 3) / 2


FALLBACK_FONTS = [
    "/System/Library/Fonts/Supplemental/Brush Script.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def title_font_source():
    """Pick the title TTF path once (None => Pillow's built-in font). Warns on any fallback."""
    want = cfg.get("title_font")
    if want and not is_placeholder(want):
        fp = rel(want)
        if fp.is_file():
            return str(fp)
        warn(f"title_font not found ({fp}); falling back. Pass a TTF in the chosen title style.")
    else:
        warn("no title_font set; falling back to a machine-dependent system font, so the title style "
             "will differ between machines. Download a TTF in the style from choices.title_style.")
    for f in FALLBACK_FONTS:
        if Path(f).is_file():
            warn(f"using fallback font {f}")
            return f
    warn("no system TTF found; using Pillow's built-in font")
    return None


def font_at(src, size):
    if src:
        return ImageFont.truetype(src, size)
    try:
        return ImageFont.load_default(size=size)
    except TypeError:  # Pillow < 10.1: fixed-size bitmap font
        return ImageFont.load_default()


def fitted_title_font():
    """Shrink the title until it fits 88% of the frame width (never clip it on the edges)."""
    src = title_font_source()
    max_w = 0.88 * W
    size = TITLE_SIZE
    f = font_at(src, size)
    while f.getlength(TITLE_TEXT) > max_w and size > 24:
        size -= 2
        f = font_at(src, size)
    if size != TITLE_SIZE:
        warn(f"title {TITLE_TEXT!r} is too wide at title_size {TITLE_SIZE}; shrunk to {size} to fit the frame")
    if f.getlength(TITLE_TEXT) > max_w:
        warn(f"title {TITLE_TEXT!r} still overflows the frame at size {size}; shorten it")
    return f, size


def load_trim(p):
    im = Image.open(p).convert("RGBA")
    if im.getchannel("A").getextrema()[0] == 255:
        warn(f"{p.name} has no transparent pixels, so it will render as a box with a rectangular shadow. "
             "Use a transparent cutout (e.g. create-image-fal with fal-ai/birefnet/v2).")
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def scale_to_h(im, hh):
    w, h0 = im.size
    s = hh / h0
    return im.resize((max(1, int(w * s)), hh), Image.LANCZOS)


# ------------------------------------------------------------------ cards
TITLE = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(TITLE)
tc = hexrgb(TITLE_COLOR) + (255,)
TFONT, TSIZE = fitted_title_font()
d.text((W // 2, TITLE_Y), TITLE_TEXT, font=TFONT, fill=tc, anchor="mm",
       stroke_width=2, stroke_fill=(0, 0, 0, 60))
if TITLE_UNDERLINE:
    # Underline spans the middle 78% of the drawn text and sits just under it (the demo look:
    # size 118 script title -> a 580px stroke at y = TITLE_Y + 85, rising 12px left to right).
    l, _t, r, b = d.textbbox((W // 2, TITLE_Y), TITLE_TEXT, font=TFONT, anchor="mm")
    tw = r - l
    uy = max(TITLE_Y + int(TSIZE * 0.72), b + int(TSIZE * 0.12))
    d.line([(int(W / 2 - 0.39 * tw), uy), (int(W / 2 + 0.39 * tw), uy - round(TSIZE * 0.1))],
           fill=tc, width=max(2, round(TSIZE * 9 / 118)))


def can_sprite(p):
    can = scale_to_h(load_trim(p), CAN_H)
    cw, ch = can.size
    pad, dy, blur = 70, 34, 34
    t = Image.new("RGBA", (cw + 2 * pad, ch + 2 * pad + dy), (0, 0, 0, 0))
    a = can.split()[3]
    sh = Image.composite(Image.new("RGBA", can.size, (0, 0, 0, 110)),
                         Image.new("RGBA", can.size, (0, 0, 0, 0)), a).filter(ImageFilter.GaussianBlur(blur))
    t.alpha_composite(sh, (pad, pad + dy))
    t.alpha_composite(can, (pad, pad))
    return t


def card(flavor):
    img = Image.new("RGB", (W, H), hexrgb(flavor["bg"]))
    img.paste(TITLE, (0, 0), TITLE)
    spr = can_sprite(flavor["_can_path"])
    img.paste(spr, (W // 2 - spr.size[0] // 2, CAN_CY - spr.size[1] // 2), spr)
    return img


CARDS = [card(fl) for fl in FLAVORS]
ENDCARD = None
if END_CARD_PATH:
    _ec = Image.open(END_CARD_PATH).convert("RGB")
    if abs(_ec.size[0] / _ec.size[1] - W / H) > 0.01:
        warn(f"end_card is {_ec.size[0]}x{_ec.size[1]}, not {W}x{H} ({W}:{H} aspect); it will be stretched. "
             "Export the end card at the frame size.")
    ENDCARD = _ec.resize((W, H), Image.LANCZOS)

if A.stills:
    sd = Path(A.stills)
    sd.mkdir(parents=True, exist_ok=True)
    for i, c in enumerate(CARDS):
        c.save(sd / f"card{i}.png")
    if ENDCARD is not None:
        ENDCARD.save(sd / "endcard.png")
    print(f"WROTE {len(CARDS)} card stills{' + endcard' if ENDCARD else ''} -> {sd}")
    raise SystemExit(0)

# ------------------------------------------------------------------ render
for tool in ("ffmpeg", "ffprobe"):
    if not shutil.which(tool):
        die(f"{tool} not found on PATH")
HAND_SRC = need_file("hand_clip", cfg.get("hand_clip"))
_hd = media_duration(HAND_SRC)
if _hd is None:
    die(f"could not read the duration of hand_clip {HAND_SRC}")
if TRIM_A >= _hd:
    die(f"hand.trim_start ({TRIM_A}s) is at or past the end of hand_clip ({_hd:.2f}s)")
if TRIM_B > _hd + 0.05:
    warn(f"hand.trim_end ({TRIM_B}s) is past the end of hand_clip ({_hd:.2f}s); using {_hd:.2f}s")
    TRIM_B = _hd

MUSIC_DUR = None
if MUSIC_PATH:
    MUSIC_DUR = media_duration(MUSIC_PATH)
    if not MUSIC_DUR or MUSIC_DUR <= 0:
        die(f"could not read the duration of the music file {MUSIC_PATH}")

work = Path(A.work).resolve() if A.work else Path(tempfile.mkdtemp(prefix="hand-swipe-"))
work.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

try:
    # 1. hand unit: trim to the clean finger-UP window (+ optional speed); width W, aspect kept
    hand_unit = work / "hand_unit.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-ss", TRIM_A, "-to", TRIM_B, "-i", HAND_SRC,
         "-vf", f"setpts=PTS/{SPEED},fps={FPS},scale={W}:-2,setsar=1", "-an",
         "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv444p", hand_unit])
    uw, uh, n = probe(hand_unit, "width,height,nb_read_frames", 3)
    uw, uh, N = int(uw), int(uh), int(n)
    if N < 2:
        die(f"hand unit has {N} frame(s) — widen hand.trim_start/trim_end")
    SLIDE = max(1, min(SLIDE_FRAMES, N - 1))
    HOLD = N - SLIDE

    # 2. background: hold each card, slide card i OUT left while card i+1 slides IN from the right
    bg_mp4 = work / "bg_noHand.mp4"
    proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                             "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264",
                             "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", str(bg_mp4)],
                            stdin=subprocess.PIPE)

    def emit(img):
        try:
            proc.stdin.write(img.tobytes())
        except BrokenPipeError:
            proc.wait()
            die("ffmpeg stopped while encoding the card track (out of disk space, or a bad width/height?)")

    def slide(a, b):
        for k in range(SLIDE):
            s = int(W * ease((k + 1) / SLIDE))
            im = Image.new("RGB", (W, H), (0, 0, 0))
            im.paste(a, (-s, 0))
            im.paste(b, (W - s, 0))
            emit(im)

    for i in range(len(CARDS) - 1):
        for _ in range(HOLD):
            emit(CARDS[i])
        slide(CARDS[i], CARDS[i + 1])
    for _ in range(N):                      # last flavor: full hold (cards x N = hand-loop length)
        emit(CARDS[-1])
    if ENDCARD is not None:                 # hand ends here; end card slides in clean
        slide(CARDS[-1], ENDCARD)
        for _ in range(END_HOLD):
            emit(ENDCARD)
    try:
        proc.stdin.close()
    except BrokenPipeError:
        pass
    if proc.wait():
        die("ffmpeg failed while encoding the card track")

    # 3. loop the hand once per flavor, green-dominance key, scale down + bottom-anchor, overlay
    hand_loop = work / "hand_loop.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", len(CARDS) - 1, "-i", hand_unit,
         "-vf", f"fps={FPS}", "-an", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv444p", hand_loop])
    hw, hh = even(uw * HAND_SCALE), even(uh * HAND_SCALE)
    # alpha: green-dominance key. g: despill — clamp green to max(r, b) so a kept pixel can't
    # stay green-tinted (no effect on normal skin, where red already beats green).
    key = (
        f"[1:v]scale={hw}:{hh},format=rgba,"
        r"geq=r='r(X,Y)':g='min(g(X,Y)\,max(r(X,Y)\,b(X,Y)))':b='b(X,Y)':"
        rf"a='if(gt(g(X,Y)\,{KEY_MARGIN}*max(r(X,Y)\,b(X,Y)))\,0\,255)',"
        r"format=yuva420p[h];[0:v][h]overlay=(W-w)/2:H-h:eof_action=pass,format=yuv420p[v]"
    )
    comp = work / "composited.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", bg_mp4, "-i", hand_loop, "-filter_complex", key,
         "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", comp])

    # 4. optional music bed + final mux
    total = int(probe(comp, "nb_read_frames", 1)[0]) / FPS
    if MUSIC_PATH:
        # The bed must cover the whole cut. If trim_intro_sec leaves too little music, trim less
        # (never let the music stop before the end card holds); fade out where the bed really ends.
        trim = MUSIC_TRIM
        if MUSIC_DUR - trim < total:
            new_trim = max(0.0, MUSIC_DUR - total)
            warn(f"music is {MUSIC_DUR:.2f}s; trim_intro_sec {trim}s leaves {max(0.0, MUSIC_DUR - trim):.2f}s "
                 f"for a {total:.2f}s cut. Trimming {new_trim:.2f}s instead. Generate a bed of at least "
                 f"trim_intro_sec + {total:.1f}s + 1s next time.")
            trim = new_trim
        avail = MUSIC_DUR - trim
        if avail <= 0:
            die(f"no music left after trimming {trim}s from a {MUSIC_DUR:.2f}s file")
        if avail < total:
            warn(f"music ({MUSIC_DUR:.2f}s) is shorter than the cut ({total:.2f}s); "
                 f"the last {total - avail:.2f}s will be silent")
        bed = work / "music.wav"
        bed_len = min(total, avail)
        fade_out_st = max(0.0, bed_len - 1.2)
        run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{trim:.3f}", "-i", MUSIC_PATH, "-t", f"{bed_len:.3f}",
             "-af", f"afade=t=in:st=0:d=0.4,afade=t=out:st={fade_out_st:.3f}:d=1.2,"
                    f"loudnorm=I=-18:TP=-1.5:LRA=11,volume={MUSIC_VOL}",
             "-ar", "44100", "-ac", "2", bed])
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", comp, "-i", bed, "-map", "0:v:0", "-map", "1:a:0",
             "-af", "apad", "-t", f"{total:.3f}",
             "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT])
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", comp, "-c:v", "libx264", "-preset", "medium",
             "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT])
finally:
    if not A.work:
        shutil.rmtree(work, ignore_errors=True)

target = cfg.get("target_duration_sec")
note = f", target {target}s" if target else ""
print(f"WROTE {OUT}  ({total:.2f}s{note}, {len(FLAVORS)} flavors, {'music' if MUSIC_PATH else 'silent'})")
