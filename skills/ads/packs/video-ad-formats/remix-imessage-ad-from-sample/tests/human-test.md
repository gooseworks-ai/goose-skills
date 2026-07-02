# Human test — remix-imessage-ad-from-sample

End-to-end on a real machine (≈15 min + one render):

1. `npx goose-video@latest login` (fresh terminal; restart any open Claude Code session after).
2. In the ads app, pick an iMessage sample for a researched test brand → copy the paste prompt.
3. Paste into Claude Code. Verify it: fetches project + sample, passes the ffmpeg/Playwright
   preflight, and shows you the drafted conversation BEFORE rendering.
4. Ask for one edit ("make bubble 2 shorter") — confirm it updates and re-confirms once.
5. Approve. Watch the app's project page: stage chip should move through
   script → assets → record → assemble → mix → export with "updated Xm ago" staying fresh.
6. When complete: the Final tab plays the MP4 (seek works), duration chip matches, and the chat
   reply ends with both links — open each.
7. Watch the video with sound: every send/receive has the Apple SFX, the attachment is the test
   brand's product, the end card shows the real wordmark + code, nothing from the source brand
   survives anywhere.
