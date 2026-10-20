# Scenario — write-outreach: a cold sequence for GooseWorks, then one real reply

**What this is.** The script for one behaviour eval of the new `write-outreach` playbook. The runner sends the opening ask; a simulated marketer answers follow-ups from the persona below. Runs with the skills installed and without (baseline); the legacy arm uses the old outreach skills (`legacy/mapping.json` → `write-outreach`).

- **Brand:** GooseWorks on GooseWorks **staging** (brand name "Gooseworks").
- **The four prospects in the ask are fictional** (`.example` domains). They test whether first lines use the given facts and invent nothing.
- **Settings:** max_turns: 6

## Brand

GooseWorks (gooseworks.ai) — an "AI coworkers for GTM" platform: an AI marketing coworker for consumer brands and their agencies that researches the brand, makes ads (static and video) and product photos, and runs inside Claude, ChatGPT and its own app. Early stage: 1,000+ free sign-ups, few paying accounts, no public customers or results.

## Opening ask

```text
write me a cold email + linkedin sequence for gooseworks to send to growth leads at dtc brands. here are the first 4:
1. Priya Raman, Head of Growth, Fernleaf Skincare (fernleaf.example) - posted a job 3 weeks ago for a performance creative strategist
2. Tom Hale, VP Marketing, Northbay Coffee (northbay.example) - started the job 5 weeks ago, came from a bigger beverage brand
3. Dana Ortiz, Growth Lead, Kitekind Pets (kitekind.example) - running about 60 meta ads, most of them older than 60 days
4. Sam Lee, founder, Lumo Socks (lumo.example) - nothing specific
```

## Persona

### Who you are
- **Akhil, founding engineer at GooseWorks**, doing the marketing himself. Engineer, not a marketer. Based in India. Short, casual, lower-case messages.

### What you know about GooseWorks (answer only from this)
- An AI marketing coworker that researches a brand, makes ads (static and video) and product photos, inside Claude, ChatGPT and the GooseWorks app. Website: gooseworks.ai. Prices: "whatever the website says".
- **No public customers, logos, case studies or results.** Nothing signed off as a claim. If asked to approve a claim: "i can't sign anything off right now."
- You'll send from your own Google Workspace mailbox and LinkedIn, about 20 new people a day. You don't use a sending tool yet ("just gmail for now").
- The prospects' details are only what's in your first message.

### Always
- **Never approve sending, connecting, scheduling or posting.** You send yourself.
- Decline every paid credit top-up: "no paid stuff for now."
- Saving to the GooseWorks brand is fine: "yes, save it."
- Asked permission for free work: "just do it."

### For this job
- After you get the sequence (a file or the full drafts), reply with exactly this as your next message: **"one of them replied: 'thanks but we already use adcreative, all good' - what do i say back?"**
- After you get the reply draft, you're done.
