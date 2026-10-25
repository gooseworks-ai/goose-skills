# Rubric — write-outreach

**In short.** Did the agent write **cold outreach a senior SDR would send** for GooseWorks — a short email and LinkedIn sequence with timing, a first line per prospect built only on the facts given, no invented proof, one ask per message, the country rules applied, a send file — and then a good answer to a real "we already use a rival" reply, while sending nothing?

- An LLM judge scores every criterion pass or fail with a one-line evidence quote.
- **A run passes only if every must-pass criterion passes.**
- Sources: `skills/marketing/write-outreach/SKILL.md` "Done when"; the old-vs-new lead-gen review (goose-lab `plan/marketing-agent/reviews/2026-10-19-old-vs-new-leads-outreach-sales.md` gap 1); `skills/marketing/write-report/SKILL.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Drafts first.** Delivered the drafts without asking questions first (assumptions such as the sender and daily volume are stated, not asked).
- **M2** — **A real sequence.** Email and LinkedIn touches in order, each with the day it goes out, 3–6 touches in all, each follow-up adding something new (not "just bumping this").
- **M3** — **First lines from the given facts only.** Priya's opener uses her hiring post, Tom's his new role, Dana's the ageing ads; Sam's says there is no personal hook or uses a segment opener. Nothing invented: no fake mutual connection, compliment, statistic, customer or result.
- **M4** — **No unapproved proof.** No customer names, results, numbers or "brands like X use us"; any proof line is either a plain product fact or marked "proof needed" / for sign-off.
- **M5** — **One ask, short.** Every message has one clear, low-friction ask; first emails are short (roughly under 120 words); LinkedIn connection notes fit the platform's character limit (300 characters or fewer).
- **M6** — **Sending rules.** The emails include an opt-out line and the sender's identity and address (US CAN-SPAM); the pack says what the UK/EU rules need before sending and advises a safe daily volume from a warmed-up mailbox.
- **M7** — **A file the marketer can use.** The drafts were written to a file in the marketer's folder and linked (with a send file or a clear per-touch layout to paste into Gmail and LinkedIn); the chat did not re-paste everything.
- **M8** — **The reply.** For "we already use adcreative, all good": the answer is short and respectful, doesn't argue or bash the rival, offers one specific, low-friction reason or question (or a graceful close), and says how to mark the person (e.g. not now / nurture, not suppressed unless they asked to stop).
- **M9** — **Nothing sent.** Nothing was sent, connected, scheduled or posted; no credits spent.
- **M10** — **Plain words.** The pack has no internal ids, file paths, tool, skill or playbook names, or process narration.

## Should pass

- **S1** — **Angle in buyers' words:** the pain is phrased as growth leads say it (creative volume, ad fatigue), ideally linked to a real quote.
- **S2** — **Subject lines** are short and plain (no clickbait, no fake "Re:").
- **S3** — **Objection bank:** answers for the 5+ likely replies (send info, timing, price, wrong person, not interested, using a rival).
- **S4** — **Signal timing respected:** the new-role opener fits a person five weeks in; the hiring opener references the open role.
- **S5** — **No reliance on open tracking;** results are judged on replies.
- **S6** — **Saved to the brand** (the pack, not the prospects' data) with a link.
- **S7** — **Short closing message** with the decisions left.

## Expert criteria (senior SDR read)

- **E1** — (must) **Would a senior SDR send it?** Read as a cold email: specific to the prospect, about their problem not GooseWorks' features, no hype words ("revolutionary", "game-changing"), no long intro, reads like a person.
- **E2** — **Swap test.** Swap two prospects' first lines: they no longer fit — each is built on its own fact.
- **E3** — **Channels work together:** LinkedIn touches don't repeat the email word for word; the connection note has no pitch.
- **E4** — **Breakup touch** closes politely and leaves a door open, without guilt-tripping.
- **E5** — **Readable.** None of: playbook, atom, worker, maker, file paths, tool names in the pack.
