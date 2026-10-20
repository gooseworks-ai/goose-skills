# Loadable flow format

Load at step 4. "Loadable as-is" means the marketer can build the flow in their tool without asking a question or retyping a word. Copy without wiring is not loadable. Write in the vocabulary of the brand's tool and plan tier; if a feature is not on their plan (smart sending, holdouts, conditional splits), say so and give the workaround.

## Flow header (one per flow)

```
flow_name:            Welcome – prospect
tool:                 Klaviyo (plan: [ask])
goal_metric:          placed order per recipient (14-day window)
trigger:              List: [Newsletter] → "Subscribed to email marketing"   (exact name in the tool)
trigger_filters:      (Klaviyo list triggers take none — put "capture source = [Popup – Main]" in the flow filter or a split)
flow_filters:         Placed Order zero times since starting this flow; not in this flow in last 90 days   (re-checked at every step)
exit:                 Placed Order → moves to Post-purchase
re_entry:             90 days
consent:              per market — US: subscribed (checkout starters only if the marketer opts in under CAN-SPAM); CA: express consent, or implied within 24 months of a purchase; SMS branch: SMS consent only
smart_sending:        off for message 1; on (16h) for the rest
quiet_hours:          SMS 9:00–20:00 recipient local; fallback zone [brand HQ]
priority:             rank 2 of 6; suppresses broadcasts for 3 days after entry; suppressed by Abandoned checkout
frequency_cap:        ≤ 1 flow email per 16h (smart sending); ≤ 3 marketing emails per week across flows and broadcasts after a subscriber's first week — the welcome's own week is exempt. Klaviyo has no native weekly cap: build it as a flow filter "Received Email at least 3 times in the last 7 days → skip"
utm_template:         utm_source=[tool]&utm_medium=email&utm_campaign=flow_welcome&utm_content=m{n}_{block}
link_tracking:        branded tracking domain aligned with the sending domain (or "not set: see deliverability report")
discount:             unique single-use from pool [WELCOME10]; 10%; 7-day expiry; no stacking; excludes [gift cards, subscriptions]; auto-apply URL /discount/{% coupon_code 'WELCOME10' %}?redirect=… (Klaviyo returns the same code within one message)
holdout:              10% on always-on marketing flows with enough volume, via a random-sample split placed after the message that delivers anything the form promised (the code); "no holdout — <reason>" for transactional, legally required, booking, dunning or one-time launch flows
ab_test:              message 1 subject A vs B; 50/50; winner on placed-order rate (clicks if too small); min [1,000] recipients per arm
build_notes:          tool-specific steps (see below)
```

## Per message

```
step:            m3   delay: +2 days after m2   send window: 9:00–11:00 recipient local
job:             one sentence — what this message must make happen
from_name / reply_to: [Founder first name] from [Brand] / a monitored inbox
subject:         ≤ 45 characters ideal  · alt A · alt B
preview:         40–90 characters; never repeats the subject
body:            final copy in blocks — headline · body · product block · CTA · PS
cta:             text + full URL with UTMs        secondary link: at most one
merge_tags:      every tag with a fallback ({{ first_name|default:"there" }}); never a greeting that can render "Hi ,"
dynamic_blocks:  source (cart items, recommendations), fallback, out-of-stock behaviour (hide line / swap to [named product])
split:           property or metric · branches · default branch
images:          file, size, alt text written as content ("Barrier Cream jar, 50 ml, on a bathroom shelf")
plain_text:      written in full, not auto-generated
claims_used:     each factual sentence → the approved claim's exact wording / product record field / `Policy:` or `[lifecycle]` policy fact (never a bare id)
compliance:      legal name + physical address, unsubscribe, preference link; SMS: brand name + "Reply STOP to opt out" on the first message and periodically
qa:              dark mode, HTML < 102 KB, single column ~600px, body text ≥ 14–16px, tap targets ≥ 44px, live text not one image
```

## Real syntax only
Worked examples and build sheets use the real template syntax of the tool they name — a tag that does not exist forces an edit and fails the done-when. When unsure of a tag, write the field as plain text the marketer selects in the tool's editor ("insert: unique coupon from pool WELCOME10") rather than guessing syntax. Footer address: use the tool's own footer/address tag (Klaviyo `{{ organization.full_address }}`, HubSpot's office-location footer) instead of typing it.

## Tool vocabulary and plan reality (verify against the tool's current UI and pricing; ask the marketer when unsure)

| Tool | Trigger words | Merge syntax | Notes | Plan reality (check before writing) |
|---|---|---|---|---|
| Klaviyo | Flow triggered by list, metric ("Started Checkout", "Placed Order", "Viewed Product"), date property | `{{ first_name\|default:"there" }}`, `{{ event.Items }}` | Flow filters vs trigger filters; smart sending per message; conditional and trigger splits; A/B per message; holdout via random-sample split; unique coupons `{% coupon_code 'POOL' %}`; dates `{% today '%A, %B %-d' delta_days=7 %}` | Free tier: limited monthly sends; flows available on all plans; SMS separate |
| Mailchimp | Customer Journey starting points (signs up, abandoned cart via e-commerce connection) | `*\|FNAME\|*`, with defaults set in audience fields | Abandoned cart needs the store integration; fewer branch types on lower tiers | Free/Essentials: limited or single-step journeys; multi-step journeys and branching on Standard and up |
| Customer.io | Campaign triggers: segment entry, event, form | Liquid `{{ customer.first_name \| default: "there" }}` | Exit conditions per campaign; time windows; A/B and holdout native | Event-triggered campaigns need the product to send events (via its API or a CDP) |
| Braze | Canvas entry by action or API; steps: message, delay, decision split, audience paths | Liquid with `default` | Global frequency capping in settings; quiet hours per message | Enterprise contracts; events come from the app SDK |
| HubSpot | Workflows enrolled by list, form or property | `{{ contact.firstname }}` with default set in the personalization token | Re-enrolment off by default; sales handoff via task/notification actions | Free: 2,000 marketing sends a month with HubSpot branding, form follow-up emails, no workflows (count sends after exits; on free, build a sequence as scheduled marketing emails with a "don't send to" active list of people who already signed up, and the sign-up welcome as a form follow-up email); Starter: simple workflows; custom behavioural events need a higher tier (verify the current tier before recommending) — or a product-side email tool |
| Attentive / Postscript | Journeys by trigger (sign-up, checkout started, browse) | `{{first_name}}` per tool docs | Quiet hours and frequency settings at account level; brand name prefix | Paid per message segment; 10DLC registration through the tool |
| OneSignal | Journeys entered by segment, tag or custom event; wait, yes/no branch, push / in-app / email steps | Liquid on tags: `{{ first_name \| default: "there" }}` (tags set by the app) | Push needs OS permission; in-app messages carry the soft permission pre-prompt template; deep links per message | Free: scheduled push/email messages to segments — a fixed-date sequence is scheduled messages to a segment excluding a tag the app sets (e.g. `installed`; if the app doesn't set it yet, it goes in the tracking plan). The tag only excludes a waitlist email if it lands on the same OneSignal user — the app must log in with the same external ID or add that email; Sign in with Apple relay addresses never match — so the tracking-plan item includes the identity link. Journeys and in-app limits by plan: verify current. Events and tags must be sent by the app SDK |

## Build order sheet (top of the pack)
1. Which flow to switch on first and why (highest expected value that is safe).
2. Per flow: build it in draft, run a test order / test sign-up through it, send the seed tests, then switch on.
3. Turn off or edit any live flow it replaces — named — so the two never run together.
