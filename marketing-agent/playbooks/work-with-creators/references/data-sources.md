# Data sources and credits

Load at steps 2–4 and at each credit gate. No vendor keys anywhere; paid public data goes through the GooseWorks proxy.

## Free (read these first)

| Need | Tool |
|---|---|
| Brand, products (price; unit cost or margin only if the brand stored it — usually not), kit, competitors, the brand's and competitors' recent organic posts with views/likes/comments and captions (competitor collabs show up here) | `gooseworks:brand_read` (sections summary, kit, products, competitors, organic, accounts) |
| Claims — never read here: always through `../../../atoms/claims-gate/ATOM.md` (it reads the sign-off from `brand_read` learnings) | — |
| Past creator deals and rates, persona, creators in talks | `gooseworks:knowledge_search` |
| listen-social's saved outlier posts and the creators behind them | `gooseworks:social_inspiration_library`, `gooseworks:social_inspiration_search` |
| Competitor roster and profiles | `gooseworks:competitor_read` |
| A campaign's creator leg | `gooseworks:campaign_read` |
| Earlier roster, near-misses, briefs; the shared credits log | `gooseworks:file_list`, `gooseworks:file_read` (brand coworker workspace) |

## Paid (through `gooseworks:data_call_provider`, provider `scrapecreators`)

Paths are from the provider's public documentation as checked on 2026-10-16. The live tool is the truth: if a path is refused or changed, say so in one line and use another route.

| Need | Paths |
|---|---|
| Discovery by search | TikTok `/v1/tiktok/search/keyword`, `/v1/tiktok/search/users`, `/v1/tiktok/search/hashtag`, `/v1/tiktok/creators/popular`; Instagram `/v1/instagram/search/profiles`, `/v2/instagram/reels/search`, `/v1/instagram/search/hashtag`; YouTube `/v1/youtube/search`; LinkedIn `/v1/linkedin/search/posts`, `/v1/linkedin/post`; X `/v1/twitter/search/posts`; Threads `/v1/threads/search/users`; podcasts `/v1/spotify/search`; newsletters and media kits `/v1/google/search` |
| Brand-safety name search; newsletters; media kits | `/v1/google/search` |
| Who already tags the brand | `/v1/instagram/user/tagged-posts` (on the brand's own handle) |
| Competitor partnership ads | `/v1/facebook/adLibrary/company/ads`, `/v1/facebook/adLibrary/search/ads` |
| Profile and recent posts (the vetting sample) | TikTok `/v1/tiktok/profile`, `/v3/tiktok/profile/videos`; Instagram `/v1/instagram/profile`, `/v2/instagram/user/posts`, `/v1/instagram/user/reels`; YouTube `/v1/youtube/channel`, `/v1/youtube/channel-videos`, `/v1/youtube/channel/shorts`; LinkedIn `/v1/linkedin/profile` (and recent posts via post search); X `/v1/twitter/profile`, `/v1/twitter/user-tweets`; Threads `/v1/threads/user/posts` |
| Comments to read | `/v1/tiktok/video/comments`, `/v2/instagram/post/comments`, `/v1/youtube/video/comments` |
| Transcripts (claims and safety on video) | `/v1/tiktok/video/transcript`, `/v2/instagram/media/transcript`, `/v1/youtube/video/transcript` |
| Sponsor history | `/v1/youtube/video/sponsors` (experimental — a lead, not proof) |
| Audience countries (TikTok only; a notably pricier lookup — read its charge from the first answer) | `/v1/tiktok/user/audience` — reach and install roles only, at most the top five finalists, shown as its own line at Gate 2 |
| Media kit, rates page | link-in-bio pages `/v1/linktree`, `/v1/komi`, `/v1/pillar`, `/v1/linkbio`, `/v1/linkme` |
| Public business contact — **only for names the human approved** (step 8) | `/v1/find-creator-emails`; link-in-bio pages |

Not used, on purpose: `/v1/detect-age-gender` (never infer protected traits); follower lists for audience "analysis" (privacy, cost).

## Credits

Spending follows `../../../atoms/spend-gate/ATOM.md` (proxy branch): a probe with the human's yes for an endpoint with no logged charge, then a yes to "up to N credits", labelled an estimate, drawn from logged charges; stop at it. `gooseworks:data_price_provider` does not price these lookups (server-needs #2). Every charge is logged in `research/credits-log/<YYYY-MM>.md` (`date | playbook | tool/endpoint | query kind | items | credits`). A resubmitted paid call pays again.

Lookup counts for the estimate (approximate): **discovery 60–90** (searches, then profile reads for the top ~25 of the quick screen); **full vetting ~15 per finalist** (profile 1, posts 2–4, comments ~5, transcripts 2–3, link-in-bio 1, name search 1, competitor ad checks 1–3); **light vetting ~4 per seeding finalist**; audience countries as their own line (a notably pricier lookup); business contacts after the human approves the names, ~1–2 each. Avoid `gooseworks:social_inspiration_watch` unless a saved video truly can't be judged from metadata and transcript — it is materially more expensive.

The paths above say only what to pull and why. Query keys, recency options, paging and per-endpoint pricing notes are in `../../../atoms/spend-gate/proxy-endpoints.md` ("Profiles, creators and companies" and the search sections) — use them from there.
