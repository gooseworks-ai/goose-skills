# Scripts

Three helpers, for shell hosts. The playbook never needs a script to write prompts or pass a gate.

## `place_logo.py`: put the real logo on a finished render

The image model redraws logos, so the prompt leaves a clear corner and this places the brand's real file there. No model or network calls; the render is never overwritten.

```bash
python3 place_logo.py render.png logo.png render-logo.png --corner br --width 0.18 --plate auto
```

`--corner` tl, tr, bl, br, tc or bc (match the area the prompt left clear); `--width` the logo's share of the render width; `--plate auto` adds a rounded white or near-black plate that contrasts with the logo, `none` places it bare, or give a hex colour. It prints the box it used; record it in the batch file. Uploading and saving the result: the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`) step 1. Needs Pillow.

## `template_sheet.py`: show templates as one image

The marketer must see each ad's template and its two alternates before paying, and at hand-off the template next to the finished ad. This lays the images side by side with a caption under each and outlines the first as chosen.

```bash
python3 template_sheet.py ad1-templates.jpg --title "Ad 1 · balanced" "A (chosen): your bundle ad, graphic=https://…/a.png" "B: library, lifestyle=https://…/b.jpg" "C: library, 3D=https://…/c.png"
python3 template_sheet.py ad1-based-on.jpg --no-chosen "Based on: your bundle ad=https://…/a.png" "Finished ad=ad1-logo.png"
```

Each tile is `caption=source` (no `=` in the caption); a source is a URL or a local file. Then show it to the marketer, not only to yourself: if the host has a send-file tool, send it (Claude Code desktop: `SendUserFile`, `display: "render"`); in a terminal, `open` it and give its full path; in an app that shows images, attach it. Viewing it with your own image reader does not count.

## `repair_patch.py`: free official-label pixel repair

Used only for label drift (the `make-static-ads-render-review` skill (`../../make-static-ads-render-review/SKILL.md`) step 4): read `repair_patch.md` next to this file.
