# Coverage: which checks each tool opens

Load at step 1. It says what counts as "available" for each tool, and which tools each of the 51 checks needs. The check's own text (ask, steps, check, then) comes from the playbook index (`playbook-index.md`); this table only decides **what can run**. A test in this repo keeps it in step with the index.

## When a tool counts as available

A tool is **available** when one of these holds this run. Say which one, per tool, in the opening message.

| Key | The marketer's tool | Live (best) | Also counts |
|---|---|---|---|
| `meta` | Meta Ads | a Meta Ads connector the host lists, read-only | an Ads Manager export (ad, ad set, spend, purchases, link URL, optimization event, by day and country). GooseWorks' own Meta read (`gooseworks:meta_read`, view `performance`) covers only ads GooseWorks made: it is a cross-check, never "Meta is connected" |
| `google` | Google Ads | a Google Ads connector, read-only | campaign, conversion action and search terms reports |
| `tiktok` | TikTok Ads | a TikTok Ads connector | an ads report export |
| `shopify` | Shopify (or the store platform) | a store connector, read-only scopes | orders with line items and discount codes, products with inventory and cost, discounts. A different store platform counts when it exports the same fields |
| `klaviyo` | Klaviyo (or the email tool) | an email-tool connector, read-only key | flow and message performance by week, campaign report, sign-up form report |
| `ga4` | Google Analytics | GooseWorks' analytics read (`gooseworks:analytics_read`) when the brand connected Google Analytics there, or a GA4 connector | funnel, landing page and traffic source exports |
| `merchant` | Google Merchant Center | a connector | the diagnostics export |
| `amazon` | Amazon Seller Central | a connector | the business report export |
| `gsc` | Google Search Console | a connector | the performance export. No check needs it today; a check that adds it later will |
| `adlibrary` | Meta Ad Library | no login: the host's browser or fetch on the brand's public Ad Library page | screenshots and link URLs the marketer pastes; a paid bulk read only to deepen (step 3) |
| `browser` | The store as a shopper sees it | the host's browser, phone-sized where the check says so | the host's fetch for text-only checks; pasted screenshots otherwise |
| `search` | Web search | the host's web search | none |
| `dns` | Public DNS | the host's fetch of a public DNS lookup for the sending domain | the marketer pastes the records |
| `reviews` | Public reviews | the host's browser or fetch on the brand's public review pages | an export of reviews from the review tool |
| `social` | The brand's social accounts | GooseWorks' social reads (`gooseworks:social_account_list`, then `gooseworks:social_analytics_get`) for the brand's own TikTok and Instagram, or a connector | the public profile in the host's browser (reach is then a first look) |

**Never claim a connector you can't see.** A connector is available only when the host lists it and one read-only call returns data. An export counts only once it is in hand. A tool the brand doesn't use (no TikTok, no Amazon) is **not used**, not "missing": its checks are skipped without a nudge.

**One check can still run with less.** A check whose **Adds** tool is missing runs without it and says what that tool would add (usually the money). A check with "one of" runs on the ad platforms the brand has, and names the ones it covered.

## The 51 checks

Leaks first, then plays, each by name. `Needs`: every tool listed must be available ("one of": at least one). `Adds`: optional; it sizes or confirms the finding.

| Check | Kind | Needs | Adds | Cadence |
|---|---|---|---|---|
| `abandoned-cart-email-not-sending` | leak | `klaviyo` + `shopify` | — | Monthly |
| `ad-price-different-from-landing-page` | leak | `adlibrary` + `browser` | — | Weekly |
| `ad-sets-spending-with-no-sales` | leak | one of `meta`, `tiktok` | — | Twice a week |
| `ads-optimizing-for-wrong-conversion` | leak | one of `google`, `meta` | — | Monthly |
| `ads-running-on-sold-out-products` | leak | `shopify` + one of `meta`, `google` | — | Daily |
| `ads-showing-in-countries-you-dont-ship` | leak | `meta` + `shopify` | — | Monthly |
| `ads-stopped-spending-limit-payment` | leak | one of `meta`, `google`, `tiktok` | — | Daily |
| `back-in-stock-emails-not-sending` | leak | `klaviyo` + `shopify` | — | Weekly |
| `bestsellers-missing-from-meta-ads` | leak | `shopify` + `meta` | — | Monthly |
| `bot-traffic-skewing-conversion-rate` | leak | `ga4` + `shopify` | — | Weekly |
| `check-email-domain-dmarc-record` | leak | `dns` | — | Once, then quarterly |
| `competitor-launched-a-sale` | leak | `adlibrary` + `browser` | — | Daily |
| `conversion-rate-dropped-on-every-channel` | leak | `ga4` + `shopify` | — | Weekly |
| `creator-discount-code-on-coupon-sites` | leak | `search` | `shopify` | Monthly |
| `discount-codes-stacking-on-promotions` | leak | `shopify` | — | Monthly |
| `email-signup-popup-stopped-working` | leak | `klaviyo` + `ga4` | `shopify` | Weekly |
| `expired-sale-ads-still-running` | leak | `adlibrary` | — | Weekly |
| `google-ads-search-terms-not-converting` | leak | `google` | — | Monthly |
| `klaviyo-flow-stopped-sending` | leak | `klaviyo` | — | Weekly |
| `klaviyo-missing-email-flows` | leak | `klaviyo` | — | Quarterly |
| `landing-page-slow-on-mobile` | leak | `browser` | — | Monthly |
| `lapsed-customers-no-win-back-email` | leak | `shopify` + `klaviyo` | — | Monthly |
| `meta-counting-purchases-twice` | leak | `meta` + `shopify` | — | Weekly |
| `meta-pixel-not-tracking-purchases` | leak | `meta` + `shopify` | — | Daily |
| `mobile-checkout-losing-sales` | leak | `browser` | — | Monthly |
| `offer-weaker-than-competitors` | leak | `browser` | — | Monthly |
| `product-ads-landing-on-homepage` | leak | `meta` | `ga4` | Monthly |
| `products-disapproved-google-merchant-center` | leak | `merchant` + `shopify` | — | Weekly |
| `shopify-discount-code-stopped-working` | leak | `shopify` + `klaviyo` | — | Weekly |
| `shopify-orders-not-shipped` | leak | `shopify` | — | Daily |
| `ask-lapsed-customers-why-they-never-returned` | play | `shopify` + `klaviyo` | — | Twice a year |
| `check-amazon-sales-before-cutting-meta-ads` | play | `meta` + `shopify` + `amazon` | — | Before any big cut |
| `decide-what-to-restock-from-past-stockouts` | play | `shopify` | — | Before each stock order |
| `do-deep-first-discounts-hurt-repeat-rate` | play | `shopify` | — | Twice a year |
| `email-past-buyers-about-launches-restocks` | play | `shopify` + `klaviyo` | — | Every launch |
| `find-ad-angles-you-have-never-tried` | play | `meta` + `adlibrary` | — | Monthly |
| `find-customer-objections-your-ads-miss` | play | `reviews` + `adlibrary` | — | Monthly |
| `find-regions-buying-below-population-share` | play | `shopify` + `meta` | — | Twice a year |
| `get-products-recommended-by-ai-shopping-assistants` | play | `browser` + `search` | — | Monthly |
| `measure-how-late-deliveries-hurt-repeat-orders` | play | `shopify` | — | Twice a year |
| `measure-roas-after-returns-and-refunds` | play | `shopify` + one of `meta`, `google` | — | Quarterly |
| `run-ads-when-competitor-product-sells-out` | play | `browser` + `adlibrary` | — | Daily |
| `sell-slow-moving-stock-before-discounting` | play | `shopify` + `klaviyo` | — | Quarterly |
| `set-free-shipping-threshold-from-order-data` | play | `shopify` | — | Quarterly |
| `shift-ad-spend-before-products-sell-out` | play | `shopify` + one of `meta`, `google` | — | Weekly before a peak |
| `show-bundle-offer-on-product-pages` | play | `shopify` + `ga4` | — | Once |
| `stop-low-margin-products-eating-shopping-budget` | play | `shopify` + `google` | `merchant` | Quarterly |
| `turn-best-organic-posts-into-ads` | play | `social` + `meta` | — | Monthly |
| `turn-email-subject-lines-into-ad-hooks` | play | `klaviyo` + `meta` | — | Quarterly |
| `use-customer-review-language-in-product-copy` | play | `reviews` + `browser` | — | Quarterly |
| `when-to-reorder-new-product-launch` | play | `shopify` | — | Weekly |

## What a common setup can run (worked examples, counted from the table)

- **No logins at all** (the store's address only): **12** checks.
- **Store only** (`shopify` plus the no-login tools): **19** — those 12 (the coupon-site check now sized) and 7 store-only checks.
- **Store, Meta Ads and the email tool** (`shopify`, `meta`, `klaviyo` plus no-login): **43**.
- These are examples to show the shape; count the run's own tools from the table, and never quote these as the brand's numbers.
