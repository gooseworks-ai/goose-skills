# Email Newsletter Builder

Draft and design a complete HTML email newsletter from a topic or content brief. Outputs paste-ready HTML (inline-styled, table-based), React Email (.tsx), MJML, or plain-text — compatible with Loops, Mailchimp, Beehiiv, Resend, and any standard email platform.

---

## When to Use

Use this skill when asked to:
- Draft an email newsletter from a topic, angle, or content brief
- Build a marketing, product, or drip email campaign
- Create a digest, announcement, or editorial email
- Convert raw notes or a blog post into a send-ready email
- Produce a newsletter in a specific format (HTML / React Email / MJML / plain text)

---

## Step 1 — Ask Clarifying Questions

Before writing anything, ask the following. If any answer is already present in the brief, skip that question.

| Question | Why it matters |
|---|---|
| What is this newsletter about? (topic, angle, key message) | Core content |
| Who is the audience? (role, interests, relationship to the brand) | Tone and depth |
| What tone? (educational / conversational / bold / formal / playful) | Voice and style |
| What is the primary CTA? (read article, book demo, join waitlist, share, buy) | Required for CTA block |
| Any secondary CTAs or sections? (sponsor block, product feature, event, quick links) | Structure |
| What platform? (Loops / Mailchimp / Beehiiv / Resend / other) | Merge tags, unsubscribe syntax, format recommendation |
| What output format? (HTML / React Email / MJML / plain text) | Defaults to HTML; recommend React Email for Resend |
| Brand color and font preference? | Inline styling |
| Subject line: suggest options, or do you have one? | If omitted, output 3 options |
| Do you want a plain-text fallback included? | Accessibility + anti-spam |

Minimum required to proceed without asking: `topic`, `audience`, `cta`. Everything else has a default.

---

## Step 2 — Select Email Sections

Compose the email from these available sections. Use judgment based on the brief — not every email needs every section.

| Section | Purpose |
|---|---|
| `header` | Logo + issue number or date |
| `hero` | Big headline + 1–2 sentence hook |
| `intro` | Short personal note or context setter |
| `main-content` | Primary article, insight, or story (text-heavy) |
| `image-block` | Full-width image + caption |
| `stat-callout` | Highlighted stat or pull quote in a styled box |
| `secondary-section` | Second story or supporting feature |
| `product-cta` | Soft product plug or feature highlight |
| `sponsor-block` | Sponsored content block (must be labeled "Sponsored") |
| `quick-links` | Curated links section (3–5 items) |
| `footer` | Unsubscribe link, social icons, mailing address, legal |

Default structure for a standard newsletter: `header` → `hero` → `intro` → `main-content` → `product-cta` → `footer`

---

## Step 3 — Build the Output

### Parameters

| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| `topic` | string | Yes | — | What the newsletter is about |
| `audience` | string | Yes | — | Who's reading |
| `cta` | string | Yes | — | Primary action you want readers to take |
| `tone` | string | No | editorial | educational / conversational / bold / formal / playful |
| `platform` | string | No | generic | loops / mailchimp / beehiiv / resend |
| `format` | string | No | html | html / react-email / mjml / plain-text |
| `brand_color` | string | No | #e8ff00 | Hex code for primary accent color |
| `subject_line` | string | No | — | If omitted, output 3 subject line options |
| `sections` | array | No | default set | Which sections to include |
| `plain_text` | boolean | No | false | Include plain-text fallback after HTML |

---

## Output Formats

### HTML (default)

Inline-styled, table-based. Works in every ESP and email client. See rendering rules below.

Output order:
1. **Metadata block** (HTML comment at top):
   ```
   <!--
   Subject: ...
   Preview text: ...
   Suggested send time: ...
   Platform: ...
   Paste instructions: ...
   -->
   ```
2. **3 subject line options** (if none provided)
3. **Full HTML** in a code block
4. **Plain-text fallback** (if requested)

---

### React Email

Component-based `.tsx` output. Recommended for Resend or any dev team sending via API.

- Use `@react-email/components`: `Html`, `Head`, `Body`, `Container`, `Section`, `Text`, `Button`, `Img`, `Hr`, `Link`, `Preview`
- Personalization via props: `({ firstName }: { firstName: string }) => ...`
- No inline style objects needed — React Email handles rendering
- Output: a single `.tsx` file, self-contained, with a default export

Example skeleton:
```tsx
import { Html, Head, Body, Container, Text, Button, Preview } from '@react-email/components';

interface Props {
  firstName?: string;
}

export default function Newsletter({ firstName = 'there' }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Preview text here</Preview>
      <Body style={{ backgroundColor: '#f4f4f4', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* sections here */}
        </Container>
      </Body>
    </Html>
  );
}
```

---

### MJML

MJML source that compiles to production-ready HTML. Use when the team wants maintainable source rather than hand-coded tables.

- Use `<mjml>`, `<mj-head>`, `<mj-body>`, `<mj-section>`, `<mj-column>`, `<mj-text>`, `<mj-button>`, `<mj-image>`, `<mj-divider>`
- Set `<mj-all font-family>` in `<mj-attributes>` for global font
- Output: a single `.mjml` file
- Remind the user to compile with `mjml input.mjml -o output.html` or use mjml.io

---

### Plain Text

- Strip all HTML, preserve structure with spacing and ASCII dividers
- Use `---` for section breaks
- Preserve all links as full absolute URLs on their own line
- Include unsubscribe URL as a plain text line in footer
- Cap line length at 80 characters

---

## HTML Rendering Rules

These rules make the HTML render correctly across Gmail, Outlook, Apple Mail, and all ESPs.

### Layout
- `<table>` layout only — no flexbox, no CSS grid (Outlook doesn't support them)
- Outer wrapper: `<table width="100%">` with `bgcolor="#f4f4f4"`
- Inner content container: `<table width="600">` centered
- Single-column body — never multi-column (breaks on mobile)
- Optional 2-column layout only in `quick-links` or `stat-callout` using nested tables

### Styles
- **All styles must be inline** (`style=""` attributes) — Mailchimp, Gmail, and some Beehiiv editors strip `<head>` CSS
- No CSS variables — use literal hex values
- No `<style>` blocks in `<head>` for anything that affects layout or typography

### Typography
- Font stack: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;`
- Body: `font-size: 16px; line-height: 1.6;`
- H1: 28–32px, H2: 22px, H3: 18px
- No web fonts (Google Fonts etc.) — they don't load in Gmail or Outlook

### Default Palette
| Token | Value |
|---|---|
| Background | `#f4f4f4` |
| Card/container | `#ffffff` |
| Header bg | `#0f0f0f` |
| Body text | `#1a1a1a` |
| Accent | `#e8ff00` |
| Muted text | `#666666` |

Override with `brand_color` if provided.

### Images
- Placeholder src: `https://placehold.co/600x300/0f0f0f/e8ff00?text=IMAGE`
- Always include `alt=""`, explicit `width=""`, `height=""`
- Hosted URLs only — no base64 (triggers spam filters)

### CTA Buttons
- Use `<table>` cell + `<a>` tag — never `<button>` element
```html
<table>
  <tr>
    <td style="background-color:#e8ff00; padding:14px 28px; border-radius:4px;">
      <a href="https://example.com" style="color:#0f0f0f; font-weight:bold; text-decoration:none; font-size:16px;">CTA Label</a>
    </td>
  </tr>
</table>
```

### Dark Mode
Where platform supports it, add media query in `<head>` for dark mode background swap:
```html
<style>
  @media (prefers-color-scheme: dark) {
    .email-body { background-color: #1a1a1a !important; }
    .email-container { background-color: #2a2a2a !important; }
  }
</style>
```
Note: this is the one acceptable `<style>` block — it's progressive enhancement, not layout-critical.

---

## Platform Merge Tags & Unsubscribe

See `references/PLATFORMS.md` for full syntax. Quick reference:

| Platform | First name | Unsubscribe |
|---|---|---|
| Loops | `{{first_name}}` | `{{unsubscribeUrl}}` |
| Mailchimp | `*\|FNAME\|*` | `*\|UNSUB\|*` |
| Beehiiv | `{{subscriber.first_name}}` | `{{unsubscribe_url}}` |
| Resend | Interpolate server-side | `List-Unsubscribe` header |
| Generic | `{{first_name}}` | `{{unsubscribe_url}}` |

Always include an unsubscribe link in every HTML footer — required by CAN-SPAM and GDPR.

---

## Quality Checklist

Run before outputting every email:

- [ ] All styles inline — no `<style>` blocks affecting layout
- [ ] Table-based layout — no flexbox, no grid
- [ ] Max width 600px
- [ ] Images have `alt`, `width`, `height`
- [ ] CTA uses `<table>` + `<a>`, not `<button>`
- [ ] Unsubscribe link present with correct platform syntax
- [ ] Subject line ≤ 50 characters
- [ ] Preview text ≤ 90 characters, distinct from subject
- [ ] No web fonts
- [ ] All links are absolute URLs
- [ ] Mailing address present in footer (CAN-SPAM)
- [ ] Sponsor block labeled "Sponsored" if present

---

## Example Invocations

**Minimal:**
> "Write a newsletter about how AI is changing B2B sales."

**Fully specified:**
> "Write a newsletter about how AI is changing B2B sales. Audience: VPs of Sales at 100–500 person SaaS companies. CTA: join our upcoming webinar. Tone: direct and confident. Platform: Beehiiv."
>
> Output: Full HTML email with hero headline, 3-section body, stat callout, webinar CTA block, footer. 3 subject line options. Plain-text version.

**React Email for Resend:**
> "Build a product update email for Resend. React Email format. Brand color: #0057ff."

**MJML:**
> "Create a weekly digest email in MJML. Audience: indie hackers. Tone: casual."

**From existing content:**
> "Turn this blog post into a newsletter. Keep it under 400 words. Add a CTA to read the full post. Platform: Mailchimp."
