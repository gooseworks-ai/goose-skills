# Repurposing: one asset into every platform version

Load in the repurpose path. The rule: **mine, map, then write fresh for each platform. Never trim the source.** A cropped version is the source's sentences cut to fit. A native version leads with a different unit, opens with that platform's hook grammar, fits how people consume that platform (silent scroll, swipe, skim, search), and stands alone without a "watch the webinar" dependency.

## 1. Get the source in

| Source | How |
|---|---|
| Public article or page | Fetch it with your own web tool when you have one. In a chat host with no web tool, ask the human to paste the text. Only the brand's **own** published pages may also be imported into brand knowledge (`gooseworks:knowledge_import` `url`; follow it with `gooseworks:job_get` `kind: "knowledge_ingest"` and `brand_id`). Never import a third party's article: it would mix outside content into the brand's facts. |
| The brand's own past TikTok/IG video | `gooseworks:brand_read` `sections: ["organic"]` gives each own post's `media_asset_id`; `gooseworks:media_analyze` `action: read` returns its transcript and timed scenes (free). |
| A webinar, podcast, talk or demo recording the human has | **With a shell:** `gooseworks:media_upload` (source `file` returns a presigned upload you PUT to, then `gooseworks:media_confirm`; source `bytes` for files under ~8 MB), then `gooseworks:media_analyze` `action: read` until it is `ready` (free; never ask the human to approve it). **Chat host with no shell:** ask for the platform's own transcript or caption export (Zoom, Riverside, YouTube Studio, the podcast host), or ask them to upload the file in the GooseWorks app, then find it with `gooseworks:media_list` and read it with `media_analyze`. |
| A YouTube or other public video URL | No tool on the server transcribes a public video by URL today (see server-needs.md). Ask for the file, or the transcript, or the auto-captions pasted. |
| A doc or PDF | Read the attachment directly (chat hosts read PDFs), or have the text pasted. Separately, if it is the brand's own document, it may also be imported for the brain (`gooseworks:media_upload` `kind: document`, then `gooseworks:knowledge_import`). That import does not return the text to you. |

Use the human's finished asset as the source of truth for what was said. The claims gate still governs what can be *claimed* (the `claims-gate` skill (`../../claims-gate/SKILL.md`) and references/fact-rules.md).

## 2. Mine atomic units

Read the whole source and list 15–30 units (fewer for a short post). Give each one a type, a verbatim anchor (a quote with a timestamp or paragraph number), and a score.

Types: claim · contrarian take · story or war story · stat (approved or sourced only) · verbatim quote · framework or steps · mistake + fix · before/after · objection + answer · audience question moment (often the best unit) · demo moment (visual).

Score each unit 1–3 on: stands alone without context · emotional charge · novelty (says what competitors don't) · proof attached. Keep the top units and drop the rest. A repurposed set built on weak units is filler however native it looks.

See the `make-content-source-to-units` skill (`../../make-content-source-to-units/SKILL.md`) for the output table.

## 3. Map units to formats

| Unit type | Best homes |
|---|---|
| Framework or steps | Carousel (IG, LinkedIn document), X thread, YouTube chapters, Pinterest pin |
| Story or war story | Short video, LinkedIn post, newsletter lede |
| Contrarian take | X post, Threads, short-video hook, LinkedIn opener |
| Verbatim quote | Quote card, pull-quote, newsletter |
| Stat | Single-image post, newsletter lede, LinkedIn hook |
| Audience Q&A | Short video ("someone asked…"), FAQ block, Reddit-style answer |
| Demo moment | Short clip script with exact in/out timestamps |
| Before/after | Carousel, short video, LinkedIn |

Each deliverable leads with a **different** unit. The set must not all open on the source's opening point.

## 4. Platform rules for the cut (undated; run-organic-social dates and slots them)

Write only for the platforms the brand actually uses. That list comes from SKILL.md, Before you start #3 (`content/channels.md`, then `social/accounts.md`, then the brand's own organic sources), or from the human once, saved per #5. Where a figure is marked (?), treat it as a soft default and say so if it matters. When a dated platform card under 30 days old exists in `social/research/`, its ranking facts win over these defaults; never state a ranking signal differently from it (one shared view).

- **X post / thread.** The first post is a standalone claim: no "🧵", no "A thread:". One idea per post, each survives alone. ≤280 characters each. 5–10 posts, or a single strong post when one idea carries it. The link goes in a reply, not the first post. 0–1 hashtags.
- **LinkedIn post.** On a person's profile: first-person, a story or an earned lesson, and only from that person's own words (PERSON YES NEEDED). On a company page: the "we" voice, no first-person story. The first ~2 lines (~140–210 characters before "see more") must make someone expand. Short paragraphs, but not one sentence per line throughout. 900–1,800 characters. The link goes in the first comment, or is dropped. 0–3 hashtags.
- **LinkedIn document carousel.** 8–12 pages. Page 1 is a hook a scroller would stop for. One point per page. The last page carries the takeaway and who to follow.
- **Instagram carousel.** 6–10 slides at 4:5 or 3:4. Slide 1 is the hook and works as a thumbnail. **Slide 2 has its own hook**, because people who skipped are re-served the carousel at slide 2. ≤25–30 words per slide, one idea each. The last slide asks for a save or a send ("send this to the friend who…"). The caption extends the hook rather than repeating it. ≤5 hashtags (?). Keywords go in the caption; IG captions are searchable.
- **Short video (TikTok, Reels, Shorts).** The script table from formats.md, plus 3 alternative hooks. For a clip cut from the source, give exact in/out timestamps and a **new** hook line or on-screen text, because the source's own first seconds are rarely a hook. Name the search phrase. Brand accounts on TikTok use commercial-library sounds only, so never script a trending song.
- **YouTube description and chapters.** The first ~150 characters sell the video. Chapters start at 0:00, from the transcript's timestamps.
- **Newsletter item.** 80–150 words: what it is, why it matters to *this* reader, one link.
- **Threads.** ≤500 characters, conversational, looser than X. A real question invites replies; bait does not.
- **Third-party IP and real people:** never feature characters, franchises, logos or real people the brand doesn't own or have a licence for (references/fact-rules.md).
- **Quote cards.** 3–5 verbatim lines from the source with speaker and timestamp. Never paraphrase inside quote marks.
- **Pinterest pin** (visual or consumer brands only). Title ≤100 characters, a search phrase. Description ≤500 characters in plain search language. Pins live for months, so no trend references.
- **Reddit or community answer.** Only when the human asks, and marked high-risk. Fully useful with the brand removed. Affiliation disclosed. Written to the specific community's rules.

## 5. The set, delivered

```
Repurposed set — <source title> (<source link or asset id>)
Units mined: <table from source-to-units>
Map: unit → platform → why
Then one block per platform version:
  Platform · format · lead unit · hook (+2 alternatives)
  The post / script / slides, ready to paste
  Asset line: what visual it needs and who makes it — a clip from the source with timestamps; the human's phone or camera roll; carousels designed by the human from the slide copy; a produced video ad only when they asked for one; or a single brand image, written as a request line:
    Graphic needed: for make-static-ads · <purpose, placement, exact text or none, mandatories> · return to: content/repurposed/<source-slug>/<date>.md
  (The answer, `Graphic ready: <link> · <YYYY-MM-DD> · alt: … · <ratio> · claims: …`, lands under that line; the next run reads it.)
  Claims check result
  Gate: PERSON YES NEEDED (<name>) when the version quotes or speaks for a named person, so the flag travels with the cut into the social calendar
```

**Sensitive or dated sources.** For mental health, suicide or medical topics, apply the sensitive-topic row in references/fact-rules.md (a resource line, no product tie-in). Drop "today is…" or "this week" framing once the date has passed.

The test before showing: put the versions side by side. If any two share an opening line, a structure or more than one sentence, rewrite the weaker one.
