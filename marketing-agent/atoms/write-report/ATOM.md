<!-- Hidden atom: loaded by playbooks, never listed. Owner: orchestrator. -->
# write-report

Every playbook that hands over research, a plan, a strategy or a report writes it through this atom. A person reads the result, often a busy founder, so it must read like a good marketer wrote it. The marketer must also be able to open it with one click.

## 1. Write for a human

**The 30-second test.** A busy founder who reads only the top section knows what you found and what to do. If not, rewrite the top.

**Shape, in this order:**
1. **Title**: what it is, for which brand, the date. Example: "GooseWorks — market research, 18 Oct 2026".
2. **In short**: 3–5 bullets, **at most 150 words**. The first is "Do this first:" with the one move and why. Then the biggest findings, each with its "so what". **No unverified claim here**: anything in "In short" is confirmed, or it moves down to the story with its doubt stated.
3. **Decisions for you**: a short dated box: the decisions the marketer needs to make, each with your recommendation, and the date by which it matters if there is one.
4. **The story**: the findings in an order that flows. Context → what we found → what it means for you → what to do. Each section opens with its point in one sentence, then the evidence. Where a finding means nothing for this brand, say "nothing to do here" rather than invent a move.
5. **What to do**: **at most 6** numbered moves, each with who does it, what it needs, and how we will know it worked.
6. **What we're not doing, and why**: the tempting moves you decided against, one line each. This is where herd-following and over-reaction get stopped.
7. **What we couldn't check**: plain list, one line each, with why.
8. **Sources**: links, dated, at the end. Add one line on **source skew**, e.g. "Most buyer quotes come from Trustpilot, which over-represents complaints."

**Length budget:** the body (everything after "In short") stays under **3,000 words**. Cut repetition and detail that no decision needs. An appendix may hold tables a specialist wants, but the report must work without it.

**Agree with the sibling reports, or say why not.** Before writing, read the brand's latest market, audience and competitor reports (and any plan). Where you disagree with one (a different lead buyer, a different first move), say so and why, in one line.

**Language:**
- Plain words, short sentences, active voice. If a simpler word works, use it.
- One idea per paragraph. Never a wall of text.
- Use bullets, tables for comparisons, and **bold** on what matters.
- Every fact carries a date and a link, inline: "Loxo starts at $149/user/month ([pricing](https://…), 17 Oct)".
- Say how sure you are in words: "confirmed", "likely", "a guess, because…". Never as scores or percentages you made up.

**Never in a report:**
- Internal ids, codes or labels (A-07, R14, G1, T1, S1), file paths, tool names, skill or playbook names, model or vendor names.
- Process narration ("I called…", "Step 4…", "per the checklist").
- Field dumps, JSON or raw lists of everything collected. Pick what matters; the rest goes in an appendix or nowhere.
- Hedging filler, headings with nothing under them.

## 2. Deliver it so it opens

Do all that apply. Never leave a report only on the GooseWorks server.

1. **Host with files (Claude Code, Codex, Cursor):** write the report as a Markdown file in the marketer's current folder, at `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-<topic>.md`. Then give a clickable link to it, `[<title>](gooseworks-reports/…)`, and offer to open it. If the host has its own way to render a page or artifact, use it too.
2. **Hosted chat (Claude.ai, ChatGPT):** make it an artifact or document if the host can. Otherwise put the full report in the chat, with its headings, not a summary of it.
3. **Always** also save it to the brand through `../save-to-brain/ATOM.md`. Then get a link with `gooseworks:file_url` and include it: "Saved to your brand: [open](<link>)".

In the chat, after delivering, write at most 3 lines: the one thing to do first, the link, and the decisions you need from the marketer. Never re-paste the report as a summary.

## 3. Check before you hand it over

**Run the mechanical check.** Scan the report text and fix every hit before delivering:
- **Banned in the report:** id-like codes (`A-07`, `R14`, `G1`, `T1`, `S1`, `D2`…), local or workspace file paths (`research/market/…`, `*.md`, `*.json`, `gooseworks-reports/`; web links in Sources are fine), tool or skill names (`gooseworks:`, `brand_read`, `knowledge_search`, `research-market`, `playbook`, `atom`, `MCP`), model or vendor names (Claude, Sonnet, Opus, GPT, ScrapeCreators, fal, ElevenLabs), process words ("I called", "per the checklist", "Step 4"), made-up precision ("confidence 0.7", "82% likely").
- **Budget:** "In short" ≤ 150 words; body ≤ 3,000 words; ≤ 6 moves. Count them.
- **Sections present:** In short, Decisions for you, What we're not doing, What we couldn't check, Sources with a source-skew line.

**Then re-read it as the founder, for the first time:**
- Do the top 5 lines tell them what to do and why, with nothing unverified?
- Could a non-marketer follow it?
- Does every recommendation trace to a dated source in the report?
- Does the link open?
