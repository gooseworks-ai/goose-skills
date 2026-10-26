# Formats: what each piece must look like

Load at the brief step (to pick the format) and at the draft step (for its anatomy). This is the closed v1 list. A request outside it is either mapped to the nearest format here or declined with the owner named (see SKILL.md, Out of scope).

## Pick the format from intent, not habit

| Reader intent | Format | Structure |
|---|---|---|
| Learn ("what is / why") | Explainer, SEO or answer article | Answer first, then depth |
| Do ("how to") | How-to, tutorial, routine, recipe | BLUF line, steps, pitfalls |
| Decide ("X vs Y", "best X for") | Comparison or alternatives page, buying guide | Verdict first, criteria, honest trade-offs |
| Trust ("does it work for people like me") | Case study, customer story, before/after | Situation, complication, resolution |
| Be convinced (a belief should change) | Thought leadership / point-of-view essay | Pyramid: claim, three supports, evidence |
| Keep in touch | Editorial newsletter issue | A letter from a person |
| Hear news | Launch post, release notes, "what's new" | Inverted pyramid |
| Watch or listen | Video script, webinar or podcast outline, show notes | Hook, beats, payoff |

Length follows what the intent needs. Never pad to match a competitor's word count; never target keyword density.

## The publish kit (every long-form piece ships with it)

- 3–5 headline options: specific beats clever. Put the benefit or the tension in the headline, and name the reader when you can. Never a pun headline on a search piece.
- Meta title (≤60 characters) and meta description (≤155), plus a slug.
- The H2 skeleton as a list. Read alone, the H2s should state the argument.
- Internal-link suggestions, only to pages known to exist (the inventory the human gave, or pages in the brain). Never invent a URL.
- The CTA and where it points, taken from the brief.
- Image notes and alt text for each visual. A single brand image (blog header, link preview) can be requested as `Graphic needed: for make-static-ads · <purpose, placement, exact text> · return to: content/drafts/<date>-<slug>.md`; its `Graphic ready:` answer is read on the next run.
- Distribution notes: who to tag or notify (only people the human named), and which repurposed cuts to make next.

## Anatomies

### Content brief (one page, always written first)
Working title plus two alternatives. Audience: one named role or segment, their situation, and what they already know. Intent (from the table above). **The one argument**: a single sentence a reasonable person could disagree with; with no thesis there is no draft. Information gain: what the top existing pieces on this topic say, and the one thing ours adds (original data, a first-hand process, a contrarian claim, a worked example). The outline written as claims, not topics ("H2: Discounting trains churn, not loyalty", not "H2: Discounts"). Proof inventory: every proof unit tagged with its source ("Claims you may use" fact, product fact (field), voice-of-customer quote with date, the human's interview line, or a public source URL). Each gap is shown as `[PROOF NEEDED: what]`. POV needed: yes/no, and whether we have it. Reader questions to answer word for word (for answer engines). Voice (brand or a named person's). CTA. Length. Format. Where it publishes and by when. Banned words carried in from the voice guide.

### SEO or answer article (from improve-search-visibility's page brief, or a direct ask)
Headline states the payoff. Under each question-shaped H2, a 40–60 word self-contained answer comes first, then depth. Answer engines lift passages that stand alone, so this is the most important structural move. One proof unit per H2 at minimum. Include an FAQ block only when the page brief lists the questions. Cover the brief's questions in its order. Never add a keyword the brief did not ask for.

### How-to, tutorial, routine, recipe
A BLUF line: what you'll be able to do and how long it takes. Prerequisites. Numbered steps, one action each, with the why only where a step looks optional. "Mistakes to avoid" drawn from real support questions or voice-of-customer quotes. For DTC routines and recipes: the order of use, the quantities, and when to stop or see a professional (regulated categories). Product mentions appear where the product is genuinely the tool for that step. They are not ad breaks.

### Comparison or alternatives page (B2B SaaS heavy)
Verdict in the first paragraph: who should pick which. A verdict that passes both the thesis gate and the claims gate is situational: "Pick <us> if <buyer situation>; pick <them> if <situation>." Build it from the buyer's criteria, with no superlative about us. The founder supplies or approves it (`[FOUNDER: confirm verdict]`). Name the criteria the buyer actually uses (from voice-of-customer or sales objections). A table. An honest "where they're better" section; a page with no concession reads as an ad and earns no trust. **Every fact about a competitor must be dated and sourced** (`gooseworks:competitor_read`, or a public page you opened in this run). Any comparative claim about us ("faster", "cheaper", "the only") is held to the approved-claims list. Mark it `[COMPARATIVE CLAIM — needs approval]` if it is not on the list.

### Listicle or buying guide
Keep only the items that are genuinely different. "17 ways" where four are real becomes four, gone deeper. Each item gets who it's for, why, and one specific detail. State the selection criteria up front. On a DTC buying guide, the brand's own products are disclosed as ours.

### Thought leadership / point-of-view essay
Needs the human's real opinion (references/point-of-view.md). Without one, do not write it: offer the explainer or how-to version, labelled "no POV anchor". Structure: the contrarian claim by sentence two; what most people believe and why it's wrong; three supports, each with evidence or a story the human told; the strongest counterargument, answered; the implication ("so do this on Monday"). Written in the named author's voice when it will carry their byline.

### Case study or customer story
Headline: customer + result + timeframe. An at-a-glance box (customer, industry or profile, problem, result numbers). Situation: who they are, with real constraints. Complication: what was failing, what it cost, what they tried first. Decision: why us, including their doubts. Resolution: the specific how, not "they implemented our platform". Results: 2–3 numbers with baseline and period. Customer quote in their own words. What's next. The customer is the hero; the product takes about a fifth of the copy.
**Inputs to ask for first:** the interview transcript (or book a call using the customer interview guide in references/point-of-view.md), the customer's written OK to be named and to use numbers, logo and quotes, and the results period with a baseline. **Early-story variant:** for a customer who is weeks in with no results yet, write "why they chose us and what they're trying". It has no result numbers, and the headline promises no outcome. An anonymised version still needs its numbers signed off.
**Gate:** the customer's name, every number and every quote must be approved claims or come from a source the human supplies with the customer's permission. Draft from the interview transcript with `[CUSTOMER APPROVAL NEEDED: …]` on each such item, and put them through the claims gate's scoped sign-off (the `claims-gate` skill, `../../claims-gate/SKILL.md`). A case study with unapproved items is delivered as **blocked**, never as ready. DTC before/after stories use only already-approved testimonials and imagery.

### Editorial newsletter issue
Subject line ≤45 characters plus a preheader that adds to it rather than repeating it (give 3 pairs). One lead piece (300–500 words): an editor's letter written from this week's notes in the signer's voice, or a point-of-view essay when the issue argues a position (then the POV rules apply). Then 2–4 items, each with a one-line "why this matters to you", not a summary. One CTA. A sign-off in the editor's or founder's voice. It should read like a letter from a person, not a digest. For a recurring newsletter, save the issue template (sections, lengths, voice, recurring segments) once and reuse it (SKILL.md, Newsletter path). Promotional broadcasts, segments and send decisions are email-lifecycle's.

### Long-form guide, ebook, whitepaper, report, lead-magnet content
Outline and brief first, with the human's yes (approval gate). Then draft section by section, saving each section as you go, so a long piece survives a chat host's output limits. Original research or survey reports use only data the human supplies. Never simulate survey results. Lead-magnet *content* (a checklist, template or guide) is in scope. The capture page and popup are not.

### Launch post, release notes, changelog, app "what's new"
Inverted pyramid. What's new, who it's for and why it matters, in the first two sentences. Then how it works, what's changed for existing users, and availability (plans, regions, dates, from the product record or the human). Release notes: one line per change, benefit first ("Export to CSV from any report — no more copy-paste"). App "what's new": Apple allows ≤4,000 characters with ~170 visible before "more"; Google Play allows ≤500. Lead with the one change users will notice. A first release (v1.0) has no update notes to write. What it needs is the store listing description, which is improve-search-visibility's (app-store listing). Say so rather than writing what's-new text for an app that hasn't shipped.

### Video script: long-form YouTube, explainer, demo
Title options (≤60–70 characters visible) and thumbnail text (≤4 words that complement the title, not repeat it). Cold open: the payoff or tension in 15 seconds. A promise of what they'll get. Chapters as beats with timestamps planned. Spoken lines written to be said aloud: contractions, flowing sentences that run across cuts. If a brand learning says so, avoid choppy fragments. B-roll and screen notes. A pattern interrupt every 60–90 seconds. CTA once, near the end. Description: the first ~150 characters do the work, then chapters starting at 0:00.

### Short video script (TikTok, Reels, Shorts)
A table: `time | spoken | on-screen text | visual`. The 0–2s hook is both spoken and on screen and carries the promise or the tension. 2–5s: why keep watching. Then up to three beats, one idea each. Payoff. A soft CTA or a loop line back to the hook. One idea per video. Spoken sentences ≤12 words or so (unless the brand learnings ask for flowing lines). On-screen cards ≤7 words. Captions burned in. Say the topic's search phrase in the spoken line, the on-screen text and the caption. 20–45s for teaching; 7–15s for a single loopable point. Shot notes only; the marketer films it (we don't produce video yet).

### X thread, long post or X Article
Pick by the idea: one point → a single post; 4–8 linked beats → a thread; a worked argument the reader saves → a long post or an Article. **Thread:** post 1 is a standalone claim with the payoff promised (no "🧵", no "A thread:"); each post one beat that survives alone, ≤280 characters; the last post lands the takeaway; the link goes in a reply. **Long post:** only the opening ~280 characters show before "Show more", so they carry the hook and the payoff on their own; short paragraphs; one idea; no headings. **Article:** a title that states the payoff, a cover image, H2s as claims, answer-first sections, and a share post with its own hook. Who can publish long posts and Articles, and their limits, change (they have been limited to paid accounts): check X's help pages this run, or write a thread. Hook rules: references/editing.md.

### Webinar or podcast outline, show notes
Outline: the title, the one takeaway, 3–4 segments with a question or demo each, planned audience-question slots, and the CTA. Show notes: a two-sentence summary that sells the episode, 3–5 takeaways, timestamps, guest bio (from what the human gave), and links mentioned. Never invent quotes the guest did not say. Pull them from the transcript with timestamps.

### Page draft from an improve-search-visibility brief
Follow the brief exactly: the target questions, the structure, the entity facts. Answer-first sections, a scannable comparison or spec block where the brief asks, an FAQ only from the brief's questions, and one CTA. Hand the draft back labelled with the brief's id so improve-search-visibility can find it.

### Google Business Profile post, local event announcement (local businesses)
GBP post: ≤1,500 characters, but the first ~80 show. Lead with the offer or the event and its date, then one CTA button choice. Event announcement: what, when, where, who it's for, how to come. Offers only as dated in the brain. Never invent one.

## Out of the format list (name the owner)

Ad copy (make-static-ads; video ads: the goose-video skill). PDP, collection, marketplace listing and A+ copy (not a v1 playbook; improve-search-visibility owns the search side). Press releases and media pitches (not covered). Sales decks, one-pagers, battlecards, proposals (product marketing; not v1). Sponsor reads (work-with-creators or human). Promo email broadcasts and flows (email-lifecycle). Dated social posts in a calendar (run-organic-social). Translation and localisation (later).
