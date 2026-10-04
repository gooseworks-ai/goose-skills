import importlib.util
import json
import pathlib
import sys
import pytest
from PIL import Image,ImageFont

ROOT=pathlib.Path(__file__).resolve().parents[2]
CAP=ROOT/'skills/ads/capabilities'

def module(skill,name):
    path=CAP/skill/'scripts'/f'{name}.py'
    sys.path.insert(0,str(path.parent))
    sp=importlib.util.spec_from_file_location(f'qa_{skill.replace("-","_")}_{name}',path)
    m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m)
    sys.path.pop(0)
    return m

join=module('create-creator-takes-h3','join_takes')
photo=module('footage-cutlist','photo')
layout=module('render-imessage-cascade','layout')
build=module('render-imessage-cascade','build_assets')
cascade_compose=module('render-imessage-cascade','compose')
kinetic=module('create-kinetic-typography','render')
pron=module('create-vo-elevenlabs','read_pronunciations')
foot=module('caption-burn','footprint')


def take(start,first,end):
    return {'path':'fixture.mp4','start':start,'duration':3,'words':[{'text':'complete','start':first,'end':end}]}

def test_late_word_shifts_join_and_survives():
    p=join.schedule([take(0,.1,1.4),take(1,0,1.8)],2.5,30)
    a,b=p['takes'];assert b['start']>=a['speech_end']+.029
    assert b['head_pad']>=p['dissolve_s']+.029
    assert p['duration']>=b['speech_end']+.029
    assert a['need']>=1.4

def test_normal_speech_and_one_take():
    p=join.schedule([take(0,.1,.7),take(1,.2,1)],2.5,30)
    assert p['duration']==2.5
    assert join.schedule([take(0,.1,1)],2,30)['duration']==2

def test_partial_words_fail():
    with pytest.raises(ValueError):join.schedule([take(0,.1,.5),{'path':'b','start':1,'duration':2,'onset':.1}],2,30)

def test_word_sidecar_rejects_missing_audio(tmp_path):
    p=tmp_path/'words.json';p.write_text(json.dumps([{'text':'x','start':.1,'end':8}]))
    with pytest.raises(ValueError):join.read_words(p,3)

def test_notification_wrap_and_legacy_geometry():
    f=build.font('reg',36)
    legacy=layout.geometry({'notifications':[{'body':'Hello'}]*4},f)
    assert (legacy['banner_height'],legacy['row_pitch'],legacy['bottom_y'])==(176,214,1200)
    g=layout.geometry({'notifications':[{'body':'The whole team can now see the update in one place.'}]*3},f)
    assert g['banner_height']==220
    assert all(f.getlength(line)<=636 for ls in g['body_lines'] for line in ls)

def test_excessive_copy_and_stack_fail():
    f=build.font('reg',36)
    for copy,n in [('x'*95,3),('This long notification needs another line for the full update.',5)]:
        with pytest.raises(ValueError):layout.geometry({'notifications':[{'body':copy}]*n},f)

def test_resolution_follows_clear_and_legacy_timing():
    c={'notifications':[{'body':'x'}]*4};assert layout.timing(c)==([1.6,3.6,5.6,7.6],9.2,None,9.9,14)
    c['resolution']={'body':'Done'}
    arrivals,clear,at,ec,dur=layout.timing(c);assert at>clear+.4 and ec>=at+2 and dur>=ec+3
    c['timing']={'endcard_in':9.9,'duration':14}
    with pytest.raises(ValueError):layout.timing(c)

@pytest.mark.parametrize('audio_keys',[[],['pop'],['bed','pop','swoosh']])
def test_resolution_sound_uses_the_actual_input_index(tmp_path,monkeypatch,audio_keys):
    sound=tmp_path/'sound.wav';sound.touch()
    c={'plate':'fixture.png','notifications':[{'body':'A short message'}],
       'audio':{k:str(sound) for k in audio_keys},'resolution':{'body':'All clear','sound':str(sound)}}
    cfg=tmp_path/'config.json';cfg.write_text(json.dumps(c))
    (tmp_path/'layout.json').write_text(json.dumps(layout.geometry(c,build.font('reg',36))))
    captured=[]
    def fake_run(cmd,**kw):
        captured.append(cmd)
        return type('Result',(),{'returncode':0,'stderr':''})()
    monkeypatch.setattr(cascade_compose.subprocess,'run',fake_run)
    monkeypatch.setattr(sys,'argv',['compose.py','--config',str(cfg),'--work-dir',str(tmp_path),'--out',str(tmp_path/'out.mp4')])
    cascade_compose.main();cmd=captured[0]
    idx=6+sum(k in audio_keys for k in ['pop','swoosh'])
    assert f'[{idx}:a]adelay=' in cmd[cmd.index('-filter_complex')+1]
    assert 'apad,atrim=duration=' in cmd[cmd.index('-filter_complex')+1]

@pytest.mark.parametrize('size',[(800,1400),(1400,800)])
def test_photo_preserves_whole_product_and_qualification(size):
    im=Image.new('RGB',size,'white')
    b={'photo':{'protected':[[0,0,1,1]],'start_pan':[-1,-1],'end_pan':[1,1]}}
    for t in [0,.5,1]:
        fr=photo.render(im,360,256,b,t,'#121212');assert fr.size==(360,256)
        assert fr.getbbox()==(0,0,360,256)
    assert photo.render(im,360,256,b,0,"#121212").tobytes()!=photo.render(im,360,256,b,1,"#121212").tobytes()

def test_photo_rejects_unsafe_crop_zoom():
    for b in [{'photo':{'end_scale':1.08}},{'crop':[0,0,.5,1],'photo':{'protected':[[0,0,1,1]]}}]:
        with pytest.raises(ValueError):photo.validate(b)

def test_caption_footprint_is_exact_renderer_geometry():
    spec={'size':[1080,1920],'seam':768,'beats':[{'id':'b1','start':0,'end':3,'state':'split','vo':'The qualification stays readable'}]}
    out=foot.footprint(spec,'plate')
    box=out['beats']['b1']['bbox'];assert box[1]<768<box[3]
    assert all(box[0]<=g['bbox'][0] and box[2]>=g['bbox'][2] for g in out['beats']['b1']['groups'])

def test_pronunciation_readback_next_run_and_unknown():
    store={'brand':{'id':'demo'},'learnings':[]}
    store['learnings'].append({'id':'fact1','kind':'must','source':'user','text':'Pronunciation: Demo => dee mo'})
    reread=json.loads(json.dumps(store));rules=pron.rules_from_context(reread,'demo',['Demo'])
    assert rules['pronunciations'][0]['say_as']=='dee mo'
    for brand,req in [('another',['Demo']),('demo',['Unknown'])]:
        with pytest.raises(ValueError):pron.rules_from_context(reread,brand,req)
    reread['learnings'][0]['source']='feedback'
    with pytest.raises(ValueError):pron.rules_from_context(reread,'demo',['Demo'])

def test_pronunciation_conflict():
    c={'brand':{'id':'x'},'learnings':[{'id':str(i),'kind':'must','source':'user','text':'Pronunciation: X => '+say} for i,say in enumerate(['ex','axe'])]}
    with pytest.raises(ValueError):pron.rules_from_context(c,'x',['X'])

def test_kinetic_long_copy_short_cta_and_missing_font():
    c={'size':[360,640],'font':'auto','beats':[{'text':'One clear message','duration_s':2}],'cta':{'text':'Try it','duration_s':3}}
    prepared=kinetic.layout(c);assert kinetic.frame(c,prepared,2.5).size==(360,640)
    for patch in [{'font':'missing.ttf'},{'cta':{'text':'Try it','duration_s':1.5}},{'beats':[{'text':'x'*200}]}]:
        with pytest.raises(ValueError):kinetic.layout({**c,**patch})

@pytest.mark.parametrize('fps_values',[(25,30),(30,30),(25,30,24)])
def test_real_mixed_rate_measured_join(tmp_path,fps_values):
    import subprocess
    takes=[]
    for i,fps in enumerate(fps_values):
        p=tmp_path/f't{i}.mp4'
        color=['0xcc3333','0x3366cc','0x33aa66'][i]
        subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',f'color=c={color}:s=160x240:r={fps}:d=2.5','-f','lavfi','-i','sine=frequency=440:duration=2.5','-c:v','libx264','-c:a','aac',str(p)],check=True)
        takes.append({'path':str(p),'start':i*.7,'duration':2.5,'words':[{'text':f'word{i}','start':0,'end':1.1}]})
    plan=join.schedule(takes,2.5,30)
    out=tmp_path/'joined.mp4';join.render(plan,str(out))
    assert abs(join.length(out)-plan['duration'])<=1/30+.02
    assert all(t['speech_end']<plan['duration'] for t in plan['takes'])
    for t in plan['takes'][1:]:
        # Frames on both sides of the dissolve retain visible image and move
        # from the outgoing color to the incoming color.
        frames=[]
        for at in [t['start']-.1,t['start']+plan['dissolve_s']+.1]:
            data=subprocess.check_output(['ffmpeg','-v','error','-ss',str(at),'-i',str(out),'-frames:v','1','-vf','scale=1:1','-f','rawvideo','-pix_fmt','rgb24','-'])
            assert len(data)==3 and sum(data)>60
            frames.append(data)
        assert sum(abs(a-b) for a,b in zip(*frames))>60
