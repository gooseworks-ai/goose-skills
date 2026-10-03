# create-street-interview-video — readiness

**Current summary (2026-10-03).** Product-guess retains the existing object renderer and
approved prompt baseline. Conversation supports **free script/config/prompt previews only**
for mic-only, prepared-sample and visible-task interactions. No conversation media endpoint,
price, performed timing, sampling action or camera/audio result is validated. Every subtype
still refuses `single_gen.py --yes` and product/scene reference bindings.

## Current conversation preview support

- Configs may describe `interaction.type`, `visible_setup`, `participant_reason` and optional
  props. Missing interaction data remains mic-only. Product-sample uses a prepared plain cup;
  concept-challenge uses described non-UI props; mic-only can explain a service without a
  device. Phone, screen and UI demonstrations remain unsupported.
- Ordered shots can include explicit visual/action descriptions and silent action/reaction.
  A participant answer or silent action can open the edit. The first actual interviewer
  question exactly matches `cfg.question` and is spoken once. Both people still speak.
- The native preview checks retain 3–8 shots, a 6–15s duration and the provisional ceiling of
  2.5 spoken words/s. Authors must leave breathing room for actions; these checks cannot
  verify performed timing or quality.
- Writing starts with a complete inspected commercial street interaction and a coherent
  situation brief. Full visual and spoken coverage, setup, participation, hook, product
  role and payoff are required. Seed snippets are leads; radio/editorial material is not
  a fallback. Unseen recruitment stays unknown. See
  [street-script-writing](references/street-script-writing.md).
- Human review is on the situation brief, words, action timeline, earned brand connection,
  ending-card specification and prompt preview. A clean dry run verifies construction,
  not media delivery. A rendered pilot and delivery review are still required before
  conversation can become a paid production path.

## Historical product-guess readiness (2026-09-29)

The report below is preserved as history, not the current production verdict. The later
[REFERENCE.md status](REFERENCE.md#status) records that the user accepted the single-take
faces on 2026-10-01 and that a product-guess episode shipped. That does not validate any
conversation subtype. Product-guess prompt instructions remain unchanged.


State as of 2026-09-29. Written from a pass over the skill with **no paid generation of any
kind**: no still, no clip, no voice. Everything measured below came out of the take already paid
for (`ld-single-seed4802`) and the local reference footage.

---

## What now runs unattended

| Script | State | Verified |
|---|---|---|
| `paths.py` | new | repo root found by marker, run folder via `--run` / `$STREET_INTERVIEW_RUN` / default |
| `single_gen.py` | dry run clean, no network | prints model, seed, price, destination and the full prompt; `fal_helpers` import is now lazy so a dry run needs no key |
| `variants_gen.py` | dry run clean, no network | 6 variants, seeds 4810–4815, **$21.84** total ($17.42 on `--fast`) |
| `build_looks.py` | `--dry-run` clean, and a **real free render verified end to end** | dry run renders every caption layer and asserts the safe zone with no ffmpeg; the real run produced `street-ld-bare.mp4` 14.30s and its caption-free control |
| `phone_look_video.py` | runs; now fails loudly instead of silently | refuses to run without a real colour reference rather than grading against nothing |
| `check-cut.py` | **new gate, 9 checks, falsified both ways** | full PASS on the `bare` look with every check live, including Whisper |

Run order, all of it free except step 2:

```bash
cd skills/molecules/create-street-interview-video/scripts
python single_gen.py                        # dry run: prompt + price, nothing sent
python single_gen.py --yes                  # PAID ~$3.64  <-- needs explicit approval
python build_looks.py --dry-run             # free, no ffmpeg
python build_looks.py                       # free, all five looks + controls
python check-cut.py --look subway --falsify  # prove the gate can fail
python check-cut.py --look subway            # the ship gate
```

### What was broken before this pass

Three of the four scripts crashed on their own dry run from the skill directory. All of it was
path resolution: the scripts were lifted out of `projects/street-interview/working/`, where
`Path(__file__).parents[2]` happened to be the repo root and `./takes/` happened to hold the
take. Inside `skills/molecules/create-street-interview-video/scripts/` `parents[2]` is `skills/`
and `./takes/` does not exist.

- `single_gen.py` — `ModuleNotFoundError: fal_helpers` **on the dry run**, because the import was
  at module level. A dry run that needs an API key is not a dry run.
- `build_looks.py` — looked for the take at `scripts/takes/ld-single-seed4802.mp4` and wrote its
  caption-free controls into `scripts/graded/`, i.e. into the skill directory, breaking the
  run-folder convention outright.
- `check_cut.py` — same, plus it defaulted to `HERE.parents[0]/output/looks/`, and its
  `ffprobe` failure surfaced as `KeyError: 'streams'` rather than a message.
- `phone_look_video.py` — its colour reference defaulted to `../refs/tools/arcads-1.mp4`
  resolved inside the skill, where nothing exists.
- `variants_gen.py` — the only one that dry-ran, and only because it defers the fal import. Its
  `CAN` path was still wrong, so `--yes` would have failed at upload after printing a price.

Also fixed: the gate was named `check_cut.py`, against the `check-*.py` convention every other
molecule here uses (`check-episode.py`, `check-timing.py`). It is `check-cut.py` now.

### What is still missing, and is not a code problem

1. **`projects/` is gitignored, so the entire knowledge base is invisible on a fresh checkout.**
   The reference footage, the 40KB run log, the approved take, the five finished looks and the
   colour target all live under `projects/street-interview/`. `SKILL.md` says "Reference build:
   `projects/street-interview/`. Copy it, do not blank-page a new one" — which nobody cloning
   this repo can do. Mitigated here by copying the measurements into
   `references/REFERENCES.md` and the rejections into `TAKES.md`; **not** mitigated for the
   footage, which has to be re-downloaded.
2. **`SKILL.md` pointed at `AVATAR_GENERATION.md` with no path.** It is
   `one-shot-videos/AVATAR_GENERATION.md`. Fixed.
3. **`skills/atoms/_shared/MODEL_BEHAVIORS.md` carries a stale entry** — "Seedance 2.0 · the
   likeness gate makes it unusable for photoreal street strangers (2026-09-28) … route it to H3
   or Veo from the start". Seed 4501 disproved it: the gate inspects **uploaded images**, not
   generated faces, so `text-to-video` and `reference-to-video` with a *product* reference both
   work. I have deliberately **not** edited that file: it has uncommitted changes from another
   session running in this same checkout (`SYNC_LEDGER.json` and `SYNC.md` disappeared from the
   working tree while this pass was in progress). One correcting entry is owed there and should
   be made by whoever owns that file's current edits.

---

## What is unproven

### 1. The blocker: nobody has ruled on whether the approved take's faces pass

This is the one that matters and it is not a code gap. Four rounds of generated street strangers
were rejected for reading as AI (fal stills → Veo/H3; two still re-rolls; H3 with a real
reference video). The standing rule is that **a passing example must exist before more spend.**

But the four rejections were all on the *pre-single-generation* routes. `ld-single-seed4802` is
recorded as "the approved base" and was approved on structure — one location, one room tone, a
mic in every shot. **No verdict has ever been given on its faces specifically.** Until that
verdict exists, every priced variant in `variants_gen.py` is a bet on an untested assumption,
and the recipe is not production-ready no matter how clean the scripts are.

### 2. The pace gap, which is measured and unclosed

| | median shot | shots |
|---|---|---|
| Salary Transparent Street | 1.60s | 37 in 74.4s |
| Chris Klemens | 1.62s | 12 in 22.4s |
| SubwayTakes | 1.54s | 64 in 122.2s |
| **ours (seed 4802)** | **2.61s** | **4 in 12.1s**, final shot 5.18s |

Three references across two frame rates and 220s of material agree inside 150ms. We are ~60%
slower, with a final shot longer than any shot in Klemens. This is free to change — it is how
many internal shots one call is asked for — and it has never been tried.

### 3. Nobody has heard any of it

Every audio judgement on this format is measured, never listened to. The loudness, the per-shot
noise floor and the Whisper transcript all pass; that is not the same as it sounding right. Say
so when handing a cut over.

### 4. Untested endpoint

`bytedance/seedance-2.0/image-to-video` is confirmed live on fal and is what the best-in-field
example uses. Its likeness gate may behave differently from `reference-to-video`. Never tried.

### 5. One brand only

Everything is built against Liquid Death, whose joke (a can that looks like beer and is water)
is unusually well suited to a vox pop. AG1 is the outstanding second brand and would show
whether the recipe generalises or whether it is one good joke.

### 6. What `check-cut.py` cannot see

It cannot tell whether a face reads as AI — no automated check caught any of the four rejections
— and it cannot tell whether a viewer can follow the video. Check D gets as close as a payload
can (the product must appear in shot 1 and the final shot, after a cut was once rejected for
showing the can only at 19s), and a human still has to watch the whole thing (`/watch`).

---

## The cheapest next experiment

### Do this first, and it costs $0

**Ask for a realism verdict on the approved take, side by side with the real references.**

Build a compare video: `street-ld-bare.mp4` (no captions — the honest control, graphics cannot
carry it) cut against `refs/sts.webm`, `refs/klemens.webm` and `refs/tools/arcads-1.mp4` (real
licensed actors) at matched size, and ask one question: *which of these read as AI?*

- **Cost: $0.** ffmpeg only; every input already exists on disk.
- **Time: minutes.**
- **What it settles:** whether the single-generation route cleared the bar that four earlier
  routes failed, which is the exact precondition the standing rule demands before more spend.
- **Why it is the right next move:** $21.84 of variants are written and priced. Sending any of
  them before this verdict is spending on an assumption that has been wrong four times. If the
  answer is "still AI", the honest conclusion is the one already in `SKILL.md` — Arcads-grade
  realism is ~1,000 licensed real actors at ~$11/video on the Pro tier, which is a licence, not
  a prompt — and the correct next step is a purchase decision, not a re-roll.

### If and only if that verdict is "this passes"

**One `--fast` call to close the pace gap.** Same payload as seed 4802, new seed, asking for 4
internal shots inside a 6s take instead of 12s, which targets the references' 1.5–1.7s median.

| | |
|---|---|
| endpoint | `bytedance/seedance-2.0/fast/reference-to-video` |
| duration | 6s (per `CLAUDE.md`: generate ~6s, not 8s — defects live in the unused tail) |
| resolution | **720p** (per `MODEL_BEHAVIORS.md`: the classifier sweeps harder at 1080p; preview at 720p first) |
| seed | pinned and recorded in `TAKES.md`, as every seed here is |
| **cost** | **$1.45** (6s × $0.2419/s) |
| fallback if only 4s/8s durations are accepted | $0.97 / $1.94 |
| for comparison | a full-length take is $3.64, and the six written variants are $21.84 |

It is a real test rather than a re-roll because it changes one measured variable — shot count per
second — against a number taken from three references that agree. If 4 shots in 6s holds one
location and one room tone, the pace gap closes for $1.45 and the recipe is production-ready. If
6s cannot hold four shots, that is worth knowing for $1.45 and is recorded, not repeated.

**Nothing on either step may be sent without explicit approval.** The lock order applies: the
$0 verdict is the cheap artifact, and it comes before the $1.45 call, which comes before the
$21.84 sweep.
