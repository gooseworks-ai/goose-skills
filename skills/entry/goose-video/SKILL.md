---
name: goose-video
description: "Make a video ad in this chat from a real reference ad, found or theirs; styles are the fallback. Follow every answer's next_step."
version: 4.5.0
---

# GooseWorks video

From an installed entry, first catalog_fetch type skill goose-video on this same connection and follow that body. An entry already fetched in this run needs no repeat fetch.

For a video already started, call video_read and follow its next_step.

New videos default to a real reference ad remade for the brand (custom); ready-made styles are the fallback. Start with get_started (wants video, request). A card is not a pick or proof of viewing.

1. The request. If they haven't said what the video is about, ask in one short question.
2. The brand. Ask which brand only when brand_read lists several; with one, use it.
3. The product. Named or none wanted: find its id with brand_read (sections: products), or use []. Otherwise the product card asks: say one line and wait. Without cards, ask which product by name; use the only one, or go on with none. Never ask again after a pick.
4. Research. Read the kit, learnings and selected products with brand_read, then knowledge_search. Verify product size/use from facts and size-reference photos; resolve essential unknowns before planning. Note what to say and avoid.
5. The reference. Their own video ad: video_create with style custom, request, products, its reference_url and a new UUID idempotency_key, then the custom rule. Otherwise, custom asked or not, video_references (action find) with the request and products ([] for none); it's free and reuses the brand's saved list unless they want new ideas (fresh: true). Show it as the answer says; they pick.
6. The pick. video_references (action pick) with candidate_id, request, products and a new UUID idempotency_key starts the custom video. Then the custom rule.
7. Styles, only if no found ad fits or they ask for a style or template: video_formats with the request and products; they pick. Card on screen: one line and wait; else print its table as it is. Then video_create with that style and the products.

## A supplied video reference comes first

Watch the whole video with sound before choosing a style or writing a custom plan, or use the server's measured reference profile. URLs, titles, thumbnails and frames are not viewing. Log the hook, scene order, pace, speech, framing, product interactions, text and ending with timestamps and gaps. Unreadable essentials need an accessible video or their brief-only choice; never claim a viewing.
Styles vs a reference: fetch plausible templates and compare plan_note, scenes, duration, cast, sound and assets; titles and rankings prove no fit.
Custom route (a picked or supplied reference, or explicit custom): catalog_fetch type skill make-custom-video on this connection before a project write and follow it: full harness, current schemas, two authenticated approvals, cumulative budgets, verified execution. Keep their mechanics and assets. If anything is unavailable, say so and keep the brief; never run a template's renderer as custom, import the reference as a finished video, use retired actions or switch environments. Fetching a skill proves no execution capability.

## Rules

- Talk to marketers: what they get and decide, never how it's made.
- Never mention tools, ids, JSON, commands, software, vendors, models, timings, retries or your checks.
- Everything happens here: never ask the customer to install anything or use a CLI, slash command or other app, except a video's make command when a next_step gives it; its last line says who starts it, and where this app does, never show it to them (original videos follow their own). Never give any other command, sign-in step or setting, and never ask them a technical question.
- Money is a credit number exactly as an answer gives it: never dollars or your own math.
- Follow the next_step in every answer.
- Card on screen (display_hint "widget"): one short line at most, then the wait in its next_step or end your turn; never re-list it or open a question box.
- Paid work needs the customer's yes to the credit total first, on the card or in chat at the price shown; never decide it for them, and pass on a yes only once they gave it to that total.
- If you can run commands on the customer's computer, ask for the yes with the answer's own question: it says the video is then made on their computer, so that one yes covers starting it.
- A yes is to the credit total the customer was shown: their press on the plan card, or their yes in chat sent with that total.
- Every video approval, including a higher price or a priced fix, can happen in this chat. Show the plan and its price here when no card is visible; cards and websites are optional for approval.
- Never invent an offer, a claim or proof.
- GooseWorks holds every provider key and bills the work: never ask for a key, token, password or ad account id, and never call a vendor yourself.
