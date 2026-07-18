# Platform Reference — Email Newsletter Builder

Merge tag syntax, paste instructions, unsubscribe requirements, and compatibility notes for each supported platform.

---

## Loops

**Type:** Modern ESP built for SaaS product emails and lifecycle sequences.

**Recommended format:** Standard HTML

**How to paste:**
1. Campaigns → New Campaign → Custom HTML
2. Paste full HTML into the code editor
3. Preview using Loops' built-in client simulator before sending

**Merge tags:**
| Variable | Tag |
|---|---|
| First name | `{{first_name}}` |
| Email address | `{{email}}` |
| Unsubscribe URL | `{{unsubscribeUrl}}` |

**Unsubscribe (required):**
```html
<a href="{{unsubscribeUrl}}" style="color:#999999; text-decoration:underline;">Unsubscribe</a>
```

**Notes:**
- Inline styles and table layout are fully supported
- Transactional emails sent via Loops API use the same HTML — pass it in the `html` field of the send payload
- Loops does not support AMP for email

---

## Mailchimp

**Type:** Full-service ESP with drag-and-drop and classic HTML editors.

**Recommended format:** Standard HTML

**How to paste:**
- **New builder:** Add a "Code" content block → paste HTML inside it
- **Classic editor:** Campaigns → Create → Email → Paste HTML
- Do not paste raw HTML into the drag-and-drop builder — use the Code block

**Merge tags:**
| Variable | Tag |
|---|---|
| First name | `*\|FNAME\|*` |
| Last name | `*\|LNAME\|*` |
| Email address | `*\|EMAIL\|*` |
| Unsubscribe URL | `*\|UNSUB\|*` |
| Update profile | `*\|UPDATE_PROFILE\|*` |

**Unsubscribe (required by Mailchimp):**
```html
<a href="*|UNSUB|*" style="color:#999999; text-decoration:underline;">Unsubscribe</a>
```

**Notes:**
- Mailchimp strips `<style>` blocks in `<head>` — all layout and typography styles must be inline
- Mailchimp auto-appends its own footer if no unsubscribe link is found — always include one
- Images must be hosted externally — no base64 embedded images
- Max HTML file size: 400KB — emails above this may be clipped by Gmail

---

## Beehiiv

**Type:** Newsletter-first platform for creator and media publications.

**Recommended format:** Standard HTML

**How to paste:**
1. Create a new post → open the block editor
2. Add a "Custom HTML" widget
3. Paste HTML inside the widget

**Merge tags:**
| Variable | Tag |
|---|---|
| First name | `{{subscriber.first_name}}` |
| Last name | `{{subscriber.last_name}}` |
| Email address | `{{subscriber.email}}` |
| Unsubscribe URL | `{{unsubscribe_url}}` |

**Unsubscribe:**
Beehiiv appends its own footer automatically. A custom in-body link is optional but supported:
```html
<a href="{{unsubscribe_url}}" style="color:#999999; text-decoration:underline;">Unsubscribe</a>
```

**Notes:**
- Beehiiv renders the custom HTML block inside its own wrapper — your inline styles will override Beehiiv's base styles
- Paid vs free subscriber targeting is handled at the segment level, not via merge tags
- Beehiiv supports dark mode — include the optional dark mode `<style>` block from SKILL.md

---

## Resend

**Type:** Developer-first transactional email API — code only, no GUI editor.

**Recommended format:** React Email (`.tsx`) for dev teams; standard HTML for quick sends

**How to send — Standard HTML:**
```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Your Brand <hello@yourdomain.com>',
  to: [subscriber.email],
  subject: 'Your subject line here',
  html: emailHtml, // full HTML string, personalized before passing
  headers: {
    'List-Unsubscribe': `<https://yourdomain.com/unsubscribe?token=${subscriber.token}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  },
});
```

**How to send — React Email:**
```javascript
import { render } from '@react-email/render';
import Newsletter from './emails/newsletter';

const html = render(<Newsletter firstName={subscriber.firstName} />);

await resend.emails.send({
  from: 'Your Brand <hello@yourdomain.com>',
  to: [subscriber.email],
  subject: 'Your subject line here',
  html,
});
```

**Merge tags / Personalization:**
Resend has no proprietary merge tag syntax. Personalize server-side before sending:
```javascript
// Simple string interpolation
const html = template
  .replace(/{{first_name}}/g, subscriber.firstName)
  .replace(/{{email}}/g, subscriber.email);

// Or use a templating library
import Handlebars from 'handlebars';
const compiled = Handlebars.compile(template);
const html = compiled({ firstName: subscriber.firstName });
```

**Unsubscribe:**
Handle via the `List-Unsubscribe` header (shown above). Optionally include a plain link in the footer:
```html
<a href="https://yourdomain.com/unsubscribe?token={{token}}" style="color:#999999;">Unsubscribe</a>
```
Note: `{{token}}` must be interpolated server-side before sending.

**Notes:**
- Domain verification (SPF, DKIM, DMARC) is required in the Resend dashboard before sending
- Rate limits: 2 emails/second (free), 100/second (paid)
- React Email components: `npm install @react-email/components`
- Preview React Email locally: `npx react-email dev`
- Resend also supports `text` field alongside `html` for plain-text fallback

---

## React Email — Component Reference

Use these imports for React Email output format:

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Heading,
  Button,
  Img,
  Hr,
  Link,
  Preview,
  Font,
} from '@react-email/components';
```

**Key patterns:**

```tsx
// CTA Button
<Button
  href="https://example.com"
  style={{ backgroundColor: '#e8ff00', color: '#0f0f0f', padding: '14px 28px', borderRadius: '4px' }}
>
  CTA Label
</Button>

// Stat callout box
<Section style={{ backgroundColor: '#f0f0f0', padding: '24px', borderLeft: '4px solid #e8ff00' }}>
  <Text style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>42%</Text>
  <Text style={{ color: '#666', margin: '4px 0 0' }}>of sales reps use AI daily</Text>
</Section>

// Image block
<Img
  src="https://example.com/image.png"
  width="600"
  height="300"
  alt="Description"
  style={{ width: '100%', display: 'block' }}
/>
```

---

## MJML — Tag Reference

```xml
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" />
      <mj-text font-size="16px" line-height="1.6" color="#1a1a1a" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#0f0f0f" padding="24px">
      <mj-column>
        <mj-text color="#ffffff" font-size="20px" font-weight="bold">Brand Name</mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="32px 24px">
      <mj-column>
        <mj-text font-size="28px" font-weight="bold">Hero headline here</mj-text>
        <mj-text>Body paragraph here.</mj-text>
        <mj-button background-color="#e8ff00" color="#0f0f0f" href="https://example.com">
          CTA Label
        </mj-button>
      </mj-column>
    </mj-section>
    <mj-section padding="16px 24px">
      <mj-column>
        <mj-text font-size="12px" color="#999999" align="center">
          © 2025 Brand Name · 123 Street, City, Country
          <br />
          <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

Compile with:
```bash
npx mjml input.mjml -o output.html
# or online at mjml.io/try-it-live
```

---

## Cross-Platform Compatibility Rules

| Rule | Why |
|---|---|
| Inline styles only (HTML) | Gmail, Mailchimp, Beehiiv strip `<head>` CSS |
| Table-based layout | Outlook ignores flexbox and CSS grid |
| Max 600px width | Safe across all email clients |
| No web fonts | Google Fonts don't load in Gmail or Outlook |
| No `<button>` elements | Use `<table>` + `<a>` for CTA buttons |
| No `<video>` elements | Not supported in Gmail or Outlook |
| Images: always `alt`, `width`, `height` | Prevents layout collapse when images are blocked |
| No base64 images | Triggers spam filters; use hosted URLs |
| Absolute URLs on all links | Relative links break in email clients |
| Unsubscribe in every footer | Required by CAN-SPAM and GDPR |
| Mailing address in footer | Required by CAN-SPAM |
