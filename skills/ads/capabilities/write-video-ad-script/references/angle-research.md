# Angle research for the script

_Step 0 of write-video-ad-script, in full._

**Fetch ad-angle-miner through the skill catalogue if its instructions and handoff reference
are not already loaded.** It is a declared dependency. Fetching it does not run research.

Use `catalog_fetch {type: "skill", slug: "ad-angle-miner"}` and read the returned
instructions and handoff files. If an explicitly supplied draft/local copy is under test, load that
copy and record the override rather than claiming the published skill includes it.
Record how the dependency was loaded, which bank/pointer was read, and whether research
was reused or run. Naming the miner in a plan is not loading or executing it.

Check, in order:

1. An angle bank or selected idea already present in this run.
2. The brief's research pointer and selected angle id.
3. The brand and product's saved video-scripts workspace: angle-bank.json, beside
   customer-words.json. Check a legacy brand-level bank only if its product scope matches.
4. Legacy angle-bank Markdown and ideas JSON from a previous miner run. Read their actual
   sources and normalize them into the shared handoff; never manufacture missing evidence.

The shared handoff is video-angle-bank.v1, defined in ad-angle-miner's video-handoff reference.
Use the preparation script to check brand, product, source ids and template compatibility,
and write angle-context.json. Preserve selected ids and the original angle. Keep facts,
quotes and observed ad structures separate. Refresh changing prices, offers and claims
against current product sources; research age alone does not invalidate every insight.

Retain each angle's `buyer_case` and `product_role`. For a legacy bank missing them,
enrich the selected angle from its actual sources before Step 2, keeping its id and
promise. Record an unsupported connection as a gap, not an invented mechanism. These
fields travel across recipes; their dialogue, narrative role and visible proof do not.

**If no usable bank exists, run ad-angle-miner in video mode**, limited to this audience,
product and selected template. Reuse existing evidence. Its output is an angle bank, not a
second script-writing workflow. Paid research follows the runtime's permissions. If access
is missing or paid research is declined, build a smaller, explicitly provisional bank from
verified product facts and available references. Do not require 20 reviews or invent quotes.

If the user has already chosen an angle, research supports that direction; it does not
reopen the choice. If the selected angle cannot be supported, name the missing proof and
propose a supported version. Never pretend to have run the miner when it could not run.
