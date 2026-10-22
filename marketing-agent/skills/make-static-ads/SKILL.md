---
name: make-static-ads
description: >-
  Make new static image ads, a fresh batch, more ads, a winner's variations, copy variants or a rejected ad fix. Research the brand and its existing ads, compare sourced concepts and visual ideas, compose, quote, render and review through GooseWorks. Also handles requested branded header/social graphics. Use for static ad creation rather than goose-ads. Not for video, product photos or launching campaigns.
version: 0.5.3
---

# make-static-ads

Choose the ideas before paying to draw them. A concept is a persona, a reason to buy and its proof; an ad is one execution. A reference can contribute layout, mechanism or craft. The product and customer situation supply the meaning.

## What you get

Reviewed images and ad copy, with the sources, selection decisions, coverage limits and exact render trace in one batch record. Agent review is separate from the marketer's preference or launch decision.

## Before you start

Discover the live GooseWorks tools. Refresh a stale connector catalog once; an existing authorized transport may call the same server's live schemas. A missing `ads_render` stops generation: `ads_generate` runs another composer and is not a substitute. No connection → ask to connect GooseWorks.

Use the server's actual setup state. Complete factual onboarding/brand prerequisites, rights, claim restrictions and spend approvals. An already selected brand/task does not need another creative picker. The fetched playbook owns research, creative planning and its gates; generic next-step suggestions about speed or one plan do not replace those steps. The server's execution/polling/publishing prerequisites remain binding. Unresolved contradictory setup → report the block.

Read the brand, product, saved rules and research status; generation requires complete brand research and usable official product imagery. A physical product without real photos stops at concepts/copy. Preserve exact product identity and every applicable must/dont rule. Other brands' references stay text-only; direct competitors lend layout only. A card/setup completion or input hash never certifies research or quality.

Short answers (“your choice,” “one ad,” “finals only”) delegate choices and shorten display. They retain the work below. Reuse this conversation's valid reads and settings; add every earlier ad to history and continue palette rotation.

Load `run-memory` (`../run-memory/SKILL.md`) at the start of every run, including copy/fix/graphic work. Read the previous record and check each open recommendation against actual changes and outcomes using the atom’s status/verdict rules and sources. A missing record is an honest first run; unreadable history is a named gap. Never infer an outcome from silence.

## Steps

### 1. Research and record

For fresh/more ads, read `references/workflow.md` through its selection sections and use one run.json. It is the upstream record for the next steps, not a second report. `references/engine-notes.md` gives small exact reads; `references/reading-the-brain.md` gives paths only when a needed record is missing. Check the brand/customer sources, own live/saved ads, history and applicable platform scope with bounded samples. Record actual counts/date/limits; absent imports do not prove zero live ads.

**Done:** coverage and cited evidence are recorded, or named unavailable. Ask only unresolved choices: product/placements/count, logo/palette/font, template choice and any needed offer/claim clarification. Suggest answers based on the evidence. Read `references/fonts-and-color.md` only for a font/palette choice beyond the kit; actual kit fonts may differ from a mapped guess.

### 2. Compare and select

Run the `make-static-ads-concept-grid` skill (`../make-static-ads-concept-grid/SKILL.md`), then `make-static-ads-find-references` (`../make-static-ads-find-references/SKILL.md`) and `make-static-ads-ad-copy` (`../make-static-ads-ad-copy/SKILL.md`) into that same record. Draft sourced reasons and ranked hooks, score the promise/proof/persona gate, and compare competing visible meanings for every fresh/more request, including an ordinary request for five ads. Label inferred audiences and imagined scenes as hypotheses; they do not waive purchase-reason evidence or proof. Source breadth is the critic’s provenance judgment under concept-grid, not a count of source labels. Fix/drop failures; insufficient grounded reasons → research or a smaller justified set.

Give a fresh critic the request, evidence, alternatives and whole set before compose; use the concept-grid’s validity and creative-strength review and record specific findings and resolutions. Without delegation, get a real human critique of that evidence and alternatives or stop at selection; self-review cannot clear this gate. **Done:** the upstream check described in `scripts/README.md` is ready or honestly partial with an evidence-based proceed-with-limits decision; blocked means no compose/quote. The checker verifies recorded work and consistency, not truth or creativity.

### 3. Compose, then check the exact result

Run `make-static-ads-compose` (`../make-static-ads-compose/SKILL.md`). Link each ad.json to the selected run row. Prepare complete bounded input, read every returned part, then author the answer. The finalizer checks the run/selected direction/input and retains exact copy and the protected decision.

Run `make-static-ads-claims-extract` (`../make-static-ads-claims-extract/SKILL.md`) Pass A and `ad-policy-check` (`../ad-policy-check/SKILL.md`) against exact final prompts/images. Cut → recompose/review. An inaccessible current-policy source stays unverified; `references/workflow.md` defines the narrow explicitly authorized unpublished-draft exception and launch hold. **Done:** the run, final output and claims/policy review match; the reviewed-quote operation in `scripts/README.md` emits only dry-run requests. Shell-free hosts apply the same record checks directly and name that path.

### 4. Quote and render

Get every live `ads_render` dry-run quote. Show the chosen concepts/reference picks, coverage limits, cut lines and returned prices. Warn that one redo per image may be needed at the same price. The `spend-gate` skill (`../spend-gate/SKILL.md`) applies: render only the exact quotes and scope/ceiling the marketer approved. An explicit total ceiling wins over retry permission.

Submit exact quoted requests and poll `job_get` kind ads_batch until pending is0. A failed job needs another quote/approval within authorized scope before resubmission. **Done:** jobs complete or failure reported; no generator substitution.

### 5. Review pixels and the set

Run `make-static-ads-render-review` (`../make-static-ads-render-review/SKILL.md`). Use a newly isolated blind judge with only assembled per-ad judge instructions/rubric, official reference images and the output. A reused code reviewer with task history is separate review, not blind review. Then check drawn claims, hook/concept retention and set diversity. Distinct scenes do not prove strong ideas or researched reasons. Unseen images remain unjudged.

One quoted retry within the ceiling; a compatible isolated label defect may use the bounded official-pixel repair and a full new review. Exhausted ceiling/incompatible repair → stop and keep the failure explicit. **Done:** each render passed, needs review, or dropped with reasons; no fabricated human rating.

### 6. Deliver and remember

Use `references/handoff-format.md` for the final table and `references/reading-the-brain.md` §7 for the batch fields. Save run/selection/compose/claims/pixel verdicts, exact prompts and ordered inputs, IDs and provenance. Carry any unverified-policy status and launch hold into delivery and run-memory; draft approval never clears launch. Read-merge-write lower-case tags, including made-by:make-static-ads. Preserve raw failures and repair lineage. Re-read product price/eligibility before delivery.

Ask which ads the marketer prefers. Offer `make-static-ads-copy-variants` (`../make-static-ads-copy-variants/SKILL.md`) for chosen images; each paid variant has its own applicable approval. Save lasting human feedback through `save-learning` (`../save-learning/SKILL.md`), not agent judgments. **Done:** the batch and creative links are delivered with honest limits; publishing is a separate human decision.

## Other modes

| Request | Path |
|---|---|
| Iterate a winner / rotation | Keep its supported reason/proof; change the named lever. Link the approved parent/request as run basis. Rotation exhausted → fresh reasons and the full fresh selection. |
| Same image, different text/font | `make-static-ads-copy-variants`; preserve the parent and new exact copy, claims/policy review and quote. No fresh-reason tournament. |
| Rejected ad | `make-static-ads-fix-rejected` (`../make-static-ads-fix-rejected/SKILL.md`); fix the violating element and verify both checks, retaining the rejection source. |
| Header/social graphic request | `make-static-ads-graphic-request` (`../make-static-ads-graphic-request/SKILL.md`); record requested purpose/exact text and source basis. Do not invent a sales concept requirement. |
| Price/stock change | List affected delivered ads with pause flags. Re-read the source; remakes need exact copy checks and new quotes. |

## Approval gates

Rights and claims evidence before public copy; marketer approval of exact live quotes/ceiling before paid work; human words only for preference/ratings/launch. Named partial coverage never waives these gates. No paid research without its own authorization.

## Output and write-back

One batch record with run decisions and evidence, registered references and tagged creative versions. Agent judge results belong in the record/tags; feedback is the human's channel. Run the mandatory End step of `run-memory` (`../run-memory/SKILL.md`) on every exit, including a block or partial run. Save outcomes, unresolved recommendations and next checks, carrying forward unknowns. A failed save remains explicit; do not claim the record was saved.

## Done when

The selected ideas have source-backed reasons/proof, explicitly researched or hypothetical personas, compared alternatives, resolved gate findings and honest coverage; composed copy matches that selection; exact quotes and budget were respected; final pixels and set were reviewed under the stated setup; failures and limitations remain visible. Receipts and passing tests alone do not establish those judgments.

## Out of scope

Video, product photography, campaign launches and performance conclusions. Offer the matching specialist when requested; this skill neither publishes nor proves an ad will perform.
