---
name: citation-check
description: Internal step of improve-search-visibility. Runs the agreed questions on each surface the honest way (fresh, logged out, set country, repeated runs), records every run and scores named k-of-N, prominence and cited source types. Not user-invoked.
---

# citation-check

**Reads:** `search/questions.md`; `../../references/citation-protocol.md`; the canonical brand facts from the brain (for accuracy checks on brand questions); the tracked competitor list.

**Does:**
1. **Free pass (step 1):** ChatGPT, AI Overview and AI Mode in the host's own browser (private window, signed out; stop on any CAPTCHA or refusal and mark the surface), and the host's web search for who ranks, labelled "web search". **Paid top-up (step 3, only after the one yes):** Google's exact page one through `gooseworks:data_call_provider` (provider `scrapecreators`, path `/v1/google/search`, the query and region), inside the ceiling (`../../../../atoms/spend-gate/ATOM.md` proxy branch), stopping at it. No browser → the minimum paste set, offered in the first message.
2. **Run** — ChatGPT once per question and three times for the must-wins; AI Overview and AI Mode once each when Google allows; Google page one once per question in the top-up; pasted: 5 questions (up to 4 must-wins + at least one brand question), ChatGPT twice, AI Overview and AI Mode once each. New chat per question, memory off, never the brand name in non-brand prompts. Wait for each answer to finish (protocol's wait rule); unfinished answers are retried once, never scored as misses.
3. **Record** every run with the full field list; save verbatim answers. Note whether ChatGPT searched (sources shown) — answers without search come from training memory.
4. **Classify** every cited URL by source type. For brand questions, list each stated fact and compare it to the brain: correct / wrong (quote both) / not on file.
5. **Score** each row (named k of N, won/partial/lost/no-brand answer, prominence, stable or unstable), then mention rate per surface and stage, own-citation rate, third-party coverage and share of voice against the brands the engines named. Won = ≥ ⅔ of runs; unstable = some but not all; one run is never stable.

**Writes:** the rows table used by the report and the verbatim runs file (`search/visibility/<date>-runs.md`, not imported); every charge is logged by the spend gate, and the report states credits charged against the ceiling in the gate's own words.
**Never:** reports one run as fact; passes an organic or API read off as what buyers see in the AI apps; ranks the brand "#2 in ChatGPT".
