# Smoke Test

Goal: prove `create-video-seedance-2-fal` can render a 4-8s clip via FAL using image references with native lip-sync.

Input: `tests/sample-input.md`.

Steps:
1. Read `SKILL.md` and confirm `FAL_API_KEY` (or `FAL_KEY`) is set.
2. Run `scripts/generate.py` with the sample prompt + one portrait ref + one product ref, `--duration 4 --resolution 720p` (cheapest smoke).
3. Confirm "[seedance-2-fal] wrote <N> bytes seed=<int>" with N > 10_000.
4. Run the verifier references in `tests/verifier.md`.

Pass/fail: pass when the MP4 exists, plays end-to-end, has audio, duration ≈ 4s, and `meta.json` records `gateway: "fal"`, `model: "bytedance/seedance-2.0/reference-to-video"`, and a numeric seed.

⚠️ This smoke run hits a paid API (~$1.21 for a 4s 720p call). Get explicit approval before firing.

## Free rejection check (no provider call)

`python -m pytest skills/ads/packs/ugc-video-formats/create-video-seedance-2-fal/tests` runs `generate.py` against a local mock of the GooseWorks fal-proxy. Pass when a likeness / content-policy 422 exits 3 after exactly one submit in every body shape (`type` only, `msg` + `type`, `partner_validation_failed`, the GooseWorks `provider_validation_failed` wrapper, also through the MCP relay), an identical re-run exits 3 with no submit, a changed prompt, image or seed submits again, NSFW exits 4, and a non-policy 422 exits 1 and is not recorded.
