// The fixtures `reuses_pieces_of` is proven on (parts/_tools/reuses-pieces.test.mjs): every
// version that declares it must order exactly the same takes as the versions it names, for each case.
import { castInputs, sample } from './fixture.mjs';

export const cases = [
  { name: 'a creator saying four lines, measured joins', inputs: (dir) => sample.inputs(dir), line: sample.line },
  { name: 'a cast member with pronunciations and an end card', inputs: (dir) => castInputs(dir), line: sample.line },
  {
    name: 'takes split at cutaways',
    inputs: async (dir) => {
      const base = await castInputs(dir, { split_before: 'cutaways' });
      const [first, second, end] = base.scenes;
      const third = { id: 's3', line: 'Fernhill made the first hour of my day the quiet one again.', on_screen: null, picture: null, speaker: 'maya' };
      return { ...base, scenes: [first, { ...second, extra: { shot: 'product' } }, third, end] };
    },
    line: sample.line,
  },
];
