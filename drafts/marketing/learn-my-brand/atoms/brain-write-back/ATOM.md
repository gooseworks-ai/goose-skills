---
name: brain-write-back
description: >-
  Internal step of learn-my-brand (hidden). The save protocol. Writes everything confirmed and not yet written
  into the brand brain — typed fields, the Brand record version, then the learnings with the claims contract and
  the marker — reads it back, and reports what did not save. Runs after steps 3, 4 and 5 and once at the
  end.
---

# brain-write-back

Load `../../references/brain-map.md` (which home each item goes to) and `../../references/brand-record-template.md`. Field names, limits and encodings come from the live schema.

## Input
Every item in the working ledger that is confirmed and not yet written, whichever step confirmed it: the text, the words of whoever confirmed it (owner, the person in the chat for facts they state, or the approver), the date, its section and its home. Plus the claims status (`signed-off`, `pending-client`, `not-signed`; see the status rule in step 3), the voice status (`confirmed`, `provisional`) and the step to resume at.

## Order (so the marker never names a record that failed to save)

### 1. Typed fields
`gooseworks:brand_update` with `knowledge_intent: "user_correction"` and `user_statement` = only words the confirming person typed, ideally an approval that stands on its own ("yes, save this voice guide as ours"); never your draft.
- Kit: voice summary (personality, the rules with their pairs, terminology, channel flex, and the full banned list under "Banned:" — siblings read the kit voice), audience, description and value props rewritten so they hold only approved claims, brand type, primary and accent colour. The rewritten value props and description need the owner's yes even under time pressure (one yes/no: the ad engine reads them); on a no, write them as `agent_proposal` and list "kit wording still carries unapproved claims" in the record's unknowns.
- Knowledge: positioning (the owner's own one-liner only), tagline.
- Products: offers with end dates, notes (hero, what it does not do), `ad_eligibility` with `ad_eligibility_reason`.
- Onboarding: role, platforms the owner named.
- Not explicitly confirmed → don't write it, or write it as `agent_proposal` with a `rationale` and tell the owner it waits for their acceptance in the GooseWorks app. Provisional voice → nothing voice-related is written; it lives in the record.

### 2. Brand record version
- The current record is the highest `v<N>` in a `gooseworks:file_list` of `brand/records/` (brand coworker scope). Read it in full (`gooseworks:file_read`); if the marker names a lower version, use the highest anyway (a scoped sign-off or a pending-client save may have added one) and the marker is rewritten below. Apply this save's changes; carry every old row over, change it deliberately, or move it to Retired. Set the status line (`in progress, resume at step N` or `complete`; list anything that failed to save) and the `Claims:` / `Voice:` tokens.
- Save through `../../../../skills/save-to-brain/SKILL.md`: path `brand/records/<YYYY-MM-DD>-v<N+1>.md`, artifact `Brand record`, title `Brand record — <Brand> — <YYYY-MM-DD> v<N+1>`, tags `[learn-my-brand, brand-record]`, `versioned: supersede`. It writes, imports, waits, deletes the older versions' documents and verifies. If any answer shows a price, stop and ask.
- If it fails, stop here: write no learnings that would name this version.

### 3. Learnings (the claims contract, by `../../../../skills/save-learning/SKILL.md` and `../../../../skills/claims-gate/SKILL.md` §5)
One `brand_update` `patch.facts` call through `../../../../skills/save-learning/SKILL.md`, `knowledge_intent: "user_correction"`, the confirming person's words as `user_statement`. **One idea per fact**: never a list of claims or rejected lines in one fact, so each can be found, merged and retired on its own (full detail lives in the record).

1. **Retire** (`{id, active: false}`): the old marker; changed claims; `Never say —`, `Policy:`, `Not public —` and `Banned words —` facts only when they changed; an email-lifecycle `Standing offer:` fact whose offer the owner just changed.
2. **Add** (only what is new or changed):
   - `Not public — <item> until <date> [owner, <date>]` — `kind: "dont"`, one per item, only for things a writer could plausibly mention (an unannounced launch, a customer's name).
   - `Banned words — <the owner's own words first>, … [owner, <date>]` — `kind: "dont"`, one fact holding the full banned list (owner's plus the standing list); the same list is in the kit voice under "Banned:" and in the record's Voice section.
   - `Policy: <rule> [owner, <date>]` — `kind: "must"`, one rule per fact, operating rules that are not ad copy only ("never discount below 20%", "never advertise sold-out products"). Offers and policies the brand states in copy are claims.
   - `Claims you may use — C<n> "<exact wording>" · <scope> · <qualifier or —> · review <YYYY-MM-DD>` — `kind: "must"`, one per approved claim.
   - `Never say — <one pattern> (<law|platform|owner>). Say: <alternative>.` — `kind: "dont"`, one per never-say line; the record keeps the table with its reasons.
   - The marker — `kind: "must"`: `Claims sign-off (learn-my-brand, <YYYY-MM-DD>, <signed-off|pending-client|not-signed>, approver: <owner|client <name>>, voice: <confirmed|provisional>, record "Brand record — <Brand> — <YYYY-MM-DD> v<N>"). Only "Claims you may use" rules are approved.` The marker itself says everything else is not approved; there is no separate "not approved" fact.

**Status rule** (the same everywhere): `signed-off` once the approver has approved at least one claim — it stays `signed-off` when new lines wait on the sign-off sheet; `pending-client` when nothing is approved yet and the approver is someone not in the chat; `not-signed` when nothing is approved yet otherwise (nobody asked, or the approver approved nothing). `approver:` is `owner` when the owner approves claims, or `client <name>` when someone outside the chat does.

3. **Read back** `gooseworks:brand_read` `sections: ["learnings"]` (lean returns every `must`/`dont`), as `../../../../skills/save-learning/SKILL.md` does: each fact stored, exactly one active marker, no retired text still active (if a retired fact still shows, delete it with `delete: true`; the record keeps the history). If the call failed, retry it before anything else.

### 4. Report
What saved where, what did not and why; unsaved items also go in the record's status line on the next successful save.

## Rules
- `user_statement` never holds your wording or research text.
- Never store brand knowledge in `user_context`, in the organization's shared scope, or in a local file.
- Never write an unconfirmed fact as a correction.
- The claims status is about claims, not about where the run is: after gate 1 it is `signed-off` even if voice is still to come.
