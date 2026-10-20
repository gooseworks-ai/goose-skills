---
name: marketing-agent
description: >-
  Router for any marketing ask with no playbook named: picks the one GooseWorks marketing playbook for
  the job and runs it. Use when the ask is vague ("help me with marketing", "where do I start") or is
  a job not covered yet (a one-off brand setup), which it says plainly; video ads and product photos go to the goose-video and goose-product-photos skills. Not
  for an ask that names a job, even two jobs ("plan our launch and make the ads"): pick the playbook
  for the first job. Not for a playbook already chosen: run that one directly.
version: 0.1.0
---

# marketing-agent (router)

Pick one playbook for the marketer's ask, then run it. Never chain playbooks yourself: each one reads what the others saved. One exception: an ask for both a list and the messages ("find leads and write my cold emails") → research-audience, whose list mode goes on into write-outreach itself.

## How to pick

1. Match the ask to the table below by **the outcome the marketer wants**, not the words they used.
2. **One clear match** → load `../<playbook>/SKILL.md` and follow it.
3. **Two plausible matches** → pick by the "Not this" column. Still unsure → ask one plain question that tells them apart ("Do you want this week's numbers, or the changes to make in your ads?"). Two that come up often:
   - **"Content for my X / LinkedIn"**, no format or cadence → "One piece, or an ongoing plan?" One piece (post, X article or thread) → make-content; a plan → run-organic-social.
   - **"Write an email to …"**, cold or warm unclear → "To people who haven't heard from you, or people on your list?" Named accounts a person emails (demo-request replies, reconnects, win-back of specific accounts) → write-outreach; automated emails to a list segment (onboarding, win-back automation) → email-lifecycle.
4. **No outcome named** ("help me with marketing", "where do I start") → where-to-start.
5. **Video ads** (Reels, TikTok and Shorts ads, AI UGC-style video, product demo videos, fixing a rejected video ad) → the goose-video skill. **Product photos** without a shoot (packshots, lifestyle or on-model shots) → the goose-product-photos skill. Both are GooseWorks skills, not playbooks.
6. **A job on the "not covered yet" list** → say plainly it isn't covered yet, offer the nearest playbook only if it really helps, and never fake the work.
7. Talk to the marketer about what they'll get, never about playbooks or tools.

## Playbooks

| Playbook | The marketer says | Not this — use |
|---|---|---|
| where-to-start | "help me with marketing" · "where do I start" · "we just launched and need customers" · "what should I focus on this month" | A named outcome → that playbook; "why did sales drop" with live channels → analyze-performance |
| research-market | "do the market research" · "which market are we in" · "how big is my market" · "is my category growing" · "what's changing in my market" · "how do people buy in my category" · "what do others charge" · "who's talking about us" · "any mentions this week" · "is a complaint blowing up" · "watch my brand" · "what's trending in my category" | Who our buyers are, personas, their words, mining reviews → research-audience; what rivals run → research-competitors; posts that ride a trend → run-organic-social |
| research-competitors | "competitor teardown" · "what ads are my competitors running" · "how do they price" · "find angles to brief" · "competitor X just launched" · "watch my competitors weekly" | What people say about rivals → research-market |
| research-audience | "who is my customer" · "who are our buyers" · "build buyer personas" · "voice of customer" · "mine our reviews" · "what words do customers use" · "where does our audience hang out" · "build me a prospect list" · "find 50 right-fit people with emails" · "ABM target list" · "score these leads" · "which inbound leads first" · "who's looking for an alternative to X" · "tell me when a past champion changes jobs" | Market size, trends and how people buy → research-market; writing the messages → write-outreach; influencers → work-with-creators |
| write-outreach | "write a cold email sequence" · "what do I send to this list" · "LinkedIn messages for these leads" · "first lines for my prospects" · "how do I reply to this prospect" · "handle this objection" · "win back accounts that churned" · "reply to this demo request" · "reconnect with accounts that went quiet" · "why is nobody replying to my outreach" | Finding the people → research-audience; automated emails to a list segment (onboarding, win-back automation) → email-lifecycle; sending → not covered (the marketer sends) |
| plan-campaign | "I have this budget and date — what do I run" · "plan my launch / Black Friday" · "where should I advertise" · "how should I split my budget" · "replan next month" | Pausing ads on a sold-out product → run-paid-campaigns; only email sends → email-lifecycle |
| make-static-ads | "make me image ads" · "fresh ads this week" · "refresh my tired ads" · "more like my winning ad" · "my image ad got rejected — fix it" · "a header image or social graphic" | Video ads → goose-video; clean product shots → goose-product-photos; launching → run-paid-campaigns |
| run-paid-campaigns | "launch these ads" · "kill, scale or pause?" · "my ads are live, run them" · "swap this tired ad" · "we sold out — pause the ads" · "give me the Google / TikTok changes" | "Which ad won / how did we do" → analyze-performance; fixing a rejected ad → its maker |
| analyze-performance | "write my Monday report" · "which ad won" · "are my ads making money" · "Meta ROAS vs real revenue" · "why did sales drop" · "anything on fire today" | Acting on the calls → run-paid-campaigns; replanning budget → plan-campaign |
| email-lifecycle | "welcome and abandoned-cart emails" · "write my email flows" · "plan this week's emails and texts" · "win back lapsed customers" · "why are my emails going to spam" | Emails a person sends to named accounts (demo replies, reconnects) → write-outreach; the newsletter issue → make-content; the whole Black Friday campaign → plan-campaign |
| improve-search-visibility | "am I in ChatGPT / Google answers" · "why does ChatGPT recommend my competitor" · "SEO quick wins" · "organic traffic is flat" · "fix my app store listing" | Writing the full page → make-content |
| work-with-creators | "find influencers" · "find real UGC creators" · "who should we send product to" · "is this creator's engagement real" · "what should I pay this creator" | AI-made UGC-style video → goose-video |
| make-content | "write a blog post / case study / guide" · "draft this week's newsletter" · "repurpose this webinar" · "write one LinkedIn or X post" · "an X article / thread / long post" | A two-week posting calendar → run-organic-social; ad copy → make-static-ads |
| run-organic-social | "fill my social calendar" · "write this week's posts" · "ghostwrite my founder's LinkedIn" · "plan the social for our launch" · "my accounts went quiet" | One standalone post, article or thread → make-content; replies → not covered yet; crises → research-market flags them |

## Not covered yet

Say so plainly; details and triggers are in `../../BACKLOG.md`.
- Designing an offer or sale from margin (a playbook can price an offer the marketer already chose).
- Landing pages, product pages, homepages, popups; sales one-pagers and battlecards.
- Google search-ad copy and keywords.
- Writing positioning from scratch.
- Sending outreach (we write the emails and LinkedIn messages; the marketer sends them from their own tool).
- Amazon and marketplace listings and feeds.
- Review replies and review monitoring (review-request emails are covered, in the email flows).
- Drafting replies to comments and DMs, and comment moderation ("draft replies to these comments").
- Press releases and PR pitching; WhatsApp flows.
- Brand setup as its own job (learning the brand in one pass, a brand book, approving all the claims or the voice at once, recording a price or product change): GooseWorks sets the brand up on first connect, and each job approves the claims it needs.
