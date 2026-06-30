# Expected output — remix-chatgpt-ad-from-sample

For the sample input (Bioma-structured ChatGPT source, acme-gut brand):

- `working/conversation.json` — same beat as the source (one user question → one loading dot →
  one streamed assistant answer), same `header` / `keyboard` / `composer`, `stream: true` on the
  assistant message; the question is acme-voiced ("why am i suddenly so bloated at night?"), the
  streamed answer is education-first with **Acme** surfacing as the natural recommendation and
  `ACME10` woven into the response. No source brand words anywhere. **No end card.**
- An `append_project_message` with the readable script (the question, then the streamed answer)
  shown for approval.
- One `ad_render` row: `running` with stage transitions (`script → assets → record → assemble →
  mix → export`, where `mix` is a near-noop / silent), then `complete` with:
  - `output_url`: `/api/ads/projects/<id>/render-file?path=working/final.mp4`
  - `thumbnail_url`: `/api/ads/projects/<id>/render-file?path=working/final-thumb.jpg`
  - `duration_sec` ≈ the source's ~14s ± 20%
- Files in the project folder: `working/final.mp4` (750×1624, tagged 9:16),
  `working/final-thumb.jpg` (+ `working/final-1x1.mp4` when the 1:1 variant is produced).
- The track is **silent** by default (no Apple chime, no music bed).
- Closing message containing the exact `app_url` and `brand_url` strings the tools returned.
