"""The renderer has to run on a machine that is not the one it was written on.

Run: python3 -m pytest tests/   No network, no paid call, no numpy.
Each test pins one thing a Mac run on 2026-10-08 had to work around by hand.
"""
import importlib.util
import json
import re
import sys
import tempfile
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))


def _load(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPTS / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _text(name):
    return (SCRIPTS / name).read_text(encoding="utf-8")


def test_the_board_fonts_ship_with_the_skill():
    import lettering as L
    from PIL import ImageFont
    for path, family in ((L.MARKER, "Permanent Marker"), (L.TITLE, "Titan One")):
        assert Path(path).is_file(), path
        assert "Windows" not in path
        assert ImageFont.truetype(path, 40).getname()[0] == family
    assert Path(L.CAPTION).is_file()


def test_no_script_reads_a_font_from_a_windows_path_directly():
    for name in ("render.py", "solve-layout.py", "make-episode.py", "gen-art.py"):
        assert "C:/Windows/Fonts" not in _text(name), name


def test_caption_pill_ends_above_the_review_band():
    # review-finished-ad flags y >= 1520; the pill is 60px tall
    y = int(re.search(r'\("caption_y", (\d+)\)', _text("solve-layout.py")).group(1))
    assert y + 60 < 1520
    assert int(re.search(r"^CAPTION_Y = (\d+)", _text("render.py"), re.M).group(1)) == y


def test_trace_is_pointed_at_the_folder_the_drawings_are_in():
    src = _text("make-episode.py")
    assert '"--dir", P / "art" / "line"' in src
    assert '"art" / "art"' not in src


def test_a_beat_can_start_a_board_by_hand():
    assert 'b.get("new_board")' in _text("solve-layout.py")


def test_style_reference_is_a_public_url_not_a_local_path():
    g = _load("gen-art")
    with tempfile.TemporaryDirectory() as td:
        png = Path(td) / "scoop.png"
        png.write_bytes(b"x")
        Path(str(png) + ".meta.json").write_text(
            json.dumps({"image_url": "https://example.invalid/scoop.png"}), encoding="utf-8")
        assert g.public_url(png) == "https://example.invalid/scoop.png"


def test_the_board_photo_prompt_forbids_a_maker_logo():
    g = _load("gen-art")
    assert "No logo" in g.PLATE_PROMPT
    assert "small maker's badge in one corner" not in g.PLATE_PROMPT
