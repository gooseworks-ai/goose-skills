# make-content: test by hand

Run it on your own brand (or a staging brand) with one real finished asset in hand: an article URL, or a webinar or video recording. Connect GooseWorks **staging**. Nothing in this playbook spends credits on its default path.

## Test 1: the repurposer (first to prove)
Ask: **"Turn this into versions for every platform we post on"** and give the asset.

It should:
- read the brand and your platform list from the brain, or ask for the platforms once and save them
- get the source in (a transcript via upload for video)
- show the units table (15–30 scored units with verbatim anchors)
- deliver one version per platform, each leading with a **different** unit and hook, each with an asset line, an edit note and a claims check

**Pass** if each version could be posted after a light edit.
**Fail** if:
- two versions share an opening line or sentences (cropped, not native)
- any version says "watch the webinar" as its whole point
- a claim you never approved survives

## Test 2: a fresh piece with a point of view
Ask: **"Draft an article answering the question our buyers ask most."**

It should:
- find the question in the voice-of-customer bank, or ask you
- write the brief (thesis, proof inventory with sources, `[PROOF NEEDED]` gaps), and for long-form wait for your yes on the outline
- ask the 5 POV questions if the piece needs your opinion
- deliver the draft with the publish kit, edit note and claims check

**Pass** if you edit it rather than start over.
**Fail** if it contains an opinion, story, customer, number or statistic you never gave or approved.

## Test 3: a gate path (pick one)
- **Case study:** give a customer interview transcript. It should be delivered **blocked**, with `[CUSTOMER APPROVAL NEEDED]` on the name, numbers and quotes, and put them to the human through the claims gate's scoped sign-off.
- **Comparison page:** every competitor fact should be dated and sourced. Every comparative line about you should be on the approved list or marked for approval.

## Test 4: newsletter
Ask: **"Draft this week's newsletter."**

The first time, it builds the issue template with you and saves it. The second time, it asks only for this week's notes.

## Test 5: one post
Ask: **"Write one LinkedIn post about <product>."** In one message, it asks whose account (brand page or a named person) if that isn't clear, plus this post's claim lines when the claims gate's scoped sign-off applies. No brief, no calendar intake, no paid read, no voice interview: it uses an existing card, the brand card, or the kit lines labelled "voice provisional". You get the post, 2 hook alternatives and its checks.

## Test 6: SEO article
Ask: **"Write an SEO article: <question>."** Before the brief, it reads the top search results: free with a web tool, otherwise one priced read only after your yes, which is asked in its single question message. The brief's information gain cites what it read, with URLs and dates ("snippets only" if it couldn't open pages).

## Telltale failures (any one fails the run)
- The same text cropped across platforms.
- A customer, number, claim or opinion you never approved or gave.
- AI-tell words ("delve", "unlock", "in today's fast-paced…") in the output.
- Anything published or scheduled.

## Staging run log (2026-10-16, GooseWorks staging, org "gooseworks", 4,165 credits available; nothing spent)

Brand: **Personal Day** (`0e5b2fb0-…`, DTC acne-safe skincare). Ask: "Turn our latest Instagram video into versions for every platform we post on."

| # | Call | What came back | What the playbook does with it |
|---|---|---|---|
| 1 | `brand_read` (list) | 8 brands, each with `coworker_agent_id` (Personal Day → `9d554b73-…`) | Workspace scope for every file |
| 2 | `brand_read` sections summary, kit, learnings, sources, organic | Kit voice (description, 3 site lines, Do/Don't); 1 learning: `dont` choppy script lines; own IG @personalday and TikTok @personaldayskin as `relationship: self` sources; 12 own posts (Oct 5–12) with metrics and `media_asset_id` | Platforms = IG + TikTok (from sources); the script learning applies to every video version |
| 3 | `brand_read` learnings (full) | No "Claims sign-off (learn-my-brand" marker | **Before sign-off: plain product facts only.** Positioning note sent before drafting ("'acne-safe' isn't signed off yet…") |
| 4 | `knowledge_search` claim | 7 rows `claim_status: approved`, all research-created (4 press quotes, free returns, free shipping $45+, 4.9/234 reviews) | Treated as candidates under the claims gate's contract, not proof |
| 5 | `knowledge_search` document "Brand record approved claims" | empty | Confirms no sign-off has run |
| 6 | `knowledge_search` evidence | Only the 4 press quotes, no buyer words | Says "no buyer evidence on file"; press quotes are not VoC |
| 7 | `file_read research/audience/voc-bank.md` | not_found (research-market has not run on staging) | Falls back to the evidence search (step 6) |
| 8 | `media_analyze read` on asset `96cdce4e-…` (the IG video of 2026-10-12) | 11.7s, 6 scenes, `visible_text` "Lili's secret to clear skin on the go💧", **transcript empty**; free | source-to-units short/silent rule: 2 usable units. The playbook says so and recommends a richer own asset (e.g. the 2026-10-10 TikTok with speech) before writing filler |
| 9 | `social_inspiration_search` "hypochlorous acid spray acne" | 0 items | Falls back to `brand_read organic.competitor_top_posts` (10 posts, IG/TikTok) for format references |
| 10 | `file_list` (coworker scope) | only `agent-config/` | First run, no earlier content |
| 11 | `file_write content/repurposed/ig-2026-10-12-lili-spray/2026-10-16.md` | success (596 bytes) | Workspace write path verified (test file marked TEST RUN) |

**Stopped before:** nothing on this path costs credits. `knowledge_import url` (for a published piece) was not run: the brand has no published piece from this run.

**Sample output** (from the round-2 adversarial run on the same data, then re-checked against the fixed claims rules): an IG carousel led by the "where it lives" unit. Slides: "where lili keeps her spray (not the bathroom)" / slide 2 has its own hook / one location per slide / a save prompt in the brand's voice. The press quote is dropped until sign-off. Cut: "kills acne-causing bacteria", "soothes redness", "clear skin" (all needing sign-off). Kept: "alcohol-free", "fine mist", "$12" (product record spec fields).

**Not verified on staging:** `knowledge_import url` pricing (expected free; the playbook stops if it quotes a price); importing voice cards as documents (no confirmed card yet).

**Cleanup:** the TEST RUN files written in this run (`content/repurposed/ig-2026-10-12-lili-spray/2026-10-16.md`, `social/calendar/2026-10-19.md`) were deleted from the Personal Day workspace afterwards (`file_delete`, success), so the next real run starts clean.
