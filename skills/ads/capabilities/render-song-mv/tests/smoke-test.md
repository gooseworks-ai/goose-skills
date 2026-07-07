# Smoke Test

Given a delivered sung song (mp3 + `audio/words.json`), one keyframe + one i2v clip per
tableau, and the brand's real app icon, `render-song-mv` assembles the master: cut each clip
to its lyric window, hard-concat on the beat, build lyric-synced captions, composite the PIL
end card, mux the song → 1080×1920 h264+aac (~28s).

Pass when the assembly runs to a valid MP4 and:
- captions are built from the song's OWN `words.json` (script-window, NOT Whisper) and every
  chunk tracks the sung word;
- exactly ONE hook tableau lands the payoff word (`song.hook_word`) on the chorus drop, with
  that word accent-colored;
- clips are cut to their lyric windows and hard-cut on the beat (no dissolves bar the one hero
  match-cut); the look pack holds across all N beats;
- the end card is composited via PIL from the real app icon (no AI-rendered brand text);
- the sung track carries with no separate VO, loudnormed to −14 LUFS;
- **no paid call is made** — the song / keyframes / clips come from the paid capabilities
  (create-music-elevenlabs / create-image-fal / create-video-fal); this assembly is $0 and a
  re-cut reuses the existing assets. For the paid caps the call is proxy-routed (bills the
  agent, no direct provider host).
