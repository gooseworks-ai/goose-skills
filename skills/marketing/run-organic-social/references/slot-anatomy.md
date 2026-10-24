# What every slot carries, and the posting sheet

Load at the drafting and handover steps. "Ready to paste" means the human can post from the slot without opening anything else.

## The slot

```
### <Mon 19 Oct · 18:30 America/New_York> · Instagram · @brand · carousel · pillar: <…> · bucket: proof · series: <name or —>
Source: <repurposed set path + unit #> | <trend from the research or research-market's report, first seen <date>> | <campaign brief row> | fresh
Modelled on: <pattern name> — <link to one example post that works on this platform, account, date>. Structure borrowed, words our own.
Share motive: <…>
Hook (+2 alternatives): …
Body / caption (ready to paste): …
First comment: … (link or context, if the platform buries links)
CTA: …
Hashtags / search keywords: … (platform counts from platform-native.md)
Alt text: …
Asset line: <what visual it needs> — from <the human's phone or camera roll | a clip at mm:ss–mm:ss of <source> | rendered slides or card with goose-graphics (references/graphics.md; slide copy only where the host can't render) | a produced video the marketer's team makes (we don't produce video yet) | UGC repost (rights asked: draft below)>
Who shoots / makes it: <name> · time needed: <~min>
Engagement plan: comment prompt in the post · first comment · people or accounts to tag (only ones the human named) · "be online 30–60 min after posting to reply"
Reply plan (small accounts): the 3–5 named accounts from the strategy to reply to today, and what to add to their conversation
Checks: <block from post-checks.md>
Flags: PERSON YES NEEDED (<name>, approver <who>) | TREND — expires <…>, tone risk <…> | NONE
```

## Per format (in the body of the slot)

**Text post (X, LinkedIn, Threads, Facebook):** the exact text with line breaks as they should appear, under the platform's limits. On X, a post with a screenshot or a short screen recording usually carries more than bare text; check the research card, and if it says so, attach one and say exactly what it shows.

**Carousel, slide by slide** (IG 6–10 slides; LinkedIn PDF 8–12 pages):

| Slide | On-slide text | Design note |
|---|---|---|
| 1 | The hook, ≤10 words | Visual direction |
| 2 | A second hook or the promise (people who skipped are re-served the carousel here) | |
| 3 … N−1 | One idea each, ≤25–30 words | |
| N | Save or send prompt in the brand's voice | |

The caption extends the hook. **Who makes it:** rendered with goose-graphics in the brand's style (references/graphics.md): slide 1 previewed first, density and type rules, a PDF for LinkedIn documents, files uploaded to GooseWorks, about 10 minutes for the marketer to review and post. Where the host can't render, the marketer designs from this table (~45 min), and we say so.

**Short video script** (TikTok, Reels, Shorts, X video, LinkedIn native video). Screen recordings count: for a software product, a 20–40s screen recording with a voiceover or on-screen captions is often the most native, cheapest video there is.

| Time | Shot / visual | On-screen text (≤7 words a card) | Voiceover / dialogue | Note |
|---|---|---|---|---|

- **0–2s:** the hook lands in the visual, the text and the spoken line at once, with motion or a pattern interrupt. No logo, no greeting.
- **2–6s:** the stakes.
- **Middle:** 3–5 beats, one per cut, every 2–4s.
- **End:** the payoff, then a soft CTA or a loop to the first frame.
- **Length:** 15–45s unless the account's own winners run longer.
- **Safe zones:** keep text out of the bottom ~20% and the right edge.

Alongside the table:
- 3 alternative hooks
- the format type (talking head, greenscreen, POV, tutorial, ASMR, wall-of-text, photo-mode)
- a feasibility line ("phone, one person, bathroom counter, 20 min")
- props
- the sound (original audio, or a Commercial Music Library track for brand accounts)
- the cover-frame text
- the caption with its search phrase

If a brand learning says spoken lines should flow (no choppy fragments), follow it. Production goes to the human's phone (or their own video team; we don't produce video yet).

**Stories:** 3–7 frames, one line each, plus the sticker (poll, question, link) and its exact wording.

**Pinterest pin:** title, description, overlay text and destination URL (only a URL the human or the brain supplied).

## The posting sheet (handover)

One table, in posting order, in the accounts' time zone:

| # | Date | Time | Platform | Account | Format | Hook (first line) | Asset ready? | Person yes? | Expires | Posted ✓ |
|---|---|---|---|---|---|---|---|---|---|---|

Above the table, one line each:
- "You post these by hand from <the tool they named: native app, Meta Business Suite, Buffer…>."
- "Stay 30–60 minutes after each post to reply."
- "Trend posts expire; skip them rather than post late."

**On request, a CSV in the shape of the human's own scheduler.** Columns: date, time, timezone, platform, account, text, first_comment, media_note. Write it with `gooseworks:file_write` to `social/calendar/<start-date>-sheet.csv`. In a hosted chat where the marketer can't open the workspace, also give a download link from `gooseworks:file_url` (`mode: "download"`, the same coworker scope as the file, `expires_in_seconds: 3600`; it expires, so offer a fresh one). The human imports and schedules it themselves. That is their scheduling, not this playbook's.

## Reconciliation (the start of every later run)

Read every calendar in `social/calendar/` with slots dated before today that aren't reconciled yet (calendars overlap, so that is usually the last two), and the last run record (references/run-record.md). Ask the human which of those slots went out, and which were edited or skipped, in step 7's one up-front message; in a scheduled refill, don't ask: use only what the sources show and mark the rest not read. For TikTok/IG, also match against `gooseworks:brand_read` `sections: ["organic"]` `own_posts` by date and caption. Record the result in the calendar file:
- posted as drafted
- posted with edits (keep their edited text: it is the best voice data there is)
- skipped (and why)

**Read the format tests** named in the calendar header (references/calendar-craft.md, Format tests). Pull each posted slot's numbers from `brand_read organic`, from `social_analytics_get` (managed accounts), from a proxy read under the spend gate, or from numbers the marketer pastes. Score each settled post against its format's frozen baseline. The numbers, the per-post and per-format scorecard and each test's verdict go into the new run record (references/run-record.md); the calendar file gets one line under each test: its verdict (run-memory's words) and the record's date. Reweight the next mix from it.

For a post created as a draft in the product (managed TikTok/IG accounts), find its id with `gooseworks:social_post_list` (`status: "draft"`), then mark it with `gooseworks:social_post_update` `patch: {status: "posted", posted_at}`. **That is a record, not publishing. Never use the `approve` action.** If the server refuses, record the status in the calendar file only.

Turn edits into voice learnings. If the human changed the same thing twice, ask: "You keep changing X to Y. Should I make that a rule?" On their yes, save it through the shared save-learning atom (`../../save-learning/SKILL.md`: their reply as the statement, prefix `[social YYYY-MM-DD]`, one idea), and update the voice card through the voice-card atom. Never write a fact without the yes. Mark each slot `reconciled: <date>` as you record it. A calendar's first line becomes `reconciled: yes` only when every one of its slots is reconciled. The calendar stays a workspace file; the run record and the report are what go to the brand.
