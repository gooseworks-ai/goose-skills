# Reading the brain and the sibling artifacts — where things live

Sibling playbooks never call this one; they leave written artifacts, and this playbook reads them. Paths below are the conventions the sibling playbooks publish (2026-10-16); if a file is missing, say which input is missing and carry on without it.

**Workspace:** the brand's coworker workspace — `gooseworks:file_list` / `file_read` / `file_write` with `scope: {type: "agent", agent_id: <the brand's coworker_agent_id from the brand_read list>}`. No coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human. Read before write (`file_write` replaces the file); in another playbook's file, only append under your own request lines. Many artifacts are also imported into brand knowledge as documents, so `knowledge_search` `["document"]` finds them on hosts that never open the workspace.

## 1. The brand brain — facts and their statuses

The rule is `claims-and-policy.md` §2 (hard rule 1). Read once at Step 1, free:
- `gooseworks:brain_map` (`brand_id`) first — the brand's core rules and the parts of its brain.
- `gooseworks:brain_search` for this product's claims and proof (`product_id`, `source_types: ["claim","brand_kit","fact","product"]`), and again for offers, reviews and the founder story as the concepts need them. Each result carries a status: `confirmed`, `found`, `guess`, `unknown` (or `not_needed`) and its source.
- `gooseworks:brain_open` on a record whose wording or source the search result cuts short — the claim is used as recorded, so read it whole.
- Write the claims part of the state note: each fact, its status, its source (brand website, kit, product record, press, review) and its qualifier.
- `confirmed` → usable; `found` on the brand's website, kit or product record → usable; `found` in press or reviews → only as a quoted, attributed line; `guess`, `unknown` → not usable, listed with what would confirm it.
- A server without the brain tools: the kit's proof points and value props and the product record count as `found`; nothing else is a claim source.
- Always apply every `dont` and `must` learning (a lean `brand_read` returns them all).
- Static-specific: a press quote must name or clearly describe this product.

## 2. Customer words (research-market)

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

Requests arrive as `Graphic needed: for make-static-ads · <purpose, placement, exact text> · return to: <path>` lines (open = no `Graphic ready:` line under it), in:
- email-lifecycle's `lifecycle/flows/<flow-slug>.md` (header art for a flow message);
- run-organic-social's `social/calendar/<start-date>.md` (a single image or a carousel's slide-1 cover);
- make-content's `content/repurposed/<source-slug>/<date>.md` and `content/drafts/<date>-<slug>.md`.
Older files may still carry a `Header art needed:` line or a plain asset line naming this side door — treat it the same way.
Answer under the request (re-read the file, insert, write it all back): `Graphic ready: <link> · <YYYY-MM-DD> · alt: <text> · <ratio> · claims: <ok / cut …>`. The requester reads it on its next run.

## 7. What this playbook writes for others

- `ads/batches/<YYYY-MM-DD>-<slug>.md` (`gooseworks:file_write`). Per ad: creative id and render id per ratio, placements, on-image text as drawn, primary text A and B, headline, description, CTA, destination, angle (`A-NN`) and type, the concept id (`c1…`), the concept row (persona, reason to buy, proof with its brain status, emotion, framework, visual style), hook source, stage, the template (template id, advertiser and Ad Library link, structure-only yes/no), font, palette, logo choice, the User instructions and the Variant brief, the final prompt and image list per ratio, the judge result per try, copy variants under their parent, claims line, policy line, special-ad-category flag, and `picked` once the human chooses. Then: the test question, the recommended test structure with the stated budget, the cut list with restore-proof, flags. The launch takes its copy from here verbatim (the server stores no copy on creatives).
- No product imagery request line: when a physical product has no usable photos, the marketer gives real ones or the goose-product-photos skill makes them first (SKILL.md).
- Lower-case creative tags and the human's picks in GooseWorks (`handoff-format.md` §2).
- Brand learnings only through the `save-learning` skill (`../../save-learning/SKILL.md`).
