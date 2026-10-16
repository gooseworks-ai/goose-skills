# Roster format

Load at steps 6 and 8.

## `roster.csv` (one living roster; one row per creator; extended each run)

`row_type, key, name_or_handle, account_or_platform, date_listed, list_id, status, status_date, suppressed, suppressed_reason, suppressed_date, revet_by, outcome, notes` (the outcomes ledger's required columns, first and in this order — `key` = `platform:handle`, `name_or_handle` = handle, `account_or_platform` = platform), then `role, tier, deal_structure, vetting_depth, wave, wave_criterion, wave_result, quoted_rate` (the ledger's creator columns), then the roster's own: `profile_url, followers, vetted_on, sample_size, median_views, view_rate, er_by_views_or_followers, er_basis, sponsored_vs_organic, cadence, comment_read, audience_fit, audience_confidence, audience_evidence, safety, conflicts, regulated_notes, price_floor, price_target, walk_away, rights_addon, deal_reason, price_math, real_rate_evidence, watch_links, contact_route, source, brief_path`

- `role`: reach · ugc-for-ads · ambassador-affiliate · b2b-voice · newsletter · podcast.
- `status` (human-filled after handover): shortlisted · contacted · replied · quoted · declined · signed · posted · never-again.
- `contact_route`: the public business route only (business email found on a public page, manager/agency, "work with me" form) with its URL — looked up only for names the human approved, recorded for the human, never used by this playbook, never copied into the brand document.
- `vetting_depth`: full · light (gift-only seeding) · ugc-rubric · b2b-branch.
- `watch_links`: for UGC-for-ads finalists, 2–3 videos the human watches before approving (delivery cannot be watched through GooseWorks).
- `quoted_rate`, `wave_result` and `outcome` are filled from what the human reports (via the outcomes ledger); quotes become the brand's real rate data, wave results reweight the next roster. `wave_criterion` is the pick's win metric from `wave-1.md`.
- `near-misses.csv`: `handle, platform, stage cut (screen / vetting / pricing / mix), reason, numbers behind it, date` — screen cuts are rows with `stage cut = screen`.

## `summary.md` (what the human reads first)

(Fictional example.)

```
Do this first, because…: send the 3 UGC first messages this week — wave 1 is judged on their ads in 14 days, and that decides the rest of the budget.

Creators for <brand> · <goal> · <platforms> · budget <amount> · built <date>

The plan: 30 micro creators seeded with a routine bundle (gift-first; ~20–40% post rate → ~6–12 posts), 3 UGC-for-ads (paid per asset + 30-day usage), 1 paid micro and 1 mid-tier (paid).
Target spend: $4,850 of $6,000 (fees + bundle cost + shipping) · paid reach picks: target $830, walk-away $850 · seeding and UGC on a content goal have no independent ceiling · expected ~14 pieces, ~260k median views.
Wave 1 (test before the rest — criteria in wave-1.md): 3 UGC creators at $400 each incl. 30-day usage and one extra hook ($1,200) + the paid micro at the $345–415 floor + usage + 10 seeded bundles at ~$18 each with shipping ($180) — ≈ $1,800.

Shortlist — approve the names (all, or strike any) before anyone is contacted:
1. @handle — TikTok micro 62k — reach — median 21k views, ER 7.1% by views, sponsored holds at 0.81× — audience fit medium — offer the $275 floor + 30-day Spark usage, walk away above ~$425 all-in (organic post + 30-day usage), or hybrid $250–350 + 15% — brief: briefs/handle.md
2. …

Near-misses (8): @x — sponsored posts get 0.3× organic; @y — 41% generic comments, likely pod; @z — a competitor's partnership ad running now …

Before you reach out: re-vet anyone older than 30 days; usage rights and exclusivity are asks for your negotiation, not agreed terms; disclosure lines are in every brief.
Credits: discovery 74 of the 80 you approved; vetting 113 of the 140 you approved.
```

## What makes a pick good

Every claim about the creator is a number with a date and a link to real posts; the role and price follow from the goal; the deal recommendation survives the break-even test or says why it does not; the brief was written for *this* creator. If a reason could be pasted onto another creator unchanged, it is junk.
