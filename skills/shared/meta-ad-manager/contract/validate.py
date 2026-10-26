#!/usr/bin/env python3
"""Check a Meta ad harness `ads/` folder against the contract templates.

Usage:
    python3 validate.py <path/to/ads> [--baseline <path/to/previous/ads>]

The templates in ./templates are the schema: required frontmatter keys and their
types come from each template's frontmatter placeholders, and required sections
come from its `## ` headings. Rules are documented in RULES.md.

Exit 0 when valid, 1 when any error is found. Standard library only, so it runs
inside any sandbox.
"""
from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path

TEMPLATES = Path(__file__).resolve().parent / "templates"

TOP_FILES = {"README.md": "README.md", "brand.md": "brand.md"}
CAMPAIGN_FILES = ("strategy.md", "state.md", "decisions.md")
ARCHIVE_FILE = "decisions-archive.md"

MAX_BYTES = 8 * 1024
DECISIONS_WARN_BYTES = 48 * 1024
DECISIONS_MAX_BYTES = 64 * 1024

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_RE = r"\d{4}-\d{2}-\d{2}"
OBSERVED_TAG_RE = re.compile(
    r"\[window (" + DATE_RE + r")\.\.(" + DATE_RE + r"); "
    r"synced (" + DATE_RE + r")T\d{2}:\d{2}(?::\d{2})?Z; source [^\]\s][^\]]*\]"
)
CURRENT_WORDS_RE = re.compile(r"\b(current|currently|now|today|latest)\b", re.IGNORECASE)
ENTRY_HEADING_RE = re.compile(r"^### (" + DATE_RE + r") (?:—|-) \S")
ENTRY_FIELDS = ("Recommended", "Evidence", "Decided", "Outcome")


@dataclass
class Issue:
    path: str
    line: int
    rule: str
    message: str

    def __str__(self) -> str:
        return f"{self.path}:{self.line}: {self.rule}: {self.message}"


class Report:
    def __init__(self, root: Path):
        self.root = root
        self.errors: list[Issue] = []
        self.warnings: list[Issue] = []

    def _rel(self, path: Path) -> str:
        try:
            return str(path.relative_to(self.root.parent))
        except ValueError:
            return str(path)

    def error(self, path: Path, line: int, rule: str, message: str) -> None:
        self.errors.append(Issue(self._rel(path), line, rule, message))

    def warn(self, path: Path, line: int, rule: str, message: str) -> None:
        self.warnings.append(Issue(self._rel(path), line, rule, message))


# ── parsing ──────────────────────────────────────────────────────────────────


def strip_comments(text: str) -> str:
    """Blank out <!-- --> comments, keeping newlines so line numbers survive."""
    return re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.DOTALL)


def split_frontmatter(text: str) -> tuple[dict[str, tuple[str, int]], list[str], int]:
    """Return ({key: (value, line)}, body_lines, body_start_line). Line numbers are 1-based."""
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        return {}, lines, 1
    fm: dict[str, tuple[str, int]] = {}
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return fm, lines[i + 1 :], i + 2
        m = re.match(r"^([a-z_]+):\s*(.*)$", lines[i])
        if m:
            fm[m.group(1)] = (m.group(2).strip(), i + 1)
    return fm, [], len(lines) + 1


def sections(body: list[str]) -> set[str]:
    return {line[3:].strip() for line in body if line.startswith("## ")}


@dataclass
class Template:
    keys: dict[str, str]  # key -> placeholder spec
    sections: set[str]
    table_header: list[str] | None


def load_template(rel: str) -> Template:
    text = strip_comments((TEMPLATES / rel).read_text())
    fm, body, _ = split_frontmatter(text)
    header = None
    for line in body:
        if line.startswith("| ") and header is None:
            header = [c.strip() for c in line.strip().strip("|").split("|")]
    return Template({k: v for k, (v, _) in fm.items()}, sections(body), header)


# ── value checks ─────────────────────────────────────────────────────────────


def valid_date(value: str) -> bool:
    if not re.fullmatch(DATE_RE, value):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False


def check_value(spec: str, value: str) -> str | None:
    """Return an error message, or None when `value` satisfies placeholder `spec`."""
    if value.startswith("<") and value.endswith(">"):
        return f"still the template placeholder {value}"
    optional = spec.startswith("<optional ")
    kind = spec[len("<optional ") : -1] if optional else spec[1:-1]
    if optional and value == "none":
        return None
    if not value:
        return "is empty"
    if kind.startswith("enum:"):
        allowed = [v.strip() for v in kind[len("enum:") :].split("|")]
        return None if value in allowed else f"must be one of {', '.join(allowed)}; got {value!r}"
    if kind == "date":
        return None if valid_date(value) else f"must be a YYYY-MM-DD date; got {value!r}"
    if kind == "int":
        return None if re.fullmatch(r"[1-9]\d*", value) else f"must be a positive integer; got {value!r}"
    if kind == "slug":
        return None if SLUG_RE.match(value) else f"must be kebab-case; got {value!r}"
    if kind == "id":
        return None if re.fullmatch(r"\S+", value) and value != "none" else f"must be one id with no spaces; got {value!r}"
    if kind == "list":
        if not re.fullmatch(r"\[.*\]", value):
            return f"must be a [a, b] list; got {value!r}"
        items = [v.strip() for v in value[1:-1].split(",") if v.strip()]
        return None if all(re.fullmatch(r"\S+", v) for v in items) else "list items must be ids with no spaces"
    return None  # <string>: any non-empty value


# ── per-file checks ──────────────────────────────────────────────────────────


def check_doc(report: Report, path: Path, template: Template, slug: str | None = None) -> tuple[dict, list[str], int]:
    raw = path.read_text()
    size = len(raw.encode("utf-8"))
    if path.name == "decisions.md":
        if size > DECISIONS_MAX_BYTES:
            report.error(path, 1, "size", f"{size} bytes > {DECISIONS_MAX_BYTES}; move closed entries to {ARCHIVE_FILE}")
        elif size > DECISIONS_WARN_BYTES:
            report.warn(path, 1, "size", f"{size} bytes > {DECISIONS_WARN_BYTES}; archive closed entries soon")
    elif path.name != ARCHIVE_FILE and size > MAX_BYTES:
        report.error(path, 1, "size", f"{size} bytes > {MAX_BYTES}; keep this file short")

    text = strip_comments(raw)
    fm, body, body_start = split_frontmatter(text)
    if template.keys and not fm and path.name != ARCHIVE_FILE:
        report.error(path, 1, "frontmatter", "missing --- frontmatter block")
    for key, spec in template.keys.items():
        if key not in fm:
            if path.name != ARCHIVE_FILE:
                report.error(path, 1, "frontmatter", f"missing key `{key}` ({spec})")
            continue
        value, line = fm[key]
        problem = check_value(spec, value)
        if problem:
            report.error(path, line, "frontmatter", f"`{key}` {problem}")
    if slug and "campaign" in fm and fm["campaign"][0] != slug:
        report.error(path, fm["campaign"][1], "frontmatter", f"`campaign` must equal the folder name {slug!r}")

    if path.name != ARCHIVE_FILE:
        for missing in sorted(template.sections - sections(body)):
            report.error(path, 1, "section", f"missing required section `## {missing}`")

    check_observed(report, path, body, body_start)
    return {k: v for k, (v, _) in fm.items()}, body, body_start


def check_observed(report: Report, path: Path, body: list[str], start: int) -> None:
    """Rule: a line carrying a tool observation is tagged with its window and sync time."""
    for i, line in enumerate(body):
        if "Observed:" not in line:
            continue
        lineno = start + i
        m = OBSERVED_TAG_RE.search(line)
        if not m:
            report.error(
                path, lineno, "observed",
                "an Observed: line needs [window YYYY-MM-DD..YYYY-MM-DD; synced YYYY-MM-DDTHH:MMZ; source <pointer>]",
            )
            continue
        win_start, win_end, synced = m.group(1), m.group(2), m.group(3)
        if not all(valid_date(d) for d in (win_start, win_end, synced)):
            report.error(path, lineno, "observed", "window or synced date is not a real date")
        elif not (win_start <= win_end <= synced):
            report.error(path, lineno, "observed", "window start must be <= window end <= synced date")
        claim = line[: m.start()] + line[m.end() :]
        word = CURRENT_WORDS_RE.search(claim)
        if word:
            report.error(path, lineno, "observed", f"an observation is a dated snapshot; drop {word.group(0)!r}")


# ── decisions ────────────────────────────────────────────────────────────────


def parse_entries(report: Report | None, path: Path, body: list[str], start: int) -> list[tuple[str, str]]:
    """Return [(date, normalised_entry_text)]. Reports shape errors when `report` is given."""
    entries: list[tuple[str, int, list[str]]] = []
    for i, line in enumerate(body):
        if line.startswith("### "):
            m = ENTRY_HEADING_RE.match(line)
            if not m and report:
                report.error(path, start + i, "decisions", "entry heading must be `### YYYY-MM-DD — title`")
            entries.append((m.group(1) if m else "", start + i, [line]))
        elif entries:
            entries[-1][2].append(line)

    out = []
    prev = ""
    for when, lineno, lines in entries:
        if report:
            if when and not valid_date(when):
                report.error(path, lineno, "decisions", f"{when} is not a real date")
            if when and prev and when < prev:
                report.error(path, lineno, "decisions", f"entry dated {when} comes after {prev}; dates never go backwards")
            for field in ENTRY_FIELDS:
                if not any(re.match(rf"^- {field}:\s*\S", l) for l in lines):
                    report.error(path, lineno, "decisions", f"entry is missing `- {field}: …`")
        prev = when or prev
        out.append((when, "\n".join(l.rstrip() for l in lines).strip()))
    return out


def read_entries(folder: Path) -> list[str]:
    """All entries of a campaign, archive first, as normalised text."""
    entries: list[str] = []
    for name in (ARCHIVE_FILE, "decisions.md"):
        p = folder / name
        if p.exists():
            _, body, start = split_frontmatter(strip_comments(p.read_text()))
            entries += [text for _, text in parse_entries(None, p, body, start)]
    return entries


def fill_pending_only(old: str, new: str) -> bool:
    """True if `new` equals `old` except that `- Outcome: pending` was filled in."""
    if old == new:
        return True
    old_lines, new_lines = old.split("\n"), new.split("\n")
    if len(old_lines) != len(new_lines):
        return False
    for a, b in zip(old_lines, new_lines):
        if a != b and not (re.match(r"^- Outcome:\s*pending\s*$", a) and b.startswith("- Outcome:")):
            return False
    return True


def check_append_only(report: Report, folder: Path, baseline: Path) -> None:
    old, new = read_entries(baseline), read_entries(folder)
    path = folder / "decisions.md"
    if len(new) < len(old):
        report.error(path, 1, "append-only", f"{len(old) - len(new)} earlier entries were removed")
        return
    for i, (a, b) in enumerate(zip(old, new)):
        if not fill_pending_only(a, b):
            title = a.split("\n", 1)[0]
            report.error(path, 1, "append-only", f"earlier entry changed: {title!r} (only `Outcome: pending` may be filled in)")


# ── index ────────────────────────────────────────────────────────────────────


def check_index(report: Report, path: Path, body: list[str], start: int, header: list[str], stages: dict[str, str]) -> None:
    in_section = False
    rows: dict[str, tuple[str, int]] = {}
    seen_header = False
    for i, line in enumerate(body):
        if line.startswith("## "):
            in_section = line[3:].strip() == "Campaigns"
            continue
        if not in_section or not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if not seen_header:
            seen_header = True
            if cells != header:
                report.error(path, start + i, "index", f"table header must be | {' | '.join(header)} |")
            continue
        if all(re.fullmatch(r":?-+:?", c) for c in cells):
            continue
        if len(cells) != len(header):
            report.error(path, start + i, "index", f"row has {len(cells)} cells, expected {len(header)}")
            continue
        slug, stage, updated = cells[0], cells[1], cells[-1]
        if slug in rows:
            report.error(path, start + i, "index", f"campaign {slug!r} listed twice")
        rows[slug] = (stage, start + i)
        if not valid_date(updated):
            report.error(path, start + i, "index", f"Updated must be YYYY-MM-DD; got {updated!r}")

    for slug, (stage, lineno) in rows.items():
        if slug not in stages:
            report.error(path, lineno, "index", f"row {slug!r} has no campaigns/{slug}/ folder")
        elif stages[slug] and stage != stages[slug]:
            report.error(path, lineno, "index", f"{slug!r} stage is {stage!r} here but {stages[slug]!r} in its state.md")
    for slug in stages:
        if slug not in rows:
            report.error(path, 1, "index", f"campaigns/{slug}/ is missing from the Campaigns table")


# ── driver ───────────────────────────────────────────────────────────────────


def visible(p: Path) -> bool:
    return not p.name.startswith(".")


def validate(root: Path, baseline: Path | None = None) -> Report:
    report = Report(root)
    if not root.is_dir():
        report.error(root, 1, "layout", "not a directory")
        return report

    # Layout: only the contract's files live under ads/ (dotfiles ignored).
    for child in sorted(filter(visible, root.iterdir())):
        if child.name in TOP_FILES or (child.name == "campaigns" and child.is_dir()):
            continue
        report.error(child, 1, "layout", "unexpected entry; ads/ holds only README.md, brand.md and campaigns/")
    for name in TOP_FILES:
        if not (root / name).is_file():
            report.error(root / name, 1, "layout", "required file is missing")

    campaigns: dict[str, Path] = {}
    cdir = root / "campaigns"
    if cdir.is_dir():
        for child in sorted(filter(visible, cdir.iterdir())):
            if not child.is_dir():
                report.error(child, 1, "layout", "campaigns/ holds only campaign folders")
                continue
            if not SLUG_RE.match(child.name):
                report.error(child, 1, "layout", "campaign folder name must be kebab-case")
            campaigns[child.name] = child
            for f in sorted(filter(visible, child.iterdir())):
                if f.name not in CAMPAIGN_FILES and f.name != ARCHIVE_FILE:
                    report.error(f, 1, "layout", f"unexpected file; a campaign holds only {', '.join(CAMPAIGN_FILES)} (+ {ARCHIVE_FILE})")
            for name in CAMPAIGN_FILES:
                if not (child / name).is_file():
                    report.error(child / name, 1, "layout", "required file is missing")

    t_index = load_template("README.md")
    t_brand = load_template("brand.md")
    t_campaign = {name: load_template(f"campaign/{name}") for name in CAMPAIGN_FILES}

    if (root / "brand.md").is_file():
        check_doc(report, root / "brand.md", t_brand)

    stages: dict[str, str] = {}
    for slug, folder in campaigns.items():
        stages[slug] = ""
        for name in CAMPAIGN_FILES:
            p = folder / name
            if not p.is_file():
                continue
            fm, body, start = check_doc(report, p, t_campaign[name], slug)
            if name == "state.md":
                stages[slug] = fm.get("stage", "")
            if name == "decisions.md":
                parse_entries(report, p, body, start)
        archive = folder / ARCHIVE_FILE
        if archive.is_file():
            _, body, start = check_doc(report, archive, t_campaign["decisions.md"], slug)
            parse_entries(report, archive, body, start)
        if baseline and (baseline / "campaigns" / slug).is_dir():
            check_append_only(report, folder, baseline / "campaigns" / slug)

    if baseline and (baseline / "campaigns").is_dir():
        for old in filter(visible, (baseline / "campaigns").iterdir()):
            if old.is_dir() and old.name not in campaigns:
                report.error(root / "campaigns" / old.name, 1, "append-only", "campaign folder was deleted; mark it `ended` instead")

    if (root / "README.md").is_file():
        _, body, start = check_doc(report, root / "README.md", t_index)
        check_index(report, root / "README.md", body, start, t_index.table_header or [], stages)

    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate a Meta ad harness ads/ folder.")
    parser.add_argument("ads_dir", type=Path, help="path to the ads/ folder")
    parser.add_argument("--baseline", type=Path, help="previous copy of ads/, to enforce append-only decisions")
    args = parser.parse_args(argv)

    report = validate(args.ads_dir.resolve(), args.baseline.resolve() if args.baseline else None)
    for w in report.warnings:
        print(f"WARN  {w}")
    for e in report.errors:
        print(f"ERROR {e}")
    if report.errors:
        print(f"\n{len(report.errors)} error(s). See RULES.md.")
        return 1
    print(f"OK: {args.ads_dir} matches the contract ({len(report.warnings)} warning(s)).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
