# Human acceptance test — create-chatgpt-video-ad

End-to-end on a real machine (needs ffmpeg + Playwright/Chromium):

1. From the molecule folder, record the canonical example:
   ```bash
   NODE_PATH=../../../atoms/messaging/create-chatgpt-mockup/node_modules \
     node examples/smoke-app-question/clips/record-master.js
   bash examples/smoke-app-question/scripts/stitch.sh
   ```
2. Open `examples/smoke-app-question/edits/master-final.mp4` in QuickTime (or any
   player). Or use `/watch:watch examples/smoke-app-question/edits/master-final.mp4`
   per the project's self-QC rule.
3. Confirm by eye:
   - The keyboard is up the **whole time** the question is being typed, and the
     caret stays visible as characters appear.
   - On send-tap, three things happen in **one beat**: the user bubble pops in,
     the keyboard slides down, and the header right-cluster swaps
     `personPlus/dottedCircle → edit/more`. None of them lag a frame behind.
   - Exactly **one** gray dot shows for about half a second (not three — three
     would read as an iMessage typing indicator, wrong app).
   - The assistant answer fades in **word-by-word**, left-to-right and
     top-to-bottom — never all at once, never character-by-character.
   - The conversation auto-scrolls so the streaming bullets stay in frame.
   - **No** OpenAI spiral logo appears above the assistant message title.
   - There is **no** micro-flicker or visible scene cut anywhere — it plays as one
     continuous screen recording.
4. Confirm by ear:
   - The default master is **silent** (no audio track). That is correct for the
     shipped molecule.
5. (Optional) Exercise the subliminal SFX pass: enable the cue list in the
   recorder (`deriveSFX` over the timeline instead of the empty `{cues:[]}`),
   re-run step 1, and confirm the cues are *felt, not heard* — a faint tap per
   typed word, a soft send tap, an occasional "still working" tick during
   streaming, and a quiet done-cue after the last word. There must be **no** sound
   on the loading dot.

The skill passes human acceptance when the clip reads as a genuine ChatGPT screen
recording: keyboard choreography is clean, the single dot precedes a word-by-word
stream, and there are no cuts or stray logos.
