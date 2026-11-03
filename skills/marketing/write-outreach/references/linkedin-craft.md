# LinkedIn craft

Load at step 3 and in outreach-qa. LinkedIn is a conversation channel, not a second inbox for the same email. The person sees the sender's profile before the message — the sender's own profile and recent posts do half the work.

## Message types and limits

| Type | Who can get it | Limit | Job |
|---|---|---|---|
| **Connection note** | 2nd and 3rd-degree people | **200 characters** on a free account, 300 on paid — write to 200 unless the marketer said paid. **Free accounts can add a note to only a few invitations a month**: at list volume, send the invite without a note and put the line in message 1, or use a paid account | Earn the accept. The reason to connect, nothing more. **No pitch, no ask, no link.** |
| **Message after accept** | 1st-degree connections | 8,000 (write under 300 characters) | Read like a chat: short, one question |
| **InMail** | Anyone (spends a paid credit) | subject 200, body 1,900 (write under 600) | A stand-alone pitch to a senior or busy person who didn't accept; must make sense to a stranger |
| **Message request** (shared group or event) | Members of the same group or event | 8,000 | Must name the shared group or event, truthfully |
| **Comment on their post** | Anyone, in public | 1,250 (write 2–3 sentences) | Warm-up before the note: a useful point or a sharp question — never "Great post!" |

**Count characters, and rewrite to fit — never cut a sentence off.** Character counts go in the pack next to each note.

## Rules per type

- **Connection note:** their signal or their work, plus one line on why you'd like to connect. ("Hi Jordan — saw Brightfold is building out its AP team. I work on invoice matching for finance teams your size and would like to follow how you approach it.") 164 characters.
- **After accept:** thank them in at most a clause, then value first: one insight relevant to their signal, ending in a question. No pasted email, no calendar link in the first message.
- **InMail:** subject that sparks curiosity without selling (not "Quick question", not "Partnership opportunity"); state the signal; a bigger ask is acceptable because a credit was spent.
- **Comments:** only on posts the person wrote recently and publicly; add to their point. A comment is never a pitch.
- **Never:** reference "#OpenToWork", school, or anything personal; message from a list of people who liked or reacted to a post (we don't build those lists); send the same text as the email.

## The LinkedIn track

| Day | Touch |
|---|---|
| 0 | (Optional) a real comment on a recent post of theirs |
| 1 | Connection note |
| 3–4 after accept | Message 1: value first, one question (carries the note's line when the invite went without one) |
| Not accepted by day 7 | Optional InMail for top-value accounts only; otherwise let email carry it |

## With email

Email and LinkedIn run as one sequence (sequences.md): LinkedIn touches land between email touches, never on the same day, and say something different. If the person replies on either channel, the other channel stops.

## Hand-off for LinkedIn tools

Most LinkedIn tools import a CSV with the profile URL and one column per message; the send file uses `connection_note` and `li_message_1`. The playbook writes those columns in the send file. The marketer checks the tool's own daily limits — LinkedIn restricts accounts that send many invites a day; keep to a modest number a day and stop if acceptance falls.
