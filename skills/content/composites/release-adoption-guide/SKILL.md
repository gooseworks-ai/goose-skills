---
name: release-adoption-guide
description: Turn an SDK or CLI release into an upgrade guide and launch copy with source citations and a runnable before-and-after example. Use when a developer product has shipped a release and needs to explain who should upgrade, what changes in their code, and how to verify the result.
---

# Release adoption guide

Help an existing user decide whether to upgrade and complete one useful workflow with the new version.

## Establish the release boundary

Use the requested starting version, target version, audience and workflow. If the workflow is unspecified, choose the first useful result from the project's quickstart and state that choice. Record the exact versions and source revisions. A merged change, an unreleased branch and a published package are different evidence; establish which one the reader can actually obtain.

Read the release notes, migration guidance and relevant public API documentation. Compare the implementation or tests when those sources disagree. Do not turn a proposed feature into a shipped capability. Flag an unresolved discrepancy beside the affected claim rather than guessing.

## Prove the adoption path

Build the smallest example that demonstrates the chosen workflow on the starting version in a fresh temporary workspace. Adapt that example for the target version in a second fresh temporary workspace. Both runs must stay within the user's execution permissions and leave the original project, dependencies and lockfiles unchanged. Record prerequisites, actual output and the change needed to preserve the intended result.

Keep the baseline and adapted runs separate. If the old example fails on the new version, preserve that failure as migration evidence. If execution is unavailable, label the example as unexecuted and distinguish its expected output from observations. Do not report a successful upgrade from a source comparison alone.

Check whether the example depends on an optional feature, a particular runtime or a paid service. Put the relevant condition at the step where the reader needs it. Keep unrelated refactors out of the example.

## Write from the evidence

Deliver a compact upgrade guide containing:

- Who benefits from the release and whether the chosen workflow needs a code change.
- Exact prerequisites and the old and new examples.
- The result that confirms the migration worked, with observed failures and their verified remedies.
- Version-specific limitations and links to the supporting release and API sources.

Then draft the requested launch copy around the demonstrated user benefit. A new capability can support a benefit claim; it does not establish faster performance, lower costs or higher conversion. Include those comparisons only when equivalent measurements were actually supplied or run.

Attach a small claim table mapping each material launch claim to its version, source and test evidence. Remove any claim that the table cannot support. Keep draft copy separate from validation notes so the reader can publish the copy without accidentally publishing internal diagnostics. Follow the user's instructions for publication.
