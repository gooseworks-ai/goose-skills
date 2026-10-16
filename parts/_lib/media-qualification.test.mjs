// A take's review says how it covered the whole source; measured (frames plus word timing) is
// enough. Gate audit, 16 Oct 2026: no "watched/listened" claim is required.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kitMediaCoverage, kitMediaReviewProblem, kitMediaRouteProblem } from './media-qualification.mjs';

const SHA = 'a'.repeat(64);
const source = { sha256: 'b'.repeat(64) };
const checks = { script: 'pass', voice: 'pass', lipsync: 'pass', identity: 'pass', framing: 'pass', performance: 'pass', product_action: 'not_applicable' };
const review = (coverage) => ({ source_sha256: source.sha256, script_sha256: SHA, status: 'pass', reviewer: 'agent', coverage: { start_s: 0, end_s: 6, ...coverage }, checks });

test('measured, watched/listened and the older booleans all say how the source was covered', () => {
  assert.equal(kitMediaReviewProblem(review({ motion: 'measured', audio: 'measured' }), source, SHA, 6), null);
  assert.equal(kitMediaReviewProblem(review({ motion: 'watched', audio: 'listened' }), source, SHA, 6), null);
  assert.equal(kitMediaReviewProblem(review({ video_watched: true, audio_listened: true }), source, SHA, 6), null);
  assert.deepEqual(kitMediaCoverage({ video_watched: true }), { motion: 'watched', audio: null });
});

test('a review that does not say how it covered the source is refused', () => {
  for (const coverage of [{}, { motion: 'measured' }, { motion: 'skimmed', audio: 'measured' }, { video_watched: false, audio_listened: true }]) {
    assert.match(kitMediaReviewProblem(review(coverage), source, SHA, 6), /how the whole source was covered/);
  }
  // No speech: motion alone is enough.
  assert.equal(kitMediaReviewProblem(review({ motion: 'measured' }), source, SHA, 6, { speech: false }), null);
});

test('a qualification may be measured too', () => {
  const route = (q) => kitMediaRouteProblem({ provider: 'fal', model: 'm', shot_type: 'talking_creator', configuration_sha256: SHA,
    accepted_source_sha256: source.sha256, speech_mode: 'native_dialogue',
    qualification: { provider: 'fal', model: 'm', shot_type: 'talking_creator', status: 'qualified', configuration_sha256: SHA,
      accepted_source_sha256: source.sha256, reviewer: 'agent', ...q } });
  assert.equal(route({ motion: 'measured', audio: 'measured' }), null);
  assert.equal(route({ video_watched: true, audio_listened: true }), null);
  assert.match(route({}), /how the reviewer covered it/);
});
