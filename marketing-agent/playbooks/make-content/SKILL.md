---
name: make-content
description: >-
  Write articles, newsletters, scripts and repurposed posts. Use when a marketer says "write a blog post / article / guide / case study / comparison page", "write one LinkedIn post / X post / thread", "draft this week's newsletter", "turn this webinar / video / blog into posts", "repurpose this", "write a YouTube or TikTok script", "launch post and release notes", "refresh this old post", "turn my rant into a post", or "write the page from this SEO brief". Delivers a brief and a first draft you edit rather than rewrite, or one asset turned into a native version per platform. Each piece comes with an edit note and a claims check showing what was cut and why. Never invents a claim, customer, number, story or opinion. Words only; nothing is published. Not for a dated posting calendar or keeping accounts alive — use run-organic-social. Not ad copy (make-static-ads) or promo emails (email-lifecycle). Press releases, product pages, landing pages and sales decks are not covered.
---

# make-content

## What you get

One of five things, saved to the brand's workspace and shown in chat:

1. **A repurposed set.** One finished asset is mined into scored units. Each platform the brand uses gets a native version with a different lead unit and hook, ready to paste. Each version has an asset line saying what visual it needs and who makes it.
2. **A single post.** One LinkedIn, X, Threads or Instagram post, or a thread, written native to its platform. It skips the calendar and the units table unless there is a source asset.
3. **A fresh piece.** A one-page brief, then a first draft in the brand's (or a named author's) voice. Long-form adds the publish kit: headline options, meta, slug, H2 skeleton, internal links, CTA, image notes and distribution notes.
4. **A refresh redline.** An old piece rewritten where it decays, with each change and its reason.
5. **This week's newsletter issue,** written from a saved template and the week's notes.

Every piece carries an **edit note** and a **claims check**: what was kept, softened and cut, and the proof that would restore each cut. The formats are listed in references/formats.md. Anything else is routed (Out of scope).

## Before you start

1. **Connection.** If no GooseWorks tools are listed, even after one `gooseworks:tools_load` for the missing group, say only: "Connect GooseWorks first — I write from your brand's voice and claims through it." Nothing else runs.
   - On the first GooseWorks call of the conversation, call `gooseworks:get_started` with the marketer's words (`wants: "more"`, `client`). It settles setup and the brand only; this playbook's gates win.
   - Send `client` on every call that takes it.
   - Talk to the marketer in outcomes. Never name a tool, id, playbook or vendor, and quote credits exactly as GooseWorks gives them.
2. **Brand and workspace.** `gooseworks:brand_read` with no `brand_id` lists brands with their `coworker_agent_id`, which is the scope for every file below. Use the brand the marketer named, or ask which. If the brand has no coworker, use the default workspace, prefix every path with `brands/<brand-slug>/`, and tell the marketer. Never use the org shared scope.
3. **Brain read (free, silent).**
   - `gooseworks:brand_read` lean (no `detail`) with `sections: ["summary","kit","learnings","sources","organic","products"]`. A lean read returns every `must` and `dont` fact, so it is enough for the claims marker, the claims you may use and the never-say list. Then `product_ids: [...]` for the products the piece covers.
   - Read learnings in full (`sections: ["learnings"]`, `detail: "full"`) only when you need `do`, `insight` or `template_hint` rules. Never request `detail: "full"` across several sections: that runs to hundreds of thousands of characters.
   - `gooseworks:knowledge_search` with the task itself, for past content and documents.
   - `gooseworks:file_list` on `content/` and `brand/voices/`; `gooseworks:file_read` `content/channels.md`.
   - The brand's platforms, in this order: `content/channels.md` → `social/accounts.md` → `sources` rows with `relationship: "self"` and `source_type: "organic_social"`, plus `organic.own_accounts`. Ignore the ad-library sources.
4. **Say plainly what the brain can't support, before drafting.** If the lines this piece needs (the core positioning, a number, a customer name) aren't signed off, run the shared claims gate's **scoped sign-off** when it applies (never when someone else approves claims: then those lines wait, and the piece uses plain product facts) (`../../atoms/claims-gate/ATOM.md`): put the 3–5 lines to the marketer (in the #5 message when there is one) and record their answer. If they decline, write around them with plain product facts. When something the marketer says contradicts the brain, ask which is true and save the answer as their correction.
5. **Ask only what is missing, in one message, at most four questions.**
   - Repurpose: the source asset, and the platforms if not saved.
   - Single post: the platform, the point and whose account it is for (brand page or a named person), if not given.
   - Fresh piece: topic, audience, format, where it publishes and by when, and the CTA destination.
   - Opinion-led piece: whether the marketer has a view.
   - Case study: the interview transcript, the customer's written OK to be named and quoted, and the results period.

   - Search-intent piece: the yes for the search-results read when it needs the proxy (step 4).

   Never guess any of these. With no topic, offer 3 candidate questions from the voice-of-customer bank, labelled "unverified: you pick". Save the platform list and house style to `content/channels.md`; they are not learnings.

## Steps

**1. Pick the path.** Repurpose · single post · fresh piece · refresh · newsletter.
- A sibling's request arrives as a page brief (`search/briefs/<page-slug>.md`), an asset-list row (`gooseworks:campaign_read`) or a "what to make next" line (`reports/performance/<date>.md`). Treat it as a fresh piece with that input.
- Read any `Graphic ready:` answers under your earlier asset lines and image notes (`content/repurposed/`, `content/drafts/`). Attach those images to the pieces they belong to.
- Do only the work the ask needs.

**2. Repurpose.**
- Get the source in (references/repurposing.md §1).
- Mine and score units (atoms/source-to-units). A thin source, such as a short silent clip, supports 2–3 versions. Say so, and suggest a richer asset.
- References only, never to copy: `gooseworks:social_inspiration_search`, or `brand_read` `organic.competitor_top_posts` (skip posts outside the brand's category).
- Write one native version per platform the brand uses, each led by a different unit (references/repurposing.md §4). Skip the platform the source already lives on unless a re-cut is asked for. Add a second surface on a platform only when strong units outnumber platforms.
- Writes `content/repurposed/<source-slug>/<YYYY-MM-DD>.md`.

**3. Single post.**
- Write it to references/repurposing.md §4 for its platform and account (brand page or a named person), with the hook first and 2 alternatives.
- Voice: the account's card if one exists; else the brand card (build it free from `brand_read organic` when ≥8 own posts exist); else match against atoms/two-pass-edit's fallback order and label the post "voice provisional". Never open a paid read or the voice interview for one post; offer to build a card afterwards.
- Then step 6. No brief, no calendar intake.
- If the marketer wants a run of posts over dates, say you can plan a two-week calendar instead, and stop here.
- Writes `content/drafts/<YYYY-MM-DD>-<slug>.md`.

**4. Fresh piece.** In this order:
1. **Brief** (atoms/content-brief).
   - **Search-intent pieces** (SEO, answer, comparison, a how-to people search for), when no page brief carries the top results: read them first. Use the host's own web search (free), or one `/v1/google/search` read through the proxy (`foundation/data-access`, `../../atoms/spend-gate/ATOM.md` proxy branch, with the yes asked in the #5 message).
   - Open the top 3 results and log URLs and dates. With no fetch, judge information gain from titles and snippets and label it "snippets only". "Information gain: not checked" ships only if the marketer declines the read.
   - Then the public sources for world facts.
2. **POV.** If a view is needed and missing, run the interview (references/point-of-view.md). With no answer, write the no-POV version and label it.
3. **Proof gate.** Count only H2s that make factual claims; interview lines count as proof. If fewer than half are proofed, stop at the brief and hand over "what unlocks this draft" (4–6 specific asks).
4. **Outline gate.** Long-form and every case study: show the brief and outline and wait for a yes.
5. **Draft.**
   - Bylined pieces: the author's card through the voice-card atom.
   - Draft to the format's anatomy (references/formats.md), section by section for long pieces, saving each with `gooseworks:file_write`.
   - Fill proof only from the brief's inventory; each gap stays `[PROOF NEEDED: …]`.
   - Writes `content/drafts/<YYYY-MM-DD>-<slug>.md`. A page draft puts its `search/briefs/…` path on line one.

**5a. Refresh.**
- Get the current text in.
- Keep what earns its place. Rewrite the lede and title.
- Update stale facts only to sourced or signed-off ones. Add what the decay reason points to, and cut what's outdated.
- Deliver a section-by-section redline: old → new, and why.
- Writes `content/refresh/<YYYY-MM-DD>-<slug>.md`.

**5b. Newsletter.**
- If `content/newsletter/template.md` is missing, send one message with:
  - a proposed default: a 300–500-word editor's letter, 2–4 items each with "why it matters", one CTA, a sign-off;
  - at most four questions: who signs it, who the list is and how they joined, send day, CTA destination;
  - the ask for this week's notes.
- With no notes, offer an issue built from the brain, labelled "unverified: you pick".
- Save the template. On later runs, ask only for the week's notes.
- The lead is an editor's note from the notes, in the signer's voice. It needs the POV interview only when it argues a position.
- Writes `content/newsletter/<YYYY-MM-DD>.md`.

**6. Edit, check, edit** (atoms/two-pass-edit):
1. The substance pass.
2. The claims check: the shared claims gate (`../../atoms/claims-gate/ATOM.md`) for brand claims, plus references/fact-rules.md for world facts, competitor facts, stories, sensitive topics and third-party rights. When a piece is sponsored, affiliate, gifted or a creator collaboration, also load `../../atoms/ad-policy-check/disclosure.md` and apply it.
3. The readability pass and the AI-tell check on what survived.

Attach the edit note and one claims block per piece or set.

**7. Hand over.**
- Show, in order: title and path; the brief or a link to it; the piece; the publish kit (long-form); the edit note; the claims check; open gaps (`[PROOF NEEDED]`, `[CUSTOMER APPROVAL NEEDED]`, `[NAME: …]`, PERSON YES NEEDED).
- For a large set, show the strongest three in full and say the rest are in the file.
- End with: "Nothing is published — you edit and post. If you want the social pieces in a two-week posting calendar, ask for it next." Offer only; never start another playbook yourself (AGENTS §2 rule 9).

## Approval gates

- **Claims.** Brand claims follow the shared claims gate: signed-off claims verbatim, or scoped sign-off now, or plain product facts only. World facts, competitor facts, stories, sensitive topics and third-party rights follow references/fact-rules.md. Never self-approve. A case study with unapproved names or numbers is delivered as **blocked**.
- **Point of view.** Opinions, stories and first-person experience come only from the marketer or the named person. If missing, ask. If they decline, use the no-POV format.
- **Bylines and named people.** Anything published under, or quoting, a named person carries PERSON YES NEEDED: that person's own yes.
- **Outline.** Long-form and case studies: the brief and outline get a yes before drafting.
- **Publishing.** Nothing goes live from here.
- **Money.** The default path is free. A proxy read (top search results, post history) or any import that quotes a price follows the spend gate: a probe with a yes, then a ceiling.

## Output and write-back

- **Workspace** (brand coworker scope):
  - `content/briefs/`, `content/drafts/`, `content/repurposed/<source>/`, `content/refresh/`
  - `content/newsletter/template.md` and `content/newsletter/<date>.md`
  - `content/pov/` (interview answers, reused by the social calendar)
  - `content/channels.md` (platforms and house style)
  - voice cards at `brand/voices/<handle>.md`, through the voice-card atom
- **Brand documents** via the shared save-to-brain atom (`../../atoms/save-to-brain/ATOM.md`):
  - The newsletter template, `versioned: supersede`, so the previous version is retired.
  - Drafts are never imported; they aren't brand facts.
  - When the marketer says a piece is published at a public URL, import it as content inventory (`gooseworks:knowledge_import` `url`, then `gooseworks:job_get` `kind: "knowledge_ingest"`). If the answer quotes a price, stop and ask.
- **Learnings** only via the shared save-learning atom (`../../atoms/save-learning/ATOM.md`). Write only writing rules the marketer stated or confirmed in their own words: prefix `[content YYYY-MM-DD]`, one idea each, superseded own learnings retired. An inferred rule is asked as a question first.
- **Not yet stored in the brain:** a content library, a story bank (server-needs.md). The workspace files are the interim store.

## Done when

The marketer edits the fresh draft or single post rather than starting over, and each repurposed version could be posted after a light edit. Every piece carries its brief or units table, its edit note and its claims check. Nothing was invented.

## Out of scope

- A dated posting calendar, keeping accounts alive, posting: **run-organic-social**, which slots these cuts.
- Ad copy and creative: **make-static-ads**, **make-video-ads**.
- Rendering images, video or carousels: the maker playbooks. Here: words, scripts, slide copy, shot notes.
- Keyword research, content audits, visibility checks: **improve-search-visibility**, which sends page briefs here.
- Which topics get the month's capacity: the marketer, with **plan-campaign**'s brief.
- Promo email broadcasts and flows: **email-lifecycle**. The editorial newsletter issue is here.
- Approving claims and the brand voice: **learn-my-brand** (the scoped sign-off runs inline through the claims gate).
- Landing pages, product and listing pages, press releases, sales decks, one-pagers and battlecards, sponsor reads, translation: not covered yet. Say so plainly, without naming internal plans.
