---
name: launch-meta-ad-campaign
description: Plan or safely create Meta/Facebook/Instagram campaigns through GooseWorks tools or a bundled direct Meta Marketing API adapter. Use automatically for requests to launch, run, create, publish, set up, or plan Meta ads; use reporting skills for analysis-only requests.
---

# Launch Meta Ad Campaign

Guide the user from campaign intent to either a verified **paused** Meta campaign or a complete campaign plan. This skill is agent-neutral: choose the best available adapter, but keep one safety workflow and one approval boundary.

## Choose one mode

Use the first available mode:

1. **GooseWorks adapter** when all GooseWorks launch tools are callable. Read [references/gooseworks-adapter.md](references/gooseworks-adapter.md).
2. **Direct Meta adapter** when a valid Meta token and ad-account access are available. Read [references/direct-meta-adapter.md](references/direct-meta-adapter.md) and use the bundled `tools/meta_marketing_api.js`.
3. **Planning-only fallback** when neither write adapter is available. Read [references/planning-only.md](references/planning-only.md). Produce a useful plan; do not present missing write access as a failed planning task.

If both write adapters are available, prefer GooseWorks because its approval page, creative links, and recovery records are already integrated. Never mix adapters within one launch.

## Universal workflow

### 1. Resume or inspect before asking

- Resume any existing launch record or push first. Never duplicate a partially completed launch.
- Inspect existing campaigns, ad sets, ads, and relevant creative before recommending a new structure.
- Explain whether the intent fits reuse or needs a new campaign. Do not create a second context system when the selected adapter already provides one.

### 2. Collect only missing decisions

State what is known, then ask once for the missing budget, account-local schedule, destination URL, result/objective, bidding and optimization, geography/audience, placements, tracking, Page/Instagram identity, and creative/copy.

Do not silently approximate unsupported objectives, special-ad-category handling, targeting, bid controls, or tracking. Planning-only mode may still design these configurations even when the available write adapter cannot create them.

### 3. Validate before any write

- Render or inspect the final destination, follow redirects, require public HTTPS, and confirm the approved host.
- Check message and claim match, one clear CTA, tracking/pixel availability, and obvious broken-page states.
- Run Meta policy review for the objective, audience, copy, creative, destination, and special-category implications.
- Block hard destination or policy failures. Show non-blocking warnings plainly and explain any optimization fallback.

### 4. Prepare one exact plan

Summarize in human language:

- campaign name, objective, special category, and paused status;
- ad set names, budget type and amount, account timezone, dates, geography, audience, placements, optimization, and bidding;
- every ad, creative, Page/Instagram identity, copy, CTA, and destination;
- what is reused versus created, destination/policy results, warnings, and tracking assumptions.

Persist the exact plan before asking for approval. A changed plan requires validation and approval again.

### 5. Obtain explicit human approval immediately before writing

Preparation, inspection, validation, and planning are read-only. They do not authorize a Meta write.

- GooseWorks mode uses the returned approval page/card. Chat cannot approve a GooseWorks push.
- Direct Meta mode requires an explicit user confirmation for the exact paused plan immediately before the publish command.
- A decline or missing confirmation means **no write**.

Never activate ads automatically. This skill has no direct-activation step.

### 6. Create paused, persist, and read back

- Create campaign, ad set, and ads only with `PAUSED` status.
- Persist each returned ID immediately so interruption and partial failure are recoverable.
- Read every object back from Meta. Report success only after names, parent links, objective, budget/schedule, targeting/optimization, creative/destination identity, and paused state match the approved plan.
- On failure, list what failed, every object already created, its verified status, and the exact next action. Resume from persisted IDs only after renewed user approval; never recreate completed steps.

## Final response

End with the adapter used, inspection/reuse decision, approved configuration, destination and policy result, Meta IDs, readback status, warnings or partial failures, and the next human action. The normal write-mode stopping point is: **ready in Meta, paused, spending nothing**.
