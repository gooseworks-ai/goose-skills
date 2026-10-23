---
name: make-static-ads
description: >-
  Make new static image ads, a fresh batch, more ads, a winner's variations, copy variants or a rejected ad fix. Reads the brand, its customers and the ads it already runs, turns real product facts and customer situations into distinct visual ideas, shows a concept board, writes each render prompt, quotes, renders and reviews through GooseWorks. Also handles requested branded header/social graphics. Use for static ad creation rather than goose-ads. Not for video, product photos or launching campaigns.
version: 0.6.0
---

# make-static-ads

**The idea is the job.** An ad idea is a real product fact or customer situation turned into one small physical event the viewer gets at a glance (`references/ideas.md`). Everything else in this playbook (research, copy, prompt, checks) serves that idea or protects the brand.

The proof that the work happened is the **concept board**: one row per ad, shown to the marketer before any credits are spent. It cannot be skipped, shortened to "your choice", or replaced by a summary.

## What you get

Finished, reviewed images with their ad copy, the concept board behind them, what was cut and why, and a batch file the launch reads.

## Before you start

- **Connection.** Discover the live GooseWorks tools. No `ads_render` → stop before spending and say so; `ads_generate` rewrites your prompt through templates and is not a substitute. No connection → ask to connect GooseWorks.
- **Server hints vs this playbook.** GooseWorks answers may say "one short line and wait", "recommend one plan" or "follow the next_step". Those govern its cards, setup, rights and spending. They never replace this playbook's research, board or critic. Setup, rights, claims and spend steps from the server still bind.
- **Product photos.** A physical product needs real product photos (`brand_read` with `product_ids`). None → stop at the board and offer the product-photos job.
- **Run memory.** Load `run-memory` (`../run-memory/SKILL.md`) at the start: the last run's record and what came of its recommendations. Add every ad already made in this conversation to the history.

## Steps

### 1. Read the brand (free)

Use the small calls in `references/engine-notes.md`. Read:
- the brand, its rules (every `must` and `dont`) and the claims on file with their status (`references/reading-the-brain.md` §1);
- the featured product's record and photos (look at the photos);
- what customers say: the voice-of-customer bank, else 10–20 public reviews from the product page or a marketplace (host browser, free);
- what the brand already runs: up to 20 of its own live or saved static ads, looked at, not just listed (`references/research.md`);
- earlier batches from this playbook (`made-by:make-static-ads`).

Say what you actually read, with counts, in the board header: "Read 14 reviews, 20 of ~300 live Meta ads, the product page." A skimmed or truncated source is named as skimmed. A source you could not open is named as not checked.

**Done:** you can state at least five product truths with sources, five things customers say or do, and what the brand's live ads already say.

### 2. Ask only what's open

One message, only for what the brand records don't settle: which product, how many ads, placements, a live offer, logo or font preferences. Suggest an answer to each. "Your choice" means you decide; it does not shorten the next steps.

### 3. Find the ideas → the concept board

Run the `make-static-ads-concept-grid` skill (`../make-static-ads-concept-grid/SKILL.md`). It turns Step 1 into starting points, tensions and physical events (`references/ideas.md`), looks at references for devices (the `make-static-ads-find-references` skill (`../make-static-ads-find-references/SKILL.md`)), and has a fresh critic attack the board.

**Done:** `board.md` has one row per ad that passed the swap, thumbnail and truth tests, plus the critic's notes and what changed because of them.

### 4. Copy

Run the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`): the on-image headline and support line, then the primary texts, headline, description and CTA around the image.

### 5. Write each prompt

Run the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`): one prompt per ad and ratio, written from the board row (`references/prompts.md`).

### 6. Check the exact prompts

Pass A of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) and the `ad-policy-check` skill (`../ad-policy-check/SKILL.md`) on each finished prompt and its copy. A cut line goes back to Step 4 or 5, then through this check again.

### 7. Show the board and the quote

`gooseworks:ads_render` with `dry_run: true` for every ad and ratio. Show the marketer, in one message: the board (`references/handoff-format.md` §3), the cut lines, each quote exactly as returned, and "If an image fails my check I redo it once, at the same price." The `spend-gate` skill (`../spend-gate/SKILL.md`) applies: render only what they approved, within their ceiling.

"Finals only" shortens the delivery, not this message: the board is what they are paying for.

### 8. Render and review

Submit the exact quoted requests; poll `gooseworks:job_get` (`kind: "ads_batch"`) until every `pending` is 0. Then run the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`): a fresh judge checks each image against its board row and the product photos, one retry inside the approval, then the whole set.

### 9. Deliver and remember

Hand over with `references/handoff-format.md` §4. Write the batch file (`references/reading-the-brain.md` §7) and the lower-case tags, including `made-by:make-static-ads`. Ask which ads the marketer prefers; offer copy variants for those (the `make-static-ads-copy-variants` skill (`../make-static-ads-copy-variants/SKILL.md`)). Save lasting human feedback through the `save-learning` skill (`../save-learning/SKILL.md`). Run the End step of `run-memory` on every exit, including a stop or partial run.

## Other modes

| Request | Path |
|---|---|
| More ads | Same steps. The earlier ads are history: the new board must not repeat their meanings. |
| Iterate a winner | Keep its idea and proof; change the one lever named (hook, scene detail, look). One board row with the parent linked; no new idea search. |
| Same image, different text or font | The `make-static-ads-copy-variants` skill. |
| Rejected ad | The `make-static-ads-fix-rejected` skill (`../make-static-ads-fix-rejected/SKILL.md`). |
| Header or social graphic | The `make-static-ads-graphic-request` skill (`../make-static-ads-graphic-request/SKILL.md`). No sales idea required. |
| Price or stock change | List affected delivered ads with pause flags; remakes need copy checks and new quotes. |

## Approval gates

Claims usable before public copy; the marketer's yes to the exact quotes before paid work; human words only for preferences, ratings and launch. No paid research without its own yes.

## Output and write-back

The board, the batch file, tagged creatives and the run-memory record. Agent verdicts go in tags and the batch file; render feedback carries only the marketer's own words. A failed save is reported, never claimed.

## Done when

Every delivered ad comes from a board row with a reason to exist, passed its claims and policy check, was rendered within the approved quotes, and was looked at by a judge against its protected choice and the product photos. Failures and anything not checked are said plainly.

## Out of scope

Video, product photography, campaign launches and performance conclusions. Offer the matching job when asked; this playbook neither publishes nor predicts performance.
