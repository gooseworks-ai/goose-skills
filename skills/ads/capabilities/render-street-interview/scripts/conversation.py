"""Street conversation script/prompt previews; rendered delivery is unverified."""

import re

MODE = "conversation"
SHOT_KINDS = ("question", "answer", "followup", "reaction", "action")
INTERACTION_TYPES = ("mic-only", "product-sample", "concept-challenge")
CLAUSES = {
    "execution mode: conversation": "record the supported execution explicitly",
    "only the interviewer holds the microphone": "keep one mic and two distinct voices",
    "they look at the interviewer while they speak": "participants respond to a person",
    "nobody says any word that is not written below": "generate only approved spoken words",
    "one continuous street ambience": "keep audio in the same space",
    "every shot is filmed on one corner": "bind location across cuts",
    "no on-screen text, no subtitles": "draw brand graphics after generation",
}
INTERACTION_CLAUSES = {
    "mic-only": {
        "no product, phone or screen is held or demonstrated": "the default needs no prop",
    },
    "product-sample": {
        "the participant handles only the prepared sample": "separate sample and microphone",
        "samples are already prepared before the first shot": "do not imply package-opening support",
        "no phone, screen or ui is held or demonstrated": "no device or UI support is verified",
    },
    "concept-challenge": {
        "perform only the visible task described below": "keep the configured challenge visible",
        "no phone, screen or ui is held or demonstrated": "no device or UI support is verified",
    },
}
PER_SHOT = ("same street corner", "same participant", "microphone")
PRODUCT_FLAGS = ("guards", "can", "can_size", "can_sealed", "upright", "mic_ref")
_DEVICES = r"phones?|smartphones?|screens?|ui|interfaces?|laptops?|tablets?"
_SAMPLES = r"samples?|drinks?|bottles?|cups?|sip(?:s|ping)?|tast(?:e|es|ing)|(?:a|the|sealed|open) can|(?:holds?|holding|shows?|showing|handles?|handling|hands?|passing|displays?) (?:a |the |their )?products?"


def interaction_type(cfg):
    """Old configs remain mic-only. Interaction data describes a preview, never bindings."""
    return cfg.get("interaction", {}).get("type", "mic-only")


def _has_visible_term(text, terms):
    # Negative instructions such as "no phone or screen" may restate the scaffold's guard.
    # Check visual descriptions, not dialogue: discussing a device is not demonstrating one.
    text = re.sub(r"\b(?:no|without)\s+(?:(?:a|an|any)\s+)?(?:" + terms + r")"
                  r"(?:\s*[,/]?\s*(?:or|and)?\s*(?:" + terms + r"))*", "", text.lower())
    return bool(re.search(r"\b(?:" + terms + r")\b", text))


def validate(cfg):
    if not isinstance(cfg, dict):
        raise SystemExit("conversation config must be an object")
    for key in ("brand", "slug", "location", "question", "shots", "generation", "participant"):
        if not cfg.get(key):
            raise SystemExit(f"conversation config needs {key}")
    for key in ("brand", "slug", "question", "participant"):
        if not isinstance(cfg[key], str) or not cfg[key].strip():
            raise SystemExit(f"conversation {key} must be nonempty text")
    loc, gen = cfg["location"], cfg["generation"]
    if not isinstance(loc, dict) or not isinstance(gen, dict):
        raise SystemExit("conversation location and generation must be objects")
    if not all(isinstance(loc.get(k), str) and loc[k].strip() for k in ("description", "landmarks")):
        raise SystemExit("conversation location needs description and landmarks")
    if (not isinstance(gen.get("seed"), int) or isinstance(gen.get("seed"), bool)
            or not isinstance(gen.get("duration"), (int, float))
            or not 6 <= gen["duration"] <= 15):
        raise SystemExit("conversation generation needs a seed and duration from 6 to 15 seconds")
    if cfg.get("product") or cfg.get("episode_role") or gen.get("answers_only"):
        raise SystemExit("conversation is a standalone preview, without product reference or episode roles")
    if any(gen.get(k+"_grammar") for k in PRODUCT_FLAGS):
        raise SystemExit("product/reference grammar is incompatible with conversation previews")
    interaction = cfg.get("interaction")
    if "interaction" in cfg:
        if not isinstance(interaction, dict) or interaction.get("type") not in INTERACTION_TYPES:
            raise SystemExit("conversation interaction needs a supported type")
        for key in ("visible_setup", "participant_reason"):
            if not isinstance(interaction.get(key), str) or not interaction[key].strip():
                raise SystemExit(f"conversation interaction needs nonempty {key}")
        if "props" in interaction and (not isinstance(interaction["props"], str)
                                       or not interaction["props"].strip()):
            raise SystemExit("conversation interaction.props must be a nonempty description")
    mode = interaction_type(cfg)
    shots = cfg["shots"]
    if not isinstance(shots, list) or not 3 <= len(shots) <= 8:
        raise SystemExit("conversation needs 3 to 8 ordered shots")
    if not all(isinstance(shot, dict) for shot in shots):
        raise SystemExit("conversation shots must be objects")
    speakers = set()
    for shot in shots:
        kind, speaker = shot.get("kind"), shot.get("speaker")
        if kind not in SHOT_KINDS or speaker not in ("interviewer", "participant"):
            raise SystemExit("conversation shot kind or speaker is invalid")
        if kind in ("question", "followup") and speaker != "interviewer":
            raise SystemExit("question/followup belongs to the interviewer")
        if kind == "answer" and speaker != "participant":
            raise SystemExit("answer belongs to the participant")
        if not isinstance(shot.get("line", ""), str):
            raise SystemExit("conversation line must be text")
        if kind in ("reaction", "action") and shot.get("line", "").strip():
            raise SystemExit("reaction/action shots are silent; put speech in an answer or followup")
        if kind not in ("reaction", "action") and not shot.get("line", "").strip():
            raise SystemExit("spoken shots need a line")
        for key in ("action", "visual", "manner"):
            if key in shot and not isinstance(shot[key], str):
                raise SystemExit(f"conversation shot {key} must be text")
        if kind == "action" and not any(shot.get(k, "").strip() for k in ("action", "visual")):
            raise SystemExit("silent action shots need an explicit action or visual description")
        if shot.get("line", "").strip():
            speakers.add(speaker)
    questions = [i for i, shot in enumerate(shots) if shot["kind"] == "question"]
    if not questions or shots[questions[0]]["line"] != cfg["question"]:
        raise SystemExit("question metadata must exactly mirror the first interviewer question")
    if any(shot["kind"] not in ("answer", "action", "reaction") for shot in shots[:questions[0]]):
        raise SystemExit("a cold open must be a participant answer or silent action/reaction")
    question_words = " ".join(cfg["question"].split()).casefold()
    if sum(" ".join(shot.get("line", "").split()).casefold().count(question_words)
           for shot in shots) != 1:
        raise SystemExit("the first interviewer question must be performed exactly once")
    if speakers != {"interviewer", "participant"}:
        raise SystemExit("both people must speak")
    visuals = [interaction.get("visible_setup", ""), interaction.get("props", "")] if interaction else []
    visuals += [shot.get(key, "") for shot in shots for key in ("action", "visual", "manner")]
    if any(_has_visible_term(text, _DEVICES) for text in visuals):
        raise SystemExit("conversation previews do not support visible phones, screens or UI")
    if mode == "mic-only" and any(_has_visible_term(text, _SAMPLES) for text in visuals):
        raise SystemExit("mic-only conversation cannot show product or sample handling")
    if sum(len(s.get("line", "").split()) for s in shots) > gen["duration"] * 2.5:
        raise SystemExit("conversation exceeds provisional 2.5 words/second; leave time for replies")


def build_prompt(cfg):
    validate(cfg)
    loc = cfg["location"]
    shots = cfg["shots"]
    mode = interaction_type(cfg)
    interaction = cfg.get("interaction")
    prop_rules = {
        "mic-only": "No product, phone or screen is held or demonstrated. The participant's "
                    "hands rest normally unless an explicit non-prop action is supplied. ",
        "product-sample": "The participant handles only the prepared sample; the interviewer "
                          "holds only the microphone. Samples are already prepared before the "
                          "first shot; no package opening is performed. No phone, screen or UI "
                          "is held or demonstrated. Sample appearance and handling are text "
                          "directions for this preview; no product reference image is bound. ",
        "concept-challenge": "Perform only the visible task described below, using its described "
                             "non-UI props. No phone, screen or UI is held or demonstrated. ",
    }
    parts = [
        f"EXECUTION MODE: conversation. INTERACTION TYPE: {mode}. Raw vertical street-interview footage, a stable medium "
        f"shot at eye level, {loc.get('light', 'ordinary daylight')}. One adult participant and an interviewer just "
        "outside frame. ONLY THE INTERVIEWER HOLDS THE MICROPHONE: one plain black handheld "
        "reporter's mic, visible below the participant's chin, held from the lower right. "
        + prop_rules[mode] + "The same participant stays on screen during both voices. "
        "THEY LOOK AT THE INTERVIEWER WHILE THEY SPEAK. The interviewer asks and listens; "
        "the participant answers. Two distinct nearby voices recorded by the same mic. "
        "Relaxed real-time pace with room between turns; perform the supplied words without "
        "adding laughs or verbal filler. NOBODY SAYS ANY WORD THAT IS NOT WRITTEN BELOW. "
        "When the other person speaks, lips remain closed. People and traffic move in the "
        "background. The street stays in focus and readable behind them, never blurred and never "
        "bokeh. No legible clothing logos or signage. No on-screen text, no subtitles. "
        f"EVERY SHOT IS FILMED on ONE corner: {loc['description']}. "
        f"{loc['landmarks']} stay behind the participant. "
        f"Participant: {cfg['participant']}. THE {len(shots)} SHOTS: "
    ]
    if interaction:
        parts.insert(0, f"Visible setup: {interaction['visible_setup']} "
                        f"Reason the participant joins: {interaction['participant_reason']} "
                        + (f"Configured props: {interaction['props']} " if interaction.get("props") else ""))
    if shots[0]["kind"] != "question":
        parts.insert(0, "Edited cold open: perform the supplied shot order. The first answer or "
                        "silent action/reaction precedes the question in the edit. Do not move "
                        "the question to the opening or repeat it. ")
    for i, shot in enumerate(shots, 1):
        line = shot.get("line", "")
        if not line.strip():
            line = ""
        speech = (f"The {shot['speaker']} says exactly {line!r}. " if line else
                  f"Silent {shot['kind']} by the {shot['speaker']}; both voices are silent. ")
        description = " ".join(shot.get(k, "") for k in ("visual", "action", "manner") if shot.get(k))
        parts.append(f"{i}. Same street corner: {loc['description']}; same participant, "
                     f"same microphone below the chin. {speech}{description} ")
    parts.append("Sound: close voices and one continuous street ambience, traffic and "
                 "footsteps, no music or score. Branded graphics and disclosure are added locally.")
    return "".join(parts)


def lint(prompt, split_shots):
    low = prompt.lower()
    errors = [f'conversation prompt is missing "{k}" -- {v}' for k, v in CLAUSES.items() if k not in low]
    kinds = re.findall(r"interaction type: ([a-z-]+)\.", low)
    if len(kinds) != 1 or kinds[0] not in INTERACTION_TYPES:
        errors.append("conversation prompt must name one supported interaction type")
    else:
        errors += [f'conversation prompt is missing "{k}" -- {v}'
                   for k, v in INTERACTION_CLAUSES[kinds[0]].items() if k not in low]
    shots = split_shots(prompt)
    if not shots:
        errors.append("conversation has no numbered shot list")
    for i, shot in enumerate(shots, 1):
        for needle in PER_SHOT:
            if needle not in shot.lower():
                errors.append(f"conversation shot {i} misses {needle}")
    if "@image" in low:
        errors.append("conversation preview must not refer to an unbound image")
    return errors
