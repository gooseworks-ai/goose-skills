"""Check the encoded master: dimensions, audio, frame count, complete tail and
the platform safe area (QA-60) recorded by record-chat.js.

`python3 check-render.py MASTER TIMELINE END` checks a full render.
`python3 check-render.py --safe-area master-chat.safe-area.json` checks only the
safe-area report, e.g. after `record-chat.js --preview-only`.

This is a technical gate. The calling recipe still reviews the final picture,
copy and sound; stream metadata alone cannot establish creative acceptance.
"""
import array
import json
import os
import subprocess
import sys

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))

def check_safe_area(report_path):
    """Re-verify, from the stored canvas-pixel boxes, that the newest chat row and
    any sheet stayed inside the safe zone on every checked frame."""
    with open(report_path) as fh:
        report = json.load(fh)
    if not report.get('enabled'):
        print('Safe area: off (safe_area:false); platform placement not checked')
        return report
    zone = report['zone']
    boxes = [dict(b, at=f"{kind} extent") for kind, b in report['extent'].items()]
    boxes += [dict(b, at=f"final {b['kind']} {b.get('id', '')}") for b in report['final']['boxes']]
    assert boxes, 'Safe-area report has no measured rows'
    assert 'newest' in report['extent'], 'Safe-area report never measured the newest row'
    for b in boxes:
        inside = (b['left'] >= zone['left'] - 0.5 and b['top'] >= zone['top'] - 0.5
                  and b['right'] <= zone['right'] + 0.5 and b['bottom'] <= zone['bottom'] + 0.5)
        assert inside, (f"{b['at']} [{b['left']:.0f},{b['top']:.0f} to {b['right']:.0f},{b['bottom']:.0f}] leaves the "
                        f"safe zone [{zone['left']:.0f},{zone['top']:.0f} to {zone['right']:.0f},{zone['bottom']:.0f}]")
    assert not report.get('violations'), f"Recorder logged safe-area violations: {report['violations'][:3]}"
    newest = report['extent']['newest']
    print(f"Checked safe area over {report['checked']}: newest row x {newest['left']:.0f}-{newest['right']:.0f} "
          f"< {zone['right']:.0f}, y {newest['top']:.0f}-{newest['bottom']:.0f} < {zone['bottom']:.0f}")
    return report

def envelope(master):
    """Peak level per millisecond of the encoded mix (mono, 8 kHz)."""
    pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(master),'-ac','1','-ar','8000','-f','s16le','-'])
    samples=array.array('h'); samples.frombytes(pcm[:len(pcm)//2*2])
    return [max(abs(x) for x in samples[i:i+8]) for i in range(0,len(samples)-8,8)]

def bed_level(env, cues):
    """Loudest level of the mix away from every cue: 0 for an SFX-only mix, the
    music bed's own peaks when there is one. "Away" is more than 1.5 s after a
    cue (its tail has decayed) and more than 0.25 s before the next."""
    marks=sorted(round(c['t']*1000) for c in cues)
    clear=[]; prev=None
    for at in marks+[len(env)+250]:
        start=0 if prev is None else prev+1500
        clear+=env[max(0,start):max(0,min(len(env),at-250))]
        prev=at
    return max(clear,default=0)

def check_onsets(master, cues):
    """Every cue is audible at its movie frame, with or without a music bed.

    SFX only: the first sharp rise must sit within -150/+60 ms of the cue.

    Over a bed that test is wrong twice. A bed has attacks of its own, and a
    guitar note 150 to 200 ms before a cue was taken for the cue arriving early
    (Brightland clean run, 2026-10-07: all ten cues sat 7.5x to 24x above the
    bed and the check still raised at 2.20 s). So an onset must clear the
    loudest thing the bed does anywhere else. The send sound swells rather than
    clicks and clears that level about 70 ms after it starts, so the late bound
    is +250 ms: a missing or grossly shifted cue still fails, a few frames of
    drift under music is not measured here."""
    env=envelope(master)
    peak=max(env,default=0) or 1
    bed=bed_level(env, cues)
    over_bed=bed>0.05*peak
    floor=1.2*bed if over_bed else 0.05*peak
    late=250 if over_bed else 60
    for cue in cues:
        at=round(cue['t']*1000); found=None
        for ms in range(max(0,at-200),min(len(env),at+late+1)):
            if env[ms]<=floor: continue
            base=min(env[max(0,ms-60):ms] or [0])
            if over_bed or env[ms]>4*max(base,1): found=ms; break
        assert found is not None and at-150<=found<=at+late, (
            f"Missing or shifted sound at {cue['t']:.2f}s"
            + (" (nothing clears the music bed there; is the bed too loud for the cues?)" if over_bed else ""))
    print(f'Checked {len(cues)} audible sound onsets against their movie frames'
          + (' over a music bed' if over_bed else ''))

def check(master, timeline_path, end):
    info, tail = probe(master), probe(end)
    timeline = json.load(open(timeline_path))
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    assert (video['width'], video['height']) == (1080, 1920), 'Final must be 1080×1920'
    assert any(s['codec_type'] == 'audio' for s in info['streams']), 'Missing SFX audio stream'
    end_video = next(s for s in tail['streams'] if s['codec_type'] == 'video')
    expected = timeline['total'] + float(end_video['duration']) - 0.3
    assert abs(float(video['duration']) - expected) < 0.07, 'Incomplete master duration'
    assert int(video['nb_frames']) >= round(expected * timeline['fps']) - 1, 'Missing encoded frames'
    last = max(e['t'] for e in timeline['timeline'] if e.get('sfx'))
    assert timeline['total'] - 0.3 - last >= 0.5, 'Last message lost to crossfade'
    cues=json.load(open(str(timeline_path).replace('.timeline.json','.sfx.json')))
    check_onsets(master, cues)
    safe = str(timeline_path).replace('.timeline.json', '.safe-area.json')
    assert os.path.exists(safe), f'Missing {safe}; re-record with the current record-chat.js'
    check_safe_area(safe)
    print(f'Checked master: {video["nb_frames"]} frames, {video["duration"]}s, SFX stream and complete ending')

if __name__ == '__main__':
    if sys.argv[1:2] == ['--safe-area']:
        check_safe_area(sys.argv[2])
    else:
        check(*sys.argv[1:])
