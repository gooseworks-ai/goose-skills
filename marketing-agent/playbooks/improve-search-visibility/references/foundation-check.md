# Foundation check (light, free)

Load at step 1 (free pass: site-wide and the 3–6 pages behind the gaps). Every item is **pass / fail / not checked** — never pass by default. A blocker on a page outranks any copy fix on that page. Deep technical SEO stays with engineering; this check flags blockers only.

## Site-wide (once)
| Check | How (no paid tools) | Class |
|---|---|---|
| robots.txt | fetch `/robots.txt`; look for `Disallow` on key paths and these user agents. **Retrieval** (blocking removes you from that engine): Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Claude-User. **Training** (a policy choice, not a citation fix): GPTBot, Google-Extended (does not affect AI Overviews or AI Mode, which use Googlebot), CCBot, ClaudeBot | blocker if a retrieval bot is blocked |
| CDN / bot management | needs a shell: `curl -A "OAI-SearchBot" -sI <url>` vs a normal browser agent (also PerplexityBot); a 403 or a challenge page means blocked. No shell → "not checked — this chat can't test bot access" and a one-line developer check. CDNs' default AI-bot blocking catches many sites | blocker |
| Indexed at all | Search Console if shared; else the paid top-up's first lookup (the site-wide `site:` check, step 3), run only after the human's one yes — never during the free pass; the free pass can only hint at indexing (a web search for the brand's site). Bing: Bing Webmaster Tools if shared, else "not checked" (never scrape Bing results pages). ChatGPT search is widely reported to lean on Bing's index — unconfirmed by OpenAI — so Bing indexing is a cheap hedge | blocker if absent |
| Duplicate host | the platform's default domain (`*.webflow.io`, `*.myshopify.com`, `*.vercel.app`) redirects or canonicalises to the real domain | blocker if the duplicate is the one indexed |
| Search Console / Bing Webmaster Tools | asked in intake (one optional question covers both; Bing unknown → "not checked") | fix if missing |
| Sitemap | `/sitemap.xml` or the robots.txt `Sitemap:` line returns 200 and lists the money pages | polish |
| Templated page sets | in the sitemap, any set of dozens of pages on one pattern (`/brand/<name>`, `/city/<name>`, `/vs/<name>`): sample 3–5, check whether each has unique, useful content or near-identical boilerplate, and whether they're indexed. Read them before any copy fix | top of the risk list if thin: a proposal to improve, consolidate or noindex, with risk and undo |
| Organization markup on home/About | view-source for JSON-LD | polish (entity) |
| Measurement tags (homepage and one money page) | in the page source: which analytics runs (Google Analytics 4 / Tag Manager, Plausible, Fathom, PostHog, Mixpanel, Segment) and which ad pixels (Meta, Google Ads, LinkedIn, TikTok). It decides how the measurement fix is written: the AI-referral baseline goes into the analytics the site already has; no analytics at all → that becomes part of the measurement fix | blocker for measuring results, not for ranking — say which |

## Per page
| Check | How | Class |
|---|---|---|
| Indexed | `site:domain.com/path` (paid, counted) or Search Console URL Inspection if shared | blocker |
| robots meta / X-Robots-Tag | view-source for `noindex`; `curl -sI` for the header | blocker |
| Status and redirects | `curl -sIL`: final 200; ≤ 1 hop; 301 not 302 for permanent moves; no redirect to the homepage | blocker (4xx/5xx, loops); polish (chains) |
| Canonical | self-referencing, absolute, returns 200 | blocker if it points elsewhere |
| Content visible without JavaScript | `curl` the page and search for the key paragraph and the price; most AI crawlers do not run JavaScript | blocker for AI answers |
| Title / H1 / meta | present, unique, matches the question's intent; title ≲ 60 characters, head term first, brand last | polish (often the fastest win) |
| Answer-first | the first 40–60 words under the H1 answer the question with the entity named and facts stated | polish (core AEO fix) |
| Structured data | read the theme's or CMS's existing JSON-LD first (most Shopify themes already output Product); eligible types valid (Product/Offer, Organization, LocalBusiness, SoftwareApplication, Article, Breadcrumb); values match the visible text; no review markup on Organization; Rich Results Test / validator.schema.org | polish (Product errors on a store page = priority polish) |
| Speed | PageSpeed Insights API `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<url>&strategy=mobile`; use field (CrUX) data when present. Good: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1. Poor: LCP > 4s, INP > 500ms, CLS > 0.25 (75th percentile, 28 days) | polish unless poor on a money page |
| Internal links | how many internal links point to the page, from which strong pages, with what anchor text | polish (the cheapest ranking lever most sites ignore) |
| hreflang (multi-region only) | reciprocal, valid codes, x-default | blocker if wrong |

## Hosts without a fetch tool, or with a limited one
Some hosted fetch tools open only URLs already in the chat and cannot set a user agent: list the URLs you need in the chat so they can be opened. Never ask the human for view-source or other technical steps: mark what you cannot see "not checked — <why>" and gather those items into a short developer checklist in the report.

## Traffic-drop entry (with Search Console)
Tell apart: (1) crawl/indexing (pages dropped out; robots or noindex change), (2) a core update (drop aligned to a published update date across many pages), (3) AI Overviews taking clicks (impressions flat or up, clicks down — not a ranking loss and never reported as one), (4) seasonality (same dip last year).
