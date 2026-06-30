# Expected output — remix-apple-notes-ad-from-sample

For the sample input (Bioma "subscriptions to cancel"-structured source, acme-supps brand):

- `working/note.json` — same 2 `pre_typed_body` lines and 6 `typed_body` paragraphs (±1) as the
  source, same per-paragraph `type_seconds` / `pre_pause_seconds` pacing and `post_hold_seconds`;
  copy is acme-voiced (a calm money-saving memo, no source brand words); the reveal/CTA line
  carries "Acme" + `ACME10`; end card `{ headline_*, product_image: <acme bottle>, checklist: 3
  items mapped to acme's payoff, code ACME10, background_color/ink_color matched to brand }`.
- An `append_project_message` with the readable script (title + each pre-typed/typed paragraph +
  end-card line) shown for approval.
- One `ad_render` row: `running` with stage transitions
  (`script → assets → record → assemble → mix → export`), then `complete` with:
  - `output_url`: `/api/ads/projects/<id>/render-file?path=working/final.mp4`
  - `thumbnail_url`: `/api/ads/projects/<id>/render-file?path=working/final-thumb.jpg`
  - `duration_sec` ≈ the source's 18.97s ± 20%
- Files in the project folder: `working/final.mp4`, `working/final-thumb.jpg`
  (+ `working/final-9x16-1080.mp4` when the social export variant is produced).
- Closing message containing the exact `app_url` and `brand_url` strings the tools returned.
