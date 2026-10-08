#!/usr/bin/env python3
"""compose.py — the deterministic FREE assembler for the absurdist-explainer ad.

Ports the validated compose recipe from the format's two reference runs. Style-agnostic:
the art style, narrator and music style are the recipe's choices and arrive here only as
files. Given the per-scene i2v clips + the per-scene VO
windows + the VO track + the music bed + a built end-card PNG + a caption .ass file,
it renders the master mp4:

  1. Per-scene retime  — each clip is retimed to its MEASURED VO window:
       scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1
       then tpad=stop_mode=clone (if the VO is longer than the clip) and a trim.
     Each window is first snapped to a whole number of frames (see snap()), so the
     video cuts, the VO windows and the caption cues all share the same cut times.
     Every segment is RE-ENCODED to identical libx264/crf18/yuv420p/30fps so the concat
     demuxer never silently drops frames on a framerate mismatch.
  2. End card         — the pre-built endcard.png (real product composite, see
     build_endcard.py) is held STATIC over its dwell window and appended as the final
     scene. (Set end_card.zoom_to above 1.0 for a slow zoom instead; the default is none.) If the config sets end_card.vo, that spoken line is
     laid at the start of the end-card window and the dwell is stretched to at least the
     line's duration + 0.5s.
  3. Concat           — all segments concatenated via the concat demuxer (-c copy).
  4. VO track         — each VO cue is (optionally) atempo-compressed, padded, clamped to
     its window, and concatenated into one wav.
  5. Music bed        — fit to the total runtime with a fade in/out tail.
  6. Mix              — VO bus loudnorm I=-14 TP=-1.5, music bus loudnorm I=-26 TP=-3 then
     volume (default 0.62), amix inputs=2 duration=first normalize=0, so the music is
     ducked under the VO.
  7. Master pass      - the mix is measured, gained to -14 LUFS and run through a limiter,
     then encoded to AAC and measured again. The pass repeats until the encoded audio is
     at -14.5..-13.5 LUFS with a true peak <= -1.5 dBFS. The result is printed.
  8. Caption burn     - the libass .ass is burned LAST so captions sit on top of the
     video, then muxed with the mastered audio into the master mp4.

This capability makes NO paid calls. All inputs come via --config + the work dir; the
recipe (the paid orchestration: keyframes / clips / VO / music) hands them off.
"""
import argparse, json, math, os, re, shutil, subprocess, sys

# ---- canvas / encode constants (validated on both reference runs) ----
W, H = 1080, 1920
FPS = 30
CRF_SEG = 18          # per-scene segment encode
CRF_MASTER = 19       # final burn+mux encode
PRESET = "medium"

# ---- audio mix constants (validated) ----
VO_LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=11"
MUSIC_LOUDNORM = "loudnorm=I=-26:TP=-3:LRA=11"
MUSIC_VOLUME_DEFAULT = 0.62   # validated range 0.62-0.70 across the reference runs
FADE_OUT_TAIL = 1.4           # music out-fade length
FADE_IN = 0.6                 # music in-fade length

# ---- master loudness target (measured on the encoded audio, not assumed) ----
TARGET_I = -14.0              # aim for the middle of the window
I_MIN, I_MAX = -14.5, -13.5   # integrated LUFS window
TP_MAX = -1.5                 # true-peak ceiling, dBFS
LIMIT_DB = -2.0               # first limiter ceiling; AAC encoding adds a little overshoot
MASTER_PASSES = 4

END_CARD_VO_TAIL = 0.5        # the end card holds at least this long after its spoken line


def snap(sec):
    """Snap a duration to whole frames. Return (frames, seconds).

    make_captions.py uses the SAME rule. Keep the two in step, or a caption will
    outlive its cut by a frame.
    """
    frames = int(float(sec) * FPS + 0.5)
    return frames, frames / FPS


def run(cmd, quiet=True, cwd=None):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", cwd=cwd)
    if r.returncode:
        sys.stderr.write((r.stderr or "")[-2000:] + "\n")
        sys.exit(f"FAILED: {' '.join(str(c) for c in cmd[:6])} ...")
    return r


def ffprobe_dur(path):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", path],
        capture_output=True, text=True)
    return float(r.stdout.strip())


def measure(path):
    """Return (integrated LUFS, true peak dBFS) of an audio file, or None if it is silent."""
    r = subprocess.run(
        ["ffmpeg", "-nostdin", "-hide_banner", "-i", path,
         "-af", "ebur128=peak=true", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    tail = r.stderr[r.stderr.rfind("Summary:"):]
    i = re.search(r"I:\s*(-?\d+(?:\.\d+)?) LUFS", tail)
    p = re.search(r"Peak:\s*(-?\d+(?:\.\d+)?) dBFS", tail)
    if not i or not p or float(i.group(1)) <= -69.0:
        return None
    return float(i.group(1)), float(p.group(1))


def master_audio(mix, out):
    """Gain + limit the mix to the loudness target, encode it to AAC, and print the result.

    The check runs on the ENCODED audio, because AAC moves the peaks. Each pass corrects
    the gain by the measured loudness error and lowers the limiter by the peak overshoot.
    """
    first = measure(mix)
    if first is None:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", mix, "-c:a", "aac", "-b:a", "192k", out])
        print("  loudness: the mix is silent, nothing to master")
        return
    gain, ceiling = TARGET_I - first[0], LIMIT_DB
    for _ in range(MASTER_PASSES):
        # limit at 192 kHz so peaks between samples are caught too
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", mix,
             "-af", (f"volume={gain:.2f}dB,aresample=192000,"
                     f"alimiter=limit={10 ** (ceiling / 20):.4f}:level=disabled,"
                     f"aresample=44100"),
             "-ar", "44100", "-ac", "2", "-c:a", "aac", "-b:a", "192k", out])
        lufs, peak = measure(out) or (-70.0, -70.0)
        i_ok, tp_ok = I_MIN <= lufs <= I_MAX, peak <= TP_MAX
        if i_ok and tp_ok:
            break
        if not i_ok:
            gain += TARGET_I - lufs
        if not tp_ok:
            ceiling -= (peak - TP_MAX) + 0.2
    print(f"  loudness: {lufs:.1f} LUFS integrated, true peak {peak:.1f} dBFS "
          f"(target {I_MIN}..{I_MAX} LUFS, true peak <= {TP_MAX} dBFS)")
    if not (i_ok and tp_ok):
        sys.stderr.write(f"WARNING: master is outside the loudness target after "
                         f"{MASTER_PASSES} passes.\n")


def main():
    ap = argparse.ArgumentParser(description="Compose the absurdist-explainer master.")
    ap.add_argument("--config", required=True, help="path to config.json (see config.example.json)")
    ap.add_argument("--work-dir", required=True, help="scratch dir for intermediates (created if missing)")
    ap.add_argument("--out", required=True, help="output master mp4 path")
    a = ap.parse_args()

    with open(a.config, encoding="utf-8-sig") as f:   # UTF-8, with or without a BOM
        cfg = json.load(f)
    work = os.path.abspath(a.work_dir)
    out = os.path.abspath(a.out)
    seg_dir = os.path.join(work, "_work")
    os.makedirs(seg_dir, exist_ok=True)
    os.makedirs(os.path.dirname(out), exist_ok=True)

    scenes = cfg["scenes"]                       # [{id, clip, target_sec, vo, atempo?}, ...]
    endcard = cfg["end_card"]                    # {image, dwell_sec, zoom_to?, vo?, atempo?}
    music_bed = cfg.get("music_bed")             # path or None
    music_volume = float(cfg.get("music_volume", MUSIC_VOLUME_DEFAULT))
    captions_ass = cfg.get("captions_ass")       # path to pre-built .ass, or None
    global_atempo = cfg.get("atempo")            # default compose-stage atempo for all VO cues

    # end card: an optional spoken line (end_card.vo) sets a floor on the dwell
    ec_dwell = float(endcard.get("dwell_sec", 4.0))
    ec_vo = endcard.get("vo")
    ec_atempo = endcard.get("atempo", global_atempo)
    if ec_vo and not os.path.exists(ec_vo):
        sys.stderr.write(f"WARNING: end_card.vo not found ({ec_vo}) - the end card will be silent.\n")
        ec_vo = None
    if ec_vo:
        ec_vo_dur = ffprobe_dur(ec_vo) / float(ec_atempo or 1.0)
        need = math.ceil((ec_vo_dur + END_CARD_VO_TAIL) * FPS) / FPS
        if need > ec_dwell:
            print(f"  end-card dwell {ec_dwell:.2f}s -> {need:.2f}s "
                  f"(spoken line {ec_vo_dur:.2f}s + {END_CARD_VO_TAIL}s)")
            ec_dwell = need
    ec_frames, ec_dwell = snap(ec_dwell)

    # -------------------------------------------------------------------
    # 1. per-scene video segments (retime -> identical 30fps encode)
    # -------------------------------------------------------------------
    concat = os.path.join(seg_dir, "concat.txt")
    with open(concat, "w") as cf:
        for s in scenes:
            n = s["id"]
            clip = s["clip"]
            frames, tgt = snap(s["target_sec"])
            seg = os.path.join(seg_dir, f"seg-{n}.mp4")
            src_dur = ffprobe_dur(clip)
            vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1"
            # hold the last frame past the target, then cut at an exact frame count, so
            # the segment is never a frame short
            pad = max(tgt - src_dur, 0.0) + 2.0 / FPS
            vf += f",tpad=stop_mode=clone:stop_duration={pad:.3f}"
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip,
                 "-vf", vf, "-frames:v", str(frames),
                 "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_SEG),
                 "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", seg])
            cf.write(f"file 'seg-{n}.mp4'\n")
            print(f"  scene-{n}  clip {src_dur:.2f}s -> {tgt:.2f}s")

        # end card: the real-product PIL composite (never AI), held static by default
        ec_img = endcard["image"]
        zoom_to = float(endcard.get("zoom_to") or 1.0)
        frames = ec_frames
        ec_seg = os.path.join(seg_dir, "seg-endcard.mp4")
        ec_vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1"
        if zoom_to > 1.0:
            # opt-in slow zoom, 1.00 -> zoom_to over the dwell
            zstep = (zoom_to - 1.0) / max(frames, 1)
            ec_vf += (f",zoompan=z='min(zoom+{zstep:.6f}\\,{zoom_to})':d={frames}:"
                      f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}")
        run(["ffmpeg", "-y", "-loglevel", "error",
             "-loop", "1", "-framerate", str(FPS), "-i", ec_img,
             "-vf", ec_vf, "-frames:v", str(frames),
             "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_SEG),
             "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", ec_seg])
        cf.write("file 'seg-endcard.mp4'\n")
        print(f"  end-card  {ec_dwell:.2f}s  " + (f"zoom->{zoom_to}" if zoom_to > 1.0 else "static"))

    # -------------------------------------------------------------------
    # 2. concat video (all segments are 30fps -> no silent frame drops)
    # -------------------------------------------------------------------
    video = os.path.join(seg_dir, "video.mp4")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", concat, "-c", "copy", video])

    # -------------------------------------------------------------------
    # 3. VO track (atempo optional, padded + clamped per scene, concatenated)
    # -------------------------------------------------------------------
    voconcat = os.path.join(seg_dir, "voconcat.txt")
    with open(voconcat, "w") as vf:
        for s in scenes:
            n = s["id"]
            tgt = snap(s["target_sec"])[1]
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
                # no VO for this scene -> silence for the window
                run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
                     "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                     "-t", f"{tgt:.3f}", wav])
            vf.write(f"file 'vo-{n}.wav'\n")

        # end-card window: the spoken line (end_card.vo) at the start of the window, padded
        # with silence to the dwell; or silence alone when there is no line. The audio must
        # span the full video.
        ec_wav = os.path.join(seg_dir, "vo-endcard.wav")
        if ec_vo:
            af = [f"atempo={ec_atempo}"] if ec_atempo else []
            af.append("apad")
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", ec_vo,
                 "-af", ",".join(af), "-t", f"{ec_dwell:.3f}",
                 "-ar", "44100", "-ac", "2", ec_wav])
        else:
            run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
                 "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                 "-t", f"{ec_dwell:.3f}", ec_wav])
        vf.write("file 'vo-endcard.wav'\n")

    vo_track = os.path.join(seg_dir, "vo-track.wav")
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", voconcat, "-c", "copy", vo_track])
    total = ffprobe_dur(vo_track)
    print(f"  total runtime: {total:.2f}s")

    # -------------------------------------------------------------------
    # 4. + 5. music bed (fit + fade) and mix
    # -------------------------------------------------------------------
    mix = os.path.join(seg_dir, "mix.wav")
    if music_bed and os.path.exists(music_bed):
        music = os.path.join(seg_dir, "music.wav")
        fade_out_st = max(total - FADE_OUT_TAIL, 0.0)
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", music_bed,
             "-af", f"afade=t=in:st=0:d={FADE_IN},afade=t=out:st={fade_out_st:.3f}:d={FADE_OUT_TAIL}",
             "-t", f"{total:.3f}", "-ar", "44100", "-ac", "2", music])
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo_track, "-i", music,
             "-filter_complex",
             f"[0:a]{VO_LOUDNORM}[vo];"
             f"[1:a]{MUSIC_LOUDNORM},volume={music_volume}[mus];"
             f"[vo][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[a]",
             "-map", "[a]", "-ar", "44100", "-ac", "2", mix])
    else:
        # VO only - still loudnorm to the -14 LUFS target
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo_track,
             "-af", VO_LOUDNORM, "-ar", "44100", "-ac", "2", mix])

    # -------------------------------------------------------------------
    # 6. master pass: hit the loudness target on the encoded audio
    # -------------------------------------------------------------------
    audio = os.path.join(seg_dir, "master-audio.m4a")
    master_audio(mix, audio)

    # -------------------------------------------------------------------
    # 7. burn captions LAST + mux -> master
    # -------------------------------------------------------------------
    if captions_ass and os.path.exists(captions_ass):
        # The ass= filter cannot take an absolute Windows path (the drive colon breaks the
        # filtergraph). Copy the file into the work dir and run ffmpeg there, so the
        # filter sees a bare relative name.
        # No -shortest: the audio and the video are the same length by construction, and
        # -shortest would drop the last few video frames when the audio ends a hair early.
        local_ass = os.path.join(seg_dir, "captions.ass")
        if not (os.path.exists(local_ass) and os.path.samefile(captions_ass, local_ass)):
            shutil.copyfile(captions_ass, local_ass)
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", audio,
             "-vf", "ass=captions.ass",
             "-map", "0:v", "-map", "1:a",
             "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_MASTER),
             "-pix_fmt", "yuv420p", "-r", str(FPS),
             "-c:a", "copy", out], cwd=seg_dir)
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", audio,
             "-map", "0:v", "-map", "1:a",
             "-c:v", "copy", "-c:a", "copy", out])

    md = ffprobe_dur(out)
    expected = sum(snap(s["target_sec"])[1] for s in scenes) + ec_dwell
    print(f"WROTE {out}  {md:.2f}s (expected ~{expected:.2f}s, "
          f"delta {md-expected:+.2f}s)")


if __name__ == "__main__":
    main()
