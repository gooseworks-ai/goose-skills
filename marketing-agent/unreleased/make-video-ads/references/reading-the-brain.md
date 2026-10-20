# Reading the brain and the sibling artifacts — where things live

Load at Step 1 of make-video-ads. Sibling playbooks never call this one; they leave written artifacts, and this playbook reads them. Paths below are the conventions the sibling playbooks publish (2026-10-16); if a file is missing, say which input is missing and carry on without it.

**Workspace:** the brand's coworker workspace — `gooseworks:file_list` / `file_read` / `file_write` with `scope: {type: "agent", agent_id: <the brand's coworker_agent_id from the brand_read list>}`. No coworker → the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the human. Read before write (`file_write` replaces the file); in another playbook's file, only append under your own request lines.

## 1. Claims — the shared claims gate

The contract and the checks are `../../../skills/claims-gate/SKILL.md` (owner: learn-my-brand). In short:
- The marker is a `must` learning starting `Claims sign-off (learn-my-brand,` with status `signed-off`, `pending-client` or `not-signed`; a lean `brand_read` returns every `must` and `dont`.
- `signed-off` → only the `Claims you may use —` facts, verbatim (or a variant listed in the Brand record the marker names, read with `file_read`), in scope, before the review date, with the qualifier.
- Not approved: search snippets, kit `approvedClaims` / `proofPoints` / `valueProps`, `["claim"]` search rows, the live site, a yes in chat that did not go through the gate.
- No sign-off → the gate's **scoped sign-off** for the 3–5 lines this script needs; declined → plain product facts only.
- Always apply every `dont` and `must`.
- Video-specific: the engine's `buyer_brief.may_claim` and product-page efficacy wording in `product_facts` are candidates, not claims; a press quote must be about this product; `["claim"]` status fields only ever narrow a signed claim.

## 2. Customer words (research-market)

- Prefer `research/audience/voc-bank.jsonl` (one row per quote: `id` `V-NN`, `verbatim`, `about` brand / prospect / competitor / category, `type`, `theme`, `segment`, `vividness`, `contains_claim`, `testimonial_ok`, `personal_attribute`); else `voc-bank.md`, or the document "Voice-of-customer bank — <brand> — <date>" (`knowledge_search` `["document"]`).
- Hooks use rows with `contains_claim: false` and `personal_attribute: false` (vividness 3 first). Quote cards only from rows with `testimonial_ok: true` and `about: brand`. Cite `V-NN`.
- Second source: `knowledge_search` `["evidence"]` (the server's own captured evidence — often press quotes and site metrics, not customer words).

## 3. Angles (research-competitors)

- `research/competitors/angle-bank.md`, or the document found with `knowledge_search` `["document"]`, "angle bank". Angles carry ids `A-NN` with reason to buy, audience, driver, hook examples, format, evidence (which competitor, days running), proof needed and claim status. Its top angles may also be `insight` learnings.
- Carry the `A-NN` id into the video's name and the launch notes — analyze-performance writes results back against it.
- `kit.messagingAngles` is the server's own research, not the angle bank — use only as a labelled fallback.

## 4. Performance and requests (analyze-performance, run-paid-campaigns)

- Weekly read: latest `reports/performance/<YYYY-MM-DD>.md` — its "what to make next" table names make-video-ads items. Also `[learning YYYY-MM-DD]` facts in brand learnings.
- Requests from the ads side live in `ads/campaigns/<slug>/rotation-requests.md` as request lines: `Rotation needed: for make-video-ads · <angle, hook, formats, proof, live-by date> · return to: …` and `Fix needed: for make-video-ads · <ad, reason> · return to: …`. Open = no `… ready:` line under it. The full rejection reason is also on the health line of `ads/campaigns/<slug>/state.md`.
- Answer under each when delivered (re-read, insert, write the whole file back): `Rotation ready: <project ids> · ads/videos/<project_id>.md · <YYYY-MM-DD>` or `Fix ready: <project id> · ads/videos/<project_id>.md · <YYYY-MM-DD>`.
- Campaign brief, concepts and asset list: `gooseworks:campaign_read`.
- `gooseworks:meta_read` `view: "performance"` — Goose-made creatives only; `not_connected` when Meta is not linked → say "no performance data"; never call a video a winner without it.
- Past videos: `gooseworks:video_read` (brand list) — stage, kept/rejected, failures and stop reasons. Act only on `next_step`s about the project you are working on; a list read returns the newest draft's next step, which is not yours.

## 5. Inspiration, owned footage and references

- `gooseworks:social_inspiration_library` / `social_inspiration_search` — video outliers saved by research-market's listening (tag `research-market`; note = outlier multiple · hook · format · topic): which formats are carrying the category right now.
- `gooseworks:brand_read` `sections: ["organic"]` — the brand's own posts with views (and `media_asset_id`), and competitors' top posts. A high-performing owned video is the first candidate for a paid cut-down.
- Competitor video ads: `gooseworks:media_list` `tags: ["ad_library","competitor_ad"]`, kind `reference` — structure only, never footage.
- Creator footage rights: `creators/roster.csv` (brand coworker scope) and creator briefs record *proposed* rights only (its `deal_structure` is not a contract) — always ask the human whether paid-usage rights are signed.

## 6. What this playbook writes for others

- `ads/videos/<project_id>.md` (`gooseworks:file_write`), **one per video** (each kept hook variant gets its own): the video's name, angle (`A-NN` / angle type), hook family, the approved script, claim trace and cut list (with any lines for the human to take to learn-my-brand), people and disclosures, the **launch copy** the marketer chose (primary text, headline, description, CTA, destination — script-checked; replaced with the reason on a text-caused rejection), and **launch notes** — AI label to switch on, music to add in-platform, which hook is which. Read by run-paid-campaigns (launch) and analyze-performance (attribution).
- The video's `name`: `<product>_<a-nn or angle_type>_<hook_family>_<ratio>_<yyyy-mm-dd>` (lower-case) set on `video_create` or `video_change` (batch videos: `video_change` per project).
- `video_review` keep/reject with reasons and the human's note.
- Brand learnings only through `../../../skills/save-learning/SKILL.md` (the human's own words; text starting `[video YYYY-MM-DD]`). Not a learning per video.
