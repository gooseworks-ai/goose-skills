# Focused social data reads

Return the rows or ranking the marketer requested. A data list does not require a strategy, calendar or full report. Do the shared connection/brand setup when the request is brand-specific, then load only the relevant source section of `../spend-gate/proxy-endpoints.md` (the spend-gate skill). Paid calls keep its quote/ceiling gate; stop before another page would exceed the approved ceiling.

## Read and deliver

1. Resolve the account, exact topic/hashtag, requested count and time window from the ask. If the timezone matters and is unknown, state the timezone used. The response's actual published timestamp decides inclusion.
2. Use the named endpoint's documented pagination token. Deduplicate on platform post id or canonical URL, not text. Keep returned engagement values, including zero; absent values stay unknown.
3. Continue until the requested count/window is covered, results end, a token repeats, or the approved ceiling is reached. An error or early stop yields a partial list with its reason, not a claim that no more posts exist.
4. Deliver a compact table or requested CSV: link, author, published date, text/caption and the requested measures. Include the source, fetched-at date, filter/ranking and coverage in a short note. CSV cells preserve quotes/newlines and escape spreadsheet formulas from untrusted text. Save personal rows only in the permitted workspace/download, not the brand brain.

## Match the exact request

| Request | Method and completion |
|---|---|
| Last 30 Instagram posts with likes | Account posts, newest-first where supported; follow the returned `next_max_id`. Return thirty unique posts or the actual smaller count with the stopping reason. Preserve unavailable likes as unknown. |
| Top TikToks for a hashtag this week | Exact hashtag endpoint first. Verify hashtag membership and timestamps; drop out-of-window posts, then sort the retrieved in-window sample by the requested measure. A keyword search may find candidates, but is not proof of exact hashtag membership or exhaustive coverage. Say "highest-liked in the sample" unless coverage actually establishes more. |
| Most-liked LinkedIn topic posts this month | Topic post search, the documented window and cursor. Filter exact dates; paginate relevance-ranked pages without assuming the first old item ends the window. Sort by likes if the response exposes likes. Otherwise name total reactions accurately and state that LIKE-only ranking could not be established. Never label a rolling last-month window as a complete calendar month. |
| Top LinkedIn voices in a topic/country | Group actual topic posts by author; verify the requested geography from a profile/source, and rank by the specified audience or recent topic-engagement measure. State sample size and unknowns. Neither cross-platform followers nor a few discovered authors establish an exhaustive LinkedIn top-50 directory. |
| People complaining about a problem | Themes and quoted evidence use research-market; a requested list of fitting named authors uses research-audience's existing pain-language/list method. Do not add everyone who reacted as though they expressed that pain. |

For a focused run, do not widen into account audits or posting recommendations unless the marketer requests them. If the source lacks the necessary period, measure or identity, show the exact shortfall rather than silently changing the question.
