---
name: make-custom-video
description: "Create a custom video with sourced product accuracy, explicit sound routing and exact-final audiovisual review."
version: 3.8.2
requires_skills: [video-production-harness]
harness_binding: gooseworks/video-actions/v1
---

# Human version

The owner approves the script, then the actual ingredients and budget, in this chat; cards and Studio are optional. Production keeps the reference's format, the product and the sound. GooseWorks measures and judges the final itself.

---

# Agent version

## Non-negotiables

1. Watch every reference end to end with sound, or use the server's measured reference profile, and save the evidence before any script.
2. Write the script with write-video-ad-script (catalog_fetch it; scripts without it are refused).
3. Keep the reference's format: people stay people, demos stay demos, sound type stays. Otherwise list the change in changes_from_reference.
4. The voice is the master clock. Never cut or retime sound apart from a talking face.
5. Always real sound. No silent or tone tracks unless the owner asked for silence.
6. Show the product correctly, at real size, from real photos.
7. The review is listened or measured, never claimed.
8. Under a deadline, deliver fewer correct videos. Never downgrade a format.

Read one file per call; if output says truncated, re-read in parts. Fetch make-custom-video on this connection and read live schemas before writes. Keep this environment; no retired actions or reference-as-final import.

## Load and resume

Fetch the complete video-production-harness with catalog_fetch delivery archive; read SKILL.md and its phase references and keep version/contentHash/files. Mixed or incomplete packages block work. Resume recorded jobs with video_read; never resend a batch instead of polling.
Custom skips the style picker. With a supplied reference, create once with style custom, its reference_url and a UUID idempotency_key reused on retries. Without one, run video_references find with the request and products and show the list; the owner's pick goes to video_references pick, which creates the project. Never use a template's demo as the reference. Keep requested mechanics, assets, products and campaign. Resume the same project, plan_revision, approvals and production_manifest.

## Reference, product and creative contract

Read brand_read and knowledge_search. Source product geometry, colour, label, allowed use and scale; size-sensitive shots need dimensions or a known-scale photo. Never guess capacity or invent a real process.
Save reference_observation bound to media_id/media_revision with duration, full coverage, audio_perception (listened, or measured from the server's sound profile), motion_perception and timed picture/audio findings. Skipping a reference needs the owner's brief-only user_quote.
Save draft.creative_contract: speech_mode, soundtrack_modes, required_features, reference_map per scene (beat/action/proof/sound), sourced product_grounding, voice_plan and changes_from_reference. Native speech keeps source audio; external speech over a speaking face needs exact-audio lip sync. No detected words never authorizes mute.
Match capture/finish to the brief/reference; phone texture only for phone footage. Read harness references/talking-actor.md for speaking people: three actor options when needed, then playable voice choices beside the selected actor. Compare the generated voice with its audition.

## Save and review twice

video_change needs expected_revision and the current brand_context_digest; never author server context. Price paid requests free and read-only with data_price_provider (up to 20 per call; follow any price_unknown entry's next_step first). Save the shot_list with the script so the server prices Standard and Best, and put picture-upgrade money (about two pictures at high) in render_estimate.upgrade_allowance; it pays for no clip.
Show the full saved script, then the actual playable ingredients and exact cumulative budget, here. At the script, show both approval_quote.tier_quotes totals as given, with no math of your own, and let the owner pick. Seedance is in neither total: offer each seedance_addons price, and only the owner's yes adds it. After the owner's explicit yes, call video_approve with the custom phase, review_token and total_credits from custom_review.approval_quote (with their quality_tier and its total when there are two), expected_revision and their words as user_quote. Never infer consent or approve yourself. Honor Stop.

## Produce, assemble and deliver

With fitting parts, save the kit block and follow video_make after ingredient approval; otherwise run on the customer's verified shell, never a cloud sandbox. Report progress per paid piece.
Review the first take and the riskiest product action before batching. Send every clip to clip_check; the final may use only checked bytes. Save full prompts/settings and source-byte clip reviews as custom production.
Build the source-linked assembly_timeline: native picture and audio ranges stay together, pauses and freezes are declared, real soundtrack cues. Edits invalidate affected evidence.
Review the exact final at normal speed: listen, or rely on the server's final_measure and frame judge (measured). Save quality_report.content_review with final SHA-256, timeline and creative_contract revisions, reviewer, capabilities, full coverage and per-dimension findings. Serious defects block delivery.
Direct builds also need the stored rebuild recipe (references/recipe-format.md). Complete with the confirmed same-project H.264/AAC MP4 URL and report complete again while server checks run. Kit uploads follow the saved review request. Pin only the checked version.

Use plain words and returned credits. Never invent claims, approvals, assets or passing checks.
