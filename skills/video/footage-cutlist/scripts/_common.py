"""Shared helpers for footage-cutlist: probing, frame grabs, fonts. No paid calls."""
import json
import os
import pathlib
import subprocess
import urllib.request

FONT_CANDIDATES = [
    # macOS
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/Library/Fonts/Arial Bold.ttf",
    # Linux
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf",
    # Windows
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\seguibl.ttf",
]
# Last resort: a free bold sans fetched once into the user cache.
FONT_URL = "https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Bold.ttf"
FONT_CACHE = pathlib.Path(os.path.expanduser("~/.cache/gooseworks/fonts/Roboto-Bold.ttf"))


def font_path(override=None):
    """A bold sans TTF path that exists on this machine (downloads one if none does)."""
    if override and pathlib.Path(override).exists():
        return str(override)
    env = os.environ.get("GW_CAPTION_FONT")
    if env and pathlib.Path(env).exists():
        return env
    for f in FONT_CANDIDATES:
        if pathlib.Path(f).exists():
            return f
    if not FONT_CACHE.exists():
        FONT_CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(FONT_URL, FONT_CACHE)
    return str(FONT_CACHE)


def font(px, override=None):
    from PIL import ImageFont
    return ImageFont.truetype(font_path(override), px)


IMAGE_EXT = (".png", ".jpg", ".jpeg", ".webp")


def probe(path):
    """{duration, width, height, fps, has_audio, still} for a media file. A still image
    reports duration None and still True."""
    if str(path).lower().endswith(IMAGE_EXT):
        from PIL import Image
        with Image.open(path) as im:
            return {"duration": None, "width": im.width, "height": im.height, "fps": None,
                    "has_audio": False, "still": True}
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_format",
                          "-show_streams", str(path)], capture_output=True, text=True, check=True)
    j = json.loads(out.stdout)
    v = next((s for s in j["streams"] if s.get("codec_type") == "video"), None)
    if not v:
        raise SystemExit("%s has no video stream" % path)
    num, den = (v.get("avg_frame_rate") or "30/1").split("/")
    fps = float(num) / float(den) if float(den) else 30.0
    w, h = int(v["width"]), int(v["height"])
    rot = int((v.get("tags") or {}).get("rotate", 0) or 0)
    for sd in v.get("side_data_list") or []:
        if "rotation" in sd:
            rot = int(sd["rotation"])
    if abs(rot) in (90, 270):
        w, h = h, w
    return {"duration": float(j["format"].get("duration") or v.get("duration") or 0),
            "width": w, "height": h, "fps": round(fps, 3),
            "has_audio": any(s.get("codec_type") == "audio" for s in j["streams"]), "still": False}


def grab(path, t, width=None):
    """One frame at time t as a PIL RGB image (accurate seek)."""
    from PIL import Image
    import io
    vf = ["-vf", "scale=%d:-2" % width] if width else []
    out = subprocess.run(["ffmpeg", "-v", "error", "-ss", "%.3f" % max(t, 0), "-i", str(path),
                          "-frames:v", "1", *vf, "-f", "image2pipe", "-vcodec", "png", "-"],
                         capture_output=True).stdout
    if not out:
        raise SystemExit("could not read a frame at %.2fs from %s" % (t, path))
    return Image.open(io.BytesIO(out)).convert("RGB")


def load(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))


def save(path, obj):
    pathlib.Path(path).parent.mkdir(parents=True, exist_ok=True)
    pathlib.Path(path).write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")


def sample_bg(path, t):
    """The footage's own background colour (median of the four corners) as 0xRRGGBB."""
    import statistics
    im = grab(path, t, width=320)
    w, h = im.size
    px = []
    for cx, cy in ((3, 3), (w - 4, 3), (3, h - 4), (w - 4, h - 4)):
        px.append(im.getpixel((cx, cy)))
    r, g, b = (int(statistics.median(c[i] for c in px)) for i in range(3))
    return "0x%02X%02X%02X" % (r, g, b)
