# Report template

Load at step 5. The report is written and delivered through the `write-report` skill (`../../write-report/SKILL.md`) — follow its shape, language, "never in a report" list and delivery rules exactly. This file only says what goes in each part for a search-visibility report. A busy founder must get the answer from the top: what we checked, what we found and how sure, then the first move.

```
# <Brand> — where you show up in ChatGPT and Google, <D Mon YYYY>

## In short
**What we looked at:** <the questions asked, which engines, the date, where from, and the main limit — e.g. "ChatGPT and Google, 8 buying questions, asked 20 Oct from one browser in one country; Google results differ by country, so ranks are a first look">.
<Repeat runs, only when it passed the noise rule in `run-memory.md`: one line on the change since last time that matters most — e.g. "ChatGPT now names you on 'best inventory app for cafés' 2 times out of 3, up from 0 on 18 Sep; your new homepage title went live in between." Otherwise the most useful fact about last month's fixes: "Two of last month's five fixes are live.">
1. <Where you are named and where you aren't, as plain counts, with how sure — e.g. "ChatGPT names you when asked about you by name, but on none of the 8 questions buyers ask before they know you (confirmed, each asked 3 times).">
2. <Who wins instead, and the one reason — e.g. "It names two rivals, mostly from 'best of' lists those rivals write themselves (likely).">
3. <The biggest thing broken on your side, if any — e.g. "Your homepage uses a nickname, not your full name, so engines don't connect the two (confirmed).">
**So, do this first (because of <1 and 3>):** <the one move, who, by when>.
(At most 150 words. Examples are fictional — never reuse them. How sure: confirmed = seen on repeat asks or in Search Console; likely; first look = one ask, one browser, one country — never "Google ranks you 2nd" from a single browser read. Nothing stronger than the body.)

## Decisions for you
A short box, each with your recommendation and a date if it matters: which buyer to win (when the site shows more than one), the paid top-up, any structural change awaiting a yes.

## Since last time (repeat runs only)
3–5 lines from run memory, before anything else in the story: today's counts against the last check's, only over the questions asked both times the same way, saying how many ("on the 7 buying questions asked both times: named on 1 today, none on 18 Sep — a first look, not yet a trend"); which of last check's five fixes went live, which didn't, and which we couldn't confirm; what moved after the ones that did, and what the answers now cite; who moved in. Movement follows the noise rule in `run-memory.md`: one changed answer is "changed once", never a trend. A question reworded since last time has no comparison yet — say so. A scheduled run that couldn't re-ask ChatGPT says so here, and doesn't carry last month's answers as today's.

## Where you show up today
One sentence of point, then one line on how it was checked (the date, where the browser was, signed out), then a short table whose every row carries its own "checked" note (date · signed out · tries, e.g. "19 Oct · signed out · 3 tries", or "not checked today — last checked 18 Oct") — the buyer's question in their words, ChatGPT (named / not named, "asked 3 times, named once"), Google (on page one or not), who's named instead. A question asked once is "a first look", never "won" or "stable"; an answer that never finished is "didn't finish", never "not named". Brand-name questions are a separate small table: every statement the engines make about you, checked against your live site, each marked right, wrong or unsupported.

## Why you're missing
The pattern, told as a story: what kinds of pages the engines lean on for your category, which of those you are on and which you aren't, and what your own pages are missing compared with the ones that win. Each point opens with its point, then the evidence with dates and links.

## You vs them
Where you're ahead (say it louder), where you're behind, and where everyone sounds the same.

## Your search roadmap
The page map as a plain table — the topic, the page that should answer it (yours today, needs a rewrite, or new), how winnable, and when (this week, this quarter, next). One sentence on capacity ("at about 4 new pages a month").

## What to do this week
The five fixes, numbered. For each, in plain words: what to change and where, who does it and how long it takes, why it's in the top five, and how we'll know it worked. The exact text and code go in the last section, not here.

## New pages to write
One line per brief: the page, the question it answers, why. "I can draft these next."

## What we're not doing, and why
The tempting moves decided against, one line each ("no llms.txt — no engine has confirmed using it", "no new blog posts until the pages you have answer the question").

## What I couldn't check
One line each, with why ("Google's AI answers — Google blocked the browser", "exact Google rankings — top-up not approved"). Always include: "Signed-in answers — I checked signed out; a buyer's own ChatGPT can differ (memory, paid model)", and any engine not checked (Claude, Gemini need sign-in).

## Sources
Dated links: the answers captured, the pages read, the lists and threads that came up. One line on source skew ("most cited lists are written by tool vendors").

## For whoever edits your site
Per fix: the finished copy, field values or code, and where exactly it goes in the site's editor (from `finished-fix-examples.md`). Plain headings ("Fix 1 — homepage title and opening line"), never codes.
```

Before delivering, run write-report's mechanical check with this playbook's additions to the banned list: "must-win", "key question" (say "your most important questions"), "probe", "proxy", "surface", "row", "runs·route", "0/1", "not scored", question ids (Q1, Q12), guessed editor field names. Budgets: In short ≤ 150 words, body ≤ 3,000 words (the developer section is an appendix), ≤ 6 moves.

Never in this report either, from the run notes: "baseline", "route", "snapshot", "recipe", "noise rule", "review by", "cell", "derived", "claimed", recommendation ids. Say "compared with 18 Sep, asked the same way", "we'll know by <date>".

Never in this report: "web search proxy" or any "proxy" wording (say "from a web search, not Google's exact page"), question ids (Q1, Q12), "must-win" or "key question" (say "your most important questions"), "runs·route", "0/1", "not scored", tool names, workspace paths, the words "probe", "proxy", "surface" or "row". Say "asked 3 times, named once", not "1/3". Name an exact place in the site's editor only if you know how the site is built; otherwise say "in your site editor" — never guess field names. Technical terms (robots.txt, schema, sitemap) appear only in the last section, each explained once in plain words where it first appears in the story ("the file that tells search bots what they may read").
