// Port of skills/ads/packs/ugc-video-formats/review-ugc-render/tests/test_review_render.py
// (the tests of the pure functions). Test names are the Python names without "test_".
// Not ported: the CLI tests (exit codes, stubbed ffmpeg and transcription, file IO)
// and the report-wording half of the report test (render_report is CLI output).
//
//   node --test parts/_lib/speech.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEECH_DEFAULT_MIN_RATIO,
  speechBuildAliases,
  speechCanonicalTokens,
  speechParseAlias,
  speechPronunciationPairs,
  speechReview,
  speechTokenize,
} from './speech.mjs';

const review = (script, heard, kw) => speechReview(script, heard, kw);

// cases: [script, heard, kwargs, expectPass]. Fails with every wrong case listed.
function check(cases) {
  const wrong = [];
  for (const [script, heard, kw, expect] of cases) {
    const v = review(script, heard, kw);
    if (v.passed !== expect) {
      wrong.push(
        `${JSON.stringify(script)} vs ${JSON.stringify(heard)} ${JSON.stringify(kw)}: expected ${expect ? 'PASS' : 'FAIL'}, ` +
          `got ratio ${v.ratio.toFixed(2)} ${JSON.stringify(v.issues.map((i) => [i.severity, i.script_text, i.heard_text]))}`,
      );
    }
  }
  assert.deepEqual(wrong, []);
}

const high = (v) => v.issues.filter((i) => i.severity === 'high');
const show = (v) => JSON.stringify(v.issues);

// ---- Original behaviour (kept) ----
test('tokenize_strips_punctuation_and_hyphens', () => {
  assert.deepEqual(speechTokenize('Human-Vetted, and DONE!'), ['human', 'vetted', 'and', 'done']);
});

test('exact_match_passes', () => {
  const script = 'Okay real talk my agent does the grunt work now';
  const v = review(script, script);
  assert.ok(v.passed);
  assert.equal(v.ratio, 1.0);
  assert.deepEqual(v.issues, []);
});

test('misvoiced_word_fails_high_severity', () => {
  // The real defect: approved "vetted", Seedance audio said "witted".
  const v = review('Every lead is human-vetted before it reaches you', 'Every lead is human witted before it reaches you');
  assert.ok(!v.passed, 'a mis-voiced word must fail the gate');
  const subs = v.issues.filter((i) => i.kind === 'substitution');
  assert.ok(subs.length && subs[0].severity === 'high');
  assert.deepEqual(subs[0].script_words, ['vetted']);
  assert.deepEqual(subs[0].heard_words, ['witted']);
});

test('minor_extra_filler_word_passes', () => {
  // benign leading filler
  const v = review('My campaigns are running and leads keep coming in', 'So my campaigns are running and leads keep coming in');
  assert.ok(v.passed);
  assert.ok(v.issues.every((i) => i.severity === 'low'));
});

test('dropped_phrase_fails_on_ratio', () => {
  // whole tail dropped
  const v = review('This quiet is the first time in months and it is still working for me', 'This quiet is the first time in months');
  assert.ok(!v.passed);
  assert.ok(v.issues.some((i) => i.kind === 'dropped'));
});

test('no_script_is_advisory_pass', () => {
  const v = review('', 'anything at all');
  assert.ok(v.passed);
  assert.ok(v.issues.some((i) => i.kind === 'no_script'));
});

test('brand_name_misvoicing_flagged_high', () => {
  // Classic Seedance brand mis-voicing (documented: Hume to Hune, Alitu to al-too).
  const v = review('Hume makes the band that reads your mood', 'Hune makes the band that reads your mood');
  assert.ok(!v.passed);
  assert.equal(v.issues[0].severity, 'high');
});

// ---- QA-71 audit fixture table (evidence/A07-audio-creator.md) ----
// Before the Python change every `true` row FAILED and the Hume to Hune row PASSED.
const AUDIT_CASES = [
  ['Take 5mg daily', 'Take five milligrams daily', {}, true],
  ['Visit braxleybands.com today', 'Visit braxleybands dot com today', {}, true],
  ['Only 15 dollars', 'Only fifteen dollars', {}, true],
  ['Get 30% off now', 'Get thirty percent off now', {}, true],
  ["Don't miss it", 'Do not miss it', {}, true],
  ['Meet Braxleybands today', 'Meet Braxley Bands today', { brand_terms: ['Braxleybands'] }, true],
  ['Meet Drinkag1 now', 'Meet drink AG1 now', { brand_terms: ['Drinkag1'] }, true],
  ['Hume makes the band', 'Hune makes the band', { brand_terms: ['Hume'] }, false],
  ['It costs 49 dollars', 'It costs 59 dollars', {}, false],
  ['Visit braxleybands.com today', 'Visit braxley bands dot com today', {}, true],
  ['Our bands never slip', 'Our bands slip', {}, false],
];

test('audit_fixture_table', () => {
  check(AUDIT_CASES);
});

test('audit_failures_are_high_severity', () => {
  for (const [script, heard, kw, expect] of AUDIT_CASES) {
    if (!expect) {
      const v = review(script, heard, kw);
      assert.ok(high(v).length, `${script} vs ${heard} must fail HIGH, got ${show(v)}`);
    }
  }
});

// ---- Numbers ----
test('number_words_equal_digits', () => {
  check([
    ['It costs 49 dollars', 'It costs forty-nine dollars', {}, true],
    ['It costs 49 dollars', 'It costs forty nine dollars', {}, true],
    ['Over 105 reviews', 'Over one hundred and five reviews', {}, true],
    ['Over 100 reviews', 'Over a hundred reviews', {}, true],
    ['Join 2,500 teams', 'Join two thousand five hundred teams', {}, true],
    ['Join 10k teams', 'Join ten thousand teams', {}, true],
    ['Since 2026', 'Since twenty twenty six', {}, true],
    ['Add 2.5 scoops', 'Add two point five scoops', {}, true],
    ['Add 1.5 scoops', 'Add one and a half scoops', {}, true],
    ['Your 1st order', 'Your first order', {}, true],
    ['Open 24/7', 'Open twenty four seven', {}, true],
  ]);
});

test('wrong_number_fails_high_even_when_similar', () => {
  for (const [script, heard] of [
    ['Our team takes 5mg every day after a big breakfast', 'Our team takes 6mg every day after a big breakfast'],
    ['Over 105 reviews', 'Over one hundred and fifteen reviews'],
    ['Add 2.5 scoops', 'Add 25 scoops'],
  ]) {
    const v = review(script, heard);
    assert.ok(!v.passed && high(v).length, `${script} / ${heard} ${show(v)}`);
  }
});

test('wrong_price_fails_high', () => {
  const v = review('Get it for only $49 today', 'Get it for only fifty nine dollars today');
  assert.ok(!v.passed);
  assert.ok(high(v).length && high(v)[0].note.includes('number'));
});

test('prices_with_cents', () => {
  check([
    ['It costs $49.99', 'It costs forty nine dollars and ninety nine cents', {}, true],
    ['It costs $49.99', 'It costs forty nine dollars ninety nine', {}, true],
    ['It costs $49', 'It costs forty nine dollars', {}, true],
  ]);
});

// ---- Units and percent ----
test('units_after_a_quantity', () => {
  check([
    ['Take 5mg daily', 'Take five milligrams daily', {}, true],
    ['Add 30g of protein', 'Add thirty grams of protein', {}, true],
    ['Lift 20kg today', 'Lift twenty kilograms today', {}, true],
    ['Drink 500ml daily', 'Drink five hundred milliliters daily', {}, true],
    ['Drink 2l daily', 'Drink two liters daily', {}, true],
    ['A 12oz can', 'A twelve ounce can', {}, true],
    ['Lose 10 lbs fast', 'Lose ten pounds fast', {}, true],
    ['Take 5 mg daily', 'Take 5mg daily', {}, true],
  ]);
});

test('percent', () => {
  check([
    ['Get 30% off now', 'Get thirty percent off now', {}, true],
    ['Get 30% off now', 'Get 30 percent off now', {}, true],
    ['Get 30% off now', 'Get thirty per cent off now', {}, true],
    ['Get 30% off now', 'Get forty percent off now', {}, false],
  ]);
});

test('unit_change_fails_high', () => {
  const v = review('Take 5mg daily', 'Take five grams daily');
  assert.ok(!v.passed && high(v).length);
});

test('unit_abbreviation_not_after_a_quantity_is_not_rewritten', () => {
  // A brand or initialism "MG" must never turn into "milligrams".
  assert.ok(!review('Meet MG today', 'Meet milligrams today').passed);
});

// ---- URLs ----
test('urls', () => {
  check([
    ['Visit example.com today', 'Visit example dot com today', {}, true],
    ['Visit www.example.com today', 'Visit w w w dot example dot com today', {}, true],
    ['Visit www.example.com today', 'Visit www dot example dot com today', {}, true],
    ['Visit www.example.com today', 'Visit example dot com today', {}, true],
    ['Visit https://example.com/shop', 'Visit example dot com slash shop', {}, true],
    ['Try juicebox.ai', 'Try juicebox dot a i', {}, true],
  ]);
});

test('url_component_change_fails', () => {
  check([
    ['Visit example.com today', 'Visit other dot com today', {}, false],
    ['Visit shop.example.com', 'Visit example dot com', {}, false],
    ['Visit example.com today', 'Visit example dot net today', {}, false],
  ]);
});

// ---- Contractions and negation ----
test('contractions_pass', () => {
  check([
    ["Don't miss it", 'Do not miss it', {}, true],
    ["It's here", 'It is here', {}, true],
    ["You're going to love it", 'You are going to love it', {}, true],
    ["I'm obsessed", 'I am obsessed', {}, true],
    ["We'll ship today", 'We will ship today', {}, true],
    ["You can't lose", 'You cannot lose', {}, true],
    ["You can't lose", 'You can not lose', {}, true],
    ["It won't fade", 'It will not fade', {}, true],
    ["It doesn't fade", 'It does not fade', {}, true],
    ["Let's go", 'Let us go', {}, true],
    ['It\u{2019}s here', "It's here", {}, true],
  ]);
});

test('negation_flip_fails_high', () => {
  for (const [script, heard] of [
    ['This really does help', "This really doesn't help"],
    ['You do need this', "You don't need this"],
    ['You can stop anytime', "You can't stop anytime"],
    ['It does not fade', 'It does fade'],
    ['Made with sugar', 'Made without sugar'],
    ['Our bands never slip', 'Our bands slip'],
  ]) {
    const v = review(script, heard);
    assert.ok(!v.passed, `${script} / ${heard}`);
    assert.ok(high(v).length && high(v)[0].note.includes('negation'), `${script} / ${heard} ${show(v)}`);
  }
});

// ---- Fused / split words ----
test('fused_and_split_words_are_equal', () => {
  check([
    ['Meet Braxleybands today', 'Meet Braxley Bands today', {}, true],
    ['Try Gooseworks today', 'Try goose works today', {}, true],
    ['Try Goose Works today', 'Try Gooseworks today', {}, true],
    ['Meet Drinkag1 now', 'Meet drink AG1 now', {}, true],
  ]);
});

test('fusion_is_exact_not_fuzzy', () => {
  check([
    ['Meet Braxleybands today', 'Meet Braxly Bands today', { brand_terms: ['Braxleybands'] }, false],
    ['Try Gooseworks today', 'Try goose work today', { brand_terms: ['Gooseworks'] }, false],
  ]);
});

// ---- Brand terms ----
test('brand_term_is_not_stripped_hume_hune_fails', () => {
  // Before QA-71 the fuzzy brand strip removed "Hune" and this PASSED with ratio 1.00.
  const v = review('Hume makes the band', 'Hune makes the band', { brand_terms: ['Hume'] });
  assert.ok(!v.passed);
  assert.ok(high(v).length && high(v)[0].note.includes('brand'));
});

test('dropped_brand_fails_high', () => {
  const v = review('Hume makes the band that reads your mood every single day', 'makes the band that reads your mood every single day', {
    brand_terms: ['Hume'],
  });
  assert.ok(!v.passed && high(v).length);
});

test('brand_term_fused_split_forms_pass', () => {
  check([
    ['Try Gooseworks today', 'Try goose works today', { brand_terms: ['Gooseworks'] }, true],
    ['Try Gooseworks today', 'Try Gooseworks today', { brand_terms: ['Goose Works'] }, true],
  ]);
});

// ---- Confirmed aliases ----
test('ag1_alias_passes_only_when_confirmed', () => {
  const script = 'Meet AG1 now';
  // Not confirmed: a spelled-out "A G one" is not assumed, even with a brand term.
  assert.ok(!review(script, 'Meet A G one now').passed);
  assert.ok(!review(script, 'Meet A G one now', { brand_terms: ['AG1'] }).passed);
  const confirmed = { aliases: [['AG1', 'A G one']] };
  for (const heard of ['Meet AG1 now', 'Meet AG one now', 'Meet A G 1 now', 'Meet A.G. one now', 'Meet A G one now']) {
    const v = review(script, heard, confirmed);
    assert.ok(v.passed, `${heard} ${show(v)}`);
  }
});

test('alias_does_not_hide_a_wrong_number_or_misvoice', () => {
  const confirmed = { aliases: { AG1: 'A G one' } };
  assert.ok(!review('Meet AG1 now', 'Meet A G two now', confirmed).passed);
  assert.ok(!review('Meet AG1 now', 'Meet A B one now', confirmed).passed);
});

test('alias_cannot_rewrite_quantities_units_or_negations', () => {
  for (const bad of [
    { AG1: 'A G two' },
    { AG1: 'A G one not' },
    { Decagon: 'five' },
    { Decagon: '5' },
    { Gold: 'five milligrams' },
    { Hume: 'not' },
    { Nope: 'no' },
    [
      ['A', 'same thing'],
      ['B', 'same thing'],
    ],
    [['AG1', '']],
  ]) {
    assert.throws(() => speechBuildAliases(bad), { name: 'ValueError' }, `alias ${JSON.stringify(bad)} should be rejected`);
  }
});

test('saved_pronunciations_with_number_like_syllables_are_accepted', () => {
  // Review P1-1: real saved pronunciations sound like numbers/negations; they must not error.
  const good = [
    ['Notion', 'NO-shun'],
    ['OneSkin', 'one skin'],
    ['Tenzing', 'ten-zing'],
    ['Sevenly', 'seven-lee'],
    ['Nomad', 'no-mad'],
    ['Norwex', 'nor-wex'],
    ['Fourthwall', 'fourth wall'],
    ['Wonderbly', 'one-der-blee'],
    ['AG1', 'A G one'],
  ];
  speechBuildAliases(good);
  check([
    ['OneSkin changed my skin', 'One Skin changed my skin', { aliases: [['OneSkin', 'one skin']] }, true],
    ['Tenzing keeps me going', 'Ten zing keeps me going', { aliases: [['Tenzing', 'ten-zing']] }, true],
    // the term is not even in the script: still no error
    ['Our gummies help you sleep', 'Our gummies help you sleep', { aliases: [['Notion', 'NO-shun']] }, true],
  ]);
});

test('alias_cli_and_pronunciations_file_parsing', () => {
  assert.deepEqual(speechParseAlias('AG1=A G one'), ['AG1', 'A G one']);
  for (const bad of ['AG1', '=A G one', 'AG1=']) {
    assert.throws(() => speechParseAlias(bad), { name: 'ValueError' }, `--alias ${JSON.stringify(bad)} should be rejected`);
  }
  // The Python test writes this JSON to a file; here it is the already-parsed JSON.
  const pairs = speechPronunciationPairs({
    brand_id: 'b1',
    basis: 'fresh user-authored brand learnings read',
    pronunciations: [{ term: 'AG1', say_as: 'A G one', fact_id: 'f1' }],
  });
  assert.deepEqual(pairs, [['AG1', 'A G one']]);
  let v = review('Meet AG1 now', 'Meet A G one now', { aliases: pairs });
  assert.ok(v.passed);
  assert.deepEqual(v.aliases, [{ term: 'AG1', say_as: 'A G one' }]);
  // a confirmed term is also a brand term: mis-voicing it is HIGH
  v = review('Meet AG1 now', 'Meet A G now', { aliases: pairs });
  assert.ok(!v.passed && high(v).length);
});

// ---- Review fixes: units, CLI-style brand terms, joins, number forms ----
const TAIL = 'and honestly it has been the best part of my morning routine for the last few weeks';

test('dropped_or_added_unit_fails_high_even_in_a_long_line', () => {
  // Review P1-2: a long line keeps the similarity above 0.90, so the unit itself must fail.
  for (const [script, heard] of [
    [`Take 5mg of melatonin every night ${TAIL}`, `Take five of melatonin every night ${TAIL}`],
    [`Get 30% off your first order today ${TAIL}`, `Get thirty off your first order today ${TAIL}`],
    [`Take 5 every night ${TAIL}`, `Take five grams every night ${TAIL}`],
    [`Contains 200 calories per serving ${TAIL}`, `Contains 200 per serving ${TAIL}`],
  ]) {
    const v = review(script, heard);
    assert.ok(!v.passed && high(v).length && high(v)[0].note.includes('unit'), `${heard} ${show(v)}`);
  }
});

test('dropped_currency_word_alone_is_not_high', () => {
  // "$9.99" is routinely read "nine ninety-nine"
  let v = review(`It is just $9.99 a month ${TAIL}`, `It is just nine ninety nine a month ${TAIL}`);
  assert.ok(v.passed && !high(v).length, show(v));
  v = review(`It is just $9.99 a month ${TAIL}`, `It is just nine dollars eighty nine a month ${TAIL}`);
  assert.ok(!v.passed && high(v).length);
});

test('unit_words_count_only_after_a_number', () => {
  // "minutes" with no number before it is an ordinary word: dropping it is medium, not a unit error
  const v = review(`It saves you minutes every single day ${TAIL}`, `It saves you every single day ${TAIL}`);
  assert.ok(v.passed, show(v));
  assert.deepEqual(
    v.issues.map((i) => i.severity),
    ['medium'],
  );
});

test('cli_style_brand_terms_accept_spoken_form_script', () => {
  // Review P1-3: goose-video-local writes the script in the SPOKEN form and passes a brand term
  // for the brand and for each word of its say_as. That must keep passing.
  const terms = { brand_terms: ['Acme', 'ak', 'mee'] };
  check([
    ['Try ak-mee today', 'Try Acme today', terms, true],
    ['Try ak-mee today', 'Try ak mee today', terms, true],
    ['Try Acme today', 'Try ak-mee today', terms, true],
  ]);
  // ...but a mis-voicing whose heard word is not a declared term still fails HIGH
  let v = review('Hume makes the band', 'Hune makes the band', { brand_terms: ['Hume', 'hyoom'] });
  assert.ok(!v.passed && high(v).length);
  v = review('Try ak-mee today', 'Try ak-moo today', terms);
  assert.ok(!v.passed && high(v).length);
  // ...and a dropped brand is still HIGH
  v = review('Try ak-mee today and feel the difference', 'Try today and feel the difference', terms);
  assert.ok(!v.passed && high(v).length);
});

test('joined_words_never_swallow_a_negation', () => {
  check([
    ['There is no table in the room', 'There is notable in the room', {}, false],
    ['It is a notable change', 'It is a no table change', {}, false],
    ['You are not able to stop', 'You are notable to stop', {}, false],
    ['There is nothing to lose', 'There is no thing to lose', {}, true],
  ]);
});

test('number_words_join_into_words', () => {
  check([
    ['Every one of them works', 'Everyone of them works', {}, true],
    ['I need someone now', 'I need some one now', {}, true],
    ['OneSkin changed my skin', 'One Skin changed my skin', {}, true],
  ]);
});

test('more_number_forms', () => {
  check([
    ['This is my 2nd bottle', 'This is my second bottle', {}, true],
    ['This is my 1st bottle', 'This is my second bottle', {}, false],
    ['It is only two-forty-nine', 'It is only 249', {}, true],
    ['Over a million people use it', 'Over one million people use it', {}, true],
    ['It is the No. 1 pick', 'It is the number one pick', {}, true],
    ['It is the No.1 pick', 'It is the number one pick', {}, true],
    ['It is the #1 pick', 'It is the number one pick', {}, true],
    ['It is the No. 1 pick', 'It is the number two pick', {}, false],
  ]);
  // "no one" is still a negation
  const v = review('No one beats it', 'One beats it');
  assert.ok(!v.passed && high(v).length);
});

test('ag1_without_alias_written_forms', () => {
  // Whisper writing "AG one" or "A.G. one" for AG1 passes without an alias; spaced letters do not.
  check([
    ['Drink AG1 daily', 'Drink AG one daily', {}, true],
    ['Drink AG1 daily', 'Drink A.G. one daily', {}, true],
    ['Drink AG1 daily', 'Drink A G one daily', {}, false],
  ]);
});

// ---- Re-review: rules that must not let real defects through ----
function failsHigh(cases) {
  const wrong = [];
  for (const [script, heard, kw] of cases) {
    const v = review(`${script} ${TAIL}`, `${heard} ${TAIL}`, kw);
    if (v.passed || !high(v).length) {
      wrong.push(`${JSON.stringify(script)} vs ${JSON.stringify(heard)} ${JSON.stringify(kw)}: expected HIGH fail, got ${v.passed} ${show(v)}`);
    }
  }
  assert.deepEqual(wrong, []);
}

function passesLong(cases) {
  check(cases.map(([s, h, kw]) => [`${s} ${TAIL}`, `${h} ${TAIL}`, kw, true]));
}

test('brand_term_swap_rule_does_not_hide_wrong_numbers_or_names', () => {
  // Re-review P1-A: the declared-term rule must not accept digits, different names or products.
  failsHigh([
    ['Open 7 days a week', 'Open 11 days a week', { brand_terms: ['7-Eleven'] }],
    ['The Pod 4 cools your bed', 'The Pod 5 cools your bed', { brand_terms: ['Pod 4', 'Pod 5'] }],
    ['Hims is made for men', 'Hers is made for men', { brand_terms: ['Hims & Hers'] }],
    ['Hims is made for men', 'Hers is made for men', { brand_terms: ['Hims', 'Hers'] }],
    ['Meet the Hume Body Pod', 'Meet the Hume Band', { brand_terms: ['Hume', 'Hume Band', 'Hume Body Pod'] }],
    ['Try Acme today', 'Try ak today', { brand_terms: ['Acme', 'ak', 'mee'] }],
  ]);
  // common words in a declared term are not "the same brand"
  const v = review('It just works every time', 'It just goose every time', { brand_terms: ['Goose Works'] });
  assert.ok(!v.passed && !v.issues.some((i) => i.note.includes('accepted')), show(v));
  // still accepted: the spoken form of the brand vs its spelling
  passesLong([['Try ak-mee today', 'Try Acme today', { brand_terms: ['Acme', 'ak', 'mee'] }]]);
});

test('no_before_a_number_stays_a_negation', () => {
  // Re-review P1-B: only a written "No." means "number".
  failsHigh([
    ['There is no 2-year contract', 'There is a 2-year contract', {}],
    ['We have no 1-star reviews', 'We have 1-star reviews', {}],
  ]);
  passesLong([
    ['No 30-day lock-in', 'No thirty-day lock-in', {}],
    ['It is the No. 1 pick', 'It is the number one pick', {}],
    ['The No.1 choice', 'The number one choice', {}],
  ]);
});

test('written_digits_never_join', () => {
  // Re-review P1-C: two written numbers are two numbers.
  failsHigh([
    ['Do 2 20-minute workouts', 'Do 220 minute workouts', {}],
    ['Book 1 15-minute session', 'Book 115 minute session', {}],
    ['Grab 3 10-packs', 'Grab 310 packs', {}],
  ]);
  passesLong([
    ['It is only two-forty-nine', 'It is only 249', {}],
    ['Only 249 today', 'Only two forty nine today', {}],
    ['Launching in 2026', 'Launching in twenty twenty six', {}],
  ]);
  failsHigh([['Launching in 2026', 'Launching in twenty twenty five', {}]]);
});

test('spelled_number_does_not_join_a_single_letter', () => {
  failsHigh([['Drink A G one daily', 'Drink a gone daily', {}]]);
});

test('alias_may_not_add_a_strong_negation', () => {
  for (const bad of [
    ['Hume', 'Hume not'],
    ['Hume', 'never Hume'],
    ['Lux', 'without lux'],
    ['Nonea', 'none a'],
    ['Nothingbut', 'nothing but'],
    ['Nobodee', 'nobody'],
  ]) {
    assert.throws(() => speechBuildAliases([bad]), { name: 'ValueError' }, `alias ${JSON.stringify(bad)} should be rejected`);
  }
  // "no" and "nor" are fine as syllables
  speechBuildAliases([
    ['Nomad', 'no mad'],
    ['Norwex', 'nor-wex'],
  ]);
  passesLong([['Nomad bags last', 'No mad bags last', { aliases: { Nomad: 'no mad' } }]]);
});

test('time_units_and_cents', () => {
  failsHigh([
    ['Our 30-day guarantee', 'Our 30-year guarantee', {}],
    ['Results in 4 weeks', 'Results in 4 days', {}],
    ['Only 99 cents a day', 'Only ninety nine a day', {}],
  ]);
  passesLong([
    ['Try it for 30 day', 'Try it for thirty days', {}],
    ['Take it 5 times a day', 'Take it five times a day', {}],
    ['Just 30 minutes a day', 'Just thirty minutes a day', {}],
    ['Just 30 min a day', 'Just thirty minutes a day', {}],
    ['Just $9.99 a month', 'Just nine ninety nine a month', {}],
  ]);
});

// ---- Omission and extra speech ----
test('omission_fails', () => {
  const v = review('Take two capsules every morning with water', 'Take two capsules every morning');
  assert.ok(!v.passed);
  assert.ok(v.issues.some((i) => i.kind === 'dropped'));
});

test('unexpected_extra_speech_fails', () => {
  assert.ok(!review('Take two capsules every morning', 'Take two capsules every morning and tell all your friends about it today').passed);
});

// ---- Report ----
test('report_quotes_original_words_and_new_pin_wording (verdict half)', () => {
  // render_report is CLI output and is not ported; the report quotes these two fields.
  // The pin-wording asserts of the Python test are skipped.
  const v = review('Take 5mg daily', 'Take six milligrams daily');
  const sub = v.issues.find((i) => i.kind === 'substitution');
  assert.ok(sub, show(v));
  assert.equal(sub.script_text, '5mg');
  assert.equal(sub.heard_text, 'six');
});

// ---- Prices ----
test('price_per_period_reads_as_spoken', () => {
  // "$29/month" is said "twenty nine dollars a month"; the currency word follows the amount.
  for (const [script, heard] of [
    ['It is $29/month for the full plan', 'It is twenty nine dollars a month for the full plan'],
    ['Just $1/day to start', 'Just one dollar a day to start'],
    ['Only 99\u{a2} each', 'Only ninety nine cents each'],
  ]) {
    const v = review(script, heard);
    assert.ok(v.passed, `${script} / ${heard} ${JSON.stringify(v.issues.map((i) => [i.kind, i.severity, i.script_words, i.heard_words]))}`);
  }
});

test('thousands_with_decimal_keep_the_decimal', () => {
  assert.ok(review('Save $2.5k this year', 'Save twenty five hundred dollars this year').passed);
  assert.ok(review('Save $10.25k this year', 'Save ten thousand two hundred fifty dollars this year').passed);
  const v = review('Save $2.5k this year', 'Save two thousand dollars this year');
  assert.ok(!v.passed && v.issues.some((i) => i.severity === 'high'));
});

// ---- Not in the Python file: what the skipped CLI tests read from the verdict ----
test('verdict_fields_match_the_python_verdict', () => {
  // test_cli_pass_fail_and_error_exit_codes reads these fields from the --json verdict.
  assert.ok(review('Take 5mg daily', 'Take five milligrams daily').passed);
  const v = review('Hume makes the band', 'Hune makes the band', { brand_terms: ['Hume'] });
  assert.deepEqual(Object.keys(v), [
    'passed',
    'ratio',
    'issues',
    'silent',
    'music_present',
    'script_tokens',
    'transcript_tokens',
    'brand_terms',
    'aliases',
  ]);
  assert.deepEqual(Object.keys(v.issues[0]), ['kind', 'severity', 'script_words', 'heard_words', 'note', 'script_text', 'heard_text']);
  assert.equal(v.issues[0].severity, 'high');
  assert.equal(v.issues[0].heard_text, 'Hune');
  assert.deepEqual(review('Meet AG1 now', 'Meet A G one now', { aliases: [speechParseAlias('AG1=A G one')] }).aliases, [
    { term: 'AG1', say_as: 'A G one' },
  ]);
  // test_cli_unusable_saved_pronunciation_is_skipped_not_fatal: a brand-rules.json shape parses,
  // and the unusable entry is the one speechBuildAliases rejects.
  const pairs = speechPronunciationPairs({
    name: 'Acme',
    pronunciations: [
      { term: 'Decagon', say_as: 'five' },
      { term: 'OneSkin', say_as: 'one skin', learning_id: '1' },
    ],
  });
  assert.throws(() => speechBuildAliases([pairs[0]]), { name: 'ValueError' });
  assert.ok(review('OneSkin changed my skin', 'One Skin changed my skin', { aliases: [pairs[1]] }).passed);
  assert.throws(() => speechPronunciationPairs({ pronunciations: [{ term: 'AG1' }] }), { name: 'ValueError' });
  assert.throws(() => speechPronunciationPairs({ brand_id: 'b1' }), { name: 'ValueError' });
  assert.equal(SPEECH_DEFAULT_MIN_RATIO, 0.9);
  assert.deepEqual(
    speechCanonicalTokens('5mg').map((t) => [t.text, t.orig, t.unit]),
    [
      ['5', '5mg', false],
      ['milligrams', '5mg', true],
    ],
  );
});
