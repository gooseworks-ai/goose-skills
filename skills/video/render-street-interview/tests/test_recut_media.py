"""Free actual recut/finish regression. Tones are labelled test cues, not spoken-word evidence."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import wave

import numpy as np
from PIL import Image

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
import brandkit
import build_looks
import edit_timeline


class RecutMediaTests(unittest.TestCase):
    def test_moved_repeated_dropped_cues_share_real_video_caption_and_audio_timeline(self):
        with tempfile.TemporaryDirectory(prefix='recut media spaces ') as temp:
            root = Path(temp).resolve()
            source, recut = root / 'original source.mp4', root / 'edited output.mp4'
            cfg = brandkit.load('demo-tallgrass-oat')
            cfg['brand_layer'].update({'logo': None, 'cuts': [1., 2., 3.], 'ambience_gap': [1.1, .7],
                                      'end_card': ['SYNTHETIC TEST'], 'series_header': 'SYNTHETIC',
                                      'captions': [[.05, .95, 'ALPHA', 'answer', '', 'Alpha.'],
                                                   [2.05, 2.95, 'BETA', 'answer', '', 'Beta.'],
                                                   [3.05, 3.95, 'GAMMA', 'payoff', '', 'Gamma.']]})
            config = root / 'brand.json'
            config.write_text(json.dumps(cfg))
            sample_rate = 48000
            t = np.arange(4 * sample_rate) / sample_rate
            audio = .001 * np.sin(2 * np.pi * 800 * t)
            for start, frequency in [(.1, 220), (2.1, 660), (3.1, 440)]:
                count = int(.3 * sample_rate)
                cue = .15 * np.sin(2 * np.pi * frequency * np.arange(count) / sample_rate)
                # Finite cue edges; the edit boundaries are outside all measured cues.
                fade = np.minimum(1, np.minimum(np.arange(count), np.arange(count)[::-1]) / 240)
                begin = int(start * sample_rate)
                audio[begin:begin + count] += cue * fade
            wav = root / 'source.wav'
            with wave.open(str(wav), 'wb') as writer:
                writer.setnchannels(1); writer.setsampwidth(2); writer.setframerate(sample_rate)
                writer.writeframes((audio * 32767).astype('<i2').tobytes())
            def run(args):
                result = subprocess.run([str(a) for a in args], capture_output=True)
                if result.returncode:
                    self.fail(result.stdout.decode(errors='replace') + result.stderr.decode(errors='replace'))
                return result
            run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=white:s=1080x1920:r=30:d=1',
                 '-f', 'lavfi', '-i', 'color=c=gray:s=1080x1920:r=30:d=1', '-f', 'lavfi', '-i',
                 'color=c=black:s=1080x1920:r=30:d=1', '-f', 'lavfi', '-i', 'color=c=green:s=1080x1920:r=30:d=1',
                 '-i', wav, '-filter_complex', '[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[v]', '-map', '[v]',
                 '-map', '4:a', '-c:v', 'libx264', '-threads', '2', '-pix_fmt', 'yuv420p', '-c:a', 'aac', source])
            original_hash = edit_timeline.file_hash(source)
            word_file = root / 'measured synthetic cues.json'
            word_file.write_text(json.dumps({'source': str(source), 'source_sha256': original_hash,
                                             'words': [[.1, .4, 'Alpha.'], [2.1, 2.4, 'Beta.'], [3.1, 3.4, 'Gamma.']]}))
            run([sys.executable, SCRIPTS / 'recut.py', source, recut, '--brand', config,
                 '--plan', '2,3', '0,1', '2,3', '--no-loudness'])
            edit_map = recut.with_suffix('.plan.json')
            plan = edit_timeline.load_map(edit_map)
            self.assertEqual(plan['ambience']['start'], 1.1)  # source window was dropped
            self.assertFalse(plan['ambience']['bed_applied'])
            self.assertEqual(plan['source_sha256'], original_hash)
            run([sys.executable, SCRIPTS / 'build_looks.py', '--brand', config, '--run', root / 'run',
                 '--looks', 'clean', '--edit-map', edit_map, '--word-times', word_file])
            build_looks.resolve(root / 'run', str(config), edit_map, word_file)
            master, control = build_looks.output_path('clean'), build_looks.control_path('clean')
            self.assertEqual([r[2] for r in build_looks.LINES], ['BETA', 'ALPHA', 'BETA'])
            self.assertEqual(build_looks.CUTS, [1., 2.])
            self.assertEqual(edit_timeline.file_hash(source), original_hash)
            def duration(path):
                return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).stdout)
            self.assertAlmostEqual(duration(master), duration(control), delta=.03)
            self.assertAlmostEqual(duration(master), plan['output_duration'] + 2.2, delta=.1)
            finished = np.frombuffer(run(['ffmpeg', '-v', 'error', '-i', master, '-vn', '-ac', '1',
                                          '-ar', sample_rate, '-f', 'f32le', '-']).stdout, dtype=np.float32)
            for start, expected in [(.22, 660), (1.22, 220), (2.22, 660)]:
                cue = finished[int(start * sample_rate):int((start + .12) * sample_rate)]
                frequencies = np.fft.rfftfreq(len(cue), 1 / sample_rate)
                peak = frequencies[np.argmax(abs(np.fft.rfft(cue)))]
                self.assertAlmostEqual(peak, expected, delta=20)
            for start in [.84, 1.84, 2.84, 3.4, 4.4]:
                sample = finished[int(start * sample_rate):int((start + .1) * sample_rate)]
                original_room_tone = abs(np.mean(sample * np.exp(-2j * np.pi * 800 * np.arange(len(sample)) / sample_rate)))
                self.assertGreater(original_room_tone, .00001)
            for i, moment in enumerate([1., 2.]):
                paths = []
                for kind, video in [('master', master), ('control', control)]:
                    frame = root / f'{kind}-{i}.png'
                    run(['ffmpeg', '-v', 'error', '-y', '-ss', moment, '-i', video, '-frames:v', '1', frame])
                    paths.append(np.asarray(Image.open(frame).convert('RGB'), dtype=float)[1300:1600])
                self.assertLess(np.percentile(abs(paths[0] - paths[1]), 99), 8)


if __name__ == '__main__':
    unittest.main()
