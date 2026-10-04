"""Check the encoded master: dimensions, audio, frame count and complete tail.

This is a technical gate. The calling recipe still reviews the final picture,
copy and sound; stream metadata alone cannot establish creative acceptance.
"""
import json
import subprocess
import sys

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]))

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
    print(f'Checked master: {video["nb_frames"]} frames, {video["duration"]}s, SFX stream and complete ending')

if __name__ == '__main__':
    check(*sys.argv[1:])
