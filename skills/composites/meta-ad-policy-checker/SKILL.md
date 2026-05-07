---
name: meta-ad-policy-checker
description: Pre-flight policy check for Meta ads. Takes ad copy plus advertiser context, resolves and fetches the relevant Meta transparency-center policy pages at runtime, and returns a Pass / Fix Required / Block verdict with cited findings and rewrites.
tags: [ads]
---

# Meta Ad Policy Checker

Meta disapproves ads for policy reasons constantly, and most disapprovals are preventable. The pattern is almost always the same: an advertiser (or an AI agent generating variants) writes copy that uses a phrase or implies a claim that violates Meta's published advertising standards. The fix is cheap if you catch it before submission, expensive if you don't — repeated disapprovals on the same account can throttle delivery or trigger account-level restrictions.

This skill is a pre-flight check. It reads ad copy, figures out which Meta policies apply, fetches the live policy text from Meta's transparency center, and returns a clear verdict with specific findings, citations, and rewrites. It does not hardcode policy rules — Meta updates those, and a static rule list goes stale. Instead, the skill uses Meta's own canonical policy pages as ground truth on every run.

**Core principle:** The skill provides the methodology — what to check, how to reason, what severity to assign. Meta provides the source of truth — the actual policy text. This separation is what keeps the skill correct as Meta's standards evolve.

## When to Use

- Before launching any new Meta ad
- After generating ad copy variants (call this on each variant before showing or submitting)
- When auditing an existing live ad for policy risk
- When troubleshooting a recently disapproved ad
- Before pushing copy through any Meta MCP / API write tool

## Phase 0: Intake

1. **Advertiser context** *(1–2 sentences)*
   - What the business does
   - What product / service / offer is being advertised
   - Primary conversion goal
2. **Ad asset(s)**
   - Headline(s)
   - Primary text / body
   - Description (if applicable)
   - CTA button text
   - Destination URL *(optional — enables a landing-page cross-check)*
3. **Special Ad Category** — declared by user: `None` / `Employment` / `Credit` / `Housing` / `Social Issues, Elections or Politics` *(this changes the applicable rules significantly)*
4. **Targeting summary** *(optional)* — useful for discrimination checks (age, gender, location exclusions)
5. **Visual description** *(optional)* — text-in-image is policy-relevant
6. **Mode** — `pre-flight` (block until clean) or `audit` (flag-only, used for already-live ads)

## Phase 1: Determine Which Policies Apply

Reason about the ad before fetching. Most ads need 3–6 policy pages, not all 25. Always include the **baseline set**, then add **content-driven** pages based on what the ad mentions, then add **category-driven** pages based on declared Special Ad Category.

Treat the entries below as policy lookup keys, not URL slugs. Meta's Transparency Center URLs are nested under category paths and change over time, so never construct a flat policy URL directly from these labels.

### Baseline (every ad)
- Community Standards
- Personal Attributes
- Sensational Content
- Misinformation
- Engagement Bait / Spam
- Grammar & Profanity
- Non-Functional Landing Pages

### Content-driven (add when present)

| Triggers | Policy lookup keys |
|---|---|
| Income, earnings, payouts, "make money", specific dollar amounts | Personal financial requirements; unrealistic outcomes |
| Health, weight loss, supplements, wellness claims | Health and wellness; before-and-after photos |
| Targeting by age, gender, race, religion, nationality | Discriminatory practices |
| Crypto, weapons, adult, drugs, alcohol, gambling, tobacco | Restricted content |
| Political, social-issue, election content | Social issues, elections or politics |
| Profanity, slurs, sensitive language | Profanity; inflammatory content |
| Anything that implies tracking / scraping / circumvention | Circumventing systems |

### Category-driven (add based on declared Special Ad Category)

| Special Ad Category | Add |
|---|---|
| Employment | Employment |
| Credit | Credit |
| Housing | Housing |
| Social Issues, Elections or Politics | Social issues, elections or politics |

Output of Phase 1: an ordered list of policy lookup keys to resolve and fetch in Phase 2.

## Phase 2: Fetch + Cache Live Policy Text

Fetch Meta's ad-standards index first:

```
https://transparency.meta.com/policies/ad-standards/
```

For each lookup key from Phase 1:

1. Resolve it from the index to Meta's canonical policy page URL. Prefer exact title matches, then closest title / category matches.
2. Fetch the resolved canonical URL. Do not build a URL by appending the lookup key directly to the ad-standards base path; those flat URLs 404 for many current policies because Meta nests policy pages under category paths.
3. Cache the lookup key → canonical URL → page text mapping.

**Caching rule:** in-memory for the current session only. A batch check of 10 ad variants should produce 3–6 policy-page fetches total, not 30–60. Skip persistent caching to avoid stale-cache bugs across sessions.

**Fallback:** if the index cannot be parsed or a resolved page 404s, use a site-restricted web search for the policy title on Meta's transparency domain and navigate to the closest-matching current policy. Log this as a "policy URL drift" note in the output so the lookup list can be updated.

## Phase 3: Reason — Ad vs. Policy

For each fetched policy, walk through every element of the ad (headline, body, description, CTA, link, visual description if provided) and ask:

1. **Does any phrase, implication, or pattern in the ad match a restricted pattern in this policy's text?**
2. **What specific clause from the policy applies?** Pull the direct quote.
3. **What is the severity?**

Severity model — three levels:

| Severity | Definition |
|---|---|
| **Block** | Clear violation. Ad will almost certainly be disapproved. Do not submit until fixed. |
| **Fix Required** | Likely violation or explicit risk. Ad may pass but is at meaningful risk of disapproval or under-delivery. Fix recommended before submission. |
| **Caution** | Edge case. Ambiguous wording or pattern Meta sometimes flags. Worth knowing about; not necessarily worth changing. |

For each issue identified, produce:

- **Issue** — exact phrase or pattern in the ad
- **Policy** — name + URL
- **Citation** — direct quote from Meta's policy page
- **Severity** — one of the three above
- **Why** — one-line explanation grounding the call in the cited policy text
- **Suggested rewrite** — preserves the advertiser's intent, removes the risk

## Phase 4: Landing-Page Cross-Check *(if URL provided)*

Common disapproval reason: ad claims that aren't substantiated on the LP, or LP claims more aggressive than the ad. Run a brief cross-check:

- Are the claims made in the ad reflected on the LP?
- Are required disclosures present (terms, eligibility, conditions)?
- Does the LP make any claim that, *if it were on the ad*, would be flagged?
- Is the LP functional (load, render, no broken redirects)? — this is a separate Meta policy (`non-functional-landing-pages`)

This is policy-specific cross-check — not message-match. For message-match (does the LP feel like a continuation of the ad?), use `ad-to-landing-page-auditor`.

## Phase 5: Produce the Output

Use this exact structure.

```
VERDICT: PASS | FIX REQUIRED | BLOCK

ADVERTISER CONTEXT (echo back so the user knows what was assumed)
SPECIAL AD CATEGORY: [declared]
POLICIES CHECKED: [list of slugs fetched, with URLs]

PER-ISSUE FINDINGS:
  - Issue: [exact phrase or pattern from the ad]
    Policy: [name] (URL)
    Citation: "[direct quote from Meta's policy page]"
    Severity: Block | Fix Required | Caution
    Why: [one-line explanation grounded in the citation]
    Suggested rewrite: [safer alternative preserving intent]

RISK SCORE: Low | Medium | High
  (factors: count of Block issues, count of Fix Required issues, special-category status)

3 SAFER VARIANTS OF THE FULL AD:
  (only generated if any Block or Fix Required issues exist)
  - Variant A: [full ad rewrite — headline + body + CTA]
  - Variant B: [full ad rewrite — different angle on the same offer]
  - Variant C: [full ad rewrite — most conservative version]

NOTES:
  - Areas where Meta enforcement is known to vary (best-effort observation)
  - LP-related findings (if URL was provided)
  - Anything requiring human judgment beyond what this skill can verify
  - Any "policy URL drift" notes from Phase 2 fallback handling
```

## Phase 6: Integration Hooks

This skill is built to be both standalone-runnable and callable from other skills. Recommended chain patterns:

- **Variant generation:** `messaging-ab-tester` produces N variants → `meta-ad-policy-checker` runs on each → only PASS / FIX REQUIRED variants surface to the user
- **Campaign launch:** `meta-ads-campaign-builder` produces a brief with multiple ads → `meta-ad-policy-checker` runs on every ad → block launch if any return BLOCK
- **Pre-write gate:** before any tool call that writes to Meta (via MCP, native API, or otherwise), the calling workflow checks the verdict and aborts on BLOCK
- **Diagnostic on under-delivery:** `meta-ads-analyzer` flags an ad with near-zero delivery → suggest running `meta-ad-policy-checker` to rule out a silent disapproval

The skill returns structured output (verdict + per-issue array) so calling code can gate on `verdict !== "BLOCK"` programmatically.

## Output Standards (Mandatory)

- **Cite, don't paraphrase.** Every finding includes a direct quote from Meta's policy page. If you can't quote, the finding isn't grounded — drop it.
- **Severity is a calibration, not a guess.** A clear, specific match to a "you may not" clause in the policy = Block. An "ambiguous but risky" match = Fix Required. An edge case Meta sometimes flags but often doesn't = Caution.
- **Rewrites preserve intent.** A rewrite that changes the offer or the audience is not a rewrite — it's a different ad. Rewrites change *how* the offer is expressed, not *what* it is.
- **Don't replace Meta's review.** This is pre-flight; Meta is final gatekeeper. If a rewrite still gets disapproved, that's information for the next iteration — log it.
- **Echo the advertiser context.** Always restate what was assumed, so the user can correct misinterpretation.

## What This Skill Will Not Do

- **Won't replace Meta's actual ad review.** Meta is the final gatekeeper. This catches the obvious and the well-documented; Meta enforcement evolves.
- **Won't read images for text.** Text-in-image violations need a separate vision pass; out of scope for v1. The skill *will* reason about visual *descriptions* if provided.
- **Won't determine Special Ad Category eligibility.** The user declares the category. Whether the ad *should* be in that category is a separate (legal/business) judgment.
- **Won't enforce the BLOCK.** It produces a verdict; the calling skill, workflow, or human enforces the gate.
- **Won't track historical disapprovals on your account.** Account-level history affects Meta's review, but isn't visible to this skill. Treat the verdict as the floor of risk, not the ceiling.

## Maintenance Note

The list of policy slugs in Phase 1 is the only mutable piece of this skill. Meta occasionally renames or restructures policy pages. The Phase 2 fallback handles individual page drift gracefully, but periodic review of the slug list (annually, or any time several "policy URL drift" notes appear in outputs) keeps the skill efficient. The slug list lives inline in this SKILL.md so updates are a single-file change.

## Related Skills

- **`messaging-ab-tester`** — runs *upstream*; generates variants this skill should check
- **`meta-ads-campaign-builder`** — runs *upstream*; produces multi-ad briefs this skill should validate before launch
- **`ad-to-landing-page-auditor`** — *paired pre-flight*; different concern (message-match vs. policy compliance), same checkpoint
- **`meta-ads-analyzer`** — runs *downstream*; if a live campaign shows symptoms of a silent disapproval (near-zero delivery, throttling), this skill is the diagnostic step
- **`ad-campaign-analyzer`** — *loose link*; disapprovals show up as underdelivery in performance data, so cross-reference when a creative shows zero delivery
