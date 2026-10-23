---
name: launch-meta-ad-campaign
description: Take someone from a business goal to a verified, paused-then-live Meta/Facebook/Instagram campaign without making them learn Meta's hierarchy. Use automatically for requests to launch, run, create, publish, set up, or plan Meta ads; use reporting skills for analysis-only requests.
---

# Launch Meta Ad Campaign

**What this is for.** Someone says "I want more signups". They should not have to learn what a
campaign objective is, what an ad set does, what a pixel is, or which of Meta's fourteen
optimization goals fits — and they should not be asked to choose any of them. They tell you
about their business; you do the rest and explain it back in their words.

The skill is agent-neutral: choose the best available adapter, but keep one journey and one
approval boundary.

## Choose one mode

Use the first available mode:

1. **GooseWorks adapter** when all GooseWorks launch tools are callable. Read [references/gooseworks-adapter.md](references/gooseworks-adapter.md).
2. **Direct Meta adapter** when a valid Meta token and ad-account access are available. Read [references/direct-meta-adapter.md](references/direct-meta-adapter.md) and use the bundled `tools/meta_marketing_api.js`.
3. **Planning-only fallback** when neither write adapter is available. Read [references/planning-only.md](references/planning-only.md). Produce a useful plan; do not present missing write access as a failed planning task.

If both write adapters are available, prefer GooseWorks because its approval page, creative
links, and recovery records are already integrated. Never mix adapters within one launch.

**Before Stage 1, resume rather than restart.** If a launch record or push already exists,
resume it. Inspect existing campaigns, ad sets, ads and creative before recommending anything
new, and say whether the intent fits reuse. Never duplicate a partially completed launch, and
never build a second context system when the adapter already provides one.

<!-- shared:launch-journey start -->
<!-- This block is maintained in ONE place and copied byte-for-byte into both the
     goose-lab skill (coworkers/marketing/launch-meta-ad-campaign/SKILL.md) and the
     published skill (skills/ads/composites/launch-meta-ad-campaign/SKILL.md).
     Edit one, copy to the other, and diff the block before shipping. -->

## How to talk to the user

The user talks about their business. Talk back about their business.

Campaign ids, ad-set ids, pixel ids, objectives, optimization goals, placements and bid
strategies are **your** working vocabulary, not theirs. Work them out, use them, and translate
them back. Surface a raw id only when the user asks for one, or when they need it to do
something in Meta themselves.

| What you are dealing with | What you say |
|---|---|
| Campaign objective | "what we're asking Meta to go after" |
| Ad set | the audience and the budget — usually no need to name it at all |
| `LANDING_PAGE_VIEWS` | "we pay for people who actually load your page, not just tap the ad" |
| `LINK_CLICKS` | "we pay for taps — cheaper, but some of them never arrive" |
| `OFFSITE_CONVERSIONS` | "we pay for the action itself — signups, purchases" |
| Pixel / conversion event | "the tracking on your site" / "the action we're counting" |
| Creative | "the ad" |
| Learning phase | "Meta needs roughly 50 of these a week before it can steer well" |
| `effective_status: IN_PROCESS` | "Meta is reviewing it — normal, usually within a day" |
| Account balance / funding source | "the card Meta bills" |
| Lifetime budget + `end_time` | "it spends at most $X and stops itself on the 30th" |

Three rules sit on top of that vocabulary:

- **Frame every launch as a test worth running**, never as "your ads are live". Say what this
  money can and cannot answer *before* it is spent. A budget that cannot measure cost per sale
  should never be reported as if it did.
- **Never say an ad is live until Meta says so.** A successful write is not a live ad.
- **Own the errors.** Translate Meta's failures into what happened and what happens next. Never
  hand back a raw API error and leave the user to decode it.

## Workflow

Seven stages. Stages 1 to 5 run before a single object exists in Meta.

### Stage 1 — Start with the goal

Open here. Do not open with Meta settings, and **never ask the user to pick an objective, an
optimization goal, a budget type or a structure** — those are yours to derive.

Ask for six things, in the user's own language:

1. **The goal** — what should this money produce? Sales, leads, signups, traffic, awareness, or
   "I want to find out whether this works at all".
2. **The offer** — what is being promoted, and what does someone actually get?
3. **The audience** — who is it for, and where are they?
4. **Budget and run time** — the total and how long, e.g. "$300 over two weeks". If they give a
   daily number, ask for the total and duration anyway: "£20 a day" and "£140 for the week"
   build different things.
5. **Success metric** — what number would make this a good fortnight? If they have none, say so
   and propose one.
6. **Destination** — where should someone land after tapping?

Everything else you derive:

| You derive | From |
|---|---|
| Campaign objective | the goal plus the destination — a purchase on a site with tracking → sales; a form or signup → leads; "does this work at all" → traffic |
| Optimization goal | whether the destination carries tracking, and how many of the target event the account already produces per week (Stage 2) |
| Structure — one campaign, one audience, 2–3 ads | the budget |
| Budget type | a total + duration → a lifetime budget with an end date, which hard-caps itself; an open-ended daily figure → a daily budget |
| Placements, bid strategy, billing event | sensible defaults, unless something in the brief argues otherwise |
| Schedule | the ad account's own timezone, never yours |

**When something is missing, explain why you need it** — one sentence, in business terms, then
ask. Never ask for a fact you could look up, and never ask twice for something already answered.

> "I need a rough sense of what a signup is worth to you, because that decides whether we can
> afford to chase signups directly or should buy traffic first and learn from it."

Take silence as a no, never as a yes. If the user genuinely cannot answer, say what you will
assume instead and carry that assumption into the launch brief under *what I'm unsure about*.

**Settle the claims before anything reaches an ad.** Ask what the product does today, what may
and may not be said, and whether there is a real, named, approved customer or result to cite —
default **none**. Verify every number against a page you have rendered this session. Marketing
sites drift: a pricing page saying "$29/mo" and a homepage saying "free tier" means neither can
be quoted until the user resolves it. A wrong number runs publicly under their brand.

### Stage 2 — Work out the rest yourself

Gather; don't ask. This stage decides Stages 3 to 6, and the user should not see most of it.

**Read the account.** Three numbers drive everything after:

- **Lifetime spend.** Zero means a cold account: no delivery history, wider variance, so prefer
  reliability over sophistication.
- **Which events the tracking receives, and how many.** A 90-day count divided by 13 gives the
  weekly rate that decides the optimization goal.
- **The account timezone.** Every schedule is expressed in it.

**Then choose the optimization goal from those numbers, not from habit:**

| Situation | Goal | How you describe it |
|---|---|---|
| Account produces ~50+ of the target event per week | `OFFSITE_CONVERSIONS` with the event attached | "we'll pay for the signups themselves" |
| Below that, destination has working tracking | `LANDING_PAGE_VIEWS` | "we'll pay for people who actually arrive" |
| Destination has no tracking | `LINK_CLICKS` | "we'll pay for taps, and some of those taps never land — worth fixing before we spend much more" |

An audience needs roughly **50 optimization events a week** to stop guessing. Below that it sits
in the learning phase indefinitely, and patience does not fix it. The bridge is: buy landing
page views for two or three weeks, then move to the real event once volume clears the bar.

**Then size the test honestly**, and say the answer out loud in Stage 4:

| Daily spend | What it honestly buys |
|---|---|
| Under ~$15/day | A plumbing test. Does the ad clear review, does tracking fire, is the click-through rate plausible, does the destination work. Nothing about cost per result. |
| ~$15–20/day | A traffic test. Directional click-through and cost per click. Still not ad-versus-ad. |
| ~$50/day and up | Optimising for the real action becomes viable, if the event volume supports it. |

**Structure follows the budget.** One campaign, one audience, 2–3 ads, at any small budget.
Splitting a small budget across *audiences* starves every one of them; extra *ads inside one
audience* cost nothing, because delivery concentrates on whatever gets traction. Split into a
second audience only when there is a concrete business reason — prospecting versus remarketing,
or separate countries that need separate money.

### Stage 3 — Readiness check before you ask for approval

Check the work before the user is asked to approve it. Run four checks, and report every
problem in the same shape so the user can act on it without learning anything about Meta.

**The findings template.** Every finding, without exception:

> **A one-line name for the problem, in the user's words**
> - **What's wrong:** the specific, observed fact — not a category.
> - **Why it matters:** the consequence in money, time or lost clicks.
> - **Blocks launch:** Yes or No, plus one line of reason.
> - **I can fix this:** exactly what you will do, or *nothing here*.
> - **You need to fix this:** exactly what only the user can do, or *nothing — leave it with me*.

Never merge the last two. "There's a problem with your landing page" tells the user nothing
about whether they need to open a laptop.

**Check 1 — the destination.** Open every candidate page in a browser and look at it. This is
the check most often faked and the failure is invisible: source code, sitemaps and fetched
summaries routinely disagree with what a visitor sees. On the rendered page, confirm it opens,
that redirects land where you expect, that it continues the ad's sentence, that there is one
obvious next action, and that tracking is present and the intended event fires.

> **The ad promises a free trial; the page opens on a pricing table**
> - **What's wrong:** the ad says "start free"; `yoursite.com/pricing` leads with three paid tiers and no free option above the fold.
> - **Why it matters:** people who tap for the free trial bounce. You pay for every one of those taps.
> - **Blocks launch:** Yes — this wastes most of the budget.
> - **I can fix this:** point the ads at `/signup` instead, which opens on the free plan, and rewrite the two headlines to match it.
> - **You need to fix this:** nothing — confirm the switch and I'll do it.

If the destination is weak, recommend specific changes or offer to prepare a better page for
approval. **Never silently send paid traffic to a generic homepage.** A purpose-built page
usually converts several times better, mostly by removing ways to leak out — but don't build one
before a plumbing test, because a tiny budget cannot tell two pages apart.

**Check 2 — the connection.** Confirm with a real call that the account is connected, permitted
to create ads, active, and funded. An authentication status that only proves a token *exists*
proves nothing.

> **Meta can't bill anything yet**
> - **What's wrong:** the ad account is connected and has permission, but has no payment method.
> - **Why it matters:** ads get built and reviewed, then never deliver. It looks like it's running.
> - **Blocks launch:** No for building, Yes for spending.
> - **I can fix this:** nothing — Meta won't accept a card from me.
> - **You need to fix this:** add a card in Meta's billing settings. I'll build and get everything reviewed meanwhile, then check again before we start.

**Check 3 — the identity the ads run under.** Confirm the Facebook Page and the Instagram
account linked to it, because Instagram placements inherit that identity. Show the user the
name they'd recognise, not an id.

> **Your ads would show up under the wrong Instagram handle**
> - **What's wrong:** the Page is "Acme", but the Instagram account linked to it is a dormant personal handle, not @acmehq.
> - **Why it matters:** roughly half the impressions would come from an account with 11 followers and no posts. It reads as spam and hurts click-through.
> - **Blocks launch:** No, but I'd recommend fixing it first.
> - **I can fix this:** run Facebook-only placements today so we're not held up.
> - **You need to fix this:** link @acmehq to the Acme Page in Meta Business settings — about two minutes — and I'll switch Instagram back on.

**Check 4 — the ads themselves.** Confirm every claim traces to a verified source, that text,
logo, imagery and cropping survive every placement the ad will appear in, and that nothing
trips an obvious Meta policy — health and finance claims, personal attributes, before-and-after
imagery, or a special ad category (housing, employment, credit, social issues) that the campaign
has not declared.

> **One ad's text gets cut off on phones**
> - **What's wrong:** the headline on "Ten Ads By Lunch" is 68 characters; in Stories and Reels it truncates to "Ten Ads By…".
> - **Why it matters:** it's the ad's whole argument, and Stories will be a large share of delivery.
> - **Blocks launch:** No, but it wastes that ad's best placement.
> - **I can fix this:** cut the headline to 34 characters — I'll show you the rewrite.
> - **You need to fix this:** nothing — approve the wording.

If nothing is wrong, say so in one line and move on. Do not manufacture findings.

### Stage 4 — Design the test

Before any money moves, say what is being tested and why it is worth testing. This is the
difference between running ads and learning something.

State six things, in plain language:

1. **What is being tested** — the question this money answers. "Does the speed angle beat the
   rejection angle with founders?" is a test. "Launching the campaign" is not.
2. **Why it's worth testing** — what changes depending on the answer. If nothing changes either
   way, test something else.
3. **The single variable between variants** — one difference and one only. Two ads that change
   the image, the headline *and* the audience teach nothing, because a result cannot be traced
   to a cause.
4. **How the budget splits** — and why. Usually even, inside one audience, letting delivery
   concentrate on its own.
5. **Which number decides the winner** — named up front, before there is a result to argue with.
6. **How much evidence is needed first** — a threshold, not a feeling. Something like "each ad
   needs at least 1,000 impressions and 30 landing page views before I'll read the difference,
   which at this budget is about six days".

Then say this plainly, and mean it:

> **I won't call a winner early.** Two days in, the ad that's ahead is usually ahead by chance.
> I'll tell you what I'm seeing, and I'll tell you when there's enough evidence to act on it.

**This test lives before Meta, not inside it.** Two distinct things get confused here:

- **The pre-launch judgement.** Before anything is created, judge each ad *against the audience
  you were given*: would this person stop, or scroll past? Does the copy speak to the stated
  goal? Is it a promise the destination actually keeps? Feed that critique back into the ads and
  re-judge until they earn the spend. This costs nothing, it catches the ads that were never
  going to work, and it runs on every launch.
- **The live test.** Two or three genuinely different angles in one audience, with a named
  winning metric and an evidence threshold, letting real delivery answer the question.

Neither of these is Meta's own A/B test object, and you should not create one. Meta's split test
holds everything else constant and splits the audience, which needs far more budget than most
launches have, and it answers a narrower question than "which angle works". Say so if the user
asks for an A/B test: they almost always mean the thing described above.

### Stage 5 — The launch brief, and the two confirmations

Show a short brief and stop. Nine sections, in this order, all in plain language:

1. **Goal** — what this is trying to produce, and the success metric from Stage 1.
2. **Audience** — who, and where.
3. **Budget** — the total, what it works out to per day, and the fact that it stops itself.
4. **Schedule** — start and end, in the user's own time.
5. **Destination** — the page, and one line on why that page and not another.
6. **What we're counting** — the action being measured and whether tracking for it is confirmed
   working.
7. **The ads** — each one's angle, its headline and text, its call to action.
8. **The test plan** — the six points from Stage 4, compressed to four or five lines.
9. **What I'm unsure about** — assumptions made in place of missing answers, weaknesses
   knowingly accepted, and anything this budget cannot settle. Never leave this section empty
   just because it looks better empty.

**The first confirmation — approve the plan.** The user approves this brief before anything is
created. Preparation, inspection, checking and planning are read-only and authorize nothing. If
the plan changes after approval, it needs checking and approving again.

**Then build, paused.** Create everything in a paused state. Record each id the moment it comes
back, so an interruption or a partial failure is recoverable and a retry never creates a second
copy of anything. Policy review runs on paused objects, so building early starts that clock for
free.

**Then read it back from Meta.** Do not trust the responses from the writes. Fetch each object
and confirm the budget, dates, audience, what's being optimised for, and the destination are
what was approved. Report success only after the readback matches.

**Then show what exists**, in the user's language: "Everything's built and paused. Meta is
reviewing the three ads — normal, usually within a day. Nothing has spent anything."

**The second confirmation — start spending.** This is a separate, explicit, typed confirmation,
never inferred from the first one and never from earlier enthusiasm. Where it is typed depends
on the environment: some hand activation to an approval screen with its own typed confirmation
rather than accepting it in chat. Follow whichever applies, but it is always a second deliberate
act by the user. When chat is the surface, ask for a real word back:

> Reply **START** and I'll set these live. From that point they spend real money — up to $300,
> stopping on the 30th. You can tell me to pause at any time and I'll do it immediately.

**Then confirm live against Meta, not against your own write.** After activating, read the
status back and only then report it. If Meta says anything other than active — still in review,
rejected, or unable to deliver — say that instead, in plain words, with what happens next.

If some of it succeeded and some failed, say exactly that: what exists, what state it is in,
what failed and why, and the one next action. Retry only the failed part, from the recorded
ids, and never recreate what already exists.

### Stage 6 — Stopping must be easy

"Pause this ad" and "stop the campaign" must work from anywhere the user says them, at any time,
without a plan, a brief or a confirmation step. Do it, verify the new status with Meta, and
confirm what happened and what it stops costing.

Pausing costs nothing and is reversible, so it never needs the approval that spending does.

### Stage 7 — Read the result honestly

Judge a run by what its budget could actually answer.

- Did every ad clear review, or was one rejected — and on what policy?
- Do landing page views roughly track taps? A large gap means the page or the tracking drops
  people, and it's the most valuable thing a small run can find.
- Is the click-through rate plausible?
- Did tracked traffic arrive, split correctly per ad?

**Do not report a cost per result from a budget that could not produce one.** That number
outlives every caveat attached to it, and someone will make a decision on it six months later.
Say instead what the run proved — usually that the machinery works — and what the next budget
would need to be to answer the question the user actually asked.

Then close the loop: what changed, what is working, what is wasting money, what needs attention
today, what you recommend next, and whether the previous recommendation was ever acted on.
Every recommendation ends in one clear next action the user can approve or decline.
<!-- shared:launch-journey end -->

---

## Where the two confirmations happen

Stage 5 requires two separate acts by the user: approve the plan, then start the spend. The
surface differs by adapter; the boundary does not.

| | Approve the plan | Start spending |
|---|---|---|
| **GooseWorks adapter** | The approval page returned by `prepare_meta_ad_push`. Chat cannot approve a push. | A separate GooseWorks activation flow with its own typed confirmation. Never activate from chat. |
| **Direct Meta adapter** | Explicit user confirmation of the exact paused plan, immediately before the publish command. | Explicit typed confirmation, immediately before activation. Never manufacture the confirmation phrase from earlier intent. |
| **Planning-only** | N/A — nothing is created. State that plainly, and name the access a later launch needs. | N/A |

Preparation, inspection, validation and planning are read-only and authorize nothing. A plan
that changes after approval must be checked and approved again. A decline, or a missing
confirmation, means **no write**.

Pausing and stopping are the exception in both directions: they cost nothing, they are
reversible, and they never need approval. Stage 6 applies as written.

## Partial failures

Persist every returned id the moment it comes back. On failure, list what failed, every object
already created, its verified status, and the exact next action. Resume from the persisted ids
only after renewed user approval, and never recreate completed steps. A repeated click or a
retry must never produce a second campaign, ad set or ad.

## Final response

End with: the approved configuration in the user's own language, the destination and readiness
result, what Meta now reports, any warnings or partial failures, and the one next human action.

The normal write-mode stopping point is: **built in Meta, paused, spending nothing, waiting on
the user's second confirmation.**
