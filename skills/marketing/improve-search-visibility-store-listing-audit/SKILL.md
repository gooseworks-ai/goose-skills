---
name: improve-search-visibility-store-listing-audit
description: >-
  Audits an app's App Store and Google Play listing against three competitors (title, subtitle,
  description opening, first screenshots and captions, rating, review themes) and writes a
  field-by-field rewrite with character counts, or a launch-day listing before release. Use alone when
  you already have the app's store links and signed-off product facts; otherwise run
  improve-search-visibility.
version: 0.1.0
---

# store-listing-audit

**Reads:** `../improve-search-visibility/references/app-store-listing.md`; the store links from Before-you-start step 4's lookup (ask only if not found); the iOS keyword field (asked — not public); the "best app for X" rows from the citation check; product facts from the brain.

**Does:**
0. Before release: write the launch-day listing (name, subtitle, keywords, short description, first three captions, with counts) and skip the comparison of ratings.
1. Read the public listings (host fetch; blocked or no fetch → ask for screenshots) for the brand and three competitors: name/title, subtitle/short description, description opening, first three screenshots and captions, rating and count, recent review themes.
2. Write the rewrite table: field · now · proposed · count · why — following the indexing rules; every product statement kept only if the claims gate allows it (SKILL step 4) — captions like "works offline" or "never jolts" are claims.
3. Rating below ~4.3: an engineering ticket for the native rating prompt after a positive moment.
4. Note that iOS name, subtitle and keywords ship with the next app version.

**Writes:** the listing fix (candidate for the five) and the audit table for the report.
**Never:** uses rival trademarks; claims a keyword rank it cannot see.
