#!/usr/bin/env python3
"""Build a seekable, single-shape brand film from a brand-bound JSON config."""
import argparse
import base64
import json
import re
from pathlib import Path


def data_uri(path, mime):
    p = Path(path)
    raw = p.read_bytes()
    if raw.startswith(b"version https://git-lfs.github.com/spec/"):
        raise ValueError(f"Asset is an LFS pointer: {p}")
    return f"data:{mime};base64," + base64.b64encode(raw).decode()


def build(config_path, output, ratio="9:16", loop=False, fps=30):
    config_path = Path(config_path).resolve()
    cfg = json.loads(config_path.read_text())
    for field in ("brand", "cta", "url", "logo", "font", "palette", "states"):
        if not cfg.get(field):
            raise ValueError(f"Missing required config: {field}")
    states = cfg["states"]
    if not 4 <= len(states) <= 12:
        raise ValueError("Provide 4–12 states")
    if states[0].get("kind") != "button":
        raise ValueError("The opening state must be a button")
    for state in states:
        if not state.get("title") or len(state["title"]) > 54:
            raise ValueError("Each state needs a title of at most 54 characters")
        if state.get("kind") not in {"button", "brief", "brain", "ads", "photos", "social", "library", "cta"}:
            raise ValueError(f"Unsupported state kind: {state.get('kind')}")
        if len(state.get("items", [])) > 3 or any(len(s) > 24 for s in state.get("items", [])):
            raise ValueError("At most three short items per state")
    if states[-1]["kind"] != "cta":
        raise ValueError("The final state must be a CTA")
    colors = cfg["palette"]
    for name in ("paper", "ink", "accent", "muted"):
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", colors.get(name, "")):
            raise ValueError(f"Invalid palette color: {name}")
    bpm = float(cfg.get("bpm", 120))
    if not 80 <= bpm <= 160:
        raise ValueError("BPM must be between 80 and 160")
    cfg.update(palette=colors, loop=loop, ratio=ratio, fps=fps, beat_seconds=240 / bpm)
    cfg["logo"] = data_uri(config_path.parent / cfg["logo"], "image/png")
    cfg["font"] = data_uri(config_path.parent / cfg["font"], "font/woff2")
    # Escaping prevents user-provided strings closing the JSON script element.
    payload = json.dumps(cfg, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    template = Path(__file__).with_name("composition.html").read_text()
    result = template.replace("__CONFIG__", payload)
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_text(result)
    print(json.dumps({"html": str(output), "duration": len(states) * cfg["beat_seconds"], "ratio": ratio, "loop": loop}))


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--config", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--ratio", choices=["9:16", "1:1"], default="9:16")
    p.add_argument("--loop", action="store_true")
    a = p.parse_args()
    build(a.config, a.output, a.ratio, a.loop)
