#!/usr/bin/env python3
"""ONE generation for the whole video. The prompt comes from the FORMAT, the creative from a BRAND.

    python single_gen.py                                 # dry run, default brand
    python single_gen.py --brand demo-tallgrass          # dry run, another brand
    python single_gen.py --brand liquid-death --yes      # 12s at 720p, ~$3.64 (0.3034/s)

Every fault the user has reported traces to assembling separate generations: different locations
per stranger, a room-tone jump at every cut, b-roll shot somewhere else, seasons and light that
disagree, and a dubbed TTS interviewer that never shares the scene's acoustic space. A single
generation cannot have any of them. One location, one light, one room tone, and the interviewer's
question generated INSIDE the clip as a second speaker, so it is recorded by the same virtual mic
as the answers.

The product is passed as a reference image: the likeness gate refuses real PEOPLE, not products,
and a referenced product keeps its real label.

WHAT CHANGED 2026-09-30. This script used to carry one brand's whole creative inline: four lines
of dialogue, four described people, a named can, a named street corner. Changing brand meant
editing Python. It is now two layers and neither one holds the other's job:

    format_spec.py       the prompt scaffold and the shot grammar. Format knowledge, paid for by
                         rejected takes, and linted by check-cut.py against the same dict.
    brands/<slug>.json   product, reference image, location, question, cast, dialogue, seed.

`selftest.py` asserts that `brands/liquid-death.json` through this scaffold reproduces the
approved seed-4815 prompt BYTE FOR BYTE, so the split provably did not reword anything that was
paid for.
"""
import argparse
import json
import sys
import urllib.request
from pathlib import Path

import brandkit
import format_spec
import paths

HERE = paths.HERE
ROOT = paths.ROOT
# media_proxy is imported LAZILY, inside the --yes branch only. It used to be a module-level
# import, which meant the *dry run* could not even start outside the run folder: the point of a
# dry run is that it needs no key and no network.


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--brand", default=None,
                    help="brand slug in brands/, or a path to a .json (default liquid-death, or "
                         "$STREET_INTERVIEW_BRAND)")
    ap.add_argument("--seed", type=int, default=None, help="override the config's seed")
    # The pace grammar, restored from seed 4809. OFF by default so the approved seed-4815 payload
    # is reproduced byte for byte and selftest.py's stored sha256 still holds. See
    # format_spec.PACE_BLOCK for what it is and what measured it.
    ap.add_argument("--pace", action="store_true",
                    help="add the seed-4809 CUTTING AND PACE block and the microphone scale "
                         "guard, and swap the position pin for the version that permits a "
                         "within-person reframe. Adds 5 clauses to the lint.")
    # The object/framing guards, paid for by the seed-4816 render: the label facing the camera
    # and the wider framing. Additive for the same reason --pace is: the approved seed-4815
    # payload has to keep reproducing byte for byte. See format_spec.GUARD_CLAUSES.
    ap.add_argument("--guards", action="store_true",
                    help="add the label-facing clause and swap the framing sentence for the "
                         "wider version. Adds 2 clauses to the lint. Paid for by seed 4816, "
                         "which turned the can label-away in two of eight shots and framed "
                         "chest-up.")
    # The three EPISODE grammars, paid for by watching episode 1 end to end. Additive for the
    # same reason the two above are. See format_spec's "the EPISODE grammars" block.
    ap.add_argument("--mic", action="store_true",
                    help="pin the microphone to the Chris Klemens reference (plain black stick "
                         "mic, small round mesh head, no foam, no flag, no logo) and state that "
                         "it is the SAME object in every shot. Adds 4 clauses. Paid for by "
                         "episode 1, whose three takes produced three different microphones.")
    ap.add_argument("--plain", action="store_true",
                    help="ban text and logos on every person and everything they carry, and "
                         "restrict the cast to clear adults. Adds 3 clauses. Paid for by episode "
                         "1's garbled slogan hoodie, branded cap, printed bag and lettered "
                         "backpack, and by a teenager holding a beer-branded can.")
    ap.add_argument("--answers-only", action="store_true",
                    help="no interviewer question and no interviewer line anywhere in the clip. "
                         "Adds 2 clauses. For every take of an episode after the opening: "
                         "episode 1 asked the question three times and the joins read as three "
                         "videos. Shot 1 must be `handover_cold`.")
    ap.add_argument("--can", action="store_true",
                    help="the can is CLOSED, SEALED and UNOPENED with an intact ring pull in "
                         "every shot, and it is always its real-world size against the hand "
                         "holding it. Adds 3 clauses. REPLACES the 'already open' wording that "
                         "seed 4806's unrenderable ring pull left behind, and the only size "
                         "words in the prompt, which said nothing about how big the can is.")
    ap.add_argument("--one-mic", action="store_true",
                    help="the ONLY microphone in frame is the interviewer's: nobody being "
                         "interviewed holds, wears or carries one, and nothing is clipped to a "
                         "collar or lapel. Also brings back a natural GLANCE down at the label "
                         "and back up, as its own beat, with the can still upright. Adds 3 "
                         "clauses and 1 per-shot needle. Paid for by episode 2, where a subject "
                         "held a second handheld mic at 7.5s, and by episode 3, where removing "
                         "the handling made people hold the can at arm's length.")
    ap.add_argument("--upright", action="store_true",
                    help="the product is held UPRIGHT, label to the lens, lid never shown, and "
                         "nobody examines it. REPLACES the position sentence and supersedes the "
                         "guards' label-facing clause, and DELETES 'takes it and looks at it' "
                         "from every handover. Adds 3 clauses plus 2 per-shot needles. Paid for "
                         "by seed 4827, where the can was upright and correctly sized until "
                         "people started examining it, then horizontal, lid-to-lens and short.")
    ap.add_argument("--can-size", action="store_true",
                    help="the real-world size half of the can grammar, on its own.")
    ap.add_argument("--can-sealed", action="store_true",
                    help="the sealed half of the can grammar, on its own. Two takes have "
                         "rendered an open can under it; prefer --upright, which keeps the lid "
                         "out of shot instead of arguing with the model.")
    ap.add_argument("--mic-ref", action="store_true",
                    help="the microphone is carried by the SCENE REFERENCE, not described. "
                         "REPLACES the mic description paragraph and MIC_SCALE with one "
                         "sentence pointing at @Image2, and REQUIRES --scene-ref. Adds 2 "
                         "clauses and frees ~150 words. Paid for by three rounds of describing "
                         "this object in words, which produced three wrong microphones and then "
                         "a legible RODE brand mark on seed 4824. Cannot be combined with --mic.")
    ap.add_argument("--scene-ref", default=None,
                    help="a still from the episode's FIRST take, passed as a SECOND reference "
                         "image so this take inherits that take's microphone, street and light. "
                         "Paid for by episodes 1 and 2: a byte-identical mic clause across three "
                         "calls produced three different mics, and one call rendered a different "
                         "continent. A prompt cannot bind an object between calls; a reference "
                         "image can, which is why the can has never drifted.")
    ap.add_argument("--yes", action="store_true", help="SPENDS real money")
    A = ap.parse_args()

    cfg = brandkit.load(A.brand)
    gen = cfg["generation"]
    seed = A.seed or gen["seed"]
    dur = gen["duration"]
    fast = bool(gen.get("fast"))
    model = format_spec.MODEL_FAST if fast else format_spec.MODEL
    rate = format_spec.RATE_FAST if fast else format_spec.RATE
    if dur > format_spec.GEN_CAP_S:
        sys.exit(f"{dur}s is over the {format_spec.GEN_CAP_S:.0f}s single-call cap. The idea has "
                 f"to fit inside one generation or it is a stitch, and stitching is the "
                 f"documented root cause of five rejections.")

    pace = bool(A.pace or gen.get('pace_grammar'))
    guards = bool(A.guards or gen.get('guard_grammar'))
    mic = bool(A.mic or gen.get('mic_grammar'))
    plain = bool(A.plain or gen.get('plain_grammar'))
    answers_only = bool(A.answers_only or gen.get('answers_only'))
    can = bool(A.can or gen.get('can_grammar'))
    mic_ref = bool(A.mic_ref or gen.get('mic_ref_grammar'))
    # `can` is the pre-split flag and means both halves; the two halves can also be asked for
    # separately, which is how episode 3 buys the SIZE rule without re-buying the sealed one.
    can_size = bool(A.can_size or gen.get('can_size_grammar') or can)
    can_sealed = bool(A.can_sealed or gen.get('can_sealed_grammar') or can)
    upright = bool(A.upright or gen.get('upright_grammar'))
    one_mic = bool(A.one_mic or gen.get('one_mic_grammar'))
    mode = cfg.get("mode", "product-guess")
    G = dict(pace=pace, guards=guards, mic=mic, plain=plain, answers_only=answers_only,
             can_size=can_size, can_sealed=can_sealed, upright=upright,
             mic_ref=mic_ref, one_mic=one_mic)
    # mic_ref points the prompt at @Image2 and says nothing else about the microphone, so a
    # run without a scene reference would ask the model to copy an image that was never sent.
    # Refused here rather than at the gate: this is a $3.64 call and the check is free.
    if mic_ref and not A.scene_ref:
        sys.exit("--mic-ref says the microphone is 'exactly the microphone in @Image2' and "
                 "nothing else about it, so without --scene-ref there is no @Image2 and the "
                 "one object this format keeps getting wrong would be unconstrained. Pass a "
                 "face-cropped still from a take whose mic is right.")
    prompt = format_spec.build_prompt(cfg, **G)
    ref = brandkit.reference_image(cfg)
    stem = brandkit.take_name(cfg, seed)
    L = paths.layout(A.run)

    if mode == "conversation":
        print(f"CONVERSATION PROMPT PREVIEW  seed {seed}  {dur}s; no media endpoint or price verified")
    else:
        print(f"{model}  seed {seed}  {dur}s {format_spec.RESOLUTION} {format_spec.ASPECT}  "
              f"~${rate * dur:.2f}")
    print(f"brand       {cfg['brand']}  ({cfg['_path']})")
    print(f"{len(prompt.split())} words, {len(cfg['shots'])} shots, ONE location, interviewer "
          f"voice generated in-clip")
    print(f"run folder  {L['run']}")
    print(f"would write {L['takes'] / (stem + '.mp4')}")

    # The prompt lint runs on the DRY RUN, not only in the gate. A clause that was paid for going
    # missing is worth catching before the call, not after it: every one of these was a rejected
    # take. The gate re-runs the identical lint from the identical dict on the finished render.
    problems = format_spec.lint(prompt, mode=mode, **G)
    if problems:
        print("\nPROMPT LINT FAILED:")
        for p in problems:
            print("  - " + p)
        sys.exit("\nrefusing to go further. Fix format_spec.py or the brand config.")
    print(f"prompt lint OK: execution {mode}")
    shots = format_spec.split_shots(prompt)
    if len(shots) != len(cfg["shots"]):
        sys.exit("the configured shot list cannot be read back from the prompt")
    if mode == "product-guess":
        noun = format_spec.product_noun(prompt)
        if not noun or noun not in shots[0].lower() or noun not in shots[-1].lower():
            sys.exit("the product must appear in the opening and payoff shots")
        if not ref.exists():
            print(f"MISSING reference product photo: {ref}")
            if A.yes:
                sys.exit("refusing to spend without the product reference")
    else:
        print("mic-only conversation: no product reference, handover or screen required")
        if A.scene_ref:
            sys.exit("conversation has no scene-reference binding; remove --scene-ref")
        if A.yes:
            sys.exit("conversation is preview-only until a rendered pilot is approved; no paid call sent")
    if not A.yes:
        print()
        print(prompt)
        print("\ndry run. Nothing sent.")
        return

    # THROUGH THE GOOSEWORKS PROXY, never a local fal key: the call is billed to and recorded
    # on the user's project, and a resumed run re-attaches to a job it already paid for.
    import media_proxy  # noqa: E402
    upload_file = lambda pth: media_proxy.fal_upload(str(pth))  # noqa: E731
    out = L["takes"]
    out.mkdir(parents=True, exist_ok=True)
    dest = out / f"{stem}.mp4"
    man = out / f"{stem}.json"
    # The skip guard tests the PAYLOAD, not just the filename. It used to test only whether the
    # output file existed, so after a complete prompt rewrite it reported "same payload+seed
    # reproduces it" about a payload that had entirely changed, and would have handed back the
    # old clip as if it were the new one.
    if dest.exists():
        same = man.exists() and json.loads(man.read_text(encoding="utf-8")).get("prompt") == prompt
        sys.exit(f"{dest.name} exists and the recorded prompt is "
                 f"{'IDENTICAL, so the same payload+seed reproduces it' if same else 'DIFFERENT. '
                    'Bump the seed: reusing it would overwrite a take TAKES.md refers to'}.")
    urls = [upload_file(ref)]
    # THE SCENE REFERENCE. A prompt clause binds an object only WITHIN one generation: episodes 1
    # and 2 both carried a byte-identical microphone clause across three calls and rendered three
    # different microphones, and episode 2's third call rendered a different CONTINENT. Separate
    # calls have no channel between them, so each one re-derives the mic and the street from words.
    # The reference image IS that channel: it is why the can is the only object that has never
    # drifted. Passing a still from the episode's FIRST take as a second reference hands every
    # later take the mic, the street and the light instead of asking it to imagine them again.
    # @Image1 stays the product; the scene still is @Image2.
    if A.scene_ref:
        sref = Path(A.scene_ref)
        if not sref.exists():
            sys.exit(f"no scene reference at {sref}. Extract one from the episode's first take: "
                     f"ffmpeg -ss <t> -i <takeA.mp4> -frames:v 1 <out.png>")
        urls.append(upload_file(sref))
        print(f"scene ref   {sref.name}  (@Image2: mic, street and light carried from take A)")
    try:
        url = media_proxy.fal_generate_video(model, {
            "prompt": prompt, "image_urls": urls, "duration": dur,
            "resolution": format_spec.RESOLUTION, "aspect_ratio": format_spec.ASPECT,
            "generate_audio": True, "seed": seed},
            input_digest=media_proxy.input_digest(model, {"prompt": prompt, "seed": seed,
                                                          "duration": dur, "scene_ref": str(A.scene_ref)}))
        res, rid = {"video": {"url": url}}, None
    except RuntimeError as e:
        # A dropped network mid-poll has already billed you. Never resubmit: a poll timeout
        # raises FalPollTimeout carrying the request id, and media_proxy.resume_fal(id) returns
        # the finished video at zero extra cost.
        sys.exit(f"FAILED: {e}")
    urllib.request.urlretrieve(res["video"]["url"], dest)
    print(f"wrote {dest.name} {dest.stat().st_size // 1024} KB")
    man.write_text(json.dumps(
        {"model": model, "seed": seed, "duration": dur, "request_id": rid,
         # brand and product_noun are recorded so the gate does not have to guess either. Before
         # they were recorded, check-cut.py had to infer the product from a brand's own copy.
         "brand": cfg["brand"], "brand_config": cfg["_path"],
         # BOTH grammar flags are recorded, because the gate cannot infer them and must not
         # guess: check-cut.py lints the stored prompt with the flags stored beside it. A
         # manifest that recorded `pace_grammar` and not `guard_grammar` would have the gate
         # lint a guarded prompt with guards=False, i.e. pass while the two clauses the
         # seed-4816 render paid for went unchecked. That is the seed-4812 failure exactly.
         "mode": mode, "product_noun": cfg.get("product", {}).get("noun"), "pace_grammar": pace,
         "guard_grammar": guards, "mic_grammar": mic, "plain_grammar": plain,
         "answers_only": answers_only, "can_grammar": can,
         "mic_ref_grammar": mic_ref, "can_size_grammar": can_size,
         "can_sealed_grammar": can_sealed, "upright_grammar": upright,
         "one_mic_grammar": one_mic,
         # Recorded because episode 2's repair needed it and it was not there: a
         # take coupled to another by a scene reference is coupled more tightly
         # than by any clause, and the gate could not see that it had happened.
         "scene_ref": (str(A.scene_ref) if A.scene_ref else None),
         "episode_role": cfg.get("episode_role"),
         "est_cost": rate * dur, "prompt": prompt}, indent=1))


if __name__ == "__main__":
    main()
