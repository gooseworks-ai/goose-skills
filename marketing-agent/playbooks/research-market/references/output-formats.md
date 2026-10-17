# Output formats

Load at steps 3–9. Every file starts with header lines downstream playbooks parse.

Brand-document titles and tags (save-to-brain): `Market read — <Brand> — <D>` (`research-market`, `market-read`, keep-history) · `Voice-of-customer bank — <Brand> — <D>` (`research-market`, `voc-bank`) · `Buyer segments — <Brand> — <D>` (`research-market`, `buyer-segments`) · `Demand read — <Brand> — <D>` (`research-market`, `demand-read`) — the last three supersede.

**The examples are for a fictional fresh dog-food brand, on purpose — never copy their segments, themes or words.** Every segment name, trait and theme in real output must trace to this run's own `T-` and `V-` ids.

## voc-bank.jsonl (the filterable copy)

One JSON object per line, appended as rows are mined (step 3). Readers that need to filter (makers looking for `vividness: 3`, `type: objection`, a segment, `contains_claim: false`) read this file.

```json
{"id":"V-017","verbatim":"he scratches all night and the vet just says try another food","about":"category","source_class":"public","platform":"Reddit r/dogs","url":"<url>","posted":"2026-03","retrieved":"2026-10-16","stars":null,"verified":null,"incentivised":false,"self_descriptor":"two rescues, one with allergies","population":"buyer","type":["pain","alternative tried"],"force":"push","awareness":"problem-aware","job":"J1","theme":"T-02","segment":"S1","vividness":3,"contains_claim":false,"personal_attribute":false,"testimonial_ok":false,"status":"live"}
```

## voc-bank.md (the readable copy, imported as a document)

Self-describing blocks, so a search snippet carries its own meaning without a table header.

```markdown
Do this first, because… <e.g. "brief hooks from the 5 vividness-3 rows of T-02 — it is the pain most buyers name">
# Voice-of-customer bank — <brand>
Last updated: <YYYY-MM-DD> · Run: <first | refresh since YYYY-MM-DD> · Cold start: <yes | no>
Read: <n> items from <k> sources (<date range>) · Kept: <n> quotes · Star mix read: 1★ a / 2★ b / 3★ c / 4★ d / 5★ e
About: brand <n> · prospect <n> · competitor <n> · category <n> · Source: public <n> · private <n>
Gaps: <sources not read and why>
Filterable copy: research/market/voc-bank.jsonl

## Themes
T-02 · tried-every-food fatigue · pain + alternative · 14 quotes · 13 authors · 4 sources (Reddit, competitor site reviews, TikTok comments, own reviews) · stars 1–4 · brand 3 / competitor 7 / category 4 · established · new this run · reps V-017, V-031, V-044

## Quotes
V-017 · pain, alternative tried · S1 · T-02 · vividness 3 · no claim · personal attribute: no · incentivised: no · not a testimonial · category · public · live · Reddit r/dogs · 2026-03 · retrieved 2026-10-16 · <url>
"he scratches all night and the vet just says try another food" — two rescues, one with allergies

V-031 · …

## For the founder (product issues, not messaging)
- <issue> — n — example ids
```

Rules: ids are stable forever; a row whose link dies becomes `status: retired (link dead, <date>)`, never deleted. `personal_attribute: true` rows are buyer language only — makers must rephrase so an ad never asserts or implies a condition about the viewer.

## personas.md (segments)

```markdown
Do this first, because… <lead with S1 and its job, saying <message>, because <evidence>>
# Buyer segments — <brand>
Last updated: <date> · Built from voc-bank as of <date> · Confidence key: high (5+ quotes, 2+ sources) / medium / low / unknown

## Priority
| rank | segment | evidence share | pain intensity | willingness-to-pay signal | reachability | product fit | why this rank |
|---|---|---|---|---|---|---|---|
| 1 (primary) | S1 itchy-dog owners | 41% of brand rows (n=18) | high — vet bills, sleepless nights (V-017, V-031) | "would pay more if he stopped scratching" ×6 | r/dogs, allergy-dog creators (links) | the product solves the job directly | most evidence, sharpest pain, clear pay signal |
| 2 | S2 … | … | … | … | … | … | … |

Primary segment: S1 — job J1 "stop the scratching without another vet bill". Lead with: <message direction in buyer words>. Pre-empt: <top objection>.

## S1 — Owner of an itchy dog who has tried every food
Who: self-described multi-dog households, mostly rescues (n=18, medium) · Roles: buyer = payer; user = the dog
Job (J1): "stop the scratching without another vet bill"
Triggers: third vet visit (V-031), a new allergy diagnosis (V-052)
Forces: push V-017 · pull V-052 · anxiety "switching will upset his stomach" (9 quotes) · habit: the supermarket bag is easier (V-060)
Objections → what resolves them: stomach upset → gradual-switch guidance; price → cost per day vs vet bills (only with approved claims)
Words they use: "itchy", "picky", "kibble guilt" · Words they don't: "nutrient-dense", "premium"
Alternatives: prescription kibble, raw feeding, home cooking (DIY)
Where they hang out: <named communities and creators, each with an evidence link — else "unknown">
Willingness to pay: "would pay more if he stopped scratching" (6 quotes)
Awareness mix: mostly problem- and solution-aware
Unknowns: age split, share buying as a gift — ask
Message implication: lead with "<the job in their words>"; pre-empt "switching will upset his stomach" (9 quotes) with how the switch works — no claims beyond approved ones.
Evidence: V-017, V-031, V-044, V-052, …

## S2 — <next segment, from this run's themes>
## Anti-persona — <who buys and is unhappy, with ids> · Keep out of targeting and lookalikes.
```

B2B variant: segment = role × company size; add "Buying committee: champion / economic buyer / user / blocker — what each needs to hear", "Deal triggers" (new hire, funding, failed tool, audit) and "Switching costs".

## demand.md

```markdown
Do this first, because… <e.g. "plan the main push for <months>, because <evidence, labelled>" — or "don't plan around seasonality yet: it is unknown">
# Demand read — <brand / category>
Last updated: <date>
Direction: <growing | flat | shrinking | unknown> — <evidence> — <measured | proxy | prior> — <confidence>
Seasonality: <months / moments> — <evidence or "known pattern, not measured">
How buyers search (their words): "<phrase>" (source), …
Words buyers use that the brand doesn't: … · and vice versa: …
Market sophistication: stage <1–5> — <one line why>
Awareness mix: <share problem-aware / solution-aware / product-aware, from tagged rows>
Unknowns and how to close them: <e.g. "export Search Console queries", "Google Ads keyword planner export">
```

## Competitors and alternatives (section of the read)

| name | type (direct / indirect / DIY / do-nothing / professional) | mentions (quote ids) | switch direction (to us / from us / both) | price buyers quote | tracked? | recommend tracking? | source if a candidate |
|---|---|---|---|---|---|---|---|

## "For you" — the line that closes every finding

On each top theme, segment, alternative and "You vs them" row (skipped for facts-only asks):
- `For you: fits — <why, from our facts> → make: <format> · hook: <direction, in buyer words> · product: <ours> · claim: "<approved line>" (or "<line>" — needs your sign-off; or "you'd need proof of <X> first") · who: <static ads / video ads / organic posts / creators / landing page / email / the founder / the campaign plan>`
- `For you: doesn't fit — <why, from our facts>`
Plain words for "who", never a playbook or tool name; the report recommends and never makes the asset. Buyers' words outweigh what rivals do: when every rival says the same thing, that is a reason to weigh something else. With an empty brand brain: "I can't tell what fits you yet — I can learn your brand first."

## You vs them (section of the read)

| | What buyers say (theme, n) | Evidence (quote ids, links) | For you |
|---|---|---|---|
| Ahead — say it louder | <praise for us that buyers don't give the alternatives> | | |
| Behind | <complaints about us, or praise the alternatives get and we don't> | | |
| Everyone sounds the same | <what every option promises and buyers shrug at> | | <what to say instead, in buyer words> |

## <YYYY-MM-DD>-read.md (the report)

1. **First line, always:** "Do this first, because…" — lead with segment <S1> and its job "<job>", saying <what to lead with>, because <the evidence in one clause>. In a cold start: "Do this first, because… only <n> of the <N> items I read speak first-hand about your own buyers: run the interview kit with 5–8 recent buyers, starting with <provisional S1>." Segments are then marked provisional. Under it: `Next refresh: <date> or on <trigger>`.
2. **What I read:** news checked, sources and n read per source (own · rivals' · category), date range, star mix, link re-check result, the founder's stated belief (quoted, or "none on record"), and a **couldn't read** list (source — why — what it would add). Credits spent only if a top-up ran.
3. **What's new or surprising** — at least one finding that contradicts or extends the stated belief.
4. **Segments at a glance** — the priority table, one line each, the anti-persona, each segment's "For you".
5. **Top themes** — 5–8, with counts, one quote each and a "For you" line.
6. **You vs them** — the table above.
7. **Competitors and alternatives** — the table above, with "For you" where a switch or a gap is actionable.
8. **Demand read** — the lines above.
9. **For the founder** — product issues found.
10. **Recognition check** — the founder's answers, added verbatim after they reply.
11. **What was saved where** — paths, document titles, the audience proposal waiting for acceptance.
Never name a playbook, our own tools or our data vendors to the marketer; review sites and communities are sources and are named.

When the brand's own facts contradict each other (two prices, two customer counts), list them under "For the founder" and use none of them in a "For you" claim.
