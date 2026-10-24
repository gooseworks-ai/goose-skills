# Scripts

Two helpers, for shell hosts. The playbook never needs a script to write prompts or pass a gate.

## `place_logo.py`: put the real logo on a finished render

The image model redraws logos, so the prompt leaves a clear corner and this places the brand's real file there. No model or network calls; the render is never overwritten.

```bash
python3 place_logo.py render.png logo.png render-logo.png --corner br --width 0.18 --plate auto
```

`--corner` tl, tr, bl, br, tc or bc (match the area the prompt left clear); `--width` the logo's share of the render width; `--plate auto` adds a rounded white or near-black plate that contrasts with the logo, `none` places it bare, or give a hex colour. It prints the box it used; record it in the batch file. Uploading and saving the result: the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`) step 1. Needs Pillow.

## `repair_patch.py`: free official-label pixel repair

Used only for label drift (the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`) step 4): read `repair_patch.md` next to this file.
