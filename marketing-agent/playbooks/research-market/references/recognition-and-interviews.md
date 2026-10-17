# Recognition test and the interview kit

## Recognition check (in the closing message, step 9)

The report is already delivered; these questions sit in the closing message with the other decisions. Ask them without leading (do not hint at the answer you hope for), and record the answers verbatim in the read when the founder replies:

1. **"Is this your buyer?"** — yes / partly / no, and what is wrong.
2. **"What here did you not know?"** — if the answer is "nothing", make one more pass over 1–3★ rows, switch-away rows and private material, then hand over again. After that one re-pass, record the answer as it stands; do not loop.
3. **"Which quote would you put in an ad tomorrow?"** — tells you which language lands; mark that row `vividness: 3` if it is not already.
4. **"Which of these competitors should we track?"** — the direct competitors buyers mentioned that are not yet tracked. Only names the founder picks are added (`gooseworks:competitor_save`).

With fewer than ~20 customers (a founder who knows every one), "what did you not know" is unfair: test the read against lost deals, churned users and prospects instead, and say so.

How to handle answers:
- "No, my buyer is X": ask what evidence they have (orders, CRM, survey). If they share it, mine it. If not, record their view beside the evidence; do not delete evidence to agree.
- A correction about facts only they know (who pays, the gift share, the B2B buyer's title): quote it verbatim in the read and in the audience proposal's rationale, and update the segment. If they want it kept as a rule, offer it as one of the ≤ 3 learnings through `../../../atoms/save-learning/ATOM.md` — never write it to the brand directly from here.
- Pass = "yes" or "partly, with fixes applied" plus at least one thing they did not know (or, for tiny customer bases, a lost-deal or prospect pattern they recognise).

## The evidence floor (SKILL.md step 4)

Count first-hand items about the brand's own customers and prospects: reviews, community threads and comments, the brand's own social comments, private material. Not counted: curated testimonials and case studies, editorial coverage, quotes reproduced on someone else's page. A rival's customers count as prospects only when they are actively moving to us (a rival's shutdown with our offer) — tag them `about: prospect (moving from <rival>)`. Under ~30 after the full free pass = cold start.

## When to stop and hand over the kit

Put it in the report at the evidence floor (SKILL.md step 4) — after the full free pass, never instead of it — or when the founder rejects the read and has no evidence to mine. Say it plainly: "Public evidence is too thin to describe your buyer with confidence. The fastest way to close it is 5–8 conversations with recent buyers. Here is a kit you can run." The agent never sends, books or posts anything.

## Short surveys (5 questions, the human sends them)

**Post-purchase** (customers in the last 90 days)
1. What were you trying to get done when you went looking for something like this?
2. What else did you try or consider before buying? (open text)
3. What almost stopped you from buying?
4. What made you decide to buy now rather than later?
5. How would you describe this product to a friend?

**Waitlist / pre-launch** (people who signed up)
1. What made you sign up today?
2. What are you using or doing about this right now?
3. What's the most frustrating part of how you handle it today?
4. What would this have to do for you to pay for it?
5. What would make you not try it?

**B2B lost deal / churned account** (the founder sends it personally)
1. What were you hoping we would solve?
2. What did you choose instead (including "nothing for now")?
3. What tipped the decision?
4. Who else was involved, and what did they care about?
5. What would have had to be different?

Optional on any: "How did you first hear about us?" (open text, not a dropdown).

## Switch interview guide (8 questions, 20–30 minutes, the human runs it)

Talk to people who bought in the last 90 days, plus 2–3 who left or nearly bought.

1. Take me back to when you first thought you needed something different. What was happening?
2. What were you using before? What was wrong with it — and what was good enough that you kept it so long?
3. What did you look at? How did you find it? What did you rule out, and why?
4. What were you worried about before buying?
5. What finally made you buy, and why that day?
6. What happened the first week? Did anything surprise you?
7. What would make you stop using it?
8. If this disappeared tomorrow, what would you do instead?

Ask for stories, not opinions ("tell me about the last time…"). Record only with consent. Paste the raw transcripts or answers back into the chat (or upload them); this playbook saves them to the workspace with `gooseworks:file_write` and mines them as `source_class: private` rows on the next run.
