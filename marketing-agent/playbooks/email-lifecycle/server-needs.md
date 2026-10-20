# email-lifecycle — server needs

What the playbook needs that the GooseWorks MCP does not have today (staging tool list read 2026-10-16). Each entry: the need, the step that needs it, and what the playbook does meanwhile.

## 1. Read the brand's email/SMS tool (Klaviyo, Mailchimp, Customer.io, Braze, HubSpot, Attentive, Postscript, OneSignal) — HIGH

- **Need:** read-only: list and segment sizes, flows live (trigger, status, message count), last 90 days of sends (recipients, clicks, orders, revenue, unsubscribes, spam complaints, bounces), suppression counts, sending domain.
- **Step:** 1 (audit) and 9 (the next run's read of what worked).
- **Meanwhile:** three routes, in this order: (a) if the host agent already has the customer's own connector for their tool (Klaviyo ships one), read through it — read only, never create, schedule or send; (b) ask the human for the tool's standard exports (flows report, campaigns report last 90 days, list growth); (c) a pasted screenshot of the dashboard. Whatever is missing is named in the audit as "not seen", never estimated.

## 2. A typed home for the lifecycle program in the brand brain — HIGH

- **Need:** the brain has no section for: the email/SMS tool in use, list size and consent source, flows live, segment definitions (what is a repeat, a lapse, a VIP), approved send cadence, sunset policy, replenishment cycle per product, contribution margin per product. Source map §2–3 and §19 call for these; today `brand_update` writes only kit fields, products (`offers`, `pricing`, `notes` text) and learnings.
- **Step:** "Before you start", step 3 (segments), step 5 (offers), step 9 (write-back).
- **Meanwhile:** the program sheet is the workspace file `lifecycle/program.md`, also saved as the brand document "Lifecycle program — <Brand> — <date>" through the shared save-to-brain atom (previous version retired) so any host finds it; rules the human states go through the shared save-learning atom (`[lifecycle …]`, one idea each); the standing offer lives in the shared `Standing offer:` learning. The playbook says plainly that the file is a working sheet, not memory.

## 3. Margin and stock per product — HIGH

- **Need:** contribution margin (or COGS) per product and live stock / back-in-stock state.
- **Step:** 5 (offer-depth margin math), 6 (never promote out-of-stock items).
- **Meanwhile:** asked once (a margin range per category is enough) and saved in `lifecycle/program.md`; stock is asked for the products named in this week's sends. If margin is unknown the playbook shows the discount's cost per order in money and refuses to call it "affordable".

## 4. Deliverability signals — MEDIUM

- **Need:** DNS lookups for SPF, DKIM selectors, DMARC and BIMI on the sending domain; Google Postmaster Tools spam-rate and reputation; blocklist status.
- **Step:** 1 (deliverability report).
- **Meanwhile:** the primary evidence is the "original" text of one recent campaign, pasted by the human after plain click-by-click steps (works in hosted chat: SPF/DKIM/DMARC passes, alignment, List-Unsubscribe); a host with a shell adds `dig TXT` lookups (public DNS, no key). The spam-rate chart is a screenshot from the human, optional. Unseen items stay "unknown".

## 5. Stage flows into the email tool as drafts — LOW (later)

- **Need:** create flows and campaigns in the customer's tool in **draft / manual** state, never live, so "load as-is" becomes "review and switch on".
- **Step:** 8 (staging).
- **Meanwhile:** the flow pack is a document the human builds from. This stays a proposal: sending stays a human action either way.

## 6. Claim status the playbook can read — HIGH (shared with every maker)

- **Need:** a claim status that distinguishes human-approved claims from research-created ones; today `knowledge_search` returns research-created claims as approved.
- **Step:** Before you start 3, step 7 (claims gate).
- **Meanwhile:** the shared claims-gate atom (its contract: `signed-off` marker → "Claims you may use" facts; otherwise the scoped sign-off, else plain product facts).

## 7. Tool and plan facts — LOW (and a verification note)

- **Need:** which email/SMS/push tool and plan the brand uses, stored once in the brain.
- **Step:** Before you start 4, step 2 (plan reality).
- **Meanwhile:** asked in intake message 1 and kept in `lifecycle/program.md`.

## 8. Competitor inbox watch — LOW

- **Need:** a seeded inbox subscribed to 3–5 competitors' lists, readable by the agent (what they send, how often, which offers).
- **Step:** 6 and the monthly mode (what the category is sending).
- **Meanwhile:** asks the human to forward a few competitor emails, or skips and says so. Never guessed.
