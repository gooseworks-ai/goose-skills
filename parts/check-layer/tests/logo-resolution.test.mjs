import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { browserMissing, browserProviderOrNull, fileRef, hasFfmpeg, layerInputsFor, loadNewest, makeCtx, run, sampleBrand } from '../../_tools/kit-harness.mjs';

const { dir, mod } = await loadNewest('check-layer');
const available = await hasFfmpeg() && browserProviderOrNull();
test('wide and tall logos meet the long-side rule; small sources warn without blocking or skipping identity', { skip: !available && (browserMissing() || 'ffmpeg is not installed') }, async () => {
  const { ctx } = makeCtx({ partDir: dir });
  const brand = await sampleBrand(ctx.workDir);
  const ec = await loadNewest('end-card');
  for (const [width, height, warns] of [[281, 88, false], [88, 281, false], [256, 88, false], [255, 88, true]]) {
    const path = join(ctx.workDir, `logo-${width}-${height}.png`);
    await run('ffmpeg', ['-hide_banner', '-nostdin', '-loglevel', 'error', '-y', '-i', brand.logo.path, '-vf', `scale=${width}:${height}`, '-frames:v', '1', path]);
    const ownBrand = { ...brand, logo: await fileRef(path, 'image') };
    assert.equal(ownBrand.logo.width, width);
    assert.equal(ownBrand.logo.height, height);
    const card = await ec.mod.run({ brand: ownBrand, width: 720, height: 1280, seconds: 1 }, makeCtx({ partDir: ec.dir }).ctx);
    const expect = { end_card: true, speech: 'none', qc_flags: ['logo_visible'] };
    const inputs = await layerInputsFor(card.video, { brand: ownBrand, expect, timeline: { ...card.timeline, end_card: { start_s: 0, end_s: 1 } } });
    const out = await mod.run(inputs, ctx);
    const checks = Object.fromEntries(out.verdict.checks.map(c => [c.code, c]));
    assert.notEqual(checks.logo.status, 'fail', JSON.stringify(out.verdict));
    assert.notEqual(checks['flag:logo_visible'].status, 'fail', JSON.stringify(out.verdict));
    assert.equal(checks.logo_resolution?.status, warns ? 'warn' : undefined);
    assert.equal(checks.logo_resolution?.fix, undefined);
    assert.equal(out.verdict.pass, true, JSON.stringify(out.verdict));
    assert.deepEqual(out.verdict.reasons, []);
    if (warns) {
      // A resolution warning must not hide a missing/wrong logo in its declared box.
      const missing = await mod.run({ ...inputs, timeline: { ...inputs.timeline, safe_zones: [{ use: 'logo', x: 0, y: 0, w: 720, h: 100 }] } }, ctx);
      assert.equal(missing.verdict.pass, false);
      assert.equal(missing.verdict.checks.find(c => c.code === 'logo').status, 'fail');
      assert.ok(missing.verdict.checks.find(c => c.code === 'logo_resolution').status === 'warn');
    }
  }
});
