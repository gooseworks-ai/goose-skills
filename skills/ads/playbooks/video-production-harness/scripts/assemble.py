#!/usr/bin/env python3
"""Render a source-linked local edit. Never approves audiovisual content."""
import argparse
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

# Load sibling helpers from this file's own folder. `python3 -I` (isolated
# mode) leaves the script folder off sys.path, so add it explicitly.
_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from assembly_timeline import FORMAT, MAX_STRETCH, MAX_UPSCALED_ZOOM, MAX_ZOOM, normalize_timeline, zoom_factor  # noqa: E402,F401
from assemble_sources import file_sha256, legacy_timeline, probe, run, source_record  # noqa: E402,F401

TEMPLATE_KIND = 'template'


def tempo_filters(rate):
    values=[]
    while rate>2: values.append('atempo=2'); rate/=2
    while rate<0.5: values.append('atempo=0.5'); rate*=2
    return ','.join(values+[f'atempo={rate}'])


def checked_sources(timeline):
    sources=[s['video'] for s in timeline['segments']]+[c['source'] for c in timeline['audio_cues']]
    sources += [s['speech_driver'] for s in timeline['segments'] if s.get('speech_driver')]
    checked={}
    for source in sources:
        if not source.get('path'): raise ValueError('Every source needs matching local bytes; download the reviewed asset')
        path=Path(source['path']).resolve(); source['path']=str(path)
        if not path.is_file() or file_sha256(path)!=source['sha256']: raise ValueError('Source bytes differ from their approved checksum')
        if str(path) not in checked: checked[str(path)]=probe(path)
        seconds=float(checked[str(path)]['format'].get('duration',0))
        if not math.isfinite(seconds) or source['in_ms']<0 or source['out_ms']<=source['in_ms'] or seconds*1000+1<source['out_ms']:
            raise ValueError(f'Source is shorter than its reviewed timeline: {source["asset_id"]}')
    for segment in timeline['segments']:
        if not any(s['codec_type']=='video' for s in checked[segment['video']['path']]['streams']): raise ValueError('A picture source has no video stream')
    for cue in timeline['audio_cues']:
        if not any(s['codec_type']=='audio' for s in checked[cue['source']['path']]['streams']): raise ValueError(f'{cue["id"]} has no audio stream')
    return sources,checked


def picture_filter(segment,info,width,height,fps):
    """Explicit crop or fill-crop; refuse uneven stretch and zooming in past the shared cap.

    Resolution scaling is allowed (H3's 432x768 fills 1080x1920 at zoom 1.0). The cap is on zoom:
    the crop's fill scale divided by the full source frame's fill scale. On a source below the
    output's resolution (lip-sync's 720p) the crop multiplies with that upscale, so it may zoom 1.1x.
    """
    source=segment['video']; stream=next(s for s in info['streams'] if s['codec_type']=='video')
    src_w,src_h=int(stream['width']),int(stream['height'])
    timing=f'trim=start={source["in_ms"]/1000}:end={source["out_ms"]/1000},setpts=(PTS-STARTPTS)/{source["speed"]}'
    crop=source.get('crop')
    if crop:
        if crop['x']+crop['w']>src_w or crop['y']+crop['h']>src_h:
            raise ValueError(f'{segment["id"]}: crop falls outside the {src_w}x{src_h} source')
        scale_x=crop.get('scale_x',source.get('scale_x')); scale_y=crop.get('scale_y',source.get('scale_y'))
        if abs(crop['w']*scale_x-width)>2 or abs(crop['h']*scale_y-height)>2:
            raise ValueError(f'{segment["id"]}: crop times scale must fill {width}x{height}')
        frame=f'crop={crop["w"]}:{crop["h"]}:{crop["x"]}:{crop["y"]},scale={width}:{height}'
        zoom=zoom_factor(crop,src_w,src_h,width,height)
    else:
        scale_x=scale_y=max(width/src_w,height/src_h)
        frame=f'scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}'
        zoom=1.0
    if abs(scale_x/scale_y-1)>MAX_STRETCH:
        raise ValueError(f'{segment["id"]}: uneven stretch; keep people and products in proportion')
    fit=max(width/src_w,height/src_h); limit=MAX_UPSCALED_ZOOM if fit>1+1e-9 else MAX_ZOOM
    if zoom>limit+1e-9:
        raise ValueError(f'{segment["id"]}: crop zooms {zoom:.2f}x into the {src_w}x{src_h} source, {fit*zoom:.2f}x over its pixels (limit {limit}x'
                         +(f' on a source upscaled {fit:.2f}x' if limit==MAX_UPSCALED_ZOOM else '')+'); use a wider crop or new coverage')
    return f'{timing},{frame},setsar=1,fps={fps}'


def assemble(plan,output):
    sizes={'9:16':(1080,1920),'16:9':(1920,1080),'1:1':(1080,1080),'4:5':(1080,1350)}
    expected=sizes[plan.get('aspect_ratio','9:16')]; width=plan.get('width',expected[0]); height=plan.get('height',expected[1]); fps=plan.get('fps',30)
    if not isinstance(fps,int) or isinstance(fps,bool) or not 1<=fps<=60 or any(not isinstance(v,int) or isinstance(v,bool) or v<=0 or v%2 for v in (width,height)):
        raise ValueError('Use integer fps 1–60 and positive even dimensions')
    if abs(width/height-expected[0]/expected[1])>0.01: raise ValueError('Dimensions must match the approved aspect ratio')
    if plan.get('captions_ass') and ' ass ' not in subprocess.check_output(['ffmpeg','-hide_banner','-filters'],text=True,stderr=subprocess.DEVNULL):
        raise ValueError('Captions need an FFmpeg build with libass; install/use that supported build before assembly')
    explicit=plan.get('assembly_timeline'); issues=[]
    if explicit is None:
        if plan.get('production_kind')!=TEMPLATE_KIND:
            raise ValueError('A custom video needs an assembly_timeline (gooseworks-assembly-timeline/1) that links every picture to its sound; '
                             'see references/recipe-format.md. The plain clip list is only for template replays ("production_kind": "template").')
        timeline,issues=legacy_timeline(plan)
        evidence=normalize_timeline(None,{'audio_strategy':plan.get('audio_strategy'),'issues':issues})
    else:
        if plan.get('voice_path') or plan.get('music_path'): raise ValueError('Use explicit audio_cues instead of parallel implicit voice/music paths')
        evidence=normalize_timeline(explicit)
        if evidence['status']!='complete': raise ValueError('; '.join(evidence['issues']))
        timeline=evidence['timeline']
    duration=timeline['duration_ms']/1000
    if not 0<duration<=180 or not 1<=len(timeline['segments'])<=60: raise ValueError('Supply 1–60 clips totaling at most 180 seconds')
    if timeline.get('visual_overrides'): raise ValueError('Freezes/transitions need a custom saved renderer exposing the same checked timeline')
    position=0
    for segment in timeline['segments']:
        if segment['start_ms']!=position: raise ValueError('This assembler needs contiguous picture segments; custom joins must supply the same timeline evidence')
        position=segment['end_ms']
    if position!=timeline['duration_ms']: raise ValueError('Picture must cover the complete cut')
    sources,probes=checked_sources(timeline)
    output=Path(output).resolve(); output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='video-assembly-') as folder:
        scratch=Path(folder); normalized=[]
        for index,segment in enumerate(timeline['segments']):
            source=segment['video']; target=scratch/f'{index:03d}.mp4'
            vf=picture_filter(segment,probes[source['path']],width,height,fps)
            # Speech is restored from its checked original cue on the SAME clock below.
            run(['ffmpeg','-nostdin','-v','error','-y','-i',source['path'],'-vf',vf,'-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',str(target)])
            normalized.append(target)
        listing=scratch/'clips.txt'; listing.write_text(''.join(f"file '{file.as_posix()}'\n" for file in normalized)); joined=scratch/'joined.mp4'
        run(['ffmpeg','-nostdin','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-c','copy',str(joined)])
        args=['ffmpeg','-nostdin','-v','error','-y','-i',str(joined),'-f','lavfi','-i',f'anullsrc=r=48000:cl=stereo:d={duration}']
        graph=[]; buses=['1:a']
        for index,cue in enumerate(timeline['audio_cues'],2):
            source=cue['source']; args += ['-i',source['path']]; length=(cue['end_ms']-cue['start_ms'])/1000
            chain=f'[{index}:a]aresample=48000,atrim=start={source["in_ms"]/1000}:end={source["out_ms"]/1000},asetpts=PTS-STARTPTS,{tempo_filters(source["speed"])}'
            if cue['loop']:
                samples=max(1,round((source['out_ms']-source['in_ms'])/source['speed']/1000*48000)); chain+=f',aloop=loop=-1:size={samples}'
            chain+=f',atrim=duration={length},volume={cue["gain_db"]}dB,adelay={cue["start_ms"]}:all=1[a{index}]'
            graph.append(chain); buses.append(f'a{index}')
        graph.append(''.join(f'[{bus}]' for bus in buses)+f'amix=inputs={len(buses)}:duration=first:normalize=0[mix]')
        args += ['-filter_complex',';'.join(graph),'-map','0:v:0','-map','[mix]']
        captions=plan.get('captions_ass')
        if captions:
            caption_path=Path(captions).resolve().as_posix().replace('\\','\\\\').replace(':','\\:').replace("'","\\'")
            args += ['-vf',f"ass=filename='{caption_path}'"]
        args += ['-t',str(duration),'-c:v','libx264' if captions else 'copy','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart',str(output)]
        run(args)
    for source in sources:
        if file_sha256(source['path'])!=source['sha256']: raise ValueError('A source changed during assembly; candidate cannot be published')
    info=probe(output); actual=float(info['format']['duration']); visual=next(s for s in info['streams'] if s['codec_type']=='video')
    if abs(float(visual.get('duration',0))-duration)>max(0.15,2/fps) or abs(actual-duration)>max(0.15,2/fps): raise ValueError('Actual export duration differs from the checked timeline')
    excerpts=[c['source_excerpt'] for c in plan.get('clips',[]) if c.get('source_excerpt')] if explicit is None else \
        [{'segment_id':s['id'],'scene_id':s['scene_id'],**{k:v for k,v in s['video'].items() if k!='path'}} for s in timeline['segments']]
    report={'output':str(output),'output_sha256':file_sha256(output),'duration_s':actual,'width':width,'height':height,
            'source_excerpts':excerpts,'assembly_timeline':timeline,
            'assembly_evidence':evidence,'source_bytes_verified':True,'quality_status':'incomplete','content_review_required':True,
            'remaining_review':['Full final playback with actual audio and motion','Words, joins, lip-sync, product actions and captions'],
            'technical_probe':info,'legacy_normalization_issues':issues}
    (output.parent/f'{output.name}.assembly.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('plan',help='Format settings plus assembly_timeline. A plain clip list is accepted only with "production_kind": "template"'); parser.add_argument('output')
    args=parser.parse_args(); print(json.dumps(assemble(json.loads(Path(args.plan).read_text()),args.output)))


if __name__=='__main__': main()
