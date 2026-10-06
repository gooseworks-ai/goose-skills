---
name: review-ugc-render
description: Mandatory pre-publish review gate for a UGC video render. Transcribes the finished render's AUDIO with Whisper and word-diffs it against the approved spoken script, then gates pinning the final render (video_project_upsert patch.final_render_id) — blocking a render whose generated audio mis-voices a word (e.g. the approved "human-vetted" spoken as "human witted"), says a different number or brand name, flips a negation, drops an approved phrase, or comes back silent. Correct speech written differently ("5mg" said "five milligrams", "30%" said "thirty percent", a spoken URL, "don't" said "do not", "braxleybands" said "braxley bands", a confirmed pronunciation like "AG1" said "A G one") passes. Runnable, gating counterpart to content-goose's review-transcript-integrity atom. Every ugc-video-formats recipe runs this after render and BEFORE pinning the final render.
owner: akhil
status: active
version: 2
created: 2026-07-04
updated: 2026-10-06
---

# review-ugc-render

> The QC gate every UGC video recipe MUST clear before it publishes. Not an
> eyeball `/watch` — a deterministic transcript-vs-script diff that exits non-zero
> on a defect so the recipe can hard-stop pinning the final render
> (`video_project_upsert` `patch.final_render_id`).

**In short:** it compares what the render actually SAYS with the script the user
approved. Correct speech that is only written differently passes (numbers, units,
URLs, contractions, fused brand names, confirmed pronunciations). A wrong number,
a flipped negation, a mis-voiced word or brand, a dropped phrase or silence fails.

## Why this exists

Seedance generates the audio natively. It sometimes **mis-voices a word** — the
approved line `human-vetted` comes back spoken as `human witted`; documented
siblings: `Hume`→`Hune`, `Alitu`→`al-too`. The defect lives in the render's
audio, so an eyeball `/watch` ("dialogue matches the script") slips it through,
and a downstream caption pass then bakes the wrong word in verbatim. Nothing was
comparing the **actual spoken audio** against the **script the user approved**.

This gate does exactly that, deterministically, and refuses to publish on a miss.

## When to run

- **MANDATORY** in every `remix-ugc-*-from-sample` and `create-ugc-*-video-from-refs`
  recipe, in the QC phase, **after** the master render exists and **before**
  pinning it as the final render (`video_project_upsert` `patch.final_render_id`).
- Re-run after every fix / re-roll until it PASSES.

## Contract

Before rendering, persist the exact approved spoken lines (the verbatim utterance,
no beat notes) to `working/approved-script.txt`. Then, after render:

```bash
python3 <pack>/review-ugc-render/scripts/review_render.py \
  --video working/final.mp4 \
  --script-file working/approved-script.txt \
  --pronunciations working/pronunciations.json \
  --json working/review-verdict.json
```

- **exit 0 → PASS** — proceed: pin the final render (`video_project_upsert` `patch.final_render_id`).
- **exit 2 → FAIL** — do NOT pin it. Read the report, fix, re-run.
- **exit 3 → ERROR** — the check could not run (see below); fix the environment or
  the input, do not publish blind.

Transcription backend (in priority order): the GooseWorks whisper-proxy (CLI
credentials or the sandbox token) → `OPENAI_API_KEY` (honors `OPENAI_BASE_URL`) →
local `whisper` CLI. `ffmpeg` must be on PATH.

## What counts as the same speech

Both the script and the transcript are put in one canonical spoken form before the
diff. The rules are **bounded** — each is an exact rewrite, never a fuzzy match.

| Written | Heard | Rule |
|---|---|---|
| `49`, `105`, `2,500` | `forty-nine`, `one hundred and five`, `two thousand five hundred` | number words = digits |
| `2.5`, `2026`, `1st` | `two point five`, `twenty twenty six`, `first` | decimals, years, ordinals |
| `5mg`, `30g`, `500ml`, `12oz`, `10 lbs` | `five milligrams`, `thirty grams`, … | unit **after a quantity** |
| `30%` | `thirty percent` / `30 per cent` | percent |
| `$49`, `$49.99` | `forty nine dollars`, `forty nine dollars and ninety nine cents` | money |
| `braxleybands.com`, `www.example.com` | `braxleybands dot com`, `w w w dot example dot com`, `example dot com` | URL; `www.` is optional |
| `don't`, `can't`, `it's`, `you're` | `do not`, `cannot` / `can not`, `it is`, `you are` | contractions |
| `Braxleybands`, `Gooseworks` | `Braxley Bands`, `goose works` | fused/split: exact join of 2–3 words |
| `AG1` | `A G one`, `A.G. one`, `A G 1`, `AG one` | **only** with a confirmed alias |

Guards that keep the rules honest:

- A unit word **not** after a quantity is left alone — a brand "MG" never becomes
  "milligrams".
- Letters spelled one by one ("A G") are **not** fused into a word. That needs a
  confirmed pronunciation.
- Fusion is exact concatenation. "Braxly Bands" is not "Braxleybands".

## What still FAILS

| Report line | Root cause | Fix |
|---|---|---|
| `[high] said "59" where script has "49" — number differs…` | Wrong number (also a wrong unit) | **Re-roll.** A number is never a benign paraphrase. |
| `[high] extra "doesn't" … negation changed` | A `not`/`never`/`no`/`without` was added or lost — the claim flips | Re-roll. |
| `[high] said "Hune" where script has "Hume" — brand name not heard as approved` | Brand mis-voiced or dropped (`--brand-term` / confirmed pronunciation) | Re-roll; spell it phonetically in the `SPOKEN LINE` (e.g. `Ali-too`, never a `(pronounced …)` parenthetical). See `create-video-seedance-2-fal` Failure Modes. |
| `[high] said "witted" where script has "vetted" — audio likely mis-voices…` | Seedance mis-voiced a similar-looking word | **Re-roll a new seed.** |
| `[medium] dropped "…"` / low similarity | Seedance dropped an approved phrase | Re-roll; if only a tail word, a surgical `stitch_replacement.py` window fix may recover it. |
| `[low] extra "…"` + low similarity | Extra speech beyond benign filler | Re-roll. A single filler word ("so", "okay") in a normal-length line is LOW and passes. |
| `⚠ audio is effectively silent` | Wrong render / audio track lost in post | Re-render / re-check the mux; never publish a silent take. |
| `ERROR: no transcription backend` | No proxy credentials, no `OPENAI_API_KEY`, no local `whisper` | Sign in / set the key / install `whisper`, then re-run. |
| `ERROR: alias … would change a number, unit or negation` | A bad `--alias` or pronunciation entry | Fix the alias. Aliases may only respell a name. |

The verdict passes only when similarity ≥ `--min-ratio` **and** there is no HIGH issue.
`--expect-music` is advisory only; it does not by itself fail the gate.

## Brand names and confirmed pronunciations

**Brand words are never removed from the diff.** (Before 2026-10-06, `--brand-term`
fuzzily stripped brand-like words, which let "Hune" pass for "Hume". That is gone.)

- `--brand-term TERM` (repeatable) — marks a brand name. Where it appears in the
  script, a mismatch is **HIGH** (a brand mis-voicing) and a dropped brand is HIGH.
  Its fused/split forms count as equal.
- `--alias "TERM=SPOKEN"` (repeatable) — a confirmed spoken form, e.g.
  `--alias "AG1=A G one"`. The term also becomes a brand term.
- `--pronunciations PATH` — the file `create-vo-elevenlabs`'s
  `scripts/read_pronunciations.py` writes
  (`{"brand_id", "basis", "pronunciations": [{"term", "say_as", "fact_id"}]}`).
  Every entry becomes an alias and a brand term. Pass the same file the voice-over used.

Rules for aliases:

- Only pass spoken forms the **user confirmed** (saved brand pronunciations, or a form
  they confirmed in chat). Never invent one from the transcript to make the gate pass.
- An alias may respell a name, digits included ("AG1" = "A G one"), but may **never**
  add, drop or change a number, unit or negation. Such an alias is an ERROR (exit 3),
  checked before any transcription is spent.
- If you listened and the audio is right but Whisper spelled a coined brand name in a
  new way, ask the user to confirm that spelling, save it as a pronunciation, and re-run.

## Inputs

- `--video PATH` (required) — the rendered master mp4.
- `--script-file PATH` **or** `--script "text"` — the approved spoken script. Omit
  both only for a genuinely script-free clip (the drift check is then skipped and
  the gate is advisory).
- `--brand-term TERM`, `--alias "TERM=SPOKEN"`, `--pronunciations PATH` — see above.
- `--min-ratio FLOAT` (default `0.90`) — transcript↔script similarity to pass,
  measured on the canonical spoken form.
- `--captions-srt PATH` — optional SRT to check for caption-text defects.
- `--json PATH` — write the machine verdict for the app's review panel. Each issue
  carries the canonical tokens (`script_words` / `heard_words`) and the original
  wording (`script_text` / `heard_text`).

## Tests

```bash
python3 tests/test_review_render.py    # or: python3 -m pytest tests/
```

Pure Python, no audio, network or paid call. Covers the QA-71 audit fixture table
(units, URL, numbers, percent, contractions, fused brands, wrong price, negation,
Hume→Hune), number words, units, URLs, negation flips, fused/split words, confirmed
AG1 aliases and their validation, omission, extra speech, the report wording, and the
CLI exit codes with transcription stubbed out.

## Relationship to the content-goose review engine

This is the shipped, single-file, gating slice of the fuller
`coworkers/video/molecules/review/review-loop` (18-axis rubric). Here we enforce
the one axis that catches audio-vs-script defects at publish time
(`review-transcript-integrity` / `brand_text_accuracy`). Deeper multi-axis review
stays in the content-goose lab.
