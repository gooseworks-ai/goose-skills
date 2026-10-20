# Reading outbound results — what to fix

Load in results mode. The marketer pastes their tool's numbers and the replies (or a reply export). The read says, in plain words, what is working, what to fix first, and how sure we can be.

## What to ask for (once, all optional)

Sends, replies and bounces per touch and per segment (or per variant), unsubscribes, meetings booked, the reply texts, and **the sending tool's sent list or export** with when each person got touch 1 (so the ledger can mark them `contacted` with `first_touch_date` and `last_touch` — `sequence_id` was set at delivery — which anchors the rates and starts the 12-week cool-down). Opens are **not** used: Apple Mail and others pre-load images, so open rates are inflated and unreliable; judge on replies and meetings.

With the sending tool connected (`handoff-and-compliance.md` § Your sending tool), read these from it, read-only, instead of asking.

## Counts only

When results come as counts only, the read's **closing decisions** ask once for who is behind every `stop`, `angry`, `bounce` and `not-interested`, and when touch 1 went out (it starts the 12-week cool-down and fills `sequence_id`, `last_touch`). Until answered, `results-working.md` carries `Hold needed: for research-audience · <accounts or "all accounts in <list>"> · return to: outreach/<D>-<slug>/results-working.md`, and research-audience excludes them.

## The numbers

- **Reply rate per touch** = replies to that touch ÷ people who got it and hadn't replied yet. Touches 2–4 should bring a real share of replies (roughly a third); if touch 1 brings nearly all of them, the follow-ups add nothing — shorten or change them.
- **Positive rate** = distinct rows where `reply_category` is `interested` **or** `status` is `meeting` ÷ people contacted — an interested reply that books a meeting is one positive, not two. **Meetings** are reported separately, as a subset of the positives.
- **Bounce rate** per send (hard bounces): over 2% → stop and clean the list; aim under 1%.
- **Unsubscribe and complaint rate:** complaints over 0.3% is the line inbox providers act on; aim under 0.1%.
- **Sample size, said every time — judge on replies, not sends:** under 50 contacted in a group → counts and what to watch only, no rates judged; 50+ but under ~10 positive replies per group or variant → directional only. Never kill a variant before about 100 sends. (The ledger's lessons use the same rule: replies, not sends.)
- Under the sample-size line, the table below still names **what to watch**, but nothing is changed for good: one angry reply suppresses one person; a cluster of "not relevant" in 20 replies is a hint to check targeting, said as a hint.
- Rough ranges to sanity-check against (outbound rules of thumb, not this brand's): cold B2B replies often land around 1–5%, positive replies around 0.5–2%; warm lists much higher. The brand's own past lessons replace these once they exist.

## Reading the replies

Sort every reply with reply-reader into the categories in replies-and-objections.md. Then:
- **Where objections cluster:** mostly on touch 1 → targeting or the angle is off; on touches 3–4 → fatigue, the sequence is too long.
- **Handleable** (timing, wrong person, send info) vs **terminal** (not relevant, angry).
- **Their exact words:** objection phrases go into the next pack's answers; strong pain phrases go to research-audience's quote bank as a request line.

## What to fix — the decision table

| What you see | Fix |
|---|---|
| Many `not-interested` saying "not relevant" (over ~20% of replies) | Targeting: tighten the fit definition (research-audience), add the pattern to the negative fit |
| Many `wrong-person` | Titles: switch to the roles people referred you to; each unnamed referral ("talk to our CTO") becomes a request line in `results-working.md` — `Find needed: for research-audience · <role> at <account> · return to: outreach/<D>-<slug>/results-working.md` — never a guessed person |
| Many `using-rival` | Angle: lead with the difference that matters; or move these accounts to a rival-customer segment |
| Many `timing` | Timing: re-contact at the dates given; weight signals that are fresher |
| Replies fine on one segment, flat on another | Shift volume to the working segment; rewrite or drop the other |
| One variant clearly ahead (with enough sends) | Keep it; test a new idea in the losing slot |
| Touches 2–4 add almost nothing | Shorten the sequence or give those touches new reasons to reply |
| Bounces over 2% | Stop; clean the list (verify every address) before sending more |
| One angry reply | Suppress that person; check whether their segment's targeting or tone caused it |
| Complaints over ~0.3% or several angry replies | Stop sending; check targeting and volume; every complainer suppressed |
| Few replies, low bounces, no complaints | The message: hook, proof, ask — rewrite touch 1 for one segment and test it |
| Replies dropped suddenly | Deliverability: check the domain's SPF, DKIM and DMARC, cut daily volume, check whether mail lands in spam |

## When to read

After about 100 sends or two weeks, whichever comes first; again at about four weeks. Each read updates the ledger (statuses from what the marketer reported) and writes lessons through outcomes-ledger, with sample sizes; a rule the marketer states becomes an `[outreach-copy …]` learning.

## The read, through write-report

"In short" (write-report §1 order): what we read (sends, replies, the window, what's missing), the 2–3 findings with sample sizes and how sure ("1. The hiring segment replies: 4 positive from 60 sends vs 0 from 80 — likely, small samples"), then the one fix they support most ("So, do this first (because of 1): move the next 100 sends to the hiring segment"). Then the table by segment and touch, the reply categories with counts, what to fix (at most six moves, each with who, what and how we'll know), and what we couldn't read (opens, missing touches).
