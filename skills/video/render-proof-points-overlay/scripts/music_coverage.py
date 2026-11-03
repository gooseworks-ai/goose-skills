"""Check an approved music bed and optionally extend a reviewed instrumental.

This checks audible coverage, not musical quality. Looping remains opt-in and
requires listening to the joins in the finished master.
"""
from array import array
import math
from pathlib import Path
import subprocess
import sys

RATE = 16000
WINDOW = 0.02
MAX_GAP = 0.35
FLOOR = 10 ** (-55 / 20)


def levels(path, seconds):
    result = subprocess.run([
        "ffmpeg", "-v", "error", "-i", str(path), "-t", str(seconds),
        "-vn", "-ac", "1", "-ar", str(RATE), "-f", "s16le", "-",
    ], check=True, capture_output=True)
    samples = array("h", result.stdout)
    if sys.byteorder != "little":
        samples.byteswap()
    width = round(RATE * WINDOW)
    rms = [
        math.sqrt(sum(v * v for v in samples[i:i + width]) / len(samples[i:i + width])) / 32768
        for i in range(0, len(samples), width)
    ]
    return len(samples) / RATE, rms


def has_gap(rms, threshold):
    gap = 0
    for level in rms:
        gap = gap + 1 if level < threshold else 0
        if gap * WINDOW > MAX_GAP:
            return True
    return False


def coverage(path, seconds, fade=0.5):
    length, rms = levels(path, seconds)
    if length < seconds - WINDOW:
        return f"music is {length:.2f}s long; the master needs {seconds:.2f}s"
    if not rms or max(rms) < FLOOR:
        return "music has no audible content"
    threshold = max(FLOOR, max(rms) * 10 ** (-30 / 20))
    count = max(1, math.ceil((seconds - fade) / WINDOW))
    if has_gap(rms[:count], threshold):
        return "music has an inaudible gap before the final fade"
    # An internal rest may be brief, but a terminal rest must not borrow the
    # final fade window and silently extend the ending. Require music at its edge.
    if rms[count - 1] < threshold:
        return "music ends before the final fade"
    return None


def prepare_music(source, output, seconds, loop=False):
    if isinstance(seconds, bool) or not isinstance(seconds, (int, float)) or not math.isfinite(seconds) or not 0 < seconds <= 180:
        raise ValueError("duration_sec must be a positive number at most 180")
    source, output = Path(source), Path(output)
    if not source.is_file():
        raise ValueError("missing music bed; supply approved music or explicitly use --no-music for a silent preview")
    fade = min(0.5, seconds / 2)
    problem = coverage(source, seconds, fade)
    looped = False
    if problem and not loop:
        raise ValueError(problem + "; supply a full-length bed or use --loop-music for a reviewed loopable instrumental")
    command = ["ffmpeg", "-y", "-v", "error", "-i", str(source)]
    if problem:
        _, rms = levels(source, seconds)
        peak = max(rms, default=0)
        active = [i for i, level in enumerate(rms) if level >= max(FLOOR, peak * 0.25)]
        if not active:
            raise ValueError("music has no usable instrumental section; supply a replacement")
        start, end = active[0] * WINDOW, (active[-1] + 1) * WINDOW
        span = end - start
        if span < 2 or has_gap(rms[active[0]:active[-1] + 1], max(FLOOR, peak * 10 ** (-30 / 20))):
            raise ValueError("music has no continuous section of at least 2s; supply a replacement")
        crossfade = min(0.5, span / 4)
        copies = max(2, math.ceil(max(0, seconds - span) / (span - crossfade)) + 1)
        if copies > 64:
            raise ValueError("music would need too many joins; supply a longer replacement")
        graph = [f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,asplit={copies}" +
                 "".join(f"[a{i}]" for i in range(copies))]
        previous = "a0"
        for i in range(1, copies):
            current = f"join{i}"
            graph.append(f"[{previous}][a{i}]acrossfade=d={crossfade}:c1=tri:c2=tri[{current}]")
            previous = current
        graph.append(f"[{previous}]atrim=duration={seconds},afade=t=out:st={seconds - fade}:d={fade}[music]")
        command += ["-filter_complex", ";".join(graph), "-map", "[music]"]
        looped = True
    else:
        command += ["-vn", "-af", f"afade=t=out:st={seconds - fade}:d={fade}"]
    output.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(command + ["-t", str(seconds), "-c:a", "pcm_s16le", str(output)], check=True)
    failure = coverage(output, seconds, fade)
    if failure:
        raise ValueError(failure + "; prepared music failed coverage; supply a replacement")
    return {"duration_sec": seconds, "looped": looped, "fade_sec": fade,
            "listening_review_required": looped}
