"""Sans bold / regular / italic TTFs on any OS (downloads Roboto once if none is found)."""
import os
import pathlib
import urllib.request

CANDIDATES = {
    "bold": ["/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/Library/Fonts/Arial Bold.ttf",
             r"C:\Windows\Fonts\arialbd.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
             "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"],
    "regular": ["/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf",
                r"C:\Windows\Fonts\arial.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"],
    "italic": ["/System/Library/Fonts/Supplemental/Arial Italic.ttf", "/Library/Fonts/Arial Italic.ttf",
               r"C:\Windows\Fonts\ariali.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf"],
}
ROBOTO = {"bold": "Roboto-Bold.ttf", "regular": "Roboto-Regular.ttf", "italic": "Roboto-Italic.ttf"}
BASE = "https://github.com/google/fonts/raw/main/apache/roboto/static/"
CACHE = pathlib.Path(os.path.expanduser("~/.cache/gooseworks/fonts"))


def paths(override=None):
    """{'bold','regular','italic'} -> an existing TTF path each."""
    out = {}
    for k, cands in CANDIDATES.items():
        o = (override or {}).get(k)
        hit = o if o and pathlib.Path(o).exists() else next((c for c in cands if pathlib.Path(c).exists()), None)
        if not hit:
            p = CACHE / ROBOTO[k]
            if not p.exists():
                CACHE.mkdir(parents=True, exist_ok=True)
                urllib.request.urlretrieve(BASE + ROBOTO[k], p)
            hit = str(p)
        out[k] = hit
    return out
