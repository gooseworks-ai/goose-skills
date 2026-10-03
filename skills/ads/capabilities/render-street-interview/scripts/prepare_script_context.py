#!/usr/bin/env python3
"""Select complete commercial interactions; snippets cannot satisfy an ad-writing gap."""
import argparse
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEFAULT_LIBRARY = HERE.parent / "references" / "street-reference-library.json"
MODES = ("product-guess", "conversation")
INTERACTIONS = ("product-guess", "mic-only", "product-sample", "concept-challenge")
SITUATION_FIELDS = ("edited_opening", "visible_setup", "participant_reason", "viewer_hook",
                    "product_connection", "payoff", "unseen_setup")


def reference_gap(ref):
    """Check observation coverage, not prose quality or claimed performance."""
    if ref.get("use_status") in ("excluded", "rejected"):
        return ref.get("exclusion_reason", "reference excluded from ad writing")
    if ref.get("commercial") is not True or not ref.get("commercial_evidence"):
        return "no evidenced commercial interaction; editorial material is not an ad reference"
    inspection = ref.get("inspection")
    if not isinstance(inspection, dict):
        return "missing complete-clip inspection record"
    duration = inspection.get("duration_s")
    if (inspection.get("coverage") != "complete-clip"
            or not {"visual", "transcript"}.issubset(inspection.get("modalities", []))
            or not isinstance(duration, (int, float)) or isinstance(duration, bool) or duration <= 0
            or not inspection.get("method")):
        return "full visual interaction and complete spoken exchange have not been inspected"
    if not (ref.get("observed") is True and ref.get("source") and ref.get("transfer_rule")
            and ref.get("limitations") and ref.get("allowed_offering_types")
            and ref.get("interaction_types")):
        return "missing source, observation limits or interaction compatibility"
    situation = ref.get("ad_interaction")
    if not isinstance(situation, dict):
        return "missing ad interaction record"
    if not all(isinstance(situation.get(k), str) and situation[k].strip() for k in SITUATION_FIELDS):
        return "missing ad setup, participation reason, hook, product connection or payoff"
    turns = ref.get("speaker_turns", [])
    if (not isinstance(turns, list) or len(turns) < 3 or not all(isinstance(t, dict) for t in turns)
            or len({t.get("speaker") for t in turns if t.get("speaker")}) < 2):
        return "missing complete two-person turn sequence"
    previous_start = -1
    for turn in turns:
        start, end = turn.get("start"), turn.get("end")
        if (not isinstance(start, (int, float)) or not isinstance(end, (int, float))
                or isinstance(start, bool) or isinstance(end, bool)
                or not 0 <= start < end <= duration + 0.5 or start < previous_start
                or not isinstance(turn.get("text"), str) or not turn["text"].strip()
                or not turn.get("speaker") or not turn.get("does")):
            return "turns need ordered clip timestamps and observed content (labeled if paraphrased), not functions alone"
        previous_start = start
    return None


def select_context(brief, references, limit=2):
    mode = brief.get("mode")
    if mode not in MODES:
        raise ValueError("mode must be product-guess or conversation")
    brief_gaps = []
    if brief.get("offering_type") not in ("physical", "service", "digital"):
        brief_gaps.append("offering_type must identify physical, service or digital")
    if brief.get("interaction_type") not in INTERACTIONS:
        brief_gaps.append("interaction_type must identify the proposed visible interaction")
    if mode == "product-guess" and brief.get("interaction_type") != "product-guess":
        brief_gaps.append("product-guess execution needs product-guess interaction")
    if mode == "conversation" and brief.get("interaction_type") == "product-guess":
        brief_gaps.append("object guessing belongs to product-guess execution")
    eligible, excluded = [], []
    # Project observations replace a seed summary with the same id. Private full
    # transcripts stay project-scoped rather than being copied into the library.
    unique = {r["id"]: r for r in references if isinstance(r, dict) and r.get("id")}
    for ref in unique.values():
        reason = None
        if ref.get("format") != "street-interview" or mode not in ref.get("execution_modes", []):
            reason = "wrong format or unsupported execution"
        elif ref.get("language") != brief.get("language", "en"):
            reason = "language mismatch"
        elif reference_gap(ref):
            reason = reference_gap(ref)
        elif brief.get("offering_type") not in ref["allowed_offering_types"]:
            reason = "product/service interaction mismatch"
        elif brief.get("interaction_type") not in ref["interaction_types"]:
            reason = "visible interaction mismatch"
        if reason:
            excluded.append({"id": ref.get("id"), "reason": reason})
            continue
        score = (100 if ref.get("origin") == "user" else 15 if ref.get("origin") == "project" else 0)
        score += 40 if ref.get("brand_id") == brief.get("brand_id") else 0
        score += 20 if ref.get("approved") is True else 0
        score += 10 if brief.get("buying_context") in ref.get("buying_contexts", []) else 0
        score += 10 if brief.get("audience_group") in ref.get("audience_groups", []) else 0
        score += 5 if ref.get("commercial") else 0
        eligible.append((score, ref))
    eligible.sort(key=lambda pair: (-pair[0], pair[1]["id"]))
    selected = [] if brief_gaps else [ref for _, ref in eligible[:limit]]
    queries = []
    if not selected:
        queries.append(f"{brief.get('offering_type', 'offering')} {brief.get('audience_group', 'audience')} "
                       f"{brief.get('interaction_type', mode)} branded street interview full ad video "
                       f"{brief.get('language', 'en')}")
    return {
        "schema_version": "street-script-context.v2", "brand_id": brief.get("brand_id"),
        "mode": mode, "brief": brief,
        "references": selected,
        "selection": [{"id": r["id"], "reason": "user reference" if r.get("origin") == "user"
                       else "complete commercial interaction; offering/action fit; audience/buying fit ranked"}
                      for r in selected],
        "excluded": excluded, "research_queries": queries, "brief_gaps": brief_gaps,
        "status": "needs-reference" if not selected else "ready-for-writing",
        "limitations": ["This checks recorded observation coverage; it cannot verify that the observer's account is true.",
                         "Reference compatibility is not script quality, verified authorship or ad performance."]}


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
