#!/usr/bin/env python3
"""render.py — the DRIVER for the render-offer-ad capability.

Free, deterministic. Reads a brand `--config config.json` (the shape the recipe
binds — see config.example.json), binds it into the bundled Remotion project's
input props, renders the 9:16 master with `npx remotion render`, then derives a
1:1 center-crop with ffmpeg. NO paid model calls, NO hardcoded /Users or clients
paths — every asset arrives via the config and is staged under a runtime
working dir.

Two GATING CHECKS run before any render (both from the recipe):
  (a) CLAIM-MATCHES-FORMAT — the claim/proof verbs must match the product's
      physical format (liquid → spoon/sip/drink/0 mess; powder → scoop/mix/no
      clumps; capsule → 1 a day; gummy → chew). Reject category-default vocab
      that describes a DIFFERENT format.
  (b) CLAIM-BEAT MECHANISM PROP — the claim beat must carry an edge-entry
      mechanism_prop (a text-only claim beat is too static).

Usage:
  python3 render.py --config config.json --work-dir <dir> --out <dir/master>
    [--aspects 9:16,1:1] [--no-crop] [--skip-gates]

Outputs (under --out's directory, basename from --out):
  <out>-9x16.mp4   (the 1080x1920 master; always)
  <out>-1x1.mp4    (1080x1080 center-crop; when 1:1 in aspects)
"""
import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def _resolve_project_dir() -> str:
    """Locate the bundled Remotion project/ dir robustly.

    Works whether render.py runs from the REPO layout (capability/scripts/render.py
    → ../project) OR from a FETCHED layout: `gooseworks fetch` flattens the scripts/
    prefix, so render.py lands at the capability root and project/ is a sibling
    (→ ./project). Try both, then a short upward walk; match on package.json.
    """
    candidates = [
        os.path.join(HERE, "project"),                    # fetched: render.py at cap root
        os.path.join(os.path.dirname(HERE), "project"),   # repo: render.py in scripts/
    ]
    d = HERE
    for _ in range(4):
        d = os.path.dirname(d)
        candidates.append(os.path.join(d, "project"))
    for c in candidates:
        if os.path.isfile(os.path.join(c, "package.json")):
            return c
    return os.path.join(os.path.dirname(HERE), "project")  # repo-layout default


PROJECT_DIR = _resolve_project_dir()
COMPOSITION_ID = "offer-ad"

# ---- physical-format → allowed claim vocabulary (gating check a) -----------
FORMAT_VOCAB = {
    "liquid": {"spoon", "sip", "drink", "drinkable", "pour", "mess", "shot", "swig"},
    "powder": {"scoop", "mix", "stir", "clump", "clumps", "shake", "blend", "powder"},
    "capsule": {"capsule", "pill", "swallow", "daily", "day", "caps"},
    "gummy": {"chew", "gummy", "gummies", "bite"},
    "cream": {"apply", "rub", "spread", "dab", "massage"},
    "serum": {"drop", "apply", "dropper", "absorb"},
    # digital products (SaaS / software / app) — the mechanism is the workflow, not a
    # physical action. Recognized so the gate doesn't WARN "unknown"; no forbidden set.
    "software": {"search", "prompt", "click", "type", "sync", "one"},
    "saas": {"search", "prompt", "click", "type", "sync", "one"},
    "app": {"search", "prompt", "click", "tap", "type", "sync"},
}
# vocab that belongs to a DIFFERENT format and must NOT appear (mismatch flag)
FORMAT_FORBIDDEN = {
    "liquid": {"scoop", "clump", "clumps", "chew", "gummy"},
    "powder": {"sip", "drink", "chew", "gummy", "swallow"},
    "capsule": {"scoop", "sip", "chew"},
    "gummy": {"scoop", "sip", "swallow"},
    "cream": {"drink", "sip", "chew", "swallow"},
    "serum": {"drink", "chew", "swallow"},
    # digital products have no physical-format vocabulary to collide with.
    "software": set(),
    "saas": set(),
    "app": set(),
}


def die(msg: str) -> None:
    print(f"[render-offer-ad] ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def gate_claim_matches_format(cfg: dict) -> None:
    """(a) claim verbs must match the product's physical format."""
    fmt = (cfg.get("product_format") or "").strip().lower()
    if not fmt:
        print(
            "[render-offer-ad] WARN: no product_format set — skipping "
            "claim-matches-format gate. Set product_format (liquid/powder/"
            "capsule/gummy/cream/serum) to enable it."
        )
        return
    if fmt not in FORMAT_FORBIDDEN:
        print(f"[render-offer-ad] WARN: unknown product_format '{fmt}' — gate skipped.")
        return
    claim_words = set()
    for row in cfg.get("copy", {}).get("claim_lines", []):
        for field in ("big", "small"):
            claim_words |= {w.strip(".,!").lower() for w in str(row.get(field, "")).split()}
    # also scan the motif chip (it often names the mechanism, e.g. DRINKABLE)
    claim_words |= {w.strip(".,!").lower() for w in str(cfg.get("copy", {}).get("motif_chip", "")).split()}
    bad = claim_words & FORMAT_FORBIDDEN[fmt]
    if bad:
        die(
            f"CLAIM-MATCHES-FORMAT gate failed: product_format='{fmt}' but the "
            f"claim/motif copy uses foreign-format verbs {sorted(bad)}. Rewrite the "
            f"claim to the product's real format (e.g. liquid → 'spoon / sip / 0 mess', "
            f"powder → 'scoop / mix / no clumps'). Use --skip-gates only if intentional."
        )


def gate_mechanism_prop(cfg: dict) -> None:
    """(b) the claim beat needs an edge-entry mechanism prop."""
    prop = (cfg.get("mechanism_prop") or "").strip().lower()
    if prop not in ("spoon", "accent"):
        die(
            "CLAIM-BEAT MECHANISM PROP gate failed: mechanism_prop must be a "
            "supported edge-entry prop ('spoon' for drinkable liquids, or 'accent' "
            "for a neutral edge-entry accent bar). A text-only claim beat is too "
            "static. Got: "
            + repr(cfg.get("mechanism_prop"))
        )


def clean_cta_label(label: str) -> str:
    """Scene04 ALWAYS appends its own '→' arrow. Strip a trailing arrow (and
    whitespace) the operator may have typed into cta_label so it never renders a
    double arrow ('Try it → →')."""
    s = str(label).rstrip()
    for arrow in ("→", "->", "➔", "➜", "»", "▶", "➡"):
        if s.endswith(arrow):
            s = s[: -len(arrow)].rstrip()
            break
    return s


def stage_asset(src: str, public_dir: str, dest_name: str) -> str:
    """Copy an asset into the project's public/ and return the basename."""
    if not src or not os.path.isfile(src):
        die(f"asset not found: {src!r} (must be an existing file)")
    ext = os.path.splitext(src)[1] or ""
    base = f"{dest_name}{ext}"
    shutil.copy2(src, os.path.join(public_dir, base))
    return base


def build_props(cfg: dict, public_dir: str) -> dict:
    """Map the brand config onto the OfferAdProps shape props.ts reads."""
    pal = cfg["brand_palette"]
    # brand_palette may be a dict (roles) or a >=4-hex list (recipe allows both).
    if isinstance(pal, list):
        if len(pal) < 4:
            die("brand_palette list needs >=4 hexes [primary_ground, light_ground, ink, highlight_chip]")
        palette = {
            "primary_ground": pal[0],
            "light_ground": pal[1],
            "ink": pal[2],
            "highlight_chip": pal[3],
        }
    else:
        palette = {
            "primary_ground": pal["primary_ground"],
            "light_ground": pal["light_ground"],
            "ink": pal["ink"],
            "highlight_chip": pal["highlight_chip"],
        }

    product_base = stage_asset(cfg["product_hero_image"], public_dir, "product")

    music_cfg = cfg.get("music") or {}
    music_src = music_cfg.get("bed") or music_cfg.get("src")
    music_base = None
    if music_src:
        music_base = stage_asset(music_src, public_dir, "bed")

    fonts = cfg.get("fonts") or {}
    beat_split = cfg.get("beat_split_sec") or [3.0, 3.5, 3.0, 2.5]
    if len(beat_split) != 4:
        die("beat_split_sec must be exactly 4 values [headline, product, claim, cta]")

    copy = cfg["copy"]
    return {
        "palette": palette,
        "copy": {
            "headline_words": copy["headline_words"],
            "subline": copy.get("subline", ""),
            "motif_chip": copy.get("motif_chip", ""),
            "claim_lines": copy["claim_lines"],
            "cta_label": clean_cta_label(copy["cta_label"]),
            "cta_url": copy["cta_url"],
            "wordmark": copy["wordmark"],
        },
        "product_image": product_base,
        "mechanism_prop": cfg.get("mechanism_prop", "accent"),
        "bpm": cfg.get("bpm", 115),
        "beat_split_sec": beat_split,
        "fonts": {
            "display": fonts.get("display", "ArchivoBlack"),
            "body": fonts.get("body", "Inter"),
        },
        "music": {
            "src": music_base,
            "fade_out_frames": int(music_cfg.get("fade_out_frames", 18)),
        },
        "show_competitor_strike": bool(cfg.get("show_competitor_strike", True)),
    }


def run(cmd, cwd=None):
    print("[render-offer-ad] $", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True, help="brand config.json")
    ap.add_argument("--work-dir", required=True, help="runtime working dir (staged props + intermediates)")
    ap.add_argument("--out", required=True, help="output master path prefix (e.g. <dir>/master)")
    ap.add_argument("--aspects", default=None, help="comma list, e.g. '9:16,1:1' (defaults to config.aspects or '9:16,1:1')")
    ap.add_argument("--no-crop", action="store_true", help="skip the 1:1 crop even if requested")
    ap.add_argument("--skip-gates", action="store_true", help="skip the two gating checks (use only when intentional)")
    args = ap.parse_args()

    with open(args.config) as f:
        cfg = json.load(f)

    if not args.skip_gates:
        gate_claim_matches_format(cfg)
        gate_mechanism_prop(cfg)

    aspects = (args.aspects.split(",") if args.aspects else cfg.get("aspects") or ["9:16", "1:1"])
    aspects = [a.strip() for a in aspects]

    os.makedirs(args.work_dir, exist_ok=True)
    public_dir = os.path.join(PROJECT_DIR, "public")
    os.makedirs(public_dir, exist_ok=True)

    props = build_props(cfg, public_dir)
    props_path = os.path.join(args.work_dir, "props.json")
    with open(props_path, "w") as f:
        json.dump(props, f, indent=2)
    print(f"[render-offer-ad] wrote input props -> {props_path}")

    out_dir = os.path.dirname(os.path.abspath(args.out)) or "."
    os.makedirs(out_dir, exist_ok=True)
    base = os.path.basename(args.out)
    master_9x16 = os.path.join(out_dir, f"{base}-9x16.mp4")

    # ensure the project has deps (npx remotion needs node_modules present).
    if not os.path.isdir(os.path.join(PROJECT_DIR, "node_modules")):
        print("[render-offer-ad] installing Remotion deps (one-time)...")
        run(["npm", "install"], cwd=PROJECT_DIR)

    # 9:16 master via Remotion, input props from the config.
    run(
        [
            "npx", "remotion", "render", COMPOSITION_ID,
            master_9x16,
            "--props", props_path,
        ],
        cwd=PROJECT_DIR,
    )
    print(f"[render-offer-ad] WROTE 9:16 master -> {master_9x16}")

    # 1:1 center-crop derived from the 9:16 master (no 2nd composition).
    if "1:1" in aspects and not args.no_crop:
        master_1x1 = os.path.join(out_dir, f"{base}-1x1.mp4")
        run(
            [
                "ffmpeg", "-y", "-i", master_9x16,
                "-vf", "crop=1080:1080:0:(1920-1080)/2",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
                "-c:a", "aac", "-b:a", "192k",
                master_1x1,
            ]
        )
        print(f"[render-offer-ad] WROTE 1:1 crop  -> {master_1x1}")
        print("[render-offer-ad] NOTE: /watch the 1:1 — confirm no key text/product clips in the crop.")

    print("[render-offer-ad] done.")


if __name__ == "__main__":
    main()
