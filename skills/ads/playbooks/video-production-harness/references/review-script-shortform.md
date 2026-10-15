---
name: video-production-harness/review-script-shortform
description: Complete canonical short-form script craft rubric used by Studio and customer production.
owner: team
status: active
version: 2
---

# review-script-shortform

## Purpose

The narrative-arc check (Track A of the script lock) scores the skeleton: Hook, Vulnerability, Action, Tension, Reveal, Win, Climax, CTA. This rubric catches the craft problems that kill short-form ads even when the arc is fine: a weak hook, a missing **OUTCOME** beat (the most common paid-social failure), keyword-stack sentences, drug claims in regulated categories, action-only CTAs, non-sequiturs, the wrong word count, a fade-out landing, ad-speak, overlong captions, and acronyms, prices or URLs in VO.

Both checks run in State 2.5; neither is enough alone. The script-writing skill writes to this rubric; this review catches what slipped through.

## When to use

- State 2.5 of the script lock, alongside the narrative-arc check.
- When the operator says "the script feels off" but the arc seems fine.
- After importing a podcast-derived or remixed script (moved text often has logical gaps).

## Inputs

- `<script_path>` (required): VO lines in scene order, ideally with anchors (`SCENE 01 (0.0–2.0s): "..."`).
- `<target_duration_sec>` (required): the locked runtime.
- `<speaking_rate_wps>`: the **reference's speaking rate from `../scripts/reference_rate.py`** (words ÷ seconds from the first word to the last), never estimated. Size the script from it. With no reference speech to measure, use **2.8–3.2 words/sec (3.0)** for UGC and creator speech. A slower rate needs a stated reason (a calm proof, a read-aloud format) and is listed in `changes_from_reference` when the reference is faster.
- `<vo_speed>`: format label only, `vo-narrator` or `fast-cuts` (kinetic type, rapid podcast clips). It never sets the word count.
- `<brand_voice_rules>`: optional host-provided brand voice file. Extends the banned phrases and signoff rules.
- `<category>`: optional, one of `supplement` / `cosmetic` / `topical-hair` / `food` / `service`. Gates pre-check 7.
- `<output_dir>`: default a host-resolved dated shortform-review directory.

## Workflow

This is the one canonical rubric, shared by the desktop review atom and the published harness. It is a markdown procedure, not an executable. Run the pre-checks, then the prompt below with an independent reviewer when available, or as a distinct text-review pass. Save the real results through the host binding.

### Deterministic pre-checks (run first, in the calling skill)

Run these and inject the results into the prompt:

1. **Word count vs duration.** `expected_words = speaking_seconds * speaking_rate_wps`, where `speaking_seconds` is the duration minus planned music-only intros and end cards. Flag outside `[0.85 * expected, 1.15 * expected]`.
2. **Line length.** A VO line > 14 words or an on-screen line > 7 words → flag.
3. **Banned VO content.** URLs (`https?://|www\.|\.com|\.ai`), prices (`\$\d|\d+\s?(USD|dollars|cents|%\s?off)`), unexplained acronyms (`\b[A-Z]{2,}\b` not on the brand whitelist).
4. **Generic language.** Count `really, very, amazing, incredible, game-changer, revolutionary, best-in-class, world-class, next-level, literally, just, simply, actually, basically`. Flag any line with ≥ 2 hits.
5. **Signoff.** The last VO line ends with a period or a CTA-like phrase; no trailing ellipsis or drop-off.
6. **Cadence.** Split VO into sentences (on `.`, `?`, `!` outside quotes). Compute `sentence_count`, `avg_word_count`, `short_sentence_count` (≤ 6 words), `short_pct`, `longest_short_run`. Flag if `short_pct > 0.30`, `avg_word_count < 8` or `longest_short_run >= 3`. Surface it as, for example: *"Cadence flag: 7/11 sentences are ≤ 6 words (64%), longest short run = 4. Reads as a keyword stack."*
7. **Claim safety (DSHEA).** Only when `<category>` is `supplement`, `cosmetic`, `topical-hair` or `food`. Scan VO and on-screen text:
   ```
   \b(regrow|regrows|regrowth|reverse|reverses|cures?|treats?|prevents?|fills?\s?in|comes? back|grows? back|fixes|heals|FDA[-\s]cleared|FDA[-\s]approved|medical[-\s]grade|clinically proven|lowers? cortisol|inhibits? DHT|blocks?)\b
   ```
   Every hit is P0: the script cannot ship until rewritten. Pass the line number and phrase.

### Reviewer prompt

```
You are reviewing a short-form video ad's VO script for SHORT-FORM CRAFT.
You are NOT scoring the narrative arc (a separate review does that).

Text only. Target duration: <target_duration_sec>s.
Pacing: <speaking_rate_wps> words/sec from <reference or default> (~<expected_words> words; actual <actual_words>).

Pre-checks flagged:
<flat list of deterministic findings>

Read the script once at normal VO pace. Score each axis 0–10. Default to 6; score ≥ 8 only if
genuinely above average for short-form.

1. Hook strength (first 2 s, ≈ first 5 words). Does line 1 stop the scroll on text alone?
   Strong hooks use one of: pattern-break in words 1–3 ("I quit my job to sell ant farms");
   curiosity gap ("My therapist told me to start fights"); concrete stakes ("This mistake cost
   me $47k"); specific direct address ("If you've ever cried in a Trader Joe's parking lot — same").
   Weak: generic ("Have you ever..."), declarative without stakes, front-loaded brand mention.
   Viewer-recognition ladder:
     Tier 1 specific viewer behavior ("You ever catch yourself parting your hair to check the damage?")
     Tier 2 named-audience address ("If you're a Black man losing your hairline…")
     Tier 3 concrete number or stake ("$200. That's all I started with.")
     Tier 4 founder origin (fine for brand campaigns, weak for direct response)
     Tier 5 generic question or declarative (scroll-past)
   hook_strength ≤ 5 for Tier 4 with a direct-response goal, and always for Tier 5.

2. Paid-social arc. Tag each line HOOK / PIVOT / SOLUTION / OUTCOME / PROOF / CTA / other.
   Required order: Hook → Pivot → Solution → Outcome → Proof → CTA.
   9–10 all six in order; 7–8 five present, one weak; 5–6 one beat missing (usually OUTCOME);
   3–4 two missing or out of order; 0–2 no arc. Quote each present beat; name the missing ones.

3. Outcome line: the sentence between Solution and Proof saying what the viewer WILL SEE and when.
   9–10 concrete, visual, time-bound, claim-safe ("By month four, you'll see fuller-looking hair");
   5–8 vague ("You'll see results.") or borderline claim; 0–4 missing. Quote it or write
   "Outcome beat missing." A missing outcome is a P0 revise trigger.

4. Logical flow. Does each line N follow from line N-1? Flag topic jumps without a bridge, set-ups
   for jokes that did not land, brand mentions that interrupt the story, surprises not seeded
   earlier. Give line numbers and why.

5. Short-form fit: word density (pre-check), line economy (could each line lose 1–2 words?),
   caption fit (on-screen line > 7 words at 38pt will not fit 9:16), banned VO content (pre-check).

6. Cadence variance, from the pre-check metrics.
   9–10 flowing 12–20-word sentences with 1–2 short punches; 7–8 one or two stacked runs;
   5–6 several keyword stacks; 0–4 short_pct > 0.30 or longest_short_run >= 3.
   Propose specific merges ("A serum. A roller. A supplement." → "It's a serum, a roller, and a supplement.").

7. Landing. Read the last 2–3 lines as a unit. Strong: punchline plus one brand signoff (silent
   OR spoken, never both). Weak: trails off, repeats an earlier beat, unearned CTA.
   Label: punchline+silent-brand / punchline+spoken-cta / cta-only / fade-out / repeats-earlier-beat.
   CTA promise: strong names the outcome the click delivers ("Take the quiz, we'll match the system
   to your hairline"); weak is action-only ("Take the quiz." / "Tap to learn more."). Weak is P1.

8. Ad-speak beyond the word list: unmotivated stats, unearned superlatives ("the best", "the only"),
   adjective stacks, "Imagine if..." / "What if..." openers.

9. Brand voice: check <brand_voice_rules> if given; otherwise skip.

Output YAML:

  scores: {hook_strength, paid_social_arc, outcome_line, logical_flow, short_form_fit,
           cadence_variance, landing, generic_language, brand_voice (only with voice rules)}
  paid_social_arc_check:
    hook | pivot | solution | outcome | proof | cta: { present: true|false, line: "<quote>"|null }
  cadence_metrics: {sentence_count, avg_word_count, short_sentence_count, short_pct, longest_short_run}
  dshea_flags: [{ line, phrase, severity: P0 }]     # regulated categories only
  cta_promise: { strong: true|false, line, proposed }
  verdict: ship | revise | kill
  non_sequiturs: [{ line, issue, rewrite }]
  rewrites: [{ line, issue, rewrite, reason }]
  landing_assessment: current label and proposed landing
  summary: 3–5 sentences: what works, what is broken, the top 2 changes from revise to ship
```

### Verdict rules

- **ship:** every score ≥ 7, no non-sequiturs, a strong landing, `paid_social_arc_check.outcome.present == true`, `short_pct <= 0.30` and `longest_short_run <= 2`, `dshea_flags` empty for a regulated category, and `cta_promise.strong == true`.
- **revise:** any score 5–6 or any P1 flag; proposals required. A missing outcome, keyword-stack cadence and a weak CTA promise each force revise.
- **kill:** any score < 5, a fundamentally broken hook or any P0 claim flag. Recommend rewriting from scratch.

### What the calling skill does with the output

1. Save the YAML as the shortform_review YAML artifact.
2. Render a markdown summary: verdict, word count vs expected, category; a score table (axis, score, note); the six-beat arc check with each line quoted and missing beats marked; cadence metrics and merge proposals; claim flags with safe replacements ("looks fuller", "holds its shape"); the CTA promise current and proposed; non-sequiturs; rewrites; landing; summary.
3. Show the summary with the script at the script approval. The owner accepts rewrites, edits them or sends the script back.
4. On `kill`, do not advance; re-brainstorm from State 1.

## Output

- The shortform_review YAML artifact: scores, verdict, rewrites, non-sequiturs.
- The human-readable shortform_review summary.
- The precheck artifact: word count, banned content, generic-language hits, cadence, claim flags.
- Saved review provenance: timestamp, script hash, target duration, verdict.

## Quality Checks

- Every scored axis has a 0–10 value.
- `verdict` is exactly `ship`, `revise` or `kill`.
- A `revise` verdict has at least one rewrite or non-sequitur entry.
- A `ship` verdict meets every ship rule above.
- The pre-check JSON exists and was passed into the prompt, including `cadence_metrics` (always) and `dshea_flags` (regulated categories).
- Proposals are text-only rewrites of existing lines; no new beats or visuals.

## Failure Modes

- **Everything scores `ship`.** Calibration broken; re-run with "default each score to 6; score ≥ 8 only if genuinely above average."
- **Reviewer proposes visuals.** Strip and re-run.
- **Pre-checks skipped.** Hard fail; re-run with the pre-check JSON injected.
- **`kill` on a script the operator likes.** Show it; the operator may override with a logged decision. Do not loop silently.
- **Missing outcome passes as `ship`.** Hard fail; with `outcome.present == false` the verdict cannot be ship.
- **Cadence flag dismissed.** Pre-check 6 flagged but `cadence_variance >= 7`: re-run with the metrics verbatim and a merge proposal required.
- **Claim hit in a regulated category.** The verdict must be `revise` (`kill` for repeated P0s); drug-claim language is a legal risk.
- **Weak CTA promise dismissed.** An action-only CTA forces `revise`; propose the action-plus-outcome rewrite.

## Relationship to other checks

- Runs with the narrative-arc check in State 2.5; the script lock merges both into the one script approval.
- Does not replace the video review's hook check, which judges the rendered first 3 seconds. This is text only.
