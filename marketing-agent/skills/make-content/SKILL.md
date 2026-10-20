---
name: make-content
description: >-
  Writes marketing content: articles, single posts, newsletters, scripts and repurposed cuts, each
  with an edit note and a claims check. Use when a marketer says "write a blog post / case study",
  "write a LinkedIn or X post / thread / X article", "carousel copy", "draft this week's newsletter",
  "turn this webinar into posts" or "repurpose this", "write a TikTok or YouTube script", "refresh
  this old post", or "write the page from this SEO brief". Words only; nothing is invented or
  published. Not for a dated posting calendar — use run-organic-social; not ad copy (make-static-ads)
  or promo emails (email-lifecycle). Press releases, landing and product pages, and sales decks are
  not covered.
version: 0.1.0
---

# make-content

## What you get

One of five things, saved to the brand's workspace and shown in chat:

1. **A repurposed set.** One finished asset is mined into scored units. Each platform the brand uses gets a native version with a different lead unit and hook, ready to paste. Each version has an asset line saying what visual it needs and who makes it.
2. **A single post.** One LinkedIn, X, Threads or Instagram post, a thread, or an X long post or Article (references/formats.md), written native to its platform. It skips the calendar and the units table unless there is a source asset.
3. **A fresh piece.** A one-page brief, then a first draft in the brand's (or a named author's) voice. Long-form adds the publish kit: headline options, meta, slug, H2 skeleton, internal links, CTA, image notes and distribution notes.
4. **A refresh redline.** An old piece rewritten where it decays, with each change and its reason.
5. **This week's newsletter issue,** written from a saved template and the week's notes.

Every piece carries an **edit note** and a **claims check**: what was kept, softened and cut, and the proof that would restore each cut. The formats are listed in references/formats.md. Anything else is routed (Out of scope).

## Before you start

1. **Setup first:** do the `marketing-guide` skill (`../marketing-guide/SKILL.md`) §1–2 (connect, brand, brain read) before anything else; the job line is "I write from your brand's voice and claims through it." (`get_started` with `wants: "more"`.) Then, for this playbook:
   - Brain path: open chapters 2 "What we sell", 5 "Who we sell to", 11 "How we sound" and 22 "Everything we have made and run" (past content), then `gooseworks:brand_read` lean with only `sections: ["sources","organic"]` (the brain doesn't hold own posts or saved sources).
   - Fallback path: `gooseworks:brand_read` lean with `sections: ["summary","kit","learnings","sources","organic","products"]`, then `product_ids` for the products the piece covers. Learnings at `detail: "full"` only in their own call, when you need `do`, `insight` or `template_hint` rules (several sections at full detail overflow). `gooseworks:knowledge_search` with the task, for past content and documents.
   - Either path: `gooseworks:file_list` on `content/` and `brand/voices/`; `gooseworks:file_read` `content/channels.md`.
   - The brand's platforms, in this order: `content/channels.md` → `social/accounts.md` → `sources` rows with `relationship: "self"` and `source_type: "organic_social"`, plus `organic.own_accounts`. Ignore the ad-library sources.
2. **Say plainly what the brain can't support, before drafting.** Lines this piece needs (the core positioning, a number, a customer name) that aren't signed off go to the marketer in the intake message, per Approval gates § Claims. When something the marketer says contradicts the brain, ask which is true and save the answer as their correction.
3. **Ask only what is missing, in one intake message, at most four questions.**
   - Repurpose: the source asset, and the platforms if not saved.
   - Single post: the platform, the point and whose account it is for (brand page or a named person), if not given.
   - Fresh piece: topic, audience, format, where it publishes and by when, and the CTA destination.
   - Opinion-led piece: whether the marketer has a view.
   - Case study: the interview transcript, the customer's written OK to be named and quoted, and the results period.
   - Search-intent piece: the yes for the search-results read when it needs the proxy (Steps, 4.1).

   Never guess any of these. With no topic, offer 3 candidate questions from the voice-of-customer bank, labelled "unverified: you pick". Save the platform list and house style to `content/channels.md`; they are not learnings.

## Steps

**1. Pick the path.** Repurpose · single post · fresh piece · refresh · newsletter.
- A sibling's request arrives as a page brief (`search/briefs/<page-slug>.md`), an asset-list row (`gooseworks:campaign_read`) or a "what to make next" line (`reports/performance/<date>.md`). Treat it as a fresh piece with that input.
- Read any `Graphic ready:` answers under your earlier asset lines and image notes (`content/repurposed/`, `content/drafts/`). Attach those images to the pieces they belong to.
- Do only the work the ask needs.

**2. Repurpose.**
- Get the source in (references/repurposing.md §1).
- Mine and score units (the `make-content-source-to-units` skill, `../make-content-source-to-units/SKILL.md`). A thin source, such as a short silent clip, supports 2–3 versions. Say so, and suggest a richer asset.
- References only, never to copy: `gooseworks:social_inspiration_search`, or `brand_read` `organic.competitor_top_posts` (skip posts outside the brand's category).
- Write one native version per platform the brand uses, each led by a different unit (references/repurposing.md §4). Skip the platform the source already lives on unless a re-cut is asked for. Add a second surface on a platform only when strong units outnumber platforms.

**3. Single post.**
- Write it to references/repurposing.md §4 for its platform and account (brand page or a named person), with the hook first and 2 alternatives.
- Voice: the account's card if one exists; else the brand card (build it free from `brand_read organic` when ≥8 own posts exist); else match against the `make-content-two-pass-edit` skill (`../make-content-two-pass-edit/SKILL.md`)'s fallback order and label the post "voice provisional". Never open a paid read or the voice interview for one post; offer to build a card afterwards.
- Then step 6. No brief, no calendar intake.
- If the marketer wants a run of posts over dates, say you can plan a two-week calendar instead, and stop here.

**4. Fresh piece.** In this order:
1. **Brief** (the `make-content-content-brief` skill, `../make-content-content-brief/SKILL.md`).
   - **Search-intent pieces** (SEO, answer, comparison, a how-to people search for), when no page brief carries the top results: read them first. Use the host's own web search (free), or one `/v1/google/search` read through the proxy (the `marketing-data-access` skill (`../marketing-data-access/SKILL.md`), the `spend-gate` skill (`../spend-gate/SKILL.md`) proxy branch, with the yes asked in the intake message).
   - Open the top 3 results and log URLs and dates. With no fetch, judge information gain from titles and snippets and label it "snippets only". "Information gain: not checked" ships only if the marketer declines the read.
   - Then the public sources for world facts.
2. **POV.** If a view is needed and missing, run the interview (references/point-of-view.md). With no answer, write the no-POV version and label it.
3. **Proof gate.** Count only H2s that make factual claims; interview lines count as proof. If fewer than half are proofed, stop at the brief and hand over "what unlocks this draft" (4–6 specific asks).
4. **Outline gate.** Long-form and every case study: show the brief and outline and wait for a yes.
5. **Draft.**
   - Bylined pieces: the author's card through the voice-card atom.
   - Draft to the format's anatomy (references/formats.md), section by section for long pieces, saving each with `gooseworks:file_write`.
   - Fill proof only from the brief's inventory; each gap stays `[PROOF NEEDED: …]`. **Before leaving any fill-in or gap, check the brand's own public docs** (help centre, quickstart, pricing, changelog): a product fact found there (e.g. what one video costs in credits) is filled in with its link, not asked. Fill-ins should shrink between drafts, never grow.
   - A page draft puts its `search/briefs/…` path on line one.

**5a. Refresh.**
- Get the current text in.
- Keep what earns its place. Rewrite the lede and title.
- Update stale facts only to sourced or signed-off ones. Add what the decay reason points to, and cut what's outdated.
- Deliver a section-by-section redline: old → new, and why.

**5b. Newsletter.**
- If `content/newsletter/template.md` is missing, send one message with:
  - a proposed default: a 300–500-word editor's letter, 2–4 items each with "why it matters", one CTA, a sign-off;
  - at most four questions: who signs it, who the list is and how they joined, send day, CTA destination;
  - the ask for this week's notes.
- With no notes, offer an issue built from the brain, labelled "unverified: you pick".
- Save the template. On later runs, ask only for the week's notes.
- The lead is an editor's note from the notes, in the signer's voice. It needs the POV interview only when it argues a position.

**6. Edit, check, edit** (the `make-content-two-pass-edit` skill, `../make-content-two-pass-edit/SKILL.md`):
1. The substance pass.
2. The claims check, per Approval gates § Claims. When a piece is sponsored, affiliate, gifted or a creator collaboration, also load `../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill) and apply it.
3. The readability pass and the AI-tell check on what survived.

Attach the edit note and one claims block per piece or set.

**7. Hand over.**
- Show, in order: title and path; the brief or a link to it; the piece; the publish kit (long-form); the edit note; the claims check; open gaps (`[PROOF NEEDED]`, `[CUSTOMER APPROVAL NEEDED]`, `[NAME: …]`, PERSON YES NEEDED).
- For a large set, show the strongest three in full and say the rest are in the file.
- End with: "Nothing is published — you edit and post. If you want the social pieces in a two-week posting calendar, ask for it next." Offer only; never start another playbook yourself.

## Approval gates

- **Claims.** Brand claims go only through the shared claims gate (the `claims-gate` skill, `../claims-gate/SKILL.md`): signed-off claims verbatim, or its **scoped sign-off** now (3–5 lines put to the marketer in the intake message, their answer recorded; never when someone else approves claims — then those lines wait), or plain product facts only, which is also the path when the marketer declines. World facts, competitor facts, stories, sensitive topics and third-party rights follow references/fact-rules.md. Never self-approve. A case study with unapproved names or numbers is delivered as **blocked**.
- **Point of view.** Opinions, stories and first-person experience come only from the marketer or the named person. If missing, ask. If they decline, use the no-POV format.
- **Bylines and named people.** Anything published under, or quoting, a named person carries PERSON YES NEEDED: that person's own yes.
- **Outline.** Long-form and case studies: the brief and outline get a yes before drafting.
- **Publishing.** Nothing goes live from here.
- **Money.** The default path is free. A proxy read (top search results, post history) or any import that quotes a price follows the spend gate: a probe with a yes, then a ceiling.

## Output and write-back

- **Workspace** (brand coworker scope; `<D>` is `YYYY-MM-DD`):
  - `content/briefs/`; `content/drafts/<D>-<slug>.md` (single posts and fresh pieces); `content/repurposed/<source-slug>/<D>.md`; `content/refresh/<D>-<slug>.md`
  - `content/newsletter/template.md` and `content/newsletter/<D>.md`
  - `content/pov/` (interview answers, reused by the social calendar)
  - `content/channels.md` (platforms and house style)
  - voice cards at `brand/voices/<handle>.md`, through the voice-card atom
- **Brand documents** via the shared save-to-brain atom (`../save-to-brain/SKILL.md`):
  - The newsletter template, `versioned: supersede`, so the previous version is retired.
  - Drafts are never imported; they aren't brand facts.
  - When the marketer says a piece is published at a public URL, import it as content inventory (`gooseworks:knowledge_import` `url`, then `gooseworks:job_get` `kind: "knowledge_ingest"`). If the answer quotes a price, stop and ask.
- **Learnings** only via the shared save-learning atom (`../save-learning/SKILL.md`). Write only writing rules the marketer stated or confirmed in their own words: prefix `[content YYYY-MM-DD]`, one idea each, superseded own learnings retired. An inferred rule is asked as a question first.
- **Not yet stored in the brain:** a content library, a story bank (server-needs.md). The workspace files are the interim store.

## Done when

Every piece is saved and shown with, per path:
- **Repurposed set:** its units table, and one native version per platform.
- **Single post:** the hook and two alternatives.
- **Fresh piece:** its brief; for long-form and case studies, the marketer's outline yes recorded before the draft; the publish kit for long-form.
- **Refresh:** the section-by-section redline with a reason per change.
- **Newsletter:** the saved template.

And on every path: its edit note; one claims block; every unfilled gap tagged `[PROOF NEEDED: …]` (or `[CUSTOMER APPROVAL NEEDED]`, `[NAME: …]`, PERSON YES NEEDED). Nothing was invented.

## Out of scope

- A dated posting calendar, keeping accounts alive, posting: **run-organic-social**, which slots these cuts.
- Ad copy and creative: **make-static-ads** (image ads); video ads: the goose-video skill.
- Rendering images or carousels: make-static-ads; produced video: the goose-video skill. Here: words, scripts, slide copy, shot notes.
- Keyword research, content audits, visibility checks: **improve-search-visibility**, which sends page briefs here.
- Which topics get the month's capacity: the marketer, with **plan-campaign**'s brief.
- Promo email broadcasts and flows: **email-lifecycle**. The editorial newsletter issue is here.
- Approving claims: the scoped sign-off runs inline through the claims gate. A full claims audit and signing off the brand voice are not covered yet.
- Landing pages, product and listing pages, press releases, sales decks, one-pagers and battlecards, sponsor reads, translation: not covered yet. Say so plainly, without naming internal plans.
