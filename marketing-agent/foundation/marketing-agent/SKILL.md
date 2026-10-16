---
name: marketing-agent
description: >-
  Any marketing ask: "help me with marketing", "make me ads", "who are my customers", "what are my
  competitors running", "plan my launch", "write this week's posts", "write my email flows", "how did
  my ads do", "am I in ChatGPT answers", "find influencers". Picks the one GooseWorks marketing
  playbook that does the job, end to end, on the brand's own memory. Use when the ask is about
  marketing and no playbook was named. Not for a playbook already chosen: run that one directly.
---

# marketing-agent (router)

Pick one playbook for the marketer's ask, then run it. Never chain playbooks yourself: each one reads what the others saved.

## How to pick

1. Match the ask to the table below by **the outcome the marketer wants**, not the words they used.
2. **One clear match** → load that playbook's SKILL.md and follow it.
3. **Two plausible matches** → pick by the "Not this" column. Still unsure → ask one plain question that tells them apart ("Do you want this week's numbers, or the changes to make in your ads?").
4. **No outcome named** ("help me with marketing", "where do I start") → where-to-start.
5. **A job on the "not covered yet" list** → say plainly it isn't covered yet, offer the nearest playbook only if it really helps, and never fake the work.
6. Talk to the marketer about what they'll get, never about playbooks or tools.

## Playbooks

| Playbook | The marketer says | Not this — use |
|---|---|---|
| where-to-start | "help me with marketing" · "where do I start" · "we just launched and need customers" · "what should I focus on this month" | A named outcome → that playbook; "why did sales drop" with live channels → analyze-performance |
| learn-my-brand | "learn / set up my brand" · "here's our brand book" · "what can we claim" · "approve our claims" · "our price changed" · "remember how we talk" | Who our customers are → research-market |
| research-market | "who is my customer" · "build a persona" · "mine our reviews" · "voice of customer" · "why do people buy or not buy" · "is my category growing" | A list of businesses or people to pitch → research-audience; what rivals run → research-competitors |
| research-competitors | "competitor teardown" · "what ads are my competitors running" · "how do they price" · "find angles to brief" · "competitor X just launched" · "watch my competitors weekly" | What people say about rivals → listen-social |
| listen-social | "who's talking about us" · "any mentions this week" · "is a complaint blowing up" · "what's trending in my category" · "draft replies to these comments" | Posts that ride a trend → run-organic-social |
| research-audience | "build me a prospect list" · "find 50 right-fit people with emails" · "find retail buyers or distributors" · "ABM target list" | Personas → research-market; influencers → work-with-creators |
| plan-campaign | "I have this budget and date — what do I run" · "plan my launch / Black Friday" · "where should I advertise" · "how should I split my budget" · "replan next month" | Pausing ads on a sold-out product → run-paid-campaigns; only email sends → email-lifecycle |
| make-static-ads | "make me image ads" · "fresh ads this week" · "refresh my tired ads" · "more like my winning ad" · "my image ad got rejected — fix it" · "a header image or social graphic" | Video → make-video-ads; clean product shots → make-product-photos; launching → run-paid-campaigns |
| make-video-ads | "make me a video ad" · "a Reel / TikTok / Shorts ad" · "AI UGC-style video" · "product demo video" · "my video ad got rejected — fix it" | Real creators → work-with-creators |
| make-product-photos | "product photos without a shoot" · "packshots on white" · "lifestyle or on-model shots" · "packaging changed — redo the photos" | Ads with text → make-static-ads |
| run-paid-campaigns | "launch these ads" · "kill, scale or pause?" · "my ads are live, run them" · "swap this tired ad" · "we sold out — pause the ads" · "give me the Google / TikTok changes" | "Which ad won / how did we do" → analyze-performance; fixing a rejected ad → its maker |
| analyze-performance | "write my Monday report" · "which ad won" · "are my ads making money" · "Meta ROAS vs real revenue" · "why did sales drop" · "anything on fire today" | Acting on the calls → run-paid-campaigns; replanning budget → plan-campaign |
| email-lifecycle | "welcome and abandoned-cart emails" · "write my email flows" · "plan this week's emails and texts" · "win back lapsed customers" · "why are my emails going to spam" | The newsletter issue → make-content; the whole Black Friday campaign → plan-campaign |
| improve-search-visibility | "am I in ChatGPT / Google answers" · "why does ChatGPT recommend my competitor" · "SEO quick wins" · "organic traffic is flat" · "fix my app store listing" | Writing the full page → make-content |
| work-with-creators | "find influencers" · "find real UGC creators" · "who should we send product to" · "is this creator's engagement real" · "what should I pay this creator" | AI-made UGC-style video → make-video-ads |
| make-content | "write a blog post / case study / guide" · "draft this week's newsletter" · "repurpose this webinar" · "write one LinkedIn or X post" | A two-week posting calendar → run-organic-social; ad copy → make-static-ads |
| run-organic-social | "fill my social calendar" · "write this week's posts" · "ghostwrite my founder's LinkedIn" · "plan the social for our launch" · "my accounts went quiet" | One standalone post → make-content; replies and crises → listen-social |

Every playbook lives at `../../playbooks/<playbook>/SKILL.md`. Shared setup, file locations and rules for every playbook are in `../guide/SKILL.md`.

## Not covered yet

Say so plainly; details and triggers are in `../../BACKLOG.md`.
- Designing an offer or sale from margin (a playbook can price an offer the marketer already chose).
- Landing pages, product pages, homepages, popups; sales one-pagers and battlecards.
- Google search-ad copy and keywords.
- Writing positioning from scratch.
- Cold outreach sequences.
- Amazon and marketplace listings and feeds.
- Review replies and review monitoring (review-request emails are covered, in the email flows).
- Press releases and PR pitching; WhatsApp flows.
