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

A report in the `write-report` skill's shape (`../../write-report/SKILL.md` §1), with this playbook's sections inside "The story"; it passes that skill's §3 checks before delivery. Every number has a date and a link to the post it came from ("public-page read 17 Oct"). Every finding says how sure in write-report's words — **confirmed**, **likely**, **first look** — never "fact" or "inference". **Audience fit and how sure are two things:** say the fit in words (`audience_fit`, e.g. "fit: strong — 14 of 80 commenters describe acne-prone skin"); how sure comes from `audience_confidence` and the sources behind it (`vetting.md` §8): confirmed only when independent reads agree (audience countries plus on-persona comments), likely for consistent content plus comment signals, first look for content alone. A strong fit on thin evidence is "fit: strong, first look". **Claims:** a line that needs proof is never offered for approval: the decision is "send the proof, or leave it out", and proof that arrives goes back through the claims gate before any brief uses the line. No working paths, file names or ids in the report: the briefs are linked in the chat message, and `brief_path` stays in the roster. Fictional example — never reuse its values.

```
# <Brand> — creator report, 17 Oct 2026

## In short
**What we looked at:** 40 TikTok and Instagram creators in acne skincare, from their public pages on 17 Oct: the last 12 posts each, and comments on 3. Reel plays and audience countries are hidden from logged-out visitors.
1. **Two creators already post acne-safe routines that beat their own usual views** — @fictional_skinnotes and @fictional_acnediary (**likely**: the same pattern across their last 12 posts, links below).
2. **Neither works with a rival right now** (**first look**: their last 6 months of posts).
**So, do this first (because of 1 and 2):** approve the two names and pick a test size this week (Decisions 1–2); the first messages are ready to send once you do.

## Decisions for you
1. **Names:** approve @fictional_skinnotes and @fictional_acnediary, or strike either — see Shortlist.
2. **Test size:** Small (~$600, recommended: it shows within 14 days whether paid creators beat your current ads), Medium (~$1,100) or Large (~$1,800) — see Wave 1. The prices stay rough until you confirm your budget and margin per order.
3. **Claims:** "non-comedogenic" needs proof before any brief can use it. Send the test report and I'll check it, or I'll leave the line out (recommended until you have one) — see Shortlist, 1.
4. **Deeper vetting:** up to <N> credits to read hidden views and audience countries for the top picks — see What we couldn't check.

## The story

### Since last time
<3–5 lines from run-memory, or "No earlier creator run.">

### What we assumed (correct any)
Goal: reach + content you can run as ads (from your Meta spend) · Platforms: TikTok, Instagram · Budget: not given, so three test sizes · Gift unit cost: not on file, so gift lines are rough.

### Timely openings
- @fictional_acnediary posted "my breakout-safe routine" on 14 Oct — 3.1× her usual views (link) · likely. For you: she's in the buying moment for your audience now; gift first, pay for usage if it lands.
- A rival's 3-month deal with @fictional_glowlab ended (last #ad 30 Jul) · first look, from her posts. For you: free to talk; check exclusivity.

### Shortlist
#### 1. @fictional_skinnotes — TikTok, 62k followers — reach + UGC
- Public numbers (read 17 Oct): usual views 21k on the last 12 videos; 2 sponsored (#ad) at 17k (0.81× her usual); posts 3× a week; comments on 3 posts: people describing their own breakouts, "where do I get this?" ×9 · likely, links below.
- Fit: strong — 14 of 80 commenters describe acne-prone skin (likely: comments on 3 posts, no audience countries). For you: her "what I put on angry skin" format is a 30-second routine demo, exactly how your serum is used; she'd make one routine video with your serum as the treatment step. Claim behind it: none approved yet — "you'd need proof that it's non-comedogenic first" (Decisions, 3).
- Price: floor $275, target ~$500 for one video; 30-day ad usage +$70–140; walk-away ~$425 all-in (rough — needs your budget and target cost per order). Deal: paid + 30-day usage, or gift + 15% affiliate if you only want organic.
- Brief and first message: ready (linked in my message).
#### 2. …

### You vs them
- Rivals pay mid-tier dermatology creators for "ingredient breakdown" posts (3 rivals, 7 partnership ads, links). You have 4 organic tags from customers and no paid creators.
- Ahead: real customers already film you — gift them first.

### Wave 1 and how we'll judge it
3 creators at the size you pick: Small (2 paid micros), Medium (+1 UGC + 10 gifted bundles), Large (+1 mid-tier). Judged 7–14 days after posting, per role: views against the creator's usual, intent comments, ad cost per order against your target.

### Near-misses
@fictional_x — sponsored posts get 0.3× her usual views · @fictional_y — 41% generic comments, likely an engagement pod · @fictional_z — a rival partnership ad running now.

## What to do
1. **Approve the names** — you, this week (Decisions 1).
2. **Send the two first messages** — you, once approved; the drafts are ready. How we'll know: replies within 7 days.
3. **Gift the 4 customers who already film you** — you, this month. How we'll know: posts within 3 weeks.

## What we're not doing, and why
- Copying rivals' ingredient-breakdown creators: buyers in the comments ask about results on real skin, not ingredients.
- Mid-tier creators before the small test reads: the test shows whether paid creators work for you at all.
- Contacting anyone or agreeing terms: you send every message; usage rights and exclusivity are asks for your negotiation. Disclosure lines are in every brief.

## What we couldn't check
- Instagram reel plays for 4 picks (hidden when logged out) · full comment threads · audience countries — the deeper vetting fills these (Decisions, 4).

## Sources
- @fictional_skinnotes and @fictional_acnediary: TikTok and Instagram profiles and last 12 posts (read 17 Oct, links) · Meta Ad Library, rivals' partnership ads (17 Oct) · web search for creator roundups (17 Oct).
- Source skew: public pages only, read logged out; sponsored views can be boosted, and comments were read on 3 posts per creator.
```

## What makes a pick good

Every claim about the creator is a number with a date and a link to real posts; the role and price follow from the goal; the deal recommendation survives the break-even test or says why it does not; the brief was written for *this* creator. If a reason could be pasted onto another creator unchanged, it is junk.
