import { layerInputs, layerOutputs } from '../../_tools/schemas.mjs';

export const manifest = {
  $schema: '../../_contract/part-manifest.schema.json',
  interface: 1,
  id: 'sound-layer',
  version: '1.0.1',
  kind: 'mix',
  layer: 'sound',
  title: 'Sound layer',
  summary: 'Levels the finished cut to -14 LUFS integrated, true peak at or below -1 dBTP, and checks it with an EBU R128 meter.',
  runtime: 'node',
  entry: 'part.mjs',
  files: ['README.md', 'part.mjs'],
  kit: '>=1.0.0 <2.0.0',
  needs: { browser: false, ffmpeg: { filters: ['loudnorm', 'ebur128', 'volume', 'alimiter', 'aresample'], encoders: ['aac'] }, network: false, models: [], disk_mb: 300 },
  inputs: layerInputs,
  outputs: layerOutputs(),
  cost: { basis: 'free' },
  determinism: 'pure',
  timing: { typical_s: 10, timeout_s: 600 },
  retry: { transient: 1 },
  replaces: ['mix-master'],
};
