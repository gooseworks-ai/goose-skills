#!/usr/bin/env python3
"""compose.py — the deterministic FREE assembler for the absurdist-explainer ad.

Ports the validated compose recipe from the two reference runs (HUM "Big Chill" and
Soteri "Eczema, the pH villain"). Given the per-scene i2v clips + the per-scene VO
windows + the VO track + the music bed + a built end-card PNG + a caption .ass file,
it renders the master mp4:

  1. Per-scene retime  — each clip is retimed to its MEASURED VO window:
       scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1
       then tpad=stop_mode=clone (if the VO is longer than the clip) else -t (trim).
     Every segment is RE-ENCODED to identical libx264/crf18/yuv420p/30fps so the concat
     demuxer never silently drops frames on a framerate mismatch.
  2. End card         — the pre-built endcard.png (real product composite, see
     build_endcard.py) is Ken-Burnsed (slow 1.00 -> 1.04 zoom) over its dwell window and
     appended as the final scene.
  3. Concat           — all segments concatenated via the concat demuxer (-c copy).
  4. VO track         — each VO cue is (optionally) atempo-compressed, padded, clamped to
     its window, and concatenated into one wav.
  5. Music bed        — fit to the total runtime with a fade in/out tail.
  6. Mix              — VO bus loudnorm I=-14 TP=-1.5, music bus loudnorm I=-26 TP=-3 then
     volume (default 0.62), amix inputs=2 duration=first normalize=0. This lands the
     master at -14.5..-13.5 LUFS with the music ducked under the VO.
  7. Caption burn     — the libass .ass is burned LAST so captions sit on top of the
     video, then muxed with the mix into the master mp4.

This capability makes NO paid calls. All inputs come via --config + the work dir; the
recipe (the paid orchestration: keyframes / clips / VO / music) hands them off.
"""
import argparse, json, os, subprocess, sys, tempfile

# ---- canvas / encode constants (validated on both reference runs) ----
W, H = 1080, 1920
FPS = 30
CRF_SEG = 18          # per-scene segment encode
CRF_MASTER = 19       # final burn+mux encode
PRESET = "medium"

# ---- audio mix constants (validated) ----
VO_LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=11"
MUSIC_LOUDNORM = "loudnorm=I=-26:TP=-3:LRA=11"
MUSIC_VOLUME_DEFAULT = 0.62   # Soteri 0.62 / Big Chill 0.70
FADE_OUT_TAIL = 1.4           # music out-fade length
FADE_IN = 0.6                 # music in-fade length


def run(cmd, quiet=True):
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
    return float(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser(description="Compose the absurdist-explainer master.")
    ap.add_argument("--config", required=True, help="path to config.json (see config.example.json)")
    ap.add_argument("--work-dir", required=True, help="scratch dir for intermediates (created if missing)")
    ap.add_argument("--out", required=True, help="output master mp4 path")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    work = a.work_dir
    seg_dir = os.path.join(work, "_work")
    os.makedirs(seg_dir, exist_ok=True)

    scenes = cfg["scenes"]                       # [{id, clip, target_sec, vo, atempo?}, ...]
    endcard = cfg["end_card"]                    # {image, dwell_sec, zoom_to?}
    music_bed = cfg.get("music_bed")             # path or None
    music_volume = float(cfg.get("music_volume", MUSIC_VOLUME_DEFAULT))
    captions_ass = cfg.get("captions_ass")       # path to pre-built .ass, or None
    global_atempo = cfg.get("atempo")            # default compose-stage atempo for all VO cues

    # -------------------------------------------------------------------
    # 1. per-scene video segments (retime -> identical 30fps encode)
    # -------------------------------------------------------------------
    concat = os.path.join(seg_dir, "concat.txt")
    with open(concat, "w") as cf:
        for s in scenes:
            n = s["id"]
            clip = s["clip"]
            tgt = float(s["target_sec"])
            seg = os.path.join(seg_dir, f"seg-{n}.mp4")
            src_dur = ffprobe_dur(clip)
            vf = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1"
            pad = tgt - src_dur
            if pad > 0.05:
                vf += f",tpad=stop_mode=clone:stop_duration={pad:.3f}"
            run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip,
                 "-vf", vf, "-t", f"{tgt:.3f}",
                 "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_SEG),
                 "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", seg])
            cf.write(f"file 'seg-{n}.mp4'\n")
            print(f"  scene-{n}  clip {src_dur:.2f}s -> {tgt:.2f}s")

        # end card: Ken-Burns the real-product PIL composite (never AI)
        ec_img = endcard["image"]
        ec_dwell = float(endcard.get("dwell_sec", 4.0))
        zoom_to = float(endcard.get("zoom_to", 1.04))
        frames = int(round(ec_dwell * FPS))
        ec_seg = os.path.join(seg_dir, "seg-endcard.mp4")
        # slow continuous 1.00 -> zoom_to over the dwell. Feed a SINGLE image frame
        # (-loop 1 -frames:v 1 into the graph via zoompan d=<frames>) so zoompan emits
        # exactly `frames` output frames — the whole-clip Ken-Burns. -t clamps the output.
        zstep = (zoom_to - 1.0) / max(frames, 1)
        run(["ffmpeg", "-y", "-loglevel", "error",
             "-loop", "1", "-i", ec_img,
             "-vf", (f"scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,"
                     f"zoompan=z='min(zoom+{zstep:.6f}\\,{zoom_to})':d={frames}:"
                     f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={W}x{H}:fps={FPS}"),
             "-t", f"{ec_dwell:.3f}",
             "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_SEG),
             "-pix_fmt", "yuv420p", "-r", str(FPS), "-an", ec_seg])
        cf.write("file 'seg-endcard.mp4'\n")
        print(f"  end-card  {ec_dwell:.2f}s  zoom->{zoom_to}")

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
                # no VO for this scene -> silence for the window
                run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
                     "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                     "-t", f"{tgt:.3f}", wav])
            vf.write(f"file 'vo-{n}.wav'\n")

        # end-card window: silence so the audio spans the full video (the end card has no
        # VO). Without this, -shortest would truncate the master and drop the end card.
        ec_wav = os.path.join(seg_dir, "vo-endcard.wav")
        run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
             "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
             "-t", f"{float(endcard.get('dwell_sec', 4.0)):.3f}", ec_wav])
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
        # VO only — still loudnorm to the -14 LUFS target
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", vo_track,
             "-af", VO_LOUDNORM, "-ar", "44100", "-ac", "2", mix])

    # -------------------------------------------------------------------
    # 6. burn captions LAST + mux -> master
    # -------------------------------------------------------------------
    burn_in = video
    if captions_ass and os.path.exists(captions_ass):
        # ass= filter needs an escaped path; use a work-relative copy to dodge colons/spaces
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", mix,
             "-vf", f"ass={_ass_escape(captions_ass)}",
             "-map", "0:v", "-map", "1:a",
             "-c:v", "libx264", "-preset", PRESET, "-crf", str(CRF_MASTER),
             "-pix_fmt", "yuv420p", "-r", str(FPS),
             "-c:a", "aac", "-b:a", "192k", "-shortest", a.out])
    else:
        run(["ffmpeg", "-y", "-loglevel", "error", "-i", burn_in, "-i", mix,
             "-map", "0:v", "-map", "1:a",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", a.out])

    md = ffprobe_dur(a.out)
    expected = sum(float(s["target_sec"]) for s in scenes) + float(endcard.get("dwell_sec", 4.0))
    print(f"WROTE {a.out}  {md:.2f}s (expected ~{expected:.2f}s, "
          f"delta {md-expected:+.2f}s)")


def _ass_escape(path):
    # ffmpeg filtergraph escaping for a filename inside ass='...': use FORWARD
    # slashes — doubled backslashes break the ass filter's filename parse on
    # Windows — and escape the drive colon, which otherwise terminates the
    # option value.
    return path.replace("\\", "/").replace(":", "\\:").replace("'", "\\'")


if __name__ == "__main__":
    main()
