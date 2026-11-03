"""Portable assembly intent and clock checks; never an audiovisual verdict."""
from pathlib import Path
import sys

_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
# Constants and helpers are re-exported: the other scripts and the tests import them from here.
from timeline_rules import (AUDIO_ROLES, CALLBACK_EVERY_MS, CALLBACK_PREFIX, FORMAT, INTEGER_KEYS, MAX_END_FREEZE_MS,  # noqa: E402,F401
                            MAX_FREEZE_MS, MAX_PAUSE_MS, MAX_PAUSE_SHARE, MAX_STRETCH, MAX_UPSCALE, MAX_UPSCALED_ZOOM, MAX_ZOOM,
                            SOUNDTRACK_MODES, SPEECH_MODES, SPEECH_ROLES, freeze_cap_ms, gaps, is_hash, is_ms, is_number, is_px,
                            is_text, names_callback, non_integers, portable, relation_issues, timeline_revision, union_ms,
                            zoom_factor)


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
    issues += relation_issues(raw, duration, modes)
    return {"status": "invalid" if issues else "complete", "timeline": raw,
            "revision": timeline_revision(raw), "issues": issues}
