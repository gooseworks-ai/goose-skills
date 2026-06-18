---
type: playbook
name: seo-content-engine
description: >
  Build and run an SEO content engine: audit current state, identify gaps,
  build keyword architecture, generate content calendar, draft content.
---

# SEO Content Engine

Build a compounding SEO content engine for a client: audit → gap analysis → keyword architecture → content calendar → content drafting → publishing pipeline.

## When to Use

- "Build an SEO content strategy for [client]"
- "Create a content engine for [company]"
- "What content should [company] be publishing?"

## Prerequisites

- Client website URL
- Client context.md with ICP, value props, positioning
- Top competitors identified (from intelligence package or manually)

## Steps

### 1. Audit Current State

**Skill**: seo-content-audit (orchestrates site-content-catalog + seo-domain-analyzer + brand-voice-extractor)

Run the full SEO audit to understand:
- Current content inventory (what exists, by type and topic)
- Domain authority, organic traffic, keyword rankings
- Competitive gap matrix (what competitors rank for that the client doesn't)
- Brand voice profile (writing style to match)

**Skill**: aeo-visibility

Test AI answer engine visibility for key queries.

**Output**: Complete picture of where the client stands in search.

### 2. Identify Content Gaps

From the audit, identify:

**Competitive gaps**: Keywords competitors rank for that the client doesn't
**Funnel gaps**: Missing content at TOFU, MOFU, or BOFU stages
**Topic gaps**: Industry/vertical content that doesn't exist
**Comparison gaps**: Missing "vs" pages and "alternatives" pages

Prioritize by: search volume x commercial intent x competitive difficulty.

### 3. Build Keyword Architecture

Organize target keywords by funnel stage:

- **TOFU** (awareness): "what is [category]", "[category] use cases", "how to [solve problem]"
- **MOFU** (evaluation): "[category] comparison", "how to choose [solution]", "[compliance/technical] requirements"
- **BOFU** (decision): "[Company] vs [Competitor]", "[Competitor] alternatives", pricing guides, migration guides

Map each keyword cluster to a content type (blog post, landing page, guide, comparison page).

### 4. Create Content Calendar

Build a prioritized content calendar:

1. **Week 1-2**: Highest-urgency BOFU pages (comparison pages, especially if competitors are publishing attack content)
2. **Week 2-4**: Core MOFU guides and evaluation content
3. **Week 4-8**: TOFU awareness content and programmatic SEO templates
4. **Ongoing**: 2-3 editorial pieces per week

### 5. Draft Content

**Skill**: content-asset-creator (for landing pages, reports, one-pagers)
**Method**: AI-assisted drafting with brand voice matching (from brand-voice-extractor output)

For each content piece:
- Match the client's brand voice and style
- Include target keywords naturally
- Build internal linking to related content
- Include clear CTAs
- Add structured data / schema markup recommendations

### 6. Build Internal Linking Architecture

Design the linking structure:
- TOFU pages link to related MOFU pages
- MOFU pages link to BOFU pages (comparison, pricing)
- BOFU pages link to product/signup
- All pages link to relevant pillar content

### 7. Publish & Monitor

- Publish on client's blog/site (or provide drafts for client to publish)
- Track: organic traffic by page/cluster, rankings by keyword, content-to-signup conversion
- Monthly: Review which content is ranking, which needs updates

## Ongoing Cadence

- **Weekly**: Publish 2-3 pieces, monitor rankings
- **Monthly**: Review content performance, update calendar, refresh underperforming pages
- **Quarterly**: Re-run seo-content-audit to measure progress and identify new gaps

## Human Checkpoints

- **After Step 2**: Review gap analysis and priority recommendations
- **After Step 4**: Review content calendar before drafting
- **After Step 5**: Review content drafts before publishing
