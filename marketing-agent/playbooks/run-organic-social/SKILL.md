---
name: run-organic-social
description: >-
  Run my organic social. Use when a founder or marketer says "run organic social for my brand", "fill my social calendar", "grow my X / LinkedIn / Instagram / TikTok", "ghostwrite my founder's posts", "what should we post on X?", "which platforms should we be on?", "we're launching on the 12th, plan the social", "a TikTok or Reel script to shoot on my phone", "tear down @x's account", or "my accounts went quiet". First researches how each platform works right now and what is getting watched in the brand's niche there, then delivers a readable plan: a strategy per platform (formats, topics, hooks, cadence, how a small account breaks in) and two weeks of posts modelled on what works, each format chosen for a reason, in the brand's or person's real voice, with carousels and diagrams rendered where the host can. You post by hand; posting, scheduling and replies are not available yet. Not for a standalone post or repurposing one piece — use make-content.
---

# run-organic-social

**Say once, at the start, in these words or close:** "I'll look at how each platform works right now and what's getting watched in your space, then give you a plan and two weeks of posts. I can't post for you yet; you'll post by hand." Never name tools, ids or other playbooks to the marketer.

## What you get

A report the marketer opens with one click (delivered through `../../atoms/write-report/ATOM.md`):

- **In short:** the one move to make first, and why.
- **Per platform:**
  - how it works right now (dated, with sources);
  - what's working in this niche there, with linked examples;
  - the strategy for this account: its job, formats, topics, hooks, cadence and posting times;
  - **how this account breaks in:** named accounts to reply to, the daily routine, the first posts;
  - how we'll know it's working.
- **Two weeks of posts,** each modelled on a pattern that works on that platform, written the way a person posts there.
  - Every format has a reason from the research. On X a founder's everyday post is usually text with a screenshot, and video is used when there is something worth watching (a finished output appearing, a before/after), unless current per-post evidence says otherwise. Video slots get a script with time, words, on-screen text and shot notes, which the marketer shoots on a phone or screen-records.
  - Text posts ready to paste.
  - Carousels, LinkedIn document posts, workflow diagrams and quote or stat cards, rendered as finished slides in the brand's style, where the host can render (references/graphics.md); otherwise the slide-by-slide copy.
  - The first three days in full at the top of the posts section; every other post in the report's "All posts" appendix, in the same readable shape. The workspace calendar is only the machine copy.
- **A posting sheet** (plus a CSV on request).
- **What we couldn't check,** in plain words.

Every post is checked for claims, voice and disclosure. Posts that speak for a named person are flagged for that person's yes.

## Before you start

1. **Connect** (`../../foundation/guide/SKILL.md` §1).
   - First GooseWorks call: `gooseworks:get_started` with the marketer's words. If it shows a card, write one line and carry on with this ask: don't call `card_wait`, because the card has no organic-social option and this playbook's gates win (AGENTS §8).
   - Pass `client` only to tools whose schema has it (e.g. `get_started`, `job_get`), never to `brand_read`.
2. **Brand and workspace.** Even when `get_started` already named the brand, call `gooseworks:brand_read` with no `brand_id` to get its `coworker_agent_id`.
   - **Every file call carries `scope: {type: "agent", agent_id: <coworker_agent_id>}`.** A file call without a scope lands in the wrong workspace.
   - No coworker → the default workspace, with paths prefixed `brands/<brand-slug>/`, and tell the marketer.
3. **"Tear down this one account"?** Run atoms/platform-research §3b on that account only and deliver it as a report through write-report: why it works, what to adapt, and five tests for this brand. Then offer the full plan in one line.
   **One post, not a plan?** If the ask is a single post or script, use the brand read and the voice card only. Write that one post to the platform's research card if a fresh one exists (`social/research/`, under 30 days). Otherwise do one quick web check of how that platform treats that format now. Run atoms/post-check, then offer the full plan in one line.
4. **Ask nothing yet,** with one exception: a single blocking question is allowed up front when one fact changes everything and no public source can answer it (e.g. the person's handle, when the plan is for their own account). Do the free pass (step 1) first. Never ask a fact the free pass could find.
5. **Load the last run** (full plans and refills; not #3's one-offs). Run the Start steps of `../../atoms/run-memory/ATOM.md` with the inputs in references/run-record.md. It finds the last social calendar's run record, checks last time's recommendations and format tests against what went out and how it did, and writes the "since last time" lines that open the report. No record means a first run: say so, invent nothing, and freeze the baselines from this run's audit. **A record exists and a calendar is running → this is a refill: go to step 7.**

## Steps

**1. Free pass (ask nothing).** **Keep it proportionate:** research the platforms the marketer named, or the top 1–2 recommended. Roughly 10–15 web searches and 15–20 page reads per main platform is enough; stop a line of search when it repeats what you have. Write the report once, then revise it in place. **Hard gate: no draft report without a dated "how it works now" card and at least 8 linked examples of what's working in the niche, for each platform the marketer named (or the top recommended one).** Other recommended platforms get a lighter read: the card plus 3 examples, deepened once the marketer picks them. If the host has no web search or browser, say so at the top of the report and in chat, and plan nothing from memory.
- **Pick the platforms in scope first:** the ones the marketer named. Otherwise recommend 2–3 from where the audience is and what the brand can make, and say why.
- **Platform research** (atoms/platform-research), for each platform in scope:
  - how it works right now (web search, dated sources);
  - what's working in the niche (the free routes that work per platform, plus examples);
  - the brand's and the person's own accounts.
- **Brand read.**
  - **When `brain_*` tools are listed:** `gooseworks:brain_map` first. Its core gives the rules, the never-list and what's waiting for the marketer's yes. Open the map's `required_reads`, then the chapters this job needs with `gooseworks:brain_map` `kind`: 11 how we sound, 14 rules, 15 how we work together (who approves a person's posts), 17 accounts and tools, 19 this week and what's coming, 20 our plan, 23 what is working. Chapter 12 (look and files) only for designed slots. Use `gooseworks:brain_search` for gaps: disclosure, off-limits topics, buyer language. Then `gooseworks:brand_read` lean with only `sections: ["accounts","sources","organic"]`, because the brain doesn't hold the own posts or the saved sources.
  - **Otherwise:** `gooseworks:brand_read` lean, with `sections: ["summary","kit","learnings","accounts","sources","organic","products"]`, then `product_ids` for the products in play, then `gooseworks:knowledge_search` for operating rules, disclosure and off-limits topics.
  - **Never pass `detail: "full"`.** On a settled brand it returns 100k+ characters that no host can read; the lean read already carries every rule and claim.
  - Items waiting for a yes may shape drafts, labelled as waiting, never as confirmed facts in a post. Claims still come only through the claims gate.
- **Saved files,** all with the scope from #2:
  - `social/` (the last calendar, `social/accounts.md`, `social/research/`). A saved research card under 30 days old is reused only if it still meets this step's bar (8+ examples with numbers, at least 3 from accounts under 10k followers, a platform or sized-study source). Otherwise top it up. Files from other people's tests or drafts are not history.
  - `brand/voices/`
  - `content/repurposed/`, `content/channels.md`, `content/pov/`
  - research-market's and research-competitors' latest reports
  - the newest `reports/performance/<date>.md`
- **Mine the raw material that's already public:**
  - the person's own recent posts, read in the browser;
  - the brand's changelog, docs, blog, release notes, GitHub and product pages.

  Real shipped things, numbers and screenshots found here are what the first posts are built from.
- **Own-account audit** (atoms/account-audit) and voice cards (`../../atoms/voice-card/ATOM.md`, social additions in references/voice-card.md).

**2. The draft report and one message.**
- Write the strategy per platform (references/platform-strategy.md) and the first three days of posts (step 4). Where the account isn't known yet (whose it is, the handle), write for the most likely one and state that assumption at the top. **only from found material and plain product facts**, run through atoms/post-check (step 5). A post that needs the person shows the finished post plus one "needs from you" line, never a skeleton of brackets.
- Deliver them as a **draft** report through write-report.
- Then one message, at most a few lines plus a short list. It holds the link and the one move to make first. It asks **only** the decisions left:
  - the paid top-up for deeper niche and own-post reads: one yes to "up to N credits" (`../../atoms/spend-gate/ATOM.md` branch B), with what it adds;
  - the 3–5 claim lines the posts need, for the scoped sign-off (`../../atoms/claims-gate/ATOM.md`). Name each line exactly. "Check the brand kit" is not a yes to a line;
  - raw material for every named person the posts feature, one prompt per planned slot: something shipped, a mistake, a number they may share, an opinion they'd argue, a screenshot or clip they can record. Add the short voice interview when fewer than ~8 of their posts were found;
  - anything only the marketer knows: handles not found, hours a week, time zone, who approves a person's posts.
- **When the marketer states a platform belief** ("video works more on X now"), check it on the web before answering, then give a **verdict: confirmed, contradicted or unclear**, with the source. Say whether the evidence is about **share of all activity** (e.g. "video is half of impressions") or **per-post reach for an account like theirs**; only the second decides their formats. Neither agree nor refuse from memory. An unclear belief becomes a labelled test.
- Never ask before the draft exists (except the one blocking question in #4).
- **Check the audience is the buyer.** If the chosen platform reaches people other than the brand's buyer (e.g. X grows a B2B founder among builders while the buyer, a DTC marketing lead, is more on LinkedIn or Instagram), say so once, plainly, then follow the marketer's choice.

**3. Deepen** (only what the marketer said yes to).
- Run the paid reads inside the ceiling and log every charge.
- Fold the new examples into the patterns and strategy.
- Rebuild the voice card from the fuller corpus.

**4. Write the posts** (references/slot-anatomy.md; plan with atoms/plan-calendar and references/calendar-craft.md).
- **Model every post on a pattern from the research.** Each slot names the pattern and links one example it follows ("built like @x's teardown video, 14 Oct"). Borrow the structure; never copy the words.
- **Every format needs a reason** from the research: per-post evidence for this kind of account, what the content is (video when something is worth watching), and what the person can make in their hours. Each video slot has a script table (time · words · on-screen text · shot), a feasibility line ("screen recording, 25 seconds, no face") and who shoots it.
- **Write like the person posts.** Use the voice card and real specifics from their own material: the thing they shipped, the number, the screenshot. Use the product as proof inside a useful post, not as the point.
- **Every post must be postable as written.** It can have **at most one** short fill-in that only the person knows (their first name, one number, the exact prompt they ran), written in plain words ("fill in: the prompt you used"). A post that would need more is rebuilt from material found in the free pass: the brand's own published runs and videos, the changelog, docs, release notes, the person's past posts. If nothing is found, it is replaced by a post that needs no private material, such as a reaction to a real post by a named account, or a teardown of a public example. Never hand over a template.
- **The mix:** at most half the posts are mainly about the product, and at least 3 in 10 are useful to a stranger who has never heard of the brand (an insight, a teardown, a how-to, what you learned building). Changelog and install details inform existing users; they rarely earn a stranger's follow.
- **A line to the business:** each post that can carry one gets a tracked link (UTM) in its reply or first comment to the site or sign-up. Signups or site clicks are read at the next refill, alongside follows and replies.
- **Designed slots** (carousel, LinkedIn document, diagram, quote or stat card) are rendered with goose-graphics per references/graphics.md: brand style, a slide-1 preview first, density and type rules, PDF for LinkedIn documents, files uploaded to GooseWorks. In a host that can't render, hand over the slide copy and say so.
- **Small or new accounts:** each post comes with its reply plan (which named accounts to engage that day), because that's where early reach comes from. The daily reply routine is part of the plan, not an extra. It names whom to reply to and what kind of specific to add; it doesn't draft the replies themselves.

**5. Check and remake** (atoms/post-check): voice match, the "would a person post this?" test, AI-tells, claims through the claims gate, disclosure and rights, the person gate, trend expiry. A weak draft is remade or the slot is dropped. Never pad.
- Optional, managed TikTok/IG accounts only, after a yes: free draft posts (`gooseworks:social_post_create` `render: false`).
- Never `render: true`. Never `social_post_update` `approve`. Never `organic_creative_queue`. Posting stays parked. A hand-built `carousel` draft from already-rendered slides is allowed on a managed account only after a yes (references/graphics.md §6).

**6. Deliver the final report** through `../../atoms/write-report/ATOM.md`, shaped by references/report-shape.md:
- a local file with a clickable link (or an artifact or the full report in a hosted chat);
- saved to the brand through `../../atoms/save-to-brain/ATOM.md`, with a `gooseworks:file_url` link.

Also save:
- `social/calendar/<start-date>.md`: the grid, the posts, the posting sheet and the tests;
- `social/accounts.md`;
- `social/research/`;
- a CSV on request, with a `file_url` download link (same scope, `expires_in_seconds: 3600`).

**Before you deliver, scan the report text** for anything a marketer shouldn't see, and fix every hit:
- file paths (`/`, `.md`)
- tool or server names (`brand_read`, `gooseworks`, `file_write`)
- internal codes such as slot or test ids (S1, T1)
- `[` brackets
- process narration ("I called", "the file exceeded")

Name posts by day ("Monday's post"); the one allowed fill-in reads "fill in: <what>".

In chat, at most 3 lines (on a refill, the one "since last time" result that matters most; the first move; the link) plus the decisions left, at most 5 short items.

**Save the run record** (full plans and refills): the End steps of `../../atoms/run-memory/ATOM.md`, shaped by references/run-record.md. It holds the per-post and per-format scorecard, each format test with its verdict or carried forward, and every recommendation with a review-by date. Add "Saved this run's notes to your brand, so the next refill starts from here." to the link line, not as a line of its own. In a scheduled run, say nothing about it unless the save failed.

**Revisions** ("rewrite them in my voice"): edit the report file and the workspace copy in place. Then reply in at most 3 lines: what changed, the link, and anything still open. Show a post in chat only when the marketer asks to see that post. Never re-paste the set.

**7. Refill (every two weeks, or on request).** A refill is not a first plan: skip step 1's full free pass and step 2's draft. In order:
1. **Brain and last run:** the brain read from step 1 (the core, plus what changed since the last record's date), and #5's Start steps.
2. **One message up front, with the marketer present, only if needed:** a tick-list of the due posts to mark posted, edited or skipped, and one yes to "up to N credits" for the X and LinkedIn own-post reads (spend-gate branch B) when the plan has them. This is the refill's one allowed question; everything else goes in "Decisions for you". A scheduled refill asks nothing.
3. **Reconcile and score** every due post (references/slot-anatomy.md, Reconciliation; references/run-record.md): settled posts against their format's frozen baseline, every open test given a verdict or carried with its first id.
4. **Reweight the mix:** more of what beat its baseline, less of what fell below. Never repeat a move that didn't work without a new reason, and name the reason.
5. **Read the voices** the buyer follows, last 7 days (atoms/platform-research §3c). Convergence, spikes, early topics and controversies feed the flex slots.
6. **Refresh only the platform cards older than 30 days.** The step-1 hard gate applies only to a card you refresh.
7. **Write the next two weeks** (steps 4–5), carried tests first, then deliver the report (step 6) and save the new run record.

**8. Offer the repeat (judge first).** At the end of a full plan, judge whether a repeat would help this brand. It usually does when the marketer means to keep posting.
- If it would, offer it in one line, with the reason and a cadence: "Want me to refill this every two weeks? Each time I'd re-check what's working on X, read how your posts did, and write the next two weeks."
- On a yes, set it up per references/scheduled-refill.md. The server's scheduled worker has no skills folder, so first copy the method (the refill steps, these references and atoms, and the shared atoms it needs) into the workspace's `social/method/`, then create the automation with that file's self-contained prompt: paths, read and write rules, run-memory's start and end steps, the approval gates, the per-run spending ceiling, and "never post, schedule or spend; drafts and proposals only". Each run loads the last run record, reconciles and judges the tests, writes the next two weeks and a report that opens with "since last time", and saves its own record.
- Create it **paused**, per `../../atoms/spend-gate/ATOM.md` branch C. Switch it on only on the marketer's yes, and name any per-run data ceiling in that yes; without one, scheduled runs use free sources only.
- **When the plan has X or LinkedIn,** the offer names the per-run ceiling their own-post reads need (from the credits log) and says plainly that without it the scheduled refills can't score those platforms.
- Never offer a repeat for a single post or a one-off script.

## Approval gates

- **Named people.** Any post that speaks as, or for, a named person carries PERSON YES NEEDED: that person's own yes. Their material comes only from their own words.
- **Claims.** Only through the claims gate: signed-off lines, the scoped sign-off for the exact lines this plan needs, or plain product facts. The kit's value props, proof points and site copy are **not** usable facts until signed off.
- **Money.** The free pass costs nothing. Paid reads only after one yes to a ceiling, logged.
- **Trends.** Each trend post has an expiry, a tone-risk tier with the specific risk, and a recommendation. Red-tier moments are never drafted.
- **Strategy changes to a managed account** need a yes before `social_strategy_upsert`.
- **Publishing.** Nothing is posted by this playbook.

## Output and write-back

- **The report:** the draft (step 2) goes to the local file or artifact and to the workspace only. It is not saved as a brand document. The final (step 6) goes through write-report: local file or artifact; workspace `social/plans/<YYYY-MM-DD>-social-plan.md`; and save-to-brain (`versioned: keep-history`), titled "Social plan — <Brand> — <YYYY-MM-DD>".
- **Workspace** (coworker scope):
  - `social/research/<date>-<platform>.md`
  - `social/calendar/<start-date>.md` (+ `-sheet.csv`)
  - `social/accounts.md`
  - `social/audit/<date>.md`
  - `content/pov/` (person answers)
  - voice cards via the voice-card atom
  - `research/credits-log/<YYYY-MM>.md` (spend-gate)
  - `runs/run-organic-social/social-calendar/<YYYY-MM-DD>.md`: the run record, through run-memory (also saved to the brand, keep-history)
- **Learnings** only through `../../atoms/save-learning/ATOM.md`, with the marketer's own words, prefix `[social YYYY-MM-DD]`.
- **Managed TikTok/IG accounts:** strategy via `social_strategy_upsert` after a yes; the posted status as a record via `social_post_update` `patch.status`.
- **Read downstream by:** analyze-performance (what went out, and the tests); the next refill (the run record).

## Done when

The marketer reads the report and finds the research, strategy and posts specific to each platform and to their niche. Every platform fact is dated and sourced, and every post points to a pattern that works there. They would post the next three days after light edits because the posts read like a person wrote them. Nothing was posted, and nothing was invented.

## Out of scope

- A standalone post or a repurposed piece: **make-content**. #3 above handles a stray single-post ask.
- Posting, scheduling, replies, DMs, comment moderation: **parked** until the posting tools work. Reply drafting is in the backlog.
- Market and category listening: **research-market**. This playbook reads its report and does its own platform research.
- Making media beyond designed slides: produced video via **make-video-ads**; photos via make-product-photos. Phone and screen-recorded video is shot by the marketer from our scripts. Designed slides and cards are rendered here with goose-graphics (a GooseWorks skill, not a playbook).
- Boosting a winner with paid budget: **analyze-performance** flags it, **run-paid-campaigns** stages it.
- Creator programs: **work-with-creators**.
- Posting in Reddit, Facebook groups or Discord: out for v1. Google Business Profile posts and Amazon Posts: not covered yet.
