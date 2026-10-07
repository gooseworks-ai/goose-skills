"""Tests for three robustness rules that apply to every profile:

1. Audio that runs past the last video frame is judged and reported, not an ERROR.
2. Thin, low-contrast text changing is motion: ffmpeg's freeze detector (a 270px copy, a
   whole-frame mean) misses it, so a reported still run is re-read and split at real changes.
3. A track with only isolated clicks or ticks is not sound: silence in a spoken ad, and
   "no meaningful audio" in the silent-text profile.

Run: python3 -m pytest tests/   (needs ffmpeg, numpy, pillow; no network, no paid calls)
Every video is synthesised here with ffmpeg and Pillow (lines, not fonts, so any machine works).
"""
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import pytest
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

import review_finished_ad as rfa  # noqa: E402

needs_ffmpeg = pytest.mark.skipif(
    subprocess.run(["which", "ffmpeg"], capture_output=True).returncode != 0, reason="ffmpeg not installed"
)

BEIGE, INK = (232, 225, 213), (168, 152, 128)
CLICKS = "if(lt(mod(t,0.4),0.004),0.8*sin(2*PI*2000*t),0)"  # a 4ms click every 0.4s
TONE = "0.5*sin(2*PI*330*t)"


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *map(str, args)], check=True)


def run(tmp, video, *extra):
    out = Path(tmp) / "verdict.json"
    out.unlink(missing_ok=True)
    code = rfa.main(["--video", str(video), "--json", str(out), "--sheet", str(Path(tmp) / "sheet.png"), *extra])
    return code, (json.loads(out.read_text()) if out.exists() else None)


def moving(tmp, name, seconds, audio_expr=TONE, audio_s=None):
    """A moving test pattern (a spoken-style ad body) with an audio track built from an expression."""
    out = Path(tmp) / f"{name}.mp4"
    ff("-f", "lavfi", "-i", f"testsrc2=s=1080x1920:r=30:d={seconds}",
       "-f", "lavfi", "-i", f"aevalsrc='{audio_expr}':s=44100:d={audio_s or seconds}",
       "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
       "-c:a", "aac", out)
    return out


def thin_beats(tmp, name, beats=5, beat_s=1.4, cta_s=3.0, width=2, change=True):
    """Thin low-contrast line 'text' on beige, a hard cut per beat, a tone underneath. With
    change=False every beat is the same picture (a truly frozen video)."""
    tmp = Path(tmp)
    pngs = []
    for i in range(beats + 1):
        seed = (i if change else 0) + 1
        im = Image.new("RGB", (1080, 1920), BEIGE)
        d = ImageDraw.Draw(im)
        for line in range(2):
            y0 = 900 + line * 110
            d.line([(190 + x, y0 + 40 * math.sin((x + 37 * seed) / (23 + 7 * seed + line))) for x in range(0, 700, 4)],
                   fill=INK, width=width)
        pngs.append(tmp / f"{name}{i}.png")
        im.save(pngs[-1])
    lst = tmp / f"{name}.txt"
    lst.write_text("".join(f"file '{p.resolve()}'\nduration {cta_s if i == beats else beat_s}\n" for i, p in enumerate(pngs))
                   + f"file '{pngs[-1].resolve()}'\n")
    total = beats * beat_s + cta_s
    out = tmp / f"{name}.mp4"
    ff("-f", "concat", "-safe", "0", "-i", lst, "-f", "lavfi", "-i", f"sine=frequency=330:sample_rate=44100:duration={total}",
       "-vf", "fps=30,format=yuv420p", "-t", total, "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", out)
    return out


# ---------------------------------------------------------------- 1. audio past the last frame

@needs_ffmpeg
@pytest.mark.parametrize("tail,status", [(4.0, "fail"), (2.7, "warn"), (2.0, "warn")])
def test_audio_past_the_last_frame_is_judged_not_an_error(tmp_path, tail, status):
    """Used to exit 3 ("could not grab a frame") once the tail passed ~3s. Up to the end card's
    length (3s default) the last frame just holds longer (warn); beyond it, fail."""
    v = moving(tmp_path, "tail", 7.0, audio_s=7.0 + tail)
    code, r = run(tmp_path, v)
    assert code in (0, 2) and r is not None, "must not ERROR"
    pacing = r["checks"]["pacing"]
    assert pacing["status"] == status, pacing
    assert f"runs {tail:.1f}s past the last video frame" in pacing["note"]
    assert abs(r["video"]["picture_duration"] - 7.0) < 0.1 and abs(pacing["data"]["audio_overrun_s"] - tail) < 0.1
    assert all(t <= 7.0 for t in r["video"]["sheet_samples"])  # frames are read from the picture


@needs_ffmpeg
def test_encoder_padding_is_not_judged(tmp_path):
    """A tail of 0.5s or less (AAC padding, a few frames) keeps the old code path exactly."""
    v = moving(tmp_path, "pad", 7.0, audio_s=7.3)
    code, r = run(tmp_path, v)
    assert code == 0, r["checks"]
    assert "picture_duration" not in r["video"] and "audio_overrun_s" not in r["checks"]["pacing"]["data"]


@needs_ffmpeg
def test_a_cut_short_file_without_audio_is_judged_not_an_error(tmp_path):
    """A file whose container claims more than its picture holds (cut off mid-write), no audio."""
    v = tmp_path / "full.mp4"
    ff("-f", "lavfi", "-i", "testsrc2=s=1080x1920:r=30:d=10", "-c:v", "libx264", "-preset", "ultrafast",
       "-pix_fmt", "yuv420p", "-movflags", "+faststart", v)
    cut = tmp_path / "cut.mp4"
    cut.write_bytes(v.read_bytes()[: v.stat().st_size // 2])  # header intact, half the frames
    code, r = run(tmp_path, cut)
    assert code == 2 and r is not None, "must not ERROR"
    note = r["checks"]["pacing"]["note"]
    assert r["checks"]["pacing"]["status"] == "fail" and "past its last video frame" in note and "audio" not in note


@needs_ffmpeg
def test_audio_tail_in_mpeg_ts_is_judged_not_an_error(tmp_path):
    mp4 = moving(tmp_path, "tsrc", 7.0, audio_s=11.0)
    ts = tmp_path / "tail.ts"
    ff("-i", mp4, "-c", "copy", "-f", "mpegts", ts)
    code, r = run(tmp_path, ts)
    assert r is not None and r["checks"]["pacing"]["status"] == "fail"


@needs_ffmpeg
def test_a_frozen_ending_is_still_a_freeze_with_an_audio_tail(tmp_path):
    """Reviewer repro: motion to 5s, the last frame held to 10s, audio to 12s. main fails pacing;
    the tail must not hide it (players show the held frame through the tail)."""
    out = tmp_path / "frozen_end.mp4"
    ff("-f", "lavfi", "-i", "testsrc2=s=1080x1920:r=30:d=5", "-f", "lavfi", "-i", f"aevalsrc='{TONE}':s=44100:d=12",
       "-filter_complex", "[0:v]tpad=stop_mode=clone:stop_duration=5[v]", "-map", "[v]", "-map", "1:a",
       "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", out)
    code, r = run(tmp_path, out)
    assert r["checks"]["pacing"]["status"] == "fail" and "picture frozen 5.0" in r["checks"]["pacing"]["note"]


@needs_ffmpeg
def test_a_silent_ending_is_still_dead_air_with_an_audio_tail(tmp_path):
    """10s picture, sound to 7.5s, silence to 12s: dead air, as on main."""
    v = moving(tmp_path, "silent_end", 10.0, f"if(lt(t,7.5),{TONE},0)", audio_s=12.0)
    code, r = run(tmp_path, v)
    assert r["checks"]["dead_air"]["status"] == "fail", r["checks"]["dead_air"]


# ---------------------------------------------------------------- 2. freezes vs thin low-contrast text

@needs_ffmpeg
def test_thin_low_contrast_beats_are_motion_not_a_freeze(tmp_path):
    """ffmpeg's freezedetect reports the whole video frozen; the re-read finds each beat change."""
    v = thin_beats(tmp_path, "thin")
    raw = rfa.spans(rfa.analyse(str(v), True, 0.5), "freeze", 10.0)
    assert raw and raw[0][1] - raw[0][0] > 5, "fixture no longer fools freezedetect; make it subtler"
    code, r = run(tmp_path, v, "--no-speech")
    assert code == 0, r["checks"]
    assert r["checks"]["pacing"]["status"] == "pass" and r["checks"]["hook"]["status"] == "pass"


@needs_ffmpeg
def test_a_truly_frozen_low_contrast_video_still_fails(tmp_path):
    v = thin_beats(tmp_path, "frozen", change=False)
    code, r = run(tmp_path, v, "--no-speech")
    assert code == 2
    assert r["checks"]["pacing"]["status"] == "fail" and r["checks"]["hook"]["status"] == "fail"


@needs_ffmpeg
@pytest.mark.parametrize("w,h", [(1080, 1920), (1080, 1080), (1920, 1080)])
def test_a_thin_progress_bar_alone_does_not_break_a_freeze(tmp_path, w, h):
    """One held frame with only a thin bar growing (a render stuck on its first beat). The bar is
    about 1% of the width tall, like the kinetic renderer's, at every aspect ratio."""
    card = tmp_path / "card.png"
    im = Image.new("RGB", (w, h), (20, 23, 32))
    ImageDraw.Draw(im).rectangle([w // 5, h // 2 - 50, w * 4 // 5, h // 2 + 50], fill=(245, 242, 235))
    im.save(card)
    bar_w, bar_h = int(w * 0.76), max(2, round(w * 0.008))
    out = tmp_path / "stuck.mp4"
    ff("-loop", "1", "-framerate", "30", "-t", "8", "-i", card, "-f", "lavfi", "-i",
       f"color=c=0xb7f76b:s={bar_w}x{bar_h}:r=30:d=8",
       "-f", "lavfi", "-i", "sine=frequency=330:sample_rate=44100:duration=8",
       "-filter_complex", f"[0:v][1:v]overlay=x='{int(w * 0.12)}-{bar_w}+{bar_w}*t/8':y={int(h * 0.79)},format=yuv420p[v]",
       "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", out)
    meta = rfa.probe(str(out))
    assert rfa.change_points(str(out), meta, [(0.0, 8.0)]) == [[]], "the bar alone must never count as a change"
    if h > w:  # portrait: freezedetect reports the hold, and it stays a failure end to end
        code, r = run(tmp_path, out, "--no-speech")
        assert r["checks"]["pacing"]["status"] == "fail", r["checks"]["pacing"]


@needs_ffmpeg
@pytest.mark.parametrize("element", [
    "drawbox=x=700:y=900:w=4:h=60:c=0x2b2622:t=fill:enable='lt(mod(t,0.9),0.45)'",   # a blinking caret
    "drawbox=x=520:y=1300:w=40:h=40:c=0xd04040:t=fill:enable='lt(mod(t,0.6),0.3)'",    # a pulsing icon
    "drawbox=x=0:y=0:w=1080:h=1920:c=white:t=fill:enable='between(t,3.0,3.04)'",        # a one-frame flash
])
def test_a_blink_pulse_or_flash_does_not_unfreeze_a_still_card(tmp_path, element):
    """Reviewer repro: a still card with a small element that comes and goes (main calls each of
    these frozen). The picture returns to an earlier state, or never holds 0.3s, so nothing new
    appears: still frozen."""
    card = tmp_path / "card.png"
    im = Image.new("RGB", (1080, 1920), BEIGE)
    ImageDraw.Draw(im).rectangle([200, 820, 880, 1000], fill=(20, 23, 32))
    im.save(card)
    out = tmp_path / "blink.mp4"
    ff("-loop", "1", "-framerate", "30", "-t", "8", "-i", card, "-f", "lavfi", "-i", f"aevalsrc='{TONE}':s=44100:d=8",
       "-vf", f"{element},format=yuv420p", "-map", "0:v", "-map", "1:a",
       "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", out)
    code, r = run(tmp_path, out, "--no-speech")
    assert r["checks"]["pacing"]["status"] == "fail", r["checks"]["pacing"]
    assert r["checks"]["hook"]["status"] == "fail", r["checks"]["hook"]


@needs_ffmpeg
def test_a_freeze_in_mpeg_ts_with_late_video_still_fails(tmp_path):
    """Reviewer repro: TS whose video starts 1s after the audio, with a real 3s freeze. The
    re-read must sit on freezedetect's timeline (audio kept mapped), not 1s early."""
    mp4 = tmp_path / "vdelay.mp4"
    ff("-f", "lavfi", "-i", "testsrc2=s=1080x1920:r=30:d=3", "-f", "lavfi", "-i", "testsrc2=s=1080x1920:r=30:d=3",
       "-f", "lavfi", "-i", f"aevalsrc='{TONE}':s=44100:d=10",
       "-filter_complex", "[0:v]tpad=stop_mode=clone:stop_duration=3[a];[a][1:v]concat=n=2:v=1:a=0,format=yuv420p,"
       "setpts=PTS+1/TB[v]", "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-preset", "ultrafast",
       "-g", "15", "-c:a", "aac", mp4)
    ts = tmp_path / "vdelay.ts"
    ff("-i", mp4, "-c", "copy", "-f", "mpegts", ts)
    code_mp4, r_mp4 = run(tmp_path, mp4)
    code_ts, r_ts = run(tmp_path, ts)
    assert r_mp4["checks"]["pacing"]["status"] == "fail", r_mp4["checks"]["pacing"]
    assert r_ts["checks"]["pacing"]["status"] == "fail", r_ts["checks"]["pacing"]


def test_change_points_ignore_returns_and_count_new_states(monkeypatch):
    """A(0-1) B(1-2) A(2-3): B is a return trip, no change. A(0-1) B(1-2) C(2-3): B and C count."""
    import numpy as np

    def frames(seq):
        def gen(*_a, **_k):
            for k, label in enumerate(seq):
                f = np.zeros((960, 540, 3), dtype=np.uint8)
                f[100 + 200 * label: 160 + 200 * label, 100:400] = 255
                yield k / 10, f
        return gen
    meta = {"width": 1080, "height": 1920, "has_audio": False}
    monkeypatch.setattr(rfa, "file_timeline_frames", frames([0] * 10 + [1] * 10 + [0] * 10))
    assert rfa.change_points("v", meta, [(0.0, 3.0)]) == [[]]
    monkeypatch.setattr(rfa, "file_timeline_frames", frames([0] * 10 + [1] * 10 + [2] * 10))
    assert rfa.change_points("v", meta, [(0.0, 3.0)]) == [[1.0, 2.0]]
    monkeypatch.setattr(rfa, "file_timeline_frames", frames([0] * 10 + [1] * 2 + [0] * 18))  # a 0.2s blip
    assert rfa.change_points("v", meta, [(0.0, 3.0)]) == [[]]


def test_confirm_freezes_only_ever_shrinks_runs(monkeypatch):
    runs = [(0.2, 3.7), (5.0, 9.0), (9.5, 10.5)]
    monkeypatch.setattr(rfa, "change_points", lambda v, m, judged: [[] for _ in judged])
    assert rfa.confirm_freezes("v.mp4", {}, runs, 1.5, 20.0, 2.5) == runs
    # Changes at 1.7 and 2.2 split the first run; a "change" outside a run is ignored; the
    # third run (1.0s, mid-video) cannot fail a check and is never re-read.
    seen = []

    def fake(v, m, judged):
        seen.extend(judged)
        return [[1.7, 2.2], [12.0]]
    monkeypatch.setattr(rfa, "change_points", fake)
    assert rfa.confirm_freezes("v.mp4", {}, runs, 1.5, 20.0, 2.5) == [(0.2, 1.7), (2.2, 3.7), (5.0, 9.0), (9.5, 10.5)]
    assert seen == [(0.2, 3.7), (5.0, 9.0)]
    # The end-card still (no check can fail on it: 0.1s before the end card) is never re-read.
    seen.clear()
    monkeypatch.setattr(rfa, "change_points", lambda v, m, judged: seen.extend(judged) or [[] for _ in judged])
    rfa.confirm_freezes("v.mp4", {}, [(0.2, 3.7), (7.4, 10.5)], 1.5, 7.5, 2.5)
    assert seen == [(0.2, 3.7)]


# ---------------------------------------------------------------- 3. click-only audio

@needs_ffmpeg
def test_click_only_track_is_silence_in_a_spoken_ad(tmp_path):
    """Hook and dead air ask for sound a viewer hears as speech or music, not isolated ticks."""
    code, r = run(tmp_path, moving(tmp_path, "clicks", 7.0, CLICKS))
    assert code == 2
    assert r["checks"]["hook"]["status"] == "fail" and "no sound for the first" in r["checks"]["hook"]["note"]


@needs_ffmpeg
def test_clicks_inside_a_pause_are_still_dead_air(tmp_path):
    expr = f"if(between(t,2,4),{CLICKS},{TONE})"  # tone, then 2s of clicks only, then tone
    code, r = run(tmp_path, moving(tmp_path, "gap", 7.0, expr))
    assert r["checks"]["dead_air"]["status"] == "fail", r["checks"]["dead_air"]
    assert r["checks"]["hook"]["status"] == "pass"


@needs_ffmpeg
def test_click_stretch_times_hold_in_mpeg_ts_with_late_audio(tmp_path):
    """Reviewer repro: TS whose audio starts 0.7s late. The click-only stretch (2.0-3.5s of the
    track) must be reported on silencedetect's timeline (about 2.7-4.2s)."""
    v = moving(tmp_path, "late_a", 7.0, f"if(between(t,2,3.5),{CLICKS},{TONE})")
    shifted = tmp_path / "late_a.ts"
    ff("-i", v, "-itsoffset", "0.7", "-i", v, "-map", "0:v", "-map", "1:a", "-c", "copy", "-f", "mpegts", shifted)
    code, r = run(tmp_path, shifted)
    gaps = r["checks"]["dead_air"]["data"].get("gaps") or []
    assert r["checks"]["dead_air"]["status"] == "fail" and gaps, r["checks"]["dead_air"]
    assert abs(gaps[0][0] - 2.7) < 0.15 and abs(gaps[0][1] - 4.2) < 0.15, gaps


def two_tracks(tmp, name, clicks_default, tone_start=0.0, first=CLICKS):
    """Two audio tracks: a click-only mono track FIRST (0:a:0), then a stereo tone. With
    clicks_default the click track carries the default flag (players play it); otherwise the
    tone does. The tone can start late (silent until tone_start); `first` replaces the clicks."""
    out = Path(tmp) / f"{name}.mp4"
    tone = f"if(lt(t,{tone_start}),0,{TONE})"
    ff("-f", "lavfi", "-i", "testsrc2=s=1080x1920:r=30:d=7", "-f", "lavfi", "-i", f"aevalsrc='{first}':s=44100:d=7",
       "-f", "lavfi", "-i", f"aevalsrc='{tone}|{tone}':s=44100:d=7",
       "-map", "0:v", "-map", "1:a", "-map", "2:a", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-disposition:a:0", "default" if clicks_default else "0",
       "-disposition:a:1", "0" if clicks_default else "default", out)
    return out


def first_track_is_clicks_only(video):
    """Fixture guard: the FIRST audio track (0:a:0) on its own holds only clicks, so a reader
    that took 0:a:0 instead of the default track would call this a click-only ad."""
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(video), "-map", "0:a:0", "-af",
                          "aresample=16000,asetnsamples=n=160:p=0,astats=metadata=1:reset=1:measure_overall=Peak_level:"
                          "measure_perchannel=none,ametadata=mode=print:key=lavfi.astats.Overall.Peak_level",
                          "-f", "null", "-"], capture_output=True, text=True)
    windows, t = [], None
    for line in out.stderr.splitlines():
        if "pts_time:" in line:
            t = float(line.split("pts_time:")[1].split()[0])
        elif "Peak_level=" in line and t is not None:
            v = line.split("Peak_level=")[1].strip()
            windows.append((t, float("-inf") if "inf" in v else float(v)))
            t = None
    return bool(rfa.click_only_spans(windows, 0.5))


@needs_ffmpeg
def test_the_default_audio_track_is_read_not_the_first(tmp_path):
    """The click reader takes ffmpeg's default track, like silencedetect and like players: a
    click-only FIRST track next to a default stereo tone does not change the verdict (PASS, as
    on main). Reading 0:a:0 would call this ad click-only and fail its hook."""
    out = two_tracks(tmp_path, "two", clicks_default=False)
    assert first_track_is_clicks_only(out), "fixture: 0:a:0 must be the click-only track"
    code, r = run(tmp_path, out)
    assert code == 0, r["checks"]


@needs_ffmpeg
def test_a_default_click_only_track_fails_even_with_music_on_another_track(tmp_path):
    """The click-only track is first AND default: players play it, and both readers take it, so
    the ad has no sound a viewer hears as speech or music (hook fails)."""
    out = two_tracks(tmp_path, "two_clicks", clicks_default=True)
    code, r = run(tmp_path, out)
    assert code == 2 and r["checks"]["hook"]["status"] == "fail", r["checks"]["hook"]
    assert "no sound for the first" in r["checks"]["hook"]["note"]


@needs_ffmpeg
def test_silent_text_judges_the_default_track_not_the_first(tmp_path):
    """Silent-text: a digitally silent first track, and a default music track that starts 2.5s
    late. The default track is the one that plays, so the late start fails the hook. Reading the
    level from 0:a:0 called the audio "inaudible" and skipped the check."""
    out = two_tracks(tmp_path, "two_late", clicks_default=False, tone_start=2.5, first="0")
    code, r = run(tmp_path, out, "--format-profile", "silent-text", "--no-speech", "--endcard-s", "3")
    hook = r["checks"]["hook"]
    assert hook["status"] == "fail" and "no sound for the first 2.5s" in hook["note"], hook
    assert r["checks"]["dead_air"]["data"]["audio"] == "audible", r["checks"]["dead_air"]


@needs_ffmpeg
def test_dense_ticking_is_a_rhythm_not_silence(tmp_path):
    """Hi-hat-like ticks 8 times a second under a 1.5s VO pause are a music bed, not dead air."""
    hats = "if(lt(mod(t,0.125),0.004),0.3*sin(2*PI*7000*t),0)"
    code, r = run(tmp_path, moving(tmp_path, "hats", 7.0, f"if(between(t,2,3.5),{hats},{TONE})"))
    assert r["checks"]["dead_air"]["status"] == "pass", r["checks"]["dead_air"]


@needs_ffmpeg
def test_click_reading_failure_falls_back_to_silencedetect(tmp_path, monkeypatch):
    """If the 10ms reading cannot run (an old ffmpeg), the check judges as before, not exit 3."""
    v = moving(tmp_path, "fb", 7.0, CLICKS)
    monkeypatch.setattr(rfa, "sound_windows", lambda *_a: None)
    code, r = run(tmp_path, v)
    assert code == 0 and r["checks"]["hook"]["status"] == "pass", r["checks"]


@needs_ffmpeg
def test_click_only_track_with_no_speech_keeps_its_old_meaning(tmp_path):
    code, r = run(tmp_path, moving(tmp_path, "sfx", 7.0, CLICKS), "--no-speech")
    assert code == 0, r["checks"]
    assert r["checks"]["dead_air"]["status"] == "not_applicable"


@needs_ffmpeg
@pytest.mark.parametrize("expr", [
    # Speech-like: 150-300ms syllables with 100-200ms gaps.
    "if(lt(mod(t,0.45),0.3),0.5*sin(2*PI*220*t)*sin(PI*mod(t,0.45)/0.3),0)",
    # Percussive music: a decaying 60Hz kick twice a second.
    "0.9*sin(2*PI*60*t)*exp(-mod(t,0.5)*25)",
])
def test_real_sound_with_gaps_is_unchanged(tmp_path, expr):
    code, r = run(tmp_path, moving(tmp_path, "real", 7.0, expr))
    assert code == 0, r["checks"]


def kinetic(tmp, name, audio_expr):
    """A dark card with a light block sliding across it (a moving kinetic beat), 7s, with an
    audio track built from an expression."""
    out = Path(tmp) / f"{name}.mp4"
    ff("-f", "lavfi", "-i", "color=c=0x141720:s=1080x1920:r=30:d=7", "-f", "lavfi", "-i", "color=c=0xf5f2eb:s=300x120:r=30:d=7",
       "-f", "lavfi", "-i", f"aevalsrc='{audio_expr}':s=44100:d=7",
       "-filter_complex", "[0:v][1:v]overlay=x='100+mod(t*300,600)':y=900,format=yuv420p[v]",
       "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac", out)
    return out


@needs_ffmpeg
def test_click_only_track_in_silent_text_is_no_meaningful_audio(tmp_path):
    """Typewriter key clicks in a silent kinetic ad are legitimate sound effects; the machine
    calls them 'no meaningful audio' and the sheet asks a person to listen."""
    out = kinetic(tmp_path, "kt", CLICKS)
    code, r = run(tmp_path, out, "--format-profile", "silent-text", "--no-speech", "--endcard-s", "3")
    da = r["checks"]["dead_air"]
    assert da["status"] == "not_applicable" and da["data"]["audio"] == "clicks", da
    assert any(line.startswith("audio: the track has only isolated clicks") for line in r["judge_on_sheet"])
    assert r["checks"]["hook"]["status"] == "pass" and "clicks from 0.0s" in r["checks"]["hook"]["note"]


@needs_ffmpeg
def test_click_only_track_in_silent_text_must_start_with_the_opening(tmp_path):
    """Clicks are heard: a typewriter track whose first click comes 2.8s in leaves the opening
    silent, so the hook fails as it does for music (and as on main)."""
    out = kinetic(tmp_path, "kt_late", f"if(lt(t,2.5),0,{CLICKS})")
    code, r = run(tmp_path, out, "--format-profile", "silent-text", "--no-speech", "--endcard-s", "3")
    hook = r["checks"]["hook"]
    assert hook["status"] == "fail" and "no sound for the first" in hook["note"], hook
    assert hook["data"]["lead_silence_s"] > 2.4 and hook["data"]["audio"] == "clicks", hook
    assert r["checks"]["dead_air"]["status"] == "not_applicable"


def test_sound_events_and_click_spans():
    w = [(round(i * 0.01, 2), -80.0) for i in range(300)]  # 3s of silence, 10ms windows

    def loud(a, b):
        for i, (t, _) in enumerate(w):
            if a <= t < b:
                w[i] = (t, -10.0)
    loud(0.00, 0.30)                       # 300ms of sound
    for c in (1.0, 1.4, 1.8):              # isolated 10ms clicks
        loud(c, c + 0.01)
    loud(2.50, 2.53)                       # a 30ms click (still short)
    loud(2.80, 2.95)                       # sound again
    events = rfa.sound_events(w)
    assert [n for _, _, n in events] == [30, 1, 1, 1, 3, 15]
    assert [(round(a, 2), round(b, 2)) for a, b in rfa.click_only_spans(w, 0.5)] == [(0.3, 2.8)]
    assert rfa.click_only_spans([(t, -80.0) for t, _ in w], 0.5) == []  # pure silence: silencedetect's job


def test_a_40ms_event_is_sound_at_any_start_time():
    """Window counts are integers: a 4-window event is sound wherever it starts (float seconds
    used to make some start times read as 39.99ms)."""
    for start in range(0, 700):
        w = [(round((start + i) * 0.01, 2), -10.0 if i < 4 else -80.0) for i in range(60)]
        assert rfa.sound_events(w)[0][2] == 4, start
