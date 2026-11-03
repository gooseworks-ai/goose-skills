#!/usr/bin/env python3
"""
IG-Live social-proof gallery — deterministic renderer (free, no paid calls).

Each hero product still is the "live video" inside an Instagram-Live stream card:
gradient scrims top/bottom, IG gradient-ring avatar + username + LIVE badge + viewer
count + X up top; a short live-comment feed + "Add a comment…" (kept EMPTY) + reaction
icons at the bottom; and reaction hearts floating up the right edge. A benefit sentence
builds one short phrase per slide as the top overlay. Closes on a clean logo card that
carries the payoff line + CTA.

Claims-safe: only live-stream chrome (LIVE, viewer count, a short comment feed, hearts)
+ an always-EMPTY comment input. Comments must be brand-approved / claim-free vibe words
(no efficacy/result/medical claims, no invented named customers). NO emoji (PIL can't
render Apple Color Emoji).

Usage:
  python3 build.py --config config.json --assets <dir> --out master-silent.mp4
  python3 build.py --config config.json --assets <dir> --stills <dir>   # 1 still per slide

Renders WxH @ fps with PIL, encodes a silent H.264 master with ffmpeg. Music is a
separate paid capability (create-music-elevenlabs) muxed on afterward.
"""
import os, sys, math, json, argparse, subprocess, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageChops

# ---------------------------------------------------------------- config
ap = argparse.ArgumentParser()
ap.add_argument("--config", required=True)
ap.add_argument("--assets", default=None, help="dir holding product stills + logo (default: config dir)")
ap.add_argument("--out", default="master-silent.mp4")
ap.add_argument("--work", default=None, help="scratch dir (default: alongside --out)")
ap.add_argument("--stills", default=None, help="dump one still per slide to this dir instead of rendering")
A = ap.parse_args()
CFG = json.loads(Path(A.config).read_text())
SRC = Path(A.assets) if A.assets else Path(A.config).resolve().parent
WORK = Path(A.work) if A.work else Path(A.out).resolve().parent / "_work"
FRAMES = WORK / "frames"; FRAMES.mkdir(parents=True, exist_ok=True)
CARD_DIR = WORK / "cards"; CARD_DIR.mkdir(parents=True, exist_ok=True)

W   = CFG.get("width", 1080)
H   = CFG.get("height", 1920)
FPS = CFG.get("fps", 30)
SLIDE_DUR  = CFG.get("slide_dur", 3.4)
END_DUR    = CFG.get("endcard_dur", 3.8)
XF         = CFG.get("crossfade", 0.35)

def _c(key, default):
    v = CFG.get("palette", {}).get(key)
    return tuple(v) if v else default
INK      = _c("ink", (26,24,25))
CARD_BG  = (255,255,255)
PROD_BG  = _c("prod_bg", (247,247,247))
PINK     = _c("pink", (240,122,158))
PINK_HI  = _c("pink_hi", (250,176,197))
PINK_BG  = _c("pink_bg", (252,230,233))
PLUM     = _c("plum", (58,20,34))
RED      = _c("red", (233,0,47))
LIVE_RED = _c("live_red", (237,28,76))
WHITE    = (255,255,255)
IG_RING  = [(254,218,117),(250,126,30),(214,41,118),(150,47,191),(79,91,213)]

# ---------------------------------------------------------------- fonts (cross-platform)
def _pick(paths):
    for p in paths:
        if os.path.exists(p): return p
    return None
_BOLD = _pick(["/System/Library/Fonts/Supplemental/Arial Bold.ttf",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
               "/Library/Fonts/Arial Bold.ttf"])
_MED  = _pick(["/System/Library/Fonts/HelveticaNeue.ttc",
               "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
               "/System/Library/Fonts/Supplemental/Arial.ttf"])
def f_med(s):  return ImageFont.truetype(_MED, s, index=0) if _MED else ImageFont.load_default()
def f_title(s):return f_med(s)
def f_bold(s): return ImageFont.truetype(_BOLD, s) if _BOLD else ImageFont.load_default()

# ---------------------------------------------------------------- geometry
MX = 60
CARD_X = MX
CARD_W = W - 2*MX
CARD_Y = 300
CARD_H = 1392
RADIUS = 56
BODY_W, BODY_H = CARD_W, CARD_H

# ---------------------------------------------------------------- hero prep
def prep_hero(src_path, out_path):
    import numpy as np
    im = Image.open(src_path).convert("RGB")
    L = np.asarray(im.convert("L"))
    m = L < 246
    ys, xs = np.where(m)
    if len(xs)==0:
        im.resize((BODY_W,BODY_H),Image.LANCZOS).save(out_path); return
    x0,x1,y0,y1 = int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max())
    band_y1 = y0 + max(1,int(0.50*(y1-y0)))            # top half only → above base shadow
    bcols = np.where(m[y0:band_y1,:].any(axis=0))[0]
    hx0,hx1 = int(bcols.min()), int(bcols.max())
    pcx = (hx0+hx1)/2.0; pcy = (y0+y1)/2.0
    Wp = max(1, hx1-hx0); Hp = max(1, y1-y0)
    pad = int(0.06*Hp)
    cx0=max(0,x0-pad); cy0=max(0,y0-pad); cx1=min(im.width,x1+pad); cy1=min(im.height,y1+pad)
    prod = im.crop((cx0,cy0,cx1,cy1))
    scale = min(BODY_W*0.62/Wp, BODY_H*0.60/Hp)
    prod = prod.resize((int(prod.width*scale), int(prod.height*scale)), Image.LANCZOS)
    canvas = Image.new("RGB", (BODY_W, BODY_H), PROD_BG)
    canvas.paste(prod, (int(BODY_W*0.5-(pcx-cx0)*scale), int(BODY_H*0.47-(pcy-cy0)*scale)))
    canvas.save(out_path)

# ---------------------------------------------------------------- helpers
def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0,0,size[0]-1,size[1]-1), radius=radius, fill=255)
    return m
def vscrim(w,h,a_top,a_bot):
    col = Image.new("L",(1,h)); col.putdata([int(a_top+(a_bot-a_top)*(y/(h-1))) for y in range(h)])
    black = Image.new("RGBA",(w,h),(0,0,0,255)); black.putalpha(col.resize((w,h))); return black
def heart_png(size, color):
    S=size*4; img=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(img)
    r=S*0.27; cy=S*0.34
    d.ellipse((S*0.5-2*r,cy-r,S*0.5,cy+r),fill=color); d.ellipse((S*0.5,cy-r,S*0.5+2*r,cy+r),fill=color)
    d.polygon([(S*0.5-2*r+S*0.02,cy+r*0.45),(S*0.5+2*r-S*0.02,cy+r*0.45),(S*0.5,S*0.92)],fill=color)
    return img.resize((size,size),Image.LANCZOS)
def heart_outline(size,color):
    S=size*4; w=max(3,int(S*0.055))
    full=heart_png(size,color).resize((S,S),Image.LANCZOS); inner=heart_png(size,(0,0,0,255)).resize((S,S),Image.LANCZOS)
    sc=1-2.2*w/S; iw=int(S*sc); inner_s=inner.resize((iw,iw),Image.LANCZOS)
    mask=Image.new("RGBA",(S,S),(0,0,0,0)); mask.paste(inner_s,((S-iw)//2,(S-iw)//2),inner_s)
    ring=ImageChops.subtract(full.split()[3], mask.split()[3])
    solid=Image.new("RGBA",(S,S),color); solid.putalpha(ring); return solid.resize((size,size),Image.LANCZOS)
_hc={}
def get_heart(sz,kind):
    k=(sz,kind)
    if k not in _hc:
        _hc[k]=heart_png(sz, {"pink":PINK,"hi":PINK_HI,"red":(237,60,90)}.get(kind,WHITE))
    return _hc[k]
def ig_avatar(d_size, letter="g"):
    S=d_size*4; img=Image.new("RGBA",(S,S),(0,0,0,0)); d=ImageDraw.Draw(img)
    rw=int(S*0.055); n=120
    for i in range(n):
        t=i/n; seg=t*(len(IG_RING)-1); j=int(seg); f=seg-j
        c0=IG_RING[j]; c1=IG_RING[min(j+1,len(IG_RING)-1)]
        col=tuple(int(c0[k]+(c1[k]-c0[k])*f) for k in range(3))
        d.arc((rw//2,rw//2,S-rw//2,S-rw//2), i/n*360-90,(i+1)/n*360-90, fill=col, width=rw)
    g=int(S*0.02); d.ellipse((rw+g,rw+g,S-rw-g,S-rw-g), fill=(255,255,255,255))
    pad=int(S*0.10); d.ellipse((rw+g+pad,rw+g+pad,S-rw-g-pad,S-rw-g-pad), fill=(250,214,221,255))
    gf=f_bold(int(S*0.42)); tb=d.textbbox((0,0),letter,font=gf)
    d.text(((S-(tb[2]-tb[0]))//2-tb[0],(S-(tb[3]-tb[1]))//2-tb[1]-int(S*0.01)),letter,font=gf,fill=(150,40,70,255))
    return img.resize((d_size,d_size),Image.LANCZOS)
def eye_icon(d,cx,cy,w,col):
    d.arc((cx-w,cy-int(w*0.9),cx+w,cy+int(w*0.9)),200,340,fill=col,width=4)
    d.arc((cx-w,cy-int(w*0.9),cx+w,cy+int(w*0.9)),20,160,fill=col,width=4)
    d.ellipse((cx-6,cy-6,cx+6,cy+6),fill=col)
def paperplane(d,cx,cy,s,col):
    d.line([(cx-s,cy-int(s*0.2)),(cx+s,cy-s),(cx+int(s*0.1),cy+s),(cx-int(s*0.05),cy+int(s*0.1)),(cx-s,cy-int(s*0.2))],fill=col,width=4,joint="curve")
    d.line([(cx-s,cy-int(s*0.2)),(cx+s,cy-s)],fill=col,width=4)

# ---------------------------------------------------------------- card
_card_cache={}
def build_card(hero_path, username, viewers, comments, verified=True):
    key=(hero_path, username, viewers, tuple(map(tuple,comments)))
    if key in _card_cache: return _card_cache[key]
    base = Image.open(hero_path).convert("RGB").resize((CARD_W,CARD_H),Image.LANCZOS).convert("RGBA")
    base.alpha_composite(vscrim(CARD_W,300,150,0),(0,0))
    base.alpha_composite(vscrim(CARD_W,380,0,180),(0,CARD_H-380))
    d=ImageDraw.Draw(base)
    base.alpha_composite(ig_avatar(84, (username[:1] or "g")),(26,26))
    ux=26+84+18; fu=f_bold(38); d.text((ux,40),username,font=fu,fill=WHITE)
    uw=d.textlength(username,font=fu)
    if verified:
        vx=ux+uw+16; vy=58; d.ellipse((vx-15,vy-15,vx+15,vy+15),fill=(64,150,255))
        d.line([(vx-7,vy),(vx-2,vy+6),(vx+8,vy-6)],fill=WHITE,width=4,joint="curve")
    cxx=CARD_W-40; cyy=56; s=15
    d.line((cxx-s,cyy-s,cxx+s,cyy+s),fill=WHITE,width=5); d.line((cxx-s,cyy+s,cxx+s,cyy-s),fill=WHITE,width=5)
    fv=f_med(32); vw=d.textlength(viewers,font=fv); vpx=cxx-s-26-vw-40
    eye_icon(d,int(vpx),cyy,15,WHITE); d.text((vpx+26,cyy-20),viewers,font=fv,fill=WHITE)
    lb_w=104; lb_h=46; lb_x=vpx-26-lb_w; lb_y=cyy-lb_h//2
    d.rounded_rectangle((lb_x,lb_y,lb_x+lb_w,lb_y+lb_h),radius=12,fill=LIVE_RED)
    fl=f_bold(30); lw=d.textlength("LIVE",font=fl); d.text((lb_x+(lb_w-lw)//2,lb_y+8),"LIVE",font=fl,fill=WHITE)
    fh_=f_bold(30); fc_=f_med(30); ty=CARD_H-256
    for handle,text in comments:
        d.ellipse((30,ty-4,70,ty+36),fill=(210,210,210,235))
        d.text((42,ty+4),(handle[:1] or "?").upper(),font=f_bold(24),fill=(90,90,90))
        d.text((84,ty+2),handle,font=fh_,fill=(255,255,255))
        hw=d.textlength(handle,font=fh_); d.text((84+hw+18,ty+2),text,font=fc_,fill=(236,236,236))
        ty+=52
    bar_y=CARD_H-90; bar_h=62
    d.rounded_rectangle((30,bar_y,CARD_W-150,bar_y+bar_h),radius=bar_h//2,outline=(255,255,255,210),width=3)
    d.text((54,bar_y+16),"Add a comment…",font=f_med(30),fill=(230,230,230))
    hx=CARD_W-104; hy=bar_y+bar_h//2
    ho=heart_outline(46,WHITE); base.alpha_composite(ho,(hx-23,hy-23)); paperplane(d,CARD_W-46,hy,20,WHITE)
    base.putalpha(rounded_mask((CARD_W,CARD_H),RADIUS))
    anchor=(CARD_X+CARD_W-104, CARD_Y+bar_y+bar_h//2)
    _card_cache[key]=(base,anchor); return base,anchor

def build_bg(hero_src):
    im=Image.open(hero_src).convert("RGB")
    im=ImageOps.fit(im,(W,H),method=Image.LANCZOS,centering=(0.5,0.4)).filter(ImageFilter.GaussianBlur(60))
    im=Image.blend(im,Image.new("RGB",(W,H),(255,255,255)),0.55)
    return Image.blend(im,Image.new("RGB",(W,H),PINK_BG),0.45)

def draw_squiggle(d,cx,y,wpx,color,kind=0):
    pts=[(cx-wpx/2+wpx*i/40, y+math.sin(i/40*math.pi*(3 if kind==0 else 2)+kind)*10) for i in range(41)]
    d.line(pts,fill=color,width=7,joint="curve")

def draw_top_line(frame, phrase):
    d=ImageDraw.Draw(frame); fb=f_bold(58); words=phrase.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=fb)>W-200 and cur: lines.append(cur); cur=w
        else: cur=t
    lines.append(cur); y0=150; draw_squiggle(d,W//2+40,y0-26,150,RED,0)
    for i,ln in enumerate(lines):
        lw=d.textlength(ln,font=fb); x=(W-lw)//2; y=y0+i*70
        for ox,oy in ((-2,0),(2,0),(0,-2),(0,2)): d.text((x+ox,y+oy),ln,font=fb,fill=WHITE)
        d.text((x,y),ln,font=fb,fill=INK)

HEART_SIZES=[36,50,32,58,42,52,38]
def draw_hearts(frame,anchor,t,seed=0):
    ax,ay=anchor; rise=920; period=2.6; n=7
    for i in range(n):
        ph=(t/period+i/n+seed*0.13)%1.0; y=ay-ph*rise
        dx=math.sin(ph*math.pi*2+i)*30+(i%3-1)*12; x=ax+dx
        a=ph/0.12 if ph<0.12 else (max(0,(1-ph)/0.22) if ph>0.78 else 1.0)
        sz=HEART_SIZES[i%len(HEART_SIZES)]; kind=["pink","hi","red","pink","hi","red","pink"][i%7]
        sp=get_heart(sz,kind).copy()
        if a<1.0: sp.putalpha(sp.split()[3].point(lambda p:int(p*a)))
        frame.alpha_composite(sp,(int(x-sz/2),int(y-sz/2)))
def draw_hearts_bg(frame,t):
    rise=H+200; period=4.0; n=10
    for i in range(n):
        ph=(t/period+i/n)%1.0; y=H+80-ph*rise; x=(i*107+60)%(W-80)+40+math.sin(ph*math.pi*2+i)*30
        a=ph/0.1 if ph<0.1 else (max(0,(1-ph)/0.2) if ph>0.8 else 0.9)
        sz=[30,42,26,48][i%4]; sp=get_heart(sz,["pink","hi","pink","hi"][i%4]).copy()
        sp.putalpha(sp.split()[3].point(lambda p:int(p*a*0.85))); frame.alpha_composite(sp,(int(x-sz/2),int(y-sz/2)))

# ---------------------------------------------------------------- slides
USERNAME = CFG.get("username","brand")
VERIFIED = CFG.get("verified", True)
END = CFG.get("endcard", {})
def prep_all():
    for i,sl in enumerate(CFG["slides"]):
        out=CARD_DIR/f"card-{i}.png"; prep_hero(SRC/sl["image"], out); sl["_card"]=out

def logo_recolored(tw, color):
    logo=Image.open(SRC/END["logo"]).convert("RGBA"); logo=logo.crop(logo.split()[3].getbbox())
    th=int(logo.height*tw/logo.width); logo=logo.resize((tw,th),Image.LANCZOS)
    if END.get("logo_is_white", True):
        solid=Image.new("RGBA",logo.size,(*color,255)); solid.putalpha(logo.split()[3]); return solid,th
    return logo,th

def render_slide(sl, t):
    bg=build_bg(SRC/sl["image"]).convert("RGBA")
    card,anchor=build_card(str(sl["_card"]),USERNAME,sl.get("viewers","10k"),
                           sl.get("comments",[]),VERIFIED)
    intro=min(1.0,t/0.45); ease=1-(1-intro)**3; scale=0.95+0.05*ease
    cw,ch=int(CARD_W*scale),int(CARD_H*scale); cs=card.resize((cw,ch),Image.LANCZOS)
    bg.alpha_composite(cs,(CARD_X-(cw-CARD_W)//2, CARD_Y-(ch-CARD_H)//2+int((1-ease)*26)))
    if t>0.3: draw_hearts(bg,anchor,t-0.3,seed=CFG["slides"].index(sl))
    draw_top_line(bg,sl["phrase"]); return bg

def render_logo(t):
    bg=Image.new("RGBA",(W,H),(*PINK_BG,255)); draw_hearts_bg(bg,t); d=ImageDraw.Draw(bg)
    payoff=END.get("payoff","")
    if payoff:
        fp=f_bold(64); lw=d.textlength(payoff,font=fp)
        draw_squiggle(d,W//2+46,H//2-380-26,165,RED,0); d.text(((W-lw)//2,H//2-380),payoff,font=fp,fill=INK)
    solid,th=logo_recolored(560, PLUM)
    solid.putalpha(solid.split()[3].point(lambda p:int(p*min(1.0,t/0.5))))
    bg.alpha_composite(solid,((W-560)//2,H//2-th//2-10))
    handle=END.get("handle","")
    if handle:
        fh=f_med(48); lw=d.textlength(handle,font=fh); d.text(((W-lw)//2,H//2+th//2+34),handle,font=fh,fill=PLUM)
    cta=END.get("cta","")
    if cta:
        fc=f_med(40); lw=d.textlength(cta,font=fc); d.text(((W-lw)//2,H//2+th//2+104),cta,font=fc,fill=INK)
    return bg

# ---------------------------------------------------------------- drive
def main():
    prep_all()
    if A.stills:
        outd=Path(A.stills); outd.mkdir(parents=True,exist_ok=True)
        for i,sl in enumerate(CFG["slides"]):
            render_slide(sl,1.6).convert("RGB").save(outd/f"slide{i}.jpg",quality=90)
        render_logo(1.2).convert("RGB").save(outd/"endcard.jpg",quality=90)
        print("stills ->", outd); return
    if FRAMES.exists(): shutil.rmtree(FRAMES); FRAMES.mkdir()
    seg=[]
    for sl in CFG["slides"]:
        seg.append([render_slide(sl,fi/FPS).convert("RGB") for fi in range(int(SLIDE_DUR*FPS))])
    seg.append([render_logo(fi/FPS).convert("RGB") for fi in range(int(END_DUR*FPS))])
    xf=int(XF*FPS); written=0
    for si,frames in enumerate(seg):
        if si>0:
            prev=seg[si-1]
            for k in range(xf):
                Image.blend(prev[len(prev)-xf+k],frames[k],(k+1)/(xf+1)).save(FRAMES/f"f{written:05d}.jpg",quality=92); written+=1
            frames=frames[xf:]
        end=len(frames)-(xf if si<len(seg)-1 else 0)
        for k in range(max(0,end)): frames[k].save(FRAMES/f"f{written:05d}.jpg",quality=92); written+=1
    print(f"wrote {written} frames ({written/FPS:.1f}s)")
    subprocess.run(["ffmpeg","-y","-framerate",str(FPS),"-i",str(FRAMES/"f%05d.jpg"),
                    "-c:v","libx264","-pix_fmt","yuv420p","-crf","18","-movflags","+faststart",A.out],
                   check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    print("silent master ->", A.out)

if __name__=="__main__": main()
