#!/usr/bin/env python3
"""Six street-interview variants, one generation each. PAID. Dry run unless --yes.

    python variants_gen.py                    # prints every prompt and the total cost
    python variants_gen.py --only night       # one
    python variants_gen.py --yes              # SPENDS

Each is a different grammar, not a re-roll of the same idea with a new seed. They all inherit
what the single-generation test proved, because that is the finding this format rests on:

  ONE call, ONE stated location repeated in every shot description, the can passed as a
  reference image, and the interviewer's question generated INSIDE the clip so it shares the
  scene's microphone. Assembling separate generations is what produced every fault the earlier
  cuts were rejected for, and no amount of post fixes it.

The likeness gate refuses uploaded photos of PEOPLE, not products, so the can can be a
reference image and the strangers must be generated from text.
"""
import argparse
import json
import sys
import urllib.request

import brandkit
import format_spec
import paths

HERE = paths.HERE
ROOT = paths.ROOT

MODEL = "bytedance/seedance-2.0/reference-to-video"
CAN = ROOT / "clients" / "liquid-death" / "brand-assets" / "reference-photos" / \
    "mountain-water-still-19oz-tallboy-official.png"
DURATION = 12
RATE = 0.3034          # 2.0 at 480-720p. 2.0/fast is 0.2419 and is the cheaper sweep option.

COMMON = (
    "The tall white drink can in @Image1 appears exactly as in the reference: same white body, "
    "same dark blackletter lettering, same gold illustration. Do not restyle or redesign it. "
    "An interviewer stands off camera and is never seen except for their two hands and their "
    "sleeves. THE INTERVIEWER USES BOTH HANDS AND BOTH ARE VISIBLE IN EVERY SHOT: the RIGHT "
    "hand holds a plain unbranded black microphone with a thick black foam windscreen and a "
    "visible cable, held up close under the speaker's chin, and the LEFT hand separately holds "
    "the can from @Image1 lower down in the frame. The microphone is a microphone and the can "
    "is a can; they are two different objects in two different hands and are never merged. "
    "A microphone is clearly visible under the chin of every person who speaks. "
    "Plain ordinary healthy members of the public in everyday clothes, nobody unwell, nobody a "
    "model. No shopfronts, no signage, no posters, no writing of any kind anywhere except the "
    "can's own label. "
    "Sound: the voices close on the handheld microphone and one continuous ambience that never "
    "changes across the cuts. There is no music, no soundtrack and no score. "
    "- No music, no logo, no text on screen, no subtitles.")

ANSWERS = (
    "Shot 2: a heavyset balding man in a paint-stained work jacket, the black microphone held "
    "under his chin, glances down at the can in the other hand, snorts and says flatly: "
    "\"Beer. Obviously.\" "
    "Shot 3: a tired woman in her thirties in teal medical scrubs, the same background behind "
    "her and the black microphone held under her chin, winces and says: "
    "\"Something that's gonna kill me.\" "
    "Shot 4: a young man in a denim jacket cracks the can from @Image1 open, drinks, lowers it "
    "and says, surprised: \"Wait, that's water.\" ")

OPEN = ("Shot 1: the interviewer's left hand holds the can from @Image1 up toward a person who "
        "leans in to look at it, while the right hand holds the black microphone under their "
        "chin, and the interviewer asks from off camera, unseen: \"Quick question. What's in "
        "this can?\" (the person in the frame does not say this line, they only squint at the "
        "can). ")

VARIANTS = {
    # The proven one is `ld-single-seed4802`; it is not repeated here.
    "night": dict(seed=4810, why="Night, neon and a crowd. The reference sweep's clearest "
                  "finding was that a Veo street clip which reads plausible does so because "
                  "night, density and motion hide the tells that flat daylight exposes.",
                  look="Raw unedited phone footage at night, filmed on an iPhone at 24mm, "
                       "handheld, lit by shop neon and street lighting, grainy in the shadows, "
                       "deep depth of field with the street kept sharp behind.",
                  place="a busy city pavement outside a row of lit takeaway windows, with "
                        "people walking past in both directions the whole time, wet tarmac "
                        "reflecting red and green light, and traffic moving behind"),
    "sun": dict(seed=4811, why="Hard summer sun. The real references squint, blow out the sky "
                "and go contrasty; our overcast take is the easy lighting, not the true one.",
                look="Raw unedited phone footage in harsh midday summer sunlight, filmed on an "
                     "iPhone at 24mm, handheld, blown-out bright sky, hard shadows, people "
                     "squinting, deep depth of field.",
                place="a wide seafront promenade with railings, a low wall and the sea behind, "
                      "palm trees along the path and people passing on bicycles"),
    "cube": dict(seed=4812, why="SubwayTakes grammar: the SUBJECT holds a mic cube. It changes "
                 "the body language completely and is the strongest 'this is a series' signal "
                 "in the reference set.",
                 look="Raw unedited phone footage, filmed on an iPhone at 24mm, handheld, flat "
                      "overcast daylight, closer framing than a street two-shot, deep depth of "
                      "field.",
                 place="a set of wide stone steps outside a civic building, with people sitting "
                       "on them and pigeons on the paving",
                 swap=("THE PERSON SPEAKING HOLDS THE MICROPHONE THEMSELVES: a plain unbranded "
                       "black cube microphone on a short handle, held in their own hand close "
                       "to their mouth, while the interviewer's hand holds only the can from "
                       "@Image1. ")),
    "indoor": dict(seed=4813, why="An interior. Different light, different acoustics, and it "
                   "tests whether the street itself was carrying the realism.",
                   look="Raw unedited phone footage indoors, filmed on an iPhone at 24mm, "
                        "handheld, mixed overhead fluorescent and daylight from a glass wall, "
                        "deep depth of field.",
                   place="the ground-floor lobby of a gym, with equipment visible through a "
                         "glass partition, a water fountain against the wall and people walking "
                         "through in sports clothes"),
    "walk": dict(seed=4814, why="One subject, walking, continuous. Fewer faces is fewer chances "
                 "to fail, and walking gives the motion the static takes lack.",
                 look="Raw unedited phone footage, filmed on an iPhone at 24mm, handheld, "
                      "walking backwards alongside the subject so the background slides past "
                      "continuously, flat overcast daylight, deep depth of field.",
                 place="a long tree-lined pavement beside a park railing, with the park behind "
                       "and traffic passing on the other side",
                 single=True),
    "host": dict(seed=4815, why="One presenter to camera the whole way, the Gruns model. No "
                 "strangers at all, which removes the multi-face risk entirely.",
                 look="Raw unedited phone footage, filmed on an iPhone at 24mm, handheld at "
                      "arm's length, flat overcast daylight, deep depth of field.",
                 place="a quiet residential street corner with parked cars and low brick walls",
                 host=True),
}


def prompt(v):
    place = v["place"]
    head = (f"{v['look']} Hard jump cuts between shots. EVERY SHOT IS FILMED IN THE SAME PLACE: "
            f"{place}. The same background is visible behind every person and the light never "
            f"changes, because this is all one session in one place. ")
    body = COMMON
    if v.get("swap"):
        body = v["swap"] + COMMON
    if v.get("host"):
        return (head + "One woman in her late twenties in a plain jacket holds the can from "
                "@Image1 and talks straight into the camera, holding the phone herself at "
                "arm's length, the whole way through, with hard jump cuts between her lines. "
                "She says, in order: \"Okay, what do you think is in this can?\" then "
                "\"Everyone says beer.\" then \"Everyone is wrong.\" then she cracks it open, "
                "drinks and says \"It's water. That's it.\" "
                + COMMON.replace("An interviewer stands off camera and is never seen except "
                                 "for their two hands and their sleeves. ", "")
                        .split("THE INTERVIEWER USES")[0]
                + "No music, no logo, no text on screen, no subtitles.")
    if v.get("single"):
        return (head + "One man in his forties in a waxed jacket walks along the pavement the "
                "whole way while the interviewer walks backwards in front of him, and there "
                "are hard jump cuts but never a change of person. He says, in order: "
                "\"Beer, surely.\" then \"No? Something that'll kill me then.\" then he takes "
                "the can from @Image1, cracks it, drinks and says \"That's water. That's just "
                "water.\" " + body)
    return head + body + " " + OPEN + ANSWERS


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--only", default=None)
    ap.add_argument("--yes", action="store_true")
    ap.add_argument("--brand", default=None,
                    help="brand slug in brands/ (default liquid-death)")
    ap.add_argument("--fast", action="store_true", help="seedance-2.0/fast, $0.2419/s")
    A = ap.parse_args()

    model = MODEL.replace("seedance-2.0/", "seedance-2.0/fast/") if A.fast else MODEL
    rate = 0.2419 if A.fast else RATE
    want = [A.only] if A.only else list(VARIANTS)
    for k in want:
        if k not in VARIANTS:
            sys.exit(f"no variant {k!r}. Known: {', '.join(VARIANTS)}")

    global CFG
    CFG = brandkit.load(getattr(A, "brand", None))
    ref = brandkit.reference_image(CFG)
    L = paths.layout(A.run)
    out = L["takes"]
    print(f"brand      {CFG['brand']}  ({CFG['_path']})")
    print(f"run folder {L['run']}")
    if not ref.exists():
        print(f"NOTE: the reference product photo is missing: {ref}")
        print("A dry run still prints the prompts and the price; --yes cannot upload it.")
    total = 0.0
    todo = []
    for k in want:
        v = VARIANTS[k]
        dest = out / f"{CFG['slug']}-{k}-seed{v['seed']}.mp4"
        if dest.exists():
            print(f"{k}: {dest.name} exists; the same payload and seed reproduce it. Skipping.")
            continue
        todo.append((k, v, dest))
        total += rate * DURATION

    print(f"\n{model}  {DURATION}s 720p 9:16  ${rate * DURATION:.2f} each")
    for k, v, _ in todo:
        print(f"\n  {k}  seed {v['seed']}")
        print(f"    {v['why']}")
        print(f"    {len(prompt(v).split())} words")
    print(f"\n{len(todo)} generations, TOTAL ${total:.2f}")

    # HARD GATE, added 2026-09-30 with the format/brand split. Every one of these six prompt
    # bodies was written BEFORE the 4804-to-4815 fixes and none of them carries the guards those
    # takes paid for: measured on the day, they fail 12 to 15 of the 15 format clauses each.
    # Sending the sweep would have re-bought every defect already bought once, for $21.84. The
    # sweep explores alternative GRAMMARS (night, hard sun, mic cube, indoor, walk-along, single
    # host), which is worth doing, but each body has to be ported onto format_spec.py first.
    # Until then this script cannot spend.
    lints = {k: format_spec.lint(prompt(v)) for k, v, _ in todo}
    bad = {k: v for k, v in lints.items() if v}
    if bad:
        print("\nPROMPT LINT: these variant bodies predate the format layer")
        for k, probs in bad.items():
            print(f"  {k}: {len(probs)} of {len(format_spec.REQUIRED_CLAUSES)} required clauses "
                  f"missing, or banned vocabulary present")
            for x in probs[:4]:
                print("      - " + x.split(" -- ")[0])
    if not A.yes:
        print("\ndry run. Nothing sent. Add --yes to spend.")
        return
    if bad:
        sys.exit("\nREFUSING TO SPEND. Port these prompt bodies onto format_spec.build_prompt "
                 "(a variant is a change of grammar, not a licence to drop the guards) and run "
                 "the dry run again. See SKILL.md, Critical knowledge.")

    import media_proxy  # noqa: E402  (through the GooseWorks proxy, never a local fal key)
    out.mkdir(parents=True, exist_ok=True)
    url = media_proxy.fal_upload(str(ref))
    for k, v, dest in todo:
        print(f"{k}: submitting", flush=True)
        try:
            vurl = media_proxy.fal_generate_video(model, {
                "prompt": prompt(v), "image_urls": [url], "duration": DURATION,
                "resolution": "720p", "aspect_ratio": "9:16", "generate_audio": True,
                "seed": v["seed"]})
            res, rid = {"video": {"url": vurl}}, None
        except RuntimeError as e:
            print(f"  FAILED: {e}")
            continue
        urllib.request.urlretrieve(res["video"]["url"], dest)
        (out / f"{dest.stem}.json").write_text(json.dumps(
            {"model": model, "seed": v["seed"], "duration": DURATION, "request_id": rid,
             "est_cost": rate * DURATION, "why": v["why"], "prompt": prompt(v)}, indent=1))
        print(f"  {dest.name}  {dest.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
