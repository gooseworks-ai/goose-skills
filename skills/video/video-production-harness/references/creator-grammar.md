# Human version

Creator Grammar is how a short-form video is **cut, paced, captioned and scored** so it reads as a creator's post (Reels, TikTok) rather than an agency ad. It comes from a frame-by-frame teardown of 16 creator videos. These are defaults: the customer's reference wins, and breaking a rule needs a stated reason.

---

# Agent version

Use this in [create-storyboard](../create-storyboard.md) (cut plan, pacing curve, payoff hold, captions) and [edit-video](../edit-video.md) (cuts, sound dynamics, captions). It covers the edit; [shot routing](shot-routing.md) covers how each shot is made and [libraries, look and rubric](libraries-look-and-rubric.md) covers the look.

## 1. Eight universal rules

All 16 reference videos followed all eight.

1. **Hard cuts only.** No dissolves or wipes. The cut is the idea changing. A specialty transition is a rare, deliberate spine element: 1-2 per video at most.
2. **Cold open, mid-action.** No logo bumper or intro card. Frame 1 is the product in use or the person mid-sentence.
3. **Hook in the first 1-3 s:** a caption claim, a spoken question or a visual pattern-interrupt.
4. **The ask is light.** No price or "link in bio" burned into the body; the hook carries the ask and the end card follows the brief.
5. **Pacing is a curve, not a constant** (section 2).
6. **The caption is the spine.** With speech, captions mirror it word for word; without speech, captions are the voice. Build sound-off first.
7. **Phone-native capture.** 9:16, about 30 fps, full frame, natural light, deep focus.
8. **Keep the imperfection.** Slight handheld drift, a visible mic, an exposure hunt. Polished reads as an ad; slightly imperfect reads as trusted.

## 2. The pacing curve

| Segment | Position | Cut behaviour |
|---|---|---|
| **Hook** | 0-15% | Fastest. Establish, then pattern-interrupt; may hold a burst of 5-8 cuts in under 1 s. |
| **Body** | 15-70% | "Burst then breathe": fast clusters bracketed by longer holds. |
| **Payoff hold** | one shot, about 60-85% | The longest shot, 2-4× the mean shot length: the product working or the reveal. |
| **Tail** | last 10-15% | Slow down. End on the payoff or a held frame. |

- **Payoff-hold rule.** Every reference had exactly one shot 2-4× the mean length, and it was the hero moment. Mark it `role: "payoff-hold"` in the scene plan.
- **Burst then breathe.** Fast clusters are accents, never the baseline; hold before and after each one.
- **Offer-stack override.** A 30-50 s offer or claim stack (5+ discrete claims, data cards, average cut 1.2 s or less) has no payoff hold: every cut is 0.5 s or 1.0 s, cards span several cuts, and bookend shots stay at 1 s.

Measure the reference's cuts per 10 s and face share, and plan from those; there is no universal quota.

## 3. Cut types

All render as hard cuts but are planned differently:

| Cut | What it is | Where |
|---|---|---|
| hard-cut | plain cut | default |
| silence-masked-cut | a cut inside a 0.3-0.6 s gap in the music, hiding the biggest edit | music-led |
| jump-cut | a cut inside one continuous take, removing a breath | talking head |
| match-cut | adjacent shots share composition or motion | reveals, time jumps |
| zoom-punch | a tighter crop of the same frame, within the 1.5× zoom limit | emphasis |
| angle-change | another angle of the same moment | multi-camera |
| b-roll-insert | cut away while the speech continues (L-cut) | voice formats |
| reaction-insert | cut to a reaction, usually on an exclamation | reaction montages |
| beat-synced-cut | a cut snapped to a bar or beat | music-led |

Jump-cut candidates come from word timings: gaps over 0.35 s between words or sentences. Speaking pace is character; do not over-cut a deliberately slow delivery, and never cut inside a sentence on a native H3 take.

## 4. Camera

- **Wide establishes, medium does the work, close proves the detail.** Demo videos cycle all three.
- Movement maps to register: slow push or orbit reads premium; locked-off reads tabletop; handheld reads "in the wild".

## 5. Sound

| Mode | What | When |
|---|---|---|
| music-only | no speech; captions carry the meaning | product demos, concept loops |
| vo+music | speech over a music bed | explainers, narrated demos |
| speech-only | speech, little or no music | talking heads |

- **Silence beat.** A deliberate 0.25-0.6 s dropout before a reveal or between acts; declare it as a planned pause.
- **Beat sync.** In music-only edits, cuts snap to the nearest bar (preferred) or beat; the hook word lands on a downbeat.
- **Build to the payoff.** Music energy builds into the reveal.
- **Ducking.** Music sits under speech; some brand films deliberately run them near-equal.
- **SFX on cuts and actions.** Taps and whooshes land on cuts, especially in feature bursts; real action foley on product actions.
- Speech continues under B-roll. Sound follows the reference ([creative contract and review](creative-contract-and-review.md)); a sine bed or drone is never music.

## 6. Captions

- **Karaoke pop:** word by word, synced to speech word timings. For speech formats.
- **Static title card:** a full sentence held on screen. For music-only formats, where the caption is the script.
- Style carries the brand register: heavy sans for a loud hook, delicate serif for wellness, monospace on a plate for proof numbers.
- Lower-centre in the caption-safe area is the default; upper third for a hook claim. Keep captions off the product and off faces. Emoji sparingly.

## 7. Editorial archetypes

One production format can be cut in several ways:

| Archetype | Sound | Captions | Pacing signature |
|---|---|---|---|
| Silent product demo | music-only | title cards | feature bursts + payoff hold |
| VO product demo | vo+music | karaoke | use flow, claim then proof |
| Creator talking head | speech-only | karaoke | breath jump-cuts, B-roll inserts |
| Multicam podcast clip | speech-only | karaoke | angle changes on gestures |
| Reaction montage | vo+music | karaoke | reaction inserts on exclamations |
| Brand process film | vo+music | lower thirds | claim to demo within 1.5 s, 6-8 setups |
| Concept loop | music-only | in-world text | seamless loop |
| B-roll narrative essay | vo+music | title cards | two acts, structural silence |

## 8. What AI can and cannot make today

- **Reliable:** the whole edit layer in this file: cuts, pacing, payoff hold, beat sync, captions, silence beats, title cards and hard-cut assembly.
- **With effort:** slow premium camera moves, stills to motion, talking heads through voice-first lip-sync.
- **Unreliable:** sustained hands handling a product, liquid physics, readable real labels, spontaneous reactions and specific real places. Use real footage or photos for these, and put packaging on from the real photo.

The edit is the moat, not the footage.
