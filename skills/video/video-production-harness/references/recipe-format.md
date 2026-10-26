# Human version

`recipe/source.json` (format `gooseworks-video-source/1`) lets anyone rebuild a finished video from the project alone: the build's code and settings as text, and every media input by stored file id and checksum.

- **Write it with** the packer and **prove it with** the checker: `python3 scripts/pack_recipe.py ...` and `python3 scripts/check_recipe.py ...` (both in this package).
- **Never write it by hand.** The packer computes every checksum and refuses paths, links and keys that would break a rebuild.
- **The host's production record points at it** by file id and checksum; re-upload and update the pointer when it changes.

---

# Agent version

## Assembly timeline

Store the assembly_timeline with the editable sources: format
`gooseworks-assembly-timeline/1`, current creative_contract_revision, scene/destination
intervals, exact source asset IDs/checksums/in/out/speed, depicts_speech and native_audio,
required speech_driver, audio_cues and planned pauses. Assemble it only with
`../scripts/assemble.py`; no other stitching script. The checker in [assembly_timeline.py](../scripts/assembly_timeline.py) also refuses:

- milliseconds or pixels that are not integers;
- a pause over 1.5 s, pauses totalling over 10% of the duration, or a freeze over 1.5 s (a freeze that ends the video, the end card hold, may last 3.0 s);
- a `crop` (`{x, y, w, h}` in source pixels, with `scale_x` and `scale_y`) that stretches unevenly (over 2%) or zooms in over 1.5×. Zoom is the crop's fit-scale divided by the full frame's fit-scale; scaling a whole small frame up (H3's 432×768 to 1080×1920) is allowed, but a crop on such an upscaled source may zoom at most 1.1× (`../scripts/assemble.py` checks the source size);
- a speaking segment whose picture and audio change speed separately;
- the same source picture shown twice, not side by side, unless the later segment's `intent` is `callback: <earlier segment id> <reason>`; more than one callback per 15 s.

A callback is planned, never a repair: its row in `shot-plan.json` names the earlier shot in `callback_of`, and the final's `repeated_shot` check passes it only with `--plan` bound to the same creative_contract_revision. Never add or edit a `callback:` intent after a `repeated_shot` failure; fix a repeat with new coverage.

Segments planned as `speech_mode: none` (B-roll under music, an end card) need no speech cue. A plan that is silent by choice (`speech_mode: none`, `soundtrack_modes: [intentional_silence]`, which needs the owner's request or a silent reference) makes the final silence checks `not_applicable`; the tone check still runs. Bind the timeline to the current production record and pack it with the editable files.

The rebuild checker proves reproducibility only, never fidelity, performance, sync or music quality; an `identical` or `frames_and_audio` match is not listening. Save the exact-export content_review separately, with output_sha256 and real coverage.

## Steps

1. Upload and confirm every file the build reads.
2. Write `SPEC.json` (below) in the build folder.
3. `python3 scripts/pack_recipe.py --root BUILD_DIR --spec SPEC.json --out recipe/source.json`. It prints a `source` template with the recipe's checksum.
4. Upload it at path `recipe/source.json` (kind `document`); confirm and note its file id.
5. Download the inputs into an empty folder, then `python3 scripts/check_recipe.py --bundle recipe/source.json --inputs DOWNLOADED_DIR --final FINAL.mp4 --work EMPTY_DIR`. Keep the JSON it prints.
6. Save the production record's `source` (below). After a recipe change repeat steps 3 to 6 (source-only update when the host has one).

The build creates its own output and temporary directories (for example `mkdir -p out build`); an existing working folder must not hide a missing setup step. Include the actual timeline file among `files`. Every scene's production clip record binds the rendered video bytes used in assembly, even when its content began as a still or graphic. Keep the original still as an input too. A changed timeline requires the full updated production record and renewed affected review; a recipe-only change can use the host's source-only update. Poll completion at the returned retry interval on the same run; never resubmit generation to wait for validation.

## SPEC.json (input to the packer)

| Field | Required | What it holds |
| --- | --- | --- |
| `files` | yes | Globs of UTF-8 code and settings files, relative to the build folder; name hidden files exactly. |
| `inputs` | yes when the build reads media | `[{path, media_id, role}]`: relative path, stored project file, and `role`, one of `brand_asset`, `product_photo`, `logo`, `font`, `voice`, `music`, `sfx`, `generated_image`, `generated_clip`, `stock`, `derived`, `other`. |
| `build` | yes | `{command, output, tools}`: the one shell command (≤ 500 characters), its relative output path (made by the build, never an input), and `[{name, version}]` tools (≤ 20). |
| `paid_calls` | no | `[{output_path, provider, endpoint, request}]`, ≤ 100; each `output_path` is a stored input, so a rebuild never pays again. |
| `notes` | no | Plain text, ≤ 4,000 characters. |

## recipe/source.json (what the packer writes)

`format` is always `"gooseworks-video-source/1"`; `build`, `paid_calls` and `notes` come from the spec. `files` is `[{path, sha256, text}]`, each matched file's exact text and SHA-256 (1 to 400). `inputs` is `[{path, media_id, sha256, bytes, role}]`, measured from the build folder (≤ 200, 2 GB total).

Limits: 10 MB per recipe, 2,000,000 characters per text file. Paths are relative, with no `..`, `~`, drive letter or leading slash.

The packer refuses, naming the file and line: binary or non-UTF-8 files (upload them as inputs), paths on someone's computer, expiring links (signed storage or provider result links), and anything that looks like a key, token or password.

## Example `SPEC.json`

```json
{"files": ["build.sh", "timeline.json"],
 "inputs": [{"path": "media/scene-01.mp4", "media_id": "MEDIA_ID_1", "role": "generated_clip"}],
 "build": {"command": "bash build.sh", "output": "out/final.mp4", "tools": [{"name": "ffmpeg", "version": "7.1"}]}}
```

## The production record's `source`

| Field | What it holds |
| --- | --- |
| `bundle` | `{media_id, sha256, path}` of the confirmed stored `recipe/source.json`. |
| `build_command` | Exactly the recipe's `build.command`. |
| `rebuild_check` | `{result, compared, detail}` as the checker printed it. `result` is `identical` (compared `sha256`) or `matches` (compared `frames_and_audio`). |
| `limits` | Optional, ≤ 10: anything not storable, with its fallback. |

At completion the host re-reads the stored recipe and refuses a mismatched `bundle.sha256`, input id, size or checksum, or `build_command`.

## Bind portable assembly sources to owned inputs

Each assembly video, audio cue, speech driver and freeze source matches an owned, hash-checked recipe input. Use its media ID as `asset_id`, or declare a stable `inputs.asset_id` alias next to `media_id`. `production.clips.asset_id` uses the same alias; `production.clips.media_id` names the upload. Different bytes never share an alias. Saved timelines use recipe-relative input paths, never local ones. Aliases never replace checking the input bytes.
