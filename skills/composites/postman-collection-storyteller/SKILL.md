---
name: postman-collection-storyteller
description: >
  Add collection-level and folder-level narrative to a Postman or Bruno API workspace: workflow intent descriptions, variable setup stories, happy-path request ordering, edge-case request annotations, and pre/post-script explanations. Scoped to API workspace documentation narrative — not API reference docs (use openapi-docs-narrative) and not SDK quickstarts (use sdk-quickstart-hardening-guide). Use when a team has a working Postman collection but every folder is blank and every request is named by its HTTP method.
tags: [content]
---

# Postman Collection Storyteller

Write the narrative layer that makes an API collection actually useful for a developer seeing it for the first time. This skill covers collection-level context, folder-level intent, request ordering rationale, variable documentation, pre/post-request script explanations, and edge-case annotations.

**Built for:** API teams, DevRel engineers, and integration specialists who have a working Postman or Bruno collection but whose workspace reads like raw endpoint lists with no guidance on what to run, in what order, or why.

## Best Fit

- Postman collection descriptions (collection level, folder level, request level)
- Workspace README / overview documents
- Environment variable documentation inside collections
- Pre-request and post-request script comments
- Happy-path workflow sequencing explanations
- Edge-case and error-response request annotations
- Public Postman workspace pages for developer portals

## Use Something Else

- For full API reference documentation, use `openapi-docs-narrative`.
- For a runnable code quickstart, use `sdk-quickstart-hardening-guide`.
- For webhook event catalog, use `webhook-catalog-author`.

## Inputs

| Field | Required | Notes |
|-------|----------|-------|
| `collection_name` | Yes | Name of the Postman/Bruno collection |
| `api_name` | Yes | Name of the API |
| `api_description` | No | What the API does in 1-2 sentences |
| `folder_list` | Yes | List of folders and the requests inside each |
| `variable_list` | No | Collection or environment variables used |
| `auth_scheme` | No | How auth is configured in the collection |
| `known_workflows` | No | Key use-case flows the collection is meant to demonstrate |
| `pre_post_scripts` | No | Any pre/post-request scripts that need explanation |
| `existing_descriptions` | No | Any existing descriptions to improve |
| `audience` | No | Internal team, public developer portal, or enterprise partner |

## Phase 0 — Intake

Ask only for what is missing.

1. What is the collection called and what API does it cover?
2. What folders and requests are in the collection? (Paste the structure or describe it)
3. What are the 2-3 key workflows a developer would use this collection to complete?
4. What variables does the collection use? (base URL, API key, IDs, etc.)
5. Are there pre/post-request scripts that need explanation?

If the user pastes a collection structure, extract what you can before asking questions.

## Phase 1 — Collection Audit

Before writing anything, audit the collection structure against these quality criteria:

| Criterion | Good | Needs Work |
|-----------|------|-----------|
| Collection description | Explains purpose, audience, prerequisites | Blank or auto-generated |
| Folder descriptions | Explain workflow intent | Blank |
| Request names | Verb + resource (e.g., "Create User") | Method + path only (e.g., "POST /v2/users") |
| Request descriptions | Explain when and why, not just what | Blank |
| Variable documentation | Every variable explained with an example | Variables listed without description |
| Happy path ordering | Requests sequenced to mirror real-world flow | Alphabetical or random order |
| Edge cases annotated | Error responses have their own documented requests | Only success cases shown |

Produce an audit summary:

```
COLLECTION AUDIT — Gooseworks API

✗ Collection description: blank
✗ Folder "Users": blank description, 6 of 8 requests have no description
✗ Request names: 4 named by method/path only
✓ Variables: base_url and api_key defined with examples
✗ Happy path: requests not sequenced for onboarding flow
✗ Edge cases: no 401 or 429 example requests
```

Share the audit and confirm the scope of work before writing.

## Phase 2 — Collection-Level Description

```markdown
# [Collection Name]

This collection lets you explore and test the [API Name] API without writing any code.
It covers [the main resource areas / key workflows], is organized into folders by workflow,
and uses environment variables for all credentials and IDs.

## Who this is for

[Internal engineers testing integrations / external developers evaluating the API /
enterprise partners building their integration]

## Prerequisites

Before running requests in this collection:

1. **API key** — Set `api_key` in your active environment. [Get your key →](URL)
2. **Base URL** — Set `base_url` to `https://api.example.com` for production or
   `https://sandbox.api.example.com` for testing
3. **[Other prereq]** — [Describe it]

## Environments

| Environment | `base_url` |
|-------------|-----------|
| Production | `https://api.example.com` |
| Sandbox | `https://sandbox.api.example.com` |

## Workflow guide

Run the folders in this order for the recommended onboarding path:

1. **Authentication** — Get a token and confirm it works
2. **Users** — Create a test user you can reference in later requests
3. **Projects** — Create a project and attach it to your user
4. **Webhooks** — Register a webhook endpoint to receive events

Within each folder, requests are sequenced to mirror a realistic flow.
```

## Phase 3 — Folder-Level Descriptions

For each folder, write a description that explains the workflow intent and sequencing rationale.

### Folder Description Template

```markdown
## [Folder Name]

[One sentence on what this folder covers and what workflow it enables.]

Run the requests in this order for the complete flow:

1. **[Request name]** — [Why this comes first. What it sets up for subsequent requests.]
2. **[Request name]** — [What this does and what the response contains that you'll need later.]
3. **[Request name]** — [Continue the flow.]

The `[variable_name]` variable is automatically set by the post-response script in
"[Request name]" — you don't need to set it manually.

### Edge cases

Run these requests to test error handling:

- **[Request name]** — Tests the 401 response when the API key is invalid or missing.
- **[Request name]** — Tests the 429 response when the rate limit is exceeded.
```

### Folder Sequencing Rules

- Sequence requests in the order a developer would actually run them, not alphabetically
- If a request sets a variable used by a later request, call that out explicitly
- Include at least one edge-case request per folder for APIs that have clear error states
- Keep descriptions under 150 words per folder

## Phase 4 — Request-Level Descriptions

For key requests (especially any without a description), write a concise request description.

### Request Description Template

```markdown
Creates a new user account. Returns the user object including the `id` field, which
is used by the "Create Project" request in the Projects folder.

Set `role` to `admin` to test permissions-restricted endpoints.
```

### Request Naming Guide

If the collection has poorly named requests, suggest better names:

| Current name | Suggested name |
|-------------|----------------|
| `POST /v2/users` | `Create User` |
| `GET /v2/users/:id` | `Get User by ID` |
| `PATCH /v2/users/:id` | `Update User` |
| `DELETE /v2/users/:id` | `Delete User` |
| `GET /v2/users` | `List Users` |
| `POST /v2/auth/token` | `Get Access Token` |

Rules:
- Use `Verb + Resource` for CRUD requests
- Use `Resource + Qualifier` for specialized endpoints: "List Users by Team", "Get User Sessions"
- Avoid HTTP method names in the display name

## Phase 5 — Variable Documentation

Write a variables reference table for the collection README or the collection-level description.

```markdown
## Variables

Set these in your Postman environment before running requests:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `base_url` | Yes | API base URL | `https://api.example.com` |
| `api_key` | Yes | Your API key from the dashboard | `sk_live_abc123` |
| `user_id` | Auto-set | Set by "Create User" post-response script | `usr_01abc` |
| `project_id` | Auto-set | Set by "Create Project" post-response script | `proj_01abc` |

Variables marked **Auto-set** are populated by post-response scripts —
you do not need to set them manually if you run the requests in order.
```

## Phase 6 — Pre/Post-Script Explanations

If the collection has pre-request or post-response scripts, annotate them with inline comments.

### Pre-request script example

```javascript
// Generate a unique idempotency key for this request.
// This prevents duplicate records if the request is retried.
const key = pm.variables.replaceIn('{{$guid}}');
pm.request.headers.add({ key: 'Idempotency-Key', value: key });
```

### Post-response script example

```javascript
// Store the new user's ID as a collection variable.
// Subsequent requests in the "Projects" folder use {{user_id}} automatically.
const response = pm.response.json();
pm.collectionVariables.set('user_id', response.data.user.id);
```

Script annotation rules:
- One comment per logical action, not per line of code
- Explain the *why*, not the *what*
- If a script sets a variable used by other requests, say which requests use it

## Phase 7 — Public Workspace Page

If the collection will be published to a public Postman workspace, write a workspace overview:

```markdown
# [API Name] — Official Postman Collection

Explore the [API Name] API without writing code. This workspace includes:

- **[N] requests** covering [resource list]
- Sequenced workflows for the most common integration patterns
- Edge-case requests for error handling testing
- Environment templates for production and sandbox

## Get started

1. Fork this collection into your Postman workspace
2. Create an environment using the "Gooseworks Sandbox" template
3. Set `api_key` to your API key from [the dashboard →](URL)
4. Run the **Authentication** folder first to confirm your credentials work

## Feedback

Found a bug or missing example? [Open an issue →](URL)
```

## Phase 8 — Output

Deliver:
1. Audit summary
2. Collection-level description (full)
3. Folder descriptions for every folder
4. Request descriptions for requests with none or poor descriptions
5. Variable reference table
6. Pre/post-script annotations (if applicable)
7. Request renaming suggestions (if applicable)
8. Placeholder URLs list

## Guardrails

- Do not invent API behavior not described by the user or inferable from request/response shapes
- Do not rename requests without explicitly labeling the suggestions as recommendations
- Do not write public-workspace copy that promises more than what is in the collection
- Mark all placeholder URLs with `[URL: description]`
- If the collection has no edge-case requests, recommend adding them rather than pretending they exist
