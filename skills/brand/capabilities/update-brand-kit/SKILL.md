---
name: update-brand-kit
description: Maintain a brand kit — the canonical brand context an ad or content pipeline reads (positioning, audience, voice, standing instructions, brand-type, value-props, colors), plus manage the product list and attach product photos. Use when someone says "update my brand kit", "set my brand voice/audience", "add a product to my brand", or hands you a folder of product shots to attach. Platform-agnostic: it teaches the field model, partial-update/clear semantics, override behavior, caps and validation, and the hero-image and product-matching rules — independent of any specific backend.
tags:
  - brand
  - ads
---

# Update Brand Kit

## Purpose

Keep a **brand kit** correct and rich by talking to the user. A brand kit is the
canonical context an ad/content-generation pipeline reads, so what's in it
directly shapes every downstream generation. Reach for this whenever the user
wants to set or refine brand positioning/voice/audience, add standing do/don't
guidance, manage the product list, or attach product photos.

This skill is the **portable domain model** — the fields, the semantics, the
rules. How you actually persist a change is the host's concern: a brand-kit API,
a CLI, or a brand-kit document in a workspace. The field model, semantics, and
caps below hold regardless of which backend stores the kit.

## Inputs

- A natural-language request — free-form ("make the voice warmer and more
  technical", "we sell to ops teams not consumers", "add our Pro plan at $49").
  You translate this into the field model below; do not ask the user to name
  fields.
- Optionally, a **brand identifier or name** — when the user owns more than one
  brand, you need to know which one. If they only have one, use it.
- Optionally, a **folder of product photos** to attach to a product.

## The brand-kit field model

These are the **context fields**. Treat each edit as a partial update (see
semantics): set only what's changing.

- `description` — what the brand does, in 1–2 sentences.
- `audience` — target audience / ICP.
- `voice` — tone of the copy.
- `instructions` — standing guidance applied to every generation (e.g. "always
  show the product in use", "never use red"). High-leverage — set this whenever
  the user describes a recurring do/don't, not a one-off.
- `brand_type` — one of: product, saas, service, agency, restaurant, fashion,
  beauty, fitness, finance, education, health.
- `value_props` — short selling points; the kit keeps the first 5.
- `primary_color` / `accent_color` — hex like #1a2b3c (validate the format).

**Products** (a list on the kit) carry: `name` (required), `description`, `link`,
`pricing` (free text, e.g. "$49"), `offers` (e.g. "20% off launch week"),
`notes` (markdown), and an ordered list of **images**.

## Semantics (the rules that make edits safe)

- **Partial update.** Pass only the fields you want to change; omitted fields are
  left untouched. Editing voice never disturbs audience.
- **Clear with empty.** To clear a field, set it to empty/null — distinct from
  omitting it.
- **Idempotent.** Re-applying the same values is safe (no duplication). Images
  dedupe per product.
- **User overrides win.** Treat every manual edit as a user override so a later
  automated brand-research re-run preserves it instead of overwriting. This is
  the whole reason hand edits are durable — don't let a refresh clobber
  intentional human choices.
- **Product matching.** Match an existing product by a stable id when you have
  one; otherwise by case-insensitive name. Same logic for delete.
- **Images live on the product**, not on an edit — they survive a product
  rename/edit. The first image is the **hero**: the picker thumbnail and the
  generation reference. Order matters; put the canonical shot first.

## Workflow

1. **Identify the brand.** If the user has multiple brands, confirm which one by
   name; if one, use it. Read its current kit and quote back what's already set
   so the user sees exactly what you're about to change.

2. **Translate intent into fields.** Map the free-form request onto the field
   model above. If something is a recurring rule, it belongs in `instructions`,
   not in a one-off generation prompt.

3. **Apply context edits** as a partial update. Confirm each write by reflecting
   the new value back.

4. **Manage products** (create/edit/delete) before attaching any image — the
   product must exist first.

5. **Attach product photos.** For each image: if the filename is ambiguous about
   which product it depicts, view it rather than guessing; rename to a semantic
   name if helpful. Then upload/host it and attach it to the right product (omit
   the product to make it a brand-level reference image — general imagery not
   tied to one product). Remember the first image is the hero.

6. **Confirm.** Summarize what changed — fields updated, products added/edited,
   images attached and to which product — and surface any cap or validation issue
   with the exact limit and the fix.

## Output

An updated brand kit: revised context fields, an up-to-date product list, and
product/brand images attached in the right order (hero first). Plus a short
human-readable summary of what changed and any limits hit.

## Quality Checks

- Only the intended fields changed (partial update respected — nothing else moved).
- Recurring do/don'ts landed in `instructions`, not buried in a one-off prompt.
- Each manual edit is recorded as a user override (survives a research refresh).
- Caps respected: 12 products max, 8 images per product max, 5 value props max.
- Colors are valid hex; bad hex surfaced with the exact fix.
- Hero image is the first image and is the shot you'd want as the picker thumbnail.
- Current state was quoted back to the user before and after the change.

## Failure Modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Edit wiped an unrelated field | Sent a full object instead of a partial update | Send only the changed fields; omit the rest. |
| Hand edit reappears wrong after a brand-research run | Edit not recorded as a user override | Persist manual edits as overrides so refreshes preserve them. |
| Image attached to the wrong product | Guessed the product from the filename | View ambiguous images before attaching; match product by id/name. |
| Wrong image used as the generation reference | Hero (first image) is not the canonical shot | Reorder so the canonical shot is first. |
| User friction over field names | Asked the user to name fields | Translate their free-form description into fields yourself. |
| A cap was hit silently (12th product / 9th image / 6th value prop dropped) | Exceeded a hard limit | Tell the user the limit and what was dropped; trim or replace. |
| Standing rule ignored on later generations | Put it in a one-off prompt, not `instructions` | Move recurring do/don'ts into `instructions`. |
