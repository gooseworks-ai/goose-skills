# Music through the ending

**Summary.** Use the existing approved music first. The composer checks audible coverage before rendering. A local crossfade extension is opt-in and needs a listening review; no paid replacement runs automatically.

Run the normal composition with the full-length bed:

~~~bash
python scripts/compose_master.py --config config.json --run-dir <run>
~~~

If the approved instrumental can repeat without an obvious musical ending:

~~~bash
python scripts/compose_master.py --config config.json --run-dir <run> --loop-music
~~~

The helper preserves the original bed and writes a checked WAV alongside it. It trims quiet edges only on the loop path, crossfades repeated segments and fades out during the final half-second of the master. It rejects an internal dropout rather than repeating it.

Listen to the finished joins, the bed under speech and the final seconds. The numerical check is not a musical quality score and does not reliably detect a gradual early fade. If the result cannot repeat cleanly, use a suitable full-length replacement; estimate and approve any paid creation separately.

Use the explicit no-music option only for a deliberately silent design preview. A missing bed no longer quietly produces a silent deliverable.
