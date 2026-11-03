"""The cut list: which moment of which footage plays under which line, and how it is framed.

This module validates one and resolves its geometry. It is imported by preview.py and
cut.py and by compose-creator-layer. The agent writes the file by hand (it is the decision);
nothing here chooses a moment.

    {
      "size": [1080, 1920], "fps": 30,
      "seam": 768,                    # y of the split line (split beats only)
      "creator_side": "bottom",       # which side of the seam the creator is on
      "bg": "auto",                   # letterbox fill: "auto" (sampled), "#rrggbb", or "blur"
      "transition": {"dissolve_frames": 0},   # 6-7 for a walkthrough; 0 = hard cuts
      "sources": {"demo": "footage/demo.mp4"},
      "beats": [
        {"id": "b1", "start": 0.0, "end": 3.1, "state": "creator",
         "vo": "I found the laziest way to run outbound."},
        {"id": "b2", "start": 3.1, "end": 7.4, "state": "split",
         "vo": "You paste your site and it pulls your brand.",
         "source": "demo", "in": 12.0,            # out defaults to in + slot (1.0x)
         "fit": "width",                          # width | cover | crop
         "crop": [0.0, 0.1, 0.62, 0.7],           # fit=crop: source box, fractions
         "focus": [0.5, 0.3],                     # fit=cover: what to keep centred
         "why": "the brand kit fills in at 13.4s"},
        {"id": "b3", "start": 7.4, "end": 9.8, "state": "product", "vo": "...",
         "source": "demo", "in": 20.5, "look": "screen",          # filmed-screen framing
         "crop": [0, 0, 0.6, 1], "screen": {"rot": -0.8, "keystone": 0.012, "fill": 0.86},
         "mask": [[0.02, 0.9, 0.2, 0.95]]}                       # blurred in the source
      ]
    }

states: "creator" = the creator fills the frame (no footage); "split" = footage in the product
zone and the creator in the other; "product" = footage fills the whole frame, creator hidden.

Beats must tile the timeline: first starts at 0, each starts where the last ended.
Sources may be videos or still images (png/jpg/webp; a still holds for its slot).
A video window plays between 0.5x and 2x of real speed (`out` - `in` vs the slot); anything else
is refused, and a window is never looped or frozen to fill a slot.
"""
import pathlib

from _common import load, probe

STATES = ("creator", "split", "product")
FITS = ("width", "cover", "crop")


def resolve(path):
    """Load, validate and normalise a cut list. Returns (spec, errors, warnings)."""
    spec = load(path)
    base = pathlib.Path(path).resolve().parent
    errs, warns = [], []
    W, H = spec.get("size", [1080, 1920])
    spec["size"] = [W, H]
    spec.setdefault("fps", 30)
    spec.setdefault("creator_side", "bottom")
    spec.setdefault("bg", "auto")
    if spec["creator_side"] not in ("bottom", "top"):
        errs.append("creator_side must be bottom or top")
    seam = spec.get("seam")
    beats = spec.get("beats") or []
    if not beats:
        errs.append("no beats")
    if any(b.get("state") == "split" for b in beats):
        if not isinstance(seam, int) or not (0.2 * H <= seam <= 0.8 * H) or seam % 2:
            errs.append("seam must be an even integer between 20%% and 80%% of the height (%d)" % H)
    srcs = {}
    for k, v in (spec.get("sources") or {}).items():
        p = pathlib.Path(v)
        p = p if p.is_absolute() else (base / p)
        if not p.exists():
            errs.append("source %s not found: %s" % (k, p))
            continue
        srcs[k] = {"path": str(p), **probe(p)}
    spec["_sources"] = srcs
    t = 0.0
    for i, b in enumerate(beats):
        bid = b.setdefault("id", "b%d" % (i + 1))
        st = b.get("state", "split")
        b["state"] = st
        if st not in STATES:
            errs.append("%s: state must be one of %s" % (bid, STATES))
        if abs(b.get("start", -1) - t) > 0.02:
            errs.append("%s starts at %s but the previous beat ended at %.2f" % (bid, b.get("start"), t))
        slot = b.get("end", 0) - b.get("start", 0)
        if slot < 0.4:
            errs.append("%s is %.2fs long; a beat under 0.4s cannot be read" % (bid, slot))
        t = b.get("end", t)
        if st == "creator":
            continue
        s = srcs.get(b.get("source") or (next(iter(srcs)) if len(srcs) == 1 else None))
        if not s:
            errs.append("%s: needs a known `source` (one of %s)" % (bid, list(srcs)))
            continue
        b["source"] = next(k for k, v in srcs.items() if v is s)
        if b.get("look") not in (None, "plain", "screen", "photo"):
            errs.append("%s: look must be plain, screen or photo" % bid)
        b.setdefault("fit", "width")
        if b["fit"] not in FITS:
            errs.append("%s: invalid fit" % bid)
        if b["fit"] == "crop":
            c = b.get("crop")
            if not (isinstance(c, list) and len(c) == 4 and 0 <= c[0] < c[2] <= 1 and 0 <= c[1] < c[3] <= 1):
                errs.append("%s: invalid crop rectangle" % bid)
        if b.get("look") == "photo":
            from photo import validate
            if not s.get("still"):
                errs.append("%s: photo look requires a still image" % bid)
            try:
                validate(b)
            except ValueError as e:
                errs.append("%s: %s" % (bid, e))
        if s.get("still"):
            b["in"], b["out"], b["speed"] = 0.0, slot, 1.0
            b.setdefault("fit", "width")
            continue
        a = float(b.get("in", 0.0))
        o = float(b.get("out", a + slot))
        b["in"], b["out"] = a, o
        if a < 0 or o > s["duration"] + 0.05 or o <= a:
            errs.append("%s: window %.2f-%.2f is outside %s (0-%.2fs)" % (bid, a, o, b["source"], s["duration"]))
        speed = (o - a) / max(slot, 1e-6)
        if not (0.5 <= speed <= 2.0):
            errs.append("%s: window is %.2fs for a %.2fs slot (%.2fx); keep it within 0.5x-2x"
                        % (bid, o - a, slot, speed))
        elif abs(speed - 1) > 0.25:
            warns.append("%s plays at %.2fx" % (bid, speed))
        b["speed"] = round(speed, 4)
        b.setdefault("fit", "width")
        if b["fit"] not in FITS:
            errs.append("%s: fit must be one of %s" % (bid, FITS))
        if b["fit"] == "crop":
            c = b.get("crop")
            if not (isinstance(c, list) and len(c) == 4 and 0 <= c[0] < c[2] <= 1 and 0 <= c[1] < c[3] <= 1):
                errs.append("%s: fit=crop needs crop [x0,y0,x1,y1] as fractions" % bid)
    # the same footage twice reads as a loop
    seen = []
    for b in beats:
        if b.get("state") == "creator" or "in" not in b or srcs.get(b.get("source"), {}).get("still"):
            continue
        for (src, a, o, bid) in seen:
            if src == b["source"] and min(o, b["out"]) - max(a, b["in"]) > 0.5:
                warns.append("%s reuses %.1fs of footage already shown in %s"
                             % (b["id"], min(o, b["out"]) - max(a, b["in"]), bid))
        seen.append((b["source"], b["in"], b["out"], b["id"]))
    spec["duration"] = round(t, 3)
    return spec, errs, warns


def zones(spec):
    """{'product': (y, h), 'creator': (y, h)} for split beats."""
    W, H = spec["size"]
    seam = spec.get("seam") or H // 2
    if spec["creator_side"] == "bottom":
        return {"product": (0, seam), "creator": (seam, H - seam)}
    return {"creator": (0, seam), "product": (seam, H - seam)}


def box_for(spec, b):
    """Where the footage goes for this beat: (y, h) on the canvas, or None."""
    W, H = spec["size"]
    if b["state"] == "product":
        return (0, H)
    if b["state"] == "split":
        return zones(spec)["product"]
    return None


def check_or_die(path):
    spec, errs, warns = resolve(path)
    for w in warns:
        print("  warning: " + w)
    if errs:
        raise SystemExit("cut list %s is invalid:\n  - " % path + "\n  - ".join(errs))
    return spec
