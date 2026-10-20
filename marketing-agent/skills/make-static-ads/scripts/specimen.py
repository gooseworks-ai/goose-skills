#!/usr/bin/env python3
"""Font specimen, ported from gooseworks-app ad-font-reference.service.ts renderFontSpecimenPng (origin/dev, 2026-10-19).
Usage: python3 specimen.py items.json out.png
items.json: [{"text": "...", "role": "headline|subtitle|cta|body|other", "family": "Bebas Neue", "weight": 700}, ...]
Each family is resolved the server's way (Google Fonts exact match or metric clone); lines with no real face are dropped.
Exit code 3 = no line has a real face: attach no specimen."""
import json, re, sys, urllib.request, urllib.parse, urllib.error, io
from PIL import Image, ImageDraw, ImageFont

GOOGLE_FONT_ALIASES = {"avenir next": "Montserrat", "avenir": "Montserrat", "futura": "Jost", "helvetica": "Arimo",
    "helvetica neue": "Arimo", "neue haas": "Archivo", "söhne": "Archivo", "sohne": "Archivo", "arial": "Arimo",
    "didot": "Playfair Display", "georgia": "Gelasio", "times new roman": "Tinos", "din condensed": "Oswald",
    "arial narrow": "Oswald", "menlo": "IBM Plex Mono", "courier new": "Cousine", "brush script mt": "Dancing Script",
    "snell roundhand": "Dancing Script"}
METRIC_CLONES = {"courier new": "Cousine", "courier": "Cousine", "arial": "Arimo", "helvetica": "Arimo",
    "helvetica neue": "Arimo", "times new roman": "Tinos", "times": "Tinos", "georgia": "Gelasio"}
GENERIC = {"sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "ui-sans-serif", "ui-serif",
    "ui-monospace", "ui-rounded", "-apple-system", "blinkmacsystemfont", "math", "emoji", "inherit", "initial", "unset"}

def sanitize(raw):
    if not raw: return None
    name = raw.split(",")[0].strip()
    if not name or name.startswith("var("): return None
    name = re.sub(r"^['\"]+|['\"]+$", "", name).strip()
    if name.lower() in GENERIC: return None
    name = re.sub(r"^__", "", name); name = re.sub(r"_Fallback(?=_|$)", "", name, flags=re.I)
    name = re.sub(r"_[0-9a-f]{4,8}$", "", name, flags=re.I)
    name = re.sub(r"[-_]v?\d+$", "", name, flags=re.I); name = re.sub(r"[-_]+", " ", name).strip()
    if not name or name.lower() in GENERIC: return None
    return " ".join(w if (w == w.upper() and len(w) <= 3) else w[0].upper() + w[1:].lower() for w in name.split())

def resolve(family, weight):
    """Returns (ttf_bytes, resolved_family, served_weight, source) or None when the server would drop the line."""
    clean = sanitize(family) or (family or "").strip()
    mapped = GOOGLE_FONT_ALIASES.get(clean.lower(), clean or "Inter")
    if mapped.lower() == clean.lower(): source = "google-fonts"
    elif METRIC_CLONES.get(clean.lower()) == mapped: source = "metric-clone"
    else: return None  # loose substitute: the server drops this line
    w = max(100, min(900, round(weight / 100) * 100))
    get = lambda u, h=None: urllib.request.urlopen(urllib.request.Request(u, headers=h or {"User-Agent": "Mozilla/5.0"}), timeout=20)
    for cand in sorted(range(100, 1000, 100), key=lambda a: (abs(a - w), -a))[:4]:
        url = "https://fonts.googleapis.com/css2?family=%s:wght@%d" % (urllib.parse.quote(mapped), cand)
        try:
            css = get(url, {"Accept": "text/css", "User-Agent": "Mozilla/5.0"}).read().decode()
        except Exception:
            continue
        m = re.search(r"url\((https://[^)]+\.ttf)\)", css, re.I) or re.search(r"url\((https://[^)]+)\)", css, re.I)
        if m:
            return get(m.group(1)).read(), mapped, cand, source
    # css2 has no probed weight: the google/fonts repo, best-scoring static .ttf (server scoreFontFile)
    slug = re.sub(r"[^a-z0-9]", "", mapped.lower())
    terms = {100: r"(?:^|[-_])thin(?:[._-]|$)", 200: r"(?:extra|ultra)[-_]?light", 300: r"(?:^|[-_])light(?:[._-]|$)",
             400: r"(?:regular|normal)", 500: r"(?:^|[-_])medium(?:[._-]|$)", 600: r"semi[-_]?bold",
             700: r"(?:^|[-_])bold(?:[._-]|$)", 800: r"extra[-_]?bold", 900: r"(?:black|heavy)"}
    def score(name):
        n = name.lower()
        if not n.endswith(".ttf") or "italic" in n: return -1
        sc = 5 if ("[" in n or "variable" in n) else 0
        if re.search(terms[w], n): sc += 100
        if w >= 700 and re.search(r"(bold|black|heavy)", n): sc += 20
        if w <= 500 and re.search(r"(regular|medium|light|thin)", n): sc += 20
        return sc
    for lic in ("ofl", "apache", "ufl"):
        for suffix in ("static", ""):
            api = "https://api.github.com/repos/google/fonts/contents/%s/%s%s" % (lic, slug, "/" + suffix if suffix else "")
            try:
                files = json.loads(get(api).read())
            except urllib.error.HTTPError as e:
                if e.code == 404: continue
                return None  # server: lookup error, line dropped
            ranked = sorted((f for f in files if f.get("type") == "file" and f.get("download_url") and score(f["name"]) >= 0),
                            key=lambda f: -score(f["name"]))
            if ranked:
                data = get(ranked[0]["download_url"]).read()
                n = ranked[0]["name"].lower(); served = w
                if "[" in n or "variable" in n:  # renders its default instance; report that weight
                    try:
                        axes = ImageFont.truetype(io.BytesIO(data), 20).get_variation_axes()
                        served = int(next(a["default"] for a in axes if str(a.get("name", b"")).lower().find("weight") >= 0))
                    except Exception:
                        pass
                return data, mapped, max(100, min(900, round(served / 100) * 100)), source
    return None  # not on Google Fonts: the server falls back to Inter and drops the line

def wrap(draw, text, font, width):
    lines = []
    for para in text.split("\n"):
        cur = ""
        for word in para.split(" "):
            trial = word if not cur else cur + " " + word
            if draw.textlength(trial, font=font) <= width or not cur: cur = trial
            else: lines.append(cur); cur = word
        lines.append(cur)
    return lines

def main():
    items = json.load(open(sys.argv[1]))[:6]
    W, PX, PY, GAP, CAP, TXT = 1200, 72, 64, 52, 26, 92
    inner = W - PX * 2
    prepared = []
    for it in items:
        if not it.get("text", "").strip(): continue
        r = resolve(it["family"], it.get("weight") or (700 if it.get("role") in ("headline", "cta") else 400))
        if r: prepared.append((it, r))
        else: print("dropped (no real face):", it["family"], file=sys.stderr)
    if not prepared: sys.exit(3)
    canvas = Image.new("RGB", (W, PY * 2 + len(prepared) * 460), "#ffffff")
    d = ImageDraw.Draw(canvas)
    y = PY
    for it, (data, fam, wt, _src) in prepared:
        cap_font = ImageFont.truetype(io.BytesIO(data), CAP)
        txt_font = ImageFont.truetype(io.BytesIO(data), TXT)
        cap_lines = wrap(d, "%s · %s %d" % (it["role"].upper(), fam, wt), cap_font, inner)
        for i, ln in enumerate(cap_lines): d.text((PX, y + i * CAP), ln, font=cap_font, fill="#9aa0a6")
        cap_h = len(cap_lines) * CAP
        body = wrap(d, it["text"].strip(), txt_font, inner)
        by = y + cap_h + 12
        for i, ln in enumerate(body): d.text((PX, by + i * TXT * 1.15), ln, font=txt_font, fill="#111111")
        y += cap_h + 12 + len(body) * TXT * 1.15 + GAP
    used = min(canvas.height, round(y - GAP + PY))
    canvas.crop((0, 0, W, used)).save(sys.argv[2], "PNG")
    print(json.dumps({"out": sys.argv[2], "lines": [[it["role"], r[1], r[2], r[3]] for it, r in prepared]}))

if __name__ == "__main__":
    main()
