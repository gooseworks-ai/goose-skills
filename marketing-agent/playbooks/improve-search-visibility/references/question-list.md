# Building the question set

Load at step 1 (atom question-set). No approval is needed before the free pass runs.

## Where questions come from (most trusted first)
1. Search Console queries (if shared).
2. The words customers use: research-market's `research/market/voc-bank.md` and `research/market/demand.md` (how buyers search), reviews, support tickets, sales calls; `knowledge_search` with `source_types: ["document", "evidence"]` (query "Voice-of-customer bank …") for "customer questions, objections, words customers use".
3. The brand brain's audience, pains and use cases; the product catalogue.
4. Google autocomplete and "People also ask" seen during the check.
5. Reddit and forum thread titles in the category.
6. Competitors' "vs", "alternatives" and pricing pages.
7. App-store search suggestions (apps).

## Two forms per question
- **AI form:** conversational, with the buyer's real constraints ("best moisturizer for sensitive skin that won't pill under makeup, under $40"). Answer engines split one prompt into several searches; the constraints decide which brands survive.
- **Google form:** the short query ("moisturizer for sensitive skin").
Never put the brand's name in a non-brand question.

## Mix (first run 12–15; grow to 25–40)
| Stage | Share | Pattern |
|---|---|---|
| Category discovery | ~30% | "best X for Y", "top X for [segment]" |
| Problem-led | ~20% | "how do I stop [pain]", "why does [symptom]" |
| Comparison / alternatives | ~15–20% | "A vs B", "alternatives to [leader]" |
| Price / purchase | ~10% | "how much does X cost", "is X worth it" |
| Brand / trust (accuracy) | ~15–20%, always 3–6 | "what is [brand]", "[brand] pricing", "is [brand] legit", "[brand] reviews", "does [brand] ship to [country]" |
| Local | when physical | "[service] near me", "[service] in [city] open Sunday" |

**Brand names that are common words** ("Personal Day", "Notion", "Halo"): every brand question carries the category ("Personal Day skincare"), and the namesake is confirmed with the human, so brand rows never read as false misses.

## Winnability (score non-brand questions 1–3 for value × winnability)
Scored provisionally before the check (some signals only the check reveals) and re-scored after it; tell the human which battles changed.
Winnable when: the brand has or can make a page that answers it directly; today's answers name brands of a similar size, not only giants; the cited sources are ones the brand can influence (own site, review platforms it is on, comparison content); the brand's real difference is the deciding factor; it is not a health or money question owned by institutions. Keep the top by value × winnability; pick the 3–5 must-wins yourself; the human can change them after the first message. Brand questions are about accuracy, not ranking — always kept.

## Examples (fictional)
**Halden — DTC skincare, fragrance-free barrier cream, $34:** best moisturizer for sensitive skin that doesn't sting *(discovery, must-win)* · best ceramide cream under $40 *(discovery/price)* · moisturizer that won't pill under sunscreen *(problem)* · how to repair a damaged skin barrier *(problem; winnable with an expert-reviewed guide)* · why does my moisturizer burn *(problem; owned by dermatology sites — low winnability)* · Halden Barrier Cream vs [drugstore ceramide leader] *(comparison)* · cheaper alternatives to [premium barrier cream] *(alternatives)* · is Halden legit · Halden reviews · does Halden ship to Canada *(brand)*.

**Shiftwise — restaurant scheduling SaaS:** best scheduling software for restaurants *(must-win)* · scheduling app for a 20-person restaurant · how to stop staff no-shows *(problem)* · 7shifts alternatives *(must-win)* · Shiftwise vs 7shifts · scheduling software that integrates with Toast *(highly winnable)* · restaurant scheduling software cost per location *(price)* · free restaurant scheduling software *(low value)* · what is Shiftwise · Shiftwise pricing *(brand)*.

## The saved set (`search/questions.md`)
```
version: 1 · agreed: [date] by [human] · country: US · language: en · city: — 
who ships: [you / developer / agency] · pages a month: [n] · may name competitors: [yes/no, names never to touch] · locations: [list or —]
engines: chatgpt-search, google-organic, google-aio, google-ai-mode[, perplexity]
runs·route: chatgpt 3 (must-wins 5) browser | 2 pasted · aio 2 browser | 1 pasted · ai-mode 2 browser | 1 pasted · organic 1 lookup
| id | AI form | Google form | stage | value | winnable | must-win | why |
```
Changing the set bumps the version; diffs compare only questions present in both versions.
