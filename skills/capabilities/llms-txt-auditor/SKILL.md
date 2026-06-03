---
name: llms-txt-auditor
description: Audit a website for AI crawler readiness and llms.txt quality without paid APIs.
---

# llms.txt Auditor

Use this skill to evaluate whether a site is easy for AI answer engines and
AI-assisted crawlers to understand. It checks the public llms.txt file, robots
policy signals, sitemap discovery, canonical metadata, structured data, and
homepage content signals.

Start by identifying the target domain and the user's goal. Common goals are
AI search visibility, citation readiness, SEO hygiene, launch readiness, or a
competitor comparison. If the user gives more than one domain, audit each one
separately and compare the scorecards after all audits finish.

Run the bundled auditor script from this skill directory against the target
domain. Prefer JSON output when another tool or agent will consume the result.
Prefer Markdown output when the user wants a readable report. The script uses
only public web resources and the Python standard library.

Interpret the output as a prioritized GTM and SEO readiness report:

- Treat missing llms.txt as a high-priority gap when the site has docs,
  pricing, blog, case studies, integrations, or API pages.
- Treat robots exclusions as blockers only when they affect pages that answer
  commercial or product questions.
- Treat missing sitemap discovery as a crawlability gap, especially for sites
  with many nested resources.
- Treat weak homepage metadata or missing structured data as a citation-quality
  issue, not as a hard blocker.
- Prefer concrete fixes over generic SEO advice.

The final response should include:

- Overall readiness score and grade.
- Top three issues, ordered by likely impact on AI discoverability.
- Specific recommended llms.txt sections and page URLs to include.
- Any crawler blockers or ambiguous robots directives.
- A short implementation checklist the site owner can hand to a developer.

When useful, include a minimal llms.txt outline tailored to the site. Keep it
short and based only on pages that were actually discovered by the audit.
