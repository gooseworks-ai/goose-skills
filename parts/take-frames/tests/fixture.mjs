// A sample take-frames run for the part registry test (parts/_tools/parts.test.mjs): a creator, a product
// photo and a plan whose last scene is the use, on image-gpt-image-2's fake fal line.
import { join } from 'node:path';
import { fileRef } from '../../_tools/kit-harness.mjs';
import { makeImage, pngLine } from '../../image-gpt-image-2/tests/fixture.mjs';

export async function inputsFor(w, extra = {}) {
  return {
    cast: [{ key: 'c1', name: 'Maya', look: 'woman about 30, dark curly hair in a bun, a deep red knit sweater', image: await fileRef(await makeImage(join(w, 'maya.png')), 'image') }],
    products: [{ id: 'graza', name: 'Graza Sizzle bottle', images: [await fileRef(await makeImage(join(w, 'graza.png')), 'image')] }],
    scenes: [
      { id: 's1', line: 'Do you still glug olive oil?', extra: { shot: 'selfie' } },
      { id: 's3', line: 'Graza Sizzle is made for high heat.', extra: { shot: 'selfie' } },
      { id: 's2', line: 'This one is a squeeze bottle.', extra: { shot: 'use', before: 'The lime green flip cap is closed', after: 'the lime green flip cap is flipped open, the nozzle showing.' } },
    ],
    ...extra,
  };
}

export const sample = { line: pngLine, inputs: (workDir) => inputsFor(workDir) };
