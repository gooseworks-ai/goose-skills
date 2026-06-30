# Expected output — remix-imessage-ad-from-sample

For the sample input (CatchBack-structured source, acme-supps brand):

- `working/thread.json` — 4 bubbles, same sender order and `typing_before` placement as the
  source; copy is acme-voiced texting (no source brand words); reveal bubble carries
  "Acme" + `ACME10`; end card `{ wordmark: "Acme", code: "ACME10", tagline: <one line> }`.
- An `append_project_message` with the readable script shown for approval.
- One `ad_render` row: `running` with stage transitions, then
  `complete` with:
  - `output_url`: `/api/ads/projects/<id>/render-file?path=working/final.mp4`
  - `thumbnail_url`: `/api/ads/projects/<id>/render-file?path=working/final-thumb.jpg`
  - `duration_sec` ≈ the source's 20.6s ± 20%
- Files in the project folder: `working/final.mp4`, `working/final-thumb.jpg`
  (+ `working/final-1x1.mp4` when the 1:1 variant is produced).
- Closing message containing the exact `app_url` and `brand_url` strings the tools returned.
