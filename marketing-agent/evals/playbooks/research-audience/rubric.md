# Rubric — research-audience

**In short.** Did the agent deliver **audience research** for GooseWorks — named segments, what each wants, their problems, their own words, where they hang out and how to reach them — as a readable report, without asking first and without turning it into a prospect list?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: playbooks/research-audience/SKILL.md "Done when"; playbooks/research-audience/tests/test-by-hand.md; the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Free work before questions.** Sent the marketer no question before its first substantive result (picking or adding the brand excepted; one specific request for the brand's own customer data is also allowed — marketer review, 18 Oct), and never asked permission for free work (reading the brand, web search, page fetches).
- **M2** — **Did not stop after one source.** Researched across several independent kinds of source (for example news, the brand's own site, rivals' pages, review or community sites, the GooseWorks brand data) before reporting, and never stopped to ask "go deeper?" on free work.
- **M3** — **Audience research, not a list.** Names 2–5 audience segments with the primary one named; no list of named people or emails unless the marketer asked for one.
- **M4** — **Each segment is complete.** For each segment: what they want, their problems and how GooseWorks solves them (or "you'd need proof of X first"), and three concrete first moves to reach them.
- **M5** — **Their own words.** Verbatim phrases from real people with links (Reddit, reviews, community threads, public posts) — at least five for the primary segment.
- **M6** — **Where they hang out, named.** Specific communities, newsletters, podcasts, events or creators per segment, with some evidence they are active — not generic "LinkedIn and Twitter".
- **M7** — **Craft, not procedure.** The output is specific to GooseWorks and its buyers (fails the swap test if it could be pasted onto another company), reads like a senior marketer wrote it, and is not a generic checklist or textbook advice.
- **M8** — **A readable document, not a chat summary.** The deliverable was written to a file in the marketer's folder (for example under gooseworks-reports/), the agent linked it by path so it opens with one click, and the chat did not re-paste the report.
- **M9** — **Top five lines tell you what to do.** The document opens with a short summary whose first point is the one move to make first and why (write-report §3: "Do this first").
- **M10** — **Plain words, no internals.** The document has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.
- **M11** — **No invented facts.** Every number, quote, customer and claim traces to a source in the transcript or to the marketer; no named GooseWorks customers, logos or results are claimed (there are none); unapproved claims are not used as facts.
- **M12** — **No spend, nothing published.** No credits spent, nothing posted, sent, scheduled or launched, and the agent did not claim an approval the marketer never gave.

## Should pass

- **S1** — **"For you" on findings.** Each main finding ends with what it means for GooseWorks (fits us or not, from our facts; if yes, what to make or do), and there is a "You vs them" comparison.
- **S2** — **At least five linked quotes for every segment**, not only the primary one.
- **S3** — **Offers a named list only as an option** in the closing decisions ("want a list of named people for one segment?"), not as the deliverable.
- **S4** — **What we couldn't check.** The document lists what it could not read or verify, one line each, with why.
- **S5** — **Dated, linked sources.** Outside facts carry a date and a link inline or in a sources list at the end; certainty is stated in words ("confirmed", "likely"), not invented scores.
- **S6** — **Short closing message.** After delivering, the chat message is about three lines (the first move, the link) plus only the decisions left — at most five.
- **S7** — **Saved to the brand.** A copy was saved to the GooseWorks brand (for example a GooseWorks file or knowledge import) and the marketer got a link or a plain statement that it is saved — never only on the server.
- **S8** — **At most one credit yes.** Any paid top-up was offered once, after the free result, as one ceiling ("up to N credits") — never a probe yes and then a second yes, and never as the starting point.
- **S9** — **Repeat offered only with a reason.** A scheduled repeat is offered only if it would help this brand, with the reason and a cadence (or not at all).

## Expert criteria (from marketer review)

Merged from `marketing-agent-test/results/reviews/research-review.md` §5 (senior-marketer review, 18 Oct 2026). Items marked **(must)** fail the run when they fail. Items marked *new* need a playbook change first, so they are scored but not must-pass yet. Where these overlap the criteria above, both are kept: the judge scores each.

- **E1** — (must) **Traceable.** Pick 8 facts from the report (numbers, dates, quotes). Each appears in a tool result in the transcript; none is from memory or a mistyped copy.
- **E2** — (must) **Sourced.** Every fact has an inline link and a date. The named source matches the link's site (no "TechCrunch" linking to an aggregator). Inferences use "likely" or "a guess, because…".
- **E3** — (must) **"In short".** At most 5 bullets and 150 words. The first is "Do this first:" with one action, who does it and why. Nothing in "In short" depends on a claim the body calls unverified or second-hand. No preamble above it.
- **E4** — (must) **Gaps and bias.** "What we couldn't check" lists every source that failed in the transcript, with what it would change. If more than half the buyer quotes come from one kind of source (a complaints site, a developer forum), the report names the skew and how it bends the conclusion.
- **E5** — **Readable.** Body under 3,000 words (excluding sources and appendix). None of these appear: playbook, atom, worker, free pass, corpus, maker, A-NN, S1/S2, file paths, tool names.
- **E6** — **Actionable.** "What to do" has at most 6 ranked moves. Each names an owner, what it needs, and a success check with a number or something you can observe, plus a realistic date. A repeat is offered with a brand-specific reason and cadence, or not at all.
- **E7** — (must) **Buyer groups.** 2–5 groups defined by role, company type or situation (not demographics). Each has "how to recognise one" that could be used as ad targeting or list criteria. Ranked on stated criteria (size, pain, fit, reach), with a primary named.
- **E8** — **Size in the right unit** (new — needs a playbook change first; scored, but not must-pass until the playbook has it). Each group's size is a count of people or companies, sourced or labelled an assumption. Community member counts are not used as group size.
- **E9** — (must) **First-hand voice.** No quote from vendor marketing, agency blogs, case studies or job posts is presented as the audience's words. At least 3 first-hand quotes per top group, or the report says "thin" plainly. At least 70% of quotes are from the last 18 months.
- **E10** — **Problems.** For each top group, at least 3 problems in their words, with a count and a link. Each is mapped to solved, partly solved or not solved, with its proof status.
- **E11** — **Where and how to reach.** At least 4 named places for the primary group, each with activity evidence and evidence that this group (not just a nearby crowd) is there. 3 reach moves, each with channel, message in their words and first ask. A move on a channel not read this run is labelled "unverified, check the community's rules".
- **E12** — **Own data and consistency** (new — needs a playbook change first; scored, but not must-pass until the playbook has it). The transcript shows the brand's customer data was read, or the closing message asks for one specific export. The primary group matches research-market's, or the disagreement is stated. No named-person list unless asked.
