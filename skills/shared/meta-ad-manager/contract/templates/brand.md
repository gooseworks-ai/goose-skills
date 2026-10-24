---
brand_id: <id>
business_type: <enum: software|ecommerce|app|services|other>
familiarity: <enum: novice|intermediate|expert>
updated_at: <date>
---
<!--
ads/brand.md — facts about the business that every campaign shares. Written by intake and
strategy, changes rarely. Product facts are NOT copied here: they live in the catalog and a
campaign's strategy.md references them by product id.

brand_id       The GooseWorks brand id. Outside GooseWorks: `local`.
business_type  Picks which intake questions apply (software: sales cycle, PLG/SLG, ACV;
               ecommerce: AOV, repeat rate, site conversion; app: install→paid, ARPU).
familiarity    The user's own answer about Meta Ads experience. The orchestrator uses it to
               explain terms for novices and drop explanations for experts.
updated_at     Date of the last write (YYYY-MM-DD).

Numbers the USER stated (ACV, margin, CAC target) are Goose's inputs, written plainly with who
said it ("per Dana"). A number read from a tool (Stripe, Shopify, Meta) is an observation and
goes on an `- Observed:` line with its tag — see RULES.md.
-->

# Brand — <brand name>

## Business model
<!-- What they sell, to whom, how they make money. Two to four sentences. -->

## Unit economics
<!-- ACV or AOV, gross margin, LTV, CAC target. Say who stated each and whether it is an
estimate. Unknowns are written "unknown — ask at strategy", never guessed. -->

## Sales cycle
<!-- Time from first touch to purchase, and the path (self-serve trial, demo call, checkout). -->

## Other channels
<!-- Where else they sell or acquire customers; what is already working. -->

## Connected accounts
<!-- Which Meta ad account, Page and pixel Goose uses, by id, and the date connected.
Connection STATUS is not stored: it is read from the readiness tools each time. -->

## Claims rules
<!-- What ads may and may not claim: approved proof, banned phrases, regulated words.
Default: no named customers and no results claims unless the user approved one here. -->

## Safety rules
<!-- Hard limits the harness must respect: max daily budget, audiences to exclude, pause
thresholds the user pre-approved. -->
