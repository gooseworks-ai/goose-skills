# Where buyer evidence lives — and how this playbook can reach it

Load at step 2. Build the source plan from the row for the brand's company type, then mark every source with how it will be read. Proxy paths, query keys and recency options are in `../../../atoms/spend-gate/proxy-endpoints.md`.

## Reachability marks

| Mark | Meaning | Rule |
|---|---|---|
| **brain** | Already in the brand brain (`knowledge_search` evidence/document, `brand_read` sources/organic, synced reviews) | Free. Always read first. Synced reviews come back as ranked snippets — label rows `via synced evidence (snippet)`. |
| **proxy** | Public data through GooseWorks (`../../../atoms/spend-gate/proxy-endpoints.md`) | Paid. Goes through the spend gate (`../../../atoms/spend-gate/ATOM.md`, branch B). |
| **read-by-fetch** | A public page read by the host's own browser, its web-fetch tool, or a shell `curl` — no vendor key, no login | Free, slow, partial. Label every row read this way. Hosted chats without browsing cannot do it. |
| **paste** | The user copies, exports or uploads it (support desk, survey tool, CRM, Seller Central, App Store Connect, Google Business, G2 pages) | Ask once, in the "before you start" message. Ask for raw text, never summaries. Save pasted text with `gooseworks:file_write` (workspace) before mining it, then cite `private:<path>#<date>`. |
| **unreachable** | No sanctioned way today | Name it in the method note as a gap. Never fill it from memory. |

Terms of service and access:
- Trustpilot: only through the server's sanctioned sync (`gooseworks:knowledge_sync`), and only the brand's own confirmed profile — ask the founder to confirm the profile URL first.
- G2 and Capterra forbid automated collection; Amazon requires sign-in for most review pages and forbids scraping. Use the user's paste or export (a human copying 15–20 reviews at human pace), never automated reading, and never log in on the user's behalf.
- Google Business reviews via public APIs are capped at a handful per place and cannot be stored in bulk: ask the owner for their export.

## Sources by company type (most valuable first)

| Type | Own customers and prospects | Competitors' and category customers | Private (ask to paste) | Watch-outs |
|---|---|---|---|---|
| **DTC e-commerce** | On-site review widgets on product pages (Judge.me, Yotpo, Okendo, Stamped, Bazaarvoice — read-by-fetch, sort by lowest and newest), Trustpilot (sync), TikTok/IG comments on own posts and ads (proxy) | Competitor product-page reviews on their own sites and on retailers that show them publicly (Sephora, Ulta, Target, Chewy… — read-by-fetch), Reddit category subs (proxy), TikTok/YouTube review-video comments (proxy), TikTok Shop reviews (proxy) | Post-purchase survey answers, support tickets, return reasons, Meta ad comments, Amazon reviews via Seller Central | Gift buyers ≠ users; incentivised and syndicated reviews; fans of a famous founder are not buyers |
| **B2B SaaS** | G2/Capterra/TrustRadius (paste), Reddit and LinkedIn posts (proxy) | Competitors on the same sites (paste 15–20 each for the top two), "alternatives to X" threads (proxy), HN threads (read-by-fetch) | Raw call-transcript excerpts, CRM win/loss reasons, churn surveys, support tickets, onboarding survey | Reviewer role and company size matter more than demographics; buying committee; "switched from" fields are gold; wrong-side voices (candidates on a recruiting tool's thread) are not buyers |
| **Consumer app** | App Store / Play reviews (read-by-fetch of public pages; shell hosts can use Apple's public lookup for rating and version — see `../../../atoms/spend-gate/proxy-endpoints.md`; or App Store Connect export), TikTok comments (proxy), Reddit (proxy), Discord (paste) | Competitor app reviews (read-by-fetch), category subreddits | Cancel/churn survey, in-app feedback, support | Separate bug/version complaints from job complaints; retention reasons beat install reasons |
| **Marketplace seller** | Amazon/Etsy/Walmart reviews and Q&A (Seller Central export or paste) | Competitor listings' reviews and Q&A (paste) | Returns reasons, buyer messages | Vine/"received free" flags; buyers rarely name the brand; evidence is per listing |
| **Local business** | Google Business reviews (owner export), Yelp, Nextdoor (read-by-fetch), local subreddit (proxy) | Nearby competitors' reviews — usually the main corpus (read-by-fetch) | Front-desk notes, booking-form "how did you hear", call notes | Small volume: add geography to every row |
| **Services firm** | Clutch/Google reviews (read-by-fetch), LinkedIn comments (paste — no proxy route), case-study quotes on the own site | Competitor reviews, founder LinkedIn threads in the niche | Lost-pitch reasons, proposal feedback, client interviews already done | Public evidence is near zero — expect the cold-start path and recommend interviews |
| **Pre-revenue / just launched** | Waitlist answers, beta feedback, launch DMs and comments (paste) — label `about: prospect`, these are the brand's own future buyers | The cold-start ladder below — labelled "category voice, not your buyers" | Founder's own customer-conversation notes | Competitor volume never lifts a run out of cold start |

## Cold-start ladder (few own customers)

1. Own prospects first: waitlist and signup answers, beta feedback, DMs (`about: prospect`).
2. Reviews of the 3–5 closest competitor products — candidates named by the founder, by waitlist "what have you tried" answers, or by one community search, confirmed by the founder before any paid pull. Labelled "category voice, not your buyers".
3. Adjacent products doing the same job.
4. Proxy communities: the category's subreddits, comments under the category's top creators' videos, YouTube review comments.
5. If the floor in SKILL.md step 6 is still unmet: say so and hand over the interview and survey kit.
