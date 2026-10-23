---
name: claims-gate
description: >-
  Checks every claim in a piece of copy (ads, emails, posts, pages, scripts, briefs) against the
  claims the brand has approved. Keeps, rewrites or cuts each line, and lists the proof that would
  bring a cut line back. When a line the copy needs has no approval, it asks for a short sign-off on
  the 3 to 5 lines that matter and records the answer. Use alone when you already have the copy and a
  brand set up; otherwise run the playbook for the job (e.g. make-static-ads, make-content,
  write-outreach).
version: 0.1.1
---

# claims-gate

One contract for every playbook that writes copy, scripts, briefs, emails, posts, pages or captions. Only this atom ever writes a claim as approved; claims and markers already in the brand (from the GooseWorks app or an earlier brand pass) are read the same way. The calling playbook keeps its own extract step (on-image text, video scenes, page sections) and hands this atom the spans.

Say it to the human in plain words ("two lines need your OK before I use them"), never as tool, fact or playbook names.

## 1. Load the contract (once per job)

**Which path.** When `brain_*` tools are listed, the **brain path** (step 5) decides which claims are approved, and the marker below is not required. Otherwise (production today) the **older path** (steps 1–2) decides. Steps 3, 4, 6, 7 and 8 apply on both paths.

**Local mode** (no GooseWorks, [the `marketing-guide` skill](../marketing-guide/SKILL.md) §5): the contract is `gooseworks-local/<brand-slug>/claims.md`, read and written by [`local-claims.md`](local-claims.md) (next to this file) in place of steps 1–3 and 5. Only a row whose newest status is `approved` and that passes its checks (scope, date, the approver's own words, proof reopened) is usable; declined, pending and retired rows never are. The `dont`s and `must`s come from `brand-notes.md`. §2–4 run as written, with `local-claims.md` for who approves and the record.

1. `gooseworks:brand_read` `sections: ["learnings"]` (lean is enough: it returns every `must` and `dont`).
2. **Older path:** find the **marker**: a `must` fact starting `Claims sign-off (learn-my-brand,` (a fixed format: the opening names its first writer and stays as it is). Read its status token and match it exactly:
   - `signed-off` → the claims you may use are the `Claims you may use —` facts, one claim per fact: verbatim, within the scope written in it, before its review date, with its qualifier.
   - `pending-client` or `not-signed`, or no marker → no claim is approved yet beyond plain product facts.
   - `approver:` tells you who may approve new lines (§4.2).
   - `voice: provisional` in the marker → label drafts "voice not yet confirmed".
3. **Variants and proof** (only when you need a variant or must show proof): `gooseworks:file_read` the current Brand record — the highest `v<N>` in a `gooseworks:file_list` of `brand/records/` (the scope in [the `marketing-guide` skill](../marketing-guide/SKILL.md) §2). Never use search snippets of it: they can come from its "Not approved" or "Retired" tables.
4. **Never approved, whatever the label:** kit `approvedClaims`, `proofPoints`, `valueProps`, `description`; `knowledge_search` `["claim"]` rows; search snippets of any document; the live site; press quotes, reviews or testimonials not on the list; a yes in chat that did not go through §4 below.
5. **Brain path (when `brain_*` tools are listed).** The brain keeps claims with a status (chapter 13, "What we can claim"; older `Claims you may use —` rules sit in chapter 14 with a status too). A claim is usable only if its status is `confirmed` **and** you have opened the full record with `gooseworks:brain_open` and checked it: the exact wording, its scope (product, market, channel), its qualifier, its evidence, and that it hasn't passed its `valid_until` or `recheck_at`. Use it verbatim, within scope, with its qualifier. No marker is needed. A `found`, `guess` or waiting claim is not approved, whatever its wording or whoever said it. If a legacy marker also exists and it and the brain disagree about a line (narrower scope, a retired or declined line), the stricter one wins and you say so. Playbooks never read claims from the brain themselves; they consume them only through this atom.
6. **Always apply** every `dont` (never-say, not public, banned words) and every `must` (policies, qualifiers, terminology).
7. **Plain product facts** are always usable: product name, price, size, listed ingredients or features, how to use, current policies stated in a `must` fact. Never benefit or outcome wording.
8. **Current offers and prices:** the product record's price and `offers` count as plain facts only when the human confirms in this job that they are live (offers carry their end date). Nothing else about an offer ("best price ever", "limited") is a plain fact.

## 2. Check the spans

For each claim-like span the caller extracted (copy, headline, on-image text, badge, script line, subject line, caption, page sentence, and what a picture implies):
1. **Puffery or claim?** If a test could prove it false, it is a claim ("lasts 48 hours", "softer than cotton"). Feel and taste words that promise no outcome are puffery ("light, fresh feel").
2. **Type and risk** from `claim-types.md` (next to this file). Regulated categories (health, beauty, supplements, food, finance, kids) are verbatim only.
3. **Quoted claims are the brand's claims:** a press quote, review or testimonial reused in copy must pass for the claim inside it.
4. **Implied claims count:** a lab coat, a before/after, a "clinically" badge, a product name stretched into a promise.
5. **Named customers, logos and backers.** A named customer, logo, customer result or case study is usable only when the brand confirmed it (a usable claim under §1) — never from the site, the kit or a search hit alone. A plainly test-named brand ("Test Co", "Demo Brand", "asdf") is never offered. A name that matches **another brand in the same workspace or organisation** (the `brand_read` brand list) is a **likely test brand** — but agencies keep real clients side by side, so ask the human once: "<name> is another brand in your account. Is it a real customer that agreed to be named?" Until that yes, cut it and never offer it as proof; after it, it goes through §4 like any customer line. "Backed by <investor>", "funded by" and "used by <company>" need a dated public source (a press release, the investor's own portfolio page) before §4 may offer them; without one, cut.

## 3. Act and report

- **Keep** — the span is a usable claim (verbatim or a listed variant, in scope, in date, qualifier attached and legible) or a plain product fact.
- **Rewrite** — to a usable claim, a plain product fact or puffery. Never strengthen.
- **Cut** — anything else. Each cut is listed as `line → where it was → why → the proof or OK that would restore it` (e.g. "'won't break you out' → ad 3 headline → efficacy claim, not approved → a non-comedogenic test report, or your OK below").
- **Never-say** — cut and say plainly it is a legal or platform line, not a matter of taste.

Give the result in one short line per asset in chat; the cut list goes in the caller's file.

## 4. Scoped sign-off (when the job needs lines nobody has approved)

Run it when a line the job depends on is not usable under §1: on the older path, when the marker is not `signed-off` or the line is not on the list; on the brain path, when the line is not a confirmed brain claim (no marker is needed when it is). It approves only what this job needs.

1. **Pick the 3–5 load-bearing lines** — the benefit line, the hook's promise, the offer — not everything the job could say; never a test-named brand, a likely test brand only after the human's yes, and a backer or customer line only with its source (§2.5). Prefer the brain's own wording (value props, product descriptions) over new wording.
2. **Check who may approve.** Read the marker's `approver:`. No marker: ask once who approves claims (local mode: `local-claims.md` § Who approves, which also keeps the answer). If it names a client, or the person says someone else approves claims, don't ask the person in the chat for these lines: use the claims already approved plus plain product facts, add the new lines to the Brand record's "Decisions needed" sheet for the approver (saved as §5 step 1; local mode: its `pending` rows), and rewrite the marker naming the new version, `approver: client <name>`, by §5's status rule. `user_statement` is the person's words (e.g. "Dana approves claims").
3. **Put them to the human in one message**, each line with: the exact wording, what kind of claim it is, the proof on file or "no proof on file", and your recommendation (approve / approve with this qualifier / reword to … / leave out). Say once that this is not legal advice.
   - High-risk lines (efficacy, clinical or expert, comparative, health, environmental, testimonials implying results) need proof on file. The owner's word is enough only for a verifiable fact about the business (who formulated it, where it is made, which awards). Without proof, recommend leaving it out or a safer wording.
   - Ask for an approval that stands on its own: "Yes, approve 1, 2 and 4." A bare "ok" to a list is not a sign-off.
4. **If they decline or don't answer,** ship plain product facts and say which lines were left out and why.
5. **Record the answer** (§5) before any line is used.
6. **Brain path: a yes in chat does not make a line usable yet.** Saving can't approve a claim: every agent save is *found* until the human confirms it in the GooseWorks app (found vs confirmed: the marketing-guide §1.4). So after §5, the new lines stay out of anything published, sent, launched or handed to a maker as final, until the brain shows them `confirmed`. Say so in one line ("Approve these 2 lines in GooseWorks and I'll use them"), relay the link if the save returned one, and ship this job with the confirmed claims and plain product facts. Drafts may show a waiting line, labelled "waiting for your yes", never as approved. The next run picks the line up once it is confirmed.

## 5. Recording an approval (the exact contract)

**Local mode:** write one row per answered line by `local-claims.md` (status, the approver's words, evidence and permission; superseded rows retired), then read the file back; no marker, no Brand record. No files (hosted chat): its last section.

Write in this order; field names and limits come from the live schema. On the older path, the line is usable once step 3 reads it back. On the brain path, the same writes land as *found* and the line waits for the human's yes in the app (§4.6); never call it approved.
1. **Brand record.** `gooseworks:file_read` the current record (the highest `v<N>` in `brand/records/`; if the marker names a lower one, use the highest — the marker is rewritten below); if none exists, start one from `record-skeleton.md` (next to this file) with the status line "scoped sign-off only; full brand pass not done". Add each approved line to "Claims you may use" with type, scope, qualifier, proof, review date (offers: their end date; ratings, review counts and prices: 90 days; certifications: their expiry; awards: award year + 2; everything else: 1 year) and the approver's words; add declined lines to "Not approved" with what would unlock them. Save it as the next version (`<YYYY-MM-DD>-v<N>`) through the `save-to-brain` skill (`../save-to-brain/SKILL.md`) with `versioned: supersede`, title `Brand record — <Brand> — <YYYY-MM-DD> v<N>`, tags `[learn-my-brand, brand-record]` (the first tag is the record's fixed creator tag whichever playbook runs this, so save-to-brain supersedes older versions; keep it exactly).
2. **Facts**, through the `save-learning` skill (`../save-learning/SKILL.md`) (`knowledge_intent: "user_correction"`, `user_statement` = the approver's own words), in one call: retire (`{id, active: false}`) the old marker (this atom is the only writer that retires it), add one fact per approved line, `kind: "must"`, one claim per fact:
     `Claims you may use — C<n> "<exact wording>" · <products · markets · channels> · <qualifier or —> · review <YYYY-MM-DD>`
   and the new marker, `kind: "must"`:
     `Claims sign-off (learn-my-brand, <YYYY-MM-DD>, <signed-off|pending-client|not-signed>, approver: <owner|client <name>>, voice: <confirmed|provisional>, record "Brand record — <Brand> — <YYYY-MM-DD> v<N>"). Only "Claims you may use" rules are approved.`
   **Status rule** (the same everywhere): `signed-off` once the approver has approved at least one claim — it stays `signed-off` when new lines wait on the sign-off sheet; `pending-client` when nothing is approved yet and the approver is someone not in the chat; `not-signed` when nothing is approved yet otherwise (nobody asked, or the approver approved nothing). `approver:` is `owner` when the owner approves claims, or `client <name>` when someone outside the chat does. Keep `voice:` and `approver:` as the old marker had them unless this answer changes them (no marker before: `voice: provisional`). Never approve a line that matches a `Never say —` rule.
3. **Read back** the learnings (as the `save-learning` skill (`../save-learning/SKILL.md`) does): each new claim fact stored, exactly one active marker, the `Never say —` rules untouched and active. If the call failed, retry it before any line is used.
