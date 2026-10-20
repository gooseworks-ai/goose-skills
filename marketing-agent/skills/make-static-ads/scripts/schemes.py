#!/usr/bin/env python3
"""Exact port of gooseworks-app apps/api/src/lib/brand-colors.ts (origin/dev 42a3dec20, 2026-10-19):
deriveColorSchemes -> orderSchemesForRotation -> assignSchemesToBatch. Verified identical to the TS on 8 kits.
Usage: python3 schemes.py '<kit-json>' <batch_seed> <n_ads> [start_offset]
kit-json keys (from brand_read kit): primaryColor, accentColor, backgroundColor, textColor, palette."""
import json, math, sys

def parse_hex(h):
    if not isinstance(h, str): return None
    raw = h.strip().lstrip('#')
    if not raw or any(c not in '0123456789abcdefABCDEF' for c in raw): return None
    if len(raw) == 3: return [int(c*2, 16) for c in raw]
    if len(raw) == 6: return [int(raw[i:i+2], 16) for i in (0, 2, 4)]
    return None

def clamp01(v): return 0.0 if v < 0 else 1.0 if v > 1 else v
def js_round(x): return math.floor(x + 0.5)
def to255(v): return js_round(clamp01(v) * 255)
def to_hex(rgb): return '#' + ''.join('%02x' % max(0, min(255, js_round(c))) for c in rgb)
def s2l(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def l2s(c): return c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055

def hex_to_oklch(h):
    rgb = parse_hex(h)
    if not rgb: return None
    r, g, b = (s2l(v / 255) for v in rgb)
    l0 = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    l1 = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    l2 = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = (math.copysign(abs(x) ** (1/3), x) for x in (l0, l1, l2))
    L = 0.2104542553*l_ + 0.793617785*m_ - 0.0040720468*s_
    A = 1.9779984951*l_ - 2.428592205*m_ + 0.4505937099*s_
    B = 0.0259040371*l_ + 0.7827717662*m_ - 0.808675766*s_
    c = math.sqrt(A*A + B*B)
    hh = math.degrees(math.atan2(B, A))
    if hh < 0: hh += 360
    return {'l': L, 'c': c, 'h': hh}

def oklch_to_hex(o):
    l, h = o['l'], o['h']
    def render(ch):
        hr = math.radians(h); A = math.cos(hr)*ch; B = math.sin(hr)*ch
        l_ = l + 0.3963377774*A + 0.2158037573*B
        m_ = l - 0.1055613458*A - 0.0638541728*B
        s_ = l - 0.0894841775*A - 1.291485548*B
        a0, a1, a2 = l_**3, m_**3, s_**3
        rl = 4.0767416621*a0 - 3.3077115913*a1 + 0.2309699292*a2
        gl = -1.2684380046*a0 + 2.6097574011*a1 - 0.3413193965*a2
        bl = -0.0041960863*a0 - 0.7034186147*a1 + 1.707614701*a2
        eps = 1e-4
        ok = all(-eps <= v <= 1 + eps for v in (rl, gl, bl))
        return [to255(l2s(clamp01(v))) for v in (rl, gl, bl)], ok
    rgb, ok = render(max(0, o['c']))
    if ok: return to_hex(rgb)
    lo, hi = 0.0, max(0, o['c'])
    for _ in range(20):
        mid = (lo + hi) / 2
        if render(mid)[1]: lo = mid
        else: hi = mid
    return to_hex(render(lo)[0])

def lum(h):
    rgb = parse_hex(h)
    if not rgb: return None
    r, g, b = (s2l(v / 255) for v in rgb)
    return 0.2126*r + 0.7152*g + 0.0722*b

def contrast(a, b):
    la, lb = lum(a), lum(b)
    if la is None or lb is None: return 1
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

def is_light(h):
    l = lum(h)
    return True if l is None else l >= 0.35

def readable_ink(bg):
    return '#ffffff' if contrast('#ffffff', bg) >= contrast('#111111', bg) else '#111111'

STEP_L = 0.14
def chroma_ceiling(l, h):
    warm = 20 <= h <= 110
    if l < 0.35:
        floor = 0.18 if warm else 0.35
        t = max(0, l) / 0.35
        return (floor + (1 - floor) * t) * 0.37
    if l > 0.85:
        t = (1 - l) / (1 - 0.85)
        return (0.25 + 0.75 * t) * 0.37
    return 0.37

def clamp_chroma(o): return {**o, 'c': min(o['c'], chroma_ceiling(o['l'], o['h']))}

def lighten(h, steps=1):
    o = hex_to_oklch(h)
    if not o: return h
    n = max(0, min(2, steps))
    return oklch_to_hex(clamp_chroma({**o, 'l': min(0.98, o['l'] + STEP_L * n)}))

def darken(h, steps=1):
    o = hex_to_oklch(h)
    if not o: return h
    n = max(0, min(2, steps))
    return oklch_to_hex(clamp_chroma({**o, 'l': max(0.06, o['l'] - STEP_L * n)}))

def distance(a, b):
    oa, ob = hex_to_oklch(a), hex_to_oklch(b)
    if not oa or not ob: return 0
    dl = oa['l'] - ob['l']
    aa, ab = oa['c']*math.cos(math.radians(oa['h'])), oa['c']*math.sin(math.radians(oa['h']))
    ba, bb = ob['c']*math.cos(math.radians(ob['h'])), ob['c']*math.sin(math.radians(ob['h']))
    return math.sqrt(dl*dl + (aa-ba)**2 + (ab-bb)**2)

def hue_distance(a, b):
    oa, ob = hex_to_oklch(a), hex_to_oklch(b)
    if not oa or not ob: return 180
    if oa['c'] < 0.03 or ob['c'] < 0.03: return 180
    d = abs(oa['h'] - ob['h']) % 360
    return 360 - d if d > 180 else d

def same_hue(a, b): return hue_distance(a, b) < 30

def enforce(s):
    if not parse_hex(s['background']): return None
    out = dict(s)
    if same_hue(out['ink'], out['background']): out['ink'] = readable_ink(out['background'])
    if contrast(out['ink'], out['background']) < 4.5: out['ink'] = readable_ink(out['background'])
    if contrast(out['accent'], out['background']) < 3:
        lifted = darken(out['accent'], 2) if is_light(out['background']) else lighten(out['accent'], 2)
        out['accent'] = lifted if contrast(lifted, out['background']) >= 3 else out['ink']
    return out if contrast(out['ink'], out['background']) >= 4.5 else None

OFF_WHITE, NEAR_BLACK = '#fafaf9', '#0f0f0f'

def derive(kit):
    low = lambda k: kit.get(k).lower() if parse_hex(kit.get(k)) else None
    primary, accent, kit_bg, kit_ink = low('primaryColor'), low('accentColor'), low('backgroundColor'), low('textColor')
    palette = kit.get('palette') or []
    brand_ink = primary or kit_ink or NEAR_BLACK
    brand_accent = accent or primary or NEAR_BLACK
    chrom = lambda h: bool(h) and ((hex_to_oklch(h) or {}).get('c', 0) >= 0.03)
    chromatic_accent = accent if chrom(accent) else next((c.lower() for c in palette if parse_hex(c) and chrom(c.lower())), None)
    cands = []
    light_bg = kit_bg if kit_bg and is_light(kit_bg) else OFF_WHITE
    cands.append(dict(id='light', label='Light', background=light_bg,
        ink=kit_ink if kit_ink and contrast(kit_ink, light_bg) >= 4.5 else brand_ink, accent=brand_accent))
    if primary:
        fam = darken(primary, 2) if is_light(primary) else lighten(primary, 2)
        mud = not chrom(fam)
        cands.append(dict(id='primary', label='Primary field', background=primary, ink=readable_ink(primary),
            accent=chromatic_accent if mud and chromatic_accent else fam))
    dark_bg = darken(primary, 2) if primary else NEAR_BLACK
    cands.append(dict(id='dark', label='Dark', background=NEAR_BLACK if is_light(dark_bg) else dark_bg, ink='#ffffff',
        accent=accent or (lighten(primary, 2) if primary else '#ffffff')))
    if accent and (not primary or distance(accent, primary) >= 0.15):
        cands.append(dict(id='accent', label='Accent field', background=accent, ink=readable_ink(accent),
            accent=primary or readable_ink(accent)))
    extra = next((c.lower() for c in palette if parse_hex(c)
        and (not primary or distance(c.lower(), primary) >= 0.15)
        and (not accent or distance(c.lower(), accent) >= 0.15)
        and (hex_to_oklch(c.lower()) or {}).get('c', 0) >= 0.04), None)
    if extra:
        cands.append(dict(id='palette', label='Palette field', background=extra, ink=readable_ink(extra),
            accent=primary or readable_ink(extra)))
    usable = []
    for s in (x for x in map(enforce, cands) if x):
        if any(distance(k['background'], s['background']) < 0.08 for k in usable): continue
        usable.append(s)
    if not any(is_light(s['background']) for s in usable):
        usable.insert(0, dict(id='light', label='Light', background=OFF_WHITE, ink=NEAR_BLACK, accent=brand_accent))
    if not any(not is_light(s['background']) for s in usable):
        usable.append(dict(id='dark', label='Dark', background=NEAR_BLACK, ink='#ffffff', accent=accent or '#ffffff'))
    return usable

def sep(a, b):
    return distance(a['background'], b['background']) + (0.5 if is_light(a['background']) != is_light(b['background']) else 0) \
        + (0 if same_hue(a['background'], b['background']) else 0.3)

def order(schemes):
    n = len(schemes)
    if n < 3: return list(schemes)
    if n > 8:
        rem = list(schemes)
        start = next((i for i, s in enumerate(rem) if is_light(s['background'])), 0)
        out = [rem.pop(start)]
        while rem:
            prev = out[-1]; best, score = 0, -math.inf
            for i, s in enumerate(rem):
                sc = sep(prev, s)
                if sc > score: score, best = sc, i
            out.append(rem.pop(best))
        return out
    S = [[sep(a, b) for b in schemes] for a in schemes]
    light = [is_light(s['background']) for s in schemes]
    any_light = any(light)
    best = {'path': None, 'min': -math.inf, 'sum': -math.inf}
    def walk(path, used, mn, sm):
        if len(path) == n:
            if mn > best['min'] or (mn == best['min'] and sm > best['sum']):
                best.update(path=list(path), min=mn, sum=sm)
            return
        for i in range(n):
            if used & (1 << i): continue
            if not path and any_light and not light[i]: continue
            step = S[path[-1]][i] if path else math.inf
            nm = min(mn, step)
            if nm < best['min']: continue
            walk(path + [i], used | (1 << i), nm, sm + (step if path else 0))
    walk([], 0, math.inf, 0)
    return [schemes[i] for i in (best['path'] or range(n))]

def assign(n_ads, schemes, batch_seed, start_offset=None):
    seed = 0
    for ch in batch_seed:
        seed = (seed * 31 + ord(ch)) & 0xFFFFFFFF
    off = int(start_offset) if isinstance(start_offset, (int, float)) and start_offset >= 0 else seed % len(schemes)
    return [schemes[(off + i) % len(schemes)] for i in range(n_ads)]

if __name__ == '__main__':
    kit = json.loads(sys.argv[1]); seed = sys.argv[2]; n = int(sys.argv[3])
    off = int(sys.argv[4]) if len(sys.argv) > 4 else None
    rotation = order(derive(kit))
    if len(rotation) < 2:
        print(json.dumps({'schemes': rotation, 'assigned': None, 'note': 'fewer than 2 schemes: scheme = null for every ad'}))
    else:
        extra = lambda s: {**s, 'on_accent': readable_ink(s['accent']), 'background_is_light': is_light(s['background'])}
        print(json.dumps({'schemes': [extra(s) for s in rotation],
                          'assigned': [extra(s) for s in assign(n, rotation, seed, off)]}, indent=1))
