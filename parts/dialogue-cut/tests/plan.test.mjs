// The dialogue-cut planner (../src/plan.mjs): parity with the podcast recipe's
// plan_cuts.py, the three modes, the beats it builds from plan scenes, and a
// named mutation for every self-check (a check that cannot be made to fail is
// a comment, not a check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIALOGUE_CROPS, dialogueBeats, dialoguePlan, dialoguePlanProblems, dialogueSettings } from '../src/plan.mjs';
import { PYTHON_PLANS } from './fixture.mjs';

const HOSTS = ['A', 'B'];

/** Beats from the fixture's {n, who, dur_sec}: back to back from 0, the way plan_cuts.py lays them. */
function beatsOf(list) {
  let t = 0;
  return list.map((b) => {
    const beat = { n: b.n, id: `s${b.n}`, who: b.who, start_s: t, end_s: t + b.dur_sec, dur_s: b.dur_sec, span_start_s: t, span_end_s: t + b.dur_sec, split: b.split, payoff: b.payoff };
    t += b.dur_sec;
    return beat;
  });
}

function planFor(c, extra = {}) {
  const beats = beatsOf(c.beats);
  const settings = dialogueSettings(c.mode, { seed: c.seed, ...extra });
  const plan = dialoguePlan(beats, HOSTS, settings, { products: 1, end_card_s: 3.5 });
  return { beats, settings, plan };
}

const near = (a, b, what) => assert.ok(Math.abs(a - b) <= 2e-6, `${what}: ${a} vs ${b}`);
const ids = (problems) => problems.map((p) => p.split(':')[0]);

for (const c of PYTHON_PLANS) {
  test(`makes the same edit as plan_cuts.py: ${c.name}`, () => {
    const { beats, plan } = planFor(c);
    const nOf = new Map(beats.map((b) => [b.id, b.n]));
    const want = c.expect.cuts;
    assert.equal(plan.cuts.length, want.length, 'cut count');
    assert.deepEqual(plan.pattern_use, c.expect.pattern_use);
    plan.cuts.forEach((got, i) => {
      const w = want[i];
      const at = `${c.name} cut ${i}`;
      for (const k of ['beat', 'idx', 'pattern', 'speaker', 'mode', 'source', 'show', 'framing']) assert.equal(got[k], w[k], `${at} ${k}`);
      near(got.start_s, w.start, `${at} start`);
      near(got.end_s, w.end, `${at} end`);
      near(got.src_start_s, w.src_start, `${at} src_start`);
      near(got.src_end_s, w.src_end, `${at} src_end`);
      assert.equal(got.clip_scene === null ? null : nOf.get(got.clip_scene), w.clip_beat ?? null, `${at} clip`);
      assert.deepEqual(got.crop, w.crop, `${at} crop`);
      assert.equal(got.payoff === true, w.payoff === true, `${at} payoff`);
      if (w.mode === 'split') {
        assert.equal(got.seam, w.seam, `${at} seam`);
        assert.equal(got.bottom, w.bottom, `${at} bottom`);
        assert.equal(got.listener, w.listener ?? null, `${at} listener`);
        assert.equal(got.listener_clip_scene === null ? null : nOf.get(got.listener_clip_scene), w.listener_clip_beat ?? null, `${at} listener clip`);
      }
    });
    const st = plan.framing_stats;
    assert.equal(st.n_framings, c.expect.framing_stats.n_framings);
    assert.equal(st.biggest, c.expect.framing_stats.biggest);
    assert.equal(st.biggest_count, c.expect.framing_stats.biggest_count);
    assert.deepEqual(st.use, c.expect.framing_stats.use);
    near(st.per_10s, c.expect.framing_stats.per_10s, 'per 10 s');
    near(plan.dialogue_s, c.expect.dialogue_sec, 'dialogue length');
  });
}

test("the self-checks give the recipe's own gate verdict on every golden plan", () => {
  // one-sided/dynamic fails framing_biggest_share in the recipe too: with one
  // host speaking six of eight lines, A:wide takes 3 of 14 cuts (21%)
  for (const c of PYTHON_PLANS) {
    const { beats, settings, plan } = planFor(c);
    const got = [...new Set(ids(dialoguePlanProblems(plan, beats, HOSTS, settings, { products: 1 })))].sort();
    assert.deepEqual(got, c.expect.gates, c.name);
  }
  assert.ok(PYTHON_PLANS.some((c) => c.expect.gates.length), 'at least one golden plan is a failing one');
});

test('the same seed and lines give the same plan; another seed walks to another plan', () => {
  const c = PYTHON_PLANS.find((p) => p.name === 'synthetic/dynamic/seed 4201');
  assert.deepEqual(planFor(c).plan, planFor(c).plan);
  assert.notDeepEqual(planFor(c).plan.cuts.map((x) => x.pattern), planFor({ ...c, seed: 7 }).plan.cuts.map((x) => x.pattern));
});

test('plain mode is one full-frame picture per line, cut only where the line changes', () => {
  const c = PYTHON_PLANS.find((p) => p.name === 'synthetic/plain/seed 4201');
  const { beats, plan } = planFor(c);
  assert.equal(plan.cuts.length, beats.length);
  for (const cut of plan.cuts) {
    assert.equal(cut.mode, 'single');
    assert.equal(cut.clip_scene, cut.scene_id);
    assert.deepEqual(cut.crop, DIALOGUE_CROPS.wide);
  }
});

test('split mode stacks the speaker over the idle listener, balanced across hosts, and ends on a full-frame payoff', () => {
  const c = PYTHON_PLANS.find((p) => p.name === 'synthetic/split/seed 4201');
  const { plan } = planFor(c);
  const splits = plan.cuts.filter((x) => x.mode === 'split');
  assert.ok(splits.length >= 4);
  const onTop = new Set(splits.map((x) => x.show));
  assert.deepEqual([...onTop].sort(), ['A', 'B']);
  for (const s of splits) {
    assert.equal(s.listener_source, 'idle');
    assert.notEqual(s.listener, s.show);
    assert.ok(s.bottom_start_s >= 0 && s.bottom_start_s + (s.end_s - s.start_s) <= 6 + 1e-6, 'the idle window stays inside the 6 s idle clip');
  }
  // the synthetic script marks line 10 as the payoff, so the single lands there and not on the last line
  const payoff = plan.cuts.filter((x) => x.payoff);
  assert.deepEqual(payoff.map((x) => [x.scene_id, x.mode]), [['s10', 'single']]);
  assert.deepEqual(payoff[0].crop, DIALOGUE_CROPS.wide);
  assert.equal(plan.cuts[plan.cuts.indexOf(payoff[0]) - 1].mode, 'split', 'a split comes right before the payoff single');
});

test('dynamic mode keeps every cut between 0.5 s and 1.9 s and reframes on every cut', () => {
  for (const c of PYTHON_PLANS.filter((p) => p.mode === 'dynamic')) {
    const { plan } = planFor(c);
    for (const x of plan.cuts) assert.ok(x.end_s - x.start_s >= 0.5 - 1e-6 && x.end_s - x.start_s <= 1.9 + 1e-6, `${c.name} ${x.scene_id}.${x.idx}`);
    for (let i = 1; i < plan.cuts.length; i++) assert.notEqual(plan.cuts[i].framing, plan.cuts[i - 1].framing);
  }
});

test('the product bottom is used only when there is a product still, and rotates through the stills', () => {
  const c = PYTHON_PLANS.find((p) => p.name === 'example/dynamic/seed 4201');
  const beats = beatsOf(c.beats);
  const settings = dialogueSettings('dynamic');
  const none = dialoguePlan(beats, HOSTS, settings, { products: 0, end_card_s: 3.5 });
  assert.ok(!none.cuts.some((x) => x.bottom === 'product'));
  assert.deepEqual(dialoguePlanProblems(none, beats, HOSTS, settings, { products: 0 }), []);
  const two = dialoguePlan(beats, HOSTS, settings, { products: 2, end_card_s: 3.5 });
  const turns = two.cuts.filter((x) => x.bottom === 'product').map((x) => x.product);
  assert.ok(turns.length >= 1);
  turns.forEach((p, i) => assert.equal(p, i % 2));
});

test('dialogueBeats: a line runs to the next line, the voice tail joins the last line, and a silent scene is skipped', () => {
  const scenes = [
    { id: 'open', line: 'So we gave the planner a week.', speaker: 'a', on_screen: null, picture: null },
    { id: 'beat', line: null, speaker: null, on_screen: null, picture: null },
    { id: 'reply', line: 'One week.', speaker: 'b', on_screen: null, picture: null, extra: { split: true } },
    { id: 'land', line: 'Nobody argued about dinner.', speaker: 'a', on_screen: null, picture: null, extra: { payoff: true } },
  ];
  const spans = [{ id: 'open', start_s: 0.05, end_s: 2.1 }, { id: 'reply', start_s: 2.22, end_s: 3.0 }, { id: 'land', start_s: 3.12, end_s: 5.4 }];
  const { beats, skipped } = dialogueBeats(scenes, spans, ['a', 'b'], { seconds: 5.52 });
  assert.deepEqual(skipped, ['beat']);
  assert.deepEqual(beats.map((b) => [b.id, b.who, b.start_s, b.end_s]), [['open', 'a', 0, 2.22], ['reply', 'b', 2.22, 3.12], ['land', 'a', 3.12, 5.52]]);
  assert.equal(beats[1].split, true);
  assert.equal(beats[2].payoff, true);
  const settings = dialogueSettings('dynamic');
  const plan = dialoguePlan(beats, ['a', 'b'], settings, { end_card_s: 3.5 });
  assert.equal(plan.cuts[0].start_s, 0);
  assert.equal(plan.cuts.at(-1).end_s, 5.52);
  assert.deepEqual(ids(dialoguePlanProblems(plan, beats, ['a', 'b'], settings)).filter((p) => !p.startsWith('framing_')), []);
});

test('dialogueBeats refuses a line with no span, a speaker who is not a host, overlapping spans and a cast that is not two hosts', () => {
  const ok = [{ id: 's1', line: 'Hi.', speaker: 'a' }, { id: 's2', line: 'Hello.', speaker: 'b' }];
  const spans = [{ id: 's1', start_s: 0, end_s: 1 }, { id: 's2', start_s: 1.1, end_s: 2 }];
  const bad = (fn, re) => assert.throws(fn, (e) => e.code === 'bad_input' && re.test(e.message));
  bad(() => dialogueBeats(ok, spans.slice(0, 1), ['a', 'b']), /s2 has a line but no span/);
  bad(() => dialogueBeats([ok[0], { ...ok[1], speaker: 'c' }], spans, ['a', 'b']), /speaker "c" is not one of the hosts/);
  bad(() => dialogueBeats(ok, [spans[0], { id: 's2', start_s: 0.5, end_s: 2 }], ['a', 'b']), /overlap/);
  bad(() => dialogueBeats(ok, spans, ['a', 'b', 'c']), /exactly two hosts/);
  bad(() => dialogueBeats([{ id: 's1', line: null, speaker: null }], [], ['a', 'b']), /no scene has a spoken line/);
});

test('dialogueSettings refuses an unknown mode, an unknown setting and a crop that leaves the picture', () => {
  const bad = (fn, re) => assert.throws(fn, (e) => e.code === 'bad_input' && re.test(e.message));
  bad(() => dialogueSettings('montage'), /mode "montage"/);
  bad(() => dialogueSettings('dynamic', { seems: [0.5] }), /seems is not a planner setting/);
  bad(() => dialogueSettings('dynamic', { crops: { tight: { x: 0.6, y: 0, w: 0.58, h: 0.58 } } }), /crop tight/);
  bad(() => dialogueSettings('split', { listener_source: 'still' }), /listener_source/);
  assert.deepEqual(dialogueSettings('split', { seams: [0.62, 0.37] }).split.seams, [0.62, 0.37]);
});

// ------------------------------------------------------------------ the self-checks bite
const base = (name) => planFor(PYTHON_PLANS.find((p) => p.name === name));
const mutate = (plan, fn) => {
  const o = structuredClone(plan);
  fn(o);
  return o;
};

function bites(name, check, fn, { settings: s2, products = 1, badProducts = products } = {}) {
  test(`self-check ${check} fires on its mutation (${name})`, () => {
    const { beats, settings, plan } = base(name);
    assert.deepEqual(dialoguePlanProblems(plan, beats, HOSTS, settings, { products }), [], 'clean on the good plan');
    const { plan: bad, beats: badBeats = beats } = fn(plan, beats);
    const got = dialoguePlanProblems(bad, badBeats, HOSTS, s2 ? s2(settings) : settings, { products: badProducts });
    assert.ok(ids(got).includes(check), `wanted ${check}, got ${JSON.stringify(got)}`);
  });
}

const DYN = 'example/dynamic/seed 4201';
const first = (o, mode) => o.cuts.findIndex((c) => c.mode === mode);
bites(DYN, 'cutplan_nonempty', (p) => ({ plan: mutate(p, (o) => (o.cuts = [])) }));
bites(DYN, 'cutplan_covers_vo', (p) => ({ plan: mutate(p, (o) => (o.cuts[0].end_s -= 0.4)) }));
bites(DYN, 'cutplan_tiles_beat', (p) => ({ plan: mutate(p, (o) => { o.cuts[1].start_s += 0.2; o.cuts[1].end_s += 0.2; }) }));
bites(DYN, 'cutplan_tiles_timeline', (p) => ({ plan: mutate(p, (o) => { const a = o.cuts[1]; o.cuts[1] = o.cuts[2]; o.cuts[2] = a; }) }));
bites(DYN, 'cutplan_min_cut', (p) => ({ plan: p }), { settings: (s) => ({ ...s, min_cut_s: 1.2 }) });
bites(DYN, 'cutplan_max_cut', (p) => ({ plan: p }), { settings: (s) => ({ ...s, max_cut_s: 0.8 }) });
bites(DYN, 'split_two_distinct_hosts', (p) => ({ plan: mutate(p, (o) => { const c = o.cuts.find((x) => x.mode === 'split' && x.bottom === 'listener'); c.listener = c.speaker; }) }));
bites(DYN, 'split_bottom_assets', (p) => ({ plan: p }), { badProducts: 0 });
bites(DYN, 'split_bottom_assets', (p) => ({ plan: mutate(p, (o) => (o.cuts.find((x) => x.mode === 'split' && x.bottom === 'listener').listener_clip_scene = null)) }));
bites(DYN, 'speaker_cut_is_lipsynced', (p, beats) => ({ plan: mutate(p, (o) => { const c = o.cuts[first(o, 'single')]; c.clip_scene = beats.find((b) => b.id !== c.scene_id && b.who === c.speaker).id; }) }));
bites(DYN, 'speaker_cut_is_lipsynced', (p) => ({ plan: mutate(p, (o) => (o.cuts[first(o, 'single')].source = 'still')) }));
bites(DYN, 'reaction_cut_shows_listener', (p) => ({ plan: mutate(p, (o) => { const c = o.cuts[first(o, 'reaction')]; c.show = c.speaker; }) }));
bites(DYN, 'reaction_cut_shows_listener', (p) => ({ plan: mutate(p, (o) => { const c = o.cuts[first(o, 'reaction')]; c.clip_scene = c.scene_id; }) }));
bites(DYN, 'cutplan_no_repeat_still', (p) => ({ plan: mutate(p, (o) => { const i = o.cuts.findIndex((c, k) => k > 0 && c.mode === 'single' && o.cuts[k - 1].mode === 'single'); Object.assign(o.cuts[i], { show: o.cuts[i - 1].show, framing: o.cuts[i - 1].framing }); }) }));
bites(DYN, 'framing_declared', (p) => ({ plan: mutate(p, (o) => delete o.cuts[3].framing) }));
bites(DYN, 'framing_crop_in_frame', (p) => ({ plan: mutate(p, (o) => (o.cuts[2].crop = { x: 0.6, y: 0, w: 0.58, h: 0.58 })) }));
bites(DYN, 'framing_variety_per_10s', (p) => ({ plan: mutate(p, (o) => o.cuts.forEach((c) => (c.framing = c.show + ':wide'))) }));
bites(DYN, 'framing_biggest_share', (p) => ({ plan: mutate(p, (o) => o.cuts.forEach((c, i) => { if (i % 2 === 0) c.framing = o.cuts[0].framing; })) }));
bites(DYN, 'framing_no_repeat_adjacent', (p) => ({ plan: mutate(p, (o) => (o.cuts[5].framing = o.cuts[4].framing)) }));

test('self-check split_balance fires when one host is on top of every split, and on a 5-to-1 lean', () => {
  const settings = dialogueSettings('split');
  const mk = (tops) => {
    const beats = tops.map((h, i) => ({ n: i + 1, id: `s${i + 1}`, who: h, start_s: i, end_s: i + 1, dur_s: 1 }));
    const cuts = beats.map((b) => ({ beat: b.n, scene_id: b.id, idx: 1, start_s: b.start_s, end_s: b.end_s, speaker: b.who, mode: 'split', source: 'clip', show: b.who, clip_scene: b.id, listener: b.who === 'A' ? 'B' : 'A', bottom: 'listener', framing: `split:${b.who}:0.50:listener`, crop: { x: 0, y: 0, w: 1, h: 1 } }));
    return [{ cuts, dialogue_s: beats.length, end_card_s: 0 }, beats];
  };
  assert.deepEqual(dialoguePlanProblems(...mk(['A', 'B', 'A', 'B', 'A', 'B']), HOSTS, settings), []);
  assert.ok(ids(dialoguePlanProblems(...mk(['A', 'A', 'A', 'A', 'A', 'A']), HOSTS, settings)).includes('split_balance'));
  assert.ok(ids(dialoguePlanProblems(...mk(['A', 'A', 'A', 'A', 'A', 'B']), HOSTS, settings)).includes('split_balance'));
});

test('plain mode skips the dynamic-edit checks: a whole line on one shot is the point', () => {
  const { beats, settings, plan } = base('synthetic/plain/seed 4201');
  assert.ok(plan.cuts.some((c) => c.end_s - c.start_s > 1.9), 'the fixture has a long line');
  assert.deepEqual(dialoguePlanProblems(plan, beats, HOSTS, settings), []);
});

/** Beats for line lengths, speakers alternating A, B, B, A, B, B, ... */
function beatsForLengths(lens) {
  return beatsOf(lens.map((d, i) => ({ n: i + 1, who: i % 3 === 0 ? 'A' : 'B', dur_sec: d, split: false, payoff: false })));
}

test('a line longer than any pattern can carry is shared into pieces, so dynamic keeps the 1.9 s ceiling', () => {
  // The recipe split such a line into several beats before the lipsync (plan_beats.py, max_beat_sec);
  // here one line is one clip, so the planner shares it out and every cut still reads its own clip.
  const beats = beatsForLengths([3, 2.5, 3.2, 5.6, 2.8, 3, 2.6, 3.1, 2.9, 6.0]);
  const settings = dialogueSettings('dynamic', { seed: 4201 });
  const plan = dialoguePlan(beats, HOSTS, settings, { products: 1, end_card_s: 3.5 });
  assert.deepEqual(dialoguePlanProblems(plan, beats, HOSTS, settings, { products: 1 }), []);
  assert.equal(plan.n_beats, beats.length);
  for (const c of plan.cuts) assert.ok(c.end_s - c.start_s <= 1.9 + 1e-6, `${c.scene_id}.${c.idx} runs ${c.end_s - c.start_s} s`);
  const byId = new Map(beats.map((b) => [b.id, b]));
  for (const c of plan.cuts) {
    // speaker cuts read their clip where the cut sits in the line; a reaction reads inside the listener's clip
    if (c.mode === 'single' || c.mode === 'split') near(c.src_start_s, c.start_s - byId.get(c.scene_id).start_s, `${c.scene_id}.${c.idx} source window`);
    if (c.mode === 'reaction' && c.clip_scene) {
      const lb = byId.get(c.clip_scene);
      assert.ok(c.src_start_s >= -1e-6 && c.src_end_s <= lb.dur_s + 1e-6, `${c.scene_id}.${c.idx} reads ${c.src_start_s}-${c.src_end_s} of a ${lb.dur_s} s clip`);
    }
  }
  assert.equal(plan.cuts.filter((c) => c.payoff).length, 1, 'one payoff single');
  assert.equal(plan.cuts.find((c) => c.payoff).scene_id, 's10', 'the payoff is on the last line');
  assert.equal(plan.cuts.at(-1).payoff, true, 'the payoff single ends the line');
});

test('a payoff line whose head is over the ceiling becomes several speaker cuts, not one long one', () => {
  const beats = beatsForLengths([3, 2.5, 3.2, 2.6, 2.8, 3, 2.6, 3.1, 2.9, 3.9]);
  const settings = dialogueSettings('dynamic', { seed: 4201 });
  const plan = dialoguePlan(beats, HOSTS, settings, { products: 1, end_card_s: 3.5 });
  assert.deepEqual(dialoguePlanProblems(plan, beats, HOSTS, settings, { products: 1 }), []);
  const last = plan.cuts.filter((c) => c.scene_id === 's10');
  assert.ok(last.length >= 3, `the payoff line has ${last.length} cuts`);
  assert.ok(last.every((c) => c.mode === 'single' && c.show === 'A'));
  assert.equal(last.at(-1).payoff, true);
});

test('split mode shares a line over its 6 s ceiling; plain mode keeps one picture per line', () => {
  const lens = [3, 2.5, 3.2, 2.6, 2.8, 6.6, 2.6, 3.1, 2.9, 3];
  const beats = beatsForLengths(lens);
  const split = dialogueSettings('split', { seed: 4201 });
  const sp = dialoguePlan(beats, HOSTS, split, { products: 0, end_card_s: 3.5 });
  assert.deepEqual(dialoguePlanProblems(sp, beats, HOSTS, split, { products: 0 }), []);
  assert.equal(sp.cuts.filter((c) => c.scene_id === 's6').length, 2);
  const plain = dialogueSettings('plain', { seed: 4201 });
  const pl = dialoguePlan(beats, HOSTS, plain, { products: 0, end_card_s: 3.5 });
  assert.equal(pl.cuts.length, lens.length);
  assert.deepEqual(dialoguePlanProblems(pl, beats, HOSTS, plain, { products: 0 }), []);
});

test('dialogueBeats skips a scene with no line even when the timing gives it a span', () => {
  const scenes = [
    { id: 'open', line: 'So we gave the planner a week.', speaker: 'a' },
    { id: 'beat', line: null, speaker: null },
    { id: 'hush', line: '  ', speaker: 'b' },
    { id: 'reply', line: 'One week.', speaker: 'b' },
  ];
  const spans = [{ id: 'open', start_s: 0, end_s: 2.1 }, { id: 'beat', start_s: 2.1, end_s: 2.6 }, { id: 'hush', start_s: 2.6, end_s: 2.8 }, { id: 'reply', start_s: 2.9, end_s: 3.6 }];
  const { beats, skipped } = dialogueBeats(scenes, spans, ['a', 'b'], { seconds: 3.7 });
  assert.deepEqual(skipped, ['beat', 'hush']);
  assert.deepEqual(beats.map((b) => [b.id, b.start_s, b.end_s]), [['open', 0, 2.9], ['reply', 2.9, 3.7]]);
});

test('dialogueBeats gives a line under the cut floor its picture early, from the line before, else from the next', () => {
  const scenes = [
    { id: 'q', line: 'Did it work?', speaker: 'a' },
    { id: 'yes', line: 'Yes.', speaker: 'b' },
    { id: 'how', line: 'How long did it take you?', speaker: 'a' },
  ];
  // "Yes." runs 0.3 s plus a 0.12 s gap: 0.42 s, under 0.5 s
  const spans = [{ id: 'q', start_s: 0, end_s: 1.32 }, { id: 'yes', start_s: 1.32, end_s: 1.74 }, { id: 'how', start_s: 1.74, end_s: 3.5 }];
  const { beats } = dialogueBeats(scenes, spans, ['a', 'b'], { seconds: 3.5 });
  assert.deepEqual(beats.map((b) => [b.id, +b.start_s.toFixed(6), +b.end_s.toFixed(6)]), [['q', 0, 1.24], ['yes', 1.24, 1.74], ['how', 1.74, 3.5]]);
  for (const mode of ['plain', 'split', 'dynamic']) {
    const settings = dialogueSettings(mode);
    const plan = dialoguePlan(beats, ['a', 'b'], settings, { products: 1, end_card_s: 3.5 });
    assert.deepEqual(ids(dialoguePlanProblems(plan, beats, ['a', 'b'], settings, { products: 1 })).filter((p) => !p.startsWith('framing_') && p !== 'split_balance'), [], mode);
  }
  // a short first line takes its time from the line after it
  const first = dialogueBeats(
    [{ id: 'hi', line: 'Hi.', speaker: 'a' }, { id: 'hey', line: 'Hey, good to be here.', speaker: 'b' }],
    [{ id: 'hi', start_s: 0, end_s: 0.4 }, { id: 'hey', start_s: 0.4, end_s: 2 }],
    ['a', 'b'],
    { seconds: 2 },
  ).beats;
  assert.deepEqual(first.map((b) => [b.id, +b.start_s.toFixed(6), +b.end_s.toFixed(6)]), [['hi', 0, 0.5], ['hey', 0.5, 2]]);
});

test('a split lower panel is only ever a source the style asked for; an idle listener needs no line of their own', () => {
  const beats = beatsForLengths([3, 2.5, 3.2, 2.6, 2.8, 3, 2.6, 3.1, 2.9, 3]);
  const productOnly = dialogueSettings('dynamic', { seed: 4201, bottom_sources: ['product'] });
  const plan = dialoguePlan(beats, HOSTS, productOnly, { products: 0, end_card_s: 3.5 });
  assert.ok(ids(dialoguePlanProblems(plan, beats, HOSTS, productOnly, { products: 0 })).includes('split_bottom_assets'));
  // B speaks every line: A is only ever the listener, shown from the idle clip at the split preset's seam
  const silentA = beatsOf([1, 2, 3, 4, 5, 6].map((n) => ({ n, who: 'B', dur_sec: 2.4, split: false, payoff: false })));
  const split = dialogueSettings('split', { seed: 4201 });
  const sp = dialoguePlan(silentA, HOSTS, split, { products: 0, end_card_s: 3.5 });
  const splits = sp.cuts.filter((c) => c.mode === 'split');
  assert.ok(splits.length > 0);
  for (const c of splits) {
    assert.equal(c.seam, 0.5);
    assert.equal(c.listener, 'A');
    assert.equal(c.listener_source, 'idle');
  }
});
