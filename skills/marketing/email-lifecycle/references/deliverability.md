# Deliverability and list health

Load at step 1 and in the monthly mode. List hygiene is survival: inbox providers throttle or block senders whose complaints creep up.

## Every item carries a status
**verified** (the agent saw it: a DNS lookup, an export, a screenshot) · **from you** (the marketer stated it) · **unknown** (not seen). A green is only ever verified or from you. Never infer green.

## The checklist

| Item | Green when | How to check without paid tools |
|---|---|---|
| SPF | a marketing test email shows `spf=pass` (the tool's own return-path domain is fine; note whether it aligns — Mailchimp, and HubSpot without a dedicated IP, can't align SPF, and that is not a fix item) | primary: the full headers of one email sent through the email tool (a recent campaign from the list, else a test send), from the marketer (Gmail "Show original") — works in hosted chat; a personal or Workspace email's headers don't count and stay unknown; supporting: `dig TXT` on the tool's return-path domain. A root-domain SPF record alone (often the office mail provider) is "present — not verified for marketing mail" |
| DKIM | the test email shows `dkim=pass` with `header.d=` the brand's domain or a subdomain of it (relaxed alignment with From) — DMARC needs only one aligned pass, and DKIM is the one to align | the same headers; the tool's authentication screen; `dig TXT <selector>._domainkey.<domain>` when the selector is known |
| DMARC | a record exists (at least `p=none`) and the test email shows `dmarc=pass` | `dig TXT _dmarc.<domain>` + the headers |
| Branded sending subdomain | marketing sent from e.g. `mail.brand.com`, separate from transactional where possible | tool settings |
| One-click unsubscribe | List-Unsubscribe header (RFC 8058) on marketing mail; unsubscribes honoured within 2 days | the tool's setting; the headers of a real campaign from the list (a test send may lack the header: missing on a test send → unknown, not red) |
| Visible unsubscribe + preference link | in every marketing email footer | test email |
| Legal footer | legal name + physical postal address | test email |
| Spam complaint rate | < 0.1% in Google Postmaster Tools; never ≥ 0.3% | Postmaster screenshot from the marketer; the tool's spam-complaint rate per send |
| Hard bounce rate | < 0.5% per send (> 2% = list-source problem) | the tool's campaign report |
| Unsubscribe rate | < 0.3% per send | the tool's report |
| Blocklists | domain and sending IP not listed (Spamhaus etc.) | public lookup pages |
| Consent provenance | source, timestamp and form wording on record per channel and market; SMS consent separate from email; Canadian contacts' consent type known | the marketer; the tool's profile data |
| Link-tracking domain | branded and aligned with the sending domain | tool settings |
| Monitored reply-to | replies reach a person | the marketer |
| Warm-up | needed for a new domain, IP, tool migration or a list not mailed in 6+ months (a waitlist: 3+) | the marketer's history |

Volume matters: the bulk-sender rules below are hard requirements for senders of ≈ 5,000+ messages a day to Gmail (or Outlook); a list above ~5,000 with an unknown Gmail share is treated as bulk (Google's classification is permanent once reached). Below that they are best practice, reported amber, never a stop.

Canada (CASL), for email as well as SMS: express consent, or implied consent within 24 months of a purchase (6 months after an inquiry); abandoned-checkout emails to people who never subscribed are allowed under CAN-SPAM in the US but not under CASL; sender identification and unsubscribe in every message. EU/UK: GDPR consent records; double opt-in is common practice in Germany.

Rules in force (verify current details when stating them): Gmail and Yahoo bulk-sender rules (Feb 2024; Gmail rejecting non-compliant mail since Nov 2025; "bulk" ≈ 5,000+ messages a day to Gmail) require SPF, DKIM, an aligned DMARC record, one-click unsubscribe, and spam rate below 0.3%. Microsoft (Outlook, Hotmail, Live) has required the same authentication for 5,000+ a day since May 2025.

## Opens after Apple Mail Privacy Protection
Apple Mail pre-loads messages, so opens are inflated and say nothing about intent. Use opens only as a gross alarm (a sudden drop at one provider). Never for A/B winners, engagement segments or sunset decisions.

## Triage when red (in this order; promotional sends stop while red)
1. **Authentication failing** — fix DNS first; mail is being rejected.
2. **Complaints ≥ 0.1% or rising** — send only to engaged-30 for 2–4 weeks; check the unsubscribe is visible and works; audit sign-up sources and consent wording; cut frequency.
3. **Bounces > 2%** — find the source; remove role and typo addresses; look for old or bought imports.
4. **Placement collapse at one provider** — check blocklists and that provider's sender tools (Postmaster, SNDS); ramp volume back gradually.
5. **Recovery** — after 7+ clean days, widen engaged-30 → 60 → 90 in steps, watching complaints at each step.

## Warm-up (new domain, IP, tool or dormant list)
Start with the most engaged slice (recent buyers, recent clickers); roughly double daily volume while complaints and bounces stay clean; a dormant list starts with re-permission, never a promo.

## The report format
```
Deliverability and list — [date]
Overall: RED — 1 blocker
| Item | Status | Evidence | Fix | Who |
| DMARC | RED · verified | no _dmarc record on brand.com | add: v=DMARC1; p=none; rua=mailto:dmarc@brand.com | whoever manages DNS |
| Spam rate | unknown | no sender-dashboard access | a screenshot of the spam-rate chart (last 30 days) in Google's sender dashboard, if you use it | you |
...
List: [size] · engaged-90 [n, %] · growth last 30 days [n] · consent sources [..]
Flows live: [...] · collisions found: [...]
```
