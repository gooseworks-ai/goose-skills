#!/usr/bin/env python3
"""Shared creator still builder. Reuse this for generated people in custom video.

The approved brief supplies identity, wardrobe, room and explicit phone/studio
capture. Focus matches the reference. Ordinary skin detail is the default;
distinctive marks require an explicit user choice, never random sampling.
A generated still remains pending visual review before video production.
--dry-run and --payload-out prepare the same payload without generation.
"""
import argparse
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent

# Skin tone follows from ethnicity unless the user overrides it. These are the formula's own
# vocabulary, not invented: it asks for e.g. "deep brown-black / warm medium brown / olive-tan".
SKIN = {
    "black": "deep brown with warm red undertones",
    "african": "deep brown-black with warm undertones",
    "south asian": "warm medium brown with olive undertones",
    "indian": "warm medium brown with olive undertones",
    "east asian": "light olive with warm yellow undertones",
    "chinese": "light olive with warm yellow undertones",
    "japanese": "light olive with neutral undertones",
    "korean": "light olive with neutral undertones",
    "southeast asian": "warm golden brown",
    "hispanic": "olive-tan with warm undertones",
    "latino": "olive-tan with warm undertones",
    "latina": "olive-tan with warm undertones",
    "middle eastern": "olive with warm golden undertones",
    "arab": "olive with warm golden undertones",
    "white": "light beige-pink with visible capillary flush",
    "caucasian": "light beige-pink with visible capillary flush",
    "european": "light beige-pink with visible capillary flush",
    "mixed": "warm medium brown with neutral undertones",
}

# Capture describes the approved recording, not a universal realism trick.
# A sharp face, pores or noise cannot repair an artificial performance.
CAPTURE = {
    "studio": (
        "A real studio portrait with soft motivated light and ordinary colour. "
        "Natural skin detail at this viewing distance, without exaggerated pores, "
        "beauty retouching, edge halos or a waxy finish."),
    "phone": (
        "An ordinary phone recording at eye level. Motivated room or window light, "
        "natural white balance and ordinary colour. Skin has normal fine texture "
        "at this shot size. No beauty filter, cinematic colour grade, artificial "
        "grain overlay or exaggerated sharpening."),
}
FOCUS = {
    "natural": "Natural focus falloff for this camera and subject distance; the room still reads as a real place.",
    "deep": "The person and the required background details remain readable in deep focus, without sharpening halos.",
    "shallow": "The face is in focus with gentle optical background falloff, matching the approved reference; no pasted portrait-mode edge.",
}
RECORDING = {
    "counter": "The phone is supported outside the frame; both hands are free. Complete face and both shoulders remain visible.",
    "selfie": "One hand supports a phone outside the frame; only the other hand is free. Believable selfie framing without cutting off the face.",
}

AGE_NOTES = [
    (0, 25, "smooth forehead with expression lines only when the brow moves, full lip volume"),
    (25, 35, "the first fixed line between the brows, faint crow's feet at rest"),
    (35, 50, "an established nasolabial fold, forehead lines visible at rest, slight under-eye "
             "hollowing"),
    (50, 200, "deep nasolabial folds, crepey texture on the eyelids and neck, visible age spots "
              "on the temples, thinning vermilion border"),
]


def age_note(age):
    for lo, hi, note in AGE_NOTES:
        if lo <= age < hi:
            return note
    return AGE_NOTES[-1][2]


def build(a):
    eth = a.ethnicity.strip()
    # By SOUND, not first letter: "a European", not "an European".
    low_e = eth.lower()
    art = "an" if (low_e[:1] in "aeiou" and not low_e.startswith(("eu", "uk", "uni", "one"))) else "a"
    ident = "%s %s %s aged %d" % (art, eth, a.gender.strip(), a.age)

    skin = a.skin_tone or SKIN.get(a.ethnicity.strip().lower())
    if not skin:
        sys.exit(
            "no skin tone known for ethnicity %r.\n"
            "Pass --skin-tone explicitly, in the formula's vocabulary, e.g. "
            "'warm medium brown with olive undertones'." % a.ethnicity)

    marks = [mark.strip() for mark in (getattr(a, "marks", None) or []) if mark.strip()]
    if marks and not getattr(a, "marks_approved", False):
        sys.exit("--marks needs --marks-approved: distinctive marks come from the user's choice, never random defaults")
    imperfections = "; ".join(marks) if marks else "Ordinary fine skin texture and subtle facial asymmetry; no invented scars, moles or distinctive marks."

    # Check the RAW arguments, before any decoration. An earlier version appended the full stop
    # first, so `--hair "  "` became "." and passed the not-empty test: a blank slot got through
    # the guard whose whole job was to stop blank slots.
    raw = {"hair": a.hair, "wardrobe": a.wardrobe, "scene": a.scene, "framing": a.framing,
           "expression": a.expression, "face_fill": a.face_fill, "gender": a.gender,
           "ethnicity": a.ethnicity}
    empty = sorted(k for k, v in raw.items() if not (v or "").strip())
    if empty:
        sys.exit("these are empty: %s. A blank slot is how the composite face gets in."
                 % ", ".join(empty))
    if not 16 <= a.age <= 90:
        sys.exit("--age %d is outside 16-90; state a real age." % a.age)

    spec = json.loads((HERE / "character-prompt.json").read_text(encoding="utf-8"))
    slots = {
        "identity": ident,
        "skin_tone": skin,
        "hair": a.hair.strip().rstrip(".") + ".",
        "wardrobe": a.wardrobe.strip().rstrip(".") + ".",
        "framing": a.framing.strip().rstrip(".") + ".",
        "scene": a.scene.strip().rstrip(".") + ".",
        "expression": a.expression.strip().rstrip(".") + ".",
        "imperfections": imperfections,
        "face_fill": a.face_fill,
        "capture": CAPTURE[a.capture],
        "focus": FOCUS[getattr(a, "focus", "natural")],
        "recording": RECORDING[getattr(a, "recording", "counter")],
    }
    blank = [k for k, v in slots.items() if not str(v).strip()]
    if blank:
        sys.exit("these slots are empty: %s. A blank slot is how the composite face gets in."
                 % ", ".join(blank))
    prompt = spec["prompt"].format(**slots)
    return prompt, spec["negative_prompt"], ident, slots


def main():
    ap = argparse.ArgumentParser()
    # the user's choices; all required, because there is no default person
    ap.add_argument("--age", type=int, required=True)
    ap.add_argument("--gender", required=True, help="woman / man / non-binary person")
    ap.add_argument("--ethnicity", required=True)
    ap.add_argument("--hair", required=True, help="hair detail from the approved brief")
    ap.add_argument("--wardrobe", required=True)
    ap.add_argument("--scene", required=True, help="where they are and what is behind them")
    # craft defaults: the formula's job, not the user's
    ap.add_argument("--skin-tone", default=None, help="override; normally derived from ethnicity")
    # Head-and-SHOULDERS reads as a tight crop at 9:16 and the room disappears; the reviewer's
    # first reaction to it was to ask for a different aspect ratio, when the ratio was already
    # 9:16. Upper chest plus explicit space is the same ratio and reads as a room.
    ap.add_argument("--framing", default="head and upper chest, with clear space above the head "
                                         "and on both sides so the room reads around them, "
                                         "squared to camera, looking into the lens")
    ap.add_argument("--expression", default="relaxed expression, lips at rest, natural gaze toward "
                                            "the lens, no held smile")
    ap.add_argument("--face-fill", default="45 to 55 percent")
    # fal-ai/nano-banana-pro is NB2 Pro, the model this realism formula was written for.
    # Two wrong turns cost a generation each: "nano-banana-2" is an internal engine label fal
    # rejects outright, and plain "fal-ai/nano-banana" is the OLDER model, which produced a
    # face the reviewer called AI-generated on sight.
    ap.add_argument("--capture", required=True, choices=["phone", "studio"],
                    help="explicit recording choice from the approved brief")
    ap.add_argument("--recording", default="counter", choices=sorted(RECORDING))
    ap.add_argument("--focus", default="natural", choices=sorted(FOCUS), help="match the approved reference; deep focus is not universal")
    ap.add_argument("--marks", action="append", help="specific distinctive mark chosen by the user")
    ap.add_argument("--marks-approved", action="store_true", help="the user explicitly chose the supplied marks")
    ap.add_argument("--model", default="fal-ai/nano-banana-pro")
    # 4K, not the 1K default. The formula demands pores "legible, not implied"; at 1K the face
    # is ~700px wide and a pore is sub-pixel, so the whole skin system renders as smooth skin.
    ap.add_argument("--resolution", default="4K", choices=["1K", "2K", "4K"])
    ap.add_argument("--aspect", default="9:16")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--out", required=True, type=pathlib.Path)
    ap.add_argument("--dry-run", action="store_true", help="print the prompt, generate nothing")
    ap.add_argument("--payload-out", type=pathlib.Path, default=None,
                    help='write {"model", "body"}, the exact request gen_image.py will send, so it '
                         "can be quoted before the paid call; works with --dry-run")
    a = ap.parse_args()

    prompt, negative, ident, slots = build(a)
    out = a.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    (out / "character-prompt.txt").write_text(prompt, encoding="utf-8")

    print("identity : %s" % ident)
    print("skin     : %s" % slots["skin_tone"])
    print("marks    : %s" % slots["imperfections"][:96] + "...")
    print("prompt   : %d chars -> %s" % (len(prompt), out / "character-prompt.txt"))
    # Save the same identity metadata for free planning and actual generation.
    (out / "character.json").write_text(json.dumps({
        "image": "character.png",
        "identity": ident + ", " + slots["hair"].rstrip(".") + ", " + slots["wardrobe"].rstrip("."),
        "environment": slots["scene"].rstrip("."),
        "capture": a.capture, "recording": a.recording, "focus": a.focus,
        "distinctive_marks": a.marks or [], "approval": "pending",
    }, indent=1), encoding="utf-8")

    # Built once, before the dry-run return, so the quoted body and the paid body are one object.
    payload = {"prompt": prompt, "negative_prompt": negative, "aspect_ratio": a.aspect,
               "resolution": a.resolution}
    if a.seed is not None:
        payload["seed"] = a.seed
    if a.payload_out:
        a.payload_out.parent.mkdir(parents=True, exist_ok=True)
        a.payload_out.write_text(json.dumps({"model": a.model, "body": payload}, indent=1),
                                 encoding="utf-8")
        print("payload  : %s (quote this body before the paid call)" % a.payload_out)
    if a.dry_run:
        print("\n(dry run, nothing generated)")
        return

    png = out / "character.png"
    r = subprocess.run([sys.executable, str(HERE.parent.parent / "create-image-fal" / "scripts"
                                            / "gen_image.py"),
                        "--model", a.model, "--payload", json.dumps(payload),
                        "--out", str(png)])
    if r.returncode or not png.exists():
        sys.exit("image generation failed; nothing written")

    # character.json is what plan_takes.py consumes, so write it here and the operator never
    # retypes identity. A person described twice drifts between takes.
    (out / "character.json").write_text(json.dumps({
        "image": "character.png",
        "identity": ident + ", " + slots["hair"].rstrip(".") + ", " + slots["wardrobe"].rstrip("."),
        "environment": slots["scene"].rstrip("."),
        "capture": a.capture, "recording": a.recording, "focus": a.focus,
        "distinctive_marks": a.marks or [], "approval": "pending",
    }, indent=1), encoding="utf-8")
    print("\nwrote %s and character.json" % png)
    print("LOOK AT IT before spending on takes. A still costs cents; a take costs dollars.")


if __name__ == "__main__":
    main()
