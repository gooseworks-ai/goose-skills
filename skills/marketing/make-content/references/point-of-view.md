# Point of view and author voice

Load when a piece needs a real opinion, a war story or a named person's voice. Encode this hard: **the agent never invents an opinion, a story or a first-person experience.** Those live in people's heads. The playbook's job is to get them out fast and write them well.

## When a piece needs a POV

Needs one: thought leadership, POV essays, founder or exec bylines, newsletter lead essays, LinkedIn posts in a person's voice, "our take on <news>", contrarian comparison verdicts.

**A piece that grades the category** ("what every tool gets wrong", built on rivals' complaints) needs the brand's own answer on the same test settled before drafting (references/fact-rules.md, the grading row). Ask it in the POV interview: "How do we do on this exact test? Where would a customer catch us out?"
Does not need one: how-tos, explainers, release notes, show notes, a roundup of approved proof, page drafts from a search brief.

## Check before asking

Search the brain first. `gooseworks:knowledge_search` for "<topic> opinion, founder belief, story" (source types `document`, `evidence`, `learning`), plus the saved interview notes in the workspace (`content/pov/`). Look at the human's own past posts (`gooseworks:brand_read` `sections: ["organic"]` for TikTok/IG; for LinkedIn or X, ask them to paste 5–10 posts). Only ask the questions the brain cannot answer.

## The 5-question interview

Best as a voice note or a 10-minute call: the human records it, you `gooseworks:media_upload` it and read the transcript with `gooseworks:media_analyze`. In a chat host with no shell, ask them to upload it in the GooseWorks app (then `gooseworks:media_list` + `media_analyze`), or to paste the transcript their recorder makes. Typed answers in chat work too. Ask all five, adapted to the topic. After each answer, push once for a specific.

1. "What does almost everyone in your space believe about <topic> that you think is wrong, and what did believing it cost someone?"
2. "Tell me about the last time this went badly, for you or a customer. What happened, what did you try first, and what number changed?"
3. "If a smart friend in <role> had ten minutes, what would you tell them to do first, and what would you tell them to skip?"
4. "What have you changed your mind about in the last year, and what changed it?"
5. "What would you only say off the record about <topic>? Can any of it go on the record?"

Probes: "For example?" · "What number?" · "Who said that, and can we name them?" · "What did you do the next day?"

Rules:
- Quote the human **verbatim** in the brief's POV slot and keep their words recognisable in the draft.
- Customer names, numbers and comparisons that come up in the interview still go through the claims gate. An interview is not an approval.
- Save the answers to the workspace (`content/pov/<YYYY-MM-DD>-<topic>.md`) so they are never asked twice. Durable positions the human states as rules ("we never discount", "we don't name competitors") go to the brain through the shared save-learning atom (`../../save-learning/SKILL.md`): in their own words, prefix `[content YYYY-MM-DD]`, one idea each.
- If they decline or have no time: deliver the no-opinion version (how-to, explainer or roundup), labelled "no POV anchor: the thought-leadership version was not attempted", and say which one question would unlock it.
- Never write "we believe…" or "I've learned…" sentences the human did not supply. Leave `[NAME: your take on X]` slots instead.

## Author voice (bylined pieces)

The brand voice is in the kit. A founder's or exec's voice is different, and lives in a **voice card** built by the shared voice-card atom (`../../voice-card/SKILL.md`). That atom owns how a card is built, read and updated; the slug is the person's handle. The brand's rules beat a card's style.

The voice-card atom also owns where the person's posts come from: the brand's own posts free, other platforms through the proxy under the spend gate, or pasted. Use only the verified endpoints in `../../spend-gate/proxy-endpoints.md` (in the `spend-gate` skill). LinkedIn and Threads reads there are keyword searches, so keep only posts whose author matches the person. With fewer than 8 left, ask for a paste. X has no verified own-feed read today, so X posts are pasted. Interview transcripts and emails they share count too.

Show a new card to the person once ("does this sound like you?"). Anything published under, or quoting, a person needs their own yes (PERSON YES NEEDED).

## Workspace scope

Every path lives in the brand coworker workspace (`file_*` with `scope: {type: "agent", agent_id: <coworker_agent_id from the brand_read list>}`). If the brand has no coworker, use the default workspace with every path prefixed `brands/<brand-slug>/`, and tell the marketer. Never use the org shared scope. Read before you write: `file_write` replaces the file.

## Customer interview guide (case studies)

Ask the human to run it with the customer (a 20-minute call they record), or ask the customer directly if the human prefers. Get the customer's written OK to be named, and to use numbers and quotes, before the draft leaves `[CUSTOMER APPROVAL NEEDED]`.

1. "What was going on before you looked for something like us? What was it costing you?"
2. "What did you try first, and why didn't it work?"
3. "What almost stopped you choosing us?"
4. "What did the first two weeks actually look like?"
5. "What's different now? What number moved, from what to what, over what period?"
6. "What would you tell a peer who's where you were?"

Probe for the specific: "which number?", "since when?", "what did your boss say?". Quote the customer verbatim, timestamped from the transcript.
