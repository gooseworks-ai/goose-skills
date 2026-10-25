# BillPilot page technology — 22 October 2026

## In short

**What we looked at:** a supplied fictional homepage HTML capture and an inaccessible pricing page. No live site or network was inspected.

1. **The homepage source contains Webflow, Google Tag Manager, Meta Pixel and PostHog signatures** — first look from one raw-source capture.
2. **A commented-out LinkedIn script does not show an active LinkedIn tag** — first look; rendered/consent-gated behaviour was not checked.

**So, do this first (because of 1 and 2):** the analyst should inspect a rendered page before making a claim about loaded tags; the source alone does not establish firing or ad spend.

## Decisions for you

None. A source-only check can be delivered with its limits.

## What the source shows

| Page | Tool/family | Status | Evidence and how read | Checked on | Limit / meaning for us |
|---|---|---|---|---|---|
| Supplied homepage | Webflow / CMS | Detected | `meta name="generator" content="Webflow"` in [raw HTML](../../fixtures/page-source.html) | 22 Oct | Signature in this capture; not a company-wide stack audit |
| Supplied homepage | Google Tag Manager | Detected | Active script from `www.googletagmanager.com/gtm.js` in [raw HTML](../../fixtures/page-source.html) | 22 Oct | Does not reveal which tags the container loads |
| Supplied homepage | Meta Pixel library | Detected | Active script from `connect.facebook.net/en_US/fbevents.js` in [raw HTML](../../fixtures/page-source.html) | 22 Oct | Presence does not prove it fired or ads are running |
| Supplied homepage | PostHog library | Detected | Active script from `eu.i.posthog.com/static/array.js` in [raw HTML](../../fixtures/page-source.html) | 22 Oct | Library presence; events and consent behaviour not checked |
| Supplied homepage | LinkedIn tag | Possible historical configuration | Script signature appears only inside an HTML comment in [raw HTML](../../fixtures/page-source.html) | 22 Oct | Not detected as an active script in this read |
| Supplied homepage | Google Analytics 4 | Not detected in this read | No direct signature in inspected HTML | 22 Oct | Could load through the tag manager; not evidence of absence |
| Pricing page | All tools | Not checked | Fixture says the page is inaccessible; no HTML provided | 22 Oct | No conclusion about its stack |

The article's mention of Intercom and Drift is prose, not an embedded tool signature. No account/tag identifiers are disclosed here.

## What to do

1. If loaded tags matter to a later decision, the analyst checks the public rendered page and consent state. Success: each claimed loaded tag has an observed script/request and date.

## What we're not doing

No spend, attribution-health, customer-contract or working-tracking claim. There is no reason to copy a tool just because this page includes it.

## What we couldn't check

Rendered scripts, requests, event firing, consent-gated tags, server-side integrations and the pricing page. This is an HTML-fixture test, not a live domain scan.

## Sources

[Supplied fictional homepage HTML](../../fixtures/page-source.html), read 22 October 2026. Source skew: one static capture, no render/network evidence. Nothing was saved to a live brand.
