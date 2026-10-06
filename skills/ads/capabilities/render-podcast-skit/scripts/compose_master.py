#!/usr/bin/env python3
"""cutplan.json + clips -> master.  FREE, deterministic, no network.

One ffmpeg call. filter_complex concat only: the concat DEMUXER silently drops
audio when a segment's video and audio durations differ by a few milliseconds,
and a 22-cut dialogue piece differs on every segment.

Video comes from the cut plan, audio comes from the beats, and the two are
concatenated separately because there are more cuts than beats. They still land
on the same length, because every beat's cuts tile that beat exactly -- which
`gates.gate_cutplan` proves before this script runs.

Framing. Every cut carries a normalised crop rect from the plan, applied here
before the cover-scale, in the same filter chain this script already built. A
reframe therefore costs one extra `crop=` and nothing else: no call, no clip, no
re-roll. The crop arithmetic is forced to even widths, heights and offsets,
because a yuv420p plane cropped to an odd height is not chroma-aligned.

Split-screen geometry (9:16, vstack). The seam is PER CUT, not a constant:
    usable = H - gap
    top_h  = even(usable * cut.seam)        # 0.62 is a large speaker panel,
    bot_h  = usable - top_h                 # 0.37 makes the lower one bigger
    top    = speaker,  scaled to cover 1080 x top_h, cropped with a bias
             toward the upper body rather than the centre of the plate
    bottom = listener, same geometry, dimmed by edit.split_screen.listener_dim,
             OR the supplied product still when cut.bottom == "product", left
             undimmed because a product panel is there to be read
    the gap is drawn by padding the top half, so the seam is exact and not a
    rounding artefact

--no-paid builds a coloured stand-in clip per beat (a distinct colour per still,
so the cuts and the split-screen are actually visible) plus a tone, which
exercises the whole deterministic half of the engine for $0. If the run supplies
`preview-plates/<host>.png` -- a real picture of that host the run ALREADY owns,
such as a frame out of a previous render -- the stand-in is built from that
instead, so the preview is watchable on real faces for the same $0.

Usage: compose_master.py --config config.json --run-dir <run> [--no-paid]
       [--out master.mp4]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
import shutil
import subprocess
import sys as _sys, pathlib as _pl
_sys.path.insert(0, str(_pl.Path(__file__).resolve().parent))
import config_io  # noqa: E402


def sh(cmd):
    subprocess.run([str(c) for c in cmd], check=True, capture_output=True)


def colour_for(name: str) -> str:
    h = hashlib.sha256((name or "none").encode()).hexdigest()
    # keep it dark enough that white captions stay legible
    return "0x%02X%02X%02X" % (int(h[0:2], 16) // 3 + 24,
                               int(h[2:4], 16) // 3 + 24,
                               int(h[4:6], 16) // 3 + 24)


def synth(cfg, beats, plan, run):
    """Stand-in clips for the $0 preview.

    These live in preview-clips/, NEVER in clips/. A stand-in sitting in clips/
    looks exactly like a paid clip to the idempotent skip logic in gen_paid.py,
    which would silently skip the real lipsync call and ship a master made of
    flat colour.
    """
    clips = run / "preview-clips"
    clips.mkdir(parents=True, exist_ok=True)
    W, H, FPS = cfg["width"], cfg["height"], cfg["fps"]
    for b in beats:
        out = clips / f"beat-{b['n']:02d}.mp4"
        if out.exists():
            continue
        hz = 180 + 40 * (b["n"] % 5) + (0 if b["who"] == list(cfg["hosts"])[0] else 90)

        # A PLATE, when the operator supplied one. preview-plates/<host>.png is
        # a real picture of that host that the run already owns -- a frame
        # lifted out of a previous render, a reference photo, an approved still
        # from an earlier run. Nothing is generated and nothing is paid for, and
        # the preview stops being flat colour: the reframes, the seam ratios and
        # the payoff single are all judgeable on a real face. The colour
        # stand-in below remains the default, so a run with no plates behaves
        # exactly as before.
        plate = run / "preview-plates" / f"{b['who']}.png"
        if plate.exists():
            sh(["ffmpeg", "-y",
                "-loop", "1", "-t", f"{b['dur_sec']:.3f}", "-i", plate,
                "-f", "lavfi", "-i",
                f"sine=frequency={hz}:duration={b['dur_sec']}",
                "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,"
                       f"crop={W}:{H},fps={FPS},setsar=1",
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
                "-shortest", out])
            continue
        # A flat colour field makes a CROP invisible: a tight framing of one
        # colour is the same picture as a wide framing of it, so the preview
        # would show none of the framing dimension. The grid and the corner
        # block fix that for $0 and no font dependency: a tighter crop shows
        # fewer, larger cells, and an offset crop moves the block.
        grid = (f"drawgrid=w=iw/6:h=ih/10:t=3:c=white@0.30,"
                f"drawbox=x=0:y=0:w=iw/6:h=ih/10:color=white@0.55:t=fill,"
                f"drawbox=x=iw-iw/6:y=ih-ih/10:w=iw/6:h=ih/10:"
                f"color=black@0.55:t=fill")
        sh(["ffmpeg", "-y",
            "-f", "lavfi", "-i",
            f"color=c={colour_for(b['still'])}:s={W}x{H}:d={b['dur_sec']}:r={FPS}",
            "-f", "lavfi", "-i", f"sine=frequency={hz}:duration={b['dur_sec']}",
            "-vf", grid,
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
            "-shortest", out])
    # a stand-in for the split's lower product panel, so the $0 preview shows
    # the geometry. gates.gate_split_bottom_assets is what stops this standing
    # in for a real one on a paid run.
    rel = cfg["edit"]["split_screen"].get("product_still")
    if rel and any(c.get("bottom") == "product" for c in plan["cuts"]):
        pp = run / rel
        if not pp.exists():
            pp.parent.mkdir(parents=True, exist_ok=True)
            sh(["ffmpeg", "-y", "-f", "lavfi", "-i",
                f"color=c=0x8A4A20:s={W}x{H}:d=1",
                "-frames:v", "1", pp])

    ins = run / "inserts"
    n_ins = plan.get("inserts_planned", 0)
    if n_ins:
        ins.mkdir(parents=True, exist_ok=True)
        for i in range(1, n_ins + 1):
            out = ins / f"insert-{i:02d}.mp4"
            if not out.exists():
                sh(["ffmpeg", "-y", "-f", "lavfi", "-i",
                    f"color=c=0x203040:s={W}x{H}:d=3:r={FPS}",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", out])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--no-paid", action="store_true")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    beats = json.loads((run / "beats.json").read_text(encoding="utf-8"))["beats"]
    plan = json.loads((run / "cutplan.json").read_text(encoding="utf-8"))
    caps = json.loads((run / "overlays" / "captions.json").read_text(
        encoding="utf-8"))["cues"]
    ov = run / "overlays"

    clip_dir = run / ("preview-clips" if a.no_paid else "clips")
    if a.no_paid:
        synth(cfg, beats, plan, run)

    W, H, FPS = cfg["width"], cfg["height"], cfg["fps"]

    def qd(sec):
        """Round a duration to a whole number of frames.

        Trimming to a raw second value leaves a fractional frame at the
        end of every segment. Across seventeen of them that accumulated
        to 0.32s of picture arriving late, which reads as the cuts being
        abrupt. Video and audio both quantise through here, so the two
        tracks cannot slide apart however many cuts there are.
        """
        return max(1, int(round(float(sec) * FPS))) / FPS

    _vdur_cache = {}

    def vdur(path):
        """Measured video duration of a clip, cached."""
        path = str(path)
        if path not in _vdur_cache:
            r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                                "-show_entries", "stream=duration", "-of", "csv=p=0",
                                path], capture_output=True, text=True)
            try:
                _vdur_cache[path] = float(r.stdout.strip())
            except ValueError:
                _vdur_cache[path] = 0.0
        return _vdur_cache[path]

    def fit(path, target):
        """setpts factor that stretches a clip to exactly `target` seconds.

        veed returns each clip a few milliseconds SHORTER than the audio it was
        driven by. Concatenated, that accumulated to 0.34s of picture running
        ahead of sound. Cloning the last frame to fill the gap fixed the drift
        and introduced a worse artefact: the picture froze for several frames
        at the end of every beat, then cut, which is what reads as an abrupt
        cut. Stretching instead spreads the shortfall across the whole clip, a
        0.1 to 1.5 percent slowdown that is invisible and keeps the mouth on
        the words. Anything beyond 5 percent is a real mismatch, not rounding,
        so it is left alone and reported rather than silently rubber-banded.
        """
        d = vdur(path)
        if d <= 0:
            return None
        r = target / d
        if r < 0.95 or r > 1.05:
            print(f"[compose] WARN {pathlib.Path(path).name}: video {d:.3f}s vs "
                  f"planned {target:.3f}s, ratio {r:.3f}; too far off to retime, "
                  f"leaving it and padding instead")
            return None
        return r
    ss = cfg["edit"]["split_screen"]
    gap = int(ss.get("gap_px", 6))
    usable = H - gap
    default_seam = float((ss.get("seam_ratios") or [0.5])[0])
    dim = float(ss.get("listener_dim", 0.62))
    bias = float(ss.get("crop_bias_y", 0.25))
    # Each host sits at their own height in the plate, so each panel is cut
    # at their own bias. One shared value put one face against the top edge
    # of its half and gave the other a third of a panel of ceiling.
    pbias = ss.get("panel_bias_y") or {}
    bias_of = lambda who: float(pbias.get(who, bias))
    ec_dur = plan["end_card_sec"]

    # ---------------------------------------------------------------- inputs
    # `inputs` is the flat argv fragment; `n_in` is the ffmpeg input INDEX.
    # These are not the same number -- an input can cost 2 or 4 argv slots --
    # and conflating them produced a filtergraph that referenced [2:v] for the
    # second clip and died with "matches no streams".
    inputs, idx, n_in = [], {}, 0

    def add(*args) -> int:
        nonlocal n_in
        inputs.extend(args)
        n_in += 1
        return n_in - 1

    clip_src, beat_dur = {}, {}
    for b in beats:
        p = clip_dir / f"beat-{b['n']:02d}.mp4"
        if not p.exists():
            raise SystemExit(f"[err] missing {p} -- run the gated paid lipsync "
                             f"step, or pass --no-paid for the $0 preview")
        idx[("clip", b["n"])] = add("-i", p)
        clip_src[b["n"]] = p
        beat_dur[b["n"]] = b["dur_sec"]
    for i in range(1, plan.get("inserts_planned", 0) + 1):
        p = run / "inserts" / f"insert-{i:02d}.mp4"
        if p.exists():
            idx[("insert", i)] = add("-i", p)

    # One idle clip per host, looped, for the split's lower panel. Sampling
    # the listener's own speaking footage there puts two people on screen
    # talking at once with only one of them audible. -stream_loop -1 means a
    # six second clip covers a cut of any length.
    use_idle = ss.get("listener_source") == "idle"
    if use_idle:
        for who in sorted({c.get("listener") for c in plan["cuts"]
                           if c.get("listener")}):
            ip = clip_dir / f"idle-{who}.mp4"
            if not ip.exists() and a.no_paid:
                src = next((clip_dir / f"beat-{c2['clip_beat']:02d}.mp4"
                            for c2 in plan["cuts"]
                            if c2.get("speaker") == who and c2.get("clip_beat")),
                           None)
                if src and src.exists():
                    shutil.copy2(src, ip)
            if not ip.exists():
                raise SystemExit(
                    f"[err] edit.split_screen.listener_source is 'idle' but "
                    f"{ip} is missing. Run `gen_paid.py idle`, or set it back "
                    f"to 'clip' and accept both hosts talking at once.")
            idx[("idle", who)] = add("-stream_loop", "-1", "-i", ip)
    # one looped still per product-bottom split cut. These MUST be added before
    # cap0 is taken, because cap0 is an input index and anything added after it
    # shifts the caption overlays off by that many streams.
    prod_rel = ss.get("product_still")
    for k, c in enumerate(plan["cuts"]):
        if c.get("mode") == "split" and c.get("bottom") == "product":
            pp = run / prod_rel if prod_rel else None
            if pp is None or not pp.exists():
                raise SystemExit(
                    f"[err] cut {c['beat']}.{c['idx']} puts a product still in "
                    f"the split's lower panel but {pp} is missing; supply it or "
                    f"drop 'product' from edit.split_screen.bottom_sources")
            idx[("product", k)] = add(
                "-loop", "1", "-t", f"{c['end'] - c['start']:.3f}", "-i", pp)

    i_ec = add("-loop", "1", "-t", str(ec_dur), "-i", ov / "end-card.png")
    i_sil = add("-f", "lavfi", "-i", f"anullsrc=r=48000:cl=stereo:d={ec_dur}")
    cap0 = n_in
    for c in caps:
        add("-i", ov / c["png"])

    # ------------------------------------------------- split the reused clips
    # A clip read by more than one cut must be split; ffmpeg lets a stream be
    # consumed exactly once. A reaction cut reads the LISTENER's clip, which
    # plan_cuts already recorded as that cut's clip_beat.
    consumers: dict[int, int] = {}
    for c in plan["cuts"]:
        if c["mode"] == "insert":
            continue
        consumers[idx[("clip", c["clip_beat"])]] = \
            consumers.get(idx[("clip", c["clip_beat"])], 0) + 1
        if c["mode"] == "split" and c.get("bottom") != "product":
            if use_idle and c.get("listener"):
                k = idx[("idle", c["listener"])]
            elif c.get("listener_clip_beat") is not None:
                k = idx[("clip", c["listener_clip_beat"])]
            else:
                continue
            consumers[k] = consumers.get(k, 0) + 1

    f: list[str] = []
    taps: dict[int, list[str]] = {}
    for i, n in sorted(consumers.items()):
        labels = [f"s{i}_{j}" for j in range(n)]
        f.append(f"[{i}:v]split={n}" + "".join(f"[{l}]" for l in labels))
        taps[i] = labels

    def tap(i: int) -> str:
        return taps[i].pop(0)

    def cover(src: str, out: str, w: int, h: int, biasy: float) -> str:
        return (f"[{src}]scale={w}:{h}:force_original_aspect_ratio=increase,"
                f"crop={w}:{h}:(iw-{w})/2:(ih-{h})*{biasy},setsar=1[{out}]")

    def framing_crop(crop: dict | None) -> str:
        """The plan's normalised crop as a filter fragment, or '' for a full
        frame. Every term is forced even: a yuv420p plane cropped to an odd
        height or at an odd offset is not chroma-aligned and ffmpeg either
        silently shifts it or refuses."""
        if not crop:
            return ""
        x, y = float(crop.get("x", 0.0)), float(crop.get("y", 0.0))
        w, h = float(crop.get("w", 1.0)), float(crop.get("h", 1.0))
        if w >= 0.9999 and h >= 0.9999 and x <= 1e-9 and y <= 1e-9:
            return ""
        e = lambda d, v: f"2*floor({d}*{v}/2)"
        return (f",crop={e('iw', w)}:{e('ih', h)}:"
                f"{e('iw', x)}:{e('ih', y)}")

    def seam_rows(c: dict) -> tuple[int, int]:
        """Top and bottom panel heights for this cut's own seam ratio."""
        s = float(c.get("seam", default_seam))
        top = int(round(usable * s / 2)) * 2
        top = max(2, min(usable - 2, top))
        return top, usable - top

    # ------------------------------------------------------------ video cuts
    for k, c in enumerate(plan["cuts"]):
        vo = f"v{k}"
        if c["mode"] == "insert":
            i = idx.get(("insert", c["insert_idx"]))
            if i is None:
                f.append(f"color=c=black:s={W}x{H}:d={c['end']-c['start']}:"
                         f"r={FPS},setsar=1[{vo}]")
                continue
            f.append(f"[{i}:v]trim=0:{qd(c['end'] - c['start']):.6f},"
                     f"setpts=PTS-STARTPTS"
                     f"{framing_crop(c.get('crop'))},scale={W}:{H}:"
                     f"force_original_aspect_ratio=increase,crop={W}:{H},"
                     f"fps={FPS},setsar=1[{vo}]")
            continue

        i = idx[("clip", c["clip_beat"])]
        raw = f"r{k}"
        # the plan's framing crop rides the same chain as the trim
        # RETIME, do not freeze. veed returns each clip a few milliseconds
        # SHORTER than the audio it was driven by, 2 to 35ms each, and
        # concat accumulated that to 0.34s of picture running ahead of
        # sound. Cloning the last frame to fill the gap fixed the drift
        # and bought a worse artefact: the picture froze for several
        # frames at the end of every beat and then cut, which is exactly
        # what reads as an abrupt cut. Stretching spreads the shortfall
        # across the whole clip, well under one percent, invisible, and
        # keeps the mouth on the words.
        _r = fit(clip_src[c["clip_beat"]], qd(beat_dur[c["clip_beat"]]))
        _pre = (f"setpts={_r:.6f}*PTS," if _r else
                "tpad=stop_mode=clone:stop_duration=1,")
        f.append(f"[{tap(i)}]{_pre}"
                 f"trim={c['src_start']:.3f}:{c['src_end']:.3f},"
                 f"setpts=PTS-STARTPTS,fps={FPS}"
                 f"{framing_crop(c.get('crop'))}[{raw}]")

        if c["mode"] == "split":
            top_h, bot_h = seam_rows(c)
            lraw = f"l{k}"
            if c.get("bottom") == "product":
                ip = idx[("product", k)]
                f.append(f"[{ip}:v]fps={FPS},setsar=1[{lraw}]")
                f.append(cover(lraw, f"bot{k}", W, bot_h, 0.5))
            else:
                if use_idle and c.get("listener"):
                    j = idx[("idle", c["listener"])]
                else:
                    j = idx[("clip", c["listener_clip_beat"])]
                # sample the listener from the same window length, from its head
                # qd(), like everything else on this timeline. Trimming the
                # lower panel to a raw second value leaves a fractional frame,
                # vstack takes the LONGER of the two panels, and the split
                # segment comes out three frames long -- which pushes every
                # cut after it late. Measured: the picture changed at 21.467s
                # against a plan of 21.367s in the split render, while the
                # same beats in the non-split render landed exact.
                # A DIFFERENT window of the idle clip each time. Taking
                # trim=0 every cut replays the same few seconds, so the
                # listener does exactly the same thing on every turn and the
                # loop becomes obvious -- most of all when one host does a lot
                # of the listening. The offset is deterministic (cut ordinal,
                # not randomness) and kept inside the clip so no loop seam
                # lands mid-window and jumps.
                seg = qd(c['end'] - c['start'])
                if use_idle and c.get("listener"):
                    span = max(0.0, float(ss.get("idle_sec", 6.0)) - seg)
                    off = round((k * 1.73) % span, 3) if span > 0.05 else 0.0
                else:
                    off = 0.0
                f.append(f"[{tap(j)}]trim={off:.3f}:{off + seg:.3f},"
                         f"setpts=PTS-STARTPTS,fps={FPS}[{lraw}]")
                f.append(cover(lraw, f"bot{k}_0", W, bot_h, bias_of(c.get("listener"))))
                f.append(f"[bot{k}_0]eq=saturation={dim}:"
                         f"brightness={-(1 - dim) * 0.25:.3f}[bot{k}]")
            f.append(cover(raw, f"top{k}", W, top_h, bias_of(c.get("show") or c.get("speaker"))))
            f.append(f"[top{k}]pad={W}:{top_h + gap}:0:0:"
                     f"{ss.get('gap_hex', 'black').replace('#', '0x')}[topg{k}]")
            # vstack runs for as long as its LONGER input, so whichever
            # panel ends up a frame over decides the segment's length and
            # every cut after it slides. Pin the segment to the length the
            # plan asked for instead of trusting the two branches to agree.
            f.append(f"[topg{k}][bot{k}]vstack=inputs=2,"
                     f"pad={W}:{H}:0:0:black,setsar=1,"
                     f"trim=0:{qd(c['end'] - c['start']):.3f},"
                     f"setpts=PTS-STARTPTS[{vo}]")
        else:
            f.append(cover(raw, vo, W, H, bias))

    # -------------------------------------------------------- audio (beats)
    for m, b in enumerate(beats):
        i = idx[("clip", b["n"])]
        # the beat is as long as ITS cuts are, quantised the same way
        bd = sum(qd(c["end"] - c["start"]) for c in plan["cuts"]
                 if c["beat"] == b["n"]) or qd(b["dur_sec"])
        f.append(f"[{i}:a]apad=pad_dur=1,atrim=0:{bd:.6f},"
                 f"asetpts=PTS-STARTPTS,"
                 f"aresample=48000,aformat=channel_layouts=stereo[ab{m}]")

    # ------------------------------------------------------ concat + overlay
    f.append(f"[{i_ec}:v]scale={W}:{H},fps={FPS},setsar=1,format=yuv420p[vec]")
    f.append(f"[{i_sil}:a]aresample=48000,aformat=channel_layouts=stereo[aec]")
    vseq = "".join(f"[v{k}]" for k in range(len(plan["cuts"]))) + "[vec]"
    f.append(f"{vseq}concat=n={len(plan['cuts']) + 1}:v=1:a=0[vcat]")
    aseq = "".join(f"[ab{m}]" for m in range(len(beats))) + "[aec]"
    f.append(f"{aseq}concat=n={len(beats) + 1}:v=0:a=1[acat]")

    # Pin BOTH tracks to one computed length. Seventeen segments each rounded
    # to a frame boundary, plus a silence tail that decodes a little short,
    # left the picture 0.38s long and the sound 0.52s short of the same
    # target. Padding each to T and trimming both to T makes the file exactly
    # as long as the dialogue it was planned from, and makes a future drift
    # fail loudly against that number instead of sliding.
    T = (sum(qd(c['end'] - c['start']) for c in plan['cuts'])
         + qd(float(cfg['end_card']['duration_sec'])))
    f.append(f"[vcat]tpad=stop_mode=clone:stop_duration=3,trim=0:{T:.3f},"
             f"setpts=PTS-STARTPTS[vcatn]")
    f.append(f"[acat]apad=pad_dur=3,atrim=0:{T:.3f},asetpts=PTS-STARTPTS[acatn]")

    # ---- the grade. Applied to the concatenated PICTURE only, before the
    # captions and the corner lockup go on, because a grade belongs on footage
    # and not on type: pushing saturation through a caption is how a white
    # caption picks up a colour cast nobody asked for.
    grade = (cfg.get("edit", {}).get("grade") or {})
    if grade.get("enabled") and grade.get("chain"):
        f.append(f"[vcatn]{grade['chain']}[vgr]")
        chain = "[vgr]"
    else:
        chain = "[vcatn]"
    # Captions are timed off the BEATS, which are raw seconds, but the picture
    # runs on frame-quantised cut lengths, and the two totals are not the same
    # number: 25.723 against 25.667 on one episode. The end card therefore
    # starts 56ms before the last caption thinks the dialogue ends, and the
    # last line was drawn over the brand card. Clamp every caption to the
    # quantised dialogue end, one frame clear of it, and drop any cue that
    # starts after it.
    dlg_end = sum(qd(c["end"] - c["start"]) for c in plan["cuts"])
    cap_last = dlg_end - 1.0 / FPS
    for k, c in enumerate(caps):
        w0, w1 = c["w0"], min(c["w1"], cap_last)
        if w0 >= cap_last:
            continue                      # entirely inside the end card
        nxt = f"[vc{k}]"
        f.append(f"{chain}[{cap0 + k}:v]overlay=0:0:"
                 f"enable='between(t,{w0:.3f},{w1:.3f})'{nxt}")
        chain = nxt

    # ---- the persistent corner lockup: brand the FRAME, not the dialogue.
    # Technique 26: in seven sponsor-tagged New Heights shorts the sponsor is a
    # corner lockup for the whole runtime and is spoken in none of them. Added
    # AFTER the caption inputs so no caption index moves.
    fb = cfg.get("edit", {}).get("frame_brand", {})
    if fb.get("enabled"):
        # ONE source of truth. brand.lockup_file is the brand block's;
        # edit.frame_brand.lockup_file is the older key and is kept as a
        # fallback. Three new brands set only the brand block and all
        # three rendered with no corner mark, because this read the old
        # key and found the previous brand's filename still sitting in it.
        lk = run / ((cfg.get("brand") or {}).get("lockup_file")
                    or fb.get("lockup_file", ""))
        if not lk.exists():
            print(f"[compose] WARNING frame_brand is on but {lk} is missing; "
                  f"the lockup is NOT in this render")
        else:
            total = plan["dialogue_sec"] + (ec_dur if fb.get("persistent", True)
                                            else 0.0)
            i_lk = add("-loop", "1", "-t", f"{total:.3f}", "-i", lk)
            m = int(fb.get("margin_px", 36))
            f.append(f"[{i_lk}:v]scale={int(fb.get('width_px', 250))}:-2,"
                     f"format=rgba,colorchannelmixer=aa="
                     f"{float(fb.get('opacity', 1.0)):.3f}[lk]")
            pos = {"top_right": (f"W-w-{m}", f"{m}"),
                   "top_left": (f"{m}", f"{m}"),
                   "bottom_right": (f"W-w-{m}", f"H-h-{m}"),
                   "bottom_left": (f"{m}", f"H-h-{m}")}[
                fb.get("corner", "top_right")]
            f.append(f"{chain}[lk]overlay={pos[0]}:{pos[1]}:"
                     f"enable='between(t,0,{total:.3f})'[vlk]")
            chain = "[vlk]"

    f.append(f"{chain}format=yuv420p[vout]")
    # loudnorm resamples internally and leaves the stream at 192k/96k if
    # nothing brings it back, so the deliverable was shipping 96kHz audio.
    # ---- room tone. Measured against nine real podcast clips, each judged
    # at its own level minus 18dB: they run 2.2 to 5.5 percent silence and
    # these episodes ran 11 to 15, because synthesised speech sits at DIGITAL
    # silence between phrases and a real recording never does -- a real room
    # always has air in it. This is not a cosmetic bed: it is the difference
    # between a pause and a dropout.
    #
    # Brown noise, steeply band-limited so it reads as air rather than hiss,
    # laid under the whole runtime at a level far below the dialogue. It goes
    # in BEFORE loudnorm so the whole mix is normalised together.
    rt = (cfg.get("edit", {}) or {}).get("room_tone") or {}
    if rt.get("enabled"):
        gain = float(rt.get("gain_db", -50.0))
        hp = int(rt.get("highpass_hz", 90))
        lp = int(rt.get("lowpass_hz", 2600))
        i_rt = add("-f", "lavfi", "-t", f"{T:.3f}",
                   "-i", f"anoisesrc=color=brown:r=48000:amplitude=0.9")
        f.append(f"[{i_rt}:a]highpass=f={hp},lowpass=f={lp},"
                 f"volume={gain}dB,aresample=48000,"
                 f"aformat=channel_layouts=stereo[rtone]")
        # AFTER loudnorm, not before. Mixed in first, the bed is whatever
        # each episode's own normalisation gain happens to make it: the same
        # -36dB setting came out at 2.1 percent silence on one brand and 12.9
        # on another, because quieter dialogue earns more make-up gain and
        # drags the air up with it. Normalise the speech, then lay the room
        # under it at an absolute level, so every episode's floor matches.
        f.append("[acatn]loudnorm=I=-16:TP=-1.5:LRA=11,"
                 "aresample=48000,aformat=channel_layouts=stereo[aspeech]")
        f.append(f"[aspeech][rtone]amix=inputs=2:duration=first:"
                 f"dropout_transition=0:normalize=0,"
                 f"alimiter=limit=0.891,"
                 f"aresample=48000,aformat=channel_layouts=stereo[aout]")
    else:
        f.append("[acatn]loudnorm=I=-16:TP=-1.5:LRA=11,"
                 "aresample=48000,aformat=channel_layouts=stereo[aout]")

    out = pathlib.Path(a.out) if a.out else         run / ("master-preview.mp4" if a.no_paid else "master.mp4")
    enc = cfg["assembly"]
    cmd = (["ffmpeg", "-y"] + inputs +
           ["-filter_complex", ";".join(f), "-map", "[vout]", "-map", "[aout]",
            "-c:v", "libx264", "-preset", enc.get("preset", "medium"),
            "-crf", str(enc.get("crf", 24)), "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", enc.get("audio_bitrate", "128k"),
            "-movflags", "+faststart", out])
    print(f"[compose] {len(plan['cuts'])} cuts "
          f"({plan['pattern_use']}) + {ec_dur}s end card -> {out}")
    subprocess.run([str(c) for c in cmd], check=True)
    print(f"[compose] wrote {out} ({out.stat().st_size / 1e6:.2f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
