---
name: research-competitors-edge-cases
description: >-
  Step of the research-competitors playbook: rules for run edge cases such as no browser, stalled
  workers, earlier reports and late reads. Run research-competitors instead; not for direct use.
version: 0.1.0
---

# edge-cases

- **No browser at all** (hosted chat, a scheduled run): use the server's free ad sample for tracked rivals (`gooseworks:ads_template_read`, mode `competitor`) and whatever fetch can read. Say once, in the report's "In short", what couldn't be read and what it means for the answer; the paid top-up for it is a decision in the closing message, never a question before the report.
- **The browser waits on the founder's approval:** tell them in one line what it is for, move on with what you have, and list the page as couldn't-read. Never sit silent.
- **A worker stalls** for more than a few minutes: say so in one line. **A worker is stopped:** keep everything it returned or wrote; never throw read work away.
- **Facts from earlier saved research** (dates, figures, launches): re-check them, or mark them "from earlier research, not re-checked".
- **A saved rival that isn't one** (a person's account, a namesake, a dead company): drop it, and name it in the report so the founder can fix the list.
- **An earlier report on this brand exists:** decide on purpose, and say which in one line — in chat and in the report's first "In short" bullet. Newer than 7 days and the ask doesn't say "fresh" or "update": **reuse** it as the base — re-check only what moves (news, launches, prices, the conversation) and deliver a what-changed report; never re-deliver it untouched. Older, or the founder asks for a fresh look: **refresh** in full. A report from today is replaced at the same path. Never treat a saved report's facts as checked without re-checking the ones the new report leads with.
- **A read lands after the report:** rewrite the whole report, top lines included. Never patch a section in.
- **Status notes are not questions:** one-line notes (the browser heads-up, a stalled worker, a serious risk) are fine before the report; questions are not.
