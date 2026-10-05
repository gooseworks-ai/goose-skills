#!/usr/bin/env python3
"""Load and validate one brand config. The ONLY place a brand name appears in this skill's code.

    python brandkit.py                      # list the configs on disk
    python brandkit.py --brand liquid-death # print one, validated

Resolution order for `--brand`, so a config can live outside this repo:
  1. an explicit path to a .json file
  2. `<skill>/brands/<slug>.json`
  3. `$STREET_INTERVIEW_BRAND` (a path or a slug)
  4. the default slug, `liquid-death`

Validation is strict and loud. A missing key here means a malformed prompt goes to a PAID call,
which is the most expensive way to find a typo: seed 4806 spent $3.64 discovering that the
prompt asked for something the model could not render.
"""
import argparse
import json
import os
from pathlib import Path

import format_spec
import paths

BRANDS = paths.SKILL / "brands"
DEFAULT_SLUG = "liquid-death"

_REQ_TOP = ("brand", "slug", "product", "location", "question", "props", "shots", "generation")
_REQ_PRODUCT = ("noun", "phrase", "reference_image", "appearance", "colour_ban")
_REQ_LOCATION = ("description", "landmarks")
_REQ_GEN = ("seed", "duration")

# A take's place in a multi-take episode. Absent means "this is a whole video on its own", which
# is what every config was before 2026-09-30 and is still the default. See validate().
EPISODE_ROLES = ("opening", "middle", "payoff")


def available():
    return sorted(p.stem for p in BRANDS.glob("*.json")) if BRANDS.exists() else []


def find(arg=None) -> Path:
    arg = arg or os.environ.get("STREET_INTERVIEW_BRAND") or DEFAULT_SLUG
    p = Path(arg).expanduser()
    if p.suffix == ".json":
        if not p.exists():
            raise SystemExit(f"no brand config at {p}")
        return p.resolve()
    cand = BRANDS / f"{arg}.json"
    if not cand.exists():
        raise SystemExit(f"no brand config {arg!r} in {BRANDS}. Have: "
                         f"{', '.join(available()) or '(none)'}")
    return cand


def load(arg=None) -> dict:
    path = find(arg)
    cfg = json.loads(path.read_text(encoding="utf-8"))
    cfg["_path"] = str(path)
    validate(cfg)
    return cfg


def validate(cfg: dict):
    def need(d, keys, where):
        missing = [k for k in keys if k not in d]
        if missing:
            raise SystemExit(f"{cfg.get('_path', '?')}: {where} is missing "
                             f"{', '.join(missing)}")
    if cfg.get("mode", "product-guess") == "conversation":
        import conversation
        conversation.validate(cfg)
        return
    if cfg.get("mode", "product-guess") != "product-guess":
        raise SystemExit("unknown street execution mode")
    need(cfg, _REQ_TOP, "the config")
    need(cfg["product"], _REQ_PRODUCT, "product")
    need(cfg["location"], _REQ_LOCATION, "location")
    need(cfg["generation"], _REQ_GEN, "generation")
    if cfg["product"]["noun"] != cfg["product"]["noun"].lower() or " " in cfg["product"]["noun"]:
        raise SystemExit("product.noun must be one lowercase word: the format upper-cases it for "
                         "the position-pinning clause and inflects it inside the shot grammar")
    kinds = [s.get("kind") for s in cfg["shots"]]
    bad = [k for k in kinds if k not in format_spec.SHOT_KINDS]
    if bad:
        raise SystemExit(f"unknown shot kind(s) {bad}. Known: "
                         f"{', '.join(format_spec.SHOT_KINDS)}")
    # The take's place in an episode, read BEFORE the shot-kind checks because both of them now
    # depend on it. It is validated where it always was, a few lines below.
    role = cfg.get("episode_role")
    # SHOT 1 IS A HANDOVER, AND WHICH KIND OF HANDOVER IS AN EPISODE-LEVEL DECISION.
    # Until episode 1 was watched this read "shot 1 must be `handover_first`", because every
    # video was one generation and a vox pop with no question is not one. Episode 1 then asked
    # the question THREE TIMES, once per take, at 0:00, 0:09 and 0:18, which is what made the
    # joins abrupt. So the rule moves to the level where it is true, exactly as the payoff rule
    # did above, and gets no weaker: a standalone video and an episode's OPENING take must still
    # carry `handover_first`, and `build_episode.py` asserts that an episode has exactly one take
    # that does. There is no configuration in which nobody asks the question.
    ask = {"handover_first", "handover_cold"}
    if kinds[0] not in ask:
        raise SystemExit(f"shot 1 is {kinds[0]!r}. It must be `handover_first` (the shot that "
                         f"carries the interviewer's question) or `handover_cold` (the same "
                         f"handover with no question, for an answers-only take in an episode).")
    if role in (None, "opening") and kinds[0] != "handover_first":
        raise SystemExit(f"this is {'a standalone video' if role is None else 'the episode '
                         'opening'} and shot 1 is `handover_cold`, so the question is never "
                         f"asked. A vox pop with no question is not one.")
    # ...and the other direction, which selftest.py found by building every config under every
    # grammar combination. `handover_cold` takes the question OUT of shot 1, and the base
    # REQUIRED_CLAUSE "does not say this line" is written BY `handover_first`. So a cold config
    # with answers_only off has no ask-and-answer guard anywhere in the prompt: nothing says the
    # question, and nothing stops the model putting it in a stranger's mouth. That is not a
    # hypothetical -- seed 4808 filled 4.5 unscripted seconds with gibberish under exactly this
    # pressure. The two settings are one decision and the config may not hold half of it.
    if "handover_cold" in kinds and not cfg.get("generation", {}).get("answers_only"):
        raise SystemExit("a `handover_cold` shot removes the interviewer's question, but "
                         "generation.answers_only is not set, so nothing in the prompt forbids "
                         "the question being spoken anyway and the ask-and-answer guard "
                         "(\"does not say this line\") is absent entirely. Set answers_only, or "
                         "use `handover_first`.")
    if "handover_first" in kinds and cfg.get("generation", {}).get("answers_only"):
        raise SystemExit("answers_only is set and a shot is still `handover_first`, which "
                         "generates the interviewer's question inside the clip. The prompt would "
                         "then both forbid the question and script it, and the model resolves "
                         "that argument however it likes.")
    # THE PAYOFF RULE, AND THE LEVEL IT IS TRUE AT. Until 2026-09-30 every config had to end in
    # a `payoff` shot, because every video was one generation and the last answer being the true
    # one IS this format. A multi-take EPISODE (see `build_episode.py`) still has to obey that
    # rule -- but it obeys it once, at the end of the episode, not once per take. A middle take
    # that ended in the payoff would land the joke twice and kill the episode at its own join.
    #
    # So the rule moves to the level where it is true and gets STRICTER on the way, rather than
    # being relaxed: a config with no `episode_role` is a standalone video and is checked exactly
    # as before; an `opening` or `middle` take must NOT contain a payoff; and `build_episode.py`
    # asserts that an episode has exactly one `payoff` take and that it is last. There is no
    # configuration in which nothing pays off.
    if role is not None and role not in EPISODE_ROLES:
        raise SystemExit(f"episode_role {role!r} is not one of {', '.join(EPISODE_ROLES)}. "
                         f"Leave it out for a standalone single-generation video.")
    if role in (None, "payoff"):
        if "payoff" not in kinds:
            raise SystemExit(
                "no `payoff` shot: the last answer being the true one IS this format. "
                + ("" if role else "If this take is the opening or the middle of a multi-take "
                                   "episode, say so with \"episode_role\".") )
        if kinds[-1] != "payoff":
            raise SystemExit("the `payoff` shot must be last, or the joke lands mid-video")
    else:
        if "payoff" in kinds:
            raise SystemExit(f"this take is the episode's {role!r} and contains a `payoff` "
                             f"shot. The reveal lands ONCE, in the last take: an episode that "
                             f"pays off at its first join has nothing left to watch.")
    # THE CAN GRAMMAR'S OWN CONFIG GUARDS. All three fail before a paid call rather than after
    # one, which is the only kind of guard worth writing on a $3.64 endpoint.
    gen = cfg.get("generation", {})
    if gen.get("mic_grammar") and gen.get("mic_ref_grammar"):
        raise SystemExit("mic_grammar and mic_ref_grammar are two different answers to the same "
                         "question: one describes the microphone in words, the other points at "
                         "@Image2 and says nothing else. Holding both puts two descriptions of "
                         "one object in the prompt, which is the failure MIC_SCALE's comment "
                         "names. Pick one.")
    can = bool(cfg.get("generation", {}).get("can_grammar"))
    if can and "size" not in cfg["product"]:
        raise SystemExit("generation.can_grammar is set but product.size is missing. The can "
                         "grammar replaces the prompt's only size words with a real-world size, "
                         "and the measurement is the brand's fact, not the format's: give "
                         "product.size a phrase like \"a 19oz tallboy about two hand-widths "
                         "tall\".")
    if "reach" in kinds and not can:
        raise SystemExit("a `reach` shot is the first half of an opening that happens in the CUT, "
                         "and the second half is the `payoff` shot's already-drinking wording, "
                         "which only exists when generation.can_grammar is set. Without it the "
                         "hands reach for a can the prompt still calls open, and nothing says "
                         "the opening is off camera.")
    for i, k in enumerate(kinds):
        if k != "reach":
            continue
        # The pair is the whole mechanism. A `reach` with nothing after it asks for hands moving
        # to a can and never pays it off; a `reach` followed by anything but the payoff puts an
        # unexplained gesture mid-video. Seed 4806 is what a rendered ring pull costs, so the
        # grammar that avoids it may not be half-configured.
        if i + 1 >= len(kinds) or kinds[i + 1] != "payoff":
            raise SystemExit(f"shot {i + 1} is `reach` and shot {i + 2} is "
                             f"{kinds[i + 1] if i + 1 < len(kinds) else '(nothing)'!r}. A `reach` "
                             f"must be immediately followed by `payoff`: the opening happens in "
                             f"the cut between those two shots and nowhere else.")
        if not cfg["shots"][i + 1].get("pronoun"):
            raise SystemExit(f"shot {i + 2} is the `payoff` after a `reach` and has no "
                             f"`pronoun`. The already-drinking wording needs it.")
    # The comprehension guard, applied to the CONFIG rather than to the finished prompt, so it
    # fails before a paid call rather than after one.
    if not any(s.get("line") for s in cfg["shots"]):
        raise SystemExit("no shot has a spoken `line`: nobody says anything")


def spoken_lines(cfg):
    """Every scripted line, in order. What check-cut.py's Whisper check listens for, and the
    reason that check no longer carries one brand's dialogue in a module constant."""
    return [s["line"] for s in cfg["shots"] if s.get("line")]


def take_name(cfg, seed=None):
    return f"{cfg['slug']}-single-seed{seed or cfg['generation']['seed']}"


def expected_lines(cfg):
    """Question occurs once in conversation shots; legacy guesses keep it separately."""
    return spoken_lines(cfg) if cfg.get("mode") == "conversation" else [cfg["question"]] + spoken_lines(cfg)


def reference_image(cfg) -> Path:
    """Product reference, resolved against the repo root so a config is checkout-portable."""
    return None if cfg.get("mode") == "conversation" else paths.ROOT / cfg["product"]["reference_image"]


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--brand", default=None)
    A = ap.parse_args()
    print(f"configs in {BRANDS}: {', '.join(available()) or '(none)'}")
    cfg = load(A.brand)
    print(f"\n{cfg['_path']}")
    print(f"  brand      {cfg['brand']}  (slug {cfg['slug']})")
    print(f"  mode       {cfg.get('mode', 'product-guess')}")
    if cfg.get("product"):
        print(f"  product    {cfg['product']['phrase']}  ->  {reference_image(cfg)}")
    print(f"  location   {cfg['location']['description'][:70]}...")
    print(f"  question   {cfg['question']}")
    print(f"  shots      {len(cfg['shots'])}: {', '.join(s['kind'] for s in cfg['shots'])}")
    print(f"  lines      {spoken_lines(cfg)}")
    print(f"  take       {take_name(cfg)}.mp4")
