# Human version

Competitor research can also deliver one sales battlecard, a page's tools and tracking tags, or a sourced view of LinkedIn engagement. Each uses existing evidence and checks only what the requested output needs.

---

# Agent version

After the playbook's setup, choose from the ask; complete every named branch if the ask combines them. These are focused outputs, not a requirement on every full teardown.

| Ask | Read and execute | Saved output |
|---|---|---|
| Battlecard, competitive sales prep, objections against one rival | `battlecard.md` | `research/competitors/battlecards/<rival-slug>/<YYYY-MM-DD>.md` |
| Tools, technology, analytics or pixels on competitor pages | `page-technology.md` | `research/competitors/technology/<rival-slug>/<YYYY-MM-DD>.md` |
| Who reacts to or comments on a competitor's LinkedIn posts | `linkedin-engagers.md` | `research/competitors/engagers/<rival-slug>/<YYYY-MM-DD>-report.md`; private row files beside it |

Use this folder's `run-memory.md` focused jobs: start before reading evidence, save the record before closing. A supplied export or named rival is the starting scope; a battlecard for one rival does not require choosing six rivals. Read that rival's latest saved record and overlapping recent reports. Recheck moving facts the output uses (price, availability, current page/tag, post metrics), retaining source and date; mark saved facts not rechecked. Fill evidence gaps with the host's public search/fetch/browser. No paid call before the shared spend gate's approval.

Deliver each report through the `write-report` skill (`../../write-report/SKILL.md`): topic `battlecard-<rival>`, `competitor-technology-<rival>` or `competitor-engagers-<rival>`; brand copy at the table's path, keep-history. Use the `save-to-brain` skill (`../../save-to-brain/SKILL.md`) and its never-overwrite rule. Titles: `Battlecard — <Brand> vs <Rival> — <date>`, `Page technology — <Rival> — <Brand> — <date>`, `LinkedIn engagement — <Rival> — <Brand> — <date>`. Tags: `research-competitors`, the output (`battlecard`, `page-technology`, `linkedin-engagement`), `rival:<slug>`. Engager reports imported to the brain contain aggregate results only; the row files stay private in the workspace, as linkedin-engagers.md specifies.

Done only when the branch's check and write-report's check pass, a real output opens, and its save or save failure is reported. If the exact data is inaccessible, deliver the coverage/gap result and any supplied or visible evidence; say that the requested data output remains incomplete. A report explaining a blocker is not a successful engager extraction. Close with the output link and the decisions the evidence needs; offer no automatic repeat for a one-off request.
