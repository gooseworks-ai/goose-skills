# Paths, gates and hosts

Load at Steps 4, 6 and 7. The live tool answers and their `next_step` are the truth for tool order and wording; the overrides in SKILL.md "Hard rules" #7 (including the chat-host routes) are the only exceptions.

## 1. Two production paths

| | Ready-made style | Custom (reference remix, owned-footage cut, or the marketer's own brief) |
|---|---|---|
| Start | `video_formats` → marketer picks → `video_create` `style` (+ `name`) | `video_references` `pick`, or `video_create` `style: "custom"` with `request`, `reference_url`, `idempotency_key` |
| Shape | Fixed by the style: 9:16, its own scene count and length range (read the template with `catalog_fetch` `type: "template"`) | `brief.ratio`, `brief.duration_seconds` |
| Script | `video_change` `candidates` (4–5, same angle type, different hook families) | `video_change` `custom.draft` (timed scenes, creative contract, shot list priced Standard vs Best) |
| Reference | — | Watched (playback, or timed frames + transcript) before planning |
| Spend gates | **One:** the plan's price → `video_approve` `quote_id` + `quoted_credits` | **Two:** script (`custom.phase: "script"`) — this yes already pays for presenter stills and voice auditions — then ingredients (`phase: "ingredients"`); each with the marketer's own words in `user_quote` and the `total_credits` from the approval quote |
| Hosts | Shell and chat | Shell only (needs a verified shell; the server never runs it in the cloud) |

Both: the final video comes back for the human's keep/reject (`video_review`) — not a spend gate. Every fix (`video_fix`), variant (`video_batch` / `video_create` `like`) and extra ratio or length is priced and needs its own yes.

## 2. Money rules

- Credits exactly as printed; never dollars; never your own arithmetic.
- The engine treats a somewhat higher newer plan as covered by the earlier yes and may tell you to re-approve silently. **This playbook does that only when the words, claims, people and music are unchanged**; any change is shown first.
- At each phase compare committed with approved; `budget_exceeded` → stop and ask. If the recipe and the card disagree on credits spent, report the card's figure and mention the mismatch.
- Re-dos: targeted (one scene, the voice, the music), never a full re-render; only for a defect the human confirmed; at most two rounds.
- Before recommending a style, show its price band as the style list gives it next to the balance; a hook test's price is shown only once the engine quotes it.

## 3. Hosts

| | `shell: true` (Claude Code, Codex, Cursor) | `shell: false` (Claude.ai, ChatGPT) |
|---|---|---|
| Routes | Styles, reference remix, owned-footage cuts | Ready-made styles only; references as structure inspiration ("remaking that exact ad needs the desktop or terminal app") |
| Precondition | — | `account_whoami` `coworker_enabled` |
| Uploads | `media_upload` `file` (presigned) for large clips | `bytes` up to ~8 MB; larger files: the human uploads in the GooseWorks app library, then `media_search` finds them |
| Make | `video_make`'s next step runs here (the gate question says the video maker will be set up on their computer) | The GooseWorks coworker makes it; tell the human it will appear here and end the turn; on return find it with `video_read` |
| Review | `video_read` + `media_analyze` on the render; you may also download and view frames | `video_read` + `media_analyze` on the render |
| Never | Show a make command the app starts itself | Ask the human to install or run anything |

## 4. Cards vs the gate content

The server draws plan and review cards and asks for one short line while a card is on screen; without cards it asks you to print `card.text_summary` as it is. So: check the candidates and post the trace, cuts, people and risks **before** the call that draws the plan card (Step 5 checks them before saving); after it, add only what the card does not show. Never print the script a second time. Mention the other saved scripts only when asked.

Phrase honesty in outcomes, not tool names: "I couldn't watch the video here; the automatic read shows the line about Full Clarity over a shot of the mist at 0:21 — please check."

## 5. The gate, in order

1. One-line pitch: placement, the length and ratio it will actually be, angle (type, `A-NN`) and why.
2. The saved script in scene order — times only where the plan carries them (custom drafts), otherwise "about N seconds in total" — plus the end-card and grid text as it will render (the style's `answers` such as tagline and offer, and the brand CTA).
3. Claim trace and cut list, and how each engine warning was resolved (engine advice that breaks policy is named and ignored).
4. Source trace: angle → bank row / customer quote / labelled brand source; reference → what is kept and what changes.
5. Real vs generated; who speaks as whom (speaker test); disclosures planned.
6. Up to three risks and taste calls.
7. **Lead only, or lead + 2 hook variants** — the shared body once, each variant's hook words, and the lead's and the batch's quotes exactly as given, never added together (`atoms/present-gate/ATOM.md` 2b).
8. The question, built from the answer's required sentences: the price as printed and what the yes covers ("your yes covers up to N credits if the price shifts"), the voice, on custom the data-sharing sentence word for word and what the script-phase yes spends now, on a shell host that the video maker will be set up on their computer.

## 6. Names

Every video (lower-case): `<product>_<a-nn or angle_type>_<hook_family>_<ratio>_<yyyy-mm-dd>` (the same format as `reading-the-brain.md` §6) — set `name` on `video_create` or `video_change` (batch videos: `video_change` per project; `video_batch` takes no per-video name). analyze-performance attributes results by it.
