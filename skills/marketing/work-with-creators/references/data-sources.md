# Data sources and credits

Load at steps 2–3 (free pass) and step 7 (the top-up estimate). No vendor keys anywhere; paid public data goes through the GooseWorks proxy.

## The free pass (always first, no yes needed)

| Need | Free source |
|---|---|
| Brand, products (price; unit cost only if stored — usually not), kit, rivals, the brand's and rivals' recent organic posts with numbers and captions (collabs show here) | `gooseworks:brand_read` (summary, kit, products, competitors, organic, accounts, learnings) |
| Claims — never read here: always through the `claims-gate` skill (`../../claims-gate/SKILL.md`) | — |
| Past creator deals and rates, persona, creators in talks | `gooseworks:knowledge_search`; workspace `research/audience/buyer-groups.md` |
| Saved outlier posts and the creators behind them | `gooseworks:social_inspiration_library`, `gooseworks:social_inspiration_search` |
| Rival roster and records; a campaign's creator leg | `gooseworks:competitor_read`, workspace `research/competitors/`; `gooseworks:campaign_read` |
| Earlier roster, reports, briefs; the credits log | `gooseworks:file_list`, `gooseworks:file_read` (brand coworker workspace) |
| Finding creators | host web search (roundups, agency lists, "#ad <rival>", problem phrases); TikTok, Instagram and YouTube search, hashtag and profile pages in the host browser; the Meta Ad Library in the browser for rivals' partnership ads |
| Public vetting numbers | each finalist's profile and post pages in the host browser — what each platform shows is in `vetting.md` §15 |
| Media kits, rates pages, newsletter sponsor pages | link-in-bio and advertise pages in the host browser |
| Brand-safety name search | host web search |

Read as a person would; no bulk scraping, no scripted paging, no logins. A hosted chat without web search or a browser: say so in "what we could not read", build what the brain gives (rivals' collabs, Inspiration, the brand's own tags), and make the top-up the way to a shortlist.

## The paid top-up (only after the free result, one yes)

What it adds, in plain words: numbers the public pages hide, comment reads at volume, transcripts for claims and safety, audience countries for the top picks, wider discovery, and public business contacts for approved names. Through `gooseworks:data_call_provider` (provider `scrapecreators`):

| Need | Paths |
|---|---|
| Wider discovery | TikTok `/v1/tiktok/search/keyword`, `/v1/tiktok/search/users`, `/v1/tiktok/search/hashtag`, `/v1/tiktok/creators/popular`; Instagram `/v1/instagram/search/profiles`, `/v2/instagram/reels/search`, `/v1/instagram/search/hashtag`; YouTube `/v1/youtube/search`; LinkedIn `/v1/linkedin/search/posts`; X `/v1/twitter/search/posts`; Threads `/v1/threads/search/users`; podcasts `/v1/spotify/search`; web `/v1/google/search` |
| Who tags the brand (behind a login) | `/v1/instagram/user/tagged-posts` |
| Rivals' partnership ads at volume | `/v1/facebook/adLibrary/company/ads`, `/v1/facebook/adLibrary/search/ads` |
| Full post history and hidden numbers | TikTok `/v1/tiktok/profile`, `/v3/tiktok/profile/videos`; Instagram `/v1/instagram/profile`, `/v2/instagram/user/posts`, `/v1/instagram/user/reels`; YouTube `/v1/youtube/channel`, `/v1/youtube/channel-videos`, `/v1/youtube/channel/shorts`; LinkedIn `/v1/linkedin/profile`; X `/v1/twitter/profile`, `/v1/twitter/user-tweets`; Threads `/v1/threads/user/posts` |
| Comments at volume | `/v1/tiktok/video/comments`, `/v2/instagram/post/comments`, `/v1/youtube/video/comments` |
| Transcripts (claims and safety on video) | `/v1/tiktok/video/transcript`, `/v2/instagram/media/transcript`, `/v1/youtube/video/transcript` |
| Sponsor history | `/v1/youtube/video/sponsors` (experimental — a lead, not proof) |
| Audience countries (TikTok only; pricier) | `/v1/tiktok/user/audience` — reach and install roles, top five picks at most |
| Public business contact — **only for names the founder approved** | `/v1/find-creator-emails`; link-in-bio reads |

Not used, on purpose: `/v1/detect-age-gender` (never infer protected traits); follower lists for audience "analysis" (privacy, cost).

## Credits

Spending follows the `spend-gate` skill (`../../spend-gate/SKILL.md`) (proxy branch): a probe with the human's yes for an endpoint with no logged charge, then a yes to "up to N credits", labelled an estimate, drawn from logged charges; stop at it. `gooseworks:data_price_provider` does not price these lookups (server-needs #2). Every charge is logged in `research/credits-log/<YYYY-MM>.md` (`date | playbook | tool/endpoint | query kind | items | credits`). A resubmitted paid call pays again.

Lookup counts for the estimate when a top-up only deepens a free result (approximate): **hidden numbers ~2 per finalist** (profile + posts); **deeper vetting ~10–15 per paid pick** (profile 1, posts 2–4, comments ~5, transcripts 2–3, link-in-bio 1, name search 1, competitor ad checks 1–3); **light vetting ~4 per seeding finalist**; audience countries as their own line (a notably pricier lookup); business contacts after the human approves the names, ~1–2 each. Avoid `gooseworks:social_inspiration_watch` unless a saved video truly can't be judged from metadata and transcript — it is materially more expensive.

The paths above say only what to pull and why. Query keys, recency options, paging and per-endpoint pricing notes are in `../../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill) ("Profiles, creators and companies" and the search sections) — use them from there.
