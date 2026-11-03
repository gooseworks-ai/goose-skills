# Human version

This checks what a competitor's public pages reveal about their tools and tracking tags. A tag in a page is evidence of that tag's presence, not evidence that it works or that the company spends on ads.

---

# Agent version

## Inspect the requested pages

1. Use the supplied URLs; if only a domain is supplied, inspect the homepage and one relevant pricing or campaign page. Record exact URL, redirects, read date, response/consent state and whether you read raw HTML, a rendered document or observed network requests. Reuse the rival record's messaging, CTA and customer evidence; the missing task here is technology evidence.
2. Read public HTML and, when the host supports it, the rendered page/scripts and requests. A cleaned-text fetch cannot inspect script tags: label technology **not checked** and name the missing source-reading capability. No login, consent bypass, form submission or paid vendor lookup. No shell requirement; a source-capable host fetch/browser is sufficient.
3. Record each detection with exact evidence and location: script/request hostname or path, signature in HTML, generator metadata, or a visible widget. Useful families: analytics (Google Analytics, PostHog, Mixpanel, Plausible), tag manager, ad tags (Meta, Google Ads, LinkedIn, TikTok, X), CRM/automation, chat, testing/recording, CMS/framework. Report other tools only when a signature supports them. A vague filename or product mention in article prose is not a detection. An HTML-commented or disabled historical script is possible historical configuration only, not an active loaded tag. A tag manager alone does not reveal the tags it might load.
4. Distinguish **detected** (specific observed signature), **possible** (ambiguous evidence, why), **not detected in this read** (the relevant source was inspected), and **not checked**. Source-read pages may omit deferred/consent-gated or server-side integrations. A blocked or uninspected page is never “no tools”. Do not output account/tag identifiers or secrets; retain only the signature needed to substantiate the tool.

## Output and check

Write the focused report with a brief summary and this table:

| Page | Tool/family | Status | Evidence and how read | Checked on | Limit / meaning for us |
|---|---|---|---|---|---|

Show page-level coverage, not an invented company-wide stack. Add the existing CTA/customer/message findings only if the ask requested them; do not repackage them as new discoveries. Recommendations must follow from the evidence: copying a tool is not a strategy. Inspect every supplied URL or name each unread one and its reason. Every detection must trace to the observed source, and missing signatures must retain the qualified wording above. Save/deliver through focused-outputs.md.
