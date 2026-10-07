"""Tests for --format-profile silent-text (QA-64: silent kinetic-text ads could never pass).

Run: python3 -m pytest tests/   (needs ffmpeg, numpy, pillow; no network, no paid calls)
Every video is synthesised here: text rising in on a solid colour, with short dark beats
between text beats, like the create-kinetic-typography renderer's output.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import review_finished_ad as rfa  # noqa: E402
from test_review_finished_ad import make_endcard, make_logo, make_video  # noqa: E402

needs_ffmpeg = pytest.mark.skipif(
    subprocess.run(["which", "ffmpeg"], capture_output=True).returncode != 0, reason="ffmpeg not installed"
)

DARK, LIGHT = (20, 23, 32), (244, 239, 230)
BEATS = [("One clear message.", 1.8), ("Give it room.", 1.8), ("Keep it readable.", 1.8), ("Try Acme today.", 3.0)]


def _font(size):
    for p in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def _text_png(path, text, colour=(245, 242, 235)):
    font = _font(108)
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    left, top, right, bottom = probe.textbbox((0, 0), text, font=font)
    im = Image.new("RGBA", (right - left + 8, bottom - top + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4 - left, 4 - top), text, font=font, fill=colour)
    im.save(path)
    return path


def kinetic(tmp, name, beats=BEATS, gaps=0.5, bg=DARK, lead_blank_s=0.0, text=True, bar=False,
            audio=None, rise_s=0.4):
    """A silent kinetic-text style ad. Each beat's text rises in over `rise_s` on a solid
    colour and then holds; `gaps` seconds of bare background (a dark beat) sit between beats.

    audio: None (no track), "silent" (an all-silent track), "tone" (sound throughout),
    "dropout" (sound muted 3.0-5.5s), "short" (track ends at 3.0s), "late" (first 1.8s silent).
    """
    tmp = Path(tmp)
    gaps = gaps if isinstance(gaps, list) else [gaps] * (len(beats) - 1)
    windows, t = [], lead_blank_s
    for i, (_, dur) in enumerate(beats):
        windows.append((t, t + dur))
        t += dur + (gaps[i] if i < len(gaps) else 0.0)
    total = round(windows[-1][1], 3)
    colour = "0x%02x%02x%02x" % bg
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c={colour}:s=1080x1920:r=30:d={total}"]
    chain, last, n = [], "[0:v]", 1
    if text:
        for i, ((words, _), (a, b)) in enumerate(zip(beats, windows)):
            png = _text_png(tmp / f"{name}-beat{i}.png", words)
            cmd += ["-loop", "1", "-framerate", "30", "-t", str(total), "-i", str(png)]
            y = f"(H-h)/2+120*max(0\\,1-(t-{a:.3f})/{rise_s})"
            chain.append(f"{last}[{n}:v]overlay=x=(W-w)/2:y='{y}':enable='between(t\\,{a:.3f}\\,{b - 0.001:.3f})'[v{n}]")
            last, n = f"[v{n}]", n + 1
    if bar:
        # A thin full-width bar sliding down the frame: real motion, but no text on the frame.
        cmd += ["-f", "lavfi", "-i", f"color=c=0x333333:s=1080x16:r=30:d={total}"]
        chain.append(f"{last}[{n}:v]overlay=x=0:y='mod(t*400\\,H)'[v{n}]")
        last, n = f"[v{n}]", n + 1
    chain.append(f"{last}format=yuv420p,setsar=1[vout]")
    if audio:
        src = {"silent": f"anullsrc=r=44100:cl=mono:d={total}",
               "short": "sine=frequency=330:sample_rate=44100:duration=3.0"}.get(
            audio, f"sine=frequency=330:sample_rate=44100:duration={total}")
        cmd += ["-f", "lavfi", "-i", src]
        mute = {"dropout": "between(t,3.0,5.5)", "late": "between(t,0,1.8)"}.get(audio)
        af = f"volume=enable='{mute}':volume=0" if mute else "anull"
        chain.append(f"[{n}:a]{af}[aout]")
    cmd += ["-filter_complex", ";".join(chain), "-map", "[vout]"]
    cmd += (["-map", "[aout]", "-c:a", "aac"] if audio else ["-an"])
    out = tmp / f"{name}.mp4"
    cmd += ["-t", str(total), "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", str(out)]
    subprocess.run(cmd, check=True)
    return out


def still_video(tmp, name, text=None, bg=DARK, seconds=8.0):
    """One frame for the whole video: black/solid, or a single text frame that never moves."""
    tmp = Path(tmp)
    card = Image.new("RGB", (1080, 1920), bg)
    if text:
        t = Image.open(_text_png(tmp / f"{name}-text.png", text))
        card.paste(t, ((1080 - t.width) // 2, (1920 - t.height) // 2), t)
    card.save(tmp / f"{name}.png")
    out = tmp / f"{name}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", "30", "-t", str(seconds),
                    "-i", str(tmp / f"{name}.png"), "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
                    str(out)], check=True)
    return out


def run(tmp, video, *extra):
    out = Path(tmp) / "verdict.json"
    out.unlink(missing_ok=True)
    code = rfa.main(["--video", str(video), "--json", str(out), "--sheet", str(Path(tmp) / "sheet.png"), *extra])
    return code, (json.loads(out.read_text()) if out.exists() else None)


SILENT = ("--format-profile", "silent-text", "--no-speech", "--endcard-s", "3")


# ---------------------------------------------------------------- the QA-64 case: before / after

@needs_ffmpeg
def test_silent_kinetic_ad_fails_default_profile_and_passes_silent_text(tmp_path):
    v = kinetic(tmp_path, "kt")
    # Before (the default profile, which every other format keeps): two false failures.
    code, r = run(tmp_path, v, "--no-speech", "--endcard-s", "3")
    assert code == 2
    assert r["checks"]["hook"]["status"] == "fail" and "no audio track" in r["checks"]["hook"]["note"]
    assert r["checks"]["black_frames"]["status"] == "fail", r["checks"]["black_frames"]
    # After: the declared silent-text profile passes the same file.
    code, r = run(tmp_path, v, *SILENT)
    assert code == 0, r["checks"]
    assert r["format_profile"] == "silent-text"
    assert r["checks"]["hook"]["status"] == "pass"
    assert r["checks"]["dead_air"]["status"] == "not_applicable"
    bf = r["checks"]["black_frames"]
    assert bf["status"] == "pass", bf
    assert len(bf["data"]["blank_spans"]) == 3  # the three dark beats between text beats
    assert all(e - s <= rfa.BLANK_INTERIOR_MAX_S for s, e in bf["data"]["blank_spans"])
    assert any(line.startswith("text_beats:") for line in r["judge_on_sheet"])


@needs_ffmpeg
def test_the_renderer_like_dark_background_is_not_blank(tmp_path):
    """Dark background, short text: ffmpeg's blackdetect may call text frames black; the
    silent-text profile judges by visible text instead."""
    v = kinetic(tmp_path, "nogap", beats=[("Go.", 2.0), ("I", 2.0), ("Try it.", 3.0)], gaps=0.0)
    code, r = run(tmp_path, v, *SILENT)
    assert code == 0, r["checks"]
    assert r["checks"]["black_frames"]["data"]["blank_spans"] == []


# ---------------------------------------------------------------- real problems still fail

@needs_ffmpeg
def test_fully_black_video_fails_silent_text(tmp_path):
    v = still_video(tmp_path, "black", bg=(0, 0, 0))
    code, r = run(tmp_path, v, *SILENT)
    assert code == 2
    assert r["checks"]["black_frames"]["status"] == "fail"
    assert "whole video is blank" in r["checks"]["black_frames"]["note"]
    assert r["checks"]["pacing"]["status"] == "fail"


@needs_ffmpeg
def test_frozen_text_frame_fails_silent_text(tmp_path):
    v = still_video(tmp_path, "frozen", text="Keep it readable.")
    code, r = run(tmp_path, v, *SILENT)
    assert code == 2
    assert r["checks"]["pacing"]["status"] == "fail", r["checks"]["pacing"]
    assert r["checks"]["hook"]["status"] == "fail"  # opening frame is still
    assert r["checks"]["black_frames"]["status"] == "pass"  # the text is there; it just never moves


@needs_ffmpeg
def test_missing_text_on_a_light_background_fails_silent_text(tmp_path):
    """The text failed to render: a light background with only a moving bar. Not black, and
    not frozen, so only the silent-text blank check can catch it."""
    v = kinetic(tmp_path, "notext", bg=LIGHT, text=False, bar=True)
    code, r = run(tmp_path, v, "--no-speech", "--endcard-s", "3")
    assert r["checks"]["black_frames"]["status"] == "pass"  # default profile: not black
    assert r["checks"]["pacing"]["status"] == "pass", r["checks"]["pacing"]  # the bar moves
    code, r = run(tmp_path, v, *SILENT)
    assert code == 2
    assert r["checks"]["black_frames"]["status"] == "fail"
    assert "whole video is blank" in r["checks"]["black_frames"]["note"]


@needs_ffmpeg
def test_long_dark_beat_fails_silent_text(tmp_path):
    v = kinetic(tmp_path, "longgap", beats=BEATS[:2] + BEATS[3:], gaps=[0.5, 1.5])
    code, r = run(tmp_path, v, *SILENT)
    assert code == 2
    note = r["checks"]["black_frames"]["note"]
    assert r["checks"]["black_frames"]["status"] == "fail" and "between text beats, limit 1.0s" in note


@needs_ffmpeg
def test_blank_opening_keeps_the_strict_bound(tmp_path):
    v = kinetic(tmp_path, "leadgap", lead_blank_s=0.6)
    code, r = run(tmp_path, v, *SILENT)
    assert code == 2
    assert "at the opening, limit 0.3s" in r["checks"]["black_frames"]["note"]


@needs_ffmpeg
def test_too_much_blank_time_fails_even_with_short_beats(tmp_path):
    beats = [("One.", 1.6), ("Two.", 1.6), ("Three.", 1.6), ("Four.", 1.6), ("Try Acme.", 3.0)]
    v = kinetic(tmp_path, "share", beats=beats, gaps=0.9)  # 3.6s blank of 13.0s, each gap < 1.0s
    code, r = run(tmp_path, v, *SILENT)
    assert code == 2
    assert "limit 25%" in r["checks"]["black_frames"]["note"], r["checks"]["black_frames"]


# ---------------------------------------------------------------- audio in a silent format

@needs_ffmpeg
def test_all_silent_track_counts_as_no_audio(tmp_path):
    code, r = run(tmp_path, kinetic(tmp_path, "mute", audio="silent"), *SILENT)
    assert code == 0, r["checks"]
    assert r["checks"]["dead_air"]["status"] == "not_applicable"
    assert r["checks"]["dead_air"]["data"]["audio"] == "silent"


@needs_ffmpeg
def test_audible_track_that_plays_through_passes(tmp_path):
    code, r = run(tmp_path, kinetic(tmp_path, "music", audio="tone"), *SILENT)
    assert code == 0, r["checks"]
    assert r["checks"]["dead_air"]["status"] == "pass"
    assert any(line.startswith("audio:") for line in r["judge_on_sheet"])


@needs_ffmpeg
def test_audible_track_that_drops_out_fails_even_with_no_speech(tmp_path):
    code, r = run(tmp_path, kinetic(tmp_path, "drop", audio="dropout"), *SILENT)
    assert code == 2
    assert r["checks"]["dead_air"]["status"] == "fail" and "drops out" in r["checks"]["dead_air"]["note"]


@needs_ffmpeg
def test_audible_track_that_stops_early_fails(tmp_path):
    code, r = run(tmp_path, kinetic(tmp_path, "short", audio="short"), *SILENT)
    assert code == 2
    assert "stops at 3.0s" in r["checks"]["dead_air"]["note"], r["checks"]["dead_air"]


@needs_ffmpeg
def test_audible_track_that_starts_late_fails_hook(tmp_path):
    code, r = run(tmp_path, kinetic(tmp_path, "late", audio="late"), *SILENT)
    assert code == 2
    assert r["checks"]["hook"]["status"] == "fail" and "silent for the first" in r["checks"]["hook"]["note"]


# ---------------------------------------------------------------- every other format is unchanged

@needs_ffmpeg
def test_spoken_ad_result_is_unchanged_by_the_new_option(tmp_path):
    acme = make_logo(tmp_path / "acme.png", "ACME", (20, 60, 200, 255), "circle")
    for kwargs in ({}, {"gap": (1.5, 3.2)}, {"silent_lead": 1.8}):
        v = make_video(tmp_path, make_endcard(tmp_path / "card.png", acme), **kwargs)
        code_a, plain = run(tmp_path, v, "--logo", str(acme))
        code_b, explicit = run(tmp_path, v, "--logo", str(acme), "--format-profile", "default")
        assert code_a == code_b
        assert plain["checks"] == explicit["checks"] and plain["format_profile"] == "default"
        assert not any(line.startswith(("text_beats:", "audio:")) for line in plain["judge_on_sheet"])


@needs_ffmpeg
def test_no_speech_alone_keeps_its_old_meaning(tmp_path):
    v = kinetic(tmp_path, "kt2", audio="dropout")
    code, r = run(tmp_path, v, "--no-speech", "--endcard-s", "3")
    assert r["checks"]["dead_air"] == {"status": "not_applicable", "note": "--no-speech: music-only format", "data": {}}


# ---------------------------------------------------------------- the content measure itself

def test_content_share_separates_text_from_flat_frames():
    flat = np.zeros((480, 270, 3), dtype=np.uint8) + np.array(DARK, dtype=np.uint8)
    assert rfa.content_share(flat) == 0.0
    barred = flat.copy()
    barred[380:383, 30:200] = (183, 247, 107)  # a progress bar: 3 rows of 480
    assert rfa.content_share(barred) < rfa.BLANK_MIN_CONTENT_ROWS
    img = Image.fromarray(flat)
    ImageDraw.Draw(img).text((20, 220), "I", font=_font(27), fill=(245, 242, 235))  # one letter
    assert rfa.content_share(np.asarray(img)) >= rfa.BLANK_MIN_CONTENT_ROWS
    noisy = np.clip(flat.astype(int) + np.random.default_rng(1).integers(-12, 13, flat.shape), 0, 255)
    assert rfa.content_share(noisy.astype(np.uint8)) < rfa.BLANK_MIN_CONTENT_ROWS


def test_blank_span_rules():
    ok = rfa.check_blank_silent_text([(4.0, 4.9), (7.0, 8.0)], 100, [])
    assert ok.status == "pass", ok.note
    long = rfa.check_blank_silent_text([(4.0, 5.1)], 100, [])
    assert long.status == "fail" and "between text beats, limit 1.0s" in long.note
    tail = rfa.check_blank_silent_text([(9.5, 10.0)], 100, [])
    assert tail.status == "fail" and "at the ending, limit 0.3s" in tail.note
    head = rfa.check_blank_silent_text([(0.0, 0.3)], 100, [])
    assert head.status == "pass", head.note
    share = rfa.check_blank_silent_text([(1.0, 1.9), (3.0, 3.9), (5.0, 5.9)], 100, [])
    assert share.status == "fail" and "limit 25%" in share.note
    whole = rfa.check_blank_silent_text([(0.0, 10.0)], 100, [])
    assert whole.status == "fail" and "whole video is blank" in whole.note


def test_blank_bounds_are_fixed_not_flags(tmp_path):
    """The allowance is bounded in code: no option widens it, and an unknown profile is refused."""
    assert (rfa.BLANK_INTERIOR_MAX_S, rfa.BLANK_EDGE_MAX_S, rfa.BLANK_MAX_SHARE) == (1.0, 0.3, 0.25)
    video = tmp_path / "v.mp4"
    video.write_bytes(b"")
    for extra in (["--max-blank-s", "9"], ["--format-profile", "silent"]):
        with pytest.raises(SystemExit):
            rfa.main(["--video", str(video), "--json", str(tmp_path / "o.json"), *extra])
