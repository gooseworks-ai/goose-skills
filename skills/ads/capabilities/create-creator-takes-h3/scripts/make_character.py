#!/usr/bin/env python3
"""Generate the creator still from the user's chosen person, in one shot.

    make_character.py --age 34 --gender woman --ethnicity "South Asian" \
        --hair "shoulder-length black hair, slightly frizzy at the crown, tucked behind one ear" \
        --wardrobe "plain charcoal crew-neck t-shirt" \
        --scene "a lived-in home office, a full bookshelf behind her, in focus" \
        --out character/

Writes <out>/character.png and <out>/character.json, the latter ready for plan_takes.py.
`--payload-out <file>` writes {"model", "body"}: the exact request gen_image.py will send. With
`--dry-run` it generates nothing, so the body can be quoted for free before the paid call.

WHY THIS EXISTS

`character-prompt.json` held a carefully built realism formula and **no script read it**. The
skill told whoever was running it to "fill its slots, generate 2-4 options, let the user pick
one". That is three failures at once:

1. Slots got left unfilled. The formula's own note says the model "drifts to an ambiguous
   composite face" without explicit age, ethnicity and sex. An unspecified person IS the
   composite face a reviewer calls "obviously AI".
2. Every run filled the slots differently, so quality depended on who was driving.
3. "generate 2-4 options and pick" is iteration. A template a customer runs has to land the
   first time.

This makes it one command: the identity slots come from the user and are REQUIRED; the craft
slots (imperfections, framing, light) come from the formula and are not the user's problem.

EVERY SLOT IS FILLED OR THE RUN STOPS. A blank slot is how the composite face gets in.
"""
import argparse
import json
import pathlib
import random
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

# The realism lever. The formula says each imperfection is "rendered with physical accuracy and
# its own micro-shadow", so these must be specific and physical, never "some texture". They are
# sampled so that two avatars are not the same face with a different haircut, and seeded off the
# identity so the same brief reproduces the same person.
IMPERFECTIONS = [
    "a small raised mole below the left jawline",
    "faint acne scarring across both cheeks, shallow and old",
    "sun freckles scattered across the nose bridge and upper cheeks",
    "slightly chapped lips with fine vertical cracks",
    "a broken capillary at one nostril crease",
    "uneven eyebrow density, thinner at the outer third of one side",
    "a faint under-eye shadow, darker on one side",
    "a small skin tag at the side of the neck",
    "flaking dry skin at the outer edge of one nostril",
]

# The formula's own capture grammar is a STUDIO PORTRAIT: medium format film, a raking
# side-top key at 45 degrees, shallow depth of field, film grain. Its SKIN engine is right and
# measures in range (detail 6.9-11.2 against 6.2-10.6 for real reference footage), but the
# capture grammar is what makes a correct-skinned face still read as generated: real creator
# footage is a phone, and it is flatter, deeper-focused and much less saturated.
#
# Measured 2026-09-30, real references vs our renders (mean per-pixel saturation):
#     Salary Transparent 0.262 · Chris Klemens 0.182 · Arcads real actor 0.135
#     ours: man46 0.364 · man31 0.217 · woman27 0.507
# The woman-27 render, the one rejected first by eye, is ~3x the Arcads reference. So
# "phone" replaces the capture sentences only, and never touches the skin block.
CAPTURE = {
    "studio": "",   # the formula as written; keep for stills that really are portraits
    "phone": (
        "Shot on a recent phone's front camera, handheld feel but held still, at the subject's "
        "own eye level. Ordinary room light doing all the work, coming mostly from one window "
        "or one ceiling fitting that is visible or clearly motivated in frame - no studio key, "
        "no softbox, no rim light, no ring light. DEEP focus: the room behind the subject is "
        "readable, not melted into bokeh. Muted, slightly desaturated colour, the way an "
        "unedited phone clip looks before any grade - no teal-and-orange, no lifted vibrance, "
        "no colour pop. Slightly uneven white balance. Faint sensor noise in the shadows rather "
        "than film grain. Mild wide-lens distortion near the frame edge. Nothing in the image "
        "looks lit or art-directed; it looks recorded."),
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

    rng = random.Random(a.seed if a.seed is not None else ident.lower())
    imp = rng.sample(IMPERFECTIONS, 3)
    imperfections = ", ".join(imp) + ", and " + age_note(a.age)

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
    }
    blank = [k for k, v in slots.items() if not str(v).strip()]
    if blank:
        sys.exit("these slots are empty: %s. A blank slot is how the composite face gets in."
                 % ", ".join(blank))
    prompt = spec["prompt"].format(**slots)
    if a.capture == "phone":
        # Replace the three studio-capture sentences; the skin block after them is untouched.
        prompt = prompt.replace(
            "Photorealistic, shot on medium format film. Raking side-top light at 45 degrees "
            "reveals every pore as a 3D crater with its own micro-shadow. Shallow depth of "
            "field - critical sharpness on the eyes and the skin of the face, gentle optical "
            "falloff beginning behind the head.",
            "Photorealistic. " + CAPTURE["phone"] + " The light still rakes across the skin "
            "enough to give every pore its own micro-shadow, and the eyes and facial skin are "
            "the sharpest thing in frame.")
        prompt = prompt.replace(
            "Fine organic film grain throughout. Zero digital sharpening - all sharpness is "
            "optical.",
            "Faint sensor noise throughout, heavier in the shadows. Zero digital sharpening.")
        neg = spec["negative_prompt"] + (", saturated colour, vibrant, colour graded, teal and "
              "orange, HDR, studio lighting, softbox, rim light, bokeh background, shallow "
              "depth of field, cinematic grade, glamour lighting, film grain overlay")
        return prompt, neg, ident, slots
    return prompt, spec["negative_prompt"], ident, slots


def main():
    ap = argparse.ArgumentParser()
    # the user's choices; all required, because there is no default person
    ap.add_argument("--age", type=int, required=True)
    ap.add_argument("--gender", required=True, help="woman / man / non-binary person")
    ap.add_argument("--ethnicity", required=True)
    ap.add_argument("--hair", required=True, help="colour, texture, how worn, and how UNTIDY")
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
    ap.add_argument("--expression", default="mid-sentence, mouth slightly open on a word, eyes "
                                            "steady on the lens, no held smile")
    ap.add_argument("--face-fill", default="45 to 55 percent")
    # fal-ai/nano-banana-pro is NB2 Pro, the model this realism formula was written for.
    # Two wrong turns cost a generation each: "nano-banana-2" is an internal engine label fal
    # rejects outright, and plain "fal-ai/nano-banana" is the OLDER model, which produced a
    # face the reviewer called AI-generated on sight.
    ap.add_argument("--capture", default="phone", choices=["phone", "studio"],
                    help="phone (default) reads as recorded; studio is the formula as written")
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
    }, indent=1), encoding="utf-8")
    print("\nwrote %s and character.json" % png)
    print("LOOK AT IT before spending on takes. A still costs cents; a take costs dollars.")


if __name__ == "__main__":
    main()
