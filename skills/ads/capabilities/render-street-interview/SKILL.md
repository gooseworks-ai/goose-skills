---
name: render-street-interview
description: Build a vox-pop street interview video ad. An interviewer with a handheld mic asks passers-by one question about the brand's product, they give blunt wrong guesses, one gives the real answer, and the cut lands on a branded end card. Generates the takes through the GooseWorks fal proxy (Seedance 2.0 with native voice), then grades, re-cuts, captions and gates them locally. Use for the street-interview format.
status: draft
---

# render-street-interview

The renderer for the **street-interview** video ad format (goose-studio recipe
`one-shot-videos/create-street-interview-video`). A handheld interviewer stops people on one
street corner and asks one question. A few guess wrong, one gets it right, and the cut ends on the
brand's own line. The people are generated; everything after the takes is free and local.

`REFERENCE.md` holds the format's full history: every numbered **Critical knowledge** entry and
the rejected takes behind it. Read it before changing the prompt scaffold or a gate.

## Run

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

- **A brand is data:** `brands/<slug>.json` holds the product and its reference photo, the
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

A take is about **$3.64** (12 s at 720p, $0.3034/s); a 30 s episode is three takes, about
**$10.92**. Grading, re-cut, captions, looks and every gate are free. Staging prices move, so
price the first call of a run and quote from that.

## Local finishing

The local finishing scripts use the current Python interpreter and carry `--run` into child commands. The default grade (`--strength 0`) needs no colour-reference file. A positive strength requires the real reference.

Set approved colours in `brand_layer.palette`: `accent`, `text`, and `background`, each `#RRGGBB` or three RGB integers. Optional `brand_layer.fonts` keys are `black`, `bold`, and `regular` (paths relative to the project). Without overrides, fonts resolve on macOS, Windows or Linux. End-card rows shrink together to fit the safe area; shorten copy if it cannot fit.

The `subway` series bar stays visible through caption gaps. It is also in the caption-free control so the gate measures captions separately from persistent branding.

For a **new** prompt, `generation.prompt_version: 2` (or `--prompt-version 2`) repairs duplicate articles and uses a top-edge rule for non-can packaging. The manifest records the version for the gate. Historical prompts default to version 1 and retain their hashes. Use a new approved seed for a new prompt; do not overwrite an approved take.

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
