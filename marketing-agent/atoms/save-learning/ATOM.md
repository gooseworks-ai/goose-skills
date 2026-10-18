---
name: save-learning
description: >-
  Shared atom (owner: learn-my-brand session). The single seam for writing brand learnings (short rules and
  findings the brand's engines read) by the AGENTS §8 rules — the human's own words, one idea per learning, a
  fixed opening, retire your own superseded learnings, read back to confirm. Holds the only interim handling of
  today's server. Loaded by any playbook that saves a learning; never listed.
---

# save-learning

Learnings are the brand's short rules: today `brand_update` `patch.facts`. Every playbook writes them through this atom and nowhere else. When the rebuilt Brand Brain ships (gooseworks-app PRs #2079 / #2081: typed facts, statuses, `brain_*` tools), only this atom switches to the new tools; the playbooks do not change.

Long evidence, tables and reports belong in a brand document (`atoms/save-to-brain`); a learning is the rule or finding itself, in the human's words.

## When you may write one

- Only with the human's own words: `knowledge_intent: "user_correction"` and `user_statement` holding what they typed (an explicit approval such as "yes, save that rule" counts; your draft never goes there). Without their words, don't write it: put the finding in your document instead.
- `must` and `dont` only for rules the human stated or approved. Findings are `insight`; style guidance is `do`.

## The text

- **One idea per learning**, plain words, so it can be found, merged and retired on its own.
- Opening:
  - **learn-my-brand's own** (only learn-my-brand writes or retires them; `atoms/claims-gate` §5 is its delegate for the marker and claims): `Claims sign-off (learn-my-brand, …`, `Claims you may use — …`, `Never say — …`, `Policy: …`, `Banned words — …`, `Not public — …`. Other playbooks read them, never write them; a playbook with its own policy rule writes it under its own `[<source> …]` opening.
  - **shared:** `Standing offer: <offer> until <date | ongoing> [owner, <date>]` only. email-lifecycle writes it, and learn-my-brand may retire or rewrite it when the owner changes the offer. Either writer may retire the other's `Standing offer:` fact.
  - everyone else: `[<source> YYYY-MM-DD]`, source = `learning` (analyze-performance; add ` A-NN` for an angle) · `market` (research-market) · `angle A-NN` · `listening` (research-market's listening) · `search` (improve-search-visibility) · `lifecycle` (email-lifecycle) · `content` (make-content) · `social` (run-organic-social) · `ads` (make-static-ads) · `video` (make-video-ads) · `photos` (make-product-photos) · `outreach` (research-audience) · `creators` (work-with-creators). One source per playbook, so "retire your own" never reaches another playbook's facts.
- Example: `[lifecycle 2026-10-16] Never send a promo email the day after a shipping delay email.`

## Steps (one `brand_update` call per save)

1. **Read** `gooseworks:brand_read` `sections: ["learnings"]` — lean returns every `must`/`dont`; use `detail: "full"` when you also need `do`/`insight`/`template_hint` rows and their ids. Look for a learning that already says the same thing.
2. **Retire your own superseded learnings** in the same call: `{id, active: false}` for each of your playbook's learnings (same opening) the new one replaces or contradicts. Never retire another playbook's learning; if yours contradicts it, tell the human. Exceptions: `atoms/claims-gate` §5 retires and rewrites learn-my-brand's marker; `Standing offer:` (above).
3. **Add** every learning the human gave you, one idea each.
4. **Read back** the learnings and compare each stored text with what you sent. A missing one is reported as not saved. Whether reads hide retired (`active: false`) rows is checked here too; a retired learning that still shows is deleted (`delete: true`).
5. **Tell the human in one line** what was saved, in plain words ("I've saved that as a rule for future ads").

## Today's server (interim)

Remove this section when the rebuilt Brand Brain ships; this atom then switches to its tools.

- Today the server cuts learning text over 300 characters without an error. If a learning is longer, still write it as one learning (the stored copy will be cut), keep the **full text** in the related brand document (through `atoms/save-to-brain`; for learn-my-brand, the Brand record), and tell the human in one line where the full text lives. Never split one idea into several learnings or reword it just to fit.
- In step 4, a stored text that matches the first 300 characters of a longer learning counts as saved, provided the full text is in that document.

## Never

- Never write a learning without the human's words.
- Never pack several rules or several claims into one learning.
- Never use learnings as storage for reports, lists or evidence.
- Never write `must`/`dont` from your own inference.
- Never ration, shorten or reorder learnings to fit a server limit. Any interim handling lives in the section above, nowhere else.
