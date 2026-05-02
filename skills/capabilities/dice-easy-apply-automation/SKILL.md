# Dice Easy Apply Automation

Use this skill when a user wants an agent to find relevant remote technology roles on Dice and submit Easy Apply applications with conservative rules.

The agent should prefer remote software engineering, web engineering, full stack, frontend, backend, JavaScript, TypeScript, React, Node, generative AI, LLM, and agentic AI roles. It should avoid roles that clearly require hybrid attendance, local office presence, relocation, unverifiable custom answers, or unrelated seniority and domain requirements.

Before applying, the agent should verify that the resume and optional cover letter are current, confirm work authorization answers are consistent with the user profile, and keep an idempotent record of jobs already submitted. It should treat unclear questions as a skip condition rather than guessing.

Use a persistent browser profile when login is required. Never store credentials in the skill file, source repository, logs, screenshots, or final report. If credentials are needed, the agent should request them through the active secure task channel or rely on an existing authenticated session.

Report submitted roles with company, title, and job page. Report skipped roles only when the skip reason is useful for future tuning.
