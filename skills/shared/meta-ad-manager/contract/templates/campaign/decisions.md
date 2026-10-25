---
campaign: <slug>
---
<!--
ads/campaigns/<slug>/decisions.md — append-only log of what Goose recommended and what the
user decided. Every stage appends; nothing is ever edited or removed, with ONE exception: an
entry written with `- Outcome: pending` gets its Outcome line filled in once the result is
known. Read the file, add the new entry at the END (or fill that one line), write it all back.

Entry shape (dates never go backwards):

### YYYY-MM-DD — <short title>
- Recommended: <what Goose proposed and why, one or two sentences>
- Evidence: <pointer: report:<id>, push:<id>, finding:<id>, or "user request">
- Decided: <who decided what, e.g. "Dana approved">
- Outcome: pending | <what happened; a measured result goes on an Observed: line, see RULES.md>

When this file nears 48 KB, move closed entries (outcome known) verbatim to
decisions-archive.md in the same folder, oldest first.
-->

# Decisions — <campaign name>
