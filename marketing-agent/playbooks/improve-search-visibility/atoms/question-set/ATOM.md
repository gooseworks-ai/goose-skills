---
name: question-set
description: Internal step of improve-search-visibility. Drafts the buyer-question set (category, problem, comparison, price, brand-accuracy, local) in AI and Google forms, scores value and winnability, and gets the human's yes. Not user-invoked.
---

# question-set

**Reads:** `../../references/question-list.md`, `../../references/battlegrounds.md`; brand summary, products, audience, competitors (`gooseworks:brand_read`, `gooseworks:competitor_read`); research-market's `research/market/voc-bank.md` and `research/market/demand.md` if present; customer language via `gooseworks:knowledge_search` with `source_types: ["document", "evidence"]` (query "Voice-of-customer bank — customer questions, objections, words customers use"); Search Console export if shared; the previous `search/questions.md` and `search/page-map.md` on re-runs.

**Does:**
1. Re-run: reuse the saved set; propose at most 3 additions or swaps with reasons; keep ids stable.
2. First run: draft 18–20 candidates across the stage mix in both forms, never with the brand name in non-brand questions; 3–6 brand-accuracy questions always; local variants per city for physical businesses.
3. Score value × winnability provisionally with a one-line reason each; drop to the best 12–15. A brand name that is a common word always carries the category in brand questions. Pre-launch: category questions plus one name-collision question only.
4. **Cluster and weight.** Group the questions into clusters (one cluster = one page that should answer them); with a Search Console export, sum each cluster's impressions as its demand weight and add any high-impression query the list missed. These clusters are the page map's rows.
5. **Pick the must-wins yourself** (the 3–5 highest value × winnability) and run the set — no approval before the free pass. The first message shows the set grouped by cluster for edits; edits apply to the paid top-up and the next runs.

**Writes:** `search/questions.md` in the saved-set format (version, date, country, language, engines, runs·route line, the table with a cluster column).
**Never:** invents search volumes or "how many people ask this" — no prompt-volume data exists.
