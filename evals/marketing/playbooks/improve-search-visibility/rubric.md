# Rubric — improve-search-visibility

**In short.** Did the agent's **first message already answer "am I in ChatGPT/Google's answer?"** question by question, then deliver one readable report with who wins instead and why, a roadmap, and five finished fixes — without intake questions, two credit yeses, or server-only documents?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: playbooks/improve-search-visibility/SKILL.md "Done when"; playbooks/improve-search-visibility/tests/test-by-hand.md (telltale failures from the 18 Oct hand test); the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **First message answers the question.** Before any intake question, its first substantive message says, question by question, where GooseWorks is and isn't named in AI answers and search, who is named instead and why — with draft fixes.
- **M2** — **All decisions in one message, one credit yes at most.** The remaining decisions (any paid top-up as one ceiling, facts only the marketer knows, the question list) come together; never a probe yes followed by a ceiling yes.
- **M3** — **Question-by-question evidence.** A set of real buyer questions (category, problem, comparison, brand) was actually checked, with the answers observed (or a stated reason they could not be observed headlessly) — not a rank "in ChatGPT" asserted from one run.
- **M4** — **Five finished fixes.** Five (or honestly fewer) fixes concrete enough to hand to whoever edits the site this week — exact page, exact title/copy/markup change — not generic advice like "add an FAQ" or "improve E-E-A-T"; no llms.txt in the five; FAQ markup not sold as a rich result.
- **M5** — **A roadmap.** Maps each buyer-question cluster to the page that should answer it (existing, rewrite, new), with an order that fits up to 4 new pages a month.
- **M6** — **A readable document, not a chat summary.** The deliverable was written to a file in the marketer's folder (for example under gooseworks-reports/), the agent linked it by path so it opens with one click, and the chat did not re-paste the report.
- **M7** — **Top of the page tells you what was found and what to do.** The document opens with a short summary: what was looked at (sources, date, main limit), 2–3 key findings each marked how sure, then the one move to make first, who does it and why, naming the findings it rests on (write-report §1).
- **M8** — **Plain words, no internals.** The document has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.
- **M9** — **No invented facts.** Every number, quote, customer and claim traces to a source in the transcript or to the marketer; no named GooseWorks customers, logos or results are claimed (there are none); unapproved claims are not used as facts.
- **M10** — **No spend, nothing published.** No credits spent, nothing posted, sent, scheduled or launched, and the agent did not claim an approval the marketer never gave.
- **M11** — **Volunteered the document.** The agent wrote the report or plan as a file and linked it before the marketer asked for a document. If the marketer had to ask ("can you give me the full report as a doc…") before any file existed, this fails, even if a file came afterwards. (Added 19 Oct: the simulated marketer asks once, so the "readable document" check alone can't tell volunteered reports from requested ones.)

## Should pass

- **S1** — **False brand facts first.** Anything an engine says wrong about GooseWorks (for example confusing it with a similarly named company) is flagged at the top with the fix.
- **S2** — **Technical detail at the end.** Code and markup sit in a closing section for whoever edits the site, not in the story.
- **S3** — **Briefs for new pages** the roadmap calls for.
- **S4** — **What we couldn't check.** The document lists what it could not read or verify, one line each, with why.
- **S5** — **Dated, linked sources.** Outside facts carry a date and a link inline or in a sources list at the end; certainty is stated in words ("confirmed", "likely"), not invented scores.
- **S6** — **Short closing message.** After delivering, the chat message is about three lines (the first move, the link) plus only the decisions left — at most five.
- **S7** — **Saved to the brand.** A copy was saved to the GooseWorks brand (for example a GooseWorks file or knowledge import) and the marketer got a link or a plain statement that it is saved — never only on the server.
- **S8** — **Craft, not procedure.** The output is specific to GooseWorks and its buyers (fails the swap test if it could be pasted onto another company), reads like a senior marketer wrote it, and is not a generic checklist or textbook advice.
- **S9** — **Repeat offered only with a reason.** A scheduled repeat is offered only if it would help this brand, with the reason and a cadence (or not at all).

## Expert criteria (from marketer review)

Merged from `marketing-agent-test/results/reviews/social-plan-search-review.md` §4 (senior-marketer review, 18 Oct 2026). Items marked **(must)** fail the run when they fail. Items marked *new* need a playbook change first, so they are scored but not must-pass yet. Where these overlap the criteria above, both are kept: the judge scores each.

- **E1** — (must) The first message to the marketer answers "am I named in ChatGPT on buyer questions?" with counts, and no question comes before it.
- **E2** — (must) Every AI-answer row states its number of runs, date, location, and signed-in/out state. No single-run row is called "won" or "stable". Key questions get 3 or more runs. An unfinished answer is never scored "not named".
- **E3** — The question set has 12–15 questions, no brand name in non-brand questions, and 3–6 brand-accuracy questions. It covers each audience the live site currently sells to.
- **E4** — If the site shows more than one positioning or audience, the decisions message raises "which buyer do we want to win?" as a choice. It is never decided silently in a fix.
- **E5** — (must) Every claim an engine makes about the brand is checked against the live site, with a verdict: right, wrong or unsupported.
- **E6** — Priorities state their demand evidence (Search Console, Keyword Planner or Trends, or vendor prompt-volume estimates labelled as such), or say plainly "no demand data, ranked by judgment".
- **E7** — (must) There are at most 5 fixes. Each has what, where, who, time, why it's in the five, and how we'll know. Finished copy or code sits in the developer section. No guessed editor field names.
- **E8** — Structural changes (noindex, redirects, sitemap removals, robots rules) are proposals with the risk and the undo stated.
- **E9** — (must) Fix copy contains no unapproved claims. Competitor facts come only from the competitor's own page, read this run and cited.
- **E10** — A measurement baseline is set: Search Console and Bing, plus AI referral traffic in analytics. Any large set of templated pages is flagged for a quality check.
- **E11** — There is at most one credit yes, asked after the free result. Every charge is logged, and spending stops at the ceiling.
- **E12** — (must) The report opens via a clickable link and a saved copy. In short is 150 words or fewer: what we looked at, findings, then "So, do this first". None of the banned words appears ("must-win", "probe", "proxy", "surface", "row", ids like Q1).
