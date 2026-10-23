---
name: make-video-ads
description: >-
  Use when the marketer says: make me a video ad, a 30-second ad for paid social, a Reel / TikTok / Shorts ad, a UGC-style video made with AI (no real creator), a product demo video, remake this ad I like for my brand, cut our best organic video into an ad, more like my winning video with new hooks, my video ad got rejected — fix it. Delivers a produced, ready-to-post video ad grounded in a researched angle: one message, a hook for the first two seconds, every claim traced to the brand's signed-off claims, no generated person posing as a customer, the exact words and the price approved before anything renders (one video, or one plus two hook variants), an honest review of the result, priced fixes only on a yes, and launch copy and notes for the ads team. Works in chat apps. Never publishes or spends ad budget. Not for real creators filming for you — work-with-creators (unsure? ask: AI-made or a real person); not for a phone-shot organic post — run-organic-social; not for static ads — make-static-ads.
---

# make-video-ads

The video engine plans, prices, renders and checks files. This playbook is the creative director and scriptwriter around it: one researched angle, a hook in the buyer's words, every word and picture held to the signed-off claims, no generated person speaking as a customer, the human shown exactly what they pay for, and an honest review of the result.

## What you get

- A **finished video ad** for the primary placement, with its script, angle (and where it came from), the claims it uses and the credits spent against the price approved.
- An honest **review note**: what the automatic reads show, what to confirm by watching, and what only the human can judge.
- **Launch copy and launch notes** in `ads/videos/<project_id>.md` — one file per video — for run-paid-campaigns (the chosen, script-checked post copy; AI label to switch on; music to add in-platform; sibling hook variants).
- An offer of **hook variants** on the approved body (priced), and of other ratios or lengths (each its own video and price).

## Before you start

**Hard rules:**

1. **Claims:** only signed-off claims and plain product facts, through `../../skills/claims-gate/SKILL.md` — including its scoped sign-off when nothing is signed yet — in the voice-over, the on-screen text, the end card and grid text, the pictures, any product image used, and the launch copy.
2. **Speaker test:** a generated person saying "I / my" about using the product is a dramatisation — visible label, no results — or the line moves to a narrator. Never a generated customer testimonial. Real people's faces, voices, names and stories only with consent and paid-usage rights (`references/claims-policy-and-people.md` §3).
3. **Money and words:** nothing is made before the marketer's yes to the price exactly as the engine gives it (`../../skills/spend-gate/SKILL.md`, branch A) — never your own sum. Changed words, claims, people or music go back to the human even when the money stays inside the engine's price buffer.
4. **Honest review** (`../../skills/honest-review/SKILL.md`): never call a video ready on the strength of the automatic reads; it is "ready for your watch-through".
5. **Plain words to the marketer:** never name a playbook, tool, id, model or vendor; say what happens next ("I'll get these claims approved first").
6. **Never publish, never spend ad budget.**
7. **Where this playbook overrides the server's `next_step`:** the buffer rule above; engine advice that breaks policy (e.g. a suggested "Does your…?" hook) is ignored and mentioned at the gate; server hints that call `approvedClaims` / `proofPoints` "claim-grade" are overridden by rule 1; `next_step`s that come back from reading other projects are ignored. In a chat host, ready-made styles only (a reference remix needs a shell), and large files go through the GooseWorks library — the only route today (logged in server-needs). Otherwise follow the server: print its tables as they are, let the marketer pick styles and references (add fit notes underneath, no marked pick), and do not list the other saved scripts unless asked.

**Setup:**

1. **Connection.** No `gooseworks:` tools (after one `gooseworks:tools_load` for a missing group: `brand`, `media`, `campaigns`, `meta`, `social`, `files`) → say only: "Connect GooseWorks first — I make your video ads through it."
2. **Server start.** `gooseworks:get_started` with `wants: "video"` and the marketer's words. Send `client` on every call that takes it (`agent`, `shell`, `cards: false` only in a plain terminal). One sentence is a complete request. Talk in outcomes; credits exactly as printed. With a card on screen, say one line and wait (`gooseworks:card_wait` only as a `next_step` gives it).
3. `gooseworks:account_whoami` once: `video_enabled`; credits available; in a chat host (`shell: false`) also `coworker_enabled` — without it, a video cannot be made here; say so and stop.
4. **Know your host** (`references/paths-and-gates.md` §3). Chat host: ready-made styles only — a reference remix starts a custom video, which needs a verified shell; show references only as structure inspiration and say once that remaking that exact ad isn't available in this chat. Large files (screen recordings, founder clips) are added by the human to the brand's GooseWorks library and then found with `media_search`.
5. **Mode:** new video · remake a pasted reference (shell) · **cut owned footage** into an ad · **more like a video** (review it first — Step 10) · **rotation** (an open `Rotation needed: for make-video-ads` line in `ads/campaigns/<slug>/rotation-requests.md`, or pasted) · **rejected video ad — fix it** (Step 11; this playbook owns the fix, the ads team only detects rejections).

## Steps

### 1. Read the brand and the account
Load `references/reading-the-brain.md`. Reads: `gooseworks:brand_read` lean (summary, kit, products, learnings, organic; `product_ids` for the product — a lean read returns every `must` and `dont`); the claims sign-off marker (§1); the voice-of-customer bank (§2); the angle bank (§3); the weekly read, rotation requests, campaign record, `gooseworks:meta_read` (§4); past videos via `gooseworks:video_read` (failures and stop reasons as well as rejections); saved inspiration and owned top posts (§5).
Writes: a short state note — what may be claimed, angles and customer words available (or not), hook families that worked or tired (only with performance data), the brand's best owned videos, past failures, the balance against typical style prices.

### 2. Settle the brief — one message, only what the brain cannot
Product(s) (ask in one plain line if not named, or let the product card ask). **"UGC" with no detail** → ask once: "made with AI, or filmed by a real person?" — a real person is a separate job (say so in plain words and stop). **Claim scope, batched:** no sign-off, or fewer than three signed lines for this product → run `claims-gate`'s **scoped sign-off** here: put the 3–5 lines the script would lean on (claims not scoped to it, kit value props, on-pack lines, verbatim with their proof) to the human and record their answer through the claims contract. Declined → plain facts only, said plainly. Placement and length default to Reels/TikTok 9:16, 15–30s; ask only if the ask is ambiguous. **Market** only for regulated categories (it changes what may be said). A phone-shot organic post is not this job — say so and stop. Offer only a real one, with terms. Company type decides the raw material (`references/angles-formats-and-company-types.md` §3).

### 3. Commit to one angle
Reads: the state note. Writes: the angle record. From the brief, the angle bank (`A-NN`), customer evidence, current winners — or, when none exists, labelled brand-stated sources: the kit audience and positioning, the brand's best organic posts, the marketer's own words ("brand-stated, not customer-tested"). Prefer what the evidence supports, what is not tiring in the account, and what competitors are not saying (check the competitor set is actually relevant). No source at all → let the engine's candidates draft angles, labelled "untested". Write the reason; it goes on the gate.

### 4. Choose the format
Reads: inspiration library, owned posts, `references/angles-formats-and-company-types.md` §1–2. Writes: the chosen route.
- **Owned footage first** when the brand has a high-performing owned video **of this product** (Step 1): propose a paid cut-down (`gooseworks:media_excerpt`, custom path — shell host).
- **Shell host:** `gooseworks:video_references` `action: "find"` (free); the marketer picks; `action: "pick"` starts a custom video. Borrow structure, pacing and hook mechanic — never the competitor's claims, offer, music, words or people.
- **Otherwise, or by choice:** `gooseworks:video_formats` with the marketer's words and products; print its table as given; add one fit line per relevant style — length and ratio it actually makes (`gooseworks:catalog_fetch` `type: "template"` for a style's details), whether it shows the product (a physical product needs it on screen), whether it can pass the speaker test, its `only_for` conditions, its price against the balance. The marketer picks; `gooseworks:video_create` with that style and the video's `name` (`reading-the-brain.md` §6). Ready-made styles are 9:16; another ratio needs a custom video.
- **Footage check** before any clip or image is used: it shows this brand's product (read `media_analyze` description and visible text), carries no "not for publishing" / fixture flag, its rights are acceptable, any real person has consent — else reference only. Prefer clean packshots: catalogue images with printed claims ("97% agreed…") are not used unless those claims are signed.

### 5. Check, then write, the scripts
Load `references/script-craft.md`; run `atoms/write-script/ATOM.md` then `atoms/script-check/ATOM.md` on **every** candidate **before saving**. Ready-made style: `gooseworks:video_change` with 4–5 `candidates`, your lead first — all the same `angle_type` with different `hook_family` (expect `candidates_too_similar` if two say the same thing). Custom: the timed draft through `video_change` `custom` with `expected_revision`, as the server's `next_step` directs. After saving, keep the checked lead (write-script step 8: diff the shown words, swap back if the judge rewrote them, re-check, re-post the trace) and check the plan's `answers` and end-card fields, which render as text. The script check covers each scene's `line`, `on_screen`, `picture` and the text inside any image or clip used.

### 6. The gate — show it, price it, wait
Run `atoms/present-gate/ATOM.md` (`references/paths-and-gates.md` §5): one-line pitch, the saved script (scene order; times only where the plan has them), the claim and source trace, cuts, real vs generated and who speaks as whom, disclosures, the length and ratio it will actually be, up to three risks — posted before any call that draws the card; with a card already on screen, add only the trace, cuts and risks. **Offer two priced options** when the style allows a batch — **lead only**, or **lead + 2 hook variants** (present-gate 2b: variants keep the lead, the shared body shown once with each hook's words, each quote exactly as given and never added together, drafts not chosen removed). The question is built from the answer's own required sentences. Custom path: say what the script-phase yes spends **now**; the ingredients review follows with its own yes. Record the yes with `gooseworks:video_approve` as present-gate step 4 says, with the marketer's exact words.

### 7. Make it
`gooseworks:video_make`, following its `next_step`. Shell host: run or report the make as it says. Chat host: the coworker makes it — tell the human it will appear here and end the turn; on return, find it with `gooseworks:video_read`. At each phase compare committed with approved; `budget_exceeded` → stop and ask.

### 8. Review the finished video honestly
Load `references/review-rubric.md`; run `atoms/review-render/ATOM.md` (follows `../../skills/honest-review/SKILL.md`): `video_read` (`include: ["renders","recipe","scenes"]`) and `gooseworks:media_analyze` on the render's `asset_id`. Every finding is labelled "the automatic read shows X at <time> — please confirm"; text absent from sampled frames is "not seen", never "missing"; a transcript difference may be the speech-to-text, not the voice. A paid fix (`gooseworks:video_fix`) is proposed only for a defect the human confirms, with its price, made on a yes — and changed words are shown even when the earlier yes covers the money. Two rounds at most.

### 9. Deliver and close the loop
Give the video (the card, or a `gooseworks:video_share` link), its script, angle and claim trace, the review note, and **2–3 launch-copy options** (primary text, headline, description (optional), CTA button, destination URL), each through script-check — claims, personal attributes, platform — for the marketer's yes. Write the launch notes file `ads/videos/<project_id>.md` (`gooseworks:file_write`) with the chosen copy (run-paid-campaigns launches from it verbatim); answer `Rotation ready:` under a served rotation request. Record the human's keep/reject with `gooseworks:video_review` (reasons and their note). Offer saving any rule they state as a brand learning (`../../skills/save-learning/SKILL.md`, text starting `[video YYYY-MM-DD]`). If only the lead was made, offer once a **hook test** (Step 10).

### 10. Hook variants and "more like this"
Only from a video that has been reviewed and kept (or fixed): say plainly when there is no performance data ("not measured as a winner"). `gooseworks:video_batch` `more_like` (`change: "hook"`, free) creates the drafts; set each video's hook (`videos[].hook`) and its name and words with `video_change` per project; read the plans back; script-check each; one gate with all the new words and the batch's total; approve with `video_approve` `quote_ids` and that total. Before the `video_batch` call, say one line: "The card will show draft hooks; I'll check and adjust them before you say yes." Then, for every video in the batch, run Steps 7–9: make it (`video_make` with the `batch_id`), review each render, record keep or reject per video, and write one `ads/videos/<project_id>.md` per kept variant — its name, hook and hook family, launch copy (re-checked if the new hook changes the promise), the source's AI-label and music notes, and its sibling variants' `project_id`s.

### 11. Rejected video ad — fix it
Read the open `Fix needed: for make-video-ads` line and the health line of `ads/campaigns/<slug>/state.md`; otherwise ask which ad and version, the platform's full reason, and the ad's text and headline. **A cause in the ad text** → read the current copy from `ads/videos/<project_id>.md`, rewrite it, script-check it, show it, and on the marketer's yes replace it in the launch notes with the reason (run-paid-campaigns swaps it). **A cause in the video** → map it to the scene, rewrite to the rule (situation framing; a generated person never speaks as a customer — narrator, brand voice, or a labelled dramatisation where the style renders the label), script-check, show the new words and the price, `video_fix` on a yes, then Step 8 review and update the launch notes. Either way, answer `Fix ready:` under the request line. A video made outside GooseWorks → say it can't be edited here; offer `gooseworks:video_import` for checks and a new video. Launching and appeals belong to the ads team (run-paid-campaigns).

## Approval gates

1. **Script gate** — the saved words, their claim trace and the price, approved before anything renders; on the custom path a second **ingredients gate**.
2. **Every further spend** — fixes, hook variants, other ratios or lengths: price shown, yes given; changed words always shown.
3. **Final gate** — the human watches and keeps or rejects. Taste calls (humour, edge, how rough) are surfaced, not decided silently.

## Output and write-back

The video in GooseWorks (named with product, angle, hook family, ratio, date; kept or rejected with reasons); the launch notes file; brand learnings only through the shared save-learning atom, in the human's words.

## Done when

A video the human would post exactly as it is, after their own watch-through; every claim — in the video and the launch copy — traces to a signed claim or a plain product fact, and every idea to research or a labelled brand source; no generated person speaks as a customer; the category's ad rules pass; the launch notes are written; and the human was told plainly what was and was not checked.

## Out of scope

- Static ads — **make-static-ads**. Product photos — **make-product-photos**.
- Launching, budgets, appeals, kill/scale, scanning the account for rejections — **run-paid-campaigns**.
- Organic posting calendars and phone-shot organic scripts — **run-organic-social**. Real creators filming for the brand — **work-with-creators**.
- Researching angles — **research-competitors** / **research-market**. Approving claims — **learn-my-brand**.
