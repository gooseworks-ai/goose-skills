# Local claims (no GooseWorks)

Load in local mode (the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §5). It replaces SKILL.md §1 steps 1–3 and 5, the Brand record sheet in §4.2, and the writes in §5. Everything else in SKILL.md runs as written, with two local swaps, because local mode calls no `gooseworks:` tool:
- **§1.8 offers and prices** come from the live site and the marketer's yes in this job that they are live.
- **§2.5 named customers:** there is no brand list to compare with, so ask once per name whether it is a real customer that agreed to be named; until that yes, cut it.

## The file

`gooseworks-local/<brand-slug>/claims.md`. Only this atom writes it. Read it in full before every write and read it back after. One row per decision:

`C<n> · "<exact wording>" · <type> · <products · markets · channels> · <qualifier or —> · review <YYYY-MM-DD> · <status> · approver: <owner | client <name>> · "<the approver's own words>" · <decision date> · evidence: <link or file, its date | none> · permission: <who agreed, to which use, date, where it is kept | n/a>`

- **Status** is exactly one of: `approved` · `declined (what would unlock it)` · `pending <approver>` · `retired (<why>, <date>)`.
- **One id per claim.** The same exact wording keeps its id on every run; a reworded line gets a new id. A new decision on a claim (withdrawn, narrowed to fewer channels, declined after an earlier yes, a new review date) is a new row with the same id. Then mark every older row of that id `retired (superseded by the <date> row, <date>)`. Never delete or rewrite a row; retiring is the only edit.
- **Proof-required rows** are the high-risk types in SKILL.md §4.3 and every named customer, logo, result or backer (§2.5). Their `evidence` names the source the approver saw: a link, or a file in the marketer's own folder, with the source's date. A named customer, logo, result or backer also fills `permission`: who agreed to be named, for which use, when, and where the agreement is kept. Never copy a document with people's details into `gooseworks-local/`; record where it lives. No evidence, or no permission where one is needed → the row can only be `declined` or `pending`.

## Reading it (every job)

For each line the job needs, take every row with its id or its exact wording. **The newest row decides.** If more than one row is still active for the same wording (a hand edit, two ids), the strictest wins: declined or pending beats approved, then the narrowest scope, then the earliest review date. Retire the others on your next write.

A line is usable only when its deciding row passes all four checks:
1. Its status is `approved`. Never `declined`, `pending`, `retired`, or a row with no status, whatever its wording says.
2. Its approver was the recorded claims approver (`Claims approver:` in `brand-notes.md`) on its decision date, and the row quotes their own words.
3. It covers this use: the wording verbatim (or a listed variant), the product, market and channel inside its scope, before its review date, with its qualifier.
4. **Proof-required rows: reopen the proof this job.** The link or file still opens, and it still supports the exact wording and scope. A permission is still on record for this use. If any of these fails, the line is not usable: say what is missing ("I can't open the study behind 'clears acne in 7 days'. Send it again and I'll use the line.").

Everything else is cut by SKILL.md §3. The decline reason, or the missing proof, is what would restore it.

## Who approves (§4.2)

Read `Claims approver:` in `brand-notes.md`. If there is none, ask once and write the answer there: `Claims approver: <owner | client <name>> — "<their words>" <YYYY-MM-DD>`.

- **The person in this chat approves:** §4.3–4.5 as written; record each answer as a row.
- **Someone else approves** (a client, legal, "Dana approves claims"): never take the lines from the person in this chat.
  1. Write each line as a `pending <name>` row under `## Waiting for <name>` in `claims.md`: the wording, the type, the proof on file or "no proof on file", and your recommendation. This is the pending-decisions record.
  2. Give the marketer that list as a short sheet to send to the approver.
  3. Ship this job with the usable lines and plain product facts.
  4. A pending row becomes a decision only on the approver's own words: the approver writing in this conversation, or their written reply (an email, a message, a signed sheet) pasted here or saved in the marketer's folder, quoted verbatim with its date and where it came from. A relay ("Dana said it's fine") is not a decision. Keep the row pending and ask for Dana's reply.

## Hosted chat with no files

Nothing can be saved. Give the rows in chat in the format above, and say: "Paste these back next time, or I'll treat these lines as not approved." Rows pasted back are read by the rules above, and their proof is reopened the same way. A pasted `approved` row whose approver is not the person in this chat counts as `pending` unless the approver's own written reply is pasted with it (§ Who approves, step 4).
