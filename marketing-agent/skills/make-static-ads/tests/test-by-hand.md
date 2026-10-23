# make-static-ads — test by hand

**The bar:** this playbook must produce better ideas than a capable agent with no playbook at all. If it doesn't, it is making agents worse (it did, up to 0.5.4: see `critique.md` round 27). Test 1 is the acceptance test; run it after any change to the idea steps.

## Setup

1. Connect GooseWorks **staging** to your agent.
2. Link the skills side by side, as `marketing-agent/README.md` (How to test) says, so the playbook can open its steps at `../make-static-ads-<step>/`.
3. Generation spends credits. Tests 1–3 stop at the quote and cost nothing.

## Test 1 — beats a no-playbook agent (free)

Pick a staging consumer brand with real product photos that no earlier test used. Run two fresh agents in parallel, same brand, same words: **"Make 5 static ads for <brand>. Your choice on everything. Stop before spending credits and show me the concept board."**
- **Agent A** reads this playbook.
- **Agent B** gets no playbook: "Use your own judgment; don't open any GooseWorks playbook or skill catalog."

Both may read the brand on staging and browse the web. Neither sees the other's work or any earlier batch's concepts.

Then a third fresh agent compares the two boards, shuffled and unlabelled, row by row: Would a competitor's product fit this ad (swap test)? Is it an idea or a demonstration? Do the five say different things? Which board would you pay to render?

**Passes if:** the blind comparison prefers A's board or calls them even, and A's board has at most one demonstration, five different meanings, a source or hypothesis label on every row, a protected choice on every row, and critic notes with real changes.
**Telltale failures:** product + headline + the product doing its job, five times; headlines that name features ("Two oils. Different jobs."); a board that says "read" where the agent skimmed; critic notes with no changes.

## Test 2 — short answers don't skip the board

Say "your choice, show me the final ads only, make one ad", then "make 5 more".
**Passes if:** the quote message still shows the board (one row, then five); the five don't repeat the first ad's meaning or the brand's live-ad messages; a fresh critic ran on both.

## Test 3 — B2B SaaS, no product photo

Brand: Gooseworks on staging, or any SaaS. Say: "Make me six LinkedIn ads for our product."
**Passes if:** the ideas start from customer situations, not the feature list; it asks for real screenshots instead of generating UI; no customer logo or stat without a confirmed claim.

## Test 4 — nothing on file

A brand with no claims, no reviews and no own ads (staging: Greener Closet). Say: "Ads for our app launch."
**Passes if:** it reads public reviews or says there are none; marks every authored situation as a hypothesis; writes only puffery and verified facts; never invents ratings, users or reviews.

## Test 5 — paid render and review (small)

Approve two ads from a passing board. **Passes if:** each prompt contains the board's protected choice word for word and names each attached image's role; no other brand's image is attached; a fresh judge checks the idea first, then the product and spelling; at most one retry per image within the quote; failures are shown, not hidden.

## Test 6 — reactive modes

- "My image ad got rejected for 'personal attributes'." → finds the faulty line; copy-only fixes are free; an image fix keeps the scene and changes only the faulty part, quoted; both checks re-run.
- "Same image as #3, three other headlines." → says these test copy, not ideas; re-render with the approved image attached, quoted and judged.
- "A 600-wide header for the welcome email, text: 'Welcome to the routine'." → no CTA button, claims check, quote and yes, `Graphic ready:` line.

## Test 7 — garbled label, good idea

A render whose scene passes but whose printed label drifted. **Passes if:** the original stays failed; the free label repair runs only with a compatible pose and rights checked; the patched image is judged again in full; nothing is hidden.
