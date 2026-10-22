---
name: make-static-ads-concept-grid
description: >-
  Step of make-static-ads: compare sourced purchase reasons, personas, proof and visual premises before choosing the ads. Run make-static-ads instead; not for direct use.
version: 0.5.0
---

# concept-grid

**Read:** the request, bounded source coverage and evidence in run.json; `../make-static-ads/references/workflow.md` is the record contract. **Write:** candidate reasons, selected ad rows and selection review in that same record.

1. Gather reasons in source order: approved campaign, angle bank, winners/rotation, customer language, usable product/brand facts, marketer's words, observed own ads/social topics, category research, labelled kit fallback. Missing customer bank → inspect public product reviews as insight/hook sources. A hypothesis may propose a scene; proof of its purchase reason remains separate.
2. Draft at least twice the selected reason count from at least three actual source types. Each names the persona/source and proof/source/status, plus why that proof supports this reason. Compare against checked own ads/history; preserve partial coverage. Missing grounded reasons → stop for research, the user's reasons or a smaller justified set. Avoid inventing reasons to meet a quota.
3. Score the five gate checks with reasons: specific supported promise, usable proof/demonstration, phone-size hook, three-second message and persona fit. Fix or reject any failure. Keep the rejected candidates and why. `creative-taxonomy.md` is optional craft/examples when a gate or diversity decision is unclear.
4. For each selected ad, develop an exact brand/product fact + a specific human tension → relationship → visible event. A pleasant mood alone is not that bridge. For a transformative request, compare at least three materially different visual premises; select one and reject the others with reasons. A camera/caption/palette variant is one premise. When borrowing a mechanism, explain the relationship it preserves, an adjacent use and a more distant but meaningful translation; compare these with the obvious product photo/demo. Reject the obvious option only when another communicates better. A craft-only reference leaves the concept to supply its own meaning. A physical impossibility earns its place only when it helps explain the message; a direct demonstration can be stronger.
5. Shape a readable set: distinct reasons across concepts; executions inside one concept differ in framework/style/composition. Cover the words mentally: would they still look different? Merge duplicated reasons. Use real personas and awareness appropriate to the brief, with live offers only. Log unfillable gaps rather than padding.
6. Give a fresh critic the actual cited source records, official product images and viewed reference images, not only our summaries. Ask it to challenge source truth, proof/persona fit, genuinely different visual meanings, the chosen causal bridge and why obvious options lost before composing. Pass after findings are resolved; no delegation available → explicitly record same-agent review. `workflow.py check` catches missing recorded work, not whether the critic was perceptive.

Iterate/rotation retains the parent's supported reason/proof and changes one named lever. An exhausted reason requires the fresh path. Record the approved parent/request as basis. No new concept tournament for a rejected-element fix or copy-only change.
