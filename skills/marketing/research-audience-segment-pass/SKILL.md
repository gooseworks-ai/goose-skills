---
name: research-audience-segment-pass
description: >-
  Step of the research-audience playbook: the worker brief for researching one buyer group, returning
  notes in a fixed shape. Run research-audience instead; not for direct use.
version: 0.1.0
---

# segment-pass

You are researching **one buyer group** for **one brand**. **This brief is complete: don't load any skill, don't read playbook files, don't start other agents; use only web search and page reads — no GooseWorks calls.** Do every section below, inside the budget, then return. Never stop to ask. A blocked, empty or login-only source goes under "Couldn't read" — nothing you couldn't read may carry a conclusion or a move.

**Inputs (in the prompt):** the group and how to recognise one · the brand, what it sells, its price, its site, its approved claims · what the brand's own customer data says about this group, if shared · quote rows already saved for this group (add to them, don't re-mine) · the rivals · today's date.

## Budget — stop at it

- **At most 12 web searches and 10 page reads.** Search first; read a page only when you will quote or count from it. When a page read returns a summary, ask it for the exact sentences with author and date, not a summary.
- Order if you run short: §2 problems and §3 words → §4 places → §5 moves → §1 wants → §0 size → §6 rivals. Say what you dropped.
- Return **at most 700 words** in the shape at the end. No preamble.

## Whose words count

Count: people in the group speaking first-hand — reviews (read on the review site), community threads and comments, their own posts — and the brand's customer data. **Never** as their voice: vendor blogs and landing pages (including a company writing about its own team), case studies, agency copy, trade press or analyst articles (a "brand rep" quoted by a journalist is second-hand), job posts, quotes copied onto someone else's page. Verbatim only, linked, dated, with who's speaking ("ops lead at a 40-person agency" — never a private person's name). **At least 70% from the last 18 months**; count it and report the share.

## 0. Size and buying roles
A count of buyers or companies, bottom-up (directory or store counts, company counts by size band, job-post counts, industry figures), each input linked or labelled an assumption, arithmetic in words. A community's member count is reach, not size. Who uses, who pays, who approves. No sourced count → "unknown".

## 1. What they want
1–3 outcomes in their words, linked — from their posts, review headlines, "how do I…" threads.

## 2. Their problems — and why they leave
The top 3–5, each: their words · how often (posts and distinct people) · how bad · one quote with link · **solved / partly / not solved** by the brand · proof (an approved claim, or "you'd need proof of X first"). Add why they switch or leave ("went back to X") where seen.

## 3. Their words
5+ quote rows for a group that may lead, 3+ otherwise — or "thin" and why. Each: "verbatim" — who — site, date, link. Add 2–3 rows of "they say / we say" (the brand's site words).

## 4. Where they gather
4–8 named places, each: activity (members, posts this week, cadence, next date) · evidence this group is there · link · **read** (you opened it and saw them) or **unread**.

## 5. Three moves
Each: channel · message in their words · first ask · who does it · what it needs · success check with a number and a date. Each rests on a **read** place; a move on an unread place is labelled "unverified — read the community and its rules first" and is never first.

## 6. Rivals
One line per rival: their words to this group, where they show up, where everyone sounds the same.

## Return this shape
```
## <Group>
Recognise: … · Size: ~N (inputs + link + date, or unknown) · Uses / pays / approves: …
Evidence: N people first-hand, K kinds of source, M% last 18 months
Wants: …
Problems: | their words | how often | how bad | quote + link + date | solved/partly/not | proof |
Leave/switch: …
Words: "…" — who — (site, date, link) ×5 · they say / we say: …
Places: 1. <place> — activity — evidence they're there — read/unread — link + date seen …
Moves: 1. channel · message · ask · who · needs · check (number, date) — rests on <place> …
Rivals: …
Couldn't read / dropped: …
```
