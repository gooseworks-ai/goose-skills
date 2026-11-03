#!/usr/bin/env python3
"""Per-second price table for the podcast-skit engine, with provenance.

Every number here is READ from this repo, not from a vendor page and not from a
generation. The `src` field names the file that records it so the next operator
can re-check it without spending. Nothing in this module makes a network call.

Definitions used throughout:
  * "lipsync second"  = one second of an audio-driven talking clip. The audio is
    an ElevenLabs MP3 the operator already paid for, so the engine MUST be able
    to drive the mouth from that file. This rules out every text-to-video model
    that only speaks its own invented dialogue.
  * "motion second"   = one second of image-to-video with no mouth requirement
    (inserts, listener idles, establishing shots).

Run `python cost_model.py` for the table and a per-format estimate.
"""
from __future__ import annotations

import argparse
import json
import pathlib

# ---------------------------------------------------------------- price table
# audio_driven=True  -> can lipsync to a supplied MP3
# audio_driven=False -> image-to-video only; mouth cannot be driven by our VO
ENGINES = {
    "veed-fabric-1.0@480p": {
        "usd_per_sec": 0.08,
        "audio_driven": True,
        "src": "skills/atoms/lipsync/create-lipsync-veed-fal/scripts/generate.py:30",
        "note": "COST_PER_SEC = {'480p': 0.08, '720p': 0.15}",
    },
    "veed-fabric-1.0@720p": {
        "usd_per_sec": 0.15,
        "audio_driven": True,
        "src": "skills/atoms/lipsync/create-lipsync-veed-fal/SKILL.md:26",
        "note": "current recipe default",
    },
    "hedra-character-3": {
        "usd_per_sec": 0.0333,
        "audio_driven": True,
        "src": "skills/atoms/lipsync/create-lipsync-hedra/SKILL.md:106",
        "note": "6 credits/sec; Creator plan $30/5400cr = $0.005556/cr -> $0.0333/s. "
                "Subscription, not pay-as-you-go: the marginal rate only holds "
                "while the monthly credits last.",
    },
    "kling-v3-std-i2v": {
        "usd_per_sec": 0.08,
        "audio_driven": False,
        "src": "skills/atoms/video-generation/create-video-kling/scripts/generate-fal.py:34",
        "note": "COST_PER_SEC = {'std': 0.08, 'pro': 0.112}",
    },
    "kling-v3-pro-i2v": {
        "usd_per_sec": 0.112,
        "audio_driven": False,
        "src": "skills/atoms/video-generation/create-video-kling/scripts/generate-fal.py:34",
        "note": "",
    },
    "minimax-h3@480p": {
        "usd_per_sec": 0.05,
        "audio_driven": False,
        "src": "skills/atoms/_shared/MODEL_BEHAVIORS.md:543",
        "note": "published list price",
    },
    "minimax-h3@768p": {
        "usd_per_sec": 0.08,
        "audio_driven": False,
        "src": "skills/atoms/_shared/MODEL_BEHAVIORS.md:543",
        "note": "published; a launch discount to $0.02/s is recorded but is a "
                "discount, not a rate to plan on",
    },
    "minimax-h3@1080p": {
        "usd_per_sec": 0.16,
        "audio_driven": False,
        "src": "skills/atoms/_shared/MODEL_BEHAVIORS.md:543",
        "note": "",
    },
    "minimax-h3-max-r2v@768p": {
        "usd_per_sec": 0.40,
        "audio_driven": False,
        "src": "skills/atoms/_shared/MODEL_BEHAVIORS.md:541-556",
        "note": "MEASURED, not published: a 5s 768p call with 1 image + 12s of "
                "video reference billed $2.01 = $0.40/s of output, 5x the "
                "published 768p rate. Reference seconds bill at ~$0.138/s.",
    },
    "seedance-2.0@720p": {
        "usd_per_sec": 0.30,
        "audio_driven": False,
        "src": "skills/atoms/video-generation/create-video-seedance-fal/SKILL.md:30",
        "note": "REFUSES photoreal human faces (partner_validation_failed) and "
                "the refused submit still bills. See REJECTED_FOR_THIS_FORMAT.",
    },
    "seedance-2.0-r2v@720p": {
        "usd_per_sec": 0.083,
        "audio_driven": False,
        "src": "skills/atoms/video-generation/create-video-seedance-r2v/scripts/"
               "generate-fal.py:39",
        "note": "same refusal gate as above",
    },
    "veo3.1-fast-i2v@720p": {
        "usd_per_sec": 0.15,
        "audio_driven": False,
        "src": "skills/atoms/_shared/MODEL_BEHAVIORS.md:1026-1031",
        "note": "list $0.15/s, but staging billed 288 credits for 6s where the "
                "list price implied ~10. Speaks its OWN voice, so it cannot "
                "carry a locked ElevenLabs cast.",
    },
}

# Image models are billed per image, not per second. Kept separate so nobody
# divides an image price by a duration.
IMAGE_ENGINES = {
    "openai/gpt-image-2@high": {
        "usd_per_image": 0.19,
        "src": "skills/molecules/create-street-interview-video/TAKES.md:25",
        "note": "recorded band $0.07-0.19/still; 0.19 is the high-quality end, "
                "which is what this recipe asks for. CURRENT recipe default.",
    },
    "bytedance/seedream/v5/lite": {
        "usd_per_image": 0.04,
        "src": "skills/atoms/planning/plan-script-for-video-ad/references/"
               "avatar_ugc.md:113",
        "note": "'Cdream' in the sync notes. Cheapest photoreal still, but see "
                "REJECTED_FOR_THIS_FORMAT: it does NOT clear the Seedance gate.",
    },
    "nano-banana-2": {
        "usd_per_image": 0.08,
        "src": "recipe.json config.characters._comment (gpt-image-2 high is "
               "'~2-2.5x nano-banana's cost', so 0.19/2.4 ~ 0.08)",
        "note": "DERIVED, not measured. Faces read as smooth AI-stock; the "
                "recipe already rejected it on quality.",
    },
}

REJECTED_FOR_THIS_FORMAT = {
    "seedance-2.0@720p": (
        "Refuses photoreal human faces at submit with "
        "partner_validation_failed / 'likenesses of real people'. The repo "
        "records this firing for GPT-Image-2 stills AND for Seedream v4 AND "
        "for a fresh Seedream v5 Pro face (MODEL_BEHAVIORS.md:998, seed 8401, "
        "2026-09-29). So swapping the IMAGE model does not clear the gate, and "
        "'switch to Cdream/Seedream' does not fix the reported symptom. A "
        "rejected submit still bills through the fal-proxy "
        "(create-video-seedance-2-fal/SKILL.md:91)."
    ),
    "minimax-h3@768p": (
        "Usable for inserts but NOT for the hosts: H3 image-to-video does not "
        "treat the input image as a literal first frame. Measured drift of "
        "42.3/255 mean absolute at frame 0, a 1.8x reframe, and an invented "
        "background (MODEL_BEHAVIORS.md:769). This format's core promise is a "
        "pixel-stable set across every cut, so H3 breaks the one thing the "
        "format sells. H3 Max additionally will not hold an eyeline on the "
        "lens across three controlled takes (MODEL_BEHAVIORS.md:557), which "
        "is fatal for a piece to camera. There is also no H3 atom in this "
        "repo, so adopting it means writing and testing a new atom."
    ),
    "veo3.1-fast-i2v@720p": (
        "Speaks its own invented voice and ad-libs words it was not given "
        "('marketing trist or something'), and its eyes go wide and stare from "
        "~4.4s (MODEL_BEHAVIORS.md:1026). A podcast skit needs a locked cast "
        "reading approved copy, so a model that writes its own audio cannot "
        "carry the dialogue."
    ),
    "kling-v3-std-i2v-as-lipsync": (
        "Kling 3.0's lip-sync is phoneme-level for dialogue KLING generates, "
        "not for a supplied MP3 (create-video-kling/SKILL.md). It cannot carry "
        "an approved ElevenLabs read, so it is a motion engine here, not a "
        "lipsync engine."
    ),
}

ELEVENLABS_USD_PER_1K_CHARS = 0.30  # Creator tier list rate, stated as an estimate


def estimate(cfg: dict, beats: list[dict]) -> dict:
    """Cost of one full paid run, from the config and the planned beats.

    Deterministic arithmetic only. Never calls a provider.
    """
    edit = cfg.get("edit", {})
    eng = cfg["engines"]
    lip = eng["lipsync"]
    mot = eng.get("motion")
    img = eng["stills"]

    wps = float(edit.get("words_per_sec", 2.6))
    lip_secs = sum(max(0.9, len(b["text"].split()) / wps) for b in beats)
    n_clips = len(beats)

    n_stills = len(cfg["characters"]["bases"]) + len(
        cfg["characters"]["expression_variants"])

    chars = sum(len(b["text"]) for b in beats)

    lip_rate = ENGINES[lip]["usd_per_sec"]
    img_rate = IMAGE_ENGINES[img]["usd_per_image"]

    rows = [
        {"step": "voiceover", "engine": "elevenlabs/" + cfg["hosts"]["A"]["model"],
         "units": f"{chars} chars",
         "usd": round(chars / 1000.0 * ELEVENLABS_USD_PER_1K_CHARS, 4)},
        {"step": "stills", "engine": img, "units": f"{n_stills} images",
         "usd": round(n_stills * img_rate, 4)},
        {"step": "lipsync", "engine": lip,
         "units": f"{n_clips} clips / {lip_secs:.1f}s",
         "usd": round(lip_secs * lip_rate, 4)},
    ]
    if mot and edit.get("inserts", {}).get("enabled"):
        ins = edit["inserts"]
        n_ins = int(ins.get("count", 0))
        ins_secs = n_ins * float(ins.get("sec", 2.0))
        rows.append({"step": "inserts", "engine": mot,
                     "units": f"{n_ins} clips / {ins_secs:.1f}s",
                     "usd": round(ins_secs * ENGINES[mot]["usd_per_sec"], 4)})
    total = round(sum(r["usd"] for r in rows), 4)
    return {"rows": rows, "total_usd": total,
            "assembly_usd": 0.0,
            "note": "assembly, multicut, split-screen, captions, end card and "
                    "every re-cut are $0 -- they only re-edit picture over an "
                    "audio timeline that is already paid for."}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config")
    ap.add_argument("--beats")
    a = ap.parse_args()

    w = max(len(k) for k in list(ENGINES) + list(IMAGE_ENGINES))
    print("VIDEO ENGINES (per second of output)")
    for k, v in sorted(ENGINES.items(), key=lambda kv: kv[1]["usd_per_sec"]):
        flag = "audio-driven" if v["audio_driven"] else "i2v only   "
        bad = "  REJECTED" if k in REJECTED_FOR_THIS_FORMAT else ""
        print(f"  {k:<{w}}  ${v['usd_per_sec']:>6.4f}/s  {flag}{bad}")
        print(f"  {'':<{w}}  src: {v['src']}")
    print("\nIMAGE ENGINES (per image)")
    for k, v in sorted(IMAGE_ENGINES.items(), key=lambda kv: kv[1]["usd_per_image"]):
        print(f"  {k:<{w}}  ${v['usd_per_image']:>6.4f}/img   src: {v['src']}")
    print("\nREJECTED FOR THIS FORMAT")
    for k, why in REJECTED_FOR_THIS_FORMAT.items():
        print(f"  - {k}: {why}\n")

    if a.config and a.beats:
        cfg = json.loads(pathlib.Path(a.config).read_text(encoding="utf-8"))
        beats = json.loads(pathlib.Path(a.beats).read_text(encoding="utf-8"))["beats"]
        est = estimate(cfg, beats)
        print("ESTIMATE FOR THIS CONFIG")
        for r in est["rows"]:
            print(f"  {r['step']:<10} {r['engine']:<28} {r['units']:<22} "
                  f"${r['usd']:.4f}")
        print(f"  {'TOTAL':<10} {'':<28} {'':<22} ${est['total_usd']:.4f}")
        print("  " + est["note"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
