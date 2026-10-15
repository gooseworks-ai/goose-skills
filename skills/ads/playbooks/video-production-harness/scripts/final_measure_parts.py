"""Helpers and the sound and word checks of gooseworks-final-measure/1 (see final_measure.py)."""
import cmath
import json
import math
from pathlib import Path
import re
import sys

_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from assembly_timeline import MAX_END_FREEZE_MS, MAX_FREEZE_MS, MAX_PAUSE_MS, MAX_PAUSE_SHARE  # noqa: E402
from reference_rate import speech_rate  # noqa: E402
from reference_shots import FLAT_STDDEV, SETUP_MAX_HAMMING, SETUP_MIN_SHOT_S, TOLERANCE as SETUP_TOLERANCE  # noqa: E402

THRESHOLDS = {
    "digital_silence_peak_dbfs": -60, "digital_zero_run_s": 1.0,
    "tone_fft_size": 4096, "tone_window_s": 0.5, "tone_peak_halfwidth_bins": 2,
    "tone_max_peaks": 3, "tone_peak_energy_share": 0.8, "tone_steady_share": 0.5,
    "quiet_dbfs": -45, "quiet_window_ms": 100, "unplanned_silence_s": 1.0,
    "speech_gap_in_sentence_s": 0.6, "speech_rate_min_ratio": 0.85,
    "max_pause_ms": MAX_PAUSE_MS, "max_pause_share": MAX_PAUSE_SHARE,
    "tone_band_hz": [80, 8000],
    "freeze_noise": 0.003, "freeze_min_s": 1.0, "unplanned_freeze_s": 2.0,
    "max_frozen_share": 0.4, "reference_frozen_margin": 0.15,
    "max_freeze_ms": MAX_FREEZE_MS, "max_end_freeze_ms": MAX_END_FREEZE_MS,
    "start_allowance_s": 1.5, "end_allowance_s": 3.0,
    "repeated_shot_min_s": 1.0, "repeated_shot_max_hamming": 6, "scene_cut_threshold": 0.4,
    "setup_max_hamming": SETUP_MAX_HAMMING, "setup_min_shot_s": SETUP_MIN_SHOT_S, "setup_flat_stddev": FLAT_STDDEV,
    "setup_min_ratio": 1 - SETUP_TOLERANCE, "setup_cut_threshold": 0.15,
    "edge_words": 3, "edge_window_s": 4.0, "silent_face_s": 0.3,
}


def check(check_id, result, detail, intervals=None):
    return {"id": check_id, "result": result, "detail": detail,
            "intervals_ms": [[round(a * 1000), round(b * 1000)] for a, b in (intervals or [])]}


def covered(start_s, end_s, allowed, slack=0.1):
    """True when [start_s, end_s] sits inside one allowed (start_s, end_s) interval."""
    return any(a - slack <= start_s and end_s <= b + slack for a, b in allowed)


def beyond_edges(intervals, duration, minimum_s):
    """Parts of each interval outside the opening and ending allowance, kept when still over minimum_s.

    Silence or a still picture in the first 1.5 s or the last 3.0 s (an end card) needs no plan.
    """
    head, tail = THRESHOLDS["start_allowance_s"], duration - THRESHOLDS["end_allowance_s"]
    kept = []
    for start, end in intervals:
        start, end = max(start, head), min(end, tail)
        if end - start > minimum_s + 1e-9:
            kept.append((start, end))
    return kept


def runs(flags, step_s, minimum_s):
    """(start_s, end_s) of every run of True values longer than minimum_s."""
    found, opened = [], None
    for index, flag in enumerate(list(flags) + [False]):
        if flag and opened is None:
            opened = index
        elif not flag and opened is not None:
            if (index - opened) * step_s > minimum_s + 1e-9:
                found.append((opened * step_s, index * step_s))
            opened = None
    return found


def power_spectrum(frame):
    """Hann-windowed power spectrum (bins 0..n/2), radix-2 FFT in pure Python (no numpy needed)."""
    n = len(frame)
    hann = [0.5 - 0.5 * math.cos(2 * math.pi * i / (n - 1)) for i in range(n)]
    data = [complex(frame[i] * hann[i]) for i in range(n)]
    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j |= bit
        if i < j:
            data[i], data[j] = data[j], data[i]
    size = 2
    while size <= n:
        step = cmath.exp(-2j * math.pi / size)
        for start in range(0, n, size):
            w = 1
            for k in range(size // 2):
                a, b = data[start + k], data[start + k + size // 2] * w
                data[start + k], data[start + k + size // 2] = a + b, a - b
                w *= step
        size <<= 1
    return [abs(v) ** 2 for v in data[:n // 2 + 1]]


def tone_windows(rate, samples):
    """Per 0.5 s window: (is_tonal, dominant_bin). Tonal = >80% energy in <=3 narrow peaks."""
    size, half = THRESHOLDS["tone_fft_size"], THRESHOLDS["tone_peak_halfwidth_bins"]
    stride = max(1, round(rate * THRESHOLDS["tone_window_s"]))
    floor = (10 ** (THRESHOLDS["digital_silence_peak_dbfs"] / 20) * 32768) ** 2 * size
    low_hz, high_hz = THRESHOLDS["tone_band_hz"]
    first_bin, last_bin = math.ceil(low_hz * size / rate), math.floor(high_hz * size / rate)
    out = []
    for start in range(0, max(0, len(samples) - size + 1), stride):
        spectrum = power_spectrum(samples[start:start + size])
        # Only 80 Hz-8 kHz: a steady sub-bass line under real music is not a drone.
        spectrum = [v if first_bin <= k <= last_bin else 0.0 for k, v in enumerate(spectrum)]
        total = sum(spectrum)
        if total <= floor:
            out.append((False, None))
            continue
        remaining, peak_energy, dominant = list(spectrum), 0.0, None
        for _ in range(THRESHOLDS["tone_max_peaks"]):
            top = max(range(len(remaining)), key=remaining.__getitem__)
            if remaining[top] <= 0:
                break
            dominant = top if dominant is None else dominant
            low, high = max(0, top - half), min(len(remaining), top + half + 1)
            peak_energy += sum(remaining[low:high])
            for index in range(low, high):
                remaining[index] = 0.0
        out.append((peak_energy / total > THRESHOLDS["tone_peak_energy_share"], dominant))
    return out


def tokens(text):
    return [w for w in re.sub(r"[^\w\s']", " ", str(text).lower()).replace("'", "").split() if w]


def script_lines(path):
    if not path:
        return []
    text = Path(path).read_text()
    try:
        data = json.loads(text)
    except ValueError:
        return [line for line in text.splitlines() if line.strip()]
    if isinstance(data, dict):
        data = data.get("lines", data.get("script", []))
    if isinstance(data, str):
        return [line for line in data.splitlines() if line.strip()]
    return [str(line.get("text", line.get("vo", ""))) if isinstance(line, dict) else str(line) for line in data if line]


def sound_checks(has_audio, pcm, activity, duration, silent_plan, silent_reason, allowed_pauses):
    """digital_silence, tone_only and unplanned_silence; also returns the 100 ms quiet flags."""
    checks, thresholds = [], THRESHOLDS
    step = thresholds["quiet_window_ms"] / 1000
    if silent_plan:
        checks.append(check("digital_silence", "not_applicable", silent_reason))
        if not has_audio:
            checks.append(check("tone_only", "not_applicable", "No audio track"))
    elif not has_audio:
        checks.append(check("digital_silence", "fail", "The final has no audio track", [(0, duration)]))
        checks.append(check("tone_only", "not_applicable", "No audio track"))
    if has_audio:
        rate, samples = pcm
        peak = max((abs(s) for s in samples), default=0) / 32768
        peak_db = 20 * math.log10(peak) if peak else None
        zeros = beyond_edges(runs((s == 0 for s in samples), 1 / rate, thresholds["digital_zero_run_s"]),
                             duration, thresholds["digital_zero_run_s"])
        if silent_plan:
            pass
        elif peak_db is None or peak_db < thresholds["digital_silence_peak_dbfs"]:
            checks.append(check("digital_silence", "fail", f"Whole-track peak {peak_db if peak_db is None else round(peak_db, 1)} dBFS is below {thresholds['digital_silence_peak_dbfs']} dBFS", [(0, duration)]))
        elif zeros:
            checks.append(check("digital_silence", "fail", f"{len(zeros)} run(s) of exact digital zero longer than {thresholds['digital_zero_run_s']} s", zeros))
        else:
            checks.append(check("digital_silence", "pass", f"Peak {round(peak_db, 1)} dBFS; no exact-zero run over {thresholds['digital_zero_run_s']} s"))
        windows = tone_windows(rate, samples)
        bins = [b for tonal, b in windows if tonal]
        steady = 0
        if bins:
            mode = max(set(bins), key=lambda b: sum(abs(b - other) <= thresholds["tone_peak_halfwidth_bins"] for other in bins))
            steady = sum(1 for tonal, b in windows if tonal and abs(b - mode) <= thresholds["tone_peak_halfwidth_bins"])
        share = steady / len(windows) if windows else 0
        if windows and share > thresholds["tone_steady_share"]:
            hz = round(mode * rate / thresholds["tone_fft_size"])
            checks.append(check("tone_only", "fail", f"Steady tone near {hz} Hz holds {round(share * 100)}% of the track; a sine bed or drone is not music", [(0, duration)]))
        else:
            checks.append(check("tone_only", "pass", f"Steady tonal windows {round(share * 100)}%"))
    quiet = [w["near_silent"] for w in activity] if has_audio else [True] * max(1, math.ceil(duration / step))
    silent_runs = [(a, min(b, duration)) for a, b in runs(quiet, step, thresholds["unplanned_silence_s"])]
    unplanned = beyond_edges([r for r in silent_runs if not covered(r[0], r[1], allowed_pauses)],
                             duration, thresholds["unplanned_silence_s"])
    if silent_plan:
        checks.append(check("unplanned_silence", "not_applicable", silent_reason))
    else:
        checks.append(check("unplanned_silence", "fail" if unplanned else "pass",
                            f"{len(unplanned)} stretch(es) quieter than {thresholds['quiet_dbfs']} dBFS for over {thresholds['unplanned_silence_s']} s with no planned pause" if unplanned
                            else "No unplanned silence over the limit", unplanned))
    return checks, quiet


def word_checks(words, final_sha, lines, raw_timeline, reference_rate):
    """speech_gap_in_sentence, speech_rate_vs_reference and first_last_words."""
    checks, thresholds = [], THRESHOLDS
    speech_expected = bool(lines) or (raw_timeline or {}).get("speech_mode") not in (None, "none")
    word_list = []
    if isinstance(words, dict) and isinstance(words.get("words"), list):
        if words.get("output_sha256") == final_sha:
            for word in words["words"]:
                start, end = word.get("start_s", word.get("start")), word.get("end_s", word.get("end"))
                if isinstance(start, (int, float)) and isinstance(end, (int, float)) and math.isfinite(start) and math.isfinite(end) and 0 <= start <= end:
                    word_list.append({"text": str(word.get("text", word.get("word", ""))), "start": float(start), "end": float(end)})
    no_words = ("No word timings for these exact bytes (pass --words); GooseWorks measures this from its own transcript when you report complete"
                if speech_expected else "No speech planned")
    if word_list:
        gaps_found = []
        for left, right in zip(word_list, word_list[1:]):
            if not re.search(r"[.!?]['\")\]]*$", left["text"].strip()) and right["start"] - left["end"] > thresholds["speech_gap_in_sentence_s"]:
                gaps_found.append((left["end"], right["start"]))
        checks.append(check("speech_gap_in_sentence", "fail" if gaps_found else "pass",
                            f"{len(gaps_found)} gap(s) over {thresholds['speech_gap_in_sentence_s']} s inside a sentence" if gaps_found else "No gap inside a sentence over the limit", gaps_found))
    else:
        checks.append(check("speech_gap_in_sentence", "not_applicable", no_words))
    _, _, rate = speech_rate([(w["text"], w["start"], w["end"]) for w in word_list if re.search(r"\w", w["text"])])
    if rate and reference_rate:
        floor = thresholds["speech_rate_min_ratio"] * reference_rate
        checks.append(check("speech_rate_vs_reference", "fail" if rate < floor else "pass",
                            f"Speech {rate} words/s against the reference's {round(reference_rate, 3)} ({round(rate / reference_rate * 100)}%); under {round(floor, 3)} fails",
                            [(word_list[0]["start"], word_list[-1]["end"])] if rate < floor else []))
    else:
        checks.append(check("speech_rate_vs_reference", "not_applicable",
                            "Needs word timings for this final (--words) and the reference (--reference-words)"))
    script_words = [tokens(line) for line in lines]
    script_words = [w for w in script_words if w]
    if word_list and script_words:
        edge, window = thresholds["edge_words"], thresholds["edge_window_s"]
        first_start, last_end = word_list[0]["start"], word_list[-1]["end"]
        head = [(t, w) for w in word_list if w["start"] <= first_start + window for t in tokens(w["text"])]
        tail = [(t, w) for w in word_list if w["end"] >= last_end - window for t in tokens(w["text"])]
        problems, spans = [], []
        missing_head = [t for t in script_words[0][:edge] if t not in {h for h, _ in head}]
        missing_tail = [t for t in script_words[-1][-edge:] if t not in {h for h, _ in tail}]
        if missing_head:
            problems.append("opening words missing: " + " ".join(missing_head)); spans.append((first_start, first_start + window))
        if missing_tail:
            problems.append("closing words missing: " + " ".join(missing_tail)); spans.append((max(0, last_end - window), last_end))
        vocabulary = {t for line in script_words for t in line}
        first_token = script_words[0][0]
        index = next((i for i, (t, _) in enumerate(head) if t == first_token), None)
        stray = [(t, w) for t, w in head[:index]] if index is not None else []
        stray = [(t, w) for t, w in stray if t not in vocabulary]
        if stray:
            problems.append("words before the script starts: " + " ".join(t for t, _ in stray))
            spans.append((stray[0][1]["start"], stray[-1][1]["end"]))
        checks.append(check("first_last_words", "fail" if problems else "pass", "; ".join(problems) or "First and last scripted words are present", spans))
    else:
        checks.append(check("first_last_words", "not_applicable", "No script lines (pass --script)" if word_list else no_words))
    return checks
