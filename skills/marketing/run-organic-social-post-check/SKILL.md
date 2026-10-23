---
name: run-organic-social-post-check
description: >-
  Checks a draft social post before it goes out: voice match against the account, would a person
  actually post it, AI-sounding phrases, claims against what the brand has signed off, banned words,
  disclosure and rights, trend timing, and whether a named person must approve it; rewrites weak
  drafts. Use alone when you already have the draft, the brand's voice and approved claims; otherwise
  run run-organic-social.
version: 0.1.0
---

# Post check

Run on every slot's draft. The full checklists are in `../run-organic-social/references/post-checks.md`; the voice match test is in `../run-organic-social/references/voice-card.md`.

1. **Voice match:** the stylometric diff against the account's card, then the swap test, the read-aloud test and the line-up test.
2. **Share-worthiness and the founder test:** the share checklist and "Would a person actually post this?" (`../run-organic-social/references/post-checks.md` §1 and §1b). Write the share motive and the "Modelled on" example in the slot. A post with no proven pattern behind it, or with the product as the point, is rewritten or cut. This includes the **brand-risk question** ("could this make a buyer trust us less?") and, across the calendar, the **stranger test**: at least 3 in 10 useful to a stranger, at most half mainly about the product.
3. **AI-tells:** the blacklist, calibrated so anything the account's real posts use stays.
4. **Claims.** Run the shared claims gate (the `claims-gate` skill, `../claims-gate/SKILL.md`) on every slot. It loads the brand's claims contract, keeps, rewrites or cuts each brand claim, and runs the **scoped sign-off** when nothing is signed off: the 3–5 lines this calendar needs, asked once, in the draft-report message (SKILL.md step 2) for the whole plan, or before drafting for a single post. Here, apply the recorded answer to every slot. A line the marketer declined, or a drafted line outside the recorded answer, is cut or written as plain product facts. Never a second ask this run. Then the social-specific spans the gate doesn't own:
   - **World facts and category education** ("a gentle cleanse helps the barrier") need a public source opened in this run, cited in the calendar file. Without one, cut them or turn them into a plain instruction that makes no factual claim.
   - A claim must match the product in the slot. A press quote about a toner does not go on a spray post.
   - The account's past posts, kit voice example lines and site copy are voice examples, never proof. Never lift a claim from an old caption.

5. **Banned words:** from the voice guide and the `dont` learnings.
6. **Disclosure and rights** (organic disclosure rules: `../ad-policy-check/disclosure.md` (in the `ad-policy-check` skill)): #ad or partnership labels, employee and founder material-connection disclosure, UGC permission and credit, contest rules, Commercial Music Library for TikTok brand accounts, **third-party IP and real people** (no unlicensed characters, franchises, logos or real people's names or likenesses, including user-made catalog items), and **age-sensitive** items kept off accounts that may reach minors.
6b. **Sensitive topics** (mental health, suicide, self-harm, medical; e.g. an awareness day): include a help or crisis resource line whose wording comes from a source opened in this run, or the brand's own standard line; otherwise mark it `[RESOURCE LINE NEEDED]`. Never tie the post to a product. Drop "today is…" framing once the date has passed.
7. **Trend slots:** apply the fit test, name the tone risk tier and set the expiry date and time. Red-tier trends are never drafted. Anything past peak is dropped.
8. **Person gate.** Flag the slot "PERSON YES NEEDED (<name>, approver: <who>)" when it speaks as a named person, or attributes words, habits, product use or opinions to one (a founder, celebrity founder, ambassador, employee or customer), on any account. Every such line must trace to that person's own words, their raw-material answers or their stance ledger. Use a `[NAME: …]` slot only for a prompt they left unanswered. A slot with no material behind it is cut or swapped (SKILL.md step 4). Add material-connection disclosure where the person is paid or owns the brand and the platform or law expects it.

**Remake rule:** a draft that fails 1, 2, 4 or 8 is rewritten, up to twice. If it still fails, the slot ships with the best version marked "WEAK — why: …", or is left empty with "skip this slot" and the reason. Never ship filler silently.

Attach the check block (format in `../run-organic-social/references/post-checks.md`) to the slot.
