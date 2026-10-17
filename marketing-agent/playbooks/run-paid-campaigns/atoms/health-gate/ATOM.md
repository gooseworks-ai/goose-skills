<!-- Hidden atom (run-paid-campaigns-health-gate): Hidden atom of run-paid-campaigns. Checks tracking, destinations, stock, offers, disapprovals and account state before any money moves; a fail blocks launches and scale moves and becomes a fix move. -->

# Health gate (atom)

**Load:** `../../references/launch-and-graduate.md` (health gate section).

**Inputs:** the chosen platforms (from the brief); the latest analyze-performance read (`reports/performance/`) — its data-quality flags and the platform-claims ÷ store-orders ratio; `meta_read` push status for each id in `state.md`'s `meta_push_ids` (per-creative failures, destinations); destination URLs of other live ads (the human's export); stock on promoted SKUs (human or product record); live offers and their end dates (brief's Offer section, human).

**Do — in order, one line each, ✓ / ✗ / unknown:**
1. Tracking: conversions tracking store orders at a steady ratio (from analyze-performance), or the human confirms the conversion event fires. Lead-gen: lead source captured in the CRM. Apps: SDK/MMP postbacks, SKAN/AEM set up. Unknown on a launch → ask; do not launch blind.
2. Destination: loads on mobile, right product, price matches the ad, offer valid, UTMs present. Open the page when the host can browse; else ask.
3. Stock: no ad sends traffic to a SKU with under ~1 week of cover.
4. Disapprovals / failed creatives (push_status; the human's export).
5. Account: (Meta chosen only) publishable Page exists; every platform: no known payment failure or spending-limit stop.

**Output:** the proposal's health line, plus fix moves (pause the affected Goose ad, a card for non-Goose objects, a written tracking fix). Any ✗ blocks launches and scale moves for that destination this week. Only a tracking break makes the window's numbers suspect; low stock or a disapproval does not invalidate past results.
