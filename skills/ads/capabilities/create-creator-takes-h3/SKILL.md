---
name: create-creator-takes-h3
description: Generate an AI creator talking to camera, saying an approved script, as one continuous track — H3 Max reference-to-video through the GooseWorks fal-proxy (bills the Ads agent). Plans takes on line boundaries under H3's 15s cap, dry-runs a cost estimate, generates the first take alone so its voice can be locked and passed to every later take, joins takes with measured 0.10s dissolves, and moves each line's timing onto the words actually spoken. Use for any format with a generated creator speaking a script (split-screen, screen inserts, talking-head ads).
status: active
---

# create-creator-takes-h3

A generated creator who says an exact script, with one consistent face, room and voice
across several takes.

| Script | What | Cost |
|---|---|---|
| `make_character.py` | build the creator still from the user's choices, one shot | **paid** (one still, cents) |
| `plan_takes.py` | split lines into takes (under 15s each) and write the prompts | free |
| `run_takes.py` | generate the takes, dry run unless `--go` | **paid** (H3 Max, ~$0.16/s at 1080P) |
| `join_takes.py` | join into one creator track | free |
| `align_beats.py` | move line timings onto the spoken words | free |

`character-prompt.json` is the realism prompt for the character still. **Do not fill it by
hand.** `make_character.py` fills every slot and calls `create-image-fal`, because a
hand-filled prompt left slots blank and produced the composite face the formula warns about,
and different runs filled it differently.

`make_character.py` is the shared builder for any generated person still in a custom video, not
only for H3 takes. Fetch create-image-fal with it; the script calls its `gen_image.py`. Before
the paid call, quote the exact `--payload-out` body through the host's free quote:
`--dry-run --payload-out work/character/payload.json` writes `{"model", "body"}`, the exact
request `gen_image.py` will send, and generates nothing.

## Run

```bash
# the user's person, one command, one still. --dry-run prints the prompt and spends nothing.
python make_character.py --age 34 --gender woman --ethnicity "South Asian"     --hair "shoulder-length black hair, slightly frizzy at the crown, one side tucked back"     --wardrobe "plain charcoal crew-neck t-shirt, slightly creased"     --scene "a lived-in home office, a full bookshelf behind her, in focus"     --out work/character        # writes character.png AND character.json
python plan_takes.py --beats cutlist.json --character character.json --out work/takes
python run_takes.py --spec work/takes/takes.json                  # dry run: plan + estimate
python run_takes.py --spec work/takes/takes.json --only t1 --go   # after the user approves
python run_takes.py --spec work/takes/takes.json --go             # the rest, voice chained
# Transcribe and inspect EACH take into its planned tN.words.json BEFORE joining.
python join_takes.py --require-words --spec work/takes/takes.json --end <reel length> --out work/creator.mp4
# caption-burn: transcribe.py --media work/creator.mp4 --out work/creator.words.json
python align_beats.py --beats cutlist.json --words work/creator.words.json \
    --out cutlist.aligned.json --max-end <creator.mp4 length>
```

`character.json`, which `make_character.py` writes for you:

```json
{"image": "character.png",
 "identity": "<age + gender + look from the user's brief>, <hair>, <wardrobe>",
 "environment": "<the real room in the approved still>, window daylight",
 "delivery": "<the tone the user chose>. Whatever the tone, keep the face relaxed: an over-energetic read can give a constant grin and busy hands that read as AI."}
```

**The user chooses who the creator is.** Ask for age, gender and ethnicity, plus hair,
wardrobe and room, then pass them to `make_character.py`. Those six are required arguments, so
there is nothing to forget and nothing to invent. There is no default person: never
copy a look from an example, a reference build or a demo reel.

This is now enforced, not advisory. `plan_takes.py` rejects an `identity` that is still a
placeholder, or that states no age, or that states no gender. It was advisory once and the
docstring carried "a man in his late 20s ..." as an example: that got copied verbatim, the
old non-empty check passed it, and every build produced the same unrequested man. An
unspecified person is exactly the ambiguous composite face the realism formula warns about,
and it is what a reviewer sees as "obviously AI".

`delivery` now defaults to **calm and conversational**. The default used to be energetic,
which this file already warned "can give a constant grin and busy hands that read as AI", so
avoiding a known failure depended on remembering to opt out. Pass `delivery` to override.

`identity` and `environment` go into every take **word for word**. Write them once from the
approved still, then never retype them: a person described two ways drifts between takes.

## Choices

These are the user's calls (the recipe's `choices`), never defaults of this atom:

- **Creator** (`identity`) — age, gender, look. Asked of the user; no default person.
- **Setting** (`environment`) — the room behind them, written from the approved still. Asked of the user.
- **Tone** (`delivery`) — how they speak. Asked of the user; if missing, `plan_takes.py`
  falls back to a neutral conversational read and prints a note.
- **Voice** — follows the creator (age, gender, accent) and is locked from t1.

## Rules

1. **Lock order: script, then character still, then takes.** Show the still before any
   take. A take costs dollars; a still costs cents.
2. **First take alone, then listen.** Every later take copies t1's voice (its audio is
   passed as `reference_audio_urls`). A robotic or mismatched voice in t1 is in every
   take. If the user rejects it, `--reseed t1` and generate t1 again.
3. **Voice matches the person.** Age, gender and accent follow the character. The
   prompt's delivery line sets the tone; change it through `delivery`, not by editing
   the prompt file.
4. **No square brackets in lines.** H3 speaks them aloud; `plan_takes.py` refuses them.
5. **Dialogue stays verbatim.** Takes are sent with `prompt_expansion_mode: disabled`.
6. **Takes split between lines, never inside one**, and run 0.6s past the last word.
   `--split-at 6.3,14.5` joins the takes exactly at those line boundaries: the
   screen-insert format joins where an insert ENDS, so the cut is hidden under the screen.
   The voice runs under inserts too, so every line (creator or product beat) is in a take.
7. **Join with a 0.10s dissolve, never 0.20s.** At 0.20s both poses show through the blend
   ("two pairs of hands"). Measured: 11.04 peak change at 0.10s vs 13.30 for a hard cut.
8. **One filter graph.** Joining files with the concat demuxer puts black frames at every
   boundary; `xfade` with a late offset silently concatenates instead of overlapping.
9. **Watch every take end to end before joining**: eyes on the lens to the last word,
   hands, identity, voice. A wrong still ("anchor") makes every take wrong the same way;
   if all takes fail alike, fix the still, not the seed.
10. **Mannerism clips are optional and need rights.** `--mannerism` passes a muted
    motion-reference clip. Its gaze transfers, so check the eyeline on every frame. Never
    use another brand's creator footage.
11. **Seeds are pinned.** Re-running an unchanged take repays for the same clip. Existing
    take files are skipped.

## Failure modes

1. **A hand-filled realism prompt.** `character-prompt.json` sat in this directory read by no
   script, with the instruction "fill its slots, generate 2-4 options, let the user pick one".
   Slots got left blank, every run filled them differently, and the documented workflow was
   iterative by design. Use `make_character.py`; it refuses a blank slot and an out-of-range age.
2. **A guard that rejects everything.** The age and gender guards in `plan_takes.py` shipped
   with a literal backspace byte where `\b` was meant, so every identity failed and the skill
   could not run at all. A guard is not tested by reading it: run it against one input it must
   ACCEPT and one it must REJECT. `grep -c $'\x08' <file>` catches this class.
3. **Iterating the avatar.** This is a template a customer runs, so the still has to land on the
   first generation. When it does not, fix the inputs (`--hair`, `--wardrobe`, `--scene`, or a
   different `--seed`, which reshuffles which three skin imperfections are asked for) rather than re-rolling the same brief; an unchanged payload
   with a pinned seed reproduces the same image and wastes the spend.

## Measured join acceptance

Per-take word timing is required in recipes before joining. Confirm every line is complete in each source take; timing cannot recover a word the model never spoke. The join normalizes frame rate and time base, adds silent lead before an early incoming word, and moves a transition after a late outgoing word. It writes the actual mapping and duration in `creator.mp4.timeline.json`. Re-align the cut list to the final audio and extend the layer to that measured duration; do not clamp it back to the planned end. Estimated joins remain available for legacy callers and print a warning: `--take` without `--words`, or `--spec` when none of the take set's planned word files exist (recipes written before measured joins). Some-but-not-all word files is an error, and `--require-words` turns any estimated join into an error.

Use ordinary skin texture and subtle asymmetry for realism. An eyebrow scar is no longer a random default: scars or other distinctive marks require the user's explicit choice. Inspect the still before approving takes.

## Rejection, physical constraints and cast planning

A provider likeness/policy rejection stops the attempt. Preserve the provider's reason, request id and charged/uncharged/unknown state. Do not resubmit an identical rejected payload. Offer a permitted original character, user-cleared reference, or a supported non-likeness route only when allowed by that provider. A different model is not a policy bypass. Review changed inputs and extra spend through the normal approval flow.

Before generation, write a scene checklist from the brief: each wearable's exact count and body location; which hand holds each object; allowed gestures; object contacts and movement; cast identities and reference ownership. Keep unnecessary hands still, use one simple action per shot, and review the whole generated take against the checklist. A prompt is prevention, not proof: reject extra/missing products, impossible contacts or identity drift.

For multiple characters, compare a shared scene with pinned references, fewer people per shot, and separately generated/composed plates. The first preserves interaction but risks identity drift; separate plates improve control but add composition work and may weaken interaction. Lock an approved reference per person and map who speaks each line. No six-character/two-attempt guarantee is supported. A future paid benchmark must state cast size, attempts, budget, model/settings and pass criteria (identity, speaker, counts, gestures and complete dialogue) and retain every failure.
