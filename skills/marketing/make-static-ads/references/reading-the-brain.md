# Reading the brain and the sibling artifacts — where things live

Sibling playbooks never call this one; they leave written artifacts, and this playbook reads them. Paths below are the conventions the sibling playbooks publish (2026-10-16); if a file is missing, say which input is missing and carry on without it.

**Workspace:** `gooseworks:file_list` / `file_read` / `file_write` with the scope and file rules of the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §2. Many artifacts are also imported into brand knowledge as documents, so `knowledge_search` `["document"]` finds them on hosts that never open the workspace.

## 1. The brand brain

**Claims:** only through the `claims-gate` skill §1 (`../../claims-gate/SKILL.md`), loaded once at Step 1. Never read claim statuses from the brain yourself.

For everything else, read free at Step 1:
- `gooseworks:brand_knowledge_browse` (`brand_id`) first: the brand's core rules and the parts of its brain.
- `gooseworks:brand_knowledge_search` (`product_id`, `limit` ≤ 25) for the product's facts, offers, reviews and the founder story as the concepts need them.
- `gooseworks:brand_knowledge_read` on a record the search result cuts short.
- A press quote must name or clearly describe this product.

## 2. Customer words (research-audience)

- Prefer `research/audience/voc-bank.jsonl` (one row per quote: `id` `V-NN`, `verbatim`, `about` brand / prospect / competitor / category, `type`, `theme`, `segment`, `vividness`, `contains_claim`, `testimonial_ok`, `personal_attribute`); else `voc-bank.md`, or the document "Voice-of-customer bank — <brand> — <date>" (`gooseworks:knowledge_search` `["document"]`).
- Hooks use rows with `contains_claim: false` and `personal_attribute: false` (vividness 3 first) — a `personal_attribute` row is buyer language only and must be rephrased. Quote cards only from rows with `testimonial_ok: true` and `about: brand`. Cite `V-NN` as the hook source.
- Second source: `knowledge_search` `["evidence"]` (the server's own captured evidence — often press quotes and site metrics, not customer words).

## 3. Angles (research-competitors)

- `research/competitors/angle-bank.md`, or the document found with `knowledge_search` `["document"]`, "angle bank". Angles carry ids `A-NN` with reason to buy, audience, driver, hook examples, format, evidence (which competitor, days running), proof needed and claim status. Its top angles may also be `insight` learnings.
- Carry the `A-NN` id through the grid, the tags (lower-case: `angle:a-07`) and the batch file — results are written back against it.
- `kit.messagingAngles` is the server's own research, not the angle bank — use only as a labelled fallback.

## 4. Performance and requests (analyze-performance, run-paid-campaigns)

- Weekly read: latest `reports/performance/<YYYY-MM-DD>.md` — its "what to make next" table names make-static-ads items. Also `[learning YYYY-MM-DD]` facts in brand learnings.
- Requests from the ads side live in `ads/campaigns/<slug>/rotation-requests.md` as request lines: `Rotation needed: for make-static-ads · <angle, hook, formats, proof, live-by date> · return to: …` and `Fix needed: for make-static-ads · <ad, reason> · return to: …`. Open = no `… ready:` line under it. Take the fatigue or rejection reason from the line (`meta_read` returns no frequency); the full rejection reason is also on the health line of `ads/campaigns/<slug>/state.md`.
- Answer under each request when delivered (re-read, insert, write the whole file back): `Rotation ready: <creative ids> · ads/batches/<file> · <YYYY-MM-DD>` or `Fix ready: <creative id> · ads/batches/<file> · <YYYY-MM-DD>`. A request that turns out to be for a video ad → leave it for the video maker and say so.
- Campaign brief, concepts and asset list: `gooseworks:campaign_read` — input only; this playbook never generates through the campaign.
- `gooseworks:meta_read` `view: "performance"` — Goose-made creatives only; `not_connected` when Meta is not linked.

## 5. Inspiration and references

- `gooseworks:social_inspiration_library` / `gooseworks:social_inspiration_search` — outliers saved by research-market's listening (tag `research-market`; note = outlier multiple · hook · format · topic).
- Competitor statics: `ads_template_read` `mode: "competitor"` (`ad_started_at`, `ad_ended_at` = last scrape date for running ads). Own past ads: `mode: "mine"`.
- Kept product photos: `gooseworks:photos_read` `status: "approved"` with the `product_id` (they also appear in the product record).

## 6. Graphic requests (side door)

Where request lines live and how to answer them: the `make-static-ads-graphic-request` skill (`../../make-static-ads-graphic-request/SKILL.md`), Request lines.

## 7. What this playbook writes for others

- `ads/batches/<YYYY-MM-DD>-<slug>.md` (`gooseworks:file_write`), next to the working folder `ads/batches/<YYYY-MM-DD>-<slug>/` (`profile.md`, `board.md`, prompts). Per ad: creative id and render id per ratio, placements, on-image text as drawn, primary text A and B, link headline, description, CTA, destination, angle (`A-NN`) and type, the concept id (`<yyyymmdd>-c<n>`), the board row (angle, message and its source, visual idea, style, template id, level, protected choice), hook source, stage, font, palette, logo choice, the final prompt and image list per ratio, what was read for the board, the judge result per try and who judged, copy variants under their parent, claims line, policy line, special-ad-category flag, and `picked` once the human chooses. Then: the test question, the recommended test structure with the stated budget, the cut list with restore-proof, flags. The launch takes its copy from here verbatim (the server stores no copy on creatives).
- No product imagery request line: when a physical product has no usable photos, the marketer gives real ones or the goose-product-photos skill makes them first (SKILL.md).
- Lower-case creative tags and the human's picks in GooseWorks (`handoff-format.md` §1).
- Brand learnings only through the `save-learning` skill (`../../save-learning/SKILL.md`).
