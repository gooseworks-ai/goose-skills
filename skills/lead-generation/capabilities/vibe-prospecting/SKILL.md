---
name: vibe-prospecting
description: >
  Build B2B prospect and account lists, enrich companies and contacts, and
  research buying signals with the Vibe Prospecting remote data connector
  (Explorium). Use when the user asks to find prospects, build a lead list,
  enrich firmographics or contacts, or run Explorium-backed outbound research.
tags: [lead-generation, sales, research]
---

# Vibe Prospecting

Turn a natural-language ICP brief into a previewable prospect or account list, then enrich and export once the audience looks right.

This skill expects the Vibe Prospecting remote connector to be available in the agent session (product site: vibeprospecting.ai). Prefer the hosted connector over inventing fake rows.

## When to use

- Finding companies or people that match an ICP (titles, seniority, industry, size, geography, tech stack, growth events)
- Enriching an existing account or contact table with firmographics, technographics, or reachability fields
- Preparing a short account brief before outbound or a sales call

## Non-negotiables

1. **Sample first.** Always show a small preview (about five to ten rows) and restate the audience filters before any full export.
2. **No invented data.** If the connector is missing or a field is empty, say so; do not fabricate emails, phones, or firmographics.
3. **Email before phone.** Default contact enrichment to email-oriented fields. Add phone only when the user explicitly needs dialer-ready numbers.
4. **No secrets in the skill body.** Authentication is handled by the connector (browser sign-in). Never ask the user to paste a long-lived provider key into chat for this skill.
5. **Honest gaps.** Call out missing titles, domains, or match counts instead of silently widening filters.

## Decision flow

### 1. Intake

Collect or infer:

- List type: people (prospects) vs companies (accounts)
- Titles and seniority (combine both when filtering people)
- Industry, employee band, geography
- Optional tech stack, funding or hiring events, and requested row count (default twenty-five)

### 2. Preview

Resolve fuzzy industry or title phrases to the connector's canonical values when discovery tools exist. Fetch a small sample. Show the user the translated filters and the sample table. Adjust before continuing.

### 3. Export

After approval, materialize the requested count. Restate the locked audience definition in the reply so the user can reuse it.

### 4. Enrich (optional)

For people: email and profile fields by default; phone only on request. For companies: firmographics, tech stack, funding, and growth signals as requested. Attach a short note on fill rate.

### 5. Handoff

Deliver a table artifact the user can copy into a CRM, sequencer, or sheet. Suggest next skills for outreach copy or scoring when relevant.

## Troubleshooting

- **Connector not connected.** Tell the user to add the Vibe Prospecting remote MCP from vibeprospecting.ai (or explorium.ai docs), restart the agent session, and retry. Do not proceed with synthetic leads.
- **Audience too broad or empty.** Tighten title plus seniority, or widen employee band or geography one axis at a time; re-preview after each change.
- **Low email fill.** Report the fill rate; offer a second enrichment pass only for rows the user prioritizes.

## Example outcomes

- "Twenty-five VP-level sales leaders at Series B SaaS firms in the United States, fifty to two hundred employees — preview then CSV."
- "Enrich this account CSV with industry, size, and primary tech stack."
- "Shortlist five decision-makers at each of these ten domains for outbound."
