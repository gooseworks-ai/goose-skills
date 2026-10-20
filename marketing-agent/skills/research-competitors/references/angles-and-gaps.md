# Angles and white space

Load at step 5. Angles are derived from the research — they never drive it.

## Where angles come from

- **Buyer complaints about rivals** (reviews, community) that we can answer — the strongest source.
- **Worn-out phrases** everyone uses (from the messaging table) — the angle is the thing nobody says.
- **Empty seats** on the positioning map that buyers care about.
- **Launches we already do better** — counter-position with proof, our own demo, not their name by default.
- **Founder claims about the category** we can agree with or argue against.
- **Timely openings** — a shutdown, price rise or removed feature gives a time-boxed switch angle.
- **Formats that carry the category** (swipe file) — an angle paired with a proven format.

Each angle row names its source and evidence.

**Own-page test — before an angle ranks.** Do we already deliver this on our own pages (site, pricing, product, help docs)? Read them. If not, the angle's first step is fixing that, said in the move ("see the cost before anything is made" fails while our pricing page doesn't say how many credits a video uses: fix the page first, then run the angle). An angle whose promise our own pages contradict is never the top angle.

## Launches: format brief and counter-position kit (step 4)

- **Format brief, per demo watched:** each beat (hook · setup · reveal · proof · CTA) → what we show in it (our feature or screen, our approved proof line) · length · hook type · channel. Their structure, never their words or footage.
- **Counter-position kit**, only where we already do the job better and can prove it: our side-by-side demo of the same job that week, in the format the market is already sharing; a dated "we've had this since <date>" post; a founder take; search ads on the launch name — only after the `ad-policy-check` skill (`../../ad-policy-check/SKILL.md`) (trademark rules differ by platform and country). Not naming them by default; naming helps a challenger against a leader, rarely the reverse (spec §8).

## An angle is not copy

An angle is a reason to buy aimed at a specific buyer, with what it takes to make it believable. A rival's headline is evidence that a reason to buy is being tested; it is never our output. One angle = one reason to buy. "Stops the scratching", "stops the scratching in two weeks" and "itch-free dog" are one angle with three hooks.

## Angle row (required fields)

| Field | What goes in it |
|---|---|
| `id` · `slug` | `A-NN`, stable forever — the key the makers tag ads with (lower-case: `angle:a-07`) and analyze-performance cites; plus a short slug as a human label. Never renumber; retire with a reason. |
| name | Short, buyer-language |
| reason to buy | One sentence: what the buyer gets |
| segment · awareness | research-market segment id (S1…), or "no segment file"; and Schwartz level |
| emotional driver | relief, trust, belonging, status, control, pride… |
| objection it answers | in buyer words, with a quote id or a linked review |
| product(s) | product id and name from `brand_read` |
| offer | an offer the brand actually runs, or "none — feature no offer" (never invent one) |
| market evidence | what in the research shows it: rival ads (variants, days running, links), posts, launch demos, review quotes, community threads |
| saturation | k of n rivals lead with it |
| buyer evidence | voice-of-customer quote ids, **or** review and community quotes collected this run (link and date), and the theme's count — "no buyer evidence yet" only when neither exists |
| proof wording | the exact claim text the claims gate (the `claims-gate` skill, `../../claims-gate/SKILL.md`) allows — the brand's "Claims you may use" facts once signed off (or a line approved in the gate's scoped sign-off); before that, plain product facts only |
| proof gap | what we would need and do not have — excluded until the proof exists and the line is approved through the claims gate |
| status | **briefable** (proof wording exists) · **needs proof** · **do not use** (with reason: off-brand, a rival's trademark claim, regulated) |
| formats | the formats that suit it |
| reference formats | 1–3 swipe-file items for structure only (links, or template / media ids) — format, never words |
| hook directions | 2–3 hook types — directions, not finished lines |
| how we differ | what our execution does that theirs does not |
| guardrails | never reuse their claim, visual, slogan or name; comparative only with the human's yes and proof; personal-attribute rule below |
| test status | untested / testing / won / lost / mixed — with dates, refreshed by this playbook from analyze-performance's latest report and learnings citing the `A-NN`, ads tagged `angle:a-nn` (queried lower-case), and videos whose names carry it |

**Personal-attribute and regulated categories** (health and conditions, skin conditions, weight, mental health, finances, and similar): no hook may say or imply the viewer has the condition ("Your itchy skin…", "Your ADHD brain…") — write about the product or a situation instead. Any wording about treating, curing, managing or improving a condition is "do not use (regulated)" unless it is an approved claim.

## The white-space matrix

Rows: every reason to buy found in rivals' ads and pages, plus every established theme in the voice-of-customer bank — or in this run's review and community quotes — that no rival addresses. Columns: each rival (cell = leads with it / mentions it / absent, with the longest run length in days), then **buyer weight** (the theme's quote count and share of quotes read), then **our proof** (yes / partial / none).

Classify each row:
- **Gap** — buyer weight is real, no rival leads with it, we have or can get proof, and our own pages pass the own-page test above (or the first step is fixing them). These become the top angles.
- **Unvalidated** — unclaimed and no buyer evidence. It may be unclaimed because it does not sell. Brief only as a small test, said so. Without a voice-of-customer bank, this run's reviews and community threads (rivals' buyers describing what they want) are the buyer evidence; a row with neither is unvalidated.
- **Contested** — several rivals lead with it and it runs long. Proven demand; we need a sharper execution, a different segment, or a better proof, not the same message.
- **Table stakes** — everyone says it (a category convention). Must be present somewhere; never the lead.

A gap claimed with no buyer evidence is an invented gap. Do not report it as white space.

## Frameworks

Use: the matrix above, a positioning map when it helps (in "How they compare" — axes taken from the evidence, for example price × "self-serve vs sales-led", never invented), the offer-architecture table, awareness levels on every hook, the hook taxonomy in `reading-ads-honestly.md`, a format line per rival. Skip: SWOT, Porter's five forces (market size is research-market's job), estimated share of voice or traffic (an ad-count ratio across the set, from full-library reads, is the only honest proxy, and say it is one).

## What a senior rejects

Angles that are reworded rival copy; any claim not on the approved list; "ran longest so it works" without caveats; spend or ROAS talk; undated facts; dead links; generic angles ("social proof"); ten angles that are one reason to buy; gaps without buyer evidence; ads read from the wrong Meta page; a hook that tells the viewer they have a condition.
