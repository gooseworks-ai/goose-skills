# Roster format

Load at steps 5–6 (report, roster) and 8 (re-delivery).

## `roster.csv` (one living roster; one row per creator; extended each run)

`row_type, key, name_or_handle, account_or_platform, date_listed, list_id, status, status_date, suppressed, suppressed_reason, suppressed_date, revet_by, outcome, notes` (the outcomes ledger's required columns, first and in this order — `key` = `platform:handle`, `name_or_handle` = handle, `account_or_platform` = platform), then `role, tier, deal_structure, vetting_depth, wave, wave_criterion, wave_result, quoted_rate` (the ledger's creator columns), then the roster's own: `profile_url, followers, vetted_on, sample_size, median_views, view_rate, er_by_views_or_followers, er_basis, sponsored_vs_organic, cadence, comment_read, audience_fit, audience_confidence, audience_evidence, safety, conflicts, regulated_notes, price_floor, price_target, walk_away, rights_addon, deal_reason, price_math, real_rate_evidence, watch_links, contact_route, source, brief_path`

- Fill what the run actually read; leave the rest blank, never guessed — a free pass fills perhaps a third of the columns, a top-up the rest.
- `role`: reach · ugc-for-ads · ambassador-affiliate · b2b-voice · newsletter · podcast.
- `status` (human-filled after handover): shortlisted · contacted · replied · quoted · declined · signed · posted · never-again.
- `contact_route`: the public business route only (business email found on a public page, manager/agency, "work with me" form) with its URL — looked up only for names the human approved, recorded for the human, never used by this playbook, never copied into the brand document.
- `vetting_depth`: full · light (gift-only seeding) · ugc-rubric · b2b-branch.
- `watch_links`: for UGC-for-ads finalists, 2–3 videos the human watches before approving (delivery cannot be watched through GooseWorks).
- `quoted_rate`, `wave_result` and `outcome` are filled from what the human reports (via the outcomes ledger); quotes become the brand's real rate data, wave results reweight the next roster. `wave_criterion` is the pick's win metric from `wave-1.md`.
- `near-misses.csv`: `handle, platform, stage cut (screen / vetting / pricing / mix), reason, numbers behind it, date` — screen cuts are rows with `stage cut = screen`.

## `report.md` — the deliverable (what the founder reads first)

Every number has a date and a link to the post it came from and is labelled **fact** (read on the page) or **inference**. Fictional example — never reuse its values.

```
# Creator report — <Brand> — <YYYY-MM-DD>

## Do this first, because…
Message @fictional_skinnotes and @fictional_acnediary this week: both already post acne-safe routines that out-perform their own median (links), neither works with a rival, and a $600 test of the two tells you within 14 days whether paid creators beat your current ads.

## Timely openings
- @fictional_acnediary posted "my breakout-safe routine" on 2026-10-14 — 3.1× her median views (link) · fact. For you: she's in the buying moment for your audience now; gift first, pay for usage if it lands.
- A rival's 3-month deal with @fictional_glowlab ended (last #ad 2026-07-30) · inference from her posts. For you: free to talk; check exclusivity.

## Assumptions (correct any)
Goal: reach + content you can run as ads (assumed from your Meta spend) · Platforms: TikTok, Instagram · Budget: not given — three wave sizes below · Gift unit cost: not on file — gift lines are rough.

## Shortlist
### 1. @fictional_skinnotes — TikTok micro (62k) — reach + UGC
- Public numbers (public-page read 2026-10-17): median 21k views on the last 12 videos, 2 sponsored (#ad) at 17k (0.81× organic), posts 3×/week; comments on 3 posts: people describing their own breakouts, "where do I get this?" ×9 · facts, links below.
- For you: fits — her "what I put on angry skin" format is a 30-second routine demo, exactly how your serum is used; she'd make one routine video with your serum as the treatment step. Claim behind it: none signed off — "you'd need proof that it's non-comedogenic first" (approve the line in the decisions below).
- Price: floor $275, target ~$500 for one video; 30-day ad usage +$70–140; walk-away ~$425 all-in (rough — needs your budget and target CAC). Deal: paid + 30-day usage, or gift + 15% affiliate if you only want organic.
- Brief and first message: briefs/fictional_skinnotes.md
### 2. …

## You vs them
- Rivals pay mid-tier dermatology creators for "ingredient breakdown" posts (3 rivals, 7 partnership ads, links). You have 4 organic tags from customers, no paid creators.
- Ahead: real customers already filming you — gift them first. Same as everyone: ingredient breakdowns — don't follow; buyers in comments ask about results on real skin, not ingredients.

## Wave 1 and how we'll judge it
3 creators, ~$600–$1,800 depending on the size you pick: Small (2 paid micros), Medium (+1 UGC + 10 gifted bundles), Large (+1 mid-tier). Criteria per role in wave-1.md (views vs the creator's median, intent comments, ad CPA vs target), read 7–14 days after posting.

## Near-misses
@fictional_x — sponsored posts get 0.3× organic · @fictional_y — 41% generic comments, likely pod · @fictional_z — rival partnership ad running now.

## What we could not read
Instagram reel plays for 4 picks (hidden logged-out) · full comment threads · audience countries — the top-up below fills these.

## Before you reach out
Approve the names (all, or strike any). Usage rights and exclusivity are asks for your negotiation, not agreed terms. Disclosure lines are in every brief. Nothing has been sent.
```

## What makes a pick good

Every claim about the creator is a number with a date and a link to real posts; the role and price follow from the goal; the deal recommendation survives the break-even test or says why it does not; the brief was written for *this* creator. If a reason could be pasted onto another creator unchanged, it is junk.
