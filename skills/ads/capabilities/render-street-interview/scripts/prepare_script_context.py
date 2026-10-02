#!/usr/bin/env python3
"""Select inspected examples; return explicit research gaps instead of invented sources."""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_LIBRARY = HERE.parent / "references" / "street-reference-library.json"
MODES = ("product-guess", "conversation")


def select_context(brief, references, limit=2):
    mode = brief.get("mode")
    if mode not in MODES:
        raise ValueError("mode must be product-guess or conversation")
    eligible, excluded = [], []
    for ref in references:
        turns = ref.get("speaker_turns", [])
        reason = None
        if ref.get("format") != "street-interview" or mode not in ref.get("execution_modes", []):
            reason = "wrong format or unsupported execution"
        elif ref.get("language") != brief.get("language", "en"):
            reason = "language mismatch"
        elif not (ref.get("observed") is True and ref.get("source") and ref.get("transfer_rule")
                  and ref.get("limitations") and ref.get("observed_scope") in ("transcript", "audio", "video")
                  and len(turns) >= 3 and len({t.get("speaker") for t in turns if t.get("speaker")}) >= 2
                  and all(t.get("does") for t in turns)):
            reason = "missing observed exchange or provenance"
        if reason:
            excluded.append({"id": ref.get("id"), "reason": reason})
            continue
        score = (100 if ref.get("origin") == "user" else 0)
        score += 40 if ref.get("brand_id") == brief.get("brand_id") else 0
        score += 20 if ref.get("approved") is True else 0
        score += 10 if brief.get("buying_context") in ref.get("buying_contexts", []) else 0
        score += 10 if brief.get("audience_group") in ref.get("audience_groups", []) else 0
        score += 5 if ref.get("commercial") else 0
        eligible.append((score, ref))
    eligible.sort(key=lambda pair: (-pair[0], pair[1]["id"]))
    # Keep one useful commercial reference AND one contrasting conversation when available.
    selected = [ref for _, ref in eligible[:limit]]
    if len(selected) > 1 and not any(not r.get("commercial") for r in selected):
        contrast = next((r for _, r in eligible[limit:] if not r.get("commercial")), None)
        if contrast and selected[-1].get("origin") != "user":
            selected[-1] = contrast
    queries = []
    if not selected:
        queries.append(f"{brief.get('audience_group', 'audience')} {brief.get('buying_context', '')} "
                       f"{mode} street interview transcript {brief.get('language', 'en')}")
    if selected and not any(r.get("observed_scope") in ("audio", "video") for r in selected):
        queries.append("same-format source clip for delivery observation")
    return {
        "schema_version": "street-script-context.v1", "brand_id": brief.get("brand_id"),
        "mode": mode, "brief": brief,
        "references": selected,
        "selection": [{"id": r["id"], "reason": "user reference" if r.get("origin") == "user"
                       else "same execution; audience/buying fit ranked; contrasting mechanics retained"}
                      for r in selected],
        "excluded": excluded, "research_queries": queries,
        "status": "needs-reference" if not selected else "ready-for-writing",
        "limitations": ["Input provenance is recorded, not independently verified by this selector.",
                         "Authorship, dialogue quality and performance require separate evidence."]}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--brief", type=Path, required=True)
    ap.add_argument("--library", type=Path, default=DEFAULT_LIBRARY)
    ap.add_argument("--references", type=Path, help="project/user observations appended to the seed library")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    refs = json.loads(args.library.read_text())["references"]
    if args.references:
        refs += json.loads(args.references.read_text())["references"]
    result = select_context(json.loads(args.brief.read_text()), refs)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(result, indent=2)+"\n")
    print(result["status"], ", ".join(r["id"] for r in result["references"]))
    if result["status"] != "ready-for-writing":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
