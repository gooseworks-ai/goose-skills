---
name: voice-card
description: >-
  Builds or updates a voice card: how one account or person actually writes, measured from about 8 or
  more of their real posts (length, casing, emoji, openings, pet phrases, opinions with their source).
  When there are too few posts, it runs a short interview instead. It ends with a test that checks a
  draft against the card. The brand's rules always beat the card. Use alone when you already have the
  account's posts or the person on hand; otherwise run the playbook for the job (e.g.
  run-organic-social, write-outreach, email-lifecycle).
version: 0.1.1
---

# voice-card

The brand voice (kit `voice` plus the brand's rules: every `dont` and `must` in its learnings) says what the brand may say and how it sounds overall. A **voice card** says how one account or person actually writes: lowercase or not, how long, which emoji, how they open. Adjectives ("warm, playful") don't stop generic copy; a card measured from real posts does.

## Where it lives

- One file per account or person: `brand/voices/<handle>.md`, brand coworker scope (`coworker_agent_id` from the `gooseworks:brand_read` list; no coworker → default workspace, path prefixed `brands/<brand-slug>/`).
- **Handle:** lower-case, hyphens, no `@`: `brand` (the brand's own voice across its accounts), `ig-<account>`, `tiktok-<account>`, `linkedin-<first-last>`, `founder-<first-last>`. One card per account where mechanics differ; accounts that write the same way share `brand`.
- Read before you write (`gooseworks:file_read`; `file_write` replaces the file). Save with the `save-to-brain` skill (`../save-to-brain/SKILL.md`) (`versioned: supersede`, title `Voice card <handle> — <Brand> — <YYYY-MM-DD>`, tags `[voice-card, voice-<handle>]`) so it is findable from any host. The tags name this atom, not the playbook that ran it: for save-to-brain's supersede rule, the creator is the first tag (`voice-card`), so any writer's newer card supersedes an older one.

## Precedence (non-negotiable)

1. The brand's rules win: every `dont` and `must` (never-say, banned words, terminology, not public), the claims contract (the `claims-gate` skill (`../claims-gate/SKILL.md`)), and the rules in the confirmed brand voice (what it never does, how it treats customers).
2. A person's or account's card wins on **style**: mechanics, openings, lexicon, humour. The brand voice's style gives way to a founder's own card when writing as that founder.
3. Real posts beat any description of the voice. Example lines in the kit voice are evidence of style only; a claim inside them is not proof.
4. If the brand marker says `voice: provisional`, every card built on it is provisional too.

## Read

`gooseworks:file_read` `brand/voices/<handle>.md`. Missing, or built more than 90 days ago, or older than the account's last 8 posts → build or update. A card marked `status: provisional` is usable, and drafts from it say so.

## Build

1. **Sources, by weight:**
   - the account's own real posts: TikTok/Instagram from `gooseworks:brand_read` `sections: ["organic"]` (`own_posts`); other platforms through the proxy (the `marketing-data-access` skill, `../marketing-data-access/SKILL.md`) or, when not reachable, 10–20 posts the human pastes. For a founder, a few of their replies and comments too (the least polished, so the truest voice);
   - the kit `voice`, `tone`, and learnings (`do` / `dont` / `must`);
   - the buyers' words (research-audience's voice-of-customer bank, `research/audience/voc-bank.md`) for hooks only; it is not the brand's voice.
2. **Minimum corpus: about 8 real posts.** Below it, run a 5-minute voice interview instead (or take a voice note via `gooseworks:media_upload` + `gooseworks:media_analyze`): 3 things you've written that sound like you; 3 words you'd never use; who you write for; a belief about the category others don't share; what makes you cringe in other brands' posts; emoji yes/no and which; lowercase or proper; one story you tell often; off-limits topics; who approves posts in your name. Save the card `status: provisional`.
3. **Measure, with numbers, not adjectives:** words per sentence and per post (median, range); casing; line breaks; rates of em-dash, ellipsis, exclamation and question marks; emoji rate and the exact set; symbols used for words; fragment and typo tolerance; opening moves with 5–10 verbatim first lines; closings; pet phrases and nicknames; jargon and swearing level; how they name customers and rivals; humour; for people who take positions, a stance ledger (each opinion with its source post); never-says (moves absent from the corpus that AI reaches for); top 5 and bottom 5 posts against the account median with the likely why. Leave out captions that come back cut off.
4. **Write the card:**

```
Voice card — <handle> · <Brand> · built <YYYY-MM-DD> from <n> posts (<sources>) · status: <confirmed | provisional>
Rules with numbers: …
Openings that are theirs: <5 verbatim>
Pet phrases: … · Never-says: …
Stance ledger: <opinion> — <source post>   (people only)
Humour: …
Brand rules that apply (from learnings): …
5 real posts, annotated (why each one sounds like them)
3 wrong → right rewrites (a generic draft vs the same idea in their voice)
What performed: top 5 / bottom 5 with the likely why
```

5. **Confirm.** Show the card ("does this sound like you?"). A person's card needs that person's yes; until then it is `provisional`. Their corrections go into the card in their words.

## Update

Append new posts, re-measure when at least 8 new ones exist, keep the stance ledger growing, bump the date, save a new version. Never drop a confirmed rule without the person's yes.

## Match test (on every draft before it is shown)

1. Every mechanic within the card's range; emoji set, casing and punctuation habits match exactly.
2. **Swap test:** put a competitor's name in. If the draft still reads true, add the detail only this brand or person could say.
3. **Read aloud:** would they say it?
4. **Line-up:** mix the draft with three real posts; if someone holding only the card can pick out the draft, rewrite it.
5. Then the `claims-gate` skill (`../claims-gate/SKILL.md`) on the draft.

## Named people

Never invent first-person experience, a habit, product use, a number or an opinion for a founder, ambassador, employee or customer. An opinion must trace to the stance ledger or to their own words in this conversation. Leave a marked gap (`[NAME: the time a customer caught a bug before you did]`) for material they haven't given; a gap with no material behind it is cut.
