---
name: make-static-ads-concept-grid
description: >-
  Step of make-static-ads: turns the chosen angles into messages, visual ideas and a template per ad, checks each against the brand profile and recent ads, writes the concept board and has a fresh critic attack it before any copy, prompt or spend. Run make-static-ads instead; not for direct use.
version: 0.9.0
---

# concept-grid

**Read first:** `../make-static-ads/references/ideas.md` §1–4 (§1 the failure and what a demonstration is; §2 the method, whose A is the material for step 2 below; §3 the tests; §4 two short examples), `../make-static-ads/references/levels.md` (what each creativity level keeps from the template). This step is the order of work.
**Reads:** `profile.md` and what Step 1 found (product facts, customer words, history); the angles and level chosen in Step 2.
**Writes:** `board.md` in the batch folder `ads/batches/<YYYY-MM-DD>-<slug>/` (on a host with no files, in the batch file).

The order is fixed: **angle → message → visual idea → style → template.** The template never decides the message.

## 1. Angle

Each ad starts from the angle chosen in Step 2: one of the profile's angles, or a marked new one (the cap: `../make-static-ads/SKILL.md` Step 2). Several ads may share an angle; they then need different messages.

## 2. Message

For each ad, the one thing it says, as a plain sentence, grounded in a product fact or customer situation with its source, or labelled **(hypothesis)**. Draft two or three messages per angle and keep the strongest. The message must sound like the brand (the profile's voice and positioning), not like a generic ad.

## 3. Visual idea

For each message: the tension (want / obstacle / why this product belongs), then the picture. At **bold**, a physical event (`ideas.md` §2 C). At **balanced**, an event or scene that fits a template's layout. At **close**, a proven scene named in words ("product centred on a split comparison table"), so the idea is mostly in the message; the template step then finds a template that carries that scene. Draft two or three for the strongest messages before choosing. Browse templates or references now if you need more devices.

## 4. Style

Pick each ad's style from the table in `levels.md` (Style), starting with the styles the brand's own ads use (`profile.md`). Check the set as you go against the style rule there.

## 5. Template

Every ad gets a template in its chosen style, picked after the visual idea and style so the layout fits both (the `make-static-ads-find-references` skill (`../make-static-ads-find-references/SKILL.md`)). Record what the level keeps from it (`levels.md`).

## 6. Tests

Run on each candidate, fix or drop failures:
- **Brand fit:** would this brand run it? It serves a profile angle (or is marked new), sounds like the brand, and its look fits the profile. An idea the brand's marketer would call "not us" fails, however clever.
- **No repeat:** against the brand's live ads and its last 10 ads made in GooseWorks (Step 1), an ad may share an angle, but at least one of message, visual idea or template must change. Within this set, every ad has its own message, the set follows the style rule in `levels.md` (Style), and no product is the hero of more than half the set unless the marketer chose it. The same ad resized or for another platform is not a repeat.
- The six tests in `ideas.md` §3: swap, stranger, thumbnail, show-it, build, truth.

## 7. Choose the set

One different message per ad, not one look per ad. At most one straight demonstration per five, and only if watching it answers the buyer's main question.

## 8. Write the board

```markdown
# Concept board — <brand>, <product>, <date>

Read: <what you actually read, with counts; what was skimmed; what wasn't checked>
Level: <close / balanced / bold> · Angles: <chosen, and who chose them> · Templates from outside the library: <which, or what was tried>

| # | Angle (profile / new) | Message (source) | Visual idea | Style | On-image text (per slot) | Template (source, what it keeps) | Protect |
|---|---|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | "..." / "..." | ... | ... |

## Critic notes and what changed
## Dropped ideas (why)
```

- **Visual idea:** one sentence a stranger could picture.
- **On-image text:** one working line per template slot; playbook Step 4 (copy) finalises it.
- **Template:** where it came from (brand's own ad, library, another brand's ad) and what this ad keeps from it.
- **Protect:** the one detail that kills the idea if lost (`ideas.md` §2 E).

## 9. The critic

Give a **fresh subagent** only: the board (without the critic section), `profile.md`, the brand's own ads you looked at, the product photos, and the product records and claims on file as they came back (not your summary). Not your reasoning. Ask it to:
- name any row this brand would not run, judged against the profile and its real ads;
- name any row that repeats a live or recent ad, or another row, in message, visual idea and template together;
- run the swap and stranger tests on every row;
- name demonstrations dressed up as ideas;
- check each event is buildable (no small handwriting, long in-scene text, many hands, crowds or fragile physics) and readable at thumbnail size;
- name a style used by most of the set, or a set that reads as one look (for example all staged props or miniatures);
- name rows that look empty or bland: a headline on blank space, a symbol instead of the real thing, or the same text pattern as another row;
- check each source supports what the row implies;
- pick the two weakest rows and say why.

Fix or replace what it names; write its notes and your changes into the board. A row you keep against its objection says why. **New or rewritten rows go back to a critic** once. At most two critic rounds: objections still open after that go on the board for the marketer. No subagents on this host → no critic runs; the Step 7 board says so (its question for this case: `../make-static-ads/references/handoff-format.md` §2). Your own review does not count as a critic.

**Done:** every row has an angle, a sourced message, a visual idea, a style, a template and a protected choice; the set meets the style rule; every row passed the tests and survived the critic or was changed.
