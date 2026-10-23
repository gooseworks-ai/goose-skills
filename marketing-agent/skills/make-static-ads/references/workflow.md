# Human version

Research and choose the ideas before paying to draw them. Keep one `run.json` containing what was actually checked, the candidates considered and the decisions. The checker catches missing work and mismatched selections; it cannot certify sources, reading, judgment or creativity. A fresh reviewer must challenge the evidence and chosen ideas before quotes for fresh concept work.

---

# Agent version

## One record, two review points

Use `scripts/workflow.py check run.json` before compose. It returns `ready`, `partial` with named limits, or `blocked`. A partial inventory supports “not observed in checked ads,” never global novelty. Complete missing work or explain the smaller/research-first choice when blocked; do not fill an empty proof slot with an imagined customer situation.

After compose, record claims and policy findings against the exact final prompts and image list. `workflow.py quote` emits only dry-run requests once that review matches; the exceptional unpublished-draft route below preserves an unverified-policy status and launch hold. The marketer's quote approval remains separate; no JSON field grants spending permission.

Shell-free host: keep the same record in the batch file, apply these checks directly, and name the checker/reviewer used. Do not claim a script ran. All media and paid requests still use the live GooseWorks tools.

## Research once, with actual limits

Read the brand/rules/product and targeted customer/angle documents, then own ads/history and candidate references. Use the small calls in `engine-notes.md`; save large results once. Read the full relevant record when a search cuts its wording. In existing coverage observations, distinguish full records from excerpts/search hits and viewed images from metadata; name unread relevant portions as limits. A saved file or hash is not evidence it was read. Use the live schema's names, not a remembered alias.

Own sources: start with20cards/records per active platform or saved-image source; extend only while useful, max60. History: three latest relevant batch files,20tagged creatives and three legacy details; include this conversation's earlier ads. Look at sampled images, not just metadata. Establish applicable platforms from actual brand/channel records. Missing access is a coverage limitation, not zero ads.

Customer bank missing → check public product reviews with the free host browser and cite them as hook/insight sources, not testimonials. Campaign/performance unavailable → record that; do not invent winners. Category references: imported statics, then3–5leaders with about20ads each, then library where leaders do not fit or cannot be accessed. Keep three compared references from three advertisers per selected concept; reuse that shortlist for its executions. Record actual provenance and why picks fit. Complete means complete within the stated sample and read/view scope. Name each attempted leader/source and its outcome in existing coverage; a skipped check is partial, an actual failed attempt may be unavailable. Bound stopping and absence claims to those named attempts: choosing to stop with enough draft evidence does not establish exhausted free access. A partial proceed-with-limits decision may be justified without paid research; its omissions stay visible. `references-and-remix.md` supplies lookup routes when needed.

Unusable or unsupported ideas may be listed as gaps with the missing proof; they do not count toward the sourced candidate pool. `coverage` records source checks; `sources` contains only evidence actually used. Preserve source wording and qualifiers. A public factual claim must satisfy `claims-and-policy.md`: exact approved claims/kit proof points where required; plain product facts need exact source/product scope; other found brand facts use that rule's restrictions. Pending, guessed, unknown or internal-only claims remain unusable. Customer language or observed ads are not product proof. The checker validates declared source classes; the reviewer checks whether those declarations are true.

## Author `run.json`

Use `schema_version:1`, `brand_id`, `mode` (`fresh`, `more`, `iterate`, `rotation`, `fix`, `graphic`, `copy`), and these sections. `more` gets a fresh selection using earlier ads as history. Other modes need `basis:{locator,decision}` linking the approved parent/request and the permitted change; use the actual task mode, never rename fresh work to bypass research. Fix/copy/graphic requests may use reasons:[] and omit reason_id/selection_review: their parent or exact requested purpose is the basis, not a new purchase concept. They still need source-backed direction, exact copy and the final claims/policy review. Iterate/rotation retains and checks the parent reason/proof; no fresh candidate-count requirement.

| Section | Required recorded work |
|---|---|
| `brief` | `{request,count,creative_goal,goal_basis}`. Keep the request unchanged. `transformative` when the request asks for original visual concepts, surprising relationships or a supplied creative benchmark; `straightforward` for a direct demonstration/format request. Explain that choice in goal_basis. Neither requires surrealism, and neither label waives fresh visual comparison. Only an explicit user-constrained action/scene may use `execution_constraint:{kind,user_quote}`: kind direct_demonstration or user_supplied_scene, with an exact quote from request. The critic must verify this is a real constraint, not a relabelled ordinary ad request. |
| `coverage[]` | `{kind,status,locator,checked_at,scope,examined,available_total,observations,stopping_reason}`. Kinds for fresh/more: `brand`, `customer`, `own_ads`, `history`, `references`, `platform_scope`; add campaign/performance as checked. `status` is complete/partial/unavailable; partial/unavailable adds `limitation`. Date is ISO; unknown total is null; unavailable examined count is0. A complete source with0 results needs the actual call/URL. |
| `coverage_decision` | When coverage is partial: `{choice:"proceed_with_limits",why}`. State why remaining evidence is enough for the selected facts and which conclusions remain unavailable. This never waives proof, rights or the gate. Show limits to the marketer. |
| `sources[]` | `{id,type,locator,excerpt,status,public,advertising_use,qualifiers}`. Use descriptive source types (product_record, customer_review, angle_bank, marketer, observed_ad, etc.); labels never establish independence. Group actual origins and evidence roles in coverage observations: a brand’s catalogue and official pages share first-party provenance; separate independent buyer insight and its scope. Status confirmed/found; public must be true for evidence used in a public ad. advertising_use is plain_fact/approved_claim/customer_language/observation/marketer_reason. Approved claims need confirmed status; preserve qualifiers even if empty. A quote used as a testimonial also needs permission and attribution. |
| `reasons[]` | `{id,reason,source_ids,persona:{description,basis,source_ids},proof:{kind,description,source_ids,supports},decision,why,gate}`. Draft at least twice the number of selected reasons. Fresh selected personas require basis `research` or `creative_hypothesis`; research means the cited evidence supports that specific audience/behavior. Hypothesis sources ground the inference, not proven demand. An unvalidated audience adds a run-level limit requiring `coverage_decision`; name the missing audience support and bounded scope there and in the critic assessment. Keep source coverage statuses faithful to what was examined. A researched audience in an authored scene alone adds no audience limit. Proof kinds: product_fact/approved_claim/demonstration/real_quote. Explain how it supports that purchase reason. Selected/rejected decisions keep reasons for selection or rejection. Unused candidates are rejected, not erased. |
| `gate` per selected reason | Each of `promise,proof,hook,message,persona` is `{pass:true/false,why}`. Check a specific believable promise, usable proof or a real product demonstration, phone-size hook, three-second message and persona fit under its stated research/hypothesis basis. A false/missing check blocks compose; fix/drop it. These are argued pass/fail judgments, not automatic scores. Fewer grounded reasons → research, a smaller set, or named user-supplied reasons before proceeding. |
| `ads[]` | `{id,reason_id,template_id,truth_source_ids,situation_source_ids,creative_direction,hooks,visual_options,selected_visual_id,reference_options}`. Count equals brief.count. New/iterated concepts also record framework/style/composition/awareness; same reason+framework+style twice is one ad. Use one full creative_direction in the selected row; copy that object unchanged into ad.json, not a second interpretation. |
| `hooks[]` |3–5 distinct `{text,formula,rank,why}` per fresh ad, ranks1…N. Rank1 is an exact on-image line. Preserve other ranked options for later variants. Deliberately textless ads use `exact_copy:[]`, `copy_intent:"no_added_text"` and `hooks:[]`. |
| `visual_options[]` | `{id,premise,relationship,decision,why}`. For every fresh/more concept compare at least three materially different visible meanings per ad before choosing, including ordinary “make five ads” requests; alternate crops, finishes or captions of one scene are one option. Record credible competing events and the actual selection tradeoff under `../../make-static-ads-concept-grid/SKILL.md` steps 4–6; count materially different meanings, not drafts that fail basic truth or feasibility. `../../make-static-ads-find-references/SKILL.md` step 3 owns reference translation. A straightforward non-surreal idea may win. One justified option is enough for explicit constrained action/scene requests, copy/fix/graphic execution, and non-transformative parent iterations. A straightforward label alone is not a constraint. Reject weak options explicitly. This is comparison, not a creativity guarantee. |
| `reference_options[]` | `{template_id,advertiser,source_id,decision,why}`. Three compared candidates/advertisers for fresh concepts; one selected. The selected ID matches template_id. Record unknown run length as unknown. Sources preserve actual image/record provenance. Source pixels stay text-only unless the brand owns the layout reference. |

`creative_direction` retains `product_truth,truth_source,human_situation,situation_basis,premise,relationship,scene,protected_decision,reference_role,reference_contribution,direct_competitor,exact_copy` (`scripts/README.md`). Research situations also cite situation_source and situation_source_ids; hypotheses remain labelled. Its premise/relationship must equal the selected visual option. A craft reference can supply finish only; the concept still needs a reason to exist. Direct competitors supply layout only.

Before composing new/iterated concepts, give a fresh critic the request, record, actual cited evidence and product/reference pixels rather than only our summaries. Use the validity, creative-strength and whole-set review in `../../make-static-ads-concept-grid/SKILL.md` step 7; record specific findings and their resolution, not just a general readiness verdict. For every fresh/more set, the critic records `source_assessment`: actual fact-source origins, independent buyer evidence or its absence, audience hypotheses/limits and why this evidence is sufficient for the selected promises and scope. A bounded feature introduction may proceed with hypothetical audiences and an independently accepted `coverage_decision`; missing usable proof or an unresolved review still blocks. Keep `{reviewer,context,verdict,findings,resolution,source_assessment,selection_sha256}` in `selection_review`; context is `fresh` for an independent agent or `human` with `critique_source` pointing to the real human critique. Without either, selection is blocked, even if delegation is unavailable. Same-agent review cannot clear it. Verdict pass only after findings are resolved. It is separate from the later blind pixel judge.


### Keep the selection review current

Before fresh/more review, run `python3 workflow.py selection-digest run.json` (from the scripts folder). The critic must return that `selection_sha256` for the exact inputs it reviewed. Changed sources, proof, personas, alternatives, selected direction, references, copy, coverage or set/history decisions require a real re-review. The producer must not refresh the receipt to make an old verdict pass.

`selection_digest()` is the single projection: brand/mode/brief/basis, coverage/decision, sources, reasons, evidence families, history/set decisions (including `history_context` and `set_decision`), unsupported gaps, reference exclusions, intended platforms/placements/ratios and the selected-ad input fields listed there. Review metadata, phase, jobs, renders and compose/delivery tracking are excluded, so execution bookkeeping does not invalidate the review. Add future selection inputs to that projection when introduced. This receipt establishes freshness, not whether the critic read or judged well.

Shell-free hosts without a hashing tool preserve the exact versioned selection snapshot reviewed by the critic and compare it directly before compose; name that path and never fabricate a hash or claim the script ran. Changed upstream content needs the same actual re-review.

## Compose and quote

1. Add `workflow:{run_path:"../run.json",ad_id:"a1",run_sha256:"<check result>"}` to ad.json (path relative to that ad.json). Run prepare, read each files_to_read part and write the composer answer. Later ads in the same conversation may use --read-manifest with an earlier receipt that was actually read: current complete files are retained, verified identical parts are listed as reused, and all changed parts must be read. Fresh agents use no read cache. The finalizer checks the run and selected direction; changing either requires recomposition.
2. `compose.py final ad.json answer.json > final.json` produces prompts, ordered image lists and unquoted `render_spec` objects. Its legacy in-process assembly functions remain for server-parity tests; their output is not a workflow approval.
3. Review exact final prompts/images for claims and applicable policy. Get the digest with `workflow.py digest final.json`. Write review.json as `{final_sha256,reviewed_by,reviewed_at,claims:{verdict:"pass",basis},policy:{verdict:"pass",basis}}`; retain spans/cuts and sources in the batch record. A pass is the reviewer's decision, never generated by the checker. Any changed text or reference invalidates it.
4. `workflow.py quote run.json a1 final.json review.json` returns dry_run_requests only. Obtain each live quote, show it with the selected concepts/coverage limits, and submit only the exact quoted request within the marketer's approved ceiling. A prior yes covers only its stated scope/ceiling.

### Inaccessible current policy sources: unpublished draft only

A failed current-policy read is not a policy pass. An agent may continue to quote an **unpublished draft** only when the human explicitly authorized that draft/test scope and all actual claims, known platform/category rules and rights checks pass. A known violation, unresolved risk, missing category/rights evidence or an omitted applicable platform still blocks. Record every checked rule/platform and every unchecked current-rule check; source access must be the only remaining gap. Asset URLs are not promised to be private.

For this case only, keep claims at `pass` and use:

```json
{
  "policy": {
    "verdict": "source_unavailable",
    "basis": "Which current-policy checks could not be refreshed and why",
    "known_rules": {"verdict": "pass", "basis": "All applicable platforms, checks actually completed, evidence and findings"},
    "unresolved_risks": [],
    "unavailable_sources": [{"url": "Official policy URL actually tried", "reason": "Actual access failure", "unchecked_rules": "Checks still unverified"}]
  },
  "unpublished_draft": {
    "authorization_source": "Actual human message or approval record",
    "authorization_quote": "Exact words explicitly authorizing the unpublished draft/test",
    "launch_hold": true
  }
}
```

The responsible agent must verify that authorization from the real conversation or approval record before quoting; fields cannot grant it. An ordinary ad request supplies no exception. Retain the usual exact-final digest and reviewer fields. The quote output carries `policy_status: "not_currently_verified"`, the checked-rule screen, unchecked sources and `launch_hold: true`. Show them at quote approval and delivery; keep them in the batch and run-memory records. The usual live quote and spending approval still apply. Recheck rendered content; any new claim, rights issue or known policy risk blocks delivery. No publishing, platform submission or launch follows. Clear the hold only through a new complete current-policy review and separate launch authorization.

For a worked fictional shape see `scripts/example-run.json`. Evidence there is illustrative, not usable for a real brand.
