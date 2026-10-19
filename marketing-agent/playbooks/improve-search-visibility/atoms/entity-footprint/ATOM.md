---
name: entity-footprint
description: Internal step of improve-search-visibility. Checks the five profiles answer engines read for this brand type — plus Business Profile and reviews per location for local businesses — against the canonical facts and writes the corrections as field values. Not user-invoked.
---

# entity-footprint

**Reads:** `../../references/entity-and-local.md`; the canonical facts from the brain (name, one-liner, category, founding facts, domain, pricing, locations); brand-question accuracy errors from the citation check and the sources they traced to.

**Does:**
1. Confirm the canonical facts with the human if the brain lacks any (never guess founding year, HQ, NAP).
2. Pick the five profiles that matter for this type (always include any profile an engine cited for a wrong fact). Read each public page with the host's fetch where allowed (never G2, Capterra, Trustpilot or Amazon — they forbid automated collection; blocked or no fetch → ask for a screenshot, else "not checked"); mark complete / inconsistent / missing / unclaimed and list mismatches.
3. Local: per location (worst 2–3 first on a large chain) the Business Profile fields, NAP across directories, review count, average, recency and reply rate.
4. Write each correction as exact field values plus how to edit (claim steps, vendor portal, suggest-an-edit). Review gaps → a review-request brief addressed to email-lifecycle. No reply drafts: replying to reviews is not covered yet (say so plainly).

**Writes:** the entity table and candidate fixes.
**Never:** drafts a Wikipedia article; adds an unsourced Wikidata item; suggests fake or gated reviews or incentives tied to a positive rating (a platform's own disclosed programme is fine); adds keywords to a Business Profile name.
