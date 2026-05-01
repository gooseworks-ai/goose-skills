# email-newsletter-builder

Draft and design a complete HTML email newsletter from a topic or content brief. Outputs paste-ready HTML, React Email (.tsx), MJML, or plain text — compatible with Loops, Mailchimp, Beehiiv, Resend, and any standard email platform.

---

## What it does

1. Asks clarifying questions about topic, audience, tone, CTA, and platform
2. Drafts the content structure (sections, headlines, CTAs)
3. Designs the email in well-supported HTML (inline styles, table-based layout)
4. Supports React Email and MJML for modern toolchains
5. Outputs copy-paste-ready HTML + optional plain-text fallback

---

## Supported platforms

| Platform | Notes |
|---|---|
| **Loops** | Paste into Custom HTML editor; uses `{{first_name}}` / `{{unsubscribeUrl}}` |
| **Mailchimp** | Paste into Code block; uses `*\|FNAME\|*` / `*\|UNSUB\|*` |
| **Beehiiv** | Paste into Custom HTML widget; uses `{{subscriber.first_name}}` |
| **Resend** | Raw HTML via API or React Email components; personalize server-side |
| **Generic** | Inline-styled HTML works everywhere |

---

## Output formats

| Format | Use case |
|---|---|
| `html` | Default — inline styles, table layout, works in all ESPs |
| `react-email` | Recommended for Resend or dev teams using `@react-email/components` |
| `mjml` | Maintainable source that compiles to production HTML |
| `plain-text` | Accessibility fallback and anti-spam compliance |

---

## Install

```bash
npx goose-skills install email-newsletter-builder
```

---

## Example

> "Write a newsletter about how AI is changing B2B sales. Audience: VPs of Sales at 100–500 person SaaS companies. CTA: join our upcoming webinar. Tone: direct and confident. Platform: Beehiiv."

Output: Full HTML email with hero headline, 3-section body, stat callout, webinar CTA block, and footer. 3 subject line options. Plain-text version.

---

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | Agent instructions — input handling, rendering rules, output formats, quality checklist |
| `skill.meta.json` | Skill metadata and installation contract |
| `references/PLATFORMS.md` | Full merge tag syntax, paste instructions, and send patterns per platform |
| `references/SECTIONS.md` | Copy-paste HTML blocks for every available email section |

---

## Author

**Pranav Tanna**
[github.com/pranav3229](https://github.com/pranav3229) · [linkedin.com/in/pranav-tanna-00390b235](https://www.linkedin.com/in/pranav-tanna-00390b235/)