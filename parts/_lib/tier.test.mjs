import test from 'node:test';
import assert from 'node:assert/strict';
import { KIT_TIERS, kitTierDefault } from './tier.mjs';

test('Standard is the default tier', () => {
  assert.equal(kitTierDefault({}, 'image_quality'), 'medium');
  assert.equal(kitTierDefault(undefined, 'lipsync_resolution'), '480p');
  assert.equal(kitTierDefault({}, 'h3_resolution'), '768P');
});

test('Best raises pictures and lip-sync, not H3', () => {
  const best = { quality_tier: 'best' };
  assert.equal(kitTierDefault(best, 'image_quality'), 'high');
  assert.equal(kitTierDefault(best, 'lipsync_resolution'), '720p');
  assert.equal(kitTierDefault(best, 'h3_resolution'), '768P');
});

test('an unknown tier or setting is refused', () => {
  assert.deepEqual(KIT_TIERS, ['standard', 'best']);
  assert.throws(() => kitTierDefault({ quality_tier: 'premium' }, 'image_quality'), /quality_tier/);
  assert.throws(() => kitTierDefault({}, 'seedance_resolution'), /no tier default/);
});
