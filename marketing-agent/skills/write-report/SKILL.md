---
name: write-report
description: >-
  Turns findings you already have into a report a marketer can read in 30 seconds. It has a short
  summary with key findings and how sure each one is, the first move, decisions needed, at most six
  next moves, what was not checked, and dated sources. It checks length and wording before handing
  over, then saves the report to the brand. Use alone when you already have the findings and their
  sources; otherwise run the playbook for the job (e.g. research-market, research-competitors,
  plan-campaign).
version: 0.1.1
---

# write-report

Every playbook that hands over research, a plan, a strategy or a report writes it through this atom.

## 1. Write for a human

**The 30-second test.** A marketer who reads only the top knows what you looked at, what you found and how sure you are, and what to do first — and can judge the move from the findings right above it. If not, rewrite the top.

**Shape, in this order:**
1. **Title**: what it is, for which brand, the date. Example: "GooseWorks — market research, 18 Oct 2026".
2. **In short**, **at most 150 words**, in this order:
   - **What we looked at:** one line — scope, sources, date, and the main limit on the evidence (one review site, one country's search results, no access to the ad account).
   - **2–3 numbered key findings**, each with its "so what" for this brand and how sure, in the body's own word: **confirmed** (two independent sources, or the brand's own data), **likely** (one good source or a clear pattern), **first look** (one sample, place or read; needs a re-check).
   - **So, do this first (because of 1 and 2):** the one move, who does it, by when, naming the findings it rests on. When they are only a first look, or the move needs something not yet confirmed, the first move closes that gap (confirm X, run the test, get the data).
   - Only when they apply, one line each: what changed since the last report; where a sibling report disagrees (below).
3. **Decisions for you**: a short dated box — each decision with your recommendation, the section it rests on ("see How they compare"), and the date it matters by, if any.
4. **The story**: context → what we found → what it means for you → what to do. Each section opens with its point in one sentence, then the evidence. Where a finding means nothing for this brand, say "nothing to do here" rather than invent a move.
5. **What to do**: **at most 6** numbered moves, each with who does it, what it needs, and how we will know it worked.
6. **What we're not doing, and why**: the tempting moves you decided against, one line each — where herd-following and over-reaction get stopped.
7. **What we couldn't check**: one line each, with why.
8. **Sources**: links, dated, at the end, plus one line on **source skew** ("Most buyer quotes come from Trustpilot, which over-represents complaints").

**Length:** the body (everything after "In short") stays under **3,000 words**. Cut repetition and detail no decision needs. An appendix may hold specialist tables; the report must work without it.

**Agree with the sibling reports, or say why not.** Before writing, read every same-brand report from the last 14 days whose job overlaps (market, competitors, audience, a campaign or social plan, outreach) — saved documents (`brain_search` where listed, else `knowledge_search`; local mode: `gooseworks-local/<brand-slug>/` instead) and the local `gooseworks-reports/<brand-slug>/` folder. Compare lead buyer, first move, positioning and prices. A different lead buyer or first move is named in "In short" (anything else, in the story) and settled: merge the two first moves, or say why this one wins.

**A worked example of the top:** [`example-top.md`](example-top.md), next to this file (a fictional brand — never reuse its names, numbers or findings). Read it before writing your first In short.

**Language:** plain words, short sentences, active voice; one idea per paragraph; bullets, tables for comparisons, **bold** on what matters. Every fact carries a date and a link, inline: "Loxo starts at $149/user/month ([pricing](https://…), 17 Oct)". A fact from a file the marketer gave (an export, a screenshot) links to that file in their folder under a readable name ("[your Shopify export, 6–12 Oct](<file>)"); the path sits only inside the link. In a hosted chat with an uploaded file, name the file and its date. Say how sure with the three words above — confirmed, likely, first look (anything weaker, "provisional" or "a guess", is a first look, with why) — the same word in "In short" as in the body; never scores or made-up percentages.

**Never in a report:** the banned words in §3; field dumps, JSON or raw lists of everything collected; hedging filler, empty headings. **One exception:** two or three outside tools the marketer must run themselves (an email finder, an email platform), named as examples, never an endorsement — the guide's rule ([the `marketing-guide` skill](../marketing-guide/SKILL.md) §3, "Talking to the marketer").

## 2. Deliver it so it opens

Do all that apply. Never leave a report only on the GooseWorks server.

1. **Host with files (Claude Code, Codex, Cursor):** write it as Markdown in the marketer's current folder at `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-<topic>.md`, give a clickable link, `[<title>](gooseworks-reports/…)`, and offer to open it. If the host can render a page or artifact, use that too.
   **Never overwrite a report:** suffix the local file, the brand copy's path and its title by save-to-brain's never-overwrite rule (the `save-to-brain` skill (`../save-to-brain/SKILL.md`) step 1).
2. **Hosted chat (Claude.ai, ChatGPT):** an artifact or document if the host can; otherwise the full report in the chat, with its headings, not a summary.
3. **With GooseWorks connected, always** save it to the brand through the `save-to-brain` skill (`../save-to-brain/SKILL.md`), then get a link with `gooseworks:file_url`: "Saved to your brand: [open](<link>)".
   **Local mode** (the marketing-guide §5): save-to-brain's local branch keeps the copy the next run reads; give the step 1 link and say "saved in this folder". Never call `gooseworks:file_url` and never say it is saved to the brand. Hosted chat without files: step 2, and say it isn't saved anywhere, so they should keep a copy.

In the chat, after delivering, at most 3 lines: the first move with the findings it rests on (a few words), the link, the decisions you need. Never re-paste the report as a summary.

## 3. Check before you hand it over

**A failed check blocks delivery.** Fix, re-check, then hand over. Never ship over budget or with a known miss, or with a note that it is over.

- **Banned words:** id-like codes (`A-07`, `R14`, `G1`, `T1`, `S1`, `D2`…), local or workspace paths shown as text (`research/market/…`, `*.md`, `*.json`, `gooseworks-reports/`; link targets are fine: web links, and the marketer's own files under a readable name), tool or skill names (`gooseworks:`, `brand_read`, `knowledge_search`, `research-market`, `playbook`, `atom`, `MCP`), model or vendor names (Claude, Sonnet, Opus, GPT, ScrapeCreators, fal, ElevenLabs — outside tools allowed by §1's one exception), process words ("I called", "per the checklist", "Step 4"), made-up precision ("confidence 0.7", "82% likely"). Scan the text and fix every hit.
- **Budget:** "In short" ≤ 150 words; body ≤ 3,000; ≤ 6 moves. Count with a tool or by hand, never estimate. Over → cut repetition, then detail no decision needs, then move tables to the appendix; count again.
- **Sections present:** In short (what we looked at, numbered findings, "So, do this first"), Decisions for you, What we're not doing, What we couldn't check, Sources with a source-skew line.
- **In short is never stronger than the body.** Each sentence carries the certainty word of the body passage it comes from: a body "likely" or "first look" is never an In short fact; "It is growing" needs a body that says confirmed. A first-look read (one browser, country, sample or day) says so ("first look, from one browser in India").
- **"Do this first" assumes nothing unconfirmed.** A move that needs an asset the brand hasn't confirmed — customers who will be named, a budget, data or access, a live offer, a person's time — becomes "confirm X" or moves to Decisions for you.
- **Every number in In short counts exactly what is claimed beside it.** "230 live ads" next to "paying to say it works inside our tool" is wrong when only 4 say that: write "4 of their 230 live ads say…". Re-check each against its source.
- **Siblings:** an overlapping same-brand report from the last 14 days was read, and a different lead buyer or first move is named and settled.

**Then re-read it as the marketer, for the first time:** does it pass the 30-second test, could a non-marketer follow it, does every recommendation trace to a dated source, does the link open?
