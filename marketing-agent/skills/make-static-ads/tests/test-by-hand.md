# make-static-ads — test by hand

## Setup

1. Connect GooseWorks **staging** to your agent.
2. Link every marketing skill side by side (the playbook needs its steps and the shared steps): see "How to test a playbook" in `marketing-agent/README.md`.
3. Generation spends credits. Keep paid tests small (two or three ads) and say yes only to quotes you expect.

## Test 1 — the core ask (DTC skincare)

Brand: a real brand whose approved-claims list and angle bank are filled (staging today: Personal Day has claims but no angle bank — use it to test the "fewer than three grounded angles" path too). Product in stock.

Say: **"I need ten fresh ads for the moisturiser this week."**

It should, in order:
1. Read the brand, the claims (with the product), customer evidence, past performance and the brand's own past ads before asking anything; give a short state note.
2. Ask only what the brain cannot settle (stock for the next two weeks, offer or none, placements if unclear, funnel stage if unclear) — in one message. With no sign-off on file, put the 3–5 lines the angles would lean on to you right here for a scoped sign-off (recorded through the claims contract); if you decline, it goes facts-only. It never names an internal playbook or tool to you.
3. Propose 3–5 angles, each with "they buy because…" and its source line; or say plainly that fewer than three are grounded and offer the options.
4. Show the plan table (angle, stage, archetype, template, on-image text, claims result, ratios), the cut lines with the proof that would restore them, and **each concept's quote exactly as the engine returned it** (one per concept — the engine takes one prompt per call), with remakes priced and asked separately — then stop and wait.
5. After your yes: generate, review every render, propose priced remakes for weak ones and make them only on a further yes; drop what still fails.
6. Hand over a complete unit per ad (renders, two primary texts, headline, description, CTA, destination, tags, claims and policy results), the cut list, a recommended test structure, and "what I checked / what you should check". Ask which to run; mark only your picks approved.

**Passes if:** you would put money behind at least half; ≥ 3 angles and ≥ 3 archetypes; an audit of every line — including text drawn inside the images — finds nothing outside the approved claims and product facts; nothing generated before your yes.
**Telltale failures:** ten ads that are one angle in ten outfits; a claim (or a seal, star rating or "#1") that slipped into an image; a press quote about another product used for this one; generation before the yes.

## Test 2 — B2B SaaS, no product photo

Brand: Gooseworks (staging) or any SaaS. Say: "Make me six LinkedIn ads for our product."
**Passes if:** it asks for real screenshots instead of generating UI; uses screenshot/stat/POV archetypes; LinkedIn copy limits; no customer logo or stat without permission and approval.

## Test 3 — pre-revenue consumer app, nothing on file

Brand with no claims, no reviews, no angle bank. Say: "Ads for our app launch."
**Passes if:** it says what is missing, offers to research customers or competitors first or to use the founder's own reasons, writes only puffery and verified facts, and never invents ratings, users or reviews.

## Test 4 — reactive

- "My image ad got rejected for 'personal attributes'." → finds the second-person line, rewrites it to situation framing, asks for the ad and the exact reason if not given, re-runs both checks, offers to save the lesson (saves only with your confirmation in your own words), does not resubmit anything.
- "More like ad X, new hooks." → keeps angle and proof, changes only the hook, remixes from the winner's creative.

## Test 5 — graphic side door (and asked directly)

From email-lifecycle: "a 600-wide header for the welcome email, text: 'Welcome to the routine'". (written as a `Graphic needed: for make-static-ads · header art: …` line in `lifecycle/flows/welcome.md`, or asked directly: "make a header image for my newsletter") → reads the line, no CTA button, claims check on the words, quote and yes in chat, writes `Graphic ready: <link> · <YYYY-MM-DD> · alt: …` under the request.

---

## Staging run — 2026-10-16 (stopped before the first paid call)

Brand Personal Day (`0e5b2fb0…`), product Dive Deep Mevalonic Moisturizer (`241a7303…`), ask: "I need ten fresh ads for the Dive Deep moisturiser this week."

| Step | Call | What came back |
|---|---|---|
| Server start | `get_started` `wants: "image"` | Set up; "go straight on with their request" |
| Brand read | `brand_read` summary/kit/products/learnings/competitors | Voice, value props, 6 proof points, `messagingAngles: []` (the server's own research angles — empty; the real angle bank is research-competitors' `angle-bank.md`, not written for this brand yet), 5 tracked competitors with scraped ads, 1 video learning; product: price 16.00, 4 photos, no stock field, `ad_eligibility: eligible` |
| Claims | `knowledge_search` `["claim"]` without product | 7 claims, `approved_ad_claim: true` — all auto-created from the site and press (Free Returns, Free Shipping $45+, 4.9★/234 reviews, Allure/Byrdie/NewBeauty quotes) |
| Claims for the product | same, with `product_id` | The same 7, now `approved_ad_claim: false`, `claim_status: "approved_scope_unknown"` → **no claim is usable for the moisturiser until the claims gate's scoped sign-off records that scope**; the Byrdie quote is about a mist, an Allure quote about a toner |
| Customer words | `knowledge_search` `["evidence"]` (secondary source) | Only press quotes and one site metric — research-market's voice-of-customer bank does not exist for this brand yet |
| Angles | `knowledge_search` `["learning","document","creative"]` | Empty |
| Account | `campaign_read` | No campaigns |
| | `meta_read` `performance` | `not_connected` |
| Own past ads | `ads_template_read` `mode: "mine"` | 8 own Meta ads with copy, CTA, destination, run dates (e.g. bundle "save up to 25%", ran Jul–Oct) — copy includes unapproved lines ("daily defense against bacteria & breakouts") |
| Sources | `ads_template_read` `static_library` "customer review quote card for an acne-safe moisturizer" | 5 ranked beauty templates (review card, UGC serum-in-hand, editorial triptych…) |
| **Quote (stop)** | `ads_generate` `dry_run: true`, 1 template × 2 variants × 4:5 + 9:16, prompt fence with exact on-image text | **4 images × 60 credits = 240 credits** (rates: low 30, medium 45, high 60). |

**What the playbook would say next:** "You have no angle bank or customer reviews on file and none of the saved claims is confirmed for the moisturiser. I can build three angles from plain product facts (ingredient story, lightweight texture, price) with no claims on the images; or approve the 3–5 claims the angles need for Dive Deep right here, in a short sign-off (with proof for any that need it); or run research first. Each concept gets its own quote. This first one came back at 240 credits (4 images; lower quality is cheaper). I'll show each quote exactly as it comes back before asking for your yes." — **stopped here; no generation call was made.**

Findings fed back into the playbook: the claim status fields (`claims-and-policy.md` §2), own past ads as an account signal (Step 1), cost per image for planning the quote.

**Round 2 (adversarial run, same day) added:** one prompt per `ads_generate` call (a 2-template dry run shared one prompt: 6 images, 360 credits); no claims sign-off marker on Personal Day yet → no claims usable until the claims gate's scoped sign-off; a brand with `research_status: "none"` still gets a dry-run quote (submit would fail); unfiltered `ads_creative_read` returned 2.1 MB for 17 creatives.

---

## Round 2 fix pass (2026-10-16) — what to re-check by hand

- No sign-off on file → the scoped sign-off happens inside this run (3–5 lines), not a hand-off elsewhere.
- Tags are written lower-case (`angle:a-07`, `picked`) and the picks are also in the batch file.
- **Tag round-trip (F5a), not yet verified:** on a staging creative, write `tags: ["angle:A-07","picked"]` with `ads_creative_update`, then read it back with `ads_creative_read` `tags: ["angle:a-07"]`. Expected: saved lower-case and found. The write was blocked by this session's permission guard on 2026-10-16, so it still needs a human-run check (server-needs #21).
