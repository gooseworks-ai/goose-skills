#!/usr/bin/env python3
"""Composite the logo-equation card over b-roll and mux the bed. Free, local.

    compose.py --broll clip.mp4 --cards work/ --out ad.mp4 [--bed bed.mp3] \
        [--in 3.0] [--speed 4] [--cta-at 2.0] [--duration 7.0]

Layout (measured off the reference, 1080x1920): the card plate (1080x672) sits at the top;
the b-roll fills the 1073px band below it (y 672-1745), scaled to 1080 wide and centred;
the bottom 175px stay black. card-no-cta.png shows until --cta-at, then card-with-cta.png
HARD-CUTS in (no fade; the reference cuts). Nothing else moves; there is no voice.

THE B-ROLL MUST MOVE LIKE A TIMELAPSE. A locked-off real-time shot measures ~18x less
motion than the reference and reads as a still photo. --speed plays the window faster
(a 28s window at --speed 4 fills 7s); measure_motion.py gates the result (mean >= 1.5).

The bed, when given, is normalised to -15 LUFS with a short fade out. `amix` is not used
(it averages inputs); `alimiter` would need level=false (it auto-levels by default).
"""
import argparse
import subprocess


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--broll", required=True)
    ap.add_argument("--cards", required=True, help="dir with card-no-cta.png and card-with-cta.png")
    ap.add_argument("--out", required=True)
    ap.add_argument("--bed")
    ap.add_argument("--in", dest="t_in", type=float, default=0.0)
    ap.add_argument("--speed", type=float, default=1.0, help="timelapse factor for the b-roll window")
    ap.add_argument("--cta-at", type=float, default=2.0)
    ap.add_argument("--duration", type=float, default=7.0)
    ap.add_argument("--fit", choices=["cover", "width"], default="cover",
                    help="cover fills the whole band (the reference); width shows the full frame, black around it")
    a = ap.parse_args()
    D = a.duration
    need = D * a.speed + 0.3
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", "%.3f" % a.t_in, "-t", "%.3f" % need, "-i", a.broll,
           "-loop", "1", "-t", "%.3f" % D, "-i", "%s/card-no-cta.png" % a.cards,
           "-loop", "1", "-t", "%.3f" % D, "-i", "%s/card-with-cta.png" % a.cards]
    fit = ("scale=1080:1073:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1073,"
           "pad=1080:1920:0:672:black" if a.fit == "cover" else
           "scale=1080:-2:flags=lanczos,crop=1080:min(ih\\,1073):0:(ih-min(ih\\,1073))/2,"
           "pad=1080:1920:0:672+(1073-ih)/2:black")
    fc = ["[0:v]setpts=(PTS-STARTPTS)/%.4f,fps=30,%s,setsar=1[bg]" % (a.speed, fit),
          "[bg][1:v]overlay=0:0:enable='lt(t,%.3f)'[v1]" % a.cta_at,
          "[v1][2:v]overlay=0:0:enable='gte(t,%.3f)',format=yuv420p[v]" % a.cta_at]
    amap = ["-an"]
    if a.bed:
        cmd += ["-stream_loop", "-1", "-i", a.bed]
        fc.append("[3:a]atrim=0:%.3f,asetpts=PTS-STARTPTS,aresample=48000,loudnorm=I=-15:TP=-1.5:LRA=7,"
                  "afade=t=out:st=%.3f:d=0.5[a]" % (D, max(0, D - 0.5)))
        amap = ["-map", "[a]", "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-filter_complex", ";".join(fc), "-map", "[v]", *amap, "-t", "%.3f" % D, "-r", "30",
            "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            a.out]
    subprocess.run(cmd, check=True)
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.out],
                       capture_output=True, text=True).stdout.strip()
    print("[compose] %s  %ss  b-roll @%.2fs x%.1f  CTA at %.2fs  %s" % (a.out, d, a.t_in, a.speed, a.cta_at,
                                                                     "bed" if a.bed else "silent"))


if __name__ == "__main__":
    main()
