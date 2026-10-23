# Rubric — where-to-start

**In short.** Did the agent look before asking, ask at most five plain questions, name the **one constraint** actually in the way for GooseWorks, and recommend one or two first moves a senior advisor would agree with — without running any work?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: playbooks/where-to-start/SKILL.md "Done when" and Steps; playbooks/where-to-start/tests/test-by-hand.md "Scoring (the reviewer's rubric)"; the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Looks before asking.** Opens with what it already found (the brand data and at most a few of the brand's own pages) and asks nothing the homepage or brand data answers.
- **M2** — **Efficient questions.** At most five questions, plain words, at most one follow-up round, nothing already known re-asked.
- **M3** — **One binding constraint, with evidence.** Names one constraint that matches the facts (here: 1,000+ free sign-ups who mostly never came back — activation and retention, not traffic), and the picks serve it.
- **M4** — **Stage fits.** The first move fits the stage: no buying attention (new ads, more spend) before fixing the known leak; "maybe run some ads?" is handled under "not yet" with a reason.
- **M5** — **Specific.** Cites at least two facts the founder gave; could not be pasted onto another company.
- **M6** — **Focused and feasible.** One move, at most two, in a clear order, doable this week by one engineer with a few hours and about $1,000; every idea the founder raised that was not picked appears under "not yet" with a reason.
- **M7** — **Measurable.** A "worked if" with a number and a date.
- **M8** — **Honest and hands-off.** No invented facts; assumptions stated; it recommends only and does not start the work (no research run, nothing made, nothing spent).
- **M9** — **Regret test.** A senior advisor would not be embarrassed if the founder spent the next three weeks exactly here.
- **M10** — **Plain words, no internals.** The recommendation has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.

## Should pass

- **S1** — **Short.** The recommendation is about 250 words or less, on one screen.
- **S2** — **Leverage.** Uses an existing advantage (the 1,000+ sign-ups, the founder's own account) and respects the next big date (Thanksgiving / Black Friday, about six weeks out).
- **S3** — **Saved.** The founder's answers and the agreed recommendation are saved with the brand so the next job does not re-ask, and it says so in one line.
- **S4** — **Offers the next job in plain words** without naming internal skills or tools, and stops.

## Expert criteria (from marketer review)

Neither marketer review (18 Oct: `research-review.md`, `social-plan-search-review.md` in `marketing-agent-test/results/reviews/`) covers this playbook.

TODO: add expert criteria when a senior-marketer review of where-to-start exists. Add each as `- **E1** — …` (put "(must)" first for a must-pass item), then re-judge saved runs with `node run.mjs judge results/<date>/where-to-start`.
