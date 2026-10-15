#!/usr/bin/env python3
"""Plan the creator's talking takes and write their prompts. Free, no network.

    plan_takes.py --beats cutlist.json --character character.json --out work/takes \
        [--mannerism mannerism.mp4] [--aspect 9:16] [--resolution 1080P]

--beats is any file with `beats: [{id, start, end, vo}]` (the footage-cutlist cut list
works as-is). --character is:

    {"image": "character.png",                     # the approved still, local path
     "identity": "<age, gender, look the user chose>", # who they are, VERBATIM into every take
     "environment": "<the room in the approved still>", # the room, VERBATIM into every take
     "delivery": "<the tone the user chose>"}           # optional: how they speak

The person, the room and the tone are the USER'S choices (the recipe's `choices`); this
script has no default person or room. Without `delivery` a neutral conversational read is
used and a note is printed.

Writes <out>/takes.json (run_takes.py's spec) and <out>/<id>-prompt.txt per take.

TAKES SPLIT ON LINE BOUNDARIES, never inside a line. H3 caps a take at 15s, so a 30s
script is two or three takes. A join between two lines can be hidden with a 0.10s
dissolve (join_takes.py); a join mid-sentence cannot.

EACH TAKE RUNS 0.6s PAST ITS LAST WORD, rounded up to whole seconds (H3 takes whole
seconds, 5-15). A take planned to exactly its words clipped the last word of a reel.

THE PROMPT is the one that held identity and eyeline across the reference builds. The
person and the room come from character.json word for word, so every take describes the
same person the same way; nothing about a person is written here. Square brackets in a
line are refused: H3 speaks them aloud.

ASPECT: 9:16 when the creator ever fills the frame, otherwise the closest H3 ratio to the
creator's zone. Cropping a 16:9 take to 9:16 is a 2.5x upscale.
"""
import argparse
import hashlib
import json
import math
import pathlib
import re
import sys

MAX_TAKE = 15
MIN_TAKE = 5
MAX_SPEECH = 14.2
TAIL = 0.6
RATIOS = {"21:9": 21 / 9, "16:9": 16 / 9, "4:3": 4 / 3, "1:1": 1.0, "3:4": 3 / 4, "9:16": 9 / 16}

# Used only when character.json has no `delivery` (the tone is the user's choice). Neutral on
# purpose: it carries the craft (unscripted, natural rhythm), not a tone or a persona.
DEFAULT_DELIVERY = "natural and conversational, speaking directly to one viewer. Not presenting, not announcing, not reading. Connected sentences at a brisk comfortable pace, with short meaningful pauses. Clear complete word endings, modest pitch variation and restrained expression; do not rush or shout."

CAPTURE = {"phone_counter":"An ordinary phone recording from a phone supported outside the frame at eye level. Static chest-up shot, complete face and both shoulders visible with headroom. Both hands are free; gestures are small and serve the words. No automatic zoom or reframing.","phone_selfie":"An ordinary handheld phone selfie at eye level. One hand supports the phone outside the frame; only the other hand is free. Small movement follows the supporting arm, without artificial drift or automatic zoom. Keep the complete face visible.","studio":"An approved studio recording at eye level, matching the reference composition and motivated lighting. Static medium framing with the complete face visible. Natural posture and restrained gestures; no automatic zoom or reframing."}

TEMPLATE = "A single continuous live-action shot of <Subject 1>, matching the approved creator reference.\n\n[Shot 1] {capture}\nThe person looks toward the lens while addressing one viewer, with natural blinks and a relaxed face. Do not force a fixed grin or busy repeated gestures. Keep the same identity, wardrobe, setting, lighting and props throughout the take.\n\nTHE SUBJECT AND SET FROM <Picture 1>: {identity}\n{environment}\nSkin detail matches the reference at this viewing distance: no waxy finish, beauty filter or sharpening halos. Background focus follows the approved reference; do not invent portrait-mode blur or demand universal deep focus.\n{mannerism}\nDELIVERY: {delivery}\nDelivery and action directions are outside the dialogue block. Only the approved words inside it are spoken, once and in order. No added hook, filler or invented sentence. A wanted hesitation such as 'uh' is part of the approved spoken words, not an automatic effect.\n\n<Subject 1> (S1) says, <d>[English] {dialogue}</d>\n\noverall_soundscape: The creator's voice and quiet natural room tone. No second voice or additional speech.\nnon_diegetic_music: N/A\n"

MANNERISM = """
<Video 1> is a filmed reference person recorded the same way. Take from it ONLY the rhythm of natural speech, where the pauses fall and where the pace speeds up, and the small involuntary movement while talking: the head settling, the blink rate, the eyebrow lifts, the hands coming up and dropping back. Do NOT take the face, hair, clothes, room, lighting, framing or eyeline. The person is <Subject 1> from <Picture 1> and nobody else.
"""


def split(beats, at=None):
    """Greedy under MAX_SPEECH, or exactly at the line boundaries nearest `at` (reel times):
    the screen-insert format joins its takes where an insert ENDS, so the creator-to-creator
    cut is hidden under the screen and needs no dissolve."""
    if at:
        cuts = sorted({min(range(1, len(beats)), key=lambda i: abs(beats[i]["start"] - t)) for t in at})
        groups, prev = [], 0
        for c in cuts + [len(beats)]:
            groups.append(beats[prev:c])
            prev = c
        for g in groups:
            if g and g[-1]["end"] - g[0]["start"] > MAX_TAKE - TAIL:
                raise SystemExit("a take from %.2f to %.2f is over H3's %ds cap; add a split"
                                 % (g[0]["start"], g[-1]["end"], MAX_TAKE))
        return [g for g in groups if g]
    takes, cur = [], []
    for b in beats:
        if cur and b["end"] - cur[0]["start"] > MAX_SPEECH:
            takes.append(cur)
            cur = []
        cur.append(b)
    if cur:
        takes.append(cur)
    for t in takes:
        if t[-1]["end"] - t[0]["start"] > MAX_SPEECH:
            raise SystemExit("line %s alone runs %.1fs, over one take; split or shorten it"
                             % (t[0]["id"], t[-1]["end"] - t[0]["start"]))
    return takes


def seed(slug, tid):
    return 300000 + int(hashlib.sha256(("%s-%s" % (slug, tid)).encode()).hexdigest(), 16) % 600000


def pick_aspect(spec):
    W, H = spec.get("size", [1080, 1920])
    if any(b.get("state") == "creator" for b in spec["beats"]) or not spec.get("seam"):
        return "9:16"
    seam = spec["seam"]
    zh = (H - seam) if spec.get("creator_side", "bottom") == "bottom" else seam
    ar = W / float(zh)
    return min(RATIOS, key=lambda k: abs(math.log(RATIOS[k] / ar)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--beats", required=True)
    ap.add_argument("--character", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--mannerism", help="optional muted motion-reference clip (2-15s, rights cleared)")
    ap.add_argument("--aspect", choices=sorted(RATIOS))
    ap.add_argument("--resolution", default="1080P", choices=["480P", "768P", "1080P"])
    ap.add_argument("--slug", default="creator")
    ap.add_argument("--split-at", help="comma-separated reel times to join takes at (e.g. where screen "
                                       "inserts end); default: greedy under 15s")
    ap.add_argument("--plan-only", action="store_true", help="free planning with a not-yet-generated character image; never authorizes generation")
    a = ap.parse_args()

    spec = json.loads(pathlib.Path(a.beats).read_text(encoding="utf-8"))
    beats = [b for b in spec["beats"] if (b.get("vo") or "").strip()]
    # a take must include every line spoken over a product beat too (the voice runs under
    # screen inserts), so the creator track covers the whole reel
    if not beats:
        raise SystemExit("no beat has a `vo` line")
    chp = pathlib.Path(a.character)
    ch = json.loads(chp.read_text(encoding="utf-8"))
    img = pathlib.Path(ch["image"])
    img = img if img.is_absolute() else (chp.parent / img)
    if not img.exists() and not a.plan_only:
        raise SystemExit("character image not found: %s" % img)
    ident = (ch.get("identity") or "").strip()
    if not ident:
        raise SystemExit("character.json needs `identity`: the person, in the words that made the image")
    # Non-empty is not enough. The realism prompt needs age, ethnicity and sex stated
    # explicitly or the model drifts to an ambiguous composite face, which is what a reviewer
    # sees as "obviously AI". An unfilled placeholder and a vague "a creator" both pass a
    # not-empty test, so check for the things that mean nobody was asked.
    low = ident.lower()
    if "..." in ident or low.startswith("<") or "ask the user" in low or "user chose" in low:
        raise SystemExit(
            "character.json `identity` is still the placeholder (%r). Ask the user for age, "
            "gender and look, then write their answer here. There is no default person."
            % ident[:60])
    if not re.search(r"\b(\d{2}s?|teen|twenties|thirties|forties|fifties|sixties|year[- ]old)\b", low):
        raise SystemExit(
            "character.json `identity` states no AGE (%r). Ask the user, or generate the still "
            "with make_character.py, which requires it." % ident[:60])
    if not re.search(r"\b(man|woman|male|female|non[- ]binary|guy|girl|boy|lady)\b", low):
        raise SystemExit(
            "character.json `identity` states no GENDER (%r). Ask the user." % ident[:60])
    if ch.get("capture") not in ("phone", "studio"):
        raise SystemExit("character.json needs explicit phone or studio capture from the shared builder")
    if not (ch.get("delivery") or "").strip():
        print("[plan] note: character.json has no `delivery`; using a neutral conversational read. "
              "Set it from the tone the user chose.", file=sys.stderr)
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)

    plan = []
    at = [float(v) for v in a.split_at.split(",")] if a.split_at else None
    for n, group in enumerate(split(beats, at), 1):
        tid = "t%d" % n
        start, end = group[0]["start"], group[-1]["end"]
        dialogue = " ".join(re.sub(r"\s+", " ", b["vo"]).strip() for b in group)
        if re.search(r"[<>]|\[[^\]]*\]", dialogue):
            raise SystemExit("take %s has square brackets in its lines, which H3 speaks aloud" % tid)
        prompt = TEMPLATE.format(identity=ch["identity"].strip(),
                                 environment=(ch.get("environment") or "").strip(),
                                 mannerism=MANNERISM if a.mannerism else "",
                                 capture=CAPTURE["studio" if ch.get("capture") == "studio" else "phone_selfie" if ch.get("recording") == "selfie" else "phone_counter"],
                                 delivery=(ch.get("delivery") or DEFAULT_DELIVERY).strip(),
                                 dialogue=dialogue)
        (out / ("%s-prompt.txt" % tid)).write_text(prompt, encoding="utf-8")
        plan.append({"id": tid, "seed": seed(a.slug, tid),
                     "dur": max(MIN_TAKE, min(MAX_TAKE, math.ceil(end - start + TAIL))),
                     "covers": [round(start, 2), round(end, 2)],
                     "words": str((out / (tid + ".words.json")).resolve()),
                     "script_sha256": hashlib.sha256(json.dumps([{ "scene_id": str(b["id"]), "text": re.sub(r"\s+", " ", b["vo"]).strip(), "spoken": re.sub(r"\s+", " ", b["vo"]).strip()} for b in group], ensure_ascii=False, separators=(",", ":")).encode()).hexdigest(),
                     "product_action_required": any(feature in spec.get("required_features", []) for feature in ("product_action", "physical_action", "precise_product_action", "stateful_demo", "application", "dispensing")),
                     "beats": [b["id"] for b in group]})

    takes = {"model": "minimax/h3-max/reference-to-video", "char": str(img.resolve()),
             "mann": str(pathlib.Path(a.mannerism).resolve()) if a.mannerism else None,
             "slug": a.slug, "out": str(out.resolve()), "resolution": a.resolution,
             "planning_only": a.plan_only, "capture": ch.get("capture"),
             "generation_stage": "first_take", "content_review_required": True, "required_features": spec.get("required_features", []),
             "aspect_ratio": a.aspect or pick_aspect(spec), "takes": plan}
    (out / "takes.json").write_text(json.dumps(takes, indent=2), encoding="utf-8")
    for t in plan:
        print("  %s seed %d  %2ds  covers %.2f-%.2f  (%s)" % (t["id"], t["seed"], t["dur"], t["covers"][0],
                                                          t["covers"][1], ",".join(t["beats"])))
    print("[plan] %s  %s %s, %d takes, %ds generated" % (out / "takes.json", takes["aspect_ratio"],
                                                      a.resolution, len(plan), sum(t["dur"] for t in plan)))


if __name__ == "__main__":
    main()
