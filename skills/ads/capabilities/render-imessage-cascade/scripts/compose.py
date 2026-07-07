#!/usr/bin/env python3
"""compose.py — the FFmpeg composite engine for the iMessage notification-cascade ad.

Takes the plate + the PNGs build_assets.py produced (nb-*.png, pill.png, endcard.png)
and renders the signature mechanic:

  - Ken Burns push-in on a clean phone-on-desk plate.
  - Each notification SPRINGS IN AT THE BOTTOM (by the phone); every already-present
    banner is PUSHED UP one row. The "Show less / X" pill rides above the stack.
  - At the clear time, the X is pressed: the whole stack + pill swipe up and fade.
  - The serif end card fades in over the clean desk.

Optional audio: a music bed, a soft pop at each arrival, a swipe swoosh on the clear.

Geometry constants MUST match build_assets.py.
"""
import argparse, json, os, subprocess, sys

CANVAS_W = 1080
BODY_W = 810
BANNER_H = 176
SIDE = (CANVAS_W - BODY_W) // 2
PAD = 60
H = 214            # row pitch (canvas-top spacing between stacked banners)
YB = 1200          # bottom anchor: canvas-top of the newest (bottom) banner
BOTTOM_HINT = YB + PAD + BANNER_H  # ~1436 body bottom -> just above the phone

def push(a):    return f"(1-exp(-7*max(0\\,t-{a})))"
def spring(a):  return f"(60*exp(-9*max(0\\,t-{a})))"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--work-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--no-audio", action="store_true")
    a = ap.parse_args()
    cfg = json.load(open(a.config))
    work = a.work_dir
    N = len(cfg["notifications"])
    tm = cfg.get("timing", {})
    arrivals = tm.get("arrivals") or [round(1.6 + 2.0*i, 2) for i in range(N)]
    assert len(arrivals) == N, "timing.arrivals length must equal number of notifications"
    Tc = tm.get("clear", round(arrivals[-1] + 1.6, 2))
    EC_IN = tm.get("endcard_in", round(Tc + 0.7, 2))
    DUR = tm.get("duration", round(EC_IN + 4.1, 2))
    if N > 5:
        print(f"WARNING: {N} notifications — the top of the stack may clip / crowd the pill. 3-5 recommended.", file=sys.stderr)

    plate = cfg["plate"]
    CLEAR = f"(560*(1-exp(-12*max(0\\,t-{Tc}))))"

    def ybanner(k):  # k is 1-indexed arrival order; pushed up by every later arrival
        later = "+".join(push(arrivals[j]) for j in range(k, N))
        base = f"{YB}-{H}*({later})" if later else f"{YB}"
        return f"{base}+{spring(arrivals[k-1])}-{CLEAR}"
    later_all = "+".join(push(arrivals[j]) for j in range(1, N))
    y_pill = f"({YB}-{H}*({later_all}))-70-{CLEAR}" if later_all else f"({YB})-70-{CLEAR}"

    # ---- inputs ----
    inp = ["-loop", "1", "-framerate", "30", "-t", str(DUR), "-i", plate]
    for k in range(1, N+1):
        inp += ["-loop", "1", "-framerate", "30", "-t", str(DUR), "-i", os.path.join(work, f"nb-{k}.png")]
    idx_pill = N+1
    inp += ["-loop", "1", "-framerate", "30", "-t", str(DUR), "-i", os.path.join(work, "pill.png")]
    idx_ec = N+2
    inp += ["-loop", "1", "-framerate", "30", "-t", str(DUR), "-i", os.path.join(work, "endcard.png")]

    # ---- video filtergraph ----
    fc = []
    fc.append("[0:v]scale=1188:2088:force_original_aspect_ratio=increase,crop=1188:2088,setsar=1,"
              "zoompan=z='min(1+0.00026*on\\,1.13)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,"
              "fade=t=in:st=0:d=0.5,format=rgba[plate]")
    for k in range(1, N+1):
        fc.append(f"[{k}:v]format=rgba,fade=t=in:st={arrivals[k-1]}:d=0.35:alpha=1,fade=t=out:st={Tc}:d=0.4:alpha=1[b{k}]")
    fc.append(f"[{idx_pill}:v]format=rgba,fade=t=in:st={arrivals[0]}:d=0.35:alpha=1,fade=t=out:st={Tc}:d=0.4:alpha=1[pill]")
    fc.append(f"[{idx_ec}:v]format=rgba,fade=t=in:st={EC_IN}:d=0.6:alpha=1[ec]")
    cur = "plate"
    for k in range(1, N+1):
        fc.append(f"[{cur}][b{k}]overlay=x=0:y='{ybanner(k)}'[v{k}]"); cur = f"v{k}"
    fc.append(f"[{cur}][pill]overlay=x=0:y='{y_pill}'[vp]")
    fc.append(f"[vp][ec]overlay=x=0:y=0:enable='gte(t,{round(EC_IN-0.3,2)})',format=yuv420p[vout]")

    # ---- optional audio ----
    audio = cfg.get("audio", {}) or {}
    have_audio = (not a.no_audio) and audio.get("bed") and os.path.exists(audio.get("bed", ""))
    aud_inputs = []
    if have_audio:
        bed = audio["bed"]; pop = audio.get("pop"); swoosh = audio.get("swoosh")
        base_i = idx_ec + 1
        aud_inputs += ["-i", bed]; bed_i = base_i
        pop_i = swoosh_i = None
        nxt = base_i + 1
        if pop and os.path.exists(pop):
            aud_inputs += ["-i", pop]; pop_i = nxt; nxt += 1
        if swoosh and os.path.exists(swoosh):
            aud_inputs += ["-i", swoosh]; swoosh_i = nxt; nxt += 1
        parts = []
        mixes = []
        if pop_i is not None:
            parts.append(f"[{pop_i}:a]asplit={N}" + "".join(f"[pp{k}]" for k in range(N)) + ";")
            for k in range(N):
                ms = int(arrivals[k]*1000)
                vol = 0.62 if k == N-1 else 0.55
                parts.append(f"[pp{k}]adelay={ms}|{ms},volume={vol}[p{k}];"); mixes.append(f"[p{k}]")
        if swoosh_i is not None:
            ms = int(Tc*1000); parts.append(f"[{swoosh_i}:a]adelay={ms}|{ms},volume=0.5[sw];"); mixes.append("[sw]")
        parts.append(f"[{bed_i}:a]volume=1.0[bed];")
        n_mix = 1 + len(mixes)
        parts.append("[bed]" + "".join(mixes) + f"amix=inputs={n_mix}:normalize=0:duration=first:dropout_transition=0,"
                     f"loudnorm=I=-14:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.4,afade=t=out:st={round(DUR-0.8,2)}:d=0.8[aout]")
        fc.append("".join(parts).rstrip(";"))

    filt = ";".join(fc)

    cmd = ["ffmpeg", "-y"] + inp + aud_inputs + ["-filter_complex", filt, "-map", "[vout]"]
    if have_audio:
        cmd += ["-map", "[aout]", "-c:a", "aac", "-b:a", "256k"]
    cmd += ["-r", "30", "-t", str(DUR), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", a.out]
    print("duration", DUR, "| N", N, "| arrivals", arrivals, "| clear", Tc, "| endcard", EC_IN)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-1500:], file=sys.stderr); sys.exit(1)
    print("WROTE", a.out)

if __name__ == "__main__":
    main()
