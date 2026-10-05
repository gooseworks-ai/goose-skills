#!/usr/bin/env python3
"""check-render.py <final.mp4> <master-chat.sfx.json>

Verifies the finished iMessage ad, not its inputs: 1080x1920, has audio, no sync-curtain
frame leaked in, runtime in range, and every SFX cue is audible within 0.15 s before
its bubble time. Exits 1 on any failure. No numpy needed."""
import json, subprocess, sys, array

vid, cues = sys.argv[1], json.load(open(sys.argv[2]))
fail = []
probe = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries",
    "stream=codec_type,width,height:format=duration", "-of", "json", vid],
    capture_output=True, check=True).stdout)
v = [s for s in probe["streams"] if s["codec_type"] == "video"][0]
dur = float(probe["format"]["duration"])
if (v["width"], v["height"]) != (1080, 1920): fail.append(f"frame {v['width']}x{v['height']}, want 1080x1920")
if not any(s["codec_type"] == "audio" for s in probe["streams"]): fail.append("no audio stream")
if not 15 <= dur <= 40: fail.append(f"runtime {dur:.1f}s outside 15-40s")

# sync curtain must never reach the viewer
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", vid, "-vf", "fps=10,scale=4:4", "-f", "rawvideo",
                      "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
for f in range(len(raw) // 48):
    px = raw[f*48 + 30: f*48 + 33]
    if px[0] > 200 and px[1] < 70 and px[2] > 200: fail.append(f"sync magenta visible at {f/10:.1f}s"); break

# each cue's sound must start in [t-0.15, t+0.02]
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", vid, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
a = array.array("h"); a.frombytes(pcm[: len(pcm) // 2 * 2])
env = [max(abs(x) for x in a[i:i+8]) for i in range(0, len(a) - 8, 8)]  # 1 ms hop
peak = max(env) or 1
def onset_near(t):
    # First ms in [t-200, t+20] that is audible (>5% of peak) AND at least 4x louder than
    # the quietest point in the 60 ms before. Handles fade-in sounds and the tail of an
    # earlier sound still ringing.
    for ms in range(max(0, t - 200), min(len(env), t + 21)):
        base = min(env[max(0, ms - 60): ms] or [0])  # quietest point just before: silence or the dip where the last sound was cut
        if env[ms] > 0.05 * peak and env[ms] > 4 * max(base, 1):
            return ms
    return None
worst = 0
for c in cues:
    t = int(c["t"] * 1000)
    on = onset_near(t)
    if on is None or not (t - 150 <= on <= t + 20):
        fail.append(f"{c['name']} at {c['t']:.2f}s: sound onset {'missing' if on is None else f'{on - t:+d} ms'}, want -150..+20 ms")
    else:
        worst = max(worst, abs(on - t))
print(f"sfx: every cue lands 0..{worst} ms before its bubble" if not fail else "sfx: see failures")

print(f"check: {vid} {dur:.1f}s, {len(cues)} cues -> " + ("OK" if not fail else "FAIL"))
for f in fail: print("  - " + f)
sys.exit(1 if fail else 0)
