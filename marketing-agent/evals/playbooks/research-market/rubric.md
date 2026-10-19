# Rubric — research-market

**In short.** Did the agent deliver real **market research** for GooseWorks — the category, size and growth, change, how buyers buy, pricing, channels, buyers in their own words, what people are saying — as a readable report, without asking first?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: playbooks/research-market/SKILL.md "Done when"; playbooks/research-market/tests/test-by-hand.md (18 Oct rebuild); the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Free work before questions.** Sent the marketer no question before its first substantive result (picking or adding the brand excepted; one specific request for the brand's own customer data is also allowed — marketer review, 18 Oct), and never asked permission for free work (reading the brand, web search, page fetches).
- **M2** — **Did not stop after one source.** Researched across several independent kinds of source (for example news, the brand's own site, rivals' pages, review or community sites, the GooseWorks brand data) before reporting, and never stopped to ask "go deeper?" on free work.
- **M3** — **It is market research, not rival research.** Covers the category in buyers' words, market size and growth with whose estimate, what is changing, how and where buyers find and buy, pricing norms, where attention is, and who buys and why — with competitors in one short section only.
- **M4** — **News first.** Recent news (last ~90 days) for GooseWorks and the category was searched and appears in the report (launches, funding, shutdowns, platform changes).
- **M5** — **Buyers in their own words.** The report quotes real buyers or users verbatim with links (reviews, Reddit, community threads), not paraphrases or invented personas.
- **M6** — **Craft, not procedure.** The output is specific to GooseWorks and its buyers (fails the swap test if it could be pasted onto another company), reads like a senior marketer wrote it, and is not a generic checklist or textbook advice.
- **M7** — **A readable document, not a chat summary.** The deliverable was written to a file in the marketer's folder (for example under gooseworks-reports/), the agent linked it by path so it opens with one click, and the chat did not re-paste the report.
- **M8** — **Top five lines tell you what to do.** The document opens with a short summary whose first point is the one move to make first and why (write-report §3: "Do this first").
- **M9** — **Plain words, no internals.** The document has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.
- **M10** — **No invented facts.** Every number, quote, customer and claim traces to a source in the transcript or to the marketer; no named GooseWorks customers, logos or results are claimed (there are none); unapproved claims are not used as facts.
- **M11** — **No spend, nothing published.** No credits spent, nothing posted, sent, scheduled or launched, and the agent did not claim an approval the marketer never gave.
- **M12** — **Volunteered the document.** The agent wrote the report or plan as a file and linked it before the marketer asked for a document. If the marketer had to ask ("can you give me the full report as a doc…") before any file existed, this fails, even if a file came afterwards. (Added 19 Oct: the simulated marketer asks once, so the "readable document" check alone can't tell volunteered reports from requested ones.)

## Should pass

- **S1** — **"For you" on findings.** Each main finding ends with what it means for GooseWorks (fits us or not, from our facts; if yes, what to make or do), and there is a "You vs them" comparison.
- **S2** — **What people are saying now.** A section on current conversation about the brand and category, with the time window stated and counts called samples.
- **S3** — **Brand facts from the brand data.** Brand facts come from the GooseWorks brand record where it has them; contradictions with the website are flagged, not used as claims.
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
- **E7** — **Which market** (new — needs a playbook change first; scored, but not must-pass until the playbook has it). Names 2–3 categories the brand could be filed under, which one buyers actually use (with evidence), and the recommended one.
- **E8** — **Size** (new — needs a playbook change first; scored, but not must-pass until the playbook has it). Gives a cited top-down estimate (publisher and year) and a bottom-up estimate of the reachable market: buyers × price, each input sourced or labelled an assumption. If bottom-up wasn't possible, says why.
- **E9** — (must) **What's changing.** At least 3 dated items from the last 12 months, each with a primary or named source and a one-line meaning. Any platform or legal claim is checked on the primary page, or labelled unverified.
- **E10** — **Buying and paying.** A pricing table of at least 8 products, with the unit of pricing, marking vendor-page vs third-party prices. The brand is placed in it, or the conflict is flagged. The buying path has each line labelled evidence or inference. Each demand line is labelled measured, proxy, known pattern or unknown.
- **E11** — (must) **About the market.** Rival-specific text is at most 15% of body words. If most buyer quotes are about rivals, the report says "category voice, not your buyers". Buyer groups come from the audience profile when one exists; otherwise they're marked provisional. (Stating disagreements with sibling reports is new and not yet required.)
- **E12** — **Listening.** States the window. Calls counts a sample. Names what the brand name gets confused with. Has a risk line. The transcript shows any serious risk was sent to chat before the report.
