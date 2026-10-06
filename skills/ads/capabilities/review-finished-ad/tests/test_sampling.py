import importlib.util
import sys
from pathlib import Path

path = Path(__file__).parents[1] / "scripts/review_finished_ad.py"
spec = importlib.util.spec_from_file_location("review_sampling", path)
review = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = review
spec.loader.exec_module(review)


def test_continuous_fifteen_second_body_covers_early_and_late():
    times = review.sample_times(18, [], 3)
    assert len(times) >= 6
    assert times[0] <= 0.2 and times[-1] >= 14.8
    assert len(times) == len(set(times)) and all(0 <= t < 15 for t in times)


def test_many_cuts_keep_late_coverage_within_cap():
    times = review.sample_times(33, list(range(1, 30)), 3)
    assert len(times) <= 17
    assert times[0] <= 0.2 and times[-1] >= 29.8
    assert any(14 < t < 16 for t in times)


def test_short_body_and_all_endcard_are_bounded():
    assert review.sample_times(1, [], 3) == []
    times = review.sample_times(1, [], 0.5)
    assert times and all(0 <= t < 0.5 for t in times)
    assert review.sample_times(18, [], 3, cap=0) == []
