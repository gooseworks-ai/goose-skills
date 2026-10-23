# Test by hand: learn-my-brand

## Setup
1. Connect GooseWorks **staging** to your agent.
2. Link the playbook: `ln -s "$PWD/marketing-agent/unreleased/learn-my-brand" ~/.claude/skills/learn-my-brand`
3. Pick a brand the team knows deeply, with the documents and links the founder would really hand over. Run it twice more on: one regulated brand (skincare or supplements; staging's Personal Day works) and one B2B brand. Not only a well-known DTC brand.

## Part 1: the intake run

Say "Learn my brand" and answer as the founder would.

It must:
- Read the brain first and ask for documents before any question; import what you hand over.
- Ask only gaps, as drafts to confirm; about 15–20 decisions and 20–30 minutes in total (basics 5–8 decisions); under time pressure, the shortcuts in SKILL.md's time budget. Never ask a fact the site, the brain or a document already holds.
- Surface at least one contradiction if one exists (site vs ads, old vs new) with both sides and a source; never resolve it silently.
- Treat research's "approved" claims as candidates: on Personal Day, flag at least "Rated 4.9 out of 5 stars 234 Reviews" (needs a capture date and review-by), the press quotes (need article and date), and the value props "100% free of acne-triggering ingredients" and "Dermatologist-developed & 6x award-winning" (need proof or rewording).
- Load the skincare rule pack and say once that this is not legal advice.
- Stop twice for sign-off: claims (by risk tier, high-risk one at a time with proof or "no proof on file") and voice (triad test, keep-or-kill, then the whole guide).
- Record unknowns with the playbook that will ask, and never guess.
- End with a read-back screen and three probes answered from a fresh read of the brain.

Fails if: it asks a known fact, invents a claim, proof, customer or number, accepts one "ok" for a long claims list, writes an unconfirmed fact as the owner's correction, or never stops for sign-off.

### Variant: the approver is not in the chat
Say "I'm the agency; the founder approves claims." Claims must end as "pending client approval", with a forwardable sign-off sheet, and the marker must carry `pending-client` (nothing beyond plain product facts approved).

### Variant: time pressure and resume
Halfway through the claims step say "I've got five minutes left." It must switch to the product-facts-only default, save what is confirmed, mark the record "in progress, resume at step N", and stop cleanly. In a new session, say "let's finish the brand setup": it must resume at step N without re-asking anything saved.

### Variant: client sign-off comes back
After the agency variant, paste: "From Dana (CEO), email today: approve D1 and D3, reject D2, voice guide is fine." It must map each answer to its row, record "Dana via <agency user>, email, <date>" with the words verbatim, write the approved claims and the marker, and leave D2 as not approved.

### Variant: pre-launch with no website
"Learn my brand — we launch our habit app in three weeks; there's only a TestFlight link and my Twitter." It must use the placeholder brand (not create a second one), not ask for a website setup it can't do, ask for 5–10 of the founder's posts as the voice sample, and default the launch date to embargoed.

### Variant: update mode
After a full run, say "Our free-shipping threshold changed to $35." It must ask whether the site already shows $35, touch only that fact (the one `Claims you may use` fact holding it, the brand record with the old line under Retired, and the marker re-written naming the new version — not 20 product rows), not re-run the intake, and list which saved outputs of other playbooks now rest on the old threshold.

### Variant: one-claim mode
Say "make-static-ads cut the line 'clinically proven to reduce breakouts in 7 days' — can we approve it?" It must run the claims gate for that line only: classify (clinical + efficacy, high risk, drug-claim territory for a cosmetic in the US), ask for proof, and recommend reject or a safe rewording.

### Variant: scoped sign-off from a maker
In a fresh session with no sign-off on file, ask for three static ads. The maker runs `../../../skills/claims-gate/SKILL.md` §4: it asks the owner to approve the 3–5 lines the ads need (each with type, proof on file, recommendation), records the approved ones as one `Claims you may use —` fact each plus a `signed-off` marker naming a new Brand record version, and uses only those lines. Then run this playbook's read-back: the scoped lines show as approved; everything else stays a candidate.

### Variant: client approver on a brand that is already signed off
After the client sign-off variant (some claims approved, `approver: client Dana`), have the agency user ask a maker for ads needing a new benefit line. claims-gate must read `approver: client Dana`, not ask the agency user, put the line on the sign-off sheet in a new record version, and keep the marker `signed-off` (the approved claims stay usable). It fails if the marker turns `pending-client` or the agency user's yes is recorded as approval.

## Part 2: the fresh-session check (the spec's Done-when)

Open a new session that reads only the brand brain (no pack file, no earlier chat). Ask ten questions. Pass: ≥ 9 correct with no question bounced to the owner, and zero hard fails. Hard fails: any unapproved, expired, out-of-scope or strengthened claim; any invented fact. "Unknown, assuming X" from the ledger counts as correct; a guess is a fail.

1. What is the hero product, the standing offer, its price and where it is sold?
2. Who is the customer and what is their top pain? (Top objection: "unknown — asked when we research your buyers" is a correct answer if that research hasn't been done.)
3. Our one-line positioning (or: is it unknown, and who will write it)?
4. Give three claims I can use in a US Meta ad for <product>, verbatim, with qualifiers.
5. Trap: can I say "clinically proven to clear acne" / "dermatologist recommended"? (Expected: no, why, and the approved alternative.)
6. Staleness: can I use the star rating and the press quote today? (Expected: checks the review-by date.)
7. Scope: can the US free-shipping line run in a UK email?
8. Voice: rewrite "Elevate your skincare journey with our game-changing formula" as an email subject, a TikTok caption and a support reply. (Owner blind-picks against a generic rewrite; banned-words check must pass.)
9. What must we never say, and who approves a new claim?
10. What logo file, colours and fonts do we use, what is missing, and what unknown would block a launch email next week?

Adversarial probes in the same session: ask for a line that uses a rejected claim; ask for a line using a banned word. Both must be refused or flagged with the approved alternative.

## Staging run log
See the bottom of this file (filled in by the builder session).

---

## Staging run log — 2026-10-16 (builder session, GooseWorks staging, brand: Personal Day)

Ran steps 1–2 for real (all free reads). Stopped before the first write (step 7), because writes would change a staging brand that other sessions are testing against. The writes are listed below as "would have run".

**Step 1 — reads (all returned, all free):**
- `brand_read` sections summary, kit, products, competitors, learnings, onboarding, accounts, sources, `detail: full` → 143 KB answer (too big for one read; the agent must read it in parts: kit full alone is ~70 KB; lean summary/kit/products/onboarding/learnings/accounts is ~10 KB, but lean competitors and sources add ~50 KB, and an unfiltered `media_list` is ~90 KB; the playbook now reads kit full once, competitors via `competitor_read`, sources only when needed, and media by kind). Kit: voice is a prose paragraph that already holds research's own Do/Don't lines and three site lines; tone and aesthetic adjectives; 5 value props; 6 proof points; 7 approved claims; palette, Inter typography (mapped, not the real font: kit fonts say "Exposure"); 20 products; onboarding profile empty (role, ad spend, goals, platforms missing); 1 learning (a `dont` from the user about video scripts); accounts none; 17 saved sources, all `confirmed: false`, incl. the brand's own TikTok.
- `knowledge_search` `["claim"]` → 7 "approved" claims, all created by research, `applicability: unknown`: "Rated 4.9 out of 5 stars 234 Reviews", "Free Returns", "Free Shipping on Orders $45+", four press quotes (Allure ×2, Byrdie, NewBeauty).
- `knowledge_search` `["document"]` "Brand record approved claims brand book" → empty (no brand record yet: a first run).
- `knowledge_search` `["evidence"]` → the same four press quotes as evidence rows, `approved_ad_claim: false` (so the brain holds them twice: as evidence not approved, and as claims approved).
- `competitor_read view: suggestions` → 5 unconfirmed (Skinfix, Naturium, Sofie Pavitt Face, La Roche-Posay unsure, Topicals unsure); tracked roster has 5+ from research.
- `media_list kind: logo` → 2 brand-scope logos plus 3 copies inside video projects (→ fixed: the playbook now passes `scope: "brand"`).
- `account_whoami` → `user_context` all null. (Round 2: no longer read; the founder's situation now comes from `brand/situation.md`.)

**What step 4 would flag on this brand (from the real data):**
- Value prop "100% free of acne-triggering ingredients — every single product": absolute + implied efficacy → reword ("formulated without <named list> of common pore-clogging ingredients") or proof.
- "Dermatologist-developed & 6x award-winning formulas": needs the named dermatologist and the six awards with years.
- "Clinically safety-tested, non-comedogenic": needs the test reports; "non-comedogenic" needs a comedogenicity test.
- Site line in the kit voice "Acne-safe, deep hydration that also prevents breakouts": "prevents breakouts" is US drug-claim territory for a cosmetic → never-say with alternative.
- Description "created by actress Lili Reinhart": a celebrity endorsement/association → needs the owner's confirmation of how it may be used in paid media.
- Rating "4.9 out of 5 stars 234 Reviews": needs platform, capture date, review-by (90 days).
- Press quotes: need article URLs and dates; paid-use permission for publisher names.
- "Free Shipping on Orders $45+": offer; needs current threshold and a review date.

**Would have run (writes, not executed):**
- `brand_update` `knowledge_intent: user_correction` + owner's words: `patch.kit` {voice, audience, description, value_props (rewritten), brand_type}; `patch.knowledge` {positioning, tagline}; `patch.products` offers; `patch.onboarding` {role, platforms}.
- `brand_update` `patch.facts`, one call through `../../../skills/save-learning/SKILL.md`: retire superseded facts; add `Not public —` (dont), `Banned words —` (dont, owner's words first), `Policy:` (must, operating rules only), one `Claims you may use — C<n> …` (must) per approved claim (free shipping and free returns included), one `Never say —` (dont) per never-say line, and the marker (`Claims sign-off (learn-my-brand, <date>, signed-off, approver: owner, voice: provisional, record "…")`). One idea per fact, read back and compared.
- Brand record through `../../../skills/save-to-brain/SKILL.md`: `file_write` (`brand/records/2026-10-16-v1.md`, brand coworker scope) + `media_upload` (scope brand, kind document, source workspace) + `knowledge_import` (`media_asset_id`, title "Brand record — Personal Day — 2026-10-16 v1") + `job_get` (`kind: knowledge_ingest`). (Route changed from inline bytes to the workspace after round 3, for hosts with no shell.)

**Not verified on staging.** Creating a throwaway staging brand for a write test was blocked by this session's permission check (shared resource). Settled since by the cross-set contracts review (server code): facts need `knowledge_intent: user_correction` (refused without it), are stored as the user's and never overwritten by the distiller; deleted media drops out of search. (Today's text-length cut is handled inside `../../../skills/save-learning/SKILL.md` until the Brand Brain rebuild removes it.) Still unverified: whether retired facts are hidden from every read, and which voice field `kit.voice` shows.
