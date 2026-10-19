---
name: where-to-start
description: >-
  I don't know what to do first, guide me. Use when a founder or first marketer asks something open-ended:
  help me with marketing, where do I start, what should I do first, I have no marketing plan, we just launched
  and need customers, sales are flat and I don't know where to start, what should I focus on this month, I'm
  back and not sure what's next. Takes a quick look at what GooseWorks already knows and at the site, asks at
  most five plain questions, names the one thing actually in the way, and recommends the first one or two
  moves with why now, what each produces, what to bring, what not to do yet, and how you'll know it worked.
  Says so plainly when the real first move is something you do yourself or that isn't covered yet.
  Recommends only; never runs the work. Not for a named job like make me ads (go straight to it) or reading
  why this week's numbers moved (use analyze-performance).
---

# where-to-start

For the confused ask only. A founder who already knows what they want ("make me ads", "plan my launch") goes straight to that playbook and never passes through here. This playbook frames the situation, holds it against the map of playbooks, and recommends a first move a senior advisor would stand behind. Judgment stays with you; the references make sure it looks at the right things.

Talk about the founder's business and the work, never about tools, ids, playbook names or credit sums. Name each move by what it does ("set up your welcome and post-purchase emails"), using the "Say it as" names in `references/playbook-map.md`.

## What you get

A first-move recommendation on one screen: the read of the situation, the one constraint in the way, one or two moves (or a step the founder takes plus one move alongside), what to bring, what not to do yet and why, a "worked if" with a number and a date, when to come back, and an offer of the next job in plain words. The founder's answers are saved with the brand, so the next visit, the brand setup and the job they ask for next don't ask again.

## Before you start

1. **Connection.** No `gooseworks:` tools (after one `gooseworks:tools_load` for a missing group: brand, campaigns, files, media) → say only: "Connect GooseWorks first — I look at what we already know about your business through it." Nothing else runs.
2. **First call** (unless already made in this conversation): `gooseworks:get_started` with the founder's words and `wants: "more"`. Use its answer only to settle setup and which brand; keep any card to one line and continue here.
3. **Is this really the confused ask?** If they name an outcome one playbook owns, or ask why this week's numbers moved on channels already running, offer that job straight away in plain words (`references/playbook-map.md`) and stop. If the direct ask is plainly blocked by something they said ("do ads" with no budget), still offer it, but name the blocker in one line and offer the first-move check instead.
4. **Find the brand.** `gooseworks:brand_read` with no brand lists the brands (note `coworker_agent_id` and `ad_library_ad_count`). If they named one, use it; if there are several and they didn't, name the one you assume ("I'm looking at Personal Day — right?") or ask by name. Never offer a partial list of brands as if it were all of them. A brand with no description and no research is an empty placeholder: treat it as no brand and don't write to it. Never start brand setup or research here.

## Steps

### 1. Look before asking (free, bounded)
Load `references/questions.md`.
- **The brain:** `gooseworks:brand_read` `sections: ["summary", "kit", "products", "onboarding", "learnings", "accounts"]` (lean); one `gooseworks:knowledge_search` across `["evidence", "learning", "document", "creative"]` for "ads running, offers, results, what was tried"; `gooseworks:campaign_read` (list); the workspace file `brand/situation.md` (brand coworker scope, `gooseworks:file_read`) from an earlier visit. The claims marker in learnings matters only for what to bring (a sign-off before copy is written); it is never the constraint.
- **Earlier work is evidence, not the situation.** Campaign plans, research, ad batches and briefs saved on the brand were made in other sessions, maybe by someone else, maybe as drafts. Never adopt their goals, channels, deadlines or blockers as the founder's. Mention what you found in one line with its date ("I see a campaign plan saved on 18 Oct — email plus Meta ads in November. Is that yours, and are you still working from it?"); never call it "your plan" before they say so. Its facts can shorten your questions as confirmations ("It says the goal is 20 paying by end of November — still right?"), but its framing, channels and blockers are not adopted: a plan is an answer that skipped this diagnosis. Treat it as a second opinion — if your read disagrees, say so plainly ("I'd hold that plan: it buys ads before we know why people leave"). Until the founder confirms it, it changes nothing in your read.
- **A short look at the business,** with the host's own web fetch or browser, at most three public pages: the homepage, the pricing or store/product page, and the app-store or marketplace listing if that is where it sells. Note the offer, the price, the first reason to buy, and whether a list sign-up exists. Own ads: the brand list's `ad_library_ad_count`. No competitor reads, no paid data, nothing else. A host with no fetch or browser: skip this and say so in one line.
Map what you found against the five questions. The brain and the pages can answer what the business sells and to whom; only the founder can answer where it is stuck, what the goal is, and what they can put in.

**Return visit?** If `brand/situation.md` shows an earlier recommendation, open with it ("Last time, on <date>, we said start with X because Y. How did it go?") and skip what it already answers:
- *Did it* → measure results if they exist, or replan; if they can't tell, that is blindness.
- *Didn't do it* → if they haven't said why, ask; then cut the same move to the smallest slice that matters before the next date, or swap it for one that fits the real blocker. Same advice is fine; same scope is not.
- *Things changed* → re-run the constraint check on the new facts only.
Same output shape, with a first line on what changed. Never restart from zero.

### 2. Ask the founder (always, before any advice)
One message: "Here's what I already know: … Correct anything." Then the situation questions (`references/questions.md`), at most five asks in total, with options, plain words and an easy "don't know". **Questions 2, 4 and 5 — where it's stuck, what they can put in, and the goal and date — are the founder's to answer and are always asked on a first visit**, however much the brain holds: saved documents describe what other jobs planned, not what the founder wants now. Skip one only if the founder already said it in this conversation, or confirmed it on an earlier visit (`brand/situation.md`, then ask "still true?"). Skip question 1 when the brain and site answer it. State what you can work out (the season from today's date, what the site shows). One follow-up round at most, only for a fact that would flip the answer. Never recommend in the same message as these questions; wait for the answers, then echo the situation back in one line.

### 3. Place the company
Load `references/situation-lens.md`. Place the stage by evidence and name the **one binding constraint** — a fact about customers or the business, from what the founder told you — with the evidence in one clause. A missing setup step (claims not signed off, an account not connected, a list not pulled) is never the constraint; at most it is something to bring. Weigh company type, sales motion, where it sells, budget, the founder's hours and who does the work, existing assets, regulated claims, repeat purchase, and the next big date against today's date. Use `references/base-rates.md` to call an unrealistic target and to set the "worked if" number. Name the next big date for the business and for its customers (for a tool sold to consumer brands, their Black Friday rush is part of the calendar). If the constraint is not a marketing problem, say so.

### 4. Walk the map
Load `references/playbook-map.md`. Which playbooks serve the constraint, and can the founder supply each one's "must bring" this week, including its cost against what they can spend? Drop any whose inputs they don't have. A need in a gap → say so; the first move is then a step the founder takes, with at most one playbook alongside. Learning the brand: see its map entry for when it is a "Bring" item and when it is the move. Hold the ad bias in check. Use what they already have before anything cold.

### 5. Recommend
Load `references/output-shape.md`. Read, constraint, first move (one, at most two), bring, not yet (covering everything they raised that you are not recommending, and any saved plan they haven't confirmed), worked if (an outcome number the founder can see, with a date — never "task done"), come back when, the offer of the next job. Under about 250 words. Commit. Every fact comes from the founder, the brain or the pages you looked at. Don't say anything is saved here; saving comes after they agree.

### 6. Agree, save, hand off
- If they disagree, ask what feels wrong and adjust once; their call stands.
- **Save as soon as they agree** ("makes sense", "ok" counts): their answers and the agreed recommendation with `atoms/situation-save`, so the next job reads them instead of asking. Say "saved" in one line only after the save comes back; if it failed or there is no brand, say plainly it isn't saved.
- Then offer the chosen job in plain words. Never start another playbook yourself (AGENTS §2 rule 9): their own request starts it, and it reads the saved answers.

## Approval gates

None: nothing here spends money, makes a claim or sends anything. The only writes are the founder's own answers and the recommendation, saved with their brand. Every real commitment is gated inside the playbook it points to.

## Output and write-back

- **To the human:** the first-move recommendation (`references/output-shape.md`).
- **Into the brain** (`atoms/situation-save`): the founder's stated situation and the agreed recommendation in `brand/situation.md` (brand coworker scope), imported as the brand document `Situation — <Brand> — <date>` through `../../atoms/save-to-brain/ATOM.md`; clear matches to the brand's onboarding profile (role, ad-spend band, goals, platforms). Readers: the next visit here, learn-my-brand (moves confirmed facts into the Brand record), and any playbook that searches the brand's documents for goal, budget or date. No brand yet → the answers can't be saved; say so plainly. If the brand gets set up later in this same conversation (for example the first move is setting up the brand), run `atoms/situation-save` then.

## Done when

The founder has a first move they agree with — one or two moves (or a named step of their own), with the reason — and nothing they had already told GooseWorks was asked again. Check: a reviewer who knows the brand would genuinely start where it points (`tests/test-by-hand.md`).

## Out of scope

- Routing direct asks — they go straight to their playbook (decision D2). Why this week's numbers moved — analyze-performance.
- Running any playbook, or starting one without a yes.
- A marketing plan, budget split, calendar or committed channel mix — plan-campaign.
- Research beyond the short look (competitors, reviews, ad libraries, search data) — the research playbooks.
- Brand setup, claims or voice sign-off — learn-my-brand.
- Decision rulebooks — judgment stays with the model (D2).
- Investment, fundraising or financial advice.
