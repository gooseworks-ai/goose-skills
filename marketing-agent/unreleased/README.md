# Unreleased playbooks

**In short**
- Three playbooks are built but **held back from the first release**: learn-my-brand, make-video-ads and make-product-photos.
- **Why:** each one needs server work before it can run safely or be tested properly. The details are in each folder's `server-needs.md`; the blockers are summarised below.
- **Decision:** Akhil, 20 Oct 2026. They come back when the server work exists.
- **What users see meanwhile:** the router and every released playbook say plainly "not covered yet" for video ads, product photos and brand setup as its own job. Nothing hands off to these three.
- The folders are kept whole (SKILL.md, atoms, references, tests, critique), so nothing is lost. Hosts never list them, because nothing links or installs from `unreleased/`.

## The three, and what blocks each

| Playbook | What it does | What blocks it (from its `server-needs.md`) |
|---|---|---|
| learn-my-brand | Learns the brand once: audits every claim, gets the important ones signed off with proof, scope and review date, turns the voice into confirmed rules, records the unknowns. | **Brand Brain write paths.** No tool can approve, reject or retire a claim, and server research writes claims as already "approved". Claims, proof points, palette and fonts are not writable through `brand_update`. The operating plan (who approves, spend caps) can't be read or written over MCP. Pending proposals can't be listed or accepted from chat. There is no typed home for the unknowns ledger or a structured voice. |
| make-video-ads | Makes a produced video ad from a researched angle: hook, script held to signed-off claims, priced approval, honest review of the render. | **Video engine.** Several styles put first-person customer words in generated mouths (a fake-testimonial risk). The approval buffer can re-approve changed words silently. The engine's claim list and advice aren't scoped to the product or the sign-off. The custom route dead-ends in chat hosts, and its script step commits more credits than the yes covered. Text outside the scenes (end cards, taglines) isn't claim-checked. |
| make-product-photos | Makes store-ready product photos from the brand's real photos, checked against the real product. | **Photo engine.** The dry run doesn't validate, so refusals only show up on the paid submit. It's unclear whether chosen references replace or add to the product's own photos. Every archive reason becomes a brand-wide "don't" rule. Generated outputs are linked back as if they were real photos, with no provenance filter. Categories cover only apparel, beauty and CPG. A staging generation never started and failed 36 hours later. |

## What stays live while they are held back

These are **data formats**, not hand-offs. Records written earlier (by a full brand pass, by the GooseWorks app's Brand Brain, or by the claims check's scoped sign-off) still exist, and every released playbook keeps reading them:

- **The claims marker** — a `must` learning that starts `Claims sign-off (learn-my-brand, …`. The opening stays exactly as it is. `atoms/claims-gate` reads it and, through its scoped sign-off (§4–5), still writes it.
- **The `Claims you may use —`, `Never say —`, `Policy:`, `Banned words —` and `Not public —` learnings** — read by every playbook. Only the claims gate writes or retires the marker and the claims; nothing released writes the other openings.
- **The Brand record** (`brand/records/<date>-v<N>.md`, tags `[learn-my-brand, brand-record]`) — the claims gate reads it for variants and proof and adds to it. The first tag is its fixed creator tag; keep it.
- **`atoms/claims-gate/claim-types.md`** points to `learn-my-brand/references/claims-craft.md` here for the full claims craft. Reading it is fine.
- **Reserved, unused for now:** the learning sources `video` and `photos` (`atoms/save-learning`), the `Product imagery` request kind, and the paths `ads/videos/<project_id>.md` and `brand/photo-style.md`.

## How to release one

1. **Check the blockers are fixed** on staging: the items above, against the playbook's `server-needs.md`.
2. **Move it back:** `git mv marketing-agent/unreleased/<name> marketing-agent/playbooks/<name>`. Links inside need no change: `../../atoms/…` resolves the same from both folders. Change the `ln -s` line in its `tests/test-by-hand.md` back to `playbooks/`.
3. **Put the hand-offs back.** The 20 Oct change replaced them with "not covered yet" or "the marketer does it"; `git log -S "held back" -- marketing-agent` finds that change, and its diff is the list to undo for this playbook. The main places:
   - the router (`foundation/marketing-agent/SKILL.md`): its row, the "Not this" cells that pointed to it, the "Not covered yet" bullet, and the description line;
   - the index in `foundation/guide/SKILL.md` (and the reserved paths above);
   - where-to-start's `references/playbook-map.md` (the playbook's entry, the gaps table, the company-type table);
   - plan-campaign's brief roles and calendar, run-paid-campaigns' rotation and fix lines, analyze-performance's "what to make next", make-content, run-organic-social, work-with-creators;
   - the `reads`/`writes` lines in other playbooks' `skill.meta.json` marked "unreleased";
   - the atoms' owner lines and `AGENTS.md` §8, and the playbook counts in `README.md` and `AGENTS.md`.
4. **Routing eval:** restore the expected playbook in `evals/routing/cases.jsonl` for the cases whose note says "held back" (R02, R08, R09, R20, R37, R51, R52, R60; add the alternatives back on R19, R30, R39).
5. **Test** with its `tests/test-by-hand.md` on staging, then run the routing eval.

For **make-static-ads** (being reworked on its own branch): its description and references still point to make-video-ads and make-product-photos. That work replaces those pointers with "not covered yet" before it merges.
