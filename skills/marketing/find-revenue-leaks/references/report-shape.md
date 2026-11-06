# The report

Load at step 5. The `write-report` skill (`../../write-report/SKILL.md`) sets the shape, the length limits and the checks; this file fills its sections for this job. Topic `revenue-leaks`; title "Revenue leak check — <Brand> — <D Mon YYYY>".

## In short (at most 150 words)

- **What we looked at:** how many of the 51 checks ran (found, clean, partial), on which tools and windows, and the main limit ("no store data, so nothing is sized in money").
- **2–3 numbered key findings:** the top of the ranked list, each with its money at stake (or "not sized") and how sure.
- **So, do this first (because of 1 and 2):** usually the top leak's recommended action, who does it, by when. A tracking break comes first when it makes the other numbers unreliable.
- **Since last time** (repeat runs, one line): new, fixed, still open, with the change in money.

## Decisions for you

One box. Each recommended action that needs the marketer's yes (pause, budget move, flow fix, code retired), with the finding it rests on; any connection or export that would open the biggest group of skipped checks; whether to schedule the next run.

## The story

1. **Leaks**, ranked (`ranking.md` §4), each written as in `ranking.md` §5: what it is, money at stake with the math, how sure, effort and who, what was ruled out, the recommended action, how we'll know it worked, a link to its method.
2. **Plays**, ranked the same way.
3. **Clean checks:** a short table: check (linked), the window, "nothing found". A clean result on a check that often finds something is worth a line ("your cart email sent every week for 12 weeks").

Show the ranked list as a table first (rank, finding, money at stake, how sure, effort), then the findings one by one. Never more findings than the data supports.

## What to do

At most 6 moves: the top recommended actions in rank order, merged where they share an owner and a sitting ("one pass in Ads Manager: pause the 6 sold-out ads and drop the 2 countries you don't ship to").

## What we're not doing, and why

Moves the data doesn't support yet: a play not sized, a cut that would need the store's numbers first, anything that waits on a tracking fix.

## What we couldn't check

- **Skipped checks, grouped by what would open them:** "Connect your email tool (or send its flow report) → <n> more checks, including abandoned-cart and win-back emails." Link two or three of them. Tools the brand doesn't use are left out, not listed as gaps.
- Checks that couldn't run (too new, too thin, empty export), each with why.
- Partial checks and what their missing part would add.

## Sources

Each data set with its source (the live connection or the named export), window and freshness; each public page with its date. Source skew line, for example "every ad number is Meta's own count; only the store's orders are truth".

## Words to use and avoid

- The marketer's own tools by name (their store, ad accounts, email tool) are fine: they run them. Never name GooseWorks tools, connectors' technical names, this skill or "playbook" as a process word; the public pages are "the method".
- No ids in prose. Ad, ad set and flow names as the marketer sees them; a name containing a private person's name is replaced by a plain description ("the creator video from 12 Oct").
- No customer names, emails or order numbers.
