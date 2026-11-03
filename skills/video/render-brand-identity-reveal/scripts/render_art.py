#!/usr/bin/env python3
"""Render each artwork standalone (bare mode) at the frame-interior aspect, 2x for crispness."""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SCENE = f"file://{HERE}/scene.html"
OUT = os.path.join(HERE, "art"); os.makedirs(OUT, exist_ok=True)
IW, IH = 740, 1068  # matches original frame-interior design; dsf=2 -> 1480x2136

states = sys.argv[1:] or [str(i) for i in range(1, 11)]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": IW, "height": IH}, device_scale_factor=2)
    pg.goto(SCENE); pg.wait_for_timeout(500)
    pg.evaluate("document.body.classList.add('bare')")
    for i in states:
        js = ("() => { document.querySelectorAll('.art').forEach(e=>e.classList.remove('on'));"
              "var el=document.querySelector('.art[data-i=\"%s\"]'); if(el)el.classList.add('on');"
              "return document.querySelector('.art.on')?document.querySelector('.art.on').dataset.i:'NONE'; }") % i
        on = pg.evaluate(js)
        pg.wait_for_timeout(500)
        out = os.path.join(OUT, f"art_std_{int(i):02d}.png")
        pg.screenshot(path=out, clip={"x": 0, "y": 0, "width": IW, "height": IH})
        print(f"wrote {out} (on={on})")
    b.close()
