#!/usr/bin/env python3
"""Validate the miner's video-angle-bank.v1 and select angles for one product/template.

No network. Fetching a dependency never starts research or spends credits. Legacy
Markdown banks must be migrated from their actual sources, not silently invented.
"""
import argparse
import json
from pathlib import Path


def validate_brief(brief, bank):
    """Check run-context provenance, not truth or whether an ad sounds natural."""
    if not isinstance(brief, dict):
        return ["creative_brief must be an object"]
    errors = []
    for key in ("brand_id", "product_id"):
        if brief.get(key) != bank.get(key):
            errors.append(f"creative_brief {key} must match the angle bank")
    sources = {row["id"] for group in ("facts", "quotes", "references")
               for row in bank.get(group, []) if isinstance(row, dict) and row.get("id")}
    rows = brief.get("sources", [])
    if not isinstance(rows, list):
        errors.append("creative_brief sources must be a list")
        rows = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not row["id"]:
            errors.append("creative_brief sources need a string id")
            continue
        if row["id"] in sources:
            errors.append(f"duplicate creative_brief source id {row['id']}")
        sources.add(row["id"])
        if not isinstance(row.get("source"), str) or not row["source"].strip():
            errors.append(f"creative_brief source {row['id']} needs its real pointer")

    def sourced(row, name):
        if not isinstance(row, dict):
            errors.append(f"creative_brief {name} must be a sourced object")
            return False
        if not isinstance(row.get("text"), str) or not row["text"].strip():
            errors.append(f"creative_brief {name} needs text")
        ids = row.get("source_ids")
        if not isinstance(ids, list) or not ids or any(not isinstance(x, str) or x not in sources for x in ids):
            errors.append(f"creative_brief {name} needs known source_ids")
        return True

    for name in ("product_variant", "audience_situation", "objective", "mechanism",
                 "offer", "cta", "constraints", "delivery_intent"):
        sourced(brief.get(name), name)
    mechanism = brief.get("mechanism")
    facts = {row["id"] for row in bank.get("facts", []) if isinstance(row, dict) and row.get("id")}
    if isinstance(mechanism, dict):
        ids = mechanism.get("fact_ids")
        if not isinstance(ids, list) or any(not isinstance(x, str) or x not in facts for x in ids):
            errors.append("creative_brief mechanism fact_ids must cite product facts")
        elif not ids and mechanism.get("status") != "unknown":
            errors.append("creative_brief mechanism needs product facts or status unknown")
        if mechanism.get("status") == "unknown" and not brief.get("unknowns"):
            errors.append("creative_brief unknown mechanism needs a nonempty unknowns list")
    for name in ("prior_decisions", "locked_copy"):
        rows = brief.get(name)
        if not isinstance(rows, list):
            errors.append(f"creative_brief {name} must be a list, empty when none apply")
            continue
        for i, row in enumerate(rows):
            if sourced(row, f"{name}[{i}]") and name == "prior_decisions":
                if row.get("scope") not in ("project", "brand") or not row.get("applies_to"):
                    errors.append("creative_brief prior decision needs scope and applicability")
                if "avoid_phrase" in row and (not isinstance(row["avoid_phrase"], str) or not row["avoid_phrase"].strip()):
                    errors.append("creative_brief avoid_phrase must be a nonempty string")
    if not isinstance(brief.get("unknowns"), list) or any(not isinstance(x, str) or not x.strip() for x in brief.get("unknowns", [])):
        errors.append("creative_brief unknowns must be a list of gaps and supported alternatives")
    return errors


def validate_bank(bank):
    errors = []
    if not isinstance(bank, dict):
        return ["angle bank must be an object"]
    if bank.get("schema_version") != "video-angle-bank.v1":
        errors.append("schema_version must be video-angle-bank.v1")
    for key in ("brand_id", "product_id", "researched_at", "audience", "objective", "cta"):
        if not bank.get(key):
            errors.append(f"angle bank needs {key}")
    sources = {}
    fact_ids = set()
    for group in ("facts", "quotes", "references"):
        rows = bank.get(group, [])
        if not isinstance(rows, list):
            errors.append(f"{group} must be a list")
            continue
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get("id"), str) or not row["id"]:
                errors.append(f"{group} entries need a string id")
                continue
            if row["id"] in sources:
                errors.append(f"duplicate evidence id {row['id']}")
            sources[row["id"]] = row
            if group == "facts":
                fact_ids.add(row["id"])
            if not row.get("source"):
                errors.append(f"{row['id']} needs its real source")
            if group in ("facts", "quotes") and not row.get("text"):
                errors.append(f"{row['id']} needs source text")
            if group == "facts" and row.get("product_id") != bank.get("product_id"):
                errors.append(f"fact {row['id']} belongs to another product")
    angles = bank.get("angles")
    if not isinstance(angles, list) or not angles:
        errors.append("angle bank needs an angles list")
        return errors
    seen = set()
    for angle in angles:
        if not isinstance(angle, dict) or not isinstance(angle.get("id"), str) or not angle["id"]:
            errors.append("every angle needs a string id")
            continue
        aid = angle["id"]
        if aid in seen:
            errors.append(f"duplicate angle id {aid}")
        seen.add(aid)
        for key in ("angle", "promise", "evidence_ids", "compatible_template_ids"):
            if not angle.get(key):
                errors.append(f"angle {aid} needs {key}")
        for key in ("evidence_ids", "compatible_template_ids"):
            if not isinstance(angle.get(key), list):
                errors.append(f"angle {aid} {key} must be a list")
            elif any(not isinstance(value, str) or not value for value in angle[key]):
                errors.append(f"angle {aid} {key} entries must be nonempty strings")
        for eid in angle.get("evidence_ids", []) if isinstance(angle.get("evidence_ids"), list) else []:
            if not isinstance(eid, str) or eid not in sources:
                errors.append(f"angle {aid} cites unknown evidence {eid}")
        # Optional v1 extensions: old sourced banks remain usable. New consumer
        # context must not smuggle a quote or another source in as a product fact.
        for field, required, id_key in (
            ("buyer_case", ("role_or_routine", "task_or_decision", "constraint", "desired_output"), "evidence_ids"),
            ("product_role", ("operation_or_purpose", "output_or_role", "why_it_helps"), "fact_ids"),
        ):
            if field not in angle:
                continue
            detail = angle[field]
            if not isinstance(detail, dict):
                errors.append(f"angle {aid} {field} must be an object")
                continue
            for key in required:
                if not isinstance(detail.get(key), str) or not detail[key].strip():
                    errors.append(f"angle {aid} {field} needs {key}")
            ids = detail.get(id_key, [])
            if not isinstance(ids, list) or any(not isinstance(value, str) or not value for value in ids):
                errors.append(f"angle {aid} {field} {id_key} must be a list of source ids")
                continue
            if field == "product_role" and not ids:
                errors.append(f"angle {aid} product_role needs fact_ids")
            for eid in ids:
                if eid not in sources:
                    errors.append(f"angle {aid} {field} cites unknown evidence {eid}")
                elif field == "product_role" and eid not in fact_ids:
                    errors.append(f"angle {aid} product_role {eid} is not a product fact")
    if "creative_brief" in bank and not errors:
        errors.extend(validate_brief(bank["creative_brief"], bank))
    return errors


def select_context(bank, brand_id, product_id, template_id, angle_ids=None, brief=None):
    if not isinstance(bank, dict):
        raise ValueError("angle bank must be an object")
    if brief is not None:
        bank = dict(bank, creative_brief=brief)
    errors = validate_bank(bank)
    if errors:
        raise ValueError("; ".join(errors))
    if bank["brand_id"] != brand_id or bank["product_id"] != product_id:
        raise ValueError("angle bank belongs to another brand or product")
    requested = set(angle_ids or [])
    known = {a["id"] for a in bank["angles"]}
    if requested - known:
        raise ValueError("selected angle not found: " + ", ".join(sorted(requested - known)))
    chosen = [a for a in bank["angles"] if (not requested or a["id"] in requested)
              and template_id in a["compatible_template_ids"]]
    if requested - {a["id"] for a in chosen}:
        raise ValueError("selected angle does not fit this template; resolve the conflict before writing")
    if not chosen:
        raise ValueError("no angle fits this template; research a compatible angle or offer a format change")
    return dict(bank, angles=chosen, template_id=template_id, locked_angle_ids=sorted(requested))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--bank", required=True)
    ap.add_argument("--brand-id", required=True)
    ap.add_argument("--product-id", required=True)
    ap.add_argument("--template-id", required=True)
    ap.add_argument("--angle-id", action="append")
    ap.add_argument("--brief", help="Sourced current-run creative brief; retained in angle-context")
    ap.add_argument("--out", default="working/script/angle-context.json")
    args = ap.parse_args()
    try:
        brief = None
        if args.brief:
            brief = json.loads(Path(args.brief).read_text())
            # An explicitly supplied null must not take the legacy no-brief path.
            if not isinstance(brief, dict):
                raise ValueError("creative_brief must be an object")
        context = select_context(json.loads(Path(args.bank).read_text()), args.brand_id,
                                 args.product_id, args.template_id, args.angle_id,
                                 brief)
    except (OSError, ValueError, TypeError) as exc:
        ap.exit(2, f"angle handoff: {exc}\n")
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(context, indent=2, ensure_ascii=False) + "\n")
    print(f"Validated {len(context['angles'])} angle(s) for the selected template; saved {out}")


if __name__ == "__main__":
    main()
