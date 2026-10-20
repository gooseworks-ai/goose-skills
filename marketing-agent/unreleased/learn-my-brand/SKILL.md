---
name: learn-my-brand
description: >-
  Learn my brand once and stop asking me every time. Use when someone says learn my brand, set up my brand,
  here's our brand book, remember how we talk, what can we claim, can we say this, approve our claims,
  sign off our voice, our price or product changed, the client approved the claims, pick up where we left off,
  or check our claims are still current. Reads what GooseWorks already found about the brand, asks only the
  gaps as drafts to confirm, audits every claim (including ones research marked approved) and gets the ones
  that matter signed off with proof, scope and review date, turns the voice into rules the owner confirms,
  checks logo, colours and fonts, and saves it all as it goes so every other job loads it instead of asking.
  Ends with an unknowns list and a read-back. Not for who our customers are and what they say (use
  research-audience) or writing positioning from scratch (not covered yet).
---

# learn-my-brand

The front door. GooseWorks' server researches the brand and stores the kit; this playbook does what only the owner can: confirm what is true, decide what may be claimed, say how the brand sounds, and record what nobody knows yet. Every other playbook reads what it saves, through `../../skills/claims-gate/SKILL.md` and `../../skills/voice-card/SKILL.md`.

Talk to the owner about their brand, never about tools, ids, fields or other playbooks.

## What you get

- **A signed-off claims list:** each claim the brand may make, verbatim, with proof, scope (products, markets, channels), qualifier, review date and approver; every candidate not approved, with why, what would unlock it and a safe alternative; the never-say list tagged law / platform / owner.
- **A confirmed voice:** personality is/is-not, 3–5 rules with real do/don't pairs, banned words, terminology, how it flexes by channel and speaker.
- **Confirmed basics:** what we sell and the hero offer, who it is for, company type and stage, who approves, what buyers use instead, anything not to say in public.
- **An unknowns ledger:** each gap, what it blocks, the assumption in use, and when it will be asked.
- **All of it saved as it is confirmed**, plus a one-screen read-back the owner checks.

**Time budget:** about 20–30 minutes and 15–20 decisions: basics 5–8 decisions, claims 10–15 minutes, voice 5–8 minutes, kit 2 minutes. What doesn't fit is recorded as "not approved yet", provisional or unknown, never rushed. **Under time pressure:** basics as one confirm block; claims fall back to product facts and current offers, plus one yes/no on the rewritten value props and description (the ad engine reads them); voice is kept provisional (nothing voice-related is written until confirmed); the kit check moves to the record. Save; the record says where to resume.

## Before you start

1. **Connection.** No `gooseworks:` tools (after one `gooseworks:tools_load` for a missing group: brand, media, files, campaigns, automation) → say only: "Connect GooseWorks first — I learn and save your brand through it." Nothing else runs.
2. **First call** (unless already made in this conversation): `gooseworks:get_started` with the owner's words and `wants: "more"`. Use its answer only to settle setup and which brand; keep any card to one line and continue here.
3. **Pick the mode:**
   - **Full run** — first time, or "learn my brand". All steps.
   - **Resume** — the brand record's status says "resume at step N". Show what is saved; continue from step N.
   - **Update** — "our price changed", "new product", "we rebranded", "this is wrong". Step 1 with the kit lean; change only the affected facts or claims (the matching parts of steps 3–7); then list what else still says the old thing (`gooseworks:knowledge_search` with the old wording, `source_types: ["learning", "creative", "document"]`; `gooseworks:campaign_read`).
   - **One claim** — "can we say this?", or a line another job left out for lack of approval. Step 4 for that line only; save.
   - **Client sign-off back** — the approver's reply to the sign-off sheet, pasted or forwarded. Map each answer to its row, record it as "<name> via <user>, <channel>, <date>" with their words verbatim; save.
   - **Sweep** — "check our claims are still current", or the monthly reminder. List claims past their review date, offers past their end date and open contradictions; re-confirm with the owner (step 4); save. A scheduled sweep only lists; it never approves.
4. **Find the brand.** `gooseworks:brand_read` with no brand lists the brands (note each `coworker_agent_id`: every file this playbook writes uses that brand coworker scope; no coworker → default workspace with paths prefixed `brands/<brand-slug>/`, and say so once). Confirm which brand when there are several.
5. **Set up only if needed.** A brand with no website and no research (`research_status` "none") is a placeholder: run `gooseworks:brand_setup` (`status` first, then its `next_step`), answering its questions from what the owner already said. Setup takes a website or an Apple App Store link; with neither (TestFlight, an Amazon storefront, social profiles only), rename the placeholder with the owner's yes and work from their description, documents, pasted listings and posts. Never create a second brand beside a placeholder.
6. **Don't redo research.** If it is still running, say so in one line and use what is ready (`research_ready`). The server owns the website read, ad-library presence, review import and the asset kit.

## Steps

### 1. Read what the brain already holds
Load `references/brain-map.md`. Read once, in parts (a real DTC brand's full kit is about 70 KB):
- `gooseworks:brand_read` `sections: ["kit"]`, `detail: "full"`, once per run (lean in update and one-claim modes).
- `brand_read` `sections: ["summary", "products", "onboarding", "accounts", "learnings"]` lean (lean returns every `must`/`dont`); `sources` alone when step 2 needs it; `product_ids` in batches only when the claims audit needs a description.
- `gooseworks:knowledge_search` `["claim"]` (what the brain calls approved), `["document"]` (a brand book), `["evidence"]`.
- `gooseworks:competitor_read` (tracked and `view: "suggestions"`); `gooseworks:media_list` `scope: "brand"` with `kind: "logo"`, then `kind: "document"`.
- Workspace (coworker scope): the current Brand record (the highest `v<N>` in `brand/records/`) and `brand/situation.md` (the founder's situation from a where-to-start visit; only its "Founder said" lines count as the owner's words, and you confirm them), with `gooseworks:file_list` / `file_read`. Never from search snippets.

Build a private working ledger: each of the 23 sections in brain-map.md marked **given**, **found** or **unknown**, with its source. An earlier record means update or resume: start the ledger from it.

### 2. Take in what they already have
One message: "Before I ask anything: send any brand book, deck, messaging doc, price sheet or claims evidence you have, and I'll read it first." Files the host can upload: `gooseworks:media_upload` (scope brand, kind document) → `gooseworks:knowledge_import` → `gooseworks:job_get` (`kind: "knowledge_ingest"`, `brand_id`). A host that can't upload: read the file in the chat and tag what you use `[owner's doc: <title>]`. A public document URL: `knowledge_import` with `url`. Any answer showing a price → stop and ask; website-page and saved-source imports are optional here.

Pre-launch or little copy: ask for 5–10 of the founder's own posts or messages as the voice sample. In the same message, list the brand's own saved sources (`sources`, relationship `self`, `confirmed: false`) and ask whether each is really theirs.

### 3. Confirm the basics
Load `references/intake-craft.md`. Settle only its "settled here" facts, each as a draft to confirm; everything else goes to the unknowns ledger with when it will be asked. Company-type questions only where they change a claim, an offer or a rule now. Detect the category; if regulated, load `references/category-rules.md` (skincare with acne actives: ask per product whether it is sold as an OTC drug). Surface every contradiction with both sides, source and date; never pick silently (precedence: owner > owner's documents > owner's earlier rules > site > research). Ask who approves claims and voice: if not the person here, new lines go to a sign-off sheet for the approver (claims already approved stay approved), while facts the person here states are recorded in their words and a claim they say is false is pulled now. Answers the founder already gave in this conversation (goal, budget, dates) go into the record's business facts, not asked again. Track the rivals or alternatives they name with `gooseworks:competitor_save` (free; never remove one here). **Save** (step 7).

### 4. Claims audit and sign-off — approval gate 1
Run `atoms/claims-audit` (loads `references/claims-craft.md`). Every claim-shaped line in the brain is a candidate, wherever it sits; a research label of "approved" is not a sign-off. Triage to the budget: low-risk facts and current offers in one batch; medium in visible groups of 3–5; high-risk one at a time for the five or so with the most reach; every other high-risk line recorded "not approved yet" without asking. Draft the never-say list (law, platform, owner; each with a safe alternative); ask once what must never be said publicly, and until when; say once this is not legal advice. Nothing is approved without the approver's own words. **Save** (step 7).

### 5. Voice — approval gate 2
Run `atoms/voice-calibrate` (loads `references/voice-craft.md`): start from the brain's voice read, the owner's earlier rules and 6–10 real lines, each screened against the claims and never-say lists; triad test, keep-or-kill, then the whole guide on one screen. The owner's explicit yes confirms it; a founder's personal account also gets a voice card (`../../skills/voice-card/SKILL.md`). **Save** (step 7).

### 6. Check the kit
Show the logo (`logoConfidence`), palette and fonts; flag clashes (kit `fonts` vs `typography`). List only what is missing or wrong. Primary and accent colour via `gooseworks:brand_update` `patch.kit`; a logo file via `gooseworks:media_upload` (kind `logo`); the full palette and real fonts go in the brand record. Product photography gaps: mention, don't fix.

### 7. Save — after steps 3, 4 and 5, and once at the end
Run `atoms/brain-write-back`. It writes everything confirmed and not yet written: typed fields, then the Brand record version, then the learnings (claims one per fact, plus the marker), and it reads them back. Report anything that did not save.

### 8. Read back and prove it learned
Re-read fresh, not from this conversation: `brand_read` kit lean and learnings, and the Brand record the marker names (`file_read`). Check one active marker and no retired claim text. Show one screen: what every job will now work from (basics, approved claims, voice in three lines, kit); what is not approved and how to unlock it; the unknowns and when they will be asked; anything not saved. Then answer three probes from the fresh read without asking the owner: (1) a line using a rejected claim — refuse it and give the approved alternative; (2) one generic line rewritten as an ad hook and a support reply in the confirmed voice; (3) the logo, colours and fonts. If a probe needs this conversation, fix the save. Offer once: "Want a monthly reminder to check claims that are about to expire?" On a yes, schedule a paused, list-only sweep (`gooseworks:automation_upsert`, or the host's scheduler) after stating any credit cost.

## Approval gates

1. **Claims.** Nothing is approved without the approver's own words: low-risk facts and current offers in one batch, medium in visible groups, high-risk one at a time. If the approver is not here, new lines wait on the sign-off sheet; claims already approved stay approved.
2. **Voice.** The owner confirms the guide is "us" before it is saved.
No money moves and nothing is published. Paid imports are optional and need a yes to the price first.

## Output and write-back

The brand brain, through `atoms/brain-write-back`:
- **Kit and knowledge:** voice summary, audience, description, value props (only approved claims), brand type, positioning (the owner's one-liner), tagline; products' offers, notes and ad eligibility; onboarding role and platforms.
- **Learnings, one idea each, through `../../skills/save-learning/SKILL.md`:** one `Claims you may use —` fact per approved claim (offers and policies the brand states in copy included), one `Never say —` fact per never-say line, `Not public —`, `Banned words —`, `Policy:` for operating rules, and the marker: `Claims sign-off (learn-my-brand, <date>, signed-off|pending-client|not-signed, approver: owner|client <name>, voice: confirmed|provisional, record "<title>")`. Full detail and proof live in the record.
- **Brand record** (`brand/records/<YYYY-MM-DD>-v<N>.md`, imported as a brand document): approved claims with variants and proof, the sign-off sheet, not-approved and retired claims, voice status and the full banned list, never-say, business facts, contradiction decisions, palette and fonts, unknowns.
- Tracked competitors and uploaded brand files.

Readers: every playbook that writes copy or states facts, through `../../skills/claims-gate/SKILL.md` (claims) and the kit voice plus `../../skills/voice-card/SKILL.md` (voice); research-market from the confirmed audience; research-competitors from the tracked rivals; this playbook's own update, resume and sweep modes from the record. Where the server cannot store something yet, the record holds it; see `server-needs.md`.

## Done when

The owner has signed off the claims that matter and the voice (or they are pending client approval with the sheet handed over), everything is saved, and the read-back's three probes are answered from a fresh read without asking anything. The real test: in a fresh session that reads only the brand brain, ten ordinary brand questions come back right without bouncing to the owner, and no unapproved claim appears (`tests/test-by-hand.md`).

## Out of scope

- The website read, ad-library presence, review import, the asset kit — the server's research.
- Positioning from scratch — not covered yet (write-my-positioning, backlog); the owner's own one-liner is recorded, or it stays unknown.
- Customer research and the voice-of-customer bank — research-audience. Competitor research — research-competitors.
- Goal, budget, margins, spend caps, this week's focus — where-to-start, plan-campaign, run-paid-campaigns.
- Inventing claims, customers, proof or numbers. Any creative. Legal advice.
