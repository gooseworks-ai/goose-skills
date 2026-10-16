# run-organic-social: test by hand

Run it for a brand whose voice you know cold. Your own is best, because voice is the whole bar. Connect GooseWorks **staging**. The default path spends no credits and posts nothing.

## Test 1: fill two weeks
Ask: **"Fill my social calendar for the next two weeks and write every post."**

It should:
- say once, up front, that it plans and writes but does not post, schedule or reply
- confirm accounts, platforms, cadence and each account's job, asking only what the brain doesn't hold (handles, founder vs brand, hours a week, time zone, posting tool, free windows)
- audit each account: top and bottom posts and why, the cadence actually kept, best slots
- build or show a voice card per account (founder gets their own)
- hand back a dated two-week grid with a ready-to-paste draft in every slot, the flags, and a posting sheet

**Pass** if every slot has a draft and you would genuinely post the next three days' drafts after at most light edits.

## Test 2: gates
- Every draft that speaks as, or for, a named person (founder, a celebrity founder quoted on the brand account, an employee) carries PERSON YES NEEDED. The intake message asks that person for raw material (one prompt per planned slot). No first-person story or habit appears that the person didn't give. A `[NAME: …]` slot appears only for a prompt left unanswered, and a slot with no material is cut or swapped.
- Every trend draft carries an expiry, a tone-risk tier with the specific risk, and a recommendation.
- No line carries a claim that isn't on your approved list. On Personal Day, "100% free of acne-triggering ingredients" and "dermatologist-developed, 6x award-winning" must not appear as facts, because they are not approved claims.

## Test 3: second run (weekly refill)
Ask a week later: **"Refill the calendar."**

It should:
- ask which posts went out and which were edited
- keep your edited text as voice data
- extend the calendar rather than restart it
- give each named format test a verdict (win / lose / unclear) with the numbers, and reweight the mix from it

## Test 4: single post
Ask: **"Write a post on this trend"** or **"a Reel script to shoot on my phone"**. It writes that one post with its checks. It runs no audit, no two-week intake and no paid read, then offers the calendar in one line.

## Telltale failures
- Posts that sound like anyone's brand but yours: they fail the swap test.
- The same text pasted across platforms.
- A cadence you could never keep.
- A trending song scripted for a TikTok brand account.
- A link in the body of a LinkedIn post.
- Anything approved for managed publishing, queued or posted.

## Staging run log (2026-10-16, GooseWorks staging; nothing spent, nothing posted)

Brand: **Personal Day**. Ask: "Fill my social calendar for the next two weeks and write every post." Window: Mon 2026-10-19 to Sun 2026-11-01.

| # | Call | What came back | What the playbook does with it |
|---|---|---|---|
| 1 | `brand_read` (list) | coworker `9d554b73-…` | Workspace scope |
| 2 | `brand_read` accounts, sources, organic, kit, learnings | `accounts: []`; own IG @personalday and TikTok @personaldayskin as self sources; 12 own posts Oct 5–12 (7 IG, 5 TikTok) with views, likes, comments and `posted_at` (all 16:00–20:20 UTC); 4 IG captions cut off; 10 competitor top posts | Audit window stated as "8 days"; top/bottom 3 rule (under 15 posts); cut-off captions left out of the voice measurements; own posting times are the starting guess |
| 3 | `social_account_list` (Personal Day, Cumin Club, Braxley) | 0 managed accounts on every staging brand | `social_strategy_*` and `social_post_create` paths do not apply; everything lives in the workspace |
| 4 | `brand_read` learnings (full) | No claims sign-off marker | Plain product facts only; efficacy lines from past captions ("kills acne causing bacteria") are flagged and never copied |
| 5 | `knowledge_search` document "Brand record approved claims" | empty | Confirms no sign-off |
| 6 | `file_read research/market/voc-bank.md` | not_found | Says "no buyer evidence on file"; press quotes are not buyer words |
| 7 | `social_inspiration_search` | 0 | Trend slots get evergreen fallbacks; no listen-social report exists (`social/listening/` empty) |
| 8 | `file_write social/calendar/2026-10-19.md` (header line only, marked TEST RUN) | success | Workspace write path verified |

**Audit, as the playbook produces it** (likes + comments, vs each account's median):
- **IG.** Median 1,493. Top: the brand-name pun reel (3.6×), the Mental Health Day post (3.5×), Lili pre-glam. Bottom: product-only Overdew (0.13×).
- **TikTok.** Median 209. Top: Lili at the White House (6×). Bottom: barrier tips (77).
- **Read:** the pun, values moments and Lili on camera win; product-only efficacy lists lose.

**Voice card** (one brand voice, pooled across IG and TikTok: 3 uncut IG captions + 5 TikTok = 8 measurable posts, at the minimum, so not provisional. The 4 cut-off IG captions are left out, and per-platform mechanics are measured separately):
- lowercase except product names and handles
- "+" for "and"
- at most 1 emoji, from 💚 ✨ 👀
- no exclamation marks, no hashtags on IG
- a hook line, then one 25–35-word sentence
- pet phrases: "trust me on this", "emotional support lip balm", "your new go-to"

**Gates exercised in the drafted slots:**
- A Reel quoting Lili's habits is flagged **PERSON YES NEEDED (Lili Reinhart, approver: ask)**, and its lines come from the raw-material prompts the intake sends for her. At the time of the run it was unanswered, so it carries `[NAME: …]` slots and is marked "cut or swap if no answer".
- Halloween (Oct 31) is a dated fixed slot with a tone tier. It is not a TREND.
- No trend posts: there is no listening report.

**Stopped before:**
- `social_post_create` (no managed account).
- Any `social_strategy_upsert` (no managed account; it would need a yes anyway).
- Any paid scrape for more posts (`data_call_provider`, credits). The playbook would show the price and ask first.

**Not verified on staging:**
- `social_post_update patch.status: "posted"` on a V0 draft, because there is no managed account to create one on. The playbook falls back to recording the status in the calendar file.
- The documents import of a reconciled calendar.

**Cleanup:** the TEST RUN files written in this run (`content/repurposed/ig-2026-10-12-lili-spray/2026-10-16.md`, `social/calendar/2026-10-19.md`) were deleted from the Personal Day workspace afterwards (`file_delete`, success), so the next real run starts clean.
