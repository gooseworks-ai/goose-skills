# make-video-ads — test by hand

## Setup

1. Connect GooseWorks **staging**. Test once in a shell host (Claude Code) and once in a chat host with no shell (Claude.ai).
2. Link: `ln -s "$PWD/marketing-agent/unreleased/make-video-ads" ~/.claude/skills/make-video-ads`
3. Video spends hundreds to thousands of credits. Pick the cheapest suitable style for paid tests.

## Test 1 — the core ask (DTC, regulated-ish category)

Brand with approved claims and a filled angle bank. Say: **"Make me a thirty-second video ad for the sleep gummies, for paid social."**

It should:
1. Read the brand, the claims sign-off, the voice-of-customer bank, the angle bank, performance and past videos first; ask in one message only for what is missing — a batched "which of these can the ad say about the gummies?" and the **market** (melatonin rules differ).
2. Commit to one angle with a stated reason and source; or say there is no grounded angle and offer the options.
3. Shell host: find reference ads (free) and let you pick. Chat host or by choice: print the style table as the engine gives it, with a fit line per style (length and ratio it actually makes, product on screen, speaker test, price vs balance) and no pre-picked style.
4. Write 4–5 candidate scripts on the one angle (different hook families), check every line, on-screen text, picture and the text inside any product image **before saving**, and keep the checked lead.
5. **Stop at the script gate:** the saved script, claim and source trace, cut list, real vs generated, who speaks as whom, disclosures, and two priced options — lead only, or lead + 2 hook variants, each quote exactly as the engine gives it — and wait. Nothing renders before your yes. ("Can't sleep?" must never be the hook.)
6. After your yes: make it (shell) or hand off and end the turn (chat host); on return, review using the render's transcript and scenes, phrase findings as "please confirm at <time>", never call it ready, propose priced fixes only for defects you confirm; write the launch notes file.
7. Record your keep/reject; if only the lead was made, offer a hook test on the approved body (priced).

**Passes if:** you would post it exactly as it is; every hook and claim line traces to the angle bank, customer research or approved claims; no generated person speaks as a customer; nothing rendered before the yes; the review note is honest.
**Telltale failures:** rendering before the yes; a line you cannot trace; "I tried it and it changed my life" from an AI person; "it looks great" about motion the agent never saw.

## Test 2 — B2B SaaS

"A 30-second LinkedIn video for our product." → asks for real screen recordings, never generates UI; founder/screen-demo/stat formats; captions; 1:1 or 4:5.

## Test 3 — pre-revenue app, nothing on file

"A TikTok ad for our app launch." → says what is missing; uses only verified app facts; no invented ratings or users; real app footage.

## Test 4 — reactive

- "This video was rejected for personal attributes." → asks which ad and version and for the full reason and the ad text; a cause in the ad text is rewritten here as launch copy, checked and written into the launch notes; a cause in the video is mapped to the scene and rewritten (narrator, brand voice, or a labelled dramatisation only where the style renders the label), new words and price shown, `video_fix` on your yes, then reviewed; never resubmits.
- "More like this one, new hooks." → reviews the source video first (staging's day-in-the-life video fails the speaker test and has a line over the wrong products), says it has no performance data, fixes the body on a yes, then new hooks through the script check and the gate, `more_like` with `change: "hook"` at the batch's own price; each variant is then made, reviewed and kept or rejected, and each kept variant gets its own `ads/videos/<project_id>.md` (hook family, re-checked launch copy, AI-label and music notes, sibling variant ids).

## Test 5 — chat host, no shell

Same as Test 1 in Claude.ai. After the yes it hands off and ends the turn; on return it reads the render and delivers with the review note. It never shows a command or asks the human to install anything.

---

## Staging run — 2026-10-16 (stopped at the script gate, before `video_approve`)

Brand Personal Day, product Dive Deep Mevalonic Moisturizer. Ask: "a 30-second video ad for the Dive Deep moisturizer for paid social". Client `claude-code-desktop`, `shell: true`.

| Step | Call | What came back |
|---|---|---|
| Account | `account_whoami` | `video_enabled: true`, 4,165 credits available |
| References | `video_references` `list` | None saved; next step: paste an ad (custom) or pick a ready-made style |
| Styles | `video_formats` (2 pages) | 30 styles, 20–22 makeable; prices 200 → 3,620 credits. Some carry `only_for` ("the brand states a real score or rating"); several are unavailable because the product has only 2 distinct photos (make-product-photos would unlock them). Several styles are built on generated people or fake social proof: Creator product review, Street interview, Podcast skit, Instagram Live with comments, ChatGPT chat reveal |
| Draft 1 | `video_create` `ugc-product` | Free draft. Plan note: "Cast the brand's own buyer… Line 1 raises a question the buyer feels" — a generated person reviewing the product as a customer: **the speaker rule would steer away from this style or script it as a presenter**. `buyer_brief.may_claim` lists press quotes about a mist and a toner for the moisturiser |
| Draft 2 | `video_create` `kinetic-text` | Free draft; 2–10 scenes, ≤ 10 words / 60 characters each, no voice, last scene must carry the brand name |
| Script | `video_change` with 4 `candidates` | First try refused: `candidates_too_similar` (scripts 1 and 3). Rewrote one; saved. **Quote: 207 credits, `yes_covers_up_to` 248**, no engine `warnings` |
| Read back | `video_read` `include: ["scenes"]` | Lead saved: "For people who read every ingredient list / and still worry about their moisturiser / Dive Deep: Mevalonic Acid, Azelaic Acid, Squalane / A lightweight moisturiser, $16 / Personal Day. Shop Dive Deep." Script judge still picking |

**Script-check on the test's own candidates:** the engine raised no warnings, but two of my candidate lines would be cut by this playbook — "Azelaic Acid to calm skin" and "skin stays balanced, never oily" are efficacy wording from the product page, not approved claims. The lead script (identity angle) uses only ingredient names, texture and price.

**What the playbook would show next:** the gate (script table, trace: ingredients and price = product facts, no claims; cut: two product-page efficacy lines; no people; 207 credits) and "Yes to this script at 207 credits?" — **stopped; `video_approve` was not called.** Two draft projects remain in staging ("… (do not make)").

**Review path verified on an existing staging render** (project `1030779e…`, style day-in-the-life): `video_read` `include: ["renders","recipe"]` gave the render `asset_id` and "Check: passed"; `media_analyze` on that asset returned the word-timed transcript and 16 shots with descriptions and on-screen text — which exposed a voice line about one product over shots of two others, on-screen text naming the wrong product, and "Unplugged" for "Unplug". The engine's check had passed it.

**Round 2 adversarial run (same day, read-only) added:** Personal Day has no sign-off marker, no voice-of-customer bank and no angle bank; 13 of its 17 videos are Failed; Meta is not connected. The moisturiser's catalogue images print unapproved claims ("97% of test subjects agreed…", "boosts… collagen"). The engine's script judge suggested a personal-attribute hook. A custom project's script-phase yes had already committed 166 credits against a 37-credit approval (`budget_exceeded`). Production footage search for Gooseworks returned a "synthetic screen fixture (not for publishing)" showing other brands. All folded into the playbook (Hard rules, Steps 2, 4, 5, 6, 8, 10, 11).

## Round 2 fix pass (2026-10-16) — re-check by hand

- No sign-off on file → the scoped sign-off happens in Step 2 of this run (3–5 lines put to you and recorded), not a hand-off elsewhere; nothing internal is named to you.
- "I need UGC for my ads" → it asks whether you want an AI-made UGC-style video or real creators; real creators are a different job.
- "Make a video for our TikTok" (organic, phone-shot) → says that is not a produced ad and stops.
- "My video ad got rejected" → this playbook makes the fix (copy or scene); the ads side only detects it.
