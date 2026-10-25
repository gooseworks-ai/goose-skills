---
name: make-static-ads
description: >-
  Make new static image ads, a fresh batch, more ads, a winner's variations, copy variants or a rejected ad fix. Reads the brand, its customers and the ads it already runs, turns real product facts and customer situations into distinct visual ideas, shows a concept board, writes each render prompt, quotes, renders and reviews through GooseWorks. Also handles requested branded header/social graphics. Use for static ad creation rather than goose-ads. Not for video, product photos or launching campaigns.
version: 0.10.3
---

# make-static-ads

**The idea is the job, and it must be this brand's idea.** An ad idea is a real product fact or customer situation turned into one visible event the viewer gets at a glance (`references/ideas.md`), said the way this brand already talks and looks (`references/brand-profile.md`), built on a template at the creativity level the marketer chose (`references/levels.md`). Everything else serves that idea or protects the brand.

The proof that the work happened is the **concept board**, shown to the marketer before any render credits are spent. It cannot be skipped, shortened to "your choice", or replaced by a summary.

## What you get

Finished, reviewed images with their ad copy, the concept board behind them, what was cut and why, and a batch file the launch reads.

## Before you start

- **Setup.** Run the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 only: connect, `gooseworks:get_started`, pick the brand, the workspace scope, and the current names of the brand-brain tools. If `get_started` shows a brand-setup or sign-in card, wait for its press; any other card: the Server hints bullet below.
- **Render tool.** No `ads_render` → stop before spending and say so; `ads_generate` rewrites your prompt through templates and is not a substitute.
- **Server hints.** Answers like "one short line and wait" or "recommend one plan" govern GooseWorks' own cards, setup, rights and spending. They never replace this playbook's research, board or critic.
- **Product identity.** A physical product needs real product photos (`brand_read` with `product_ids`). Software or a service: real UI screenshots and any brand character it owns (never a generated fake UI). The logo is never the identity image; it is placed after the render on every ad (no shell: the marketer's Step 2 choice). Missing photos or screenshots → ask in Step 2. Still none: a physical product stops at the board (no quotes) with an offer of the product-photos job; software goes ahead only with ideas that need no screen (type-led, the mascot).
- **Run memory.** The `run-memory` skill (`../run-memory/SKILL.md`), Start of run (§1–5) only: playbook `make-static-ads`, job `static ads`, subject the product's slug, cadence `ad hoc`, outcomes from the `picked` tags and `gooseworks:meta_read` `view: "performance"` matched to this playbook's creative ids. Its "since last time" note goes in one sentence before the first Step 2 question (this replaces run-memory §4's 3–5 lines). Add every ad already made in this conversation to the history.
- **Files.** Work in `ads/batches/<YYYY-MM-DD>-<slug>/` in the brand's workspace: `profile.md`, `board.md`, prompts. The batch file `ads/batches/<YYYY-MM-DD>-<slug>.md` is started at Step 3 and filled in as you go (`references/reading-the-brain.md` §7).

## Steps

### 1. Read the brand and write its profile (free)

Use the small calls in `references/engine-notes.md`. Read:
- the claims contract: the `claims-gate` skill (`../claims-gate/SKILL.md`) §1. Never read claim statuses from the brain yourself;
- the product: the one the marketer named; none named → the one the latest performance report or request names, else the bestseller (confirm it in Step 2). Its record and photos, looked at;
- **how the brand already advertises:** its own ads (looked at, not listed), recent social posts, website and kit → `profile.md` (`references/brand-profile.md`);
- customer words (`references/reading-the-brain.md` §2), the angle bank (§3), and any performance report or open request (§4);
- history for the no-repeat test: the last 10 approved ads made in GooseWorks for this brand (`references/engine-notes.md`; fewer with no shell) and every live static (`references/brand-profile.md` §1).

Write what you actually read, with counts, at the top of the profile: "Read 14 reviews, 20 of ~300 live Meta ads, 15 X posts, the homepage." Name a skimmed source as skimmed and an unopened one as not checked.

**Done:** `profile.md` has every section of its template; the Read line names own ads, social posts, website and kit, each with a count or "not checked: <why>"; five product truths and up to five customer lines with sources (fewer, or "none found", when the sources hold fewer; never a made-up quote).

### 2. Quick questions

Ask with the host's question tool when it has one (Claude Code: `AskUserQuestion`): up to four questions per call, each with a header of at most 12 characters, 2–4 options of about five words (details go in the option's description), the recommendation first and labelled "(Recommended)". Never a long paragraph. Without a question tool, the same questions as a short numbered list, one line each, options inline, recommendations in **bold**. Put the run-memory line, if any, in one sentence before the first call.

**First call:**
1. **Creativity:** Balanced (Recommended: "a new idea inside a proven layout"), Close ("a proven ad layout with your words; safest"), Bold ("the idea comes first, in your own style; most surprising"). One level for the whole set unless the marketer asks for one ad per level.
2. **Angles:** multi-select, up to four options: the profile's strongest angles first, at most one marked "(new)" per five ads (one in any set of five or fewer); each description names the claim line it needs; others via Other. Recommend only angles whose lines are already usable. This is the one home of the new-angle rule.
3. **Settings:** "Use these (Recommended)", its description spelling out every default ("<product>, 5 ads, 4:5 feed, link: <page>, logo on every ad"); "Change something".
4. **Approver**, only when claim lines will need approval and no approver is on record (claims-gate §4.2): "Who approves what the ads claim?" "I do", "Someone else" (named in Other; no name back → ask it in the next call).

**Next call, only for what is open** (a further call if more than four are open or "Change something" needs details):
- **Claims:** only when lines for the chosen angles need approval and the marketer approves them; the `claims-gate` skill §4 says how (one multi-select question, ticks are the sign-off). Someone else approves → claims-gate §4.2, no question. Record the ticks by claims-gate §5 and read them back before Step 4.
- each conflict the profile found, your pick first;
- the logo, when there is no file, it is under about 300 px wide (ask for a bigger one, a transparent PNG if possible), or the host can't run scripts ("Clear corner you fill (Recommended)", "Model draws it, may change");
- missing product photos or UI screenshots;
- a live offer and, if an ad will show it, the price;
- paid reads, only if there's no browser and nothing imported (the one "up to N credits" ask from the `spend-gate` skill (`../spend-gate/SKILL.md`) branch B). Other placements: 9:16 for Stories and Reels and 1:1 only if they say.

An unanswered creativity question is asked again alone. "Your choice" or "just give me the images" takes every recommendation (balanced, no new claims); say what you chose on the board. No other questions until the board.

**Done:** the answers, or "recommended", recorded in `board.md` under `## Step 2 answers`; ticked claim lines saved by claims-gate §5 and read back, or none were needed.

### 3. Find the ideas → the concept board

Run the `make-static-ads-concept-grid` skill (`../make-static-ads-concept-grid/SKILL.md`): angle → message → visual idea → style → template, the tests, and a fresh critic.

**Done:** `board.md` has one row per ad that passed the tests, with the critic's notes and what changed; the batch file is started.

### 4. Copy

Run the `make-static-ads-ad-copy` skill (`../make-static-ads-ad-copy/SKILL.md`).

**Done:** every slot of every ad has its final words; each ad has primary texts A and B, link headline, description, CTA and destination.

### 5. Write each prompt

Run the `make-static-ads-compose` skill (`../make-static-ads-compose/SKILL.md`): one prompt per ad and ratio (`references/prompts.md`).

**Done:** each prompt passed the read-back in `prompts.md` §5, with its image list.

### 6. Check the exact prompts

Pass A of the `make-static-ads-claims-extract` skill (`../make-static-ads-claims-extract/SKILL.md`) and the `ad-policy-check` skill (`../ad-policy-check/SKILL.md`) on each prompt and its copy. A cut line goes back to Step 4 or 5 and through this check again. A cut that needs a new approval goes on the board as a cut, never into the ad.

**Done:** every span is keep, quote or cut; no cut words remain; policy passed or its flags are on the board.

### 7. Show the board and the quote

First tick this run check under `## Run check` in `board.md`. The template sheets and the quotes are never skipped: do them now. Anything else unticked is done now, or listed below the cards as skipped, with why:
- Step 2 asked with the question tool (or a short list); answers in `board.md`; ticked claim lines saved (or none needed);
- run memory read (or "first run"); the Read line covers own ads, posts, website and kit with counts;
- the last 10 approved ads and every live static checked for repeats;
- three looked-at templates per ad in different styles; one template sheet per ad, shown to the marketer;
- at close and balanced, the template image attached when it is the brand's own ad or a library template, otherwise the layout in words; every ad's render call names its template (`template_id` or `reference_image_url`);
- the critic got the records as they came back;
- three headline candidates per ad; Pass A and the policy check on every prompt;
- every ad and ratio ready to quote (the dry runs come next).

Then `gooseworks:ads_render` with `dry_run: true` for every ad and ratio. Show the board as `references/handoff-format.md` §2 says, each quote exactly as given (never your own total). The marketer's yes covers the quotes shown plus one retry per ad and ratio, each at that ratio's quoted price; the `spend-gate` skill applies to anything beyond that.

Changes at this gate, then show only the changed ads with their new quotes for a yes:
- a template swap → Steps 4–6 for that ad (its words follow the new slots), and the set's style and no-repeat tests again;
- a changed angle, message or idea → Steps 3–6 for that row, critic included; a level change (it applies to the whole set) → Steps 3–6;
- an edited line → Steps 5–6; a newly approved claim → `claims-gate` §4–5 first, then Steps 4–6;
- an added ratio → Steps 5–6 for that ratio; a dropped ad needs no new quote.

Submit nothing that wasn't quoted and approved as shown. "Finals only" shortens delivery, not this message.

**Done:** the marketer said yes to the quotes shown, or the run stops here with the board saved.

### 8. Render and review

Submit the exact quoted requests and wait for them (`references/engine-notes.md`, Polling). Then run the `make-static-ads-render-review` skill (`../make-static-ads-render-review/SKILL.md`).

**Done:** every image passed, is flagged for the marketer's look, or was dropped with the reason.

### 9. Deliver and remember

Hand over as `references/handoff-format.md` §3 says; finish the batch file and the tags. Ask which ads the marketer prefers (a multi-select question); offer copy variants for those. Save lasting human feedback through the `save-learning` skill (`../save-learning/SKILL.md`). Run `run-memory` End of run (§6–7) on every exit, including a stop or partial run.

**Done:** the marketer has each ad with its "Based on" sheet and copy, and was offered copy variants; the batch file, tags and the run-memory record (End of run) are saved, or a failed save is reported.

## Other modes

| Request | Path |
|---|---|
| More ads | Same steps; earlier ads are history for the no-repeat test. In the same conversation, reuse the level, logo, placements and claim approvals already given (never a spend yes: every new ad gets its own quote); ask only what is new. |
| Iterate a winner | Keep its idea and proof; change the one lever named (hook, scene detail, look). One board row with the parent linked; no new idea search. |
| Rotation request (a `Rotation needed:` line, `references/reading-the-brain.md` §4) | Keep the winner's angle, make new executions through the full steps, and answer `Rotation ready:` under the request line. |
| Same image, different text or font | The `make-static-ads-copy-variants` skill (`../make-static-ads-copy-variants/SKILL.md`). |
| Rejected ad | The `make-static-ads-fix-rejected` skill (`../make-static-ads-fix-rejected/SKILL.md`). |
| Header or social graphic | The `make-static-ads-graphic-request` skill (`../make-static-ads-graphic-request/SKILL.md`). |
| Price or stock change | List affected delivered ads with pause flags; remakes need copy checks and new quotes. |

## Approval gates

Claims through `claims-gate` before public copy; the marketer's yes to the exact quotes before paid work; human words only for preferences, ratings and launch.

## Output and write-back

The board, the batch file, tagged creatives (the logo version of each, or the kept render on a host without scripts) and the run record. Agent verdicts go in tags and the batch file; render feedback carries only the marketer's own words.

## Done when

Every delivered ad comes from a board row with a reason to exist, passed its claims and policy check, was rendered within the approved quotes, and was judged against its protected choice and the product's identity. Failures and anything not checked are said plainly.

## Out of scope

Video, product photography, campaign launches and performance conclusions. Offer the matching job when asked; this playbook neither publishes nor predicts performance.
