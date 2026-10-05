# Human version

The installed podcast renderer contains the tested two-host pipeline, its
example inputs and its quality checks. Version 8 uses the existing public
voice, image and video skills. A private Studio checkout is no longer required.

Prepare the brand script, two host appearances, matched voices, a logo and
fonts. Preview the edit for free, approve each paid step, then check the finished
video. Choose the full-frame or split edit before generation; the split needs
two additional silent listener clips.

---

# Agent version

All `scripts/` paths are relative to **render-podcast-skit's installed folder**.
Keep the brand's inputs and run outputs outside that folder. Never overwrite
the package examples. The package's root `recipe.json` is the gate input.

## Prerequisites

- Python 3.10 or newer, Pillow 10 or newer, requests, ffmpeg and ffprobe.
- Installed sibling capabilities: create-vo-elevenlabs, create-image-gpt-image-fal,
  create-video-fal and watch. `PODCAST_SKILLS_DIR` may point to their common parent.
- Authorized provider transport for the paid capabilities. In an app agent,
  the existing media transport handles billing and relay requests. A relay
  request is pending work: complete it and resume the command; do not replace
  it with a direct provider call.
- Brand wordmark or display font, caption font, two host appearances and a
  confirmed voice per host. Export the approved voice library to a JSON file
  with a `voices` array, then pass it to `pick_voices.py --library`.

## Free preview

Copy `scripts/config.example.json` and `scripts/script.example.json` into the
brand project. Replace the fictional demo's product, cast and lines. Set both
voice IDs, names and gender metadata. Match the declared conversation arc to
the actual script. Supply brand assets and fonts as absolute paths or relative
to the run directory where the field requires it.

```bash
python3 scripts/pick_voices.py --config <brand-config> --library <voice-library> --write
python3 scripts/one_shot.py --config <brand-config> --script <brand-script> --run-dir <run> --no-paid
```

The example enables a supplied product panel and corner logo. Supply those
files or disable their corresponding options before previewing. The preview
uses stand-ins, writes `master-preview.mp4`, and spends nothing. Review the
script, pacing and layout here.

## Approved paid inputs and final render

Each generation command defaults to printing cost without calling a provider.
Add **both** `--confirm --execute` only after approval of that step.

```bash
python3 scripts/gen_paid.py vo --config <brand-config> --run-dir <run>
python3 scripts/plan_beats.py --config <brand-config> --script <brand-script> --run-dir <run>
python3 scripts/gen_paid.py plate --config <brand-config> --run-dir <run>
python3 scripts/crop_singles.py --config <brand-config> --run-dir <run>
python3 scripts/gen_paid.py clips --config <brand-config> --run-dir <run>
# Split cuts also need idle clips; full-frame-only cuts do not.
python3 scripts/gen_paid.py idle --config <brand-config> --run-dir <run>
python3 scripts/one_shot.py --config <brand-config> --script <brand-script> --run-dir <run>
python3 scripts/selftest.py
```

The second command must run **after** voice generation. It measures the audio
and writes the timeline used for lip-sync and captions. Voice generation writes
`voiceovers/beat-NN.mp3` and `voiceovers/beat-NN.timestamps.json`; both are required
to resume. The image adapter uploads local references through the installed
image capability. Lip-sync uses Veed Fabric with that host's exact audio and
stills through the installed video capability. No provider key is copied into
the package. Motion inserts are unimplemented and fail explicitly if enabled.

## Acceptance and review

The driver checks `master.mp4` against the plan. Run the 65-case self-test, then
watch the whole result. Require matching host voices, stable identity and room,
caption timing, no frozen speaking host, a real brand lockup and the chosen
conversation dynamic. Review the finished video in the run directory. A free
preview or successful package check does not certify generation quality.
