import { layerInputs, layerOutputs } from '../../_tools/schemas.mjs';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'brand-layer',
  version: '1.0.1',
  kind: 'compose',
  layer: 'brand',
  title: 'Brand layer',
  summary: 'Appends the brand end card (logo as-is, brand colours and fonts, call to action) when the style ends on one and no step drew it.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'assets/fonts/Montserrat-Bold.ttf', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: true, ffmpeg: { filters: ['xfade', 'fps', 'settb', 'setsar', 'format', 'afade', 'apad', 'atrim', 'anullsrc'], encoders: ['libx264', 'aac'] }, network: false, models: [], disk_mb: 300 },
  inputs: layerInputs,
  outputs: layerOutputs(),
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 15, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: [],
};
