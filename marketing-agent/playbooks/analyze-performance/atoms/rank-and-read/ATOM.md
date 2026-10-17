<!-- Hidden atom (analyze-performance-rank-and-read): Hidden atom of analyze-performance. Ranks creative by angle, hook and format with minimum-spend gates and a coverage statement, and writes the light email, organic, Google, app, local and future-channel reads. -->

# Creative ranking and channel reads (atom)

**Load:** `../../references/creative-and-channels.md`.

**Inputs:** `meta_read performance` (7- and 28-day windows, ranked by spend); each Goose ad's angle annotation (`ads_creative_read` and the campaign concepts); the non-Goose export; UTM store conversion per angle; email export; `social_analytics_get` posts and accounts; Google export and search terms; app/local exports.

**Do:**
1. Creative: group by angle → hook → format; rank by spend; apply minimum-spend gates; verdict with confidence; fatigue trend; name no winner if `insight.available` is false; state coverage.
2. Draft "what to make next": more hooks on winning angles, retire losers, fair test for too-early, organic overperformers as paid candidates — producer and date for each.
3. Email & SMS, organic, Google (+ wasted-spend terms), apps, local: one short block each, or "not measured this week" / "not used".
4. Future rows: creators (codes), outreach (reply rates), WhatsApp — named, never dropped.

**Output:** the report's Creative ranking, channel blocks, channel-table rows and What-to-make-next draft.
