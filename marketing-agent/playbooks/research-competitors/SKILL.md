---
name: research-competitors
description: >-
  Use when a founder or marketer asks "what are my competitors running right now, and what works for them?", "competitor teardown", "what ads are my competitors running", "how do they price / what's their offer", "compare us to X", "find gaps nobody covers", "give me angles to brief", "what changed with my competitors this week", or "competitor X just launched / cut prices". Delivers one dated, linked file per rival (positioning, offer, funnel, live ads with library links and days running, content, social, releases, review signal), a white-space read, and an angle bank of briefable angles with their evidence and the proof the brand needs — saved to the brand for ad makers and planning. Opt-in weekly watch and a fast path when one rival moves. Never claims a rival's spend or results; never copies their ads. Not for what people say about rivals — use listen-social; not for who your buyers are — use research-market.
---

# research-competitors

What competitors themselves do — advertise, price, offer, publish, post, launch — read from public evidence and turned into angles the brand can brief. Three modes:

- **Teardown** (default): the full read, per competitor.
- **Watch** (opt-in, weekly or "what changed this week?"): a one-screen diff against the last snapshot.
- **React** ("X just launched / cut prices / got press"): a fast path on one rival.

## What you get

1. **The hand-over** — opens with "Do this first, because…": the one angle to brief now and why, then the three things that matter most, the top 3–5 briefable angles, the gaps, and what was not read.
2. **Competitor file** — one per rival (3–5 deep, the rest light): identity and tier, positioning in their words, offer and pricing architecture, funnel (ad → page type → capture), ads (active as of a stated date, concept clusters with days running and library links), content, social, releases, review level and velocity, a labelled "what they are betting on", and a "not read" list. Every fact carries a source and a date. A teardown built only on the server's ad sample is labelled **partial**.
3. **Landscape** — the confirmed set, category conventions, a reasons-to-buy × rivals matrix with buyer-evidence weight, and the gaps: white space, unvalidated space, proven-but-contested space.
4. **Angle bank** — stable `A-NN` angles: reason to buy, segment and awareness, driver, objection answered, product, offer, market evidence, buyer evidence, proof wording the brand may use, status (briefable / needs proof / do not use), formats, reference ads, hook directions, guardrails, test status.
5. **Watch digest** (when opted in) — what materially changed, top three with the "so what" and who acts, what was not re-read; a quiet week in one line.

Formats and a worked example: `references/output-formats.md`.

## Before you start

1. **Connection.** No GooseWorks tools listed (after one `gooseworks:tools_load` for a missing group: brand, ads, files, media, data, automation) → say only: "Connect GooseWorks first — I read your competitors and save what I find through it." First GooseWorks call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`), used only to settle setup and the brand. Send `client` on every call that takes it.
2. **Brand and mode.** The brand named; with several and none named, list them and ask. Keep `brand_id`, `brand_slug`, `coworker_agent_id` (scope and no-coworker fallback: `../../atoms/save-to-brain/ATOM.md`). Pick the mode from the ask.
3. **Read the brain first.**
   - `gooseworks:brand_read` sections `summary`, `kit`, `products`, `competitors`, `learnings`, `organic`, `sources`; full records (`product_ids`) for the hero products — our own price and offer are the baseline.
   - Claims: load `../../atoms/claims-gate/ATOM.md` once — it reads learn-my-brand's contract (a lean `brand_read` is enough). Angles may lean only on the claims it allows.
   - `gooseworks:competitor_read` (roster with dossiers) and `view: "suggestions"`.
   - `gooseworks:automation_list`: if a weekly watch exists, show its recent runs and credits at the top of this run.
   - Workspace (`gooseworks:file_list`, `file_read`): `research/competitors/` (this run extends it); research-market's `research/market/voc-bank.md` and `personas.md` (rival complaints and segments — never re-mine reviews here); `research/credits-log/` (prices); analyze-performance's latest `reports/performance/<date>.md` (angle results).
4. **No voice-of-customer bank yet:** tell the human in plain words — "I'd first find out what your buyers say about this category; without it I can't tell a real gap from an empty corner" — and offer to continue anyway: then every matrix row is "unvalidated", nothing is called a gap, and the angle bank says "no buyer evidence yet".
5. **Ask only what is missing, in one message:** confirm or change the set (step 1), which markets (country) and channels matter most, and "anyone we must never name, compare against, or copy?" If this host cannot read web pages, ask in the same message for pasted text or links for the top rivals' pricing, "vs" and review pages, their ad-library pages, and each rival's Google Ads Transparency page if Google ads matter; otherwise those sections are named "not read" up front.

## Steps — teardown

1. **Confirm the set.** Play back one table: tracked rivals, server suggestions and research-market's named competitors — each with tier, website, Meta page and the server's page check (CONFIRMED / UNSURE), last researched date. Candidates come only from those, the founder's answer, or one search through the spend gate (Google results, `../../atoms/spend-gate/proxy-endpoints.md`), each labelled `candidate — <source>` — never from your own memory. Ask before adding or dropping anyone.
   - Add on a yes: `gooseworks:competitor_save` `add` (free background research starts); ask for exactly what its answer lists as unresolved.
   - UNSURE page: ask for the rival's ad-library link (or open it in the host's browser) and add with it; read none of its ads until confirmed.
   - Remove: `competitor_save` `remove` returns the server's confirm card for the human to press; where no card can show, tell them to remove it in the GooseWorks app. Never drop a rival another way.
   - Go deep on 3–5 (the roster holds 10). The do-nothing / DIY alternative gets a row from the voice-of-customer bank.
   *Writes:* the confirmed set (roster) and the landscape header.

2. **Freshen the evidence (free).** Refresh each deep rival whose ad scrape is older than 7 days, and every deep rival on hand-over day, with `gooseworks:competitor_research` (no `mentions`). The dating rules — scrape date, "active as of", what the server sample can and cannot show — are in `references/reading-ads-honestly.md`. *Writes:* each file's "ads active as of" header line.

3. **Read the full active library of the top 3 rivals (default)** — their main library for the company type: Meta for DTC and consumer apps, LinkedIn (and Google where search matters) for B2B. Load `references/reading-ads-honestly.md`. The server's Meta sample (`gooseworks:ads_template_read` mode `competitor`, paged to the end; video ads via `gooseworks:media_list` tags `ad_library` + `competitor_ad`) shows what they say; counts, concept iteration and what was switched off need the full library. For the 3 deepest rivals read it by default: the rival's library page in the host's browser (free; set the brand's main country), or — where the host cannot — one paid full read of active ads per rival through `../../atoms/spend-gate/ATOM.md` branch B. If both are declined or unavailable, the teardown is labelled **partial — sample only** and the sample rules apply. Other libraries (Google, LinkedIn, TikTok) only where the company type needs them and the spend gate's yes covers them. Build the inventory: active count, new in 30 days, concept clusters with variants, earliest start, days running, destination page, two library links each, format mix. *Writes:* the ads section.

4. **Mine the ads for angles.** Per cluster: reason to buy, hook type, awareness level, offer, proof type, format. Every "this works for them" is an inference with confidence and evidence. *Writes:* draft angle rows.

5. **Landing pages and the funnel.** Load `references/teardown-checklist.md`. Destination pages of the biggest clusters and the homepage (read-by-fetch or pasted): the promise (H1 quoted with URL and date), proof stack, offer, page type, capture, and where their message differs from ours. *Writes:* funnel section.

6. **Pricing and offers.** Offer architecture per company type (`references/teardown-checklist.md`): list vs promo, intro offers, bundles, subscription, shipping threshold, guarantee, trial and paywall, B2B tiers. Changes since the last snapshot flagged. *Writes:* offer section.

7. **What they publish.** Blog, guides, "vs / alternatives" pages (including any about us), lead magnets, newsletter — topics, cadence, what carries. *Writes:* content section.

8. **Their social.** `brand_read` `organic` (`competitor_top_posts`) and the dossier first; paid pulls only through the spend gate. Formats and topics that beat the rival's own median, cadence, creators. *Writes:* social section.

9. **Their releases.** Changelog, launch pages, press, app-store "what's new", new SKUs or drops. *Writes:* releases section.

10. **Light search footprint.** improve-search-visibility's latest `search/visibility/<date>.md` "named instead" lines if they exist; otherwise a few buyer questions through the spend gate or the host's own search. Never a full audit. *Writes:* footprint lines.

11. **Review signal.** Rating level and count per main surface; velocity against the last snapshot ("n/a — first snapshot" on a first run). Complaint themes come from research-market's bank by id. *Writes:* review section.

12. **Map the white space.** Load `references/angles-and-gaps.md`. The reasons-to-buy × rivals matrix with run length per cell and the buyer-evidence column; classify each row gap / unvalidated / contested / table stakes. *Writes:* landscape.

13. **Write the angle bank.** One `A-NN` row per distinct reason to buy, with product, offer (an approved one, or "none — feature no offer"), reference ads (template ids) and the exact proof wording the claims gate allows. Where no sign-off exists, offer the claims gate's scoped sign-off for the 3–5 proof lines the top angles need; if the human declines, those angles stay "needs proof". Personal-attribute and regulated categories: no hook may say or imply the viewer has a condition, and treat/manage/improve wording is "do not use (regulated)" unless approved (`references/angles-and-gaps.md`). Existing angles keep their ids and test history. Test status: analyze-performance's latest report and its learnings that cite the `A-NN`, ads tagged `angle:a-nn` (query `gooseworks:ads_creative_read` with the lower-case tag; compare ids case-insensitively) and videos whose names carry the id. *Writes:* angle bank.

14. **Save and hand over.** Through `../../atoms/save-to-brain/ATOM.md` (`versioned: supersede`): `research/competitors/<slug>.md` per rival (title `Competitor file: <Rival> — <Brand> — <date>`, tags `research-competitors`, `competitor-file`, `rival:<slug>`), `landscape.md`, `angle-bank.md` — each opening with its marker line (`references/output-formats.md` § Marker lines). Hand over one screen opening "Do this first, because…"; ids stay in the files, not the chat. Learnings through `../../atoms/save-learning/ATOM.md`: offer rules for the top briefable angles, each one idea, prefixed `[angle A-NN YYYY-MM-DD]`, written only on the human's yes in their words, retiring this playbook's earlier `[angle …]` facts for the same angles in the same call. Then offer the watch.

## Steps — watch (opt-in)

Load `references/watch-and-react.md`. Free refresh per rival, re-read ads and dossier, diff against each rival's snapshot by ad id, keep only threshold-crossing changes the evidence can show, list what was not re-read, write `research/competitors/watch/<YYYY-MM-DD>.md` (save-to-brain `keep-history`, tags `research-competitors`, `competitor-watch`), rewrite the snapshot blocks, update angle saturation in the workspace file.

Standing watch (needs a coworker; without one, say so and keep running on ask): on a yes, save the method file and create the weekly automation as `references/watch-and-react.md` says, under `../../atoms/spend-gate/ATOM.md` branch C — created paused, free sources only, switched on only on the human's yes, its own run cost shown after the first run.

## Steps — react

Load `references/watch-and-react.md` § React. Check the rival is one (if untracked, ask whether it competes — adding is free); verify the move with a dated source (in a hosted chat, a dated link or screenshot from the human) and check list vs promo, intro vs everyone, storefront or country; refresh, diff against the snapshot, say what it means for our offer, angles and search, and give 2–3 options including "do nothing", each with who acts. Pricing is the human's call — never recommend matching by reflex. Save the dated note in the rival's file.

## Approval gates

- **Set changes:** asks before adding or dropping any rival; removal only on the human's own press of the server's card (or in the app).
- **Spend:** free sources first; every paid read through the spend gate's yes. The standing watch never spends on data.
- **Standing watch:** created paused; on only on a yes, its own run cost unpriced until the first run.
- **Learnings:** only on the human's yes, in their words.
- **Never:** publish, contact anyone, or claim a rival's spend, ROAS, CTR or conversion. Budget, channel and pricing decisions stay with plan-campaign and the human.

## Output and write-back

| Artifact | Where it lives | How readers find it | Who reads it next |
|---|---|---|---|
| Confirmed set | server roster | `gooseworks:competitor_read` | listen-social, research-market, the app |
| Competitor file | `research/competitors/<slug>.md` + document | the path; else `knowledge_search` document "competitor file <rival>" | plan-campaign, make-content (comparison pages), the human |
| Landscape | `research/competitors/landscape.md` + document | the path; else document "Competitive landscape" | plan-campaign, write-my-positioning (backlog) |
| Angle bank | `research/competitors/angle-bank.md` + document; ≤ 3 `[angle A-NN …]` learnings on a yes | the path; else document "Angle bank"; makers tag ads `angle:a-nn` (lower-case) | make-static-ads, make-video-ads, plan-campaign |
| Rival ad references | the server's competitor template pool and reference media | `ads_template_read` mode competitor; `media_list` tag `competitor_ad` | make-static-ads (structure only), make-video-ads |
| Watch digest | `research/competitors/watch/<YYYY-MM-DD>.md` + document (keep-history) | newest file in `research/competitors/watch/`; line 2 is `Week of <date> · <n> material changes · …` | the human; analyze-performance ("competitor move") |

## Done when

- The hand-over opens with "Do this first, because…" and the set was confirmed before any change; no UNSURE page's ads were read.
- The top 3 rivals' full active libraries were read — or the teardown is labelled "partial — sample only" and says why.
- Every ad listed is real and active on its stated date, no more than 7 days before hand-over, with its library link and days running; the header says how many links were spot-checked.
- Each deep rival's file has positioning, offer, funnel, ads, content, social, releases and review signal, or names what was not read.
- One briefable angle, handed to make-static-ads as the brief, works without extra research; without approved claims, angles are honestly "needs proof" and the hand-over says what unlocks them.
- Nothing claims a rival's spend or results; every "what works" line is labelled inference with its evidence.
- Saved and findable; credits within the approved ceiling.

## Out of scope

- Making the ads — make-static-ads, make-video-ads.
- Budgets, channels, pricing moves — plan-campaign and the human.
- Mining review quotes — research-market (read here, never redone).
- What people say about the brand and rivals — listen-social.
- Our own search and AI-answer visibility — improve-search-visibility.
- Marketplace listing depth — optimize-listings (backlog).
