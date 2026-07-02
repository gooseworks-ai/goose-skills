# Human test — remix-chatgpt-ad-from-sample

End-to-end on a real machine (≈15 min + one render):

1. `npx goose-video@latest login` (fresh terminal; restart any open Claude Code session after).
2. In the ads app, pick a ChatGPT sample for a researched test brand → copy the paste prompt.
3. Paste into Claude Code. Verify it: fetches project + sample, passes the ffmpeg/Playwright +
   `create-chatgpt-mockup` atom preflight, and shows you the drafted conversation (the question
   + the streamed answer) BEFORE rendering.
4. Ask for one edit ("make the question shorter") — confirm it updates and re-confirms once.
5. Approve. Watch the app's project page: stage chip should move through
   script → assets → record → assemble → mix → export with "updated Xm ago" staying fresh (the
   `mix` stage is a near-noop — it passes through quickly since the format is silent).
6. When complete: the Final tab plays the MP4 (seek works), duration chip matches, and the chat
   reply ends with both links — open each.
7. Watch the video: keyboard is up while the user types and slides down on the send-tap, exactly
   one gray loading dot (~500ms), the response streams word-by-word and auto-scrolls, the BRAND
   surfaces inside the answer as the natural recommendation (not the source's), there is **no end
   card**, the track is silent, and nothing from the source brand survives anywhere.
