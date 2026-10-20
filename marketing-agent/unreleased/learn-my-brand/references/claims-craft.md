# Claims craft

Load at step 4 (claims audit and sign-off) and in update mode when one claim changes. This is how a senior marketer with compliance training builds an approved-claims list. It is not legal advice: say so once in the sign-off message, and mark "legal review" as unknown unless the owner says a lawyer cleared the list.

## The rule that overrides everything

**Every claim, proof point, value prop, tagline and ad hook the brain holds is a candidate until the owner signs it off in this playbook.** That includes entries the brain already labels `approved`. On staging, research writes press quotes, star ratings and website policies straight into `approvedClaims` with no human review. Value props like "100% free of acne-triggering ingredients" or "dermatologist-developed & 6x award-winning" sit in the kit where every maker playbook reads them. Audit all of it.

**Puffery vs claim:** if a test could prove the sentence false, it is a claim ("softer than cotton", "lasts 48 hours"). If no one could measure it ("the comfiest tee you'll own"), it is puffery and needs no proof, but it still has to fit the voice.

**Implied claims count.** A lab coat implies clinical backing. A before/after implies a typical result. A testimonial implies typical results unless the typical result is stated. "Clinically tested" with no result implies efficacy.

**Quoted claims are the brand's claims.** When the brand reuses a press quote, a review or a testimonial, the claim inside it must pass the checks for its own type; the source only proves the quote exists. An Allure line saying a toner "calms any inflammation" is still a drug-type claim for a cosmetic; "YOU SAVED MY LIFE" is still an implied efficacy claim.

**Product names** ("Clear Skin Support System", "Blackhead-Melting Nose Strips") may be used verbatim as names only. Never extend a name into a claim ("melts blackheads in minutes"). A name that is itself a risky claim is flagged to the owner once; renaming is their call.

## The record for each claim

Every approved claim in the brand record carries all of these. A claim missing a field stays a candidate.

| Field | What goes in it |
|---|---|
| **Wording** | Exact text. Siblings use only this text or a listed variant, never a stronger paraphrase. |
| **Allowed / forbidden variants** | e.g. allowed: "helps calm the look of redness"; forbidden: "reduces inflammation". |
| **Type** | From the taxonomy below. |
| **Risk** | low / medium / high. Sets how sign-off is done. |
| **Proof** | Where the evidence is: document, URL, study, screenshot. For a study: sample size, duration, what was measured, who ran it, and whether it tested the finished product. "No proof on file" is a valid entry and keeps the claim out. |
| **Proof strength** | verifiable fact / instrumental or clinical study / consumer-perception survey / expert opinion / none. |
| **Scope** | Which products, which markets (US, UK, EU…), which channels (site, paid Meta, paid Google, email, packaging, Amazon, app store). |
| **Qualifier** | Text that must travel with it: "in a 4-week study of 32 women", "on US orders over $45", a required disclaimer. |
| **Approved by, date, their words** | Name or role, date, and the owner's sign-off message verbatim. |
| **Review by** | Ratings, review counts, prices: 90 days. Offers: the offer's end date. Awards: award year + 2. Press quotes: recheck yearly. Certifications: their expiry. |
| **Status** | candidate / approved / approved with qualifier / pending client approval / rejected / retired, with the reason. |
| **Visibility** | public / internal only / embargoed until a date. |

## Taxonomy: what each type needs and what a senior checks

| Type | Examples | Proof needed | Senior checks |
|---|---|---|---|
| **Product fact** | ingredients, size, materials, integrations, "works offline" | a source document or the product itself | Current? Scoped to the right product and variant? Low risk. |
| **Offer, price, policy** | "Free shipping over $45", "Free returns", "30-day guarantee", "20% off", "was $60" | the live policy page or offer terms | Has an end date; conditions stated; a "was" price was really charged (US FTC 16 CFR 233, UK CAP 3.39); "free" is really free. **Ads must match the landing page:** when the owner gives a new value, ask whether the site already says it; until it does, the claim stays out of ads. A product-specific offer goes in that product's `offers`; an offer or policy the brand states in copy becomes a `Claims you may use` fact (with its end or review date) and a record row. |
| **Efficacy / performance** | "clears", "lasts 48h", "cuts reporting time by half" | competent and reliable evidence on the claimed result (US FTC); CAP 3.7 (UK); EU cosmetics common criteria (Reg. 655/2013) | Does the evidence measure exactly this result on the finished product? "Up to" needs a meaningful share of users reaching the maximum, otherwise state the typical result. High risk. |
| **Clinical / expert** | "clinically proven", "clinically tested", "dermatologist-developed / -tested / -recommended", "non-comedogenic", "hypoallergenic" | "proven": a controlled study on the finished formula showing the stated result; "tested": allowed only with the result attached; "recommended": a survey of the experts; "developed": a named expert who really formulated it; "non-comedogenic": a comedogenicity test | The commonest unsupported claims in beauty and supplements. High risk. |
| **Consumer-perception stat** | "94% saw smoother skin" | the survey: sample, duration, question wording | Must say it is self-reported, with sample size and duration. Under ~30 people or no control: downgrade or reject. |
| **Comparative / superiority / uniqueness** | "#1", "better than X", "the only", "first" | a like-for-like test against named or identifiable rivals; for "#1", current data with source, scope and period | Goes stale the day a rival launches. Naming a competitor is an owner policy decision too. High risk. |
| **Testimonial / review quote** | a customer quote, a named customer, a case study | the source, date, permission to use, any material connection (free product, payment, employee) | US FTC Endorsement Guides (2023): a testimonial implies typical results unless the typical result is shown; "results not typical" is no longer a safe harbour. Fake, undisclosed-incentive and suppressed reviews are banned (US FTC rule 2024; UK DMCC Act). Named customers and logos default to **none** until the owner confirms permission per name. |
| **Rating / review count** | "4.9 stars from 234 reviews" | platform, count, capture date; proof it covers all reviews, not a curated widget | Recheck before every use; review by 90 days. |
| **Press / endorsement** | an Allure quote, "as seen in" | exact quote, article URL, publication date; permission for paid use of a publisher's name or logo | A phrase lifted out of context (a gift-guide mention shown as a rave) is an implied endorsement. |
| **Award** | "6x award-winning", "Best of Beauty 2023" | awarding body, year, category for each award | "6x" needs all six listed. Stale after ~2 years unless the year is in the copy. |
| **Certification / attestation** | ISO 27001, organic, B Corp, cruelty-free (Leaping Bunny), vegan; SOC 2 and HIPAA (not certifications) | a certificate and its expiry; for SOC 2, the auditor's report: type (I is a point in time, II covers a period), period or date, shared under NDA | Scope (which product, which entity). Never "SOC 2 certified": say "SOC 2 Type II report available" (or Type I) once the report exists; "in progress" is not a claim for ads. Review date: certificate expiry, or SOC 2 report date + 12 months. HIPAA: "supports HIPAA compliance" with a BAA, never "HIPAA certified". |
| **Environmental** | "eco-friendly", "recyclable", "carbon neutral", "biodegradable" | US FTC Green Guides; UK CMA Green Claims Code; EU Directive 2024/825 (applies from 27 Sep 2026: generic environmental claims and offset-based "carbon neutral" product claims are banned) | Default: never say unless certified and specific. |
| **Health / medical** | "treats acne", "heals", "anti-inflammatory", "boosts immunity", "reduces anxiety" | depends on regulator; see category-rules.md | In the US, "treats/clears acne" makes a cosmetic a drug (needs OTC-monograph actives and drug labelling). Supplements: structure/function wording plus the required disclaimer, never disease claims. High risk. |
| **"Natural", "clean", "free-from", "non-toxic"** | "100% free of acne-triggering ingredients", "chemical-free", "clean beauty" | no legal definition in the US: judged by what consumers take it to mean; EU forbids "free from X" when X is legal and normally present or the claim denigrates it | "Non-toxic" and "chemical-free": never. Absolute "100% free of…" claims are both an absolute and an implied efficacy claim: reword or reject. |
| **Finance** | "guaranteed returns", APR, "no fees" | regulator rules (US Reg Z triggers, UK FCA financial promotions, SEC Marketing Rule for advisers) | Default: product facts only; required disclosures attached. |
| **Origin** | "Made in USA" | US FTC: "all or virtually all" made there | Low frequency, high risk. |

## Never-say list

Built from three sources, each entry tagged with its source:
1. **Law** for the category (load the pack from category-rules.md).
2. **Platform** rules (Meta, Google, TikTok, Amazon, app stores) for where the brand advertises.
3. **Owner**: the founder's own nevers: competitor names, discount depth, words they hate, topics off limits, imagery (before/after, people's bodies), unannounced products.

Each entry: the phrase or pattern, why, the source tag, and a **safe alternative**. A never-say entry without an alternative gets routed around by the next writer.

## Running the audit and sign-off

1. **Collect candidates:** `brand_read` kit `approvedClaims`, `proofPoints`, `valueProps`, `tagline`, `description`, `audience`, `creativeAxes`, `existingAds` hooks, offers and angles, site lines quoted in `voice`, and the knowledge `positioning`; `knowledge_search` `source_types: ["claim"]`; claims inside product descriptions; anything the owner's documents state as fact.
2. **Classify each** by type and risk, and look for proof already in the brain (`knowledge_search` `source_types: ["document", "evidence"]`).
3. **Recommend a verdict per candidate:** keep as is / keep with qualifier / reword to (your safer wording) / needs proof (stays out until the owner supplies it) / cut. Offers and policies get a review date.
4. **Triage to fit the time budget** (the whole claims step is about 10–15 minutes). Rank candidates by reach: value props, tagline, description, live ad hooks and the hero product first; deep product-page lines last.
   - Low risk (product facts, current policies): one batch. "These 6 are factual; tell me any that are wrong or out of date."
   - Medium risk: groups of 3–5, each line visible with your recommendation.
   - High risk: one at a time, showing the proof or "no proof on file", your recommended action, and the reason in one line — but only the five or so with the most reach. Every other high-risk line is recorded as **not approved yet**, without asking, with what would unlock it.
   - Never accept a single "ok" for a long list. That is a rubber stamp, not sign-off.
5. **Owner attestation and disagreement.** For a *verifiable fact about the business* (who formulated it, where it is made, the number of awards with their names and years), the owner's own statement, recorded with their words and date, is acceptable proof — e.g. naming the dermatologist unlocks "Developed with Dr. X". Never for efficacy, clinical, comparative, health or environmental claims: those need evidence. If the owner insists on a claim without proof, record it as **not approved — owner disagrees: "<their words>"**, with what would unlock it; what they put on their own site is their call, but no playbook uses it.
6. **Default when the owner has no time** (or says so at any point): approve product facts and current offers only; everything else stays not approved yet, unlockable later in one-claim mode. This is day-one fact 5's default: product facts only, no customers or results.
7. **The never-say list** is confirmed in the same pass: show the category and platform entries you loaded, ask for the owner's own nevers, and ask once "what must never be said publicly, and until when?" (roadmap, unannounced products, revenue, customer names).
8. **Who signs off.** If the person in the chat is not the one who approves claims (an agency, a junior marketer, a regulated brand with legal review), new lines go to the sign-off sheet (the record's "Decisions needed") for them to forward, and nothing new is approved until the approver's answer comes back (client sign-off mode), recorded verbatim with its provenance. Claims already approved stay approved (the status stays `signed-off`; `pending-client` only when nothing is approved yet). Facts the person in the chat states are recorded now, and a claim they say is false is pulled at once: removed from value props and moved to the record's "Not approved" table.

## How other playbooks use the list

Through `../../../skills/claims-gate/SKILL.md`, the only claims contract (AGENTS §8): approved claims verbatim or a listed variant, in scope, before the review date, with the qualifier; a claim past its review date is a candidate again; anything not on the list is cut and shown to the human, never softened into something "close". When a job needs a line nobody approved, the gate's scoped sign-off asks for the 3–5 lines that job needs and records them exactly as this playbook does.
