---
name: where-to-start
description: >-
  First-move advice for an open-ended marketing ask: looks at what GooseWorks already knows and at the
  site, asks at most five plain questions, names the one thing in the way, and recommends the first
  one or two moves. Use when the marketer says "help me with marketing", "where do I start", "we need
  more customers", "sales are flat", "what should I focus on this month", or "I'm back, what's next?".
  Recommends only; never runs the work. Not for a named job like "make me ads" (go straight to it);
  not for why this week's numbers moved — use analyze-performance.
version: 0.1.1
---

# where-to-start

This playbook frames the situation, holds it against the map of playbooks, and recommends a first move a senior advisor would stand behind. Judgment stays with you; the references make sure it looks at the right things.

Name each move by what it does ("set up your welcome and post-purchase emails"), using the "Say it as" names in `references/playbook-map.md`.

## What you get

A first-move recommendation on one screen: the read of the situation, the one constraint in the way, one or two moves (or a step the marketer takes plus one move alongside), what to bring, what not to do yet and why, a "worked if" with a number and a date, when to come back, and an offer of the next job in plain words. The marketer's answers are saved with the brand, so the next visit, the brand setup and the job they ask for next don't ask again.

## Before you start

1. **Setup first:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read) before anything else; the job line is "I look at what we already know about your business through it." Here: call `get_started` with `wants: "more"` and keep any card to one line; note each brand's `ad_library_ad_count` from the brand list. Never offer a partial list of brands as if it were all of them. A brand with no description and no research is an empty placeholder: treat it as no brand and don't write to it. Never start brand setup or research here.
2. **Is this really the confused ask?** If they name an outcome one playbook owns, or ask why this week's numbers moved on channels already running, offer that job straight away in plain words (`references/playbook-map.md`) and stop. If the direct ask is plainly blocked by something they said ("do ads" with no budget), still offer it, but name the blocker in one line and offer the first-move check instead.

## Steps

### 1. Look before asking (free, bounded)
Load `references/questions.md`.
- **The brain:** the guide's read, aimed at goal, budget, offers, results and what was tried. On the fallback path that is `gooseworks:brand_read` `sections: ["summary", "kit", "products", "onboarding", "learnings", "accounts"]` (lean) and one `gooseworks:knowledge_search` across `["evidence", "learning", "document", "creative"]` for "ads running, offers, results, what was tried". Either path: `gooseworks:campaign_read` (list) and the workspace file `brand/situation.md` (`gooseworks:file_read`) from an earlier visit. Claim status matters only for what to bring (a sign-off before copy is written); it is never the constraint.
- **Earlier work is evidence, not the situation.** Campaign plans, research, ad batches and briefs saved on the brand were made in other sessions, maybe by someone else, maybe as drafts. Never adopt their goals, channels, deadlines or blockers as the marketer's. Mention what you found in one line with its date ("I see a campaign plan saved on 18 Oct — email plus Meta ads in November. Is that yours, and are you still working from it?"); never call it "your plan" before they say so. Its facts can shorten your questions as confirmations ("It says the goal is 20 paying by end of November — still right?"), but its framing, channels and blockers are not adopted: a plan is an answer that skipped this diagnosis. Treat it as a second opinion — if your read disagrees, say so plainly ("I'd hold that plan: it buys ads before we know why people leave"). Until the marketer confirms it, it changes nothing in your read. The same goes for **setup flags, onboarding fields, learnings and "blockers" an agent wrote** ("claims not signed off", a guessed audience): proposals, not facts — check each against the marketer's own words before it shapes anything. On the brain path every *found* item, and every item waiting for a yes, is something to confirm. The lean brand read doesn't say who wrote a learning or flag, so there treat every plan, flag and learning that isn't plainly in the marketer's own words as something to confirm.
- **A short look at the business,** with the host's own web fetch or browser, at most three public pages: the homepage, the pricing or store/product page, and the app-store or marketplace listing if that is where it sells. Note the offer, the price, the first reason to buy, and whether a list sign-up exists. Own ads: the brand list's `ad_library_ad_count`. No competitor reads, no paid data, nothing else. A host with no fetch or browser: skip this and say so in one line.
Map what you found against the five questions. The brain and the pages can answer what the business sells and to whom; only the marketer can answer where it is stuck, what the goal is, and what they can put in.

**Return visit?** If `brand/situation.md` shows an earlier recommendation, open with it ("Last time, on <date>, we said start with X because Y. How did it go?") and skip what it already answers:
- *Did it* → measure results if they exist, or replan; if they can't tell, that is blindness.
- *Didn't do it* → if they haven't said why, ask; then cut the same move to the smallest slice that matters before the next date, or swap it for one that fits the real blocker. Same advice is fine; same scope is not.
- *Things changed* → re-run the constraint check on the new facts only.
Same output shape, with a first line on what changed. Never restart from zero.

### 2. Ask the marketer (always, before any advice)
One message: "Here's what I already know: … Correct anything." Then the situation questions (`references/questions.md`), at most five asks in total, with options, plain words and an easy "don't know". **Questions 2, 4 and 5 — where it's stuck, what they can put in, and the goal and date — are the marketer's to answer and are always asked on a first visit**, however much the brain holds: saved documents describe what other jobs planned, not what the marketer wants now. Skip one only if the marketer already said it in this conversation, or confirmed it on an earlier visit (`brand/situation.md`, then ask "still true?"). Skip question 1 when the brain and site answer it. State what you can work out (the season from today's date, what the site shows). One follow-up round at most, only for a fact that would flip the answer. Never recommend in the same message as these questions; wait for the answers, then echo the situation back in one line.

### 3. Place the company
Load `references/situation-lens.md`. Place the stage by evidence and name the **one binding constraint** — a fact about customers or the business, from what the marketer told you — with the evidence in one clause. A missing setup step (claims not signed off, an account not connected, a list not pulled) is never the constraint; at most it is something to bring. **Check the product-side constraints before any marketing move** — fit, activation, retention, pricing: a brand whose sign-ups never reach a first result needs activation, not more acquisition. Weigh company type, sales motion, where it sells, budget, the marketer's hours and who does the work, existing assets, regulated claims, repeat purchase, and the next big date against today's date. Use `references/base-rates.md` to call an unrealistic target and to set the "worked if" number. Name the next big date for the business and for its customers (for a tool sold to consumer brands, their Black Friday rush is part of the calendar). If the constraint is not a marketing problem, say so.

### 4. Walk the map
Load `references/playbook-map.md`. Which playbooks serve the constraint, and can the marketer supply each one's "must bring" this week, including its cost against what they can spend? Drop any whose inputs they don't have. A need in a gap → say so; the first move is then a step the marketer takes, with at most one playbook alongside. Claims: see the map's "Claims before copy" note for when OK-ing a few claim lines is a "Bring" item. Hold the ad bias in check. Use what they already have before anything cold.

### 5. Recommend
Load `references/output-shape.md`. Read, constraint, first move (one, at most two), bring, not yet (covering everything they raised that you are not recommending, and any saved plan they haven't confirmed), worked if (an outcome number the marketer can see, with a date — never "task done"), come back when, the offer of the next job. At most 250 words. Commit. **Product-scope calls** (which users are "not our audience", which plan to cut) are shown as decisions for the founders, with what each choice costs, never as advice. **Sequence the moves by hours:** add up what each needs against the marketer's stated hours; one person can't run social, cold email and creators at once, so name the order and the trigger for the next. Every fact comes from the marketer, the brain or the pages you looked at. Don't say anything is saved here; saving comes after they agree.

### 6. Agree, save, hand off
- If they disagree, ask what feels wrong and adjust once; their call stands.
- **Save as soon as they agree** ("makes sense", "ok" counts) — never before, and never a buyer, audience or strategy line they haven't agreed to: their answers and the agreed recommendation with the `where-to-start-situation-save` skill (`../where-to-start-situation-save/SKILL.md`), so the next job reads them instead of asking. Say "saved" in one line only after the save comes back; if it failed or there is no brand, say plainly it isn't saved.
- Then offer the chosen job in plain words. Never start another playbook yourself: their own request starts it, and it reads the saved answers.

## Approval gates

None: nothing here spends money, makes a claim or sends anything. The only writes are the marketer's own answers and the recommendation, saved with their brand. Every real commitment is gated inside the playbook it points to.

## Output and write-back

- **To the human:** the first-move recommendation (`references/output-shape.md`).
- **Into the brain:** the `where-to-start-situation-save` skill (`../where-to-start-situation-save/SKILL.md`) (`brand/situation.md` as the brand document `Situation — <Brand> — <date>`, plus clear onboarding matches). Readers: the next visit here, and any playbook that searches the brand's documents for goal, budget or date.

## Done when

- At most five asks in total, follow-ups included, and none asked what the marketer had already told GooseWorks or said in this conversation.
- The one constraint is named with its evidence.
- One or two moves (or a named step of their own), each with its reason, and a "worked if" with an outcome number and a date.
- The recommendation is at most 250 words.
- Saved only after the marketer agreed, with "saved" said only once the save came back — or "not saved" stated plainly.
- A reviewer who knows the brand would genuinely start where it points (`tests/test-by-hand.md`).

## Out of scope

- Routing direct asks — they go straight to their playbook. Why this week's numbers moved — analyze-performance.
- Running any playbook, or starting one without a yes.
- A marketing plan, budget split, calendar or committed channel mix — plan-campaign.
- Research beyond the short look (competitors, reviews, ad libraries, search data) — the research playbooks.
- Brand setup, a full claims audit or voice sign-off — not covered yet (the claim lines a job needs are approved inside that job).
- Investment, fundraising or financial advice.
