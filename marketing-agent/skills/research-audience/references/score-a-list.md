# Score a list the marketer brings — and which inbound leads to answer first

Load in list mode when the marketer uploads or pastes rows: demo requests, trial sign-ups, webinar or event attendees they collected themselves, a purchased or CRM export, a conference badge scan. The job: who fits, who to contact first, how, and who to leave alone. Nothing new is sourced unless they ask.

## 1. Read the rows (free)

**First, is this a consumer list?** If most rows are free-mail addresses with no company (a waitlist, app sign-ups, newsletter subscribers, shoppers), these are **consumers who gave their details to the brand** — not B2B leads. Then: **no lookups of any person** (no web search by name), **no ledger rows**, no outreach list. Score only from the file's own columns (what they did, when, what they said, country) to pick **who to talk to first** — e.g. 10–20 people for interviews or early-access calls — and hand any email to them to **email-lifecycle** (the brand's own consented channel), in one line. Mixed lists: split the company rows (scored below) from the consumer rows (this paragraph).

- Normalise: name, title, company, domain (from the email when there's no domain column), country, source (form, webinar, event, trial), date, what they did (asked for a demo, attended, downloaded X). Add `lead_age` (days since they acted); a lead older than its urgency window is flagged **overdue** and goes to the top.
- **Score from the file's own columns first.** Fill gaps only for the top ~100 rows by urgency, or the rows marked unknown — never 2,000 lookups for a 2,000-row export; say how many were filled.
- **Free-mail check first:** if the email domain is a webmail provider (gmail, yahoo, hotmail, outlook, aol, icloud, proton, zoho, yandex, gmx, live, mail.com), mark `is_free_email` and **don't** look the domain up as a company (it would describe the mail provider). The company comes from a form field or stays unknown. A free-mail address is never stored in the brain and never enriched into a work address.
- Drop and count: duplicates, test entries, bots (nonsense fields, instant form fills), the brand's own staff, competitors' staff (flag them separately — no outreach).
- Apply the ledger's suppression and exclusions (outcomes-ledger) and the marketer's customer list if they gave one (customers are flagged for the account team, not scored as leads).

## 2. The rules — drafted, not interrogated

Build the scoring rules from the fit definition (fit-and-scoring.md) or the buyer groups, in this shape, and show them with the scored rows:
1. **Hard no** (disqualify at once), each with the reason — e.g. students, agencies when we sell to brands, excluded countries.
2. **Hard yes** (qualify at once) — e.g. a demo request from a fitting company.
3. **Company criteria** — size, industry, geography, stage: qualified / disqualified / notes.
4. **Person criteria** — titles, seniority, department.
5. **Signals** that lift or lower fit (a fresh hiring post, a new leader, a rival named on the form).
6. **Confidence:** high when size, title and at least one signal are known; medium when one or two non-critical facts are missing; low when a critical one is (no company, no title) — still make the call, and say it's low.

Reasoning order for every row: hard no → hard yes → company → person → signals as tie-breakers → confidence → one or two sentences of reason that name this row's facts.

**Edge cases.** Show 3–5 boundary rows from the marketer's own data with the call made ("right title, company a little too big — scored B, because…") so they can correct the rules on real cases. Their corrections become the saved rules (`research/audience/fit-definition.md`); a rule they state in words becomes an `[outreach …]` learning.

## 3. Calibrate on a small batch, then the rest

Score the first 10 rows (or the 10 most recent inbound), show them in the report's first table with the reason for each, and carry on with the rest in the same run — don't wait for a yes. When the marketer corrects the calibration rows, re-score everything and say what changed. Fill gaps cheaply: the company's own site and a web search before any paid read; paid confirmation only in the approved top-up.

## 4. Inbound: who to answer first

| Urgency | Answer within | What lands here |
|---|---|---|
| **Now** | 1 hour | Demo or pricing requests; a chat asking about price, integration or rollout; a rival named; a stated timeline ("switching by Q2"); the same person seen in two or more sources |
| **Today** | 4 hours | Trial sign-ups; product questions; webinar attendees who showed up; downloads of buying-stage pages (pricing, comparisons, case studies) |
| **Within 24 hours** | 24 hours | Webinar registrants who didn't attend; how-to and template downloads; trial sign-ups on a free-mail address |
| **Nurture** | batch | Top-of-funnel downloads; broad educational sign-ups with nothing else; rows with no company or title that can't be filled |

Move a lead **up one** when the company fits, the title is a buyer persona, they have an open deal, they engaged before, or another signal fires (funding, hiring, a new leader). Move **down one** for a free-mail address with no company, a bot-like fill, or an existing customer (flag for the account team). Competitor staff come out entirely.

**What to do with each:**

| Urgency | Fit strong or likely | Fit unknown | Fit poor |
|---|---|---|---|
| Now | Personal reply now (write-outreach drafts it) | Personal reply plus discovery questions | Still reply — they asked; qualify on the call |
| Today | Same-day personal note | Same-day template with one personal line | Standard template |
| 24 hours | Next-day note on what they engaged with | Automated nurture | Automated nurture |
| Nurture | Nurture | Nurture | Nurture |

**Nothing that asked for something is dropped:** a poor-fit lead who requested a demo stays on the list with its action ("reply, qualify on the call"); only rows with no action at all go to `dropped.csv`. Leads that don't fit: right company, wrong person → ask them for an introduction; close but not yet (too small, too early) → nurture and re-check after funding, a headcount jump, a new leader, or 6 months; clearly outside → a polite no.

## 5. Deliver

Start and end with run-memory (job `lead scoring`, [run-memory.md](run-memory.md)): the last record says whether the previous "answer first" leads were answered and what came of them, when the marketer reported it.


The list section of the report (output-format.md) opens with "**Answer first:** the <n> 'now' leads" with why, then the calibration table, the counts by tier and urgency, what was dropped and why, and the rules used. `list.csv` gets the original columns plus `tier, fit_score, fit_reason, confidence, urgency, lead_age, overdue, action, is_free_email, region_flag, consent_basis` (`consent_basis`: `asked-us` for demo requests, sign-ups and form fills — they contacted the brand, so replying is not cold outreach; `event-list` for lists the marketer collected; `unknown`). Consumers (free-mail sign-ups with no company, waitlists of individuals) are scored for **who to talk to** — never enriched, never turned into an outreach list; replies go only to people who asked to hear from the brand, and only through its own channels. The rows are ledgered (`list_id` = the upload's name and date). Offer, as a decision: replies drafted for the "now" and "today" leads (write-outreach's inbound-replies mode, which reads `consent_basis`). The brand copy of the report holds counts, rules and the reasons in general terms — **no person's name or row**; the calibration table lives only in the local file and `list.csv`.
