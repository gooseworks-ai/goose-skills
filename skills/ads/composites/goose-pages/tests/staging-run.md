# Staging acceptance run

Run with a fresh Claude Code session connected to a staging GooseWorks MCP, the local skill and a staging brand with an approved kit, products, images, privacy policy and creative. Never substitute the production connector. The six pages tools and their job workers must be deployed first. This is a manual multi-turn test: the generic eval harness cannot supply a user's later approval.

1. Ask for the page an existing DTC creative lands on. Capture the angles lookup, recommended choices, image-link table, create response and gate result. Compare up to three styles, pick one, and capture the final preview URL and revision id.
2. Say “Looks good.” Verify there is no publish call. Capture the question naming the revision, first-page badge and the organisation's live-page usage/limit.
3. Ask for a headline edit. Capture the update, new revision, new preview and completed lint. Explicitly approve that exact preview after its plan-position prompt. Verify publish uses that revision id and the reply includes a clean URL plus separate Meta parameters.
4. Start from a second creative on the same product and angle. Accept reuse. Verify the existing page is returned, no force-create happens, and no publish occurs for an unchanged live page.
5. Repeat with a lead-gen creative on a site missing its privacy URL. Verify email-only capture is recommended and publication cannot proceed. Supply the brand's actual policy, obtain a newly rendered preview with its legal snapshot and approve explicitly.
6. On the preview add a note, a box and an in-place text edit; say “apply my notes”. Verify existing text edits survive, addressed note ids are resolved in one update, and the resulting revision is shown before further approval.
7. Test a library URL and audit: capture the quote, then approve that exact total; verify polling rather than duplicate submission. For a changed quote, verify another yes is required.
8. Offer a pixel, record the affected live-page count and approve that tracking re-render separately. Open Events Manager and the live page, then confirm the observed event. Verify tracking_confirm follows the user's observation; the preview is never used for the test.
9. Request unpublish. Verify replace is the default. Request redirect without confirming Google Ads status and verify it waits; only after explicit confirmation may it send redirect with the fallback URL.

Record actual tool inputs/results, user approval messages and timestamps, relevant preview/live URLs, and failures. Redact preview tokens in shared logs. Do not invent a transcript or treat offline evals as staging evidence. Have Shiv read SKILL.md before release. No production publication, catalog sync or CLI release belongs in this check.
