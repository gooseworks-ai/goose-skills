---
name: make-static-ads-concept-grid
description: >-
  Step of make-static-ads: turns product facts and customer situations into distinct visual ideas, writes the concept board and has a fresh critic attack it before any copy, prompt or spend. Run make-static-ads instead; not for direct use.
version: 0.6.0
---

# concept-grid

**Read first, whole:** `../make-static-ads/references/ideas.md`. It is the method; this step is the order of work.
**Reads:** what Step 1 of the playbook found (product facts, customer words, live ads, history, claims on file).
**Writes:** `board.md` (in the batch folder, or the batch file on a host with no files).

## 1. Starting points (at least twice the ad count, never fewer than 10)

List product facts and human situations, one plain sentence each, with its source ("product page", "review, Amazon, 3 Oct", "voc V-07") or **(hypothesis)**. Keep the ones you drop, with why, at the bottom of the board. Don't start from the brand's own live ads; they tell you what's already said, not what to say next.

## 2. Ideas

For each promising starting point: the tension (want / obstacle / why this product belongs), then a physical event that makes it visible (`ideas.md` §2 C). Draft two or three different events for the strongest starting points before choosing. Look at references now if you need more devices (the `make-static-ads-find-references` skill (`../make-static-ads-find-references/SKILL.md`)).

Run the three tests on each candidate (`ideas.md` §3: swap, thumbnail, truth). Fix or drop failures.

## 3. Choose the set

Pick the ads so each one says something different (`ideas.md` §4). At most one straight demonstration per five, and only if watching it answers the buyer's main question. Don't repeat a meaning from the brand's live ads or earlier batches; reusing a fact in a new event is fine.

## 4. Write the board

```markdown
# Concept board — <brand>, <product>, <date>

Read: <what you actually read, with counts; what was skimmed; what wasn't checked>

| # | Starting point (source) | Human situation | Physical event | Headline / support | Protect | References (role) |
|---|---|---|---|---|---|---|
| 1 | ... | ... | ... | "..." / "..." | ... | ... |

## Critic notes and what changed
## Dropped starting points and ideas (why)
```

- **Starting point:** the fact or situation and its source. A hypothesis is labelled.
- **Physical event:** one sentence a stranger could picture.
- **Headline / support:** a working line; the ad-copy step finalises it.
- **Protect:** the one detail that kills the idea if lost (`ideas.md` §2 E).
- **References:** which reference contributed what (device / craft / layout), or "none".

## 5. The critic

Give a **fresh subagent** only: the board (without the critic section), the product photos, the product facts and claims on file, and the brand's live ads you looked at. Not your reasoning. Ask it to:
- run the swap test on every row and name any that a competitor could run;
- name rows that are demonstrations dressed up as ideas;
- name pairs that say the same thing;
- check each event is buildable and readable at thumbnail size;
- check each starting point's source supports what the row implies;
- pick the two weakest rows and say why.

Fix or replace what it names, then write its notes and your changes into the board. A row you keep against its objection says why. **New or rewritten rows go back to a critic** (the same one or a fresh one) before you continue; an unreviewed replacement is the easiest place for a weak idea to slip through. No subagents on this host → show the board to the marketer and ask for their critique before going on; your own review does not count.

**Done:** every row has a source or a hypothesis label, a physical event, a protected choice, and survived the critic or was changed.
