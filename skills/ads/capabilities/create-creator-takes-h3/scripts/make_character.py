#!/usr/bin/env python3
"""Shared creator still builder. Reuse this for generated people in custom video.

The approved brief supplies identity, wardrobe and room. Defaults: an ordinary phone
capture in a real lived-in room, deep focus with no bokeh, real unretouched skin, made
with openai/gpt-image-2. Studio capture or shallow focus only when the brief explicitly
chooses them. phone_observer is a third-person phone shot (filmed by a friend, not
looking at the lens) for scenes where people eat or act rather than talk to camera.
Distinctive marks require an explicit user choice, never random sampling; no skin
flaws are forced. A generated still remains pending visual review before video
production. --dry-run and --payload-out prepare the same payload without generation.

Action shots: with --action (or --capture phone_observer) the still is an action shot, not a
talking head. The framing is on the action (hands, object and face working on it, off-centre,
not squared to the lens), the eyes stay on the task and the hands are in use; the head is
smaller in frame. --shot talking keeps the talking-head defaults for a person who talks to
the lens while doing something; its --action is written in as what they do while talking.

Realism check: GooseWorks grades every person still saved to a custom video (video_change) against a
real phone video frame: fine (real or slightly AI-looking: keep it), ask (clearly AI-made: a rendered or
airbrushed face, portrait-mode blur, studio light, a plain or showroom set: show the owner with the
re-make price and let them choose) or must_fix (an extra hand, warped anatomy, a distorted face, an
impossible pose: make it again). Keep the default phone capture and deep focus, and make again only the
stills that need it.

Skin condition: when the product treats a visible skin problem, pass it with
--skin-condition (e.g. "visible blackheads on the nose, oily T-zone", "a few small acne
spots"). The person then shows it. Random marks are still never added.

Light: every capture carries one light lock: window or lamp light from one side, normal
exposure, no HDR, matte skin with no added shine, no over-sharpening.

Hands: pass every scene action the person performs with --action. When one uses both
hands (apply, smooth, press, peel, squeeze, hold with both hands), a handheld selfie is
refused and the still is a propped phone (counter) instead, because a selfie with both
hands busy grows a third hand holding the phone. The output says so.

Voice: character.json records `voice_pair`, from the same age, gender and ethnicity plus
--voice-accent and --voice-energy: a matched ElevenLabs voice from a saved voice list
(--voices), or a Voice Design request body (pair_voice.py). Use it for any narration of
this person, so the voice fits the face and is not another brand's narrator. The voice is
chosen here, with the person, never earlier in the script. With no voice list the script
refuses (a silent fallback to a paid Voice Design request was ignored on 15 Oct): pass
--voices, or --voice-design to quote Voice Design on purpose, or --no-voice-pair for a person
who is never voiced separately. To change the voice later: pair_voice.py --character
character.json --voices <list> --exclude <rejected voice_id>. The account's list is small: pass
the shared-library searches too (pair_voice.py --library-searches). Never change the person
(heritage, age or gender) to fit a voice list; when no list fits, design the voice.

Quality: --tier standard (default) makes the still at GPT Image 2 medium, --tier best at high.
--quality high under Standard is an upgrade for this one person and needs a reason
(--upgrade-reason failed_attempt --upgrade-attempt <operation id> --upgrade-why "<one line>", or
customer_asked --upgrade-quote "<their words>"); see tiers.py. character.json and the
--payload-out file record the tier, the quality and any upgrade; `query` is what the paid call
sends (the upgrade's fields and --shot-scene, for a still made for one scene).
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from pair_voice import NEVER_BEND, load_voice_lists, pair_voice  # noqa: E402
from plan_takes import both_hands  # noqa: E402
import tiers  # noqa: E402

# Skin tone follows from ethnicity unless the user overrides it. These are the formula's own
# vocabulary, not invented: it asks for e.g. "deep brown-black / warm medium brown / olive-tan".
SKIN = {
    "black": "deep brown with warm red undertones",
    "black american": "deep brown with warm red undertones",
    "african american": "deep brown with warm red undertones",
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
NO_RETOUCH = "No retouching, no skin smoothing, no beauty filter, no cinematic grade."
# One light lock for every capture: AI stills come back evenly lit, perfectly exposed and
# glossy, and the video model then adds shine and sharpening halos on top (15 Oct runs).
LIGHT_LOCK = ("Window or lamp light from one side, so the far side of the face is a little darker; "
              "normal phone exposure, highlights not blown out, no HDR look. Matte skin with no "
              "added shine, no over-sharpening.")
STUDIO_LIGHT_LOCK = ("Normal exposure, highlights not blown out, no HDR look. Matte skin with no "
                     "added shine, no over-sharpening.")
# Asking for "the softness of a phone video frame" smoothed the skin and failed the realism check (16 Oct).
CAPTURE = {
    "phone": (
        "An ordinary phone recording at eye level, in a real lived-in room that is slightly "
        "cluttered with everyday things, never a plain backdrop or a white void. " + LIGHT_LOCK +
        " Natural white balance and ordinary colour. Real skin with small "
        "natural imperfections at this shot size. " + NO_RETOUCH + " No artificial grain overlay "
        "or exaggerated sharpening."),
    "phone_observer": (
        "A candid phone video frame filmed by a friend from a few steps away at chest height. "
        "The person is busy with what they are doing and does not look at the lens. A real "
        "lived-in room, slightly cluttered with everyday things. " + LIGHT_LOCK + " Ordinary "
        "colour. Real skin with small natural imperfections at this distance. " + NO_RETOUCH),
    "studio": (
        "A real studio portrait with soft motivated light and ordinary colour, chosen because "
        "the approved reference is studio-shot. " + STUDIO_LIGHT_LOCK + " Natural skin detail at "
        "this viewing distance, without beauty retouching, edge halos or a waxy finish. " + NO_RETOUCH),
}
DEEP = ("Everything sharp, DEEP focus, as a phone records: the face and the room behind are "
        "both in focus. No bokeh, no portrait-mode blur, no shallow depth of field.")
FOCUS = {
    "deep": DEEP,
    "natural": DEEP,  # read as deep; kept so older commands still run
    "shallow": "The face is in focus with gentle optical background falloff, matching the approved reference; no pasted portrait-mode edge.",
}
RECORDING = {
    "counter": "The phone is propped up outside the frame and nobody holds it; both hands are free. Complete face and both shoulders remain visible.",
    # A talking head who holds or does something while talking: the hands are on it, not free.
    "counter_talking_action": "The phone is propped up outside the frame and nobody holds it. Complete face and both shoulders remain visible.",
    # An action shot on a propped phone: the hands are working, not free (talking-head text above).
    "counter_action": "The phone is propped up outside the frame and nobody holds it. The hands are in use on the action and in frame; the eyes follow what the hands are doing.",
    "selfie": "One hand supports a phone outside the frame; only the other hand is free. Believable selfie framing without cutting off the face.",
    "observer": "Nobody holds a phone in frame. The person's hands are busy with the action; they look at what they are doing, not at the lens.",
}
# Framing, expression and head size when the brief gives none, by shot. A talking head is
# centred, looks into the lens and has its hands free; an action shot (--action, or
# phone_observer) frames the action, keeps the gaze on the task and the hands in use. A 15 Oct
# run made every B-roll person with the talking defaults and got faces staring at the lens.
DEFAULT_FRAMING = {
    "talking": ("head and upper chest, with clear space above the head and on both sides so the "
                "room reads around them, squared to camera, looking into the lens"),
    "action": ("framed on the action: the hands, the object they are using and the face working "
               "on it all in frame, a three-quarter view from slightly to one side, the person "
               "off-centre and not squared to the lens"),
    "observer": "waist-up three-quarter view from a few steps away, the action and the room in frame",
}
DEFAULT_EXPRESSION = {
    "talking": "relaxed expression, lips at rest, natural gaze toward the lens, no held smile",
    "action": "eyes on the task, absorbed in what the hands are doing, relaxed face, not looking at the lens",
    "observer": "absorbed in what they are doing, relaxed face, not looking at the lens",
}
DEFAULT_FACE_FILL = {"talking": "45 to 55 percent", "action": "25 to 40 percent", "observer": "20 to 35 percent"}
# A condition that is oil or shine itself must not be fought by the negative prompt.
OILY = re.compile(r"\b(oil\w*|greas\w*|shin\w*|sheen)\b", re.I)
# openai/gpt-image-2 sizes by aspect (multiples of 16, as fal asks).
GPT_SIZE = {"9:16": (1088, 1920), "16:9": (1920, 1088), "1:1": (1536, 1536),
            "4:5": (1536, 1920), "3:4": (1440, 1920), "4:3": (1920, 1440)}

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
    # A skin condition the product treats is shown, never hidden: a patch on flawless skin reads
    # as fake. It is the brief's request, not a random mark, so it needs no --marks-approved.
    condition = (getattr(a, "skin_condition", None) or "").strip().rstrip(".")
    if getattr(a, "skin_condition", None) is not None and not condition:
        sys.exit("--skin-condition is empty: name the condition the product treats, e.g. "
                 "'visible blackheads on the nose, oily T-zone'")
    a.skin_condition = condition or None
    # No forced flaws: an invented scar, acne mark or oily shine reads as painted on.
    if condition:
        imperfections = ("The skin shows %s, because the product treats it: real and unretouched, kept visible, "
                         "not painted on and not exaggerated. Otherwise ordinary skin texture and subtle "
                         "facial asymmetry; no other invented scars, moles or marks." % condition)
        if marks:
            imperfections += " " + "; ".join(marks) + "."
    else:
        imperfections = "; ".join(marks) if marks else "Ordinary skin texture and subtle facial asymmetry; no invented scars, acne marks, moles, greasy shine or distinctive marks."

    # Check the RAW arguments, before any decoration. An earlier version appended the full stop
    # first, so `--hair "  "` became "." and passed the not-empty test: a blank slot got through
    # the guard whose whole job was to stop blank slots.
    # The shot: an action shot when the person acts (--action) or is filmed by a friend
    # (phone_observer); --shot talking keeps the talking head for someone who talks while acting.
    shot = getattr(a, "shot", "auto") or "auto"
    if shot == "talking" and a.capture == "phone_observer":
        sys.exit("--shot talking goes with --capture phone or studio; phone_observer never looks at the lens")
    if shot == "auto":
        shot = "action" if (a.capture == "phone_observer" or getattr(a, "action", None)) else "talking"
    a.shot = shot
    kind = "observer" if a.capture == "phone_observer" else shot
    if a.framing is None:
        a.framing = DEFAULT_FRAMING[kind]
    if a.expression is None:
        a.expression = DEFAULT_EXPRESSION[kind]
    if getattr(a, "face_fill", None) is None:
        a.face_fill = DEFAULT_FACE_FILL[kind]
    if a.capture == "phone_observer":
        a.recording = "observer"
    elif a.recording == "observer":
        sys.exit("--recording observer goes with --capture phone_observer")
    # Both hands busy and a handheld selfie: the model adds a third hand holding the phone.
    a.capture_decision = {"requested": a.recording, "used": a.recording, "reason": None}
    hands = both_hands(getattr(a, "action", None) or [])
    if hands and a.recording == "selfie":
        a.capture_decision = {"requested": "selfie", "used": "counter",
                              "reason": "%s: both hands are busy, so nobody can hold the phone (a handheld selfie "
                                        "adds a third hand). Using a propped phone (counter); use --capture "
                                        "phone_observer for a friend filming instead." % hands}
        a.recording = "counter"
    raw = {"hair": a.hair, "wardrobe": a.wardrobe, "scene": a.scene, "framing": a.framing,
           "expression": a.expression, "face_fill": a.face_fill, "gender": a.gender,
           "ethnicity": a.ethnicity}
    empty = sorted(k for k, v in raw.items() if not (v or "").strip())
    if empty:
        sys.exit("these are empty: %s. A blank slot is how the composite face gets in."
                 % ", ".join(empty))
    if not 16 <= a.age <= 90:
        sys.exit("--age %d is outside 16-90; state a real age." % a.age)

    # An action shot names what the hands are doing, so the still is caught mid-action.
    acts = [t.strip().rstrip(".") for t in (getattr(a, "action", None) or []) if t and t.strip()]
    # A talking head keeps its lens gaze and does the action while talking (it used to drop --action).
    action_text = ((" The action: %s." if shot == "action" else " While talking to the lens: %s.") % "; ".join(acts)
                   if acts else "")
    spec = json.loads((HERE / "character-prompt.json").read_text(encoding="utf-8"))
    slots = {
        "identity": ident,
        "skin_tone": skin,
        "hair": a.hair.strip().rstrip(".") + ".",
        "wardrobe": a.wardrobe.strip().rstrip(".") + ".",
        "framing": a.framing.strip().rstrip(".") + "." + action_text,
        "scene": a.scene.strip().rstrip(".") + ".",
        "expression": a.expression.strip().rstrip(".") + ".",
        "imperfections": imperfections,
        "face_fill": a.face_fill,
        "capture": CAPTURE[a.capture],
        "focus": FOCUS[getattr(a, "focus", "deep")],
        "recording": RECORDING[("counter_action" if shot == "action" else "counter_talking_action" if acts else "counter")
                               if a.recording == "counter" else a.recording],
    }
    blank = [k for k, v in slots.items() if not str(v).strip()]
    if blank:
        sys.exit("these slots are empty: %s. A blank slot is how the composite face gets in."
                 % ", ".join(blank))
    if condition:
        slots["capture"] = slots["capture"].replace("Matte skin with no added shine",
                                                    "Matte skin with no added shine beyond the stated skin condition")
    prompt = spec["prompt"].format(**slots)
    negative = spec["negative_prompt"]
    if condition and OILY.search(condition):
        negative = negative.replace("greasy shine, ", "")
    return prompt, negative, ident, slots


NO_VOICE_LIST = """make_character.py needs a voice list, so the voice is paired with this person (age, gender
and ethnicity) now, not picked later from a name. Pass one of:
  --voices voices.json   a saved voice list, repeatable. Through the GooseWorks MCP: data_call_provider
                         {provider: "elevenlabs", path: "/v1/voices", project_id} (the account's few voices)
                         AND each shared-library search pair_voice.py --library-searches --gender ...
                         --ethnicity ... prints (path "/v1/shared-voices" with its query); save each whole
                         reply and pass them all. Library voices speak without being added.
                         video_formats show:"voices" is a short curated list that names no heritage; it
                         fits few people.
  --voice-design         no list: record a paid Voice Design request to quote (data_post_provider
                         /v1/text-to-voice/design, then /v1/text-to-voice to save the chosen preview)
  --no-voice-pair        this person is never voiced separately (B-roll with no lines, or H3 native speech)"""


def voice_refusal(a):
    """Stop before anything is written when the voice would be paired from nothing."""
    if a.no_voice_pair and (a.voices or a.voice_design):
        sys.exit("--no-voice-pair records no voice; leave out --voices and --voice-design")
    if a.voices and a.voice_design:
        sys.exit("--voices and --voice-design: pick one (a matched voice from the list, or a Voice Design request)")
    if not (a.voices or a.voice_design or a.no_voice_pair):
        sys.exit(NO_VOICE_LIST)


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
    ap.add_argument("--framing", default=None, help="default by capture: upper chest to camera, "
                                                   "or waist-up three-quarter for phone_observer")
    ap.add_argument("--expression", default=None, help="default by capture (phone_observer never looks at the lens)")
    ap.add_argument("--face-fill", default=None, help="head size in frame; default 45-55%% talking, "
                    "25-40%% action, 20-35%% phone_observer")
    ap.add_argument("--shot", default="auto", choices=["auto", "talking", "action"],
                    help="auto (default): action when --action is given or --capture phone_observer, else "
                         "talking. talking keeps the lens gaze for someone who talks while acting (--action is what they do while talking)")
    ap.add_argument("--skin-condition", default=None,
                    help="a visible skin problem the product treats, shown on the person, e.g. 'visible "
                         "blackheads on the nose, oily T-zone' or 'a few small acne spots'")
    ap.add_argument("--capture", default="phone", choices=["phone", "phone_observer", "studio"],
                    help="phone (default); phone_observer for people eating or acting, filmed by a "
                         "friend and not looking at the lens; studio only when the reference is studio-shot")
    ap.add_argument("--recording", default="counter", choices=["counter", "observer", "selfie"])
    ap.add_argument("--focus", default="deep", choices=sorted(FOCUS),
                    help="deep (default, no bokeh); shallow only when the approved reference is shot that way")
    ap.add_argument("--action", action="append", help="a scene action this person performs (repeatable); a "
                    "both-hands action refuses --recording selfie")
    ap.add_argument("--voice-accent", help="how they sound, e.g. american or british (for voice_pair)")
    ap.add_argument("--voice-energy", help="e.g. upbeat, calm, warm (for voice_pair)")
    ap.add_argument("--voices", action="append", default=[],
                    help="a saved voice list to match voice_pair from (repeatable): the GooseWorks MCP's data_call_provider "
                         "reply for GET /v1/voices or GET /v1/shared-voices (pair_voice.py --library-searches gives this "
                         "person's searches), or an ElevenLabs GET /v1/voices, /v2/voices or /v1/shared-voices reply")
    ap.add_argument("--voice-exclude", action="append", default=[], help="a voice_id not to reuse, e.g. another brand's narrator")
    ap.add_argument("--voice-sample-text", help="100-1000 characters for Voice Design previews")
    ap.add_argument("--marks", action="append", help="specific distinctive mark chosen by the user")
    ap.add_argument("--marks-approved", action="store_true", help="the user explicitly chose the supplied marks")
    # openai/gpt-image-2 by default: real people and real products use GPT Image 2 (Nano Banana is
    # for cartoons only). A Nano Banana model still takes --resolution and --seed.
    ap.add_argument("--model", default="openai/gpt-image-2")
    ap.add_argument("--resolution", default="4K", choices=["1K", "2K", "4K"], help="Nano Banana models only")
    ap.add_argument("--quality", choices=tiers.RANK["image_quality"],
                    help="GPT Image 2 only; default: the tier's (medium Standard, high Best). Above it is an upgrade")
    ap.add_argument("--aspect", default="9:16")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--out", required=True, type=pathlib.Path)
    ap.add_argument("--dry-run", action="store_true", help="print the prompt, generate nothing")
    ap.add_argument("--payload-out", type=pathlib.Path, default=None,
                    help='write {"model", "body"}, the exact request gen_image.py will send, so it '
                         "can be priced with data_price_provider before the paid call; works with --dry-run")
    ap.add_argument("--voice-design", action="store_true",
                    help="no voice list: record a paid ElevenLabs Voice Design request to quote (data_post_provider "
                         "/v1/text-to-voice/design, then /v1/text-to-voice to save the chosen preview)")
    ap.add_argument("--no-voice-pair", action="store_true",
                    help="this person is never voiced separately (B-roll with no lines, or H3 native speech); records no voice_pair")
    tiers.add_args(ap)
    a = ap.parse_args()
    voice_refusal(a)
    gpt = a.model.startswith("openai/gpt-image-2")
    if a.quality and not gpt:
        sys.exit("--quality is for openai/gpt-image-2; a Nano Banana model takes --resolution")
    quality = (a.quality or tiers.default(a, "image_quality")) if gpt else None
    upgrade = tiers.upgrade(a, "image_quality", quality) if gpt else None

    prompt, negative, ident, slots = build(a)
    out = a.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    (out / "character-prompt.txt").write_text(prompt, encoding="utf-8")

    print("identity : %s" % ident)
    print("skin     : %s" % slots["skin_tone"])
    print("shot     : %s (%s)" % (a.shot, "framed on the action, gaze on the task, hands in use"
                                    if a.shot == "action" else "talking head, looking into the lens"))
    print("marks    : %s" % slots["imperfections"][:96] + "...")
    print("prompt   : %d chars -> %s" % (len(prompt), out / "character-prompt.txt"))
    if a.capture_decision["reason"]:
        print("recording: refused selfie, " + a.capture_decision["reason"])
    voice = None if a.no_voice_pair else pair_voice(
        a.age, a.gender, a.voice_accent, a.voice_energy, load_voice_lists(a.voices) if a.voices else None,
        tuple(a.voice_exclude), a.voice_sample_text, a.ethnicity, list(a.voices))
    if voice is None:
        print("voice    : none (--no-voice-pair: never voiced separately)")
    elif voice["source"] == "library":
        print("voice    : library voice %s (%s), matched on %s; play it next to the still"
              % (voice["voice_id"], voice.get("name"), ", ".join(voice["matched_on"])))
    else:
        step = ("Search the library first: voice_pair.library_search" if voice.get("library_search") else
                "Fetch the next library pages first: voice_pair.library_next_page" if voice.get("library_next_page") else
                "The library was searched: quote the Voice Design request")
        print("voice    : %s Voice Design request (paid; quote it first)%s. %s. %s"
              % ("NO VOICE IN THE LISTS FITS this person." if a.voices else "",
                 "; nearest: " + ", ".join(str(v.get("name") or v["voice_id"]) for v in voice["nearest"]) if voice.get("nearest") else "",
                 step, NEVER_BEND))
    # Save the same identity metadata for free planning and actual generation.
    record = {
        "image": "character.png",
        "identity": ident + ", " + slots["hair"].rstrip(".") + ", " + slots["wardrobe"].rstrip("."),
        "environment": slots["scene"].rstrip("."),
        "capture": a.capture, "recording": a.recording, "focus": a.focus, "shot": a.shot,
        "capture_decision": a.capture_decision, "actions": a.action or [],
        "distinctive_marks": a.marks or [], "approval": "pending",
        "quality_tier": a.tier,
    }
    if quality:
        record["quality"] = quality
    if upgrade:
        record["upgrade"] = upgrade
    if voice is not None:
        record["voice_pair"] = voice
    if a.skin_condition:
        record["skin_condition"] = a.skin_condition
    (out / "character.json").write_text(json.dumps(record, indent=1), encoding="utf-8")

    # Built once, before the dry-run return, so the quoted body and the paid body are one object.
    if a.model.startswith("openai/gpt-image-2"):
        if a.aspect not in GPT_SIZE:
            sys.exit("--aspect %s has no GPT Image 2 size; use one of %s" % (a.aspect, ", ".join(GPT_SIZE)))
        if a.seed is not None:
            sys.exit("openai/gpt-image-2 takes no seed; leave --seed out")
        w, h = GPT_SIZE[a.aspect]
        payload = {"prompt": prompt + "\n\nAvoid: " + negative, "image_size": {"width": w, "height": h},
                   "quality": quality}
    else:
        payload = {"prompt": prompt, "negative_prompt": negative, "aspect_ratio": a.aspect,
                   "resolution": a.resolution}
        if a.seed is not None:
            payload["seed"] = a.seed
    if a.payload_out:
        a.payload_out.parent.mkdir(parents=True, exist_ok=True)
        quote = {"model": a.model, "body": payload, "quality_tier": a.tier}
        if upgrade:
            quote["upgrade"] = upgrade
        if tiers.call_query(a, upgrade):
            quote["query"] = tiers.call_query(a, upgrade)
        a.payload_out.write_text(json.dumps(quote, indent=1),
                                 encoding="utf-8")
        print("payload  : %s (price it with data_price_provider before the paid call: the body, plus its query "
              "fields as top-level request fields)" % a.payload_out)
    if a.dry_run:
        print("\n(dry run, nothing generated)")
        return

    png = out / "character.png"
    r = subprocess.run([sys.executable, str(HERE.parent.parent / "create-image-fal" / "scripts"
                                            / "gen_image.py"),
                        "--model", a.model, "--payload", json.dumps(payload),
                        "--query", json.dumps(tiers.call_query(a, upgrade)),
                        "--out", str(png)])
    if r.returncode or not png.exists():
        sys.exit("image generation failed; nothing written")

    # character.json is what plan_takes.py consumes, so write it here and the operator never
    # retypes identity. A person described twice drifts between takes.
    (out / "character.json").write_text(json.dumps(record, indent=1), encoding="utf-8")
    print("\nwrote %s and character.json" % png)
    print("LOOK AT IT before spending on takes. A still costs cents; a take costs dollars.")


if __name__ == "__main__":
    main()
