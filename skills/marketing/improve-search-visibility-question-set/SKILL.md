---
name: improve-search-visibility-question-set
description: >-
  Step of the improve-search-visibility playbook: drafts and scores the buyer-question set in AI and
  Google forms and groups it into page clusters. Run improve-search-visibility instead; not for direct
  use.
version: 0.1.0
---

# question-set

**Reads:** `../improve-search-visibility/references/question-list.md`, `../improve-search-visibility/references/battlegrounds.md`; brand summary, products, audience, competitors (`gooseworks:brand_read`, `gooseworks:competitor_read`); research-audience's `research/audience/voc-bank.md` and research-market's `research/market/demand.md` if present; customer language via `gooseworks:knowledge_search` with `source_types: ["document", "evidence"]` (query "Voice-of-customer bank — customer questions, objections, words customers use"); Search Console export if shared; the previous `search/questions.md` and `search/page-map.md` on re-runs.

**Does:**
0. **Cover every audience the site sells to.** If the site sells to more than one buyer or carries more than one positioning, include questions for each, so the decisions message can ask which buyer to win.
1. Re-run: reuse the saved set, then **top it up to the mix** — at least 3 brand-accuracy questions and every audience the site sells to — before anything runs; propose at most 3 other additions or swaps with reasons; keep ids stable — the same id always means the same words: a reworded question gets a new id and the old one is marked `retired (reworded → Q<n>, v<N>)`, so the next run never compares different wordings.
2. First run: draft 18–20 candidates across the stage mix in both forms, never with the brand name in non-brand questions; 3–6 brand-accuracy questions always; local variants per city for physical businesses.
3. Score value (buying intent 1–5, `../improve-search-visibility/references/question-list.md`) × winnability (1–3) provisionally with a one-line reason each; drop to the best 12–15. A brand name that is a common word always carries the category in brand questions. Pre-launch: category questions plus one name-collision question only.
4. **Cluster and weight.** Group the questions into clusters (one cluster = one page that should answer them); with a Search Console export, sum each cluster's impressions as its demand weight and add any high-impression query the list missed. These clusters are the page map's rows.
5. **Pick the key questions yourself** (the 3–5 highest value × winnability) and run the set — no approval before the free pass. The first message shows the set grouped by cluster for edits; edits apply to the paid top-up and the next runs.

**Writes:** `search/questions.md` in the saved-set format (version, date, country, language, engines, runs·route line, the table with a cluster column).
**Never:** invents search volumes or "how many people ask this". Demand comes from Search Console, Google Trends or autocomplete (free), Keyword Planner when the brand shares it, or a vendor prompt-volume estimate the brand already has — always labelled with its source, estimates as estimates; otherwise "no demand data, ranked by judgment".
