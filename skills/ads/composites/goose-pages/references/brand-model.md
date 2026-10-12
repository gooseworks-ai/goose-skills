# Brand-driven page model

Use the live pages action schemas and `page_read templates {brand_id}` as the authority. The catalog returns page types, modes, recipes, supported section layouts and `saved_templates`. Do not invent unavailable actions or reproduce a missing service with another provider.

## Choosing structure

A recipe is a starting section sequence, not approval to invent its content. The user's explicit choice and the ad's goal lead. Start later pages from the brand's active default template; for a new structure, prefer the audit's applicable `recommendations.proposed_recipes`, then the matched reference, then the catalog defaults. Explain deviations, such as dropping a proof section because the kit has no approved proof.

| Page type | Use | Default recipe when no stronger evidence exists |
| --- | --- | --- |
| `lead_magnet` | Guide or checklist; short page, 1–3 fields | split hero → form card → benefits list → FAQ list |
| `book` | Demo, appointment or consultation; short page | photo/card hero → form card → approved proof strip → FAQ list |
| `offer` | Promo or bundle; medium page, usually a store CTA | product-on-color hero → offer banner → benefits grid → approved reviews → FAQ |
| `product` | One product; medium page with PDP link | split hero → product spotlight → alternating benefits → gallery → approved review |
| `contact` | Contact, signup or waitlist | centered hero → form with details → contact cards → two-column FAQ |

Use only known contact details and available assets. Shorten a waitlist to its promise and email form. Email is first and required; email-only is the starting point, with up to three useful fields where justified. Booking/contact can justify more fields, but never inherit an audited site's long form unquestioningly. A lead-magnet page collects leads through the hosted form; it does not redirect ad visitors directly to a download.

`focused` gives a logo and one conversion goal without site navigation. `site` (“Part of my site”) uses the brand's header/footer. Both use the same section library and brand design. Site mode does not move hosting onto the brand's main website. Read saved site chrome; if it is missing, use verified own-brand navigation/footer labels and HTTPS links with `site_write chrome`, or show the gap. Do not claim `match_reference` imports header/footer markup. Legal footer and form controls remain platform-owned.

For “make it look like our site”, use the existing kit's full design, uploaded/Google/system font status, logos and photography, match a known own-site layout, and recommend site mode. Respect deliberate page overrides; a request to reapply the kit may clear `theme` with null, but do not silently erase campaign choices. Do not launch a new brand extraction to get data already in the kit.

## Audit and reference results

`page_read audit {brand_id}` returns the latest landing audit or null. Reuse completed findings; follow queued/running `job_id` using `page_landing_audit`. First-use enqueue is `ad_ingest landing_audit {brand_id,max_pages?:8,refresh?}`. Its server workflow discovers ad CTA destinations and audits them; the agent does not need to orchestrate ScrapeCreators or Firecrawl directly.

Summarise `pages` (page types, modes, form fields, offers), `findings` (messaging, offers, audience segments, design language, structure patterns), and `recommendations.keep/improve/proposed_recipes`. Link observed destination pages when useful. Distinguish what was observed from your recommendation. `brain_entry_ids` confirms saved brain entries; no extra duplicate knowledge write is needed. Empty results are not evidence of a weak site, and a failed job is not a completed audit.

`page_read match_reference` takes `brand_id` and exactly one of `url` (HTTPS) or `asset_id` (saved screenshot). The result is `{structure,reasons,reference,structure_only:true}`. Retain the returned reference in the spec: `{kind:"url"|"asset",value,structure_only:true}`. It supplies section order/layout/options, not content. For another brand, never copy colors, fonts, images, wording, claims, marks or a distinctive visual identity. Own-brand references also remain structure-only at this interface; the kit supplies appearance. Do not infer a successful match from an inaccessible page.

## Spec and edits

A full spec requires `page_type`, `mode`, `segment` (`dtc` or `leadgen`), `goal` (`lead`, `buy`, `book`, `signup`), `seo`, `sections`, and `products`. Optional fields include `form_id`, `source_ad`, `reference`, `theme` and `template_id`.

Each section has `{id,type,layout,options,content}`. IDs are stable, unique, lowercase, start with a letter and use only letters, numbers, hyphens or underscores (40 characters max). Keep them when editing or reordering. At most 14 sections and one hero are allowed. Content is nested: the hero's headline is in `content.headline`, never a top-level hero object.

Common options: semantic `background` (`surface`, `muted`, `primary`, `accent`, `inverse`, `image`), `align` (`start`, `center`), `density` (`compact`, `regular`, `airy`), and `image` with `ref`, optional `fit` (`cover`, `contain`), normalized `focus:{x,y}` (0–1), and `aspect` (`1:1`, `4:5`, `3:4`, `4:3`, `16:9`, `auto`). `sticky_cta` is hero-only. Put the offer and CTA early on mobile and keep the primary CTA consistent; don't add popups.

A lead/book goal, form section, form-first hero or form CTA requires a top-level `form_id` and exactly one platform form placement: a `form` section or `hero` with `form_first` layout. All form CTAs share that ID. A form-only page uses `contact` and a form section. Never duplicate the form to repeat a CTA or write form HTML in a custom section.

Page design overrides live in typed `theme` fields such as `colors`, `fonts`, `type_scale`, `buttons`, `inputs`, `radius_px`, `spacing`, `logos` and `site_chrome`. Use the schema's nested names; do not flatten them or supply private uploaded-font URLs. The server resolves and checks font consent.

For `page_write update`, `spec_patch.theme` and `.seo` deep-merge; `sections` and `products` replace their entire arrays. Null clears optional top-level fields such as `theme`, and `seo.og_image`. Read current state before replacement. Public annotation slots use `sections.<id>.<field>` (content is implicit); for example `sections.hero.headline` or `sections.faq.items[0].answer`. Resolve by ID after reordering, then patch the full sections array while preserving unrelated content and panel edits.

`page_read compare {page_id,variants:[spec_patch]}` renders 1–3 patches against current content. Each counts against render quota. Comparison revisions cannot be published; apply the selected variant with update and show its fresh preview/gate before requesting publish approval.

## Brand templates

Find `saved_templates` with `page_read templates {brand_id}`. Choose an active same-brand `is_default:true` entry, or a template explicitly chosen by the user. Pass its ID at the create action's top level: `page_write create {brand_id,angle,template_id,spec}`. Merely putting the ID inside a full spec is not template expansion.

Prefer the content-only spec: `segment`, `goal`, `seo`, `products`, optional `form_id/source_ad/reference`, and `sections:[{id,content}]`. Match the stored section IDs and provide fresh ad-specific content and image references for each. The server supplies page type, mode, section types/layouts/options and theme from the template; caller structure/theme cannot override those during expansion. Copy and images are not stored in a template. If a required proof/content slot cannot be filled with approved evidence, explain that the template needs adaptation and use an agreed alternative/full spec; never fabricate content just to satisfy the template. For page-specific structural changes to a usable template, create from it, then update the page rather than changing the saved template.

After the first approved publish, offer to save the page, name it, and choose whether to make it default. `save_template` takes `page_id`, `name`, optional `make_default`; it has no revision selector. Read latest state and avoid saving an intervening unapproved draft as the approved page. Template edits use `update_template {template_id,from_page_id}` or `{template_id,patch}` (exactly one), only when requested. Versions do not propagate to existing live pages; each revision freezes its expanded spec.
