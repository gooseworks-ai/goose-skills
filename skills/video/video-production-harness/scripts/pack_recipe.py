#!/usr/bin/env python3
"""Pack a video's rebuild recipe into one JSON file. Never uploads or calls a provider."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

FORMAT = "gooseworks-video-source/1"
MAX_BUNDLE_BYTES = 10 * 1024 * 1024
MAX_FILES = 400
MAX_FILE_CHARS = 2_000_000
MAX_INPUTS = 200
ROLES = {
    "brand_asset", "product_photo", "logo", "font", "voice", "music", "sfx",
    "generated_image", "generated_clip", "stock", "derived", "other",
}
# Same rules the host checks before completion; keep them in step with the host's list.
# Linear patterns only: they run on files of up to 2M characters.
PATH_START = "(?:^|[\\s\"'`(=:,\\[/])"
LOCAL_OR_EXPIRING = [
    # "[s]" keeps this file free of the literal home-folder prefix the release check refuses.
    (re.compile(PATH_START + r"/U[s]ers/[^/\s\"'`]{1,64}/", re.M), "a path on someone's Mac"),
    (re.compile(PATH_START + r"/home/[^/\s\"'`]{1,64}/", re.M), "a path in someone's home folder"),
    (re.compile(r"\b[A-Za-z]:\\{1,2}Users\\{1,2}", re.I), "a Windows user folder"),
    (re.compile(r"X-Amz-(?:Signature|Credential|Expires)=", re.I), "a signed link that expires"),
    (re.compile(r"[?&](?:Signature|Expires|GoogleAccessId)="), "a signed link that expires"),
    (re.compile(r"\bfal\.media/files/", re.I), "a provider result link that expires"),
]
SECRETS = [
    re.compile(r"\b(?:sk|rk)[-_](?:live[-_]|test[-_]|proj[-_]|ant[-_])?[A-Za-z0-9_-]{20,200}"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}\b", re.I),
    re.compile(r"\bBearer\s{1,4}[A-Za-z0-9._~+/-]{20,500}", re.I),
    re.compile(r"\b(?:api[_-]?key|secret|token|password)[\"']?\s{0,4}[:=]\s{0,4}[\"'][A-Za-z0-9_\-./+=]{16,500}[\"']", re.I),
    # An explicit credential name with an unquoted literal value, any digits: as strict as the
    # quoted form. Not $VAR, ${VAR}, <placeholder>, a call, a dotted name or a snake_case name.
    re.compile(r"\b[A-Za-z0-9_]{0,40}(?:api[_-]?key|api[_-]?token|access[_-]?key|access[_-]?token|auth[_-]?token|secret[_-]?key|client[_-]?secret|private[_-]?key|_key|_secret|_token|secret|token|password|passwd)\s{0,4}[:=]\s{0,4}(?![$<{\[(\"'`])(?![A-Za-z_]\w{0,60}(?:\.[A-Za-z_]\w{0,60}){1,6}(?![\w.]))(?![a-z][a-z0-9]{0,60}(?:_[a-z0-9]{1,60}){1,10}(?![\w\-./+=:]))[A-Za-z0-9_\-./+=:]{16,500}(?![(\w])", re.I),
    # Unquoted assignment (.env, shell): a key-like name and a 16+ character value with at least
    # three digits. Not $VAR, ${VAR}, <placeholder>, a call, or a code name like scene_v2.
    re.compile(r"\b[A-Za-z0-9_]{0,40}(?:key|secret|token|passw(?:or)?d)[A-Za-z0-9_]{0,20}\s{0,4}[:=]\s{0,4}(?![$<{\[(])(?=(?:[^\s\"'`\d]{0,200}\d){3})[A-Za-z0-9_\-./+=:]{16,500}(?![(\w])", re.I),
    re.compile(r"-----BEGIN [A-Z ]{0,40}PRIVATE KEY-----"),
    re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,255}\b"),
]


class RecipeError(ValueError):
    """A recipe that would not rebuild from the project alone."""


def is_safe_relative_path(path):
    if not path or len(path) > 200:
        return False
    if path[0] in "/~" or re.match(r"^[A-Za-z]:", path):
        return False
    if "\\" in path or "\0" in path:
        return False
    return all(part not in ("", "..") for part in path.split("/"))


def find_local_or_expiring(text):
    first = None
    for pattern, reason in LOCAL_OR_EXPIRING:
        match = pattern.search(text)
        if match:
            # A path pattern also matches the character before it, which may be the line break.
            at = match.start() + len(match.group(0)) - len(match.group(0).lstrip())
            if first is None or at < first[0]:
                first = (at, reason)
    if first is None:
        return None
    return text[: first[0]].count("\n") + 1, first[1]


def find_secret(text):
    starts = [m.start() for m in (p.search(text) for p in SECRETS) if m]
    return text[: min(starts)].count("\n") + 1 if starts else None


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(path, what):
    if not is_safe_relative_path(path):
        raise RecipeError(f"{what} {path!r}: use a relative path without .., ~, a drive letter or a leading slash")
    return path


def read_text(path, rel):
    data = path.read_bytes()
    if b"\0" in data:
        raise RecipeError(f"{rel} is binary: upload it as an input instead")
    try:
        # Bytes, not read_text(): newline translation would change the checksum.
        return data.decode("utf-8")
    except UnicodeDecodeError:
        raise RecipeError(f"{rel} is not UTF-8 text: upload it as an input instead") from None


def pack(root, spec):
    """Build the recipe dict from a spec of globs, inputs and the build."""
    root = Path(root).resolve()
    build = spec.get("build") or {}
    command = str(build.get("command") or "").strip()
    output = safe_path(str(build.get("output") or ""), "build.output")
    if not command or len(command) > 500:
        raise RecipeError("build.command is required and at most 500 characters")
    found = find_local_or_expiring(command)
    if found:
        raise RecipeError(f"build.command contains {found[1]}; use recipe paths only")
    tools = [{"name": str(t["name"]), "version": str(t["version"])} for t in build.get("tools", [])]
    if len(tools) > 20 or any(not t["name"] or not t["version"] or len(t["name"]) > 100 or len(t["version"]) > 100 for t in tools):
        raise RecipeError("keep to 20 tools, each with a name and version of at most 100 characters")

    inputs = []
    for item in spec.get("inputs", []):
        rel = safe_path(str(item.get("path") or ""), "input")
        role = item.get("role")
        if role not in ROLES:
            raise RecipeError(f"input {rel}: role must be one of {sorted(ROLES)}")
        if not item.get("media_id"):
            raise RecipeError(f"input {rel}: media_id is required; upload it to the project first")
        data = (root / rel).read_bytes()
        inputs.append({
            "path": rel, "media_id": str(item["media_id"]),
            **({"asset_id": str(item["asset_id"])} if item.get("asset_id") else {}),
            "sha256": sha256_bytes(data), "bytes": len(data), "role": role,
        })
    aliases = {}
    for item in inputs:
        alias = item.get("asset_id", item["media_id"])
        if not alias.strip() or len(alias) > 200:
            raise RecipeError("assembly asset aliases must be nonempty and at most 200 characters")
        for key in (alias, item["media_id"]):
            if key in aliases and aliases[key] != item["sha256"]:
                raise RecipeError("an assembly asset alias identifies different source bytes")
            aliases[key] = item["sha256"]
    input_paths = {item["path"] for item in inputs}
    if output in input_paths:
        raise RecipeError("build.output must be made by the build, not listed as an input")

    rels = set()
    for pattern in spec.get("files", []):
        literal = not any(ch in pattern for ch in "*?[")
        # Globs skip hidden files (.env, .git); name one exactly to include it.
        matches = [p for p in root.glob(pattern) if p.is_file()
                   and (literal or not any(part.startswith(".") for part in p.relative_to(root).parts))]
        if not matches:
            raise RecipeError(f"files pattern {pattern!r} matched nothing under {root.name}/")
        for match in matches:
            rels.add(match.relative_to(root).as_posix())
    files = []
    for rel in sorted(rels - input_paths - {output}):
        safe_path(rel, "file")
        text = read_text(root / rel, rel)
        if len(text) > MAX_FILE_CHARS:
            raise RecipeError(f"{rel} is over {MAX_FILE_CHARS} characters")
        found = find_local_or_expiring(text)
        if found:
            raise RecipeError(f"{rel} line {found[0]} contains {found[1]}; store that file in the project and use its recipe path")
        line = find_secret(text)
        if line:
            raise RecipeError(f"{rel} line {line} looks like it holds a key or token; remove it, a rebuild never calls a paid service")
        files.append({"path": rel, "sha256": sha256_bytes(text.encode("utf-8")), "text": text})
    if not files:
        raise RecipeError("the recipe needs at least one code or settings file")
    if len(files) > MAX_FILES or len(inputs) > MAX_INPUTS:
        raise RecipeError(f"keep to {MAX_FILES} files and {MAX_INPUTS} inputs")
    if sum(item["bytes"] for item in inputs) > 2 * 1024 ** 3:
        raise RecipeError("the inputs add up to more than 2 GB; keep only the files the final cut reads")

    bundle = {"format": FORMAT, "build": {"command": command, "output": output, "tools": tools},
              "files": files, "inputs": inputs}
    if spec.get("paid_calls"):
        if len(spec["paid_calls"]) > 100:
            raise RecipeError("keep to 100 paid calls")
        for call in spec["paid_calls"]:
            if not call.get("provider") or len(str(call["provider"])) > 100 or not call.get("endpoint") or len(str(call["endpoint"])) > 300:
                raise RecipeError("each paid call needs a provider (at most 100 characters) and an endpoint (at most 300)")
            if call.get("output_path") not in input_paths:
                raise RecipeError(f"paid call output {call.get('output_path')!r} is not a stored input")
        bundle["paid_calls"] = [
            {"output_path": c["output_path"], "provider": str(c["provider"]),
             "endpoint": str(c["endpoint"]), "request": dict(c.get("request") or {})}
            for c in spec["paid_calls"]
        ]
    if spec.get("notes"):
        if len(str(spec["notes"])) > 4000:
            raise RecipeError("notes are at most 4,000 characters")
        bundle["notes"] = str(spec["notes"])
    if find_secret(json.dumps({k: bundle.get(k) for k in ("build", "paid_calls", "notes")})):
        raise RecipeError("the build, paid-call requests or notes look like they hold a key or token; remove it")
    return bundle


def encode(bundle):
    data = (json.dumps(bundle, ensure_ascii=False, indent=1) + "\n").encode("utf-8")
    if len(data) > MAX_BUNDLE_BYTES:
        raise RecipeError("the recipe is over 10 MB; keep generated media as inputs, not files")
    return data


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", required=True, help="the build folder")
    parser.add_argument("--spec", required=True, help="JSON: files (globs), inputs [{path, media_id, role}], build {command, output, tools}, paid_calls, notes")
    parser.add_argument("--out", required=True, help="where to write recipe/source.json")
    args = parser.parse_args(argv)
    try:
        bundle = pack(args.root, json.loads(Path(args.spec).read_text(encoding="utf-8")))
        data = encode(bundle)
    except (RecipeError, OSError, KeyError, json.JSONDecodeError) as error:
        print(f"pack_recipe: {error}", file=sys.stderr)
        return 2
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(data)
    template = {
        "bundle": {"media_id": "<media_id after upload>", "sha256": sha256_bytes(data), "path": "recipe/source.json"},
        "build_command": bundle["build"]["command"],
        "rebuild_check": "<the JSON check_recipe.py prints>",
    }
    print(json.dumps({"wrote": str(out), "files": len(bundle["files"]), "inputs": len(bundle["inputs"]),
                      "source": template}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
