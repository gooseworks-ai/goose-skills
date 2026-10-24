# Releasing the skills catalog

**In short**
- **`dev` is staging, `main` is production.** A merge to `dev` publishes the staging catalog. A merge to `main` publishes the production catalog, then updates the public skills site and docs, then releases the npm package.
- **A `main` merge reaches every customer.** The production catalog is what the GooseWorks app serves, what `gooseworks install` and `gooseworks update` install (they read `skills-index.json` on `main`), and what the GooseWorks plugin loads (its marketplace points at `skills/entry/` on `main`). A change to an entry skill on `main` changes every customer's entry skills at once.
- **So test on staging first.** Merge to `dev`, check the change on staging, then promote `dev` to `main`.
- Nothing deploys unless all five checks pass: every release job waits for them.
- **Nothing blocks a merge yet.** `dev` and `main` have no branch protection and no ruleset, so a pull request with a red check can still be merged; it then just doesn't deploy. The npm release has also failed on every push to `main` since 16 Oct. Both need the owner: see [Owner setup needed](#owner-setup-needed).

## The two branches

| Branch | Environment | What publishes | Who sees it |
|---|---|---|---|
| `dev` | staging | The staging catalog, synced from the exact merged `dev` commit | The staging app and the staging MCP server (`gooseworks-staging`) |
| `main` | production | The production catalog from the exact merged `main` commit; then the public skills site and docs; then the npm package | Every customer: the app, the production MCP server, `gooseworks install` / `update`, the plugin, `npx goose-skills` |

Feature PRs go into `dev`. A release is a PR from `dev` into `main`.

## How a release runs

All of it is in `.github/workflows/ci.yml`.

1. **Checks** run on every pull request and on every push to `dev` or `main`: `validate`, `atom-checks`, `part-tests`, `imessage-chat-browser-tests`, `media-tests`.
2. **`deploy-catalog`** runs on a push to `dev` or `main`, only after every check passes. It starts the `sync-predefined-skills-catalog` task in the GooseWorks app's Trigger.dev project for that environment, passing the branch and the exact commit, and waits for it to finish. It fails if any skill fails to sync.
3. **`dispatch-public-sync`** (`main` only, after the catalog succeeds) asks the GooseWorks app repo to rebuild the public skills site and docs.
4. **`npm-release`** (`main` only, after every check passes) opens or updates the changesets release PR, or publishes the `goose-skills` npm package when that PR merges. It does not publish the GooseWorks CLI. **It fails today** ("No NPM_TOKEN or OIDC available"), because nothing gives it npm credentials. The catalog, site and docs still release, since they don't wait for this job; only the npm package is stuck.

## Test an entry-skill change on staging first

Entry skills are the riskiest change: on `main` they switch for every customer at once.

1. **Before you merge:** raise the skill's `version` (SKILL.md and skill.meta.json) and the plugin `version` in both `skills/entry/.claude-plugin/plugin.json` and `skills/entry/.codex-plugin/plugin.json`. Run `npm run ci`.
2. **Try the files locally.** Copy the changed `skills/entry/<slug>/` folder over the installed copy in your agent's skills folder (for Claude Code, `~/.claude/skills/<slug>/`), restart the agent and run the asks the change is for. Afterwards, run `npx gooseworks@latest update` to restore the released copy.
3. **Merge to `dev`.** Wait for `deploy-catalog` to pass. Then check the change through the staging app, or through an agent connected to the staging MCP server (`catalog_fetch` returns the synced skill and its source revision).
4. **Promote `dev` to `main`.** After the production catalog syncs, run `npx gooseworks@latest update` in a test agent and check the installed version. Plugin users get the change on their next plugin update, because the plugin version rose.

The GooseWorks CLI has its own staging release (`gooseworks@next`); see `docs/staging-and-releases.md` in the `gooseworks-ai/gooseworks` repo.

## Checks and merges today

- **CI runs five checks** on every pull request and push: `validate`, `atom-checks`, `part-tests`, `imessage-chat-browser-tests`, `media-tests`.
- **They don't block merges.** Neither `dev` nor `main` is protected, and the repository has no rulesets. Read a pull request's checks before you merge it.
- **They do block releases.** `deploy-catalog` and `npm-release` run only when all five pass.

## Owner setup needed

These are repository and npm settings, so only the owner can change them.

1. **A ruleset that makes the checks required.** Target `dev` and `main`. Require a pull request before merging, and require these status checks to pass: `validate`, `atom-checks`, `part-tests`, `imessage-chat-browser-tests`, `media-tests`. Then a red check really blocks the merge.
2. **npm credentials for `npm-release`.** Pick one:
   - **npm trusted publishing (no stored token).** On npmjs.com, add this repository's `ci.yml` workflow and the `npm-release` environment as a trusted publisher of the `goose-skills` package. In `ci.yml`, add `id-token: write` to the `npm-release` job's `permissions`.
   - **A token.** Create an npm automation token for `goose-skills` and store it as the `NPM_TOKEN` secret of the `npm-release` environment.
   
   Either way, also limit the `npm-release` environment to `main` (it has no branch policy today).

## Settings this depends on

| Setting | Where | What it is |
|---|---|---|
| `TRIGGER_SECRET_KEY` | GitHub environments `staging` and `production` | The secret key of that environment in the app's main Trigger.dev project. Staging deploys are limited to `dev`, production to `main`. |
| `GOOSEWORKS_APP_REPO_TOKEN`, `GOOSEWORKS_APP_REPO` | Repository secrets | Let `dispatch-public-sync` reach the app repo. |
| `NPM_TOKEN` | GitHub environment `npm-release` | **Not set today.** The `npm-release` job reads it to publish the npm package. The environment has no secrets and no branch policy; see [Owner setup needed](#owner-setup-needed). |

## When something fails

- **A release counts only when the Trigger task completes with zero failed skills.** Open the `deploy-catalog` job log and the Trigger run it names.
- **A failed sync may have written some skills.** Fix the source or the credentials, then rerun the release for that branch.
- **A superseded release stops before it syncs.** When a newer merge landed on the branch, the older run fails with "Release was superseded". Rerun the newest successful CI run instead.
- **To undo a change, merge a revert** to the affected branch. The revert publishes the restored content like any other change.
- **Check what an environment serves:** fetch a changed skill from staging and from production (`catalog_fetch`) and compare its source revision with the commit you expect.
