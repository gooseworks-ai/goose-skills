# PIPELINE — flat-vector-explainer engine map

This molecule is **documentation-grade**. Rather than re-implement a 14-scene Remotion
app here, it maps every `config.json` field to the **real, runnable script** that
produced the worked example. The executable reference is the source project:

```
clients/spoiled-child/video-11-routine-broken/
```

Its `HOW_TO.md` + `LEARNINGS.md` are the authoritative v3 recipe (Kling i2v + Remotion
overlay). Run the pipeline there (or port these scripts into a new brand's project
folder), then bring the config here as the recipe of record.

## Config field → source script

| `config.json` field | Source script | Phase | Paid? |
|---|---|---|---|
| `character.anchor_prompt`, `character.keyframe_variants`, `scenes[].keyframe_prompt` | `working/gen_keyframes.py` | 1 — character lock + per-scene keyframes (nano-banana, flat-vector; re-render a FRESH anchor — never chain a photoreal ref) | **PAID** |
| (clean plates — strip baked text) | `working/clean_plate.py` | 2 — nano-banana edit removes chips/numerals/taglines/badges from character keyframes → clean plates for i2v | **PAID** |
| `scenes[].motion`, `kling.*` | `working/kling_i2v.py` | 3 — Kling 2.5-turbo/pro i2v on character scenes only; cfg 0.5 + style-preserving negative + subtle motion; TEST one scene first | **PAID** |
| `scenes[].overlay` (chips, numerals, taglines, slate, CTA) | `working/remotion/` (Remotion project) | 4 — imports each Kling clip as the moving base and composites ALL text as animated DOM ON TOP → animated silent master. Text is NEVER baked into a keyframe | free |
| `product_grid.*` | `working/scripts/build_scene08.py` | 4 — PIL composite of the N real product webps on the brand ground (preserve each aspect; AI duplicates SKUs so this is PIL, not AI) | free |
| `voice.*`, `scenes[].vo` | `working/scripts/render_vo.py` | 5 — ElevenLabs eleven_v3, `text-to-speech/with-timestamps`; full-sentence per-scene VO + char-level timestamps | **PAID** |
| `music.*` | `working/gen_music.py` | 5 — ElevenLabs music bed, lo-fi pop, VO-forward loudnorm | **PAID** |
| (VO+music mix) | `working/scripts/mix_audio.sh` | 5 — place each VO line at its scene start, duck music under VO (sidechaincompress), `loudnorm I=-15`, VO-forward | free |
| `captions.*` | `working/scripts/build_captions.py` | 5 — word-by-word burned captions from the VO char-timestamps (libass); suppress on slate/grid/CTA scenes | free |
| (silent master assembly) | `working/scripts/build_silent.sh` | 4 — stitch the Remotion-composited scenes into `working/silent-master.mp4` (the ANIMATED master) | free |
| (50s master) | `working/build_master.py` | 5 — mux silent master + mixed audio, burn captions LAST → `finals/master-final.mp4` | free |
| `cutdowns.*` | `working/build_30s.py` | 6 — slice each beat's region OUT of `silent-master.mp4` (the ANIMATED master, NEVER a static intermediate); trim short / slow long (≤1.6×); re-burn scaled captions → `finals/master-final-30s-v1.mp4` | free |
| (QC) | `working/motion_probe.py` | 7 — frame-diff proof of localized motion (+ `/watch` the final) | free |

## The two non-negotiable separations

1. **Motion layer ≠ text layer.** `clean_plate.py` strips text → `kling_i2v.py` animates
   the clean plate → `remotion/` composites text as DOM on top. Never `kling_i2v.py` a
   keyframe with baked text (i2v warps it, and you can't retime/restyle it).
2. **Real assets ≠ AI assets.** `build_scene08.py` PIL-composites the real product webps.
   AI gen duplicates SKUs in a grid — it is only for the character vignettes + backgrounds.

## The cut-down trap (LEARNINGS L6)

`build_30s.py` MUST slice from `working/silent-master.mp4` (the Kling-animated master),
NOT from `working/segs/` (an earlier static Ken-Burns round). The mtime is the tell.
A finished-looking audio mix can hide frozen characters — always run `motion_probe.py`
frame-diff on a character scene and confirm **localized** face/hand glow (whole-outline
glow = pan-only = wrong source).
