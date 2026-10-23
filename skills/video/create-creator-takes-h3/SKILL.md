---
name: create-creator-takes-h3
description: Generate an AI creator talking to camera, saying an approved script, as one continuous track — H3 Max reference-to-video through the GooseWorks fal-proxy (bills the Ads agent). Plans takes on line boundaries under H3's 15s cap, dry-runs a cost estimate, generates the first take alone so its voice can be locked and passed to every later take, joins takes with measured 0.10s dissolves, and moves each line's timing onto the words actually spoken. Use for any format with a generated creator speaking a script (split-screen, screen inserts, talking-head ads).
status: superseded
version: "2.9.0"
updated: 2026-10-16
superseded_by: creator-h3@1.8.0
---

> **Superseded by:** `creator-h3@1.8.0`. Compatibility scripts retain the source-review guards; frozen versions are unchanged.

# create-creator-takes-h3

**Summary.** Generate one creator take, review the actual picture and sound, then continue with qualified sources. Keep native speech attached to its picture and assemble only complete reviewed takes. The provider can still invent words, drift in identity or fail an action; prompts and transcripts do not certify a pass.

Use the shared builder for people. Defaults: GPT Image 2, phone capture in a lived-in room, deep focus, no bokeh, no retouching, and one light lock (window or lamp light from one side, normal exposure, no HDR, matte skin, no over-sharpening). Studio or shallow focus only when the reference is shot that way. No forced flaws; marks only when the user chose them, and a skin condition only when the product treats it. A person who acts is an action shot, not a talking head.

| Script | What | Cost |
|---|---|---|
| `make_character.py` | build the creator still from the user's choices, one shot | **paid** (one still, cents) |
| `pair_voice.py` | the voice for this person: a matched ElevenLabs voice, or a Voice Design request | free (Voice Design itself is paid) |
| `plan_takes.py` | split lines into takes (under 15s each) and write the prompts | free |
| `run_takes.py` | generate the takes, dry run unless `--go` | **paid** (H3 Max, 768P by default) |
| `join_takes.py` | join into one creator track | free |
| `align_beats.py` | move line timings onto the spoken words | free |

`character-prompt.json` is the realism prompt for the character still. **Do not fill it by
hand.** `make_character.py` fills every slot and calls `create-image-fal`, because a
hand-filled prompt left slots blank and produced the composite face the formula warns about,
and different runs filled it differently.

`make_character.py` is the shared builder for any generated person still in a custom video, not
only for H3 takes. Fetch create-image-fal with it; the script calls its `gen_image.py`. Before
the paid call, price the exact `--payload-out` request with `data_price_provider` (free, read-only):
`--dry-run --payload-out work/character/payload.json` writes `{"model", "body", "quality_tier"}` (plus
`upgrade` and `query` when there are any), the exact request `gen_image.py` will send, and generates
nothing. Send the body, and the `query` fields (`shot_scene`, `upgrade_*`) as top-level fields of the
price request, so the check prices the call that will run.

## Quality tier: Standard or Best

The customer picks **Standard** (the default) or **Best** at script approval. Pass it as `--tier`.

| Setting | Standard | Best |
|---|---|---|
| Still (`make_character.py --quality`) | GPT Image 2 `medium` | `high` |
| Takes (`plan_takes.py --resolution`) | H3 `768P` | `768P` |

- **No video above 768P unless the customer asks** (16 Oct 2026). The finished video is 1080×1920 either way: the last edit step scales the 768P picture up with `ffmpeg -vf scale=1080:1920:flags=lanczos`, at no cost. fal makes H3 1080P from a native 768P take plus a refinement pass.
- **Choose the resolution before the first take.** Later takes copy t1's voice and are reviewed against it, so `run_takes.py` refuses to go on while any take was made at another resolution: re-plan and re-roll those takes.
- **Above the tier's default is an upgrade for one shot**, never for the whole video, and it needs a reason (`scripts/tiers.py`, the GooseWorks server's names):
  - a picture (`make_character.py --quality high` under Standard) after a failed check: `--upgrade-reason failed_attempt --upgrade-attempt <the failed call's operation id> --upgrade-why "<one line>"`;
  - anything when the customer asks: `--upgrade-reason customer_asked --upgrade-quote "<their words>"`. A video upgrade (H3 `1080P`) is only ever this: never after a failed check alone.
- **After one failed check, judge the shot.** Retry once at the same setting when a prompt fix should work (a wrong pose, a missing prop). Upgrade the picture straight away when medium probably can't do it (small label text, a complex product shape, many parts that must stay exact).
- **The call says which shot it is.** `make_character.py --shot-scene <n>` (a still made for one scene; leave it out for a shared person, even on an upgrade) and each take that speaks one scene send `shot_scene`, with the upgrade's `upgrade_*` fields, as the GooseWorks query. `character.json`, `takes.json` and the `--payload-out` file record the tier, the setting and the upgrade.

## Run

```bash
# the user's person, one command, one still. --dry-run prints the prompt and spends nothing.
python make_character.py --capture phone --recording counter --age 34 --gender woman --ethnicity "South Asian"     --hair "shoulder-length black hair, slightly frizzy at the crown, one side tucked back"     --wardrobe "plain charcoal crew-neck t-shirt, slightly creased"     --scene "a lived-in home office, a full bookshelf behind her, in focus"     --voices voices.json --voice-accent american     --out work/character        # writes character.png AND character.json
#   add --action "<each scene action she performs>", --voices voices.json and --voice-accent/--voice-energy (see below)
python plan_takes.py --beats cutlist.json --character character.json --out work/takes --reference-wps <reference rate>
python run_takes.py --spec work/takes/takes.json                  # dry run: plan + estimate
python run_takes.py --spec work/takes/takes.json --only t1 --go   # after the user approves
python run_takes.py --spec work/takes/takes.json --reviews work/takes/source-reviews.json --qualification work/takes/qualification.json --go # after t1 passes actual AV review
# Transcribe and inspect EACH take into its planned tN.words.json BEFORE joining.
python join_takes.py --require-words --reviews work/takes/source-reviews.json --spec work/takes/takes.json --end <reel length> --out work/creator.mp4
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

`plan_takes.py` rejects a placeholder identity or one without age or gender. These
must come from the chosen creator brief: copying an example once produced the same
unrequested man across builds. An unspecified identity creates a composite face.

`delivery` now defaults to **calm and conversational**. The default used to be energetic,
which this file already warned "can give a constant grin and busy hands that read as AI", so
avoiding a known failure depended on remembering to opt out. Pass `delivery` to override.

`identity` and `environment` go into every take **word for word**. Write them once from the
approved still, then never retype them: a person described two ways drifts between takes.

## Action shots, skin condition and light (2.5.0)

Two test videos looked AI-made. Every B-roll person was built as a talking head (centred, looking at the lens, hands free, clear skin), and the light was flat, glossy and perfectly exposed.

- **An action shot frames the action.** With `--action "..."` or `--capture phone_observer`, the still is an action shot: the hands, the object and the face working on it are in frame, off-centre, the eyes on the task, the hands in use, the head 25-40 % of the frame (20-35 % for `phone_observer`). The action text goes into the prompt. `--shot talking` keeps the talking-head defaults for someone who talks to the lens while acting. `character.json` records `shot`.
- **Show the condition the product treats.** `--skin-condition "visible blackheads on the nose, oily T-zone"` (or "a few small acne spots") puts it on the person, real and unretouched. It needs no `--marks-approved`: it comes from the product, not a random mark. Without it, no marks are invented. An oily condition drops "greasy shine" from the negative. `character.json` records `skin_condition`.
- **One light lock.** Every capture asks for window or lamp light from one side, normal exposure, no HDR, matte skin with no added shine and no over-sharpening. creator-h3 1.6.0 and video-h3max 1.2.0 repeat it in the motion prompt.

## Both hands, voice and pace (2.4.0)

A test video went wrong three ways. These rules stop each one.

- **Both hands busy: no selfie.** The presenter pressed a strip on her nose with both hands under a selfie capture, and the model added a third hand holding the phone. Pass every scene action with `make_character.py --action "..."`. An action that uses both hands (apply, smooth, press, peel, squeeze, hold with both hands) refuses `--recording selfie` and makes a propped phone (`counter`) instead; use `--capture phone_observer` for a friend filming. `plan_takes.py` does the same for beats whose `action`, `picture`, `visual`, `shot` or `description` says so, or for `required_features` `application`: it refuses `phone_selfie` and uses `phone_counter` (creator-h3 and talking takes have no `phone_observer`; that capture is make_character.py's, for non-speaking clips). Both print why, and record `capture_decision` (in `character.json` and `takes.json`).
- **The voice fits the face.** The narrator was picked apart from the presenter (a 28-year-old woman) and was a voice reused across brands. `make_character.py` now records `voice_pair` in `character.json`, from the same age and gender plus `--voice-accent` and `--voice-energy`. With `--voices` (a saved voice list; see 2.6.0 below) it is the best voice that fits; `--voice-exclude <id>` keeps another brand's narrator out. With `--voice-design` (or when nothing in the list fits) it is a Voice Design request: `POST /v1/text-to-voice/design` with `voice_description`, `model_id` (`eleven_ttv_v3`) and `text` (100-1000 characters) or `auto_generate_text`, then `POST /v1/text-to-voice` with `voice_name`, `voice_description` and the chosen preview's `generated_voice_id`. Voice Design is paid: quote it, listen to the previews, then save one. Use `voice_pair` for every narration of this person.
- **Pace from the reference.** The narration read at 2.62 words a second against the reference's 3.20 (270 words in 84.45 s). Measure the reference with goose-studio's `reference_rate.py`, which counts real words (whisper's sub-word tokens joined, punctuation skipped). `plan_takes.py --reference-wps` (or the beats file's `reference_wps`) sizes the takes from the words at that rate, capped at 3.2, the fastest H3 speaks natively; `takes.json` records `pace`. Faster than 3.2 cannot be native H3: use voice first (`voice-elevenlabs` `pace.target_wps`) and a per-line lip-sync.

## Measured take reviews and a voice across heritage (2.9.0)

Gate audit, 16 Oct: quality checks warn and never block, and an agent that can't play video was stuck at "watched/listened" claims.

- **A measured review is enough.** `source-reviews.json` coverage says `motion: watched|measured` and `audio: listened|measured`. Measured means full-resolution frames of the whole take plus word timing against the line, listed in the review's `evidence`. Nobody has to claim a watch or a listen.
- **A check fails only for a must_fix.** Mark script, voice, lip-sync, identity, framing or performance `fail` only for a must_fix problem (lost words, no lip-sync, warped anatomy, a different person). A take that looks clearly AI-made is `pass`, with the finding in `evidence`, and goes to the owner as an `ask`; slightly AI-looking is `fine` and kept.
- **No voice of the person's heritage: the nearest one, said out loud.** When the lists hold no voice of the person's heritage, `voice_pair.nearest` holds the closest voices of the right gender from other heritages, each with `heritage` first in `differs_on`, and `nearest_note` says so. `--accept-nearest` then writes `tell_owner`: one plain line for the owner. **Never change the person to fit a voice.**

## Realism check and a voice for every person (2.8.0)

On 16 Oct a custom video stopped at the ingredient approval: the server refused the presenter as "generated", even after a High remake, and the agent changed an East Asian presenter to Black American because the account's voice list had no East Asian woman.

- **The server grades every person still.** GooseWorks checks each person still (avatar and image ingredients) when `video_change custom.draft` saves it, and grades it: **fine** (real or slightly AI-looking: keep it, say nothing), **ask** (clearly AI-made at a glance: waxy or airbrushed skin, portrait blur, studio light, a plain or showroom set: show the owner with one plain reason and the re-make price, and let them choose) or **must_fix** (an extra or missing hand or finger, warped anatomy, a distorted face, an impossible pose or object, garbled text: make it again and tell the owner in one line). The save only warns: its reply lists `person_stills` (`flagged` with `severity`), and its `next_step` names each flagged still; make only those again. `not_checked` stills are judged at the next save or at approval; if one stays unchecked, look at it at full size yourself. `video_approve` refuses only a `must_fix` still (`custom_video_person_still_not_real`, naming each one); an `ask` still the owner keeps is approved. Keep the defaults (phone capture, deep focus, medium under Standard): three people at medium passed 3 of 3. Never ask for "softness" or a "video frame" look: it smoothed the skin and failed.
- **A talking head can hold something.** `--shot talking --action "she holds the bowl at chest height"` writes the action in as what they do while talking (it was dropped before), and drops "both hands are free".
- **Search the voice library.** `pair_voice.py --library-searches --gender woman --ethnicity "East Asian"` prints up to three free `GET /v1/shared-voices` calls (gender, language, a heritage search word, page 0), each with the file name to save its reply as (`save_as`, `library-<gender>-<language>-<search>-p<page>.json`). Run each through `data_call_provider {provider: "elevenlabs", path: "/v1/shared-voices", query, project_id}`, save each reply under its `save_as`, and pass every list: `--voices account.json --voices library-female-en-asian-p0.json --voices library-female-en-chinese-p0.json`. A search not yet run comes back in `voice_pair.library_search`; when nothing fits and a search's last page says `has_more`, `voice_pair.library_next_page` gives its next request and file name; `--designed` and `--accept-nearest` refuse until every search has run to its last page. Library voices speak through text-to-speech without being added. On 16 Oct this found a fitting voice for an East Asian woman, a Latina woman, a South Asian man and a Black American woman; the account list alone fit only the last.
- **Needs the GooseWorks release with these calls** (gooseworks-app #2095: `/v1/shared-voices`, `/v1/text-to-voice/design` and `/v1/text-to-voice` through `data_call_provider`/`data_post_provider` and `data_price_provider`). Before it, those calls answer `unsupported_provider_endpoint`: pair from the account list, and when nothing fits play the first `nearest` voice beside the still and record it with `--accept-nearest --library-unavailable` only with the owner's yes; never change the person.
- **Voice Design when nothing fits.** Price `voice_pair.request` with `data_price_provider`; like a still, it runs under the script approval's preview budget (ask the owner again only when it would go over), then run it with `data_post_provider {provider: "elevenlabs", path: "/v1/text-to-voice/design", body}`: its previews come back as project audio. Play them beside the still, then save the chosen one free with `voice_pair.save` (`/v1/text-to-voice`, the preview's `generated_voice_id`) and record its `voice_id` with `pair_voice.py --character character.json --designed <voice_id>`, so `voice_pair` names the voice every later step uses.
- **Never change the person to fit a voice.** Heritage, age and gender come from the brief and the reference; the voice follows them, never the reverse.

## Voice by ethnicity, chosen with the person (2.6.0)

A 39-year-old Black American presenter got a generic American voice ("Jon"), because pairing matched gender, age and accent only. The voice was also proposed in the script draft before the person existed, and the fix was a hand pick from the list.

- **Ethnicity is matched.** `make_character.py` passes `--ethnicity` to `pair_voice.py`. A voice fits only when its accent label, description or name names the person's heritage ("african american", "Black", "Indian", "Latina"...), and never when it names another one; a White person takes a voice that names none; an unknown or mixed ethnicity checks nothing. An "african american" accent counts as american. The Voice Design description says it too: "A 39-year-old Black American man with a natural American accent."
- **Age may be one band off, near its edge.** The voice list labels every African American male voice "young". A voice in the next age band fits when the person is within 10 years of it (39 takes "young"); an exact band always wins, and `matched_on` says `age_near`.
- **No voice list, no still.** `make_character.py` refuses without `--voices`; a silent fallback to a paid Voice Design request was ignored. Get the list free through the GooseWorks MCP: `data_call_provider {provider: "elevenlabs", path: "/v1/voices", project_id}`, and save the whole reply; `pair_voice.py` reads that shape, ElevenLabs' own, and `video_formats` rows. `video_formats show:"voices"` is a short curated list that names no heritage, so prefer `/v1/voices`. `--voice-design` asks for a Voice Design request on purpose; `--no-voice-pair` is for a person never voiced separately. The account list is small: search the shared library too (2.8.0 above).
- **No fit:** `voice_pair` is a Voice Design request plus `nearest`, up to three voices of the right gender and heritage (or across heritage when none shares it, 2.9.0) with what differs, and `library_search`. Search the library first; design only when no list fits (2.8.0). `pair_voice.py --character character.json --accept-nearest` takes the first `nearest` voice only when the owner accepts it beside the still. Nobody picks from the list, and no voice outside `voice_pair` is used.
- **Specific, mixed and broad words.** A specific heritage fits itself or its general words, never a sibling: a Korean person never takes a voice described as Japanese, and an Indian one never a Pakistani one. "mixed", "biracial" or two heritages ("biracial Black/Latino") check no heritage. A voice naming two heritages fits neither. A generic "Asian" voice fits an East or Southeast Asian person and never a White one. Accent aliases go one way: an "african american" accent is american, never the reverse.
- **Changing the voice:** `pair_voice.py --character character.json --voices voices.json --exclude <rejected voice_id>` pairs again for the same person and writes `voice_pair` back; `voice_pair.rejected` remembers every rejected voice. Never hand-pick from the list.
- **Approve together.** Play the voice next to the still and approve the two together; a voice is never approved while its person is pending.

## Choices

These are the user's calls (the recipe's `choices`), never defaults of this atom:

- **Creator** (`identity`) — age, gender, look. Asked of the user; no default person.
- **Setting** (`environment`) — the room behind them, written from the approved still. Asked of the user.
- **Tone** (`delivery`) — how they speak. Asked of the user; if missing, `plan_takes.py`
  falls back to a neutral conversational read and prints a note.
- **Voice** — follows the creator (age, gender, ethnicity, accent) and is locked from t1. For narration, use `voice_pair`.

## Rules

1. **Lock order: script, then character still, then takes.** Show the still before any
   take. A take costs dollars; a still costs cents.
2. **First take alone, then review it.** Later takes receive the accepted t1 audio as voice conditioning, not exact audio reuse. A hash-bound review of the whole take in `--reviews` is required before later takes (watched and listened, or measured). Voice consistency still needs checking every take; reseeding is a new paid attempt subject to the approved retry budget.
3. **Voice matches the person.** Age, gender, ethnicity and accent follow the character. The
   prompt's delivery line sets the tone; change it through `delivery`, not by editing
   the prompt file.
4. **No performance markup in spoken lines.** H3 delivery goes outside `<d>`; `plan_takes.py` refuses bracketed or angle-tag instructions in the line. Automatic `<inhale>` and `<pause>` cues are removed. A wanted “uh” is approved spoken copy and consumes time.
5. **Dialogue stays verbatim.** Takes are sent with `prompt_expansion_mode: disabled`.
6. **Takes split between lines, never inside one**, and run 0.6s past the last word.
   `--split-at 6.3,14.5` joins the takes exactly at those line boundaries: the
   screen-insert format joins where an insert ENDS, so the cut is hidden under the screen.
   The voice runs under inserts too, so every line (creator or product beat) is in a take.
7. **Join with a 0.10s dissolve, never 0.20s.** At 0.20s both poses show through the blend
   ("two pairs of hands"). Measured: 11.04 peak change at 0.10s vs 13.30 for a hard cut.
8. **One filter graph.** Joining files with the concat demuxer puts black frames at every
   boundary; `xfade` with a late offset silently concatenates instead of overlapping.
9. **Review every take end to end before joining** (watched, or measured from full-resolution frames and word timing): eyes on the lens to the last word,
   hands, identity, voice. A wrong still ("anchor") makes every take wrong the same way;
   if all takes fail alike, fix the still, not the seed.
10. **Mannerism clips are optional and need rights.** `--mannerism` passes a muted
    motion-reference clip. Its gaze transfers, so check the eyeline on every frame. Never
    use another brand's creator footage.
11. **Seeds are pinned.** Re-running an unchanged take repays for the same clip. Existing
    take files are skipped.
12. **A policy rejection stops the run (exit 3).** See "Rejection, physical constraints and
    cast planning" below.

## Failure modes

1. **A hand-filled realism prompt.** `character-prompt.json` sat in this directory read by no
   script, with the instruction "fill its slots, generate 2-4 options, let the user pick one".
   Slots got left blank, every run filled them differently, and the documented workflow was
   iterative by design. Use `make_character.py`; it refuses a blank slot and an out-of-range age.
2. **A guard that rejects everything.** The age and gender guards in `plan_takes.py` shipped
   with a literal backspace byte where `\b` was meant, so every identity failed and the skill
   could not run at all. A guard is not tested by reading it: run it against one input it must
   ACCEPT and one it must REJECT. `grep -c $'\x08' <file>` catches this class.
3. **Iterating the avatar.** A still is a candidate until inspected. If it fails, identify the actual defect and repair its brief or use an acceptable owned source within the approved retry budget. Do not invent scars or facial marks as a realism shortcut. A seed is not a proof of identity or quality.

## Free planning before the still exists

`make_character.py --dry-run` saves the prompt and character.json without generating an image. Run `plan_takes.py --plan-only` with that metadata, then `run_takes.py` without --go to inspect durations. These are planning estimates, not a current provider quote. After the approved still exists and has been reviewed, rerun plan_takes without --plan-only. Generation refuses planning-only specs. Never generate a placeholder just to price takes.
## Measured join acceptance

Per-take word timing is required in recipes before joining. Confirm every line is complete in each source take; timing cannot recover a word the model never spoke. The join normalizes frame rate and time base, adds silent lead before an early incoming word, and moves a transition after a late outgoing word. It writes the actual mapping and duration in `creator.mp4.timeline.json`, and prints the same summary line as before, e.g. `[join] 2 takes, joins at 4.70, 9.50s -> creator.mp4  (measured 9.50s)` (one take: `[join] one take, trimmed to 6.00s -> creator.mp4`). Each `joins at` value is the reel time where the dissolve into that take begins, the same as `takes[k].start` in the timeline; the printed length is the actual reel length. A lone estimated take is trimmed to `--end` (never padded); a missing take file stops with `take missing: <path> (run run_takes.py)`. Re-align the cut list to the final audio and extend the layer to that measured duration; do not clamp it back to the planned end. Estimated joins remain available for legacy callers and print a warning: `--take` without `--words`, or `--spec` when none of the take set's planned word files exist (recipes written before measured joins). Some-but-not-all word files is an error, and `--require-words` turns any estimated join into an error.

Inspect the still before approving takes.

## Rejection, physical constraints and cast planning

`run_takes.py` enforces the stop. When the provider refuses a take on policy grounds
(likeness of a real person, `content_policy_violation`, `partner_validation_failed`, NSFW):

- The run **exits 3** at the end: surface, do not retry. A **still** rejection (likeness, or
  `partner_validation_failed`, which is the provider refusing the photoreal face) stops the
  run at that take, because every take in a spec uses the same character still. Any other
  rejection (about that take's own prompt) skips only that take; the rest still render.
- It prints the reason, type, request id, charge state and the ledger record path, and keeps
  them in `manifest.json` under `"rejected"` (cleared when that take later renders).
- Each take is submitted with an `input_digest` over the **content** of its inputs: prompt,
  settings, seed, and the sha256 of the character still, mannerism clip and t1 voice
  source. Upload URLs change every run, so this digest is what lets media-proxy's
  rejected-request ledger recognise the same take again.
- **Re-running the unchanged take is refused before anything is sent for it** (exit 3
  again, "already rejected"). If it was a still rejection, the other takes are held back
  too while the still is unchanged: nothing is uploaded or sent, instead of one refused
  submit per re-run. If it was about that take's prompt, only that take is refused and the
  others still render. The dry run marks it `REJECTED BEFORE: <reason>`.
- A new still, a changed prompt or `--reseed` makes it a new request, which is sent.

A provider likeness/policy rejection stops the attempt. Preserve the provider's reason, request id and charged/uncharged/unknown state. Do not resubmit an identical rejected payload. Offer a permitted original character, user-cleared reference, or a supported non-likeness route only when allowed by that provider. A different model is not a policy bypass. Review changed inputs and extra spend through the normal approval flow.

Before generation, write a scene checklist from the brief: each wearable's exact count and body location; which hand holds each object; allowed gestures; object contacts and movement; cast identities and reference ownership. Keep hands that have no job still; every B-roll shot has one simple physical action for the hands that do, and never write "no hand touches the face" when touching the face is the action. Review the whole generated take against the checklist. A prompt is prevention, not proof: reject extra/missing products, impossible contacts or identity drift.

For multiple characters, compare a shared scene with pinned references, fewer people per shot, and separately generated/composed plates. The first preserves interaction but risks identity drift; separate plates improve control but add composition work and may weaken interaction. Lock an approved reference per person and map who speaks each line. No six-character/two-attempt guarantee is supported. A future paid benchmark must state cast size, attempts, budget, model/settings and pass criteria (identity, speaker, counts, gestures and complete dialogue) and retain every failure.

## Source review and timing contract

`source-reviews.json` contains `takes: [{id,source_sha256,script_sha256,status,reviewer,coverage,checks}]`. Coverage names `motion` (`watched` or `measured`), `audio` (`listened` or `measured`), `start_s` and `end_s` and covers the complete actual source; `measured` (full-resolution frames plus word timing against the line) is enough, and the older `video_watched`/`audio_listened` booleans still read as watched/listened. Script, voice, lip-sync, identity, framing and performance checks must pass; product/action is pass or not_applicable. Never invent reviewer coverage. Every new generated file is pending until that review exists. Failed or incomplete files remain candidates and cannot enter a passing assembly.

New plans set `content_review_required: true`. Word sidecars must bind their source/script checksums and name `reviewed_transcription` or `forced_alignment`; silence measurements alone are not word boundaries. Native audio and picture keep matching trims and speed. The assembly output remains pending final review.

### Natural performance

Specify recording method, framing, background, motivated light and visible action from the approved brief. `--capture` is `phone` (default), `phone_observer` (filmed by a friend, not looking at the lens: for eating or acting, never an H3 talking take) or `studio`; `--recording counter|selfie`; `--focus deep` (default) or `shallow`; `--shot auto|talking|action` (auto: action when `--action` is given or the capture is `phone_observer`); `--skin-condition` for a condition the product treats. Distinctive `--marks` require `--marks-approved`, recording an explicit user choice. Do not repair poor acting with sharpening, blur or grain. Local H3 angle-tag experiments are not portable schema support; use delivery directions outside the spoken line.

For the compatibility scripts, the first render manifest exposes `configuration_sha256` and the first-source candidate SHA. Record a qualification only after actual acceptance; later takes require `--qualification` matching the exact current payload configuration and first source. The kit uses its own canonical configuration fingerprint; records from different executors are not interchangeable.
