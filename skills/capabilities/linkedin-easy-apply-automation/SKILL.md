# LinkedIn Easy Apply Automation

Use this skill when a user wants an agent to search LinkedIn for relevant software engineering roles and submit Easy Apply applications with the current resume.

The agent should focus on remote or clearly acceptable software engineering roles, including web, full stack, frontend, backend, JavaScript, TypeScript, React, Node, generative AI, LLM, and agentic AI roles. It should skip roles that require local office attendance, hybrid attendance when the user wants remote, relocation, unclear compensation commitments, or custom screening questions that cannot be answered from known facts.

The agent should use a persistent browser profile for login, keep submission state so repeated runs are safe, and upload the current resume when the flow asks for one. It should answer only stable known facts and avoid inventing employment history, credentials, salary numbers, or location commitments.

Never store or print credentials. Use an already authenticated browser session or task scoped secrets only. The final report should include submitted title, company, and page when available, plus concise skip reasons for anything important.
