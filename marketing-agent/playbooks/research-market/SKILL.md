---
name: research-market
description: >-
  Use when a founder or marketer asks "who actually buys this, and what do they say in their own words?", "who is my customer", "research my audience", "who should we target", "build me a persona", "mine our reviews", "voice of customer", "why do people buy / not buy", "what words do customers use", "is my category growing", or says the messaging feels stale. Delivers a sourced voice-of-customer bank (verbatim, linked, tagged quotes), 2–4 ranked buyer segments with the primary segment, its job and what to lead with, an anti-persona, the competitors and alternatives buyers name, and an honest demand read — saved to the brand for ads, content, social and planning. Never contacts customers; thin evidence gets an interview kit, not invention. Not for a list of businesses or people to pitch — use research-audience; not for what rivals run — use research-competitors.
---

# research-market

The customer-research half of pillar 1. A dated snapshot of who buys, why, what stops them, the exact words they use — and which buyer to lead with. Built only from evidence a reviewer can click.

## What you get

1. **The read** — opens with "Do this first, because…": the primary segment, the job it hires the product for, and what to lead with. Then the method note (sources, n read, date range, star mix, gaps), what is new or surprising, the recognition-test answers.
2. **Ranked segments** — 2–4 buyer segments (one only when the evidence shows no split, said so), ranked in a priority table (evidence share, pain intensity, willingness-to-pay signal, reachability, product fit); each with roles, job, triggers, the four forces, objections → what resolves them, words they use and don't, alternatives, where they hang out, and a two-line **message implication** (what to lead with, which objection to pre-empt). Plus an anti-persona. Every trait cites quote ids and a confidence.
3. **Voice-of-customer bank** — 30–60 kept quotes (from 100–300 read where volume exists), verbatim, linked, dated, tagged by type, theme, segment, force and awareness, with claim and personal-attribute flags; a theme table with counts on top.
4. **Competitors and alternatives** — typed list (direct / indirect / DIY / do-nothing / professional) with switching direction and quote ids.
5. **Demand read** — direction, seasonality, how buyers search, sophistication — every line labelled measured, proxy, category prior or unknown.

Formats and a worked example: `references/output-formats.md`.

## Before you start

1. **Connection.** No GooseWorks tools listed (after one `gooseworks:tools_load` for a missing group: brand, ads, files, media, data, automation) → say only: "Connect GooseWorks first — I research your buyers and save what I find through it." First GooseWorks call of the conversation: `gooseworks:get_started` with the marketer's words (`wants: "more"`), used only to settle setup and the brand. Send `client` on every call that takes it.
2. **Brand.** The brand named; with several and none named, list them (`gooseworks:brand_read`, no id) and ask. Keep `brand_id`, `brand_slug`, `coworker_agent_id` — workspace scope and the no-coworker fallback are in `../../atoms/save-to-brain/ATOM.md`.
3. **Read the brain first — never ask what it already says.**
   - `gooseworks:brand_read` sections `summary`, `kit`, `products`, `competitors`, `learnings`, `sources`, `organic`, `accounts`.
   - `gooseworks:knowledge_search` (`source_types: ["evidence", "document"]`) for existing customer evidence and any earlier bank or read.
   - `gooseworks:competitor_read`, and with `view: "suggestions"`.
   - Workspace (`gooseworks:file_list`, `file_read`): `research/market/` (a previous bank means a refresh — extend it, never duplicate), `research/credits-log/` (prices), and listen-social's `social/listening/*-report.md` — its `VoC`-tagged quotes dated after the bank's `Last updated` are mined like any other source.
4. **Ask only what is missing, in one message:**
   - Who buys today, in the founder's words (quote the audience field back and ask "still true?" if it has one). Record it verbatim — the read must test it, not mirror it.
   - Company type and markets, if the record does not settle them.
   - Where customers talk and review that is not a saved source (ask them to confirm a review page is theirs).
   - Raw private evidence to paste or upload: support tickets, survey answers (post-purchase or waitlist), return/cancel reasons, call-transcript excerpts (raw text, not summaries), win/loss notes; for B2B, 15–20 competitor reviews from G2 or Capterra for the top two rivals, copied by hand. Ask every time — it is usually the best evidence.
   Never guess an answer; mark it unknown and carry on.

## Steps

1. **Frame the run.** Method header: brand, products in scope, company type, markets, first run or refresh since <date>, the founder's stated belief, the question this run answers. *Writes:* the read's header.

2. **Plan the sources.** Load `references/sources-by-company-type.md`. Per corpus — own customers, prospects, the 3–5 closest rivals' customers, the category, private material — list the sources that matter for this type and mark each: brain (free), proxy (paid; endpoints in `../../atoms/spend-gate/proxy-endpoints.md`), read-by-fetch (one public page with the host's own browser or fetch), paste, or unreachable. If the source that matters most is unreachable, say so — never quietly substitute a weaker one. Rivals come only from the roster, the server's suggestions, the founder's answer, survey "what have you tried" answers and one community search, each labelled `candidate — <source>` and confirmed by the founder before any paid pull — never from memory. Every paid read goes through `../../atoms/spend-gate/ATOM.md` (branch B); when the run is already known to be a cold start, the plan says these sources give "category context, not your buyers" before the yes. *Writes:* the source plan into the method note.

3. **Mine — and write as you go.** Load `references/mining-method.md`. Batches of 20–25 per source (≤ ~6 per source), stratified by rating, weighted to the last 12–18 months; verbatim rows with the full tag set; stop at saturation. After every batch, add the rows to `research/market/voc-bank.jsonl` (read, add, write back) — never retype a quote from memory; later steps read the file. Pasted private material is saved to the workspace first (never imported) and cited `private:<path>#<date>`. Count everything read, not just what is kept. *Writes:* rows `V-NNN` (ids continue from the previous bank).

4. **Theme and count.** Cluster into themes `T-NN`: **established** at 3+ quotes from 3+ distinct authors ("single source" if one platform carries it), **signal** below. Keep about-whom and public/private splits on every theme. Product defects go to a separate list for the founder. Note what is new or gone since the last run. *Writes:* the theme table.

5. **Name the alternatives.** Every competitor and alternative buyers name, typed, with mentions, switching direction (switched to us vs left us — the second is churn evidence) and prices buyers quote; merged with the roster and suggestions. *Writes:* the competitor list.

6. **Check the evidence floor and the links — before any segment is drawn.** Cold start = fewer than ~30 items read about the brand's own customers and prospects (public or private), or no theme with 3+ such rows from distinct authors. Rival volume never lifts a run out of cold start: rival and category rows are reported as "category context — not your buyers", segments stay at what own evidence supports, the read opens "Cold start: …", and the interview and survey kit (`references/recognition-and-interviews.md`) is handed over; steps 7–11 continue with own evidence only. Links: where the host can open pages, reopen ~10% of kept links (at least 5) and check the quote verbatim; where it cannot, check the stored text and say "links not re-opened (no browser here)". *Writes:* run mode and link check into the method note.

7. **Build and rank the segments.** Load `references/output-formats.md` § personas.md. Derive 2–4 segments and one anti-persona from this run's themes — every name and trait traces to this run's `T-`/`V-` ids, never the worked example or stock demographics; untraceable fields say "unknown — ask". Persona traits drawn from rival customers say so; for B2B, segment by role × company size with the buying committee. Score each segment on evidence share, pain intensity, willingness-to-pay signal, reachability and product fit (each with its evidence), name the **primary segment** and the job it hires the product for, and write each segment's **message implication** — what to lead with and the objection to pre-empt, in buyer words, never a claim. *Writes:* `personas.md`, and the read's opening line.

8. **Read demand honestly.** Load `references/mining-method.md` § Demand. No search-interest tool exists, so use labelled proxies — rivals' active-ad start dates (`gooseworks:ads_template_read` mode `competitor`; low confidence, skip under ~20 ads), dates of the reviews and posts already pulled, phrasings in titles, questions and search suggestions — and category priors marked "known pattern, not measured"; otherwise "unknown". *Writes:* `demand.md`.

9. **Recognition test.** Hand the founder the read (one screen first) and ask the four questions in `references/recognition-and-interviews.md` — is this your buyer, what didn't you know, which quote would you put in an ad tomorrow, which of these rivals should we track. The read already names at least one finding that contradicts or extends their stated belief. Revise once; record answers verbatim. A correction about their own customers is recorded beside the evidence, never argued away. *Writes:* the recognition section.

10. **Save to the brain.** Through `../../atoms/save-to-brain/ATOM.md`: `research/market/voc-bank.md` (`versioned: supersede`), `voc-bank.jsonl` (`import: no`), `personas.md` and `demand.md` (`supersede`), `<YYYY-MM-DD>-read.md` (`keep-history`). Then:
    - `gooseworks:brand_update` `patch.knowledge.audience`: the ranked-segment summary (≤ 2,000 characters, merged with what the field says) as an `agent_proposal`, with a rationale citing the bank and quoting any correction the founder gave — it waits on the brand for the owner to accept. Skip it in a cold start without own segments. Never write the audience as a correction from here.
    - `gooseworks:competitor_save` `add` for each direct rival the founder picked in question 4 — never before, never indirect or do-nothing alternatives.
    - Learnings through `../../atoms/save-learning/ATOM.md`: offer rules (such as the primary segment's lead message, the top objection to pre-empt, the buyer words to use), each one idea, prefixed `[market YYYY-MM-DD]`, never quoting a claim or personal-attribute row; written only on the human's yes in their words, retiring, in the same call, the earlier `[market …]` facts each new rule replaces or contradicts.
    *Writes:* the files, documents, proposal, roster entries and learnings above.

11. **Offer the refresh.** One question: re-run on a cadence (quarterly is normal; sooner after a new product, segment or market, a rating drop, or when every angle is fatiguing)? Write `Next refresh: <date> or on <trigger>` into the read's header. Only if the brand has a coworker and a confirmed review or social source, also offer a saved source refresh (`gooseworks:automation_upsert`, review or source refresh mode) under `../../atoms/spend-gate/ATOM.md` branch C — created paused, its small per-run cap described in words, switched on only on a yes. A source refresh re-imports reviews; it does not re-run this read.

## Approval gates

- **Spend:** any paid read — the spend gate's yes first. Free reads need none.
- **Tracking rivals:** only names the founder picked.
- **Schedules:** created paused; on only on a yes.
- **Brand facts:** the audience summary is a proposal the owner accepts; learnings only on the human's own yes, in their words.
- **Never:** contact a customer, reviewer or community (no surveys sent, interviews booked, posts or DMs) — the kit is handed to the human. A quote is language, never a claim.

## Output and write-back

| Artifact | Where it lives | How readers find it | Who reads it next |
|---|---|---|---|
| The read | `research/market/<YYYY-MM-DD>-read.md` + document (keep-history) | newest `*-read.md` in `research/market/` | the founder; plan-campaign (primary segment); the next refresh |
| Segments (ranked) + anti-persona | `research/market/personas.md` + document; summary proposed to `knowledge.audience` | the path; else `knowledge_search` document "Buyer segments" | plan-campaign, work-with-creators, make-content, run-organic-social |
| Voice-of-customer bank | `research/market/voc-bank.md` + document; `voc-bank.jsonl` (filterable, not imported) | the path; else `knowledge_search` `["document"]`, "Voice-of-customer bank <topic>" — a document, not `evidence` rows | make-static-ads, make-video-ads, make-content, run-organic-social, research-competitors, plan-campaign |
| Demand read | `research/market/demand.md` + document | the path; else document "Demand read" | plan-campaign |
| Competitors and alternatives | server roster (founder-picked directs) + the read | `gooseworks:competitor_read` | research-competitors, listen-social |
| Learnings | `[market …]` learnings, on the human's yes, one idea each | `brand_read` learnings | ad and content generation |

## Done when

- The read opens with "Do this first, because…", naming the primary segment, its job and what to lead with; every segment has its score evidence and message implication.
- The founder, asked without leading, says "yes" or "partly" with fixes applied, and names at least one thing they did not know (under ~20 customers: recognises a lost-deal or prospect pattern).
- At least 20 kept quotes (normally 30–60), verbatim, each with a link or private citation and a retrieved date; the link check passed or says why it could not run; every theme shows its count; every trait cites ids or says unknown.
- Competitors and alternatives are named and typed; picked directs are on the roster; the demand read labels every line.
- Everything is saved and findable; credits spent are within the approved ceiling.
- Or: the evidence floor was not met, the read opens "Cold start", and the kit was handed over; or the founder rejected the read with no evidence to mine — their view recorded beside the evidence, the kit handed over.

## Out of scope

- What rivals run, price and post — research-competitors, seeded by this playbook's roster.
- This week's mentions, trends and replies — listen-social; this is a dated snapshot.
- Writing positioning from the findings — write-my-positioning (backlog); this playbook never edits positioning or value props.
- Contacting customers — the human runs the interview and survey kit.
- Channels, budgets, campaigns — plan-campaign. Prospect and outreach lists — research-audience.
