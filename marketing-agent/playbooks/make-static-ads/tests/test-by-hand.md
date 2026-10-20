# make-static-ads — test by hand

## Setup

1. Connect GooseWorks **staging** to your agent.
2. Link the playbook: `ln -s "$PWD/marketing-agent/playbooks/make-static-ads" ~/.claude/skills/make-static-ads`
3. Generation spends credits. Keep paid tests small (two or three ads) and say yes only to quotes you expect.

## Test 1 — the core ask (DTC)

Brand: a DTC brand with real products and its own Meta ads, ideally with brand-brain facts in several statuses. Staging today (19 Oct): **Graza** (olive oil) — 304 own Meta ads, 5 imported competitors, no proof points, a guessed kit font; good for the concept inventory, the brain statuses and the font rule.

Say: **"I need ten fresh ads for <the hero product> this week."** (Graza: the Drizzle and Sizzle set.)

It should, in order:
1. Read the brand, **the brand brain** (map, then a search for the product's claims and proof, each with its status), customer evidence, past performance, the brand's recent posts and **the brand's own running Meta ads** before asking anything; give a short state note (what may be claimed, with status) and a **concept inventory** (one line per running ad).
2. Ask only what the brain cannot settle — in one message, with a default for each: claims the concepts need that the brain marks `guess` or `unknown`, stock, offer or none, placements, **logo or no logo, brand colours or the template's colours, brand font or the template's font**; a font pairing only if the kit's font is a plain system face. It never names an internal playbook or tool.
3. Show the **concepts** as plain sentences and, in the same message, a **gallery of templates** — real statics running on Meta plus library templates, 3–5 per slot, each tagged with the concept it would carry, one suggestion marked. You pick; "you choose" → it uses its suggestions.
4. Compose every ad the server's way: your chat words are the only User instructions; each concept is that ad's Variant brief; other brands' templates go structure-only. Then the plan table (concept, persona, reason, proof + brain status, template + advertiser link, structure-only, ratios), the cuts with what would confirm them, **each quote exactly as returned**, the sentence "If an image fails my check I redo it once, at the same price." — then stop and wait.
5. After your yes: render; judge every render with the server's checklist (a fresh subagent where possible); at most one retry per image inside your yes; a content-policy refusal re-composed without the trigger and sent once more; then the extra checks; drop what still fails, with the reason.
6. Hand over a complete unit per ad, the cut list, the batch file (with each final prompt and judge result), a recommended test structure and "what I checked / what you should check"; offer text variants of the best one or two images. Ask which to run; mark only your picks.

**Passes if:** you would put money behind at least half; covering the text, no two ads look alike; a few strong concepts each shown in two or three looks, every concept with a specific promise and real proof; no reason to buy or persona invented to fill the set (gaps named plainly); at least one concept the brand has never run; every ad is a remix of a template you saw or the agent chose; the composed prompt contains your words unchanged as User instructions and nothing the agent added beyond the Variant brief; an audit of every line — including text drawn inside the images — finds nothing the brain marks `guess` or `unknown`; nothing rendered before your yes; no more than one retry per image; no judge verdict written into render feedback.
**Telltale failures:** ten ads that are one message in ten outfits; ads that only differ in their headline; templates you never saw; another brand's words, logo, product or image in a render or in the image list; a claim (or a seal, star rating or "#1") that slipped into an image; an agent-written second prompt on top of your words; generation before the yes.

## Test 2 — B2B SaaS, no product photo

Brand: Gooseworks (staging — kit font Space Grotesk set by the user; `must` rules for a wordmark and a CTA pill, which beat the no-logo default) or any SaaS. Say: "Make me six LinkedIn ads for our product."
**Passes if:** it asks for real screenshots instead of generating UI; uses screenshot/stat/POV archetypes; LinkedIn copy limits; no customer logo or stat without permission and a brain status of `confirmed`.

## Test 3 — pre-revenue consumer app, nothing on file

Brand with no claims, no reviews, no angle bank (staging: **Greener Closet** — guessed Inter font, no own ads, competitors with no ads). Say: "Ads for our app launch."
**Passes if:** it says what is missing, offers to research customers or competitors first or to use the founder's own reasons, writes only puffery and verified facts, and never invents ratings, users or reviews.

## Test 4 — reactive

- "My image ad got rejected for 'personal attributes'." → asks for the ad and the exact reason if not given; finds the second-person line; copy only → rewrites it to situation framing, free; words in the image → re-composes with the rejected render as the template (your words as User instructions) and a quoted render, judged like any render; re-runs both checks; offers to save the lesson (saves only with your confirmation in your own words); does not resubmit anything to the platform.
- "More like ad X, new hooks." → keeps angle and proof, changes only the hook (in each new ad's Variant brief), composes from the winner's creative as the brand's own template, quoted before rendering.

## Test 5 — graphic side door (and asked directly)

From email-lifecycle: "a 600-wide header for the welcome email, text: 'Welcome to the routine'". (written as a `Graphic needed: for make-static-ads · header art: …` line in `lifecycle/flows/welcome.md`, or asked directly: "make a header image for my newsletter") → reads the line, no CTA button, claims check on the words, quote and yes in chat, writes `Graphic ready: <link> · <YYYY-MM-DD> · alt: …` under the request.

## Test 6 — "my ads all look the same" (concept diversity)

Brand with 5+ own Meta ads running (staging: import them first if needed). Say: **"All my ads look the same. Give me eight that are actually different."**
**Passes if:** it reads the brand's own running ads first and says, in plain words, what they all have in common (one reason to buy, one look); the new set leads with reasons and looks the brand has not run; the plan shows the lever tally; templates come from at least three different advertisers; each ad's Variant brief carries a different concept or look; it explains why same-image-new-text would not count as different.

## Test 7 — references from the market (AG1-style category leader)

Brand: any supplement or DTC brand. Say: "Show me what the best brands in my category are running and build from that."
**Passes if:** it names 3–5 category leaders, reads their live ads free first (browser) and asks one yes to a ceiling before any paid read; the gallery shows statics only, likely working (14+ days, several versions of one idea, or among the first ads on the leader's page), from real brands (no look-alike ad farms); a picked leader ad is re-hosted and registered as a template, then run **structure-only** — its image is never in an image list sent to the image model; nothing of the leader's words, claims, logo or people reaches a render.

## Test 8 — copy variants

After a set is approved, say: **"Same image as #3, but try three other headlines and a different font."**
**Passes if:** it says these test copy, not concepts, and suggests running them as text options in one ad; a re-render is composed with the approved render as the brand's own template, your words as User instructions and the new hook in the Variant brief, quoted and judged; the layer split is flagged as paid and run only on a yes, and its agent-set lines pass the claims check first; the picture is unchanged except the words and font; every word is spelled right.

---

## Test 9 — same ask through the app UI vs the skill

The same brand, product, template and words, made twice: once in the GooseWorks app (the static-ad prompt box, the template picked by hand) and once with this playbook (the marketer types the same words in chat and picks the same template in the gallery). Two or three ads each, same ratios.

1. Record both sides: the app's composed prompt and image list (from the creative's detail, `include: ["renders","plan"]`) and the playbook's (batch file).
2. Compare the prompts line by line: the User instructions block should be the same words; the colour, typography, reference manifest and blueprint lines should follow the same rules; differences should be only the playbook's improvements (the Variant brief per concept, the brain-checked claims, the font improvement where it applied).
3. **Blind judge:** give a fresh subagent (or a person) the renders side by side, unlabelled and shuffled, with `references/judge.md` §3–4 and the question "which would you run, and why?".

**Passes if:** the playbook's ads judge at least as well as the app's on the server checklist, and the blind pick prefers the playbook's or calls them even; every prompt difference traces to a named improvement; nothing the brain marks `guess` or `unknown` appears on the playbook's side. Any rule difference that is not an improvement is a bug in this playbook's copy of the server.

---

## Free and cheap reads — 2026-10-19 (no generation)

| Step | Call | What came back |
|---|---|---|
| Category leader page id | Meta Ad Library search box, "AG1 by Athletic Greens" under Advertisers (host browser, free) | page id 183869772601, ~510 active ads; default order by impressions |
| Category leader ads | proxy `/v1/facebook/adLibrary/company/ads` `{pageId, status: ACTIVE, media_type: all, trim}` | 29 ads, 1 credit, 172 KB; statics as DCO / IMAGE / CAROUSEL with `original_image_url`; 7 distinct static concepts (taxonomy §1). `media_type: IMAGE` returned 0 (server-needs N9) |
| Page search | proxy `/v1/facebook/adLibrary/search/companies` `{query: "AG1"}` | 1 credit; AG1 not in the results (celebrities named "Ag…") — find page ids in the library's own search box instead |
| Keyword search | proxy `/v1/facebook/adLibrary/search/ads` `{query: "greens powder", media_type: image}` | 30 ads, 1 credit, 724 KB; mostly one long story ad from look-alike pages — keyword search is a last resort (references §2d) |

### v0.3 staging run — 2026-10-19 (adversarial reviewer, free calls only) — historic, pre-0.4 (ads_generate era)

| Brand | What came back |
|---|---|
| Graza (DTC) | Kit font Bebas Neue (`mapped` = guessed); no proof points, 0 learnings, no sign-off; 304 own Meta ads; 5 imported competitors (~90 static templates, layouts asking for starburst badges). `mine` (image, 30 rows) = 10 distinct texts → concept inventory buildable (seed-oil and avocado-oil swaps, a pomace myth ad, 35% off subscription, chips, mayo, "details matter"). Organic: 12 posts, captions + counts only; most-commented are giveaways. Conflicting offers in knowledge (free shipping over $55; 20% off Starter Kit). **Dry runs:** a 2,470-character brief as `prompt` on library template b4353eb3, 4:5 + 9:16, `no_logo` → 2 images × 60 = **120 credits**; competitor template d13e41c0 at medium → **45 credits**. `apply_brand_font: false` accepted silently but is forced on for these sources by the server. |
| Gooseworks (B2B SaaS) | Kit font Space Grotesk (user-set); 10 learnings incl. `must` wordmark and CTA pill; `mine` = 3 uploads (two are other brands' references) → filter to rows imported from Meta; competitor Smartly statics last imported 14 Sep. Dry run 1:1 + 16:9 without product image → **120 credits**. |
| Greener Closet (near-empty) | Kit font Inter (`mapped`); no learnings; no own ads; competitors with 0 ads; organic posts from 2025. Stops at Step 3 with no grounded reasons until the scoped sign-off; references from the library only. |

Not run (would spend or write): import refreshes, paid ad-library reads, generation.

---

## Staging run — 2026-10-16 (stopped before the first paid call) — historic, pre-0.4 (ads_generate era)

Brand Personal Day (`0e5b2fb0…`), product Dive Deep Mevalonic Moisturizer (`241a7303…`), ask: "I need ten fresh ads for the Dive Deep moisturiser this week."

| Step | Call | What came back |
|---|---|---|
| Server start | `get_started` `wants: "image"` | Set up; "go straight on with their request" |
| Brand read | `brand_read` summary/kit/products/learnings/competitors | Voice, value props, 6 proof points, `messagingAngles: []` (the server's own research angles — empty; the real angle bank is research-competitors' `angle-bank.md`, not written for this brand yet), 5 tracked competitors with scraped ads, 1 video learning; product: price 16.00, 4 photos, no stock field, `ad_eligibility: eligible` |
| Claims | `knowledge_search` `["claim"]` without product | 7 claims, `approved_ad_claim: true` — all auto-created from the site and press (Free Returns, Free Shipping $45+, 4.9★/234 reviews, Allure/Byrdie/NewBeauty quotes) |
| Claims for the product | same, with `product_id` | The same 7, now `approved_ad_claim: false`, `claim_status: "approved_scope_unknown"` → **no claim is usable for the moisturiser until learn-my-brand records that scope**; the Byrdie quote is about a mist, an Allure quote about a toner |
| Customer words | `knowledge_search` `["evidence"]` (secondary source) | Only press quotes and one site metric — research-market's voice-of-customer bank does not exist for this brand yet |
| Angles | `knowledge_search` `["learning","document","creative"]` | Empty |
| Account | `campaign_read` | No campaigns |
| | `meta_read` `performance` | `not_connected` |
| Own past ads | `ads_template_read` `mode: "mine"` | 8 own Meta ads with copy, CTA, destination, run dates (e.g. bundle "save up to 25%", ran Jul–Oct) — copy includes unapproved lines ("daily defense against bacteria & breakouts") |
| Sources | `ads_template_read` `static_library` "customer review quote card for an acne-safe moisturizer" | 5 ranked beauty templates (review card, UGC serum-in-hand, editorial triptych…) |
| **Quote (stop)** | `ads_generate` `dry_run: true`, 1 template × 2 variants × 4:5 + 9:16, prompt fence with exact on-image text | **4 images × 60 credits = 240 credits** (rates: low 30, medium 45, high 60). |

**What the playbook would say next:** "You have no angle bank or customer reviews on file and none of the saved claims is confirmed for the moisturiser. I can build three angles from plain product facts (ingredient story, lightweight texture, price) with no claims on the images; or approve the claims you want for Dive Deep in learn-my-brand first and come back; or run research first. Each concept gets its own quote. This first one came back at 240 credits (4 images; lower quality is cheaper). I'll show each quote exactly as it comes back before asking for your yes." — **stopped here; no generation call was made.**

Findings fed back into the playbook: the claim status fields (`claims-and-policy.md` §2), own past ads as an account signal (Step 1), cost per image for planning the quote.

**Round 2 (adversarial run, same day) added:** one prompt per `ads_generate` call (a 2-template dry run shared one prompt: 6 images, 360 credits); no learn-my-brand sign-off marker on Personal Day yet → no claims usable; a brand with `research_status: "none"` still gets a dry-run quote (submit would fail); unfiltered `ads_creative_read` returned 2.1 MB for 17 creatives.

---

## Round 2 fix pass (2026-10-16) — what to re-check by hand — historic, pre-0.4 (ads_generate era)

- No sign-off on file → the scoped sign-off happens inside this run (3–5 lines), not a hand-off elsewhere.
- Tags are written lower-case (`angle:a-07`, `picked`) and the picks are also in the batch file.
- **Tag round-trip (F5a), not yet verified:** on a staging creative, write `tags: ["angle:A-07","picked"]` with `ads_creative_update`, then read it back with `ads_creative_read` `tags: ["angle:a-07"]`. Expected: saved lower-case and found. The write was blocked by this session's permission guard on 2026-10-16, so it still needs a human-run check (server-needs #21).
