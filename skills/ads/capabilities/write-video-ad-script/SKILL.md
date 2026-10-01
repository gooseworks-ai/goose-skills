---
name: write-video-ad-script
description: Write the words of a short-form video ad (voiceover, dialogue, chat bubbles, on-screen lines) the way performance creative teams do instead of from a blank page. Builds the script from the buyers' own words, the beat sheet of an ad that already works and three deliberately different angles, filters them with a rule check and a second non-Claude model, and takes the strongest into the review with the other two as one-line swaps. Use it in every video ad run before any paid step, and whenever the user asks to write, rewrite or improve a video ad script or says a script sounds generic or AI-written.
status: active
---

# write-video-ad-script

A model asked to "write a 30-second ad for this product" writes the average of every ad
it has read. That is why AI scripts sound generic. The tools and teams whose scripts
perform never start there. They build each script from four things, and so does this
skill:

1. **What buyers actually say**, word for word (reviews, comments, complaints).
2. **The beat sheet of an ad that already works** in this format: borrow the persuasion
   (hook type, timing, proof, objection, CTA), never the words.
3. **Angles that are different on purpose**: one specific person, one pain, one angle
   type each, and never the first idea every brand in the category runs.
4. **A filter**: a rule check a machine can decide, then a second opinion from a
   different model family.

The output is one script in the format's own shape, two runner-up concepts the user can
swap to, and a record of what the script was built on.

## When to use it, and when not

- **Every video ad run, before any paid step**, for any format whose ad has words:
  voiceover, dialogue, a chat thread, on-screen lines, lyrics. The goose-video-local
  runtime calls it after reading the format's recipe and before it assembles the review.
- **When the user asks** to write, rewrite or improve a video ad script.
- **The user gave their own lines**: keep them verbatim. Run only the rule check in its
  report-only mode, and raise only what changes something for them (a line too long to
  say in time, a claim the brand can't make). Change nothing unless they say so.
- **The format has no words** (a voiceless dance story, a music-only product loop) apart
  from an end card: skip this skill.

### When the angle is already decided

These answers are the frame. Never ask them again:

- a recipe choice whose answer sets the script (a script angle, story, hook angle or
  story shape: any choice whose sets list includes the script);
- the brief's angle or hook;
- a batch concept's angle;
- an idea the user picked from ad-angle-miner;
- a remix's direction.

**If the answer leaves room**, the three concepts all work inside it, differing in the
person, the pain or the proof.

**If it fixes the whole angle** (a remix of a finished video, a batch concept with its
own hook), write one concept on it and vary only the hooks.

## What you work from

- The project brief and the answers to the format's choices (tone, narrator, setting).
- The brand rules file the video runtime wrote (name, pronunciations, must say, never
  say, product facts). Product facts come only from there.
- The format's recipe: its instructions, config and assets.
- Anything already researched: buyer quotes saved for this brand, an angle bank from
  ad-angle-miner, quotes in the brief.

The working files live in the project's working folder, under a script subfolder. Their
exact shapes, and how to run the two scripts, are in this skill's files reference: read
it before writing them. Run both scripts from the folder that holds the working folder,
calling them where this skill's scripts were saved.

## Step 1. The script shape

Read the recipe's instructions and config, and write the shape file. It lists:

- the beats in order, each with an id, who speaks, its seconds and its kind (spoken,
  on-screen, chat bubble or lyric);
- which beat is the CTA;
- the words per second.

Take the words per second from the recipe first (many configs carry a word budget or
per-beat lines). If the recipe has none, measure the demo ad: its spoken words divided by
its spoken seconds. With neither, use 3.0 for conversational talking-head delivery and
2.5 for slow narration.

- A spoken beat fits about seconds times words-per-second words.
- An on-screen card fits 8 words unless the format says otherwise.

The format's own rules win on shape. When the recipe says "a 13-sentence testimonial" or
"one hook line on screen", the shape says that.

## Step 2. Buyer quotes (the input that matters most)

Practitioners name this as the single biggest lever. Real phrases from real buyers
replace the model's generic idea of the customer.

**Reuse before you collect.** Check these in order:

1. Quotes saved for this brand in the GooseWorks workspace: read them with the MCP file
   tools, at video-scripts, then the brand id, then customer-words.json. Use them if
   they are under 60 days old.
2. An angle bank ad-angle-miner wrote in this session or the workspace. Its quotes come
   with links.
3. Quotes in the brief or the batch concept.

**Collect when there is nothing to reuse.** Free sources come first:

- the brand's saved learnings and kit;
- its product pages, fetched raw (review widgets load by script, so a plain fetch shows
  only a few reviews);
- its marketplace listing.

Then the paid sources, through the GooseWorks data proxy (ScrapeCreators): comments on
the brand's own best posts, product reviews, and a category complaint search. Fetch
ad-angle-miner and follow its customer-voice section for the exact paths.

Paid calls need one yes from the user, asked with a rough credit count. Inside the video
runtime, that question rides in the recipe's choices round; never ask it in a round of
its own. Run on its own, ask it once, before the first paid call.

**Aim for 20 to 30 quotes.** Mix:

- outcomes from happy buyers;
- objections and doubts from the 1 to 3 star reviews;
- complaints about competitors;
- small specific moments ("3am, staring at the ceiling").

Keep each quote verbatim, with its link and a tag: pain, desire, objection, outcome,
moment or switching. Never paraphrase one. A quote without a link is not a quote.

**Save the bank** to the workspace path above with the MCP file tools, so the next video
for this brand reuses it for free. If the file tools refuse, skip saving: the bank still
lives in this project's working folder. Never write it into the user's own folders.

**When nothing can be found** (a new brand with no reviews anywhere), build on the
brand's own facts and the category's complaints from competitors' reviews. Tell the user
in one line that the scripts aren't built on their buyers' words yet.

## Step 3. References (borrow the persuasion, never the words)

**Reference one is the format's demo ad.** Read its lines and timing from the recipe's
instructions and config first; the template's extracted script is often empty. Watch the
demo video with the watch skill only when the recipe doesn't carry its lines.

**Add up to three more ads in the same format** from the evidence already gathered:

- organic posts far above the account's usual views;
- ads still running after 30 or more days, or with 3 or more variants;
- the brand's saved inspiration (social inspiration library or search).

Ad libraries show what runs, not what converts, so treat every one as a candidate.

**For each reference, write a persuasion record:**

- the hook line and its family (see the hook families reference);
- the beat map, with seconds and word counts;
- when the product enters;
- the proof device;
- the objection it answers;
- the CTA wording;
- one line on why it works;
- a transfer rule: what you keep (the structure, the move), and what belongs to the
  other brand and is never reused (its words, claims, offer, names, faces).

## Step 4. Angles: different on purpose

Models converge on the same few ideas, and a creative system prompt does little to change
that. What works: generate many, rate how obvious each one is, and keep the unobvious ones
that have real evidence behind them.

1. **List 15 candidate angles.** Each one is:
   - one specific person in one situation (not "busy moms", but "a nurse coming off a
     night shift who can't switch off");
   - one pain or desire, anchored to one or more quote ids;
   - an awareness stage: unaware, problem-aware, solution-aware, product-aware or
     most-aware;
   - an angle type: pain, outcome, identity, switching, proof, contrast or objection;
   - one concrete product fact it rests on.
2. **Rate how likely a typical ad writer for this category is to write it**, from 0 to
   1. Be honest: "it saves you time" is 0.9.
3. **Drop anything above 0.4**, unless its evidence is the strongest you have (many
   quotes, or a reference that has run for months).
4. **Keep three** that differ in both the person and the angle type. Never two on the
   same quote, and never two on the same hook family.

**In a batch**, build the quotes and the angle list once for the brand. Give every
concept whose angle is open a different angle from that list.

## Step 5. Write

For each concept, write the body on the reference's beat map, in the format's shape.
Then write 3 or 4 hooks, each from a different family in the hook families reference. At
least one hook reuses a buyer's own phrase.

The laws:

- **One message.** A script carrying two beliefs carries none.
- **The first line lands the pain, the claim or the moment.** No wind-up, no brand
  introduction, no "Have you ever".
- **Specific beats general**: a named moment, a physical detail the viewer can check, a
  real number from the facts.
- **Show the proof**: a demo, a test, a before and after, a reaction. Don't just say it.
- **The body pays off exactly what the hook promised.**
- **End on the CTA.** Nothing is said after it (an end card may follow).
- **Write how this person talks**: contractions, fragments, the buyers' own words, short
  sentences. Read every line out loud; if a person wouldn't say it, rewrite it.
- **Fit the budget.** Count words per beat: overstuffed lines get rushed, thin ones drag.
- **Brand rules always hold.** Nothing in never-say, in words or in meaning. Every
  product claim (a result, number, ingredient, price, comparison) comes from the facts or
  a quote. The speaker's situation, feelings and small human details are craft, not
  claims, and they are what make it feel real.

Write the candidates file: the concepts with their angle, person, awareness stage, quote
ids, reference id, typicality, hooks and beats.

## Step 6. Check: rules, then a second model

**The rule check.** Run the lint script on the candidates, with the shape, the brand
rules and the buyer quotes.

It fails on:

- a line over budget, a missing beat, beats out of the format's order, or anything
  said after the CTA;
- a dead opener;
- a phrase the brand quoted as banned;
- a concept with no buyer quote behind it.

It warns on:

- a line that may break a brand rule. Rewrite it, unless it clearly means something
  else ("I work overnights" against "never claim it works overnight");
- AI tells and stiff, contraction-free lines;
- numbers no fact or quote backs;
- the brand name in the first line;
- a concept that never uses its buyers' words;
- softer openers;
- duplicate hooks.

Fix every error and read every warning. Run it again until it passes.

**The second opinion.** Run the critique script with the same files and the brief. A
model from a different family (never Claude) judges every concept twice, once in each
order, because judges favour whatever they read first. It scores hook, specificity, how
spoken it sounds, proof, payoff and freshness, and gives a best hook, line edits and a
ranking. It costs about 2 credits and runs without asking.

The script's exit codes:

- **3**: it wrote one MCP call per pass under the working folder's mcp-requests folder.
  For each, make the call (data post provider, then poll the job until it is complete),
  save the result where the request says, then run the same command again. The relay
  needs the video project id exported, like every paid call in the runtime.
- **4**: the critic gave no usable answer. Judge the concepts against the same rubric
  yourself, and carry on.

**Apply the edits that hold up.** Never apply an edit that adds a claim the facts don't
back, or one that only makes a line flatter. Drop a concept the critic killed in both
passes, if its reason is real. Then run the rule check again.

The critic raises the floor. It does not pick the winner: the user does, and later the
ad's results.

## Step 7. Into the review (no extra pause)

**Take the top-ranked concept and its best hook.** Put the script into the recipe's own
script shape (a thread, beats with voiceover lines, slates, lyrics) and hand it to the
runtime's review step. That review's single approval covers it.

**In the same review, list the two runner-ups**, one line each: the angle and the hook.
The user can swap to one in a word. A swap redoes only the cheap pieces built from the
script.

**Add a note to the review** labelled "How this script was made", with:

- the angle;
- what the buyers said, as a theme ("built on 6 buyer reviews about 3am wake-ups");
- the kind of ad it borrows its structure from.

Never put the quotes themselves or their links in the note. Review sets can be remixed
into other brands' videos.

**When the user asks to choose** ("show me a few scripts"), show the three concepts
before the review: the angle and the hook, one line each. Then build the review on the
one they pick.

**Talk to the user like a creative partner.** Never mention files, scripts, scores,
models, the rule check or the second opinion unless they ask. If they change a line,
their words are kept verbatim. Run the rule check in report-only mode, and raise only
what changes something for them.

## Step 8. Remember

Keep a script history for the brand in the GooseWorks workspace, next to the buyer
quotes, as one JSON line per run. The file tools can't append, so read it, add the line
and write it back. Each line records:

- the date and the format;
- the concept that shipped, and its hook;
- the concepts passed over;
- every line the user changed, before and after.

The next run reads it first: lean toward what they kept, away from what they passed on,
and write the way their edits show.

A standing rule the user states ("never mention price", "we don't say 'cure'") is a
brand rule. Save it to the brand the way the runtime says, not only to the history.

## Cost

| Step | Cost |
|---|---|
| Writing, the rule check, workspace reads | Free |
| The second opinion | About 2 credits, billed to the video project, not asked |
| Paid buyer-research sources | Billed per call, asked once, saved so the brand pays once |

## Rules that never bend

- Never invent a customer, a quote, a number or a result.
- Never reuse a reference's lines, claims, offer, names or faces.
- The user's own words are kept verbatim.
- Nothing paid runs before the runtime's approval, except the second opinion (about 2
  credits) and buyer research the user said yes to.
