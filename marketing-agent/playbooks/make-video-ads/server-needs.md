# make-video-ads — server needs

Checked against staging, 2026-10-16 (rounds 1–2). Each: the need · the step · what the playbook does meanwhile.

## High

1. **Styles that put first-person words in generated mouths.** "Creator product review" ("cast the brand's own buyer"), Day-in-the-life (a generated "Maya" says "I wash my face with powder…" with no label), Narrated creator montage, creator talking/split-screen styles, Street interview, Podcast skit, Instagram Live with comments, ChatGPT/iMessage reveals. Under the FTC fake-reviews rule (2024) a testimonial from a person who does not exist is a violation per ad. *Steps 4–5.* Meanwhile: the speaker test on every line; dramatisation label or narrator; fit line says when a style can't pass. Ask: a "presenter, not customer" script mode and a guaranteed dramatisation/AI-label field.
2. **The 20% buffer re-approves word changes silently.** `video_read`'s next step says a later change inside the buffer (the agent's own included) is re-approved without showing the plan. *Steps 6, 8, 11.* Meanwhile: the playbook re-approves silently only when words, claims, people and music are unchanged. Ask: buffer covers money only.
3. **Claim scope in the video brief.** `buyer_brief.may_claim` for the moisturiser held press quotes about a mist and a toner; product-page efficacy wording passes `warnings`; the engine's own `plan_advice` suggested a personal-attribute hook ("Does your moisturizer usually come with a breakout?"). *Step 5.* Meanwhile: script-check re-scopes everything and ignores policy-breaking advice. Ask: scope `may_claim` to the product and the sign-off; run the policy rules on `plan_advice`.
4. **Claim sign-off status** (shared with learn-my-brand #1/#14): scraped claims look approved. Meanwhile: the sign-off marker decides; a batched scope question in Step 2.
5. **Custom route in chat hosts.** `video_references pick` always starts a custom video, which needs a verified shell; chat hosts get a dead end, and claude-ai-mode cards still say "make the video on your computer". *Steps 4, 7.* Meanwhile: chat hosts use ready-made styles; references as inspiration only. Ask: references in chat hosts route to a style or the coworker; fix the card text.
6. **Script-phase spend on custom.** The custom "script" yes already commits credits (staging: 166 committed against a 37-credit script approval, `budget_exceeded`). *Step 6.* Meanwhile: the gate says what the first yes spends now and stops on `budget_exceeded`.
7. **The trace on the plan card** (the human needs claim trace, cuts and people notes to say yes; the card rule allows one line). Meanwhile: posted before the card call.
8. **Ratio and length per style.** Ready-made plans are fixed 9:16; styles do not state their length (kinetic text: "6 to 30 seconds" for a 30s ask); style ranking reasons are unreliable ("made for sleep… products, like Gooseworks's"). *Step 4.* Meanwhile: read the template (`catalog_fetch` `type: "template"`), say plainly what it will be. Ask: duration and ratio on each style row; ratio choice on templates.
9. **Production footage search returns unusable assets.** For Gooseworks it returned "synthetic screen fixture (not for publishing)" showing other brands, marked usable for production; scraped posts of real people carry `rights_status: "unverified"`. *Step 4.* Meanwhile: footage check (brand, flags, rights, consent). Ask: exclude fixtures and unverified people from `purpose: "production"`.

10a. **Text outside the scenes is not claim-checked.** A style's `answers` (tagline, offer, product line) and brand CTA render on end and grid cards; staging render 1030779e ended on "acne-safe skincare" (unsigned) and passed the engine's check. *Step 5.* Meanwhile: script-check covers `answers` and end-card fields. Ask: run `warnings` over every rendered text field, and let `video_fix` change `answers` (today a finished video's end card needs a new draft).
10b. **The script judge can rewrite the lead after it was checked.** *Step 5.* Meanwhile: diff the shown words; re-check; resend the checked lead. Ask: judge rewrites flagged as such and run through `warnings`.
10c. **Some styles ignore `on_screen`** (day-in-the-life renders captions of the spoken line only), so a dramatisation label cannot be placed. Meanwhile: check the template; narrator or brand voice instead. Ask: a guaranteed disclosure overlay on every style.

## Medium

10. **Review evidence.** `media_analyze` samples one frame per shot and its visible text misses supers between samples; keyframe URLs are app-relative (`/api/...`) so chat hosts cannot show them. *Step 8.* Meanwhile: findings are "please confirm"; absent text is "not seen". Ask: full on-screen text track and signed keyframe URLs.
11. **The server's script-writing guide.** `video_create`'s next step says to fetch the catalog skill `write-video-ad-script`, and custom drafts record `script_provenance: { skill: "write-video-ad-script" }`. This playbook's `atoms/write-script` is the craft source. Meanwhile: follow both; this playbook wins where stricter. Consolidation: publish this atom under that slug, or drop the instruction.
12. **Uploads in chat hosts.** `media_upload` `bytes` caps at ~8 MB; `file` needs a presigned PUT a chat host cannot do. Meanwhile: the human uploads in the GooseWorks app library; `media_search` finds it.
13. **Placement versions.** One ratio and one length per plan; no video resize or cut-down. Meanwhile: each version is a new priced video.
14. **Review reasons.** `video_review` lacks `claim_problem`, `wrong_words`, `unreadable_text`, `bad_voice`, `fake_looking_person`, `pacing`, `speaker_rule`. Meanwhile: in the note.
15. **Agent-proposed learnings are refused** (`knowledge_confirmation_required`). Meanwhile: lessons saved only on the human's confirmation; attribution lives in names and launch notes.
16. **Per-market and per-platform policy flags** with `warnings` (melatonin in UK/AU, TikTok supplements, Meta personal attributes). Meanwhile: script-check; market asked for regulated categories.

## Low

17. **Photo count gates styles** ("needs 4 different product photos; the chosen products have 2" while `brand_read` says 4). Meanwhile: trust `video_formats`; point to make-product-photos.
18. **Credit figures disagree** (recipe "254 under a yes to 542" vs card "454 of 542"). Meanwhile: report the card, mention the mismatch.
19. **Performance by hook family.** `meta_read` returns no angle/hook metadata and nothing at all when Meta is not connected. Meanwhile: names carry it.
