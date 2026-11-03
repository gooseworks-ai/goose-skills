# Human version

**Summary.** Same renderer as 1.3.0, with two fixes. A source-linked video drawn over may now come out up to one frame longer or shorter, because the encoder lands on whole frames. And the sound rule is now exact: only sound the page itself adds (`kit.cue`) is refused over a source-linked video. Music and effects the sound layer declares in the timeline are fine.

---

# Agent version

Use `html-frames@1.3.1` for source-linked stitching, with kit 1.0.1 or newer. The 1.3.0 and 1.2.1 bundles stay as published.

Changes from 1.3.0:

- **Length tolerance.** A source-linked under-video's length may differ from the output by `max(1 ms, one frame at the output fps)`. A larger change still needs a revised assembly timeline.
- **Page sound only.** The refusal applies when the page marks `kit.cue` sounds and the under-video's `assembly_timeline` has picture segments. Sound-layer `music` and `sfx` cues in that timeline are not page sound and are never refused here. The page leaves the source sound as it is.
- `provenance.renderer_version` is `html-frames@1.3.1`.

Everything else is as in 1.3.0: the schemas permit `assembly_timeline`, the core passes it only to parts that declare it, source clocks are kept at speed 1, and the part returns `source_files`, `provenance` and a pending content review. File checks do not certify product accuracy, acting, speech or lip sync.

The eight UI sounds are the same bytes as in 1.2.1 and 1.3.0.

Tested in the CLI repo: the bundle is the built source (`tests/kit/maker/part-bundle.test.ts`), and the length tolerance and page-sound rule have unit tests (`tests/kit/maker/under.test.ts`). Publishing to goose-skills is a separate step.
