# Voice cards on social: what this playbook adds to the shared atom

The shared voice-card atom (`../../../atoms/voice-card/ATOM.md`) owns how a card is built, read and updated at `brand/voices/<handle>.md`, the slug rule (the account's or person's handle), retiring the old card document, and precedence (learn-my-brand's rules beat a card's style). Use it for every card. This file adds only what social needs on top.

The telltale failure is "posts that sound like anyone's brand but yours", so a card is built from **measured real posts, not adjectives**.

## Where the posts come from

1. **Free:** `gooseworks:brand_read` `sections: ["organic"]` → `own_posts`. It returns about a week of own TikTok/IG posts, with captions, `posted_at` and numbers.
2. **More history, or LinkedIn and Threads:** read through the proxy (`foundation/data-access`) under the shared spend gate (`../../../atoms/spend-gate/ATOM.md`, proxy branch: a probe with the marketer's yes in the intake message, then a ceiling, every charge logged). Use only the verified endpoints in `../../../atoms/spend-gate/proxy-endpoints.md`: Instagram and TikTok own posts, LinkedIn company posts, and LinkedIn and Threads keyword searches. Searches return anyone's posts, so keep only posts whose author matches the account. X has no verified own-feed read today, so X posts are pasted.
3. **Pasted** posts, only if the marketer declines the read or it comes back thin. For founders, a few of their replies too: unpolished replies are the truest voice.

Kit voice example lines are evidence of **style only**. Any claim in them is not proof. Press quotes are not buyer words.

## Corpus rules

- **Minimum: about 8 measurable posts per card.** Posts in the same voice on different platforms pool toward the minimum. Measure per-platform mechanics separately only where they differ.
- Leave out captions that come back cut off mid-word, and say so.
- Below the minimum, run the **voice interview**: 5 minutes in chat, or a voice note (`gooseworks:media_upload` + `gooseworks:media_analyze`; in a chat host with no shell, upload in the GooseWorks app). Save the card marked **provisional** and make the two weeks a labelled format test. The questions:
  - Paste 3 things you've written that sound like you.
  - 3 words you'd never use.
  - Who do you write for?
  - What do you believe about <category> that others don't?
  - What makes you cringe in other brands' posts?
  - Emoji, yes or no, and which?
  - Lowercase or proper?
  - One story you tell often.
  - Topics off-limits?
  - Who approves posts in your name?

## Social measurements every card must carry

- Exact casing, line-break style and the exact emoji set and rate.
- Hashtag habit, and symbols used for words (e.g. "+" for "and").
- Opening moves, with 5 verbatim first lines; how posts end.
- Pet phrases and product nicknames, and a never-says list.
- For people: a stance ledger of stated opinions, each with its source post.
- What performed: top and bottom posts against the account's own median, with the likely why.

## The match test (every draft, before it is shown)

1. **Mechanics:** within the card's ranges. Emoji set, casing and punctuation match exactly.
2. **Swap test:** with a competitor's name in, the post must stop reading true.
3. **Read-aloud:** would they say this sentence out loud?

## Named people: the hard rule

This applies to founders, celebrity founders and ambassadors quoted on the brand account ("Lili's everyday go-to…"), employees and customers.

Never invent a first-person experience, habit, product use or opinion for them. Material comes only from their own words:
- the raw-material prompts in the intake message, one per planned slot;
- their stance ledger;
- interview answers saved in `content/pov/`.

Use a `[NAME: …]` slot only for a prompt left unanswered. A slot with no material behind it is cut or swapped for a brand post. A fabricated "last week a customer told me…" loses the person's trust faster than anything else, and it is also a claims breach.
