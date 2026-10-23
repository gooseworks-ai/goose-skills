---
name: where-to-start-situation-save
description: >-
  Step of the where-to-start playbook: saves the founder's answers and the agreed first move with the
  brand, so later visits and other playbooks don't ask again. Run where-to-start instead; not for
  direct use.
version: 0.1.0
---

# situation-save

## Input
The founder's answers (their words), the brand (id, slug, `coworker_agent_id`) unless there is no real brand, what the short look at the site showed, the constraint you named, the recommendation and whether they agreed, and today's date.

No real brand (none, or an empty placeholder): save nothing, and say so plainly ("I can't save these yet — there's no brand set up"). If a brand is set up later in this same conversation, run this atom then, before anything else asks the founder again.

## Steps

1. **The situation file.** `gooseworks:file_read` `brand/situation.md` (brand coworker scope; no coworker → default workspace under `brands/<brand-slug>/`, and say so once). Replace the "Latest" section; move the previous "Latest" under "History" (keep the last three). Format:

   ```markdown
   # Situation — <Brand>
   Do this first, because: <the constraint in one clause> → <the agreed first move>.

   ## Latest — <YYYY-MM-DD>
   Founder said [owner, <date>]: sells <…> to <…>; where it sells <…>; stage <…>; goal <…> by <date>; can put in <…>/month and <…> h/week; does the work: <…>; next big date <…>; tried <…>; has <list / audience / network…>.
   Seen on the site [site, read <date>]: <offer, price, first reason to buy, list sign-up>.
   Unknown: <what they didn't know>.
   Agent's read [guess, <date>]: constraint <…>; first move <…> (<agreed | adjusted to … | not agreed>); not yet <…>; worked if <…>; come back when <…>.

   ## History
   <earlier "Latest" sections, newest first, at most three>
   ```
   Keep the founder's words, what the site showed and your read on separate lines. Never put a guess on the "Founder said" line. No plan names or credit sums.
2. **Save it** through the `save-to-brain` skill (`../save-to-brain/SKILL.md`): path `brand/situation.md`, artifact `Situation`, title `Situation — <Brand> — <YYYY-MM-DD>`, tags `[where-to-start, situation]`, `versioned: supersede`.
3. **Profile fields** (only those the founder stated, only clear matches to the listed values): `gooseworks:brand_update` with `brand_id`, `knowledge_intent: "user_correction"`, `user_statement` = the founder's words that gave them, and `patch.onboarding`: `role`; `ad_spend` only if they said what they spend on ads today (question 4 asks what they *can* put in, which is not the same); `goals` and `platforms` only where a listed value plainly matches.
4. **Check the answers.** If a write failed, say in one line that it wasn't saved, and carry on.

## Rules
- **Run only after the founder answered the recommendation in this conversation** (SKILL step 6), never before. A buyer, audience or strategy line is saved only once they agreed to it; `not agreed` keeps their own answers and marks the read as not agreed.
- Save only what the founder said and what the pages showed; your read is labelled as yours.
- Budget, revenue and margin are internal: they stay in this file, never in public-facing fields.
- Never write claims, voice or positioning here (claims go only through the claims gate in the job that needs them).
- Never use `user_context` for brand facts.
