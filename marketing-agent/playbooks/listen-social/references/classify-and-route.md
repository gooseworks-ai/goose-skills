# Classify and route

Load at steps 4–5. Risk first: before classifying anything else, pull out every safety, health, legal, claims or misinformation item and triage it (`crisis-triage.md`).

## Sentiment classes

| Class | Use when | Watch out |
|---|---|---|
| positive | clear praise or recommendation | "obsessed 😭" is positive; read the words, not the emoji |
| negative | complaint, warning, disappointment | separate product issue from service issue |
| mixed | praise and complaint together ("he loves it but the box arrived crushed") | do not round to positive |
| neutral-informational | mentions without a view (a haul, a list, news) | most brand mentions are this |
| question | asks something ("is it OK for a dog with chicken allergies?") | questions are sales and content signals |
| unclear-sarcasm | tone cannot be resolved from the text and thread | never guess; never infer from emoji alone |

**Who is speaking** (tag every item, before counting):
- **independent** — counts as a mention.
- **owned** — the brand's accounts, its founder and execs: never a mention (their comment sections are mined).
- **affiliated** — paid advisers and ambassadors, gifted or PR posts ("thanks for sending"), affiliate and shop links, retailers, fan accounts reposting the founder's promotion: shown in the report, never counted as independent mentions or outliers; gifted posts are flagged.
- A famous founder's name counts only with a topic word ("<founder> skincare"); say the count is topic-filtered.

**Undated items** (tag pages and discover pages often hide dates): listed as "date unknown", triaged for risk, never counted and never in week-over-week change.

Report counts with n. No percentages below about n=30. Net sentiment is "positive n vs negative n", never a score. Every theme needs at least two verbatim quotes with links; a theme with fewer is a signal, marked low confidence.

## Routes (exactly one per item; a risk item may also carry `support` as a second tag)

| Route | What it means | Where it goes |
|---|---|---|
| reply publicly | a short public answer helps the poster and readers | reply queue |
| take private | needs order details, personal data, or a calmer channel | reply queue (public "DM us" line + private draft) |
| stay silent | replying would amplify, look defensive, or break community rules | report, with the reason |
| route to support | order, shipping, refund, product problem | report "routed out" list, for the human to pass to support; an adverse reaction is a risk item with `support` as its second tag, and is also logged for the brand's adverse-event process |
| sales signal | "anyone tried X?", "switching from Y", "recommend a…" | report; reply draft only where the community allows brands |
| UGC rights request | someone posted about the brand unprompted, good enough to reuse | report; "do not reuse until rights are granted in writing" |
| creator candidate | a creator whose content fits — a creator-partnership candidate | report, and the outlier save if it qualifies |
| competitor complaint | a rival's customer is unhappy — a poaching opportunity | report; draft only with approved facts and never knocking the rival |
| misinformation | a false statement about the brand or its product | report; correction draft with approved facts and a source |
| press or influencer pickup | coverage or a high-reach creator mention | report; thank-you draft if appropriate |
| employee post | staff talking about the company | report; the human decides |
| legal, safety or claims risk | health, legal, regulatory, discrimination, data | crisis triage (S1–S2), escalation note |

## Themes

- Name themes in the posters' words ("box arrives crushed"), not marketer words.
- Each theme: n this week, n last week (or "baseline"), direction, two quotes with links, the so-what and who acts (product page FAQ → the founder; a content brief; a support script → the human; an ad hook, via the customer-quote bank).
- Quotes from customers worth keeping as buyer language are tagged `VoC` with link and date, so research-market can pick them up on its next refresh.

## Share of voice

Only when brand and rival counts come from the same method, platforms and caps (both from the free pass's same searches, or both from paid reads): brand mentions vs each competitor's, as counts with n and the line "on covered surfaces only". Otherwise write "not comparable this week (different sources)". Never as a market-share claim.

## Privacy

Store the handle and the link, never extra personal details. Do not profile private individuals. Do not save or quote posts by apparent minors.
