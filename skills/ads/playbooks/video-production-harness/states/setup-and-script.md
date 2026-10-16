---
name: video-production-harness/states/setup-and-script
description: States 0 to 2.6 of the shared video production sequence — preflight, brand context, reference study, brainstorm, design brief, script lock and voice selection.
---

# Human version

The first part of the run: check tools and inputs, load the brand, study the reference, pick the concept, write the brief and the script, and choose the voice. The script approval happens here.

---

# Agent version

Part of [the orchestrator](../orchestrator.md). Its non-negotiables, approvals and decision policies apply. Read one file per call; if the output says it was truncated, re-read it in parts before acting.

### State 0 — Pre-flight audit
1. Reuse a PASS audit under 24 h old only when tooling, host authentication and every input fingerprint are unchanged.
2. Otherwise follow [preflight-audit.md](../preflight-audit.md).
3. **Any P0 finding stops the run.** Fix broken media, unsupported formats, missing authentication or capabilities and unresolved brief variables before generation. No local override bypasses a gate.
4. P1 warnings are logged in the state file and don't block.

### State 0.1 — Brand bootstrap and reference study
1. Load brand_context and brand_assets through the host, not an assumed folder. Confirm identity, product and offer, audience, claims and evidence, visual identity and existing creative grammar.
2. If context is missing, offer one combined choice: research now with an available research capability, accept supplied facts and assets, continue with the stated limits, or defer. Never invent claims or treat an empty template as research. Paid research needs an estimate and the host's authorization. Save the decision so a resumed run does not ask again.
3. Reload brand context at the design, storyboard, world-lock and end-card stages. Pick assets by their labeled provenance, not by filename.
4. **Reference.** When there is one, wait for its prepared media and study it as [creative contract and review](../references/creative-contract-and-review.md) says: the whole moving picture and its actual sound, with the beat table (people, action, camera, sound, text, length). Record how you perceived it (`listened`/`watched` or `measured`). Frames plus a transcript are never called a full watch. Never invent analysis or use a reference as the final.

### State 1 — Brainstorm
1. If `idea_brief` and a schema-valid `concepts` entry exist, go to State 2.
2. Otherwise follow [brainstorm.md](../brainstorm.md). It writes `idea_brief` and `concepts`. Check both parse and carry every field the binding's schema needs. Save the full concept, title, format, hook, logline, evidence and risks on the review surface.
3. Keep an existing concept selection; carry open options into the script review in State 2.5.
4. **Concept-fit check:** *who is this selling, to whom?* If the answer is not "[brand] to [their real customer]", reframe now. Ask through the host decision surface when unclear.

### State 2 — Design brief
1. If `design_brief` and `implementation_brief` exist and match the current inputs, go to State 2.5.
2. Follow [create-design-brief.md](../create-design-brief.md). Its step 4 sets the scene skeleton and routes every scene through [shot routing](../references/shot-routing.md). Save the creative_contract (speech_mode, soundtrack_modes, required_features, reference_map, changes_from_reference, product_grounding, voice_plan), `climax_line:` and `assets_manifest:`; bind later work to the returned creative_contract_revision.
3. Map a legacy `audio_strategy` through [speech and route qualification](../references/speech-and-route-qualification.md) before branching. Native dialogue never becomes unrelated narration or silence.
4. No pause by default. If `<auto>` is false and real creative choices came up (style, voice options), show them in the open-decisions section at the script gate.

### State 2.5 — Script lock
1. Reuse `locked_script` only if its content and revision still match the host-approved script.
2. **Fetch write-video-ad-script with catalog_fetch and follow it to write the script**; it is a required skill of this playbook. If the fetch fails, stop and tell the customer: never write the script inline. Pass the sourced creative brief to its preparation command with `--brief working/script/creative-brief.json`; use its documented fields and set `shape.requires_creative_brief: true` for new custom or template work. Measure the reference with `scripts/reference_rate.py <reference words JSON> --target-s <seconds>`; never estimate the rate. Record `speaking_rate_wps` and its source file in the script plan's `voice_plan` and size the script to its `script_words` ([review-script-shortform](../references/review-script-shortform.md)).
3. Then follow [lock-script.md](../lock-script.md) with `<concept_type>` from the idea brief.
4. **SCRIPT OWNER GATE.** Show the complete words, the essential action and proof, the sound plan, the feasible routes and, in bold at the top, every `changes_from_reference` entry and the shot and setup counts next to the reference's (the `reference_shots.py compare` line). In the same message ask: "Do you want an on-camera person speaking (lip-synced), or voiceover over footage?", suggesting what the reference does; record it in `voice_plan.route` ([speech and route qualification](../references/speech-and-route-qualification.md)). Record the approved revision; a later material contract change refreshes the affected approval.
5. After approval, `locked_script` is the only source of VO text for every later step.

### State 2.6 — Voice and performance selection
1. Read the resolved speech_mode, soundtrack_modes and delivery intent. No-speech work needs no audition; a song or native dialogue uses its selected performance.
2. **Voice first is the default** for a talking face across several clips: the final ElevenLabs line is made, rate-checked and accepted before any lip-sync, one line per clip, and only shots marked `speaking_on_camera` are lip-synced ([shot routing](../references/shot-routing.md)). Native H3 voice is for a single take of 15 s or less.
3. **Voice and character are one choice.** Match the voice to the on-screen character's gender, age, ethnicity, accent and energy and to the reference narrator's persona and pace. Never default to a voice used for another brand or character. Record the pair in `voice_plan`.
   - **The person comes first.** For every generated on-screen person who speaks, run [lock-character](../lock-character.md) Phase 0 now, before any audition and even when no audition is needed: it makes the person's anchor candidates and, for a separate voice (voice first and lip-sync, or narration of that person), `character.voice_pair`. That pair is the voice; never pick it earlier from a name or the voice list, and never put a voice id in the script draft (`voices`) before it exists. The anchor is picked at the State 3 ingredient gate, and State 3.5 continues from it at Phase 1.
   - **Native speech** (one H3 take speaking its own line) has no separate voice: the person is made with `--no-voice-pair`, and the generated voice is reviewed with that take.
   - When no library voice fits, prefer an ElevenLabs Voice Design voice made from the same character descriptors, when the host offers it. Where it can't run, `pair_voice.py --character <character.json> --accept-nearest` takes the closest `nearest` voice as the pair; the owner hears it beside the still, and a rejection re-pairs with `--exclude` as below.
   - **Changing the voice later** re-runs `pair_voice.py --character <character.json> --voices <list> --exclude <rejected voice_id>` and uses the voice it returns. Never hand-pick a replacement from the list.
4. If the voice or delivery is open, audition only the uncertain material: a brand pronunciation, a conversational turn, a planned pause or emphasis, and the longest line. Paid auditions use the existing preview budget.
5. Register playable auditions with exact lines, beat ids, voice settings, script revision and provenance. Hear the isolated audio when your tools can; text, waveform or transcript cannot establish quality. Show open voice choices inside the script or ingredient review; an on-screen person's voice only in the ingredient review, beside their still. Never present an unplayed audition as chosen.
6. Reuse approved audition audio where it covers a production line. Render only missing or changed lines with the selected settings after the gate, on `eleven_v4`. Do not force a louder climax. Measure the voice's pace as create-clips Phase 4 says.
7. Recheck every speech scene and the full mix in States 5, 8 and 10. On resume, restore the selected ids; a missing selection blocks only the route that needs it.
