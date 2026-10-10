---
name: goose-pages
description: Build, preview, edit and publish the page your ad lands on, with one page per angle, brand-grounded copy and hosted lead forms; also check ad-to-page message match.
version: 1.0.0
tags: [ads, content]
---

# The page your ad lands on

Turn an ad URL, uploaded image or GooseWorks creative into a structured page spec. The server renders and hosts it. Never write HTML, scripts or a Claude artifact as the review surface. This skill is self-contained; read [the message-match rubric](references/rubric.md) when drafting or auditing.

## Start with the ad and brand

1. In grouped sessions, load the pages group with tools_load. If the group or an action is unavailable, report that limitation; do not fabricate a preview or use another hosting service.
2. Read the brand kit, products, images and learnings with brand_read, then knowledge_search for the task. Use an already selected brand; ask only if several fit. Keep the creative id and angle context when handed off from an ad or video. Call page_read with action site and action angles for that brand before making a page. Site usage is organisation-wide, including other brands.
3. For each creative or saved image, call ad_ingest with action brief, brand_id and source containing type creative or asset and value equal to its id. A non-library URL uses type url. Upload an unsaved image through media_upload first. Creatives return a brief immediately; images and URLs may return jobs. Preserve the returned promise, audience, CTA, products and images; never guess unreadable ad content.
4. For a paid ad-library URL, use ad_ingest audit_estimate with brand_id and ad_library_url. Show its exact credits and ad count, wait for a yes to that total, then call audit with confirm_credits equal to the quote. Use the selected ad's returned brief. The brief action has no credit-confirmation field: never add one or use brief to bypass a paid lookup. If the audit cannot read that link or identify the requested ad, ask for its image or GooseWorks creative instead. An expired or changed quote needs a fresh quote and yes.
5. For several ads, group by distinct promise, product and audience. Propose one page per angle and ask which to build first. Match existing angles by meaning and product, not label alone. Confirm reuse, then page_read list with brand_id and angle_id, followed by read for its page. An already suitable live page needs only its URL and attribution; do not render or republish it. If changes are requested, update that page. For a new angle, create with angle containing label and optional product_id; a known angle uses angle containing id. A create response with existing_page means reuse it. Never retry with force unless the user specifically requests a separate angle and accepts the suffix.

## One round of choices

Explain the recommended plan briefly. Ask only what the ad, brand and prior answers cannot settle, with a recommendation and reason for each. Use the host's native question control; in Claude Code, put the recommended option first, label it Recommended, and keep to four options. Visual choices must appear in a Markdown table of links before the control; clients may show text cards only.

| Choice | Recommendation |
| --- | --- |
| Product and angle | The matching product and existing angle, or the ad's distinct promise |
| Goal and format | DTC: buy, showcase, product-page link. SaaS/service: lead, capture, hosted form. Standalone form: form format |
| Benefits, audience and tone | The ad's promise and the kit's approved, applicable facts |
| Images | Table of ad/catalog images with image links and product-page links; pick those continuing the ad's look |
| CTA | Continue the ad's ask; confirm the destination or form |
| Form fields | Required email first, email only by default; justify more than three fields or long text. Phone needs separate consent wording |

If useful product photos are missing, offer generation with photos_generate and follow its pricing flow: quote the exact credit total, wait for yes, generate, follow photos_read, and let the user choose. Generation is optional; never invent an asset id or imply it is included with a page.

Ask once per site for a missing privacy policy URL and company name; recommend the brand's existing policy if known, never invent one. Save with site_write legal, which validates an HTTPS HTML policy. Missing or invalid privacy blocks every lead-collecting revision, including standalone forms and showcase pages with a form CTA. A site setting alone does not repair an older revision's legal snapshot: render and review a new draft. Ask once for a missing Meta Pixel ID, recommend adding it for Meta optimisation, and allow the user to defer.

“Just make it” accepts creative recommendations, never spend, publish, redirect or site-wide re-render approval. Unresolved legal requirements still block publishing.

## Draft, compare and review

1. Call page_read templates for supported formats, styles and sections. Create a form with form_write create when needed: brand_id, name, fields, consent_text, thank_you and notify_emails. Ask for notification recipients if unknown or use an empty list; do not guess addresses. Thank-you defaults to mode message with a message. Consent is always unticked and cannot be configured as a field. Every form reference in the spec must use the same form id. Form updates make a new version; pages need a new revision to embed it.
2. Write the schema's spec: format, style, segment, goal, seo, sections and products; capture and showcase also require hero with headline, image and CTA. Asset references use type asset or url and value. A link CTA has label, kind link and href; a form CTA has label, kind form and form_id. Include the returned source_ad brief. Standalone form format has form_id and no sections. Only use sections supported by the chosen template. The renderer owns the legal footer, consent, tracking, layout, fonts and form transport; browser traffic stays on the page's host and never calls the API directly.
3. Continue the ad's headline promise and CTA. Use only approved, product-applicable claims. Omit unavailable proof and say what was left out. Never invent testimonials, ratings, customer names or results; do not include customer names or results in copy. Competitor ads inform structure and tone only, never copied words, claims or marks. Use Google Fonts from the kit. Warn before an off-kit color; no arbitrary layout or code overrides.
4. Call page_write create for a new angle, or update with page_id and spec_patch for reuse. Keep page id, revision_id, preview_url and gate_job_id together. Patches merge direct hero, seo and theme fields; arrays and CTA objects replace whole values. Read the current spec before editing arrays so unrelated content survives.
5. Recommend clean, bold or editorial from the kit and ad. A pasted reference screenshot uses media_upload then page_read match_style with brand_id and asset_id; explain the returned reason. Call page_read compare with page_id and up to three unique styles for the same content. Show a table of style, reason and preview link, then let the user pick. Each comparison consumes render quota; do not run repeated comparisons automatically. If “just make it” was requested, select the recommendation and show its preview.
6. A comparison's selected revision may no longer be latest. Read the page after selection; if latest is not the chosen content/style, update to the chosen spec/style, poll its gate and show that new preview. Never assume a comparison link is publishable. The final preview must identify the exact current revision.
7. Poll job_get with job_id and kind from the result: ad_ingest, page_audit or page_rerender; gate_job_id uses kind page_gate. Follow the returned next_step and retry guidance. Never resubmit running work. Stop on failed, canceled or partial_failure and report the reason; waiting_for_user requires the requested input. A timeout is not success. Show the preview with gate status; publishing requires completed lint pass. Lighthouse and rubric are advisory: present scores or unavailable reasons and suggested fixes, offer one revision, and do not loop to chase a score.

After each preview say: “Tell me what to change, or open the preview and click anything to leave a note; edit text right on the page. When you're done, say 'apply my notes'.”

On “apply my notes”, read the latest page and page_read annotations for the reviewed revision with status open. In-place text edits may already have created a newer revision: read its open notes too, preserve those edits and reconcile slot paths before applying older notes. Ask about conflicting or ambiguous notes. Apply the compatible notes in one page_write update with spec_patch and resolves containing only the annotation ids actually addressed. Show its new preview and gate result before further edits or approval. Never loop more than one revision without showing it. Ordinary chat edits follow the same re-preview rule.

## Approval and delivery

Refresh page_read read and site. Verify the displayed revision is still latest, its exact legal snapshot is valid for lead collection, and its gate lint passed. For changed legal/form snapshots, create a new revision and preview first. Do not silently substitute another revision after approval.

Name the revision alongside its preview link and ask: “Publish the draft you just previewed? Your first page is free and shows a 'Made with GooseWorks' badge; after that your plan allows N live pages (you have M).” Fill N from entitlements.livePages (null means unlimited) and M from usage.live_pages across the organisation. State when this replaces an already-live page and takes no additional slot; reflect the site's actual badge state. Pages use plan slots, not publishing credits.

Wait for an explicit publish yes after this revision and plan-position prompt. “Looks good”, a style choice, notes, or permission to make an ad is not publish approval. Call page_write publish with only page_id and that revision_id. If stale_revision is returned, show the latest preview and obtain a new yes; never retry publishing another revision automatically. For plan_limit, show the upgrade next_step; do not unpublish another page to make room. For lint_failed or gate_pending, resolve the reported condition before asking again.

On success call site_write ad_url with page_id and platform meta. Deliver the clean page_url first, plus a suggested URL with concrete UTMs when known; separately show the returned ad_parameters template for Meta. Keep its ad-id macro in the template only, never pretend an unresolved macro is a real visitor URL or invent creative attribution. Include the preview of the published revision and what can change next: copy, images, fields, style or domain. Cost per lead requires the brand's authorised Meta connection; an Ad Library link alone supplies no spend. Publish and unpublish changes can take up to two minutes to appear.

## Tracking, domains and taking a page down

- Save tracking IDs through site_write tracking. Legal and tracking changes return a count of live pages affected: say “This re-renders N live pages” with the reason and wait for yes before page_write rerender_confirm with site_id and reason legal or tracking. Poll the returned page_rerender job. This authorises only the named site-wide change, not unrelated draft edits.
- For Meta testing, ask the user to open Events Manager and visit the live page once the pixel is in its published revision. Previews have no tracking and disabled forms; do not use them to verify pixels. Ask for their observed test-event confirmation; only then call site_write tracking_confirm with brand_id and confirmed true. No API-based verification is available in v1.
- For a requested custom subdomain, site_write domain_connect takes brand_id and hostname only; show the returned DNS table, then domain_check with brand_id. Use it only once verified. Do not invent DNS values or claim support for a root-domain subpath.
- On an unpublish request, default page_write unpublish to mode replace: the same address shows a branded offer-ended page and link to the brand site, freeing its live-page slot. A redirect needs a valid fallback_url and the user's explicit confirmation that no Google Ads point at the page before sending mode redirect and confirm_no_google_ads true. Lack of a connected Google account is not that confirmation.
- For an ad audit, use the quoted audit_estimate then approved audit flow above, poll the job, and report live ads, destinations, ads per page and message-match scores with evidence. Do not equate an audit with permission to publish or change ads.
