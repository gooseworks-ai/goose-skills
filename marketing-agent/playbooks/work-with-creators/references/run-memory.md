# Run memory for work-with-creators

How this playbook uses [`../../../atoms/run-memory/ATOM.md`](../../../atoms/run-memory/ATOM.md): Start before discovery, End after the report. Only what is specific here.

## Jobs

| `job` | `subject` | `cadence` | Runs when |
|---|---|---|---|
| `creator research` | — | `ad hoc`, or `monthly` when a roster refresh was set up | A shortlist, a roster refresh, a re-vet |
| `creator wave` | `wave-<n>` | `ad hoc` | Reading a wave's results after its read window |

## Start: "since last time"

**Outcome sources:**
- **The roster** (`creators/roster.csv`, outcomes-ledger `entity: creator`) — the per-creator truth. Recount from it: shortlisted, contacted, replied, quoted, declined, signed, posted — and for each wave, `wave_result` against its criterion (`win · partial · miss · no-data`), grouped by role, tier, deal structure and vetting depth.
- **Wave files** (`creators/<D>/wave-<n>.md`): each wave's criteria and read window — is the window over, and were the results reported?
- **Lessons** (`creators/lessons/`) and their proposed changes.
- **The brain**, with `brain_*` tools: `brain_search` since the last record, `source_types: ["learning", "creative", "meta_ad"]` — new `[creators …]` rules, and creator content turned into ads since (chapter 22, "Everything we have made and run"), so a creator whose content now runs as an ad is visible. Otherwise `knowledge_search`. `campaign_read` for a campaign's creator leg.

**Check last run's recommendations:** "send wave 1 to these 8" is `done` when the roster shows them `contacted`; "re-vet after their next 10 posts" when the roster's `revet_by` passed and a vet ran; a price band is judged against the quotes that came back (`quoted_rate` vs the recommended range). Verdicts only from what the roster shows — reported by the founder.

**Say, in 3–5 lines:** e.g. "Since 2 Oct: wave 1 went to 8 creators; 6 posted, 3 hit the views target (2 nano, 1 micro), the 2 gifted-only picks didn't post. Quotes came back inside our range for 4 of 5. Two creators' content now runs as ads." Then use it: renew the wins under their renew rule, cut the misses, shift the mix toward the role and tier that worked — with the sample-size rule (under ~5 creators in a group → "directional only").

## End: the record

- **Numbers:** creators found, vetted (public vs paid depth), shortlisted, by role and tier; price bands proposed; for a wave read — sent, posted, `win / partial / miss / no-data` counts by role, tier and deal structure, quotes vs range; credits spent. Each with its window and label (`reported` for the founder's outcomes, `derived` for our counts, `public` for public post numbers).
- **Recommendations:** wave 1 (or the next wave) with its criteria, renew / cut calls, price bands — each with an id, owner (`marketer` — the founder sends and pays), review-by (the wave's read window end) and how we'll know (the wave criterion's metric and threshold, from `wave-<n>.md`).
- **Links:** `Report:` the report; in "Checked", the roster, the wave file, the lessons file.

## Never in a run record

No creator handle, name, rate quoted by a named creator, email or profile link — groups, counts and the wave id only. The roster holds the creators; the record links it. (Public numbers about a named creator live in the report and the roster, never in the record.)
