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

| Interaction | Current support |
| --- | --- |
| `product-guess` | Existing object renderer; standalone product reference required |
| `mic-only` | Conversation preview; service explanation without a product or device |
| `product-sample` | Conversation preview; prepared sample in a plain cup, no exact package reference |
| `concept-challenge` | Conversation preview; described visible task using non-UI props |

Use [[composes::write-video-ad-script]] with the scoped angle bank, current facts and
selected complete commercial street interactions. `scripts/prepare_script_context.py`
requires a brief with `offering_type=physical|service|digital` and
`interaction_type=product-guess|mic-only|product-sample|concept-challenge`. Inspect the full
visual timeline and spoken exchange: setup, participation reason, hook, product role and
payoff. Record unseen recruitment or setup as unknown; inference is not observation.
Seed snippets are leads. Radio and editorial exchanges cannot fill a street-ad gap.
Keep private observations project-scoped and transfer mechanics, not source-brand claims.

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

`REFERENCE.md` holds the format's full history: every numbered **Critical knowledge** entry and
the rejected takes behind it. Read it before changing the prompt scaffold or a gate.

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

## Guarantees

- The prompt carries every format clause; `single_gen.py` lints it before any spend, and
  `check-cut.py` imports the same clause list, so a clause cannot be dropped silently.
- **Captions are derived, never authored:** timing comes from Whisper on the finished render,
  spelling from the script. A scripted word Whisper skips or mishears inside a sentence is
  restored. Lines whose shots were dropped leave the caption script.
- The gate measures the finished file: shot lengths, splices on real cuts, caption timing and
  safe zone, ambience floor per shot, loudness and true peak, every scripted line audible, and
  detail and black point. It prints what it can NOT assess (faces, comprehension, how it sounds)
  on every run. **Watch the cut end to end, and do not publish a FAIL.**

## Cost

A product-guess take is about **$3.64** (12 s at 720p, $0.3034/s); a 30 s episode is three takes, about
**$10.92**. Grading, re-cut, captions, looks and every gate are free. Staging prices move, so
price the first call of a run and quote from that.
Conversation prompt previews send no media call; no conversation media price is verified.

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
