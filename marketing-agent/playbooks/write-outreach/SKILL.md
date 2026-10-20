---
name: write-outreach
description: >-
  Write the cold outreach a person sends to business buyers: email and LinkedIn sequences per segment, a first line for every prospect from their buying signal, reply templates and objection answers, and a read of outbound replies that says what to fix. Use when the marketer says "write a cold email sequence", "what do I send to this list", "write LinkedIn messages for these leads", "first lines for my prospects", "how do I reply to this prospect", "handle this objection", "win back accounts that churned", "why is nobody replying to my outreach". Reads the prospect list, buyer groups and customer words from audience research, and uses only signed-off proof. Drafts only: the marketer sends from their own tool; it never sends, connects or contacts anyone. Not for finding the people — that's audience research (research-audience); not for emails to subscribers or customers — that's email-lifecycle.
---

# write-outreach

Turns a list, or a buyer group, into words a founder or seller can send this week: **sequences per segment**, **a first line per person**, **replies and objection answers**, and later **what the replies say to fix**. The craft is in the references; this file is the order of work.

**The rule that matters most: write from evidence, send nothing.** Every first line rests on a dated fact about that person or account; every proof line is signed off; every message has one ask. The marketer sends from their own mailbox and tool, after warming it up — GooseWorks' own inbox is not a cold-email sender.

## What you get

1. **The outreach pack** through [`../../atoms/write-report/ATOM.md`](../../atoms/write-report/ATOM.md), inside its 3,000-word body: in short (who to send to first and why); decisions (proof lines to sign off, the sender, daily volume); per segment the angle, the full sequence once (email and LinkedIn, with days) and 3 sample first lines; replies and objection answers; the before-you-send checklist with the one-line country summary; what we're not doing; what we couldn't check; sources (where each first line's facts came from, which proof was signed off and which cut) with a source-skew line. Every row's first line and finished messages go in the send file (and an appendix table when the marketer has no tool).
2. **A send file** the marketer imports into their tool (one subject and body column per touch, merge fields filled) — [references/handoff-and-compliance.md](references/handoff-and-compliance.md).
3. **Later, on request:** reply drafts for real replies, and a read of results — what to fix in targeting, timing or message.

## Before you start

1. **Connection and brand.** First GooseWorks call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); it settles setup and the brand only. A needed tool missing → one `gooseworks:tools_load` (`brand`, `files`). Still none → say only: "Connect GooseWorks first — I write your outreach from what's saved about your brand." Send `client` on every call that takes it. Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read — free, no questions.** **When `brain_*` tools are listed:** `gooseworks:brain_map` first (core rules, the never-list, items waiting for a yes), then chapters 14 (rules — every `[outreach …]` and `[outreach-copy …]` one), 22 and 23 (what we've run, what is working) and the products chapter, and `gooseworks:brain_search` for outreach lessons, case studies, customer results and signed-off claims. **Otherwise:** `gooseworks:brand_read` (summary, kit, products with prices, learnings) and `gooseworks:knowledge_search` for the same. Items waiting for a yes are never used as proof. Claims: the read step of [`../../atoms/claims-gate/ATOM.md`](../../atoms/claims-gate/ATOM.md). Workspace, **brand coworker scope** (the `brands/<brand-slug>/` prefix only with no coworker): `research/audience/` — the newest `<D>-<list>/list.csv` and its `report.md` (the segments' angles), `catch-all.csv`, `fit-definition.md`, `buyer-groups.md`, `voc-bank.md`, `ledger.csv`, `lessons/`; `outreach/` — earlier packs and results reads; outreach lessons in `research/audience/lessons/`. The sender's voice card if one exists ([`../../atoms/voice-card/ATOM.md`](../../atoms/voice-card/ATOM.md), read only).
2b. **Since last time.** (In results mode, after the paste is written to the ledger — references/run-memory.md.) The Start steps of [`../../atoms/run-memory/ATOM.md`](../../atoms/run-memory/ATOM.md), job `outreach`, subject = the pack ([references/run-memory.md](references/run-memory.md)): the last record for this pack (or, for a new pack, the brand's last outreach records), last run's recommendations checked against the ledger and the brain, and **reply and meeting rates per segment and per opener** recounted from the ledger — 3–5 lines that open the reply and the pack or read, and that this run acts on.
3. **Pick the mode from the ask** — never ask which:
   - **Sequences** (default): a list, a segment or a buyer group → sequences per segment plus first lines per row.
   - **Openers only**: "first lines for these prospects" → one first line per row, from its signal and hook.
   - **Replies**: a prospect's reply pasted → [atoms/reply-reader](atoms/reply-reader/ATOM.md) for that one reply, then the draft answer.
   - **Read results**: stats or a batch of replies pasted → [atoms/reply-reader](atoms/reply-reader/ATOM.md) for the batch, then [references/reading-results.md](references/reading-results.md).
   - **Consumers who signed up** (a waitlist, app or newsletter sign-ups, shoppers): not cold outreach — one line pointing to email-lifecycle (the brand's own consented emails); this playbook writes only to business buyers.
   - **Inbound replies**: leads who asked the brand (`consent_basis: asked-us` from research-audience's score-a-list — demo requests, trial sign-ups at companies): a warm, prompt reply that names what they did and answers it, the ask matched to urgency (now: two times this week; today: a walkthrough of one feature; 24 hours: a useful resource) — never a cold sequence.
   - **Win-back**: churned business accounts → the win-back segment in [references/angles-by-signal.md](references/angles-by-signal.md). Lapsed consumer customers → email-lifecycle, in one line.
4. **No list and no buyer groups?** Write for the buyer groups you can draft from the brand's site and brain, labelled provisional, and say in one line that a list makes every first line specific. Never stop to ask for one.
5. **Assume, don't ask:** sender = the founder (from the brain) unless named; their own tool and mailbox; about 30–50 emails a day per warmed-up mailbox in total (roughly 10–15 new people a day once a sequence runs). State each assumption in the decisions box.

## Steps (sequences mode)

1. **Segments.** Pick the row in [references/outreach-by-company-type.md](references/outreach-by-company-type.md) for the motion. Take the list's segments and angles from `segments.csv` next to `list.csv` (or the list's `report.md`), or the buyer groups. At most four segments in one pack; more → the top four by tier and value, the rest named as next. Each segment's **angle**: *pain* in the buyers' own words (from the quote bank, linked — no bank yet: two or three free searches for real posts, else our words labelled "not yet from buyers"), *proof* — one signed-off claim verbatim, or "proof needed: <what>", *ask* — one low-friction next step ([references/email-craft.md](references/email-craft.md) § The ask).
2. **Sequence shape** per segment from where the lead came from and its signal ([references/sequences.md](references/sequences.md) § Lead source → sequence): touches, channel per touch (email, LinkedIn connection, LinkedIn message), days between, and what each touch adds (never "just bumping this").
3. **Write.** One worker per segment where the host supports it — given [atoms/draft-sequence](atoms/draft-sequence/ATOM.md) pasted whole plus the segment's angle, rows and rules; at most four, one level, no web research beyond re-checking a hook's link. Otherwise segment by segment. Email rules: [references/email-craft.md](references/email-craft.md); LinkedIn: [references/linkedin-craft.md](references/linkedin-craft.md); first line per signal: [references/angles-by-signal.md](references/angles-by-signal.md).
4. **First lines per row.** For every row in the list: one first line built on its signal and hook (the fact, why it matters to their pain), or — no hook — the segment's default opener, marked "no personal hook". Never invent a fact, a compliment or a mutual connection.
5. **Replies and objections.** Per segment: the 6–8 replies the angle is most likely to draw and the answer to each ([references/replies-and-objections.md](references/replies-and-objections.md)) — positive, "send info", timing, "we use X", price, wrong person (ask for the referral), not interested, unsubscribe.
6. **Check** with [atoms/outreach-qa](atoms/outreach-qa/ATOM.md): every proof line through claims-gate (cuts listed with the proof that would restore them), country rules per row ([references/handoff-and-compliance.md](references/handoff-and-compliance.md) § Country rules), length and character limits, one ask, no tracking-dependent advice, no banned hooks. Fix, then re-check.
7. **Deliver** through write-report: the pack as a local file with a clickable link, the send file beside it, a copy saved with [`../../atoms/save-to-brain/ATOM.md`](../../atoms/save-to-brain/ATOM.md) (the pack's brand copy keeps the angles, sequences and replies but **no person's name, company or first line** — per-person text lives only in the local file and the send file) and a `gooseworks:file_url` link. Write each row's `opener_id` and `sequence_id` into the ledger (columns only; [references/run-memory.md](references/run-memory.md)), then run-memory's End steps: the run record with the counts and the "send first" call as a recommendation with its test.
8. **One closing message, this shape:**
   > **Send first:** <segment, how many people, which touch> — <why>.
   > [<pack title>](<local link>) · send file: [<name>](<link>) · saved to your brand: [open](<link>)
   > **Decisions:** <proof lines to sign off> · <sender and daily volume, if assumed> · **paste the replies here as they come in — I'll draft answers and tell you what to fix.**
9. **No schedule.** A pack is a one-off job. Reading results is done when the marketer pastes them (suggest doing it after the first 100 sends or two weeks, whichever is first); that read is the same run-memory job and subject, so it starts from this pack's record.

## Steps (replies and results)

- **One reply:** classify it ([atoms/reply-reader](atoms/reply-reader/ATOM.md)), draft the answer in the sender's voice with one ask, and say the status it gives the row (outcomes-ledger's person statuses: `replied`, `meeting`, `not-a-fit`, `bounced`, `unsubscribed`, `do-not-contact`). Unsubscribe or "stop" → no reply draft beyond a one-line confirmation if their tool needs one, and the row is suppressed.
- **A batch or stats:** deliver the read first. Pasted prospect rows that aren't in the ledger are added to it (outcomes-ledger, `list_id` = the paste's date) so their replies can be matched and suppressed. When results come as counts only, the read's **closing decisions** ask once for who is behind every `stop`, `angry`, `bounce` and `not-interested`, and when touch 1 went out (it starts the 12-week cool-down and fills `sequence_id`, `last_touch`); until answered, `results-working.md` carries `Hold needed: for research-audience · <accounts or "all accounts in <list>"> · return to: outreach/<D>-<slug>/results-working.md`, and research-audience excludes them. reply-reader for every reply; then [references/reading-results.md](references/reading-results.md) — rates by touch and segment, where objections cluster, what to fix (targeting, titles, timing, message, deliverability), with sample sizes said. Update the ledger and write lessons through [`../../atoms/outcomes-ledger/ATOM.md`](../../atoms/outcomes-ledger/ATOM.md) (`entity: person`). A rule the marketer states goes through [`../../atoms/save-learning/ATOM.md`](../../atoms/save-learning/ATOM.md) as `[outreach-copy YYYY-MM-DD]`. Deliver the read through write-report, opening with "since last time", then run-memory's End steps (the record's numbers per segment and per opener, the fixes as recommendations with review-by and test).

## Approval gates

- No questions before the first draft; decisions come after it.
- New proof lines only through claims-gate's scoped sign-off; without it, plain product facts only.
- Nothing is sent, connected, scheduled or posted — ever, by this playbook. Ledger statuses change only from what the marketer reports.

## Output and write-back

| Artifact | Where | Read by |
|---|---|---|
| Outreach pack | local `gooseworks-reports/<brand-slug>/<D>-outreach.md`; workspace `outreach/<D>-<slug>/pack.md` → `Outreach pack — <slug> — <Brand> — <D>` (keep-history) | the marketer, the next run |
| Send file | local `gooseworks-reports/<brand-slug>/<D>-outreach-send.csv`; workspace `outreach/<D>-<slug>/send.csv` (not imported — it holds people's data) | the marketer's sending tool |
| Results read | local `gooseworks-reports/<brand-slug>/<D>-outreach-results.md`; workspace `outreach/<D>-<slug>/results.md` → `Outreach results — <slug> — <Brand> — <D>` (keep-history; counts, rates and fixes only — no names, emails, reply text or per-reply rows); per-reply lines and the `Hold / Find / Quote` request lines in `outreach/<D>-<slug>/results-working.md` (not imported) | the next pack, research-audience (re-scoring signals) |
| Run records | `runs/write-outreach/outreach/<pack-slug>/<D>.md` → `Run record — outreach — <pack-slug> — <Brand> — <D>` (keep-history, via run-memory; counts, rates and links only) | the next read or pack |
| Ledger statuses, lessons | `research/audience/ledger.csv`, `research/audience/lessons/<D>.md` (outcomes-ledger, `entity: person`) | research-audience, the next pack |

See [server-needs.md](server-needs.md).

## Done when

"Since last time" opened the reply (or "no earlier run"), rates per segment and per opener recounted from the ledger with sample sizes, and the run record saved with counts and links only. The pack passes write-report §3 and outreach-qa. Per segment: an angle in the buyers' words with a link, signed-off proof or "proof needed", one ask; a sequence of email and LinkedIn touches with days and what each adds; within the character limits; 6–8 replies and objection answers. Every list row has a first line resting on a dated fact, or says "no personal hook". Every row's country rule is applied (footer and opt-out on email; no email for rows that can't take one). The send file imports (one subject and body column per touch). Nothing was sent. In results mode: replies classified, rates by touch and segment with sample sizes, what to fix, ledger updated.

## Out of scope

Finding people and emails — **research-audience** · emails to subscribers and customers, consumer win-back — **email-lifecycle** · creators — **work-with-creators** · sending, connecting, scheduling, warming up domains — not covered (the marketer's tool) · SMS, cold calls · scraping who liked or commented on posts · personal emails or phones · sales decks, battlecards — not covered yet.
