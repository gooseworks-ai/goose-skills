**Fictional fixture example — supplied test evidence, not a live site check.**

# Coldfield — pSEO page-set blueprint, 22 October 2026

## In short

Start with **fit-tested brewer guides**, using two verified records: the Coldfield one-litre brewer and the listed 750 ml wide-mouth mason jar. Each page must help someone brew with that actual vessel, using verified fit, capacity and model-specific instructions. Hold the unverified variant. Reject city pages because there is no local offering or useful local dataset. Search evidence supports testing the brewer-guide idea; it does not supply search volumes or traffic forecasts.

## Families considered

| Family | Evidence and feasibility | Decision |
|---|---|---|
| `/brewer-guides/{model_slug}` | Two dated fit/capacity records; supplied mason-jar query shows specific how-to intent. The product can offer verified compatibility and instructions. | Recommend a two-page pilot after missing brewing-step tests. |
| `/brew-method/{method}` | Method questions exist, but generic immersion content can overlap the existing pillar/ratio guides. French-press fit was not tested. | Park broad expansion. Reuse existing editorial pages; only add a distinct model/method page when it has real instructions and compatible product evidence. |
| `/coffee-for/{city}` | The supplied Seattle query has café-shopping intent, but Coldfield has no local store or local dataset. | Reject. Substituting city names adds no useful local answer. |

## Recommended family: fit-tested brewer guides

**URL:** `/brewer-guides/{model_slug}`. Slugs come from reviewed canonical model records; normalize aliases into one model page. Existing URLs that already serve the same model intent should be updated rather than duplicated.

**Title:** `Cold brew with {model_name}: fit and brewing guide | Coldfield`

**Meta:** `Use the verified {capacity_ml} ml {model_name} setup. Check filter fit, follow tested brewing steps and find the matching care guide.`

**H1:** `How to make cold brew with {model_name}`

The title/meta are templates for review, not approved product copy. Do not publish the “tested steps” wording until those steps exist for the record.

**Sections:** what vessel/filter this guide covers; verified fit and capacity; required equipment; model-specific brewing steps with sourced quantities; handling/filter removal; troubleshooting specific to that vessel; care; links to the ratio/dilution pages and product when relevant.

**Internal links:** a brewer-guide hub lists only complete useful guides. Each page links back to the hub, to the relevant product and to the existing ratio, dilution and care guidance. A sibling comparison link is useful only when it helps the user choose a genuinely different setup.

## Data model and records

| Field | Type | Source / publish requirement |
|---|---|---|
| `model_slug`, display name | string | Reviewed compatibility record; unique canonical slug. |
| `capacity_ml` | integer | Product specification or measured vessel record; required. |
| `fit_confirmed` | boolean | Dated physical fit test; true required. |
| Filter and method | string | Product specification and actual setup test. |
| `tested_steps` | list of instructions | Model-specific brewing test; required before publish. A generic name swap is insufficient. |
| `care_url` | URL | Current matching care guide; check response and relevance. |
| `source` | URL/record reference | Underlying specification and fit proof. |
| `updated_at` | date | Most recent verification, with a named owner. |

**Example record 1:** `coldfield-one-litre`, 1000 ml, reusable mesh, immersion, fit confirmed, product-page evidence dated 21 October; care guide `/guides/filter-care`. Model-specific tested steps are still needed.

**Example record 2:** `glass-mason-jar`, 750 ml, compatible listed wide-mouth jar, immersion, fit confirmed by compatibility record C2 dated 18 October; same care reference, but vessel-specific steps and useful differences must be tested rather than copied.

**Excluded record:** `unknown-wide-mouth` has no confirmed capacity, fit or source. Hold it out of the public page set until those facts and useful instructions exist.

## Quality and technical plan

CMS capabilities are unknown. Engineering should review the record schema and propose a route/template implementation in a PR; the rendered pilot previews are the human review surface. No CMS integration is assumed.

Publish only complete, sourced and useful records. Empty, unsupported and unverified variants must not create public indexable pages. Use one canonical URL for each distinct model intent; resolve aliases and overlapping pages before launch. Include approved pages in the hub and sitemap, serve the essential instructions/links in crawler-visible HTML, and ensure canonical, status and structured facts agree. Do not add review or performance claims without approved evidence.

Assign the product owner to refresh fit/specification records after product changes and the content owner to recheck instructions and care links. Retire or redirect a page to a relevant successor when a model no longer has a supported useful guide; review the destination and traffic paths first.

## Pilot, review and expansion

1. Validate the missing model-specific instructions for both verified records. Agent: 15 min (M) - Human: 20 min for reviewing existing physical-test evidence; any new physical brewing test has elapsed preparation time outside agent execution.
2. Prepare the template and two rendered draft previews. Agent: 30 min (L) - Human: 15 min. Prerequisites: repository/CMS access, approved product facts and the completed records. Review in the engineering PR and preview URLs.
3. Check both pages by eye and raw response: real differences beyond the names, complete instructions, correct sources, useful links, one intended canonical, no unsupported fields or claims. Agent: 15 min (M) - Human: 10 min. Publishing waits for approval.
4. After an approved pilot, confirm indexing and read settled own-property query/page evidence if connected. Expand only when quality and useful data hold and measured demand justifies the next family. No fixed rank or traffic gain is promised.

Keyword volume/difficulty and a full rival traffic breakdown were not supplied. That limits numerical demand confidence, but the product fit, data requirements, templates and pilot are concrete enough to review now.


Sources: the supplied Coldfield fixture packet, dated 22 October 2026. These .test domains were not browsed. This local example was saved by the fixture exercise; saving to a live brand was not exercised. Nothing was changed, sent or published.
