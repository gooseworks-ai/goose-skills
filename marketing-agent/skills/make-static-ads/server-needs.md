# make-static-ads — server needs

What this playbook needs that the GooseWorks MCP does not give today (checked against staging, 2026-10-16, rounds 1–2). Each: the need · the step · what the playbook does meanwhile.

## High

1. **Claim sign-off reaching the claims path.** Research auto-creates claims as "approved" from the website and press; product-scoped search turns them `approved_scope_unknown`; the server's own hint calls kit proof points claim-grade (Personal Day's include press quotes about a mist and a toner). No tool changes a claim's status. *Steps 1, 5.* Meanwhile: learn-my-brand's sign-off marker + Brand record decide (`reading-the-brain.md` §1); without it, plain product facts only. (Shared with learn-my-brand #1/#14.)
2. **One quote for a multi-concept set.** `ads_generate` takes one prompt per call, so a ten-concept set is ten dry runs and ten submits, and the server forbids the agent's own sum. *Step 7.* Meanwhile: show each quote line as returned and ask for a yes to "these N quotes". Ask: a batch dry run (several prompts) that returns one total, or a `prompts[]` per source item.
3. **Dry-run prices for edits.** `ads_creative_edit` `dry_run` prices only `animate`; `regenerate`, `precision_edit`, `resize` cannot be quoted. *Step 9.* Meanwhile: remakes, text fixes and extra placements as quoted `ads_generate` remixes (`source.creative_ids`); `regenerate`, `precision_edit` and `resize` not used until their dry run returns credits (`ads_creative_edit` is added back to `needs.mcp` on that day).
4. **Dry run that validates what the submit requires.** A brand with `research_status: "none"` gets a quote, then the submit fails ("needs a brand with completed research"). *Before you start, Step 7.* Meanwhile: check `research_status` first.
5. **Lean creative list.** Unfiltered `ads_creative_read` returned 2.1 MB for 17 creatives (video script drafts in every row). *Step 1.* Meanwhile: only filtered reads with a small `limit`. Ask: a lean list mode and a format filter (static / video).
6. **Text-read of rendered ad images.** Product photos and video renders are analysable with `media_analyze`; it is unconfirmed whether ad renders are registered assets. Chat hosts that cannot see images need the drawn text for claims Pass B. *Step 9.* Meanwhile: look when the host can; otherwise "not visually checked" + checklist.
7. **Agent-proposed learnings are refused.** `brand_update` `facts` needs `user_correction` + the human's statement, so lessons the agent observed (a template that imports a seal, a disapproval cause) cannot be proposed for review. *Write-back.* Meanwhile: offer each lesson; save only on the human's yes, in their words.
8. **Screenshot compositing.** A screenshot passed as `reference_image_urls` is redrawn, so B2B UI ads risk fabricated product UI. *Step 6, formats §2.* Meanwhile: letter-by-letter check against the real screenshot, else drop; default B2B to text-native archetypes. Ask: a "place this image unaltered" mode.

19. **Campaign concepts need server-visible proof.** `add_campaign_concept` refuses claims whose applicability is unknown (`concept_proof_mismatch`; all 7 on Personal Day) and generation needs non-empty proof — but learn-my-brand's signed claims live in learnings and a document the server does not check against. *Step 7 campaign path.* Meanwhile: proof = a signed claim the server accepts, else a plain product fact. Ask: concepts accept the sign-off's approved claims.
20. **Brand reads are huge.** `brand_read` with `detail: "full"` on several sections plus `product_ids` returned ~249,000 characters (a ~130,000-character `brand_context` bundle). *Step 1.* Meanwhile: lean reads, learnings alone in full. Ask: `brand_context` only on request.

21. **Tag writes may not reach the server (cross-set review F5a).** By code reading, `ads_creative_update` sends `{ tags }` to a strict schema whose field is `user_tags`, so tag writes may be rejected; tags that do save are lower-cased. *Steps 9–10, gate 3.* **Status: unverified** — the staging write test (write `["angle:A-07","picked"]`, read back with `tags: ["angle:a-07"]`) was blocked by this session's permission guard on 2026-10-16. Meanwhile: tags written lower-case; picks, angles and the manifest also live in the batch file, which is the record of truth. If the test confirms the rejection, it is a gooseworks-app bug: map `tags` → `user_tags`.

## Medium

9. **Template detail in list rows.** `remix_spec` (which can order claims onto the image: "reset the handwritten testimonial to the brand's claim") and a similarity floor are not in list results; off-category matches come back for notes-app / stat-card queries. *Step 6.* Meanwhile: read each candidate's detail; treat similarity below ~0.45 as no match.
10. **Live stock and a currency on price.** No stock field; price is "16.00" with no currency. *Steps 2, 10.* Meanwhile: ask.
11. **Performance for ads Goose did not make, and frequency.** `meta_read` covers Goose-made creatives only and returns no frequency. *Steps 1, 3.* Meanwhile: own scraped ads' run length as a weak signal; rotation reasons taken from run-paid-campaigns' request.
12. **Structured offers.** Free-text `offers`; no code, terms or end date; sources disagree (free shipping $45+ in claims, $39+ in the brand's Google ad). *Steps 2, 5.* Meanwhile: ask; tag promo ads `offer-ends:`.
13. **Ratios** (no wider ratio or Pinterest target). No 1.91:1 or 2:3 in `ads_generate`; `resize` has no Pinterest target. Meanwhile: a quoted `ads_generate` remix at 16:9 or 1:1, flagged; `resize` once it can be quoted.
14. **A "picked for launch" decision distinct from quality feedback.** The run decision rides on feedback `happy`, which also trains the quality loop. Meanwhile: `happy` only on the human's words, plus a `picked` tag.
15. **A structured batch manifest field.** Nice to have; meanwhile the batch file in the workspace (`ads/batches/…`) and the tags carry it.

## Low

16. **Non-ad layouts in the template library** (email headers, link previews) for the graphics side door. Meanwhile: nearest clean layout, flagged.
17. **More feedback reason codes:** add `claim_problem`, `invented_mark`, `unsafe_zone`, `policy`. Meanwhile: in the comment.
18. **Policy pages at run time.** No free tool reads live platform policy pages. Meanwhile: encode stable rules; flag deciding ones for the human.
