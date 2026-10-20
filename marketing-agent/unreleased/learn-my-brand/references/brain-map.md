# Brain map: where each piece of brand knowledge lives today

Load at steps 1 and 7. This is the write-back contract: for each of the 23 knowledge sections, where the brand brain keeps it today, how this playbook reads it, and how it writes a confirmed answer back. Tool names are the GooseWorks MCP's; the live schema is the truth for parameters. Snapshot of what the server exposes as of 2026-10-16.

## How a write is made

Field names, limits and encodings come from the live schema; this page only says which home each answer goes to. The save protocol itself (order, record versions, read-back) is `atoms/brain-write-back`.

- **The owner said it, or approved the exact text** → `gooseworks:brand_update` with `knowledge_intent: user_correction` and `user_statement` holding only words the owner (or the approver, or the person in the chat for facts they state) typed: their statement, or an explicit approval that stands on its own. Never your draft, research text or a bare "ok". A relayed approval keeps its provenance: "<name> via <user>, email of <date>: '<their words>'".
- **Found or inferred, not confirmed** → leave it unwritten, or `knowledge_intent: agent_proposal` with a `rationale`. A proposal stays pending until the owner accepts it in the GooseWorks app; siblings don't see it.
- **Rules** → learnings (`patch.facts`), through `../../../skills/save-learning/SKILL.md` (the only seam; it holds any interim handling of today's server): the server stores them as the user's. A lean `brand_read` returns every `must`/`dont`. One idea per fact, so each can be found, merged and retired (`atoms/brain-write-back` step 3).
- **Everything with no typed home** → the Brand record (below). Never a second copy of a typed field.

## The Brand record (the interim home)

`brand/records/<YYYY-MM-DD>-v<N>.md` in the brand coworker scope (`coworker_agent_id` from the `brand_read` list; no coworker → default workspace with paths prefixed `brands/<brand-slug>/`), imported as the brand document `Brand record — <Brand> — <YYYY-MM-DD> v<N>` through `../../../skills/save-to-brain/SKILL.md` (`versioned: supersede`). It holds what the brain has no typed field for: claims with variants and proof, the sign-off sheet, not-approved and retired claims, never-say, business facts, contradiction decisions, palette and fonts, unknowns. Format: `references/brand-record-template.md`.

- Each save is a new version built from the previous one read in full with `gooseworks:file_read` (search snippets would drop rows). save-to-brain deletes the older versions' documents after the new import is ready; deleted media drops out of search. The workspace files stay as history.
- The marker names the current version. When the record and the `Claims you may use —` facts disagree, the facts win; the record is proof detail.
- This is an interim home. `server-needs.md` asks for typed homes for claims, never-say rules, unknowns and business facts.

## How siblings read this

Through `../../../skills/claims-gate/SKILL.md` (the only claims contract; AGENTS §8) and the kit voice plus `../../../skills/voice-card/SKILL.md`. In short: the marker's status token decides (`signed-off` → the `Claims you may use —` facts; anything else → plain product facts, or the gate's scoped sign-off for the lines the job needs); every `dont` and `must` always applies; variants and proof come from the record the marker names, read in full. The real fonts and full palette are in that record too.

## The 23 sections

Status today: **typed** = a real field holds it; **rule** = held as learnings facts; **record** = only the brand record document holds it; **server** = the server researches and owns it, this playbook only reads and confirms.

| # | Section | Read from | Write a confirmed answer to | Status |
|---|---|---|---|---|
| 1 | The business and its goal (model, stage, the number marketing owns, deadline, budget committed vs movable, biggest blocker) | `brand_read` summary + onboarding (role, ad-spend band, goals) | company type → `patch.kit.brand_type`; `brand_update` `patch.onboarding` for role / ad-spend band / platforms / goals; everything else (goal number, deadline, budget, stage) → brand record | onboarding typed, rest record |
| 2 | What we sell (products, prices, policies, hero offer, standing discounts, loyalty/referral/subscription programmes, what it does not do) | `brand_read` products lean, then `product_ids` for full records | `patch.products` per product (offers with end dates, notes such as hero and what it does not do, `ad_eligibility` + `ad_eligibility_reason`). Offers and policies the brand states in copy (free shipping, returns, a discount) → one `Claims you may use` fact each with their end or review date; operating rules ("never discount below 20%") → `Policy:`; an email-lifecycle `Standing offer:` fact is retired or rewritten when the owner changes the offer. All also in the record | typed per product + rule |
| 3 | What sells and what we can afford (bestsellers, margins, AOV, repeat rate, LTV, the most we can pay per customer) | nothing | brand record | record |
| 4 | Where people find and buy us (site, marketplaces, app stores, stockists, locations, countries, languages, shipping) | summary, products' links, `sources` | brand record | record |
| 5 | Who we sell to and who we don't | kit `audience` (prose) | kit `audience` via `brand_update` `patch.kit` (siblings read the kit) | typed |
| 6 | What customers say | `knowledge_search` `source_types: ["evidence"]` | not written here; research-audience writes the voice-of-customer bank (`research/audience/voc-bank.md`). Review imports (`knowledge_sync`, paid) are offered, never run without a yes | server |
| 7 | Competitors and alternatives | `competitor_read` tracked + `view: suggestions` | `gooseworks:competitor_save` add for each rival or alternative the owner names (free; starts background research). Pre-revenue: ask what buyers would use instead, including nothing. Never remove one here (it deletes research; the owner confirms on the card) | typed |
| 8 | Search terms | nothing | not asked here; improve-search-visibility asks | unknown by design |
| 9 | Why people pick us (category, promise, differentiators, message pillars, objections, tagline, boilerplate) | kit `description`, `valueProps`, `tagline`, `messagingAngles`, `existingAds` | kit `description` and `value_props` (only approved claims); `patch.knowledge.positioning` (owner's own one-liner) and `.tagline` | typed |
| 10 | Our story and beliefs | kit `description`, About page via research | brand record (founder story, origin, beliefs, topics on and off limits) | record |
| 11 | How we sound | kit `voice` (prose), `tone`, `aesthetic`; owner-made learnings; voice cards in `brand/voices/` | kit `voice` holds the confirmed guide (personality, rules with pairs, terminology, flex, and the full list under "Banned:"); the record's Voice section repeats the banned list; one `Banned words —` fact (owner's words first); voice status → the marker; per-account or per-person style → `../../../skills/voice-card/SKILL.md` | typed + one rule |
| 12 | Our look and files | kit logos (+ `logoConfidence`), palette, `fonts`, `typography`, `referenceImages`, `productsNeedingImages`; `gooseworks:media_list` scope `brand` | primary and accent colour via `patch.kit`; logo files via `gooseworks:media_upload` (kind `logo`); the full palette and the real fonts → brand record (no writable field; server-needs #12) | typed in part (server-owned kit) |
| 13 | Claims and proof | kit `approvedClaims`, `proofPoints`, `creativeAxes`; `knowledge_search` `["claim"]` (all candidates) | **No tool writes or changes a claim.** One `Claims you may use —` fact per approved claim + the record (variants, proof, the not-approved list); the marker says everything else is not approved (see `atoms/brain-write-back`, `../../../skills/claims-gate/SKILL.md` §5) | rule + record; server-needs #1 |
| 14 | Rules we can't break (regulated category, platform rules, banned claim types, disclaimers, consent, the owner's never list, disclosure, trademarks) | learnings | one `Never say —` fact per line, tagged law, platform or owner; the full table with reasons in the record | rule + record |
| 15 | How we work together (who approves claims, voice and spend, what the agent may do alone, spend caps, who to call in a crisis) | nothing readable (the Operating Plan exists in the app but is not readable or writable here) | record: the claims and voice approver; spend approver, crisis contact and spend caps go to the unknowns ledger as "asked when you run ads / when something goes wrong" unless the owner volunteers them | record |
| 16 | Creators, partners, press | nothing | not asked here; work-with-creators asks | unknown by design |
| 17 | Accounts and tools | `brand_read` accounts; Meta connection via `meta_read` (not needed here) | brand record lists which tools exist and who owns them; never ask for passwords | record |
| 18 | How we count results | nothing | not asked here; analyze-performance agrees definitions once | unknown by design |
| 19 | This week and what's coming (focus, live promotions, launches, next big date, what not to promote) | nothing | brand record (next big date, current focus, anything not to promote and until when) | record |
| 20 | Our plan | `campaign_read` (plan-campaign writes it) | not written here | other playbook |
| 21 | What we still need to know | brand record unknowns ledger | brand record | record |
| 22 | Everything we've run | server records GooseWorks work and Meta history | not written here | server |
| 23 | What's working | learnings (`insight` facts) | not written here; analyze-performance writes learnings | other playbook |

## Rules every written fact follows

- **Provenance.** Every line in the brand record carries its source (told by owner / found on site / found in research / inferred), the date, and who confirmed it.
- **Public or not.** Mark anything internal, embargoed (with the date) or under NDA. Default for numbers like revenue, margin and budget: internal.
- **Scope.** Say what a fact applies to: the whole brand, one product, one audience, one market.
- **Unknown is a value.** A gap is written as unknown with the job it blocks and the assumption in use, never filled with a guess.
