import json
from pathlib import Path
import sys
import tempfile
import unittest
import subprocess
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import edit_timeline
import build_looks


class EditTimelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="recut path spaces ")
        self.root = Path(self.tmp.name).resolve()
        self.map = {
            "source": str(self.root / "original take.mp4"),
            "output": str(self.root / "recut take.mp4"),
            "source_duration": 4.0,
            "output_duration": 3.0,
            "segments": [
                {"src_start": 2, "src_end": 3, "out_start": 0, "out_end": 1},
                {"src_start": 0, "src_end": 1, "out_start": 1, "out_end": 2},
                {"src_start": 2, "src_end": 3, "out_start": 2, "out_end": 3},
            ],
        }
        self.rows = [(0.1, 0.7, "ALPHA", "answer", "", "Alpha."),
                     (2.1, 2.7, "BETA", "payoff", "", "Beta."),
                     (3.1, 3.7, "GAMMA", "answer", "", "Gamma.")]
        self.words = [(0.2, 0.4, "Alpha."), (2.2, 2.4, "Beta."), (3.2, 3.4, "Gamma.")]

    def tearDown(self):
        self.tmp.cleanup()

    def test_moved_repeated_dropped_words_follow_output_order(self):
        rows = edit_timeline.captions_after_edit(self.rows, self.map, self.words)
        self.assertEqual([row[2] for row in rows], ["BETA", "ALPHA", "BETA"])
        for row, start in zip(rows, [0.2, 1.2, 2.2]):
            self.assertAlmostEqual(row[0], start)
        self.assertTrue(all(row[1] <= self.map["output_duration"] for row in rows))

    def test_partial_line_keeps_only_whole_audible_words(self):
        plan = {**self.map, "source_duration": 2, "output_duration": 1,
                "segments": [{"src_start": 1, "src_end": 2, "out_start": 0, "out_end": 1}]}
        words = [(0.2, 0.4, "Alpha"), (1.2, 1.5, "ending.")]
        rows = edit_timeline.captions_after_edit([(0, 2, "ALPHA ENDING", "answer", "", "Alpha ending.")], plan, words)
        self.assertEqual(rows[0][2], "ENDING.")
        self.assertEqual(rows[0][5], "ending.")
        self.assertAlmostEqual(rows[0][0], 0.2)
        self.assertGreaterEqual(rows[0][1], 0.5)

    def test_spoken_boundary_word_stops_even_when_title_is_not_literal(self):
        plan = {**self.map, "source_duration": 2, "output_duration": 1,
                "segments": [{"src_start": 0, "src_end": 1, "out_start": 0, "out_end": 1}]}
        with self.assertRaisesRegex(ValueError, "cuts spoken word"):
            edit_timeline.captions_after_edit([(0, 2, "TITLE", "title", "", "Title")], plan,
                                              [(0.8, 1.2, "ending")])

    def test_partial_spoken_span_without_word_times_cannot_copy_full_sentence(self):
        with self.assertRaisesRegex(ValueError, "measured original word timings"):
            edit_timeline.captions_after_edit([(0, 2, "ALPHA ENDING", "answer", "", "Alpha ending.")], self.map)

    def test_missing_source_measurement_cannot_silently_drop_a_kept_caption(self):
        with self.assertRaisesRegex(ValueError, "no measured words"):
            edit_timeline.captions_after_edit(self.rows, self.map, [(3.2, 3.4, "Gamma.")])

    def test_missing_local_transcription_has_no_original_time_fallback(self):
        import brandkit
        with patch.dict(sys.modules, {"whisper": None}):
            with self.assertRaisesRegex(SystemExit, "whisper is not installed"):
                edit_timeline.measure_words(self.root / "source.mp4", brandkit.load("demo-tallgrass-oat"))

    def test_real_entry_flags_reject_conflicting_or_unbound_finishing_modes(self):
        scripts = Path(__file__).resolve().parents[1] / "scripts"
        for filename, args in [("build_looks.py", ["--pregraded"]),
                               ("build_looks.py", ["--word-times", "words.json"]),
                               ("check-cut.py", ["--word-times", "words.json"]),
                               ("check-cut.py", ["--episode", "episode.json", "--edit-map", "map.json"])]:
            result = subprocess.run([sys.executable, str(scripts / filename), *args],
                                    capture_output=True, text=True, cwd=self.root)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertTrue("requires --edit-map" in result.stderr or "different finishing paths" in result.stderr)

    def test_measured_cuts_and_noncontiguous_edit_joins_share_the_map(self):
        self.assertEqual(edit_timeline.cuts_after_edit([0.5, 2.5, 3.5], self.map), [0.5, 1.0, 1.5, 2.0, 2.5])

    def test_contiguous_source_spans_do_not_invent_a_shot(self):
        plan = {**self.map, "output_duration": 2,
                "segments": [{"src_start": 0, "src_end": 1, "out_start": 0, "out_end": 1},
                             {"src_start": 1, "src_end": 2, "out_start": 1, "out_end": 2}]}
        self.assertEqual(edit_timeline.cuts_after_edit([], plan), [])

    def test_parser_preserves_space_paths_and_rejects_stale_or_invalid_maps(self):
        path = self.root / "recut take.plan.json"
        path.write_text(json.dumps(self.map))
        self.assertEqual(edit_timeline.load_map(path)["source"], self.map["source"])
        for field, value in [("output_duration", 5), ("source_duration", float("nan"))]:
            invalid = {**self.map, field: value}
            path.write_text(json.dumps(invalid))
            with self.assertRaises(ValueError):
                edit_timeline.load_map(path)
        invalid = json.loads(json.dumps(self.map))
        invalid["segments"][1]["out_start"] = 1.1
        path.write_text(json.dumps(invalid))
        with self.assertRaisesRegex(ValueError, "contiguous"):
            edit_timeline.load_map(path)

    def test_changed_source_or_output_cannot_reuse_fingerprinted_map(self):
        source, output = Path(self.map["source"]), Path(self.map["output"])
        source.write_bytes(b"original"); output.write_bytes(b"edited")
        plan = {**self.map, "source_sha256": edit_timeline.file_hash(source),
                "output_sha256": edit_timeline.file_hash(output)}
        path = self.root / "edit.plan.json"
        path.write_text(json.dumps(plan))
        self.assertEqual(edit_timeline.load_map(path)["source"], str(source))
        output.write_bytes(b"other edited take")
        with self.assertRaisesRegex(ValueError, "output changed"):
            edit_timeline.load_map(path)
        output.write_bytes(b"edited"); source.write_bytes(b"replaced original")
        with self.assertRaisesRegex(ValueError, "source changed"):
            edit_timeline.load_map(path)

    def test_word_file_is_bound_to_this_original_source(self):
        path = self.root / "words.json"
        path.write_text(json.dumps({"source": self.map["source"], "words": self.words}))
        self.assertEqual(edit_timeline.load_words(path, self.map["source"]), [list(w) for w in self.words])
        source = Path(self.map["source"]); source.write_bytes(b"source")
        path.write_text(json.dumps({"source": str(source), "source_sha256": edit_timeline.file_hash(source), "words": self.words}))
        source.write_bytes(b"new source")
        with self.assertRaisesRegex(ValueError, "source changed"):
            edit_timeline.load_words(path, source)
        with self.assertRaisesRegex(ValueError, "original source"):
            edit_timeline.load_words(path, self.map["output"])

    def test_resolve_keeps_original_ambience_and_separate_recut_outputs(self):
        import brandkit
        cfg = brandkit.load("liquid-death")
        cfg["brand_layer"].update({"logo": None, "cuts": [0.5, 2.5, 3.5], "captions": self.rows})
        brand = self.root / "brand.json"
        brand.write_text(json.dumps(cfg))
        plan = self.root / "recut take.plan.json"
        plan.write_text(json.dumps(self.map))
        words = self.root / "words.json"
        words.write_text(json.dumps({"source": self.map["source"], "words": self.words}))
        build_looks.resolve(self.root, str(brand), plan, words)
        self.assertEqual(str(build_looks.SRC), self.map["output"])
        self.assertEqual(str(build_looks.SOURCE), self.map["source"])
        self.assertNotEqual(build_looks.BASE_TAKE, build_looks.SRC)
        self.assertIn("-recut-", build_looks.output_path("clean").name)
        self.assertIn("-recut-", build_looks.control_path("clean").name)
        self.assertEqual([r[2] for r in build_looks.LINES], ["BETA", "ALPHA", "BETA"])
        build_looks.resolve(self.root, str(brand))
        self.assertIsNone(build_looks.EDIT_MAP)
        self.assertEqual(build_looks.SOURCE, build_looks.SRC)
        self.assertNotIn("-recut-", build_looks.output_path("clean").name)


if __name__ == "__main__":
    unittest.main()
