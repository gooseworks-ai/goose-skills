---
name: create-street-interview-video
description: Produce a 12-15s 9:16 street interview where strangers guess wrong about a product and the last one gets it right. ONE generation, not an assembled cut - one location, one light, one room tone, and the interviewer's question generated inside the clip. Brand layer (captions, title, end card) drawn locally so no model renders a letter. Built as a Goose Video recipe for DTC brands.
owner: apoorv
status: draft
version: 2
created: 2026-09-29
updated: 2026-09-29
---

# Human version

**Summary.** This is the historical street-interview development record, through 2026-10-01. It preserves successes, rejected takes and measured limitations. Some entries describe older single-take modes, proposed experiments and superseded defaults. Use the current `SKILL.md`, selected recipe and bundled [model notes](references/model-behaviors.md) for execution. Dated cost figures are not current credit estimates.

Private Studio/project paths, missing `references/REFERENCES.md`, original footage and `SYNC.md` below are optional authoring evidence. They are not customer prerequisites. Brand names, seeds and props describe those experiments; they must not become another brand's defaults.

---

# Agent version

# create-street-interview-video

**Current scope (2026-10-03).** This ledger preserves the paid product-guess findings below.
Its product prompt instructions and regression baseline remain unchanged. The separate
conversation path supports mic-only, prepared-sample and visible-task script/prompt previews;
all variants still refuse paid generation and reference-image bindings.

## Conversation preview authoring update

Read [street-script-writing](references/street-script-writing.md) for the current authoring
contract. Require a complete inspected **commercial street interaction**: full visual
timeline, complete spoken exchange, visible setup, participation reason, opening/hook,
product role and payoff. Seed snippets are leads; radio/editorial exchanges cannot fill
this gap. Record unseen recruitment or setup as unknown and label inferred explanations.

Write a coherent situation brief before dialogue, with an earned connection to a supported
product fact. Fixed camera/audio/native timing rules do not fix the premise, participant
role, visible task, hook, explanation, actions or payoff. A generic problem plus logo card
is insufficient. Do not add greeting/consent speech to an edited ad by default, invented
customer history, filler, arbitrary gimmicks or instant product efficacy.

Conversation previews can open with a participant answer or silent action/reaction.
`cfg.question` exactly mirrors the first actual interviewer question, performed once;
both people speak. Use 3–8 ordered shots, including silent action when needed, in 6–15s,
with at most 2.5 spoken words/s and space for actions. New `interaction` data records type,
visible setup, participation reason and optional props. Legacy configs remain mic-only.

Product-sample is an already prepared sample in a plain cup, with no exact package
reference. Mic-only may explain a service without a device. Concept-challenge uses only
described non-UI props. No conversation subtype supports phone, screen or UI demonstration,
product/scene-reference binding or validated media delivery. The legacy product-guess
rules below continue to apply only to that production branch.

## Purpose

The vox pop, as a repeatable recipe. Someone asks strangers a question about a product, they
guess wrong in an escalating way, and the last answer is the truth. It is the highest-reach
short-form format in this niche and the most dangerous to build, because it needs believable
human faces.

Read the bundled [model notes](references/model-behaviors.md) and current `SKILL.md` before generating. This format does not require an avatar still. `READINESS.md` records the 2026-09-29 assessment; its then-unruled face question was superseded by the 2026-10-01 observation in Status below. That later success does not certify a new take. `TAKES.md` explains how to record this project's successes, rejections, limitations and seeds. Missing private measurements and sibling molecules are optional authoring context.

NOT the right molecule for: a single talking head to camera (`create-avatar-reel`), a product
demo (`product-video/`), or anything where the faces must be a specific real person.

## Where the rest of this record lives

The record was one 63 KB file. It is now split by topic; nothing was dropped.

| Part | What it holds |
|---|---|
| [Format rules](references/reference-format-rules.md) | Critical knowledge ### 1-16: the format's headline rules |
| [Pipeline, looks, cost, quality checks](references/reference-pipeline.md) | The stage list (paid vs free), the five looks, cost, and the quality checks |
| [Findings ledger, items 1-23](references/reference-ledger-items-01-23.md) | The first numbered findings list |
| [Findings ledger, items 17-28](references/reference-ledger-items-17-28.md) | The second list (it restarts at 17, so 17-23 appear twice) |
| [Findings ledger, items 29-42](references/reference-ledger-items-29-42.md) | The latest findings, including the opt-in grammar items 37-42 |

A reference such as "item 31" or "Critical knowledge 24" means the numbered findings list:
items 24-28 are in the 17-28 part, 29-42 in the 29-42 part. For 17-23, read both lists.

## Status

The single-generation take **`gw-single-seed4815`** is the current base: `brands/grimwater.json`
and `selftest.py`'s stored sha256 are both built on it, and it is what the five looks are rendered
from. This paragraph said `gw-single-seed4802` until 2026-09-30 -- 4802 was the base when it was
written and was superseded by the 4803-to-4815 realism pass, so anyone reading it went looking for
the wrong file. Per the repo's lock rule the base is never re-rolled to fix one element; a change
means a new variant with its own seed, recorded in `TAKES.md` (and, in full, in
`projects/street-interview/TAKES.md`).

**THE FACES PASSED, 2026-10-01.** The user watched seed 4816 and said "the faces look fine",
then authorised a longer episode on the strength of it. That closes a question that had been
open through five rejections and it changes what this format is allowed to do: **do not reopen
the Arcads licensing route (~1,000 licensed actors, paid per video) as though faces are blocking,
and do not build a stills-then-animate pipeline.** Every one of the five rejected rounds
animated a still; the single-generation reference-to-video route is the one that passed. What
remains wrong is objects and framing, never faces.

**The shipped episode is `episode-gw-ep2fix-v2-seed4820-4834-4835`**, 27.8s, published to the
staging sample library on 2026-10-01 as `gooseworks-street-interview-grimwater-ep2` with its
recipe attached. Take A is seed 4820, kept frame for frame because the user approved its mic,
cast, grading and naturalness; takes B and C are seeds 4834 and 4835, generated against a
face-cropped still of take A so they inherit its microphone, street and light. That repair cost
two takes against three for a full rebuild, and it is the pattern to follow: **fix the take the
user approved, do not replace it.** Three earlier episodes were built and rejected because that
was not done.

## Sync

Studio-authored. Needs back-porting to the lab or it is silently overwritten on the next
promote. `SYNC.md` was a private authoring ledger, not a customer prerequisite; publish package updates through the current source PR workflow.
