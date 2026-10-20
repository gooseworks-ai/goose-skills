# Brand record template

Load at step 7 (`atoms/brain-write-back`). The Brand record is one versioned Markdown file per save, `brand/records/<YYYY-MM-DD>-v<N>.md` in the brand coworker scope, imported as a brand document through `../../../skills/save-to-brain/SKILL.md`. Playbooks read it with `file_read`, never through search snippets. It holds only what the brain has no typed field for and points to the typed fields for the rest. It is also the human-readable face the owner checks, and its first two sections are the sign-off sheet an agency forwards to its client.

Rules:
- Title: `Brand record — <brand> — <YYYY-MM-DD> v<N>`. Each save writes a complete new version built from the previous one read in full (never from search snippets), so no row is dropped; the sign-off marker names the current version. Never write a partial record.
- The **Claims you may use** table comes first and stays short; long evidence (studies, reports) is uploaded as its own document and referenced by title.
- Every line carries a provenance tag: `[owner, date]`, `[agency, date]`, `[<name> via <agency>, date]`, `[owner's doc: <title>]`, `[site, read date]`, `[research]`, `[agent note, unconfirmed]`, `[guess]`.
- Visibility tags where not public: `(internal)`, `(embargo until <date>)`, `(NDA)`.
- Never add a scope (market, channel, product) nobody stated. Unstated scope reads "as stated: <the owner's words>".
- The owner reads this file: no tool, field or playbook names in it. Say when a gap will be asked in plain words ("when you plan a campaign").

---

```markdown
# Brand record — <Brand> — <YYYY-MM-DD> v<N>

Status: <in progress, resume at step N | complete | scoped sign-off only; full brand pass not done>; not saved: <items, if any> · Approved by: <name / role> · Claims: <signed-off | pending-client | not-signed> · Voice: <confirmed | provisional>
Not legal advice. Legal review of claims: <done by …, date | unknown>.
How to use: the claims you may use are also saved one per rule as "Claims you may use — …"; this table holds their variants and proof, and if the two disagree the saved rules win. Use them verbatim or as a listed variant, in scope, before their review date, with the qualifier. Anything else, including claims the brain marks approved elsewhere, is not approved.

## Claims you may use
| # | Wording (exact) | Allowed variants | Type | Scope | Qualifier | Proof | Review by | Approved |
|---|---|---|---|---|---|---|---|---|
| C1 | Free shipping on orders over $35 | "Free shipping over $35" | offer | all products · as stated: "everywhere we ship" · all channels | — | owner, 2026-10-16; site updated: yes [owner, 2026-10-16] | 2027-01-16 | owner, 2026-10-16: "yes, approve those five" |

## Decisions needed (the sign-off sheet)
For an approver who is not in the chat. Reply per row with Approve / Edit: <new wording> / Reject, and a line on the voice guide.
| # | Wording | Our recommendation | Why | Proof on file | Decision |
|---|---|---|---|---|---|
| D1 | Clinically safety-tested, non-comedogenic | reword to "Non-comedogenic (tested)" once the report is on file | needs the comedogenicity report | none | |

Voice guide for approval: <personality is/is-not, rules with pairs, banned words, terminology, flex — or "see the brand's voice rules">.

## Not approved (do not use)
| Wording | Why not | What would unlock it | Safe alternative |
|---|---|---|---|
| Formulated by a dermatologist to be the gentlest acne treatment | no proof; efficacy and superiority | a study on the finished product | — · status: not approved — owner disagrees: "our customers know it works" [owner, date] |
| Dermatologist-developed & 6x award-winning | no proof on file; awards not listed | the dermatologist's name; the six awards with years | "Developed with a dermatologist" once named |

## Retired claims
| Wording | Retired on | Why | Replaced by |
|---|---|---|---|
| Free shipping on orders over $45 | 2026-10-16 | threshold changed to $35 | C1 |

## Voice
- Status: <confirmed | provisional> [who, date]. The confirmed guide is in the kit voice; a provisional draft lives here until confirmed.
- Banned words and patterns (full list): …

## Never say
| Phrase or pattern | Why | Source | Say instead |
|---|---|---|---|
| treats / clears acne (cosmetic products) | drug claim for a cosmetic (US) | law | "for acne-prone skin", "helps reduce the look of breakouts" |

## Not public
- <item> (internal) [owner, date]
- <launch> (embargo until <date>) [owner, date]

## Business facts confirmed
- Company type and stage: … [owner, date]
- Hero product and standing offer: … [owner, date]
- Brand-wide policies (shipping, returns, guarantee, programmes): … [owner, date]
- Who it's for / not for: see the kit's audience; not for: … [owner, date]
- One-line positioning (owner's words): … | unknown (positioning work isn't covered yet)
- What buyers use instead of us: … (tracked as competitors)
- Who approves claims and voice: … [owner, date]
- Markets, languages, where it is sold: … [source, date]
- Saved sources confirmed as ours: … / not ours: …
- Company-type facts (permissions to name customers, certifications and reports, locations…): …

## Decisions on contradictions
- <what clashed> → <what was decided> [who, date, their words]

## Brand assets
- Logo, primary and accent colour: confirmed [owner, date]
- Full palette: … · Fonts: … (the kit's typography field shows a mapped font) [owner, date]
- Missing: <brand book, templates, logo for dark backgrounds, …>

## Unknowns
| Gap | Blocks | Assumption in use (guess) | Asked | Reopens when |
|---|---|---|---|---|
| Goal number, deadline, budget | campaign planning | none | not asked yet | when you plan a campaign |
| Margin / most we can pay per customer, unit cost | ads and campaign planning | none | not asked yet | when you plan a campaign or run ads |
| Who approves spend, spend caps | running ads | none | not asked yet | when you run ads |
| Who to call if something blows up online | risk alerts in market research (what people are saying) | none | not asked yet | when market research first flags a serious risk |
| Customers we may name, logos, win/loss notes, do-not-contact list | outbound lists, case studies | default: name no one | not asked yet | when you build a prospect list or a case study |
```
