#!/usr/bin/env python3
"""Export confirmed pronunciation facts from a fresh brand-context read, not a new store.

A confirmed pronunciation is a user-authored `must` brand fact. The canonical text is
    Pronounce "<written term>" as "<spoken form>"
(the form the goose-video entry skill saves). The older
    Pronunciation: <written term> => <spoken form>
is still read. The context may be the brand read's payload, the MCP structured result
`{"result": {...}}`, or the whole tool result with `structuredContent`/`content`."""
import argparse
import json
import pathlib
import re

_Q = "\"“”"  # straight and curly double quotes
FORMATS = (
    re.compile(r"Pronounce\s+[%s](.+?)[%s]\s+as\s+[%s](.+?)[%s]\.?" % (_Q, _Q, _Q, _Q), re.IGNORECASE),
    re.compile(r"Pronunciation:\s*(.+?)\s*=>\s*(.+)"),
)


def parse_fact(text):
    """Return (term, say_as) for a pronunciation fact's text, or None."""
    text = (text or "").strip()
    for pattern in FORMATS:
        m = pattern.fullmatch(text)
        if m:
            term, say = (x.strip() for x in m.groups())
            if term and say:
                return term, say
    return None


def unwrap(context):
    """Accept the brand payload, `{"result": payload}`, or a whole MCP tool result."""
    for _ in range(3):
        if not isinstance(context, dict) or "learnings" in context or "brand" in context:
            break
        if isinstance(context.get("structuredContent"), dict):
            context = context["structuredContent"]
        elif isinstance(context.get("result"), dict):
            context = context["result"]
        elif isinstance(context.get("content"), list):
            texts = [c.get("text") for c in context["content"] if isinstance(c, dict) and c.get("type") == "text"]
            if len(texts) != 1:
                break
            context = json.loads(texts[0])
        else:
            break
    if not isinstance(context, dict):
        raise ValueError("brand context is not a JSON object")
    return context


def rules_from_context(context, brand_id, required=()):
    context = unwrap(context)
    if (context.get("brand") or {}).get("id") != brand_id:
        raise ValueError("brand context does not match the selected brand")
    if "learnings" not in context:
        raise ValueError("read the brand's learnings before planning voice")
    found = {}
    for fact in context["learnings"]:
        if fact.get("source") != "user" or fact.get("kind") != "must" or fact.get("active") is False:
            continue
        parsed = parse_fact(fact.get("text"))
        if not parsed:
            continue
        term, say = parsed
        if term.lower() in found and found[term.lower()]["say_as"] != say:
            raise ValueError("conflicting confirmed pronunciations for " + term)
        found[term.lower()] = {"term": term, "say_as": say, "fact_id": fact["id"]}
    missing = [term for term in required if term.lower() not in found]
    if missing:
        raise ValueError("confirm and persist pronunciation before voice: " + ", ".join(missing))
    return {"brand_id": brand_id, "basis": "fresh user-authored brand learnings read",
            "pronunciations": list(found.values())}


def main():
    ap=argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
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
