# Human version

Keep the requested video intact from reference to final. Plan its words, visible
actions and sound together; review actual performances and the exact export.
Record honestly how you reviewed: `listened`/`watched` only when that happened,
otherwise `measured`. Findings warn by severity ([check severity](check-severity.md));
only a broken file blocks. The owner approves twice: the script and the ingredients.

---

# Agent version

## Honest perception

`content_review.capabilities` is `{audio: "listened" | "measured", motion: "watched" | "measured"}`.
Write `listened` or `watched` only when a person or an audio/video-capable model
actually heard or watched the file; an extracted WAV, transcript or contact sheet
is not listening. Otherwise write `measured`. A measured review is valid when
[qc_evidence.py](../scripts/qc_evidence.py) exits 0 on the same `output_sha256` (the
file is not broken) and you inspected its frames at full resolution. The final
measurements (`gooseworks-final-measure/1`, locally and in the host's final check) and
the host's frame check are findings, graded by [check severity](check-severity.md):
a `must_fix` finding is fixed before delivery, an `ask` finding is settled by the
customer (or by you in `review_mode: auto`), a `fine` one is kept. Nobody has to claim
they watched or listened. Legacy severities map as `p0`/`blocker` → `must_fix`,
`p1` → `ask`, `p2` → `fine`, in any letter case; an unknown severity is `ask`.

## Reference and creative contract

Before adapting an audiovisual reference, inspect its complete moving picture and
hear its complete sound at normal speed. An extracted WAV, transcript or tool audio
attachment does not prove listening; without a capable reviewer, record `measured`
and the gap. Record sampled-frame, continuous-motion, isolated-speech and
mixed-audio coverage separately, with exact source identity, checksum, duration,
covered ranges and remaining gaps. Never call frames plus transcription a full watch.
A measured study is `scripts/reference_shots.py study` (the cut list and full-resolution
frames at 4 fps or more) with every row of its shot table filled from those frames:
people, action, hands on the product, camera and objects. Record how the reference
shows the product, its label and any waste, and carry it into `product_grounding` and
the shot plan.

Record each important reference beat beside the adaptation, and list every
deliberate difference in `changes_from_reference`, shown first at the script approval:

| Reference interval and observation | Adapted words | Required action/proof | Sound and speaker | Scene/route | Permitted change |
|---|---|---|---|---|---|
| Exact source interval; distinguish quotations from paraphrases | Locked line/copy | What must visibly happen, including outcome | Speech mode and sound cues | Stable scene and asset IDs | Explicit scope and reason |

Keep observed reference facts, brand facts and the user's adapted request distinct
(a source sauna test does not establish another product's capacity). Resolve a
disputed reference mapping before comparing against it.
AI presenters may illustrate verified features, but must not impersonate actual
employees, owners or customers or invent firsthand results/testimony. Lack of owned
actor footage is not permission to strip every person/voice from the requested format.
Missing essential beats and contradictory picture/direction fields are `ask`
findings for the script approval; derive both from the same scene contract. A diagram, logo or text card cannot replace a
requested live demonstration, routine or creator performance. When tools or assets
cannot meet the original mechanism, put a concrete feasible alternative in the
script or ingredient review.

With a supplied reference, its agreed structure controls pacing and shot order;
templates supply compatible components. Without one, start from buyer, objective,
exact product, supported mechanism, offer and CTA. Reuse existing angle research:
first-party performance with context, owned ads, relevant category/competitor ads,
organic demonstrations, then reviewed internal concepts. Views or active-ad
duration do not prove conversion performance. Offer a few feasible concepts in
the script review.

The host computes creative_contract_revision from creative_contract, scenes, target
duration, aspect ratio and brand-context digest. Save that returned revision with
words, hook/payoff, required actions/proof,
product/variant, sound intent, permissible edits and required beat IDs. Material
changes invalidate affected approvals and review evidence, not unrelated valid
work. Estimated timings remain provisional until actual performances exist.

## Content determines review duties

Populate required_features from planned AND observed content, whatever the genre
label; a presenter tagged other still needs speaking-person checks. Host feature names include speaking_face, product, scale, hands, application, pour,
physical_demo and readable_text. Actual people, speech, sound and continuing worlds
still enable their duties when no enum names them; unexpected content adds duties.

| Content | Required checks |
|---|---|
| People | Identity, anatomy and hand count (`must_fix`), believable appearance/performance, wardrobe and relevant world |
| Speaking mouth | Full speech listening, voice/words/pronunciation, source alignment and perceptual lip-sync |
| Product | Exact variant, geometry, material, label, state and supported use; sourced scale where material |
| Action/proof | Complete entrance/action/exit, contact, state/order, object permanence and visible payoff |
| Text | Exact copy, caption-to-word timing, phone-size readability and obstruction |
| Sound | Intended cues, isolated speech where available, complete mix and clean joins/endings |
| Continuing world | Set/props, lighting/reflections/support and cross-shot geometry; deliberate changes remain valid |

Use [product scale and world](product-scale-and-world.md),
[speech and route qualification](speech-and-route-qualification.md) and
[libraries, look and rubric](libraries-look-and-rubric.md) for the applicable checks.

## Production eligibility and repair

Look at every selected still at full resolution before animation, next to the real
product photo, and list its objects; grade what you see by [check severity](check-severity.md).
A still with an open `must_fix` is not animated. On GooseWorks the host also grades person
stills at each save and checks each clip (`clip_check`); act on their findings. On a new
creator route, review the first real face/voice/performance before ordering the remaining takes.
For difficult actions, prove a representative action with the same product and
conditions; a talking-head pass cannot qualify application, pouring or cooking.
A pending automated check is not passed. Run independent qualified work in
parallel, keeping project/scene/revision identities. Each batch output needs
its own exact-source/final coverage and verdict; one passed example or an all-done
status cannot approve the remaining videos.

Inspect every complete generated clip. A clip with an open `must_fix` is redone
(paid from the approved total when it fits, otherwise after a new yes to its price);
`ask` and `fine` clips stay in the assembly. Never drop a scene: if a redo still has a
`must_fix`, keep the best take, flagged, and let the customer choose another paid redo
or keep it. Continue independent work and keep every rejected candidate.
Classify source/model, input, edit and perception-capability failures separately.
Repair a detached native edit locally instead of buying another correctly matched take.

Every inset or overlay the plan promises should exist in the render, at its shot's time; a missing one is an `ask` finding (usually a free re-assembly).
Cosmetic crops/overlays must preserve the required product, action, identity and proof. Do not hide changed packaging with a logo, wrong geometry
with a crop, or impossible action with a mask. Do not widen people. Before flipping
a mirrored take, verify writing, handedness, hardware and continuity.
Use a faithful source, qualified repair or explicitly reviewed alternative.

## Exact-output review

Review the whole assembled export at normal speed with sound, including joins and
the ending; listen to isolated speech and the full mix. Inspect suspicious intervals
densely at original resolution. Two-fps contact sheets cannot certify continuous
action, phonemes, pronunciation, voice or music quality.

Record each applicable dimension as pass, needs_revision or incomplete, with
observed ranges and evidence. Keep file/probe/rebuild results apart from content
verdicts and owner decisions. A valid AAC stream or matching transcript cannot
certify natural speech, fine sync or absence of babble.
Check ASR anomalies against the audio; ASR invents words in silence.
No overall score clears unusable speech, broken sync, wrong product, missing proof,
impossible action or unreadable essential text.

Bind reviews to output_sha256, creative_contract_revision, timeline_revision,
source/performance identities and reviewer coverage. Any shot, sound, timing, crop
or caption change invalidates affected checks. Review every delivered ratio/cutdown
after its own final render; an older cut cannot clear a new file. An owner's
preview/final label is kept apart from unresolved quality and never erases a defect.

## Current GooseWorks review records

When you send quality_report.content_review (a record of what you checked, not a
gate: the host's own final check is the evidence), all dimension keys are present:
reference_and_concept, brand_and_product, scale_and_geometry, action_and_continuity,
lip_sync, voice_performance, pronunciation, sound_and_silence, pacing_and_joins,
camera_and_lighting and overlays. Each has status pass, needs_revision, incomplete
or not_applicable and a nonempty evidence/reason note. not_applicable needs a valid
applicability rationale. The overall verdict is approved, needs_revision or incomplete.
These records describe actual review, not invented scores.

Register each production clip's media_id and sha256 with its content_review:
reviewer, verdict, audio_perception/motion_perception (`measured` is enough), covered
millisecond ranges and findings with their severity. The automated clip checks support
this record; pending is not passed.

Reference observations carry exact media_id/media_revision, audio_perception
(`listened` | `measured`), motion_perception (`watched` | `measured`) and covered
second ranges through the full source ending. Frames or transcripts alone are `measured`. Other bindings map
the same responsibilities to their real supported fields.

## Delegation and resume

Hand off the exact fetched skill/version/hash, reference observations, product facts,
creative contract, selected sources, jobs/approval/budget, scene plan and duties.
Require outputs/checksums, intervals, observations, rejected candidates and gaps in
the return; a status sentence is not enough.

Read saved state first. Reconcile job IDs and input fingerprints; poll existing
jobs and reuse valid approved sources. On restart, re-send a
logged request unchanged: the same request returns the same booking and its saved
result with no new charge. Changed inputs invalidate affected work only. A stale
label or filename cannot authorize reuse.

Show concept, voice, anchor, look and sound choices inside the script and
ingredient approvals. Agent checks at still, clip and final stages are agent work;
record missing perception as `measured` and save the gap.
