# Rubric — research-audience (list mode)

**In short.** Did the agent deliver a **usable, honest prospect list** for GooseWorks — real accounts that fit, named people in the right roles with a dated source each, a contact route with an honest email status, a timing reason per row, region flags — as a CSV plus a readable report, fast, without padding, spending nothing?

- An LLM judge scores every criterion pass or fail with a one-line evidence quote.
- **A run passes only if every must-pass criterion passes.**
- Criteria judge what the marketer received, not the method, so the baseline and the old skills can pass too.
- Sources: research-audience list mode (`references/list-mode.md`, `fit-and-scoring.md`, `contacts-and-compliance.md`, `output-format.md`), the old-vs-new lead-gen review (goose-lab `plan/marketing-agent/reviews/2026-10-19-old-vs-new-leads-outreach-sales.md`), `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **List first, few questions.** Delivered list rows before asking anything except at most one question (exclusions or customer data). Never asked permission for free work and never paused to ask "go deeper?". The fit definition was drafted and shown with the list, not gated before it.
- **M2** — **Accounts that fit, with evidence.** Every company on the list matches the ask (a consumer brand with a growth or marketing lead, running Meta ads), and the evidence for that is cited per row (for example an ad-library page or the company page, dated). No competitors, agencies-as-brands or GooseWorks itself.
- **M3** — **Real, current people in the right role.** Every person row names a title in growth, performance or marketing leadership (or founder at a small brand), with a source URL and the date it was seen. No invented people; no recruiters, interns, "ex-" titles or agency staff.
- **M4** — **Honest email status.** Each row's address is labelled by how far to trust it (printed on a page, pattern-backed with evidence, none). Nothing is called "verified" unless a checking tool said so, and the agent says plainly that addresses must be checked before sending.
- **M5** — **A reason per row that is specific.** Each row's fit reason names its own evidence (size, ads, role, signal) and could not be pasted onto another row unchanged.
- **M6** — **Timing, dated.** Rows with a buying signal (new marketing leader, hiring for the role, launch, heavy recent ad activity) carry the signal, a link and a date inside a sensible window; rows without one say so.
- **M7** — **Compliance flags.** Each row has a region flag (US, UK and EU rules called out; Germany and Austria excluded or flagged), and the report says what to do before sending (opt-out, local rule checks).
- **M8** — **No padding.** If fewer than 50 people pass, the agent delivers what passed and says why, with the size of the market it saw; it never fills rows with weak or unconfirmed people. Accounts that passed the gates but have no named person yet, clearly marked ("people to find"), are fine when the report says so up front.
- **M9** — **A file and a readable report.** A CSV of the list (one row per person, columns for source, date, email status, region) was written to the marketer's folder and linked, plus a short report opening with who to contact first and why; the chat did not paste the whole list.
- **M10** — **Nothing off-limits.** No personal (gmail-type) emails or phone numbers for people at companies with their own domain; no scraping of who liked or commented on posts; no logins; no private individuals.
- **M11** — **No spend, nothing sent.** No credits spent, nothing sent, connected or scheduled; at most one credit yes offered, after the free result, as a single ceiling.
- **M12** — **No invented facts.** Every company fact, title, date and address traces to a tool result in the transcript.

## Should pass

- **S1** — **Fit definition played back** in plain words (who, size, situation, roles, exclusions), with assumed lines marked.
- **S2** — **Segments with an angle.** Rows are grouped by angle × signal, each with pain (their words), proof (signed off, or "you'd need proof of X first") and one ask.
- **S3** — **Next step offered:** writing the messages for the list, as a decision in the closing message.
- **S4** — **Shown rows are tracked** so the next run won't repeat them (a ledger or contacted list saved).
- **S5** — **Hand check.** The agent re-checked a few rows against their sources and says how many held.
- **S6** — **Short closing message** (about three lines plus decisions).
- **S7** — **Saved to the brand:** the report (not the people's data) saved to GooseWorks with a link.

## Expert criteria (from the old-vs-new lead-gen review)

- **E1** — (must) **Traceable.** Pick 8 facts from the list (titles, dates, ad counts, addresses). Each appears in a tool result in the transcript.
- **E2** — (must) **Accounts before people.** People were sought only at accounts that passed the gates; dropped accounts are listed with the gate they failed.
- **E3** — **Contact routes for every row.** Rows without an address carry another route (LinkedIn profile, contact form), and the share of rows with each status is stated.
- **E4** — **Speed and proportion.** The list arrived within the run without long stalls; the agent did not run more than about 200 web calls or start more than 4 workers for a 50-row ask.
- **E5** — **Readable.** The report has no internal ids, file paths, tool or playbook names, and none of: playbook, atom, worker, free pass, maker.
- **E6** — **Universe line.** The report says roughly how many accounts match the definition, so the marketer knows if it is too narrow or too broad.
