"""Tests for review_finished_ad.py.

Run: python3 -m pytest tests/   (needs ffmpeg, numpy, pillow; no network)
Every video is synthesised here with ffmpeg, so each test states the defect it plants.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import review_finished_ad as rfa  # noqa: E402

pytestmark = pytest.mark.skipif(
    subprocess.run(["which", "ffmpeg"], capture_output=True).returncode != 0, reason="ffmpeg not installed"
)


def _font(size):
    for p in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def make_logo(path, text, colour, shape):
    im = Image.new("RGBA", (700, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if shape == "circle":
        d.ellipse([10, 40, 230, 260], fill=colour)
    else:
        d.polygon([(10, 260), (120, 40), (230, 260)], fill=colour)
    d.text((250, 70), text, font=_font(140), fill=colour)
    im.save(path)
    return path


def make_endcard(path, logo_path, size=(1080, 1920), bg=(245, 240, 230), logo_width=600, recolour=None):
    card = Image.new("RGB", size, bg)
    logo = Image.open(logo_path).convert("RGBA")
    if recolour:
        solid = Image.new("RGBA", logo.size, recolour + (255,))
        logo = Image.composite(solid, Image.new("RGBA", logo.size, (0, 0, 0, 0)), logo.split()[3])
    scale = logo_width * size[0] / 1080 / logo.width
    logo = logo.resize((round(logo.width * scale), round(logo.height * scale)))
    card.paste(logo, ((size[0] - logo.width) // 2, size[1] // 2 - logo.height), logo)
    card.save(path)
    return path


def make_video(tmp, endcard, size="1080x1920", body_s=4.5, still_body=False, silent_lead=0.0, gap=None,
               silent_endcard=False):
    """Moving test pattern for the body, then 2.5s end card; a tone over all of it."""
    w, h = size.split("x")
    out = Path(tmp) / "v.mp4"
    body = f"color=c=0x336699:s={w}x{h}:r=30:d={body_s}" if still_body else f"testsrc2=s={w}x{h}:r=30:d={body_s}"
    total = body_s + 2.5
    vol = [f"between(t,0,{silent_lead})"] if silent_lead else []
    if gap:
        vol.append(f"between(t,{gap[0]},{gap[1]})")
    if silent_endcard:
        vol.append(f"gte(t,{body_s})")
    af = f"volume=enable='{'+'.join(vol)}':volume=0" if vol else "anull"
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", body,
        "-loop", "1", "-t", "2.5", "-r", "30", "-i", str(endcard),
        "-f", "lavfi", "-i", f"sine=frequency=330:sample_rate=44100:duration={total}",
        "-filter_complex", f"[0:v]format=yuv420p,setsar=1[a];[1:v]scale={w}:{h},format=yuv420p,setsar=1[b];"
                           f"[a][b]concat=n=2:v=1:a=0[v];[2:a]{af}[au]",
        "-map", "[v]", "-map", "[au]", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", str(out),
    ]
    subprocess.run(cmd, check=True)
    return out


@pytest.fixture()
def tmp():
    with tempfile.TemporaryDirectory() as d:
        yield Path(d)


@pytest.fixture()
def logos(tmp):
    return (make_logo(tmp / "acme.png", "ACME", (20, 60, 200, 255), "circle"),
            make_logo(tmp / "zeta.png", "ZETA", (200, 40, 40, 255), "tri"))


def run(tmp, video, *extra):
    out = tmp / "verdict.json"
    code = rfa.main(["--video", str(video), "--json", str(out), "--sheet", str(tmp / "sheet.png"), *extra])
    return code, (json.loads(out.read_text()) if out.exists() else None)


def test_clean_ad_with_the_right_logo_passes(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme))
    code, r = run(tmp, v, "--logo", str(acme), "--palette", "#1438c8,#f5f0e6")
    assert code == 0, r["checks"]
    assert r["checks"]["logo"]["status"] == "pass"
    assert r["checks"]["palette"]["status"] == "pass"
    assert (tmp / "sheet.png").exists()


def test_wrong_logo_on_end_card_fails(tmp, logos):
    acme, zeta = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", zeta))
    code, r = run(tmp, v, "--logo", str(acme))
    assert code == 2
    assert r["checks"]["logo"]["status"] == "fail"


def test_smaller_recoloured_logo_is_still_found(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme, logo_width=300, recolour=(30, 30, 30)))
    code, r = run(tmp, v, "--logo", str(acme))
    assert r["checks"]["logo"]["status"] == "pass", r["checks"]["logo"]


def _photo_logo(tmp, name, text, colour, shape, bg):
    """An OPAQUE logo file (like a mascot JPEG): the mark on its own coloured square."""
    src = make_logo(tmp / f"{name}.png", text, colour, shape)
    im = Image.new("RGB", (700, 700), bg)
    mark = Image.open(src)
    im.paste(mark, (0, 200), mark)
    out = tmp / f"{name}.jpg"
    im.save(out, quality=92)
    return out


def test_opaque_photo_logo_right_passes_wrong_fails(tmp):
    right = _photo_logo(tmp, "right", "ACME", (20, 60, 200, 255), "circle", (170, 205, 140))
    wrong = _photo_logo(tmp, "wrong", "ZETA", (200, 40, 40, 255), "tri", (170, 205, 140))
    v = make_video(tmp, make_endcard(tmp / "card.png", right, logo_width=460))
    code, r = run(tmp, v, "--logo", str(right))
    assert r["checks"]["logo"]["status"] == "pass", r["checks"]["logo"]
    assert r["checks"]["logo"]["data"]["mode"] == "image"
    v = make_video(tmp, make_endcard(tmp / "card2.png", wrong, logo_width=460))
    code, r = run(tmp, v, "--logo", str(right))
    assert r["checks"]["logo"]["status"] == "fail", r["checks"]["logo"]


def test_favicon_logo_file_fails(tmp, logos):
    acme, _ = logos
    fav = tmp / "fav.png"
    Image.open(acme).resize((32, 14)).save(fav)
    v = make_video(tmp, make_endcard(tmp / "card.png", acme))
    code, r = run(tmp, v, "--logo", str(fav))
    assert code == 2
    assert r["checks"]["logo_asset"]["status"] == "fail"


def test_landscape_output_fails_ratio(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme, size=(1920, 1080)), size="1920x1080")
    code, r = run(tmp, v)
    assert code == 2
    assert r["checks"]["ratio"]["status"] == "fail"


def test_still_opening_and_frozen_body_fail_hook_and_pacing(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme), still_body=True)
    code, r = run(tmp, v)
    assert code == 2
    assert r["checks"]["hook"]["status"] == "fail"
    assert r["checks"]["pacing"]["status"] == "fail"


def test_late_sound_fails_hook(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme), silent_lead=1.8)
    code, r = run(tmp, v)
    assert r["checks"]["hook"]["status"] == "fail"


def test_mid_video_silence_fails_dead_air_unless_no_speech(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme), gap=(1.5, 3.2))
    code, r = run(tmp, v)
    assert r["checks"]["dead_air"]["status"] == "fail"
    code, r = run(tmp, v, "--no-speech")
    assert r["checks"]["dead_air"]["status"] == "not_applicable"


def test_silent_end_card_is_not_dead_air(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme), silent_endcard=True)
    code, r = run(tmp, v)
    assert r["checks"]["dead_air"]["status"] == "pass", r["checks"]["dead_air"]


def test_opaque_logo_size_is_the_whole_image(tmp):
    big = _photo_logo(tmp, "big", "ACME", (20, 60, 200, 255), "circle", (170, 205, 140))
    assert rfa.check_logo_asset(Image.open(big)).status == "pass"
    small = tmp / "small.jpg"
    Image.open(big).resize((64, 64)).save(small)
    assert rfa.check_logo_asset(Image.open(small)).status == "fail"


def test_off_palette_end_card_warns_not_fails(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme))
    code, r = run(tmp, v, "--palette", "#00ff00,#ff00ff")
    assert r["checks"]["palette"]["status"] == "warn"
    assert code == 0


def test_audio_tail_past_last_frame_still_reads_the_end_card(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme))
    longer = tmp / "tail.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(v), "-f", "lavfi",
                    "-i", "sine=frequency=330:sample_rate=44100:duration=9.0", "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", str(longer)], check=True)
    code, r = run(tmp, longer, "--logo", str(acme))
    assert code in (0, 2), "must not ERROR when the audio outlasts the picture"
    assert r["checks"]["logo"]["status"] == "pass", r["checks"]["logo"]


def _wordmark(tmp, name, text):
    im = Image.new("RGBA", (900, 160), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10, 20), text, font=_font(100), fill=(10, 10, 10, 255))
    out = tmp / f"{name}.png"
    rfa.trim_to_content(im).save(out)
    return out


def _card_with(logo_path, width, bg=(240, 236, 228), fill=None):
    card = Image.new("RGB", (1080, 1920), bg)
    logo = Image.open(logo_path).convert("RGBA")
    logo = logo.resize((width, round(logo.height * width / logo.width)))
    if fill:
        solid = Image.new("RGBA", logo.size, fill + (255,))
        logo = Image.composite(solid, Image.new("RGBA", logo.size, (0, 0, 0, 0)), logo.split()[3])
    card.paste(logo, ((1080 - width) // 2, 800), logo)
    return card


@pytest.mark.parametrize("width", [130, 218, 348, 600])
def test_thin_wordmark_is_found_at_any_size_and_polarity(tmp, width):
    """Reviewer probe (GOOSE-3761): the old edge + silhouette match failed a correct thin
    wordmark at 348px (0.27). Any size, dark or white, must pass; another brand must fail."""
    good = _wordmark(tmp, "good", "Gooseworks")
    other = _wordmark(tmp, "other", "Acme Labs")
    logo = Image.open(good)
    lo, hi = rfa.LOGO_THRESHOLDS["mark"][1], rfa.LOGO_THRESHOLDS["mark"][0]
    assert rfa.find_logo(_card_with(good, width), logo)["score"] >= hi
    assert rfa.find_logo(_card_with(good, width, bg=(20, 20, 20), fill=(255, 255, 255)), logo)["score"] >= hi
    assert rfa.find_logo(_card_with(other, width), logo)["score"] < lo


def test_wide_wordmark_file_is_not_called_a_favicon():
    assert rfa.check_logo_asset(Image.new("RGBA", (400, 120), (0, 0, 0, 255))).status == "pass"
    assert rfa.check_logo_asset(Image.new("RGB", (180, 180))).status == "fail"


def test_svg_logo_is_rasterised(tmp, logos):
    if not (shutil.which("rsvg-convert") or _cairosvg_works()):
        pytest.skip("no SVG rasteriser installed")
    svg = tmp / "logo.svg"
    svg.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200">'
                   '<circle cx="100" cy="100" r="90" fill="#1438c8"/>'
                   '<rect x="220" y="40" width="360" height="120" fill="#1438c8"/></svg>')
    img = rfa.load_image(str(svg))
    assert img.width == 1024


def _cairosvg_works():
    try:
        import cairosvg  # noqa: F401
        return True
    except Exception:
        return False


def test_undecodable_video_is_an_error(tmp):
    bad = tmp / "bad.mp4"
    bad.write_bytes(b"\x00" * 4096)
    assert rfa.main(["--video", str(bad), "--json", str(tmp / "o.json")]) == 3


def test_silence_starting_just_after_zero_fails_hook(tmp, logos):
    acme, _ = logos
    v = make_video(tmp, make_endcard(tmp / "card.png", acme), gap=(0.2, 2.6))
    code, r = run(tmp, v)
    assert r["checks"]["hook"]["status"] == "fail", r["checks"]["hook"]


def test_missing_video_is_an_error(tmp):
    assert rfa.main(["--video", str(tmp / "nope.mp4"), "--json", str(tmp / "o.json")]) == 3
