---
name: assistedly-ops
description: >-
  Operational skill for managing an Assistedly SaaS deployment: verify the
  ecommerce funnel is healthy, score ad-to-landing-page message harmony,
  apply server patches safely, and run the daily SaaS growth optimizer with
  cost and ROI guardrails. Read-only checks by default; writes and deploys
  only with explicit approval.
version: 1.0.0
---

# Assistedly Operations

Operational skill for keeping an Assistedly SaaS deployment healthy and
growing. Four modes, each run independently or as a combined daily routine.

## When to use

- The user asks to check the Assistedly funnel, pricing page, or checkout
- The user asks to sync ad copy with landing page messaging
- The user asks to patch servers safely
- The user asks to run the SaaS growth optimizer
- A scheduled automation triggers one of the above

## Mode 1 — Pricing and checkout health (read-only)

Verify the live ecommerce funnel. Read-only: do NOT modify, deploy, or
change anything.

1. **Public checks** (no secrets needed):
   - GET the pricing page: expect HTTP 200 and the expected headline copy
   - GET the agency partners page: expect HTTP 200 and expected content
   - GET the checkout page: expect HTTP 200
   - GET the checkout success page: expect HTTP 200
   - GET the API health endpoint: expect a healthy response

2. **Checkout API check** (uses a Stripe secret key via a secret manager):
   - POST to the checkout session creation endpoint with a test plan
   - Expect HTTP 200 with a valid client secret
   - Also test the promo code path (e.g., multi-location discount)

3. **Stripe activity check** (read-only):
   - List recent checkout sessions, count any with status open or expired
   - Verify the webhook endpoint exists and is enabled

4. **Report:** write a compact pass/fail table for each check.

5. **Alert:** on any failure, post a concise message to the alert channel
   (Discord webhook from the secret manager). On all-pass, no alert.

## Mode 2 — Ad and landing page message sync

Score ad-to-landing-page message harmony, publish the scorecard, and
auto-redeploy on hard failure only.

1. **Run the scorer** (public pages only, no secrets needed for scoring):
   Run the message-sync scoring script from the project repository. It
   writes scorecard files (JSON, Markdown, HTML).

2. **Publish to Google Docs:** use the Google Docs creation script. If it
   fails, save the report locally and continue.

3. **Regression check vs previous run:** if a prior scorecard exists,
   compare each ad group's overall score. Flag any drop of 10 or more
   points. Also flag any ad group scoring below 60 (rewrite) or with an
   error.

4. **Auto-redeploy on hard failure** (only when explicitly approved):
   Trigger only when any of these is true:
   - A landing URL returns HTTP 404 or 5xx
   - The scorer reports an ERROR for a landing URL (a fetch failure, not a
     scoring miss)
   - A page is serving an old build (e.g., a route 404s while the repo has
     the page)

   If triggered, redeploy from the repo's main branch: pull, install
   dependencies, build the frontend, deploy the frontend and backend
   Workers (using Cloudflare credentials from the secret manager), then
   re-run the scorer. If the page still fails after redeploy, stop and
   alert. Do NOT auto-redeploy for copy mismatches (those are
   recommendations only).

5. **Recommendations (additive only):** list per ad group with grade
   NEEDS WORK or REWRITE the specific phrases the landing page is missing.
   Note any CTA mismatches. Do NOT edit pages or ads directly.

## Mode 3 — Server patch (read-only operator)

Run the patch agent exactly once and report its results. Do not modify the
agent, its config, or any server directly.

1. Run the patch agent with the project config, once.
2. Summarize for each server: packages applied, disruptive packages
   deferred, destructive packages skipped, updates remaining, and any
   errors. Flag skipped-destructive or error lines clearly.

### Patch hard rules

- Never run apt-get, dist-upgrade, or any command that removes, downgrades,
  or reinstalls packages.
- Never apply a kernel, glibc, grub, systemd, or snapd update.
- The agent already enforces these rules; do not bypass them.

## Mode 4 — SaaS growth optimizer (guardrail-gated)

Ensure the SaaS deployment meets modern best practices, with cost and ROI
guardrails checked first.

### Step 1 — Guardrail gate (check first; any fail = stop all changes)

**Cost gate** (all must pass):
- Google Ads spend today at or below the daily cap
- Google Ads spend last 7 days at or below the weekly cap
- Email sends last 7 days not more than 2x the 7-day average
- Stripe refunds and chargebacks this week = 0

**ROI gate** vs previous 7 days (all must pass):
- Checkout views not declining more than 20%
- Begin-checkout and add-payment-info not declining more than 20%
- Trial starts not declining more than 20%
- Cost per checkout view not rising more than 20%

If any gate fails: stop all changes. Write a report with the fail table.
Alert via Discord only. Then exit.

### Step 2 — Audit (gate passed)

Run the SaaS best-practice checklist:
1. Funnel measurement: verify GA4 ecommerce events and GTM container
2. Checkout and pricing health: verify pages return 200 with expected
   content
3. Email deliverability: verify SPF, DKIM, and DMARC DNS records
4. GA4 last-7-day funnel snapshot
5. Landing pages: quick scan for above-fold CTA and trust signals

### Step 3 — Act (only if gate passed; safe reversible changes only)

May auto-apply, each with a docs writeup (before/after, evidence,
rollback) and git commit:
- Frontend copy or UX fixes improving conversion
- Tracking fixes (dataLayer events, GTM container verification)
- Landing-page fixes

Never auto-apply: ad budget or pause changes, pricing changes, billing
changes, contract terms. Those go in Recommendations. Do not send
prospect outreach autonomously.

### Step 4 — Report and commit

Write a report: gate table (pass/fail), audit findings, actions taken
(with evidence), recommendations (prioritized, ICE-scored), alert summary.
Commit to git. On gate failure, the report contains only the fail table
and recommendations (no changes).

## Secrets

All secrets come from a secret manager (Bitwarden Secrets Manager or
Cloudflare Secrets Store). Never read config files that may contain
plaintext secrets. Never print secret values. If the secret manager is
unavailable, run only public checks and report that secret-backed checks
could not be verified. Do not take autonomous actions without verified
secrets.

## Done when

- The selected mode has completed its full workflow
- A report has been written (and committed if applicable)
- Alerts have been sent on failures only
- No destructive change has been applied without explicit approval

## Never

- Edit page copy or ad copy directly (recommendations only)
- Deploy or modify production without explicit approval
- Print or log secret values
- Apply destructive server patches (kernel, glibc, grub, systemd, snapd)
- Take autonomous actions when guardrails fail or secrets are unavailable
- Send prospect outreach autonomously
