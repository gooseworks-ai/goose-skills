<!-- Hidden atom (plan-campaign-brief-and-assets): Hidden atom of plan-campaign. Writes angles per channel from customers' words and approved claims, the asset list a designer can start from today, the measurement plan, hand-offs and replan triggers, and assembles the brief in its fixed shape. -->

# Brief and asset list (atom)

**Load:** `../../references/brief-template.md`, `../../references/launch-and-calendar.md`.

**Inputs:** all earlier sections; approved claims = learn-my-brand's sign-off ("Claims sign-off" marker, "Claims you may use" `must` facts, dated Brand record), with server applicability from `knowledge_search` `["claim"]` + `product_id`; the angle bank and voc bank files (`research/competitors/angle-bank.md`, `research/market/voc-bank.md`); existing campaign concepts; the brand voice from the kit.

**Do:**
1. Angles per Run/Test channel: one reason to buy each, resting on a named customer line and an exact approved claim (with id) whose `applicability` covers it (`brand`, or `product` for that product). `unknown` applicability is not brand-wide proof — the server refuses it on a concept; mark **needs proof (scope unconfirmed)**. Adapt the expression per channel. No approved proof → **needs proof**, never invented. Press quotes and the brand's own site copy are not customer words; if research-market's voice-of-customer bank is empty, say so.
2. Asset list: one row per asset — ID, leg, placement, spec (format, ratio, length), angle, message/hook, claim (verbatim), CTA → destination (with UTMs), producer role (static ads, video ads, photos, content, human), due date (from the backwards calendar), dependency. Check the count against each paid leg's creative-volume need.
3. Measurement plan per leg: conversion event, UTM convention, promo code, attribution window, the store/CRM number it is judged on, blended MER target, "how did you hear" question.
4. Hand-offs: one row per leg, no silent legs; legs with no playbook are marked human-executed.
5. Replan triggers with thresholds and the action each starts.
6. Assemble the brief with the exact headings of the template; fill every section or write "none — <reason>".

**Output:** the full `brief_md` text and the concept list (person, message, proof, evidence, confidence, product_id) for the write-back.

**Never:** a claim outside learn-my-brand's sign-off; an asset with no owner or date.
