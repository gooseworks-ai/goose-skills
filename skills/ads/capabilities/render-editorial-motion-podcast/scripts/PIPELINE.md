# Pipeline — editorial-motion-podcast

How `config.example.json` maps to the real production steps. This molecule ships a
**config + this map**, not a bundled runner: the worked example (Klarify "Rat Park") was
produced by hand-run bash + PIL scripts that live in
`clients/klarify/ad-runs/future-of-therapy-rat-park/scripts/`, with the full reproducible
recipe in that run's `how-to.md` and the gotchas in its `learnings.md` (L1–L13).

The steps run **in order** because each depends on the last: the clipped audio sets the
timeline, the timeline marks the beats, the style anchor locks the look pack, the anchor
seeds every keyframe, the keyframes drive the ffmpeg motion, and assembly muxes the real
audio + Whisper captions + PIL end card.

**Total cost ≈ $3.40** end-to-end (or ~$1.78 if you skip the retired Seedance detour) —
the motion + assembly + end card layers are **$0**.

## 1. Clip audio + transcribe  (config: `audio`)  [cheap ~$0.04]

**Clip the real podcast to the payoff moment — it sets the timeline.** Find the moment in
the source transcript and `ffmpeg -ss/-to` the episode MP3 to `audio.clip_start_sec ..
clip_end_sec`, adding `afade=t=out` (`audio.fade_out`) so the trailing next sentence
doesn't bleed in:

```bash
ffmpeg -y -ss 933.5 -to 973.30 -i <source_mp3> \
  -af "afade=t=out:st=39.30:d=0.5" -c:a libmp3lame -b:a 192k \
  audio/source-rat-park-40s.mp3     # -> 39.84s clip ending cleanly on "community."
```

Then Whisper word timings via the **`transcribe-audio-fal`** atom (`fal-ai/whisper`,
~$0.04, <30s — default to it; local whisper ran 40min+ CPU and was killed, L8) →
`audio/words.json`. Mark every payoff word's time; each beat's visual must START within
~0.5s of its line (never ahead = spoils the reveal, never lag = redundant, L3). There is
**no generated song and no VO** — the host's real recorded line is the narration.

## 2. Style anchor → Nano Banana  (config: `look_pack.style_ref`, `look_pack.anchor_keyframe`, `keyframe_engine`)  [PAID]

`create-image-nano-banana-fal` from `look_pack.style_ref` (`moodboard/style-ref-01.png`)
→ the FIRST keyframe (`generated/style-anchor/anchor-cage-1.png`, "Cage 1"). This anchor is
the reference EVERY subsequent keyframe chains off (`--ref-image`), so cage/character
geometry stays consistent. **Approve the anchor before fanning out** — it locks the whole
look pack (palette, line weight, halftone discipline, geometry).

## 3. Remaining keyframes → Nano Banana (chained refs!)  (config: `beats[].keyframe(s)`, `look_pack`, `keyframe_engine`)  [PAID]

Per beat, build the prompt as `look_pack.style_opener + beats[i].keyframe_prompt +
look_pack.negative_tail`, and call Nano Banana **passing the anchor (and any earlier
matching frame) as an additional `--ref-image`** — otherwise Nano Banana invents a new
cage every time (L2). One PNG per beat (or a small panel set for the decline arc). Full
set ≈ 26 rolls incl. re-rolls (~$1.00). Keep prompts **metaphor-forward, never clinical**
(`cocaine` / `kept drinking till they died` trips FAL's `content_policy` filter; "energy
fades / settle resting" gives the same visual and passes, L6). Review ALL N before motion;
re-roll drift, leaked color, or a leaked "CAGE 1" label (add all-caps "ABSOLUTELY NO TEXT,
NO LETTERS, NO LABELS", L-misc).

## 4. ffmpeg ken-burns motion + assembly → `build_v4.sh`  (config: `beats[].motion`, `motion_engine`)  [FREE]

`clients/klarify/ad-runs/future-of-therapy-rat-park/scripts/build_v4.sh` renders each
keyframe as a ken-burns segment and hard-concats them. **NO generative i2v** — Seedance
hallucinated a photoreal drawing hand + morphed rats into humanoids + hallucinated cartoon
clouds; it's photoreal-trained and can't hold the 2-tone discipline (L1, retired). The two
reusable helpers:

- `render_kb  <src> <out> <dur> [zoom_end=1.04]` — push-in: scale to 2×, crop, `zoompan
  z='min(zoom+step,zoom_end)' d=dur*fps`, `trim=duration=dur`, `-t dur`.
- `render_kb_out <src> <out> <dur> [zoom_start=1.08]` — pull-back: `zoompan` from
  `zoom_start` down to `1.0` (reflective held frames, e.g. the dead-rats hold).

Long beats split into micro-cuts (target **8–10 distinct visual moments**; anything held
> 6s reads static even with active zoompan, L10). **Hard-concat on the beat — NO
crossfades** (they ghost two drifting cages, L2). **Never `-loop 1` with `zoompan d=N`** —
d runs per input frame per loop, so a 3s target ballooned to 225s (L7); feed a single
image, clamp with `-t` + `trim=duration`. Concat all beats → `edits/master-video-only.mp4`,
then mux the real clip letting the video run a ~1.5s silent hold past the audio:

```bash
ffmpeg -y -i edits/master-video-only.mp4 -i audio/source-rat-park-40s.mp3 \
  -c:v copy -c:a aac -b:a 192k -map 0:v:0 -map 1:a:0 edits/master.mp4
```

## 5. End card → `build_endcard.py`  (config: `end_card`)  [FREE]

`scripts/build_endcard.py` composites the brand lockup via **PIL** from the REAL brand
wordmark PNG (`end_card.brand_asset`): stretch a 1px center column of the source →
1080×1920 + `GaussianBlur(80)` for the gradient bg; feathered radial-alpha ellipse crop of
the brand mascot pasted centered-upper; wordmark (Helvetica 160) + tagline (Helvetica 48)
drawn with `ImageDraw.text` → `generated/klarify-endcard-9x16-final.png`. **Never AI-render
brand text** — Nano Banana spelled "therapists" as "therapits" (L4). Before building from
scratch, `find <brand> -name "*wordmark*"` — the brand team already made the right asset (L9).

## 6. Captions + final  (config: `captions`)  [PAID ~$0.04]

Whisper (fal) on `edits/master.mp4` → `frosted-subtle` ASS via the **`burn-in-captions`**
skill → `edits/master-captioned.mp4` (the FINAL deliverable). Captions **ON only while the
speaker is mid-sentence** — leave silent/reflective beats and the end card uncaptioned so
they don't double up with the visual. This is real spoken VO, so Whisper works (sung audio
returns "🎵 Music Playing 🎵"). `ls templates/` before assuming a style exists — only
`frosted-subtle` + `karaoke-fill` were present.

```bash
python3 .claude/skills/burn-in-captions/scripts/caption.py \
  --video edits/master.mp4 --style frosted-subtle
cp edits/master.captions/master__frosted-subtle__ass.mp4 edits/master-captioned.mp4
```

## 7. Watch / QC  [~$0]

`/watch:watch edits/master-captioned.mp4 --fps 2` and Read every 4–5 frames across the
full duration — the ONLY honest loop (single frames miss timing drift, caption collisions,
black first-frame, band artifacts, L5). Iterate on timing per findings.

---

Re-cuts (new beat windows, added micro-cuts, re-timed caption ranges, swapped end card)
reuse the existing clipped audio / keyframes / clips and cost **$0** — only steps 1–3
(+ the two Whisper calls) spend.
