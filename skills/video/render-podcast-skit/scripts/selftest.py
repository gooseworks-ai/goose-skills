#!/usr/bin/env python3
"""Falsifiability harness. $0, no network, no generation.

A check that only ever passes is not a check. For every gate in `gates.py` this
script does both halves:

    1. runs it on the good fixture and requires ZERO failures, and
    2. runs it on a NAMED mutation of that fixture and requires the specific
       failure id to come back.

If a gate cannot be made to fail, this script fails, because the gate is a
comment pretending to be a test. Case 0 is the harness checking itself: a
deliberately broken "gate" that always returns [] must be reported as
unfalsifiable.

Usage: selftest.py [--keep] [--no-render]
Exit 0 = every gate passes clean AND bites on its mutation.
"""
from __future__ import annotations

import argparse
import copy
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import gates  # noqa: E402

CFG = HERE / "config.example.json"
SCR = HERE / "script.example.json"

results: list[tuple[str, str, str]] = []   # (case, status, detail)

# Every case this file is supposed to run, by its number. Checked at the end.
#
# WHY A DECLARED LIST. A case that never runs appends no result, so the total
# shrinks and the summary still reads as a clean pass: `59/59 gates are clean`
# and `65/65 gates are clean` are indistinguishable at a glance, and both exit
# 0. That is how the split-balance case hid -- it keyed off the fixture's own
# cut plan and returned early whenever there were fewer than four split cuts,
# testing nothing and reporting nothing. Counting against a declared list turns
# a missing case into a failure instead of a smaller number.
RENDER_CASES = {"28", "29", "30", "31", "41", "55"}
EXPECTED_CASES = {f"{i:02d}" for i in range(0, 66)} - {
    # numbers never issued; the sequence has gaps from gates that were merged
    # into others. Listed so a gap is a decision rather than a missing case.
    "48",
}


def check(case: str, gate, good_args: tuple, bad_args: tuple, expect: str):
    """Half one: clean on good. Half two: `expect` appears on bad."""
    clean = gate(*good_args)
    if clean:
        results.append((case, "FAIL", f"gate fired on the GOOD fixture: {clean}"))
        return
    bad = gate(*bad_args)
    hit = [b for b in bad if b.split(":")[0] == expect]
    if not hit:
        results.append((case, "FAIL",
                        f"mutation did NOT trip {expect!r}; got {bad or 'nothing'}"))
        return
    results.append((case, "ok", f"{expect} <- {hit[0].split(': ',1)[-1][:70]}"))


def mut(obj, fn):
    o = copy.deepcopy(obj)
    fn(o)
    return o


def run(*a):
    subprocess.run([sys.executable, str(HERE / a[0])] + [str(x) for x in a[1:]],
                   check=True, capture_output=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep", action="store_true")
    ap.add_argument("--no-render", action="store_true")
    a = ap.parse_args()

    tmp = pathlib.Path(tempfile.mkdtemp(prefix="skit-selftest-"))
    cfg = json.loads(CFG.read_text(encoding="utf-8"))
    scr = json.loads(SCR.read_text(encoding="utf-8"))

    # ---- build the good fixture through the real pipeline
    # The split's lower panel can carry a supplied product still (reference
    # technique 3). It is an operator-supplied file, so the fixture supplies one
    # rather than generating anything.
    prod = tmp / cfg["edit"]["split_screen"]["product_still"]
    prod.parent.mkdir(parents=True, exist_ok=True)
    # NOT a flat colour. A solid fill is what the Fernwick demo actually
    # shipped, and it rendered as a dead rectangle over a third of the frame
    # twice; gate_split_bottom_assets now rejects a flat image, so a flat
    # fixture would make this gate fire on good input. testsrc2 gives it
    # something with structure, which is what a real product still has.
    subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i",
                    f"testsrc2=s={cfg['width']}x{cfg['height']}:d=1",
                    "-frames:v", "1", str(prod)], check=True,
                   capture_output=True)

    # Same for the persistent corner lockup (reference technique 26): an
    # operator-supplied brand asset, never generated, so the fixture supplies
    # a stand-in rather than drawing brand type through a model.
    fb = cfg.get("edit", {}).get("frame_brand", {})
    if fb.get("enabled") and fb.get("lockup_file"):
        lk = tmp / fb["lockup_file"]
        lk.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i",
                        "color=c=0x7CF2B0:s=250x90:d=1", "-frames:v", "1",
                        str(lk)], check=True, capture_output=True)

    run("plan_beats.py", "--config", CFG, "--script", SCR, "--run-dir", tmp)
    run("plan_cuts.py", "--config", CFG, "--run-dir", tmp)
    run("build_overlays.py", "--config", CFG, "--run-dir", tmp)
    beats = json.loads((tmp / "beats.json").read_text(encoding="utf-8"))
    plan = json.loads((tmp / "cutplan.json").read_text(encoding="utf-8"))

    # ---- case 0: the harness must reject a gate that cannot fail
    always_pass = lambda *_: []
    check("00 harness rejects an unfalsifiable gate", always_pass,
          (None,), (None,), "anything")
    if results[0][1] == "FAIL":
        results[0] = ("00 harness rejects an unfalsifiable gate", "ok",
                      "a gate that never fires is reported as FAIL, as intended")
    else:
        results[0] = ("00 harness rejects an unfalsifiable gate", "FAIL",
                      "harness accepted a gate that never fires")

    # ------------------------------------------------------------ script gates
    def L(o, n, key, val):
        for ln in o["lines"]:
            if ln["n"] == n:
                ln[key] = val

    # The planted line has to be over whatever cap the CONFIG declares. It was
    # a hardcoded 11 words, which stopped tripping the moment the cap went from
    # 10 to 14 -- the gate was fine and the test had quietly stopped testing.
    _cap = int((cfg.get("script_limits") or {}).get("max_words_per_line", 10))
    _over = " ".join(["word"] * (_cap + 3))
    check("01 word cap", gates.gate_script, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "text", _over)), cfg),
          "script_line_word_cap")
    check("02 acronym", gates.gate_script, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "text", "Your API does the shopping.")), cfg),
          "script_no_acronyms")
    check("03 em dash", gates.gate_script, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "text", "You shop once " + chr(0x2014) + " that is it.")), cfg),
          "script_no_em_dash")
    check("04 digits in VO", gates.gate_script, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "text", "You shop once at 9pm.")), cfg),
          "script_numbers_as_words")
    # A label that is not one of the config's hosts, derived rather than
    # assumed: hosts are keyed A and B today but nothing fixes those names, and
    # a config whose second host was keyed "C" would have made this legal.
    _nothost = next(c for c in "CDEZ" if c not in cfg["hosts"])
    check("05 who is a host", gates.gate_script, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "who", _nothost)), cfg),
          "script_who_is_a_host")
    # Same derivation as case 01, for the same reason: the planted caption has
    # to be over whatever cue cap the CONFIG declares. Hardcoded at seven words
    # it would have stopped tripping the moment max_words_per_cue reached 7.
    _ccap = int((cfg.get("captions") or {}).get("max_words_per_cue", 5))
    check("06 caption word cap", gates.gate_captions_text, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "caption",
                                " ".join(["word"] * (_ccap + 2)))), cfg),
          "caption_word_cap")
    check("07 caption em dash", gates.gate_captions_text, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "caption", "shop " + chr(0x2014) + " once")), cfg),
          "caption_no_em_dash")

    # --------------------------------------------------- script DIRECTION gate
    # The recipe carries no narrative on purpose (cases 32 and 33 prove it) and
    # that left a hole: with no direction, a script author defaults to comedy
    # with a doubter, every run. scripts/arcs.json is the direction; this gate
    # is the refusal. Each of the three shapes the user named is planted here
    # and has to come back as a named failure, because a gate that cannot be
    # made to fail is a comment.
    # Both hosts must get the split. Speaker alternation and split alternation
    # phase-lock, and one brand shipped 7 of 7 splits on a single host while
    # the other sat in the lower panel for the entire episode.
    #
    # The plan is SYNTHETIC on purpose. Keying off the fixture's own cut plan
    # meant the case skipped itself whenever the fixture had fewer than four
    # split cuts, which is the same way the word-cap case quietly stopped
    # testing when its cap moved.
    _mk = lambda hosts: {"cuts": [
        {"beat": i + 1, "idx": 1, "mode": "split", "show": h, "speaker": h,
         "start": float(i), "end": i + 1.0}
        for i, h in enumerate(hosts)]}
    _splitcfg = mut(cfg, lambda o: o["edit"]["split_screen"]
                    .__setitem__("enabled", True))
    check("64 both hosts get the split", gates.gate_split_balance,
          (_mk(["A", "B", "A", "B", "A", "B"]), _splitcfg),
          (_mk(["A", "A", "A", "A", "A", "A"]), _splitcfg),
          "split_balance")
    check("65 a 5-to-1 split lean still fails", gates.gate_split_balance,
          (_mk(["A", "B", "A", "B", "A", "B"]), _splitcfg),
          (_mk(["A", "A", "A", "A", "A", "B"]), _splitcfg),
          "split_balance")

    check("42 direction: an arc must be declared, from the real eight",
          gates.gate_script_direction, (scr, cfg),
          (mut(scr, lambda o: o.pop("arc", None)), cfg),
          "script_arc_declared")
    check("43 direction: not comedy with a doubter",
          gates.gate_script_direction, (scr, cfg),
          (mut(scr, lambda o: (o.__setitem__("arc", "story_with_corroborators"),
                               L(o, 7, "text",
                                 "Honestly I did not believe it."),
                               L(o, 9, "text", "Fine. I am sold."))), cfg),
          "script_no_doubter_arc")
    check("44 direction: the opening line must not announce the format",
          gates.gate_script_direction, (scr, cfg),
          (mut(scr, lambda o: L(o, 1, "text", "So, we ad-reading today?")), cfg),
          "script_no_format_announcement")
    # The two defects a person caught in the first real render, both of which
    # passed every gate that existed at the time.
    ovl = json.loads((tmp / "overlays" / "captions.json")
                     .read_text(encoding="utf-8"))
    check("52 no two captions are on screen at once",
          gates.gate_captions_no_overlap, (ovl, cfg),
          (mut(ovl, lambda o: o["cues"][1].__setitem__(
              "w0", o["cues"][0]["w1"] - 0.3)), cfg),
          "captions_overlap")

    # Three config files drifted apart in 23 of 143 keys. One file now, with
    # variants as presets; this is what stops the second one reappearing.
    _cfgdir = tmp / "cfgdir"
    _cfgdir.mkdir(exist_ok=True)
    (_cfgdir / "config.example.json").write_text("{}", encoding="utf-8")
    _two = tmp / "cfgdir2"
    _two.mkdir(exist_ok=True)
    (_two / "config.example.json").write_text("{}", encoding="utf-8")
    (_two / "config.plain.json").write_text("{}", encoding="utf-8")
    check("53 scripts/ holds exactly one config",
          gates.gate_one_config, (_cfgdir,), (_two,), "one_config")

    check("54 the script is for the config's brand",
          gates.gate_script_matches_brand, (scr, cfg),
          (scr, mut(cfg, lambda o: o.__setitem__("brand_name", "Somebodyelse"))),
          "script_brand_match")

    check("51 the grade does not strip colour",
          gates.gate_grade_keeps_colour, (cfg,),
          (mut(cfg, lambda o: o["edit"]["grade"].__setitem__("chain",
                                                             "format=gray")),),
          "grade_colour")

    # Flip host A's voice to whatever it is NOT. Hardcoding "female" assumed
    # host A is a man in the example config; the day that config ships a woman
    # as A, the mutation is correct and the case stops being a mutation.
    _flip = {"male": "female", "female": "male"}[
        cfg["hosts"]["A"]["voice_gender"]]
    check("49 a host's voice matches the person in appearance",
          gates.gate_host_voice_gender, (cfg,),
          (mut(cfg, lambda o: o["hosts"]["A"].__setitem__("voice_gender",
                                                          _flip)),),
          "host_voice_gender")
    check("50 a narrator arc is written as one, not just declared",
          gates.gate_script_turn_structure, (scr,),
          (mut(scr, lambda o: o.__setitem__(
              "lines", [{"n": i + 1, "who": "A" if i % 2 == 0 else "B",
                         "text": "one two three four five six seven"}
                        for i in range(14)])),),
          "script_turn_structure")

    check("45 direction: no feature list",
          gates.gate_script_direction, (scr, cfg),
          (mut(scr, lambda o: L(o, 5, "text",
                                "Coaches, pilates, yoga, a timer, "
                                "a rep counter.")), cfg),
          "script_feature_list")

    def spec_run(o):
        """The other half of the feature list: three consecutive spec lines
        with nobody asking. wf-telly reads specs too; every one of them is an
        answer to a question somebody just asked."""
        L(o, 5, "text", "It tracks the week.")
        L(o, 6, "text", "It counts the meals.")
        L(o, 7, "text", "It builds the list.")
    check("46 direction: three spec lines with no question is a list",
          gates.gate_script_direction, (scr, cfg),
          (mut(scr, spec_run), cfg), "script_feature_list")

    # brand the FRAME, not the dialogue: the lockup must be on disk
    # Once a plate is approved it IS the cast: this engine has no seed, so a
    # replacement plate is a different set of people wearing the same words.
    _plate = tmp / "stills" / (cfg["characters"].get("plate_file") or "plate.png")
    _plate.parent.mkdir(parents=True, exist_ok=True)
    _plate.write_bytes(b"the approved plate")
    import hashlib as _h
    _locked = mut(cfg, lambda o: o["characters"].__setitem__(
        "plate_locked_sha256", _h.sha256(b"the approved plate").hexdigest()))
    check("60 a locked plate is still the locked plate",
          gates.gate_plate_locked, (_locked, tmp),
          (mut(_locked, lambda o: o["characters"].__setitem__(
              "plate_locked_sha256", "0" * 64)), tmp),
          "plate_locked")
    check("61 a locked plate is on disk at all",
          gates.gate_plate_locked, (_locked, tmp),
          (_locked, tmp / "no-such-run"), "plate_locked")
    check("47 frame-brand lockup asset exists", gates.gate_frame_brand_asset,
          (cfg, tmp), (cfg, tmp / "no-such-run"), "frame_brand_asset")

    # A held line continues the previous line's shot, so the host must match
    # and there must BE a previous line.
    _held = mut(scr, lambda o: o["lines"][1].__setitem__("hold", True))
    check("62 a hold follows the same host", gates.gate_script_hold, (_held,),
          (mut(scr, lambda o: [l.__setitem__("hold", True)
                               for l in o["lines"][1:2]
                               if l.__setitem__("who", "B") is None]),),
          "script_hold")
    check("63 a hold needs a line before it", gates.gate_script_hold, (_held,),
          (mut(scr, lambda o: o["lines"][0].__setitem__("hold", True)),),
          "script_hold")
    # -------------------------------------------------------------- cast gates
    hb = list(cfg["hosts"])[1]

    # The first gate, and the fatal one: everything after it indexes into
    # `hosts` without checking, so a note parked in there as a sibling of A
    # and B used to surface as AttributeError: 'str' has no attribute 'get'
    # from whichever gate reached it first, rather than as a failure.
    check("56 hosts block is walkable", gates.gate_config_shape, (cfg,),
          (mut(cfg, lambda o: o["hosts"].__setitem__(
              "_note", "a comment parked in the wrong place")),),
          "shape_hosts_are_hosts")
    check("57 hosts block exists", gates.gate_config_shape, (cfg,),
          (mut(cfg, lambda o: o.__setitem__("hosts", "A and B")),),
          "shape_hosts_block")

    # The voiceover is generated against whatever beats.json is on disk. Edit
    # the script afterwards in a way that changes the SPLIT and the plan
    # renumbers while the audio does not. Every count still matches, so only
    # the words themselves give it away.
    _vo = tmp / "voiceovers"
    _vo.mkdir(parents=True, exist_ok=True)
    for _b in beats["beats"]:
        (_vo / f"beat-{_b['n']:02d}.mp3").write_bytes(b"")
        (_vo / f"beat-{_b['n']:02d}.mp3.timestamps.json").write_text(
            json.dumps({"characters": list(_b["text"])}), encoding="utf-8")
    check("58 the audio says what the plan says",
          gates.gate_audio_matches_plan, (tmp, beats),
          (tmp, mut(beats, lambda o: o["beats"][2].__setitem__(
              "text", "a line nobody recorded"))),
          "audio_matches_plan")
    check("59 no mp3 past the end of the plan",
          gates.gate_audio_matches_plan, (tmp, beats),
          (tmp, mut(beats, lambda o: o.__setitem__(
              "beats", o["beats"][:-1]))),
          "audio_matches_plan")
    check("08 two hosts", gates.gate_cast, (cfg,),
          (mut(cfg, lambda o: o["hosts"].pop(hb)),), "cast_two_hosts")
    check("09 distinct voices", gates.gate_cast, (cfg,),
          (mut(cfg, lambda o: o["hosts"][hb].__setitem__(
              "voice_id", o["hosts"]["A"]["voice_id"])),),
          "cast_distinct_voices")
    check("10 voice id bound", gates.gate_cast, (cfg,),
          (mut(cfg, lambda o: o["hosts"]["A"].__setitem__(
              "voice_id", "<voice_id>")),), "cast_voice_id_bound")

    # ------------------------------------------------------------ config gates
    check("11 no real brand", gates.gate_no_real_brand, (cfg,),
          (mut(cfg, lambda o: o.__setitem__("brand_name", "Ladder")),),
          "no_real_brand")
    check("12 no unbound placeholder", gates.gate_no_unbound_placeholders, (cfg,),
          (mut(cfg, lambda o: o["end_card"].__setitem__("url_text", "<url>")),),
          "no_unbound_placeholders")
    # The gate counts distinct PICTURES, files x framings, so stripping host
    # A's variants is no longer enough on its own: one still plus five
    # framings is still five pictures. The mutation has to take BOTH away,
    # which is the real failure case, a host with one picture to cut between.
    check("13 still pool depth", gates.gate_still_pool_depth, (cfg,),
          (mut(cfg, lambda o: (o["characters"].__setitem__(
              "expression_variants",
              [v for v in o["characters"]["expression_variants"]
               if v["who"] != "A"]),
              o["edit"]["framing"].__setitem__("sizes", ["wide"]))),),
          "still_pool_depth")
    check("14 still resolves", gates.gate_stills_resolve, (cfg, scr),
          (cfg, mut(scr, lambda o: L(o, 5, "still", "nope.png"))),
          "still_resolves")
    # The OTHER host's base, derived from the config and from who actually
    # speaks line 5. Hardcoded as devi-base.png this quietly depended on line 5
    # being host A's and on devi being host B; swap either in the fixture and
    # the planted still belongs to the speaker after all, which is legal.
    _l5 = next(l["who"] for l in scr["lines"] if l["n"] == 5)
    _other = next(b["file"] for b in cfg["characters"]["bases"]
                  if b["who"] != _l5)
    check("15 still belongs to speaker", gates.gate_stills_resolve, (cfg, scr),
          (cfg, mut(scr, lambda o: L(o, 5, "still", _other))),
          "still_belongs_to_speaker")

    # ----------------------------------------------------------- cut plan gates
    def C(o, i, key, val):
        o["cuts"][i][key] = val

    def first(o, mode):
        return next(i for i, c in enumerate(o["cuts"]) if c["mode"] == mode)

    args = (plan, beats, cfg)
    check("16 covers the VO", gates.gate_cutplan, args,
          (mut(plan, lambda o: C(o, 0, "end", o["cuts"][0]["end"] - 0.4)),
           beats, cfg), "cutplan_covers_vo")
    check("17 tiles the beat", gates.gate_cutplan, args,
          (mut(plan, lambda o: (C(o, 1, "start", o["cuts"][1]["start"] + 0.2),
                                C(o, 1, "end", o["cuts"][1]["end"] + 0.2))),
           beats, cfg), "cutplan_tiles_beat")
    check("18 min cut floor", gates.gate_cutplan, args,
          (plan, beats,
           mut(cfg, lambda o: o["edit"]["multicut"].__setitem__(
               "min_cut_sec", 1.2))), "cutplan_min_cut")
    check("19 max cut ceiling", gates.gate_cutplan, args,
          (plan, beats,
           mut(cfg, lambda o: o["edit"]["multicut"].__setitem__(
               "max_cut_sec", 0.8))), "cutplan_max_cut")
    check("20 split shows two hosts", gates.gate_cutplan, args,
          (mut(plan, lambda o: C(o, first(o, "split"), "listener",
                                 o["cuts"][first(o, "split")]["speaker"])),
           beats, cfg), "split_two_distinct_hosts")
    check("21 speaking cut is lipsynced", gates.gate_cutplan, args,
          (mut(plan, lambda o: C(o, first(o, "single"), "source", "still")),
           beats, cfg), "speaker_cut_is_lipsynced")
    check("22 reaction shows the listener", gates.gate_cutplan, args,
          (mut(plan, lambda o: C(o, first(o, "reaction"), "show",
                                 o["cuts"][first(o, "reaction")]["speaker"])),
           beats, cfg), "reaction_cut_shows_listener")

    def repeat_still(o):
        i = first(o, "single")
        j = next(k for k in range(i + 1, len(o["cuts"]))
                 if o["cuts"][k]["mode"] == "single")
        # make them adjacent and identical. The framing has to be copied too:
        # the same plate at a DIFFERENT crop is reference technique 13 and is
        # exactly what the planner now does on purpose, so only same-plate AND
        # same-framing is the freeze this gate is about.
        o["cuts"] = o["cuts"][:i + 1] + [dict(o["cuts"][j],
                                              still=o["cuts"][i]["still"],
                                              framing=o["cuts"][i]["framing"])] \
            + o["cuts"][i + 1:]
    check("23 no repeated still back to back", gates.gate_cutplan, args,
          (mut(plan, repeat_still), beats, cfg), "cutplan_no_repeat_still")

    # ----------------------------------------------------- framing variety gate
    # The axis references/REFERENCES.md measured OUT of band: 2 distinct
    # framings, 0.41 per 10s, one framing on 50% of shots, against bands of
    # 2.9 to 7.1 per 10s and a 17% ceiling. Four ways to break it, four bites.
    fargs = (plan, cfg)

    def one_framing_everywhere(o):
        """The shipped failure, reproduced: collapse the plan onto a single
        picture. This is what 0.41 per 10s and a 50% share looked like."""
        for c in o["cuts"]:
            c["framing"] = "A:wide"
            c["crop"] = {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}
    check("34 framing variety: too few framings", gates.gate_framing_variety,
          fargs, (mut(plan, one_framing_everywhere), cfg),
          "framing_variety_per_10s")

    def half_on_one_framing(o):
        """Keep the framing COUNT legal and give one framing half the cuts, so
        only the share test can catch it. This is the half of the gap that a
        distinct-count check alone would miss."""
        tag = o["cuts"][0]["framing"]
        for i, c in enumerate(o["cuts"]):
            if i % 2 == 0:
                c["framing"] = tag
    check("35 framing variety: one framing hogs the piece",
          gates.gate_framing_variety, fargs,
          (mut(plan, half_on_one_framing), cfg), "framing_biggest_share")

    def adjacent_repeat(o):
        o["cuts"][2]["framing"] = o["cuts"][1]["framing"]
    check("36 framing variety: consecutive cuts must reframe",
          gates.gate_framing_variety, fargs,
          (mut(plan, adjacent_repeat), cfg), "framing_no_repeat_adjacent")

    def strip_framing(o):
        for c in o["cuts"][:4]:
            c.pop("framing", None)
    check("37 framing is declared on every cut", gates.gate_framing_variety,
          fargs, (mut(plan, strip_framing), cfg), "framing_declared")

    def crop_off_plate(o):
        o["cuts"][0]["crop"] = {"x": 0.7, "y": 0.0, "w": 0.6, "h": 0.6}
    check("38 framing crop stays on the plate", gates.gate_framing_variety,
          fargs, (mut(plan, crop_off_plate), cfg), "framing_crop_in_frame")

    # the split's lower panel may carry a product still; it must then exist
    check("39 split product panel asset exists", gates.gate_split_bottom_assets,
          (plan, cfg, tmp), (plan, cfg, tmp / "no-such-run"),
          "split_bottom_asset")

    def split_bottom_still_claims_a_host(o):
        i = next(k for k, c in enumerate(o["cuts"])
                 if c["mode"] == "split" and c.get("bottom") == "product")
        o["cuts"][i]["listener"] = o["cuts"][i]["speaker"]
    check("40 product-bottom split does not claim a listener",
          gates.gate_cutplan, args,
          (mut(plan, split_bottom_still_claims_a_host), beats, cfg),
          "split_two_distinct_hosts")

    # ------------------------------------------------------------ asset gates
    good_png = tmp / "overlays" / "cap-001.png"
    ptr = tmp / "pointer.png"
    ptr.write_bytes(b"version https://git-lfs.github.com/spec/v1\noid "
                    b"sha256:" + b"0" * 64 + b"\nsize 481920\n")
    check("24 LFS pointer is not a real asset", gates.gate_real_binaries,
          ([good_png],), ([ptr],), "asset_not_lfs_pointer")
    check("25 missing asset", gates.gate_real_binaries,
          ([good_png],), ([tmp / "absent.png"],), "asset_exists")

    # caption safe zone: re-render the overlays with a bad anchor
    bad_run = tmp / "bad-anchor"
    bad_run.mkdir(exist_ok=True)
    shutil.copy(tmp / "beats.json", bad_run / "beats.json")
    bad_cfg = mut(cfg, lambda o: o["captions"].__setitem__(
        "bottom_anchor_px", 1900))
    bad_cfg_p = tmp / "bad-anchor.json"
    bad_cfg_p.write_text(json.dumps(bad_cfg), encoding="utf-8")
    run("build_overlays.py", "--config", bad_cfg_p, "--run-dir", bad_run)
    check("26 caption safe zone", gates.gate_caption_safe_zone,
          (tmp / "overlays", cfg), (bad_run / "overlays", bad_cfg),
          "caption_safe_zone")

    wide_run = tmp / "bad-wrap"
    wide_run.mkdir(exist_ok=True)
    shutil.copy(tmp / "beats.json", wide_run / "beats.json")
    wide_cfg = mut(cfg, lambda o: (
        o["captions"].__setitem__("wrap_max_width_px", 4000),
        o["captions"].__setitem__("font_size", 150)))
    wide_cfg_p = tmp / "bad-wrap.json"
    wide_cfg_p.write_text(json.dumps(wide_cfg), encoding="utf-8")
    run("build_overlays.py", "--config", wide_cfg_p, "--run-dir", wide_run)
    check("27 caption stays in frame", gates.gate_caption_safe_zone,
          (tmp / "overlays", cfg), (wide_run / "overlays", wide_cfg),
          "caption_in_frame")

    # ------------------------------------------------------------ master gates
    if not a.no_render:
        run("compose_master.py", "--config", CFG, "--run-dir", tmp, "--no-paid")
        master = tmp / "master-preview.mp4"
        small = tmp / "small.mp4"
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i",
                        "color=c=black:s=640x360:d=1", "-f", "lavfi", "-i",
                        "sine=d=1", "-c:v", "libx264", "-c:a", "aac",
                        "-shortest", str(small)], check=True, capture_output=True)
        mute = tmp / "mute.mp4"
        subprocess.run(["ffmpeg", "-y", "-i", str(master), "-an",
                        "-c:v", "copy", str(mute)], check=True,
                       capture_output=True)
        # Drift. The gate refuses to judge the $0 preview, correctly, because
        # a flat-colour preview's scene changes are its own block transitions
        # and have nothing to do with speakers. So it gets a purpose-built
        # master with real detail and one known change: two seconds of one
        # pattern, two of another, against a two-beat plan whose speaker
        # changes at 2.0s. The mutation shifts the PLAN, which is the same
        # mismatch as shifting the picture.
        dm = tmp / "drift-master.mp4"
        subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "testsrc2=s=320x568:d=2",
                        "-f", "lavfi", "-i", "smptebars=s=320x568:d=2",
                        "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]",
                        "-map", "[v]", "-r", "30", "-c:v", "libx264",
                        "-preset", "veryfast", str(dm)],
                       check=True, capture_output=True)
        dplan = {"cuts": [{"beat": 1, "idx": 1, "start": 0.0, "end": 2.0,
                           "mode": "single"},
                          {"beat": 2, "idx": 1, "start": 2.0, "end": 4.0,
                           "mode": "single"}]}
        dbeats = {"beats": [{"n": 1, "who": "A", "dur_sec": 2.0},
                            {"n": 2, "who": "B", "dur_sec": 2.0}]}
        check("55 the picture lands where the plan put it",
              gates.gate_render_no_drift, (dm, dplan, dbeats, cfg),
              (dm, mut(dplan, lambda o: [c.__setitem__("end", c["end"] + 0.5)
                                         for c in o["cuts"]]), dbeats, cfg),
              "render_drift")
        check("28 master canvas", gates.gate_master, (master, plan, cfg),
              (small, plan, cfg), "master_canvas")
        check("29 master has audio", gates.gate_master, (master, plan, cfg),
              (mute, plan, cfg), "master_has_audio")
        check("30 master duration", gates.gate_master, (master, plan, cfg),
              (master, mut(plan, lambda o: o.__setitem__(
                  "dialogue_sec", o["dialogue_sec"] + 5)), cfg),
              "master_duration")
        check("31 master exists", gates.gate_master, (master, plan, cfg),
              (tmp / "nope.mp4", plan, cfg), "master_exists")

        # Not a gate pair: a render-level measurement, run here so it cannot
        # rot unrun. It re-reads the seam of every split cut out of the
        # rendered pixels and fails if any landed somewhere other than where
        # the plan put it.
        r = subprocess.run(
            [sys.executable, str(HERE / "check_framing_render.py"),
             "--config", str(CFG), "--run-dir", str(tmp)],
            capture_output=True, text=True)
        seams = [l for l in r.stdout.splitlines() if "distinct seam ratio" in l]
        results.append((
            "41 split seams land where the plan put them",
            "ok" if r.returncode == 0 else "FAIL",
            (seams[0].strip() if seams else r.stdout[-120:]) if r.returncode == 0
            else f"check_framing_render.py exit {r.returncode}"))

    # ------------------------------------------------------------ recipe gates
    rp = (HERE / ".." / "recipe.json").resolve()
    rtxt = rp.read_text(encoding="utf-8")
    rj = json.loads(rtxt)
    check("32 recipe carries no narrative arc",
          gates.gate_recipe_carries_no_narrative, (rtxt,),
          (rtxt + '\n"arc": "skeptic and believer"',), "recipe_no_narrative")
    check("33 recipe carries no script fixture",
          gates.gate_recipe_has_no_script_fixture, (rj,),
          (mut(rj, lambda o: o.setdefault("config", {}).__setitem__(
              "scenes", [{"scene": 1, "text": "x"}])),),
          "recipe_no_script_fixture")

    # ------------------------------------------------------------------ report
    # Did every case this file declares actually run? A case that skipped
    # itself appends nothing, so without this the total just gets smaller.
    ran = {n.split(" ", 1)[0] for n, _, _ in results}
    want = EXPECTED_CASES - (RENDER_CASES if a.no_render else set())
    for missing in sorted(want - ran):
        results.append((f"{missing} MISSING", "FAIL",
                        "declared in EXPECTED_CASES but never ran: it skipped "
                        "itself, so it tested nothing and reported nothing"))
    for extra in sorted(ran - EXPECTED_CASES):
        results.append((f"{extra} UNDECLARED", "FAIL",
                        "ran but is not in EXPECTED_CASES; add it there so a "
                        "later skip is caught"))

    bad = [r for r in results if r[1] == "FAIL"]
    w = max(len(r[0]) for r in results)
    for name, st, det in results:
        print(f"  [{st:>4}] {name:<{w}}  {det}")
    print(f"\n[selftest] {len(results) - len(bad)}/{len(results)} gates are "
          f"clean on good input AND bite on their mutation")
    if not a.keep:
        shutil.rmtree(tmp, ignore_errors=True)
    else:
        print(f"[selftest] fixture kept at {tmp}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
