# Contract audit — the 17 marketing-agent playbooks

**Summary**
1. Six MAJOR breaks. Three come from server behaviour no playbook knows about: fact text is cut silently at 300 characters, the ad and video engine sees only the 8 newest facts, and creative tags don't round-trip.
2. email-lifecycle and improve-search-visibility don't follow learn-my-brand's claims contract. They take claims from search snippets of the Brand record, and they never check whether the marker says "signed off".
3. run-paid-campaigns' change-log files don't match the format the server writes into. The server therefore never logs Meta approvals or declines, and analyze-performance and plan-campaign read a log with gaps.
4. 15 of 17 playbooks share one workspace convention (the brand coworker scope). learn-my-brand uses the org shared scope. Every playbook's fallback for a brand with no coworker merges brands' files.
5. No §2 hard violations: all 80 tool names exist, there are no vendor keys and no playbook calls another. The duplication is heavy: four copies of the claims block, five versions of the save-to-brain routine and three credit-gate models. A ≤60-line shared-conventions text is at the end.

Severity: **MAJOR** means a chained run produces wrong output or silently loses data. **MINOR** is everything else. Short names used below: LMB learn-my-brand · WTS where-to-start · RM research-market · RC research-competitors · LS listen-social · RA research-audience · PC plan-campaign · MSA make-static-ads · MVA make-video-ads · MPP make-product-photos · RPC run-paid-campaigns · AP analyze-performance · EL email-lifecycle · ISV improve-search-visibility · WWC work-with-creators · MC make-content · ROS run-organic-social. Server paths are in `~/projects/gooseworks-app` @ `origin/dev` (328527b75).

---

## The six MAJOR findings

### F1 · Fact text is cut silently at 300 characters — MAJOR
**Evidence (server).** `brand_update` accepts `facts[].text` up to 2,000 characters (`apps/api/src/app-mcp-server/mcp-tools/brand/schemas.ts:333`). The service then slices it without an error: `LEARNING_TEXT_MAX_CHARS = 300` (`apps/api/src/services/ad-brand-learning.service.ts:37`), applied in `addUserLearning` (`:150`) and `updateLearning` (`:183`).

**Evidence (playbooks).**
- AP's learning template (`analyze-performance/references/tests-and-learnings.md:31-37`) runs to 463 characters. `SCOPE:`, where the angle id `A-NN` lives (`:50`), starts at character 315. CONFIDENCE, SCOPE, SEEN, REVIEW BY and SUPERSEDES are all lost.
- LMB's sign-off marker (`learn-my-brand/SKILL.md:85`) is about 500 characters, so its "everything else is not approved" sentence is lost.
- LMB packs several claims into one "Claims you may use (1/2): C1 … | scope | qualifier | review by …; C2 …" fact. Claims after roughly the second are cut, possibly mid-wording or before their qualifier.
- AP's own server-needs repeats the wrong limit (`analyze-performance/server-needs.md:11`, "≤ 2,000 chars").

**Chain effect.**
- RC's angle-bank refresh ("learnings citing the A-NN", `research-competitors/SKILL.md:67`) never finds the id.
- AP's monthly REVIEW-BY sweep (`tests-and-learnings.md:56`) has no dates to read.
- Makers using "Claims you may use" text verbatim can drop qualifiers.

**Fix.**
- **Server:** honour the schema, or reject anything over 300 characters with an error. Add this to `learn-my-brand/server-needs.md` #15 and `analyze-performance/server-needs.md` #5.
- **Every fact writer, meanwhile:** one idea per fact, at most 300 characters, and a read-back that compares the stored text with the text sent.
- **AP:** the fact becomes a one-line summary, for example `[learning 2026-10-13 A-07] Problem-first hooks beat award hooks, cold Meta, Unplug, US · n=94/45 · medium · review 2027-01-13`. The full EVIDENCE/SCOPE block stays in the weekly report.
- **LMB:** one claim per fact, e.g. `Claims you may use — C1 "Free shipping over $35" · all products, all channels · — · review 2027-01-16`. Shorten the marker to about 150 characters: `Claims sign-off (learn-my-brand, 2026-10-16, signed-off, record "Brand record — X — 2026-10-16 v2"). Only "Claims you may use" rules are approved.`

### F2 · The ad and video engine sees only the 8 newest facts, so LMB's claim rules fall out first — MAJOR
**Evidence (server).**
- `getActiveForBrand` takes `COMPOSE_INJECTION_LIMIT = 8` rows (`ad-brand-learning.service.ts:34`). It orders by `confidence desc, created_at desc` (`:57-73`) and ignores the fact's kind.
- That ordering is used for static compose (`apps/api/src/services/ad-remix-pipeline.service.ts:1966`) and server video (`apps/api/src/routes/server-video.route.ts:281`).
- Every fact written through `brand_update` gets `confidence: 1` (`ad-brand-learning.service.ts:144-166`), so "newest wins".

**Evidence (playbooks).**
- LMB writes its rules in this order: claims you may use → not approved → policies → never-say → voice → banned words → terminology → flex → marker (`learn-my-brand/SKILL.md:85`). With more than 8 facts, the claims and not-approved facts are the first to leave the engine's view.
- Then every research run adds `insight` facts without retiring the old ones: LS up to 3 a week (`listen-social/SKILL.md:53`), RC 3 (`research-competitors/SKILL.md:69`), RM 5 (`research-market/SKILL.md:61`, which does retire its own), ISV 1 (`improve-search-visibility/SKILL.md:57`), and EL rules (`email-lifecycle/SKILL.md:54`). AP adds about 3 a week (`call-and-learn/SKILL.md:18`).
- LMB itself relies on lean reads keeping must/dont facts (true for `brand_read`, `brand-read-lean.ts:158-177`), but the generator does not.

**Chain effect.** After a few weeks, the engine composes ads and videos without the never-say, not-approved or claims rules. Only the makers' own Pass A/B checks stand between that and a paid render.

**Fix.**
- **Server:** rank `must`/`dont` before other kinds in `getActiveForBrand`, as `leanLearnings` does, and raise the cap for rules.
- **LMB:** write in reverse priority, marker last but claims and never-say just before it.
- **RM, RC, LS, ISV, EL, AP:** retire your own superseded facts in the same call (`active: false` by id), keep at most one active insight set per playbook, and never write `must`/`dont` except human-stated rules.

### F3 · email-lifecycle and improve-search-visibility read claims outside the contract — MAJOR
**Evidence.**
- EL (`email-lifecycle/SKILL.md:22`, `atoms/send-check/SKILL.md:8`, `skill.meta.json:22`) and ISV (`improve-search-visibility/SKILL.md:19`, `atoms/fix-writer/SKILL.md:8,12`, `skill.meta.json:19`) both say: "if a `Claims sign-off` fact is there, the usable claims are the Approved claims table of the Brand record (`knowledge_search` `["document"]`)".
- Three problems with that:
  1. They check only that the marker exists, never its status. LMB writes a marker for "pending client approval" and "not yet signed off" too (`learn-my-brand/SKILL.md:85`).
  2. `knowledge_search` returns 400-character snippets of at most 8 chunks (`knowledge-search.tool.ts` `snippet()` and `limit`). The record also holds "Decisions needed", "Not approved" and "Retired claims" tables (`learn-my-brand/references/brand-record-template.md`), so a headerless snippet row from those tables can be read as approved.
  3. The contract says the "Claims you may use" rules win (`learn-my-brand/references/brain-map.md:24-29`).
- ISV also accepts "facts on the live page" and "one yes as a set" for the five fixes (`improve-search-visibility/SKILL.md:65`, `fix-writer/SKILL.md:12`). MSA, MVA, MC and ROS explicitly reject both site copy and a chat yes (`make-static-ads/references/claims-and-policy.md` §2, `make-content/atoms/claims-check/SKILL.md:50`).

**Chain effect.** Email flows and publish-ready page or schema fixes can carry pending, retired or never-approved claims, such as "Dermatologist-developed & 6x award-winning".

**Fix (owners: EL and ISV).** Replace both blocks with the MC/ROS block word for word (`make-content/atoms/claims-check/SKILL.md:12-29`):
- The status must positively say signed off.
- Claims come only from the "Claims you may use" facts in `brand_read` learnings.
- The record is used for proof only.
- The live page supplies only plain product facts (price, size, ingredients, how to use).
- A chat yes is routed to LMB's one-claim mode.

Update both `skill.meta.json` read lines to match.

### F4 · run-paid-campaigns' change log doesn't match what the server writes — MAJOR
**Evidence (server).**
- The server writes Meta outcomes itself (`apps/api/src/services/ads-harness-docs.service.ts`).
- It finds the campaign folder only through YAML frontmatter in `state.md`: `meta_push_ids: [...]` or `goose_campaign_id` (`:204-245`). Without it, the outcome fails with "no ads/campaigns/<slug>/state.md names this launch" (`:280`).
- It closes recommendations only in the bullet form `- R<n> (` (`:152`).
- It appends decisions as `### <date> — <title>` blocks (`:91-118`).
- The contract it follows is in goose-lab: `coworkers/marketing/meta-ad-manager/contract/templates/campaign/state.md` and `decisions.md`.

**Evidence (playbook).**
- RPC's `state.md` has no frontmatter and keeps push ids in a table. Its bullets read `- R7 · graduate · …`, and its decisions are `- 2026-10-14 09:12 · R17 …` lines (`run-paid-campaigns/references/proposal-and-log.md:46-75`).
- RPC lists the server's format as "unknown" (`run-paid-campaigns/server-needs.md:23,30`).

**Chain effect.**
- Approved, declined and paused Meta moves are never logged.
- Open R#s are never closed.
- AP's "score last week's calls" (`analyze-performance/atoms/call-and-learn/SKILL.md:10`) and PC's replan (`plan-campaign/SKILL.md:21`) read a log with gaps and score wrong.

**Fix.**
- **RPC:** adopt the harness contract.
  - Frontmatter: `campaign`, `stage`, `goose_campaign_id`, `meta_push_ids`, `meta_campaign_id`, `updated_at`, `updated_by`.
  - Add every push id that `prepare_meta_ad_push` returns to `meta_push_ids`.
  - Open recommendations as `- R<n> (YYYY-MM-DD): … — evidence … — awaiting`.
  - Card and human-applied moves appended as `### YYYY-MM-DD — <title>` with `- Recommended/Evidence/Decided/Outcome` lines.
  - Delete server-needs #17 and #24, which are now answered.
- **AP and PC:** parse `###` decision blocks.

### F5 · The creative-tag hand-off (angle, `picked`, `offer-ends`) doesn't round-trip — MAJOR
**Evidence.**
- (a) Server, by code reading (verify on staging): `ads_creative_update` sends `{ tags }` to `adProjectsService.update` (`mcp-tools/ads/ads-simple.tools.ts:263-268`). That service parses a `.strict()` schema whose field is `user_tags` (`services/ad-projects.service.ts:136-152`), so tag writes should be rejected with "unrecognized key". MSA never tested a tag write: `make-static-ads/critique.md` and `tests/` have no record of one.
- (b) Even when tags save, they are lower-cased on write (`ad-projects.service.ts:159-167`). The list filter matches raw input with `hasSome` (`ad-remix-batches.service.ts:4724-4727`). So MSA's `angle:A-07` (`make-static-ads/references/handoff-format.md:12-16`) is stored as `angle:a-07`, and RC's query for `angle:A-NN` (`research-competitors/SKILL.md:67`) matches nothing.
- (c) MSA says "analyze-performance reads the manifest" in the batch file (`make-static-ads/skill.meta.json:32`, `references/reading-the-brain.md:51`). AP never reads `ads/batches/` (`analyze-performance/references/creative-and-channels.md:7,11`).

**Chain effect.**
- RPC can't find picked statics (`run-paid-campaigns/SKILL.md:30` filters on the `picked` tag).
- AP reports every static as "unannotated", so "what to make next" loses its angle ranking.
- RC never updates angle test status from statics.

**Fix.**
- **Server:** pass `user_tags`, and lower-case filter input.
- **MSA:** write tags lower-case, record the human's picks in the batch file as well, and remove the "AP reads the manifest" claim unless AP adopts it.
- **RC:** query lower-case and compare `A-NN` case-insensitively.
- **AP:** read `ads/batches/*.md` (creative id → `A-NN`) as the primary angle source for statics, tags second.
- **RPC:** if no creative carries `picked`, fall back to the batch file's pick list.

### F6 · Workspace scope differs, and the fallback mixes brands — MAJOR (multi-brand orgs) / MINOR otherwise
**Evidence.**
- File tools are not brand-scoped. Leaving `scope` out means the token's agent or the user's default agent (`mcp-tools/shared/schemas.ts:22-29`, `lib/target-resolver.ts`).
- 16 playbooks use `{type:"agent", agent_id: <coworker_agent_id>}` (for example `research-market/atoms/save-to-brain/SKILL.md:11`).
- LMB writes the Brand record to the org **shared** scope (`learn-my-brand/SKILL.md:44,86`, `references/brain-map.md:18`, `atoms/brain-write-back/SKILL.md:19`).
- The two sides also disagree about which scope teammates can see: LMB says shared, while RA and WWC say coworker (`research-audience/SKILL.md:23`, `work-with-creators/SKILL.md:21`).
- When `coworker_agent_id` is null, the research save-to-brain atoms, AP, MSA/MVA, PC, RA and WWC write to the default workspace with no brand prefix (`research-*/atoms/save-to-brain/SKILL.md:12`, `analyze-performance/atoms/save-to-brain/SKILL.md:10`, `make-static-ads/references/reading-the-brain.md:5`). EL, ISV, MC and ROS define no fallback at all.

**Chain effect.** In an agency org, brand B's run "reads before write" and merges brand A's `research/market/voc-bank.md` rows, then imports them as brand B's document.

**Fix.**
- **AGENTS:** one rule, the brand coworker scope. The server's own Meta write-back uses it (`ads-harness-docs.service.ts:16`).
- **LMB:** move records to `brand/records/<YYYY-MM-DD>-v<N>.md` in coworker scope.
- **Every playbook:** in the fallback, prefix every path with `brands/<brand-slug>/`.

---

## 1. Every read → its writer

OK = same place, name and shape. BROKEN = mismatch, which links to a finding above or to an M-finding in §3. "Server" = written by GooseWorks, not a playbook.

**analyze-performance**
| Reads | Writer | Status |
|---|---|---|
| campaign brief headings and change-log slug | PC `references/brief-template.md:9` | OK |
| `ads/campaigns/<slug>/state.md`, `decisions.md` | RPC and the server | **BROKEN** (F4) |
| statics' angle/hook tags | MSA | **BROKEN** (F5) |
| video names and `ads/videos/<project_id>.md` | MVA `references/reading-the-brain.md:46-47` | OK |
| `lifecycle/program.md` | EL | OK |
| social calendar | ROS `social/calendar/<start-date>.md` | OK |
| creator roster | WWC `work-with-creators/roster.csv` | OK (path not named in AP) |
| `research/competitors/watch/<date>.md` | RC | OK |
| `social/listening/<date>.md` | LS | **BROKEN** (M6: AP takes the "newest file" in a folder that also holds `items-*.jsonl`, `replies-*.md` and `watchlist.md`) |
| `search/visibility/<date>.md` | ISV | OK |
| learnings log | AP and others | **BROKEN** (F1) |
| `reports/performance/*` | itself | OK |

**email-lifecycle**
| Reads | Writer | Status |
|---|---|---|
| brand summary, kit, products, learnings | LMB / server | OK |
| claims | LMB | **BROKEN** (F3) |
| voice cards `brand/voices/<slug>.md` | MC, ROS | OK (slug undefined, M8) |
| `reports/performance/<date>.md` | AP | OK |
| campaign brief, email leg | PC | OK |
| "For email-lifecycle" section of `search/fixes/<date>.md` | ISV `SKILL.md:57` | OK |
| `content/newsletter/<date>.md` | MC `SKILL.md:76` | OK |
| `lifecycle/*` | itself | OK |

**improve-search-visibility**
| Reads | Writer | Status |
|---|---|---|
| brand brain | LMB / server | OK |
| claims | LMB | **BROKEN** (F3) |
| `research/market/voc-bank.md`, `demand.md` | RM | OK |
| competitor roster | RC / RM / LMB | OK |
| `content/drafts/*` with a `search/briefs/` path on line 1 | MC `SKILL.md:60` | OK |
| `search/*` | itself | OK |
| `research/credits-log.md` | shared | OK (M10: row schemas differ) |

**learn-my-brand**
| Reads | Writer | Status |
|---|---|---|
| kit, research, sources | server | OK |
| learnings | itself, AP, distiller | OK |
| evidence and documents | server, RM | OK |
| competitors | server, RC | OK |
| `user_context` "Founder said" block | WTS `atoms/situation-save/SKILL.md:16-23` | OK (per-agent caveat, M15) |
| cut lines | human | OK |

**listen-social**
| Reads | Writer | Status |
|---|---|---|
| brand brain, claims, voice | LMB contract | OK |
| operating rules: crisis contact, refunds, disclosure | LMB | PARTIAL (no crisis-contact item in LMB; LS asks — M21) |
| competitor roster | RC / RM | OK |
| accounts, analytics, inspiration | server | OK |
| `research/market/voc-bank.md` | RM | OK |
| `social/listening/*` | itself | OK |
| credits log | shared | OK |

**make-content** — all OK: kit and learnings; claims (contract); VoC bank (RM); inspiration (LS); `search/briefs/<slug>.md` (ISV); campaign asset list (PC); performance "what to make next" (AP); `research/competitors/<slug>.md` (RC); organic (server); voice cards; `content/*`; `content/channels.md`.

**make-product-photos**
| Reads | Writer | Status |
|---|---|---|
| products, kit, learnings (house-style `template_hint`, "Don't …" rules) | itself / server | OK |
| claims marker | LMB | OK |
| photos | server | OK |
| `Product imagery needed:` lines in `ads/batches/*.md` | MSA | OK (never answered, M7) |

**make-static-ads**
| Reads | Writer | Status |
|---|---|---|
| brand brain, claims | LMB | OK |
| VoC jsonl (`V-NN`, `vividness`, `contains_claim`, `personal_attribute`, `testimonial_ok`) | RM `references/output-formats.md:10-13` | OK |
| angle bank `A-NN` | RC | OK |
| campaign record | PC | PARTIAL (a draft brief can be built from, M17) |
| weekly read | AP | OK |
| rotation requests (`For:`, `Status:`) | RPC `references/moves.md:40` | OK |
| `ads_template_read`, `meta_read` | server | OK |
| inspiration | LS | OK |
| approved photos | MPP | OK |
| `Header art needed:` | EL | OK |
| `Asset line: … make-static-ads graphics side door` | ROS `references/slot-anatomy.md:17` | OK |
| MC asset lines | MC `references/repurposing.md:68` | OK |

**make-video-ads** — all OK, with one MINOR: brand brain; claims (`references/reading-the-brain.md` §1 is identical to MSA's); VoC; angle bank; campaign; weekly read; rotation requests; `meta_read`; inspiration; competitor video (`media_list` tag `competitor_ad`); `work-with-creators/roster.csv` (proposed rights); approved photos. `skill.meta.json:18` still says "Brand record approved-claims table" (stale wording, M18).

**plan-campaign**
| Reads | Writer | Status |
|---|---|---|
| brand brain | LMB / server | OK |
| claims | LMB contract | OK, but the status check misses "not yet signed off" (M1) |
| VoC, personas, demand | RM | OK |
| angle bank, landscape, competitor files | RC | OK |
| `lifecycle/calendar/<YYYY-MM>.md` | EL | OK |
| campaigns, approvals | server | OK |
| `reports/performance/*`, `definitions.md` | AP | OK |
| `ads/campaigns/<slug>/*` | RPC and the server | **BROKEN** (F4) |

**research-audience**
| Reads | Writer | Status |
|---|---|---|
| customers, logos, win/loss, do-not-contact rules | LMB (claimed) | **No writer** — LMB writes none of these (M21; RA asks) |
| competitor domains | RC / server | OK |
| own fit-definition and outcomes documents | itself | OK |
| `ledger.csv`, credits log | itself / shared | OK |

**research-competitors**
| Reads | Writer | Status |
|---|---|---|
| brand brain, claims | LMB contract | OK |
| roster, dossiers | server, RM, LMB | OK |
| competitor ads | server | OK |
| `voc-bank.md`, `personas.md` | RM | OK |
| performance reports | AP | OK |
| creatives tagged `angle:A-NN` | MSA | **BROKEN** (F5) |
| video names with `A-NN` | MVA | OK |
| learnings citing `A-NN` | AP | **BROKEN** (F1) |
| `search/visibility/<date>.md` | ISV | OK |
| own files, credits log | itself / shared | OK |

**research-market** — all OK: brand brain; evidence; roster; competitor ad dates; `research/market/*`; `VoC`-tagged quotes in `social/listening/<date>.md` (LS); private exports; credits log.

**run-organic-social** — all OK: kit and learnings; claims (`atoms/post-check` §4, identical to MC); operating rules; campaign organic leg; VoC and personas; organic; social accounts and strategy; inspiration; `social/listening/<date>.md` trend read; `content/repurposed/*`, `content/channels.md`, `content/pov/*`, `brand/voices/*` (MC); performance organic read (AP); `Graphic ready:` lines (MSA).

**run-paid-campaigns**
| Reads | Writer | Status |
|---|---|---|
| brief | PC | OK |
| `approved_only` (= feedback "happy") | MSA | OK |
| `picked` tag | MSA | **BROKEN** (F5) |
| batch files, launch notes | MSA, MVA | OK |
| kept videos | MVA | OK |
| `reports/performance/` and `inputs/<date>.md` | AP | OK |
| `meta_read` | server | OK |
| own change log | itself and the server | **BROKEN** (F4) |
| `research/market/demand.md` | RM | OK |

**where-to-start** — all OK: brand list, lean brain, knowledge search, claims marker, own `user_context` block, campaigns. `references/playbook-map.md` is a static copy of 16 sibling specs, so it can drift.

**work-with-creators**
| Reads | Writer | Status |
|---|---|---|
| "Claims you may use" facts | LMB | PARTIAL — read through `knowledge_search` (relevance cut, limit 8). Its `brand_read` (`SKILL.md:22`) leaves out `learnings`, so claims can be missed (M2) |
| who approves spend, unit cost | LMB (claimed) | **No writer** (M21) |
| organic, competitors | server, RC | OK |
| inspiration | LS | OK |
| persona | RM | OK |
| campaign creator leg | PC | OK |
| own roster, credits log | itself / shared | OK |

---

## 2. Writes with no reader (or a reader that doesn't exist)

| Write | Claimed reader | Reality | Severity / fix |
|---|---|---|---|
| MSA `ads/batches/*` "manifest" (`make-static-ads/skill.meta.json:32`) | AP | AP never reads it | Part of F5 — AP adopts it, or MSA drops the claim |
| MSA `Graphic ready:` under EL's header-art lines and MC's asset lines (`make-static-ads/references/reading-the-brain.md:47`) | EL, MC | Only ROS reads them back (`run-organic-social/SKILL.md:104`) | MINOR (M7): EL and MC read their `Graphic ready:` lines on the next run |
| MSA `Product imagery needed:` | MPP | MPP reads it but never answers, and MSA never re-checks | MINOR (M7): MPP appends `Imagery ready: <photo ids> · <date>` under each request |
| WWC roster document (`work-with-creators/skill.meta.json:30`, "neither reads it") | PC, AP | AP does read the roster (`analyze-performance/references/measurement-contract.md:46`); PC doesn't | MINOR: fix the meta wording; PC reads the roster when a creator leg is Run/Test |
| RA outcomes document | own later runs | Stated | OK |
| LMB unknowns ledger | the human and the next LMB run | Stated | OK |
| LS and RC method files (copies of SKILL.md in the workspace) | automation | They drift from the live playbook | MINOR: the prompt names the playbook version; re-copy on each opt-in |
| `[search]`, `[listening]`, `[market]`, `[angle]`, `[lifecycle]` insight facts | "every playbook / ad generation" | Generic, and they crowd out rules (F2) | Part of F2 |

Everything else written has a named reader. Checked: PC → all makers, RPC, AP, EL, ROS, WWC; RM → MSA, MVA, MC, ROS, RC, PC, ISV, WWC; RC → MSA, MVA, PC, MC; ISV → MC, EL, AP, RC; LS → AP, ROS, RM, inspiration readers; RPC → makers, AP, PC; MVA → RPC, AP; EL → PC, AP; AP → RPC, PC, makers, ROS, EL; WTS → LMB.

---

## 3. Shared conventions that must be identical

### 3.1 The claims contract
LMB defines it in `references/brain-map.md:24-29`.

| Reader | Where the claims come from | Marker statuses treated as "not signed" | Verdict |
|---|---|---|---|
| MC, ROS | "Claims you may use" facts (full read); record = proof | pending, in progress, pending client approval | OK (identical blocks) |
| MSA, MVA | same | pending, in progress | OK (identical blocks) |
| LS, RC | same | pending | OK; misses "not yet signed off" |
| PC | same, plus server applicability | pending client approval | OK; misses "in progress" and "not yet signed off" |
| WWC | facts through `knowledge_search` only | pending | MINOR (M2) |
| EL, ISV | **Record snippets; ISV adds the live page and a chat yes** | **none checked** | **MAJOR (F3)** |
| MPP, WTS | marker only (honesty gate / regulated check) | — | OK |

- **M1 — marker status words disagree, MINOR.** LMB's own marker lists `signed off by <who> | pending client approval | in progress` (`learn-my-brand/SKILL.md:85`). The same step then says the statuses are "signed off / pending client approval / not yet signed off". "Not yet signed off" contains "signed off", so a substring check reads it as signed. **Fix (LMB):** use a fixed token, `status: signed-off | pending-client | not-signed`. **All readers:** positive-match `signed-off` only.
- **"Listed variant", MINOR.** Readers say "verbatim or a listed variant", but LMB's must-fact format holds no variants. Variants live only in the record's "Allowed variants" column. **Fix:** either LMB writes the variant into the fact (if ≤300 characters), or the shared block says variants come from the record the marker names, read in full with `file_read`.
- **Plain product facts.** MC, ROS, MSA, MVA, WWC and EL define them as descriptive only (name, price, size, listed ingredients, how to use; benefit wording is a claim). ISV adds "facts on the live page" (F3).
- **Server claims (`["claim"]`).** MSA, MVA and PC use them only to *narrow* a signed claim — good. The server's own generators and the `knowledge_search` description still treat research claims as approved (`learn-my-brand/server-needs.md` #1, #14). That is a server issue, already filed.

### 3.2 Voice
- LMB: the kit `voice` summary, plus `do`/`dont` voice rules, one banned-words `dont` and a terminology `must`. No voice rules are written until the owner confirms.
- MC and ROS: both write `brand/voices/<slug>.md` cards and import them (`make-content/SKILL.md:101,109`, `run-organic-social/SKILL.md:124,132`). ROS: "real posts win on style, the guide wins on rules" (`references/voice-card.md`). This is compatible.
- **M22, MINOR.** There is no voice sign-off signal. LS ties "voice unapproved" to the *claims* marker (`listen-social/SKILL.md:25`). MC, ROS and MSA use kit voice whether or not it was confirmed. **Fix (LMB):** add `voice: confirmed | provisional` to the marker. Readers label drafts "voice unconfirmed" when provisional.
- **M8, MINOR.** The voice-card slug is undefined (person name or account handle?), and neither writer retires the old imported card. **Fix:** slug = the person's or account's handle; the last writer retires the previous document (§3.5).

### 3.3 The learnings log
**Writer formats.**
- AP: `[learning <date>] CLAIM … SCOPE …`, kind insight/do/dont (`tests-and-learnings.md:31-41`).
- Others: `[market <date>]`, `[angle A-NN <slug> <date>]`, `[listening <date>]`, `[search <date>]`, `[lifecycle <date>]`.
- LMB: fixed openings (`Claims sign-off (`, `Claims you may use —`); everything else unprefixed.
- MC, ROS, MSA, MVA: unprefixed.
- MPP: `Product photo house style:`.

**Readers.**
- MSA and MVA look for `[learning YYYY-MM-DD]` (`reading-the-brain.md` §4) — OK.
- RC looks for `A-NN` (broken by F1).
- PC uses `knowledge_search ["learning"]` for "past tests".
- AP dedupes with `knowledge_search`.
- The server generator takes the top 8 (F2).

**Server facts readers rely on.**
- Any fact write needs `knowledge_intent: user_correction` and the user's words (`brand-update.tool.ts:69-85`). AP, EL, ISV, LS, RC, RM, MSA and MPP state this correctly.
- `learn-my-brand/server-needs.md:73` is wrong on two counts. It says facts are "accepted without knowledge_intent" (they are refused), and that they are "stored with source feedback" (they are stored as `source: "user"` and the distiller never overwrites them, `ad-brand-learning.service.ts:144-166`). Fix: M18.
- Lean `brand_read` returns **every** `must`/`dont` fact (`brand-read-lean.ts:74-75,158-177`). The repeated warning "lean can miss the marker" (`brain-map.md:11`, `email-lifecycle/SKILL.md:22`, `improve-search-visibility/SKILL.md:19`, `listen-social/SKILL.md:25`, `research-competitors/SKILL.md:30`, `make-static-ads/SKILL.md:30`, `make-content/SKILL.md:24`, `run-organic-social/SKILL.md:36`) is false. It costs context but is otherwise harmless (M3). **Fix:** a lean read is enough for the marker, claims and never-say. Use `detail: "full"` only for `do`/`insight`/`template_hint`.
- **M4, MINOR.** Use one prefix scheme and one retire rule — see the conventions text.
- **M5, MINOR.** A standing offer can live in two places:
  - EL writes `[lifecycle] Standing first-order offer: …` as a `must` fact and appends to product `offers` (`email-lifecycle/SKILL.md:54`).
  - LMB writes offers and brand-wide policies itself (`learn-my-brand/SKILL.md:84-85`) and, in update mode, searches only `creative`/`document` for the old value (`:27`).
  - So a changed offer leaves EL's fact stale.
  - **Fix.** **EL:** write the same text shape LMB uses (`Standing offer: … [owner, date]`). **LMB:** update mode also searches `["learning"]` for the old value. Product `offers` is a single 280-character field with two writers; EL appends only when the result stays under 280 characters.
- **M20, MINOR.** RM writes `knowledge.audience` as a `user_correction` mid-research (`research-market/SKILL.md:58`), over LMB's curated audience. **Fix:** RM writes only the `agent_proposal`, and a founder's correction goes through LMB update mode.

### 3.4 Workspace paths
The scope split is F6. The paths themselves match between writers and readers everywhere except the AP listening read (M6).

**M9, MINOR — naming.**
- RA and WWC use playbook-named folders (`research-audience/`, `work-with-creators/`). Everyone else uses domain folders (`research/market`, `social/…`, `ads/…`).
- MSA and MVA use `yyyymmdd` (batch files, video names, tags). Every other file uses `YYYY-MM-DD`.
- **Fix:** `research/audience/` and `creators/` in RA and WWC (and in MVA's roster read); `YYYY-MM-DD` in file names. Tags and Meta names may keep `yyyymmdd`, documented as an exception.

**M19, MINOR — the shared credits log.** Row schemas differ: research paid-pull logs the query verbatim; RA logs only the "kind of query, never a prospect's name"; WWC and ISV are similar to research. Every write is read-modify-write of one growing file. **Fix:** one schema, `date | playbook | tool/endpoint | kind of query | items | credits`, and monthly files `research/credits-log/<YYYY-MM>.md`.

### 3.5 knowledge_import naming and versioning
| Playbook | Title | Old versions |
|---|---|---|
| LMB | `Brand record — <brand> — <date> v<N>` | delete previous by title |
| RM, RC, LS (identical atom) | `<Artifact> — <brand> — <date>` + tags | delete by tags + title stem |
| AP | `Measurement contract — …`, `Monthly performance read — … — <YYYY-MM>` | deletes the **previous month's** read, which is history, not a version (MINOR) |
| ISV | `Search visibility — <brand> — <date>` + tag | delete by tag |
| LS report | `Listening report — <brand> — <YYYY-Www>` (ISO week, not a date) | delete |
| EL | untitled; asset id kept in `program.md` | delete by id |
| MC, ROS | untitled voice cards, newsletter template, calendars | **never retired** |
| RA, WWC | `research-audience fit definition <date>`, `work-with-creators roster <date>` | **never retired** |

**M8 / M11, MINOR.**
- Untitled documents fall back to the file name (`brand-document-ingest.service.ts:292-296`), so "voice card" searches miss them.
- Never-retired documents leave stale duplicates in `knowledge_search`.
- On deletion, LMB says "unverified whether deleting un-indexes" (`brain-map.md:20`) while the research atom says "verified on staging" (`save-to-brain/SKILL.md:23`). The code's eligibility check drops archived or restricted media (`brand-document-ingest.service.ts:120-128`, `:1214-1218`). Align LMB's text.
- Document import is not guaranteed free. v2 types `knowledge_import` as `paid`, and the document path quotes an embedding reservation (`brand-document-ingest.service.ts:732-742`). EL and ISV say "(free)" with no stop rule. **Fix:** everyone uses LMB's rule — "if an answer shows a price, stop and ask".

### 3.6 The connection-stop sentence
- All 17 stop.
- Wording varies ("Connect GooseWorks first —" vs "Connect GooseWorks —"; colon vs dash).
- The trigger varies: "no tools" in most; "get_started or brand_read fails" in EL and ISV, which also stops on a transient brand_read error.
- **M14, MINOR. Fix:** one sentence pattern and one trigger, "no `gooseworks:` tools listed after one `tools_load`" (conventions text).

### 3.7 get_started usage
- `wants` values used: `analyse` (AP, RPC), `campaign` (PC), `image` (MSA, MPP), `video` (MVA), `more` (EL, LS, RC, RM, MC, ROS).
- ISV, RA and WWC call it with no `wants`.
- LMB and WTS skip it on purpose (`learn-my-brand/SKILL.md:23`, `where-to-start/SKILL.md:17`), against the server's "first call get_started".
- All values are valid (`brand-setup-actions.ts:134`).
- **M12, MINOR. Fix:** call it once per conversation with the table's `wants`. Card or `next_step` is used only for setup and brand choice; LMB and WTS use `wants: "more"` and keep the card to one line.

### 3.8 Credit-approval gates
There are three models.
- **(a) RM, RC, LS paid-pull and ISV:** a probe with one yes, then "about N credits — go ahead?" built from the credits log (`research-market/atoms/paid-pull/SKILL.md:22-28`). This is the agent's own math; the server rule says "never your own math".
- **(b) RA and WWC:** the human sets a ceiling, the playbook "never multiplies out its own total", and it stops after the first charge from an unpriced endpoint (`research-audience/SKILL.md:32-36`, `work-with-creators/SKILL.md:28-30`).
- **(c) Engine quotes, which are consistent:** MSA, MPP and MVA show the quote as given. MPP also shows the sum labelled as its own sum (`make-product-photos/SKILL.md:61`).

**M10, MINOR.** Unify proxy spend on "probe → yes to a ceiling 'up to N credits', drawn from logged charges and labelled as an estimate → stop at the ceiling".

**M11, MINOR — automations.**
- AP, EL, ISV, LMB, LS, PC, RC and RPC offer schedules whose coworker runs have no stated credit total (`analyze-performance/SKILL.md:43`, `email-lifecycle/SKILL.md:54`, `improve-search-visibility/SKILL.md:57`, `learn-my-brand/SKILL.md:118`, `listen-social/SKILL.md:55`, `plan-campaign/SKILL.md:51`, `research-competitors/SKILL.md:75`, `run-paid-campaigns/SKILL.md:55`).
- RA and WWC refuse schedules for exactly that reason (`research-audience/SKILL.md:48`, `work-with-creators/SKILL.md:46`).
- MSA offers "a standing weekly refresh (opt-in)" (`make-static-ads/SKILL.md:91`) with no tool and no gate — that would be weekly paid generation.
- LS's standing paid budget is enforced only by the prompt (`references/report-format.md:72`).
- RM shows USD ceilings for `review_refresh` (`research-market/SKILL.md:63`), against the server's "never dollars"; the schema forces this (server-needs).

### 3.9 tools_load usage
- Every playbook calls it only when a tool is missing — good. It is not listed on hosts without `list_changed`, where every tool is already listed (`lib/tool-groups.ts:105-111`).
- **M13, MINOR.** EL names an invalid group, `jobs` (`email-lifecycle/SKILL.md:20`); the server returns an error for unknown groups (`tools/tool-groups.tools.ts`). `job_get` is in `core`. **Fix:** remove `jobs`.

### Other cross-playbook MINORs
- **M15.** WTS stores per-brand facts in the agent's `user_context` (`where-to-start/atoms/situation-save/SKILL.md:16`). LMB forbids storing brand knowledge there (`learn-my-brand/SKILL.md:89`). v2 `brand_update` refuses `user_context` without an agent (`v2/brand/brand-actions.ts` "agent_required"). **Fix:** WTS writes its block to `brand/situation.md` (coworker scope) and imports it; LMB reads that file.
- **M16.** RC lets the agent propose rivals "from your own knowledge" (`research-competitors/SKILL.md:38`); RM forbids "rivals from memory" (`research-market/SKILL.md:41`). **Fix (RC):** align with RM.
- **M17.** PC saves draft briefs onto the campaign record (`plan-campaign/SKILL.md:36`). MSA's campaign path doesn't check that the brief is approved (`make-static-ads/SKILL.md:68`). **Fix (MSA, MVA):** use a campaign only when its Status line says "Approved".
- **M18.** Stale or incorrect text:
  - `learn-my-brand/server-needs.md:73` and `references/brain-map.md:11,20`
  - `make-video-ads/skill.meta.json:18`
  - `work-with-creators/skill.meta.json:30`
  - `make-static-ads/skill.meta.json:32`
  - `run-paid-campaigns/server-needs.md` #17/#24 (answered by F4)
- **M21.** LS, RA and WWC read items LMB never writes: a crisis-escalation contact; customers, logos, win/loss notes and do-not-contact rules; who approves spend; unit cost. They all fall back to asking. **Fix (LMB):** add these to the record's "Business facts" section, or mark them "asked by <playbook>" in the unknowns ledger.

---

## 4. Duplicated atoms → shared atoms

Proposed home: `marketing-agent/foundation/` (AGENTS §3 already plans `data-access`). Only the medium-specific parts stay in the playbooks.

| Family | Copies (paths) | How they differ | Proposed shared atom |
|---|---|---|---|
| **Claims gate** (read the contract, then check spans) | `make-content/atoms/claims-check`; `run-organic-social/atoms/post-check` §4 (identical text); `make-static-ads/atoms/claims-check` + `references/reading-the-brain.md` §1; `make-video-ads/atoms/script-check` + `references/reading-the-brain.md` §1 (identical to MSA); `email-lifecycle/SKILL.md:22` + `atoms/send-check`; `improve-search-visibility/SKILL.md:19` + `atoms/fix-writer`; `listen-social/SKILL.md:25` + `references/reply-drafting.md`; `research-competitors/SKILL.md:30`; `plan-campaign/SKILL.md:17`; `work-with-creators/SKILL.md:23` + `atoms/brief-writer` | Claims source (rules vs snippets vs live page); status words; plain-fact definition; whether a chat yes counts; what is scanned (text, image, video scene) | `foundation/claims-gate`: load the table once (marker status token, Claims-you-may-use facts, dont/must) → classify spans → keep / rewrite / cut → cut list with restore-proof. Makers keep their own extract step (image Pass B, video scenes). Owner: LMB's builder. |
| **Save-to-brain** (workspace file → document) | `research-market`, `research-competitors`, `listen-social` `atoms/save-to-brain` (byte-identical); `analyze-performance/atoms/save-to-brain` (deletes the previous period); `learn-my-brand/atoms/brain-write-back` step 4 (shared scope, vN); inline in `email-lifecycle/SKILL.md:54`, `improve-search-visibility/SKILL.md:57`, `make-content/SKILL.md:109`, `run-organic-social/SKILL.md:132`, `research-audience/SKILL.md:66`, `work-with-creators/SKILL.md:65` | Scope, title pattern, tags, whether and how old versions are retired, null-coworker fallback, price stop | `foundation/save-to-brain`, with params `path`, `artifact`, `versioned: supersede | keep-history`. One title rule, one retire rule, one fallback prefix. |
| **Spend gate / paid pull** | `research-*/atoms/paid-pull` (identical); `research-audience/references/data-sources.md` + SKILL gates; `work-with-creators/references/data-sources.md` + gates; `improve-search-visibility/SKILL.md:36` + `references/citation-protocol.md`; engine quotes in `make-static-ads/SKILL.md:65-69`, `make-product-photos/SKILL.md:61`, `make-video-ads/atoms/present-gate` | Estimate vs ceiling; probe rules; log schema; automation handling | `foundation/spend-gate`, with two branches: engine-quoted and proxy (probe, ceiling, log). One credits-log schema. Standing-automation rule. |
| **Learning write-back** | `learn-my-brand/atoms/brain-write-back` step 3; `analyze-performance/atoms/call-and-learn` step 6; inline in EL, ISV, LS, RC, RM, MC, ROS, MSA (`atoms/policy-check` step 4), MVA, MPP | Prefix, kind policy, retire behaviour, limits | `foundation/save-learning`: prefix, ≤300 characters, `user_statement`, dedupe search, retire own superseded facts, per-playbook cap, read-back length check |
| **Policy and disclosure check** | `make-static-ads/atoms/policy-check` + `references/claims-and-policy.md` §3-5; `make-video-ads/atoms/script-check` §4-5 + `references/claims-policy-and-people.md`; `run-organic-social/atoms/post-check` §6; `listen-social/references/reply-drafting.md`; `email-lifecycle/atoms/send-check` (compliance); `work-with-creators/atoms/brief-writer` §5 | Paid ad rules (MSA, MVA: near-identical personal-attribute and before/after rules) vs organic disclosure vs email law | `foundation/ad-policy-check` for MSA + MVA now. Keep organic, email and creator disclosure as one shared `references/disclosure.md`. |
| **Honest render review** | `make-static-ads/atoms/render-review`; `make-video-ads/atoms/review-render`; `make-product-photos/atoms/fidelity-check` | Rubrics differ (rightly); shared principles identical: by eye vs automatic read, three-item checklist when unseen, remake only on a priced yes, two tries | A shared `foundation/references/honest-review.md`; rubrics stay per playbook |
| **Voice card** | `run-organic-social/references/voice-card.md`; `make-content/references/point-of-view.md` + `atoms/two-pass-edit`; `learn-my-brand/atoms/voice-calibrate` | Two writers of `brand/voices/<slug>.md`; no slug rule; precedence stated only in ROS | `foundation/voice-card` (build, read, update; slug rule; LMB rules > card style; retire old document) |
| **Outcomes ledger** | `research-audience/atoms/outcomes-intake`; `work-with-creators/atoms/roster-outcomes` | Entity (person or creator); otherwise the same flow (human-filled status, permanent suppression, +30-day re-check, dated lessons document) | `foundation/outcomes-ledger`, parametrised by entity |
| **Brain read and sibling index** | Every "Before you start"; `make-static-ads/references/reading-the-brain.md` ≈ `make-video-ads/references/reading-the-brain.md` | Paths and fallbacks restated 17 times | `../skills/marketing-data-access/SKILL.md`: connection preamble, brand pick, scope, lean-vs-full rule, and an index of every sibling artifact path |
| **Briefs** | `make-content/atoms/content-brief`; `improve-search-visibility/atoms/fix-writer` (page briefs); `work-with-creators/atoms/brief-writer`; `plan-campaign/atoms/brief-and-assets` | Different jobs: keep separate | ISV writes page briefs in MC's content-brief input shape; all briefs take their "may say / never say" block from the claims gate |

---

## 5. AGENTS.md §2 violations

| Rule | Finding | Severity | Fix (owner) |
|---|---|---|---|
| 2.3 never re-describe parameters | Widespread limits and defaults restated: `analyze-performance/SKILL.md:21` (`meta_read` days, rank_by, limit); `make-static-ads/SKILL.md:28-34` (one prompt per call, tags ≤20/≤40); `analyze-performance/references/tests-and-learnings.md:31` (text ≤2,000 — **wrong in practice**, F1) | MINOR (the ≤2,000 case fed F1) | Name the field to set; delete restated limits (AP, MSA, research `public-data.md` keeps proxy paths, which are not MCP params) |
| 2.3 never invent a tool | None: all 80 `gooseworks:` names exist on staging; `get_meta_ad_context` appears only as a gap in server-needs | — | — |
| 2.4 no vendor keys | None found. Public pages are fetched with the host's browser or shell `curl` (RM, RC, ISV, RA, WWC); ISV drives signed-out ChatGPT in the host browser | MINOR (interpretation) | Orchestrator to rule whether host-browser public reads are allowed under "public data goes through the proxy" |
| 2.5 brain is the only memory | No local-file memory (RA and WWC save a *copy* locally). WTS keeps per-brand facts in agent `user_context` | MINOR (M15) | WTS → workspace file + document |
| 2.6 stop without connection | All 17 comply; EL and ISV also stop on any `get_started`/`brand_read` failure | MINOR (M14) | One trigger |
| 2.7 never invent facts | RC allows labelled "model knowledge" rival names | MINOR (M16) | RC aligns with RM |
| 2.8 money and publishing are human decisions | Automations with unpriced runs (8 playbooks); MSA's undefined "weekly refresh"; LS standing budget enforced only by prompt; EL and ISV assume imports are free | MINOR (M11, §3.5) | Shared spend-gate and automation rule |
| 2.9 no playbook calls another | None (RC "offer to run research-market first" is an offer to the human) | — | — |

Smaller drift: `needs.mcp` vs tools used is clean apart from negative mentions (e.g. ROS "never use `organic_creative_queue`").

---

## Proposed shared conventions for AGENTS.md (§8, 60 lines)

```markdown
## 8. Shared conventions (every playbook; atoms in foundation/ implement them)

**Connection.** No `gooseworks:` tools listed after one `tools_load` → say only:
"Connect GooseWorks first — <playbook> reads and saves your <thing> through it." Nothing else runs.
- First GooseWorks call of a conversation: `get_started` with `request` = their words and `wants` from
  video | image | analyse | campaign | more. Its card/next_step settles setup and the brand only; this
  playbook's gates win. learn-my-brand and where-to-start: `wants: "more"`, one line.
- `tools_load` only for a missing tool; groups: brand media files ads campaigns meta social automation data helper.

**Workspace.** Every file uses the brand coworker scope `{type:"agent", agent_id:<coworker_agent_id>}`
from the `brand_read` list. No coworker → default workspace, every path prefixed `brands/<brand-slug>/`,
and tell the human. Never the org shared scope.
- Folders: brand/ · research/{market,competitors,audience}/ · creators/ · social/{listening,calendar}/ ·
  content/ · search/ · lifecycle/ · ads/{batches,videos,campaigns}/ · reports/performance/ · plans/.
- File dates `YYYY-MM-DD`. Read before write (file_write replaces the file). In another playbook's file,
  only append under your own request lines.
- Request lines: `<Kind> needed: for <playbook> · <what> · return to: <path>`. Answer under it:
  `<Kind> ready: <link or ids> · <date>`. The requester reads its answers on its next run.
- `research/credits-log/<YYYY-MM>.md` rows: `date | playbook | tool/endpoint | kind of query | items | credits`.
- `ads/campaigns/<slug>/` follows the server's harness contract (frontmatter `meta_push_ids`,
  `goose_campaign_id`; `- R<n> (YYYY-MM-DD): …` bullets; `### YYYY-MM-DD — <title>` decision blocks).

**Brand documents.** Title `<Artifact> — <Brand> — <YYYY-MM-DD>` (+ ` v<N>` for records), tags
`[<playbook>, <artifact>]`. Write the workspace file → `media_upload` (brand, document, source workspace,
same scope) → `knowledge_import` → `job_get` until ready → delete the previous version (same tags and title
stem; never period artifacts like weekly or monthly reads) → verify with `knowledge_search`. Any answer
showing a price → stop and ask.

**Learnings (`brand_update patch.facts`).** Only with the human's own words as `user_statement`
(`knowledge_intent: user_correction`). One idea per fact, ≤ 300 characters (longer text is cut
silently); re-read and compare. Text starts `[<source> YYYY-MM-DD]`, source = learning (analyze-
performance, with ` A-NN` when about an angle) | market | angle A-NN | listening | search | lifecycle |
content | social | ads | photos. learn-my-brand's facts keep their fixed openings. Retire your own
superseded facts in the same call; at most 3 new per run; `must`/`dont` only for human-stated rules.
The ad engine sees only a handful of facts: write rules, not observations.

**Claims (learn-my-brand's contract — the only one).**
- Marker: a `must` fact starting `Claims sign-off (learn-my-brand,` with status `signed-off |
  pending-client | not-signed`. Match `signed-off` exactly.
- signed-off → usable claims are the `Claims you may use —` facts in `brand_read` learnings (lean is
  enough: every must/dont comes back), one claim per fact, verbatim, in scope, before review, with the
  qualifier. Variants and proof: the Brand record the marker names (`file_read`, never snippets).
- Anything else (search snippets, kit approvedClaims/proofPoints/valueProps, `["claim"]` rows, the live
  site, a yes in this chat) is not approved. Not signed → plain product facts only (name, price, size,
  listed ingredients, how to use; never benefit wording) and `must` policies.
- Always apply every `dont` and `must`. Each cut names the proof that would restore it and points to
  learn-my-brand's one-claim mode.

**Voice.** Kit voice + `do`/`dont` rules, with learn-my-brand's status `voice: confirmed | provisional`.
Per-person or account cards at `brand/voices/<handle>.md`: style from real posts, rules from learn-my-brand.

**Money and publishing.**
- Engine-priced work (ads, photos, video): dry run, the quote shown as given, the yes, then submit.
- Proxy data: one probe with a yes, then a yes to a ceiling "up to N credits" built from logged charges
  and labelled an estimate; stop at it; log every charge.
- Automations: created paused; the yes names any standing per-run data ceiling and says the run's own
  cost appears after run one. Never spend data credits in a run without a standing ceiling.
- Nothing is sent, posted, launched, paused or switched on without the human's yes in this conversation.

**Creative tags.** Lower-case (`angle:a-07`, `picked`, `offer-ends:20261031`), queried lower-case; picks also go in the batch file.
```

---

## What was verified against the server (origin/dev)

| Claim | Evidence |
|---|---|
| Facts need `user_correction` and the user's words | `brand-update.tool.ts:69-85` |
| Facts are stored as `source: user`, `confidence: 1` | `ad-brand-learning.service.ts:144-166` |
| Fact text is cut at 300 characters | `ad-brand-learning.service.ts:37,150,183` vs `schemas.ts:333` |
| The generator injects the top 8 facts by confidence and age, ignoring kind | `ad-brand-learning.service.ts:34,57-73`; `ad-remix-pipeline.service.ts:1966`; `server-video.route.ts:281` |
| Lean `brand_read` keeps every must/dont | `brand-read-lean.ts:74-75,158-177` |
| `knowledge_search` returns 400-character snippets, default 8 results | `knowledge-search.tool.ts` `snippet()`, `limit` |
| Document sources are keyed by media id, so a new upload is a new source; title falls back to the file name | `brand-document-ingest.service.ts:283-296` |
| File scope = token or default agent; not brand-scoped | `shared/schemas.ts:22-29`, `target-resolver.ts` |
| `brand_read` list returns `coworker_agent_id` | `brand-list.tool.ts:58` |
| The Meta write-back needs state.md frontmatter and `- R<n> (` bullets | `ads-harness-docs.service.ts:91-118,152,204-245,280` |
| Tags are lower-cased on write and filtered raw | `ad-projects.service.ts:159-167` vs `ad-remix-batches.service.ts:4724-4727` |
| `ads_creative_update` sends `tags` into a strict `user_tags` schema | `ads-simple.tools.ts:263-268` vs `ad-projects.service.ts:136-152` (verify on staging) |
| `tools_load` groups and unknown-group error; not listed without list_changed | `lib/tool-groups.ts`, `tools/tool-groups.tools.ts` |
| `get_started` `wants` enum | `v2/brand/brand-setup-actions.ts:134` |
| `competitor_research` refresh is free, mentions are paid | `brand-setup-actions.ts:196-197` |
| `data_price_provider` covers fal and ElevenLabs only; scrapecreators has no quote | `data/data-tools.ts:180-186,240-248` |
| `user_context` writes need an agent | `v2/brand/brand-actions.ts` (agent_required) |
