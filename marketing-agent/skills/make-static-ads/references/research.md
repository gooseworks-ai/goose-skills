# Research routes — where to look, and how to say what you saw

Step 1 of the playbook reads the brand's facts, its customers and the ads it already runs. This file lists the routes. Bound each read, look at the images, and write what you actually covered in the board header. "Not checked" is an honest answer; "checked" when you read 1,000 characters of a list is not.

## 1. What customers say

- The voice-of-customer bank first (`reading-the-brain.md` §2).
- None → public reviews, free, in the host browser: the product page's reviews, Amazon or another marketplace, Reddit threads about the product or category. Read 10–20. Note the moments people describe (when they use it, who else is there, what went wrong before), not just praise.
- Customer words are hook and situation sources. They are not product proof (`claims-and-policy.md` §1, "four doors").

## 2. What the brand already runs

Free, by eye, on a host with a browser. Up to 20 static ads per platform; note each one's message in a few words.

- **Meta Ad Library.** Type the brand's name in the library's search box and choose it under "Advertisers" (keyword search returns other advertisers). Then `facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&view_all_page_id=<page id>`. The page opens with the most-shown ads first. Don't filter to "Images": many statics run as dynamic ads.
- **Other platforms the brand uses** (from its profile and channels; a consumer brand rarely runs LinkedIn): LinkedIn `linkedin.com/ad-library/search?accountOwner=<brand>` (check the advertiser is the brand's page); TikTok `library.tiktok.com/ads` (Europe and UK only); Google `adstransparency.google.com`.
- **Imported into GooseWorks:** `gooseworks:ads_template_read` `mode: "mine"`, `filters.format: "image"`, `limit: 20`. Check the advertiser really is the brand. Nothing imported or older than about a week → `gooseworks:ads_library_scrape` with `brand_id` (free), poll `gooseworks:job_get` `kind: "library_scrape"`.
- **No browser and nothing imported** → the proxy, on one yes to a ceiling (the `spend-gate` skill (`../../spend-gate/SKILL.md`) branch B): `gooseworks:data_call_provider` `provider: "scrapecreators"`, `/v1/facebook/adLibrary/search/companies` `{query}` for the page id, then `/v1/facebook/adLibrary/company/ads` `{pageId, status: "ACTIVE", media_type: "all", trim: "true"}`.
- **Made before in GooseWorks:** `gooseworks:ads_creative_read` `tags: ["made-by:make-static-ads"]`, `limit: 20`; the three latest batch files in `ads/batches/`. Never page through an untagged creatives list (`engine-notes.md`).

Write one line per distinct message the brand already runs ("authenticity: real Kolkata recipe", "20% off first order", "ingredients flat lay"). The board should not repeat those meanings.

## 3. Other brands, for references

The find-references step owns this. The same Meta Ad Library route works for any advertiser. Library and Pinterest sources are named as such; a run length you didn't see is unknown.

## 4. Rights

Borrow devices, craft and abstract layout; never another brand's words, claims, logo, packaging, people or signature look. A celebrity or expert in a reference is a slot for the brand's own endorser with permission on file, never a generated lookalike. **Side-by-side test** for direct competitors: cover both logos; if a buyer could mistake ours for theirs, change the picture and the words.
