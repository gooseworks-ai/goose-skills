# Fact rules for content (on top of the claims gate)

The shared claims gate (the `claims-gate` skill, `../../claims-gate/SKILL.md`) owns every claim **about the brand**. It loads the brand's claims contract, keeps, rewrites or cuts each span, and runs the scoped sign-off when nothing is signed off yet. Run it on every piece and every repurposed set, **after the substance pass and before the readability pass** (the `make-content-two-pass-edit` skill, `../../make-content-two-pass-edit/SKILL.md`).

Content carries kinds of statements the gate does not cover. Check these spans in the same pass, with the same output (kept / softened / cut, plus what would restore each cut):

| Span | Example | Rule |
|---|---|---|
| World fact (not about the brand) | "60% of buyers ask AI assistants first", "hypochlorous acid is made by white blood cells" | Needs a public source you opened in this run, cited inline with its date. Without one, cut it or turn it into a plain instruction that makes no factual claim. Never cite from memory. |
| Competitor fact | "X charges $99", "X has no free plan" | Dated and sourced: research-competitors' file (`research/competitors/<slug>.md`), `gooseworks:competitor_read` (first check the dossier's domain and handle match the competitor), or a public page opened in this run. |
| Quote (a buyer, a review, a post) | "I lost three days of credits" | Only with a link to the page it is on (the post or review itself, never a site's home page), opened this run or taken from a saved file that carries that link. No link, no quote: paraphrase without quote marks or cut it. |
| Price, plan or offer (ours or a rival's) | "$59 a month", "credits roll over" | The guide's rule "Live facts" (the `marketing-guide` skill (`../../marketing-guide/SKILL.md`) §3). A saved or remembered price is a lead to check, never the copy. |
| A piece that grades the category | "we tested five tools on rollover", "the complaints every tool gets" | Settle **our own answer on the same test first**, from the product record, our pricing page or docs, or the marketer — before drafting. Where we'd fail the same test, say so in the piece or drop the test; otherwise the replies do the teardown. Don't make rivals identifiable by detail (a rating range, a price, a quoted complaint) unless naming them is approved. |
| Limitation about us | "Meta only", "no API yet" | Only from the product record or the human. Never inferred. |
| Founder or speaker story, opinion, experience | "I started this after…" | Only from the human's own words (this run, or saved `content/pov/`), or verbatim from the source asset being repurposed, with the speaker named and timestamped. A piece that quotes or speaks for a named person carries **PERSON YES NEEDED (<name>)**. |
| Sensitive topic (mental health, suicide, self-harm, medical) | a founder's anxiety story | Include a help or crisis resource whose wording comes from a source opened in this run or the brand's own standard line. Otherwise mark it `[RESOURCE LINE NEEDED]`. Never tie the piece to a product. Drop "today is…" framing once the date has passed. |
| Third-party IP, or a real person's name or likeness | a licensed character, a creator, a celebrity, a user-made catalog item | Only with a licence or permission the human confirms. Otherwise make it generic. The brand's own founder or ambassador is fine where the brain shows the relationship. |

A brand's own past posts and site copy are **voice examples, not proof**. They often carry claims that were never approved, so never lift a claim from them.

## Output, attached to the piece (one block per repurposed set)

```
Claims and facts — <piece or set>   (sign-off: signed-off <date> | scoped sign-off this run | product facts only)
Kept · Softened · Cut (what would restore each) · Sourced (url, date opened) · Disclaimers added · Person yes needed: <name> | none
```

Show cut items to the human in plain words: "I left out 'acne-safe' because you haven't signed it off yet. Want to approve it now?" Never name internal steps, tools or other playbooks.
