<!-- Hidden atom (plan-campaign-brief-and-assets): Hidden atom of plan-campaign. Writes angles per channel from customers' words and approved claims, the asset list a designer can start from today, the measurement plan, hand-offs and replan triggers, and assembles the brief in its fixed shape. -->

# Brief and asset list (atom)

**Load:** `../../references/brief-template.md`, `../../references/launch-and-calendar.md`, `../../../../atoms/write-report/ATOM.md` (§1 writing rules, §3 check).

**Inputs:** all earlier sections; approved claims = the claims that are usable through `../../../../atoms/claims-gate/ATOM.md` ("Claims sign-off" marker, "Claims you may use" `must` facts, dated Brand record; or confirmed brain claims), with server applicability from `knowledge_search` `["claim"]` + `product_id`; the angle bank and voc bank files (`research/competitors/angle-bank.md`, `research/audience/voc-bank.md`); existing campaign concepts; the brand voice from the kit.

**Do:**
1. Angles per Run/Test channel: one reason to buy each, resting on a named customer line and an exact approved claim (with id) whose `applicability` covers it (`brand`, or `product` for that product). `unknown` applicability is not brand-wide proof — the server refuses it on a concept; mark **needs proof (scope unconfirmed)**. Adapt the expression per channel. No approved proof → **needs proof**, never invented. Press quotes and the brand's own site copy are not customer words; if research-market's voice-of-customer bank is empty, say so.
2. Asset list: one numbered row per asset — leg, placement, spec (format, ratio, length), angle, message/hook, claim (verbatim), CTA → destination (with UTMs), producer role (static ads, video ads, photos, content, human; video ads and photos are human-executed for now), due date (from the backwards calendar), dependency. Check the count against each paid leg's creative-volume need.
3. Measurement plan per leg: conversion event, UTM convention, promo code, attribution window, the store/CRM number it is judged on, blended MER target, "how did you hear" question.
4. Hand-offs: one row per leg, no silent legs; legs with no playbook are marked human-executed.
5. Replan triggers with thresholds and the action each starts.
6. Assemble the plan with the exact headings of the template, In short first; each section opens with its point in one sentence; plain words; no ids, codes, paths, tool or playbook names; every outside fact with its source and date. Fill every section or write "none — <reason>". Then run write-report §3's check.

**Output:** the full `brief_md` text and the concept list (person, message, proof, evidence, confidence, product_id) for the write-back.

**Never:** a claim the claims gate does not allow; an asset with no owner or date.
