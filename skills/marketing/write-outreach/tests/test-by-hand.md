# Test by hand — write-outreach

## Setup
1. Connect GooseWorks **staging**; link this folder and research-audience into your agent's skills folder (marketing-agent README).
2. Use the **Gooseworks** brand on staging.

## The tests

**A. With a pasted mini-list** (the eval scenario, `evals/playbooks/write-outreach/scenario.md`): four fictional prospects with a hiring post, a new role, ageing ads and no signal. Passes if:
1. No question before the drafts; the sender, tool and daily volume are stated as assumptions.
2. Email and LinkedIn touches with days, each adding something new; a polite last touch.
3. Each first line uses only that person's given fact; the no-signal row says "no personal hook".
4. No customer, result or number GooseWorks hasn't signed off; proof lines marked "proof needed".
5. Touch 1 under ~90 words; at most 6 touches; subjects under 50 characters; connection notes ≤200 characters with no pitch (and the free-account note limit said).
6. Opt-out line and sender identity on every email; the source-and-object line for unknown-country rows; the before-you-send checklist (check addresses, a warmed-up sending domain that isn't the main one, 30–50 emails a day in total).
7. A pack file and a send file, linked; closing message in the SKILL step 8 shape.
8. Then paste "they replied: 'thanks but we already use adcreative, all good'" → a short, respectful answer with one question or a graceful close, and the status it gives the row (not suppressed).

**B. From a research-audience list:** run research-audience list mode first ("find me 20 right-fit people…"), then "write the outreach for this list". Passes if every row in `list.csv` gets a first line from its own signal URL, rows that can't be emailed (UK sole traders, unchecked Canadian addresses) get a letter or LinkedIn only, and the send file drops suppressed rows with counts.

**C. Results mode:** paste a fictional batch — "120 sent: 3 interested, 9 'not relevant', 4 'talk to our head of growth', 2 unsubscribes, 1 bounce". Passes if it says the sample is directional (3 positive replies), names targeting as the first fix (many "not relevant"), proposes moving to the referred title, asks who unsubscribed and bounced (and when touch 1 went out) so it can suppress them in the ledger — never guessing names onto rows — and doesn't use open rates.

**D. "Write my cold emails", no list on file** (buyer groups saved, no `list.csv`, nothing pasted — the 20 Oct hand test). Passes if:
1. No question first; it still writes the sequences for the saved buyer groups (lead first), each with its default opener.
2. The closing message opens "**Before you can send:** you don't have anyone to send these to yet", then offers (a) "say *build the list*" — about 50 companies and their buyer (name, title, LinkedIn), saying plainly it can't find or check emails yet and that the marketer runs a finder and a checker — and (b) "already have a list? paste it".
3. Nowhere a "Send first: <segment>, N a day" line, and no daily volume for people who don't exist.
4. The pack has the whole-path table (who does what, mailbox set-up from day 1, 300–500 accounts for a readable test).
5. The sender is a decision, prices in the copy match the live pricing page, and a send that would land in the buyer's busiest weeks is flagged.
Fails if the list offer is buried among other decisions, or the marketer has to ask "where do I get the people?".

Edge tests:
- "Write our welcome emails" → email-lifecycle, not this playbook.
- "Send these for me" → it won't send; it says the marketer sends from their own tool, and why.
- "Find me people to email" → research-audience list mode.
