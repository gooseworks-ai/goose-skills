# Meta ad harness: file rules

Every harness skill follows these rules when it reads or writes the brand's ad docs.

- **Where:** one `ads/` folder per brand. The mode's adapter (in the `meta-ad-manager` skill's
  `references/`) says where that folder is.
- **Who shares it:** every run for the brand (chat, scheduled checks, reports) reads the same
  files.
- **How:** whole-file reads and writes with the host's file tools. Never shell edits
  (`echo >`, `sed -i`).

## 1. Where the files live

| Mode | Where `ads/` is |
|---|---|
| **GooseWorks** | the brand's coworker workspace. See the GooseWorks adapter for the exact calls, both inside the coworker and from an outside host |
| **Direct Meta** or **Planning only** | a local `ads/` folder in the working directory the user chose for this brand. One folder per brand |

**Ids outside GooseWorks.** `ads/README.md` and `ads/brand.md` need `brand_id` and
`coworker_agent_id` in their frontmatter. With no GooseWorks brand record, write `local` for
both. Never leave a template placeholder and never write `none`.

**Evidence pointers outside GooseWorks.** A Meta read is `meta:<object id> <since>..<until>`
(for example `meta:act_123 2026-09-17..2026-09-23`). GooseWorks uses `report:`, `push:` and
`finding:` ids that its tools return.

## 2. How to read and write

- Read a file whole, change it, write it whole. Use the host's own file tools, or the calls the
  GooseWorks adapter names.
- Never hard-code an absolute path in the docs. The folder can move between machines or sandboxes.
- If two routes can reach the same files (for example a sandbox and an outside host), follow the
  adapter's note on caching before you write from one and read from the other.

<!-- shared:harness-contract start -->
<!-- This block is maintained in ONE place and copied byte-for-byte into both the
     maintainers' source copy and the published goose-skills copy. Edit one, copy
     it to the other, and run the parity script before shipping either. -->

## 3. Read order

1. `ads/README.md` first, always.
2. Then only the campaign folder in play: `ads/campaigns/<slug>/state.md`, plus `strategy.md`
   or `decisions.md` when the stage needs them.
3. `ads/brand.md` body only for intake, strategy and deep checks, or to find a business fact
   before asking the user for it. Its frontmatter (`familiarity`, `business_type`) may be read on
   any turn that talks to the user, to set the tone.

Do not list or read other campaigns "for context".

## 4. How to write

- **Whole files.** Read the file, change it, write all of it back. A write replaces the whole
  file.
- **Keep the index in step.** When a campaign's stage changes, update its row in
  `ads/README.md` in the same turn. The index Stage must equal `state.md` `stage`.
- **`decisions.md` is append-only.** New entries go at the end. You may fill in one earlier
  line, `- Outcome: pending`, once the result is known. Nothing else may be edited or removed.
- **Follow the templates** in `templates/`. Drop the `<!-- -->` guidance comments when you
  write.

## 5. Numbers: decisions vs observations

- **Goose's own decisions carry plain numbers**: "$30 per day for 14 days", "3 ads from 9",
  "CAC target $45 (per the owner)". No date is needed. They are plans, not facts about Meta.
- **Anything read from a tool is an observation.** It goes on its own `- Observed:` line with
  its data window, sync time and source:

  ```
  - Observed: cost per subscriber $41 across 2 ads [window 2026-09-23..2026-09-23; synced 2026-09-24T09:00Z; source report:rep_0924]
  ```

  Never call an observation "current", "now", "today" or "latest". It is a snapshot.
- **Meta facts are not stored as truth.** Read spend, delivery status and rejections from the
  tools when you need them. The docs record what Goose decided, why, and a pointer to the
  evidence (`report:<id>`, `push:<id>`, `finding:<id>`).

## 6. Few files, small files

- `ads/` holds exactly `README.md`, `brand.md` and `campaigns/<slug>/{strategy,state,decisions}.md`,
  plus an optional `decisions-archive.md`. Nothing else: no per-poll, per-finding or per-report
  files. Those stay in the database, and the docs point at them.
- Each file is at most 8 KB. `decisions.md` is capped at 64 KB. From 48 KB on, move closed
  entries verbatim to `decisions-archive.md`.
- Campaigns are never deleted. Set `stage: ended` instead.

## Checking a folder

```bash
python3 validate.py path/to/ads                        # structure and rules
python3 validate.py path/to/ads --baseline old/ads     # also enforce append-only
```

<!-- shared:harness-contract end -->
