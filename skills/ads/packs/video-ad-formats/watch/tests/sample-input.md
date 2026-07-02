# Sample Input

Skill: `watch`

Brief:
Watch a short rendered ad video and produce an observation report. Use the whole-video default (no `ranges`) and keep all audio flags at their `true` defaults so visuals, voice, music, and SFX are all observed.

Inputs:
- `video`: any short `.mp4` under `skills/test-runs/_fixtures/` (or a fixture path supplied by the test harness)
- `ranges`: unset (defaults to whole video)
- `fps`: unset (auto)
- `include_voice` / `include_music` / `include_sfx`: all `true` (defaults)

Constraints:
- Save outputs under `skills/test-runs/<timestamp>/watch/`.
- If no Whisper backend is configured, degrade to frames-only and record the warning in `manifest.json`.
