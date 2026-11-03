---
name: make-custom-video
description: "Create a custom video with sourced product accuracy, explicit sound routing and exact-final audiovisual review."
version: 3.8.3
requires_skills: [video-production-harness, ad-angle-miner, comment-mining, competitor-ad-intelligence, create-video-fal, create-video-seedance-2-fal, media-proxy, reddit-post-finder, render-street-interview, scrapecreators-api, transcript-intelligence, watch, write-video-ad-script]
harness_binding: gooseworks/video-actions/v1
---

# Human version

The owner approves script, then ingredients and budget here; cards and Studio are optional. Keep reference format, product and sound. GooseWorks checks the final.

---

# Agent version

## Non-negotiables

1. Watch every reference end to end with sound, or use the server's measured reference profile, and save the evidence before any script.
2. Write the script with write-video-ad-script (catalog_fetch it).
3. Keep the reference's format: people stay people, demos stay demos, sound type stays. Otherwise list the change in changes_from_reference.
4. The voice is the master clock. Never cut or retime sound apart from a talking face.
5. Always real sound. No silent or tone tracks unless the owner asked for silence.
6. Show the product correctly, at real size, from real photos.
7. The review is listened or measured, never claimed.
8. Under a deadline, deliver fewer correct videos. Never downgrade a format.

Read one file per call; if output says truncated, re-read in parts. Fetch make-custom-video here; inspect live schemas before writes. Keep this environment; no retired actions or reference-as-final import.

## Load and resume

Fetch video-production-harness with catalog_fetch delivery archive; read SKILL.md and phase references; keep version/contentHash/files. Incomplete packages block work. Resume jobs with video_read; never resend instead of polling.
Custom skips styles. Ask which product or service to advertise; wait even with one saved. A brand name is not a product choice. Reuse an explicit pick or request for none. With a reference, video_create once with style custom, request (the owner's own words), reference_url and a UUID idempotency_key reused on retries. Without one, run video_references find with the request and products and show the list; the owner's pick goes to video_references pick, which creates the project. Never use a template demo as reference. Keep requested mechanics/assets/products/campaign. Resume the same project, plan_revision, approvals and production_manifest.

## Reference, product and creative contract

Read brand_read and knowledge_search. Source product geometry, colour, label, allowed use and scale; size-sensitive shots need dimensions or a known-scale photo. Never guess capacity or invent a real process.
Save reference_observation bound to media_id/media_revision with duration, full coverage, audio_perception (listened, or measured from the server's sound profile), motion_perception (watched, or measured with the full reference_shots.py study as frame_study) and timed picture/audio findings. Skipping a reference needs the owner's brief-only user_quote.
Save draft.creative_contract: speech_mode, soundtrack_modes, required_features, reference_map per scene (beat/action/proof/sound), sourced product_grounding, voice_plan and changes_from_reference. Native speech keeps source audio; external speech over a speaking face needs exact-audio lip sync. No detected words never authorizes mute.
Match capture/finish to the brief/reference; phone texture only for phone footage. Read harness references/talking-actor.md for speaking people: three actor options when needed, then playable voice choices beside the selected actor. Compare the generated voice with its audition.

## Save and review twice

video_change needs expected_revision; put brand_context.digest in custom.draft.brand_context_digest; never author server context. Price paid requests free and read-only with data_price_provider (up to 20 per call; follow any price_unknown entry's next_step first). Save the shot_list with the script so the server prices Standard and Best, and put picture-upgrade money (about two pictures at high) in render_estimate.upgrade_allowance; it pays for no clip.
Before each approval, paid batch or completion, run video_read with include ["blockers"] (free) and fix every blocking and must-fix finding in one pass; show ask ones with their cost.
Show the full saved script, then the actual playable ingredients and exact cumulative budget, here. At the script, show both approval_quote.tier_quotes totals as given, with no math of your own, and let the owner pick. Seedance is in neither total: offer each seedance_addons price, and only the owner's yes adds it. After the owner's explicit yes, call video_approve with the custom phase, review_token and total_credits from custom_review.approval_quote (with their quality_tier and its total when there are two), expected_revision and their words as user_quote. Never infer consent or approve yourself. Honor Stop.

## Produce, assemble and deliver

After ingredient approval, save the kit block and follow video_production if parts fit; else use the customer's verified shell, never a cloud sandbox. Report per paid piece.
Review the first take and risky product action before batching. Reject double mouths, extra hands, smears and garbled labels; never hide them with tracked face/body patches or blur. Re-make affected sources within approval. Send every resulting clip to clip_check; only checked bytes enter the final. Save prompts/settings and source-byte reviews; label unplayed clips measured.
Build the source-linked assembly_timeline: native picture and audio ranges stay together, pauses and freezes are declared, real soundtrack cues. Edits invalidate affected evidence.
Review all repaired motion and cuts at normal speed; samples cannot clear it. Review the exact final: listen, or use final_measure and frame judge (measured). quality_report is optional notes from that review; GooseWorks checks the final itself and returns findings. Fix must-fix ones; keep one only on the owner's own words.
Store the rebuild recipe (references/recipe-format.md). Complete with the confirmed same-project H.264/AAC MP4 URL; report complete again while server checks run. Kit uploads follow the saved review request. Pin checked bytes only.

Use plain words and returned credits. No invented claims, approvals, assets or passes.
