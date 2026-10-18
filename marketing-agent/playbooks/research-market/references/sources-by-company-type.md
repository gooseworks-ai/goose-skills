# Where buyer evidence lives — and how this playbook reaches it

Load in the buyer-voice worker. Pick the row for the brand's company type; the free pass reads every free source on it before the founder hears anything. Proxy paths for the paid top-up are in `../../../atoms/spend-gate/proxy-endpoints.md`.

## How each source is read

| Mark | Meaning | Rule |
|---|---|---|
| **brain** | Already in the brand brain (`knowledge_search` evidence/document, `brand_read` sources/organic, synced reviews, earlier research files) | Free. Read first. Synced reviews come back as ranked snippets — label rows `via synced evidence (snippet)`. |
| **search** | The host's web search, including `site:` queries (`site:reddit.com "<brand>"`, `site:g2.com "<rival>"`) | Free. Use it freely to find threads, review pages and comparison posts. |
| **browser** | A public page opened in the host's browser or web fetch and read the way a person would | Free. Page by page: a few pages per source, sorted by lowest and newest. No scripts paging through hundreds, no logging in, no fake accounts. Sort by lowest and newest where the site allows; where it doesn't, say stratification wasn't possible. Rows from a summarising fetch tool are `capture: fetch-excerpt` (`references/mining-method.md` § Quote integrity). |
| **paste** | Private material only the founder has (support desk, survey answers, cancel reasons, call notes, CRM win/loss, Seller Central, App Store Connect, Google Business exports) | Asked for in the closing message, named specifically, only when it would change the answer. Saved with `gooseworks:file_write` before mining; cited `private:<path>#<date>`. Never ask the founder to copy public reviews. |
| **proxy** | Bulk public social data through GooseWorks | Paid. Only as the top-up offered in the closing message, under one yes (`../../../atoms/spend-gate/ATOM.md` branch B). |
| **unreachable** | No sanctioned way today, or the page needs a login | On the "couldn't read" list with what it would add. Never filled from memory. |

Access rules:
- Review sites (G2, Capterra, TrustRadius, Gartner Peer Insights, Trustpilot, app stores, retailer reviews): public pages read in the host browser at human pace. If a site blocks the browser or fetch, use what search results and the site's public snippets show, and say how many reviews were actually read.
- Only a site's own public pages: never unofficial mirrors, scraped copies or unofficial APIs of a platform (Reddit archives and front-ends, review-site scrapers). The Wayback Machine is fine for a page's history.
- Trustpilot bulk import of the brand's own confirmed profile goes only through the server's sync (`gooseworks:knowledge_sync`), on a yes.
- Amazon review pages that need sign-in, Google Business reviews beyond the handful shown publicly, LinkedIn comments behind a login: couldn't-read, or the owner's export in the closing message.

## Sources by company type (most valuable first)

| Type | Own customers and prospects | Rivals' and category customers | Private (closing message, only if needed) | Watch-outs |
|---|---|---|---|---|
| **DTC e-commerce** | On-site review widgets on product pages (browser, sort lowest and newest), Trustpilot (browser), TikTok/IG/YouTube comments on own posts (browser where public), Reddit threads naming the brand (search + browser) | Rivals' product-page reviews and public retailer reviews (Sephora, Ulta, Target, Chewy… — browser), the category's subreddits, review-video comments | Post-purchase survey answers, support tickets, return reasons, Amazon reviews via Seller Central | Gift buyers ≠ users; incentivised and syndicated reviews; fans of a famous founder are not buyers |
| **B2B SaaS** | G2, Capterra, TrustRadius, Gartner Peer Insights (browser), Reddit and HN threads (search + browser), LinkedIn posts that are public (search), case studies on the brand's site (curated) | The same review sites for the 3–5 closest rivals, "alternatives to <rival>" and "switched from <rival>" threads, comparison posts written by buyers (not vendors) | Call-transcript excerpts, CRM win/loss reasons, churn surveys, support tickets | Reviewer role and company size matter more than demographics; buying committee; "switched from" fields are gold; vendor-written "alternatives" pages are rivals' marketing, never buyer quotes; wrong-side voices (candidates on a recruiting tool's thread) are not buyers |
| **Consumer app** | App Store / Play review pages (browser; shell hosts can use Apple's public lookup for rating and version), Reddit, TikTok comments where public | Rivals' app reviews, the category's subreddits | Cancel survey, in-app feedback, support, Discord | Separate bug/version complaints from job complaints; retention reasons beat install reasons |
| **Marketplace seller** | Public listing reviews and Q&A (browser, where visible without sign-in) | Rivals' listings' reviews and Q&A | Seller Central export, returns reasons, buyer messages | Vine / "received free" flags; buyers rarely name the brand; evidence is per listing |
| **Local business** | Google Business reviews shown publicly, Yelp, Nextdoor (browser), local subreddit | Nearby rivals' reviews — usually the main corpus | Owner's review export, front-desk notes, booking-form "how did you hear" | Small volume: add geography to every row |
| **Services firm** | Clutch and Google reviews (browser), case-study quotes on the brand's site, the founder's public LinkedIn threads | Rivals' reviews and case studies, niche communities | Lost-pitch reasons, proposal feedback, client interviews already done | Public evidence is thin — expect the cold-start path and recommend interviews |
| **Pre-revenue / just launched** | Launch posts' comments, Product Hunt, waitlist pages (browser); waitlist answers and beta feedback (paste) — `about: prospect` | The cold-start ladder below — labelled "category voice, not your buyers" | Founder's own customer-conversation notes | Rival volume never lifts a run out of cold start |

## Cold-start ladder (few own customers)

All free, all in the free pass:
1. Own prospects: launch comments, Product Hunt, public waitlist or community posts (`about: prospect`).
2. Reviews of the 3–5 closest rival products — from the roster, suggestions and a web search, labelled "category voice, not your buyers".
3. Adjacent products doing the same job.
4. The category's communities: subreddits, creator review comments, YouTube review comments.
5. If the floor (`recognition-and-interviews.md` § The evidence floor) is still unmet after all of that: the report says so, shows what was read, and hands over the interview and survey kit.
