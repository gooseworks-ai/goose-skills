"""Check the encoded master: dimensions, audio, frame count and complete tail.

This is a technical gate. The calling recipe still reviews the final picture,
copy and sound; stream metadata alone cannot establish creative acceptance.
"""
import array
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
    # Check audible onsets in the encoded mix, including the actual MP3 lead-in.
    cues=json.load(open(str(timeline_path).replace('.timeline.json','.sfx.json')))
    pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(master),'-ac','1','-ar','8000','-f','s16le','-'])
    samples=array.array('h'); samples.frombytes(pcm[:len(pcm)//2*2])
    env=[max(abs(x) for x in samples[i:i+8]) for i in range(0,len(samples)-8,8)]
    peak=max(env,default=0) or 1
    for cue in cues:
        at=round(cue['t']*1000); found=None
        for ms in range(max(0,at-200),min(len(env),at+61)):
            base=min(env[max(0,ms-60):ms] or [0])
            if env[ms]>0.05*peak and env[ms]>4*max(base,1): found=ms; break
        assert found is not None and at-150<=found<=at+60, f"Missing or shifted sound at {cue['t']:.2f}s"
    print(f'Checked {len(cues)} audible sound onsets against their movie frames')
    print(f'Checked master: {video["nb_frames"]} frames, {video["duration"]}s, SFX stream and complete ending')

if __name__ == '__main__':
    check(*sys.argv[1:])
