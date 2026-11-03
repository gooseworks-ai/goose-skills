# The customer-quote bank — how to read buyer evidence and keep it

Load in the main run: at the filter after step 3 and at the save step. Workers get only the short rules in segment-pass. research-audience owns the bank; every maker, market research and competitor research read it. A bank is only as good as who is speaking: one honest buyer beats ten vendor blog lines.

## Who counts as the audience's voice (first-hand)

Counts:
- the brand's own customers and prospects — the customer data the marketer shared, reviews of the brand, support themes, cancel reasons, win/loss notes (`source_class: private` for anything pasted or exported);
- buyers and users of rival and adjacent products, on review sites read on the site itself;
- people in the group describing their own work, in community threads, forums, comments and their own public posts.

Never counts as audience voice (keep as context at most, never as a quote row):
- **vendor marketing** — any company's blog, landing page, case study or "alternatives" page, including a big company describing its own team (a vendor writing about itself is curated, not a buyer);
- **agency copy** written for their clients;
- **trade press and analyst articles** — a journalist's or analyst's summary, or an unnamed "brand rep" quoted in one, is second-hand; use it for context and find the person's own words;
- **job posts** — they are the employer's words about a role; use them for wants and sizing, not as the audience's voice;
- **quotes second-hand** on someone else's page — find the original or leave it out;
- people who aren't plausible buyers (fans of a founder, candidates complaining about recruiters, competitors' staff, resellers).

## Sampling

- Sample inside the run's budget (SKILL § Depth): stop a source when it adds no new theme. A standard run keeps about 25–40 rows across groups; a deep or paid run more.
- Write the bank once, at the save step; quotes are copied from the source, never retyped from memory.
- **Stratify by rating** (1★ failures and objections; 2–3★ trade-offs; 4★ "good but"; 5★ outcomes and identity words) and sort by lowest and newest — review widgets lead with 5★.
- **Recency:** weight the last 18 months; at least 70% of kept quotes from that window. Older rows only for themes still alive, labelled with their year; a theme resting mostly on rows older than 24 months is "dated" and never carries the lead group.
- Mark verified purchases; mark and down-weight incentivised reviews ("received free", gifted); syndicated duplicates count once; the same person across sites counts once.
- Count what you read per source (n read, star mix), not only what you kept.

## Quote integrity

- Verbatim only, typos kept, cuts marked `[...]`, never stitched from two places.
- `capture`: `page` (read on the page), `snippet` (the site's own text in search results), `fetch-excerpt` (a summarising fetch tool's fragment — counts for themes, never as an ad line until seen on the page). Re-open up to 3 kept quotes and say how many matched.
- Every row: link, platform, posted date (or "undated"), retrieved date, rating if any; private rows cite the export or document and its date.
- Strip names and handles of private individuals; keep self-descriptions they wrote ("ops lead at a 40-person agency"); strip health, medication and other sensitive details, emails, phone numbers and order numbers.
- `about`: `brand` · `prospect` · `competitor:<name>` · `category`. Rival complaints are opportunity evidence, not traits of our buyer.
- `contains_claim: yes` on any outcome or efficacy statement — buyer words, never brand proof. `personal_attribute: yes` on anything about health, finances, religion, ethnicity or similar — makers rephrase, never lift. `testimonial_ok: no` by default.

## Tags (one primary type per row)

pain · desired outcome · trigger (why now) · objection / anxiety · alternative tried · habit / inertia · pre-purchase question · specific praise · surprise · price / value · **switch** ("switched from X" to us; "went back to X" — churn evidence) · **why they left** (from cancel reasons and churn notes) · **why we won / lost** (from win/loss notes). Also: the job ("when <situation>, I want to <motivation>, so I can <outcome>"), awareness stage, buying role (user / payer / approver), vividness 1–3 (3 = a line a copywriter would steal).

## Themes

Named in buyers' words. **Established:** 3+ rows from 3+ distinct authors; one platform carrying it → "single source", lower confidence. **Signal:** fewer — shown, never presented as a finding. Product defects go to a separate "for the founder" list.

## Source skew — say it

If more than half of a group's quotes come from one kind of source, name it and how it bends the conclusion: complaint sites over-represent angry customers; developer forums over-represent developers; missing LinkedIn and closed forums hide in-house marketers. A conclusion that rests on a skewed source is labelled so in the report, and never sits in "In short" unqualified.

## The saved bank

`research/audience/voc-bank.md` (title `Voice-of-customer bank — <Brand> — <D>`, tags `[research-audience, voc-bank]`, supersede): opens "Do this first, because… <which quotes to brief from>"; one line on what was read and the source skew; then the themes in buyers' words, each with its quotes — quote, who said it (self-description), where, date, link; claim or personal-condition quotes marked "buyer words only — don't use as a claim". Filterable copy: `voc-bank.jsonl`, one row per quote: `id`, `verbatim`, `about`, `capture`, `platform`, `url`, `posted`, `retrieved`, `stars`, `self_descriptor`, `type`, `theme`, `segment`, `buying_role`, `vividness`, `contains_claim`, `personal_attribute`, `source_class`, `status` (ids stable; a dead link becomes `retired`). Same row schema the makers already filter on. First run with an older `research/market/voc-bank.*` on file: import those rows once, re-checked against the rules above, ids kept.

## Before handing over

Any quote without a link or private citation → fix or retire · a group trait with no quote → evidence it or mark unknown · one platform carrying a whole theme → say so · rival complaints merged into our buyer → split · all 5★ → re-sample · vendor, agency or job-post text in the bank → remove · nothing surprises the founder → look again at 1–3★ and at why-they-left rows.
