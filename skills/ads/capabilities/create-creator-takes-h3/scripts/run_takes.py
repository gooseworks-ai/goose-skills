#!/usr/bin/env python3
"""Generate the planned creator takes with H3 Max, through the GooseWorks proxy (bills the
Ads agent). DRY RUN unless --go.

    run_takes.py --spec work/takes/takes.json                 # dry run: plan + estimate
    run_takes.py --spec work/takes/takes.json --only t1 --go  # FIRST take, alone
    run_takes.py --spec work/takes/takes.json --go            # the rest, voice chained to t1

THE VOICE IS CHAINED. Each H3 call invents its own voice, and native audio cannot be
repaired afterwards, so t1 runs alone and its own audio (first ~12s, mono) is passed to
every later take as `reference_audio_urls`. That is what makes several takes sound like one
recording. It is our own generated voice handed forward, not a real person cloned. If t1
does not exist yet, later takes are refused unless --unchained is given.

LISTEN TO t1 BEFORE THE REST. The voice is locked from it: a robotic or wrong-gender read
in t1 is copied into every other take. Show it to the user, re-roll with --reseed if
rejected (a new seed is a new voice and costs another take).

Seeds are pinned in takes.json; re-running an unchanged take with the same seed repays for
the same clip, so a take that already exists on disk is skipped. The finished files are
<out>/<id>-seed<seed>.mp4, and manifest.json records each payload.

`prompt_expansion_mode: disabled` keeps the dialogue verbatim; expansion rewrites lines.
"""
import argparse
import json
import pathlib
import subprocess

from media_proxy import download, fal_generate_video, fal_upload

# Approximate USD per generated second, for the dry-run estimate only. The proxy bills the
# real amount. Measured on the reference builds; check the balance after the first take.
RATE = {"1080P": 0.16, "768P": 0.10, "480P": 0.05}


def take_file(spec, t):
    return pathlib.Path(spec["out"]) / ("%s-seed%d.mp4" % (t["id"], t["seed"]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", required=True)
    ap.add_argument("--only", help="comma-separated take ids")
    ap.add_argument("--go", action="store_true", help="spend: generate the takes")
    ap.add_argument("--unchained", action="store_true", help="allow later takes without t1's voice")
    ap.add_argument("--reseed", help="comma-separated take ids to give a NEW seed (a re-roll)")
    a = ap.parse_args()
    sp = pathlib.Path(a.spec)
    spec = json.loads(sp.read_text(encoding="utf-8"))

    if a.reseed:
        for t in spec["takes"]:
            if t["id"] in a.reseed.split(","):
                t["seed"] = (t["seed"] * 7919 + 104729) % 900000 + 100000
                print("[reseed] %s -> seed %d" % (t["id"], t["seed"]))
        sp.write_text(json.dumps(spec, indent=2), encoding="utf-8")

    first = spec["takes"][0]
    want = [t for t in spec["takes"] if not a.only or t["id"] in a.only.split(",")]
    todo = [t for t in want if not take_file(spec, t).exists()]
    have = [t for t in want if take_file(spec, t).exists()]
    for t in have:
        print("  %s exists: %s (skipped)" % (t["id"], take_file(spec, t).name))
    if not todo:
        print("[takes] nothing to generate")
        return
    rate = RATE.get(spec.get("resolution", "1080P"), 0.16)
    est = sum(t["dur"] for t in todo) * rate
    print("[takes] %s  %s %s" % (spec["model"], spec.get("aspect_ratio"), spec.get("resolution")))
    for t in todo:
        pf = pathlib.Path(spec["out"]) / ("%s-prompt.txt" % t["id"])
        print("  %-3s seed %d  %2ds  covers %.2f-%.2f  prompt %s" % (t["id"], t["seed"], t["dur"],
              t["covers"][0], t["covers"][1], "%d chars" % len(pf.read_text()) if pf.exists() else "MISSING"))
    print("  estimate ~$%.2f (%ds at ~$%.2f/s; the proxy bills the real amount)"
          % (est, sum(t["dur"] for t in todo), rate))

    chained = [t for t in todo if t["id"] != first["id"]]
    src = take_file(spec, first)
    problem = None
    if chained and first in todo:
        problem = ("generate the first take alone (--only %s --go), listen to it, then the rest: "
                   "they copy its voice" % first["id"])
    elif chained and not src.exists() and not a.unchained:
        problem = ("%s has not been generated, so the later takes cannot carry its voice. "
                   "Run --only %s first, or pass --unchained." % (first["id"], first["id"]))
    if not a.go:
        print("\nDRY RUN. Nothing was spent. Re-run with --go after the user approves the spend.")
        if problem:
            print("Next: " + problem)
        return
    if problem:
        raise SystemExit(problem)

    if spec.get("planning_only"):
        raise SystemExit("This is a planning-only spec. Generate and review the actual still, then rerun plan_takes without --plan-only before --go.")
    img = fal_upload(spec["char"])
    vid = fal_upload(spec["mann"]) if spec.get("mann") else None
    aud = None
    if chained and src.exists():
        wav = pathlib.Path(spec["out"]) / ("_%s-voice.wav" % first["id"])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-vn", "-t", "12", "-ac", "1",
                        "-ar", "24000", str(wav)], check=True)
        aud = fal_upload(wav)
        print("[chain] %s's voice -> reference audio for %s" % (first["id"], ", ".join(t["id"] for t in chained)))
    man_p = pathlib.Path(spec["out"]) / "manifest.json"
    manifest = json.loads(man_p.read_text()) if man_p.exists() else {"model": spec["model"], "takes": []}
    for t in todo:
        prompt = (pathlib.Path(spec["out"]) / ("%s-prompt.txt" % t["id"])).read_text(encoding="utf-8")
        payload = {"prompt": prompt, "duration": int(t["dur"]), "resolution": spec.get("resolution", "1080P"),
                   "aspect_ratio": spec.get("aspect_ratio", "9:16"), "seed": int(t["seed"]),
                   "prompt_expansion_mode": "disabled", "reference_image_urls": [img]}
        if vid:
            payload["reference_video_urls"] = [vid]
        if aud and t["id"] != first["id"]:
            payload["reference_audio_urls"] = [aud]
        print("\n[%s] submitting seed %d ..." % (t["id"], t["seed"]))
        url = fal_generate_video(spec["model"], payload, timeout_s=1800, poll_s=5)
        out = take_file(spec, t)
        download(url, out)
        print("  -> %s (%.1f MB)" % (out, out.stat().st_size / 1e6))
        manifest["takes"] = [m for m in manifest["takes"] if m["id"] != t["id"]] + [
            {**t, "file": str(out), "url": url,
             "payload": {k: v for k, v in payload.items() if k != "prompt"}}]
        man_p.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("\n[takes] done. Watch every take end to end (eyeline, hands, voice) before joining.")


if __name__ == "__main__":
    main()
