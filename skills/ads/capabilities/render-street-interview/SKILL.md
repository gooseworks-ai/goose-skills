---
name: render-street-interview
description: Write a street-interview ad from a complete inspected commercial interaction and current brand facts. Render product guessing, or prepare mic-only, prepared-sample or visible-task conversation script/prompt previews. Premise, actions and ad connection vary; capture rules stay fixed. Conversation media delivery is unverified.
status: draft
---

# Human version

## render-street-interview

**Summary.** This is the renderer for the **street-interview** ad format (goose-studio
recipe `one-shot-videos/create-street-interview-video`). Product guessing retains its
visible object and reveal. Conversation supports mic-only, prepared-sample and visible-task
**script/prompt previews**. Choose a coherent situation and earned ad connection before
writing words. People are generated; conversation media delivery remains unverified.

---

# Agent version

## Script first: choose the execution

Read [street-script-writing](references/street-script-writing.md) before adapting a brand.
The recipe fixes camera, audio, native timing and finishing rules. Its story choices govern
premise, participant role, participation reason, visible task, actions, edited opening,
hook, supported brand explanation and payoff. Do not force a correct-answer winner into a
service conversation or reduce every brand to a routine problem followed by a logo card.

| Interaction | Current support | Person image reference | Max participants |
| --- | --- | --- | --- |
| `product-guess` | Existing object renderer; standalone product reference required | forbidden | 4 |
| `mic-only` | Conversation preview; service explanation without a product or device | forbidden | 1 |
| `product-sample` | Conversation preview; prepared sample in a plain cup, no exact package reference | forbidden | 1 |
| `concept-challenge` | Conversation preview; described visible task using non-UI props | forbidden | 1 |

Use [[composes::write-video-ad-script]] with the scoped angle bank, current facts and
selected complete commercial street interactions. `scripts/prepare_script_context.py`
requires a brief with `offering_type=physical|service|digital` and
`interaction_type=product-guess|mic-only|product-sample|concept-challenge`. Inspect the full
visual timeline and spoken exchange: setup, participation reason, hook, product role and
payoff. Record unseen recruitment or setup as unknown; inference is not observation.
Seed snippets are leads. Radio and editorial exchanges cannot fill a street-ad gap.
Keep private observations project-scoped and transfer mechanics, not source-brand claims.

Pass `participants` too: the number of people interviewed on screen, not counting the
interviewer (default 4 for product-guess, 1 for conversation). Its `route` output is binding
for any project built on this format, including custom ones. `unsupported-route` means stop
and offer the listed alternatives; it is not permission to go custom.

Save a situation brief before dialogue. Write the user's requested count, then map words
and actions to ordered shots. An edited participant answer or silent action/reaction may
open the ad. `cfg.question` mirrors the first actual interviewer question, spoken once.
Keep both spoken voices and 3–8 shots in 6–15 seconds, at no more than 2.5 spoken words/s;
leave time for actions. New configs describe `interaction.type`, `visible_setup`,
`participant_reason` and optional `props`; missing interaction defaults to mic-only.
No forced greeting/consent speech, invented use history or instant product efficacy.

`conversation` currently runs config validation and prompt previews. `single_gen.py --yes`
refuses that mode until a rendered pilot is validated. Natural speech, audio and camera
performance remain unverified. The existing product-guess render path is preserved.
All conversation subtypes refuse product/scene reference bindings and phone, screen or UI
demonstrations. Dry-run success is not a performed sample, challenge or finished video.

Read the bundled [model notes](references/model-behaviors.md) before generation.
If a required guide cannot be fetched or opened, stop before spending and name it.
`REFERENCE.md` holds the format's historical **Critical knowledge** entries and
the rejected takes behind them. Read it before changing the prompt scaffold or a gate;
its older experiments do not override the current recipe or this entry.
Use the [project take-ledger guidance](TAKES.md) before reusing a seed. Keep each
brand's observed successes and limitations in its own project; a seed is not a quality guarantee.

## Run

The paid generation and finishing commands below are for `product-guess`. Conversation
supports `brandkit.py` validation and `single_gen.py` dry runs only.

Run everything from the project the video belongs to. Brand-asset paths in the configs
(logo, product photo, end-card sting) resolve against that folder, or `$STREET_INTERVIEW_ROOT`.
The run folder is `--run <dir>` (default `projects/street-interview/`), with `working/` for
intermediates and `output/` for deliverables.

```bash
python scripts/selftest.py                                   # free: the format and the lint hold
python scripts/single_gen.py --brand <slug>                   # dry run: price + the full prompt
python scripts/single_gen.py --brand <slug> --seed <n> --yes  # PAID: one take (~$3.64 at 12 s, 720p)
python scripts/build_episode.py --episode <name>              # free: grade, re-cut, captions, end card
python scripts/check-cut.py --episode <render>.episode.json   # free: the ship gate
```

- **Product-guess brand data:** `brands/<slug>.json` holds the product and its reference photo, the
  street, the question, the cast and their lines, props, captions, logo and end card. Copy
  `brands/demo-tallgrass-oat.json`. No brand appears in `format_spec.py`.
- **An episode** (`episodes/<name>.json`) joins three takes into a ~25-30 s cut. It names the takes,
  any whole shots to drop (`drop_shots`, each pair a real shot's start and end), the brand layer
  and, optionally, `brand_layer.end_card_music`, a short sting played under the end card.
- Paid calls go **through the GooseWorks proxy** (`scripts/media_proxy.py`), never a local key.
  On a poll timeout, resume with `media_proxy.resume_fal(request_id)`. Never resubmit, since a
  dropped poll has already been billed.

## Prompt length

The final Seedance prompt is built from the project brief and shared shot instructions.
[BytePlus recommends at most 1,000 English words](https://docs.byteplus.com/en/docs/modelark/create-video-generation-task-api)
because lengthy prompts may miss details. This is quality guidance. The current
[Fal schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=bytedance%2Fseedance-2.0%2Freference-to-video)
declares no maximum prompt length; that does not prove unlimited acceptance.

`single_gen.py` prints a non-blocking advisory above that guideline. The old 1,200-word
refusal is removed: its source-run observation did not prove a precise boundary. Keep the
exact approved dialogue and required clauses; do not trim them, reduce the cast or add a paid
retry just to meet a count. Missing clauses, invalid inputs and existing spend approval still
block generation. The finished-cut gate reports length as advice, without failing on it.
Review actual video adherence through the normal gate and full watch/listen pass.

## Guarantees

- The prompt carries every format clause; `single_gen.py` lints it before any spend, and
  `check-cut.py` imports the same clause list, so a clause cannot be dropped silently.
- **Captions follow the edited picture.** An episode derives word timing from its finished
  assembly. A single-take recut measures words on the original take, aligns spelling to the
  approved script and moves only kept whole words through the same source-span map as the video
  and shot boundaries. Dropped speech is not captioned; moved or repeated spans move or repeat
  their captions. A boundary through a word stops finishing: widen the kept span and rebuild.
  Never reuse raw-take caption timestamps on an edited video.
- The gate measures the finished file: shot lengths, splices on real cuts, caption timing and
  safe zone, ambience floor per shot, loudness and true peak, every scripted line audible, and
  detail and black point. It prints what it can NOT assess (faces, comprehension, how it sounds)
  on every run. **Watch the cut end to end, and do not publish a FAIL.**

## Cost

A product-guess take is about **$3.64** (12 s at 720p, $0.3034/s); a 30 s episode is three takes, about
**$10.92**. Grading, re-cut, captions, looks and every gate are free. Staging prices move, so
price the first call of a run and quote from that.
Conversation prompt previews send no media call; no conversation media price is verified.

## Local finishing

The local finishing scripts use the current Python interpreter and carry `--run` into child commands. The default grade (`--strength 0`) needs no colour-reference file. A positive strength requires the real reference.

Set approved colours in `brand_layer.palette`: `accent`, `text`, and `background`, each `#RRGGBB` or three RGB integers. Optional `brand_layer.fonts` keys are `black`, `bold`, and `regular` (paths relative to the project). Without overrides, fonts resolve on macOS, Windows or Linux. End-card rows keep the approved 86px spacing and 66px type. Shrink only an individual line whose visible text cannot fit the safe area; shorten copy if that line still cannot fit. Transparent text-image padding does not set the line spacing.

The `subway` series bar stays visible through caption gaps. It is also in the caption-free control so the gate measures captions separately from persistent branding.

For a **new** prompt, use `generation.prompt_version: 3` (or `--prompt-version 3`). It keeps version 2's repairs (no duplicate articles, a top-edge rule for non-can packaging) and keeps the street in focus behind the people: never blurred and never bokeh (see REFERENCE #8). Version 3 is draft until a 720p take measures inside the real-footage detail band; its paid validation take needs its own approval. The bundled demo config stays on version 2 until then. The manifest records the version for the gate. Historical prompts default to version 1, and versions 1 and 2 retain their hashes. Use a new approved seed for a new prompt; do not overwrite an approved take.

### Single-take recuts

Check local finishing prerequisites **before buying a take**: ffmpeg/ffprobe, PIL, NumPy,
fonts, and local Whisper with its `base` model available. The existing episode transcription
helper can download an absent Whisper model; prepare it separately before spend. This fix does
not call another video or voice model. A reused take may supply previously measured original
word times instead of transcribing again.

Keep the original take and generation manifest. Measure its internal cuts, caption source spans
and a genuinely speech-free ambience window in `brand_layer`; these remain **source seconds**.
Remove dead air locally, then add the approved brand layer and end card:

```bash
python scripts/recut.py <original-take.mp4> <run>/working/interview-recut.mp4 --brand <slug>
python scripts/build_looks.py --brand <slug> --run <run> --looks <look> \
  --edit-map <run>/working/interview-recut.plan.json
python scripts/check-cut.py --brand <slug> --run <run> --look <look> \
  --edit-map <run>/working/interview-recut.plan.json --take <original-take.mp4> --falsify
# Repeat the same gate without --falsify, then watch and listen to the entire finished file.
```

`recut.py` emits the source-span `.plan.json` beside its edited output. `build_looks.py` consumes
that file, measures source words with the existing free local Whisper helper and saves
`interview-recut.plan.words.json`. To reuse saved timing, pass `--word-times <file>` to finishing
and the gate. Its JSON names the original `source` and contains ordered `[start, end, word]`
rows. It must come from actual source audio, not estimates from the script. Missing transcription
or incompatible timing stops finishing; there is no fallback to the original caption schedule.

Recut masters and caption-free controls have separate `-recut-` names. The original takes,
controls and episode outputs stay intact. Ambience is extracted from the measured quiet window
of the **original** source even if that window was dropped; only that WAV is looped. If the recut
already applied its continuous bed, finishing does not mix it a second time. The end card always
uses original room tone. The same mapped cuts clamp captions with a half-open end boundary so
one person's last words do not appear on the next shot's first frame.

`build.py` remains an intermediate grade-and-recut helper. To finish its already graded output,
use its printed map with `build_looks.py --pregraded`; do not grade it twice. A changed spoken
line, story, paid retry or generation count still needs its existing review and approval. Run the
normal finished-file gate and full watch/listen review; a synthetic timing test does not approve
faces or the original customer's ad.

Free regression checks:

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```

## Known limits

- **Seedance refuses some photoreal faces** (its likeness gate). Faces here come from the prompt,
  not a reference photo; see `REFERENCE.md`.
- A multi-take episode can't make three generations be the same corner. A scene-reference still
  from take A (`--scene-ref`) couples later takes to its mic, street and light. Check by eye.
- Ambience can differ between takes. The gate's check G fails a shot whose street bed sits
  within a few dB of the speech; that needs a re-take, not a mix.

## Provenance

Ported from goose-studio `skills/molecules/create-street-interview-video` on 2026-10-02,
including the episode-2 v3 fixes (hook caption, the mispronounced line, the silent end card).
The port changed only path resolution and routed the paid calls through the proxy.
`selftest.py` passes from an empty folder, and episode 2 v3 rebuilds identically
(11 shots, 22.64 s).
