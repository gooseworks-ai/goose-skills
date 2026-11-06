# Revenue playbooks

Ready-to-run checks that find revenue leaks and growth plays in an online store. Each one says which tools to connect to an AI assistant, the exact prompt to ask, and what to do with the answer. They are published at **https://gooseworks.ai/playbooks**.

- **One file per playbook**: `<slug>.md`. All fields live in the YAML frontmatter; the file name must equal the slug.
- **Tools**: `tools.yaml` names every tool a playbook can use. `hub: true` gives a tool its own page at `/playbooks/tools/<slug>`.
- **Index**: `playbooks-index.json` is generated. After any edit run `npm run build:playbooks`; CI runs `node scripts/build-playbooks.js --check`.
- **Publishing**: merging to `main` triggers the gooseworks-app "Goose Skills Sync" workflow, which pushes the index into the skills CMS (`push-playbooks-to-cms.cjs`).

## Fields

| Field | What it holds |
|---|---|
| `slug` | URL, phrased the way people search the problem (leaks) or goal (plays) |
| `kind` | `leak` (something broke or wastes money) or `play` (a chance to grow) |
| `outcome` | `stop`, `get`, `convert`, `more` or `keep` |
| `title`, `seo_title`, `meta_description` | Page title, search title (≤ 60 chars), search snippet (≤ 155 chars) |
| `hook` | One line that names the money problem |
| `answer` | 40–60 word answer an AI assistant can quote whole |
| `tools` | Keys from `tools.yaml` |
| `ask` | The exact prompt |
| `then` | What to do with the answer |
| `steps` | 4–6 steps, end to end |
| `example` | What it tends to find. **Illustrative only** |
| `check` | The innocent explanation to rule out first |
| `cadence`, `start`, `faq`, `related`, `updated` | How often to run it, start-here flag, 3–5 FAQs, related slugs, last edit date |

## Rules

- **No real store, client or person names**, ever. `scripts/check-client-names.js` enforces it.
- **No invented statistics.** Numbers are examples and say so.
- **No product claims.** These pages teach a method; they don't sell anything.
- Plain words, short sentences. The build rejects hype words.
