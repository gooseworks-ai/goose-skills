# Creative ranking and the channel reads

Load at step 4.

## Creative ranking — in angle, hook and format terms

Data (with GooseWorks; local mode: `local-mode.md`): `gooseworks:meta_read` `view: "performance"` (7- and 28-day windows, ranked by spend) for Goose ads; each ad's **angle annotation** from the makers (make-static-ads' batch file `ads/batches/<YYYY-MM-DD>-<slug>.md` maps creative id → angle, hook, test and picks; its lower-case tags, e.g. `angle:a-07`, via `gooseworks:ads_creative_read` — query lower-case; a video's name, when it carries its angle and hook family; plus the campaign concept it came from via `campaign_read`); the marketer's export for non-Goose ads; UTM store conversion per angle where store data exists.

Rules:
- **Rank on the business event for the company type** (`measurement-contract.md` §1). For DTC that event is the purchase: rank ads **within a platform** on purchase CPA, labelled *claimed* — platforms overcount the level, not usually the order — and cap the verdict at **likely**; raise it to **confirmed** only when UTM-joined store orders, or the account-level new-customer number, moved with it. For B2B rank on cost per qualified lead from the CRM (CPL is a leading signal); for apps on cost per activated/retained user. When the ad data has only an **upstream proxy** (installs, leads, sign-ups, add-to-carts, landing-page views, clicks), the verdict is **"cheap <event>, quality unknown"** — no winner, no learning, and the next-make says *test*, not *scale*.
- Ads without a maker's angle annotation (the marketer's own ads) are **"unannotated"** unless the marketer tags them — never infer an angle from an ad name.
- First run: there is no trend yet (trailing windows only) — say so.
- **Coverage first:** "ranks 62% of Meta spend; 38% is non-Goose ads I can't see in detail."
- If `meta_read` returns `insight.available: false`, report the numbers and **name no winner**.
- **Rank by spend, then judge efficiency.** Minimum gates before a verdict (rules of thumb): ~1–2× target CPA spent and ~1,000+ impressions to read a hook; ≥ ~10–15 conversions to call a winner; kill-worthy only at ~2–3× target CPA with 0–1 conversions.
- **Group by angle, then hook, then format.** The maker needs to know *which reason to buy* worked and *which opening* carried it, not that "ad #7 won".
- Fatigue is reported as a **trend** (CTR/CVR slope over 2–3 weeks at flat spend; frequency if exported); the swap is run-paid-campaigns' move.

| Angle | Hook | Format | Ads | Spend | Purch. (claimed) | CPA | CTR (trend) | Verdict (how sure) |
|---|---|---|---|---|---|---|---|---|
| Hidden pore-cloggers | "Check your moisturiser's label" | UGC 15s | 4 | $2,900 | 94 | $31 | 1.4% (flat) | Winner (likely) |
| Award proof | "6× award-winning" | static | 5 | $2,100 | 45 | $47 | 0.9% (↓) | Loser vs $38 (likely) |
| Founder story | talking head | 30s | 2 | $400 | 6 | $67 | 0.8% | Too early (n=6) |

**What to make next** follows from the history, not this week alone (`run-memory.md` § What worked): more hooks on an angle that has won 2+ runs and is tiring across the records (it goes first), retire the loser, give the too-early one a fair test, and one organic overperformer to try as paid. Never an angle that already failed (a `didn't work` readout, a worn-out angle in the brain, a Loss call) without a new reason. Last run's make-next items that were never made are carried with their first date, not restated. Each item names the producer (make-static-ads, make-content, or the goose-video skill for video ads), why, and the records it rests on.

## Email & SMS (light)

From the marketer's email-tool export; if none, the row reads **"not measured this week"** — never dropped. email-lifecycle's program sheet (`lifecycle/program.md` in the brand coworker workspace) says which flows exist, so a flow missing from the export is noticed.
- Revenue split **flows vs broadcasts** (a mature programme often earns ~25–50% of email revenue from flows — rule of thumb); revenue per recipient per send; click rate; unsubscribe and complaint rates (complaints above ~0.1% threaten deliverability).
- Judge on clicks and revenue per recipient, not opens (Apple Mail Privacy Protection inflates opens).
- Email-attributed revenue double-counts with paid (email tools often credit opens within ~5 days) — it is a claim, shown in the claimed column.
- Best and worst send of the week with the subject/angle; flows that dropped. The deep flow audit is email-lifecycle's.

## Organic social (light)

From `gooseworks:social_analytics_get` (`view: "posts"` and `"accounts"`) for the brand's own accounts (`gooseworks:social_account_list`); `not_available` → row says so.
- The week's reach and engagement vs the account's own trailing median.
- **Overperformers:** posts at ≥ ~2× the account's median engagement or reach, with the hook and angle named — flagged as **paid candidates** and for run-organic-social's next mix.
- No organic revenue attribution. research-market reads what others say; this reads how our posts did.

## B2B pipeline (when the type is B2B / services)

From the CRM export: leads, SQLs, opportunities and pipeline by original source this week and month-to-date; cost per SQL per campaign; lead quality notes (spam, wrong fit); the self-reported field vs the source field. Founder LinkedIn / X posting is a rostered channel — numbers come from the marketer (screenshot or export), since GooseWorks reads only TikTok and Instagram accounts.

## Google (light)

From the marketer's export. Channel row: spend, conversions, claimed revenue, CPA, impression share if given. **Search-terms / wasted spend:** if the search-terms report is provided, list terms with spend and zero conversions (or clear irrelevance) and the share of spend they took — handed to run-paid-campaigns, which stages the negatives as written instructions. Brand-search campaigns are reported separately: their ROAS is mostly harvested demand.

## Apps (light — named row)

If the marketer provides an MMP / RevenueCat / App Store Connect export: installs → D1/D7/D30 retention → trials → payers by source; cost per retained user or per payer, never cost per install alone. SKAN/AdAttributionKit data lags 24–72h+ and is aggregated — say so. Without it: "App cohorts — not measured (no export)."

## Other channels

- **Creators:** wave results per creator (win / partial / miss / no-data against each pick's wave-1 criterion) from `creators/roster.csv`, plus code redemptions and link clicks when the marketer provides them; with no roster, a named future row.
- **Outreach:** reply and meeting rates when research-audience's human-run outreach numbers are offered; else a named future row.
- **WhatsApp:** named future row.
- **Local / offline:** calls, bookings, codes, "how did you hear" answers from the booking/POS export.
- **Search visibility:** when improve-search-visibility has run, carry its last check date; if organic search traffic moved sharply this week, nudge a re-check.
- Channels off the roster go in one line ("Not used: …"); future rows in one line ("Future rows: …").
