// fal Whisper's reply as recorded for GOOSE-4015 (the `answer` of
// contracts/replies/fal-ai--whisper.json: fal's OpenAPI example for
// fal-ai/whisper, fetched 2026-10-12). Chunk text carries a leading space; a
// chunk's end time may be null.
export const recordedWhisper = {
  json: {
    text: ' Meet the jacket that packs into its own pocket.',
    chunks: [
      { timestamp: [0.0, 0.32], text: ' Meet' },
      { timestamp: [0.32, 0.46], text: ' the' },
      { timestamp: [0.46, 0.88], text: ' jacket' },
      { timestamp: [0.88, 1.02], text: ' that' },
      { timestamp: [1.02, 1.4], text: ' packs' },
      { timestamp: [1.4, 1.58], text: ' into' },
      { timestamp: [1.58, 1.72], text: ' its' },
      { timestamp: [1.72, 1.98], text: ' own' },
      { timestamp: [1.98, 2.5], text: ' pocket.' },
    ],
    inferred_languages: ['en'],
    diarization_segments: [],
  },
  files: {},
  reused: false,
};
