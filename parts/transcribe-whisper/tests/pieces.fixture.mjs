// The fixtures `reuses_pieces_of` is proven on (parts/_tools/reuses-pieces.test.mjs): 1.1.2 must send
// exactly the Whisper request 1.1.1 sent, for each case.
import { repeatedQuestion, sample } from './fixture.mjs';

export const cases = [
  { name: 'two lines with numbers written differently', inputs: (dir) => sample.inputs(dir), line: sample.line },
  { name: 'a street interview whose opening question is heard twice', inputs: (dir) => repeatedQuestion.inputs(dir), line: repeatedQuestion.line },
];
