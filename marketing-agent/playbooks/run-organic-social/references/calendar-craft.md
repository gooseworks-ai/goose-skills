# Calendar craft

Load at the plan step. A calendar the human can keep beats a brilliant one they abandon on day three.

## Each account's job, pillars and series

For every account, set out:
- **Job.** Brand account (proof, product, community) vs founder or exec account (point of view, lessons, build-in-public). A founder account is not a second brand account.
- **3–5 pillars** specific to this brand. "Ingredient myths for acne-prone skin" is a pillar; "education" is not. Derive them from positioning, the voice-of-customer bank's recurring questions, what has performed (the account audit), and the founder's stance ledger.
- **1–2 named series** per account: recurring formats that lower the cost of each post and build expectation, e.g. "Ingredient check Tuesday: you send an ingredient list, we read it" or "One customer question, answered".
- **The standing mix** as ratios (below), adjusted to what the audit shows works.

For TikTok and Instagram accounts the product already manages (`gooseworks:social_account_list`), the pillars, voice, native rules and avoid-list live in the product's strategy (`gooseworks:social_strategy_get` / `social_strategy_upsert`, written only after the human's yes). For every other platform they live in `social/accounts.md` in the workspace.

## Standing mix (starting ratios; let the account's own results move them)

**Brand account:**

| Share | Bucket |
|---|---|
| 35–40% | Useful or entertaining posts in the niche |
| 20–25% | Proof: customer stories, UGC, approved numbers and press |
| 15–20% | Product moments: in use, how-to, new |
| 10–15% | Trend or culture (flex slots) |
| 5–10% | Community: questions, reposting customers with credit |

**Founder account:**

| Share | Bucket |
|---|---|
| 40–50% | Point of view and lessons, from the stance ledger only |
| ~20% | Behind the scenes / build-in-public |
| ~15% | How-to |
| ~10% | Proof told as a story |
| ≤10% | Product mentions |

**By company type, where to weight:**
- **B2B SaaS:** founder LinkedIn primary, X secondary, company page for proof and changelog, LinkedIn document carousels. Webinar and event promotion goes in product moments.
- **DTC:** TikTok and Instagram primary. The product *is* the content, so product moments can rise to ~30% when shown in use. Pinterest for home, food, fashion and beauty. Drops and sale moments, with UGC reposts (rights asked first).
- **Consumer app:** TikTok-heavy, faceless formats (POV, wall-of-text, memes, screen recordings), feature-release posts, the app-store link in bio.
- **Two-sided marketplace:** separate pillars, or separate accounts, for each side.
- **Local or multi-location:** Instagram and Facebook. One master calendar with per-location variants (hours, address, local event). Local events.
- **Services or agency:** founder thought leadership, case-study posts (approved only), newsletter-to-post cuts.
- **Creator:** the account is the business. Series, collabs and sponsor disclosure matter, and the engagement plan matters more.

## Cadence realism

- Plan the cadence the human actually kept over the last ~8 weeks (from the audit), plus 20% at most, never the aspiration. If there is no history, ask how many hours a week they have and cap it.
- **Rough cost:** a text post takes ~15 minutes to finish and post; a carousel ~10 to review and post when rendered with goose-graphics (~45 to design by hand where the host can't render); a short video 30–90 minutes to shoot and edit.
- **Solo-marketer ceiling:** about 10–15 slots a week across all accounts, founder posts included.

| Platform | Typical slots per week |
|---|---|
| Founder LinkedIn | 3–4 |
| Company page | 2 |
| X | New or small accounts the marketer chose: about one post a weekday plus the daily reply routine, fitted inside the person's stated hours (text posts ~15 min, videos 35–50 min). Established accounts: what they kept, +20% |
| Instagram | 3 feed or Reels, plus Stories on 3–5 days |
| TikTok | 3–4 |
| Shorts | Re-cuts of TikTok |
| Threads | 3–5 light posts |
| Pinterest | 5–10 pins, batched |

- Every video slot needs a person who can shoot it that week. Name who in the slot.
- One short-video shoot can fill TikTok, Reels and Shorts slots, each with its own caption, cover and on-screen text and no watermark. Count the shoot once.
- When the ask exceeds capacity, say so with the numbers ("3 platforms daily is ~8 hours a week; you said 3. I recommend Instagram and TikTok, 3× a week each") and let the human pick. **A skipped slot beats filler.**
- Brand has no platforms, or dead ones: recommend 2–3 platforms, each with a job. Base the choice on research-audience's buyer groups (`research/audience/buyer-groups.md` and its latest report, "where to reach them") when it exists, and on company type, inferred from the description and audience (the kit's `brandType` field can be wrong). Say when it rests on general knowledge. The human picks. Never "all of them".

## Evergreen vs trend

Plan 75–85% evergreen. Leave 1–2 **flex slots** a week marked "trend: swap within 48h if one lands". A two-week plan cannot predict trends. Trend posts that are already known (from this run's platform research, research-market's latest report or the inspiration library) can be drafted now, each with an expiry (references/post-checks.md).

## Format tests (how the calendar learns)

Every calendar names **1–2 format or hook tests**, so the next refill learns something instead of just recording what went out.

- **Shape:** `T1 (<record id>) · <hypothesis> · slots: <ids> vs <comparison slots> · judged on: <metric>, side vs side · read at: <the first refill after the last slot is 3 days old>`. Example: "T1 (20261019-2) · POV hooks beat product-first hooks on TikTok · slots S3, S7, S11 vs S5, S9 · judged on median views, side vs side · read 2 Nov". The record id comes from the run record (references/run-record.md) and stays with the test for life.
- **One variable per test:** hook style, format (carousel vs Reel), series, posting time or length. Aim for **at least 4 slots on each side**; when the cadence can't hold that in two weeks, the test runs across two calendars. Keep everything else as close as you can.
- **Pick tests from real doubt:** an open test carried from the last run record comes first. Then the audit's mixed results, analyze-performance's "what overperformed", or a format the marketer wants to try.
- **At refill, read each test** (references/run-record.md has the settled-age rule, the baseline recipe and the verdicts):
  - Pull each posted slot's numbers: `brand_read organic`, `social_analytics_get` for managed accounts, a proxy read under the spend gate, or numbers the marketer pastes. Score only settled posts.
  - Give a verdict in run-memory's words: **worked**, **didn't work**, **too early (fewer than 4 scored posts a side; with 2–3 a side, add the direction labelled "a first look, not a verdict")** or **can't tell (something else changed)**, with the numbers. Compare the two sides with each other, not with the account's median.
  - Reweight the mix: more of the winner, retire the loser.
  - A result becomes a learning only when the marketer agrees it is a rule (save-learning atom).
- **A test carries forward until it has a verdict,** with its first id. Only its missing posts (skipped or unread) are placed again, ahead of new tests; posts still waiting to go out are not duplicated. Two refills past its review-by with still no verdict → ask the marketer once to keep or drop it.
- **New account or no baseline:** call a test only on a gap of more than 2×; otherwise `too early`.
- **Never call a test from a handful of posts.** With fewer than 4 scored posts a side, the verdict is `too early` and the test carries over; at 2–3 a side the report may give the direction, labelled "a first look, not a verdict".

## Launches and campaigns

When a plan-campaign brief has an organic leg (`gooseworks:campaign_read`), it overrides the mix for its window:

| Window | What runs |
|---|---|
| T−10 to T−3 | Problem and behind-the-scenes posts, no announcement |
| Launch day | The founder post leads; the brand posts a native version on each platform |
| T+1 to T+10 | Demo clips, FAQ, first reactions and proof (approved only) |

Clear other product moments and pause trend posts in launch week. plan-campaign owns the plan; this playbook writes its organic leg.

## The seasonal and cultural pass

For the two-week window, list the dated moments for the brand's region and audience: holidays, cultural and shopping moments (e.g. Halloween, Diwali, Black Friday / Cyber Monday, Ramadan, Lunar New Year, back to school), awareness days relevant to the category, and the brand's own dates from the brain (`this week and what's coming`, launches, live promotions, "do not promote" windows). Look up every date. Never assume it from memory. Note any clock change in the window (e.g. US daylight saving ends the first Sunday of November) and keep posting times in local time. Mark days to stay silent (tragedies, the brand's "don't post" list). Only promote offers the brain holds with dates. Never invent a sale.

## Posting times

- **Own data first.** The account audit gives `posted_at` times and engagement for recent posts (`gooseworks:brand_read` `sections: ["organic"]` for TikTok/IG; `gooseworks:social_analytics_get` when the account is managed and connected). Use the slots where their own posts did best.
- **Little data (under ~10 posts):** use the account's own usual posting times as the starting guess.
- **No data at all:** start from the audience's local rhythm and label each one "starting guess":
  - B2B LinkedIn: Tue–Thu, 7–9am or noon.
  - X: mornings.
  - Consumer IG/TikTok: 6–10pm and weekends.
  - Pinterest: evenings and weekends.

  Vary the times across the two weeks so the next run has data; a posting-time question can be one of the format tests.
- **The human posts by hand,** so the recommended time is when the audience is online *and* the human is free for the first 30–60 minutes to reply. Ask for their windows once and save them.
- All times are in the account's time zone, stated once at the top of the calendar.

## Run modes

| Mode | When | What changes |
|---|---|---|
| Fill two weeks | First run, or the calendar ran out | The full plan |
| Refill (every two weeks, or sooner on request) | A calendar exists | Load the last run record, reconcile what went out, score it and read the format tests, reweight, keep what's queued, add the next two weeks with carried tests first, save a new run record |
| Mid-cycle insert | A trend or news moment (research-market's report, the platform research, or the marketer) | One flex slot filled (or the lowest-priority post bumped), with expiry and tone risk |
| Launch | A plan-campaign brief with an organic leg | The launch window overrides the mix |
| Crisis pause | A crisis surfaces (research-market posts a serious risk in chat with a hold list naming scheduled posts, or its report's risks, or the human says so) | A hold list: which queued drafts read badly now and should be pulled. Holding lines and replies are the marketer's (reply drafting is in the backlog) |
| Seasonal pass | Always part of the plan | Dated moments and silent days for the window |
| New account | The brand has no account on a platform it should be on | Check the handle is free on each platform (with the host's fetch or browser, or ask the marketer). Then the handle, bio, pinned post and first 9 posts (a coherent first grid: who it's for, a series opener, a proof post only if signed-off proof exists (otherwise a second product-in-use post), a product-in-use post) lead the calendar, then the normal mix |
