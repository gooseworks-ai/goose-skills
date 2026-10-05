#!/usr/bin/env python3
"""The four paid steps, each behind an explicit confirmation.

    gen_paid.py plate   --config c.json --run-dir <run>   ONE two-shot, both hosts
    gen_paid.py vo      --config c.json --run-dir <run>
    gen_paid.py stills  --config c.json --run-dir <run>
    gen_paid.py clips   --config c.json --run-dir <run>
    gen_paid.py inserts --config c.json --run-dir <run>

Without `--confirm` every step prints the exact dollar amount, the engine, the
call count and the atom that makes the call, then exits 0 WITHOUT calling
anything. That is the default and it is the whole point: the operator sees the
number before the number is spent.

With `--confirm` the step prints the command line for each call and, unless
`--execute` is also given, still does not fire. `--execute` is the only flag
that spends, and it requires `--confirm` as well. Two flags, because one flag
gets typed by accident.

This script never imports a provider SDK and never holds a key. It composes the
calls for the repo's own atoms so the cost, retry and error behaviour stays in
one place per provider:

    vo      skills/atoms/voiceover/create-voiceover-elevenlabs
    stills  skills/atoms/image-generation (gpt-image via the fal proxy)
    clips   skills/atoms/lipsync/create-lipsync-veed-fal
            skills/atoms/lipsync/create-lipsync-hedra          (fallback)
    inserts skills/atoms/video-generation/create-video-kling
"""
from __future__ import annotations

import argparse
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import cost_model  # noqa: E402

import config_io  # noqa: E402
import provider_commands  # noqa: E402


NEEDS_BEATS = ("vo", "idle", "clips", "inserts")


def load(a):
    """The config, the run dir, and the beats if this step needs them.

    `plate` is the FIRST thing anyone runs and it does not depend on the
    script at all, but this demanded beats.json for every step, so a new brand
    could not generate its plate until it had already written a script and
    planned a timeline. Found by setting the recipe up as a second brand.
    """
    cfg = config_io.load(a.config, a.preset)
    run = pathlib.Path(a.run_dir)
    bp = run / "beats.json"
    if not bp.exists():
        if a.step in NEEDS_BEATS:
            sys.exit(f"[err] no beats.json -- run plan_beats.py first (free). "
                     f"The {a.step} step is timed against it.")
        return cfg, run, []
    return cfg, run, json.loads(bp.read_text(encoding="utf-8"))["beats"]


def banner(step: str, engine: str, units: str, usd: float, calls: int,
           atom: str, confirmed: bool, execute: bool) -> bool:
    """Returns True only when the caller may actually spend."""
    print(f"\n  PAID STEP: {step}")
    print(f"  engine     {engine}")
    print(f"  atom       {atom}")
    print(f"  calls      {calls}")
    print(f"  units      {units}")
    print(f"  COST       ${usd:.4f}")
    print(f"  rate src   see cost_model.py")
    if not confirmed:
        print("\n  NOT FIRED. Nothing was called and nothing was billed.")
        print("  To proceed: re-run with --confirm to print the calls, then add")
        print("  --execute to actually spend. Get operator approval first.\n")
        return False
    if not execute:
        print("\n  CONFIRMED but NOT EXECUTED. The calls are printed below.")
        print("  Add --execute to spend.\n")
        return False
    print("\n  EXECUTING. This spends.\n")
    return True


def step_vo(cfg, run, beats, a):
    chars = sum(len(b["text"]) for b in beats)
    usd = chars / 1000.0 * cost_model.ELEVENLABS_USD_PER_1K_CHARS
    atom = provider_commands.resolve("voice")[0]
    go = banner("voiceover", f"elevenlabs/{cfg['hosts']['A']['model']} "
                f"(with-timestamps)", f"{chars} characters over {len(beats)} "
                f"beats", usd, len(beats), str(atom), a.confirm, a.execute)
    out = run / "voiceovers"
    for b in beats:
        h = cfg["hosts"][b["who"]]
        dst = out / f"beat-{b['n']:02d}.mp3"
        # Resumable, and it has to be: one network timeout on beat 10 used to
        # abort the whole step, leave no manifest, and re-bill the nine beats
        # that had already succeeded on the next attempt. Delete the
        # voiceovers directory to force a clean regeneration.
        timing = dst.with_suffix(".timestamps.json")
        legacy = dst.with_suffix(dst.suffix + ".timestamps.json")
        if not timing.exists() and legacy.exists():
            timing.write_bytes(legacy.read_bytes())
        if dst.exists() and dst.stat().st_size > 0:
            if not timing.exists():
                sys.exit(f"[err] {dst} has no character timings. Recover its "
                         "timestamp response before resuming; refusing to re-bill it.")
            print(f"    beat {b['n']:02d} already generated; left alone")
            continue
        cmd = [*provider_commands.command("voice"),
               "--voice-id", h["voice_id"], "--model", h["model"],
               "--with-timestamps", "--text", b["text"],
               "--settings", json.dumps(h["settings"]),
               "--output", str(dst)]
        print("   ", " ".join(cmd[:8]), "...")
        if go:
            out.mkdir(parents=True, exist_ok=True)
            try:
                subprocess.run(cmd, check=True)
            except subprocess.CalledProcessError:
                print(f"    beat {b['n']:02d} failed; one retry")
                subprocess.run(cmd, check=True)
    if go:
        write_vo_manifest(run, beats)
        report_read_rate(cfg, run, beats)
        print("\n  Now re-run plan_beats.py so the timeline becomes MEASURED, "
              "then plan_cuts.py and build_overlays.py.")


def write_vo_manifest(run: pathlib.Path, beats) -> None:
    """Measure every mp3 and write voiceovers/manifest.json.

    plan_beats.py reads this file and ONLY this file to decide whether its
    timeline is measured or estimated. Without it the voiceover step leaves
    fifteen correct mp3s on disk and a plan that still says estimated: true,
    so the lipsync step pays per second against word-count guesses. The clips
    step prints a warning about exactly that, and the warning was unreachable
    from the happy path because nothing ever wrote the manifest.
    """
    out = run / "voiceovers"
    durs = {}
    for b in beats:
        f = out / f"beat-{b['n']:02d}.mp3"
        if not f.exists():
            sys.exit(f"[err] {f} is missing; cannot measure the timeline")
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                            "format=duration", "-of", "csv=p=0", str(f)],
                           capture_output=True, text=True, check=True)
        durs[str(b["n"])] = round(float(r.stdout.strip()), 3)
    (out / "manifest.json").write_text(json.dumps(durs, indent=1),
                                       encoding="utf-8")
    print(f"  measured {len(durs)} beats -> {out / 'manifest.json'} "
          f"({sum(durs.values()):.2f}s of dialogue)")


def base_prompt(cfg, who: str) -> str:
    """set + framing rules + THIS host's appearance + the realism suffix.

    The appearance is the point. Before hosts.<X>.appearance existed this
    prompt was set_description + still_rules + realism_suffix and nothing
    else, which is identical for every host, so two bases described one
    person and the generator put them in two different rooms.
    """
    ch, h = cfg["characters"], cfg["hosts"][who]
    app = (h.get("appearance") or "").strip()
    if not app:
        sys.exit(f"[err] hosts.{who} has no 'appearance'. Two hosts with no "
                 f"appearance share one prompt and come back as two strangers "
                 f"in two rooms. Write what this host looks like.")
    return (f'{cfg["set_description"]} {ch["still_rules"]} '
            f'HOST: {app}.{ch["realism_suffix"]}')


def plate_prompt(cfg) -> str:
    """ONE wide two-shot carrying BOTH hosts, the set and the light.

    This is the whole lesson of the first two renders in one function. A set
    description binds a room only WITHIN a single generation, so generating a
    still per host produces two people in two different rooms, every time, no
    matter how identical the wording. One image is the only thing that makes
    the set hold, and the singles are then cropped out of it for nothing.
    """
    ch, hosts = cfg["characters"], cfg["hosts"]
    who = sorted(hosts)
    if len(who) != 2:
        sys.exit(f"[err] the plate is a TWO-shot; the config has {len(who)} host(s)")
    apps = []
    for side, k in zip(("LEFT", "RIGHT"), who):
        app = (hosts[k].get("appearance") or "").strip()
        if not app:
            sys.exit(f"[err] hosts.{k} has no 'appearance'; the plate cannot "
                     f"tell the two people apart without it")
        apps.append((k, side, app))
    if apps[0][2] == apps[1][2]:
        sys.exit("[err] both hosts have the same 'appearance'; the plate comes "
                 "back as twins")
    rules = ch.get("plate_rules") or (
        "Both people in the same frame, seated and turned slightly toward each "
        "other, mid-conversation. Each wears over-ear headphones and speaks "
        "into a broadcast microphone on its own boom arm. A wide shot: both "
        "hosts in frame from the knees up, the chairs and the floor visible, "
        "generous space above their heads. Both mouths closed and neutral. "
        "No manufacturer names, model names, maker decals or sponsor "
        "logos anywhere: not on the equipment, the furniture, the tools, "
        "the packaging or their clothes. Every object is unbranded and "
        "plain.")
    desc = " ".join(f"{side}: {app}." for _, side, app in apps)
    return (f"Candid documentary photograph of two podcast hosts recording "
            f"together in ONE room. {rules} {desc} "
            f"{cfg['set_description']}{ch['realism_suffix']}")


def step_plate(cfg, run, beats, a):
    eng = cfg["engines"]["stills"]
    rate = cost_model.IMAGE_ENGINES[eng]["usd_per_image"]
    atom = provider_commands.resolve("image")[0]
    size = cfg["engines"].get("stills_image_size", "1088x1920")
    out = run / "stills" / (cfg["characters"].get("plate_file") or "plate.png")
    prompt = plate_prompt(cfg)

    go = banner("the two-shot plate", eng, "1 image, both hosts in it",
                rate, 1, str(atom), a.confirm, a.execute)
    print(f"   -> {out}")
    print(f"   then, free: crop_singles.py --config <cfg> --run-dir {run}")
    if not go:
        return
    if out.exists():
        print(f"   {out.name} is already on disk; not paying for it twice")
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [*provider_commands.command("image"),
           "--model", eng.split("/")[-1].split("@")[0],
           "--image-size", size,
           "--quality", eng.split("@")[-1] if "@" in eng else "high",
           "--prompt", prompt, "--output", str(out)]

    # Hold the CAST across a re-roll. This engine takes no seed, so every
    # regeneration returns different people wearing the same description: a
    # host changed face and shirt between two takes that differed only in
    # how far apart the pair were sitting. A reference image is the only
    # channel there is. Point `characters.plate_ref` at the plate whose cast
    # was approved, and re-roll the ROOM against it.
    for rel in (cfg["characters"].get("plate_ref") or []):
        rp = pathlib.Path(rel)
        if not rp.is_absolute():
            rp = run / rel
        if not rp.exists():
            sys.exit(f"[err] characters.plate_ref names {rp} and it is not "
                     f"there. A reference that does not resolve silently "
                     f"becomes a re-roll of the cast.")
        cmd += ["--ref-image", str(rp)]
        print(f"   cast held against {rp}")
    subprocess.run(cmd, check=True)
    print()
    print("  LOOK AT THE PLATE BEFORE SPENDING AGAIN. Two distinct people? "
          "Mouths closed? Room lit? Nothing with printed lettering on a shelf? "
          "A bad plate is inherited by every single cropped out of it.")


def step_stills(cfg, run, beats, a):
    """Generate a still PER HOST. Opt-in, because it is how the set drifts.

    Kept for the expression variants, which are edit-anchored on a base and so
    cannot drift, and for a brand that genuinely wants separately generated
    characters. For the hosts themselves use step_plate: one still per host
    put the two hosts in two different rooms on the first real render.
    """
    if not cfg["characters"].get("allow_per_host_stills"):
        sys.exit("[err] a still PER HOST puts the two hosts in two different "
                 "rooms: a set description binds a room only within one call. "
                 "Use `gen_paid.py plate` then crop_singles.py. To override, "
                 "set characters.allow_per_host_stills true.")
    ch = cfg["characters"]
    n = len(ch["bases"]) + len(ch["expression_variants"])
    eng = cfg["engines"]["stills"]
    rate = cost_model.IMAGE_ENGINES[eng]["usd_per_image"]
    atom = provider_commands.resolve("image")[0]
    size = cfg["engines"].get("stills_image_size", "1088x1920")
    model = eng.split("/")[-1].split("@")[0]
    quality = eng.split("@")[-1] if "@" in eng else "high"
    out = run / "stills"

    prompts = {b["file"]: base_prompt(cfg, b["who"]) for b in ch["bases"]}
    seen = {}
    for f, pr in prompts.items():
        if pr in seen:
            sys.exit(f"[err] {f} and {seen[pr]} have a byte-identical prompt. "
                     f"They will come back as two strangers in two rooms. "
                     f"Give each host its own 'appearance'.")
        seen[pr] = f

    go = banner("base stills + expression variants", eng, f"{n} images", n * rate,
                n, str(atom), a.confirm, a.execute)
    print("   order: every base first, then that base's variants, "
          "SEQUENTIALLY (burst-credit reserve)")

    gen = provider_commands.command("image")
    calls = []
    for b in ch["bases"]:
        calls.append((b["file"], [*gen,
                                  "--model", model, "--image-size", size,
                                  "--quality", quality,
                                  "--prompt", prompts[b["file"]],
                                  "--output", str(out / b["file"])]))
    for v in ch["expression_variants"]:
        base = next(b["file"] for b in ch["bases"] if b["who"] == v["who"])
        pr = ch["variant_template"].format(change=v["change"])
        calls.append((v["out_name"], [*gen,
                                      "--model", model, "--image-size", size,
                                      "--quality", quality,
                                      "--ref-image", str(out / base),
                                      "--prompt", pr,
                                      "--output", str(out / v["out_name"])]))

    for name, cmd in calls:
        print(f"    {name:<26} {' '.join(cmd[:6])} ...")
        if go:
            out.mkdir(parents=True, exist_ok=True)
            subprocess.run(cmd, check=True)


def step_idle(cfg, run, beats, a):
    """One clip per host of that host NOT speaking, for the split's lower panel.

    The split used to fill its lower panel by sampling the listener's OWN
    speaking footage, which puts two people on screen talking at once with
    only one of them audible. Nobody reads that as a podcast.

    The fix is the same lipsync call driven by SILENCE: the mouth stays shut
    and the engine still gives the head and eyes their own motion, so the
    listener is present and listening rather than frozen. One clip per host
    is enough because the panel loops it.
    """
    eng = cfg["engines"]["lipsync"]
    if not eng.startswith("veed-fabric-1.0@"):
        sys.exit("[err] this runner supports Veed Fabric lip-sync only; "
                 "other engines need an implemented adapter before any spend.")
    e = cost_model.ENGINES[eng]
    secs = float((cfg.get("edit", {}).get("split_screen", {})
                  ).get("idle_sec", 6.0))
    atom = provider_commands.resolve("lipsync")[0]
    clips = run / "clips"
    pool = {}
    for b in beats:
        pool.setdefault(b["who"], b["still"])
    todo = [(w, s) for w, s in sorted(pool.items())
            if not (clips / f"idle-{w}.mp4").exists()]
    go = banner("idle listener clips", eng,
                f"{len(todo)} clip(s) / {secs:.1f}s each, looped under every "
                f"split cut", len(todo) * secs * e["usd_per_sec"], len(todo),
                str(atom), a.confirm, a.execute)
    for w, s in todo:
        print(f"    host {w}  still={s}  {secs:.1f}s of silence")
    if not go:
        return
    res = eng.split("@")[-1] if "@" in eng else "480p"
    clips.mkdir(parents=True, exist_ok=True)
    sil = run / "voiceovers" / f"silence-{secs:.0f}s.mp3"
    sil.parent.mkdir(parents=True, exist_ok=True)
    if not sil.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                        f"anullsrc=r=44100:cl=mono", "-t", f"{secs}",
                        str(sil)], check=True)
    for w, s in todo:
        still = run / "stills" / s
        if not still.exists():
            sys.exit(f"[err] host {w} wants {still} and it is not there")
        cmd = [*provider_commands.command("lipsync"),
               "--image", str(still), "--audio", str(sil),
               "--resolution", res,
               "--output", str(clips / f"idle-{w}.mp4")]
        print("   ", " ".join(cmd[:6]), "...")
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError:
            print(f"    host {w} failed; one retry")
            subprocess.run(cmd, check=True)

def report_read_rate(cfg, run: pathlib.Path, beats) -> float | None:
    """Words per second, measured off the voiceover that now exists.

    WHY HERE AND NOT ONLY IN THE GRADER
    Nothing in this pipeline looked at delivery rate, so three episodes shipped
    at 3.43 to 3.50 words per second and a reviewer called them aggressive. The
    grader would catch it too, but only after the lipsync: about $4 to discover
    what costs $0.14 to fix here, because the fix is `settings.speed` plus a
    regenerated voiceover.

    WHERE THE BAND COMES FROM, HONESTLY
    NOT from the nine reference clips: they have no transcripts and nobody has
    measured their word rate. It comes from accept/reject decisions on this
    format. 3.43-3.50 was rejected as aggressive. 2.71-3.03 was rejected as
    slow. 3.19-3.29 was accepted. So the band is what one person accepted after
    rejecting both sides of it, which is worth more than a figure lifted from a
    narration note and less than a measurement of real podcasts. It is a prompt
    to listen, not a law.

    It prints and returns. It does not fail: the right rate differs by format,
    and a threshold people disagree with is a threshold they switch off.
    """
    man = run / "voiceovers" / "manifest.json"
    if not man.exists():
        return None
    durs = json.loads(man.read_text(encoding="utf-8"))
    total = sum(float(v) for v in durs.values())
    words = sum(len(b["text"].split()) for b in beats)
    if total <= 0:
        return None
    wps = words / total
    lo, hi = 3.00, 3.40
    print()
    print(f"  READ RATE  {words} words over {total:.2f}s = {wps:.2f} words/sec")
    # Scale the host's REAL current speed, not an assumed one. The first
    # version hardcoded 0.92 because that is what one brand happened to use,
    # so its advice was wrong for every brand that did not.
    speeds = [float((h.get("settings") or {}).get("speed", 1.0))
              for h in cfg.get("hosts", {}).values() if isinstance(h, dict)]
    cur = sum(speeds) / len(speeds) if speeds else 1.0
    if wps > hi:
        sug = max(0.80, round(cur * hi / wps, 2))
        print(f"  ABOVE the {lo} to {hi} accepted on this format, which was")
        print(f"  rejected at 3.43-3.50 as aggressive. LOWER")
        print(f"  hosts.<X>.settings.speed (try {sug}) and re-run this step.")
    elif wps < lo:
        sug = min(1.00, round(cur * lo / wps, 2))
        print(f"  BELOW the {lo} to {hi} accepted on this format, which was")
        print(f"  rejected at 2.71-3.03 as slow. RAISE")
        print(f"  hosts.<X>.settings.speed (try {sug}) and re-run this step.")
    else:
        print(f"  inside the {lo} to {hi} accepted on this format.")
    if speeds and len(set(speeds)) > 1:
        print(f"  (hosts are on different speeds: {sorted(set(speeds))})")
    print("  Fixing it here costs $0.14. Finding it in the render costs ~$4.")
    print()
    return wps


def step_clips(cfg, run, beats, a):
    if json.loads((run / "beats.json").read_text(encoding="utf-8"))["estimated"]:
        print("[warn] beats.json is ESTIMATED. Run the voiceover step first, "
              "then plan_beats.py again, or you will pay to lipsync the wrong "
              "durations.")
    eng = cfg["engines"]["lipsync"]
    if not eng.startswith("veed-fabric-1.0@"):
        sys.exit("[err] this runner supports Veed Fabric lip-sync only; "
                 "other engines need an implemented adapter before any spend.")
    e = cost_model.ENGINES[eng]
    if not e["audio_driven"]:
        sys.exit(f"[err] engines.lipsync = {eng} is not audio-driven; it cannot "
                 f"move the mouth to our ElevenLabs read")
    secs = sum(b["dur_sec"] for b in beats)
    atom = provider_commands.resolve("lipsync")[0]
    only = set(int(x) for x in a.only.split(",")) if a.only else None
    todo = [b for b in beats
            if (only is None or b["n"] in only)
            and not (run / "clips" / f"beat-{b['n']:02d}.mp4").exists()]
    secs = sum(b["dur_sec"] for b in todo)
    # Last chance to hear it before the expensive part: the rate
    # is cheap to change now and about $4 to change after.
    report_read_rate(cfg, run, beats)
    go = banner("lipsync clips (largest spend)", eng,
                f"{len(todo)} clips / {secs:.1f}s "
                f"(already on disk are skipped)",
                secs * e["usd_per_sec"], len(todo), str(atom),
                a.confirm, a.execute)
    for b in todo:
        print(f"    beat {b['n']:02d}  still={b['still']:<26} "
              f"audio=voiceovers/beat-{b['n']:02d}.mp3  {b['dur_sec']:.2f}s")
    if go:
        res = eng.split("@")[-1] if "@" in eng else "480p"
        clips = run / "clips"
        clips.mkdir(parents=True, exist_ok=True)
        for b in todo:
            still = run / "stills" / b["still"]
            if not still.exists():
                sys.exit(f"[err] beat {b['n']:02d} wants {still} and it is not "
                         f"there. Run the stills step, or point this beat at a "
                         f"still that exists. Refusing to pay for a missing "
                         f"frame.")
            cmd = [*provider_commands.command("lipsync"),
                   "--image", str(still),
                   "--audio", str(run / "voiceovers" / f"beat-{b['n']:02d}.mp3"),
                   "--resolution", res,
                   "--output", str(clips / f"beat-{b['n']:02d}.mp4")]
            print(f"    -> beat {b['n']:02d}")
            # One retry. A transient fal failure on beat 2 of 15 used to abort
            # the batch and strand the thirteen unspent beats behind a step
            # that has to be re-run; the same call succeeded unchanged on the
            # next attempt. A failed submit is not billed, so the retry is free.
            for attempt in (1, 2):
                r = subprocess.run(cmd)
                if r.returncode == 0:
                    break
                if attempt == 2:
                    sys.exit(f"[err] beat {b['n']:02d} failed twice; stopping "
                             f"with {len(todo)} planned and the rest unspent. "
                             f"Re-run this step: clips already on disk are "
                             f"skipped, so nothing is paid for twice.")
                print(f"    .. beat {b['n']:02d} failed, retrying once")


def step_inserts(cfg, run, beats, a):
    ins = cfg["edit"].get("inserts", {})
    if not ins.get("enabled"):
        print("[inserts] edit.inserts.enabled is false. Nothing to do, $0.")
        return
    sys.exit("[err] motion inserts are not implemented by this runner. "
             "Keep edit.inserts.enabled false; refusing to report an unrendered step as done.")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("step", choices=["plate", "vo", "stills", "idle", "clips", "inserts"])
    ap.add_argument("--config", required=True)
    config_io.add_arg(ap)
    ap.add_argument("--run-dir", required=True)
    ap.add_argument("--only", default=None, help="comma-separated beat numbers")
    ap.add_argument("--confirm", action="store_true")
    ap.add_argument("--execute", action="store_true")
    a = ap.parse_args()
    if a.execute and not a.confirm:
        sys.exit("[err] --execute requires --confirm")
    cfg, run, beats = load(a)
    {"vo": step_vo, "plate": step_plate, "stills": step_stills,
     "idle": step_idle, "clips": step_clips,
     "inserts": step_inserts}[a.step](cfg, run, beats, a)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
