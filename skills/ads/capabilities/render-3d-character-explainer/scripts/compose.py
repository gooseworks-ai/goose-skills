#!/usr/bin/env python3
"""compose.py — the deterministic FREE assembler for the 3d-character-explainer ad.

Ports the validated compose recipe from the Bristle "Six Types" restyle run
(clients/bristle-health/ad-runs/run-02-six-types/generated/_render_full.sh). This is the
"N types of X" listicle variant of the animated-explainer format: a recurring human
protagonist plus a locked cast of N persona characters (one per list item) carry a
narrated spot. Given the per-scene i2v clips + the per-scene target durations + the
narration track (RESTYLE mode: the source ad's VO+music mix reused verbatim; ORIGINAL
mode: fresh per-scene VO windows + optional music bed), it renders the master mp4:

  1. Per-scene retime  — each clip is trimmed to its scene target duration and normalized
     to identical WxH/fps/SAR:
       scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:(ow-iw)/2:(oh-ih)/2:color=<pad>,fps=30,setsar=1
     tpad=stop_mode=clone extends a clip that is SHORTER than its window (else -t trims).
     Every segment is RE-ENCODED to identical libx264/yuv420p/30fps so the concat demuxer
     never silently drops frames on a dims/framerate mismatch.
  2. Static-still fallback — for any scene whose clip is missing or failed to render, the
     scene's keyframe PNG is looped (-loop 1) for the scene duration, so the master always
     assembles.
  3. Concat           — all segments concatenated via the concat demuxer (-c copy).
  4. Audio            — RESTYLE mode: the source audio (source_audio) is muxed verbatim
     (-map 0:v -map 1:a). ORIGINAL mode: per-scene VO cues are (optionally) atempo'd,
     padded, clamped to each window, concatenated, then optionally mixed under a music bed
     (VO loudnorm I=-14, music loudnorm I=-26 then volume, amix normalize=0), and muxed.
  5. Caption burn     — the libass .ass (from make_captions.py) is burned LAST so captions
     sit on top of the video, then muxed with the audio into the master mp4.

This capability makes NO paid calls. All inputs come via --config + the work dir; the
recipe (the paid orchestration: cast anchors / keyframes / Kling i2v clips / VO / music)
hands them off. Captions are burned only if config.captions_ass points at a real file.
"""
import argparse, json, os, subprocess, sys

# ---- canvas / encode constants (validated on the Bristle reference run) ----
FPS = 30
CRF_SEG = 18          # per-scene segment encode
CRF_MASTER = 19       # final burn+mux encode
PRESET = "medium"
PAD_COLOR_DEFAULT = "0x1c2233"   # letterbox pad colour (Bristle deep-navy); config overridable

# ---- audio mix constants (ORIGINAL mode with a music bed; validated on absurdist) ----
VO_LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=11"
MUSIC_LOUDNORM = "loudnorm=I=-26:TP=-3:LRA=11"
MUSIC_VOLUME_DEFAULT = 0.62
FADE_OUT_TAIL = 1.4
FADE_IN = 0.6


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.stderr.write((r.stderr or "")[-2000:] + "\n")
        sys.exit(f"FAILED: {' '.join(str(c) for c in cmd[:6])} ...")
    return r


def ffprobe_dur(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def main():
    ap = argparse.ArgumentParser(description="Compose the 3d-character-explainer master.")
    ap.add_argument("--config", required=True, help="path to config.json (see config.example.json)")
    ap.add_argument("--work-dir", required=True, help="scratch dir for intermediates (created if missing)")
    ap.add_argument("--out", required=True, help="output master mp4 path")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    work = a.work_dir
    seg_dir = os.path.join(work, "_work")
    os.makedirs(seg_dir, exist_ok=True)

    W = int(cfg.get("width", 1080))
    H = int(cfg.get("height", 1920))
    pad_color = cfg.get("pad_color", PAD_COLOR_DEFAULT)

    scenes = cfg["scenes"]                        # [{id, clip, keyframe?, target_sec, vo?, caption?, atempo?}, ...]
    mode = cfg.get("audio_mode", "restyle")       # "restyle" | "original"
    source_audio = cfg.get("source_audio")        # RESTYLE: the source ad's VO+music mix reused verbatim
    music_bed = cfg.get("music_bed")              # ORIGINAL: optional instrumental bed
    music_volume = float(cfg.get("music_volume", MUSIC_VOLUME_DEFAULT))
    captions_ass = cfg.get("captions_ass")        # path to a pre-built .ass, or None
    global_atempo = cfg.get("atempo")             # default compose-stage atempo for all VO cues

    norm = (f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
            f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={pad_color},fps={FPS},setsar=1")

    # -------------------------------------------------------------------
    # 1. per-scene video segments (retime -> identical encode; static-still fallback)
    # -------------------------------------------------------------------
    concat = os.path.join(seg_dir, "concat.txt")
    fallbacks = []
    with open(concat, "w") as cf:
        for s in scenes:
            n = s["id"]
            tgt = float(s["target_sec"])
            seg = os.path.join(seg_dir, f"seg-{n}.mp4")
            clip = s.get("clip")
            if clip and os.path.exists(clip) and ffprobe_dur(clip) > 0.05:
                src_dur = ffprobe_dur(clip)
                vf = norm
                pad = tgt - src_dur
                if pad > 0.05:
                    vf = (f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
                          f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color={pad_color},"
                          f"tpad=stop_mode=clone:stop_duration={pad:.3f},fps={FPS},setsar=1")
                run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip,
                     "-vf", vf, "-t", f"{tgt:.3f}",
                     "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_SEG),
                     "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", seg])
                print(f"  scene-{n}  clip {src_dur:.2f}s -> {tgt:.2f}s")
            else:
                # static-still fallback: loop the scene's keyframe for the window
                kf = s.get("keyframe")
                if not (kf and os.path.exists(kf)):
                    sys.exit(f"scene-{n}: no usable clip AND no keyframe fallback "
                             f"(clip={clip!r}, keyframe={kf!r})")
                fallbacks.append(n)
                run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", kf,
                     "-t", f"{tgt:.3f}", "-vf", norm,
                     "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_SEG),
                     "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", seg])
                print(f"  scene-{n}  STATIC-STILL fallback -> {tgt:.2f}s")
            cf.write(f"file 'seg-{n}.mp4'\n")

    # -------------------------------------------------------------------
    # 2. concat video (all segments identical -> no silent frame drops)
    # -------------------------------------------------------------------
    video = os.path.join(seg_dir, "video.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", concat, "-c", "copy", video])
    total = ffprobe_dur(video)
    print(f"  total runtime: {total:.2f}s  (mode={mode})")

    # -------------------------------------------------------------------
    # 3. audio bus
    # -------------------------------------------------------------------
    mix = os.path.join(seg_dir, "mix.wav")
    if mode == "restyle":
        # reuse the source ad's audio mix (VO + bed) VERBATIM, clamped to the video length
        if not (source_audio and os.path.exists(source_audio)):
            sys.exit(f"restyle mode needs config.source_audio to exist (got {source_audio!r})")
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", source_audio,
             "-t", f"{total:.3f}", "-ar", "44100", "-ac", "2", mix])
    else:
        # ORIGINAL mode: build a per-scene VO track, optionally mix under a music bed
        voconcat = os.path.join(seg_dir, "voconcat.txt")
        with open(voconcat, "w") as vf:
            for s in scenes:
                n = s["id"]
                tgt = float(s["target_sec"])
                vo = s.get("vo")
                wav = os.path.join(seg_dir, f"vo-{n}.wav")
                atempo = s.get("atempo", global_atempo)
                if vo and os.path.exists(vo):
                    af = []
                    if atempo:
                        af.append(f"atempo={atempo}")
                    af.append("apad")
                    run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo,
                         "-af", ",".join(af), "-t", f"{tgt:.3f}",
                         "-ar", "44100", "-ac", "2", wav])
                else:
                    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
                         "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                         "-t", f"{tgt:.3f}", wav])
                vf.write(f"file 'vo-{n}.wav'\n")
        vo_track = os.path.join(seg_dir, "vo-track.wav")
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
             "-i", voconcat, "-c", "copy", vo_track])
        vo_total = ffprobe_dur(vo_track)
        if music_bed and os.path.exists(music_bed):
            music = os.path.join(seg_dir, "music.wav")
            fade_out_st = max(vo_total - FADE_OUT_TAIL, 0.0)
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", music_bed,
                 "-af", f"afade=t=in:st=0:d={FADE_IN},afade=t=out:st={fade_out_st:.3f}:d={FADE_OUT_TAIL}",
                 "-t", f"{vo_total:.3f}", "-ar", "44100", "-ac", "2", music])
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo_track, "-i", music,
                 "-filter_complex",
                 f"[0:a]{VO_LOUDNORM}[vo];"
                 f"[1:a]{MUSIC_LOUDNORM},volume={music_volume}[mus];"
                 f"[vo][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]",
                 "-map", "[a]", "-ar", "44100", "-ac", "2", mix])
        else:
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo_track,
                 "-af", VO_LOUDNORM, "-ar", "44100", "-ac", "2", mix])

    # -------------------------------------------------------------------
    # 4. burn captions LAST + mux -> master
    # -------------------------------------------------------------------
    if captions_ass and os.path.exists(captions_ass):
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", mix,
             "-vf", f"ass={_ass_escape(captions_ass)}",
             "-map", "0:v", "-map", "1:a",
             "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_MASTER),
             "-pix_fmt", "yuv420p", "-r", str(FPS),
             "-c:a", "aac", "-b:a", "192k", "-shortest", a.out])
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", mix,
             "-map", "0:v", "-map", "1:a",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", a.out])

    md = ffprobe_dur(a.out)
    expected = sum(float(s["target_sec"]) for s in scenes)
    print(f"WROTE {a.out}  {md:.2f}s (expected ~{expected:.2f}s, delta {md-expected:+.2f}s)")
    if fallbacks:
        print(f"STATIC-STILL FALLBACK SCENES: {' '.join(fallbacks)}")
    else:
        print("all scenes animated OK")


def _ass_escape(path):
    # ffmpeg filtergraph escaping for a filename inside ass='...': use FORWARD
    # slashes — doubled backslashes break the ass filter's filename parse on
    # Windows — and escape the drive colon, which otherwise terminates the
    # option value.
    return path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")


if __name__ == "__main__":
    main()
