---
name: make-content-content-brief
description: >-
  Writes a one-page content brief before any draft: audience, intent, the one arguable point, what top
  results already say and what this piece adds, an outline, a proof inventory with gaps marked, voice,
  CTA and banned words, checked against six gates. Use alone when you already have the topic, format,
  audience and destination and want only the brief; otherwise run make-content.
version: 0.1.0
---

# Content brief

No fresh draft starts without a brief. Write it, check it against the six gates below, and save it before drafting.

## Read first (all free)

- `gooseworks:brand_read` `sections: ["summary","kit","learnings"]`, lean (it returns every `must`/`dont` fact; read learnings in full only for `do`/`insight` rules): the voice, audience, value props, the kit's reference examples and templates, and the learnings (`must` / `do` / `dont`). Read the kit in full (alone: `sections: ["kit"]`, `detail: "full"`) only when you need its example lines or images.
- `gooseworks:knowledge_search` with the topic as the query, across all source types. This returns past creatives and feedback, saved rules, customer evidence and documents. Then work out which brand claims are usable through the shared claims gate (the `claims-gate` skill, `../claims-gate/SKILL.md`): signed-off claims, the scoped sign-off this run, or plain product facts only. Proof slots may only hold usable claims and the sourced facts in `../make-content/references/fact-rules.md`.
- The voice-of-customer bank (research-audience writes it): `gooseworks:file_read` `research/audience/voc-bank.md` (brand coworker scope). If it is not there, use `gooseworks:knowledge_search` `source_types: ["document","evidence"]`, query "voice-of-customer bank <topic>". It gives buyer phrases, objections and questions on this topic, each with its source and date.
- When the ask comes from a sibling:
  - **improve-search-visibility page brief:** `gooseworks:file_read` `search/briefs/<page-slug>.md`. It gives the cluster, intent, the questions the page must answer, the facts it must state, the claims allowed and the competitor-name rules. Put the brief's path on the draft's first line.
  - **plan-campaign asset list:** `gooseworks:campaign_read` `campaign_id` gives the brief, the concepts and the asset row.
  - **analyze-performance "what to make next":** the latest `reports/performance/<date>.md` (`gooseworks:file_list` `reports/performance/`), its "what to make next" section.
- When it is a comparison: `gooseworks:competitor_read` for dated competitor facts.
- **Top search results** (search-intent pieces only, when no page brief already carries them): use the host's own web search when it has one (free). Otherwise make one `/v1/google/search` read through the proxy (the `marketing-data-access` skill, `../marketing-data-access/SKILL.md`), under the spend gate (the `spend-gate` skill (`../spend-gate/SKILL.md`), proxy branch: a probe with the yes asked in SKILL.md's #5 message). Open the top 3 pieces and log URL and date; with no fetch, judge from titles and snippets and label it "snippets only". This feeds "information gain".
- **Public sources.** When your host has web search or fetch, open 2–5 primary sources for the world facts the outline needs (platform help docs, standards bodies, original studies, official statistics). Log each URL and the date opened in the proof inventory. Never cite from memory. With no web tool, list them in "what unlocks this draft".
- `gooseworks:file_list` `content/` in the brand workspace: existing briefs and drafts, to avoid duplicating a piece and to find internal-link candidates.

## The brief (fill every line; use `../make-content/references/formats.md` for the format's anatomy)

```
Brief — <working title>   (+2 alternative titles)
Format · length · where it publishes · by when
Audience: <one role/segment>, their situation, what they already know
Intent: learn | do | decide | trust | be convinced | news
The one argument: <one sentence a reasonable person could disagree with>
Information gain: what the top results and competitor pieces in hand say (page brief, the search read above, research-competitors files) → what ours adds | "not checked: you declined the search read"
Outline (H2s written as claims): …
Proof inventory:
  - <proof> — "Claims you may use" fact | product fact: <field> | VoC "<quote>" (<source>, <date>) | interview line | <public URL opened>
  - [PROOF NEEDED: <what>, for H2 n]
Reader questions to answer word for word: …
POV needed: yes/no — have it: yes (source) / no → interview (`../make-content/references/point-of-view.md`)
Voice: brand | <person> (brand/voices/<handle>.md)
CTA: <action> → <destination the human gave>
House style: spelling (US/UK), heading case, reading level
Banned words: <from voice guide + learnings>
Sources this brief stands on: <list>
Live data: <what the page brief supplied> | none available (no search/AI-answer data tool today)
```

## Gates before drafting

1. **Thesis.** The one argument is arguable. "Skincare matters" fails. "Most 'non-comedogenic' labels mean nothing, so check the ingredient list instead" passes.
2. **Proof.** At least one real proof unit per H2, or an honest `[PROOF NEEDED]` the human can see. Never a plausible stand-in. If fewer than half the H2s have real proof, the draft stops here (SKILL.md step 4, proof gate). Sections that only give instructions and make no factual claim need no proof. Interview lines from the human count as proof.
3. **POV.** If needed and missing, run the interview before drafting, or switch to the no-POV format and say so.
4. **Inputs.** Missing format, audience, destination or deadline → ask once, all together. Never guess them.
5. **Length gate.** For long-form (over ~1,200 words, guides, reports) and every case study, show the brief and outline and wait for the human's yes before drafting.
6. **Audience fit.** Check the piece against every audience in the kit. A piece that insults one of them (e.g. "us vs hiring an agency" when agencies are a listed audience) is flagged to the human before drafting, with a reframe.

## Save

`gooseworks:file_write` → `content/briefs/<YYYY-MM-DD>-<slug>.md` in the brand workspace (scope: `../make-content/references/point-of-view.md`, Workspace scope). The draft links back to it.
