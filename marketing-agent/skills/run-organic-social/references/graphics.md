# Carousels and graphics: render them with goose-graphics

Load at step 4 for any slot whose asset is designed rather than shot: an Instagram or TikTok photo carousel, a LinkedIn document post, a workflow diagram, a quote or stat card, a simple chart of the brand's own numbers, or a single designed image. This playbook writes the words; **goose-graphics** renders the slides. goose-graphics is a GooseWorks skill kept in the catalog: it turns HTML into PNGs with Playwright. It is not a playbook, so loading it is a tool step, not a hand-off.

## 1. Get goose-graphics

1. **Already installed in the host** (Claude Code, Codex, Cursor): load the `goose-graphics` skill and follow its own steps.
2. **Not installed, host has a shell:** fetch it with `gooseworks:catalog_fetch` (`type: "skill"`, `slug: "goose-graphics"`, `delivery: "archive"`). Verify the hashes the answer gives, unpack it into the host's skills folder, and load it.
   - It needs Node and Playwright, which it sets up on first run (its "First-Run Setup").
   - It also needs the GooseWorks CLI for its style and format catalog. With no CLI, use its `--ref` route (below), which doesn't need the catalog.
3. **No shell** (hosted chat): it can't run. Hand over the slide table (references/slot-anatomy.md) and say plainly: "I can't render slides here. Here's the slide-by-slide copy; it takes about 45 minutes in Canva or Figma." The server fix is in server-needs.md.

Rendering is local and free, so it needs no credit yes. Never use the community "surprise me" style.

## 2. Style comes from the brand, not the catalog

- Build the style from the brand kit (`brand_read` `kit`): primary and accent colours, fonts, logo, and any of the brand's own templates or past posts.
- Run goose-graphics with `--ref` on the brand's own best-performing carousel or post image when one exists. Otherwise give it the kit's colours and type as the brief's style notes.
- Pick a community style only if the marketer asks for one.
- **Style preview first:** render slide 1 (the hook slide) alone and check it before rendering the rest. One look saves a full re-render.

## 3. Canvas per slot

goose-graphics renders only to its built-in canvases. Map each slot to one of these:

| Slot | Size | Canvas | Then |
|---|---|---|---|
| Instagram carousel (4:5) | 1080 × 1350 per slide | `poster`, one HTML file per slide | Numbered PNGs, in order |
| Square carousel, quote or stat card, X image | 1080 × 1080 | `carousel` | PNGs |
| TikTok photo carousel, story | 1080 × 1920 | `story` | PNGs |
| LinkedIn document post | 1080 × 1350 (or 1080 × 1080) per page | `poster` (or `carousel`) | Combine the PNGs into **one PDF**, in order, with the host's shell; LinkedIn uploads documents as PDF |
| Workflow diagram (landscape, for X or a blog) | 1920 × 1080 | `slides` | PNG |
| Workflow diagram (square, for LinkedIn or Instagram) | 1080 × 1080 | `carousel` | PNG |

## 4. Slide rules (density, type, export)

- **One idea per slide.**
  - Slide 1 is the hook (≤10 words).
  - Slide 2 has its own hook, because Instagram re-serves carousels at slide 2.
  - The last slide is the save or send prompt.
- **Density limit per slide:**
  - a heading plus 3–4 short points;
  - or a heading plus 2 short paragraphs;
  - a quote card: one quote of at most 3 lines, plus attribution;
  - a stat card: one number, one line on what it means, plus its source.
- **If it doesn't fit, split the slide, never shrink the type.**
- **Fixed type scale on a 1080 canvas:** title 72 px, subtitle 36 px, body 28 px, small 20 px. Use line-height 1.2–1.4 and padding of about 80 px. Text must read on a phone at thumbnail size.
- **Contrast:** at least 4.5:1 for all text. Keep text out of the bottom ~20% and the right edge on Instagram and TikTok (the UI covers them).
- **Export:**
  - 2× device scale;
  - wait for fonts to load before the screenshot, or system fonts appear;
  - check every slide for overflowing or cut-off text before you hand it over.

## 5. Workflow diagrams (a staple B2B format on LinkedIn and X)

- **Parse the steps first:** each node is an action in 2–4 words, plus an optional detail line (the tool or the input). Number the nodes. At most 2 lines per label.
- **Layout:**
  - 3–5 steps: top-to-bottom;
  - 4–8 steps: left-to-right;
  - more than 6 steps: a snake of at most 4 nodes per row, alternating direction.
  - More than about 10 steps is two diagrams, not one.
- **Nodes:** equal width (about 200–240 px), clear arrows (2–3 px) with 60–100 px gaps, the brand's colours. No decorative clutter.
- **Content:** a real workflow from the brand's own material (its docs, a run the person did), never an invented process. Its words go through the claims gate like any post.

## 6. After rendering

- **Review** the way the `honest-review` skill (`../../honest-review/SKILL.md`) says: look at every slide, or, if the host can't show images to you, run its "can't see it" checklist and say so.
  - readable at phone size;
  - contrast;
  - nothing cut off;
  - the slide copy matches the approved copy word for word;
  - the claims gate on every slide's words.
- **Store the files on GooseWorks:**
  - `gooseworks:media_upload` (source `bytes` for small files, `file` plus `gooseworks:media_confirm` for large; `kind: "image"` for PNGs, `kind: "document"` for the LinkedIn PDF; scope brand);
  - list the links in the slot ("Slides: 8 images, uploaded");
  - the marketer downloads them from the report's links, or from the local output folder in a shell host.
- **Time in the plan:** a rendered carousel costs the marketer about 10 minutes to review and post, not 45. Count it that way in the weekly hours.
- **Managed TikTok/IG accounts:** once the slide images exist, `gooseworks:social_post_create` with `format: "image_carousel"` and `carousel.slides` can build a free draft post in the product, but only after the marketer's yes. Never use `render: true` or `approve`, which are the parked posting flow.
