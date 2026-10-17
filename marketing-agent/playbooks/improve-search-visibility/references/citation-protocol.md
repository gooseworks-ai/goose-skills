# Citation check protocol

Load at steps 4–5 (atom citation-check).

## Surfaces and how each is observed
| Surface | Default observation route today | Runs |
|---|---|---|
| Google organic top 10 | `gooseworks:data_call_provider` provider `scrapecreators`, path `/v1/google/search`, query + `region` (paid; organic results only, page one — no AI Overview, no People-also-ask, no local pack) | 1 |
| Google AI Overview | the host's own browser (incognito), or the human pastes | 2 (1 pasted) |
| Google AI Mode (`google.com/search?udm=50`) | host browser or human | 2 (1 pasted) |
| ChatGPT with search | host browser (private window, not signed in) or human | 3, 5 for must-wins (2 pasted) |
| Perplexity / Gemini / Copilot | only when the buyer uses them; host browser or human | 3 |

Every report row says how it was observed: **looked up through GooseWorks** (organic), **agent browser**, **run by you**. Never present an organic read as an AI-answer read. Never call an AI model's API with a local key to stand in for the consumer apps (no vendor keys, ever).

**Agent browser rules:** a private window for Google; chatgpt.com in a private window, not signed in — a Temporary Chat only if ChatGPT forces sign-in and never in the founder's account; record which was used. On any CAPTCHA or bot challenge, stop and hand that surface to the human; never solve it.

**Minimum paste set (when the human runs them):** 5 questions — up to 4 must-wins plus at least one brand question ("what is [brand] [category]" or "is [brand] legit"; pre-launch: the name-collision question); ChatGPT twice, AI Overview and AI Mode once each — 20 pastes. For the "AI says something false" entry, the paste set is the brand questions (3–6) instead of the must-wins. Give it as plain steps, no jargon:
```
For each question below:
1. Open chatgpt.com in a private window without signing in (use a Temporary Chat only if it insists on sign-in). Paste the question, wait for the answer, click "Sources" if shown (else write "no sources"), then copy everything back here under a line like:  Q3 · ChatGPT · try 2
2. In the same private window, search Google for the short version. If an "AI Overview" box shows, click "Show more" and copy it with its links under:  Q3 · AI Overview  (if none shows, write "none").
3. Open google.com/search?udm=50, paste the full question, copy the answer and its links under:  Q3 · AI Mode
```
Source titles and domains are enough. Pasted rows are scored "k of 2, run by you" and labelled with "settings as you reported".

## Honest sampling
- ChatGPT: new chat per question; memory and custom instructions off; never mention the brand in a non-brand prompt. Record whether it searched (sources shown). An answer with no sources comes from training memory: label it — page fixes will not move it quickly.
- Google: incognito, signed out, country set (`gl`, `hl`), city noted for local. Record whether an AI Overview appeared at all; "no AI Overview" is not a miss.
- AI lists rarely repeat between identical prompts: how often the brand appears is the signal; its rank in one list is noise.

## Per-run record
question id · surface · run # · date and time · country/city · observation route · search used (Y/N) · answer verbatim (saved in the report appendix) · brand named (Y/N) · prominence (recommended first / in a list #k of n / passing mention / absent) · own domain cited (Y/N, URL) · every cited URL with source type · competitors named in order · how the brand is described (exact phrase) · accuracy errors (brand questions) · tone (positive / neutral / negative / caveated).

Source types: our site · competitor's own page (comparison, alternatives, pricing, docs) · listicle / "best X" article · review platform (G2, Capterra, Trustpilot, Google reviews) · Reddit / forum · YouTube · Wikipedia / Wikidata · directory · news / PR · marketplace / app store.

## Scoring
- Per question × surface: **named k of N**; **won** (named in ≥ ⅔ of runs), **partial**, **lost** (never named while competitors are), **no-brand answer** (nobody named — only the citation is at stake). **Unstable** = named in some but not all runs, for any N; a row with one run is never "stable". Stability applies to AI surfaces; a Google organic row is spot-checkable as in/out of the top 10 (position ± 3).
- Mention rate per surface and per stage; own-citation rate; third-party coverage (cited pages that name the brand); share of voice against the brands the engines actually named (the tracked roster often misses them; list new names for research-competitors).
- Google organic: best brand URL position in the top 10, else "not in top 10" (one lookup returns page one only).

## What can and cannot be claimed
Can: "On [date], from [country], logged out, [surface] named you in k of N runs; [rival] in N of N; it cited [sources]."
Cannot: share of all users' answers; how often anyone asks the question (no prompt-volume data exists — never invent it); a "rank in ChatGPT"; traffic or revenue impact; that a fix caused a later change from one re-run (variance is larger than most effects; call a trend after 2–3 runs).
Always print n runs, date, location and logged-out state on the report.

## Search Console, in plain words (optional ask)
```
If your site is connected to Google Search Console (Google's free dashboard of which searches find you):
1. Open search.google.com/search-console and pick your site.
2. Click "Performance" on the left, set the date to the last 3 months.
3. Click "Export" (top right) → "Download CSV", or just screenshot the Queries and Pages tabs.
Not set up? No problem — I'll note it, and setting it up is one of the easy fixes.
```

## Credits
Paid lookups follow the proxy branch of `../../../atoms/spend-gate/ATOM.md` (one probe with a yes, then a yes to a ceiling "up to N credits" labelled an estimate, stop at it, log every charge in `research/credits-log/<YYYY-MM>.md`). Never show your own sum as a price. What counts toward the ceiling: question lookups (questions × organic runs) + index checks (`site:` once site-wide + once per page checked). Page imports (`knowledge_import` import mode, only when the host cannot fetch pages) count too. The probe: the site-wide `site:` lookup ("May I run one paid Google lookup — it also tells us whether Google has your site indexed?"); before launch, the name-collision lookup.

## Re-runs
Diff only rows observed the same way both times (route and run count); a route change is reported as "method changed", not as movement.
