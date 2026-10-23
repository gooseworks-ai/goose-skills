# GooseWorks adapter

## Summary

Use this mode when the GooseWorks Meta read tools are callable. This file maps each read in the
workflow to a GooseWorks tool, and each connection class to what those tools return.

**Launch record (rule 5).** GooseWorks records launches as pushes; the launch record is the push
list in `state.md` (`meta_push_ids`). Pause and revert both exist, inside the coworker.

## What each host can see

- **Inside the coworker** (chat, messaging turns, scheduled runs): all the tools below. Read the
  `ads/` docs with the built-in `Read` tool, paths relative to the workspace root (`ads/README.md`).
- **From an outside host** (Claude Code, Cursor, any MCP client): only the shared Meta reads.
  **`get_meta_push_status` and `get_goose_creative_performance` are not visible.** For a push or
  Goose-creative question, say the answer needs the brand's coworker in GooseWorks, and do not
  guess. Read the `ads/` docs with `file_read` and `scope: { type: "agent", agent_id:
  <brand.coworker_agent_id> }` (from `brand_list`). The read tools resolve the brand themselves and
  never take a `brand_id`.
- A reconnect in GooseWorks is done in the brand's Settings. Never ask for a token in chat.

### Reads → tools

| The user asks… | Call | The window and sync time come from |
|---|---|---|
| "How are my ads doing?", spend, results for a period | `meta_status_get` with `view: "summary"` and a `window` (`preset` such as `last_7d`, or `since`/`until`). **If `account.connection_status` is not `READY`, also call `view: "sync"` before answering** | `window.start`..`window.end`; `freshness.last_successful_sync_at`; `account.connection_status` |
| "Is Meta connected?", "why is data missing?" | `meta_status_get` `view: "sync"`, then `view: "diagnostics"` if the sync view does not explain it | `connection_status`, the last error, the recent sync runs |
| "Which campaign / ad set / ad is best or worst?" | `list_meta_entities` at that `level`. **Read every page** (`next_cursor`) before you rank | envelope `freshness`; the window you passed |
| A trend, day by day, "since Tuesday" | `query_meta_insights` (`granularity: "day"`, up to 25 `entity_ids`, up to 90 days) | envelope `freshness`; the window you passed |
| One specific ad | `get_meta_ad_context` with the numeric ad id. If the user gave a name, find the id with `list_meta_entities` `level: "ad"` first | the dossier's performance window and freshness |
| "How are the ads Goose made doing?" | `get_goose_creative_performance` (`days`, `rank_by`) | its `window`. Its `freshness` is only a word (`fresh`, `partial`, `stale`) with no timestamp, so take the sync time from `meta_status_get` |
| A Goose push: "did it go live?", "is it paused?" | `get_meta_push_status` with the push id from the campaign's `state.md` (`meta_push_ids`) | `state`, `all_paused`, each item's `live` and `external_change` |
| "Why did you pause / change / recommend that?" | Read `ads/README.md`, find the campaign, read its `decisions.md` | the entry's date and its `Evidence:` pointer |
| "What have you noticed?", "anything wrong?" | Read the campaign's `state.md` `## Open recommendations`, then call `meta_status_get` `view: "summary"` | the fresh read |

**Watch findings have no read tool.** Goose's hourly watch sends urgent alerts itself, and the
rest go into the next report. You cannot list them. So never say "I checked the watch" or
"there are no alerts". Say what you did read.

### Connection state → classes

Every Meta read returns an envelope `status`, and the connection has its own
`connection_status`. **Check both.** A PARTIAL connection comes back as `status: "ok"`, and
only `connection_status` says `PARTIAL`.

**Only `meta_status_get` returns `connection_status`.** `list_meta_entities`,
`query_meta_insights` and `get_meta_ad_context` do not. So for any question that ends in a
Meta number, call `meta_status_get` once in the turn: `view: "summary"` if you need totals
anyway, otherwise `view: "sync"`.

| What you see | What you say |
|---|---|
| `status: "ok"`, `connection_status: "READY"` | The numbers, with window and sync time. |
| `connection_status: "PARTIAL"` | **You must call `meta_status_get` `view: "sync"` first.** A caveat that only says "PARTIAL" or "some data may be incomplete" fails. Name the part that failed, in plain words, from `last_error_message` or the latest sync run ("ad images didn't finish syncing"). Say which numbers that part affects. Then give them. |
| `status: "stale"` | Give the numbers, say how old they are ("last synced 3 days ago"), and **make no recommendation**. |
| `status: "not_connected"`, or `connection_status` `REQUIRES_REAUTH` / `FAILED` / `DISCONNECTED` | No numbers. Say Meta needs reconnecting in the brand's Settings. Never ask for a token, and never name a connection method. |
| `status: "error"` or `"no_brand"` | Say you could not read the data and why. No numbers. |

### Fields the six rules lean on

- **Rule 2:** money is in `account_currency`. CTRs come back as **fractions** (0.021 is "2.1%").
- **Rule 4:** `get_meta_push_status` shows `external_change` on an item changed in Ads Manager.
- **Rule 5, "Goose published it":** `get_meta_ad_context` shows `link.provenance.source:
  "goose_push"`, or a push in `state.md` `meta_push_ids` lists the ad id in
  `get_meta_push_status`. `link.state: "unlinked"` is "no Goose link recorded". Links survive a
  Meta reconnect, but `unlinked` is still not proof. `goose_render_reference`, or a
  reviewed historical mapping, is "uses a Goose creative, not published through Goose".

### What the tools tell you

- `query_meta_insights` `truncated: true`: narrow the window, the entity ids or the metrics,
  and query again. Never answer from a clipped result.
- `get_meta_ad_context` puts the **link state** in its top-level `status`: `"ok"` (linked to
  Goose), `"unlinked"` (not a Goose ad: the Meta numbers are still valid, report them) or
  `"conflict"` (the creative was replaced, so numbers are withheld: say that, don't estimate).
  So this tool's `status` says nothing about freshness. Read `freshness.classification`
  (`"stale"` means stale), and get the connection state from `meta_status_get`.
- `get_goose_creative_performance`: `insight.available: false` means give the numbers but name
  no winner. `status: "no_creatives"` means Goose has no published creative with data yet. Say
  so, and don't fall back to account totals as if they were Goose's. `status: "conflict"` means
  a Goose ad's creative was replaced in Meta, and its numbers are withheld. The tool's `scope`
  says it is not attribution, so never call it that.
- Never recompute a metric the tool returned, and never compare against outside benchmarks.
- **Name a metric exactly as the tool defines it.** `cpc` is spend ÷ **all** clicks, not per link
  click. `ctr_link` uses link clicks and `ctr_all` uses all clicks. `roas` of `0` with
  `purchases: 0` means no purchases were tracked, not a result.
- **Report what a number is, not a business verdict.** ROAS 0.7 is "about 70¢ of Meta-reported
  purchase value per $1 spent". It is not "losing money": Meta's purchase value is its own
  attributed figure, not revenue, margin or repeat purchases. The same goes for "profitable" and
  "wasting money". And never call data "complete". A READY connection means the last sync
  finished, not that every row is proven.
- The `summary` view's `coverage.status` is `"unverified"`: the tool does not prove every
  row was imported. So never vouch for a total ("the total holds", "that's complete"). Say
  which parts synced and which failed, and let the numbers stand as reported. The same view's
  same-length `comparison` period can be shown side by side, but do not say the account is "up"
  or "down".
