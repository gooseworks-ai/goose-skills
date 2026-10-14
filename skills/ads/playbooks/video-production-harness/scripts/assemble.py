#!/usr/bin/env python3
"""Render a source-linked local edit. Never approves audiovisual content."""
import argparse
import hashlib
import json
import math
import subprocess
import tempfile
from pathlib import Path
from assembly_timeline import FORMAT, normalize_timeline


def run(args):
    subprocess.run(args, check=True, capture_output=True, text=True, timeout=600)


def probe(file):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)],text=True,timeout=60))


def file_sha256(source):
    with Path(source).open('rb') as handle:
        return hashlib.file_digest(handle,'sha256').hexdigest()


def source_record(path, start, end, speed=1, asset_id=None):
    source=Path(path).resolve()
    return {'asset_id':asset_id or source.name,'sha256':file_sha256(source),'path':str(source),'in_ms':start,'out_ms':end,'speed':speed}


def legacy_timeline(plan):
    """Preserve known legacy sound; unresolved intent never becomes a content pass."""
    segments,cues,issues,position=[],[],[],0
    voice=plan.get('voice_path'); mode=plan.get('speech_mode'); soundtrack=plan.get('soundtrack_modes')
    if mode is None:
        issues.append('Legacy speech mode is unresolved; audio_strategy does not prove its speech source')
    if soundtrack is None:
        issues.append('Legacy soundtrack is unresolved; empty transcription never authorizes muting')
    for number,clip in enumerate(plan.get('clips',[]),1):
        duration=float(clip['duration_s'])
        if not math.isfinite(duration) or duration<=0:
            raise ValueError('Every clip needs a finite positive duration')
        length=round(duration*1000); excerpt=clip.get('source_excerpt') or {}
        start=excerpt.get('start_ms',clip.get('source_in_ms',0)); speed=clip.get('speed',1)
        if not isinstance(speed,(int,float)) or isinstance(speed,bool) or not math.isfinite(speed) or not 0.25<=speed<=4:
            raise ValueError('Source speed must be finite and between 0.25 and 4')
        end=excerpt.get('end_ms',round(start+length*speed))
        source=source_record(clip['path'],start,end,speed,excerpt.get('asset_id',clip.get('asset_id')))
        if excerpt and source['sha256']!=excerpt.get('analysis_revision'):
            raise ValueError('Saved original bytes changed; review the selection again')
        if excerpt and abs((end-start)/speed-length)>1:
            raise ValueError('Saved source bounds differ from final duration')
        info=probe(source['path']); has_audio=any(s['codec_type']=='audio' for s in info['streams'])
        choice=clip.get('native_audio')
        if choice is None and excerpt.get('audio_mode') in ('original','muted'):
            choice='preserve' if excerpt['audio_mode']=='original' else 'muted'
        if voice and has_audio and choice!='muted':
            raise ValueError('External narration cannot implicitly replace native audio, including generated speech. Supply a reviewed source-linked plan.')
        if choice is None:
            choice='preserve' if has_audio else 'muted'
            issues.append(f'Clip {number}: available source sound preserved; its role requires review')
        if choice not in ('preserve','muted'):
            raise ValueError('native_audio must be preserve or muted')
        segment_mode=clip.get('speech_mode',mode); depicts=clip.get('depicts_speech')
        if segment_mode=='native_dialogue' and choice!='preserve':
            raise ValueError('A native-speaking source cannot be muted or replaced by separate narration')
        if depicts is True and segment_mode in ('none','narration'):
            raise ValueError('A speaking face needs linked native speech or an exact audio-driven lip-sync plan')
        if depicts is None:
            issues.append(f'Clip {number}: whether the picture depicts speech is unresolved')
        segment={'id':str(clip.get('id',f'clip-{number}')),'scene_id':str(clip.get('scene_id',f'scene-{number}')),
                 'start_ms':position,'end_ms':position+length,'video':source,'speech_mode':segment_mode,
                 'depicts_speech':depicts,'native_audio':choice}
        for key in ('speech_driver','intent'):
            if clip.get(key): segment[key]=clip[key]
        segments.append(segment)
        if has_audio and choice=='preserve':
            cues.append({'id':f'native-{number}','role':'native_dialogue' if segment_mode=='native_dialogue' else 'source_ambience',
                         'source':source,'start_ms':position,'end_ms':position+length,'gain_db':0,'loop':False,
                         **({'intent':clip['intent']} if clip.get('intent') else {})})
        position+=length
    for key,role in (('voice_path','narration'),('music_path','music')):
        if not plan.get(key): continue
        seconds=float(probe(plan[key])['format']['duration']); end=min(round(seconds*1000),position)
        if not math.isfinite(seconds) or end<=0: raise ValueError(f'{key} has no usable duration')
        cues.append({'id':f'legacy-{role}','role':role,'source':source_record(plan[key],0,end),
                     'start_ms':0,'end_ms':end,'gain_db':plan.get(f'{role}_gain_db',0),'loop':False})
        issues.append(f'Legacy {role}: natural length retained without automatic loop, ducking or padding; placement and mix need review')
    return {'format':FORMAT,'creative_contract_revision':plan.get('creative_contract_revision'),'duration_ms':position,
            'speech_mode':mode,'soundtrack_modes':soundtrack,'segments':segments,'audio_cues':cues,
            'pauses':plan.get('pauses',[]),'required_cue_ids':plan.get('required_cue_ids',[])},issues


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
            raise ValueError(f'Source bounds exceed actual media: {source["asset_id"]}')
    for segment in timeline['segments']:
        if not any(s['codec_type']=='video' for s in checked[segment['video']['path']]['streams']): raise ValueError('A picture source has no video stream')
    for cue in timeline['audio_cues']:
        if not any(s['codec_type']=='audio' for s in checked[cue['source']['path']]['streams']): raise ValueError(f'{cue["id"]} has no audio stream')
    return sources


def assemble(plan,output):
    sizes={'9:16':(1080,1920),'16:9':(1920,1080),'1:1':(1080,1080),'4:5':(1080,1350)}
    expected=sizes[plan.get('aspect_ratio','9:16')]; width=plan.get('width',expected[0]); height=plan.get('height',expected[1]); fps=plan.get('fps',30)
    if not isinstance(fps,int) or isinstance(fps,bool) or not 1<=fps<=60 or any(not isinstance(v,int) or isinstance(v,bool) or v<=0 or v%2 for v in (width,height)):
        raise ValueError('Use integer fps 1–60 and positive even dimensions')
    if abs(width/height-expected[0]/expected[1])>0.01: raise ValueError('Dimensions must match the approved ratio')
    explicit=plan.get('assembly_timeline'); issues=[]
    if explicit is None:
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
    sources=checked_sources(timeline)
    output=Path(output).resolve(); output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='video-assembly-') as folder:
        scratch=Path(folder); normalized=[]
        for index,segment in enumerate(timeline['segments']):
            source=segment['video']; target=scratch/f'{index:03d}.mp4'
            vf=f'trim=start={source["in_ms"]/1000}:end={source["out_ms"]/1000},setpts=(PTS-STARTPTS)/{source["speed"]},scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,fps={fps}'
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
    report={'output':str(output),'output_sha256':file_sha256(output),'duration_s':actual,'assembly_timeline':timeline,
            'assembly_evidence':evidence,'source_bytes_verified':True,'quality_status':'incomplete','content_review_required':True,
            'remaining_review':['Full final playback with actual audio and motion','Words, joins, lip-sync, product actions and captions'],
            'technical_probe':info,'legacy_normalization_issues':issues}
    (output.parent/f'{output.name}.assembly.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('plan',help='Format settings plus assembly_timeline; legacy clips remain explicitly incomplete'); parser.add_argument('output')
    args=parser.parse_args(); print(json.dumps(assemble(json.loads(Path(args.plan).read_text()),args.output)))


if __name__=='__main__': main()
