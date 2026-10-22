# make-static-ads — test by hand

## Setup

1. Connect GooseWorks **staging** to your agent.
2. Link the skills side by side, as `marketing-agent/README.md` (How to test) says: every folder in `marketing-agent/skills/` into one `.claude/skills/`, so the playbook can open its steps at `../make-static-ads-<step>/`.
3. Generation spends credits. Keep paid tests small (two or three ads) and say yes only to quotes you expect.

## Test 1 — the core ask (DTC)

Brand: a DTC brand with real products and its own Meta ads, ideally with brand-brain facts in several statuses. Staging today (19 Oct): **Graza** (olive oil) — 304 own Meta ads, 5 imported competitors, no proof points, a guessed kit font; good for the concept inventory, the brain statuses and the font rule.

Say: **"I need ten fresh ads for <the hero product> this week."** (Graza: the Drizzle and Sizzle set.)

It should, in order:
1. Read the brand, **the brand brain** (map, then a search for the product's claims and proof, each with its status), customer evidence, past performance, the brand's recent posts and **the brand's own running Meta ads** before asking anything; give a short state note (what may be claimed, with status) and a **concept inventory** (one line per running ad).
2. Ask the Step 2 form — in one message, with a suggested answer for each: **logo or no logo; brand colours, the template's colours or a fresh palette; the brand font (only if it is on Google Fonts), a pairing or no specific font; you pick templates or it picks and shows you**. Count and placements are skipped because the ask says ten. Plus, only when they apply: claims the concepts need that aren't usable facts, a sale price, conflicting stock. It never names an internal playbook or tool.
3. Show the **concepts** as plain sentences and, in the same message, a **gallery of templates** — real statics running on Meta plus library templates, 3–5 per slot, each tagged with the concept it would carry, one suggestion marked. You pick; "you choose" → it uses its suggestions.
4. Compose every ad the server's way: your chat words are the only User instructions; each concept is that ad's Variant brief; other brands' templates go structure-only. Then the plan table (concept, persona, reason, proof + brain status, template + advertiser link, structure-only, ratios), the cuts with what would confirm them, **each quote exactly as returned**, the sentence "If an image fails my check I redo it once, at the same price." — then stop and wait.
5. After your yes: render; judge every render with the server's checklist (a fresh subagent where possible); at most one retry per image inside your yes; a content-policy refusal re-composed without the trigger and sent once more; then the extra checks; drop what still fails, with the reason.
6. Hand over a complete unit per ad, the cut list, the batch file (with each final prompt and judge result), a recommended test structure and "what I checked / what you should check"; offer text variants of the best one or two images. Ask which to run; mark only your picks.

**Passes if:** you would put money behind at least half; covering the text, no two ads look alike; a few strong concepts each shown in two or three looks, every concept with a specific promise and real proof; no reason to buy or persona invented to fill the set (gaps named plainly); at least one concept the brand has never run; every ad is a remix of a template you saw or the agent chose; the composed prompt contains your words unchanged as User instructions and nothing the agent added beyond the Variant brief; an audit of every line — including text drawn inside the images — finds only usable facts; nothing rendered before your yes; no more than one retry per image; no judge verdict written into render feedback.
**Telltale failures:** ten ads that are one message in ten outfits; ads that only differ in their headline; templates you never saw; another brand's words, logo, product or image in a render or in the image list; a claim (or a seal, star rating or "#1") that slipped into an image; an agent-written second prompt on top of your words; generation before the yes.

## Test 2 — B2B SaaS, no product photo

Brand: Gooseworks (staging — kit font Space Grotesk set by the user; `must` rules for a wordmark and a CTA pill, which beat the no-logo default) or any SaaS. Say: "Make me six LinkedIn ads for our product."
**Passes if:** it asks for real screenshots instead of generating UI; uses screenshot/stat/POV archetypes; LinkedIn copy limits; no customer logo or stat without permission and a brain status of `confirmed`.

## Test 3 — pre-revenue consumer app, nothing on file

Brand with no claims, no reviews, no angle bank (staging: **Greener Closet** — guessed Inter font, no own ads, competitors with no ads). Say: "Ads for our app launch."
**Passes if:** it says what is missing, offers to research customers or competitors first or to use the founder's own reasons, writes only puffery and verified facts, and never invents ratings, users or reviews.

## Test 4 — reactive

- "My image ad got rejected for 'personal attributes'." → asks for the ad and the exact reason if not given; finds the second-person line; copy only → rewrites it to situation framing, free; words in the image → re-composes with the rejected render as the template (your words as User instructions) and a quoted render, judged like any render; re-runs both checks; offers to save the lesson (saves only with your confirmation in your own words); does not resubmit anything to the platform.
- "More like ad X, new hooks." → keeps angle and proof, changes only the hook (in each new ad's Variant brief), composes from the winner's creative as the brand's own template, quoted before rendering.

## Test 5 — graphic side door (and asked directly)

From email-lifecycle: "a 600-wide header for the welcome email, text: 'Welcome to the routine'". (written as a `Graphic needed: for make-static-ads · header art: …` line in `lifecycle/flows/welcome.md`, or asked directly: "make a header image for my newsletter") → reads the line, no CTA button, claims check on the words, quote and yes in chat, writes `Graphic ready: <link> · <YYYY-MM-DD> · alt: …` under the request.

## Test 6 — "my ads all look the same" (concept diversity)

Brand with 5+ own Meta ads running (staging: import them first if needed). Say: **"All my ads look the same. Give me eight that are actually different."**
**Passes if:** it reads the brand's own running ads first and says, in plain words, what they all have in common (one reason to buy, one look); the new set leads with reasons and looks the brand has not run; the plan shows the lever tally; templates come from at least three different advertisers; each ad's Variant brief carries a different concept or look; it explains why same-image-new-text would not count as different.

## Test 7 — references from the market (AG1-style category leader)

Brand: any supplement or DTC brand. Say: "Show me what the best brands in my category are running and build from that."
**Passes if:** it names 3–5 category leaders, reads their live ads free first (browser) and asks one yes to a ceiling before any paid read; the gallery shows statics only, likely working (14+ days, several versions of one idea, or among the first ads on the leader's page), from real brands (no look-alike ad farms); a picked leader ad is re-hosted and registered as a template, then run **structure-only** — its image is never in an image list sent to the image model; nothing of the leader's words, claims, logo or people reaches a render.

## Test 8 — copy variants

After a set is approved, say: **"Same image as #3, but try three other headlines and a different font."**
**Passes if:** it says these test copy, not concepts, and suggests running them as text options in one ad; a re-render is composed with the approved render as the brand's own template, your words as User instructions and the new hook in the Variant brief, quoted and judged; the layer split is flagged as paid and run only on a yes, and its agent-set lines pass the claims check first; the picture is unchanged except the words and font; every word is spelled right.

---

## Test 9 — same ask through the app UI vs the skill

The same brand, product, template and words, made twice: once in the GooseWorks app (the static-ad prompt box, the template picked by hand) and once with this playbook (the marketer types the same words in chat and picks the same template in the gallery). Two or three ads each, same ratios.

1. Record both sides: the app's composed prompt and image list (from the creative's detail, `include: ["renders","plan"]`) and the playbook's (batch file).
2. Compare the prompts line by line: the User instructions block should be the same words; the colour, typography, reference manifest and blueprint lines should follow the same rules; differences should be only the playbook's improvements (the Variant brief per concept, the brain-checked claims, the font improvement where it applied).
3. **Blind judge:** give a fresh subagent (or a person) the renders side by side, unlabelled and shuffled, with `references/judge.md` §3–4 and the question "which would you run, and why?".

**Passes if:** the playbook's ads judge at least as well as the app's on the server checklist, and the blind pick prefers the playbook's or calls them even; every prompt difference traces to a named improvement; nothing the brain marks `guess` or `unknown` appears on the playbook's side. Any rule difference that is not an improvement is a bug in this playbook's copy of the server.

## Test 10 — short answers don't skip the research (Juicebox, 21 Oct)

Brand: a B2B brand with live ads on Meta or LinkedIn but nothing in GooseWorks (Juicebox on production). Answer the template question with "your choice, show me the final ads only, make one ad". Then say "make 5 more".
**Passes if:** before any quote it reads the brand's live ads in the Meta and LinkedIn Ad Libraries and shows the concept inventory; the concept grid and coverage note come before the quote; the claims check runs; a fresh subagent judges each render; the "5 more" set repeats no reason, template or example content from the first ad or from the brand's running ads; the colour question suggests the running ads' palette when it differs from the kit.
**Telltale failures:** "brand has no running ads" in the batch file while the libraries show ads; angles taken straight from the website's headline stats; the agent judging its own render.
**No-browser variant:** on a host with no browser, it asks one yes for the proxy reads (about 1 credit per library), or writes "not checked" with the reason; never "no running ads".

## Test 11 — a fresh scene with a limited reference role

Say: "Five different static ads. Choose for me. Show only the finished ads." Use a brand other than the training examples. Give its real product photo and a different category's conceptual or photographic reference.

**Passes if:** each concept starts from a sourced product truth and a labelled researched situation or creative hypothesis. The agent names the reference's role (`layout`, `mechanism`, `craft`), stages one meaningful relationship, writes exact copy and a protected decision, and carries them through `prepare` → `final` → claims/policy → quoted `ads_render`. Other brands' source images stay out of every generation list. A direct competitor can lend layout only. Different concepts can move far from the reference's props and layout; they remain specific to the product. No invented customer or performance evidence.

**Image review:** a fresh judge checks the authored relationship, exact copy, protected decision and real product, alongside the usual claim and quality rules. A polished generic packshot with the relationship missing fails. Record actual dimensions and defects; do not claim pixel-exact packaging or a blind tournament that did not happen.

## Test 12 — complete reads without repeated scaffolding

On a shell host, prepare two ads with the full brand kit. Read every numbered part in the first manifest. Prepare the second using the first `shared_rules_sha256`. Read every part it returns.

**Passes if:** each part is at most 6,000 characters, all current ad values remain visible, unchanged shared rules are omitted only on a hash match, and changed rules reappear. A missing/stale answer receipt fails before any render arguments are produced. Changing a product photo or source image also invalidates the old receipt. The receipt identifies input; it does not prove comprehension or claim clearance.

## Test 13 — stale connector catalog

Use a connection whose cached tool catalog lacks `ads_render`. Refresh discovery. A shell host may use its existing authorized MCP transport and the same server's live schema. If the actual server still lacks the thin renderer, stop and report it. Never replace it with `ads_generate`; that server workflow may re-compose the prompt or attach source images.

## Test 14 — a valid concept with a garbled product label

Use a real official product photo and a completed render whose scene/shape/pose pass but whose printed label changed. Do not weaken product/spelling checks to accept it.

**Passes if:** the original remains failed; an isolated label may use the free local helper only after rights and compatible pose are checked by eye. Explicit source/target guides remain in evidence; invalid, out-of-bounds, crossed or folded mappings fail. The saved mask accounts for every changed pixel. A fresh reviewer compares the entire candidate to the official source, including label words/marks, edges, light, shape and occlusion. A passed repair is a new `ads_save` creative linked to the original parent; downloaded saved bytes match the approved candidate. No human rating is invented. With an exhausted credit ceiling, no paid retry or layer split runs. An incompatible source or a visible bad repair stays unapproved.
