import { layerInputsWithKeepClear, layerOutputs, timelineWithKeepClear } from '../../_tools/schemas.mjs';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'brand-layer',
  version: '1.0.2',
  kind: 'compose',
  layer: 'brand',
  title: 'Brand layer',
  summary: 'Appends the brand end card (the logo fitted to the card, brand colours and fonts, call to action) when the style ends on one and no step drew it.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'assets/fonts/Montserrat-Bold.ttf', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: true, ffmpeg: { filters: ['xfade', 'fps', 'settb', 'setsar', 'format', 'afade', 'apad', 'atrim', 'anullsrc'], encoders: ['libx264', 'aac'] }, network: false, models: [], disk_mb: 300 },
  // 1.0.2 passes a step's keep_clear on to the captions layer.
  inputs: layerInputsWithKeepClear,
  outputs: { ...layerOutputs(), properties: { ...layerOutputs().properties, timeline: timelineWithKeepClear } },
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 15, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: [],
};
