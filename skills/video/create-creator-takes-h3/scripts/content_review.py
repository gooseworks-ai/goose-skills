"""Read actual source review evidence. Never convert file existence into a pass."""
import hashlib
import json
import pathlib
import subprocess


def source_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_take_review(reviews_path, take, path, duration=None):
    if not reviews_path:
        raise ValueError("supply --reviews with the actual source content review; transcription or file existence is insufficient")
    document = json.loads(pathlib.Path(reviews_path).read_text(encoding="utf-8"))
    entries = document.get("takes", [])
    matches = [entry for entry in entries if entry.get("id") == take["id"]]
    if len(matches) != 1:
        raise ValueError("take %s needs exactly one content review" % take["id"])
    review = matches[0]
    if review.get("status") != "pass" or review.get("source_sha256") != source_sha256(path):
        raise ValueError("take %s has failed, incomplete or stale source review" % take["id"])
    if not take.get("script_sha256") or review.get("script_sha256") != take["script_sha256"]:
        raise ValueError("take %s review names a different script" % take["id"])
    if not str(review.get("reviewer", "")).strip():
        raise ValueError("the actual reviewer is missing")
    if duration is None:
        duration = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True).stdout)
    coverage = review.get("coverage", {})
    # How the whole take was covered: watched/listened when a person or a capable model really did,
    # or measured (full-resolution frames plus word timing against the line). Measured is enough;
    # nobody has to claim a watch or a listen. The legacy booleans still mean watched/listened.
    motion = coverage.get("motion") or ("watched" if coverage.get("video_watched") is True else None)
    audio = coverage.get("audio") or ("listened" if coverage.get("audio_listened") is True else None)
    if motion not in ("watched", "measured") or audio not in ("listened", "measured"):
        raise ValueError("review must say how the whole take was covered: coverage.motion watched or measured, "
                         "and coverage.audio listened or measured")
    if "measured" in (motion, audio) and not [e for e in review.get("evidence") or [] if str(e).strip()]:
        raise ValueError("a measured review lists its evidence: the frames inspected and the word timing checked against the line")
    if not (coverage.get("start_s", 1) <= 0 and coverage.get("end_s", 0) >= duration - .02):
        raise ValueError("review must cover the complete source")
    checks = review.get("checks", {})
    for key in ("script", "voice", "lipsync", "identity", "framing", "performance"):
        if checks.get(key) != "pass":
            raise ValueError("take %s content check %s has not passed" % (take["id"], key))
    if checks.get("product_action") not in ("pass", "not_applicable"):
        raise ValueError("product/action correctness is unresolved")
    if take.get("product_action_required") and checks.get("product_action") != "pass":
        raise ValueError("a required product action cannot be marked not_applicable")
    return review
