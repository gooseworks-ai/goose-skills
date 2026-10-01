#!/usr/bin/env python3
"""Falsify EVERY check in check-cut.py. Free, no network, no generation.

    python falsify-all.py                      # the whole table
    python falsify-all.py --only A,D,R         # one or several
    python falsify-all.py --keep <dir>         # keep the planted files for inspection

WHY THIS FILE EXISTS

`check-cut.py --falsify` proves two of its ten checks can fail. The other eight had never been
falsified, and this format's history is unambiguous about what that means: check D searched the
prompt for "Shot N:" labels the format has never written, found zero shots on every take ever
gated, and reported a warning instead of a result; `check_realism()` was defined, documented in
SKILL.md as "the first check in this gate that measures the render", named in build.py's
docstring, and never called from main() at all. Both passed vacuously on every input for their
whole life. A check that cannot fail is not a check, and the only way to know which ones can is
to plant the fault and watch.

For each check this builds an input that MUST fail it, runs the gate on that input as a
subprocess, and reports whether the gate named that check in its failures. It does NOT care
whether other checks also failed on the planted file -- a planted drone changes the loudness
too -- only whether the check under test caught its own fault.

Everything is built from files already on disk with ffmpeg. Nothing is generated.
"""
import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import brandkit
import build_looks
import format_spec
import paths

HERE = paths.HERE
GATE = HERE / "check-cut.py"


def sh(cmd, **k):
    return subprocess.run([str(x) for x in cmd], capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **k)


def ff(*args):
    r = sh(["ffmpeg", "-v", "error", "-y", *args])
    if r.returncode:
        raise RuntimeError("ffmpeg failed: " + (r.stderr or "")[-400:])


def gate_episode(side, extra=()):
    """Run the gate on an episode sidecar and return (exit code, output, failed letters)."""
    r = sh([sys.executable, GATE, "--episode", side, *extra])
    out = (r.stdout or "") + (r.stderr or "")
    letters = set()
    for ln in out.splitlines():
        t = ln.strip()
        if t.startswith("- ") and len(t) > 3 and t[2].isupper() and t[3] == " ":
            letters.add(t[2])
        elif t[:2] in ("A ", "C ", "G ", "H ") and "could not" in t:
            letters.add(t[0])
    return r.returncode, out, letters


def episode_base(side_path, td):
    """A WRITEABLE copy of an episode: the sidecar, and every take plus its manifest, inside td.

    Copied rather than doctored in place for the obvious reason -- these plants delete manifests
    and rewrite payloads, and the originals are the paid artifacts.
    """
    side = json.loads(Path(side_path).read_text(encoding="utf-8"))
    td = Path(td)
    for t in side["takes"]:
        src = Path(t["take"])
        dst = td / src.name
        shutil.copy(src, dst)
        shutil.copy(src.with_suffix(".json"), dst.with_suffix(".json"))
        t["take"] = str(dst)
        t["manifest"] = str(dst.with_suffix(".json"))
    return side


def write_side(side, td, name="side.json"):
    p = Path(td) / name
    p.write_text(json.dumps(side, indent=1), encoding="utf-8")
    return p


# -- the episode plants -----------------------------------------------------------------------
# WHY THESE EXIST. check-cut.py's provenance check C was generalised on 2026-09-30 from "exactly
# one manifest" to "N manifests, all present, one model, one location clause". A generalised
# check is one edit away from a weakened one, and this format has shipped two checks that could
# not fail on any input (check D's "Shot N:" labels, and check_realism() never being called). So
# every property C is supposed to have kept is planted here and watched.
EPISODE_PLANTS = {
    "EP-C-manifest": ("provenance", "one take's generation manifest deleted", "C"),
    "EP-C-location": ("provenance", "one take's payload moved to a different street", "C"),
    "EP-C-model":    ("provenance", "one take's manifest names a different model", "C"),
    "EP-C-length":   ("provenance", "render doubled: longer than the takes plus an end card", "C"),
    "EP-D-clause":   ("prompt lint", 'a paid-for clause deleted from the SECOND take', "D"),
    "EP-D-grammar":  ("prompt lint", "a guard clause deleted from a take that recorded guards",
                      "D"),
    "EP-E-caption":  ("caption/cut", "a caption extended across the cut after it", "E"),
    "EP-I-line":     ("speech", "a scripted line silenced in the MIDDLE take only", "I"),
}


def episode_plant(name, td, side_path, render, control):
    """Returns (sidecar path, extra args) for the gate."""
    td = Path(td)
    side = episode_base(side_path, td)

    if name == "EP-C-manifest":
        Path(side["takes"][1]["manifest"]).unlink()
        return write_side(side, td), ()

    if name == "EP-C-location":
        m = Path(side["takes"][2]["manifest"])
        d = json.loads(m.read_text(encoding="utf-8"))
        old = format_spec.location_clause(d["prompt"])
        d["prompt"] = d["prompt"].replace(old, "a narrow cobbled lane behind a market hall")
        m.write_text(json.dumps(d, indent=1), encoding="utf-8")
        return write_side(side, td), ()

    if name == "EP-C-model":
        m = Path(side["takes"][0]["manifest"])
        d = json.loads(m.read_text(encoding="utf-8"))
        d["model"] = "minimax/hailuo-03/image-to-video"
        m.write_text(json.dumps(d, indent=1), encoding="utf-8")
        return write_side(side, td), ()

    if name == "EP-C-length":
        bad = td / "long.mp4"
        lst = td / "l.txt"
        lst.write_text(f"file '{Path(render).as_posix()}'\nfile '{Path(render).as_posix()}'",
                       encoding="utf-8")
        ff("-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-crf", "24",
           "-pix_fmt", "yuv420p", "-c:a", "aac", str(bad))
        side["render"] = str(bad)
        return write_side(side, td), ()

    if name == "EP-D-clause":
        # the SECOND take, on purpose: D used to read only the first manifest, so a defect in
        # take 2 or 3 of an episode would have been invisible.
        m = Path(side["takes"][1]["manifest"])
        d = json.loads(m.read_text(encoding="utf-8"))
        d["prompt"] = d["prompt"].replace("This corner is never empty. ", "")
        m.write_text(json.dumps(d, indent=1), encoding="utf-8")
        return write_side(side, td), ()

    if name == "EP-D-grammar":
        # A GUARD clause, from a payload whose manifest records guard_grammar. This is the plant
        # that proves the lint is run with the flags the payload recorded: with guards=False it
        # would not be looked for at all, which is exactly how PACE_BLOCK went missing for four
        # seeds without the lint noticing.
        m = Path(side["takes"][0]["manifest"])
        d = json.loads(m.read_text(encoding="utf-8"))
        assert d.get("guard_grammar"), "this plant needs a take built with --guards"
        needle = next(iter(format_spec.GUARD_CLAUSES))
        d["prompt"] = d["prompt"].replace(needle, "")
        m.write_text(json.dumps(d, indent=1), encoding="utf-8")
        return write_side(side, td), ()

    if name == "EP-E-caption":
        cuts = side["cuts"]
        for row in side["captions"]:
            nxt = next((c for c in cuts if c > row[1]), None)
            if nxt is not None:
                row[1] = nxt + 0.4
                break
        else:
            raise RuntimeError("no caption with a cut after it")
        return write_side(side, td), ()

    if name == "EP-I-line":
        # Silence, not attenuation. Whisper NORMALISES its input, so making the file quiet does
        # not hide a line from it -- that was the first version of the single-take I plant and it
        # reported I as a dead check when I was fine (SKILL.md Critical knowledge 18).
        bad = td / "mute.mp4"
        mid = side["takes"][1]
        off = sum(e - s for t in side["takes"][:1] for s, e in t["plan"])
        a, b = off + 0.2, off + sum(e - s for s, e in mid["plan"]) - 0.2
        ff("-i", str(render), "-c:v", "copy",
           "-af", f"volume=enable='between(t,{a:.2f},{b:.2f})':volume=0",
           "-c:a", "aac", "-b:a", "160k", str(bad))
        side["render"] = str(bad)
        return write_side(side, td), ()

    raise RuntimeError(f"no episode plant {name!r}")


def gate(render, control, take, extra=()):
    """Run the gate and return (exit code, output, the set of check letters that FAILED)."""
    r = sh([sys.executable, GATE, "--render", render, "--control", control, "--take", take,
            *extra])
    out = (r.stdout or "") + (r.stderr or "")
    letters = set()
    for ln in out.splitlines():
        s = ln.strip()
        if s.startswith("- ") and len(s) > 3 and s[2].isupper() and s[3] == " ":
            letters.add(s[2])
        # a sys.exit() failure prints the message with no "- " bullet
        elif s[:2] in ("A ", "C ", "G ", "H ") and "could not" in s:
            letters.add(s[0])
    return r.returncode, out, letters


# -- the planted inputs ---------------------------------------------------------------------
# Each builder returns (render, control, take, extra_args) for the gate, all inside `td`.
def plant(check, td, base):
    R, C, T = base["render"], base["control"], base["take"]
    td = Path(td)

    if check == "A":
        # wrong frame size and wrong frame rate
        bad = td / "a.mp4"
        ff("-i", str(R), "-vf", "scale=720:1280,fps=24", "-c:v", "libx264", "-crf", "20",
           "-pix_fmt", "yuv420p", "-c:a", "copy", str(bad))
        return bad, C, T, ()

    if check == "B":
        # a "take" longer than the 15s single-call cap: it cannot be one generation
        bad = td / "b-take.mp4"
        ff("-stream_loop", "2", "-i", str(T), "-t", "20", "-c:v", "libx264", "-crf", "22",
           "-pix_fmt", "yuv420p", "-c:a", "aac", str(bad))
        shutil.copy(T.with_suffix(".json"), bad.with_suffix(".json"))
        return R, C, bad, ()

    if check == "C":
        # a render longer than its take by more than one end card: footage from a second source
        bad = td / "c.mp4"
        lst = td / "c.txt"
        lst.write_text(f"file '{R.as_posix()}'\nfile '{R.as_posix()}'", encoding="utf-8")
        ff("-f", "concat", "-safe", "0", "-i", str(lst), "-c:v", "libx264", "-crf", "22",
           "-pix_fmt", "yuv420p", "-c:a", "aac", str(bad))
        return bad, C, T, ()

    if check == "C2":
        # no generation manifest beside the take at all
        bad = td / "c2-take.mp4"
        shutil.copy(T, bad)
        return R, C, bad, ()

    if check == "D":
        # a manifest whose prompt has lost a clause that was paid for
        bad = td / "d-take.mp4"
        shutil.copy(T, bad)
        man = json.loads(T.with_suffix(".json").read_text(encoding="utf-8"))
        man["prompt"] = man["prompt"].replace("This corner is never empty. ", "")
        bad.with_suffix(".json").write_text(json.dumps(man, indent=1), encoding="utf-8")
        return R, C, bad, ()

    if check == "E":
        # a caption schedule whose second line runs past the cut it belongs to
        cfg = json.loads(Path(build_looks.CFG["_path"]).read_text(encoding="utf-8"))
        caps = cfg["brand_layer"]["captions"]
        moved = None
        for row in caps:
            if row[3] != "title":
                row[1] = max(c for c in cfg["brand_layer"]["cuts"]) + 0.5
                moved = row[2]
                break
        if moved is None:
            raise RuntimeError("no non-title caption to extend")
        p = td / "e-brand.json"
        p.write_text(json.dumps(cfg, indent=1), encoding="utf-8")
        return R, C, T, ("--brand", str(p))

    if check == "F":
        # a burned-in graphic below the safe zone
        bad = td / "f.mp4"
        ff("-i", str(C), "-vf", "drawbox=x=300:y=1700:w=480:h=92:color=white@1.0:t=fill",
           "-c:v", "libx264", "-b:v", "3400k", "-maxrate", "3800k", "-bufsize", "6800k",
           "-pix_fmt", "yuv420p", "-c:a", "copy", str(bad))
        return bad, C, T, ()

    if check == "G":
        # An audible drone under the take: the assembled cut's -13 dB floor, reproduced.
        # a=0.5, not 0.25. MEASURED: 0.25 lifted the per-shot floor to -29.5 dB, just INSIDE
        # the -28 dB ceiling, so the first version of this plant reported G as a dead check when
        # G was fine and the plant was too quiet. Falsify the falsifier.
        bad = td / "g-take.mp4"
        ff("-i", str(T), "-f", "lavfi", "-i", "anoisesrc=c=pink:a=0.5:r=48000",
           "-filter_complex", "[1:a]aformat=channel_layouts=stereo[n];"
                              "[0:a][n]amix=inputs=2:duration=first:normalize=0[a]",
           "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
           str(bad))
        shutil.copy(T.with_suffix(".json"), bad.with_suffix(".json"))
        return R, C, bad, ()

    if check == "H":
        # 6 dB hot: the step a set of videos watched back to back must not have
        bad = td / "h.mp4"
        ff("-i", str(R), "-c:v", "copy", "-af", "volume=6dB", "-c:a", "aac", "-b:a", "160k",
           str(bad))
        return bad, C, T, ()

    if check == "I":
        # ONE scripted line silenced, the rest left alone. The window is read off the brand's
        # own caption schedule, so this plant follows the take rather than carrying a timestamp.
        #
        # NOT "volume=-40dB" over the whole file, which was the first version of this plant and
        # reported I as a dead check: Whisper normalises its input, so a uniformly quiet file
        # transcribes perfectly. It only tripped H, on loudness. Attenuation does not hide
        # speech from Whisper; removing it does.
        spoken = [r for r in build_looks.LINES if r[3] != "title"]
        if not spoken:
            raise RuntimeError("no spoken caption row to silence")
        s, e = spoken[0][0], spoken[0][1]
        bad = td / "i.mp4"
        ff("-i", str(R), "-c:v", "copy",
           "-af", f"volume=enable='between(t,{s - 0.4:.2f},{e + 0.4:.2f})':volume=0",
           "-c:a", "aac", "-b:a", "160k", str(bad))
        return bad, C, T, ()

    if check == "R":
        # over-sharpened: the single biggest thing that reads as rendered
        bad = td / "r.mp4"
        ff("-i", str(R), "-vf", "unsharp=5:5:2.5:5:5:0.0", "-c:v", "libx264", "-crf", "16",
           "-pix_fmt", "yuv420p", "-c:a", "copy", str(bad))
        return bad, C, T, ()

    raise RuntimeError(f"no planted input for check {check!r}")


PLANTS = {
    "A": ("format", "render rescaled to 720x1280 and 24fps"),
    "B": ("length", "a 20s take, over the 15s single-call cap"),
    "C": ("provenance", "render doubled: 2x the take, more than one end card of slack"),
    "C2": ("provenance", "no generation manifest beside the take"),
    "D": ("prompt lint", 'the clause "This corner is never empty." deleted from the payload'),
    "E": ("caption/cut", "a non-title caption extended past the last cut"),
    "F": ("safe zone", "a white box burned in at y=1700..1792"),
    "G": ("ambience floor", "pink noise mixed under the take at 0.5 amplitude"),
    "H": ("loudness", "render pushed 6 dB hot"),
    "I": ("speech", "one scripted line silenced, the rest left audible"),
    "R": ("realism proxy", "render over-sharpened (unsharp 2.5)"),
}


def main():
    ap = paths.add_run_arg(argparse.ArgumentParser())
    ap.add_argument("--brand", default=None)
    ap.add_argument("--look", default="subway")
    ap.add_argument("--episode", default=None,
                    help="also falsify the MULTI-TAKE provenance rules against this "
                         "<output>.episode.json sidecar. Every property check C kept when it was "
                         "generalised from one manifest to N gets its own planted fault.")
    ap.add_argument("--only", default=None, help="comma-separated check letters")
    ap.add_argument("--keep", default=None, help="keep the planted files in this directory")
    A = ap.parse_args()

    L = build_looks.resolve(A.run, A.brand)
    cfg = build_looks.CFG
    base = {"render": L["looks"] / f"street-{cfg['slug']}-{A.look}.mp4",
            "control": build_looks.control_path(A.look),
            "take": build_looks.SRC}
    for k, p in base.items():
        if not Path(p).exists():
            sys.exit(f"no {k} at {p}. Run build_looks.py first (free).")
    print(f"baseline render   {base['render']}")
    print(f"baseline control  {base['control']}")
    print(f"baseline take     {base['take']}\n")

    want = [w.strip().upper() for w in A.only.split(",")] if A.only else list(PLANTS)
    rows = []
    keep = Path(A.keep) if A.keep else None
    if keep:
        keep.mkdir(parents=True, exist_ok=True)
    for check in want:
        name, how = PLANTS[check]
        letter = check[0]
        print(f"[{check}] {name}: {how}", flush=True)
        td = keep / check if keep else None
        if td:
            td.mkdir(parents=True, exist_ok=True)
            ctx = None
        else:
            ctx = tempfile.TemporaryDirectory()
            td = Path(ctx.name)
        try:
            r, c, t, extra = plant(check, td, base)
            code, out, letters = gate(r, c, t, extra)
            caught = letter in letters
            print(f"     gate exit {code}, checks that failed: "
                  f"{','.join(sorted(letters)) or '(none)'}  -> "
                  f"{'CAUGHT' if caught else 'MISSED'}")
            if not caught:
                print("     " + "\n     ".join(out.strip().splitlines()[-12:]))
            rows.append((check, name, how, code, sorted(letters), caught))
        finally:
            if ctx:
                ctx.cleanup()

    print("\n" + "=" * 100)
    print(f"{'check':<15}{'what':<17}{'exit':>5}  {'caught?':<9}{'also failed'}")
    print("-" * 100)
    for check, name, how, code, letters, caught in rows:
        owner = EPISODE_PLANTS[check][2] if check in EPISODE_PLANTS else check[0]
        others = ",".join(x for x in letters if x != owner) or "-"
        print(f"{check:<15}{name:<17}{code:>5}  {'YES' if caught else 'NO ':<9}{others}")
    if A.episode:
        print("\n" + "=" * 100)
        print("EPISODE PLANTS: the provenance rules check C kept when it stopped counting to one")
        print("=" * 100)
        side_path = Path(A.episode)
        side0 = json.loads(side_path.read_text(encoding="utf-8"))
        for name, (what, how, owner) in EPISODE_PLANTS.items():
            print(f"[{name}] {what}: {how}", flush=True)
            with tempfile.TemporaryDirectory() as etd:
                sp, extra = episode_plant(name, etd, side_path, side0["render"],
                                          side0["control"])
                code, out, letters = gate_episode(sp, extra)
            caught = owner in letters
            print(f"     gate exit {code}, checks that failed: "
                  f"{','.join(sorted(letters)) or '(none)'}  -> "
                  f"{'CAUGHT' if caught else 'MISSED'}")
            if not caught:
                print("     " + "\n     ".join(out.strip().splitlines()[-12:]))
            rows.append((name, what, how, code, sorted(letters), caught))

    missed = [r[0] for r in rows if not r[5]]
    print()
    if missed:
        print(f"FAIL: {len(missed)} check(s) did not catch their own planted fault: "
              f"{', '.join(missed)}. A check that cannot fail is not a check.")
        return 1
    print(f"ALL {len(rows)} planted faults were caught by the check that owns them.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
