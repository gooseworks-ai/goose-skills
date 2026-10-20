---
name: email-lifecycle-flow-writer
description: >-
  Step of the email-lifecycle playbook: writes one lifecycle flow as a build sheet for the brand's
  email tool, every message finished in the brand voice. Run email-lifecycle instead; not for direct
  use.
version: 0.1.0
---

# flow-writer

**Reads:** the flow's entry in `../email-lifecycle/references/flow-library.md`; `../email-lifecycle/references/loadable-flow-format.md`; `../email-lifecycle/references/copy-craft.md`; `../email-lifecycle/references/worked-flows.md` (quality bar); `../email-lifecycle/references/sms-push-whatsapp.md` when the flow has those legs. From the brain: voice, banned words, signed-off claims, product records (price, offers, notes), learnings. From the program sheet: tool and plan, segments, priority map, cap, consent per channel. The standing offer from the shared `Standing offer:` fact. From the audit: the live flow this replaces, if any.

**Does:**
1. **Wire it first, in the tool's real syntax** (`loadable-flow-format.md`; when unsure of a tag, name the editor action instead of guessing). Check plan reality: no workflows → a fixed-date sequence becomes scheduled broadcasts with an exclusion list and the sign-up welcome becomes the form's autoresponder, written in the tool's terms (not tool-neutral); only a flow the plan cannot run even that way is said and written tool-neutral. Fill the flow header completely in the tool's own vocabulary: exact trigger name, trigger and flow filters, exit, re-entry, consent, smart sending, quiet hours, priority and suppressions, cap, UTM template, discount object (from offer-math), holdout, A/B test (winner on clicks or orders), build notes. A feature the plan lacks gets its workaround.
2. **Plan the messages.** Count and delays from the library, adjusted to this brand's price and cycle (say why if moved). Write one job per message before any copy. Check the sequence reads as a story, not five versions of the same email.
3. **Write each message finished.** Subject + 2 alternates, preview, from and reply-to, body blocks, one CTA with full URL, merge tags with fallbacks, dynamic blocks with out-of-stock behaviour, splits with a default branch, image needs with alt text (optional art requests as a line: `Graphic needed: for make-static-ads · header art: <flow, message, size, what it shows, alt text> · return to: lifecycle/flows/<flow-slug>.md`), a full plain-text version, footer, and the claim id or record behind each factual sentence. Vary length and shape across the flow. For B2B and services default to plain text from a named person.
4. **Self-check against `copy-craft.md` failure list.** Rewrite any hit.
5. **Leave honest gaps.** Anything the brain and the marketer have not settled stays a visible [placeholder] with its question at the top of the flow file, and the flow's status line reads `not ready: answer Q3, Q5`. A flow written against tracking-plan events reads `not ready: needs events E1–E3 live`; one the plan can't run even with that workaround reads `not ready: needs tool decision T1`. Only a flow with no open blocker is `ready to load` (with `· switch on after fix #N` while authentication is red or unknown); a header-art request never blocks it. Never invent a fact, an offer, a review, a count or an existing event name; events that do not exist yet go into the tracking plan (event, properties, when it fires, which flow) labelled "proposed — confirm with engineering", and the flow is written against those names.

6. **Hypothesis for this cycle.** One line per flow: what it should do and against which number (e.g. "abandoned checkout: ≥ 4% of recipients order within 7 days; baseline unknown"), the goal metric and when it will be read. Saved into `lifecycle/program.md` for the next run's read-back.
7. **Art answers.** On a re-run, read any `Graphic ready:` line under this flow's header-art `Graphic needed:` request and place the image.

**Writes:** `lifecycle/flows/<flow-slug>.md` (status line, hypothesis, header, then messages in order, then the open questions); what appears in chat follows SKILL step 8 — blockers in plain words, never the E/T/Q ids used in the files (`../email-lifecycle/references/flow-library.md` §4).
