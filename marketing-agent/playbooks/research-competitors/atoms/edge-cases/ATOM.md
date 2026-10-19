---
name: edge-cases
description: >-
  Hidden step of research-competitors. What to do when the run hits an edge: no browser, a browser waiting on approval, a stalled
  or stopped worker, facts carried from earlier research, a bad entry on the saved rival list, a report already
  saved today, a read that lands after the report. Loaded by SKILL.md; never listed.
---

# edge-cases

- **No browser at all** (hosted chat, a scheduled run): use the server's free ad sample for tracked rivals (`gooseworks:ads_template_read`, mode `competitor`) and whatever fetch can read. Say once, in the report's "In short", what couldn't be read and what it means for the answer; the paid top-up for it is a decision in the closing message, never a question before the report.
- **The browser waits on the founder's approval:** tell them in one line what it is for, move on with what you have, and list the page as couldn't-read. Never sit silent.
- **A worker stalls** for more than a few minutes: say so in one line. **A worker is stopped:** keep everything it returned or wrote; never throw read work away.
- **Facts from earlier saved research** (dates, figures, launches): re-check them, or mark them "from earlier research, not re-checked".
- **A saved rival that isn't one** (a person's account, a namesake, a dead company): drop it, and name it in the report so the founder can fix the list.
- **A report already saved today:** this run replaces it at the same path; the report opens "In short" with what changed since the earlier one — no preamble line. Rival records keep their previous snapshot.
- **A read lands after the report:** rewrite the whole report, top lines included. Never patch a section in.
- **Status notes are not questions:** one-line notes (the browser heads-up, a stalled worker, a serious risk) are fine before the report; questions are not.
