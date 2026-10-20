# Local claims (no GooseWorks)

Load in local mode (the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §5). It replaces SKILL.md §1 steps 1–3 and 5, the Brand record sheet in §4.2, and the writes in §5. Everything else in SKILL.md runs as written, with two local swaps, because local mode calls no `gooseworks:` tool:
- **§1.8 offers and prices** come from the live site and the marketer's yes in this job that they are live.
- **§2.5 named customers:** there is no brand list to compare with, so ask once per name whether it is a real customer that agreed to be named; until that yes, cut it.

**Fail closed.** Whenever the approver history or a row is missing, unclear or in conflict, no line that depends on it is usable. Ship plain product facts, say what is missing in one line, and ask once.

## The file

`gooseworks-local/<brand-slug>/claims.md`. Only this atom writes it. Read it in full before every write and read it back after. It has three sections.

### `## Who approves` — the approver history

One row per change of authority:

`A<n> · <owner | client <name>> · from <YYYY-MM-DD> · "<the words that set it>" (<who said them>) · active | retired <YYYY-MM-DD> (replaced by A<n>)`

- **Exactly one row is `active`.** A change appends a new `active` row starting today and marks the previous one `retired <today> (replaced by A<n>)` in the same write. Never delete or rewrite a row; retiring is the only edit.
- **Who may set it.** The first row takes the words of the person in this chat. A change takes the **active approver's** own words, by the same rule as a decision (§ Who approves, step 4). A request from anyone else to change it goes under `## Waiting for <the active approver>` as a waiting change, and the active row stands.
- **Older files.** A `Claims approver:` line in `brand-notes.md` from before this history existed becomes row A1 from its date on the next write.
- Zero `active` rows, two `active` rows, or dates that overlap → fail closed.

### `## Claims` — one row per decision

`C<n> · "<exact wording>" · <type> · <products · markets · channels> · <qualifier or —> · review <YYYY-MM-DD> · <status> · approver: A<n> · "<the approver's own words>" · <decision date> · evidence: <link or file, its date | none> · permission: <who agreed, to which use, date, where it is kept | n/a>`

- **Status** is exactly one of: `approved` · `declined (what would unlock it)` · `pending <approver>` · `retired (<why>, <date>)`.
- **One id per claim.** The same exact wording keeps its id on every run; a reworded line gets a new id. A new decision on a claim (withdrawn, narrowed to fewer channels, declined after an earlier yes, a new review date) is a new row with the same id. Then mark every older row of that id `retired (superseded by the <date> row, <date>)`. Never delete or rewrite a row; retiring is the only edit.
- **Proof-required rows** are the high-risk types in SKILL.md §4.3 and every named customer, logo, result or backer (§2.5). Their `evidence` names the source the approver saw: a link, or a file in the marketer's own folder, with the source's date. A named customer, logo, result or backer also fills `permission`: who agreed to be named, for which use, when, and where the agreement is kept. Never copy a document with people's details into `gooseworks-local/`; record where it lives. No evidence, or no permission where one is needed → the row can only be `declined` or `pending`.

### `## Waiting for <name>` — the pending-decisions record

The lines waiting for an approver who is not in this chat (§ Who approves).

## Reading it (every job)

For each line the job needs, take every row with its id or its exact wording. **The newest row decides.** If more than one row is still active for the same wording (a hand edit, two ids), the strictest wins: declined or pending beats approved, then the narrowest scope, then the earliest review date. Retire the others on your next write.

A line is usable only when its deciding row passes all four checks:
1. Its status is `approved`. Never `declined`, `pending`, `retired`, or a row with no status, whatever its wording says.
2. Its `approver:` names the history row that was active on its decision date, and the row quotes that approver's own words. A decision dated after its approver was retired is not a decision: treat the line as pending for the active approver.
3. It covers this use: the wording verbatim (or a listed variant), the product, market and channel inside its scope, before its review date, with its qualifier.
4. **Proof-required rows: reopen the proof this job.** The link or file still opens, and it still supports the exact wording and scope. A permission is still on record for this use. If any of these fails, the line is not usable: say what is missing ("I can't open the study behind 'clears acne in 7 days'. Send it again and I'll use the line.").

Everything else is cut by SKILL.md §3. The decline reason, or the missing proof, is what would restore it.

## Who approves (§4.2)

Read the active row of `## Who approves`. If there is none, ask once who approves claims and write row A1 with their words.

- **The active approver is the person in this chat:** §4.3–4.5 as written; record each answer as a row.
- **The active approver is someone else** (a client, legal, Dana): never take the lines from the person in this chat.
  1. Write each line as a `pending <name>` row under `## Waiting for <name>`: the wording, the type, the proof on file or "no proof on file", and your recommendation.
  2. Give the marketer that list as a short sheet to send to the approver.
  3. Ship this job with the usable lines and plain product facts.
  4. A pending row becomes a decision only on the approver's own words: the approver writing in this conversation, or their written reply (an email, a message, a signed sheet) pasted here or saved in the marketer's folder, quoted verbatim with its date and where it came from. A relay ("Dana said it's fine") is not a decision. Keep the row pending and ask for Dana's reply.

## Hosted chat with no files

Nothing can be saved. Give the whole file in chat, in the format above: the `## Who approves` history (with its active row) first, then the claims and the waiting lines. Say: "Paste all of this back next time, or I'll treat these lines as not approved."

Pasted text is read by the rules above, with three extra checks:
- **No history pasted, or one that fails its checks** (no active row, two active rows, overlapping dates) → fail closed: no pasted `approved` row is usable until the approver is settled again.
- **An `approved` row whose approver is not the person in this chat** counts as `pending`, unless that approver's own written reply is pasted with it (§ Who approves, step 4).
- **Proof** is reopened the same way.
