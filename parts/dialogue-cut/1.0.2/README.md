# dialogue-cut 1.0.2

Re-cuts a two-host dialogue over its finished voice track. Free: the lipsync clips are already paid for, so every
re-cut costs nothing. From the podcast recipe's `plan_cuts.py` (the planner, `src/plan.mjs`) and `compose_master.py`
(the render, `src/part.mjs` and `src/render.mjs`).

- **Inputs**: `scenes` (plan.scenes with `speaker`), `clips` (one lipsync clip per spoken line, by scene id), `voice`
  (the whole voice track), `spans` (where each line sits in it), and optionally `speech` (copied into the timeline;
  each clip is stretched to its line's length when within 5%), `cast` (the two hosts), `idle` (a silent listening
  clip per host), `products`, `ending` and `ending_timeline`.
- **The clock is the voice.** A line runs from its start to the next line's start; the last runs to the end of the
  voice. A scene with a null line and no span is skipped. The audio is the voice track as given, then the end
  card's sound (or silence).
- **Modes** (`mode`, a declared answer):
  - `plain` (default): one full-frame picture per line, cut where the speaker changes lines.
  - `split`: the speaker on top, the listener's idle clip below (seam 0.5), on every line; the payoff line drops
    to one full-frame single.
  - `dynamic`: cut patterns inside each line (speaker, listener reaction, split), five reframes per host
    (`crops`), splits on a cadence with seams 0.62 / 0.37 / 0.5, the listener or a product's first photo below,
    and the payoff single.
- **Long lines**: outside plain, a line longer than any cut pattern can lay out under the ceiling (about 4.5 s in
  dynamic, 6 s in split) is shared into equal pieces that are planned like lines, each still read from that line's
  own clip. A payoff line whose head is over the ceiling gets several speaker cuts before the single.
- **Short lines**: a line under 0.5 s with its gap ("Yes.") is shown a beat early, from the line before (the
  replier listening on their clip's first frame), or else runs on into the next line. When neither line can
  spare the time alone (each keeps 0.5 s), each gives what it can (new in 1.0.1; 1.0.0 left the line short and
  refused the plan). The voice never moves.
- **Lower panels**: a split's lower panel is only a source in `bottom_sources`; when none of them has a picture
  the plan is refused `bad_input`. A listener from their idle clip needs no line of their own.
- **Seeded**: `seed` (default 4201) picks the edit; the same seed and lines give the same edit. If a plan misses a
  cut check, the next seeds are tried in turn (up to 12), and the seed used is an output.
- **Self-checks before anything is drawn**: the picture tiles every line and the whole timeline; no cut under
  0.5 s (or over 1.9 s outside plain); the speaker is full frame only from their own clip; a reaction shows the
  listener; a split shows two hosts and balances who is on top; dynamic stays in the framing band (2.9 to 7.1
  framings per 10 s, none over 17%). A plan no seed fixes fails `output_invalid`; a missing picture (an idle clip
  for a split listener, a product photo) is refused `bad_input`.
- **Frames**: cut bounds are checked on the plan. At 30 fps (the default) 0.5 s and 1.9 s are whole frames, so
  rendered cuts keep the band exactly; at a rate where they are not (25, 24), a cut can be one frame outside it.
- **After the render**: the file must be as long as the plan (within 0.10 s), and every speaker change the scene
  detector sees must land within 0.10 s of the plan.
- **Look**: `grade: warm-lift-grain` (the recipe's look) on the dialogue only, never on the end card. `head` sets
  where a cover crop sits (default 0.25, a head in frame).
- **Size rule**: the final encode is capped at 16 Mbps (8 Mbps with the grain look); an encoded cut over 180 MB
  fails `output_invalid` before upload.
- **Outputs**: `video`, `seconds`, `timeline` (one scene per spoken line on its real cut times, the speech,
  `end_card` and the card's logo box when there is a card), `cuts` (each cut's times, mode, who it shows and its
  framing) and `seed`.

Source: `parts/dialogue-cut/src/part.mjs`, `src/render.mjs`, `src/plan.mjs` and `src/manifest.mjs`.
