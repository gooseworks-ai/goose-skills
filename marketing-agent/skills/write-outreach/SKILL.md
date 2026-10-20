---
name: write-outreach
description: >-
  Cold outreach a person sends to business buyers: email and LinkedIn sequences, a first line per
  prospect, reply and objection answers, and a read of replies. Use when the marketer says "write a
  cold email sequence", "what do I send to this list", "write LinkedIn messages for these leads", "how
  do I reply to this prospect" or "handle this objection", "reply to this demo request", "win back or
  reconnect with accounts that churned or went quiet", or "why is nobody replying to my outreach".
  Drafts only; the marketer sends from their own tool. Not for finding the people — use
  research-audience; not for emails to subscribers or users, or consumer win-back — use
  email-lifecycle.
version: 0.2.0
---

# write-outreach

Turns a list, or a buyer group, into words a founder or seller can send this week: **sequences per segment**, **a first line per person**, **replies and objection answers**, and later **what the replies say to fix**. The craft is in the references; this file is the order of work.

**The rule that matters most: write from evidence, send nothing.** Every first line rests on a dated fact about that person or account; every proof line is signed off; every message has one ask. The marketer sends from their own mailbox and tool, after warming it up — GooseWorks' own inbox is not a cold-email sender.

## What you get

1. **The outreach pack**, in the shape and checks of [the `write-report` skill](../write-report/SKILL.md). Outreach adds: the first move is who to send to first (with no list, that there is no one yet); decisions cover proof lines to sign off, the sender, the sending tool, daily volume and timing; with no list or on a first pack, the whole path and who does each step ([references/handoff-and-compliance.md](references/handoff-and-compliance.md) § The whole path); per segment the angle, the full sequence once (email and LinkedIn, with days) and 3 sample first lines; replies and objection answers; the before-you-send checklist with the one-line country summary; Sources say where each first line's facts came from and which proof was signed off and which cut. Every row's first line and finished messages go in the send file (and an appendix table when the marketer has no tool).
2. **A send file** the marketer imports into their tool (one subject and body column per touch, merge fields filled) — [references/handoff-and-compliance.md](references/handoff-and-compliance.md).
3. **Later, on request:** reply drafts for real replies, and a read of results — what to fix in targeting, timing or message.

## Before you start

1. **Setup first:** do [the `marketing-guide` skill](../marketing-guide/SKILL.md) §1–2 (connect, brand, brain read) before anything else; the job line is "I write your outreach from what's saved about your brand." (`get_started` with `wants: "more"`; tool groups `brand`, `files`.)
2. **Read — free, no questions.** Brain path: chapters 14 (rules — every `[outreach …]` and `[outreach-copy …]` one), 22 and 23 (what we've run, what is working) and the products chapter; `gooseworks:brain_search` for outreach lessons, case studies, customer results and signed-off claims. Fallback: `gooseworks:brand_read` (summary, kit, products with prices, learnings) and `gooseworks:knowledge_search` for the same. Claims: the read step of [the `claims-gate` skill](../claims-gate/SKILL.md). Workspace: `research/audience/` — the newest `<D>-<list>/list.csv` and its `report.md` (the segments' angles), `catch-all.csv`, `fit-definition.md`, `buyer-groups.md`, `voc-bank.md`, `ledger.csv`, `lessons/`; `outreach/` — earlier packs and results reads. The sender's voice card if one exists ([the `voice-card` skill](../voice-card/SKILL.md), read only).
2b. **Since last time.** (In results mode, after the paste is written to the ledger — references/run-memory.md.) The Start steps of [the `run-memory` skill](../run-memory/SKILL.md), job `outreach`, subject = the pack ([references/run-memory.md](references/run-memory.md)): the last record for this pack (or, for a new pack, the brand's last outreach records), last run's recommendations checked against the ledger and the brain, and **reply and meeting rates per segment and per opener** recounted from the ledger — 3–5 lines that open the reply and the pack or read, and that this run acts on.
3. **Pick the mode from the ask** — never ask which:
   - **Sequences** (default): a list, a segment or a buyer group → sequences per segment plus first lines per row.
   - **Openers only**: "first lines for these prospects" → one first line per row, from its signal and hook.
   - **Replies**: a prospect's reply pasted → [the `write-outreach-reply-reader` skill](../write-outreach-reply-reader/SKILL.md) for that one reply, then the draft answer.
   - **Read results**: stats or a batch of replies pasted → [the `write-outreach-reply-reader` skill](../write-outreach-reply-reader/SKILL.md) for the batch, then [references/reading-results.md](references/reading-results.md).
   - **Consumers who signed up** (a waitlist, app or newsletter sign-ups, shoppers): not cold outreach — one line pointing to email-lifecycle (the brand's own consented emails); this playbook writes only to business buyers.
   - **Inbound replies**: leads who asked the brand (`consent_basis: asked-us` from research-audience's score-a-list — demo requests, trial sign-ups at companies): a warm, prompt reply that names what they did and answers it, the ask matched to urgency (now: two times this week; today: a walkthrough of one feature; 24 hours: a useful resource) — never a cold sequence.
   - **Win-back**: churned business accounts → the win-back segment in [references/angles-by-signal.md](references/angles-by-signal.md). Lapsed consumer customers → email-lifecycle, in one line.
4. **No list on file** (no `list.csv`, no rows pasted) — whether or not buyer groups exist: still write the sequences for the saved buyer groups (lead first) or, with none, groups drafted from the site and brain, labelled provisional; each segment gets its default opener. The closing opens with the no-list shape (step 8). Never stop to ask for a list.
5. **Assume, don't ask:** sender = the founder (from the brain) unless named, as a decision: whoever runs the buyer calls may be the better signer; their own mailbox; their sending tool is one decision, asked once ([references/handoff-and-compliance.md](references/handoff-and-compliance.md) § Your sending tool — read it when connected); about 30–50 emails a day per warmed-up mailbox in total (roughly 10–15 new people a day once a sequence runs). State each assumption in the decisions box.

## Steps (sequences mode)

1. **Segments.** Pick the row in [references/outreach-by-company-type.md](references/outreach-by-company-type.md) for the motion. Take the list's segments and angles from `segments.csv` next to `list.csv` (or the list's `report.md`), or the buyer groups. At most four segments in one pack; more → the top four by tier and value, the rest named as next. Each segment's **angle**: *pain* in the buyers' own words (from the quote bank, linked — no bank yet: two or three free searches for real posts, else our words labelled "not yet from buyers"), *proof* — one signed-off claim verbatim, or "proof needed: <what>", *ask* — one low-friction next step ([references/email-craft.md](references/email-craft.md) § The ask). **Timing check** against the buyer's calendar: if it would land in their busiest weeks (DTC and retail from mid-November to Cyber Monday; accountants in tax season), make it the first decision: LinkedIn now with a January angle, or hold the emails.
2. **Sequence shape** per segment from where the lead came from and its signal ([references/sequences.md](references/sequences.md) § Lead source → sequence): touches, channel per touch (email, LinkedIn connection, LinkedIn message), days between, and what each touch adds (never "just bumping this").
3. **Write.** One worker per segment where the host supports it — given [the `write-outreach-draft-sequence` skill](../write-outreach-draft-sequence/SKILL.md) pasted whole plus the segment's angle, rows and rules; at most four, one level, no web research beyond re-checking a hook's link. Otherwise segment by segment. Email rules: [references/email-craft.md](references/email-craft.md); LinkedIn: [references/linkedin-craft.md](references/linkedin-craft.md); first line per signal: [references/angles-by-signal.md](references/angles-by-signal.md).
4. **First lines per row.** For every row in the list: one first line built on its signal and hook (the fact, why it matters to their pain), or — no hook — the segment's default opener, marked "no personal hook". Never invent a fact, a compliment or a mutual connection.
5. **Replies and objections.** Per segment: the 6–8 replies the angle is most likely to draw and the answer to each ([references/replies-and-objections.md](references/replies-and-objections.md)) — positive, "send info", timing, "we use X", price, wrong person (ask for the referral), not interested, unsubscribe.
6. **Check** with [the `write-outreach-outreach-qa` skill](../write-outreach-outreach-qa/SKILL.md): every proof line through claims-gate (cuts listed with the proof that would restore them), country rules per row ([references/handoff-and-compliance.md](references/handoff-and-compliance.md) § Country rules), length and character limits, one ask, no tracking-dependent advice, no banned hooks. Every price or offer in a message follows the guide's rule "Live facts" ([the `marketing-guide` skill](../marketing-guide/SKILL.md) §3); a mismatch with the brain is flagged in decisions. Fix, then re-check.
7. **Deliver** through write-report: the pack as a local file with a clickable link, the send file beside it, a copy saved with [the `save-to-brain` skill](../save-to-brain/SKILL.md) (the pack's brand copy keeps the angles, sequences and replies but **no person's name, company or first line** — per-person text lives only in the local file and the send file) and a `gooseworks:file_url` link. Write each row's `opener_id` and `sequence_id` into the ledger (columns only; [references/run-memory.md](references/run-memory.md)), then run-memory's End steps: the run record with the counts and the "send first" call as a recommendation with its test.
8. **One closing message, this shape** (with no list, the first line is replaced by the no-list block below — never "Send first: <segment, N a day>" without people):
   > **Send first:** <segment, how many people, which touch> — <why>.
   > [<pack title>](<local link>) · send file: [<name>](<link>) · saved to your brand: [open](<link>)
   > **Decisions:** <proof lines to sign off> · <sender and daily volume, if assumed> · **paste the replies here as they come in — I'll draft answers and tell you what to fix.**

   **No list:**
   > **Before you can send:** you don't have anyone to send these to yet. Two ways on:
   > (a) Say **build the list** — I'll find a first batch of about 50 right-fit companies and the buyer at the best of them (name, title, LinkedIn). A test you can read needs 300–500 accounts, so we build it in batches. I can't find or check email addresses yet, so you'll run them through an email finder (such as Apollo or Hunter) and a checker (such as ZeroBounce or NeverBounce) before sending. Start setting up a separate sending domain today — it needs 2–4 weeks of warm-up.
   > (b) Already have a list? Paste or upload it and I'll write a first line for every person.
   then the links line and **Decisions** as above. (When the connector can find and check addresses, (a) says so instead.) The run record's recommendation is "build or paste the list".
9. **No schedule.** A pack is a one-off job. Reading results is done when the marketer pastes them (suggest doing it after the first 100 sends or two weeks, whichever is first); that read is the same run-memory job and subject, so it starts from this pack's record.

## Steps (replies and results)

- **One reply:** classify it ([the `write-outreach-reply-reader` skill](../write-outreach-reply-reader/SKILL.md)), draft the answer in the sender's voice with one ask, and say the status it gives the row (outcomes-ledger's person statuses: `replied`, `meeting`, `not-a-fit`, `bounced`, `unsubscribed`, `do-not-contact`). Unsubscribe or "stop" → no reply draft beyond a one-line confirmation if their tool needs one, and the row is suppressed.
- **A batch or stats:** deliver the read first. Pasted prospect rows that aren't in the ledger are added to it (outcomes-ledger, `list_id` = the paste's date) so their replies can be matched and suppressed. Counts only → the closing decisions ask who is behind each stop, angry reply, bounce and not-interested, with a `Hold needed` line meanwhile ([references/reading-results.md](references/reading-results.md) § Counts only). reply-reader for every reply; then [references/reading-results.md](references/reading-results.md) — rates by touch and segment, where objections cluster, what to fix (targeting, titles, timing, message, deliverability), with sample sizes said. Update the ledger and write lessons through [the `outcomes-ledger` skill](../outcomes-ledger/SKILL.md) (`entity: person`). A rule the marketer states goes through [the `save-learning` skill](../save-learning/SKILL.md) as `[outreach-copy YYYY-MM-DD]`. Deliver the read through write-report, opening with "since last time", then run-memory's End steps (the record's numbers per segment and per opener, the fixes as recommendations with review-by and test).

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

"Since last time" opened the reply (or "no earlier run"), rates per segment and per opener recounted from the ledger with sample sizes, and the run record saved with counts and links only. The pack passes write-report §3 and outreach-qa. Per segment: an angle in the buyers' words with a link, signed-off proof or "proof needed", one ask; a sequence of email and LinkedIn touches with days and what each adds; within the character limits; 6–8 replies and objection answers. Every list row has a first line resting on a dated fact, or says "no personal hook". Every row's country rule is applied (footer and opt-out on email; no email for rows that can't take one). The send file imports (one subject and body column per touch). With no list, the closing opened with the no-list block and named no send volume. Nothing was sent. In results mode: replies classified, rates by touch and segment with sample sizes, what to fix, ledger updated.

## Out of scope

Finding people and emails — **research-audience** · emails to subscribers and customers, consumer win-back — **email-lifecycle** · creators — **work-with-creators** · sending, connecting, scheduling, warming up domains — not covered (the marketer's tool) · SMS, cold calls · scraping who liked or commented on posts · personal emails or phones · sales decks, battlecards — not covered yet.
