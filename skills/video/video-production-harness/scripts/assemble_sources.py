"""Source probing and the legacy clip-list timeline for assemble.py."""
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

_SCRIPTS = str(Path(__file__).resolve().parent)
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)
from assembly_timeline import FORMAT  # noqa: E402


def run(args):
    subprocess.run(args, check=True, capture_output=True, text=True, timeout=600)


def probe(file):
    return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)],text=True,timeout=60))


def file_sha256(source):
    with Path(source).open('rb') as handle:
        digest = hashlib.sha256()  # file_digest needs Python 3.11; stay 3.9-safe
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
        return digest.hexdigest()


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
