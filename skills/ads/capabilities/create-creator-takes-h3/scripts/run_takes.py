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

A PROVIDER POLICY REJECTION IS FINAL FOR THOSE INPUTS (QA-14). If fal refuses a take
(likeness of a real person, content policy, partner validation, NSFW), the take is reported
(reason, request id, charge state), kept in manifest.json under "rejected", and the run exits
3 at the end: surface it to the user, do not retry. A LIKENESS rejection stops the run there,
because every take in a spec uses the same character still; any other rejection skips only
that take. Every take is submitted with an input digest over the CONTENT of its inputs
(prompt, settings, seed, and the sha256 of the character still, mannerism clip and t1 voice
source), so a re-run of an unchanged rejected take is refused before anything is sent, even
though the upload URLs are new each run. Only the matching take is refused; the other takes
still run. Change the still, the prompt or the seed (--reseed) and the take is a new request.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

from media_proxy import (POLICY_EXIT, FalPolicyRejection, download, fal_generate_video,
                         fal_upload, input_digest, refuse_if_rejected, rejected_request)

# Approximate USD per generated second, for the dry-run estimate only. The proxy bills the
# real amount. Measured on the reference builds; check the balance after the first take.
RATE = {"1080P": 0.16, "768P": 0.10, "480P": 0.05}


VOICE_CLIP = ["-vn", "-t", "12", "-ac", "1", "-ar", "24000"]  # t1's voice -> reference audio


def take_file(spec, t):
    return pathlib.Path(spec["out"]) / ("%s-seed%d.mp4" % (t["id"], t["seed"]))


def prompt_file(spec, t):
    return pathlib.Path(spec["out"]) / ("%s-prompt.txt" % t["id"])


def file_sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def take_payload(spec, t, prompt, img, vid, aud, first_id):
    """The exact H3 request for one take. Called with the uploaded URLs to submit, and with
    content stand-ins ({"sha256": ...}) to digest, so both always describe the same request."""
    payload = {"prompt": prompt, "duration": int(t["dur"]), "resolution": spec.get("resolution", "1080P"),
               "aspect_ratio": spec.get("aspect_ratio", "9:16"), "seed": int(t["seed"]),
               "prompt_expansion_mode": "disabled", "reference_image_urls": [img]}
    if vid:
        payload["reference_video_urls"] = [vid]
    if aud and t["id"] != first_id:
        payload["reference_audio_urls"] = [aud]
    return payload


def take_digests(spec, takes, first, voice_src):
    """{take id: input digest over the content of everything that take would send}. A take
    whose prompt or still is missing has no digest (it cannot be sent either)."""
    char = pathlib.Path(spec["char"])
    if not char.exists():
        return {}
    img = {"sha256": file_sha256(char)}
    mann = pathlib.Path(spec["mann"]) if spec.get("mann") else None
    vid = {"sha256": file_sha256(mann)} if mann and mann.exists() else None
    aud = ({"sha256": file_sha256(voice_src), "extract": VOICE_CLIP}
           if voice_src is not None and voice_src.exists() else None)
    out = {}
    for t in takes:
        pf = prompt_file(spec, t)
        if pf.exists():
            stable = take_payload(spec, t, pf.read_text(encoding="utf-8"), img, vid, aud, first["id"])
            out[t["id"]] = input_digest(spec["model"], stable)
    return out


KEEP = ("reason", "kind", "error_type", "request_id", "http_status", "charged", "charge_note",
        "rejected_at", "from_ledger", "matched", "ledger_key", "ledger_paths")


def report_rejection(t, e, man_p, manifest, not_sent=()):
    """Say why one take was refused and keep it in the manifest. The caller exits 3."""
    what = ("already rejected: nothing was sent for it" if e.from_ledger
            else "rejected by the provider")
    print("\n[%s] SURFACE, DO NOT RETRY: %s %s.\n"
          "  reason:     %s\n  type:       %s\n  request id: %s\n  charge:     %s"
          % (t["id"], e.model_path, what, e.reason, e.error_type or e.kind,
             e.request_id or "none returned", e.charge_note), file=sys.stderr)
    if e.ledger_paths:
        print("  record:     %s%s" % (e.ledger_paths[0], " (matched by %s)" % e.matched if e.matched else ""),
              file=sys.stderr)
    if not_sent:
        print("  not attempted: %s (every take uses this same character still, which the provider "
              "refused as a likeness)" % ", ".join(not_sent), file=sys.stderr)
    print("Tell the user. Offer a permitted original character, a user-cleared reference or a "
          "non-likeness route, with its cost, through the normal approval. Re-running this exact "
          "take is refused; change the still, the prompt or the seed (--reseed) to try again.",
          file=sys.stderr)
    manifest["rejected"] = [r for r in manifest.get("rejected", []) if r.get("id") != t["id"]] + [
        {"id": t["id"], "seed": t["seed"], **{k: v for k, v in e.as_dict().items() if k in KEEP}}]
    man_p.parent.mkdir(parents=True, exist_ok=True)
    man_p.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


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
    chained = [t for t in todo if t["id"] != first["id"]]
    src = take_file(spec, first)
    voice_src = src if chained and src.exists() else None
    digests = take_digests(spec, todo, first, voice_src)
    blocked = {tid: rec for tid, d in digests.items()
               for rec in [rejected_request(spec["model"], input_digest=d)] if rec}
    for t in todo:
        pf = prompt_file(spec, t)
        print("  %-3s seed %d  %2ds  covers %.2f-%.2f  prompt %s%s" % (t["id"], t["seed"], t["dur"],
              t["covers"][0], t["covers"][1], "%d chars" % len(pf.read_text()) if pf.exists() else "MISSING",
              "  REJECTED BEFORE: %s" % blocked[t["id"]].get("reason") if t["id"] in blocked else ""))
    print("  estimate ~$%.2f (%ds at ~$%.2f/s; the proxy bills the real amount)"
          % (est, sum(t["dur"] for t in todo), rate))
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

    man_p = pathlib.Path(spec["out"]) / "manifest.json"
    manifest = json.loads(man_p.read_text()) if man_p.exists() else {"model": spec["model"], "takes": []}
    # Refuse an unchanged rejected take BEFORE uploading or sending anything. Only that take:
    # the others are different requests and still run.
    refused = 0
    send = []
    for t in todo:
        try:
            refuse_if_rejected(spec["model"], input_digest=digests.get(t["id"]))
            send.append(t)
        except FalPolicyRejection as e:  # from the local ledger: no network call
            report_rejection(t, e, man_p, manifest)
            refused += 1
    if not send:
        sys.exit(POLICY_EXIT)

    img = fal_upload(spec["char"])
    vid = fal_upload(spec["mann"]) if spec.get("mann") else None
    aud = None
    if voice_src is not None:
        wav = pathlib.Path(spec["out"]) / ("_%s-voice.wav" % first["id"])
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(src), *VOICE_CLIP, str(wav)], check=True)
        aud = fal_upload(wav)
        print("[chain] %s's voice -> reference audio for %s" % (first["id"], ", ".join(t["id"] for t in chained)))
    for i, t in enumerate(send):
        prompt = prompt_file(spec, t).read_text(encoding="utf-8")
        payload = take_payload(spec, t, prompt, img, vid, aud, first["id"])
        print("\n[%s] submitting seed %d ..." % (t["id"], t["seed"]))
        try:
            # input_digest = the content digest: the ledger recognises this take on a re-run
            # (new upload URLs), and the proxy re-attaches to a job it already paid for.
            url = fal_generate_video(spec["model"], payload, timeout_s=1800, poll_s=5,
                                     input_digest=digests.get(t["id"]))
        except FalPolicyRejection as e:
            refused += 1
            if e.kind == "likeness":  # the still is the cause, and every take shares it
                report_rejection(t, e, man_p, manifest, [x["id"] for x in send[i + 1:]])
                break
            report_rejection(t, e, man_p, manifest)  # this take's own inputs: skip only it
            continue
        out = take_file(spec, t)
        download(url, out)
        print("  -> %s (%.1f MB)" % (out, out.stat().st_size / 1e6))
        manifest["takes"] = [m for m in manifest["takes"] if m["id"] != t["id"]] + [
            {**t, "file": str(out), "url": url, "input_digest": digests.get(t["id"]),
             "payload": {k: v for k, v in payload.items() if k != "prompt"}}]
        if manifest.get("rejected"):  # this take id now rendered from changed inputs
            manifest["rejected"] = [r for r in manifest["rejected"] if r.get("id") != t["id"]]
        man_p.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    if refused:
        print("\n[takes] %d take(s) refused on policy grounds (above). Surface to the user; do "
              "not retry them unchanged." % refused, file=sys.stderr)
        sys.exit(POLICY_EXIT)
    print("\n[takes] done. Watch every take end to end (eyeline, hands, voice) before joining.")


if __name__ == "__main__":
    main()
