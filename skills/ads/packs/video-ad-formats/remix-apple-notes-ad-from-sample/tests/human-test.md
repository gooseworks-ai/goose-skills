# Human test — remix-apple-notes-ad-from-sample

End-to-end on a real machine (≈15 min + one render):

1. `npx goose-video@latest login` (fresh terminal; restart any open Claude Code session after).
2. In the ads app, pick an Apple Notes sample for a researched test brand → copy the paste prompt.
3. Paste into Claude Code. Verify it: fetches project + sample, passes the ffmpeg/Playwright +
   `create-apple-notes-mockup` atom preflight, and shows you the drafted note BEFORE rendering.
4. Ask for one edit ("shorten the third typed line") — confirm it updates and re-confirms once.
5. Approve. Watch the app's project page: stage chip should move through
   script → assets → record → assemble → mix → export with "updated Xm ago" staying fresh.
6. When complete: the Final tab plays the MP4 (seek works), duration chip matches, and the chat
   reply ends with both links — open each.
7. Watch the video with sound: the note opens with the pre-typed lines, then types the rest in
   character-by-character with per-keystroke iPhone keyboard ticks (or a calm music bed on a
   `--no-sfx` cut), the yellow cursor follows the active paragraph, the end card shows the test
   brand's real wordmark + product bottle + code, and nothing from the source brand survives in the
   note text or end card.
