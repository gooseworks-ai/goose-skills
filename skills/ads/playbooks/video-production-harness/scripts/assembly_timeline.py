"""Portable assembly intent and clock checks; never an audiovisual verdict."""
import hashlib
import json
import math
import re

FORMAT = "gooseworks-assembly-timeline/1"
SPEECH_MODES = {"native_dialogue", "audio_driven_lipsync", "narration", "singing", "mixed", "none"}
SOUNDTRACK_MODES = {"source_ambience", "music", "sfx", "intentional_silence"}
SPEECH_ROLES = SPEECH_MODES - {"mixed", "none"}
AUDIO_ROLES = SPEECH_ROLES | (SOUNDTRACK_MODES - {"intentional_silence"})

# Caps shared with gooseworks-final-measure/1 (the final file checks).
MAX_PAUSE_MS = 1500          # one planned pause
MAX_PAUSE_SHARE = 0.10       # all planned pauses together, share of the duration
MAX_FREEZE_MS = 1500         # one planned freeze override
MAX_END_FREEZE_MS = 3000     # a planned freeze that ends the video (end card hold)
MAX_ZOOM = 1.5               # largest zoom: crop fit-scale / full-frame fit-scale
MAX_UPSCALE = MAX_ZOOM       # read-time alias for one release; resolution scaling itself is not capped
MAX_STRETCH = 0.02           # largest |scale_x / scale_y - 1|
CALLBACK_PREFIX = "callback:"  # intent prefix that marks a deliberate repeated shot
INTEGER_KEYS = {"x", "y", "w", "h"}


def freeze_cap_ms(end_ms, duration_ms):
    """A freeze that ends at duration_ms (the last shot) may hold up to 3 s; any other freeze 1.5 s."""
    return MAX_END_FREEZE_MS if end_ms == duration_ms else MAX_FREEZE_MS


def zoom_factor(crop, source_w, source_h, out_w, out_h):
    """How far a crop zooms in: the crop's fill scale divided by the full source frame's fill scale.

    Scaling a whole small frame up to the output (H3's 432x768 to 1080x1920) is zoom 1.0.
    """
    full = max(out_w / source_w, out_h / source_h)
    return max(out_w / crop["w"], out_h / crop["h"]) / full


def is_ms(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 9_007_199_254_740_991


def is_px(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 100_000


def non_integers(value, where="timeline"):
    """Milliseconds and pixels must be integers so the revision survives a database round trip."""
    found = []
    if isinstance(value, dict):
        for key, item in value.items():
            if (key.endswith("_ms") or key in INTEGER_KEYS) and isinstance(item, float):
                found.append(f"{where}.{key}")
            found += non_integers(item, f"{where}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            found += non_integers(item, f"{where}[{index}]")
    return found


def union_ms(intervals):
    total, end = 0, None
    for start, stop in sorted((i["start_ms"], i["end_ms"]) for i in intervals):
        if end is None or start > end:
            total += stop - start
            end = stop
        elif stop > end:
            total += stop - end
            end = stop
    return total


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def is_text(value):
    return isinstance(value, str) and bool(value.strip())


def is_hash(value):
    return isinstance(value, str) and bool(re.fullmatch(r"[a-f0-9]{64}", value))


def portable(value):
    if isinstance(value, dict):
        return {key: portable(item) for key, item in value.items() if key != "path"}
    if isinstance(value, list):
        return [portable(item) for item in value]
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def timeline_revision(timeline):
    encoded = json.dumps(portable(timeline), ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def gaps(intervals, duration):
    missing, end = [], 0
    for item in sorted(intervals, key=lambda item: item["start_ms"]):
        if item["start_ms"] > end + 1:
            missing.append({"start_ms": end, "end_ms": item["start_ms"]})
        end = max(end, item["end_ms"])
    if end < duration - 1:
        missing.append({"start_ms": end, "end_ms": duration})
    return missing


def normalize_timeline(raw, legacy=None):
    if not isinstance(raw, dict):
        return {"status": "incomplete", "timeline": None, "revision": None,
                "issues": ["Source-linked assembly timeline is missing; legacy sound intent requires review"],
                **({"legacy": legacy} if legacy is not None else {})}
    issues = []
    if raw.get("format") != FORMAT:
        issues.append(f"assembly format must be {FORMAT}")
    if not is_hash(raw.get("creative_contract_revision")):
        issues.append("creative_contract_revision must identify approved bytes")
    duration = raw.get("duration_ms")
    if not is_ms(duration) or not 0 < duration <= 180_000:
        issues.append("duration_ms must be 1–180000")
    if not is_text(raw.get("speech_mode")) or raw.get("speech_mode") not in SPEECH_MODES:
        issues.append("speech_mode is missing or unknown")
    modes = raw.get("soundtrack_modes")
    if not isinstance(modes, list) or any(not isinstance(m, str) or m not in SOUNDTRACK_MODES for m in modes) or len(set(modes)) != len(modes):
        issues.append("soundtrack_modes must be explicit and unique; [] means no extra soundtrack")
    for key, limit in (("segments", 300), ("audio_cues", 500), ("pauses", 500), ("required_cue_ids", 500)):
        values = raw.get(key)
        if not isinstance(values, list) or len(values) > limit or (key == "segments" and not values):
            issues.append(f"{key} must be an explicit list within its limit")
    if "visual_overrides" in raw and (not isinstance(raw["visual_overrides"], list) or len(raw["visual_overrides"]) > 500):
        issues.append("visual_overrides must be a bounded explicit list")
    floats = non_integers(raw)
    if floats:
        issues.append("milliseconds and pixels must be integers: " + ", ".join(floats[:10]))
    if issues:
        return {"status": "invalid", "timeline": None, "revision": None, "issues": issues}

    def crop_ok(source, name):
        crop = source.get("crop")
        if crop is not None and not isinstance(crop, dict):
            issues.append(f"{name}: crop must be an object")
            return
        scale_x = (crop or {}).get("scale_x", source.get("scale_x"))
        scale_y = (crop or {}).get("scale_y", source.get("scale_y"))
        if crop is None and scale_x is None and scale_y is None:
            return
        if crop is not None and (not all(is_px(crop.get(k)) for k in INTEGER_KEYS) or crop["w"] <= 0 or crop["h"] <= 0):
            issues.append(f"{name}: crop needs integer source pixels x, y, w and h")
            return
        if not is_number(scale_x) or not is_number(scale_y) or scale_x <= 0 or scale_y <= 0:
            issues.append(f"{name}: crop needs positive scale_x and scale_y")
        elif abs(scale_x / scale_y - 1) > MAX_STRETCH:
            issues.append(f"{name}: uneven stretch (scale_x/scale_y {scale_x / scale_y:.3f}); keep people and products in proportion")
        elif crop is not None:
            # The source size is not in the timeline, but the crop's far edge bounds it from below,
            # so this is the smallest zoom the crop can be. The assembler checks the exact zoom.
            least = min((crop["x"] + crop["w"]) / crop["w"], (crop["y"] + crop["h"]) / crop["h"])
            if least > MAX_ZOOM + 1e-9:
                issues.append(f"{name}: crop zooms in at least {least:.2f}x, over the {MAX_ZOOM}x zoom limit; use a wider crop or new coverage")

    def source_ok(source, name):
        valid = (isinstance(source, dict) and is_text(source.get("asset_id")) and is_hash(source.get("sha256"))
                 and is_ms(source.get("in_ms")) and is_ms(source.get("out_ms"))
                 and source["out_ms"] > source["in_ms"] and is_number(source.get("speed"))
                 and 0.25 <= source["speed"] <= 4)
        if not valid:
            issues.append(f"{name}: exact asset, hash, bounds and supported speed required")
        else:
            crop_ok(source, name)
        return valid

    def range_ok(item, name):
        valid = (isinstance(item, dict) and is_ms(item.get("start_ms")) and is_ms(item.get("end_ms"))
                 and 0 <= item["start_ms"] < item["end_ms"] <= duration)
        if not valid:
            issues.append(f"{name}: invalid final bounds")
        return valid

    identifiers = set()
    for segment in raw["segments"]:
        if not isinstance(segment, dict):
            issues.append("segment must be an object")
            continue
        name = segment.get("id")
        if not is_text(name) or name in identifiers or not is_text(segment.get("scene_id")):
            issues.append("segment ids must be unique and scene_id required")
        if is_text(name):
            identifiers.add(name)
        if not is_text(segment.get("speech_mode")) or segment.get("speech_mode") not in SPEECH_MODES or not isinstance(segment.get("depicts_speech"), bool) or segment.get("native_audio") not in ("preserve", "muted"):
            issues.append(f"{name}: explicit speech and native audio decisions required")
        if range_ok(segment, name) and source_ok(segment.get("video"), name):
            source = segment["video"]
            if abs((source["out_ms"] - source["in_ms"]) / source["speed"] - (segment["end_ms"] - segment["start_ms"])) > 1:
                issues.append(f"{name}: picture source duration/rate differs from final interval")
            if source["speed"] != 1 and not is_text(segment.get("intent")):
                issues.append(f"{name}: speed change needs intent")
        if segment.get("depicts_speech"):
            if segment.get("speech_mode") not in ("native_dialogue", "audio_driven_lipsync", "singing"):
                issues.append(f"{name}: speaking face cannot use narration-only or no-speech routing")
            if segment.get("speech_mode") == "native_dialogue" and segment.get("native_audio") != "preserve":
                issues.append(f"{name}: native dialogue may not be muted")
            if segment.get("speech_mode") == "audio_driven_lipsync" and (not source_ok(segment.get("speech_driver"), f"{name} driver") or segment["speech_driver"].get("task") != "exact_audio"):
                issues.append(f"{name}: exact driver required; voice reference is not a driver")
            elif segment.get("speech_mode") == "audio_driven_lipsync" and is_ms(segment.get("start_ms")) and is_ms(segment.get("end_ms")):
                driver = segment["speech_driver"]
                if abs((driver["out_ms"] - driver["in_ms"]) / driver["speed"] - (segment["end_ms"] - segment["start_ms"])) > 1:
                    issues.append(f"{name}: driver window/rate differs from speaking picture")
                if isinstance(segment.get("video"), dict) and segment["video"].get("speed") != driver["speed"]:
                    issues.append(f"{name}: a speaking segment may change speed only when its picture and audio change together")
    identifiers.clear()
    for cue in raw["audio_cues"]:
        if not isinstance(cue, dict):
            issues.append("audio cue must be an object")
            continue
        name = cue.get("id")
        if not is_text(name) or name in identifiers:
            issues.append("cue ids must be unique")
        if is_text(name):
            identifiers.add(name)
        if not is_text(cue.get("role")) or cue.get("role") not in AUDIO_ROLES:
            issues.append(f"{name}: unknown audio role")
        if not is_number(cue.get("gain_db")) or not -80 <= cue["gain_db"] <= 24 or not isinstance(cue.get("loop"), bool):
            issues.append(f"{name}: explicit supported gain and loop decision required")
        if range_ok(cue, name) and source_ok(cue.get("source"), name):
            source = cue["source"]
            if not cue.get("loop") and abs((source["out_ms"] - source["in_ms"]) / source["speed"] - (cue["end_ms"] - cue["start_ms"])) > 1:
                issues.append(f"{name}: audio source clock differs from final interval")
            if (cue.get("loop") or source["speed"] != 1) and not is_text(cue.get("intent")):
                issues.append(f"{name}: looping/retiming needs intent")
            if cue.get("loop") and is_text(cue.get("role")) and cue.get("role") in SPEECH_ROLES:
                issues.append(f"{name}: speech cannot loop to fill a scene")
    for cue_id in raw["required_cue_ids"]:
        if not is_text(cue_id) or cue_id not in identifiers:
            issues.append("a required cue is missing or invalid")
    for pause in raw["pauses"]:
        if not range_ok(pause, "pause") or not is_text(pause.get("reason")) or pause.get("scope") not in ("speech", "all_audio"):
            issues.append("every pause needs its range, scope and reason")
        elif pause["end_ms"] - pause["start_ms"] > MAX_PAUSE_MS:
            issues.append(f"pause {pause['start_ms']}–{pause['end_ms']}ms is over {MAX_PAUSE_MS} ms; cut the gap or move speech instead")
    if is_ms(duration) and all(isinstance(p, dict) and is_ms(p.get("start_ms")) and is_ms(p.get("end_ms")) for p in raw["pauses"]):
        if union_ms(raw["pauses"]) > MAX_PAUSE_SHARE * duration:
            issues.append(f"planned pauses total {union_ms(raw['pauses'])} ms, over {round(MAX_PAUSE_SHARE * 100)}% of the duration")
    for override in raw.get("visual_overrides", []):
        if not range_ok(override, "visual override") or not is_text(override.get("reason")) or override.get("kind") not in ("freeze", "transition"):
            issues.append("visual overrides need bounds, kind and reason")
        elif override["kind"] == "freeze" and not source_ok(override.get("source"), "freeze frame"):
            issues.append("freeze requires its exact source")
        elif override["kind"] == "freeze" and override["end_ms"] - override["start_ms"] > freeze_cap_ms(override["end_ms"], duration):
            cap = freeze_cap_ms(override["end_ms"], duration)
            issues.append(f"freeze {override['start_ms']}–{override['end_ms']}ms is over {cap} ms"
                          + ("" if cap == MAX_END_FREEZE_MS else f"; only a hold that ends the video may last {MAX_END_FREEZE_MS} ms"))
        elif override["kind"] == "transition" and (not isinstance(override.get("segment_ids"), list) or len(override["segment_ids"]) < 2 or any(not any(s.get("id") == name for s in raw["segments"] if isinstance(s, dict)) for name in override["segment_ids"])):
            issues.append("transition must name its source segments")
    if issues:
        return {"status": "invalid", "timeline": None, "revision": None, "issues": issues}
    if gaps(raw["segments"] + raw.get("visual_overrides", []), duration):
        issues.append("Picture has undeclared padding or missing source coverage")
    for index, left in enumerate(raw["segments"]):
        for right in raw["segments"][index + 1:]:
            start, end = max(left["start_ms"], right["start_ms"]), min(left["end_ms"], right["end_ms"])
            if end > start + 1 and not any(v["kind"] == "transition" and v["start_ms"] <= start and v["end_ms"] >= end and left["id"] in v.get("segment_ids", []) and right["id"] in v.get("segment_ids", []) for v in raw.get("visual_overrides", [])):
                issues.append(f"{left['id']}/{right['id']}: picture overlap needs a declared transition")
    ordered = sorted(raw["segments"], key=lambda s: (s["start_ms"], s["end_ms"]))
    for index, later in enumerate(ordered):
        for earlier in ordered[:max(0, index - 1)]:
            a, b = earlier["video"], later["video"]
            if (a["sha256"] == b["sha256"] and min(a["out_ms"], b["out_ms"]) > max(a["in_ms"], b["in_ms"])
                    and earlier["end_ms"] - earlier["start_ms"] > 1000 and later["end_ms"] - later["start_ms"] > 1000
                    and not str(later.get("intent", "")).startswith(CALLBACK_PREFIX)):
                issues.append(f"{later['id']}: repeats {earlier['id']}'s source picture; use new coverage or mark a deliberate repeat with intent \"{CALLBACK_PREFIX} <reason>\"")
    for segment in raw["segments"]:
        if not segment["depicts_speech"]:
            continue
        if segment["speech_mode"] == "native_dialogue":
            video = segment["video"]
            for cue in raw["audio_cues"]:
                if (cue["role"] in SPEECH_ROLES and cue["source"]["sha256"] == video["sha256"]
                        and cue["start_ms"] < segment["end_ms"] and cue["end_ms"] > segment["start_ms"]
                        and cue["source"]["speed"] != video["speed"]):
                    issues.append(f"{segment['id']}: a speaking segment may change speed only when its picture and audio change together")
                    break
        driver = segment["speech_driver"] if segment["speech_mode"] == "audio_driven_lipsync" else segment["video"]
        matching = []
        for cue in raw["audio_cues"]:
            source = cue["source"]
            if (cue["role"] in SPEECH_ROLES and source["sha256"] == driver["sha256"]
                    and source["asset_id"] == driver["asset_id"] and source["speed"] == driver["speed"] and not cue["loop"]
                    and abs(source["in_ms"] + (segment["start_ms"] - cue["start_ms"]) * source["speed"] - driver["in_ms"]) <= 1):
                start = max(segment["start_ms"], cue["start_ms"]) - segment["start_ms"]
                end = min(segment["end_ms"], cue["end_ms"]) - segment["start_ms"]
                if end > start:
                    matching.append({"start_ms": start, "end_ms": end})
        if gaps(matching, segment["end_ms"] - segment["start_ms"]):
            issues.append(f"{segment['id']}: driver audio does not cover the speaking picture on its source clock")
    silence = "intentional_silence" in modes
    for index, left in enumerate(raw["audio_cues"]):
        for right in raw["audio_cues"][index + 1:]:
            if left["role"] not in SPEECH_ROLES or right["role"] not in SPEECH_ROLES:
                continue
            start, end = max(left["start_ms"], right["start_ms"]), min(left["end_ms"], right["end_ms"])
            if end <= start + 1:
                continue
            same_source = all(left["source"][key] == right["source"][key] for key in ("sha256", "in_ms", "out_ms", "speed"))
            if same_source and left["start_ms"] == right["start_ms"] and left["end_ms"] == right["end_ms"]:
                issues.append(f"{left['id']}/{right['id']}: duplicated speech bus")
            elif not (is_text(left.get("intent")) and is_text(right.get("intent"))) and not any(v["kind"] == "transition" and v["start_ms"] <= start and v["end_ms"] >= end for v in raw.get("visual_overrides", [])):
                issues.append(f"{left['id']}/{right['id']}: overlapping speech needs intent")
    if silence and (len(modes) != 1 or raw["audio_cues"] or raw["speech_mode"] != "none"):
        issues.append("total intentional silence conflicts with sound or speech")
    for role in ("source_ambience", "music", "sfx"):
        if role in modes and not any(cue["role"] == role for cue in raw["audio_cues"]):
            issues.append(f"planned {role} has no cue")
    if not silence:
        coverage = raw["audio_cues"] + [p for p in raw["pauses"] if p["scope"] == "all_audio"]
        for gap in gaps(coverage, duration):
            issues.append(f"unplanned audio gap {gap['start_ms']}–{gap['end_ms']}ms")
    if raw["speech_mode"] == "none" and any(c["role"] in SPEECH_ROLES for c in raw["audio_cues"]):
        issues.append("No-speech intent conflicts with speech cues")
    if raw["speech_mode"] != "none":
        # Speech must cover every segment that plans speech; segments planned
        # as speech_mode none (B-roll under music, an end card) need none.
        speech_coverage = [c for c in raw["audio_cues"] if c["role"] in SPEECH_ROLES] + raw["pauses"]
        for segment in ordered:
            if segment["speech_mode"] == "none":
                continue
            inside = [{"start_ms": max(i["start_ms"], segment["start_ms"]) - segment["start_ms"],
                       "end_ms": min(i["end_ms"], segment["end_ms"]) - segment["start_ms"]}
                      for i in speech_coverage if i["end_ms"] > segment["start_ms"] and i["start_ms"] < segment["end_ms"]]
            for gap in gaps(inside, segment["end_ms"] - segment["start_ms"]):
                issues.append(f"unplanned speech gap {gap['start_ms'] + segment['start_ms']}–{gap['end_ms'] + segment['start_ms']}ms in {segment['id']}; music does not replace speech intent")
    return {"status": "invalid" if issues else "complete", "timeline": raw,
            "revision": timeline_revision(raw), "issues": issues}
