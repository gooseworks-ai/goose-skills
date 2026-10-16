# Mining method — how a senior researcher reads buyer evidence

Load at steps 3, 4, 7 and 8.

## Sampling

- **Batches of 20–25 per source, at most ~6 batches per source.** After each batch, list any theme not seen before. A theme counts as new only if it needs its own theme row and has a quote unlike every existing representative quote — a rewording of a known pain is not new. Stop the source when two batches in a row add none (saturation) or at the cap. Typical totals where volume exists: 100–300 read, 30–60 kept.
- **Write as you go.** After each batch add the kept rows to `research/market/voc-bank.jsonl` in the workspace — `file_write` overwrites, so read it, add the rows, write the whole file back (on shell hosts a local scratch file is fine until the save step). Quotes are copied from the source text, never retyped from memory; later steps read the file, not your recollection.
- **Synced evidence** (reviews the server imported, read back through `knowledge_search`) comes as ranked snippets, not full lists: run star- and theme-specific queries, keep only text that is verbatim in the snippet, and label those rows `via synced evidence (snippet)`.
- **Stratify by rating.** 1★ gives failures and objections; 2–3★ give honest trade-offs (often the most useful); 4★ gives "good but"; 5★ gives outcome and identity language. Never read only page one — review widgets lead with 5★. Sort by lowest and by newest too.
- **Recency.** Weight the last 12–18 months. Keep older rows only for themes still alive, and flag rows older than 24 months.
- **Verified and incentivised.** Mark verified purchase. Mark incentivised ("received free", Vine, "in exchange for an honest review", gifted creator posts) and down-weight them; never let them carry a theme alone.
- **Duplicates.** Syndicated reviews (the same text on several retailers) count once. The same person across platforms counts once.
- **Count what you read.** Report n read per source and the star mix, not only what you kept.

## Quote integrity

- Verbatim only. Keep typos and slang. Mark cuts with `[...]`. Never stitch two sentences from different places.
- Every row: link, platform, posted date (or "undated"), retrieved date, rating if any. Private rows cite `private:<workspace path or document title>#<date>`. Comments whose own link does not open on its own are cited as "comment on <post url>".
- Strip reviewer names and handles from the quote record of private individuals; keep self-descriptors they wrote ("two dogs, one picky eater", "ops lead at a 40-person agency"). Strip medication, diagnosis and other sensitive personal details from self-descriptors, and emails, phone numbers, order numbers and addresses from private quotes.
- **Population check.** Is the author a plausible buyer or user? Fans of a founder, candidates complaining about recruiters on a recruiting tool's thread, resellers and competitors' staff are not — drop them.
- `personal_attribute: yes` when the quote refers to health, a condition, finances, religion, ethnicity, sexuality or similar. Ad platforms forbid ads that assert or imply these about the viewer ("your ADHD brain"); makers must rephrase, never lift.
- A paraphrase is never stored as a quote. If a source cannot be quoted (an aggregate summary, an AI "what customers say" box), record it as context, not a row.
- `contains_claim: yes` on any outcome or efficacy statement ("cleared my skin in a week"). It is buyer language, never brand proof; downstream makers still need an approved claim.
- `testimonial_ok: no` by default. Using a reviewer's words as a named testimonial in an ad is a separate permission the human obtains.
- `about` (who the quote is about): `brand` (the brand's own customers), `prospect` (waitlist, trial users, lost deals), `competitor:<name>`, `category`. Competitor complaints are opportunity evidence, not traits of the brand's buyer.
- `source_class` (where it came from): `public` or `private` (pasted or exported by the user). Pasted competitor G2 reviews are `about: competitor:<name>`, `source_class: private` — they never count toward the brand's evidence floor.

## Tagging taxonomy (one primary type per row, secondary allowed)

| Type | What it captures | Example cue |
|---|---|---|
| pain | the problem in their words | "he scratches all night and the vet just says try another food" |
| desired outcome | what better looks like to them | "I just want him to finish a bowl without me hand-feeding" |
| trigger | why now | "third vet bill this year, $300 each time" |
| objection / anxiety | what nearly stopped them | "worried switching would upset his stomach" |
| alternative tried | what they used or compared | "tried the prescription kibble, then raw" |
| habit / inertia | why they stay put | "the big bag from the supermarket is just easier" |
| pre-purchase question | what they ask before buying | "is it OK for a dog with chicken allergies?" |
| specific praise | the concrete thing that delighted | "the portions come pre-measured, no more guessing" |
| surprise / aha | the unexpected benefit | "his coat got shiny, didn't expect that" |
| price / value | willingness-to-pay signals | "worth it for the size", "too pricey to repurchase" |
| switch | direction of switching | "switched from X" (to us) / "went back to X" (from us — churn evidence) |

Also tag:
- **JTBD force** — push (pain of now), pull (attraction of new), anxiety (fear of new), habit (comfort of now). Label it "inferred from text": there were no switch interviews.
- **Awareness** (Schwartz) — unaware, problem-aware, solution-aware, product-aware, most aware. Feeds hook choice downstream.
- **Job** — a short job statement the row serves: "when <situation>, I want to <motivation>, so I can <outcome>".
- **Population** — plausible buyer / user / not a buyer (dropped).
- **Vividness 1–3** — 3 = a line a copywriter would steal. Vividness is not frequency: a vivid one-off is hook material, not a theme.
- **Geography** for local businesses.

## Themes

- A theme is a pattern across rows, named in buyer language ("tried-every-food fatigue"), not marketer language ("efficacy concerns").
- **Established:** 3+ rows from 3+ distinct authors. If a single platform carries it, mark it "single source" and lower its confidence. **Signal:** fewer. Show signals; never present them as findings.
- Every theme row: id, name, type mix, count, sources, star range, about-whom split, 2–3 representative quote ids, new / growing / fading since last run.
- Product defects and bugs go to a separate "for the founder" list with counts — they matter, but they are product work, not messaging.

## Segments

- Start from themes, not demographics. A segment is a group whose job, trigger and objections differ enough that one message would not serve both.
- Roles: buyer, user, payer (and for B2B: champion, economic buyer, user, blocker). The parent buying for a teen, the gift buyer, the manager approving a tool are different people.
- **Anti-persona:** who buys and is unhappy (refund language, wrong expectations, misuse). Keep them out of targeting and lookalikes.
- Demographics read from reviews are weak; mark them low confidence. Ad targeting shows who a brand aims at, not who buys — never use it as evidence of the buyer.
- Overkill, skip: invented names and stock photos, empathy maps, full value-proposition canvases, TAM/SAM/SOM, Kano.

## Demand

GooseWorks has no search-interest or keyword-volume tool today. Use only these, each labelled:
- **Proxy — ad rhythm:** start dates of competitors' active ads (`ads_template_read` mode `competitor`): bursts before a season, rising counts quarter on quarter. Active ads only (ads that stopped are not in the sample), so low confidence; skip it under ~20 ads or where rivals barely run Meta ads (most B2B).
- **Proxy — conversation and purchase timing:** month distribution of reviews and community posts you already pulled.
- **Proxy — search phrasing:** search-suggestion endpoints and question titles on Reddit/YouTube; record the exact phrasings ("grain free dog food for itchy skin").
- **Category prior:** known seasonality for the category (back-to-school, winter dryness, Q4 gifting, January resolutions, tax season for finance) — always marked "known pattern, not measured".
- **Measured:** only when the user supplies their own data (Search Console, Google Ads keyword planner export, store sales by month).
- Direction (growing / flat / shrinking) without measured data is at best "proxy, low/medium confidence". Otherwise "unknown".
- **Market sophistication** (Schwartz 1–5) in one line: how claim-saturated the category's messaging is, read from competitor ads and buyer cynicism ("they all say that").

## Failure modes to check before handing over

- Any quote without a link (or private citation), or a link the re-check found dead → fix or retire.
- A persona trait with no quote id → evidence it or mark unknown.
- One platform carrying a whole theme → say so, lower confidence.
- Competitor complaints merged into the brand's buyer → split.
- All 5★ → re-sample.
- Seasonality with no label → label or remove.
- Nothing in the read surprises the founder → you mirrored their belief; look again at 1–3★ and at switch-away rows.
