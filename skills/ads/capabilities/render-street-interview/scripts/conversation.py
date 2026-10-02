"""Mic-only street conversations. Preview support; rendered delivery is unverified."""

MODE = "conversation"
SHOT_KINDS = ("question", "answer", "followup", "reaction")
CLAUSES = {
    "execution mode: conversation": "record the supported execution explicitly",
    "only the interviewer holds the microphone": "keep one mic and two distinct voices",
    "no product, phone or screen is held or demonstrated": "this execution needs no prop",
    "they look at the interviewer while they speak": "participants respond to a person",
    "nobody says any word that is not written below": "generate only approved spoken words",
    "one continuous street ambience": "keep audio in the same space",
    "every shot is filmed on one corner": "bind location across cuts",
    "no on-screen text, no subtitles": "draw brand graphics after generation",
}
PER_SHOT = ("same street corner", "same participant", "microphone")
PRODUCT_FLAGS = ("guards", "can", "can_size", "can_sealed", "upright", "mic_ref")


def validate(cfg):
    if not isinstance(cfg, dict):
        raise SystemExit("conversation config must be an object")
    for key in ("brand", "slug", "location", "question", "shots", "generation", "participant"):
        if not cfg.get(key):
            raise SystemExit(f"conversation config needs {key}")
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
        raise SystemExit("conversation is a standalone mic-only exchange, without product or episode roles")
    if any(gen.get(k+"_grammar") for k in PRODUCT_FLAGS):
        raise SystemExit("product/reference grammar is incompatible with mic-only conversation")
    shots = cfg["shots"]
    if not isinstance(shots, list) or not 3 <= len(shots) <= 8:
        raise SystemExit("conversation needs 3 to 8 ordered shots")
    if not all(isinstance(shot, dict) for shot in shots):
        raise SystemExit("conversation shots must be objects")
    if shots[0].get("kind") != "question" or shots[0].get("line") != cfg["question"]:
        raise SystemExit("conversation opens with its exact interviewer question")
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
        if kind == "reaction" and shot.get("line", "").strip():
            raise SystemExit("reaction shots are silent; put speech in an answer or followup")
        if kind != "reaction" and not shot.get("line", "").strip():
            raise SystemExit("spoken shots need a line")
        if shot.get("line"):
            speakers.add(speaker)
    if speakers != {"interviewer", "participant"}:
        raise SystemExit("both people must speak")
    if sum(len(s.get("line", "").split()) for s in shots) > gen["duration"] * 2.5:
        raise SystemExit("conversation exceeds provisional 2.5 words/second; leave time for replies")


def build_prompt(cfg):
    validate(cfg)
    loc = cfg["location"]
    shots = cfg["shots"]
    parts = [
        "EXECUTION MODE: conversation. Raw vertical street-interview footage, a stable medium "
        f"shot at eye level, {loc.get('light', 'ordinary daylight')}. One adult participant and an interviewer just "
        "outside frame. ONLY THE INTERVIEWER HOLDS THE MICROPHONE: one plain black handheld "
        "reporter's mic, visible below the participant's chin, held from the lower right. "
        "No product, phone or screen is held or demonstrated. The participant's hands rest "
        "normally. The same participant stays on screen during both voices. "
        "THEY LOOK AT THE INTERVIEWER WHILE THEY SPEAK. The interviewer asks and listens; "
        "the participant answers. Two distinct nearby voices recorded by the same mic. "
        "Relaxed real-time pace with room between turns; perform the supplied words without "
        "adding laughs or verbal filler. NOBODY SAYS ANY WORD THAT IS NOT WRITTEN BELOW. "
        "When the other person speaks, lips remain closed. People and traffic move in the "
        "background. No legible clothing logos or signage. No on-screen text, no subtitles. "
        f"EVERY SHOT IS FILMED on ONE corner: {loc['description']}. "
        f"{loc['landmarks']} stay behind the participant. "
        f"Participant: {cfg['participant']}. THE {len(shots)} SHOTS: "
    ]
    for i, shot in enumerate(shots, 1):
        line = shot.get("line", "")
        action = (f"The {shot['speaker']} says exactly {line!r}. " if line else
                  "Both voices are silent. ")
        parts.append(f"{i}. Same street corner: {loc['description']}; same participant, "
                     f"same microphone below the chin. {action}{shot.get('manner', '')} ")
    parts.append("Sound: close voices and one continuous street ambience, traffic and "
                 "footsteps, no music or score. Branded graphics and disclosure are added locally.")
    return "".join(parts)


def lint(prompt, split_shots, word_ceiling):
    low = prompt.lower()
    errors = [f'conversation prompt is missing "{k}" -- {v}' for k, v in CLAUSES.items() if k not in low]
    shots = split_shots(prompt)
    if not shots:
        errors.append("conversation has no numbered shot list")
    for i, shot in enumerate(shots, 1):
        for needle in PER_SHOT:
            if needle not in shot.lower():
                errors.append(f"conversation shot {i} misses {needle}")
    if "@image" in low:
        errors.append("mic-only conversation must not refer to an unbound image")
    if len(prompt.split()) > word_ceiling:
        errors.append("conversation prompt exceeds the prompt word ceiling")
    return errors
