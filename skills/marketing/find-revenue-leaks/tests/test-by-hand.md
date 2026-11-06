# find-revenue-leaks — test by hand

## Setup

- A **test store** you can check yourself (a Shopify development store with a few products and orders is enough), connected read-only through a store connector, or its orders and products exports.
- If you have them: a Meta Ads test account with live ads (connector or Ads Manager export), the email tool's flow report, Google Analytics (connected in GooseWorks **staging** or by export).
- GooseWorks **staging** for the connected tests; nothing for the local-mode test.
- Before you start, plant two problems you can see: one ad pointing at a product you set to sold out, and one flow message you paused. Note what you planted.

## Test 1 — the full run (the ticket's test)

Ask: "Find where my store is losing money."

Pass if:
1. Its first message, before any check runs, says how many of the 51 checks it can run, on which tools; lists the skipped ones grouped by what connecting would add; asks once for anything only you know (the sending domain if the brain lacks it).
2. It never calls a write tool on any connector, and never a GooseWorks proposal or push.
3. The report (In short, Decisions for you, a ranked table, leaks then plays, clean checks, skipped checks, What we couldn't check, Sources) finds **both planted problems**, each with money at stake showing its math, window and source and the word estimate, how sure, effort and who, the recommended action, and a link to its method page.
4. No playbook's example number appears as the store's result. No customer names or emails anywhere.
5. Clean checks are listed with their windows.
6. The run record is saved, and the chat says so in one line.

Telltale failures: a check run without its data ("probably fine"); an example number quoted as a finding; "pause these" done instead of recommended; a connector claimed that isn't listed.

## Test 2 — re-run: new, fixed, still open

Fix one planted problem (restock the product), leave the other, then ask again. Pass if it opens with "since last time" (fixed, still open), marks the fixed one `fixed` because the check came back clean, carries the open one with its money then → now, and doesn't call anything fixed from your words alone when the check still finds it.

## Test 3 — no logins

New chat, no connectors, GooseWorks connected. Ask: "Run all the revenue checks on <your test store's address>." Pass if it runs only the no-login checks (12 today), says everything else is skipped and what each connection adds, and sizes nothing it can't (most say "not sized").

## Test 4 — local mode

Disconnect GooseWorks; keep a store connector or exports. Pass if it says once that GooseWorks isn't connected and it keeps notes in a local folder, is not blocked, calls no GooseWorks tool, saves the report and run record under the local brand folder, says "saved in this folder", and spends nothing.

## Test 5 — paid read

Ask it to check every live ad of a rival with many ads. Pass if the free browser pass runs first, and any paid read is quoted with a credit ceiling and waits for your yes; declining leaves the free result standing.

## Test 6 — routing

In a fresh chat with the gooseworks router: "audit my store for revenue leaks" goes here; "which ad won this week?" goes to the weekly performance read; "pause my sold-out ads" goes to the paid-ads job.

## Runs

None yet. Record the first run here: the store, the tools connected, what it found, and anything a marketer would rewrite.
