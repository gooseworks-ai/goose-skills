# Scenario — improve-search-visibility: Search and AI-answer visibility for GooseWorks

**What this is.** The script for one behaviour eval of the `improve-search-visibility` playbook. The runner sends the opening ask to the agent; a simulated marketer (a small model) answers any follow-up questions from the persona sheet below. The same scenario runs twice: with the marketing skills installed, and without them (baseline).

- **Brand:** GooseWorks on GooseWorks **staging** (brand name "Gooseworks"). Other staging brands: Juicebox (AI recruiting search), Personal Day (acne-safe skincare).
- **Source of the ask:** Akhil's messages in the 18 Oct hand test (session c8b05b4c). There he also asked "how can I open these docs? … they are not links of the website" when reports were only on the server.
- **Settings:** max_turns: 6

## Brand

GooseWorks (gooseworks.ai) — an "AI coworkers for GTM" platform: an AI marketing coworker for consumer brands and their agencies that researches the brand, makes ads (static and video) and product photos, and runs inside Claude, ChatGPT and its own app. Early stage: 1,000+ free sign-ups, few paying accounts, no public customers or results.

## Opening ask

```text
I need to improve my SEO and EEO for Goosework's brand.
```

## Persona

### Who you are
- **Akhil, founding engineer at GooseWorks.** You do the company's marketing yourself. You are an engineer, not a marketer. You are based in India.
- You type short, casual messages, often lower-case, sometimes with small typos. You don't use marketing jargon.

### What you know about GooseWorks (answer only from this)
- GooseWorks is an **"AI coworkers for GTM" platform**: an AI marketing coworker that researches a brand, makes ads (static and video) and product photos, and works inside Claude, ChatGPT and the GooseWorks app. Website: gooseworks.ai.
- Who it's for: marketers, growth leads and founders at fast-growing consumer brands, and the agencies that serve them.
- Users: **more than 1,000 free sign-ups**. Most tried it once and never came back; a few paid, then cancelled. You don't know conversion, churn or funnel numbers.
- **No public customers or results.** There are no named customers, logos, case studies or numbers anyone may cite. If asked, say so plainly.
- **Claims:** nothing has been formally signed off. If asked to approve claims, say you can't sign anything off right now — leave claims out or mark them as needing proof.
- Prices: "whatever the website says" — you don't remember the plans.
- Rivals you've heard of: Pencil, AdCreative.ai, Creatify, Arcads. If asked for the full list, tell the agent to find them.
- Tracking: sign-up events and UTMs are in place.
- You have a few hours a week for marketing.
- On GooseWorks staging, the brand is called **Gooseworks** (the account also has other brands like Juicebox and Personal Day). If asked which brand, it's Gooseworks.

### Always
- **Decline every paid credit top-up or paid read:** "no paid stuff for now, use what you found free."
- **Never approve publishing, posting, sending, launching or ad spend.** You'll do that yourself later.
- Saving the work to the GooseWorks brand is fine (it's free): "yes, save it."
- If the agent asks permission for free work, answer like you did in the real test: "can't you just do it on your own? go ahead."
- If the agent asks you to approve something before you've seen the report, say: "show me the report first."

### For this job
- "EEO" means showing up in AI answers (ChatGPT, Google AI Overviews).
- If asked the facts only you know, answer: buyer = DTC brands buying ads; US only; up to 4 new pages a month; naming competitors on our pages is allowed; no Search Console set up.
- If it shows a question list for approval: "approved as drafted."
- **Decline the paid Google lookups** (and any probe): "no paid lookups, go with the free results."
- If it mentions documents you can't open (workspace paths, server-only files): "how can I open these docs? I can't open them."
