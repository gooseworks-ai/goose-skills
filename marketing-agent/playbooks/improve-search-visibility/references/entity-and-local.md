# Entity footprint and local

Load at step 1 (free pass, atom entity-footprint).

## The canonical facts (set once, from the brain; the human confirms)
Name and legal name · one-line description (the canonical sentence) · primary category · founding year and founders · HQ city · canonical domain · logo · pricing model · for local: name, address, phone (NAP) and hours per location. The most common cause of a wrong brand description in AI answers is an old positioning left on one profile: fix those first.

## How the name is said and misheard
Read any pronunciation fact in the brand's learnings (`gooseworks:brain_search` for learnings when `brain_*` tools are listed, else `brand_read`; written `Pronounce "<term>" as "<spoken form>"`). With none, work from the written name. People type what they heard: from the spoken form, list the spellings a buyer would try ("Goose Works", "Goosework", "Gooseworx") and use them in brand questions, in the Organization markup's `alternateName`, and in the "who we are" line when a namesake wins. Voice assistants read names the same way. Never write a pronunciation fact here — this playbook doesn't record brand facts; if a name is easy to misread and no fact exists, say so in "couldn't check" as a question for the brand.

## Profiles that matter, by type (check the top five for this brand)
| Type | Must-have | Nice-to-have |
|---|---|---|
| All | own About page with the facts, Organization markup with sameAs, LinkedIn page, Crunchbase, Wikidata (only if notable) | YouTube, X/Instagram |
| B2B SaaS | G2, Capterra/GetApp/Software Advice (one account), TrustRadius, integration-partner directories, public docs and pricing pages | Product Hunt, AlternativeTo, SaaSworthy, GitHub |
| Store (DTC) | Trustpilot (claimed), Google Merchant Center store rating, Amazon brand store if selling there, retailer listings | Product Hunt for launches, disclosed founder presence on Reddit |
| Local / physical | Google Business Profile, Apple Business Connect, Bing Places, Yelp, Facebook page, the industry directory (Healthgrades, Zocdoc, Avvo, Houzz, Tripadvisor) | Nextdoor, chamber of commerce |
| Consumer app | App Store and Play listings, developer site with support and privacy pages, Product Hunt | AlternativeTo, Reddit, YouTube demos |
| Services | Clutch-type directory for the niche, LinkedIn (firm + founder), Google Business Profile if clients visit | podcast/guest pages (gap only) |

## Scoring each profile
complete / inconsistent / missing / unclaimed, against: same name; the canonical one-liner (word for word or as a clear prefix); same primary category in that site's taxonomy; same founding facts; same domain; same logo; same pricing model or no price rather than an old one; same NAP (local).

## Reading profiles
Read public profiles with the host's fetch where the site allows it. G2, Capterra, Trustpilot and Amazon forbid automated collection: never fetch them — ask the human for a screenshot or their vendor-portal view, or mark "not checked". Crunchbase and app stores often block fetchers — same fallback.

## The fix is field values, not advice
Write the exact value per field (see `finished-fix-examples.md` §d) and how to edit it (claim the profile, vendor portal, suggest-an-edit). Unclaimed profiles: the claim steps.

## Local module (any business with in-person customers)
Google Business Profile is only for businesses that meet customers in person or at their location. Per location: business name exactly as on the signage (no keywords added); the single most specific primary category; 2–4 secondary; hours incl. holiday overrides; address or service area; phone; website with UTM; services/products; description (≤ 750 characters, facts first); photos; review count, average, recency (last 30/90 days) and reply rate. NAP identical across the profile, the site, Apple, Bing, Yelp and the industry directory. Sample local questions per city.

Review gaps → a review-request flow brief for email-lifecycle (every customer, the direct review link, timing after the visit). Replying to reviews is not covered yet (manage-reviews, backlog): report the reply rate and say so plainly. Never fake reviews, never an incentive tied to a positive rating or left undisclosed, never asking only happy customers; a platform's own disclosed review programme is fine.
