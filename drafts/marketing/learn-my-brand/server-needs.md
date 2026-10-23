# Server needs: learn-my-brand

What this playbook needs from the GooseWorks MCP that it does not have today (checked against the staging tool list on 2026-10-16), which step needs it, and what the playbook does meanwhile. Ranked by how much it hurts.

## 1. Claim status: approve, reject, retire, add (BLOCKER for the claims contract)
- **Need.** A tool to set a claim's status (candidate / approved / approved with qualifier / rejected / retired), add an owner-supplied claim, and edit its wording, with approver, the approver's words and the date. `brand_update` says "Claims, proof points and operating-plan fields are not writable here."
- **Why it hurts.** Server research writes claims straight into `approvedClaims` as approved with no human review. On staging, Personal Day (acne skincare) has 7, including a star rating with a review count and four press quotes, and `valueProps` carry "100% free of acne-triggering ingredients" and "Dermatologist-developed & 6x award-winning". `knowledge_search` tells every agent that "proof is an approved claim … or a kit proof point as written", and the server's `next_step` repeats it. So every maker playbook will use unreviewed claims, and learn-my-brand cannot switch them off.
- **Step.** 4 (sign-off) and 7 (write-back).
- **Meanwhile.** The contract in `../../skills/claims-gate/SKILL.md`: one `Claims you may use —` fact per approved claim and the marker with a status token (which itself says everything else is not approved); variants, proof and the not-approved list in the Brand record; `valueProps`, `description`, `audience` and `tagline` rewritten (owner-confirmed) so they hold only approved claims. Every playbook reads claims through the gate. **Ask:** until this ships, research should write claims as candidates, not approved.

## 2. Claim fields: proof, scope, qualifier, review date
- **Need.** Per claim: evidence pointer and strength, products / markets / channels it is cleared for, required qualifier or disclaimer, review-by date, visibility. And `knowledge_search` claim results that return them, filtered by product, market and channel, hiding expired ones.
- **Step.** 4, 7, and the sweep mode.
- **Meanwhile.** All of it is in the brand record table; the sweep mode re-checks dates by reading the record.

## 3. Proof points editable
- **Need.** Edit or remove kit `proofPoints` (not writable through `brand_update`; `kit_patch` refuses `proofPoints`).
- **Step.** 7.
- **Meanwhile.** A rejected proof point goes in the record's "Not approved" table; the marker says only `Claims you may use` rules are approved, so siblings ignore it.

## 4. A home for the unknowns ledger and for facts with no typed field
- **Need.** Typed, per-brand storage for: the unknowns ledger (gap, job blocked, assumption, asked when); the goal, deadline and budget; margins and the most we can pay per customer; where it is sold (channels, markets, locations with hours); the founder's story and beliefs; never-say and not-public items with dates; and per-fact provenance (source, date, confirmed by, visibility, scope). Page 01 counts 7 of 23 sections with no home and 12 with a partial one.
- **Step.** 3 and 7.
- **Meanwhile.** The Brand record (`brand/records/`, brand coworker scope). `user_context` is not used: it belongs to an agent, not a brand.

## 5. The operating plan (who approves, what the agent may do alone, spend caps)
- **Need.** Read and write the Operating Plan over MCP. It exists in the app but is neither readable nor writable here.
- **Step.** 3 (who approves claims and voice).
- **Meanwhile.** The approver is recorded in the Brand record and as `approver:` in the sign-off marker, which `../../skills/claims-gate/SKILL.md` checks before asking anyone to approve a line.

## 6. Pending proposals: list and accept over MCP
- **Need.** List a brand's pending `agent_proposal` changes and record the owner's acceptance from chat.
- **Why.** Without it, anything not phrased as the owner's verbatim correction sits in the app's review queue, invisible to a fresh session and to hosted chats that never open the app.
- **Step.** 7.
- **Meanwhile.** The playbook writes only what the owner confirmed in chat, as `user_correction` with their words, and tells the owner which proposals wait in the app.

## 7. "Owner approved this exact text" as a write intent
- **Need.** A clear intent for text the agent drafted and the owner approved verbatim (voice guide, rewritten value props). `user_correction` says it is for facts "the user explicitly stated"; this playbook treats approval of exact shown text as that, with the owner's approval message as `user_statement`. The server should confirm this reading or add an intent for it.
- **Step.** 7.

## 8. A structured voice home
- **Need.** Voice as structure (rules with do/don't pairs, banned words, terminology, flex by channel and speaker, locale), not one 2,000-character prose field.
- **Step.** 5 and 7.
- **Meanwhile.** The whole confirmed guide in the kit's `voice` (the kit and knowledge both have a voice field; which one `brand_read` kit shows is unverified, and the playbook writes the kit one because siblings read the kit); banned words as one fact; voice status in the claims marker; per-account style in voice cards (`../../skills/voice-card/SKILL.md`).

## 9. Confirm saved sources (and give them a no-cost confirm)
- **Need.** Mark a saved source (`brand_read` sources, `confirmed: false`) as the brand's own or not, without starting a paid import.
- **Step.** 2.
- **Meanwhile.** The owner's answer is recorded in the brand record; paid imports are not started.

## 10. Per-location records (local and multi-location businesses)
- **Need.** One record per location: name, address, phone, hours, services, local offers, who controls local marketing.
- **Meanwhile.** Listed in the brand record; flagged as unsupported.

## 11. Knowledge import price for documents
- **Need.** Confirmation that importing an uploaded document with `knowledge_import` is free (the description says "a source may spend credits"). The playbook stops and asks if any answer shows a price.

## 12. Palette and fonts writable
- **Need.** Write the full palette and the brand's real fonts. `patch.kit` takes only primary and accent colour; `kit_patch.video_lab.fonts` is video-only. On Personal Day the kit says fonts "Exposure" while `typography` shows "Inter" (mapped).
- **Step.** 6.
- **Meanwhile.** Recorded in the brand record.

## 13. Replace or retire an imported knowledge document
- **Need.** Replace a document imported with `knowledge_import` in one step. `refresh` only rechecks the same source; a new upload is a new source.
- **Step.** 7.
- **Meanwhile.** Each save writes a new version (`brand/records/<date>-v<N>.md`, brand coworker scope) built from the previous one read in full, through `../../skills/save-to-brain/SKILL.md` (`versioned: supersede`), which deletes the older versions' documents after the new import is ready; the server's ingest drops deleted media, so search stops returning stale rows. The marker names the current version; the `Claims you may use —` facts win over any record.

## 14. The sign-off status should reach the claims path
- **Need.** Siblings and the server's own generators read claims through `knowledge_search {source_types: ["claim"]}` and the kit, and the server's `next_step` calls kit proof points claim-grade. Return the owner's sign-off status with claim results, downgrade research claims once a sign-off exists, or (best) #1.
- **Meanwhile.** `../../skills/claims-gate/SKILL.md` is the only contract every playbook follows; its marker status token (`signed-off | pending-client | not-signed`) decides.

## 15. Learnings: the 300-character cut and the 8-fact engine view
- **Status.** Covered by the Brand Brain rebuild (PRs #2079/#2081): no silent cut, full context for the ad and video engines. Interim handling lives in ../../skills/save-learning/SKILL.md.
- **Step.** 7.

## 16. Hosted chats and file uploads
- **Note, not a gap.** Text documents go through the workspace (`file_write` → `media_upload` source `workspace`), which works over MCP alone; `../../skills/save-to-brain/SKILL.md` does this.


## 17. Workspace files scoped to a brand
- **Need.** File tools take an agent or organization scope, not a brand. Playbooks use the brand's coworker agent (`coworker_agent_id`); a brand with no coworker falls back to the default workspace under `brands/<brand-slug>/`.
- **Meanwhile.** As above (AGENTS §8).
