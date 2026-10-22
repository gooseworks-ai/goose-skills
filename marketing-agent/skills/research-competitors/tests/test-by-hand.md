# Test by hand — research-competitors

## The test (rebuilt 18 Oct after the founder's GooseWorks re-test)

Use the GooseWorks server the test folder names (staging). Ask, exactly as the founder did on 18 Oct: **"Ok I want to do the competitor research for gooseworks"** (GooseWorks is not yet a brand in the account).

Pass, all without being asked:
1. **No question before the report.** The brand is created from its website without asking; no permission is asked for free work; no paid read is offered for what the browser could get.
2. **Rivals chosen from evidence** — the category's searches, AI answers and reviews — never from memory; the strongest current rivals are in the main set.
3. **Worker briefs handed over in full**; workers' work kept; **every ad library searched for every main rival and us** (Meta, LinkedIn, Google, TikTok, by advertiser name), in the browser by the main run where workers couldn't, with one line to the founder first; nothing waited silently on an approval.
4. **News first** for every rival and our brand; launches with demos broken down; founder and exec posts.
5. **The report passes write-report §3** (check its list: the top says what was looked at and the findings before the first move). Also: no Fact/Inferred tags or symbols; "For you" as a plain sentence on each finding; "You vs them"; facts checked against sources; a local file with a clickable link plus the brand copy with its link.
6. **After the senior-marketer review (18 Oct):** the frame of reference is stated in one line; "Do this first" is not something the report calls table stakes; a counter-position appears only with the leverage test passed (challenger, does it better, dated proof, reach), otherwise under "What we're not doing"; the report has Decisions for you, a baselines table, a source-skew line, disagreements with the market and audience reports if any, and "what this means for positioning"; body ≤ 3,000 words, ≤ 6 moves.
7. **The closing message:** at most three lines, then at most five decisions, including a repeat only if it would help, with the reason and a cadence.

Fail (20 Oct hand test): "Do this first" before the reader knows what was researched; a same-week sibling report with a different first move or lead buyer, not named or settled; a report delivered over its word budget.

Fail: any question before the report; "couldn't read the ad libraries" while a browser was available; rivals from memory; a report saved only locally or only on the server; ids or agent shorthand in the report; a section patched in after the report instead of a rewrite.

**The 18 Oct re-test (before this rebuild):** the agent never read its worker briefs (it looked in the wrong folder), told workers there was no browser, reported that no ad library could be read, offered a paid read, then read Meta in the browser in two minutes when the founder said "Can't you do it on your own". Its rivals came from memory; the strongest ones surfaced only in the category pass. Nothing was saved to the brand. See `critique.md`.

## The Juicebox case (the run that failed on 16 Oct and set this bar)

Brand: Juicebox (AI recruiting search). Rivals: Loxo, hireEZ, Findem, Eightfold, Fetcher. A good run must reach, unprompted:
- Fetcher's shutdown (platform closed 16 Oct 2026) and Juicebox's purchase of Fetcher's assets → a time-boxed switch campaign at the top, with its "For you";
- the recent hireEZ and Eightfold launches, with demos and third-party posts;
- what the rivals' founders and execs are posting;
- LinkedIn and Google ads (Meta matters less for this B2B category), pricing, G2 reviews, hiring and AI-answer presence;
- "For you" lines such as the Fetcher switch campaign, or Juicebox's free tier against Loxo's trial, and a "You vs them" section.

The old run read only Meta ad libraries, asked "go deeper?", found the Fetcher story only when pushed, and ended in a chat summary. The rebuilt playbook's Sonnet re-run is recorded in `critique.md`.

## Earlier staging facts still true (2026-10-16, brand "Personal Day")

- `competitor_read` returns server dossiers (positioning, pricing tier, socials, ad counts, `last_researched_at`) and `view: "suggestions"` with Meta page checks (CONFIRMED / UNSURE).
- `ads_template_read` mode `competitor` returns a capped sample (~24 per rival) with ad id, start date, last-seen date, copy, CTA and destination; `media_list` tags `ad_library` + `competitor_ad` hold rival video ads.
- `brand_read` section `organic` returns rival top posts with views.
These are free extras; the free web pass (search, fetch, browser) is the main source.

## 22 October — focused-output acceptance (GOOSE-4056 / 4059 / 4062)

**Inputs:** `fixtures/focused-evidence.md`, `fixtures/page-source.html`, `fixtures/engagers.csv`. All are fictional supplied evidence; setup and approval are simulated. Use only these files, with test date 22 October. No live brand reads/writes, browsing, provider requests or spend. This is a local method exercise, not live acceptance.

| Ask | Actual local output | Acceptance inspected |
|---|---|---|
| Build a sales battlecard against BillPilot for five reviewers | `examples/2026-10-22/battlecard.md` | 811 words; deal fit, where they win, four evaluation questions, three finished objection answers, same-scenario price and two short replies. Enterprise/export unknown stays unknown; no fabricated saving or deal win rate. Exact price-only approval is respected |
| What tools/pixels are on these supplied competitor pages? | `examples/2026-10-22/technology.md` | Four positive source signatures; historical commented script is not loaded-tag evidence; tag manager does not prove GA4; prose mentions do not prove Intercom/Drift; inaccessible pricing page is not checked |
| Who engaged with the two supplied posts? | `examples/2026-10-22/engagement-report.md`, `engagers.csv`, `excluded.csv` | 9 raw → 5 kept rows / 4 distinct profiles. Three comments, two reactions; four exclusions (duplicate, staff, missing profile, wrong post). Same-name people kept distinct; unknown engagement date retained only under post-publication window; formula-like comment escaped. Report has aggregate data only |

**Checks actually run:** CSV reconciliation/types/distinct-profile identity, exact excluded reasons, unknown-date count, spreadsheet escaping, no person/profile strings in aggregate report, every local source/output link resolves, output word counts. Skill validation passed (351 skills at that point). Installed-layout link check had no owned-file failures; its three failures were concurrent unfinished shared/SEO references, reported to the parent.

**Branch rehearsal:** follow focused-outputs.md from the ask using the supplied snapshots instead of live setup. Inspect the three produced artifacts against each branch's completion check. Source-only HTML and supplied CSV exercise the available-source paths; they do not exercise rendered-page or managed API access. The full teardown entry remains the default for a broad ask.

**Negative cases:** remove a rival capability/price field → unknown, not “they lack it”; remove comparative approval → proposal plus safe product facts; provide only a cleaned page excerpt → tools not checked; provide only posts/counts with no rows → extraction incomplete, not zero engagers; change the ask to engagement dates → unknown-date reaction cannot count. Check these explicitly on the next host acceptance run.

**Still to test live:** managed commenter/reactor response shape and pagination after deployment, quoted approval/billing, public render/network capture, live brand/private-row save paths and links. No live success is claimed for these operations.
