---
name: run-organic-social
description: >-
  Keep my social accounts alive. Use when a founder or marketer says "fill my social calendar for the next two weeks", "write this week's posts", "plan my LinkedIn / Instagram / TikTok / X", "ghostwrite my founder's LinkedIn", "slot these posts into my calendar", "we're launching on the 12th, plan the social", "write a post on this trend", "a TikTok or Reel script to shoot on my phone", "which platforms should we be on (organic)?", or "my accounts went quiet". Delivers a dated two-week calendar with a ready-to-paste draft in every slot (posts, carousel slide copy, short-video scripts, captions, first comments, alt text) in each account's measured voice, checked for claims and disclosure, with named format tests, trend expiries and a posting sheet. You post by hand; posting, scheduling, replies and DMs are not available yet. Not for a standalone post or repurposing one piece — use make-content. Not for replies or a brewing complaint — use listen-social.
---

# run-organic-social

**Say plainly at the start of every run, in these words or close:** "I'll plan your next two weeks and write every post. I can't post, schedule or reply for you yet, so you'll post by hand from the sheet I give you." Never name tools, ids or other playbooks to the marketer. *Agent note:* replies and DMs are drafted by listen-social, not here.

## What you get

- **A two-week calendar.** Every slot is dated and timed in the account's time zone. Each carries platform, account (brand or a named person's), pillar, mix bucket, series and source (a repurposed cut, a trend, a campaign row, or fresh).
- **A draft in every slot,** ready to paste (references/slot-anatomy.md):
  - the hook plus 2 alternatives
  - the post, slide-by-slide carousel copy, or a short-video script with shot notes
  - caption, first comment and CTA
  - search keywords and alt text
  - an asset line
  - an engagement plan
  - the check results

  Flex trend slots carry an evergreen fallback, so no slot is empty.
- **1–2 named format tests** per calendar. Each has a hypothesis, the slots that test it, and how it will be judged against the account's median at the next refill.
- **Flags:**
  - PERSON YES NEEDED on any post that speaks as, or for, a named person (founder, celebrity founder, employee, customer), on any account.
  - TREND on trend posts, with an expiry, a tone-risk tier and a recommendation.
- **A posting sheet,** plus a CSV for the marketer's own scheduler on request, with a download link in hosted chats.
- **First run:** an account audit, a voice card per account and per featured person, and the pillars, mix and series, all confirmed by the marketer.

## Before you start

1. **Connection.** If no GooseWorks tools are listed, even after one `gooseworks:tools_load` for the missing group (social, brand, files, campaigns, media, data), say only: "Connect GooseWorks first — I plan and write your posts from your brand through it." Nothing else runs.
   - First GooseWorks call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`, `client`). Its answer settles setup and the brand only; this playbook's gates win.
   - Send `client` on every call that takes it.
2. **Brand and workspace.** `gooseworks:brand_read` with no `brand_id` lists brands with their `coworker_agent_id`, the scope for every file below. If the brand has no coworker, use the default workspace with paths prefixed `brands/<brand-slug>/`, and tell the marketer. Never use the org shared scope. Read before you write.
3. **Read everything first, silently.**
   - **Brand read.** `gooseworks:brand_read` lean (no `detail`) with `sections: ["summary","kit","learnings","accounts","sources","organic","products"]`. A lean read returns every `must` and `dont` fact, which is enough for the claims marker, the claims you may use and the never-say list. Then `product_ids: [...]` for the products slotted into the window.
     - Read learnings in full (`sections: ["learnings"]`, `detail: "full"`) only for `do`, `insight` or `template_hint` rules.
     - Never request `detail: "full"` across several sections.
   - **Rules.** `gooseworks:knowledge_search` for "operating rules, disclosure, who approves founder posts, topics off limits, this week's focus and promotions".
   - **Workspace files.** `gooseworks:file_list` / `file_read` on:
     - `social/`: the last calendar, `social/accounts.md`, and the newest `social/listening/<D>-report.md` (`<D>` = the counting week's Monday; judge freshness by its line-2 `Trends read: … · valid to: …`, not the file name)
     - `brand/voices/`
     - `content/repurposed/`, `content/channels.md`, `content/pov/`
     - `research/market/voc-bank.md`, `research/market/personas.md`
     - the newest `reports/performance/<date>.md` (organic "what overperformed")
   - **Accounts and campaigns.** `gooseworks:social_account_list` and `gooseworks:social_strategy_get` for managed TikTok/IG accounts; `gooseworks:campaign_read` (list) for campaigns with an organic leg in the window.
4. **One post, not a calendar?** If the ask is a single post, script or trend post, run #2, plus from #3 the brand read, the rules search, `brand/voices/`, `social/accounts.md` and (for a trend post) the newest listening report. Skip the audit, the calendar sweep and the intake. In one message before drafting, ask the platform and account (brand or a named person) if not given, plus this post's 3–5 claim lines when the claims gate's scoped sign-off applies (nothing signed off, or a needed line not on the list; never when someone else approves claims). Write that post with the slot anatomy and atoms/post-check (its claims gate runs the scoped sign-off for this post's lines only). Voice: the account's card if one exists; else the brand card (build it free from `brand_read organic` when ≥8 own posts exist); else match against the kit voice lines and the account's own captions, and label it "voice provisional". Never open a paid read or the voice interview for one post. Then offer the calendar in one line.
5. **Audit before asking** (step 2). Never ask what the brain or the account's own posts already answer.
6. **One intake message, one checkpoint.** It carries:
   - the audit summary
   - the proposed voice cards (or the voice interview when a corpus is too thin)
   - the proposed pillars, mix and series, plus the 1–2 format tests
   - the capacity numbers and a recommended cadence
   - **raw-material prompts for every named person the plan features**, one per planned slot (something shipped, a customer moment, a mistake, an opinion they'd argue, a number they may share)
   - any paid post-history read to approve (step 2). Voice cards that depend on that read are shown afterwards, with the first three days, for the yes.
   - **the 3–5 claim lines this calendar needs**, for the claims gate's scoped sign-off, when it applies (nothing signed off, or a needed line not on the list; never when someone else approves claims). post-check then applies the recorded answer; there is no second checkpoint.
   - only the open questions: which accounts are a person's, who approves each person's posts, hours a week, time zone, posting tool and free windows after posting, anything off-limits

   Wait for the marketer's answers and yes. Save them to `social/accounts.md` and the person answers to `content/pov/<YYYY-MM-DD>-<topic>.md`. Rules they state go through the shared save-learning atom (`../../atoms/save-learning/ATOM.md`): their words, prefix `[social YYYY-MM-DD]`, `must` only for rules they stated.

## Steps

**1. Reconcile and read the tests (every run after the first)** (references/slot-anatomy.md, Reconciliation).
- Record what went out, what was edited and what was skipped.
- For each posted slot, compare its numbers against the account's median, and read each format test's verdict: win, lose or unclear, with the numbers.
- Reweight the mix: more of what won, less of what lost.
- Raise repeated edits with the marketer as possible voice rules.
- Pick the run mode (references/calendar-craft.md): fill two weeks · weekly refill · mid-cycle insert · launch · crisis pause · new account.

**2. Audit the accounts** (atoms/account-audit).
- **Free first:** `brand_read organic` (about a week of own TikTok/IG posts) and, for managed accounts, `gooseworks:social_analytics_get`.
- **For more history, or for LinkedIn and Threads** (verified endpoints, author-matched; X posts are pasted): read the account's own posts through the proxy (`foundation/data-access`) under the shared spend gate (`../../atoms/spend-gate/ATOM.md`, proxy branch: one probe with the marketer's yes, then a yes to a ceiling, every charge logged). Pasting stays the fallback if they decline.
- The audit covers jobs, what worked and why (stating the window you actually have), cadence kept, best slots, and bio and pinned rewrites.
- **No accounts:** use new-account mode (calendar-craft.md).

**3. Voice cards** through the shared voice-card atom (`../../atoms/voice-card/ATOM.md`), with the social additions in references/voice-card.md (corpus minimum and pooling, the voice interview, the person rule). learn-my-brand's rules beat a card's style.

**4. Pillars, mix, series and format tests** (references/calendar-craft.md).
- Propose them in the intake message.
- On the marketer's yes, save them: `gooseworks:social_strategy_upsert` for a managed TikTok/IG account, otherwise `social/accounts.md`.
- The format tests go in the calendar header.

**5. Plan the grid** (atoms/plan-calendar).
- Fixed dates first: campaign, launch, seasonal moments, silent days.
- Then series and test slots, then the mix (repurposed cuts first).
- Then 1–2 flex trend slots a week, each with an evergreen fallback.
- Times come from the account's own history, or are labelled starting guesses inside the marketer's free windows.

**6. Draft every slot.** Hook first, then the body, native to the platform (references/platform-native.md), in the voice card exactly.
- **Buyers' words** come from the voice-of-customer bank. Press quotes are not buyer words.
- **Repurposed cuts** are re-fitted to the slot, not pasted.
- **Product facts** come from the product records only.
- **Named people:** anything a named person says, does, uses or believes comes only from their own words, their raw-material answers or their stance ledger. Use `[NAME: …]` only for a prompt left unanswered. A person slot with no material is cut or swapped.
- **Asset lines:**
  - Single images use make-static-ads' graphics side door, as a request line: `Graphic needed: for make-static-ads · <purpose, placement, exact text> · return to: social/calendar/<start-date>.md`.
  - Carousels are designed by the marketer from the slide table.
  - Short video is shot on the marketer's phone.
  - Never generate media here.
- **Volume:** draft week 1 fully and show the first three days in chat. The rest goes to the file, then week 2 in a second pass.

**7. Check and remake** (atoms/post-check).
- It covers voice match, share-worthiness and the swap test, AI-tells, claims through the shared claims gate (`../../atoms/claims-gate/ATOM.md`, including its scoped sign-off), disclosure (`../../atoms/ad-policy-check/disclosure.md`) and rights, the person gate, and trend fit, tone and expiry.
- Weak drafts are remade before anything is shown.
- Optional, managed TikTok/IG accounts only, after a yes: save finished captions as free draft posts (`gooseworks:social_post_create` `render: false`).
- **Never** use `render: true` or pass `carousel`; never `social_post_update` `action: "approve"`; never `organic_creative_queue`. Those are rendering and the parked posting flow.

**8. Hand over.**
- Show, in order: the "you post by hand" line, the grid with the format tests, the next three days in full, the flags, the posting sheet, and what you need from them.
- On a refill, first read any `Graphic ready:` lines under your request lines and mark "Asset ready?".
- Save to `social/calendar/<start-date>.md`. Its first line: `Calendar <start>–<end> · <n> slots · tests: <names> · reconciled: no`.
- **CSV on request:** `gooseworks:file_write` `social/calendar/<start-date>-sheet.csv`. In a hosted chat with no file access, also give a download link from `gooseworks:file_url` (`mode: "download"`, the same coworker scope, `expires_in_seconds: 3600`).

## Approval gates

- **A named person's voice or words.** PERSON YES NEEDED on any post that speaks as, or attributes words, habits, product use or opinions to, a named person, on any account. It needs that person's own yes, or the yes of the approver they named.
- **Voice cards, account plan and format tests.** Shown in the intake message, or alongside the first three days for cards built from the approved paid read. Until the marketer's yes a card is provisional, and drafts from it say "voice provisional". A person's card also needs that person's yes.
- **Trend and news moments.** A recommendation, the tone-risk tier with the specific risk, and an expiry. Red-tier moments are never drafted.
- **Claims.** Through the shared claims gate: signed-off claims verbatim, or the scoped sign-off for this calendar's lines, or plain product facts only.
- **Strategy changes** to a managed account need a yes before `social_strategy_upsert`.
- **Money.** Proxy reads of post history follow the spend gate: a probe with a yes, then a ceiling. The rest is free.
- **Publishing.** Nothing is posted by this playbook, by construction.

## Output and write-back

- **Workspace:**
  - `social/calendar/<start-date>.md` (grid, tests, drafts, checks, flags, sheet, then reconciliation and test verdicts)
  - `social/accounts.md` and `social/audit/<date>.md`
  - `content/pov/` (person answers, shared with make-content)
  - voice cards at `brand/voices/<handle>.md` through the voice-card atom
- **Brand documents** through the shared save-to-brain atom (`../../atoms/save-to-brain/ATOM.md`): each reconciled calendar, with its test verdicts, `versioned: keep-history` (a period artifact, never deleted).
- **Learnings** through the shared save-learning atom only: rules the marketer stated or confirmed, prefix `[social YYYY-MM-DD]`, in the marketer's words, one idea each, superseded own learnings retired. A test result becomes a learning only when the marketer agrees it is a rule.
- **Managed TikTok/IG accounts:**
  - Pillars, voice and rules → `gooseworks:social_strategy_upsert`, after a yes.
  - Posted status → `gooseworks:social_post_update` `patch.status: "posted"` (a record; if refused, keep it in the calendar file).
- **Read downstream by:** analyze-performance (what went out, and the tests).
- **No home in the brain yet:** a calendar object, and account records beyond TikTok/IG (server-needs.md).

## Done when

Every slot in the two weeks has a draft (flex slots have their evergreen fallback), and the marketer would post the next three days' drafts after at most light edits. Every person post is flagged for that person's yes, every trend post has an expiry and a named tone risk, and each format test is named with how it will be judged. Nothing was posted, and nothing was invented.

## Out of scope

- A single post, script or repurposed piece on its own: **make-content** (Before you start #4 handles a stray single-post ask without the intake).
- Posting, scheduling, auto-publishing, managed publishing: **parked** until the posting tools work. The marketer posts by hand.
- Replies, DMs, comment moderation and crises: **listen-social** drafts replies; the parked reply queue lives there.
- The account report ("what worked this week"): **analyze-performance**.
- Listening and trend discovery: **listen-social**. This playbook reads its report.
- Making media: images via **make-static-ads**' graphics side door (single images only); produced video via **make-video-ads**; carousel rendering is not available yet.
- Boosting a winner with paid budget: **analyze-performance** flags it, **run-paid-campaigns** stages it.
- Creator programs: **work-with-creators**. Employee-advocacy programs are out; 2–3 employee variants of a key post are in.
- Posting into Reddit, Facebook groups or Discord: out for v1. Announcement copy for the brand's *own* group is in.
- Google Business Profile posts and Amazon Posts: not covered yet.
