---
name: sdk-onboarding-check
description: Replay an SDK or CLI quickstart to identify what prevents a new user from reaching the first useful result. Use when improving developer activation or onboarding documentation; produces observed setup failures, a prioritized fix list and a corrected quickstart grounded in an actual run.
---

# SDK onboarding check

Find the first point where the published quickstart stops a new user from getting a useful result.

## Define success before running

Identify the intended reader, documented product version, supported runtime and first useful outcome. Distinguish a process starting from the result the reader came for, such as a parsed response, generated file or completed local example. Use the user's chosen workflow; otherwise take the first complete workflow in the quickstart. When no invocation is shown, use the minimum invocation implied by the example, keep its defaults and label that invocation as your choice.

Record the source revision or retrieval date. Use a fresh temporary workspace so existing dependencies, credentials and generated files do not silently repair missing instructions. Keep the user's current project and global configuration intact. Stay within the task's existing permissions for network access, credentials and paid services.

## Replay the published instructions

Run the documented steps as written until success or the first blocking failure. Record each step's actual output and exit status. Do not quietly insert a missing prerequisite and call the original instructions successful.

Classify a failure before proposing a fix:

- A documented requirement missing from this environment is an environment blocker.
- A required but undocumented setup step is a documentation gap.
- A documented, supported configuration that fails may be a product defect.
- An unavailable external service or denied request is inconclusive for local product correctness.

Stop a run that needs unavailable access or would exceed the user's resource budget. Record what would be needed to resume; do not substitute an unrelated service or version and present that as the original test.

## Verify one correction

For a reproducible documentation gap, make the smallest correction in the temporary workspace and replay the affected path. Keep the original failure and corrected result distinguishable. Check that the correction reaches the useful outcome rather than merely suppressing the error.

Treat a product defect as a separate engineering item. Do not hide it behind a quickstart workaround that changes the requested behavior. If another blocker prevents verification, leave the correction marked unverified.

## Deliver the onboarding evidence

Provide the tested version and environment, the defined success result, and a table of documented steps, observed outcomes, causes and verification status. Rank fixes by whether they block the first useful result, then by evidence of recurrence. An observed delay is not evidence of lost customers or a conversion percentage.

Supply a corrected quickstart containing only the changes supported by the replay. Include exact commands and output in that deliverable. If recording time, separate wall-clock time from active work and identify dependency downloads or service waits. Close with the next unresolved blocker, if any, rather than claiming the entire onboarding experience is validated.
