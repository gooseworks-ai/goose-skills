#!/usr/bin/env python3
"""Local object-level frame judge: the server's section 4 rubric on full-resolution frames.

  frame_judge.py MEDIA OUT_DIR --kind still|clip|final [--plan shot-plan.json]
      [--reference-shots shot-table.json] [--product-photo PATH_OR_URL ...]
      [--reference-frame PATH ...] [--model M] [--batch 8]

A still is judged whole, a clip at 2 fps, a final at 1 fps plus every cut frame (at most
48), all at full resolution. Each batch is one paid call to fal's openrouter/router/vision
(FAL_KEY), product photos and reference frames first. Every inset or overlay the plan
promises (shot-plan `overlays`) must be seen in its shot. Writes frame_judge.json bound to
the sha256. Exit 0 pass, 1 a finding, 2 incomplete. A measured review is approved only
with a passing frame_judge.json for the same bytes.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request

_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from frame_rubric import QUESTIONS, SCOPE_SKIP, prompt, promises  # noqa: E402
from reference_shots import probe, scene_cuts  # noqa: E402

FORMAT = "gooseworks-frame-judge-local/1"
ENDPOINT = "openrouter/router/vision"
DEFAULT_MODEL = "anthropic/claude-sonnet-5"
MAX_FRAMES, MAX_PHOTOS, MAX_REFERENCE_FRAMES = 48, 3, 4
def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sample_times(kind, duration, cuts):
    if kind == "still":
        return [0.0]
    step = 0.5 if kind == "clip" else 1.0
    times = [round(step / 2 + i * step, 3) for i in range(int(duration / step))]
    if kind == "final":
        times = sorted(set(times) | {round(min(duration - 0.05, c + 0.05), 3) for c in cuts})
    if len(times) > MAX_FRAMES:
        times = [times[round(i * (len(times) - 1) / (MAX_FRAMES - 1))] for i in range(MAX_FRAMES)]
    return times


def extract(media, kind, out_dir):
    """Full-resolution JPEG frames and their times."""
    frames = out_dir / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    if kind == "still":
        target = frames / "still.jpg"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(media), "-q:v", "2", str(target)], check=True, timeout=60)
        return [(0.0, target)]
    duration = probe(media)[0]
    out = []
    for t in sample_times(kind, duration, scene_cuts(media, duration, 0.3) if kind == "final" else []):
        target = frames / f"t{t:08.3f}.jpg"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(media), "-frames:v", "1",
                        "-q:v", "2", str(target)], check=True, timeout=60)
        out.append((t, target))
    return out


def upload(path, key):
    """A URL the vision model can read: http(s) passes through; a local file goes to fal storage."""
    if str(path).startswith(("http://", "https://")):
        return str(path)
    path = Path(path)
    kind = "image/png" if path.suffix.lower() == ".png" else "image/jpeg"
    init = urllib.request.Request("https://rest.fal.ai/storage/upload/initiate?storage_type=gcs", method="POST",
                                  data=json.dumps({"file_name": path.name, "content_type": kind}).encode(),
                                  headers={"Authorization": f"Key {key}", "Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.urlopen(init, timeout=60) as response:
        target = json.load(response)
    put = urllib.request.Request(target["upload_url"], data=path.read_bytes(), method="PUT", headers={"Content-Type": kind})
    urllib.request.urlopen(put, timeout=120).close()
    return target["file_url"]


def call_vision(payload, key):
    """One paid call; fal returns {output, usage}."""
    request = urllib.request.Request(f"https://fal.run/{ENDPOINT}", data=json.dumps(payload).encode(), method="POST",
                                     headers={"Authorization": f"Key {key}", "Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=600) as response:
        return json.load(response)


def parse(text):
    match = re.search(r"\{.*\}", str(text or ""), re.S)
    data = json.loads(match[0]) if match else None
    if not isinstance(data, dict) or not isinstance(data.get("answers"), dict):
        raise ValueError("The judge returned no answers object")
    return data


def combine(batches, questions):
    """Per question: fail beats unclear beats pass beats not_applicable; a missing answer is incomplete."""
    answers, missing = {}, []
    for question in questions:
        got = [b["answers"].get(question) for b in batches]
        if any(not isinstance(a, dict) or a.get("status") not in ("pass", "fail", "unclear", "not_applicable") for a in got):
            missing.append(question)
            continue
        for status in ("fail", "unclear", "pass", "not_applicable"):
            hits = [a for a in got if a["status"] == status]
            if hits:
                answers[question] = {"status": status, "note": " | ".join(str(a.get("note", "")) for a in hits)[:600],
                                     "times_s": sorted({float(t) for a in hits for t in a.get("times_s") or [] if isinstance(t, (int, float))})}
                break
    return answers, missing


def judge(media, out_dir, kind, plan=None, reference=None, photos=(), reference_frames=(), model=DEFAULT_MODEL, batch=8, key=None):
    media, out_dir = Path(media).resolve(), Path(out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {"format": FORMAT, "output_sha256": sha256(media), "kind": kind, "endpoint": ENDPOINT, "model": model,
              "status": "incomplete", "open_findings": [], "warnings": [], "calls": 0, "cost_usd": 0.0}
    questions = [q for q in QUESTIONS if q not in SCOPE_SKIP[kind]]
    frames = extract(media, kind, out_dir)
    result["frames"] = [{"t": t, "path": str(p)} for t, p in frames]
    key = key if key is not None else os.environ.get("FAL_KEY")
    try:
        if not key:
            raise ValueError("FAL_KEY is not set; the frame judge did not run")
        grounding = [upload(p, key) for p in list(photos)[:MAX_PHOTOS]] + [upload(p, key) for p in list(reference_frames)[:MAX_REFERENCE_FRAMES]]
        batches = []
        for start in range(0, len(frames), batch):
            chunk = frames[start:start + batch]
            payload = {"model": model, "temperature": 0, "max_tokens": 4000,
                       "prompt": prompt(kind, questions, min(len(photos), MAX_PHOTOS), min(len(reference_frames), MAX_REFERENCE_FRAMES),
                                        [t for t, _ in chunk], plan, reference),
                       "image_urls": grounding + [upload(p, key) for _, p in chunk]}
            response = call_vision(payload, key)
            result["calls"] += 1
            result["cost_usd"] += float((response.get("usage") or {}).get("cost") or 0)
            batches.append(parse(response.get("output")))
        answers, missing = combine(batches, questions)
        seen = {}
        for start, b in zip(range(0, len(frames), batch), batches):
            for pid, text, a, z in promises(plan, [t for t, _ in frames[start:start + batch]]):
                got = (b.get("promises") or {}).get(pid) or {}
                entry = seen.setdefault(pid, {"promise": text, "window_s": [a, z], "seen_at_s": []})
                if got.get("seen") is True:
                    entry["seen_at_s"] += [float(t) for t in got.get("times_s") or [] if isinstance(t, (int, float))] or [a]
        result["promises"] = seen
        result["answers"] = answers
        result["objects"] = {k: v for b in batches for k, v in (b.get("objects") or {}).items()}
        result["open_findings"] = [{"question": q, "note": a["note"], "times_s": a["times_s"]} for q, a in answers.items() if a["status"] == "fail"]
        result["open_findings"] += [{"question": "promised_overlay", "note": f"{pid}: '{p['promise']}' is not in the render",
                                     "times_s": p["window_s"]} for pid, p in seen.items() if not p["seen_at_s"]]
        result["warnings"] = [f"{q}: unclear" for q, a in answers.items() if a["status"] == "unclear"]
        if missing:
            result["error"] = "No answer for: " + ", ".join(missing)
        result["status"] = "incomplete" if missing else "fail" if result["open_findings"] else "pass"
    except Exception as error:  # noqa: BLE001  no key, a refused upload or call, a bad answer: never a pass
        result["error"] = f"{type(error).__name__}: {error}"[:600]
    (out_dir / "frame_judge.json").write_text(json.dumps(result, indent=2) + "\n")
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("media")
    parser.add_argument("out_dir")
    parser.add_argument("--kind", choices=("still", "clip", "final"), required=True)
    parser.add_argument("--plan", help="shot-plan.json: usage_steps, product_facts, changes_from_reference, shots")
    parser.add_argument("--reference-shots", help="the reference's filled shot-table.json")
    parser.add_argument("--product-photo", action="append", default=[], help="real product photo (path or URL); first is reference 1")
    parser.add_argument("--reference-frame", action="append", default=[], help="reference keyframe for the same beat")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--batch", type=int, default=8, help="frames per call")
    args = parser.parse_args()
    load = lambda p: json.loads(Path(p).read_text()) if p else None  # noqa: E731
    result = judge(args.media, args.out_dir, args.kind, load(args.plan), load(args.reference_shots), args.product_photo,
                   args.reference_frame, args.model, max(1, args.batch))
    print(json.dumps({k: result.get(k) for k in ("status", "output_sha256", "open_findings", "error", "calls", "cost_usd")}))
    return {"pass": 0, "fail": 1}.get(result["status"], 2)


if __name__ == "__main__":
    sys.exit(main())
