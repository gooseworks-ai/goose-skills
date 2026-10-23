---
name: run-paid-campaigns-health-gate
description: >-
  Checks that ads are safe to spend on: conversion tracking recording, landing pages loading on mobile
  with the right product, price and offer, enough stock behind promoted products, no disapproved ads,
  and no account or payment stop. Marks each pass, fail or unknown and turns fails into fixes. Use
  alone when you already have the live or planned ads and their landing pages; otherwise run
  run-paid-campaigns.
version: 0.1.1
---

# Health gate (atom)

**Load:** `../run-paid-campaigns/references/launch-and-graduate.md` (health gate section).

**Inputs:** the chosen platforms (from the brief); the latest analyze-performance read (`reports/performance/`) — its data-quality flags and the platform-claims ÷ store-orders ratio; with GooseWorks, `meta_read` push status for each id in `state.md`'s `meta_push_ids` (per-creative failures, destinations; local mode: the connector's delivery and disapproval reads, `../run-paid-campaigns/references/local-mode.md`); destination URLs of other live ads (the marketer's export); stock on promoted SKUs (marketer or product record); live offers and their end dates (brief's Offer section, the marketer); the marketer's ads connector, when there is one (disapprovals, delivery status, whether the conversion event is recording).

**Do — in order, one line each, ✓ / ✗ / unknown:**
1. Tracking: conversions tracking store orders at a steady ratio (from analyze-performance), the connector showing the conversion event recording, or the marketer confirms it fires. Lead-gen: lead source captured in the CRM. Apps: SDK/MMP postbacks, SKAN/AEM set up. Unknown on a launch → ask; do not launch blind.
2. Destination: loads on mobile, right product, price matches the ad, offer valid, UTMs present. Open the page when the host can browse; else ask.
3. Stock: no ad sends traffic to a SKU with under ~1 week of cover.
4. Disapprovals / failed creatives (push_status; the connector; the marketer's export).
5. Account: (Meta chosen only) publishable Page exists; every platform: no known payment failure or spending-limit stop.

**Output:** the proposal's health line, plus fix moves (pause the affected Goose ad, a card for non-Goose objects, a written tracking fix). Any ✗ blocks launches and scale moves for that destination this week. Only a tracking break makes the window's numbers suspect; low stock or a disapproval does not invalidate past results.
