# Rubric — research-competitors

**In short.** Did the agent deliver **competitor research** for GooseWorks — rivals chosen from evidence, every rival covered on the same dimensions (ads on every platform, posts, launches, pricing, positioning, reviews), timely openings first — as a readable report, without asking first or selling a paid read for what it could get free?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: skills/marketing/research-competitors/SKILL.md "Done when"; skills/marketing/research-competitors/tests/test-by-hand.md (18 Oct rebuild, the fictional B2B case); the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `skills/marketing/write-report/SKILL.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Free work before questions.** Sent the marketer no question before its first substantive result (picking or adding the brand excepted), and never asked permission for free work (reading the brand, web search, page fetches).
- **M2** — **No paid read offered for free data.** It did not offer or ask for a paid read before trying the free routes (web search, fetching ad-library and rival pages).
- **M3** — **Rivals chosen from evidence.** The main rivals come from category evidence it gathered (searches like "best AI ad tools", "alternatives to", AI answers, review sites), not from memory alone; the report says why each is in the set.
- **M4** — **Same-shape profile for every main rival.** Each main rival is covered on the same dimensions: news and launches, ads (Meta, LinkedIn, Google, TikTok — or a stated reason a library could not be read), founder/company posts, pricing, positioning, reviews.
- **M5** — **News first, openings at the top.** Recent news for every rival and for GooseWorks was searched; time-boxed openings (a launch, a shutdown, a price change) lead the report with what to do and by when.
- **M6** — **Did not stop after one source.** Researched across several independent kinds of source (for example news, the brand's own site, rivals' pages, review or community sites, the GooseWorks brand data) before reporting, and never stopped to ask "go deeper?" on free work.
- **M7** — **Craft, not procedure.** The output is specific to GooseWorks and its buyers (fails the swap test if it could be pasted onto another company), reads like a senior marketer wrote it, and is not a generic checklist or textbook advice.
- **M8** — **A readable document, not a chat summary.** The deliverable was written to a file in the marketer's folder (for example under gooseworks-reports/), the agent linked it by path so it opens with one click, and the chat did not re-paste the report.
- **M9** — **Top of the page tells you what was found and what to do.** The document opens with a short summary: what was looked at (sources, date, main limit), 2–3 key findings each marked how sure, then the one move to make first, who does it and why, naming the findings it rests on (write-report §1).
- **M10** — **Plain words, no internals.** The document has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.
- **M11** — **No invented facts.** Every number, quote, customer and claim traces to a source in the transcript or to the marketer; no named GooseWorks customers, logos or results are claimed (there are none); unapproved claims are not used as facts.
- **M12** — **No spend, nothing published.** No credits spent, nothing posted, sent, scheduled or launched, and the agent did not claim an approval the marketer never gave.
- **M13** — **Volunteered the document.** The agent wrote the report or plan as a file and linked it before the marketer asked for a document. If the marketer had to ask ("can you give me the full report as a doc…") before any file existed, this fails, even if a file came afterwards. (Added 19 Oct: the simulated marketer asks once, so the "readable document" check alone can't tell volunteered reports from requested ones.)

## Should pass

- **S1** — **"For you" on findings.** Each main finding ends with what it means for GooseWorks (fits us or not, from our facts; if yes, what to make or do), and there is a "You vs them" comparison.
- **S2** — **Swipe file of what works.** Formats, angles and hooks rivals use, each with a link, and which ones GooseWorks should or should not borrow — never copying their words or disparaging them.
- **S3** — **What we couldn't check.** The document lists what it could not read or verify, one line each, with why.
- **S4** — **Dated, linked sources.** Outside facts carry a date and a link inline or in a sources list at the end; certainty is stated in words ("confirmed", "likely"), not invented scores.
- **S5** — **Short closing message.** After delivering, the chat message is about three lines (the first move, the link) plus only the decisions left — at most five.
- **S6** — **Saved to the brand.** A copy was saved to the GooseWorks brand (for example a GooseWorks file or knowledge import) and the marketer got a link or a plain statement that it is saved — never only on the server.
- **S7** — **At most one credit yes.** Any paid top-up was offered once, after the free result, as one ceiling ("up to N credits") — never a probe yes and then a second yes, and never as the starting point.
- **S8** — **Repeat offered only with a reason.** A scheduled repeat is offered only if it would help this brand, with the reason and a cadence (or not at all).

## Expert criteria (from marketer review)

Merged from goose-lab `plan/marketing-agent/reviews/2026-10-18-research-review.md` §5 (senior-marketer review, 18 Oct 2026). Items marked **(must)** fail the run when they fail. Items marked *new* need a playbook change first, so they are scored but not must-pass yet. Where these overlap the criteria above, both are kept: the judge scores each.

- **E1** — (must) **Traceable.** Pick 8 facts from the report (numbers, dates, quotes). Each appears in a tool result in the transcript; none is from memory or a mistyped copy.
- **E2** — (must) **Sourced.** Every fact has an inline link and a date. The named source matches the link's site (no "TechCrunch" linking to an aggregator). Inferences use "likely" or "a guess, because…".
- **E3** — (must) **"In short".** At most 150 words: "What we looked at", 2–3 numbered findings marked confirmed / likely / first look, then "So, do this first (because of …)" with one action, who does it and why. Nothing in "In short" depends on a claim the body calls unverified or second-hand. No preamble above it.
- **E4** — (must) **Gaps and bias.** "What we couldn't check" lists every source that failed in the transcript, with what it would change. If more than half the buyer quotes come from one kind of source (a complaints site, a developer forum), the report names the skew and how it bends the conclusion.
- **E5** — **Readable.** Body under 3,000 words (excluding sources and appendix). None of these appear: playbook, atom, worker, free pass, corpus, maker, A-NN, S1/S2, file paths, tool names.
- **E6** — **Actionable.** "What to do" has at most 6 ranked moves. Each names an owner, what it needs, and a success check with a number or something you can observe, plus a realistic date. A repeat is offered with a brand-specific reason and cadence, or not at all.
- **E7** — (must) **Field before rivals.** The transcript shows category and "alternatives" searches before rivals were chosen. 3–6 main rivals, each with a why. Substitutes include doing it yourself and the platform's own tools. The category frame is stated in one line.
- **E8** — (must) **Same-shape profiles.** Every main rival has: 90-day news; pricing with its unit and source type; the homepage headline word for word; at least 2 buyer quotes (praise and complaint); founder posts or "couldn't read"; and where we win and lose.
- **E9** — (must) **Ads, honestly.** For each main rival and the brand, each of the Meta, LinkedIn, Google and TikTok libraries shows either ads read (with start dates and how long they've run) or "couldn't open (reason)". "None" only where the library loaded. No rival spend, return on ad spend or "best-performing ad" stated as fact.
- **E10** — **Launches.** Launches in the last 90 days are dated. The top 1–2 get a beat breakdown labelled by how it was read (video, transcript or page text). A counter-position is proposed only where the brand has dated proof it does the same job, and the report says why it's worth the attention.
- **E11** — (must) **Different, not louder.** "Everyone sounds the same" names at least 2 phrases shared by 2+ rivals. Neither "Do this first" nor the top angle is something the report itself calls table stakes. Every angle has evidence and a proof status. No rival headline wording is reused.
- **E12** — **Guardrails and memory.** No mocking or disparaging language. A rival is named in proposed public copy only with a sign-off flag. Each timely opening has an event date, a source, and an end date with its basis. The transcript shows a snapshot saved per rival for next week's comparison.
