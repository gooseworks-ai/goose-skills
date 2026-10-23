#!/usr/bin/env python3
"""Rebuild a video from its stored recipe in an empty folder and compare it with the final."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

# Load sibling helpers from this file's own folder. `python3 -I` (isolated
# mode) leaves the script folder off sys.path, so add it explicitly.
_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from pack_recipe import FORMAT, is_safe_relative_path, sha256_bytes  # noqa: E402
from assembly_timeline import FORMAT as ASSEMBLY_FORMAT, normalize_timeline  # noqa: E402

MIN_PSNR_AVG = 40.0
MIN_PSNR_FRAME = 30.0
MAX_DURATION_DIFF_S = 0.05
MAX_AUDIO_DIFF_DB = -60.0


class CheckError(ValueError):
    """The recipe cannot be unpacked as stored."""


def sha256_file(path):
    with open(path, "rb") as handle:
        digest = hashlib.sha256()  # file_digest needs Python 3.11; stay 3.9-safe
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
        return digest.hexdigest()


def unpack(bundle, inputs_dir, work):
    if bundle.get("format") != FORMAT:
        raise CheckError(f"format must be {FORMAT}")
    for item in bundle.get("files", []):
        rel = item["path"]
        if not is_safe_relative_path(rel):
            raise CheckError(f"unsafe file path {rel!r}")
        data = item["text"].encode("utf-8")
        if sha256_bytes(data) != item["sha256"]:
            raise CheckError(f"recipe file {rel} does not match its checksum")
        target = work / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    for item in bundle.get("inputs", []):
        rel = item["path"]
        if not is_safe_relative_path(rel):
            raise CheckError(f"unsafe input path {rel!r}")
        source = inputs_dir / rel
        if not source.is_file():
            raise CheckError(f"input {rel} was not downloaded to {inputs_dir.name}/{rel}")
        if source.stat().st_size != item["bytes"] or sha256_file(source) != item["sha256"]:
            raise CheckError(f"input {rel} does not match its size and checksum in the recipe")
        target = work / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)


def ffmpeg_log(args, timeout=600):
    result = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *args], capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise CheckError(f"ffmpeg failed: {result.stderr.strip()[-400:]}")
    return result.stderr


def probe(path):
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", str(path)],
        capture_output=True, text=True, timeout=120, check=True,
    )
    data = json.loads(result.stdout)
    return float(data["format"]["duration"]), any(s.get("codec_type") == "audio" for s in data.get("streams", []))


def compare_media(built, final):
    """Frames by PSNR, length by duration, sound by the level of their difference."""
    built_s, built_audio = probe(built)
    final_s, final_audio = probe(final)
    notes = []
    ok = abs(built_s - final_s) <= MAX_DURATION_DIFF_S
    notes.append(f"duration {built_s:.3f}s vs {final_s:.3f}s")
    log = ffmpeg_log(["-i", str(built), "-i", str(final), "-lavfi", "[0:v][1:v]psnr", "-f", "null", "-"])
    summary = re.search(r"PSNR .*average:(\S+) min:(\S+)", log)
    if not summary:
        raise CheckError("ffmpeg printed no PSNR summary")
    average = float("inf") if summary[1] == "inf" else float(summary[1])
    worst = float("inf") if summary[2] == "inf" else float(summary[2])
    ok = ok and average >= MIN_PSNR_AVG and worst >= MIN_PSNR_FRAME
    notes.append(f"PSNR average {summary[1]} dB, worst frame {summary[2]} dB")
    if built_audio != final_audio:
        ok = False
        notes.append("one has audio and the other does not")
    elif built_audio:
        pcm = ["-vn", "-ac", "2", "-ar", "48000", "-f", "s16le", "-"]
        hashes = []
        for path in (built, final):
            result = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), *pcm], capture_output=True, timeout=600, check=True)
            hashes.append(hashlib.sha256(result.stdout).hexdigest())
        if hashes[0] == hashes[1]:
            notes.append("audio samples identical")
        else:
            log = ffmpeg_log([
                "-i", str(built), "-i", str(final), "-filter_complex",
                "[0:a]aresample=48000,aformat=channel_layouts=stereo[a];"
                "[1:a]aresample=48000,aformat=channel_layouts=stereo,volume=-1[b];"
                "[a][b]amix=inputs=2:normalize=0,astats=reset=0",
                "-f", "null", "-",
            ])
            levels = re.findall(r"RMS level dB: (\S+)", log)
            level = levels[-1] if levels else "nan"
            diff = float("-inf") if level == "-inf" else float(level)
            ok = ok and diff <= MAX_AUDIO_DIFF_DB
            notes.append(f"audio difference {level} dB")
    return ok, "; ".join(notes)


def assembly_evidence(bundle):
    """Find stored timeline text, not a newly invented claim about a rebuilt file."""
    candidates = []
    for file in bundle.get('files', []):
        if not file.get('path', '').endswith('.json'):
            continue
        try:
            value = json.loads(file['text'])
        except (ValueError, KeyError, TypeError):
            continue
        value = value.get('assembly_timeline', value) if isinstance(value, dict) else None
        if isinstance(value, dict) and value.get('format') == ASSEMBLY_FORMAT:
            candidates.append(value)
    if len(candidates) != 1:
        return {'status': 'incomplete', 'timeline': None, 'revision': None,
                'issues': ['Store one unambiguous source-linked timeline JSON with the recipe']}
    evidence = normalize_timeline(candidates[0])
    inputs = {item['sha256'] for item in bundle.get('inputs', [])}
    timeline = evidence.get('timeline')
    if timeline:
        sources = [s['video'] for s in timeline['segments']] + [c['source'] for c in timeline['audio_cues']]
        sources += [s['speech_driver'] for s in timeline['segments'] if s.get('speech_driver')]
        sources += [v['source'] for v in timeline.get('visual_overrides', []) if v.get('source')]
        if any(source['sha256'] not in inputs for source in sources):
            evidence['status'] = 'invalid'
            evidence['issues'].append('A declared timeline source is absent from the immutable recipe inputs')
    return evidence


def check(bundle_path, inputs_dir, final, work, timeout=3600):
    """Return {result, compared, detail}; result is identical, matches or failed."""
    work = Path(work)
    if work.exists() and any(work.iterdir()):
        raise CheckError(f"{work} must be empty")
    work.mkdir(parents=True, exist_ok=True)
    bundle = json.loads(Path(bundle_path).read_bytes().decode("utf-8"))
    unpack(bundle, Path(inputs_dir), work)
    evidence = assembly_evidence(bundle)
    def receipt(result, compared, detail):
        return {'result': result, 'compared': compared, 'detail': detail,
                'purpose': 'reproducibility_only', 'content_review_status': 'incomplete',
                'content_review_required': True, 'final_sha256': sha256_file(final),
                'assembly_evidence': evidence}
    build = bundle["build"]
    if not is_safe_relative_path(build["output"]):
        raise CheckError("unsafe build.output")
    run = subprocess.run(build["command"], shell=True, cwd=work, capture_output=True, text=True, timeout=timeout)
    if run.returncode != 0:
        return receipt('failed', 'sha256', f'build exited {run.returncode}: {run.stderr.strip()[-600:]}')
    built = work / build["output"]
    if not built.is_file():
        return receipt('failed', 'sha256', f"build made no {build['output']}")
    built_sha, final_sha = sha256_file(built), sha256_file(final)
    if built_sha == final_sha:
        return receipt('identical', 'sha256', f'sha256 {built_sha}')
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        return receipt('failed', 'sha256', 'bytes differ and ffmpeg is not installed to compare decoded pictures and audio samples')
    ok, detail = compare_media(built, final)
    return receipt('matches' if ok else 'failed', 'frames_and_audio', detail)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", required=True, help="recipe/source.json as stored on the project")
    parser.add_argument("--inputs", required=True, help="folder holding each input at its recipe path, downloaded from the project")
    parser.add_argument("--final", required=True, help="the final video as stored on the project")
    parser.add_argument("--work", required=True, help="an empty folder to rebuild in")
    parser.add_argument("--timeout", type=int, default=3600)
    args = parser.parse_args(argv)
    try:
        outcome = check(args.bundle, args.inputs, args.final, args.work, args.timeout)
    except (CheckError, OSError, KeyError, json.JSONDecodeError, subprocess.SubprocessError) as error:
        outcome = {"result": "failed", "compared": "sha256", "detail": str(error)[:1000],
                   'purpose': 'reproducibility_only', 'content_review_status': 'incomplete', 'content_review_required': True}
    print(json.dumps(outcome))
    if (outcome.get("assembly_evidence") or {}).get("status") == "invalid":
        print("FAIL assembly timeline: " + "; ".join(outcome["assembly_evidence"].get("issues", [])), file=sys.stderr)
        return 1
    return 0 if outcome["result"] in ("identical", "matches") else 1


if __name__ == "__main__":
    sys.exit(main())
