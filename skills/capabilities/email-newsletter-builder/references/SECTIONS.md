# Section Templates — Email Newsletter Builder

Copy-paste HTML blocks for each available email section. All sections use inline styles, table-based layout, and are compatible with Loops, Mailchimp, Beehiiv, Resend, and standard email clients.

Replace placeholder values (marked with `<!-- -->` comments or `UPPERCASE` tokens) before using.

---

## `header`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#0f0f0f; padding:20px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="color:#ffffff; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:20px; font-weight:bold; letter-spacing:-0.5px;">
            BRAND NAME <!-- or <img src="logo.png" alt="Brand" height="32"> -->
          </td>
          <td style="text-align:right; color:#666666; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px;">
            Issue #00 · Month DD, YYYY
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## `hero`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:48px 32px 32px;">
      <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#e8ff00; background-color:#0f0f0f; display:inline-block; padding:4px 10px;">
        SECTION LABEL <!-- e.g. "THIS WEEK" or "FEATURED" -->
      </p>
      <h1 style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:32px; font-weight:800; line-height:1.2; color:#0f0f0f; letter-spacing:-1px;">
        HERO HEADLINE HERE
      </h1>
      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:18px; line-height:1.6; color:#444444;">
        1–2 sentence hook. Sets up the rest of the email.
      </p>
    </td>
  </tr>
</table>
```

---

## `intro`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:0 32px 32px;">
      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.7; color:#1a1a1a;">
        Short personal note or context-setting paragraph. 2–3 sentences max. Optional — skip for more formal newsletters.
      </p>
    </td>
  </tr>
</table>
```

---

## `main-content`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:0 32px 32px;">
      <h2 style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; font-weight:700; line-height:1.3; color:#0f0f0f;">
        Section Heading
      </h2>
      <p style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.7; color:#1a1a1a;">
        Paragraph one. Main insight or story. 3–5 sentences.
      </p>
      <p style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.7; color:#1a1a1a;">
        Paragraph two. Supporting detail or example.
      </p>
      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.7; color:#1a1a1a;">
        Paragraph three. Takeaway or transition to CTA.
      </p>
    </td>
  </tr>
</table>
```

---

## `image-block`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:0 32px 32px;">
      <img
        src="https://placehold.co/536x300/0f0f0f/e8ff00?text=IMAGE"
        alt="Description of image"
        width="536"
        height="300"
        style="display:block; width:100%; height:auto; border-radius:4px;"
      />
      <p style="margin:8px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#999999; line-height:1.5;">
        Caption text here. Source or credit if applicable.
      </p>
    </td>
  </tr>
</table>
```

---

## `stat-callout`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:0 32px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color:#f5f5f5; border-left:4px solid #e8ff00; padding:24px 28px;">
            <p style="margin:0 0 8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:40px; font-weight:800; color:#0f0f0f; line-height:1;">
              STAT OR FIGURE <!-- e.g. "42%" or "$2.4B" -->
            </p>
            <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; color:#444444; line-height:1.5;">
              Context sentence explaining the stat. Short and punchy.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

For a pull quote instead of a stat:
```html
<!-- Replace the <p> stat line with: -->
<p style="margin:0 0 12px; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-style:italic; color:#0f0f0f; line-height:1.4;">
  "Pull quote text here. One or two sentences."
</p>
<p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; font-weight:600; color:#666666; text-transform:uppercase; letter-spacing:1px;">
  — Attribution Name, Title
</p>
```

---

## `secondary-section`

Same structure as `main-content` but with a lighter visual weight. Separate from the primary content with a divider.

```html
<!-- Divider before secondary section -->
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:0 32px;">
      <hr style="border:none; border-top:1px solid #e8e8e8; margin:0;" />
    </td>
  </tr>
</table>

<!-- Secondary content -->
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:32px;">
      <p style="margin:0 0 8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#999999;">
        ALSO THIS WEEK
      </p>
      <h2 style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:20px; font-weight:700; color:#0f0f0f;">
        Secondary Section Heading
      </h2>
      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.7; color:#1a1a1a;">
        Supporting content. Shorter than the main section — 2 paragraphs max.
      </p>
    </td>
  </tr>
</table>
```

---

## `product-cta`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#0f0f0f; padding:32px;">
      <p style="margin:0 0 8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#e8ff00;">
        FROM THE TEAM
      </p>
      <h2 style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:22px; font-weight:700; color:#ffffff;">
        Product or Feature Headline
      </h2>
      <p style="margin:0 0 24px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.6; color:#cccccc;">
        1–2 sentence soft pitch. What it does, why it matters. No hard sell.
      </p>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color:#e8ff00; padding:14px 28px; border-radius:4px;">
            <a href="https://example.com" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:700; color:#0f0f0f; text-decoration:none; display:inline-block;">
              CTA LABEL →
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## `sponsor-block`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#fffdf0; border:1px solid #e8e8e8; padding:24px 32px;">
      <p style="margin:0 0 12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#999999;">
        SPONSORED
      </p>
      <h3 style="margin:0 0 8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:18px; font-weight:700; color:#0f0f0f;">
        Sponsor Name — Short value prop headline
      </h3>
      <p style="margin:0 0 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; line-height:1.6; color:#444444;">
        2–3 sentence sponsor message. Written in editorial voice. Must be clearly distinct from non-sponsored content.
      </p>
      <a href="https://sponsor.com/link" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; font-weight:600; color:#0f0f0f; text-decoration:underline;">
        Learn more →
      </a>
    </td>
  </tr>
</table>
```

---

## `quick-links`

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#ffffff; padding:32px;">
      <p style="margin:0 0 20px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#999999;">
        QUICK LINKS
      </p>
      <!-- Link item — repeat for each link (3–5 recommended) -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <tr>
          <td width="24" style="vertical-align:top; padding-top:2px;">
            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:14px; color:#e8ff00; font-weight:900;">→</span>
          </td>
          <td>
            <a href="https://example.com" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:15px; font-weight:600; color:#0f0f0f; text-decoration:none; display:block; margin-bottom:2px;">
              Link Title
            </a>
            <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#666666; line-height:1.5;">
              One sentence description of why this link is worth clicking.
            </span>
          </td>
        </tr>
      </table>
      <!-- /Link item -->
    </td>
  </tr>
</table>
```

---

## `footer`

Replace platform-specific unsubscribe tag as needed. See `references/PLATFORMS.md`.

```html
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td style="background-color:#0f0f0f; padding:32px; text-align:center;">
      <!-- Social links (optional) -->
      <p style="margin:0 0 16px;">
        <a href="https://twitter.com/handle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#999999; text-decoration:none; margin:0 8px;">Twitter</a>
        <a href="https://linkedin.com/company/handle" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#999999; text-decoration:none; margin:0 8px;">LinkedIn</a>
        <a href="https://example.com" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:13px; color:#999999; text-decoration:none; margin:0 8px;">Website</a>
      </p>
      <!-- Legal (required by CAN-SPAM) -->
      <p style="margin:0 0 8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:#666666; line-height:1.6;">
        © 2025 Brand Name · 123 Street Name, City, State ZIP, Country
      </p>
      <!-- Unsubscribe -->
      <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; font-size:12px; color:#666666;">
        You're receiving this because you subscribed at example.com ·
        <a href="{{unsubscribeUrl}}" style="color:#999999; text-decoration:underline;">Unsubscribe</a>
      </p>
    </td>
  </tr>
</table>
```
