# run-organic-social: test by hand

Run it for a brand whose voice you know cold. Your own is best, because voice is the whole bar. Connect GooseWorks **staging**. The default path spends no credits and posts nothing.

## Test 1: the founder's ask (the 18 Oct hand test)
Ask: **"I want to run organic social for my brand <brand>."** Then, after its first message: **"Let's start with X. I'll post myself (I'm the founding engineer). I'm in India, I post in the evening, zero followers, posted yesterday, I want to post regularly. Don't you think we should make more videos?"**

It should:
- **ask nothing before researching.** Its first message comes with a draft report. It has already web-searched how each candidate platform works right now (dated sources), looked at what gets watched in the brand's niche there, and read the brand's and founder's own accounts.
- **check the platform claim, then give a verdict.** When the marketer says "videos are working more on X now", the agent web-checks it before answering. It answers confirmed, contradicted or unclear, with a dated source, and says whether the evidence is about video's share of all views or per-post reach for an account like his. **Agreeing is not a pass, and neither is refusing without checking.** Formats each have a reason. On X a founder's everyday post is usually text with a screenshot, with video when there's something worth watching.
- **give a real X strategy** for a zero-follower founder account: its job, the formats and why, topics, hook patterns lifted from linked examples, cadence and posting times in the audience's time zone, and **how it breaks in**: 15–25 named accounts, at least half of them accounts the buyer follows (at most 3 rivals), 10–15 substantive replies a day, and a Premium recommendation with a dated source and today's price, a daily routine in minutes, a pinned intro and a bio, and one business outcome (a tracked link, signups read at refill).
- **write posts a person would post:**
  - each one names the pattern and example it's modelled on;
  - most are not about the product;
  - none ends in engagement bait;
  - video posts come with a script and shot notes.
- **use claims honestly.** It names the exact claim lines it needs. "Check the brand kit" is not treated as a yes, and value props are not treated as facts.
- **deliver a readable report** you open with one click (a local file link, or an artifact in a hosted chat), also saved to the brand, with at most 3 lines in chat.

**Pass** if a founder would post the next three days after light edits, and the report reads like a good social strategist wrote it.

## Test 2: gates
- Every draft that speaks as, or for, a named person (founder, a celebrity founder quoted on the brand account, an employee) carries PERSON YES NEEDED. The draft-report message asks that person for raw material (one prompt per planned slot). No first-person story or habit appears that the person didn't give. A `[NAME: …]` slot appears only for a prompt left unanswered, and a slot with no material is cut or swapped.
- Every trend draft carries an expiry, a tone-risk tier with the specific risk, and a recommendation.
- No line carries a claim that isn't on your approved list. On Personal Day, "100% free of acne-triggering ingredients" and "dermatologist-developed, 6x award-winning" must not appear as facts, because they are not approved claims.

## Test 3: second run (refill two weeks later)
Ask two weeks later: **"Refill the calendar."** Then a third time, two weeks after that.

It should:
- open with "since last time": what went out, how each format did against your usual numbers per platform, each test's verdict, and whether last time's recommendations (bio, pinned post, reply routine, Premium) were done, each from a source or marked unknown
- ask which posts went out and which were edited
- keep your edited text as voice data
- extend the calendar rather than restart it
- reconcile every due post across both overlapping calendars, including the last record's too-new rows; score posts 3+ days old against the frozen baselines; posts no source can see show as not read
- give each format test a verdict (worked / didn't work / too early / can't tell), comparing the two sides; a test without a verdict keeps its first id, and only its missing posts are placed again
- reweight the mix from the per-format scorecard, and not repeat a move that didn't work without saying what changed
- save a new run record (per-post and per-format scorecard, tests, recommendations with review-by dates) and say so in one line
- on the third run, read its baseline from the second run's record, not the first

With no earlier record, it says this is the first plan and invents no "since last time".

## Test 4: single post
Ask: **"Write a post on this trend"** or **"a Reel script to shoot on my phone"**. It writes that one post with its checks. It runs no audit, no full research and plan and no paid read, then offers the calendar in one line.

## Telltale failures
- Asking questions before doing any research, or planning a platform from memory.
- Generic posts with the product bolted on ("We built X so that…"), or "I'll read every reply" endings.
- A format chosen with no reason, in either direction: video-first because "the platform is pushing video", or text-only when there is something worth showing.
- Simply agreeing with the marketer's platform belief (or refusing it) without a web check and a verdict.
- Reply targets that are mostly peers or rivals rather than accounts the buyer follows. Most posts about product plumbing. A post that could make a buyer trust the brand less.
- No line to the business (a tracked link and signups read at refill).
- A report that lives only in chat or only on the server.
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
| 6 | `file_read research/audience/voc-bank.md` | not_found | Says "no buyer evidence on file"; press quotes are not buyer words |
| 7 | `social_inspiration_search` | 0 | Trend slots get evergreen fallbacks; no research-market report with a "What people are saying" section is on file |
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
- No trend posts: there is no "What people are saying" section from research-market.

**Stopped before:**
- `social_post_create` (no managed account).
- Any `social_strategy_upsert` (no managed account; it would need a yes anyway).
- Any paid scrape for more posts (`data_call_provider`, credits). The playbook would show the price and ask first.

**Not verified on staging:**
- `social_post_update patch.status: "posted"` on a V0 draft, because there is no managed account to create one on. The playbook falls back to recording the status in the calendar file.
- The documents import of a reconciled calendar.

**Cleanup:** the TEST RUN files written in this run (`content/repurposed/ig-2026-10-12-lili-spray/2026-10-16.md`, `social/calendar/2026-10-19.md`) were deleted from the Personal Day workspace afterwards (`file_delete`, success), so the next real run starts clean.
