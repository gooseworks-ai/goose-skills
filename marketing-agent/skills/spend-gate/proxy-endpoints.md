# Proxy endpoints (companion to the spend-gate atom)

Shared reference for every playbook that reads public data through the GooseWorks proxy. Every call here is **paid** and goes through `SKILL.md` branch B. Reading a single public web page with the host's own browser or fetch needs no proxy ([the `marketing-guide` skill](../marketing-guide/SKILL.md) §3, "Public data"). Call shape: `gooseworks:data_call_provider` with `provider: "scrapecreators"`, `path` and a `query` object. Never put credentials in `query`; never use a vendor key.

Paths and query keys below were checked against the vendor's published OpenAPI spec on 2026-10-16 (`*` = required). If the proxy rejects a path or a key, log it in the credits log and the gaps — never retry with guessed keys or another path.

## Recency rule

Always set the newest-first option and the narrowest recency option that still reaches back to the start of the window you need (research-market's listening: the first day of the window it names — the week option for a 7-day window, the month option otherwise). Endpoints with a recency filter but no date sort (Instagram reels search, YouTube search, LinkedIn post search) return the window in relevance order: page until results run out or the cap is hit and keep only in-window items — never stop at the first page because its oldest item is out of window; if the cap is hit first, the count is a floor. Where an endpoint has no recency option, the coverage line says "relevance-ranked sample, not all mentions" and items outside the window are dropped after reading — never presented as this week's.

## Search and listening

| Need | Path | Query keys | Recency / sort |
|---|---|---|---|
| TikTok videos by keyword | `/v1/tiktok/search/keyword` | `query*`, `region`, `cursor` | `date_posted`: yesterday · this-week · this-month · last-3-months · last-6-months · all-time; `sort_by`: relevance · most-liked · date-posted |
| TikTok by hashtag | `/v1/tiktok/search/hashtag` | `hashtag*`, `region`, `cursor` | none — sample |
| TikTok search suggestions (buyer phrasing) | `/v1/tiktok/search/suggestions` | `query*`, `region` | – |
| TikTok trending feed | `/v1/tiktok/get-trending-feed` | `region*` | current |
| Videos using a TikTok sound | `/v1/tiktok/song/videos` | `clipId`, `cursor` | – |
| Instagram reels by keyword | `/v2/instagram/reels/search` | `query*`, `page` | `date_posted`: last-week · last-month · last-year |
| Instagram general search | `/v1/instagram/search` | `query*` | none |
| Instagram popular searches | `/v1/instagram/search/popular` | `query*`, `cursor` | – |
| Instagram trending reels | `/v1/instagram/reels/trending` | – | current |
| Reels using an Instagram audio | `/v1/instagram/audio/reels` | `audio_id*`, `cursor` | – |
| Posts tagging an Instagram account | `/v1/instagram/user/tagged-posts` | `user_id*`, `cursor` | – |
| YouTube search | `/v1/youtube/search` | `query*`, `type` (videos · shorts · channels · playlists), `region`, `continuationToken` | `uploadDate`: today · this_week · this_month · this_year; `sortBy`: relevance · popular |
| YouTube autocomplete | `/v1/youtube/search/typeahead` | `query*` | – |
| YouTube trending shorts | `/v1/youtube/shorts/trending` | – | current |
| X posts by keyword | `/v1/twitter/search/posts` | `query*`, `cursor` | **none** — relevance sample; drop out-of-window items |
| Reddit search | `/v1/reddit/search` | `query*`, `filter` (posts · comments), `after` | `sort`: relevance · new · top · comment_count; `timeframe`: all · day · week · month · year |
| Reddit subreddit posts | `/v1/reddit/subreddit` | `subreddit*`, `after` | `sort`: best · hot · new · top · rising; `timeframe` |
| Reddit search inside a subreddit | `/v1/reddit/subreddit/search` | `subreddit*`, `query`, `cursor` | `sort`: relevance · hot · top · new · comments; `timeframe`: all · year · month · week · day · hour |
| LinkedIn posts by keyword | `/v1/linkedin/search/posts` | `query*`, `cursor` | `date_posted`: last-hour · last-day · last-week · last-month · last-year |
| LinkedIn company posts | `/v1/linkedin/company/posts` | `url*`, `page` | – |
| Threads search | `/v1/threads/search` | `query*` | `start_date`, `end_date` |
| Pinterest search | `/v1/pinterest/search` | `query*`, `cursor` | none |
| Facebook videos by keyword (no Facebook post search exists) | `/v1/facebook/search/videos` | `query*`, `cursor` | none |
| Google results (titles, questions) | `/v1/google/search` | `query*`, `region`, `page` | `date_posted`: last-hour · last-day · last-week · last-month · last-year |

## Comments

| Platform | Path | Query keys | Notes |
|---|---|---|---|
| TikTok | `/v1/tiktok/video/comments` | `url*`, `cursor` | A comment's link opens the video: cite "comment on <video url>" |
| Instagram | `/v2/instagram/post/comments` | `url*`, `cursor`, `include_replies` | |
| YouTube | `/v1/youtube/video/comments` | `url*`, `continuationToken` | `order`: top · newest |
| Reddit | `/v1/reddit/post/comments` | `url*`, `cursor` | |
| Facebook | `/v1/facebook/post/comments` | `url` or `feedback_id`, `cursor` | |
| LinkedIn | none | – | Comments on LinkedIn posts are not reachable: "paste" |

## Account posts (an author's baseline, a rival's feed)

| Platform | Path | Query keys |
|---|---|---|
| TikTok | `/v3/tiktok/profile/videos` | `handle*`, `sort_by` (latest · popular), `max_cursor`, `region` |
| Instagram posts | `/v2/instagram/user/posts` | `handle*`, `next_max_id` |
| Instagram reels | `/v1/instagram/user/reels` | `handle` or `user_id`, `max_id` |
| YouTube shorts | `/v1/youtube/channel/shorts` | `handle` or `channelId`, `sort` (newest · popular) |
| YouTube videos | `/v1/youtube/channel-videos` | `handle` or `channelId`, `sort` (latest · popular) |

## Profiles, creators and companies

Added for research-audience and work-with-creators (keys checked against the vendor's OpenAPI spec, 2026-10-16). Some of these cost more per call than a search (the audience breakdown in particular): never assume a search's price — estimate from this endpoint's own logged charges, or count its first call as its own probe inside the ceiling.

| Need | Path | Query keys |
|---|---|---|
| TikTok profile | `/v1/tiktok/profile` | `handle` or `user_id`, `cache_max_age` (1d · 3d · 7d · 14d · 30d) |
| TikTok audience breakdown | `/v1/tiktok/user/audience` | `handle*` |
| TikTok accounts by keyword | `/v1/tiktok/search/users` | `query*`, `cursor` |
| Instagram profile | `/v1/instagram/profile` | `handle*`, `cache_max_age` |
| Instagram profiles by keyword | `/v1/instagram/search/profiles` | `query*` |
| Posts tagging an Instagram account | `/v1/instagram/user/tagged-posts` | `user_id*`, `cursor` |
| YouTube channel | `/v1/youtube/channel` | `channelId` or `handle` or `url`, `cache_max_age` |
| YouTube video sponsors | `/v1/youtube/video/sponsors` | `url*`, `language` |
| LinkedIn person profile | `/v1/linkedin/profile` | `url*` |
| LinkedIn company page | `/v1/linkedin/company` | `url*` |
| A creator's other social profiles | `/v1/find-social-profiles` | `platform*` (instagram · tiktok · youtube · x · twitter · facebook), `handle*`, `cache_max_age` |
| A creator's public contact emails | `/v1/find-creator-emails` | `platform*` (same values), `handle*`, `cache_max_age` — personal contact data: the calling playbook's privacy and do-not-contact rules apply, and it is never logged in the credits log |
| Link-in-bio pages | `/v1/linktree`, `/v1/komi`, `/v1/pillar`, `/v1/linkbio`, `/v1/linkme` | `url*`, `cache_max_age` |
| Podcasts and shows | `/v1/spotify/search` | `query*` |

`cache_max_age` lets a repeat read reuse a recent result; set it on repeat lookups of the same profile.

## Reviews

| Need | Path / tool | Notes |
|---|---|---|
| TikTok Shop product reviews | `/v1/tiktok/shop/product/reviews` (`url` or `product_id`, `region`, `page`) | paid |
| Trustpilot (the brand's own confirmed profile only) | `gooseworks:knowledge_sync` | `max_reviews` 1–50 per import; `max_spend_credits` is the credit cap (≤600) |
| Amazon, App Store / Play, G2, Capterra, Google Business, Yelp, on-site review widgets | no proxy route | host browser or fetch (labelled), or the user pastes |

## Ad libraries

| Library | Path / tool | Query keys |
|---|---|---|
| Meta, one advertiser's ads (full library, live check) | `/v1/facebook/adLibrary/company/ads` | `pageId` or `companyName`; `status`: ALL · ACTIVE · INACTIVE; `country`; `media_type`: ALL · IMAGE · VIDEO · …; `sort_by`: total_impressions · relevancy_monthly_grouped; `start_date`, `end_date`, `cursor` |
| Meta, one ad | `/v1/facebook/adLibrary/ad` (+ `/ad/transcript` for video) | |
| LinkedIn ads | `/v1/linkedin/ads/search` | `company` or `companyId` or `keyword`; `countries`; `startDate`, `endDate`; `paginationToken` |
| TikTok ads (mostly EU-delivered) | `/v1/tiktok/ad-library/search` | `query` or `advertiser_name`; `cursor` |
| Google ads | `gooseworks:ads_library_scrape` with `library_provider: "google"` | needs the advertiser's Transparency Center id or URL (ask the human, or find it with `/v1/google/adLibrary/advertisers/search`); it takes a small dollar cap — describe it in words ("a small capped import"), never quote the figure, and report the credits charged afterwards |

## Not available through GooseWorks today

Generic web page fetch, web search beyond `/v1/google/search` results, search-interest/Trends, keyword volume, app-store reviews, Amazon reviews. Use the host's own browser or fetch (label rows `read-by-fetch`), a shell `curl` of a public page on hosts that have one (for apps, Apple's public lookup `https://itunes.apple.com/lookup?id=<app id>&country=<market>` gives rating, count, version and release notes), or ask the user to paste. Never a vendor key.
