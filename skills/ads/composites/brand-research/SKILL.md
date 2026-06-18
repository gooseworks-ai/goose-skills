---
name: brand-research
description: Research a brand and produce a clean, reusable brand-context pack that any downstream video/ad skill can consume with zero re-work — four structured markdown docs (brand-summary, visual-identity, competitors, audience), a dated source list, an optional UI-reference doc, sourced logo + reference photos, an optional set of brand-anchored generated stills, and a concept brief. Every binary asset is cataloged in brand-assets/manifest.json with a name + usage description so an agent picks assets by purpose, not filename. Use when starting work on a brand a project hasn't touched before, or when a brand folder has empty/stub research that needs filling. Core path needs no API keys (runs on the agent's web tools); only the optional image step needs a FAL key. Walks an 8-phase pipeline (disambiguate → scaffold → web research → existing-ad analysis → source assets → optional imagery → concept brief → verify) with human gates, and ends on a deterministic verify_pack.py check.
---

# brand-research

A guided workflow for turning "go research [brand]" into a structured, reusable
**brand-context pack** — the ground-truth folder every downstream ad/video skill
reads before it generates anything. The skill is conversation-driven: the user
names a brand + product, you disambiguate, research the web, source and catalog
assets, and write a fixed set of files in a fixed shape. The shape is the whole
point — see `references/output-contract.md`.

## When to use this skill

Use when the user asks for any of:

- "Research [brand] for ads" / "set up [brand]" / "create a brand folder for [brand]."
- "Fill in the brand context" / "the brand-research docs are empty/stubs."
- Hands you a company URL (and maybe a Meta Ad Library link or some ad files) and wants context docs before any creative work.
- Any kickoff where a downstream skill needs `brand-research/*.md` + `brand-assets/manifest.json` populated.

Do NOT use when: the user wants to *make a video/ad now* (this skill only prepares
context — hand off to a production skill after), or the brand already has a
populated, current pack (run `verify_pack.py`; if it PASSes, you're done).

## What it produces

The brand-context pack at a brand root (full contract in `references/output-contract.md`):

```
<brand>/
├── brand-research/
│   ├── brand-summary.md        # what they sell / who / jobs-to-be-done / voice / never-say
│   ├── visual-identity.md      # colors / type / logo rules / photography / off-limits
│   ├── competitors.md          # ## Direct (win/lose) + ## Reference creative
│   ├── audience.md             # persona / where online / objections / proof points
│   ├── asset-urls.md           # every sourced URL + access date
│   └── ui-references.md        # ONLY if the product has notable UI
├── brand-assets/
│   ├── manifest.json           # catalog: name + usage description + kind per asset
│   ├── logos/  reference-photos/  [generated-product-shots/ generated-lifestyle/]
├── concept-brief.md            # supplementary concept seeds
└── ad-runs/                    # empty, for downstream per-ad work
```

## Pipeline overview

| Phase | What | Output | Needs key? | Gate? |
|---|---|---|---|---|
| 1 | Disambiguate the brand + product | (confirmed entity) | — | ✅ if ambiguous |
| 2 | Scaffold the brand root | folders + stub files + empty manifest | — | — |
| 3 | Web research → write the 4 docs + asset-urls.md | `brand-research/*.md` | — | ✅ user reviews |
| 4 | Existing-ad analysis (optional) | notes folded into `concept-brief.md` | — | — |
| 5 | Source logo + reference photos → register | `brand-assets/logos/`, `reference-photos/` | — | — |
| 6 | Generate brand-anchored stills (optional) | `brand-assets/generated-*/` | FAL | ✅ user approves |
| 7 | Concept brief | `concept-brief.md` | — | — |
| 8 | Verify | PASS from `verify_pack.py` | — | ✅ ship |

## Idempotency (re-runs skip what's already done)

This skill is **step-idempotent** so downstream skills (e.g. `remix-script`)
can invoke it on any brand at any time without caring whether research has
already run. Re-invocation is safe — only the missing pieces execute.

The contract:

1. **Always run `verify_pack.py` first.** If it prints `PASS`, exit
   immediately — there is nothing to do. If it `FAIL`s, parse its itemized
   error list to know exactly which phases need work.
2. **Per-phase skip rules** (each phase is gated on its own output, not on
   a global "did research run?" flag):
   - **Phase 2 — Scaffold:** `scaffold_brand.py` is already idempotent and
     won't clobber real content. Always safe to re-run.
   - **Phase 3 — Web research:** for each of the four `brand-research/*.md`
     docs, skip if the file exists, has all required headers, and contains
     no `TBD`/`TODO`/`FIXME` (the exact check `verify_pack.py` runs).
     Re-run only the docs that fail that bar. Same for
     `asset-urls.md` — skip if it already has ≥3 dated source URLs.
   - **Phase 4 — Existing-ad analysis:** skip if `concept-brief.md` exists
     and contains an `## Observed patterns from existing ads` section.
     Only run when the user provides new ad files this invocation.
   - **Phase 5 — Source assets:** skip if `brand-assets/manifest.json`
     already lists ≥1 logo asset and ≥2 reference-photos (each with a real
     `name` + usage `description`). Otherwise fetch only the missing slots.
   - **Phase 6 — Generate stills:** always opt-in and human-gated; never
     auto-run on a re-invocation triggered by a downstream skill. Skip
     unless the user explicitly asks for new imagery.
   - **Phase 7 — Concept brief:** skip if `concept-brief.md` exists,
     contains all required sections, and lists ≥6 concept ideas.
   - **Phase 8 — Verify:** always run at the end to confirm the gaps
     closed.
3. **Never overwrite real content on a skip-check pass.** If a doc exists
   but is incomplete, *amend* the missing sections rather than rewriting the
   whole file from scratch — the user's prior edits stay.
4. **Don't ask the user to confirm a skip.** A complete output is its own
   permission to move on. Only stop for the gates explicitly marked ✅ in
   the pipeline table below (and even those gates apply only to phases that
   actually ran this invocation — a skipped phase has nothing to gate).
5. **Hosts that can't run `verify_pack.py` (the goose-video local worker) get
   NO exemption from this contract.** Do the equivalent inventory by hand
   FIRST: list the brand folder (MCP `list_directory` / `read_file`), check
   every artifact against the skip rules above, and print a one-line verdict
   per artifact (`brand-summary.md: complete — skip`, `manifest.json: stub —
   patch`, `logo: missing — fetch`) BEFORE doing any research. Rewriting an
   artifact that passed its skip check is a contract violation, not diligence.
6. **`research_status: failed` describes the last RUN, not the pack.** A
   crashed run routinely leaves a complete pack missing only the finalize step
   or one asset. Real case (2026-06-11, Alitu): four good docs on disk, null
   logo, stub manifest — the correct fix was logo + manifest +
   `finalize_brand_research` (~30 seconds); the agent instead rewrote all four
   docs serially (~10 minutes). Audit, patch the gap, finalize.

A practical consequence: when `remix-script` (or any other downstream skill)
fires this skill because its `verify_pack.py` check failed, expect this skill
to do *only* the missing work and exit fast. A re-invocation on a fully
populated brand is a no-op that prints `PASS` and returns.

## Setup (run once per machine)

The core path needs **no keys**. Only opt-in image generation (phase 6) needs FAL.

```bash
pip install -r requirements.txt          # python-dotenv (+ fal-client only for phase 6)
cp .env.example .env                     # optional — only fill FAL_KEY if you'll run phase 6
```

All scripts are run from the skill folder and take `--brand-dir <path>` pointing
at the brand root you're building.

---

## Phase 1 — Disambiguate

**Goal:** confirm the brand + product resolves to exactly one entity before spending any effort.

1. Extract from the user's prompt: `brand` (slug for the folder), `product` (specific SKU/offer), and `brand_url` if given.
2. If the name is ambiguous (e.g. "Apple" the band vs Apple Inc., "Ramp" the fintech vs a ramp product) and no `brand_url` was provided, **stop and ask.** Never guess between two entities sharing a name.
3. Decide the brand root path (`brand_dir`): use what the user gave, else default to a sibling folder named after the slug. Do not hardcode a location.

## Phase 2 — Scaffold

```bash
python scripts/scaffold_brand.py --brand-dir <brand_dir> --brand "<Brand Name>"
```

Creates `brand-research/` (with the four stub files using the canonical headers),
`brand-assets/{logos,reference-photos}/`, `ad-runs/`, and an empty
`brand-assets/manifest.json`. Idempotent — won't clobber existing real content.

## Phase 3 — Web research → write the four docs

> **Phases 3 + 5 are PARALLEL. This is the contract, not a suggestion** — the four docs are
> independent once the entity is disambiguated, and serializing them is the #1 cause of 10-minute
> brand runs (a real 2026-06-11 run took ~10 min serial; the fan-out shape is ~3–4 min).
> 1. **Shared seed (do once, first):** fetch the brand homepage + one trade-press/about hit and capture
>    the *shared facts* — canonical entity, one-line what-they-sell, primary palette hints, voice in
>    three words, never-say list. Every writer MUST start from this so the docs don't contradict.
> 2. **Fan out — spawn ALL FIVE subagents in ONE batch** (in Claude Code: five Task/agent calls in a
>    SINGLE message, so they run concurrently): one writer per doc — `brand-summary`,
>    `visual-identity`, `competitors`, `audience` — plus the **Phase-5 asset-sourcer** (it doesn't
>    depend on the docs). Each writer does its OWN WebSearch/WebFetch in its lane and returns (or
>    writes) its finished file. Pass each one the shared seed + the disambiguated entity.
>    **One general-purpose agent doing everything, or agents spawned one-after-another, is doing it
>    wrong** — that's the serial run with extra steps.
> 3. **Reconcile:** one short pass to check the four docs agree (same positioning/voice, no contradictory
>    claims, every URL logged), then the Phase-3 gate.
>
> **Timing tripwire:** the whole fan-out should take roughly the slowest single lane (~3–4 min). If
> you catch yourself researching or writing more than ONE doc, or the phase passes ~6 minutes, STOP —
> you've serialized; restructure into the fan-out before continuing.
>
> **Announce your mode before any Phase-3 work begins** — print exactly one line:
> `Fan-out: spawning <N> writer subagents in one batch for: <docs the inventory marked missing>`
> or `Serial: host has no subagent capability` (the ONLY valid serial reason). If your inventory
> (contract rule 5) marked zero docs missing, Phase 3 is SKIPPED — no fan-out, no research at all.
>
> The serial flow below is ONLY for hosts with no subagent capability at all (Claude Code always has
> it). If you must use it, tell the user you're running serial and why, before starting.

Use your web tools (WebSearch / WebFetch). Priority order: **brand site → trade
press (Adweek/AdAge/Campaign) → reputable category reviewers → audience venues
(Reddit, app-store reviews, forums).** Capture product overview, pricing,
benefits, positioning, voice/tone, audience segments, named campaigns with dates,
and direct competitors. **Record every URL with its access date** as you go.

Then write each `brand-research/*.md` file using the **exact section headers** in
`references/output-contract.md`, filled from research — never leave a `TBD`/`TODO`:

- **brand-summary.md** — what they sell, who, jobs-to-be-done, voice in three words, what to never say.
- **visual-identity.md** — primary colors (hex), typography, logo usage rules, photography style, off-limits styles. Pull real hex values from the site/press kit where possible.
- **competitors.md** — `## Direct` (per competitor: positioning, pricing tier, how `<brand>` wins/loses) and `## Reference creative`.
- **audience.md** — primary persona, where they're online, objections, proof points. Include 3–4 distinct ICP segments and **verbatim audience phrasing** (these become VO seeds downstream).
- **asset-urls.md** — every source URL + access date.
- **ui-references.md** — write this **only** if the product has notable in-app/product UI worth recreating; catalog the key screens. Otherwise omit the file.

**Gate:** show the user the four files and get a "looks good" before sourcing assets. Capture line-level edits.

## Phase 4 — Existing-ad analysis (optional)

If the user provided ad files or a Meta Ad Library link, watch/analyze each ad:
capture the VO transcript, visual style, recurring motifs, and the implicit
promise. You'll fold these into the concept brief's "Observed patterns" section
in phase 7. Skip cleanly if there are no existing ads — and do not fabricate
patterns.

## Phase 5 — Source logo + reference photos

For each asset, download and register it in one step:

```bash
python scripts/fetch_asset.py --brand-dir <brand_dir> \
  --url <logo-url> --kind wordmark --subdir logos \
  --name "Wordmark (black)" \
  --description "Composite in end cards via PIL/ffmpeg; never AI-render. Min height 36px."
```

- Logos/wordmarks from the brand press kit or Wikipedia (SVG preferred) → `logos/`.
- 2–4 high-quality product/hero reference photos → `reference-photos/`. For any scraped third-party photo, put **"not licensed for redistribution"** in its `--description`.
- For a file you already have on disk (not a URL), use `scripts/register_asset.py` instead.

Every registration writes a `name` + usage `description` into `brand-assets/manifest.json` — that's what makes downstream asset picks accurate. A description that just restates the filename is a fail.

## Phase 6 — Generate brand-anchored stills (optional, needs FAL)

Skip entirely for a research-only run. When the user wants generated imagery,
ground every still on the strongest reference photo so the SKU stays consistent:

```bash
python scripts/render_product_shot.py --brand-dir <brand_dir> \
  --ref brand-assets/reference-photos/hero.jpg \
  --prompt "studio product shot on seamless white, soft key, 9:16" \
  --kind product_photo --subdir generated-product-shots \
  --name "Hero on white" --description "Clean studio hero for end card."
```

Typical: 4–6 product stills + 8–12 lifestyle stills. Each is auto-registered.
**Gate:** show the user a contact sheet before generating the full set.

## Phase 7 — Concept brief

Write `concept-brief.md`: strategic foundation, "Observed patterns from existing
ads" (only if phase 4 ran — cite specific moments per ad), 6–10 concept ideas
(each: hook + format + 15s/30s beat-by-beat + why-it-works + the KPI it serves),
production notes, open questions. This seeds downstream production skills; it does
not replace their own brainstorm step.

## Phase 8 — Verify (ship gate)

```bash
python scripts/verify_pack.py --brand-dir <brand_dir>
```

Must print `PASS`. It checks: all four docs present with exact headers and no
leftover `TBD`/`TODO`; `asset-urls.md` has ≥3 dated sources; `manifest.json`
parses, follows the schema, every asset has a non-empty `name`/`description`/valid
`kind`/resolvable relative `path`; every file under `brand-assets/` is in the
manifest (and vice versa); and no deprecated artifacts (`background_research.md`,
`brand-assets/README.md`, top-level `manifest.json`) remain. Fix every reported
problem and re-run until it PASSes.

## Decision rules

- **Refuse to proceed without a disambiguated brand + product.** Don't guess between same-named entities.
- **Never leave a `TBD`/`TODO`** in the four research docs — `verify_pack.py` fails on it. Research the answer or state the honest unknown in prose.
- **Every asset gets a real usage description**, not a filename echo. The description is how a downstream agent decides whether to use it.
- **Brand text is provenance-tracked, not invented.** Hex colors, taglines, claims must trace to a source in `asset-urls.md`.
- **Never claim licensed rights** to scraped reference photos — note "not licensed for redistribution" in the asset's description.
- **Don't fabricate "Observed patterns"** when no existing ads were provided — omit the section.
- **Keep the contract.** Don't add alternate filenames or a README catalog; downstream skills read the exact shape in `references/output-contract.md`.

## Output

See `references/output-contract.md`. In short: `brand-research/` (4 docs +
`asset-urls.md` [+ `ui-references.md`]), `brand-assets/manifest.json` + populated
asset folders, `concept-brief.md`, and an empty `ad-runs/`. A passing
`verify_pack.py`.

## Failure modes

- **Ambiguous brand, no URL** → stop and ask; don't research the wrong entity.
- **No press-kit logo and no acceptable third-party reference photo** → flag it; write the research docs anyway and leave the assets thin rather than inventing a logo.
- **`verify_pack.py` fails on orphan files** → you placed a file in `brand-assets/` without registering it; run `register_asset.py` for it (or delete it).
- **FAL safety flag on a generated still (phase 6)** → reword the prompt or fall back to a different reference; never block the research pack on imagery.
- **Provider/credit issues in phase 6** → skip generation, keep the research + sourced assets; the pack is still valid without generated stills.
