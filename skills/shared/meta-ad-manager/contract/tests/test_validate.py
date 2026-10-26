"""Tests for validate.py: the sample passes, and each rule fails on one mutation.

Run from the contract folder:  python3 -m unittest discover tests
"""
from __future__ import annotations

import contextlib
import io
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

CONTRACT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CONTRACT))

import validate  # noqa: E402

SAMPLE = CONTRACT / "examples" / "sample-brand" / "ads"
LIVE = "campaigns/fall-subscription-launch"
DRAFT = "campaigns/holiday-gift-bundles"


class ContractTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp())
        self.ads = self.tmp / "ads"
        shutil.copytree(SAMPLE, self.ads)

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp)

    # helpers
    def edit(self, rel: str, old: str, new: str) -> None:
        p = self.ads / rel
        text = p.read_text()
        self.assertIn(old, text, f"fixture drift: {old!r} not in {rel}")
        p.write_text(text.replace(old, new, 1))

    def append(self, rel: str, text: str) -> None:
        p = self.ads / rel
        p.write_text(p.read_text() + text)

    def run_rules(self, baseline: Path | None = None) -> list[str]:
        report = validate.validate(self.ads, baseline)
        return [e.rule for e in report.errors]

    def assertFails(self, rule: str, baseline: Path | None = None) -> None:
        rules = self.run_rules(baseline)
        self.assertIn(rule, rules, f"expected a {rule!r} error, got {rules}")

    # ── the sample and the templates ─────────────────────────────────────────
    def test_sample_brand_validates(self):
        report = validate.validate(self.ads)
        self.assertEqual([str(e) for e in report.errors], [])

    def test_templates_define_the_schema(self):
        # Guards against a vacuous pass: an empty schema would accept anything.
        self.assertGreaterEqual(len(validate.load_template("brand.md").sections), 7)
        self.assertGreaterEqual(len(validate.load_template("campaign/strategy.md").sections), 8)
        self.assertIn("stage", validate.load_template("campaign/state.md").keys)
        self.assertEqual(
            validate.load_template("README.md").table_header,
            ["Campaign", "Stage", "Last action", "Next action", "Updated"],
        )

    def test_cli_exit_codes(self):
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(validate.main([str(self.ads)]), 0)
            (self.ads / "brand.md").unlink()
            self.assertEqual(validate.main([str(self.ads)]), 1)

    # ── rule 1: layout ───────────────────────────────────────────────────────
    def test_per_finding_file_is_rejected(self):
        (self.ads / LIVE / "finding-2026-09-24.md").write_text("x")
        self.assertFails("layout")

    def test_per_poll_file_at_top_is_rejected(self):
        (self.ads / "poll-0924.json").write_text("{}")
        self.assertFails("layout")

    def test_missing_campaign_file(self):
        (self.ads / DRAFT / "decisions.md").unlink()
        self.assertFails("layout")

    def test_dotfiles_are_ignored(self):
        (self.ads / ".s3fs_tmp").write_text("x")
        (self.ads / LIVE / ".DS_Store").write_text("x")
        self.assertEqual(self.run_rules(), [])

    def test_archive_file_is_allowed(self):
        (self.ads / LIVE / "decisions-archive.md").write_text("---\ncampaign: fall-subscription-launch\n---\n")
        self.assertEqual(self.run_rules(), [])

    def test_bad_slug(self):
        (self.ads / DRAFT).rename(self.ads / "campaigns" / "Holiday_Gifts")
        self.assertFails("layout")

    # ── rule 2: frontmatter ──────────────────────────────────────────────────
    def test_bad_enum(self):
        self.edit("brand.md", "familiarity: novice", "familiarity: beginner")
        self.assertFails("frontmatter")

    def test_placeholder_left_in(self):
        self.edit(f"{LIVE}/state.md", "updated_by: meta-ad-manager", "updated_by: <string>")
        self.assertFails("frontmatter")

    def test_bad_date(self):
        self.edit(f"{LIVE}/strategy.md", "updated_at: 2026-09-24", "updated_at: 2026-02-30")
        self.assertFails("frontmatter")

    def test_campaign_key_must_match_folder(self):
        self.edit(f"{LIVE}/state.md", "campaign: fall-subscription-launch", "campaign: other")
        self.assertFails("frontmatter")

    def test_missing_key(self):
        self.edit(f"{DRAFT}/state.md", "meta_campaign_id: none\n", "")
        self.assertFails("frontmatter")

    # ── rule 3: sections ─────────────────────────────────────────────────────
    def test_missing_section(self):
        self.edit(f"{LIVE}/strategy.md", "## Reasoning", "## Why")
        self.assertFails("section")

    # ── rule 4: index ────────────────────────────────────────────────────────
    def test_index_stage_must_match_state(self):
        self.edit("README.md", "| holiday-gift-bundles | strategy |", "| holiday-gift-bundles | live |")
        self.assertFails("index")

    def test_campaign_missing_from_index(self):
        self.edit("README.md", "| holiday-gift-bundles |", "| holiday-gift-bundles-old |")
        rules = self.run_rules()
        self.assertGreaterEqual(rules.count("index"), 2)  # orphan row + unlisted folder

    # ── rules 5-6: observed lines ────────────────────────────────────────────
    def test_plan_numbers_need_no_date(self):
        # Goose's own decisions carry plain numbers: this must NOT fail.
        self.append(f"{LIVE}/strategy.md", "\nSpend $50 over 7 days on 2 to 3 ads; CPA target $45.\n")
        self.assertEqual(self.run_rules(), [])

    def test_observed_without_tag(self):
        self.append(f"{LIVE}/state.md", "\n- Observed: spend $212 last week\n")
        self.assertFails("observed")

    def test_observed_window_out_of_order(self):
        self.append(
            f"{LIVE}/state.md",
            "\n- Observed: 40 purchases [window 2026-09-20..2026-09-10; synced 2026-09-24T09:00Z; source report:r1]\n",
        )
        self.assertFails("observed")

    def test_observed_synced_before_window_end(self):
        self.append(
            f"{LIVE}/state.md",
            "\n- Observed: 40 purchases [window 2026-09-20..2026-09-23; synced 2026-09-22T09:00Z; source report:r1]\n",
        )
        self.assertFails("observed")

    def test_observed_called_current(self):
        self.append(
            f"{LIVE}/state.md",
            "\n- Observed: current CPA is $41 [window 2026-09-23..2026-09-23; synced 2026-09-24T09:00Z; source report:r1]\n",
        )
        self.assertFails("observed")

    def test_observed_sync_time_may_carry_seconds(self):
        self.append(
            f"{LIVE}/state.md",
            "\n- Observed: 40 purchases [window 2026-09-20..2026-09-23; synced 2026-09-24T09:00:05Z; source report:r1]\n",
        )
        self.assertEqual(self.run_rules(), [])

    def test_observed_in_comment_is_ignored(self):
        self.append(f"{LIVE}/state.md", "\n<!-- Observed: example only -->\n")
        self.assertEqual(self.run_rules(), [])

    # ── rule 7: decisions shape ──────────────────────────────────────────────
    def test_entry_missing_field(self):
        self.edit(f"{LIVE}/decisions.md", "- Evidence: report:rep_sample_0923\n", "")
        self.assertFails("decisions")

    def test_entry_dates_go_backwards(self):
        self.append(
            f"{LIVE}/decisions.md",
            "\n### 2026-09-01 — Late entry\n- Recommended: x\n- Evidence: y\n- Decided: z\n- Outcome: pending\n",
        )
        self.assertFails("decisions")

    def test_bad_entry_heading(self):
        self.append(
            f"{LIVE}/decisions.md",
            "\n### Sept 30 — No ISO date\n- Recommended: x\n- Evidence: y\n- Decided: z\n- Outcome: pending\n",
        )
        self.assertFails("decisions")

    # ── rule 8: append-only ──────────────────────────────────────────────────
    def baseline(self) -> Path:
        base = self.tmp / "baseline"
        shutil.copytree(self.ads, base)
        return base

    def test_append_is_allowed(self):
        base = self.baseline()
        self.append(
            f"{LIVE}/decisions.md",
            "\n### 2026-09-25 — Keep two ads\n- Recommended: x\n- Evidence: y\n- Decided: z\n- Outcome: pending\n",
        )
        self.assertEqual(self.run_rules(base), [])

    def test_filling_a_pending_outcome_is_allowed(self):
        base = self.baseline()
        self.edit(f"{DRAFT}/decisions.md", "- Outcome: pending", "- Outcome: Owner approved on 2026-09-25.")
        self.assertEqual(self.run_rules(base), [])

    def test_editing_an_earlier_entry_fails(self):
        base = self.baseline()
        self.edit(f"{LIVE}/decisions.md", "Owner approved in chat.", "Owner declined.")
        self.assertFails("append-only", base)

    def test_rewriting_a_known_outcome_fails(self):
        base = self.baseline()
        self.edit(f"{LIVE}/decisions.md", "Live on Meta 2026-09-16", "Live on Meta 2026-09-17")
        self.assertFails("append-only", base)

    def test_removing_an_entry_fails(self):
        base = self.baseline()
        p = self.ads / LIVE / "decisions.md"
        p.write_text(p.read_text().split("### 2026-09-23")[0])
        self.assertFails("append-only", base)

    def test_archiving_keeps_the_log_whole(self):
        base = self.baseline()
        p = self.ads / LIVE / "decisions.md"
        head, first, rest = p.read_text().partition("### 2026-09-16")
        entry, second, tail = (first + rest).partition("### 2026-09-23")
        (self.ads / LIVE / "decisions-archive.md").write_text(head + entry)
        p.write_text(head + second + tail)
        self.assertEqual(self.run_rules(base), [])

    def test_deleting_a_campaign_folder_fails(self):
        base = self.baseline()
        shutil.rmtree(self.ads / DRAFT)
        self.edit("README.md", "| holiday-gift-bundles | strategy | Drafted strategy v1 from intake | User approves budget and ad count | 2026-09-23 |\n", "")
        self.assertFails("append-only", base)

    # ── rule 9: size ─────────────────────────────────────────────────────────
    def test_state_over_cap(self):
        self.append(f"{LIVE}/state.md", "\n" + ("padding line of text\n" * 500))
        self.assertFails("size")

    def test_decisions_warns_then_fails(self):
        entry = "\n### 2026-09-30 — Filler\n- Recommended: " + "x" * 900 + "\n- Evidence: y\n- Decided: z\n- Outcome: pending\n"
        self.append(f"{LIVE}/decisions.md", entry * 52)  # ~49 KB
        report = validate.validate(self.ads)
        self.assertEqual(report.errors, [])
        self.assertIn("size", [w.rule for w in report.warnings])
        self.append(f"{LIVE}/decisions.md", entry * 20)  # > 64 KB
        self.assertFails("size")


if __name__ == "__main__":
    unittest.main()
