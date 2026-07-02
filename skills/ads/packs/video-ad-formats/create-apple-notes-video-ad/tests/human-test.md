# Human acceptance test

1. Run `bash tests/run-all.sh`.
2. Open `tests/output/sample-run/edits/master-final.mp4` in QuickTime (or any player that gives you audio).
3. Confirm by ear:
   - You hear a discrete tick per character typed.
   - Inter-paragraph "return" beat sounds slightly different from a letter tick.
   - Spaces sound slightly heavier than letters.
   - SFX cuts cleanly at the end-card crossfade.
4. Confirm by eye:
   - The note grows downward as text is added — no pre-allocated empty paragraph space.
   - Cursor jumps from end-of-paragraph N to start-of-paragraph N+1 at the right moment.
   - End card lands hard with the brand wordmark + CTA pill.
5. Replace `assets/sfx/{kb-tick,kb-space,kb-return}.mp3` with real iPhone keyboard clicks (see `assets/sfx/README.md`) and rerun just `bash edits/stitch.sh`. The output should now sound authentically iOS.

The skill passes human acceptance when typing feels like a real screen recording — not too uniform, not too jittery, with clean audio sync at every cut.
