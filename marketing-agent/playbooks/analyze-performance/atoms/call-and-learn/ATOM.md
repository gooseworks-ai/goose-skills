<!-- Hidden atom (analyze-performance-call-and-learn): Hidden atom of analyze-performance. Calls ended tests against the brief's success criteria, scores last week's calls, writes this week's kill/scale/hold calls with confidence, and drafts and (after the human has seen them) writes learnings to the brand brain. -->

# Test calls, calls and learnings (atom)

**Load:** `../../references/tests-and-learnings.md`.

**Inputs:** the brief's test plan; this week's results; last week's report (its calls); the change log (what was actually done); the learnings log (`knowledge_search source_types: ["learning"]`, `brand_read` learnings).

**Do:**
1. Call each ended test Win / Loss / Unclear against its written criteria with the brief's action; state confidence.
2. Score last week's recommendations: what was actually done (the `### YYYY-MM-DD — <title>` blocks in `decisions.md`, written by run-paid-campaigns and the server), what happened, right or wrong.
3. Write this week's calls (kill / scale / hold, Google negatives) with object, why, confidence and "would change if"; low confidence → "watch".
4. Check fired replan triggers against the brief's thresholds.
5. Draft ≤ 3 learnings as one-line rules (template in the reference); only ended tests, 2+ week patterns that clear the test n floors on the referee-joined number, confirmed surprises or failures; each shows what it would retire.
6. After the human's reply to the decisions block: write the kept learnings through `../../../../atoms/save-learning/ATOM.md` — one idea per learning, `[learning YYYY-MM-DD]` (+ ` A-NN`), their exact words as the statement, own superseded facts retired in the same call; read back, compare, report which landed. Without their words, write nothing.

**Output:** the report's Tests, Calls, Learnings-proposed sections; the learnings rows written after the human has seen them.
