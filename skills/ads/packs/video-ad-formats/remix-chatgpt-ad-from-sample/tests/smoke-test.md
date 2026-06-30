# Smoke test — remix-chatgpt-ad-from-sample

**Goal:** a draft project + a remix-ready sample produce an approved conversation and a
published MP4.

## Steps
1. Seed a draft project (`source_sample_id` of a ChatGPT sample with `recipe.conversation`,
   `format_key: "chatgpt"`) on a brand with `research_status: complete`.
2. Run the skill with the project id. Confirm the machine preflight passes (ffmpeg + Playwright +
   the `create-chatgpt-mockup` atom resolves).
3. Approve the drafted conversation when asked.

## Pass criteria
- The draft conversation keeps the source's single-ask → one loading dot → one streamed answer
  beat and response length, in the brand's voice, with the brand as the natural recommendation.
- The skill pauses for approval BEFORE `submit_render`.
- After approval: a render row goes `running` with stage transitions
  (`script → assets → record → assemble → mix → export`), then `complete`. The `mix` stage is a
  near-noop (silent by default).
- `output_url`/`thumbnail_url` are render-file paths (`/api/ads/projects/<id>/render-file?path=…`),
  `duration_sec` is set, and the reply ends with both `app_url` and `brand_url` verbatim.

## Quick checks
```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 working/final.mp4   # ≈ source ±20%
ffprobe -v error -show_entries stream=width,height -of csv=p=0 working/final.mp4 | head -1  # 750x1624 (tagged 9:16)
test -s working/final-thumb.jpg && echo OK
```
