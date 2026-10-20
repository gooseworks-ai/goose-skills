<!-- Hidden atom (analyze-performance-call-and-learn): Hidden atom of analyze-performance. Calls ended tests against the brief's success criteria, scores last week's calls, writes this week's kill/scale/hold calls with confidence, and drafts and (after the human has seen them) writes learnings to the brand brain. -->

# Test calls, calls and learnings (atom)

**Load:** `../../references/tests-and-learnings.md`.

**Inputs:** the brief's test plan; this week's results; last week's report (its calls); the change log (what was actually done); the learnings and readouts (`brain_map` kind 23 / `brain_search` where listed; else `knowledge_search source_types: ["learning"]`, `brand_read` learnings); the paid run's newest run record.

**Do:**
1. Call each ended test Win / Loss / Unclear against its written criteria with the brief's action; state confidence.
2. Score last week's recommendations through run-memory's outcome check (`../../references/run-memory.md`): what was actually done (the `### YYYY-MM-DD — <title>` blocks in `decisions.md`, run-paid-campaigns' run record), and what happened — for a money move, the paid run's verdict plus the store-joined check over the same window; right or wrong.
3. Write this week's calls (kill / scale / hold, Google negatives) with object, why, confidence and "would change if"; low confidence → "watch".
4. Check fired replan triggers against the brief's thresholds.
5. Draft ≤ 3 learnings as one-line rules (template in the reference); only ended tests, 2+ week patterns that clear the test n floors on the referee-joined number, confirmed surprises or failures; each shows what it would retire.
6. Readouts: each Win / Loss → kind 23 `experiment_readout.<campaign-slug>-t<n>` through save-learning's readout path, only with the marketer present; scheduled runs mark it `readout to save`.
7. After the human's reply to the decisions block: write the kept learnings through `../../../../atoms/save-learning/ATOM.md` — one idea per learning, `[learning YYYY-MM-DD]` (+ ` A-NN`), their exact words as the statement, own superseded facts retired in the same call; read back, compare, report which landed. Without their words, write nothing.

**Output:** the report's Tests, Calls, Learnings-proposed sections; the learnings rows written after the human has seen them.
