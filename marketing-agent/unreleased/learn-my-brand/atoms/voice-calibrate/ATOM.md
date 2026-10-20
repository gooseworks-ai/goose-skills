---
name: voice-calibrate
description: >-
  Internal step of learn-my-brand (hidden). Turns the brain's prose voice read and the brand's own lines into
  falsifiable voice rules with do/don't pairs, banned words, terminology and channel/speaker flex, and gets the
  owner's yes with the triad test and a keep-or-kill round.
---

# voice-calibrate

Load `../../references/voice-craft.md` first.

## Input
The kit's `voice`, `tone`, `aesthetic`; `existingAds` hooks; voice rules already in learnings (`kind` do / dont / must; owner-made ones beat the research read); 6–10 of the brand's own lines gathered by trust order (founder-written, best-performing, recent, agency, site). Pre-launch with little copy: 5–10 posts the founder pastes plus their messages in this chat, and say the result is provisional. Never invent a "real line".

## Procedure
1. **Screen** every sample line against the approved-claims and never-say lists; a line that carries an unapproved claim or addresses the reader's health, body or finances can't be a "we say" example. Show any clash between owner-made rules and the research read.
2. **Draft** personality is/is-not (3–4 pairs), 3–5 rules each with a real "we say" and a plausible "we don't say", terminology, mechanics, and a one-line flex for each channel and speaker the brand uses. Run the failure-mode checks in voice-craft.md; drop any rule that would fit the top two competitors equally.
3. **Triad test.** Pick one real line. Rewrite it three ways along one dial. Ask "Which is us?" Repeat for a second dial, and a third only if the first two disagree with the draft. Adjust the draft after each answer.
4. **Keep or kill.** Write five short lines in the draft voice (ad hook, email subject, social caption, support reply, and a B2B line if B2B). Ask the owner to keep or kill each and say why for kills. Turn each why into a rule in their words.
5. **Banned words.** Show the standing list plus any the owner named; ask which, if any, they keep on purpose.
6. **Show the guide** on one screen. Ask for corrections. Their yes, verbatim, is the sign-off.

## Output (to `atoms/brain-write-back`)
- The confirmed voice for the kit's `voice` field: personality, the rules with their pairs, terminology, mechanics and channel/speaker flex (siblings read the kit voice, its home; voice rules don't also go in learnings).
- Banned words: the full list in the kit voice under "Banned:" and in the record's Voice section; the `Banned words —` fact holds the full list, the owner's own words first.
- Voice status for the marker: `confirmed`, or `provisional` (then nothing voice-related is written; the draft lives in the Brand record).
- For a founder's or account's own voice: hand over to `../../../../skills/voice-card/SKILL.md` to build the card.
- The owner's approval words verbatim.

## Rules
- If the approver is not in the chat, the guide goes to the sign-off sheet's voice line and the kit voice is left unchanged until they answer.
- Start from the brain's read; do not throw it away and re-distill from scratch.
- Show, then ask them to choose. Never ask for adjectives or ratings.
