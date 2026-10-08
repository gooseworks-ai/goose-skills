# Skills releases

**Summary.** Merge feature work to `dev` to publish the staging agent catalog. Promote tested changes to `main` to publish the production catalog, then update the public CMS and docs. GitHub CI validates the catalog before either deployment and waits for the Trigger run to complete.

| Branch | GitHub environment | Catalog source | Public CMS/docs |
|---|---|---|---|
| dev | staging | Exact merged dev commit | Unchanged |
| main | production | Exact merged main commit | Updated after catalog success |

## One-time setup

1. Deploy the environment-aware `sync-predefined-skills-catalog` worker in the main GooseWorks app Trigger project to staging and production before merging this workflow change. It must accept `sourceRef` and `sourceRevision`, reject branch/environment mismatches, and throw when a skill fails.
2. Create GitHub environments `staging` and `production`. Set `TRIGGER_SECRET_KEY` in each environment to its corresponding Trigger project/environment secret key. Do not use the personal deploy access token, local development key, or render-project key.
3. Restrict staging deployment to dev and production deployment to main. Require validation on PRs to both branches.
4. Keep `GOOSEWORKS_APP_REPO_TOKEN` and `GOOSEWORKS_APP_REPO` configured for the production CMS/docs dispatch.
5. Create the GitHub environment `npm-release`, limit its deployment branches to main, and move `NPM_TOKEN` into it. Make the check jobs (validate, atom-checks, part-tests, imessage-chat-browser-tests, media-tests) required on dev, main and video-merged, so a red check blocks the merge.
6. Merge the workflow change into main, then propagate it to dev. The initial main merge republishes the existing production catalog.
7. Retire old daily catalog schedules in Trigger.dev. The updated worker keeps the legacy task ID as a no-op until schedules are removed.

## Testing and recovery

Inspect the CI deployment job and Trigger run. A release is successful only when the task completes with zero failed skills. Fetch a changed skill from staging and production to verify isolation, including its source revision.

Superseded merge jobs fail before they start a sync. Deploy the newest successful CI run instead. If a full sync fails, it may have applied some per-skill writes; CI marks it failed. Fix the source or credentials and rerun the intended release. A revert must be merged to the affected branch to publish restored content.

The npm package release is the `npm-release` job in the same CI workflow. Like the catalog deploy, it runs only after every check passes, and only on main. It is separate from agent catalog publication and does not publish the GooseWorks CLI or switch its entry skills.
