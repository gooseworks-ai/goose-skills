---
name: research-market
description: >-
  Use when a founder or marketer asks for market research: "do the market research for <brand>", "how big is my market", "is my category growing", "what's changing in my market", "who actually buys this, and what do they say in their own words?", "who is my customer", "how do people buy in my category", "what do others charge", "what are people saying about me and my category", "who's talking about us", "what's trending in my category", "voice of customer". Delivers a readable market report: the category and its size and growth, what's changing, how and where buyers find and buy, pricing norms, the channels that hold attention, demand and seasonality, who buys and why in their own words, what people are saying right now (mentions, trends, risks), and the competition in brief — each finding ending in what it means for you. Researches first, asks only decisions at the end. Not for a deep look at rivals — use research-competitors; not for a list of people to pitch — use research-audience.
---

# research-market

Market research tells the founder what market they are in and what to do about it: how big it is and where it's going, how buyers find and buy, what they pay and say, and what people are saying right now. It is about **the market**; rivals get one short section that points to competitor research. The craft is in `references/` and the worker briefs in `atoms/` — both folders sit next to this file.

**The rule that matters most: free pass first, ask nothing, report once** (AGENTS §8 research pattern). Do every dimension before the first message to the founder; never stop to ask "go deeper?"; never ask the founder to copy what you can read yourself. A broad ask gets everything. An ask that names an area — **the market** (size, change, buying, pricing, channels, demand) · **the buyers** (segments and their words) · **what people are saying** — gets that area covered completely, with news first.

## Before you start

1. **Connection and brand.** Use the GooseWorks server the project says to use (a test folder's README may name staging). No GooseWorks tools listed (after one `gooseworks:tools_load`) → say only: "Connect GooseWorks first — I research your market and save what I find through it." First call: `gooseworks:get_started` with the marketer's words (`wants: "more"`); send `client` on every call that takes it; if it shows a menu unrelated to research, don't show it — carry on. The named brand isn't in the account → create it from its website (`gooseworks:brand_setup`) without asking, and wait for its research (`gooseworks:job_get`) up to a few minutes. Several matches → list and ask (the one question allowed before research). Keep `brand_id`, `brand_slug`, `coworker_agent_id`.
2. **Read the brain.** `gooseworks:brand_read` (`summary`, `kit`, `products`, `competitors`, `learnings`, `sources`, `organic`, `accounts`), `gooseworks:knowledge_search` (`["evidence", "document"]`), `gooseworks:competitor_read`; workspace (`gooseworks:file_list`, `file_read`): `research/market/` (a last report means "what changed"), `research/competitors/`, `research/credits-log/`. Brand facts come from the brain first, the website second — where they differ (two prices, two audiences), the report says so and uses neither as a claim. The founder's stated belief about the buyer is the audience field, quoted. Claims: only the read step of `../../atoms/claims-gate/ATOM.md` now. With an empty brain after the brand's research, "For you" lines say "I can't tell what fits you yet" and the report offers to learn the brand first.
3. **Do not ask the founder anything yet** (one-line status notes are fine), and never change the host's settings or permissions.

## Steps

1. **Frame.** Company type, products, markets, the area asked, first run or "what changed since <date>".

2. **News first.** Web-search the last 90 days for the brand and the category: launches, funding, shutdowns, acquisitions, regulation, platform changes, price moves.

3. **Brief the workers.** Read each worker brief yourself and paste its full text into the worker's instructions, with the brand facts, `brand_id` and the window — never a summary of it. One subagent each where the host has them (a cheaper model is fine for this reading work), otherwise one after another:
   - `atoms/market-pass/ATOM.md` — the category, size and growth, what's changing, how and where buyers buy, pricing norms, channels, demand.
   - `atoms/buyer-voice/ATOM.md` — three corpora: own customers, the 3–5 closest rivals' customers, the category.
   - `atoms/listening/ATOM.md` — what people are saying about the brand and category in the window.
   Workers use web search and page fetch and return everything they read — rows, quotes, couldn't-read lists. Keep each worker's output as it returns. An item marked "tell the founder now" goes to chat at once (`references/listening-craft.md` § Risk). Edge cases — no browser, a stalled or stopped worker, facts from earlier research, a bad rival on the list, a report already saved today, a late read — follow `atoms/edge-cases/ATOM.md`.

4. **Open what needs the browser yourself.** The pages workers list under "Needs the browser" (script-only pages, review pages that block fetch), one site at a time. Before the first, tell the founder in one line what you're opening and that the browser may ask them to allow each site. If a step waits on their approval, don't sit silent — say so, move on with what you have, and list the page as couldn't-read.

5. **Write the story.** Merge the workers' returns. Themes and segments from the buyer-voice rows (`references/mining-method.md`): 2–4 segments ranked, the primary one with its job and what to lead with; call it a cold start only when the evidence floor in `references/recognition-and-interviews.md` isn't met. Then, every finding closes with **For you** — does it fit us, from our facts; if yes, what to make or do, the approved claim behind it (or "needs your sign-off", or "you'd need proof of X first"), and who does it. Add **You vs them**: how buyers see us against the alternatives. Weigh what buyers say over what rivals do. Facts-only asks skip "For you". Check every number, date and quote in the report against what a worker returned; drop what you can't trace.

6. **Deliver it.** Write the report through `../../atoms/write-report/ATOM.md`, in the shape of `references/report-format.md`: local file `gooseworks-reports/<brand-slug>/<YYYY-MM-DD>-market-research.md` with a clickable link and an offer to open it (an artifact in hosted chat), and the brand copy `research/market/<YYYY-MM-DD>-read.md` through `../../atoms/save-to-brain/ATOM.md` (`keep-history`) with its link (`gooseworks:file_url`). Also save `voc-bank.md`, `personas.md`, `demand.md`, `watchlist.md` (`supersede`) and `voc-bank.jsonl` (`import: no`); outliers to the inspiration library (`references/listening-craft.md`).

7. **One message: the draft and the decisions** (write-report §2 — three lines of summary, then the numbered decisions): the one thing to do first, the link, and at most five numbered decisions — is this your buyer (and what didn't you know)? · private material that would change the answer, named specifically · sign-off for the claims the top moves need · a paid top-up only for what the free pass and the browser couldn't read (one yes to "up to N credits", `../../atoms/spend-gate/ATOM.md` branch B — with no price history the founder names N) · **a repeat, only if it would help this brand** — judge it (a moving category, an active conversation, a launch coming: yes; a settled niche or a one-off question: no) and, if yes, give the reason and a cadence (monthly by default; weekly for "what people are saying" during a launch or a risk); each repeat is a new report that opens with what changed (`gooseworks:automation_upsert`, created paused, spend-gate branch C). Optional, one line each: rivals buyers named to track (`gooseworks:competitor_save`), rules to keep (`../../atoms/save-learning/ATOM.md`, on the founder's words, `[market YYYY-MM-DD]`), the audience summary proposed to the brand (`gooseworks:brand_update` `agent_proposal`; never while segments are provisional). Never ask for free work again, and never a fact the free pass could find.

## Approval gates

- The free pass needs no yes; a paid top-up needs one yes to a ceiling; schedules are created paused.
- Rivals tracked, rules and the audience summary only on the founder's yes. Research recommends; it never makes the asset.
- Never contact a customer, reviewer, poster or community; never reply, post or report anything. A quote is buyer language, never a claim.

## Output and write-back

| Artifact | Where it lives | Who reads it next |
|---|---|---|
| Market report | local `gooseworks-reports/<brand-slug>/<D>-market-research.md` + `research/market/<D>-read.md` + document (keep-history) | the founder; plan-campaign; analyze-performance and run-organic-social ("What people are saying"); the next run |
| Segments | `research/market/personas.md` + document (supersede) | plan-campaign, work-with-creators, make-content, run-organic-social |
| Voice-of-customer bank | `research/market/voc-bank.md` + document (supersede); `voc-bank.jsonl` (not imported) | make-static-ads, make-video-ads, make-content, run-organic-social, research-competitors, plan-campaign |
| Demand read | `research/market/demand.md` + document (supersede) | plan-campaign |
| Listening watchlist | `research/market/watchlist.md` + document (supersede) | the next run |
| Outlier posts | inspiration library (tag `research-market`) | the ad and content makers, work-with-creators, run-organic-social |

## Done when

- No question before the report (beyond picking the brand); news ran first; every dimension of the asked area was covered, browser-only pages included, with a couldn't-read list.
- The report passes write-report §3: the top five lines say what to do and why, a non-marketer can follow it, no ids, paths, tool names or jargon, and the link opens.
- It is about the market — size and growth, change, buying, pricing, channels, demand, buyers and their words, what people are saying — with rivals in one short section; every finding ends with "For you" (unless facts-only); a serious risk reached the founder at once.
- It was saved to the brand and opens locally; the closing message held only decisions, and a repeat was offered only with a reason it would help.

## Out of scope

Deep rival profiles, ads and pricing teardowns (research-competitors) · reply drafts (not covered yet — BACKLOG) · writing positioning (write-my-positioning, backlog) · prospect lists (research-audience) · channels and budgets (plan-campaign).
