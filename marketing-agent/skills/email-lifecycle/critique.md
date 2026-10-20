# email-lifecycle — critique log

Every round: the finding, the fix, or why it was rejected. Critics are subagents; none read old skills.

## Round 1 — scope critic (before writing, effort high)

Input: spec 13, page 00 Part 1 + pillars 7/21/22 + Parts 3–4, page 01 pillars 7/21/22, decisions D1–D5.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | No business-model routing: cart/browse/post-purchase are DTC-only; a clinic, SaaS or newsletter gets wrong flows | Fixed: intake asks business model + revenue event (never inferred); `references/flow-library.md` §1 first-three-flows table for 11 business types incl. "wrong here"; SKILL step 2 |
| 2 | MAJOR | Flow library incomplete and self-contradicting (asks replenishment cycles, writes no replenishment; gates sunset, no re-engagement flow); missing back-in-stock, price drop, dunning, cancel-save, renewal notice, VIP, birthday, B2B activation/trial/demo/no-show/closed-lost, app onboarding, local reminders/recall, NPS | Fixed: full library in `flow-library.md` §2; a run builds only a ranked subset; flows needing a missing programme are listed "needs X first" |
| 3 | MAJOR | "Loadable without edits" undefined; each tool differs | Fixed: `references/loadable-flow-format.md` (flow header + per-message fields + tool vocabulary table for Klaviyo, Mailchimp, Customer.io, Braze, HubSpot, Attentive/Postscript, OneSignal); intake asks tool + plan tier |
| 4 | MAJOR | Nothing stops flow/broadcast collisions | Fixed: priority map, global cap, suppressions in step 3 + `segments-cadence-offers.md`; send-check verifies |
| 5 | MAJOR | Deliverability is a slogan | Fixed: `references/deliverability.md` checklist with verified / from-you / unknown on every item; "no green the agent did not see" in What you get and Done when |
| 6 | MAJOR | SMS/WhatsApp compliance one line | Fixed: `references/sms-push-whatsapp.md` (TCPA consent, 10DLC, STOP, quiet hours incl. FL/OK, carrier bans, CASL/GDPR/India DLT); market asked at intake; WhatsApp named as later phase |
| 7 | MAJOR | No recurring mode | Fixed: build / weekly / monthly / seasonal modes in `references/modes-and-incidents.md` (P1 named stages); weekly offered as a recurring run on the human's yes (P2) |
| 8 | MAJOR | No incident mode | Fixed: incident table (stock-out, complaint spike, send mistake, leaked code, outage, suspension, privacy request) with "pause now" first and high-stakes gate |
| 9 | MAJOR | Measurement not designed | Fixed: every flow ships goal metric (never opens), holdout, one test (step 9, loadable format) |
| 10 | MAJOR | Done-when only tests a store | Fixed: "top two flows for their business type" + "no unverified greens" |
| 11 | MINOR | "No discount deeper than standing offer" over-generalised | Fixed: offer ladder (welcome ≤ standing; first cart reminder never; returning full-price never; no code twice in 30 days); deeper steps need an approved ladder |
| 12 | MINOR | Referral/review flows assume programmes exist; review gating illegal | Fixed: "needs X first"; review requests to every customer (Google policy, FTC 2024 rule) |
| 13 | MINOR | Promo calendar has two owners | Fixed: plan-campaign owns campaign moments; this playbook owns the send calendar and fills around them (Out of scope + broadcast-planner) |
| 14 | MINOR | Newsletter is an afterthought | Fixed: newsletter in library; format/cadence/staging here, long-form items from make-content |
| 15 | MINOR | Design assets ignored | Fixed: template asked at intake; image needs as request lines for make-static-ads (spec 08 accepts email headers) |
| 16 | MINOR | Transactional emails missing | Accepted as later-run upgrade, named in Out of scope (keeps first run readable) |
| 17 | MINOR | Boundaries need one line each (popup promise, rep-sent vs automated, PQL routing, in-product changes, DM/chatbots, push priming) | Fixed in Out of scope, flow-library B2B section and sms-push-whatsapp |
| 18 | MINOR | "What competitors are sending" has no source | Fixed: monthly mode uses examples the human forwards; server-needs §6 asks for a seeded inbox; never guessed |
| 19 | MINOR | Missing gates (bought list, dormant list, whole-list SMS, regulated claims, migrations) | Fixed: hard stops in Before you start; gates list |
| 20 | MINOR | Marketplace-sourced buyers must not be imported | Fixed: intake question + hard stop |
| — | Phasing | Spec's full scope (~30+ messages) won't be read, so won't load unedited | Fixed: first run = audit + segments + cadence + top three flows (~12–15 messages); later runs add the rest |

## Round 1 — depth critic (before writing, effort high)

Delivered: a fully worked welcome and abandoned-checkout flow, the loadable field list, timing table, benchmarks with sources, the senior checklist, margin math, cadence, segments, RFM, sunset, deliverability triage, the AI-copy failure list.

| Finding | Resolution |
|---|---|
| Quality bar must be shown, not described | `references/worked-flows.md` (store welcome, checkout; added a B2B trial-ending and a local booking reminder so non-store types have a bar too) |
| Loadable field list | `references/loadable-flow-format.md` |
| Timing per flow and what shifts it | `references/flow-library.md` §2 |
| Benchmarks, honestly labelled | `references/benchmarks.md` (source + date per row; unverified ranges labelled practitioner consensus, per the critic's own caveat) |
| Senior checklist | `atoms/send-check` |
| Offer margin math | `atoms/offer-math` + `segments-cadence-offers.md` (worked example) |
| Opens unreliable after Apple MPP | segments on clicks/orders; A/B winners never on opens (several files) |
| Gmail/Yahoo 2024 + Microsoft 2025 sender rules; FCC STOP rule 2025; revoke-all delayed to 2027 | `deliverability.md`, `sms-push-whatsapp.md` (with "verify current" notes) |
| Failure modes of AI email | `references/copy-craft.md` failure list, run by send-check |

## Overlaps to note for the consolidation pass
- `send-check`'s claims check overlaps make-content's `claims-check` atom and the claims checks in the ad playbooks.
- `offer-math` overlaps plan-campaign's `references/unit-economics.md` (contribution margin math).
- `broadcast-planner` and run-organic-social's calendar share a calendar shape.

## Round 2 — adversarial run (after writing, effort high)

Three brands (DTC skincare on Klaviyo, US+CA; just-launched PLG SaaS on HubSpot free; pre-revenue iOS app on OneSignal), with a shell and in hosted chat.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | "Unknown" authentication had no rule; RED blocked the flows asked for; hosted chat would stall | Fixed: only missing consent or complaints ≥ 0.3% stop writing; red/unknown auth blocks switching on and broadcasts, not drafting ("switch on after fix #N"); bulk-sender rules gated at ≈ 5,000/day (SKILL step 1, lifecycle-audit, deliverability) |
| 2 | MAJOR | Intake ~21 asks; half never scheduled → placeholders → done-when fails by design | Fixed: two messages (≤ 8, then ≤ 6 only for chosen flows, prefilled from the site's policy pages "from your site — confirm"); flows with open placeholders staged "not ready: answer Qn" |
| 3 | MAJOR | No pre-launch / waitlist type | Fixed: row in flow-library §1 (re-confirm + launch sequence, launch-day activation, founder note); old waitlist = dormant list |
| 4 | MAJOR | Plan limits not encoded (HubSpot free has no workflows; OneSignal row "per tool") | Fixed: "plan reality" column; step 2 says so first and proposes the cheapest route as a tool decision; OneSignal row filled |
| 5 | MAJOR | "Never guess event names" left new products with all-placeholder flows | Fixed: tracking-plan proposal ("proposed — confirm with engineering"); flows written against those names |
| 6 | MAJOR | Worked example used invalid Klaviyo syntax; C3 condition unbuildable | Fixed: `{% coupon_code %}`, `{% today … delta_days=7 %}`, W4 plain "two days left", C3 rebuilt on sign-up date; "real syntax only" rule in loadable-flow-format |
| 7 | MAJOR | Canada / CASL and multi-currency not handled | Fixed: CASL email rules in deliverability; consent per market in the flow header; send-check checks it; multi-currency rule in copy-craft |
| 8 | MAJOR | Run scope self-contradicting; 7–10k words in chat | Fixed: flows asked for, else top two (third offered); chat shows one flow in full, rest in files; calendar is one table |
| 9 | MAJOR | Incident mode blocked by intake; agent might pause flows via a connector | Fixed: incident skips intake/audit; first reply is click-by-click pause steps; agent never changes status, even to pause (gate + modes) |
| 10 | MAJOR | Recurring weekly run had no tool and would stall unattended | Fixed: `gooseworks:automation_upsert` agent job created paused; stock "confirm", asks for export, skips refresh without one |
| 11–21 | MINOR | brand choice; claims wording; standing-offer home; regulated flag scope; in-app scope; subscription offer math; standing offer store-only; backfill when "needs X first"; shared popup code; footer tag; monthly data source; weekly refresh vs own benchmark | All fixed in SKILL / intake / flow-library / offer-math / send-check / modes / loadable-flow-format |
| 22 | MINOR | tests file missing | Already written (staging run) |

Rule-10 verdict from the critic: store build mode is a real playbook; B2B/app paths, weekly/monthly and incident were guide-grade → fixed by 3, 4, 5, 9, 10, 21.

## Round 2 — contract check (after writing, effort high)

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | `tools_load` never mentioned; file/campaign/automation tools may be unloaded | Fixed: Before you start 1 + `needs` |
| 2 | MAJOR | No concrete way to tell signed-off claims | Fixed: learn-my-brand's interim contract (sign-off `must` fact → Brand record Approved claims table; without it plain product facts) in SKILL, send-check; server-needs §6 |
| 3 | MINOR | Recurring run names no tool | Fixed (`automation_upsert`) |
| 4 | MINOR | server-needs step numbers wrong | Fixed |
| 5 | MAJOR | Review-request brief from improve-search-visibility never read | Fixed: Before you start 3 reads `search/fixes/` "For email-lifecycle"; meta reads |
| 6 | MINOR | analyze-performance / plan-campaign don't actually read program sheet / calendar | Fixed: readers changed to the next run + the human ("may read"); program sheet also imported into brand knowledge so any playbook finds it by search. Flag for orchestrator: those siblings could add the reads |
| 7 | MINOR | Header-art line missing make-static-ads' fields | Fixed: exact line format in step 4 |
| 8 | MINOR | Newsletter claimed by both playbooks | Fixed: make-content writes the issue (`content/newsletter/<date>.md`); this playbook owns cadence, segment, send time, staging |
| 9 | MINOR | Standing offer write could overwrite learn-my-brand's product `offers` | Fixed: store-wide offer → learning; product offers appended after reading |
| 10 | MINOR | campaign_read underspecified | Fixed: list, then read active campaigns in full |

## Round 3 — final critic, adversarial + contract (effort xhigh)

Verified as passing: §5 order; description 1,333 chars; no vendor keys; brain first; clean stop; nothing sent; all tools exist and are used per their descriptions (incl. media_upload from a workspace file + knowledge_import); every read has a writer, every write a reader (plan-campaign reads the calendar; make-static-ads' graphic-request reads the header-art lines).

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | SPF/DKIM marked green from the root-domain DNS record (the staging run did exactly this); email tools send from their own return-path | Fixed: green only from a marketing test email's headers showing aligned passes; root record = "present — not verified for marketing mail"; unknown Gmail share above ~5,000 = bulk; staging test row corrected |
| 2 | MAJOR | Flows written against missing events or an unsupported plan had no status (could be staged "ready") and flow-library contradicted the SKILL | Fixed: statuses `not ready: needs events E1–E3 live` / `needs tool decision T1`; flow-library §3 aligned; done-when = top two *buildable today*, blocked flows carry their exact blocker |
| 3 | MAJOR | Audit inputs never asked; the audit would add a third ask | Fixed: intake message 1 item 6 bundles the flows list, 90-day report, list size, one test email's headers, Postmaster chart; lifecycle-audit asks nothing separately |
| 4 | MAJOR | "Every flow carries a holdout" would hold back renewal notices, reminders, dunning and a launch | Fixed: holdout only on always-on marketing flows with readable volume; "no holdout — <reason>" otherwise (SKILL, format, send-check) |
| 5 | MINOR | Learnings read lean | Fixed (`detail: "full"`) |
| 6 | MINOR | Learnings writes refused without user_correction; offers 280-char cap | Fixed (every brain write user_correction + the human's words; length check) |
| 7 | MINOR | Knowledge import has no confirm step; no record of the old asset | Fixed: `job_get` until ready, asset id recorded in program.md, old asset removed only after the new import is ready; `media`/`jobs` groups in tools_load; server-needs §7 verification note |
| 8 | MINOR | Weekly automation under-specified | Fixed: agent job, not enabled, time zone asked, self-contained prompt with the export request at the top of the file, credit use stated |
| 9 | MINOR | No get_started call | Fixed (Before you start 1, needs) |
| 10 | MINOR | flow-writer printed every flow in chat | Fixed ("chat follows SKILL step 8") |
| 11 | MINOR | Mode picked too late for incidents | Fixed (mode is Before you start 2; incident pause list before anything else) |
| 12 | MINOR | "Send message 2 and continue" writes placeholder flows | Fixed (wait for answers unless told to go ahead) |
| 13 | MINOR | Header-art request could block "ready" | Fixed (template header by default; request never blocks) |
| 14 | MINOR | Klaviyo list triggers take no trigger filters; no native weekly cap; welcome breaks its own cap | Fixed in the format header (flow filter/split; "Received Email ≥ 3 in 7 days" filter; first week exempt) |
| 15 | MINOR | No shared-code variant | Fixed (worked-flows: no deadline email, C3 without urgency, leakage proposal) |
| 16 | MINOR | Store-platform automations missed (duplicates) | Fixed (audit lists Shopify / review-app emails; build order switches them off) |
| 17 | MINOR | Consistency nits (dormancy threshold, red vs unknown, claim wording, test step 1, "most per send", plan-campaign reads) | Fixed |
| 18 | MINOR | Files hard to reach in hosted chat | Fixed (`file_url` download link or print on request) |
| 19 | MINOR | HubSpot free send cap; custom-events tier | Fixed (plan-reality row; "verify the current tier") |

## Round 4 — confirmation critic (effort xhigh)

Round-3 fixes #2 (statuses), #3 (audit inputs in intake) and #4 (holdouts) verified consistent; #1 half right. Three MAJORs, all refinements of round-3 fixes:

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | SPF-alignment rule makes a permanent red on Mailchimp/HubSpot (return-path can't align); a personal email's headers could be pasted and recreate a false green | Fixed: green = `spf=pass` (tool's return-path fine, alignment noted, not a fix item), `dkim=pass` aligned (relaxed), `dmarc=pass`; headers must come through the email tool, else unknown (deliverability, SKILL step 1, lifecycle-audit) |
| 2 | MAJOR | Welcome holdout would withhold the promised code from 10% of sign-ups | Fixed: a holdout never withholds what the form or a transaction promised; split after the delivering message (SKILL step 9, format, worked flow A) |
| 3 | MAJOR | HubSpot free + 600 waitlist could end with nothing buildable and no done-when outcome; the send-count note ignored exits | Fixed: count sends after exits; on plans without automation, sequences as scheduled broadcasts with exclusion lists + the form autoresponder count as buildable; fewer than two buildable → said first, ready flows + written tool decision meet the done-when |
| 4 | MINOR | Description and Build mode still implied holdouts on every flow | Fixed |
| 5 | MINOR | "switch on after fix #N" missing from statuses | Fixed (flow-writer) |
| 6 | MINOR | `{{day}}` and `/discount/{{code}}` not real Klaviyo syntax | Fixed |
| 7 | MINOR | "buildable today" not everywhere; blocked asked-for flow unclear | Fixed (What you get, modes, step 2) |
| 8 | MINOR | Staging row showed the old ask | Fixed |
| 9 | MINOR | get_started under-specified for hosted chat | Fixed (`request`, `wants: "more"`, `client`; carry on for a set-up brand) |
| 10 | MINOR | Shared-code C3 kept a 7-day window | Fixed |
| 11 | MINOR | Header instructions Gmail-only | Fixed (Outlook, Apple Mail) |

## Round 5 — confirmation critic (effort xhigh)

Round-4 fix 1 (authentication) and fix 2 (holdout placement) verified correct and consistent. One MAJOR: fix 3 not carried through.

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | Plan-reality sentences in SKILL step 2, flow-writer and flow-library still sent no-workflow plans to "tool-neutral, tool decision", so HubSpot free / OneSignal free ended with zero ready flows; exclusion lists need the conversion in the tool | Fixed in all three places: fixed-date sequences as scheduled broadcasts with exclusion lists are written in the tool's terms and can be ready; the exclusion's conversion goes to the tracking plan if missing (`not ready: needs events E1`); only flows needing per-person triggers/product events become tool decisions |
| 2 | MINOR | send-check didn't check holdout placement | Fixed |
| 3 | MINOR | "Fewer than two buildable" stated once; flow-library contradicted it; scope across the whole flow set | Fixed (tests, flow-library, SKILL step 2) |
| 4 | MINOR | Test send may lack List-Unsubscribe; header rule in one place only; relaxed alignment wording | Fixed (real campaign headers first; missing on a test send → unknown; rule copied to deliverability; "relaxed: a subdomain counts") |
| 5 | MINOR (verify) | Klaviyo re-renders a new unique code per message tag | Fixed defensively: W4 and C3 point back to W1's code and link to the product/checkout; "verify in the tool" note |

## Round 6 — confirmation critic (effort xhigh)

Round-5 plan-reality fix verified consistent in SKILL, flow-writer, flow-library §1, loadable-flow-format, modes, tests; Klaviyo coupon point-back verified. Two one-line MAJORs:

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | flow-library §3 still said a missing exclusion conversion means "needs X first, not written" (would skip the pre-launch launch sequence) | Fixed: missing exclusion conversion → tracking plan, written as `not ready: needs events E1` (or a launch-link click stands in); "needs X first" only for missing offer, split data or programme |
| 2 | MAJOR | W4 quoted W1's subject, which is A/B tested — half the list never saw it | Fixed: "the one we sent the day you signed up"; rule "never quote an earlier message's subject" |
| 3 | MINOR | OneSignal row had no free-plan route | Fixed |
| 4 | MINOR | Click proxy for launch reminders; re-confirm needlessly held | Fixed (SKILL step 2, flow-library pre-launch row) |
| 5 | MINOR | Pre-launch intake missed whether sign-ups/installs reach the tool | Fixed |
| 6 | MINOR | Monthly send limit and dynamic exclusion lists never checked | Fixed (broadcast-planner totals sends vs plan limit; send-check checks active exclusion lists) |
| 7 | MINOR | Done-when fallback named only the tool decision; "offered" vs "written" | Fixed (every blocked flow written with its blocker — T1 or E1; next buildable flow written) |

## Round 7 — confirmation critic (effort xhigh) — **no MAJOR findings**

Round-6 fixes verified correct and consistent across SKILL, flow-library, flow-writer, loadable-flow-format, intake and tests; all three walks pass (Klaviyo DTC US+CA shared code; HubSpot-free PLG asking for trial onboarding; pre-revenue iOS app on OneSignal free).

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MINOR | W4 primary subject "[Sunday]" differs per recipient | Fixed: "2 days left on your 10%" primary; date tag as an alternate with a check note |
| 2 | MINOR | Shared-code variant left W1's unique-coupon tag and expiry | Fixed |
| 3 | MINOR | Missing split data could cancel a whole flow | Fixed: write the default branch, note the split; "needs X first" only when the flow can't run at all |
| 4 | MINOR | Whole launch sequence marked not-ready when only reminders need the exclusion | Fixed: announce and re-confirm ready on their own |
| 5 | MINOR | OneSignal tag exclusion needs an identity link (relay addresses never match) | Fixed (format row; tracking-plan item includes it) |

**Loop status: the last round found nothing major. Done for this playbook.**

## Round 8 — cross-set review fix pass (16 Oct) + adversarial/contract critic (effort high)

Inputs: AGENTS.md §3/§5/§8 changes and `reviews/2026-10-16-{contracts,coverage,depth,routing}.md`.

| Review finding | Resolution |
|---|---|
| Contracts F3 (MAJOR) — claims read from Brand-record search snippets, marker status never checked | Replaced with the shared `atoms/claims-gate`: contract read up front (marker must say `signed-off`; "Claims you may use" facts), scoped sign-off inside intake message 2, gate checks and cuts at step 7. send-check no longer judges claims |
| Contracts F2 / M4 — learnings flood the engines' 8 newest facts | One shared `save-learning` call per run, only standing offer, policies and cross-playbook rules; cadence, sunset and discount depth stay in `lifecycle/program.md` |
| Contracts M5 — standing offer in two homes | Read from learn-my-brand's `Standing offer:` fact; a human-stated offer is written in that shape, replaced only on "replace it"; product `offers` appended only under 280 chars |
| Contracts M3 — "lean misses the marker" is false | Lean read used |
| Contracts M7 — `Graphic ready:` never read back | flow-writer reads its answers on re-run |
| Contracts M11 / §3.5 — unpriced automations; imports assumed free; untitled document | Weekly automation under spend-gate's automation rule (no paid data); program sheet saved via shared `save-to-brain` ("Lifecycle program", supersede, stops on any price) |
| Contracts M13 — invalid `jobs` group | Removed |
| Contracts M14 / F6 — connection trigger, no-coworker fallback | §8 trigger and sentence; `brands/<slug>/` fallback |
| Contracts M12 — get_started `wants` | `wants: "more"` |
| Routing C13 / C8 / C9 / R3 | Description ≤ 1,024 (995) in `>-` form with "Not for cold outreach…", newsletter → make-content, whole Black Friday plan → plan-campaign |
| Routing U3 — E/T ids shown to the marketer | Blockers in words in chat; ids in files always paired with words; claim wording not ids |
| Routing U6 — technical asks | Headers and spam-rate chart as optional click-by-click steps |
| Depth — SKILL bloat, step 2 edge cases | Moved to `references/flow-library.md` §4 "Buildable today"; SKILL 3.4k → 2.7k words |
| Depth §8 — loops don't close | Each flow saves a hypothesis + target; step 1 reads results back (weekly read's email rows or the export) and reweights the ranking and refresh |
| Depth §5 — asks the revenue event the brand type implies | Asked only if the type or a campaign brief doesn't settle it |
| Coverage m1 — no brand incident row | Added (pause promos and the product's flows; holding note for the human's read) |
| Coverage m7 — WhatsApp trigger | Report's first line flags WhatsApp when the list's main market is chat-first |
| AGENTS §3 — atoms as SKILL.md | Renamed to `ATOM.md` |

Critic findings after the pass (all fixed):

| # | Sev | Finding | Resolution |
|---|---|---|---|
| 1 | MAJOR | Scoped sign-off had no slot (would be a third message after writing) | Contract read only up front; sign-off block rides in intake message 2; gate checks/cuts at step 7; tests updated |
| 2 | MAJOR | Human-confirmed policies were stored only in program.md, so the gate cut "30-day returns" | Policies written as learn-my-brand `Policy:` facts at step 9; send-check matches them |
| 3 | MINOR | Learnings written from three places; cadence/sunset as facts | One call at step 9; those stay in program.md |
| 4 | MINOR | New standing offer couldn't retire the old one | Read first; same → skip; different → replace only on "replace it" |
| 5 | MINOR | Stray standing-offer homes (flow-writer, offer-math, server-needs) | Fixed |
| 6 | MINOR | Dangling "format SKILL step 4 gives" | Inlined the request-line format |
| 7 | MINOR | Voice card could trigger paid reads or an interview | Read only; none → brand voice and an offer to build it later |
| 8 | MINOR | Ids reach the marketer via files and claim ids | Ids paired with words; claim wording; download-link expiry stated |
| 9 | MINOR | Incident pause list delayed by get_started card | Pause list in the first reply, before any tool call |
| 10 | MINOR | Meta needs/writes incomplete | Added atom tools; sign-off and policy writes |
| 11 | MINOR | critique/test logs stale | This round; staging claims row redone as a marker read |

Open: analyze-performance's email rows are "light", so the per-flow read-back leans on the human's export (stated, not broken). Not re-verified by a further critic round after these fixes.

2026-10-16 orchestrator: removed workarounds for today's 300-char/8-fact server limits per Akhil — the Brand Brain rebuild removes them; interim handling lives only in atoms/save-learning.

2026-10-16 final contract check: atoms/flow-writer: header-art requests now `Graphic needed: for make-static-ads · header art: … · return to: lifecycle/flows/<flow-slug>.md`, so the kind matches make-static-ads' `Graphic ready:` answer (§8).
2026-10-16 final contract check: the fixes-file section is read as "For your email program — review requests" (renamed by its writer so the human-read file names no playbook) (SKILL.md, skill.meta.json).
2026-10-16 final contract check: skill.meta.json `atoms` now lists only this folder's atoms; shared atoms moved to `shared_atoms`.
2026-10-16 orchestrator ruling: email-lifecycle never writes or retires `Policy:` facts (learn-my-brand's opening); confirmed policies and other rules are `[lifecycle YYYY-MM-DD]` learnings through save-learning, `Standing offer:` stays the one shared opening; reads still include `Policy:` (SKILL.md steps 3 and 9, output table, skill.meta.json, atoms/send-check, references/intake.md, references/loadable-flow-format.md). Review-request flows stay here.

## Round 9 — shared bug from the 18 Oct search hand test (minimal change)

The search hand test showed documents left only in the workspace, with workspace paths offered as if they were links. email-lifecycle's step 8 did the same ("each other flow in one line with its file"). Fixed: the full pack (deliverability report, build order, flows, broadcasts, decisions) is one document through the shared `write-report` atom — a local file with a clickable link, an artifact in hosted chat, plus a saved-copy link; `lifecycle/` files are working copies only. `shared_atoms` and `writes` in the meta updated. Nothing else in this playbook changed.

## Round 10 — run memory and the Brand Brain (19 Oct)

**Wired.**
- New `references/run-memory.md`: one job per mode (build, weekly, monthly, seasonal with a subject, incident).
  - Recommendations carry across jobs; numbers compare only over windows of the same length.
  - Numbers per flow, broadcasts, deliverability and list, each with its window, source, the tool's attribution setting and a claimed/truth label. Windows are settled.
  - "Did it happen" only from the flows list, a test email's headers or the marketer's word; a written flow is "drafted, not live".
  - "Did it work": re-pull both windows; too early under about 30 orders; can't tell when a sale, tentpole or stock-out falls in one window.
- SKILL: brain_map first (core, required reads, chapters 2/5/11/15/17/18/20), with the brand_read fallback kept. Run-memory Start (steps 1–2 before intake, 3–4 inside the audit) and End at write-back. "Since last time" opens the staged chat and the pack. Output table row added.
- The lifecycle-audit read-back and the weekly automation prompt (modes-and-incidents) now read and write the record; meta updated.

**Critique.** One run, on the search playbook (per orchestrator). Its findings that apply here too were fixed in the same pass:
- Start steps split around intake, so since-last-time is never written before the numbers exist.
- Review timing counts from `live since <date>`, never from the date it was recommended.
- Multi-part moves are `done` only when every part is shown.
- Open recommendations keep their ids, marked "still open", never re-issued.
- Run-memory words are kept out of the marketer's text.

**Pushback (§2b).**
- **"Read opens".** Apple Mail's privacy feature marks most messages opened, and the playbook already never judges on opens. So opens are not recorded as a flow result and never judge a recommendation. A sudden drop at one mailbox provider is kept only as a deliverability warning. Results are clicks, orders and revenue per recipient.
- **Weekly scheduled runs** usually have no export. They still read the last record and write a new one, marked "no export this week". Only a record with numbers becomes a baseline.

Not re-run (per orchestrator: no evals).

## 2026-10-20 — hand-test review (Akhil + marketer reviewers)

| Finding | Fix |
|---|---|
| Description said cold outreach is "not covered yet"; Out of scope and `references/flow-library.md` named "do-outreach" | All point to write-outreach (which exists since 19 Oct); named accounts a person emails go there, automated list emails stay here |
| No way to hand-test without a brand that has a real list | `tests/test-by-hand.md` § Test without a real list: a made-up freemium SaaS setup in one message, a 20-row send export, real Gmail headers; pass/fail and four edge cases; an optional free real-load test |

### Review fixes on this change set (second pass)

| Finding | Fix |
|---|---|
| Owner (Akhil): good intake questions, but it never asked which email tool they use | SKILL Before #5 and `references/intake.md` Q2: the email tool is asked first unless the brain names it (the guide's "The marketer's own tools"): none → two or three that fit the company type (store, product-led SaaS or app, small list), as their choice; connected → read lists, consent, flows, recent sends and the sending domain first and drop the questions they answer, read-only; not connected → one line on connecting, never claiming a connector it can't see, then the questions. Test cases: connected, not connected, no tool. |

## 2026-10-20 — Writing-for-Agents pass (items 1, 2, 4)

| Finding | Change |
|---|---|
| Before you start 1 hand-rebuilt connect, brand pick and workspace | Guide setup line (job line "build your email program"); kept `wants: "more"`, the tool groups and the incident-first deviation. |
| Before you start 3 restated the guide's brain read (brain_map core, waiting items) | Kept the chapter list, the brand_read sections, claims contract, standing-offer sources and voice card. |
| Standing-offer / `Policy:` write rules lived in three places (step 9, `references/intake.md`, the Output table) | One copy in `intake.md` § Saving what the marketer said; step 9 points to it. |
| Output table repeated step 9 and guide §4's lifecycle row | Table deleted; a two-line pointer kept with the results loop (analyze-performance ↔ step 1). The calendar's "interim offer home, read by plan-campaign" moved into step 9. |
| Step 4 restated the read-only connector rule | Pointer to `intake.md` Q2, which keeps the rule. |
| Out of scope: 11 bullets, several naming backlog playbooks and "pillar 21" | Five routing bullets kept; the rest in one "Not covered yet" line. |
| Done when had no in-run check | Added: send-check passed on every flow; no [placeholder] in a flow marked ready. |
| Description 998 chars | 695 chars; one trigger per branch (dropped "my list just sits there", "write my email flows"); Not-fors kept. |
| One name for the person | "the human" → "marketer" in SKILL, atoms and references; "founder note"/"[Founder]" kept as roles. |
