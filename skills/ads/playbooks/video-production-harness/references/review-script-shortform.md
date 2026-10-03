---
name: video-production-harness/review-script-shortform
description: Complete canonical short-form script craft rubric used by Studio and customer production.
owner: team
status: active
version: 2
---

# review-script-shortform

## Purpose

`review-script-arc` scores the narrative skeleton (Hook/Vulnerability/Action/Tension/Reveal/Win/Climax/CTA). It catches a missing arc but doesn't catch the script-level problems that kill short-form ads even when the arc is fine:

- A "fine" hook that doesn't actually stop the scroll in 2 seconds (and where it sits on the viewer-recognition ladder)
- A paid-social problem-solution script that's missing the **OUTCOME** beat — the most common short-form failure mode; viewer doesn't know what they get from buying
- A script that stacks short keyword-like sentences instead of flowing speech (reads as a wireframe, not a person talking)
- A drug claim (regrow / reverse / cure / fills in) in a regulated category (supplement, cosmetic, topical-hair, food)
- A CTA that's action-only ("Take the quiz.") with no specific outcome promised from the click
- A line that's logically a non-sequitur — feels random or tacked-on, breaks the chain
- Word count that's wrong for the target duration (too dense → rushed VO; too sparse → dead air)
- A landing that fades out and hopes — no punchline, no signoff
- Generic filler ("really," "amazing," "game-changer") and unmotivated stats that read as ad-speak
- On-screen lines that won't fit a 9:16 caption bubble
- Acronyms, prices, or URLs in VO (under the project-approved voice rule)

This atom is the short-form-craft sibling to `review-script-arc`. Both run in State 2.5 of the orchestrator. Neither one alone is sufficient. Paired with an available script-planning capability upstream — that skill writes scripts to this rubric; this skill catches anything that slipped through.

## When to use

- **State 2.5** of the shared script-lock step, alongside `review-script-arc`.
- Standalone audit when the operator says "the script feels off" but the arc seems fine.
- After importing a podcast-derived or remix script (text from one context dropped into another often has logical gaps).

## Inputs

- `<script_path>` (required) — markdown or plaintext with VO lines in scene order, ideally with scene anchors (`SCENE 01 (0.0–2.0s): "..."`).
- `<target_duration_sec>` (required) — the locked total runtime. Used for word-density math.
- `<vo_speed>` — `vo-narrator` (default, ≈ 2.3 words/sec) or `fast-cuts` (≈ 1.6 words/sec — kinetic typography, rapid podcast clips).
- `<brand_voice_rules>` — optional path to a brand voice file (the host-provided approved brand voice rules). Used to extend the banned-phrase list and signoff requirements.
- `<category>` — optional string. One of `supplement` / `cosmetic` / `topical-hair` / `food` / `service`. Gates the DSHEA / claim-safety pre-check (pre-check #7). Vocabulary matches an available script-planning capability.
- `<output_dir>` — default a host-resolved dated shortform-review directory.

## Workflow (markdown-only; the calling agent performs the review)

This is the one canonical full short-form rubric, shared by the desktop review atom and the public production harness. It is a markdown procedure, not an executable. Apply the complete pre-checks and prompt below with an independent reviewer when available or a distinct text-review pass. Save its actual results through the selected host binding.

### Deterministic pre-checks (run first, in the calling skill)

Before the sub-agent prompt, run these cheap checks and inject the results into the prompt:

1. **Word count vs target duration.**
   - `expected_words = target_duration_sec * (2.3 if vo_speed=='vo-narrator' else 1.6)`
   - Flag if actual word count is outside `[0.85 * expected, 1.15 * expected]`.
2. **Per-line length.** Any single VO line > 14 words or any on-screen text line > 7 words → flag.
3. **Banned VO content.**
   - URLs (regex `https?://|www\.|\.com|\.ai`)
   - Prices (regex `\$\d|\d+\s?(USD|dollars|cents|%\s?off)`)
   - Unexplained acronyms (regex `\b[A-Z]{2,}\b` that aren't whitelisted brand names)
4. **Generic-language sniff.** Count occurrences of: `really, very, amazing, incredible, game-changer, revolutionary, best-in-class, world-class, next-level, literally, just, simply, actually, basically`. Flag any line with ≥ 2 hits.
5. **Signoff presence.** Last VO line must end with a period or a CTA-like phrase (no trailing ellipsis, no mid-sentence drop-off).
6. **Sentence-rhythm cadence.** Tokenize VO into sentences (split on `.`, `?`, `!` outside quotes). Compute:
   - `sentence_count`
   - `avg_word_count` (total VO words / sentence_count)
   - `short_sentence_count` (sentences with ≤ 6 words)
   - `short_pct = short_sentence_count / sentence_count`
   - `longest_short_run` (max consecutive sentences with ≤ 6 words)

   Flag if **any** of:
   - `short_pct > 0.30`
   - `avg_word_count < 8`
   - `longest_short_run >= 3`

   Surface to the sub-agent as: *"Cadence flag: 7/11 sentences are ≤ 6 words (64%), longest short run = 4. Script reads as keyword stack, not speech."*
7. **DSHEA / claim safety.** Only runs if `<category>` is in `{supplement, cosmetic, topical-hair, food}`. Scan VO + on-screen text against:
   ```
   \b(regrow|regrows|regrowth|reverse|reverses|cures?|treats?|prevents?|fills?\s?in|comes? back|grows? back|fixes|heals|FDA[-\s]cleared|FDA[-\s]approved|medical[-\s]grade|clinically proven|lowers? cortisol|inhibits? DHT|blocks?)\b
   ```
   Every hit is P0 — script cannot ship until rewritten. Surface line number + exact phrase to the sub-agent.

Pass the pre-check findings into the sub-agent prompt so it can reason about them in context rather than re-derive them.

### Sub-agent prompt template

```
You are reviewing a short-form video ad's VO script for SHORT-FORM CONTENT CRAFT.
You are NOT scoring the narrative arc (a separate review handles that).

The script is text only — no visuals, no music. Target duration: <target_duration_sec>s.
VO pacing target: <vo_speed> (~<expected_words> words total, actual: <actual_words>).

Pre-checks already flagged:
<flat list of deterministic findings>

Now read the script once at normal VO pace. Score each axis 0–10 (default to 6 — only score ≥ 8 if the
beat is genuinely above-average for short-form).

1. **Hook strength (first 2 seconds, ≈ first 5 words).** Does line 1 stop the scroll on TEXT ALONE?
   Strong hooks use ONE of:
     - Pattern-break: violates expectation in word 1–3 ("I quit my job to sell ant farms")
     - Curiosity gap: implies a specific story you must hear ("My therapist told me to start fights")
     - Stakes: names a concrete cost upfront ("This mistake cost me $47k")
     - Direct address with specificity: ("If you've ever cried in a Trader Joe's parking lot — same")
   Weak hooks: generic ("Have you ever..."), declarative-without-stakes ("Productivity is hard"),
   or front-loaded brand mention.

   ALSO score the hook on the 5-tier viewer-recognition ladder (paid-social specific):
     - Tier 1: Specific viewer behavior — viewer recognizes themselves doing the thing ("You ever catch yourself parting your hair to check the damage?")
     - Tier 2: Named-audience direct address — filters ICP in 2s ("If you're a Black man losing your hairline…")
     - Tier 3: Concrete number / stat / stake — substantiated specificity ("$200. That's all I started with.")
     - Tier 4: Founder origin — slower viewer recognition; OK for brand campaigns, weak for direct-response ("I started this brand because of my own hairline.")
     - Tier 5: Generic question / declarative — scroll-past ("Have you ever struggled with…")
   Score `hook_strength` ≤ 5 if hook is Tier 4 with direct-response objective, or Tier 5 always.

2. **Paid-social problem-solution arc.** Map each line to one of: HOOK / PIVOT / SOLUTION / OUTCOME / PROOF / CTA / other.
   Required beats in order: Hook → Pivot → Solution → Outcome → Proof → CTA.
   Score `paid_social_arc`:
     - 9–10: All six beats present, in correct order
     - 7–8: Five of six beats present, one beat weak but identifiable
     - 5–6: Missing one structural beat (most common failure: OUTCOME)
     - 3–4: Missing two beats OR beats out-of-order
     - 0–2: No discernible problem-solution arc
   Echo the literal line for each beat that IS present, and call out which beats are missing.

3. **Outcome line.** Locate the OUTCOME beat — the sentence(s) between Solution and Proof that say what the viewer WILL SEE and when.
   Score `outcome_line`:
     - 9–10: Present, concrete (visual + time-bound), DSHEA-safe ("By month four, you'll see fuller-looking hair and a hairline that holds its shape.")
     - 5–8: Present but vague ("You'll see results.") OR present but borderline-claim
     - 0–4: Missing entirely — script jumps Solution → Proof or Solution → CTA
   Echo the literal outcome line found OR explicitly state "Outcome beat missing." Missing-outcome is the most common paid-social failure mode and is a P0 revise trigger.

4. **Logical flow / non-sequitur check.** Read line-by-line. For each line N (≥ 2), does it follow
   from line N-1? Tag any line that feels random, tacked on, off-topic, or breaks the chain of
   causation. Specifically flag:
     - Topic jumps without a bridge
     - Lines that exist only to set up a joke that didn't land
     - Brand mentions that interrupt the story
     - "Surprise" beats that come from nowhere (vs. seeded earlier)
   List the offending line numbers and explain WHY each one breaks flow.

5. **Short-form fit.** Score the script as a whole on:
     - Word density (pre-check already flagged if wrong)
     - Line economy — could each line lose 1–2 words without losing meaning?
     - Caption readability — any on-screen line > 7 words at 38pt won't fit a 9:16 safe area
     - No banned VO content (pre-check flagged)

6. **Cadence variance.** Use the pre-check cadence metrics ({sentence_count, avg_word_count, short_sentence_count, short_pct, longest_short_run}).
   Score `cadence_variance`:
     - 9–10: Long flowing sentences (12–20 words) with 1–2 short emphasis punches; reads as natural speech
     - 7–8: Mostly natural; one or two stacked short-sentence runs that could be merged
     - 5–6: Several keyword-stack moments; reads partly as bullet list
     - 0–4: `short_pct > 0.30` OR `longest_short_run >= 3` — reads as wireframe
   Recommend specific merges (e.g. "Lines 3–5 are 'A serum. A roller. A supplement.' — merge into 'It's a serum, a roller, and a supplement.'").

7. **Landing / payoff.** Read the LAST 2–3 lines as a unit. Does the script END, or fade out?
     - Strong landing: punchline + brand signoff (silent OR spoken, never both)
     - Weak landing: trails off, repeats earlier beat, ends on a CTA that wasn't earned
   Mark the script's actual landing as: `punchline+silent-brand` / `punchline+spoken-cta` /
   `cta-only` / `fade-out` / `repeats-earlier-beat`.

   ALSO score the CTA on the CTA Promise Rule:
     - Strong (CTA includes a specific outcome the click delivers): "Take the quiz, we'll match the system to your hairline."
     - Weak (action-only): "Take the quiz." / "Tap to learn more." / "Click the link."
   Flag weak CTAs as a P1 revise trigger.

8. **Generic-language / ad-speak.** Beyond the pre-check word list, flag:
     - Unmotivated stats ("studies show 73% of people…")
     - Unearned superlatives ("the best", "the only")
     - Adjective stacks ("a powerful, simple, beautiful tool")
     - "Imagine if..." / "What if..." openers (almost always weak in short-form)

9. **On-brand voice fit.** If <brand_voice_rules> is provided, check explicit rules. Otherwise skip.

Output as YAML:

  scores:
    hook_strength: 7
    paid_social_arc: 6     # NEW — 6-beat problem-solution arc presence
    outcome_line: 4        # NEW — outcome beat presence + quality
    logical_flow: 5
    short_form_fit: 8
    cadence_variance: 5    # NEW — sentence-rhythm naturalness
    landing: 6
    generic_language: 7
    brand_voice: 8   # only if brand_voice_rules provided

  paid_social_arc_check:
    hook:     { present: true,  line: "If you're a Black man losing your hairline, the shelf wasn't built for you." }
    pivot:    { present: true,  line: "So I built this." }
    solution: { present: true,  line: "It's a serum, a derma roller, and a daily supplement..." }
    outcome:  { present: false, line: null }   # ← most common failure
    proof:    { present: true,  line: "Over twenty-three thousand guys have tried it, and the rating sits at 4.9 stars." }
    cta:      { present: true,  line: "Take the quiz — we'll match the system to your hairline." }

  cadence_metrics:
    sentence_count: 11
    avg_word_count: 6.8
    short_sentence_count: 7
    short_pct: 0.64
    longest_short_run: 4

  dshea_flags:                # only populated if <category> is in {supplement, cosmetic, topical-hair, food}
    - { line: 14, phrase: "fills in", severity: P0 }

  cta_promise:
    strong: false             # action-only ("Take the quiz.") = weak; action+outcome = strong
    line: "Take the quiz."
    proposed: "Take the quiz, we'll match the system to your hairline."

  verdict: ship | revise | kill
    # ship: every score ≥ 7 AND no non-sequiturs flagged AND landing is strong
    #   AND paid_social_arc_check.outcome.present == true
    #   AND cadence_metrics.short_pct <= 0.30 AND longest_short_run <= 2
    #   AND dshea_flags is empty (when category is regulated)
    #   AND cta_promise.strong == true
    # revise: any score 5–6 OR any P1 flag — proposals required
    #   (missing outcome line, keyword-stack cadence, weak CTA-promise all force revise)
    # kill: any score < 5 OR hook fundamentally broken OR any P0 DSHEA flag
    #   recommend rewriting from scratch

  non_sequiturs:
    - line: 5
      issue: "Line 5 jumps from 'I couldn't sleep' to 'so I tried the product' — no bridge. Why this product? Where did it come from?"
      rewrite: "My sister sent me a link to the product."

  rewrites:
    - line: 1
      issue: "Generic opener — 'Have you ever struggled with anxiety' is a scroll-past."
      rewrite: "I'd been awake for 31 hours when I finally cried."
      reason: "Pattern-break: specific number + concrete moment. Hook strength jumps from 4 to 8."

  landing_assessment: |
    Current: fade-out — ends on "and that's my story" without a brand signoff or punchline.
    Proposed: spoken-cta replaced with silent brand close ("<approved brand signoff>").

  summary: |
    (3–5 sentences: what's working, what's broken, top 2 changes that would move this from revise to ship)
```

### What the calling skill does with the output

1. Saves the YAML to the shortform_review YAML artifact.
2. Renders a markdown summary:

   ```markdown
   # Short-form review — <script_name>

   **Verdict:** REVISE
   **Word count:** 71 actual vs 69 expected (within ±15%, OK)
   **Category:** topical-hair (DSHEA filter active)

   ## Scores
   | Axis | Score | Note |
   |---|---|---|
   | Hook strength | 4 | Generic Tier-5 opener — "Have you ever..." |
   | Paid-social arc | 5 | Outcome beat missing — jumps Solution → Proof |
   | Outcome line | 0 | Missing entirely |
   | Logical flow | 6 | One non-sequitur at line 5 |
   | Short-form fit | 8 | Density on target |
   | Cadence variance | 4 | 7/11 sentences ≤ 6 words (64%) — reads as keyword stack |
   | Landing | 5 | Fade-out, no signoff |
   | Generic language | 7 | "Just" appears 3× |

   ## Paid-social arc check
   - Hook: ✓ "Have you ever struggled with hair loss?"
   - Pivot: ✓ "So I built this."
   - Solution: ✓ "A serum. A roller. A supplement."
   - **Outcome: ✗ MISSING** ← P0
   - Proof: ✓ "23,000 reviews. 4.9 stars."
   - CTA: ✓ "Take the quiz."

   ## Cadence
   - 7/11 sentences are ≤ 6 words (64%). Longest short-run = 4.
   - Merge proposal: lines 3–5 "A serum. A roller. A supplement." → "It's a serum, a derma roller, and a daily supplement."

   ## DSHEA flags (category = topical-hair)
   - Line 14, phrase "fills in" — P0. Replace with "looks fuller" or "holds its shape".

   ## CTA promise
   - Current (weak, action-only): "Take the quiz."
   - Proposed (strong, action+outcome): "Take the quiz — we'll match the system to your hairline."

   ## Non-sequiturs
   - **Line 5** — Jump from "couldn't sleep" → "tried the product" without a bridge.
     Proposed: "My sister sent me a link to the product."

   ## Rewrites
   - **Line 1:** "I'd been awake for 31 hours when I finally cried."
     (replaces "Have you ever struggled with anxiety")

   ## Landing
   - Current: fade-out
   - Proposed: silent brand close ("<approved brand signoff>")

   ## Summary
   The arc is missing its outcome beat — viewer doesn't know what they get from buying. The cadence
   reads as a wireframe (64% short sentences). DSHEA flag at line 14 is a P0. Three changes flip
   this from revise to ship: insert a time-anchored outcome line between Solution and Proof,
   merge the keyword-stack into flowing sentences, and replace "fills in" with "fuller-looking".
   ```

3. HUMAN GATE — operator approves rewrites, makes their own edits, or sends back.
4. If verdict is `kill`, the calling skill should NOT advance — re-brainstorm via State 1.

## Output

- the shortform_review YAML artifact — scores, verdict, rewrites, non-sequiturs.
- the human-readable shortform_review artifact — human-readable summary.
- the deterministic precheck artifact — deterministic pre-check findings (word count, banned content, generic-language hits).
- the saved review provenance — timestamp, script hash, target_duration, verdict.

## Quality Checks

- Every scored axis has a 0–10 value.
- `verdict` is exactly one of `ship` / `revise` / `kill`.
- If verdict is `revise`, at least one rewrite OR non_sequitur entry exists.
- If verdict is `ship`, ALL of the following hold:
  - No axis < 7 AND `non_sequiturs` is empty AND `landing_assessment` shows a strong landing
  - `paid_social_arc_check.outcome.present == true` (outcome beat present)
  - `cadence_metrics.short_pct <= 0.30 AND cadence_metrics.longest_short_run <= 2` (script reads as speech, not keyword stack)
  - `dshea_flags` is empty (when `<category>` is in the regulated set)
  - `cta_promise.strong == true` (CTA delivers a specific outcome from the click)
- Pre-check JSON is present and was passed into the sub-agent prompt. This includes `cadence_metrics` (always) and `dshea_flags` (when category is gated).
- No proposals invent new beats or visuals — text-only rewrites of existing lines.

## Failure Modes

- **Reviewer rubber-stamps everything with `verdict: ship`.** Calibration broken. Re-run with stricter prompt: "default each score to 6; only score ≥ 8 if genuinely above-average."
- **Reviewer proposes visuals.** Instruction violation — strip and re-run.
- **Pre-checks skipped.** Hard fail — the deterministic findings are non-negotiable. Re-run with pre-check JSON injected.
- **`verdict: kill` on a script the operator likes.** Surface to the operator; let them override with a logged decision. Don't loop silently.
- **Missing-outcome slips through with `verdict: ship`.** Hard fail — the outcome beat is the most common paid-social failure mode. If `paid_social_arc_check.outcome.present == false`, verdict CANNOT be ship.
- **Cadence flag dismissed.** If pre-check #6 flagged keyword-stack rhythm and the sub-agent scored `cadence_variance >= 7`, calibration broken. Re-run with the cadence_metrics injected verbatim and the merge proposal required.
- **DSHEA hit on a regulated category.** If `<category>` is in the gated set AND `dshea_flags` is non-empty, verdict MUST be `revise` (or `kill` for repeated P0s). Drug-claim language in a supplement/topical ad is a legal risk, not a creative choice.
- **CTA-promise check dismissed.** Weak action-only CTAs ("Take the quiz.") force `revise` even if all other axes pass. The reviewer must propose the action+outcome rewrite.

## Relationship to other skills

- Pairs with `review-script-arc` in State 2.5. Arc handles narrative; this handles craft. Both run; the calling skill (the shared script-lock step) merges both into a single gate.
- Consumed by the shared script-lock step (State 2.5).
- Does NOT replace `review-video-hook-strength` — that's a video-level check on the rendered first 3 seconds. This is text-only.

## Example inputs (procedure parameters, not CLI commands)

```
review-script-shortform
  script_path=<host-provided actual draft>
  target_duration_sec=22
  vo_speed=vo-narrator
  brand_voice_rules=<host-provided approved voice rules>
```

Returns verdict=revise, hook_strength=4 (generic opener), landing=5 (fade-out), one non-sequitur at line 5. Proposes specific-pattern-break opener + silent brand close + a one-line bridge. Operator accepts opener and bridge, rewrites their own landing. Script advances to lock.

### Second example — paid-social with regulated category

```
review-script-shortform
  script_path=<host-provided actual regulated-category draft>
  target_duration_sec=24
  vo_speed=vo-narrator
  category=topical-hair
  brand_voice_rules=<host-provided approved voice rules>
```

Returns verdict=revise. Pre-check #6 flags `short_pct=0.64, longest_short_run=4` (keyword stack). Pre-check #7 (DSHEA, triggered by `category=topical-hair`) flags 1 P0 phrase. Sub-agent scores `paid_social_arc=5` (missing OUTCOME beat between Solution and Proof), `outcome_line=0` (missing entirely), `cadence_variance=4`. Proposes: (1) merge lines 3–5 from "A serum. A roller. A supplement." into one flowing sentence, (2) insert outcome line "By month four, you'll see fuller-looking hair, and a hairline that holds its shape." between Solution and Proof, (3) extend CTA from "Take the quiz." to "Take the quiz, we'll match the system to your hairline." Operator accepts all three. Script advances to lock with `verdict=ship` on re-review.
