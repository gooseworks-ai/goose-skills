#!/usr/bin/env python3
"""Export caption coverage using the actual caption grouping and drawing functions."""
import argparse
import json
import hashlib
import pathlib
from captions import STYLES, ABOVE_SEAM, bare, cues_for, draw, font, serif


def signature(spec):
    obj={"size":spec.get("size",[1080,1920]),"seam":spec.get("seam"),
         "beats":[{k:b.get(k, "split" if k=="state" else None) for k in ("id","vo","start","end","state")} for b in spec["beats"]]}
    return hashlib.sha256(json.dumps(obj,sort_keys=True).encode()).hexdigest()


def footprint(spec, style="plate", anchor=None, font_path=None, y=.62, full_y=.62, highlights=()):
    if font_path and not pathlib.Path(font_path).is_file():
        raise ValueError("supplied caption font is missing")
    hl={bare(w) for w in highlights}
    W,H = spec.get("size", [1080,1920])
    st = STYLES[style]
    px = round(st["cap"]*H*1.38)
    fnt = serif(px) if st.get("serif") else font(px, font_path)
    seam = spec.get("seam")
    anchor = anchor or ("seam" if seam else "fixed")
    result = {"size": [W,H], "cutlist_sha256": signature(spec), "style": style, "anchor": anchor, "font": font_path,
              "basis": "all script cue groups; rerun after alignment or styling changes", "beats": {}}
    for words, _, _, b in cues_for(spec["beats"], None, st["per"]):
        im = draw(W,H,words,0,st,px,fnt,hl,plate_top=lambda ph: int(seam-ABOVE_SEAM*ph)) if anchor == "seam" and b.get("state", "split") == "split" and seam else draw(W,H,words,(y if anchor == "fixed" else full_y)*H,st,px,fnt,hl)
        box = im.getbbox()
        entry = result["beats"].setdefault(b["id"], {"bbox": None, "groups": []})
        entry["groups"].append({"text": " ".join(words), "bbox": box})
        if box:
            old = entry["bbox"]
            entry["bbox"] = [min(old[0],box[0]),min(old[1],box[1]),max(old[2],box[2]),max(old[3],box[3])] if old else list(box)
    return result


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--beats", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--style", choices=sorted(STYLES), default="plate")
    ap.add_argument("--anchor", choices=["seam","fixed"])
    ap.add_argument("--font")
    ap.add_argument("--highlight",action="append",default=[])
    ap.add_argument("--y", type=float, default=.62)
    ap.add_argument("--full-y", type=float, default=.62)
    a=ap.parse_args()
    result=footprint(json.loads(pathlib.Path(a.beats).read_text()),a.style,a.anchor,a.font,a.y,a.full_y,a.highlight)
    pathlib.Path(a.out).write_text(json.dumps(result,indent=2))
    print("caption footprint ->",a.out)

if __name__ == "__main__":
    main()
