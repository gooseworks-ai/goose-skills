# Promote Skill

Use this skill when a user wants to publish a public agent skill across source hosts and skill marketplaces.

The agent should start by validating that the skill source is safe for public release. It should remove credentials, cookies, private paths, personal secrets, one off session details, and any private operational data. Environment variable names and setup descriptions are acceptable when they do not include real values.

Next, create a public source location and marketplace listing where authenticated access is available. Prefer a repository when a marketplace indexes repositories, and a direct raw skill file when a marketplace imports a file. For marketplaces that require review, account approval, wallet connection, or a pull request, prepare the submission package and complete the account or review flow when the user has authorized it.

The final report should separate published pages from submitted for review pages and blocked destinations. Do not claim worldwide publication when a platform still needs account approval or manual review.
