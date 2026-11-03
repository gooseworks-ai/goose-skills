#!/usr/bin/env python3
"""Free deterministic text-only ads: approved copy, timing, font, colors and CTA."""
import argparse
import json
import math
import pathlib
import subprocess
from PIL import Image, ImageDraw, ImageFont

ANIMATIONS = ("punch", "typewriter", "rise")
FONT_CANDIDATES = ["/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                   "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "C:/Windows/Fonts/arialbd.ttf"]


def layout(cfg):
    W,H = cfg.get("size", [1080,1920])
    fps = cfg.get("fps",30)
    if not all(isinstance(v,int) for v in (W,H,fps)) or min(W,H)<160 or W%2 or H%2 or not 10<=fps<=60:
        raise ValueError("use even dimensions >=160 and integer fps 10–60")
    fp = cfg.get("font", "auto")
    if fp == "auto":
        fp = next((p for p in FONT_CANDIDATES if pathlib.Path(p).is_file()), None)
    if not fp or not pathlib.Path(fp).is_file():
        raise ValueError("supply a readable font file")
    beats = cfg.get("beats") or []
    if not beats or not cfg.get("cta"):
        raise ValueError("supply text beats and a final CTA")
    beats = [dict(b) for b in beats]+[dict(cfg["cta"], role="cta")]
    cursor=0
    for b in beats:
        dur=b.get("duration_s",2.5)
        if not isinstance(dur,(float,int)) or not math.isfinite(dur) or not 1.5<=dur<=10:
            raise ValueError("each text beat must hold 1.5–10s")
        if b.get("animation", "punch") not in ANIMATIONS:
            raise ValueError("unsupported text animation")
        if b.get("role") == "cta" and dur < 3:
            raise ValueError("CTA must hold at least three seconds")
        text=b.get("text", "").strip()
        if not text:
            raise ValueError("text cannot be blank")
        px=round(W*.1)
        f=ImageFont.truetype(fp,px)
        # Wrap without shrinking below the readable default.
        words=text.split(); lines=[""]
        for word in words:
            if f.getlength(word) > W*.78:
                raise ValueError("unbreakable word is too wide; shorten copy")
            candidate=(lines[-1]+" "+word).strip()
            if f.getlength(candidate)<=W*.78: lines[-1]=candidate
            else: lines.append(word)
        if len(lines)>5 or len(lines)*round(px*1.3)>H*.60:
            raise ValueError("too much copy; split it into another beat")
        b.update(lines=lines,font=f,px=px,start=cursor,end=cursor+dur)
        cursor+=dur
    for key in ("background", "color", "accent"):
        Image.new("RGB",(1,1),cfg.get(key, {"background":"#141720","color":"#f5f2eb","accent":"#b7f76b"}[key]))
    return W,H,fps,beats


def frame(cfg, prepared, t):
    W,H,_,beats=prepared
    b=next((b for b in beats if b["start"]<=t<b["end"]),beats[-1])
    local=max(0,t-b["start"])
    p=min(1,local/.32)
    ease=1-(1-p)**3
    im=Image.new("RGB",(W,H),cfg.get("background","#141720"))
    d=ImageDraw.Draw(im)
    lines=b["lines"]
    anim=b.get("animation","punch")
    scale=.86+.14*ease if anim=="punch" else 1
    f=ImageFont.truetype(b["font"].path,max(1,round(b["px"]*scale)))
    shown="\n".join(lines)
    if anim=="typewriter":
        shown=shown[:max(1,math.ceil(len(shown)*min(1,local/.7)))]
    pitch=round(b["px"]*1.3)
    top=H*.5-(len(lines)*pitch)/2
    if anim=="rise": top+=W*.06*(1-ease)
    color=cfg.get("accent","#b7f76b") if b.get("role")=="cta" else cfg.get("color","#f5f2eb")
    for i,line in enumerate(shown.split("\n")):
        d.text((W/2,top+i*pitch),line,font=f,fill=color,anchor="mt")
    # Progress is presentation only, kept inside the 4:5 safe crop.
    d.rounded_rectangle((W*.12,H*.79,W*(.12+.76*min(1,(t+.001)/beats[-1]["end"])),H*.79+max(2,W*.008)),radius=3,fill=cfg.get("accent","#b7f76b"))
    return im


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--config",required=True)
    ap.add_argument("--out",required=True)
    ap.add_argument("--preview",help="save a contact sheet")
    a=ap.parse_args()
    cfg=json.loads(pathlib.Path(a.config).read_text())
    prepared=layout(cfg)
    W,H,fps,beats=prepared
    duration=beats[-1]["end"]
    frames=math.ceil(duration*fps)
    pathlib.Path(a.out).parent.mkdir(parents=True,exist_ok=True)
    p=subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(fps),"-i","-","-an","-c:v","libx264","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",a.out],stdin=subprocess.PIPE)
    try:
        for k in range(frames): p.stdin.write(frame(cfg,prepared,k/fps).tobytes())
    finally: p.stdin.close()
    if p.wait(): raise RuntimeError("text render failed")
    if a.preview:
        tw=270; th=round(tw*H/W)
        sheet=Image.new("RGB",(tw*len(beats),th))
        for i,b in enumerate(beats): sheet.paste(frame(cfg,prepared,(b["start"]+b["end"])/2).resize((tw,th)),(i*tw,0))
        sheet.save(a.preview)
    pathlib.Path(a.out+".json").write_text(json.dumps({"status":"rendered","duration":frames/fps,"size":[W,H],"fps":fps,"frames":frames,"audio":"none; optional supplied audio must be reviewed separately","generation_calls":0},indent=2))
    print(f"text ad {frames/fps:.3f}s -> {a.out}")

if __name__ == "__main__": main()
