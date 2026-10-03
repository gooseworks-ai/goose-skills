#!/usr/bin/env python3
"""Assemble reviewed local clips. No provider calls or automatic quality verdict."""
import argparse
import json
import subprocess
import tempfile
from pathlib import Path


def run(args):
    subprocess.run(args, check=True, capture_output=True, text=True, timeout=600)


def probe(file):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(file)], text=True, timeout=60))


def assemble(plan, output):
    sizes = {'9:16': (1080, 1920), '16:9': (1920, 1080), '1:1': (1080, 1080), '4:5': (1080, 1350)}
    width, height = sizes[plan.get('aspect_ratio', '9:16')]
    width, height = plan.get('width', width), plan.get('height', height)
    fps = plan.get('fps', 30)
    if not isinstance(fps, int) or not 1 <= fps <= 60 or any(not isinstance(v, int) or v <= 0 or v % 2 for v in (width, height)):
        raise ValueError('Use an integer fps between1 and60 and positive even pixel dimensions')
    expected_ratio = sizes[plan.get('aspect_ratio', '9:16')][0] / sizes[plan.get('aspect_ratio', '9:16')][1]
    if abs(width / height - expected_ratio) > 0.01:
        raise ValueError('Output dimensions must match the reviewed aspect ratio')
    if plan.get('captions_ass') and ' ass ' not in subprocess.check_output(['ffmpeg', '-hide_banner', '-filters'], text=True, stderr=subprocess.DEVNULL):
        raise ValueError('Captions need an FFmpeg build with libass; install/use that supported build before assembly')
    clips = plan['clips']
    if not clips or len(clips) > 60:
        raise ValueError('Supply one to sixty reviewed clips')
    duration = sum(float(clip['duration_s']) for clip in clips)
    if not 0 < duration <= 180 or any(float(clip['duration_s']) <= 0 for clip in clips):
        raise ValueError('Clip durations must be positive, totaling at most180 seconds')
    output = Path(output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='video-assembly-') as folder:
        root = Path(folder)
        normalized = []
        for index, clip in enumerate(clips):
            source = Path(clip['path']).resolve()
            info = probe(source)
            if not any(stream['codec_type'] == 'video' for stream in info['streams']):
                raise ValueError(f'Clip {index + 1} has no video')
            video_stream = next(stream for stream in info['streams'] if stream['codec_type'] == 'video')
            visual_duration = float(video_stream.get('duration', 0))
            if visual_duration + 0.05 < float(clip['duration_s']):
                raise ValueError(f'Clip {index + 1} is shorter than its reviewed timeline; generate or explicitly revise it first')
            target = root / f'{index:03d}.mp4'
            command = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(source)]
            has_audio = any(stream['codec_type'] == 'audio' for stream in info['streams'])
            if not has_audio:
                command += ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo']
            command += ['-map', '0:v:0', '-map', '0:a:0' if has_audio else '1:a:0', '-t', str(clip['duration_s']), '-vf', f'scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},setsar=1,fps={fps}', '-af', 'aresample=48000', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ac', '2', '-ar', '48000', str(target)]
            run(command)
            normalized.append(target)
        listing = root / 'clips.txt'
        listing.write_text(''.join(f"file '{file.as_posix()}'\n" for file in normalized))
        joined = root / 'joined.mp4'
        run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(listing), '-c', 'copy', str(joined)])
        command = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', str(joined)]
        voice = plan.get('voice_path')
        music = plan.get('music_path')
        if voice:
            command += ['-i', str(Path(voice).resolve())]
        if music:
            command += ['-stream_loop', '-1', '-i', str(Path(music).resolve())]
        audio_source = '1:a' if voice else '0:a'
        if music:
            music_source = '2:a' if voice else '1:a'
            # Duck the quiet bed under the selected speech; preserve native clip audio otherwise.
            command += ['-filter_complex', f'[{audio_source}]apad,asplit=2[main][side];[{music_source}]volume=0.12[bed];[bed][side]sidechaincompress=threshold=0.04:ratio=6[ducked];[main][ducked]amix=inputs=2:duration=first:normalize=0[mix]', '-map', '0:v:0', '-map', '[mix]']
        else:
            command += ['-map', '0:v:0', '-map', audio_source]
        captions = plan.get('captions_ass')
        if captions:
            path = Path(captions).resolve().as_posix().replace('\\', '\\\\').replace(':', '\\:').replace("'", "\\'")
            command += ['-vf', f"ass=filename='{path}'"]
        command += ['-t', str(duration), '-c:v', 'libx264' if captions else 'copy', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', str(output)]
        run(command)
    info = probe(output)
    actual = float(info['format']['duration'])
    visual = next(stream for stream in info['streams'] if stream['codec_type'] == 'video')
    visual_actual = float(visual.get('duration', 0))
    if abs(visual_actual - duration) > max(0.15, 2 / fps):
        raise ValueError(f'Visual duration {visual_actual} differs from reviewed timeline {duration}')
    if abs(actual - duration) > max(0.15, 2 / fps):
        raise ValueError(f'Export duration {actual} differs from reviewed timeline {duration}')
    return {'output': str(output), 'duration_s': actual, 'width': width, 'height': height, 'technical_probe': info, 'quality_status': 'requires_visual_and_audio_review'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('plan', help='JSON: aspect_ratio, clips:[{path,duration_s}], optional voice_path/music_path/captions_ass')
    parser.add_argument('output')
    args = parser.parse_args()
    print(json.dumps(assemble(json.loads(Path(args.plan).read_text()), args.output)))


if __name__ == '__main__':
    main()
