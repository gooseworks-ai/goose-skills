#!/usr/bin/env python3
"""Offline adapter tests for youtube-apify-transcript normalize helpers."""

from __future__ import annotations

import unittest

from fetch_transcript import build_actor_input, normalize_transcript_result


class BuildActorInputTests(unittest.TestCase):
    """Cover johnvc/YoutubeTranscripts run input."""

    def test_url_only(self) -> None:
        """A watch URL becomes youtube_url with no language list."""
        payload = build_actor_input("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        self.assertEqual(
            payload,
            {"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
        )

    def test_language_list(self) -> None:
        """--lang becomes a one-item languages array."""
        payload = build_actor_input(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            language="de",
        )
        self.assertEqual(payload["languages"], ["de"])


class NormalizeTranscriptResultTests(unittest.TestCase):
    """Cover live johnvc rows, cached pintostudio rows, and failures."""

    def test_johnvc_timestamped_duration_maps_to_dur(self) -> None:
        """Live Actor rows keep the skill's start/dur/text field names."""
        normalized = normalize_transcript_result(
            {
                "success": True,
                "error": False,
                "title": "Example",
                "language": "en",
                "timestamped": [
                    {"start": 0.0, "duration": 2.5, "text": "Hello"},
                    {"start": 2.5, "duration": 3.0, "text": "world"},
                ],
            }
        )
        self.assertEqual(normalized["title"], "Example")
        self.assertEqual(normalized["language"], "en")
        self.assertEqual(
            normalized["segments"],
            [
                {"start": 0.0, "dur": 2.5, "text": "Hello"},
                {"start": 2.5, "dur": 3.0, "text": "world"},
            ],
        )

    def test_cached_pintostudio_data_rows_still_parse(self) -> None:
        """Older cache files that stored data[] with dur keep working."""
        normalized = normalize_transcript_result(
            {
                "title": "Cached",
                "language": "en",
                "data": [
                    {"start": "1.0", "dur": "1.5", "text": "cached cue"},
                ],
            }
        )
        self.assertEqual(
            normalized["segments"],
            [{"start": 1.0, "dur": 1.5, "text": "cached cue"}],
        )

    def test_failed_actor_row_raises(self) -> None:
        """A success=false dataset item becomes a ValueError."""
        with self.assertRaises(ValueError) as caught:
            normalize_transcript_result(
                {
                    "success": False,
                    "error": True,
                    "error_message": "captions unavailable",
                    "title": "Missing",
                }
            )
        self.assertIn("captions unavailable", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
