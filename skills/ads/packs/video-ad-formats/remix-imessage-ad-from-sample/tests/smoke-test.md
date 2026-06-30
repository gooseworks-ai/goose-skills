# Smoke test — remix-imessage-ad-from-sample

**Goal:** a draft project + a remix-ready sample produce an approved thread and a published MP4.

## Steps
1. Seed a draft project (`source_sample_id` of an iMessage sample with `recipe.thread`,
   `format_key: "imessage"`) on a brand with `research_status: complete`.
2. Run the skill with the project id. Confirm the machine preflight passes (ffmpeg + Playwright).
3. Approve the drafted conversation when asked.

## Pass criteria
- The draft conversation keeps the source's bubble count (±1) and beat order, in the brand's voice.
- The skill pauses for approval BEFORE `submit_render`.
- After approval: a render row goes `running` with stage transitions
  (`script → assets → record → assemble → mix → export`), then `complete`.
- `output_url`/`thumbnail_url` are render-file paths (`/api/ads/projects/<id>/render-file?path=…`),
  `duration_sec` is set, and the reply ends with both `app_url` and `brand_url` verbatim.

## Quick checks
```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 working/final.mp4   # ≈ source ±20%
test -s working/final-thumb.jpg && echo OK
```
