---
name: scrapecreators-api
description: Provider reference for collecting public profiles, posts, comments, transcripts, trends, and ad-library data from major social platforms through ScrapeCreators. Use as a dependency of research workflows, not as the final user-facing deliverable.
---

# ScrapeCreators API

Use ScrapeCreators when a workflow needs structured public social or ad-library data at a scale that ordinary web search cannot provide.

## Runtime selection

Task skills describe each request as an environment-neutral operation containing `provider`, `method`, `path`, and optional `query` or `body`. Execute that same operation through the first available runtime:

1. **GooseWorks MCP available:** inspect and call the live `call_data_provider` tool. Pass the operation fields directly. This is the preferred path in ChatGPT, Cowork, and any client without a terminal. It uses the first-party GooseWorks ScrapeCreators proxy and managed key; it does not route through Orthogonal.
2. **Local GooseWorks CLI available:** translate the operation into `gooseworks call <provider> <path>`, adding the method, query, or body options represented in the operation. The CLI uses the same first-party proxy.
3. **User-owned ScrapeCreators key available:** call `https://api.scrapecreators.com<path>` with `SCRAPECREATORS_API_KEY` in the `x-api-key` header, using the operation's method, query, and JSON body.
4. **No runtime available:** ask the user to connect GooseWorks MCP, sign in through the local GooseWorks CLI, or provide their own ScrapeCreators key. Do not pretend the operation ran.

Prefer MCP whenever `call_data_provider` is registered, even if a shell might also exist. Never ask for a separate provider key when the managed MCP or CLI path is available. Never print, store, or return either credential.

Example operation:

```yaml
provider: scrapecreators
method: GET
path: /v1/instagram/profile
query:
  handle: brand
```

Use ScrapeCreators' official OpenAPI as the endpoint source of truth: `https://docs.scrapecreators.com/openapi.json`. Do not use Orthogonal search or details to discover ScrapeCreators operations because its mirrored catalog can be incomplete.

## Endpoint families

| Need | Common endpoint |
|---|---|
| Instagram profile, posts, or comments | `/v1/instagram/profile`, `/v2/instagram/user/posts`, `/v1/instagram/post`, `/v2/instagram/post/comments` |
| TikTok profile, posts, search, trends | `/v1/tiktok/profile`, `/v3/tiktok/profile/videos`, `/v2/tiktok/video`, `/v1/tiktok/search/hashtag`, `/v1/tiktok/get-trending-feed` |
| YouTube video, channel, transcript, comments | `/v1/youtube/video`, `/v1/youtube/channel`, `/v1/youtube/video/transcript`, `/v1/youtube/video/comments` |
| X profile, posts, or post details | `/v1/twitter/profile`, `/v1/twitter/user-tweets`, `/v1/twitter/tweet` |
| LinkedIn profile, company, posts, or ads | `/v1/linkedin/profile`, `/v1/linkedin/company`, `/v1/linkedin/post`, `/v1/linkedin/ads/search` |
| Meta Ad Library | `/v1/facebook/adLibrary/search/ads`, `/v1/facebook/adLibrary/ad` |
| TikTok Ad Library | Resolve the current search and ad-detail operations from the official OpenAPI |
| Google advertiser ads | `/v1/google/company/ads`, `/v1/google/ad` |
| TikTok Shop products, reviews, and creator showcases | Resolve the current shop search, product, review, and user-showcase operations from the official OpenAPI |
| Instagram and YouTube discovery | Resolve current Reel, audio, Shorts, hashtag, search, and trend operations from the official OpenAPI |
| Reddit, Threads, Bluesky, and Pinterest research | Resolve current search, profile, post, comment, board, and pin operations from the official OpenAPI |
| Public creator links and shops | Resolve current Linktree, Komi, Pillar, Linkbio, Linkme, and Amazon Shop operations from the official OpenAPI |

Most operations are GET requests. ScrapeCreators' official OpenAPI currently also defines POST variants for Meta ad search, Meta company ads, and Reddit post comments. Use POST only when the official operation requires it:

```yaml
provider: scrapecreators
method: POST
path: /v1/facebook/adLibrary/search/ads
body:
  query: running shoes
  country: US
```

Endpoint names can change. If a request fails or the exact parameters are unclear, read `https://docs.scrapecreators.com/openapi.json` before guessing.

## Collection rules

1. Confirm platform, market, time window, and sample size.
2. Start with a small request and inspect the response shape.
3. Follow the returned cursor until the requested sample is reached or no cursor remains.
4. Keep the raw source URL, creator handle, platform, publication date, and engagement fields with every item.
5. Deduplicate by platform-native content ID or canonical URL.
6. Separate facts returned by the API from conclusions inferred during analysis.
7. Do not use follower count as a proxy for audience fit or post quality.

## Output contract

Provider calls should return a normalized source set for the parent workflow:

```json
{
  "platform": "instagram",
  "query": "brand",
  "collected_at": "ISO-8601",
  "items": [{"id":"...","url":"...","author":"...","published_at":"...","text":"...","metrics":{}}],
  "next_cursor": null,
  "limitations": []
}
```

This is a provider skill. Do not stop after dumping API output; return control to the research skill that requested the data.
