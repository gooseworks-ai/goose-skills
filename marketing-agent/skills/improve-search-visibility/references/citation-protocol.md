# Citation check protocol

Load at step 1 (free pass) and step 3 (paid top-up), through the atom citation-check.

## Surfaces and how each is observed
| Surface | Default observation route today | Runs |
|---|---|---|
| ChatGPT with search | free: host browser (private window, not signed in); else the human's paste set | 1 per question, 3 for the 3–5 key questions (2 pasted) |
| Google AI Overview | free: host browser, when Google lets it in; else paste set | 1 (1 pasted) |
| Google AI Mode (`google.com/search?udm=50`) | free: host browser, when Google lets it in; else paste set | 1 (1 pasted) |
| Who ranks for each question | free: the host's web search, labelled "web search" | 1 |
| Google's exact page one | paid top-up only: `gooseworks:data_call_provider` provider `scrapecreators`, path `/v1/google/search`, query + `region` (organic results only — no AI Overview, no People-also-ask, no local pack) | 1 |
| Perplexity / Gemini / Copilot | only when the buyer uses them; host browser or human | 3 |

Every report row says how it was observed: **looked up through GooseWorks** (organic), **agent browser**, **run by you**. Never present an organic read as an AI-answer read. Never call an AI model's API with a local key to stand in for the consumer apps (no vendor keys, ever).

**Wait for the answer to finish.** ChatGPT streams: re-read the page until the text stops changing and the sources show (up to about 60 seconds); an answer that never finishes is retried once, then marked "didn't finish" — never scored as "not named". If ChatGPT asks to log in for one question, retry it once in a fresh private window, then mark it.

**What signed-out checks can't show.** A signed-out answer is not what a signed-in buyer sees: memory, past chats, the paid model and personalisation all change answers. Say so in the report's "couldn't check" section, every time. Other engines: check Perplexity signed out when the buyers are technical or AI-native; Claude, Gemini and Copilot need sign-in for their consumer apps, so name them as not checked rather than borrowing anyone's account.

**Where the browser really is.** Record the browser's real location (an answer showing local prices or a local-language result gives it away). If it isn't the target market, label those rows ("read from India, region set to US") — Google rows then count as a first look, and the paid top-up (which sets the region) is the way to the exact read; ChatGPT's location can't be set, so say so.

**Speed.** Open the question straight in the address bar (`https://chatgpt.com/?q=<question>&hints=search`) and run several tabs side by side; the free pass is about 20–40 page reads.

**Agent browser rules:** a private window for Google; chatgpt.com in a private window, not signed in — a Temporary Chat only if ChatGPT forces sign-in and never in the founder's account; record which was used. On any CAPTCHA or bot challenge, stop and hand that surface to the human; never solve it.

**Minimum paste set (offered in the first message only when the host has no browser or Google blocked it; the human runs them):** 5 questions — up to 4 key questions plus at least one brand question ("what is [brand] [category]" or "is [brand] legit"; pre-launch: the name-collision question); ChatGPT twice, AI Overview and AI Mode once each — 20 pastes. For the "AI says something false" entry, the paste set is the brand questions (3–6) instead of the key questions. Give it as plain steps, no jargon:
```
For each question below:
1. Open chatgpt.com in a private window without signing in (use a Temporary Chat only if it insists on sign-in). Paste the question, wait for the answer, click "Sources" if shown (else write "no sources"), then copy everything back here under a line like:  Question 3 · ChatGPT · try 2
2. In the same private window, search Google for the short version. If an "AI Overview" box shows, click "Show more" and copy it with its links under:  Question 3 · AI Overview  (if none shows, write "none").
3. Open google.com/search?udm=50, paste the full question, copy the answer and its links under:  Question 3 · AI Mode
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
Cannot: share of all users' answers; how often anyone asks the question in AI apps — only vendor prompt-volume estimates exist; use one only when the brand has that account, label it an estimate, never invent one; a "rank in ChatGPT"; traffic or revenue impact; that a fix caused a later change from one re-run (variance is larger than most effects; call a trend after 2–3 runs).
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
The paid top-up follows the proxy branch of the `spend-gate` skill (`../../spend-gate/SKILL.md`): **one yes** to a ceiling "up to N credits", labelled an estimate, asked in the first message after the free result — never before it, never twice. N comes from the credits log; with no history, say what the top-up adds ("Google's exact page one for your 14 questions, plus whether Google has your site indexed — about 15 lookups") and let the human name the ceiling; the first lookup (the site-wide `site:` check) is the probe inside that same yes. Stop at the ceiling; log every charge in `research/credits-log/<YYYY-MM>.md`; report credits charged in the gate's words. Never call the price-check tool for these lookups (it prices only media generation, not search lookups). Never show your own sum as a price. Page imports (`knowledge_import` import mode, only when the host cannot fetch pages) fit inside the same ceiling.

## Re-runs
Diff only rows observed the same way both times (route and run count); a route change is reported as "method changed", not as movement.
