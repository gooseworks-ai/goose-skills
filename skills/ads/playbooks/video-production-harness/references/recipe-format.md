# Human version

`recipe/source.json` is the one file that lets anyone rebuild a finished video from the project alone. It holds the build's code and settings as text and lists every media input by its stored file id and checksum. Its format name is `gooseworks-video-source/1`.

- **Write it with** the packer, **prove it with** the checker: `python3 scripts/pack_recipe.py ...` and `python3 scripts/check_recipe.py ...`. Both scripts ship in this package's scripts folder.
- **Do not write it by hand.** The packer computes every checksum and refuses paths, links and keys that would break a rebuild.
- **The host's production record points at it** by stored file id and checksum. When the recipe changes, upload it again and update that pointer.

---

# Agent version

## Steps

1. Upload every file the build reads to the host project and confirm it. Note each stored file id.
2. Write `SPEC.json` (below) in the build folder.
3. `python3 scripts/pack_recipe.py --root BUILD_DIR --spec SPEC.json --out recipe/source.json`. It prints a `source` template with the recipe's checksum.
4. Upload `recipe/source.json` to the project at path `recipe/source.json` (kind `document`) and confirm it. Note its file id.
5. Download the inputs from the host into an empty folder at their recipe paths, then `python3 scripts/check_recipe.py --bundle recipe/source.json --inputs DOWNLOADED_DIR --final FINAL.mp4 --work EMPTY_DIR`. Keep the JSON it prints.
6. Save the production record's `source` (below). If you change the recipe later, repeat steps 3 to 6. Use the host's source-only update when it has one, so the rest of the record stays as saved.

## SPEC.json (input to the packer)

| Field | Required | What it holds |
| --- | --- | --- |
| `files` | yes | Globs, relative to the build folder, of code and settings files (UTF-8 text only). Globs skip hidden files; name one exactly to include it. |
| `inputs` | yes when the build reads media | `[{path, media_id, role}]`. `path` is relative to the build folder. `media_id` is the stored project file. `role` is one of `brand_asset`, `product_photo`, `logo`, `font`, `voice`, `music`, `sfx`, `generated_image`, `generated_clip`, `stock`, `derived`, `other`. |
| `build` | yes | `{command, output, tools}`. `command` is the one shell command that makes the final (at most 500 characters). `output` is its relative output path, made by the build, never an input. `tools` is `[{name, version}]`, at most 20. |
| `paid_calls` | no | `[{output_path, provider, endpoint, request}]`, at most 100. Each `output_path` must be a stored input: a rebuild reuses it and never pays again. |
| `notes` | no | Plain text, at most 4,000 characters. |

## recipe/source.json (what the packer writes)

| Field | What it holds |
| --- | --- |
| `format` | Always `"gooseworks-video-source/1"`. |
| `build` | `{command, output, tools}` from the spec. |
| `files` | `[{path, sha256, text}]`: every matched file's exact text and the SHA-256 of its UTF-8 bytes. At least one, at most 400. |
| `inputs` | `[{path, media_id, sha256, bytes, role}]`, measured from the build folder. At most 200, 2 GB in total. |
| `paid_calls`, `notes` | Copied from the spec when present. |

Limits: the whole file is at most 10 MB, and each text file at most 2,000,000 characters. Paths are relative, with no `..`, `~`, drive letter or leading slash.

The packer refuses, naming the file and line:

- binary or non-UTF-8 files (upload them as inputs instead);
- paths on someone's computer (a home folder or a Windows user folder);
- links that expire (signed storage links, provider result links);
- anything that looks like a key, token or password.

## Example

`SPEC.json`:

```json
{
  "files": ["build.sh", "timeline.json", "captions/*.ass"],
  "inputs": [
    {"path": "media/scene-01.mp4", "media_id": "MEDIA_ID_1", "role": "generated_clip"},
    {"path": "media/voice.mp3", "media_id": "MEDIA_ID_2", "role": "voice"},
    {"path": "fonts/Inter-Bold.ttf", "media_id": "MEDIA_ID_3", "role": "font"}
  ],
  "build": {
    "command": "bash build.sh",
    "output": "out/final.mp4",
    "tools": [{"name": "ffmpeg", "version": "7.1"}]
  },
  "paid_calls": [
    {"output_path": "media/scene-01.mp4", "provider": "fal", "endpoint": "VIDEO_MODEL_ENDPOINT", "request": {"prompt": "..."}}
  ],
  "notes": "Scene 1 is a generated clip; the rest is ffmpeg."
}
```

The `recipe/source.json` it writes (shortened):

```json
{
 "format": "gooseworks-video-source/1",
 "build": {"command": "bash build.sh", "output": "out/final.mp4", "tools": [{"name": "ffmpeg", "version": "7.1"}]},
 "files": [{"path": "build.sh", "sha256": "<64 hex>", "text": "#!/bin/sh\nffmpeg ..."}],
 "inputs": [{"path": "media/scene-01.mp4", "media_id": "MEDIA_ID_1", "sha256": "<64 hex>", "bytes": 4810233, "role": "generated_clip"}],
 "paid_calls": [{"output_path": "media/scene-01.mp4", "provider": "fal", "endpoint": "VIDEO_MODEL_ENDPOINT", "request": {"prompt": "..."}}],
 "notes": "Scene 1 is a generated clip; the rest is ffmpeg."
}
```

## The production record's `source`

| Field | What it holds |
| --- | --- |
| `bundle` | `{media_id, sha256, path}`: the confirmed project file holding `recipe/source.json`, the SHA-256 of its stored bytes, and its path. |
| `build_command` | Exactly the recipe's `build.command`. |
| `rebuild_check` | `{result, compared, detail}` as the checker printed it. `result` is `identical` (compared `sha256`) or `matches` (compared `frames_and_audio`). |
| `limits` | Optional, at most 10: anything that could not be stored, with its fallback. |

The host re-reads the stored recipe at completion. It refuses when the stored bytes don't match `bundle.sha256`, when an input's id, size or checksum doesn't match, or when `build_command` differs from the recipe's.
