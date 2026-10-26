"""Font discovery for caption rendering: a bold sans TTF on any OS. No paid calls."""
import os
import pathlib
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


SERIF_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/Library/Fonts/Georgia Bold.ttf",
    r"C:\Windows\Fonts\georgiab.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
]
SERIF_URL = "https://github.com/google/fonts/raw/main/ofl/merriweather/static/Merriweather-Bold.ttf"
SERIF_CACHE = pathlib.Path(os.path.expanduser("~/.cache/gooseworks/fonts/Merriweather-Bold.ttf"))


def serif(px):
    """Heavy serif (Georgia Bold where present): the look of the screen-insert captions."""
    from PIL import ImageFont
    for f in SERIF_CANDIDATES:
        if pathlib.Path(f).exists():
            return ImageFont.truetype(f, px)
    if not SERIF_CACHE.exists():
        SERIF_CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(SERIF_URL, SERIF_CACHE)
    return ImageFont.truetype(str(SERIF_CACHE), px)


EMOJI_CANDIDATES = ["/System/Library/Fonts/Apple Color Emoji.ttc", r"C:\Windows\Fonts\seguiemj.ttf",
                    "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"]


def emoji(px):
    """A colour-emoji font, or None. Apple's only renders at fixed sizes (e.g. 160)."""
    from PIL import ImageFont
    for f in EMOJI_CANDIDATES:
        if pathlib.Path(f).exists():
            for size in (px, 160, 137, 109):
                try:
                    return ImageFont.truetype(f, size)
                except OSError:
                    continue
    return None
