# Server needs — listen-social

Checked against the GooseWorks staging tool list on 2026-10-16. Each need: what, which step, what the playbook does meanwhile.

| # | Need | Step | Meanwhile |
|---|---|---|---|
| 1 | **Brand-mention search** like `competitor_research mentions`, for the brand itself (and its founder and products), with stored, free-to-reread results. Today mentions exist only for tracked competitors. | 3–4 | Brand queries go through raw ScrapeCreators search endpoints via `data_call_provider` (paid), paged per queries-and-coverage § Reaching the counting week, at most 3 pages per query. |
| 2 | **A read path for stored competitor mention results** (the tool says they are stored and free to read, but no read tool or view is documented). | 3 | Mentions are only ever called inside the approved paid stage; last week's items file is the record. |
| 3 | **A free price check for ScrapeCreators calls.** | 3 (spend gate) | At most one probe per run on a yes, its result kept; later runs estimate from the shared credits log. |
| 4 | **Review and community surfaces**: Google Business, Yelp, Nextdoor, App Store / Play, Amazon reviews and Q&A, G2, Trustpilot on the listening path; Discord/Slack with the brand's own authorisation. | 1 (coverage) | Named as not covered; the human can paste. |
| 5 | **A reply queue in the product**: drafts attached to the item, with status (sent / skipped) the human sets — and later, sending from the product (run-organic-social's parked reply part). | 10–11 | Queue is a workspace file plus chat. |
| 6 | **A price and an enforced credit ceiling for agent automations.** | 12 | Two options offered: free sources only, or paid pulls up to a standing weekly credit total the human approves as such, written into the prompt (not enforced server-side — said to the human); the coworker's own run cost shown after week one. |
| 7 | **Spike watcher** (mentions or negative share above a threshold between weekly runs) — the reactive twin (parking lot P2, watch-and-alert backlog). | 9 | Weekly pass only; S1/S2 lateness is said out loud. |
| 8 | **Sound/format trend data with history** (use counts per sound over time, commercial-licence flag). | 8 | Trending-feed pulls and sound-use counts compared with last week's report; audio rights stated as a check for the human. |
| 9 | **Author baseline in one call** (median views of an account's last N posts). | 7 | One paid profile-posts pull per candidate, capped to the top ~10. |
| 10 | **A structured listening record** (mention counts by class and platform per week) that analyze-performance can query instead of parsing a document header. | 11 | Fixed header lines in the report file and knowledge document. |
| 11 | **Escalation contact field** in operating rules (who to wake, how). | Before you start, 9 | Asked once, stored in `social/listening/watchlist.md`. |
| 12 | **LinkedIn comments and a recency filter on X search.** LinkedIn post search exists (with a recency filter, up to last-year) but no comments endpoint; X search has no date filter, so X results are a relevance sample. | 3–4 | LinkedIn comments by paste; X marked "relevance sample" in the coverage table. |
| 13 | **Agent-proposed learnings the human accepts later** — `brand_update patch.facts` refuses agent proposals. | 11 | Themes saved as learnings only on the human's yes, quoting their reply as `user_statement`. |
| 14 | **A push or notification from a standing run** (S1/S2 found unattended) — the weekly automation only writes a report. | 12 | Said plainly at opt-in: the standing run is a report, not an alert. |
| 15 | **Fact text over 300 characters is cut silently; the engines read only the 8 newest facts** (cross-set review F1, F2). | 11 | Covered by the Brand Brain rebuild (PRs #2079/#2081): no silent cut, full context for the ad and video engines. Interim handling lives in ../../atoms/save-learning/ATOM.md. |
| 16 | **A read of all live paid ads for a brand** (not only GooseWorks-launched ones) for the S1 hold list. | 9 | `meta_read` for GooseWorks-launched ads; the human is asked about the rest. |
