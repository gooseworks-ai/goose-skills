#!/usr/bin/env python3
"""Build the comparison-grid hyperframe HTML from a config.json.

Usage:
  python3 build_composition.py --config /path/to/config.json --output /path/to/hyperframe.html

Config schema (see config.example.json):
  canvas        {width, height, fps}         default 1280x720 @ 30
  beat_seconds  float                        default 4.5
  cell_aspect   "W:H" of each grid cell      default "3:4"
  columns       [{label}]                    2-4 columns; label renders under every cell
  beats         [{tag, prompt, cells:[path]}] one cell path per column, per beat.
                Cell media type is inferred from the extension:
                  .png/.jpg/.jpeg/.webp -> image
                  .mp4/.mov/.webm/.m4v  -> video (muted, loops during the hold,
                                           frame-seeked deterministically)
  endcard       {headline, subline, seconds} keep minimal - no meta-stats line
  timing        {prompt_in, prompt_out, panel_in, panel_stagger, panel_anim,
                 fade_out_start}             all optional, defaults = shipped v3

The output HTML exposes:
  window.mediaReady()  -> Promise; resolves when all <video> metadata is loaded
  window.renderAt(t)   -> Promise; paints frame at time t (awaits video seeks)
Render with scripts/render_seekable_hyperframe.py (awaits both).
"""
import argparse
import json
import os
from pathlib import Path

VIDEO_EXT = {".mp4", ".mov", ".webm", ".m4v"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".webp"}

TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: __W__px; height: __H__px; overflow: hidden; background: #0a0a0a; }
  #stage { position: relative; width: __W__px; height: __H__px; background: #0a0a0a;
           font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; }
  .beat { position: absolute; inset: 0; opacity: 0; }
  .eyebrow { position: absolute; top: __EYEBROW_TOP__px; width: 100%; text-align: center;
             font-size: 15px; letter-spacing: 4px; color: #8a8a8a; font-weight: 600; }
  .prompt-big { position: absolute; top: __PROMPT_TOP__px; left: 50%; transform: translateX(-50%);
                width: __PROMPT_W__px; text-align: center;
                font-family: "SF Mono", Menlo, monospace; font-size: 24px; line-height: 1.55;
                color: #e8e8e8; }
  .prompt-top { position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
                width: __TOPSTRIP_W__px; text-align: center;
                font-family: "SF Mono", Menlo, monospace; font-size: 15px; line-height: 1.5;
                color: #b9b9b9; opacity: 0; }
  .beat-tag { position: absolute; top: 88px; width: 100%; text-align: center;
              font-size: 12px; letter-spacing: 3px; color: #6f6f6f; font-weight: 600; opacity: 0; }
  .row { position: absolute; top: __ROW_TOP__px; left: 0; width: __W__px;
         display: flex; justify-content: center; gap: __GAP__px; }
  .panel { width: __CELL_W__px; opacity: 0; }
  .panel .media { width: __CELL_W__px; height: __CELL_H__px; object-fit: cover;
                  border-radius: 6px; display: block; background: #111; }
  .panel .label { margin-top: 12px; text-align: center; font-size: 13px;
                  letter-spacing: 2.5px; color: #9a9a9a; font-weight: 600; }
  #endcard { position: absolute; inset: 0; opacity: 0; background: #0a0a0a; }
  #endcard .l1 { position: absolute; top: __EC1_TOP__px; width: 100%; text-align: center;
                 font-size: 46px; font-weight: 700; color: #f2f2f2; letter-spacing: -0.5px; opacity: 0; }
  #endcard .l2 { position: absolute; top: __EC2_TOP__px; width: 100%; text-align: center;
                 font-size: 19px; color: #a8a8a8; letter-spacing: 2px; opacity: 0; }
</style>
</head>
<body>
<div id="stage"></div>
<script>
const CFG = __CFG_JSON__;
const T = CFG.timing;
const BEAT_DUR = CFG.beat_seconds;
const END_START = CFG.beats.length * BEAT_DUR;

const stage = document.getElementById("stage");
CFG.beats.forEach((b, bi) => {
  const beat = document.createElement("div");
  beat.className = "beat"; beat.id = "beat" + bi;
  const cells = b.cells.map((c, ci) => {
    const media = c.is_video
      ? `<video class="media" src="${c.src}" muted preload="auto"></video>`
      : `<img class="media" src="${c.src}">`;
    return `<div class="panel" id="p${bi}-${ci}">${media}
      <div class="label">${CFG.columns[ci].label}</div></div>`;
  }).join("");
  beat.innerHTML = `
    <div class="eyebrow">PROMPT</div>
    <div class="prompt-big">${b.prompt}</div>
    <div class="prompt-top">${b.prompt}</div>
    <div class="beat-tag">${b.tag}</div>
    <div class="row">${cells}</div>`;
  stage.appendChild(beat);
});
const endcard = document.createElement("div");
endcard.id = "endcard";
endcard.innerHTML = `
  <div class="l1">${CFG.endcard.headline}</div>
  <div class="l2">${CFG.endcard.subline}</div>`;
stage.appendChild(endcard);

const clamp01 = x => Math.max(0, Math.min(1, x));
const easeOut = x => 1 - Math.pow(1 - x, 3);

window.mediaReady = function () {
  const vids = Array.from(document.querySelectorAll("video"));
  const imgs = Array.from(document.querySelectorAll("img"));
  return Promise.all([
    ...vids.map(v => v.readyState >= 2 ? Promise.resolve()
      : new Promise(res => v.addEventListener("loadeddata", res, { once: true }))),
    ...imgs.map(im => im.complete ? Promise.resolve()
      : new Promise(res => im.addEventListener("load", res, { once: true }))),
  ]);
};

function seekVideo(v, t) {
  const dur = v.duration && isFinite(v.duration) ? v.duration : 0;
  const target = dur > 0 ? Math.max(0, t) % dur : 0;
  if (Math.abs(v.currentTime - target) < 1 / 120) return Promise.resolve();
  return new Promise(res => {
    v.addEventListener("seeked", res, { once: true });
    v.currentTime = target;
  });
}

window.renderAt = function (t) {
  const waits = [];
  CFG.beats.forEach((b, bi) => {
    const el = document.getElementById("beat" + bi);
    const tb = t - bi * BEAT_DUR;
    if (tb < -0.001 || tb > BEAT_DUR + 0.001) { el.style.opacity = 0; return; }

    let op = 1;
    if (bi > 0) op = Math.min(op, clamp01(tb / 0.25));
    op = Math.min(op, 1 - clamp01((tb - T.fade_out_start) / (BEAT_DUR - T.fade_out_start)));
    el.style.opacity = op;

    const bigIn = easeOut(clamp01(tb / T.prompt_in));
    const bigOut = clamp01((tb - T.prompt_out) / 0.3);
    const big = el.querySelector(".prompt-big");
    big.style.opacity = bigIn * (1 - bigOut);
    big.style.transform = `translateX(-50%) translateY(${12 * (1 - bigIn) - 26 * easeOut(bigOut)}px)`;
    el.querySelector(".eyebrow").style.opacity = bigIn * (1 - bigOut);
    el.querySelector(".prompt-top").style.opacity = 0.85 * clamp01((tb - T.panel_in) / 0.3);
    el.querySelector(".beat-tag").style.opacity = clamp01((tb - T.panel_in) / 0.3);

    b.cells.forEach((c, ci) => {
      const p = document.getElementById(`p${bi}-${ci}`);
      const start = T.panel_in + ci * T.panel_stagger;
      const k = easeOut(clamp01((tb - start) / T.panel_anim));
      p.style.opacity = k;
      p.style.transform = `translateY(${44 * (1 - k)}px) scale(${0.96 + 0.04 * k})`;
      if (c.is_video) waits.push(seekVideo(p.querySelector("video"), tb - start));
    });
  });

  const te = t - END_START;
  endcard.style.opacity = te >= 0 ? clamp01(te / 0.3) : 0;
  if (te >= 0) {
    endcard.querySelector(".l1").style.opacity = clamp01((te - 0.15) / 0.35);
    endcard.querySelector(".l2").style.opacity = clamp01((te - 0.45) / 0.35);
    const k = easeOut(clamp01((te - 0.15) / 0.5));
    endcard.querySelector(".l1").style.transform = `translateY(${14 * (1 - k)}px)`;
  }
  return Promise.all(waits);
};
window.renderAt(0);
</script>
</body>
</html>
"""

DEFAULT_TIMING = {"prompt_in": 0.35, "prompt_out": 1.15, "panel_in": 1.3,
                  "panel_stagger": 0.15, "panel_anim": 0.38, "fade_out_start": 4.2}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--output", required=True)
    args = ap.parse_args()

    cfg = json.loads(Path(args.config).read_text())
    canvas = cfg.get("canvas", {})
    W, H = canvas.get("width", 1280), canvas.get("height", 720)
    cfg["beat_seconds"] = cfg.get("beat_seconds", 4.5)
    cfg["timing"] = {**DEFAULT_TIMING, **cfg.get("timing", {})}
    ncols = len(cfg["columns"])
    assert 2 <= ncols <= 4, "columns must be 2-4"

    aw, ah = (int(x) for x in cfg.get("cell_aspect", "3:4").split(":"))
    gap, margin = 26, 60
    cell_h = round(H * 0.622)
    cell_w = round(cell_h * aw / ah)
    max_w = (W - 2 * margin - (ncols - 1) * gap) // ncols
    if cell_w > max_w:
        cell_w = max_w
        cell_h = round(cell_w * ah / aw)
    row_top = round(H * 0.17)

    out_dir = Path(args.output).resolve().parent
    for b in cfg["beats"]:
        assert len(b["cells"]) == ncols, f"beat '{b.get('tag')}' needs {ncols} cells"
        resolved = []
        for c in b["cells"]:
            p = Path(c)
            if not p.is_absolute():
                p = (Path(args.config).resolve().parent / p)
            assert p.exists(), f"cell media missing: {p}"
            ext = p.suffix.lower()
            assert ext in VIDEO_EXT | IMAGE_EXT, f"unsupported media: {p}"
            resolved.append({"src": os.path.relpath(p, out_dir), "is_video": ext in VIDEO_EXT})
        b["cells"] = resolved

    html = (TEMPLATE
            .replace("__W__", str(W)).replace("__H__", str(H))
            .replace("__EYEBROW_TOP__", str(round(H * 0.35)))
            .replace("__PROMPT_TOP__", str(round(H * 0.417)))
            .replace("__PROMPT_W__", str(round(W * 0.72)))
            .replace("__TOPSTRIP_W__", str(round(W * 0.84)))
            .replace("__ROW_TOP__", str(row_top))
            .replace("__GAP__", str(gap))
            .replace("__CELL_W__", str(cell_w)).replace("__CELL_H__", str(cell_h))
            .replace("__EC1_TOP__", str(round(H * 0.372)))
            .replace("__EC2_TOP__", str(round(H * 0.483)))
            .replace("__CFG_JSON__", json.dumps(cfg)))
    Path(args.output).write_text(html)

    total = len(cfg["beats"]) * cfg["beat_seconds"] + cfg["endcard"].get("seconds", 2.5)
    print(f"Wrote {args.output}")
    print(f"Total duration: {total:.1f}s  ({len(cfg['beats'])} beats x {cfg['beat_seconds']}s "
          f"+ {cfg['endcard'].get('seconds', 2.5)}s end card)  cells {cell_w}x{cell_h}")


if __name__ == "__main__":
    main()
