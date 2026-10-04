#!/usr/bin/env python3
"""Export confirmed pronunciation facts from a fresh brand-context read, not a new store."""
import argparse
import json
import pathlib
import re


def rules_from_context(context, brand_id, required=()):
    if (context.get("brand") or {}).get("id") != brand_id:
        raise ValueError("brand context does not match the selected brand")
    if "learnings" not in context:
        raise ValueError("read the brand's learnings before planning voice")
    found = {}
    for fact in context["learnings"]:
        if fact.get("source") != "user" or fact.get("kind") != "must" or fact.get("active") is False:
            continue
        m = re.fullmatch(r"Pronunciation: (.+?) => (.+)", fact.get("text", "").strip())
        if not m:
            continue
        term, say = (x.strip() for x in m.groups())
        if term.lower() in found and found[term.lower()]["say_as"] != say:
            raise ValueError("conflicting confirmed pronunciations for " + term)
        found[term.lower()] = {"term": term, "say_as": say, "fact_id": fact["id"]}
    missing = [term for term in required if term.lower() not in found]
    if missing:
        raise ValueError("confirm and persist pronunciation before voice: " + ", ".join(missing))
    return {"brand_id": brand_id, "basis": "fresh user-authored brand learnings read",
            "pronunciations": list(found.values())}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--context", required=True)
    ap.add_argument("--brand", required=True)
    ap.add_argument("--require", action="append", default=[])
    ap.add_argument("--out", required=True)
    a=ap.parse_args()
    result=rules_from_context(json.loads(pathlib.Path(a.context).read_text()),a.brand,a.require)
    pathlib.Path(a.out).write_text(json.dumps(result,indent=2))
    print("verified pronunciation rules ->",a.out)

if __name__ == "__main__":
    main()
