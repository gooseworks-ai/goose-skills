# Launching and graduating

Load at the launch step (step 5). **Local mode** (`local-mode.md`): no GooseWorks reads or pushes; routes 1–2 are out, so launches are route 3's written cards or new objects created paused through the marketer's connector (`meta-levers.md` § With an ads-platform connector), and creative is the marketer's own files or ads already in the account (item 3's second bullet). The launch **executes the brief's test plan and paid-structure line** — it does not design a new plan. If the server cannot express what the brief asks (purchase objective on a new campaign, app installs, radius targeting, Instagram placements), say so and offer the nearest honest option: push into an existing conversion ad set, or written launch cards. These are this playbook's launch rules; follow them rather than looking for any other launch skill the tool descriptions mention.

## Health gate (before any money moves) — per chosen platform

Any **fail** blocks launches and scale moves for that destination:
1. **Tracking verified.** The purchase / lead / signup event fires on the real conversion page (the marketer confirms in the platform's events tool, or analyze-performance shows platform conversions tracking store orders at a steady ratio). For a NEW_CAMPAIGN the server's destination preflight detects whether Meta tracking is on the page; LPV optimisation is used only when it is. **Lead-gen:** the lead source (UTMs / hidden form fields) is captured in the CRM, or cost per qualified lead per campaign is unknowable — a fix card if not. **Apps:** SDK/MMP postbacks firing, SKAN/AEM configured, store listing live.
2. **Destination.** Loads on mobile, shows the advertised product, price matches the ad, offer/code valid, product in stock, UTMs present.
3. **Creative.** Only what the marketer picked.
   - **Statics** from make-static-ads (GooseWorks only): its batch file (`ads/batches/<YYYY-MM-DD>-<slug>.md`, which lists the picks) and `ads_creative_read` (`approved_only: true`, lower-case tag `picked`), copy verbatim from the batch file. Its claims and ad-policy checks ran there.
   - **Anything no released maker checked** — videos already made in GooseWorks (`video_read`: kept videos, and their scenes for the script; `video_share` gives a link a card can use), the marketer's own images or videos, an ad already in the account being reused. Check it here, before staging: copy (primary text, headline, description) comes from the marketer, verbatim; run the `claims-gate` skill (`../../claims-gate/SKILL.md`) on the copy and on every spoken line, on-screen text and end card, then the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) per platform. Ask once whether it shows realistic AI-made people, voices or scenes; if yes, the platform's AI label goes on the launch card. A cut line blocks that creative until it is fixed (a fix brief for whoever made it). Script or on-screen text you can't read (no plan in GooseWorks, a file you can't watch) → the card is marked **not claim-checked** and can't launch until the marketer pastes or confirms those lines and they pass the same checks.
   - Advantage+ creative enhancements (auto text, variations) can alter approved claims — recommend the marketer checks those toggles (card). Special ad categories and AI-disclosure needs flagged by the makers are applied at launch (card if not drivable).
4. **Account.** Meta only: a publishable Page (`meta_read view: pages`; local mode: the connector, or ask). Every platform: no known payment failure or spending-limit block (ask if unsure).

## UTMs (per platform, always)

`?utm_source=<meta|google|tiktok|linkedin|…>&utm_medium=<paid_social|cpc|…>&utm_campaign=<campaign-slug>&utm_content=<angle>-<src id>` — so analyze-performance can join store or CRM conversion to the angle.

## Route 1 — push into an existing conversion ad set (preferred for sales/leads on Meta; GooseWorks only)

When the brand already runs a purchase- or lead-optimised ad set: ask the marketer for its ad set id (Ads Manager → ad set → id), `refresh_meta_sync` only if it was created since the last daily sync, then `prepare_meta_ad_push` `mode: EXISTING_AD_SET`. It inherits that ad set's budget, audience, optimisation and placements (Instagram may not be added — `instagram_actor_id` stays unset). Adding ads is a significant edit to that ad set (this week's one edit), and budget changes there are cards.

## Route 2 — Goose Traffic test (angle/hook test; GooseWorks only)

A push carries one primary text / headline / description and one destination for all its ads — so **one push per angle cell and copy set** (`utm_content=<angle>-<src of the push's lead creative>`), using a copy set whose claims cover every ad in the push. A swap keeps the old ad's destination, so analyze-performance joins swapped ads by Meta ad id. `mode: NEW_CAMPAIGN`: one paused campaign + ad set, 2–3 ads, lifetime budget, broad countries the marketer selects, `LANDING_PAGE_VIEWS` when tracking is detected. Size the lifetime budget to the brief's $/cell over the test window. Read it on CTR, cost per landing-page view and the UTM traffic's store conversion rate — an angle test, not a performance campaign; it is not scaled, its winners **graduate**. Never use it to send traffic to an app-store URL in place of an install campaign.

## Graduating a winner — the marketer's call

Pushing a winning render into the marketer's main conversion ad set (route 1) can reset learning on the ad set that carries most of their revenue. Present it as a choice with the risk stated:
- **A — add to the main ad set** (link): fastest; one significant edit; learning may reset for a few days.
- **B — a separate "Goose graduates" ad set** in the same campaign (card: duplicate the main ad set, add the winners there, small budget): protects the main ad set; slower to scale.
- **C — duplicate the winning ad into the main ad set by hand** (card), keeping its social proof.
A render already live in a Goose push may be refused for a second push (unverified — see server-needs); if prepare refuses, fall back to B or C.

## Route 3 — written launch cards

Everything else: app-install campaigns, Apple Search Ads, local radius, a sales objective with no existing ad set, other platforms. A launch card names campaign, ad group/ad set, objective and optimisation event, (Google Search) the responsive-search-ad copy from the brief's asset row once the marketer confirmed it and proposed keywords from research-market's demand read, budget, audience/geo, creative (files or share links), destination with UTMs, and how to verify it went live. **Apple Search Ads**: brand, category, competitor and discovery (broad/search-match) campaigns, custom product pages per angle; ASA does not run uploaded videos — creative is the store listing. **Meta app installs**: app campaign with the app's install or in-app event, the kept videos, AEM configured.

## The launch proposal

Present: route, objective/optimisation, budget (and why it is enough for a readable answer — $/cell from the brief), schedule, geography, creatives (names), destination with UTMs, the health gate result, what will be read and when. For routes 1–2, `prepare_meta_ad_push` (with `goose_campaign_id` = the GooseWorks campaign, so the push attaches to it) saves a fully paused plan and returns an approval URL — call it when staging (it creates nothing in Meta), poll `push_status` until `AWAITING_APPROVAL`, add the push id to `state.md`'s `meta_push_ids` at once (the server matches outcomes by it), summarise the saved plan in plain words and give the approval URL. Never say ads were pushed until `push_status` confirms. On resume read `push_status`; never prepare a duplicate.

Respect learning: new ads are held (no judgement) for 3–5 days or until ~1× allowable spent each, whichever is later.
