# Human version

**Summary.** This renderer carries source clocks through a text/graphics overlay and preserves the source's native sound. It refuses a silent change to a source-linked duration or soundtrack. A new export still needs its own complete audiovisual review.

---

# Agent version

Use `html-frames@1.3.0` for the new source-linked stitching flow, with kit 1.0.1 or newer and the declared feature support. The 1.2.1 bundle and sound-bank files remain immutable. Older renderers remain subject to the current core's final source/content guards; they do not contain these new maker protections.

The new input/output timeline schemas explicitly permit `assembly_timeline`. The core passes that field only to parts whose schemas declare it. Picture and native audio source clocks are retained at speed 1 when drawing over a video. A changed duration requires a revised timeline; never silently clamp speech or inherit an earlier exact-byte review.

The part returns the actual underlying video in `source_files`, separate source provenance, any preserved assembly timeline, and pending final content review. Raw rendering/file checks do not establish product accuracy, natural acting, intelligible speech or lip-sync.

Page sound cues change the mix. When the underlying video already carries source-linked assembly intent, this renderer refuses page cues; declare actual approved cue assets and revised intent in the sound layer. It cannot carry an old soundtrack review into a changed mix. Existing non-source-linked pages can still use the bundled UI bank, with cue changes recorded as requiring an authored timeline.

The eight UI sounds are reused from the existing 1.2.1 bank with their original immutable bytes and asset identities. No new sound library or generated substitute was introduced. Music, voice and effect selections still come from the existing approved stores and need provenance and audition.

This release was packaged with the existing esbuild tooling. No tests, lint, type checks, validators, media renders, generation or benchmarks were run, as requested.
