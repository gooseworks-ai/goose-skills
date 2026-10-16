"""What a gooseworks-final-measure/1 result means for delivery (references/check-severity.md).

A failed check is a finding graded must_fix, ask or fine (SEVERITY in final_measure_parts.py).
Only a broken file is a hard failure: the length is wrong, or there is no sound when sound is
planned. (A file that can't be played at all never reaches here; qc_evidence.py reports it.)
"""
import math
from pathlib import Path
import sys

_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from final_measure import silent_by_choice  # noqa: E402
from final_measure_parts import SEVERITY, THRESHOLDS  # noqa: E402

# A final more than this far from the timeline's planned length is broken (a cut-off render or
# a doubled tail), not a taste call. The host warns from 0.5 s.
LENGTH_TOLERANCE_S = 1.0


def broken_reasons(duration, has_audio, pcm, raw_timeline, receipt=None, final_sha=None):
    """[{id, detail}] for a wrong length or no sound when sound is planned; [] when the file is whole.
    A receipt bound to other bytes is broken data, and its plan (length, silence) is not trusted."""
    broken = []
    raw_timeline = raw_timeline if isinstance(raw_timeline, dict) else None
    if isinstance(receipt, dict) and receipt.get("output_sha256") not in (None, final_sha):
        broken.append({"id": "timeline_mismatch", "detail": "The timeline receipt names other final bytes; pass this final's receipt"})
        raw_timeline = None
    planned_ms = (raw_timeline or {}).get("duration_ms")
    if isinstance(planned_ms, int) and not isinstance(planned_ms, bool) and planned_ms > 0 \
            and abs(duration - planned_ms / 1000) > LENGTH_TOLERANCE_S:
        broken.append({"id": "length", "detail": f"The file is {round(duration, 2)} s; the timeline plans {planned_ms / 1000} s (over {LENGTH_TOLERANCE_S} s off)"})
    if not silent_by_choice(raw_timeline):
        if not has_audio:
            broken.append({"id": "no_sound", "detail": "Sound is planned but the file has no audio track"})
        else:
            peak = max((abs(v) for v in pcm[1]), default=0) / 32768
            floor = THRESHOLDS["digital_silence_peak_dbfs"]
            if not peak or 20 * math.log10(peak) < floor:
                broken.append({"id": "no_sound", "detail": f"Sound is planned but the whole track peaks below {floor} dBFS"})
    return broken


def graded_findings(measure):
    """Every failed check with its severity; an unknown check id is ask."""
    return [{"id": c["id"], "severity": SEVERITY.get(c["id"], "ask"), "detail": c["detail"], "intervals_ms": c["intervals_ms"]}
            for c in measure["checks"] if c["result"] == "fail"]


def quality_status(broken, findings):
    severities = {f["severity"] for f in findings}
    return ("broken" if broken else "must_fix" if "must_fix" in severities
            else "ask" if "ask" in severities else "fine" if severities else "no_measured_findings")
