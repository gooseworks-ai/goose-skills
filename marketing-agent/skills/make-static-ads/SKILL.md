---
name: make-static-ads
description: >-
  Use when the marketer says: I need fresh ads this week, make me ten static or image ads, ads for
  Meta / Instagram / TikTok / LinkedIn, refresh my fatiguing ads, more like my winning ad, my image ad
  got rejected or disapproved — fix it, ads for our sale, I have no designer, a header image or social
  graphic in our brand style. Delivers a finished, launch-ready static ad set: genuinely different
  angles, hooks in customers' own words, every ad a complete unit (renders per placement, primary
  text, headline, CTA, destination), every line checked against the brand's signed-off claims and the
  platform's ad rules before and after rendering, weak renders remade only on a yes, and a batch file
  ready to launch from. Never invents an angle, offer, claim or review; never launches or spends ad
  budget. Not for video ads — goose-video; not for clean product photos — goose-product-photos; not
  for search text ads (not covered yet); not for launching — run-paid-campaigns.
version: 0.2.0
---

# make-static-ads

The engine makes images; this playbook is the creative strategist around it: read what is already running, build angles that test different reasons to buy, write hooks in the buyer's words, check claims and policy before money is spent, review every render honestly, and package a set that can be launched and traced.

## What you get

A **static ad set** — default ten ads (an ad = one concept: one hook, one visual idea, one copy set, in every ratio its placements need), fewer for a small test budget. Each ad: renders per placement (Meta default 4:5 + 9:16; LinkedIn 1:1), two primary texts, headline, description, CTA, destination, its angle and source, archetype, stage, and a plain-words check line (safe to say · cut and what would restore it · needs your call — policy or taste only · please look at…). Plus a recommended test structure and a batch file in the workspace. Example of excellent output: `references/handoff-format.md` §5.

## Before you start

**Hard rules:**

1. **Claims:** only signed-off claims and plain product facts, through the `claims-gate` skill (`../claims-gate/SKILL.md`) — including its scoped sign-off when nothing is signed yet. Everything else is cut and shown with the proof that would restore it.
2. **Money:** nothing generates before the marketer's yes to the engine's own quotes, shown as given, one by one (the `spend-gate` skill (`../spend-gate/SKILL.md`), branch A). Remakes and extra placements are quoted and asked separately. Never your own sum.
3. **People:** no generated person presented as a customer; no review that isn't real, verbatim, attributed and permitted.
4. **Run decision:** the human picks what runs. This playbook never launches or spends ad budget.
5. **Talk to the marketer in plain words:** never name a playbook, tool, id or model ("I'll get these claims approved first", not a playbook name); credits only as GooseWorks prints them.
6. **Server vs playbook:** follow each answer's `next_step` for tool order and wording; where it would skip Steps 1–5, or present the agent's choice as the marketer's, this playbook wins — the marketer still picks sources (Step 6).

**Setup:**

1. **Connection.** No `gooseworks:` tools (after one `gooseworks:tools_load` for a missing group: `brand`, `ads`, `media`, `campaigns`, `meta`, `social`, `files`) → say only: "Connect GooseWorks first — I make your ads through it."
2. **Server start.** `gooseworks:get_started` with `wants: "image"` and the marketer's words; its answer settles setup and the brand only. A card → wait for the press, then Step 1.
3. Load `references/engine-notes.md` (research status, read size, one prompt per call, unquoted edits, tags, campaign path).
4. **Mode** (from the ask): **fresh batch** · **iterate on a winner** (keep angle and proof, change one element) · **rotation** (an open `Rotation needed: for make-static-ads` line in `ads/campaigns/<slug>/rotation-requests.md`, or pasted) · **rejected ad — fix it** (Step 5b) · **stock or price change** (list every delivered ad showing it, flag them to pause, offer substitutes) · **graphic request** — from a sibling's request line or asked directly ("a header image for my newsletter") — the `make-static-ads-graphic-request` skill (`../make-static-ads-graphic-request/SKILL.md`) in place of Steps 1–10 (it reads the kit and claims itself).

## Steps

### 1. Read the brand and the account — before asking anything
Load `references/reading-the-brain.md`. Reads: `gooseworks:brand_read` lean (summary, kit, products, competitors, learnings; `product_ids` for the featured product); the claims sign-off marker (§1); customer words from the voice-of-customer bank (§2); the angle bank (§3); the latest weekly performance read, rotation requests and campaign record (§4); `gooseworks:meta_read` `view: "performance"`; `gooseworks:ads_creative_read` `approved_only: true` (small `limit`); `gooseworks:ads_template_read` `mode: "mine"` (own past ads — `ad_ended_at` equal to the scrape date means still running; long runs suggest winners; their copy is not a claim).
Writes: a five-line **state note** — winners, fatigue, angles tried, the product's price and eligibility, what may be claimed. A learning applies to the format it names (a video-script rule is not an eight-word-hook rule).

### 2. Fill a one-screen brief — ask only for the gaps
Reads: the state note, campaign record. Writes: the brief.
The brief: product (and variant), objective and funnel stage, persona, platforms and placements, destination URL, offer (terms and end date, or none), mandatories, number of ads, deadline, one-line **test question**, category (regulated? special ad category?). Ask in **one message**, only what the brain cannot settle:
- **Load-bearing claims:** no sign-off, or fewer than three signed lines for this product → run `claims-gate`'s **scoped sign-off** here: put the 3–5 lines the likely angles would lean on (from the angle bank and value props, verbatim, with their proof) to the human and record their answer through the claims contract. Declined → a product-facts-only set, said plainly.
- **Stock** for the flight, **price with currency**, offer terms — two sources that disagree → ask, never pick one.
- **Budget:** a small stated ad budget → 3–4 concepts on one or two angles; write the budget into the batch file's test-structure section for run-paid-campaigns.
- **Pre-launch:** objective (waitlist, pre-order); no ratings or store badges.
**Imagery by company type:** physical product without usable photos → stop, tell the marketer in plain words that real product photos come first, and create `ads/batches/<YYYY-MM-DD>-<slug>.md` with the brief and a `Product imagery needed:` request line (`reading-the-brain.md` §7). Software or app → the kit's `screenshotUrls` (full kit) or real screenshots the marketer gives, as reference images, or text-native archetypes with `allow_without_product_image`, labelled "product not shown". Never a mascot or a generated product as the product.

### 3. Build the angle grid
Reads: the brief, `references/angles-and-hooks.md`. Writes: the grid. Run the `make-static-ads-angle-grid` skill (`../make-static-ads-angle-grid/SKILL.md`): 3–5 angles (fewer when the budget, the mode or the signed claims say so — say why), each "they buy because…" with its source (`A-NN`, voice-of-customer row ids, a signed claim, a current winner, the marketer's words). Fewer than three grounded → say so and offer research first, the marketer's own reasons, or a smaller set. One variable per cell.

### 4. Write the copy, in the customers' words
Reads: grid, voice, banned words, voice-of-customer rows. Writes: a copy row per ad. Run the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`): on-image hook (≤ 8 words), optional proof line, two primary texts, headline, description, CTA, destination, and the **prompt fence** (exact on-image words in quotes; no other text, badges, ratings, seals, prices or logos). Customer words carry the pain; signed claims carry the benefit. A brand voice built on "your skin / your breakouts" trips Meta's personal-attribute rule — rewrite to situation framing.

### 5. Check claims and policy — before any money is spent
Reads: `references/claims-and-policy.md`. Writes: check results and the cut list. the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) pulls every claim-bearing span from the planned lines, the prompt fence and what the planned visual implies (Pass A); the `claims-gate` skill (`../claims-gate/SKILL.md`) keeps, rewrites or cuts each; the `ad-policy-check` skill (`../ad-policy-check/SKILL.md`) checks the platform and category rules.
**5b. Rejected ad — fix it** (this playbook owns the fix for image ads; the ads team only detects rejections; a rejected video ad is the video job — say so): (1) read the open `Fix needed: for make-static-ads` line and the health line of `ads/campaigns/<slug>/state.md`; otherwise ask for the ad (screenshot, copy or link) and the platform's exact reason; (2) find it (`ads_creative_read` by tag, or `ads_template_read` `mode: "mine"`); (3) map the reason to the line or element; (4) copy-only → deliver rewritten copy, free; image text → a quoted remix (Step 7); nothing actually violates → say so and suggest a review request in the ad platform; (5) re-run both checks; write the fixed copy or creative into the ad's batch file (the launch copies it verbatim) and answer `Fix ready:` under the request line; offer to save the lesson as a brand rule (the `save-learning` skill, `../save-learning/SKILL.md`). The human edits and resubmits in their ads manager. Steps 3–4 do not run.

### 6. Propose sources — the marketer picks
Reads: `references/formats-and-placements.md`. Writes: a source per concept. Search `gooseworks:ads_template_read` `mode: "static_library"` (angle + archetype + look), `"mine"`, `"competitor"` (structure only — never their words, claims, logo or people), `"community"`, or the winner's creative for iterate mode. **Read each candidate's detail** (`template_id`): reject one whose `remix_spec` needs content you do not have or would import claims (a testimonial, a stat, a badge); a weak match (similarity below about 0.45) means "no template for this archetype" — say so. Show two or three options per concept with their preview images, mark one suggestion, and let the marketer swap. Product photos and screenshots go in as `reference_image_urls`; the engine **redraws** the frame, so UI and labels must pass the letter-by-letter check in Step 9.

### 7. Show the plan and the quotes — the spend gate
Reads: copy rows, check results, chosen sources. Writes: the plan table (ad #, angle, archetype, source, hook, safe-to-say status, ratios), cuts, flags, test question.
- **No approved campaign for this ask:** one `gooseworks:ads_generate` `dry_run: true` per concept (`product_name`, the prompt fence as `prompt`). For exploratory tests offer a lower `quality`. Show each quote as returned, one by one; ask "Go ahead with these quotes?" Say that remakes are quoted and asked separately.
- **An approved campaign for this ask exists** (its brief's Status line says "Approved" and names this product and moment): write the grid into its concepts (`gooseworks:update_campaign_concept` / `gooseworks:add_campaign_concept`: person, message, chosen `template_ids`, `ratios`, and `proof` = a signed claim the server accepts, else a plain product fact — never empty, because a concept without proof does not generate), then `gooseworks:request_campaign_generation` with those `concept_ids` and `count` = the number asked. Read the composed plans (`ads_creative_read` `view: "approvals"`, `batch_id`), run Pass A on each composed prompt, fix with `gooseworks:ads_approval_decide` `revise` / `edit_plan`, then show the `credits` as given.
Wait for the marketer's explicit yes.

### 8. Generate
Reads: the quoted calls and the yes. Writes: jobs, creatives. Submit each call as quoted (or `ads_approval_decide` `approve` with their words as `user_quote`). Poll each `gooseworks:job_get` (`kind: "ads_batch"`) until nothing is pending; a failed job is reported, never resubmitted silently.

### 9. Review every render; remake only on a yes
Reads: renders (`ads_creative_read` `creative_id`, `include: ["renders","plan"]`), `references/review-rubric.md`. Writes: verdicts, feedback. Run the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`), which follows the `honest-review` skill (`../honest-review/SKILL.md`): by eye where possible, Pass B of the claims check on what was drawn (invented "#1", stars, seals, prices, garbled words), the rubric for its archetype; a failing render → a quoted remix on a yes, two tries; unseen renders labelled with a checklist.

### 10. Package and hand over
Reads: `references/handoff-format.md`; the product record again (price, offer, eligibility — anything changed is fixed or flagged). Writes: lower-case tags on every creative (read, merge, write once); the batch file `ads/batches/<YYYY-MM-DD>-<slug>.md` (`gooseworks:file_write`) with **the full per-ad copy** the launch uses (`reading-the-brain.md` §7); a `Rotation ready:` answer under a served rotation request; the hand-off in chat in plain words — set table, cuts, flags, recommended test structure, what to look at yourself, each creative's link. Ask which to run.

## Approval gates

1. **Spend** — the yes to the engine's quotes as given; every remake, resize or extra placement asked separately.
2. **Claims** — any line not covered by the signed-off claims or a plain product fact is cut before the set is shown and listed with the proof that would restore it. Approving a claim is the human's call through learn-my-brand's claims gate — no exceptions.
3. **The run decision** — record a pick only on the human's words: feedback `rating: "happy"` on the chosen render of each picked creative, `picked` added to its merged tags, and the pick written in the batch file. Brand-fit vetoes are theirs.

## Output and write-back

- Tagged creatives in GooseWorks; the batch file in the workspace; the hand-off in chat.
- Render feedback (`gooseworks:ads_creative_update`): negative ratings and reason codes only for engine faults; strategy notes in the comment.
- **Brand learnings** only through the `save-learning` skill (`../save-learning/SKILL.md`) — the human's own words, one idea per learning, own superseded ones retired, text starting `[ads YYYY-MM-DD]` (disapproval lessons, template lessons, taste rules the marketer states). Reasons to buy the founder states stay in the batch file and the angle record. Claims are never written here.

## Done when

- **Fresh batch:** the human would put money behind at least half; at least three distinct angles (fewer only when budget or signed claims justify it, said plainly) and as many archetypes as the library and inputs allow, unavailable ones named.
- **Iterate / rotation:** the set changes one named variable per ad from the winner — the hook or execution, or, when the request says the angle is exhausted, the angle itself.
- **Disapproval fix:** the violating line or element is gone and both checks pass.
- **Always:** no line — including text drawn inside an image — outside the signed claims and plain product facts; every ad a complete unit, tagged, in the batch file.

## Out of scope

- Launching, audiences, budgets, kill/scale, scanning the account for rejections — **run-paid-campaigns** (this playbook recommends a test structure and fixes rejected image ads).
- Search text ads (Google / Bing RSA headlines, keywords) — not covered yet.
- Which ad won — **analyze-performance**. Video ads — **goose-video**. Product photography — **goose-product-photos** (GooseWorks skills, not playbooks).
- Finding angles and competitor ads — **research-competitors**; customer language — **research-market**.
- Landing pages — analyze-performance's page audit (this playbook flags a destination that does not match).
- Approving claims — **learn-my-brand**. Retail-media creative for marketplaces; decks, print, packaging, multi-page layouts.
