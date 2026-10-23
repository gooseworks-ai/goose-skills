#!/usr/bin/env python3
"""compose.py — the deterministic FREE assembler for the myth-vs-fact ad.

Ports the validated assembly recipe from the Clinikally "acne myths" run
(working/build_master.py), generalized + portable (config-driven, no hardcoded paths):

  1. Concat the per-beat mp4s (already rendered by render_beats.py, all at the same fps)
     into a silent master. A framerate mismatch makes the concat demuxer silently drop
     frames, so every beat MUST be the configured fps (render_beats.py enforces + warns).
  2. Mix VO + optional music: music at -20 dB under the VO with a ~0.8s tail fade,
     `amix inputs=2 duration=first normalize=0` (normalize=1 pumps the bed under the VO).
     VO-only path skips the mix. Explicit `-map` so the silent placeholder AAC on the
     beat mp4s never wins the picker.
  3. Burn the karaoke .ass captions LAST onto the silent video + mixed audio -> master mp4.

This capability makes NO paid calls. All inputs come via --config + the work dir; the
recipe gates the paid VO / music / Whisper calls to their own capabilities.

Usage:
  compose.py --config config.json --work-dir /path/to/work --out master.mp4
             [--vo vo.mp3] [--music music.mp3] [--captions captions.ass]

Requires: ffmpeg/ffprobe on PATH.
"""
import argparse, json, os, subprocess, sys
from pathlib import Path


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.stderr.write((r.stderr or "")[-2000:] + "\n")
        sys.exit(f"FAILED: {' '.join(str(c) for c in cmd[:6])} ...")
    return r


def ffprobe_dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return float(r.stdout.strip())


def concat_silent(beats, frames_dir, work, fps):
    lst = work / "concat.txt"
    lst.write_text("\n".join(f"file '{(frames_dir / f'beat-{b['n']}.mp4').resolve()}'"
                             for b in beats) + "\n")
    out = work / "master-silent.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", str(lst), "-c", "copy", str(out)])
    pk = subprocess.check_output(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets",
         "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(out)]).decode().strip()
    dur = ffprobe_dur(out)
    print(f"[concat] {out} packets={pk} dur={dur:.2f}s expected~{dur*fps:.0f} frames")
    return out


def mix_audio(vo, music, work, music_db, tail_fade, video_dur=None):
    """Mix VO (+ optional music) → an m4a as long as the VIDEO. The final `burn` uses
    -shortest, so if the audio is shorter than the video (the normal case — the end card
    holds a beat past the last spoken word) the end-card hold gets silently truncated.
    Pad the audio to `video_dur` so the hold survives. `apad` runs BEFORE amix's
    duration=first collapses length, so the padded VO drives the output length."""
    out = work / "mixed-audio.m4a"
    # apad the VO bus to the full video length (harmless no-op when video_dur is None).
    pad = f",apad=whole_dur={video_dur:.3f}" if video_dur else ""
    if music and os.path.exists(music):
        vo_dur = ffprobe_dur(vo)
        fc = (f"[0:a]apad=whole_dur={video_dur:.3f}[vo];" if video_dur else "[0:a]anull[vo];")
        fc += (f"[1:a]volume={music_db}dB,"
               f"afade=t=out:st={max(0, (video_dur or vo_dur) - tail_fade):.2f}:d={tail_fade}[m];"
               f"[vo][m]amix=inputs=2:duration=first:normalize=0[a]")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(vo), "-i", str(music),
             "-filter_complex", fc, "-map", "[a]",
             "-c:a", "aac", "-b:a", "192k", "-ar", "44100", str(out)])
        print(f"[mix] {out} (VO + music@{music_db}dB, padded to {video_dur or vo_dur:.2f}s)")
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(vo),
             "-af", f"anull{pad}", "-c:a", "aac", "-b:a", "192k", "-ar", "44100", str(out)])
        print(f"[mix] {out} (VO only, padded to {video_dur:.2f}s)" if video_dur
              else f"[mix] {out} (VO only)")
    return out


def burn(silent, audio, captions, out):
    ass = str(Path(captions).resolve()) if captions and os.path.exists(captions) else None
    if ass:
        vf = f"[0:v]ass='{ass}'[v]"
        run(["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(silent), "-i", str(audio),
             "-filter_complex", vf, "-map", "[v]", "-map", "1:a:0",
             "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
             "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(out)])
    else:
        # no captions -> just mux the mixed audio over the silent video
        run(["ffmpeg", "-y", "-loglevel", "error",
             "-i", str(silent), "-i", str(audio),
             "-map", "0:v:0", "-map", "1:a:0",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
             "-shortest", "-movflags", "+faststart", str(out)])
    print(f"[final] {out} dur={ffprobe_dur(out):.2f}s")
    return out


def main():
    ap = argparse.ArgumentParser(description="Assemble the myth-vs-fact master.")
    ap.add_argument("--config", required=True)
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--vo", help="VO mp3 (defaults to config.vo)")
    ap.add_argument("--music", help="music bed (defaults to config.music)")
    ap.add_argument("--captions", help="captions .ass (defaults to work-dir/captions.ass)")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    work = Path(a.work_dir)
    work.mkdir(parents=True, exist_ok=True)
    frames_dir = work / "frames"
    fps = int(cfg.get("fps", 25))

    # Prefer the re-snapped manifest if beat_snap.py ran; else the raw config beats.
    manifest_path = work / "beat-manifest.json"
    beats = json.load(open(manifest_path))["beats"] if manifest_path.exists() else cfg["beats"]

    vo = a.vo or cfg.get("vo")
    if not vo or not os.path.exists(vo):
        sys.exit(f"VO not found: {vo} (pass --vo or set config.vo)")
    music = a.music or cfg.get("music")
    captions = a.captions or str(work / "captions.ass")
    mix_cfg = cfg.get("mix", {})
    music_db = mix_cfg.get("music_db", -20)
    tail_fade = mix_cfg.get("tail_fade", 0.8)

    silent = concat_silent(beats, frames_dir, work, fps)
    # Pad audio to the silent video's real length so -shortest keeps the full end-card hold.
    audio = mix_audio(vo, music, work, music_db, tail_fade, video_dur=ffprobe_dur(silent))
    final = burn(silent, audio, captions, a.out)

    md = ffprobe_dur(final)
    expected = sum(float(b["duration"]) for b in beats)
    print(f"WROTE {final}  {md:.2f}s (expected ~{expected:.2f}s, delta {md - expected:+.2f}s)")


if __name__ == "__main__":
    main()
