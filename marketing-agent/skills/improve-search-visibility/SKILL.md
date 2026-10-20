---
name: improve-search-visibility
description: >-
  Search and AI-answer visibility (SEO, AEO, GEO). Use when the marketer asks "am I in the answer when
  people ask ChatGPT or Google for products like mine?", "improve my SEO", "why does ChatGPT recommend
  my competitor", "are we in AI Overviews", "organic traffic is flat", "ChatGPT says something wrong
  about us", "fix my app store listing" or "my Google Business Profile and local search". Shows,
  question by question, where the brand is named and who wins instead, with a search roadmap and five
  fixes to apply this week. Never edits anything live. Not for writing the full page — use
  make-content; not Amazon or marketplace listings (not covered yet); not paid search — use
  run-paid-campaigns.
version: 0.1.0
---

# improve-search-visibility

One marketer want: "When people ask ChatGPT or Google for products like mine, am I in the answer — and what do I fix this week?" It follows the research pattern (read `../marketing-guide/research-pattern.md` (in the `marketing-guide` skill) before the first search): a free pass first with no questions, one message with the draft answer and one credit yes, then one readable report.

## What you get

1. **The answer and the report in the first turn** — the first message gives counts ("ChatGPT names you on 0 of 8 buying questions; it names A, B and C instead, mostly from vendor 'best of' lists") and links the finished report, with the only decisions left. Nobody has to ask for the report.
2. **One readable report** (through the shared write-report atom), opening with "In short" — what we checked, the findings with how sure, then "Do this first" — then the story: where you show up, where you don't, who wins instead and why, what's broken on your site and profiles, your search roadmap (which page should answer which question, in what order), the five fixes in plain words, what couldn't be checked, and sources. The finished text and code for each fix sit in a closing section for whoever edits the site. It opens with one click and is saved to the brand.
3. **Briefs for the new pages** the roadmap calls for, ready for the page writer.

## Before you start

1. **Setup first:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read) before anything else; the job line is "I check your search visibility through it." (`get_started` with `wants: "more"`; match the named brand loosely: "Goosework" → Gooseworks.)
2. **Read what you already know.** Brain path: chapters 2 "What we sell", 5 "Who we sell to", 7 "Competitors", 8 "Search terms", 9 "Why people pick us" and 17 "Accounts and tools" (Search Console, analytics); `gooseworks:brain_search` for gaps (`[search …]` learnings, a pronunciation fact). Fallback: `gooseworks:brand_read` with sections `summary`, `products`, `onboarding`, `competitors`, `learnings`, `sources` (lean is enough for the claims marker) and `gooseworks:competitor_read`. Then research-audience's `research/audience/voc-bank.md` and research-market's `research/market/demand.md` if present; this playbook's last `search/questions.md`, `search/page-map.md` and latest `search/visibility/` report (a re-run reuses the question set, topped up to the mix in `references/question-list.md`). **Load the last run** — the Start steps of the `run-memory` skill (`../run-memory/SKILL.md`) with `references/run-memory.md`: steps 1–2 now (the last record, its per-question baseline and its open fixes); steps 3–4 after the free pass, from today's answers — each open fix checked for whether it went live (fetch the page, sitemap or profile — every part shown, never "done" from a draft) and, past its review timing from the day it was first seen live, what moved after it. **An earlier run's answers are the baseline, never this run's evidence:** compared like with like (same question, same way of asking), shown as "last checked <date>", never counted in today's numbers. Load the `claims-gate` skill (`../claims-gate/SKILL.md`) and read the contract only.
3. **Ask nothing yet.** No intake questions before the free pass. Countries default to the brand's market from the brain or site (else the US); who ships is unknown until asked; comparison pages are recommended as briefs only until the marketer says competitors may be named. Answers saved on an earlier run (in `search/questions.md`) count as known: the first message states them as assumptions to confirm, never asks them cold. A second run on the same day overwrites that day's files and bumps the roadmap's version.

## Steps

### 1. Free pass — do everything free before the first message
Do all of `references/free-pass.md`, for the brand and its main rivals, without stopping to ask. Two rules on top of it:
- **Rank the draft five** with `references/prioritising.md` before the first message, so the five shown there are the five the report keeps (unless the top-up changes the evidence — then the report says what changed).
- **Every number traces to a source opened this run** (a page read, a search result, an answer captured), cited with its date. A figure from memory — stars, users, funding, prices — is cut or checked first; never write it as fact.

### 2. One message: the answer, the report, and the decisions left
Write and deliver the report first (step 5's writing and delivery rules) — in the same turn, before this message, never "say the word and I'll write it". Then the message, in plain words, no tool names, ids or codes. On a repeat run it opens with **since last time** in 3–5 lines (run-memory step 4): today's count against the last check's on the same questions, which of last month's fixes shipped and what moved after them, who moved in. Then **counts first** for what was checked this run ("ChatGPT, asked signed out today: named on 0 of 8 buying questions, 5 of 5 brand questions"; with no browser: "web search today: on page one for 1 of 8 buying questions" and ChatGPT "not checked today — last checked 18 Oct"), who wins instead, the one pattern, the five fixes, the report link, and what the free pass could not see — including that signed-out checks are not what a signed-in buyer sees. Then only the decisions left, together; the marketer's answers update the same report:
- **Which buyer do we want to win?** — whenever the site shows more than one positioning or audience: name each, recommend one with the reason, and keep any fix that would retitle pages from one to the other conditional on the answer.
- **One credit yes** for the paid top-up, through the `spend-gate` skill (`../spend-gate/SKILL.md`) proxy branch: exact Google page-one results for the question set (and the site's index check), as "up to N credits", an estimate from the credits log — or, with no history, say what it adds and let the marketer name the ceiling; the first lookup runs as the probe inside that same yes. Never call the price-check tool for these lookups; it doesn't price them. Skip the top-up entirely if the free pass already answers the ask.
- **Facts only the marketer knows**, only if a fix depends on them: who can change the site and how many pages a month; may pages name competitors; for local, the locations; optional, Search Console (plain click-by-click steps in `references/citation-protocol.md`).
- **The question set**, shown for edits that apply to the top-up and the next runs — not a gate before the answer.
- Hosts without a browser: offer the short paste set for the AI rows instead of running them.
If a fix needs a claim the claims gate can't use yet, the claims gate's scoped sign-off for those 3–5 lines goes in this same message.

### 3. Paid top-up (only on the yes)
Run the Google lookups inside the ceiling (atom the `improve-search-visibility-citation-check` skill (`../improve-search-visibility-citation-check/SKILL.md`)), log every charge, stop at the ceiling. Fold the results into the same report and re-deliver it; a declined top-up leaves the report standing and is named as a gap. The same goes for answers to the other decisions and pasted ChatGPT answers: update the report, don't start a new one.

### 4. Read the pattern, update the roadmap, finish the five fixes
- **Pattern** (`references/gap-to-fix.md`): which sources the engines lean on, which gaps are on our pages vs other people's; false brand facts first.
- **Roadmap** (`references/page-map.md`): every cluster mapped to the page that should answer it — existing, rewrite, merge, needed, parked — with priority and a quarter at the stated capacity.
- **Five fixes** (`references/prioritising.md`, atom the `improve-search-visibility-fix-writer` skill (`../improve-search-visibility-fix-writer/SKILL.md`), then the `claims-gate` skill (`../claims-gate/SKILL.md`) over every factual sentence): on a repeat run, last run's still-open fixes that are still worth doing come first with their ids, marked "still open from <date>" (`references/run-memory.md`); the rest drawn from the top of the roadmap plus blockers; five means five, fewer real ones are reported as fewer. When measurement isn't set up, it comes first and always has three parts in one fix: Search Console, Bing Webmaster Tools, and an AI-referral baseline in the brand's analytics (visits from chatgpt.com, perplexity.ai and similar referrers), so the next check can show movement. New pages → briefs in `search/briefs/<page-slug>.md` (make-content's brief input shape).

### 5. Write, check and deliver the report (runs inside step 2's turn, and again after any update)
Write it through the `write-report` skill (`../write-report/SKILL.md`) using `references/report-template.md`: one report, human shape and language. **Run the mechanical check before delivering** (write-report §3 plus this playbook's banned words in the template): on a host with a shell, search the file for each banned word and fix every hit. Deliver and save it per write-report §2, as `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-search-visibility.md`; never `gooseworks:brand_update` for a report, and never a local folder dressed up as the workspace. If the save fails, say so in one plain line. Also save the working files in the Output table through the `save-to-brain` skill (`../save-to-brain/SKILL.md`), in the modes shown there. Then **save the run record** (the End steps of the `run-memory` skill (`../run-memory/SKILL.md`) with `references/run-memory.md`), which links those files: the per-question snapshot with the set version asked, the five fixes as recommendations with review timings and how we'll know, and the outcomes of last run's fixes. Its "saved this run's notes" line folds into the report-link line of the message, not a line of its own. Only a rule the marketer states (e.g. "never name competitors on our pages") goes through the `save-learning` skill (`../save-learning/SKILL.md`) (prefix `[search YYYY-MM-DD]`). Step 2's message is the first turn's chat output, with since last time in it. After a later re-delivery (the top-up, the marketer's answers, pasted answers), the chat is at most three lines: the one thing to do first, the report link (and "saved to your brand" link), the decisions still open. Never list working files or paths. **Then judge whether repeating would help this brand** (marketing-guide §3, "Schedules") and offer a repeat only when it would, with the reason and a cadence — monthly by default. It helps when there are fixes to ship and a question set to track, and movement shows over weeks ("you're shipping five fixes; a monthly check shows which ones moved ChatGPT and Google"); weekly only during a launch or a fast-moving fight for one of the brand's most important questions. Don't offer a schedule for a one-off ask (a single listing rewrite, one false fact to correct): offer one re-check after the fix ships instead. Pre-launch: offer the first check for the week after launch, not a schedule. On a yes, create it paused through `gooseworks:automation_upsert` under the `spend-gate` skill (`../spend-gate/SKILL.md`)'s automation rule (free steps only unless the yes names a per-run credit ceiling), with the self-contained prompt in `references/run-memory.md`; each scheduled run reads the last run record and writes a new one, checks whether the fixes shipped, asks every key question three times (one run is noise: AI answer lists rarely repeat) and calls a trend only after two or three checks; its report, through write-report, opens with what changed since the last one — or says plainly that nothing material changed.

## Approval gates

- **Credits:** one yes to a ceiling for the paid top-up, after the free result; stop at it; never your own sums shown as a price.
- **Publishing:** nothing live is edited or published — pages, profiles, listings, robots.txt. Every fix is a draft the marketer ships.
- **Structural changes** (robots rules, redirects, URL changes, noindex, merging pages, CDN bot settings): a proposal with the risk and the undo stated.
- **Claims:** only what the claims gate allows; the live site supplies plain product facts only; a yes in chat counts only through the gate's scoped sign-off.
- **Which battles:** the roadmap recommends winnable over prestigious with reasons; the marketer's edits to the question set win.
- **Outreach:** inclusion and correction requests are drafted, never sent. No Wikipedia articles about the brand. No posts that hide the poster's tie to the brand.

## Output and write-back

| Artifact | Where | Read by |
|---|---|---|
| The report | local file `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-search-visibility.md` (or an artifact) + `search/visibility/<date>.md` + brand document "Search visibility — <Brand> — <date>" (keep-history) | the marketer (one click); analyze-performance's channel table; research-competitors (who is named instead) |
| Roadmap | `search/page-map.md` + brand document "Search page map — <Brand> — <date> v<N>" (supersede) | the next run; make-content through the briefs |
| Question set | `search/questions.md` | the next run |
| Five fixes (working copy) | `search/fixes/<date>.md`, with a "For your email program — review requests" section when there is a review-request brief | the next run (fix dates explain movement); email-lifecycle (the review-requests section) |
| Page briefs | `search/briefs/<page-slug>.md` | make-content, whose drafts name the brief on their first line |
| Verbatim answers | `search/visibility/<date>-runs.md` (not imported) | the next run |
| Rules the marketer stated | brand learning `[search YYYY-MM-DD]` | every playbook |
| Run record (per-question snapshot, the five fixes with review dates, their outcomes) | `runs/improve-search-visibility/search-visibility-check/<date>.md` + brand document "Run record — search visibility check — <Brand> — <date>" (keep-history, through run-memory) | the next run, scheduled or not |
| Paid lookups | `research/credits-log/<YYYY-MM>.md` (spend gate) | every proxy user |
| Scheduled re-check (only when judged useful) | an automation, created paused | the marketer enables it |

## Done when

- The first message leads with the counts (after "since last time" on a repeat run): k of N per engine checked, e.g. "named on 0 of 8 buying questions".
- The report has the per-question table (where the brand is and isn't named on ChatGPT and Google, who wins instead, why), the roadmap, and exactly five fixes finished enough to apply this week — or fewer, with the number stated.
- The banned-word scan came back clean.
- The report is saved to the brand, with a link in the message.

## Out of scope

- Writing full pages and articles — make-content (takes the page briefs).
- Videos as a fix — a brief to make-content when YouTube is the winning source.
- Marketplace listings and product feeds — optimize-listings (backlog, not covered yet); the report names the gap only.
- Link-building campaigns and PR — skipped on purpose; only one drafted inclusion or correction request per cited page.
- Standing monitoring and alerts — watch-and-alert (backlog); until then, a scheduled re-check when the run judges it useful.
- Paid search and ads inside AI assistants — run-paid-campaigns.
- Organic revenue attribution — analyze-performance.
- Sending review requests — email-lifecycle; replying to reviews — manage-reviews (backlog).
- Deep technical SEO (migrations, faceted navigation, site-speed engineering) — engineering; this playbook flags blockers on the pages it checked only.
