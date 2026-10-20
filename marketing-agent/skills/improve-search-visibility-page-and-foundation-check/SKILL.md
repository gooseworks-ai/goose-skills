---
name: improve-search-visibility-page-and-foundation-check
description: >-
  Step of the improve-search-visibility playbook: checks AI-crawler access, indexing and the pages
  behind lost questions, comparing each with the winning page. Run improve-search-visibility instead;
  not for direct use.
version: 0.1.0
---

# page-and-foundation-check

**Reads:** `../improve-search-visibility/references/foundation-check.md`, `../improve-search-visibility/references/gap-to-fix.md`; the gap rows and the brand's nearest page for each lost key question; Search Console export if shared.

**Does (all free, in the step-1 free pass):**
0. **Find the pages.** `gooseworks:knowledge_import` in its website **discover** mode lists up to 25 same-site pages for free; pick the page nearest each lost question from it. Import mode only when the host cannot fetch pages at all: the 3–6 selected pages, only inside the same ceiling the human agreed (the import's own cap described in words, per the spend gate), then read them with `gooseworks:knowledge_search`.
1. **Site-wide once (free):** fetch robots.txt and classify every rule by retrieval vs training bot; with a shell, test CDN blocking by requesting a page as OAI-SearchBot and PerplexityBot vs a normal agent (no shell → not checked, developer checklist); sitemap; duplicate platform host; Search Console and Bing Webmaster Tools set up (from intake). Indexing comes from Search Console if shared, else from the one paid `site:` probe of the credit flow (step 4).
2. **Per page:** status and redirects, canonical, robots meta and header, content visible without JavaScript, title/H1/meta, the answer-first opening, structured data validity and match with visible text, field speed data where available, internal links in.
3. **Compare with the winner:** for each lost key question, the passage the engine lifted from the winning page vs the brand's page — what the winner states that the brand does not.
4. **Near-winners** (Search Console only): queries at positions ~4–15 or with high impressions and low click rate that map to the agreed questions.
5. Mark everything pass / fail / not checked. Use the host's own fetch or shell; what it cannot see goes to a short developer checklist — never a technical question to the human. Read the theme's existing structured data before proposing any.

**Writes:** the foundation table and per-page notes for the report; candidate fixes (blockers flagged) for fix ranking.
**Never:** marks an item passed that it did not see; proposes a structural change (robots, redirects, noindex, URL change) as anything but a proposal with risk and undo.
