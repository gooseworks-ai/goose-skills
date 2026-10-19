# Scenario — research-audience (list mode): 50 right-fit people for GooseWorks

**What this is.** The script for one behaviour eval of research-audience's **list mode**, the job old lead-gen users came for. The 19 Oct audience scenario always declined the list, so this mode had never been tested. The runner sends the opening ask; a simulated marketer answers follow-ups from the persona below. Runs with the skills installed and without (baseline); the legacy arm uses the old lead-gen skills (`legacy/mapping.json` → `research-audience-list`).

- **Brand:** GooseWorks on GooseWorks **staging** (brand name "Gooseworks").
- **Source of the ask:** how the router and the old library describe the job ("find 50 right-fit people with emails"), on the brand Akhil hand-tests.
- **Settings:** max_turns: 8

## Brand

GooseWorks (gooseworks.ai) — an "AI coworkers for GTM" platform: an AI marketing coworker for consumer brands and their agencies that researches the brand, makes ads (static and video) and product photos, and runs inside Claude, ChatGPT and its own app. Early stage: 1,000+ free sign-ups, few paying accounts, no public customers or results.

## Opening ask

```text
find me 50 right-fit people to pitch gooseworks to, with emails. growth or marketing leads at consumer brands that run a lot of meta ads
```

## Persona

### Who you are
- **Akhil, founding engineer at GooseWorks.** You do the company's marketing yourself. Engineer, not a marketer. Based in India.
- Short, casual, lower-case messages; no jargon.

### What you know about GooseWorks (answer only from this)
- An AI marketing coworker that researches a brand, makes ads and product photos, inside Claude, ChatGPT and the GooseWorks app. Website: gooseworks.ai.
- Who it's for: marketers, growth leads and founders at fast-growing consumer brands, and the agencies that serve them.
- **More than 1,000 free sign-ups**; a few paid, then cancelled. No public customers, logos or results. Nothing signed off as a claim.
- Rivals you've heard of: Pencil, AdCreative.ai, Creatify, Arcads.
- You'll send the emails yourself from your own Google Workspace mailbox, about 20 a day. You have no email checker tool.
- Geography: "US and UK mostly, anywhere english is fine".

### Always
- **Decline every paid credit top-up or paid read:** "no paid stuff for now, use what you found free."
- **Never approve sending, posting, scheduling or launching.** You'll send yourself.
- Saving to the GooseWorks brand is fine: "yes, save it."
- Asked permission for free work: "can't you just do it on your own? go ahead."
- Asked to approve the fit definition before seeing any list: "show me the list first."

### For this job
- You want **named people at real companies, with a way to reach each one, and a reason each fits** — ideally emails.
- If asked for a customer list or CRM export to exclude: "we don't have a crm. no one to exclude except our competitors."
- If asked how many you can work a week: "about 100."
- If offered help writing the messages afterwards: "yes later."
- If it delivers fewer than 50 and says why, that's fine. If it asks whether to go deeper on free work: "just do it."
