# Editing: the two passes and the AI-tell check

Load at the edit step. Every draft gets two passes, **substance first, then readability**. Polishing sentences in a piece whose argument is wrong wastes the edit.

## Pass 1: substance

Questions 1, 3, 8 and 9 go into the edit note (the `make-content-two-pass-edit` skill, `../../make-content-two-pass-edit/SKILL.md`). Run the others as checks and fix what fails.

1. **One argument?** Can you state the piece's thesis in one sentence that a reasonable person could disagree with? Does every section advance it? Cut any section that is true but not needed.
2. **So what?** After each paragraph, ask "so what for this reader?" If the answer is not in the next sentence, rewrite or cut.
3. **Swap test.** Replace the brand name with its closest competitor's. If the piece still works, it has no information gain: add the brand's own data, process, customer words or the human's opinion, or say plainly that the piece is generic and why.
4. **Proof density.** Count the concrete specifics per section: a name, number, step, quote or example you could photograph. Aim for one every ~150 words in long-form. Adjectives are not proof. Every proof unit must trace to the brief's proof inventory; anything else is invented and goes.
5. **Says what competitors don't?** Judge this only against competitor content you actually have in hand: the page brief's top results, research-competitors' files, or pages opened in this run. With none, write "information gain: not checked (you declined the search read)". Never describe "what the top results say" from memory; read them first (the `make-content-content-brief` skill (`../../make-content-content-brief/SKILL.md`), Top search results).
6. **Skeptic.** What would a smart skeptic in the audience object to? Answer the strongest objection in the piece.
7. **Order.** Is the strongest point early? Would a reader who stops at the halfway mark still get the argument?
8. **Fakes.** Remove any anecdote, customer, "a founder told me", "imagine Sarah, a marketing manager…", or statistic that the human or the brain did not supply. Replace it with `[PROOF NEEDED: …]` or `[STORY NEEDED: …]`, or cut it.
9. **Intent and CTA.** Does the CTA match the intent? Do not put a demo ask on a learn-intent piece. Offer the next useful step.
10. **Hedging.** Hedge once, where the evidence is genuinely uncertain, and say why. Cut stacked hedges ("may potentially help"). Take a verdict where the evidence supports one; a symmetric "on one hand / on the other" with no verdict fails.

## Pass 2: readability

- **Headline and hook.** Does it promise something the piece delivers within the first 100 words? The hook leads with the reader's pain or want, never with our weakness or a rival comparison ("Our credits expire every month. One rival's last two." opens on our gap and invites the comparison: lead with the reader's problem instead).
- **Lede.** The claim or the tension arrives by sentence two. Delete the first paragraph and check whether anything is lost (usually nothing is, so keep it deleted). No scene-setting. No "In today's…". How-to and search pieces answer first.
- **H2s as claims.** Reading only the subheads should give the argument.
- **Scannability.** Paragraphs ≤4 lines, one idea each. Bold only the sentence a skimmer must take, at most once per section. Use lists only for parallel items, never to chop up an argument.
- **Sentences.** Average ≤18 words with real variation. Target grade 7–9 for B2B, 6–8 for consumer. Treat this as a check, never a pass/fail gate.
- **Ending.** Do not end with a recap. End with the implication, the next action, or the strongest line you held back.
- **Voice match.** Read the draft against 3 real example lines, using the fallback order in the `make-content-two-pass-edit` skill (`../../make-content-two-pass-edit/SKILL.md`) (author card → kit example lines → own post captions → site lines → pasted lines → "voice unmatched"). Compare sentence length, contractions, jargon level, humour, "we" vs "you", casing, emoji and punctuation habits. Apply every Do/Don't from the voice guide and every `dont` learning (e.g. a learning about script rhythm). If you have to guess at humour, take it out and flag it.

## The AI-tell check (mechanical; run it on every draft and every repurposed version)

If the brand's own real writing uses an item below, it is allowed for that brand. Otherwise remove it.

**Words.** delve · unlock · unleash · elevate · empower · harness · leverage (verb) · navigate (figurative) · embark · foster · revolutionize · supercharge · streamline (unquantified) · tapestry · landscape / realm (figurative) · seamless · robust · cutting-edge · game-changer · synergy · holistic · myriad · plethora · pivotal · paramount · crucial · transformative · testament to · boasts · journey (unless literal) · ever-evolving · deep dive · secret sauce.

**Phrases.** "In today's fast-paced world" · "In today's [anything]" · "It's important / worth noting" · "Moreover / Furthermore / Additionally" as sentence openers · "In conclusion" · "At the end of the day" · "Let's dive in / explore" · "Buckle up" · "Here's the thing" · "The best part?" · "Here's the kicker" · "Let that sink in" · "Whether you're an X or a Y" · "Imagine a world where" · "Say goodbye to X and hello to Y" · "Ready to…?" · "X: The Ultimate Guide".

**Patterns.**
- "It's not X — it's Y" / "not just X, but Y": at most one per piece.
- Rhetorical-question openers.
- Self-answered questions ("Why? Because…").
- Colon reveals ("The result? …").
- Triplet adjective lists and three parallel clauses in a row.
- An em dash in every paragraph: keep to the brand's own rate (default: rare).
- Every paragraph the same length.
- Every section ending in a summary sentence.
- Emoji bullets in long-form.
- Bolded phrases scattered through every paragraph.
- Invented dialogue in quote marks.
- Title Case Hooks on social.

**Reviewers' suggestions get the same checks.** A hook or line suggested by a reviewer, a subagent or the marketer's colleague goes through the substance pass, the claims and fact checks and this list before it's adopted; "a reviewer suggested it" is not a pass.

**Report it.** List each tell you removed in the piece's notes ("removed: 3 × 'leverage', 2 × colon reveals"). The human then sees the check was run.

## Failure modes to check last, ranked by how often AI drafts fail this way

1. Generic: true, bland, passes no swap test.
2. Invented proof: stats, customers, quotes, anecdotes.
3. AI-tell diction and rhythm.
4. Warm-up intro, recap ending.
5. Topic-list structure instead of an argument (noun H2s, listicle bloat).
6. Cropped repurposing (same opener and sentences across platforms).
7. Voice drift to corporate-neutral.
8. Over-hedging with no verdict.
9. Padding to a word count.
10. Unapproved comparisons with competitors.
11. Platform mechanics: a link in the LinkedIn body, an empty thread opener, a carousel slide 1 that isn't a hook, an over-length script.
12. A CTA that doesn't match the intent.
