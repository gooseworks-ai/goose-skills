# Voice craft

Load at step 5. The brain usually holds the server's voice read as a prose paragraph plus tone adjectives. A paragraph cannot reject a sentence, so siblings write generic copy from it. This step turns it into rules a writer can apply and a stranger can check, then gets the owner's yes. Do not re-distill the voice from scratch: start from the brain's read and the brand's own lines, then sharpen.

## What the confirmed voice contains

1. **Personality: is / is not.** 3–4 pairs, each with a tension: "Confident, not cocky", "Expert, not clinical", "Warm, not gushy". Each side gets one real sentence.
2. **3–5 voice rules, each falsifiable.** A rule, then "we say" (a real brand sentence) and "we don't say" (a *plausible* off-brand version someone would actually write, not a straw man). Shape, with illustrative lines; always use the brand's own:
   - *Lead with the feel, not the chemistry.* We say: "Light enough for morning, gone in ten seconds." We don't say: "Our proprietary complex leverages advanced actives."
   - *Specific over superlative.* We say: "Fragrance-free. 30 ml lasts about two months." We don't say: "The ultimate game-changing formula."
   - *Talk like someone who's been there.* We say: "We tried everything too. Most of it stung." We don't say: "We understand your skincare journey."
   Every "we say" line is itself copy: it must pass the approved-claims list and the never-say list before it becomes a rule (no efficacy promise, nothing that addresses the reader's own health, body or finances — Meta bans that).
3. **Banned words and patterns.** The owner's own list, plus this standing list of words and patterns that make copy read as machine-written: elevate, unlock, unleash, seamless(ly), game-changer, revolutionise, delve, embark, journey (as metaphor), empower, supercharge, level up, curated, robust, holistic, transformative, "in today's fast-paced world", "look no further", "say goodbye to", "whether you're X or Y", "it's not just X, it's Y", "Imagine…" openers, rhetorical-question openers, reflexive groups of three, em-dash chains, emoji bullet lists. The owner may keep any word on purpose; record that.
4. **Terminology.** Brand and product name styling (capitalisation, ™/®), what customers are called, words the brand owns, words it avoids, competitor naming policy.
5. **Flex by channel.** One line each for the channels the brand uses: ad hook (punchier, one claim), email (warmer; from the founder or the brand?), social (how loose; slang yes or no), customer support (plain, apologise once, no hype, never promise outcomes), B2B sales (concrete numbers, nothing cute), app-store or marketplace listing (plain, scannable).
6. **Flex by speaker.** Founder voice ("I": opinionated, personal; swears or not) vs brand voice ("we"). run-organic-social and make-content depend on knowing the difference.
7. **Mechanics.** Locale and spelling (US/UK/other), reading level (consumer: plain, roughly grade 6–8), headline case, numerals, Oxford comma, exclamation marks (cap per asset), emoji (which, where, never in support).
8. **Taste notes.** Lines the owner loves or hates from anywhere, each with their reason in their own words.

## Where the samples come from

Pull 6–10 real lines across channels before asking anything. Trust order:
1. Founder-written (posts, emails, interviews, the About page if they wrote it).
2. Best-performing (own ads by results, top emails by clicks; `existingAds` hooks are a start).
3. Recent (last 12 months).
4. Agency or freelancer copy.
5. Site copy. Often agency- or AI-written: check it against the banned list before trusting it.

Discard any line that would fit the top two competitors equally well; a rule that fits them too is not voice. If the brand has almost no copy (pre-launch), ask the founder to paste 5–10 of their own posts or messages and use those (plus their words in this chat) as the sample; say the voice is provisional.

**Owner-made rules beat the research read.** If a learning the owner wrote (e.g. "don't write clipped short sentences in scripts") clashes with the research voice ("sentences are short"), show the clash and let the owner settle it; never keep both.

## Getting the owner's yes efficiently

1. **Triad test.** Take one real brand line and rewrite it three ways along one dial (plainer / warmer / punchier). Ask: "Which is us?" Then a second dial (formal ↔ casual, or playful ↔ serious). Two or three rounds settle most of the guide.
2. **Keep or kill.** Show five short lines written in the draft voice: an ad hook, an email subject line, a social caption, a support reply, and (B2B) a sales line. The owner marks keep or kill and says why for any kill. Each "why" becomes a rule, in their words.
3. **Show the guide** (rules with pairs, banned words, terminology, flex) as one screen and ask for corrections. Their yes, verbatim, is the sign-off.

Never ask "describe your brand in three adjectives", "what's your brand personality?", or a rating scale. Show, then ask them to choose.

## Failure modes to check before showing the guide

- Adjective soup with no rules ("bold, friendly, innovative").
- A rule that cannot reject any sentence.
- A voice copied from the category leader, or distilled from AI-written site copy.
- No channel or speaker flex, so support replies sound like ads.
- Straw-man "don't" examples.

**Falsifiability test:** give someone one rule and two sentences; they should be able to pick the on-brand one.

## How it is written back

- The confirmed guide (personality, the rules with their pairs, terminology and name styling, mechanics, channel and speaker flex) → the kit's `voice` via `brand_update` `patch.kit`, as a `user_correction` with the owner's approval words. Siblings read the kit voice. Keep it within the field's limit by writing tight pairs, not prose.
- Banned words and patterns → the full list (the owner's own words plus the standing list, minus words they keep on purpose) under "Banned:" in the kit `voice` and in the Brand record's Voice section; plus one `Banned words — …` fact (`kind: "dont"`) holding the full list, the owner's own words first. The rest of the voice guide lives in the kit `voice`, its home, not in learnings.
- The voice status (`confirmed` or `provisional`) goes in the claims marker; provisional voice is kept in the Brand record only.
- A founder's or account's own style → `../../../skills/voice-card/SKILL.md` (`brand/voices/<handle>.md`). The brand's rules beat a card's style.
