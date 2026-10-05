#!/usr/bin/env python3
"""Build and render a single-shape ad, including an original local audio bed."""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from build_composition import build
from synth_audio import synth


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--config',required=True)
    p.add_argument('--output',required=True)
    p.add_argument('--ratio',choices=['9:16','1:1'],default='9:16')
    p.add_argument('--fps',type=int,default=30)
    p.add_argument('--width',type=int,default=1080)
    p.add_argument('--ffmpeg',default=os.environ.get('FFMPEG_BIN','ffmpeg'))
    p.add_argument('--loop',action='store_true')
    p.add_argument('--work-dir',help='Directory for HTML, audio, and the silent intermediate')
    sound=p.add_mutually_exclusive_group()
    sound.add_argument('--music',help='Supplied licensed local music instead of synthesis')
    sound.add_argument('--mute',action='store_true',help='Make a silent video')
    a=p.parse_args()
    if a.fps<1 or a.width<180 or a.width%2: p.error('Use positive fps and an even width of at least 180')
    cfg=json.loads(Path(a.config).read_text());bpm=float(cfg.get('bpm',120));duration=len(cfg['states'])*240/bpm
    out=Path(a.output).resolve();out.parent.mkdir(parents=True,exist_ok=True)
    work=Path(a.work_dir).resolve() if a.work_dir else out.parent/(out.stem+'-working');work.mkdir(parents=True,exist_ok=True)
    html=work/'index.html';build(a.config,html,a.ratio,a.loop,a.fps)
    audio=Path(a.music).resolve() if a.music else work/'original-bed.wav'
    if a.music and (not audio.is_file() or audio.read_bytes().startswith(b'version https://git-lfs.github.com/spec/')):
        p.error('Music must be a real local audio file')
    if not a.music and not a.mute:synth(audio,duration,bpm)
    height=round(a.width*16/9) if a.ratio=='9:16' else a.width
    if height%2: height+=1
    env={**os.environ,'FFMPEG_BIN':a.ffmpeg}
    subprocess.run([a.ffmpeg,'-version'],check=True,stdout=subprocess.DEVNULL)
    print(f'Rendering {a.ratio}: {a.width}x{height}, {duration:.2f}s at {a.fps}fps',flush=True)
    subprocess.run([sys.executable,str(Path(__file__).with_name('render_hyperframe.py')),str(html),str(work/'silent.mp4'),str(duration),'--fps',str(a.fps),'--width',str(a.width),'--height',str(height),'--no-audio-track'],check=True,env=env)
    if a.mute:
        subprocess.run([a.ffmpeg,'-y','-loglevel','error','-i',str(work/'silent.mp4'),'-c:v','copy','-an','-movflags','+faststart',str(out)],check=True)
    else:
        subprocess.run([a.ffmpeg,'-y','-loglevel','error','-i',str(work/'silent.mp4'),'-i',str(audio),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-af','apad','-t',str(duration),'-movflags','+faststart',str(out)],check=True)
    subprocess.run([a.ffmpeg,'-y','-loglevel','error','-ss',str(duration-.7),'-i',str(out),'-frames:v','1',str(out.with_suffix('.jpg'))],check=True)
    manifest={'output':str(out),'poster':str(out.with_suffix('.jpg')),'html':str(html),'duration':duration,'fps':a.fps,'width':a.width,'height':height,'ratio':a.ratio,'loop':a.loop,'bpm':bpm,'media_generation_credits':0,'audio_source':'mute' if a.mute else 'supplied licensed audio' if a.music else 'original deterministic synthesis; seed 47; no samples','states':cfg['states']}
    out.with_suffix('.manifest.json').write_text(json.dumps(manifest,indent=2))
    print(f'Complete: {out}',flush=True)


if __name__=='__main__':main()
