"""Composite the final voiceless transformation reel from edit_plan.json."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAN = json.loads((Path(__file__).resolve().parent / "edit_plan.json").read_text())
CLIPS = ROOT / "clips"
EDITS = ROOT / "edits"
EDITS.mkdir(exist_ok=True)
DELIVERABLE = ROOT / "deliverable"
DELIVERABLE.mkdir(exist_ok=True)

W, H, FPS = 720, 1280, 30

# 1) Trim each scene clip to its in/out and re-encode at consistent fps/codec.
trimmed = []
for i, s in enumerate(PLAN["scenes"]):
    src = CLIPS / s["clip"]
    out = EDITS / f"trim_{i:02d}_{s['clip']}"
    dur = round(s["clip_out"] - s["clip_in"], 3)
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-ss", f"{s['clip_in']:.3f}", "-i", str(src),
        "-t", f"{dur:.3f}",
        "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS},setsar=1",
        "-an",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(out),
    ]
    subprocess.run(cmd, check=True)
    trimmed.append(out)

# 2) Concat list
concat_txt = EDITS / "concat.txt"
concat_txt.write_text("\n".join(f"file '{p}'" for p in trimmed) + "\n")

concat_mp4 = EDITS / "concat.mp4"
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", str(concat_txt),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
    "-pix_fmt", "yuv420p",
    str(concat_mp4),
], check=True)

# 3) Build overlay filter graph: captions + loading dots
filters = []
inputs = ["-i", str(concat_mp4)]
input_idx = 1  # 0 is concat video

# captions
for cap in PLAN["captions"]:
    inputs += ["-i", str(EDITS / cap["png"])]

# loading dots: 5 PNGs, each shown for frame_period_s seconds
dots_dir = ROOT / PLAN["loading_dots"]["frames_dir"]
dots_files = sorted(dots_dir.glob("dots_*.png"))
for d in dots_files:
    inputs += ["-i", str(d)]

# audio
inputs += ["-i", str(ROOT / PLAN["audio"]["file"])]
audio_input_idx = 1 + len(PLAN["captions"]) + len(dots_files)

# Filter chain: [0:v] -> overlay caption_before -> overlay caption_after -> overlay each dot frame
chain = "[0:v]"
for i, cap in enumerate(PLAN["captions"]):
    src = f"[{1+i}:v]"
    label_in = chain
    label_out = f"[v_cap{i}]"
    chain_part = (
        f"{label_in}{src}overlay=x={cap['x']}:y={cap['y']}:"
        f"enable='between(t,{cap['start_s']:.3f},{cap['end_s']:.3f})'{label_out}"
    )
    filters.append(chain_part)
    chain = label_out

# loading dots: 5 frames cycling at frame_period_s, looping until end_s
ld = PLAN["loading_dots"]
period = ld["frame_period_s"]
n_frames = len(dots_files)
total_dot_window = ld["end_s"] - ld["start_s"]
# Cycle: each frame shown for period seconds, looping
n_cycles = int(total_dot_window / (period * n_frames)) + 1
dot_input_start = 1 + len(PLAN["captions"])
for c in range(n_cycles):
    for f_i in range(n_frames):
        t0 = ld["start_s"] + (c * n_frames + f_i) * period
        t1 = t0 + period
        if t0 >= ld["end_s"]:
            break
        if t1 > ld["end_s"]:
            t1 = ld["end_s"]
        src = f"[{dot_input_start + f_i}:v]"
        label_in = chain
        label_out = f"[v_d{c}_{f_i}]"
        filters.append(
            f"{label_in}{src}overlay=x={ld['x']}:y={ld['y']}:"
            f"enable='between(t,{t0:.3f},{t1:.3f})'{label_out}"
        )
        chain = label_out

# Light film grain pass on the final video chain (UGC iPhone feel)
grain_in = chain
grain_out = "[v_grain]"
filters.append(f"{grain_in}noise=alls=4:allf=t,eq=saturation=1.05:contrast=1.04{grain_out}")
chain = grain_out

# audio: -7dB volume pad + fades
af_in = PLAN["audio"]["fade_in_s"]
af_out = PLAN["audio"]["fade_out_s"]
total = PLAN["total_duration_s"]
filters.append(
    f"[{audio_input_idx}:a]atrim=0:{total},asetpts=PTS-STARTPTS,"
    f"volume=-7dB,"
    f"afade=t=in:st=0:d={af_in},afade=t=out:st={total - af_out:.3f}:d={af_out}[aout]"
)

filter_complex = ";".join(filters)
out_path = DELIVERABLE / "voiceless-music-story-recreation.mp4"
cmd = (
    ["ffmpeg", "-y", "-loglevel", "error"]
    + inputs
    + [
        "-filter_complex", filter_complex,
        "-map", chain, "-map", "[aout]",
        "-t", f"{total:.3f}",
        "-c:v", "libx264", "-preset", "slow", "-crf", "22",
        "-tune", "grain",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        "-movflags", "+faststart",
        str(out_path),
    ]
)
print(" ".join(cmd[:6]), "...filter graph:", filter_complex[:200], "...")
subprocess.run(cmd, check=True)
print(f"DONE -> {out_path}")
