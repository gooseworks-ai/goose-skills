# Human Test

## Free assembly (placeholder clips + song — $0)
```
cd one-shot-videos/create-song-driven-music-video-from-refs
RUN=/tmp/song-mv-run
mkdir -p "$RUN/clips" "$RUN/audio" "$RUN/working" "$RUN/renders" "$RUN/finals"
cp scripts/config.example.json "$RUN/config.json"
# drop any 9:16 color clips named per config.tableaux ids into $RUN/clips/<id>/v1.mp4,
# a ~28s $RUN/audio/music.mp3 + a matching $RUN/audio/words.json, and an end-card PNG, then
# run the run's assembly (cut-to-window + hard-concat + burn captions + overlay end card + mux song).
```
Probe `$RUN/renders/master.mp4` (1080×1920, ~28s, aac song muxed) and compare the CUT /
beat-sync / hook timing to `demo/finals/loona-fall-in-love-with-sleep.mp4`.

## Full paid path (gated — song + N keyframes + N i2v clips)
Only with an approved `config.json`, a real look pack + brand end-card asset, and
ElevenLabs + Higgsfield credentials, run steps 1–3 of `scripts/PIPELINE.md`:
```
# 1. ElevenLabs music_v1 from config.song.structure  -> audio/music.mp3 + audio/words.json
# 2. render_keyframes.py   (Higgsfield gpt_image_2, one per tableau, 2k 9:16)
# 3. render_clips.py       (Higgsfield kling3_0 i2v, one per tableau)
# then build_captions_v2.py + the promote_master*.py assembly.
```

## Acceptance
- [ ] The generated sung song carries the whole story — NO separate voiceover.
- [ ] The timeline is planned around the delivered song; scene boundaries sit on lyric edges.
- [ ] The hook word ("fall") lands on the chorus drop; the hero tableau is timed to it.
- [ ] Captions track the actual sung words (from `words.json`), accent words colored.
- [ ] One look pack holds across all N beats (same style/palette/face); no morph in a clip.
- [ ] Hard cuts on the beat; brand end card + lockup land (PIL, not AI-rendered).
- [ ] Reads like a tiny animated music video — not an obvious AI ad.
