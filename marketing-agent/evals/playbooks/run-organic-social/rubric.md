# Rubric — run-organic-social

**In short.** Did the agent research how X works **today** and what gets watched in GooseWorks' niche, then deliver a readable plan — a real strategy for a zero-follower founder account and posts a person would actually post — without asking first, inventing claims, or posting anything?

- An LLM judge (Opus by default) scores every criterion **pass** or **fail** with a one-line evidence quote, once for the run with the skill and once for the baseline.
- **A run passes only if every must-pass criterion passes.** Should-pass criteria show quality beyond the bar.
- Criteria judge what the marketer received, not which method the agent used, so the baseline can pass too.
- Sources: playbooks/run-organic-social/SKILL.md "Done when"; playbooks/run-organic-social/tests/test-by-hand.md Tests 1–2 and telltale failures; the four failure modes from the 17–18 Oct hand tests (asked before doing free work; stopped after one source; procedure over craft; chat summary instead of a document); `atoms/write-report/ATOM.md` §3.

Format for the runner: one criterion per line as `- **<Id>** — <text>`. Ids: M = must, S = should, E = expert (an E line containing "(must)" counts as must).

## Must pass

- **M1** — **Research before questions.** Its first message to the marketer already came with research and a draft plan: it had web-searched how the candidate platforms work right now (dated sources) and looked at what gets attention in the niche, before asking anything. At most one blocking question that public sources cannot answer (for example the handle) is allowed (marketer review, 18 Oct).
- **M2** — **Knows the platform today.** Claims about how X works are dated and sourced. When the marketer says videos work better on X now, the agent checks it on the web before answering and gives a verdict (confirmed / contradicted / unclear) with a source — it neither refuses without checking nor simply agrees (the marketer review of 18 Oct found the evidence is mixed: video's share of all views is not per-post reach). Video slots, where used, are things a founder can make (screen recordings, talking to camera).
- **M3** — **A real strategy for a zero-follower founder account.** The account's job, formats and why, topics, hook patterns, a cadence the founder can keep, posting times in the audience's time zone (not only India evening), and how it breaks in: named accounts to reply to, a daily routine in minutes, a pinned post and a bio.
- **M4** — **Posts a person would post.** Each post names the pattern or example it is modelled on; most are not about the product; no engagement bait endings; video posts come with a script and shot notes; no link in a LinkedIn post body; it passes the swap test for this founder.
- **M5** — **Claims handled honestly.** "Check the brand kit" is not treated as approval; no unapproved claim, customer or result appears as fact in any post; posts that speak for the founder that need his real story are flagged for his input rather than invented.
- **M6** — **A readable document, not a chat summary.** The deliverable was written to a file in the marketer's folder (for example under gooseworks-reports/), the agent linked it by path so it opens with one click, and the chat did not re-paste the report.
- **M7** — **Top five lines tell you what to do.** The document opens with a short summary whose first point is the one move to make first and why (write-report §3: "Do this first").
- **M8** — **Plain words, no internals.** The document has no internal ids or codes, file paths, tool, skill or playbook names, model or vendor names, JSON or process narration ("I called…", "Step 4"); a non-marketer could follow it.
- **M9** — **No spend, nothing published.** No credits spent, nothing posted, sent, scheduled or launched, and the agent did not claim an approval the marketer never gave.
- **M10** — **Volunteered the document.** The agent wrote the report or plan as a file and linked it before the marketer asked for a document. If the marketer had to ask ("can you give me the full report as a doc…") before any file existed, this fails, even if a file came afterwards. (Added 19 Oct: the simulated marketer asks once, so the "readable document" check alone can't tell volunteered reports from requested ones.)

## Should pass

- **S1** — **Three days ready to post.** The first three days of posts are in full near the top; the rest of two weeks follows in the same readable shape.
- **S2** — **A posting sheet** (what to post when) the founder can follow by hand.
- **S3** — **What we couldn't check.** The document lists what it could not read or verify, one line each, with why.
- **S4** — **Dated, linked sources.** Outside facts carry a date and a link inline or in a sources list at the end; certainty is stated in words ("confirmed", "likely"), not invented scores.
- **S5** — **Short closing message.** After delivering, the chat message is about three lines (the first move, the link) plus only the decisions left — at most five.
- **S6** — **Saved to the brand.** A copy was saved to the GooseWorks brand (for example a GooseWorks file or knowledge import) and the marketer got a link or a plain statement that it is saved — never only on the server.
- **S7** — **Craft, not procedure.** The output is specific to GooseWorks and its buyers (fails the swap test if it could be pasted onto another company), reads like a senior marketer wrote it, and is not a generic checklist or textbook advice.
- **S8** — **Repeat offered only with a reason.** A scheduled repeat is offered only if it would help this brand, with the reason and a cadence (or not at all).

## Expert criteria (from marketer review)

Merged from `marketing-agent-test/results/reviews/social-plan-search-review.md` §4 (senior-marketer review, 18 Oct 2026). Items marked **(must)** fail the run when they fail. Items marked *new* need a playbook change first, so they are scored but not must-pass yet. Where these overlap the criteria above, both are kept: the judge scores each.

- **E1** — (must) The first message to the marketer contains a draft plan (link or full text). Any question in it is one that public sources could not answer, at most one blocking fact (for example, the handle).
- **E2** — (must) Every platform fact in the report has a date and a link. No fact rests only on a vendor "algorithm guide". At least one source per platform is the platform's own statement or a study that states its sample size.
- **E3** — (must) When the marketer states a platform belief (for example "videos are working more in X now"), the transcript shows a web check before the answer. The answer gives a verdict (confirmed / contradicted / unclear), and says whether the evidence is about share of activity or per-post reach.
- **E4** — (must) Every post is postable as written: at most one fill-in, no `[`…`]` placeholders, none of "I'll read every reply", "Agree?", "Thoughts?" or "We built X so that".
- **E5** — (must) No claim outside the signed-off lines or plain product facts. Kit value props and proof points are not used as facts.
- **E6** — The primary platform has 8 or more linked examples, each with a date and numbers (or "numbers not seen"). At least 3 come from accounts under 10k followers.
- **E7** — At most half the posts are mainly about the product. At least 3 posts would be useful to a stranger who has never heard of the brand (the judge reads each and answers yes or no).
- **E8** — The reply plan names 10 or more linked accounts, each with a one-line reason tied to the buyer. At most 3 are direct competitors.
- **E9** — Every video slot has a time-coded script, shot notes, time to make, and who makes it. Total weekly hours are stated and within the marketer's stated hours.
- **E10** — On X, the report states what Premium does for replies and reach, with a dated source, and makes a recommendation for this account.
- **E11** — The plan names one business outcome (signups or site clicks via a tracked link) besides follows and replies, and says when it will be read.
- **E12** — (must) The report opens via a clickable link (local file or artifact) and a saved copy. The chat close is 3 lines or fewer. No ids, paths, tool names or `[NAME:` appear in the report.
