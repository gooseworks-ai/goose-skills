"""Measured text wrapping and shared cascade geometry. No silent text truncation."""
import hashlib
import json

W, BODY_W, SIDE, PAD = 1080, 810, 135, 60
TEXT_X, TEXT_RIGHT = 283, 919


def wrap(text, font, width, max_lines):
    words = text.split()
    if not words:
        return [""]
    lines = [""]
    for word in words:
        if font.getlength(word) > width:
            raise ValueError("word does not fit; shorten the notification text")
        candidate = (lines[-1] + " " + word).strip()
        if font.getlength(candidate) <= width:
            lines[-1] = candidate
        else:
            lines.append(word)
    if len(lines) > max_lines:
        raise ValueError(f"text needs {len(lines)} lines; maximum is {max_lines}; shorten the copy")
    return lines


def signature(cfg):
    return hashlib.sha256(json.dumps(cfg, sort_keys=True).encode()).hexdigest()


def geometry(cfg, body_font):
    notifs = cfg.get("notifications") or []
    if not 1 <= len(notifs) <= 5:
        raise ValueError("use 1–5 notifications")
    all_notifs = notifs + ([cfg["resolution"]] if cfg.get("resolution") else [])
    lines = [wrap(n["body"], body_font, TEXT_RIGHT - TEXT_X, 2) for n in all_notifs]
    height = 176 + 44 * (max(map(len, lines)) - 1)
    pitch = height + 38
    bottom_y = 1436 - PAD - height
    if bottom_y - pitch * (len(notifs) - 1) - 70 < 220:
        raise ValueError("stack exceeds the safe area; use fewer notifications or one-line copy")
    return {"config_sha256": signature(cfg), "banner_height": height,
            "row_pitch": pitch, "bottom_y": bottom_y, "body_lines": lines}


def timing(cfg):
    n = len(cfg["notifications"])
    tm = cfg.get("timing") or {}
    arrivals = tm.get("arrivals") or [round(1.6 + 2*i, 2) for i in range(n)]
    if len(arrivals) != n or any(t < 0 for t in arrivals) or any(b-a < .7 for a,b in zip(arrivals, arrivals[1:])):
        raise ValueError("arrival times must increase with at least 0.7s between them")
    clear = tm.get("clear", round(arrivals[-1] + 1.6, 2))
    if clear < arrivals[-1] + 1:
        raise ValueError("hold the last notification for at least one second")
    res = cfg.get("resolution")
    at = res.get("at", round(clear + .7, 2)) if res else None
    hold = res.get("hold_s", 2.0) if res else None
    if res and (at < clear + .4 or hold < 1.5):
        raise ValueError("resolution must follow the clear and hold at least 1.5 seconds")
    ec = tm.get("endcard_in", round(at + hold, 2) if res else round(clear + .7, 2))
    duration = tm.get("duration", round(ec + 4.1, 2))
    if ec < (at + hold if res else clear + .4) or duration < ec + 3:
        raise ValueError("end-card timing is too short or overlaps the resolution")
    return arrivals, clear, at, ec, duration
