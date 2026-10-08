// Speech-vs-script gate: a port of the pure part of
// skills/ads/packs/ugc-video-formats/review-ugc-render/scripts/review_render.py
// (canonical spoken form, word diff, issue classification and the verdict).
// It mirrors the Python exactly, including difflib.SequenceMatcher and the
// Unicode behaviour of Python's str methods and re module, so the check layer
// reaches the same verdict as the skill's CLI. No I/O and no imports.
// Every top-level name starts with `speech` or `_speech`, because the bundler
// inlines this file next to other modules.

// ---- Tunables ----
export const SPEECH_DEFAULT_MIN_RATIO = 0.9; // transcript to script token similarity to pass
// A substitution between two short, similarly spelled words is almost always a
// mis-voicing (vetted to witted, Hume to Hune), not a paraphrase. Flag it HIGH.
const _speechMisvoiceMaxLenDelta = 3;
const _speechMisvoiceMinCharSim = 0.5;
// A spoken form vs a brand spelling made only of declared brand-term words
// ("ak mee" vs "acme" = 0.67) must at least look this alike to be accepted.
const _speechBrandSwapMinCharSim = 0.6;

// ---- Python str and re semantics ----
// The characters Python's str.isspace() accepts (str.split() and str.strip() use them).
const _speechSpaceClass =
  '\\t\\n\\v\\f\\r\\x1c-\\x20\\x85\\xa0\\u{1680}\\u{2000}-\\u{200a}\\u{2028}\\u{2029}\\u{202f}\\u{205f}\\u{3000}';
// str.isdigit(): decimal digits plus the Numeric_Type=Digit characters (superscripts,
// circled digits and the like).
const _speechDigitClass =
  '\\p{Nd}\\u{b2}\\u{b3}\\u{b9}\\u{1369}-\\u{1371}\\u{19da}\\u{2070}\\u{2074}-\\u{2079}\\u{2080}-\\u{2089}' +
  '\\u{2460}-\\u{2468}\\u{2474}-\\u{247c}\\u{2488}-\\u{2490}\\u{24ea}\\u{24f5}-\\u{24fd}\\u{24ff}' +
  '\\u{2776}-\\u{277e}\\u{2780}-\\u{2788}\\u{278a}-\\u{2792}\\u{10a40}-\\u{10a43}\\u{10e60}-\\u{10e68}' +
  '\\u{11052}-\\u{1105a}\\u{1f100}-\\u{1f10a}';
const _speechSpaceRunRe = new RegExp(`[${_speechSpaceClass}]+`, 'u');
const _speechSpaceEdgeRe = new RegExp(`^[${_speechSpaceClass}]+|[${_speechSpaceClass}]+$`, 'gu');
const _speechDigitRe = new RegExp(`^[${_speechDigitClass}]+$`, 'u');
const _speechAlphaRe = /^\p{L}+$/u; // str.isalpha(): Lu, Ll, Lt, Lm, Lo
const _speechOneNdRe = /^\p{Nd}$/u; // re \d is Unicode Nd
const _speechNonPrintableRe = /^[\p{C}\p{Z}]$/u;

function _speechIsAlpha(s) {
  return _speechAlphaRe.test(s);
}

function _speechIsDigit(s) {
  return _speechDigitRe.test(s);
}

function _speechPySplit(s) {
  return s.split(_speechSpaceRunRe).filter((x) => x !== '');
}

function _speechPyStrip(s) {
  return s.replace(_speechSpaceEdgeRe, '');
}

// str.strip(chars) / str.lstrip(chars). Every char in `chars` is a single UTF-16 unit.
function _speechStripSet(s, chars, right = true) {
  let a = 0;
  let b = s.length;
  while (a < b && chars.includes(s[a])) a += 1;
  while (right && b > a && chars.includes(s[b - 1])) b -= 1;
  return s.slice(a, b);
}

// len() and indexing count code points, not UTF-16 units.
function _speechLen(s) {
  return Array.from(s).length;
}

function _speechFirst(s) {
  return s ? String.fromCodePoint(s.codePointAt(0)) : '';
}

function _speechLjust(s, width) {
  const n = _speechLen(s);
  return n >= width ? s : s + '0'.repeat(width - n);
}

// int() of a string of Unicode decimal digits. Decimal digits are encoded in
// contiguous runs of ten (0 to 9), so a digit's value is its distance from the
// start of its run, modulo ten.
function _speechInt(digits) {
  let ascii = '';
  for (const ch of digits) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x30 && cp <= 0x39) {
      ascii += ch;
      continue;
    }
    let first = cp;
    while (_speechOneNdRe.test(String.fromCodePoint(first - 1))) first -= 1;
    ascii += String((cp - first) % 10);
  }
  return BigInt(ascii);
}

// unicodedata.combining(ch) != 0, for a character already in decomposed form
// (the text is NFKD first). Such a character moves in front of U+0345 (class
// 240, the highest class) when the pair is put in canonical order.
function _speechIsCombining(ch) {
  const cp = ch.codePointAt(0);
  if (cp < 0x300) return false;
  return cp === 0x345 || ('\u{345}' + ch).normalize('NFD') !== '\u{345}' + ch.normalize('NFD');
}

// repr() of a str, for error messages.
function _speechRepr(s) {
  if (s === null || s === undefined) return 'None';
  if (typeof s !== 'string') return String(s);
  const q = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = q;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (ch === q || ch === '\\') out += '\\' + ch;
    else if (ch === '\t') out += '\\t';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch !== ' ' && _speechNonPrintableRe.test(ch)) {
      const hex = cp.toString(16);
      if (cp < 0x100) out += '\\x' + hex.padStart(2, '0');
      else if (cp < 0x10000) out += '\\' + 'u' + hex.padStart(4, '0');
      else out += '\\U' + hex.padStart(8, '0');
    } else out += ch;
  }
  return out + q;
}

function _speechValueError(message) {
  const e = new Error(message);
  e.name = 'ValueError';
  return e;
}

function _speechSameList(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function _speechIsDict(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function _speechDictEntries(x) {
  return x instanceof Map ? [...x.entries()] : Object.entries(x);
}

function _speechDictGet(x, key) {
  if (x instanceof Map) return x.get(key);
  return Object.prototype.hasOwnProperty.call(x, key) ? x[key] : undefined;
}

// list(x) for the iterables a caller may pass (a str iterates its characters).
function _speechToList(x, what) {
  if (typeof x === 'string') return Array.from(x);
  if (x !== null && x !== undefined && typeof x[Symbol.iterator] === 'function') return Array.from(x);
  throw new TypeError(`${what} is not iterable`);
}

function _speechTruthy(x) {
  if (Array.isArray(x)) return x.length > 0;
  if (x instanceof Map || x instanceof Set) return x.size > 0;
  if (_speechIsDict(x)) return Object.keys(x).length > 0;
  return Boolean(x);
}

// ---- difflib.SequenceMatcher ----
// The two ways review_render uses it: isjunk is always None, so the junk set is
// empty and only the "popular" purge applies (autojunk on and 200+ items in b).

function _speechMatchingBlocks(a, b, autojunk) {
  const b2j = new Map();
  for (let i = 0; i < b.length; i++) {
    let indices = b2j.get(b[i]);
    if (!indices) {
      indices = [];
      b2j.set(b[i], indices);
    }
    indices.push(i);
  }
  const n = b.length;
  if (autojunk && n >= 200) {
    const ntest = (n - (n % 100)) / 100 + 1;
    const popular = [];
    for (const [elt, idxs] of b2j) if (idxs.length > ntest) popular.push(elt);
    for (const elt of popular) b2j.delete(elt);
  }

  const findLongestMatch = (alo, ahi, blo, bhi) => {
    let besti = alo;
    let bestj = blo;
    let bestsize = 0;
    let j2len = new Map();
    for (let i = alo; i < ahi; i++) {
      const newj2len = new Map();
      const idxs = b2j.get(a[i]);
      if (idxs) {
        for (const j of idxs) {
          if (j < blo) continue;
          if (j >= bhi) break;
          const k = (j2len.get(j - 1) || 0) + 1;
          newj2len.set(j, k);
          if (k > bestsize) {
            besti = i - k + 1;
            bestj = j - k + 1;
            bestsize = k;
          }
        }
      }
      j2len = newj2len;
    }
    // Extend by non-junk (here: any) equal elements on each end; this picks up
    // popular elements. The junk-only extension that follows in difflib never
    // fires with an empty junk set.
    while (besti > alo && bestj > blo && a[besti - 1] === b[bestj - 1]) {
      besti -= 1;
      bestj -= 1;
      bestsize += 1;
    }
    while (besti + bestsize < ahi && bestj + bestsize < bhi && a[besti + bestsize] === b[bestj + bestsize]) {
      bestsize += 1;
    }
    return [besti, bestj, bestsize];
  };

  const la = a.length;
  const lb = b.length;
  const queue = [[0, la, 0, lb]];
  const blocks = [];
  while (queue.length) {
    const [alo, ahi, blo, bhi] = queue.pop();
    const x = findLongestMatch(alo, ahi, blo, bhi);
    const [i, j, k] = x;
    if (k) {
      blocks.push(x);
      if (alo < i && blo < j) queue.push([alo, i, blo, j]);
      if (i + k < ahi && j + k < bhi) queue.push([i + k, ahi, j + k, bhi]);
    }
  }
  blocks.sort((p, q) => p[0] - q[0] || p[1] - q[1] || p[2] - q[2]);
  let i1 = 0;
  let j1 = 0;
  let k1 = 0;
  const nonAdjacent = [];
  for (const [i2, j2, k2] of blocks) {
    if (i1 + k1 === i2 && j1 + k1 === j2) k1 += k2;
    else {
      if (k1) nonAdjacent.push([i1, j1, k1]);
      i1 = i2;
      j1 = j2;
      k1 = k2;
    }
  }
  if (k1) nonAdjacent.push([i1, j1, k1]);
  nonAdjacent.push([la, lb, 0]);
  return nonAdjacent;
}

function _speechOpcodes(blocks) {
  let i = 0;
  let j = 0;
  const answer = [];
  for (const [ai, bj, size] of blocks) {
    let tag = '';
    if (i < ai && j < bj) tag = 'replace';
    else if (i < ai) tag = 'delete';
    else if (j < bj) tag = 'insert';
    if (tag) answer.push([tag, i, ai, j, bj]);
    i = ai + size;
    j = bj + size;
    if (size) answer.push(['equal', ai, i, bj, j]);
  }
  return answer;
}

// SequenceMatcher(None, a, b).ratio() over the code points of two strings.
function _speechCharSim(a, b) {
  const ca = Array.from(a);
  const cb = Array.from(b);
  let matches = 0;
  for (const block of _speechMatchingBlocks(ca, cb, true)) matches += block[2];
  const length = ca.length + cb.length;
  return length ? (2.0 * matches) / length : 1.0;
}

// ---- Canonical spoken form ----
// Every rule below is bounded and deterministic. Each canonical token remembers
// the original words it came from, so the report can quote what was written or heard.
// A token is { text, orig, src, unit }: canonical text, original wording, the
// identity of the source word (dedupes the report) and whether it is a unit word
// that follows a quantity ("5 [milligrams]").

function _speechTok(text, orig, src, unit = false) {
  return { text, orig, src, unit };
}

// "one" for a 1 that was written as the word "one" (lets "every one" equal "everyone").
function _speechSpelled(tok) {
  const w = tok.orig.toLowerCase();
  return _speechIsAlpha(w) && _speechNumberWords.has(w) && tok.text !== w ? w : null;
}

function _speechMerge(toks, text) {
  return _speechTok(text, _speechOrigText(toks), {});
}

function _speechOrigText(toks) {
  const parts = [];
  let last;
  for (const t of toks) {
    if (t.src !== last) {
      parts.push(t.orig);
      last = t.src;
    }
  }
  return parts.join(' ');
}

const _speechSmall = new Map(
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'
    .split(' ')
    .map((w, i) => [w, i]),
);
const _speechTens = new Map('twenty thirty forty fifty sixty seventy eighty ninety'.split(' ').map((w, i) => [w, 10 * (i + 2)]));
// "second" is left out on purpose: "one second" is a duration far more often than an ordinal.
const _speechOrdSmall = new Map([
  ['first', 1], ['third', 3], ['fourth', 4], ['fifth', 5], ['sixth', 6], ['seventh', 7],
  ['eighth', 8], ['ninth', 9], ['tenth', 10], ['eleventh', 11], ['twelfth', 12],
  ['thirteenth', 13], ['fourteenth', 14], ['fifteenth', 15], ['sixteenth', 16],
  ['seventeenth', 17], ['eighteenth', 18], ['nineteenth', 19],
]);
const _speechOrdTens = new Map(
  'twentieth thirtieth fortieth fiftieth sixtieth seventieth eightieth ninetieth'.split(' ').map((w, i) => [w, 10 * (i + 2)]),
);
const _speechNumberWords = new Set([
  ..._speechSmall.keys(),
  ..._speechTens.keys(),
  ..._speechOrdSmall.keys(),
  ..._speechOrdTens.keys(),
  'hundred',
  'thousand',
]);
const _speechACounts = new Set(['hundred', 'thousand', 'million', 'billion']); // "a million" is "one million"
const _speechMultipliers = new Map([
  ['hundred', 100n],
  ['thousand', 1000n],
  ['k', 1000n],
  ['million', 1000000n],
  ['billion', 1000000000n],
]);

// Unit spellings to one canonical word. Applied ONLY right after a quantity.
const _speechUnitWords = new Map(
  Object.entries({
    mg: 'milligrams', milligram: 'milligrams', milligrams: 'milligrams',
    mcg: 'micrograms', '\u{b5}g': 'micrograms', ug: 'micrograms',
    microgram: 'micrograms', micrograms: 'micrograms',
    g: 'grams', gram: 'grams', grams: 'grams',
    kg: 'kilograms', kgs: 'kilograms', kilo: 'kilograms', kilos: 'kilograms',
    kilogram: 'kilograms', kilograms: 'kilograms',
    ml: 'milliliters', milliliter: 'milliliters', milliliters: 'milliliters',
    millilitre: 'milliliters', millilitres: 'milliliters',
    l: 'liters', liter: 'liters', liters: 'liters', litre: 'liters', litres: 'liters',
    oz: 'ounces', ounce: 'ounces', ounces: 'ounces',
    lb: 'pounds', lbs: 'pounds', pound: 'pounds', pounds: 'pounds',
    percent: 'percent', pct: 'percent',
    dollar: 'dollars', dollars: 'dollars', usd: 'dollars',
    cent: 'cents', cents: 'cents', euro: 'euros', euros: 'euros',
    hr: 'hours', hrs: 'hours', hour: 'hours', hours: 'hours',
    min: 'minutes', mins: 'minutes', minute: 'minutes', minutes: 'minutes',
    sec: 'seconds', secs: 'seconds', second: 'seconds', seconds: 'seconds',
    cal: 'calories', calorie: 'calories', calories: 'calories',
    day: 'days', days: 'days', week: 'weeks', weeks: 'weeks',
    month: 'months', months: 'months', year: 'years', years: 'years',
    x: 'times', times: 'times',
  }),
);
const _speechCurrency = new Map([
  ['$', 'dollars'],
  ['\u{a3}', 'pounds'],
  ['\u{20ac}', 'euros'],
]);

// Negations an alias's spoken form may not add ("no" and "nor" are allowed as syllables: "no-mad").
const _speechAliasForbidden = new Set(['not', 'never', 'without', 'none', 'nothing', 'nobody']);
const _speechNegations = new Set(['not', 'no', 'never', 'nothing', 'nobody', 'none', 'nowhere', 'neither', 'nor', 'without']);

// Contractions. Ambiguous apostrophe-less spellings (cant, wont, ill, well, were,
// shell, hell, id, shed) are deliberately NOT expanded.
const _speechAposContractions = new Map([
  ["can't", ['can', 'not']],
  ["won't", ['will', 'not']],
  ["shan't", ['shall', 'not']],
  ["i'm", ['i', 'am']],
  ["let's", ['let', 'us']],
]);
const _speechBareContractions = new Map(
  Object.entries({
    dont: ['do', 'not'], doesnt: ['does', 'not'], didnt: ['did', 'not'],
    isnt: ['is', 'not'], arent: ['are', 'not'], wasnt: ['was', 'not'],
    werent: ['were', 'not'], havent: ['have', 'not'], hasnt: ['has', 'not'],
    hadnt: ['had', 'not'], wouldnt: ['would', 'not'], shouldnt: ['should', 'not'],
    couldnt: ['could', 'not'], mustnt: ['must', 'not'], neednt: ['need', 'not'],
    cannot: ['can', 'not'], im: ['i', 'am'], youre: ['you', 'are'],
    theyre: ['they', 'are'], ive: ['i', 'have'], youve: ['you', 'have'],
    weve: ['we', 'have'], theyve: ['they', 'have'], youll: ['you', 'will'],
    theyll: ['they', 'will'], itll: ['it', 'will'], thatll: ['that', 'will'],
    youd: ['you', 'would'], theyd: ['they', 'would'],
    // "its" and "it's" sound the same; Whisper and script writers swap them.
    its: ['it', 'is'], thats: ['that', 'is'], whats: ['what', 'is'],
    theres: ['there', 'is'], heres: ['here', 'is'],
  }),
);
const _speechSIs = new Set([
  'it', 'that', 'there', 'here', 'what', 'who', 'where', 'when', 'why', 'how',
  'he', 'she', 'everyone', 'everything', 'nothing', 'someone', 'something', 'this',
]);
const _speechAposSuffix = [
  ["n't", 'not'],
  ["'re", 'are'],
  ["'ve", 'have'],
  ["'ll", 'will'],
  ["'d", 'would'],
  ["'m", 'am'],
];

const _speechApostropheRe = /[\u{2019}\u{2018}\u{2bc}`]/gu;
const _speechDashesRe = /[\u{2010}-\u{2015}\u{2212}]/gu;
const _speechEdgeChars = '"\'()[]{}<>\u{ab}\u{bb},;:!?\u{2026}.*_~|';
const _speechEdgeCharsNoDots = '"\'()[]{}<>\u{ab}\u{bb},;:!?*_~|';
const _speechDomainRe = new RegExp(`^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+[a-z]{2,}(?:/[^${_speechSpaceClass}]*)?$`, 'u');
const _speechInitialismRe = /^[a-z](?:\.[a-z])+$/u; // a.g  p.m  u.s.a
const _speechOrdinalRe = /^(\p{Nd}+)(?:st|nd|rd|th)$/u;
const _speechCurrencyRe = /^([$\u{a3}\u{20ac}])(\p{Nd}{1,3}(?:,\p{Nd}{3})+|\p{Nd}+)(?:\.(\p{Nd}{1,2}))?(k)?$/u;
const _speechRunRe = /\p{Nd}+(?:[.,]\p{Nd}+)*|[\p{L}\p{Nl}\p{No}]+/gu; // re [^\W\d_] is L, Nl and No
const _speechIntRe = /^\p{Nd}+$/u;
const _speechQuantityRe = /^\p{Nd}+(?:st|nd|rd|th)?$/u;
const _speechGroupedRe = /^\p{Nd}{1,3}(?:,\p{Nd}{3})+(?:\.\p{Nd}+)?$/u;
const _speechNoDotNumberRe = /^[Nn][Oo]\.(\p{Nd}[\p{Nd},]*)$/u;
const _speechNoDotRe = /^[Nn][Oo]\.$/u;
const _speechSchemeRe = /^https?:\/\//u;
const _speechYearHeadRe = /^[1-9]\p{Nd}?$/u;
const _speechYearTailRe = /^[1-9]\p{Nd}$/u;

function _speechOrdinal(n) {
  const v = BigInt(n);
  const r100 = v % 100n;
  if (r100 >= 10n && r100 <= 20n) return `${v}th`;
  const r10 = v % 10n;
  return `${v}${r10 === 1n ? 'st' : r10 === 2n ? 'nd' : r10 === 3n ? 'rd' : 'th'}`;
}

function _speechIsInt(text) {
  return _speechIntRe.test(text);
}

// '1,000' gives ['1000']; '2.5' gives ['2', 'point', '5']; '1,2' gives ['1', '2'].
function _speechDigitRun(run) {
  if (run.includes(',')) {
    if (_speechGroupedRe.test(run)) run = run.replaceAll(',', '');
    else return run.split(',').flatMap((part) => _speechDigitRun(part).filter((x) => x));
  }
  if (run.includes('.')) {
    const out = [];
    run.split('.').forEach((part, k) => {
      if (k) out.push('point');
      out.push(part);
    });
    return out;
  }
  return [run];
}

function _speechRuns(piece) {
  const out = [];
  for (const run of piece.match(_speechRunRe) || []) {
    if (_speechIsDigit(_speechFirst(run))) out.push(..._speechDigitRun(run));
    else out.push(run);
  }
  return out;
}

// Canonical words for one hyphen-free piece of a written word (lowercase).
function _speechPieceWords(p) {
  p = _speechStripSet(p, _speechEdgeChars + '.');
  if (!p) return [];
  const m = _speechCurrencyRe.exec(p);
  if (m) {
    const [, sym, rawWhole, cents, k] = m;
    const whole = rawWhole.replaceAll(',', '');
    const unit = _speechCurrency.get(sym);
    if (k) return [String(_speechInt(whole) * 1000n + (cents ? _speechInt(_speechLjust(cents, 3)) : 0n)), unit];
    if (cents && _speechInt(whole) === 0n && sym === '$') return [String(_speechInt(_speechLjust(cents, 2))), 'cents'];
    const words = [whole, unit];
    if (cents && _speechInt(_speechLjust(cents, 2)) !== 0n) words.push(_speechLjust(cents, 2));
    return words;
  }
  const head = _speechFirst(p);
  if (_speechCurrency.has(head)) {
    const rest = _speechPieceWords(p.slice(head.length));
    // the currency word follows the amount, as spoken: "$29/month" is 29 dollars month
    let j = 0;
    while (j < rest.length && (_speechIsDigit(rest[j]) || ['point', 'k', 'm', 'million', 'billion'].includes(rest[j]))) j += 1;
    return [...rest.slice(0, j), _speechCurrency.get(head), ...rest.slice(j)];
  }
  if (p.endsWith('\u{a2}')) return [..._speechPieceWords(p.slice(0, -1)), 'cents'];
  if (p.endsWith('%')) return [..._speechPieceWords(p.slice(0, -1)), 'percent'];
  if (head === '@') return ['at', ..._speechPieceWords(p.slice(1))];
  if (head === '#') {
    const rest = _speechPieceWords(p.slice(1));
    return [rest.length && _speechIsDigit(_speechFirst(rest[0])) ? 'number' : 'hashtag', ...rest];
  }
  const ord = _speechOrdinalRe.exec(p);
  if (ord) return [_speechOrdinal(_speechInt(ord[1]))];
  if (_speechInitialismRe.test(p)) return [p.replaceAll('.', '')];
  if (p.includes("'")) {
    if (_speechAposContractions.has(p)) return [..._speechAposContractions.get(p)];
    for (const [suffix, word] of _speechAposSuffix) {
      if (p.endsWith(suffix) && p.length > suffix.length) return [..._speechRuns(p.slice(0, p.length - suffix.length)), word];
    }
    if (p.endsWith("'s") && _speechSIs.has(p.slice(0, -2))) return [p.slice(0, -2), 'is'];
    // possessive, plural possessive, o'clock, y'all: the apostrophe is silent
    p = p.replaceAll("'", '');
  }
  if (_speechBareContractions.has(p)) return [..._speechBareContractions.get(p)];
  return _speechRuns(p);
}

// Split written text into canonical word tokens (before the cross-word rules).
function _speechRawTokens(text) {
  if (text === null || text === undefined) text = '';
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  let norm = '';
  for (const ch of text.normalize('NFKD')) if (!_speechIsCombining(ch)) norm += ch;
  norm = norm.replace(_speechApostropheRe, "'").replace(_speechDashesRe, '-');
  norm = norm.replaceAll('&', ' and ').replaceAll('+', ' plus ');
  const out = [];
  const chunks = _speechPySplit(norm);
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    // "No. 1" and "No.1" are "number one", not a negation
    const bare = _speechStripSet(chunk, _speechEdgeChars);
    const no = _speechNoDotNumberRe.exec(bare);
    if (no) {
      const src = {};
      for (const w of ['number', ..._speechPieceWords(no[1])]) out.push(_speechTok(w, bare, src));
      continue;
    }
    if (
      _speechNoDotRe.test(_speechStripSet(chunk, _speechEdgeCharsNoDots)) &&
      ci + 1 < chunks.length &&
      _speechIsDigit(_speechFirst(_speechStripSet(chunks[ci + 1], _speechEdgeChars, false)))
    ) {
      out.push(_speechTok('number', bare, {}));
      continue;
    }
    const orig = _speechStripSet(chunk, _speechEdgeChars + '.');
    if (!orig) continue;
    const low = orig.toLowerCase();
    const lowUrl = low.replace(_speechSchemeRe, '');
    if (_speechDomainRe.test(lowUrl)) {
      const src = {};
      const slash = lowUrl.indexOf('/');
      const host = slash < 0 ? lowUrl : lowUrl.slice(0, slash);
      const path = slash < 0 ? '' : lowUrl.slice(slash + 1);
      let labels = host.split('.');
      if (labels[0] === 'www' && labels.length > 2) labels = labels.slice(1);
      const words = [];
      labels.forEach((label, k) => {
        if (k) words.push('dot');
        words.push(..._speechRuns(label));
      });
      for (const seg of path ? path.split('/') : []) {
        if (seg) {
          words.push('slash');
          words.push(..._speechRuns(seg));
        }
      }
      for (const w of words) out.push(_speechTok(w, orig, src));
      continue;
    }
    if (_speechCurrencyRe.test(low)) {
      const src = {};
      for (const w of _speechPieceWords(low)) out.push(_speechTok(w, orig, src));
      continue;
    }
    for (const piece of orig.split('-')) {
      const src = {};
      for (const w of _speechPieceWords(piece.toLowerCase())) out.push(_speechTok(w, piece, src));
    }
  }
  return out;
}

// [value, nextIndex, isOrdinal] or null, for the parsers below.
function _speechParseBelow100(w, i) {
  const x = w[i];
  const n = w.length;
  if (_speechSmall.has(x)) return [_speechSmall.get(x), i + 1, false];
  if (_speechOrdSmall.has(x)) return [_speechOrdSmall.get(x), i + 1, true];
  if (_speechOrdTens.has(x)) return [_speechOrdTens.get(x), i + 1, true];
  if (_speechTens.has(x)) {
    const v = _speechTens.get(x);
    if (i + 1 < n) {
      const y = w[i + 1];
      if (_speechSmall.has(y) && _speechSmall.get(y) >= 1 && _speechSmall.get(y) <= 9) return [v + _speechSmall.get(y), i + 2, false];
      if (_speechOrdSmall.has(y) && _speechOrdSmall.get(y) <= 9) return [v + _speechOrdSmall.get(y), i + 2, true];
    }
    return [v, i + 1, false];
  }
  return null;
}

function _speechParseBelow1000(w, i) {
  const n = w.length;
  let v;
  let j;
  let o;
  if (w[i] === 'a' && i + 1 < n && _speechACounts.has(w[i + 1])) [v, j, o] = [1, i + 1, false];
  else if (w[i] === 'hundred') [v, j, o] = [1, i, false];
  else {
    const r = _speechParseBelow100(w, i);
    if (r === null) return null;
    [v, j, o] = r;
  }
  if (!o && j < n && w[j] === 'hundred' && v >= 1 && v < 100) {
    v *= 100;
    j += 1;
    const k = j + 1 < n && w[j] === 'and' && _speechParseBelow100(w, j + 1) ? j + 1 : j;
    const r = k < n ? _speechParseBelow100(w, k) : null;
    if (r) [v, j, o] = [v + r[0], r[1], r[2]];
  }
  return [v, j, o];
}

// [value, nextIndex, isOrdinal] for a spelled number starting at w[i], else null.
function _speechParseNumber(w, i) {
  const n = w.length;
  let v;
  let j;
  let o;
  if (w[i] === 'thousand') [v, j, o] = [1, i, false];
  else {
    const r = _speechParseBelow1000(w, i);
    if (r === null) return null;
    [v, j, o] = r;
  }
  if (!o && j < n && w[j] === 'thousand' && v < 1000) {
    v *= 1000;
    j += 1;
    const k = j + 1 < n && w[j] === 'and' && _speechParseBelow1000(w, j + 1) ? j + 1 : j;
    const r = k < n ? _speechParseBelow1000(w, k) : null;
    if (r) [v, j, o] = [v + r[0], r[1], r[2]];
  }
  return [v, j, o];
}

function _speechSpellNumbers(toks) {
  const w = toks.map((t) => t.text);
  const out = [];
  let i = 0;
  while (i < toks.length) {
    const x = w[i];
    let start = _speechNumberWords.has(x) || (x === 'a' && i + 1 < w.length && _speechACounts.has(w[i + 1]));
    // "5 hundred": the multiplier pass makes 500
    if ((x === 'hundred' || x === 'thousand') && out.length && _speechIsInt(out[out.length - 1].text)) start = false;
    const r = start ? _speechParseNumber(w, i) : null;
    if (r) {
      const [v, j, o] = r;
      out.push(_speechMerge(toks.slice(i, j), o ? _speechOrdinal(v) : String(v)));
      i = j;
    } else {
      out.push(toks[i]);
      i += 1;
    }
  }
  return out;
}

function _speechDecimalsAndMultipliers(toks) {
  const out = [];
  const n = toks.length;
  let i = 0;
  while (i < n) {
    const t = toks[i];
    const prev = out.length ? out[out.length - 1].text : '';
    // "nine point nine nine" is 9 point 99 (fraction digits read one by one)
    if (t.text === 'point' && _speechIsInt(prev)) {
      let j = i + 1;
      while (j < n && _speechOneNdRe.test(toks[j].text)) j += 1;
      out.push(t);
      if (j - (i + 1) >= 2) {
        const digits = toks.slice(i + 1, j);
        out.push(_speechMerge(digits, digits.map((x) => x.text).join('')));
        i = j;
      } else i += 1;
      continue;
    }
    const nxt = i + 1 < n ? toks[i + 1].text : '';
    if (_speechIsInt(t.text) && prev !== 'point') {
      // "one and a half" is 1 point 5
      if (_speechSameList(toks.slice(i + 1, i + 4).map((x) => x.text), ['and', 'a', 'half'])) {
        const src = {};
        const orig = _speechOrigText(toks.slice(i, i + 4));
        out.push(_speechTok(t.text, orig, src), _speechTok('point', orig, src), _speechTok('5', orig, src));
        i += 4;
        continue;
      }
      // "5 hundred", "10k", "ten thousand", "1 million" are one integer
      if (_speechMultipliers.has(nxt)) {
        out.push(_speechMerge(toks.slice(i, i + 2), String(_speechInt(t.text) * _speechMultipliers.get(nxt))));
        i += 2;
        continue;
      }
    }
    out.push(t);
    i += 1;
  }
  return out;
}

function _speechUnits(toks) {
  const out = [];
  for (let t of toks) {
    if (_speechUnitWords.has(t.text) && out.length && _speechIsInt(out[out.length - 1].text)) {
      t = _speechTok(_speechUnitWords.get(t.text), t.orig, t.src, true);
    }
    out.push(t);
  }
  // money: "N dollars (and) M cents" is N dollars M (matches "$N.MM")
  const res = [];
  let i = 0;
  while (i < out.length) {
    const t = out[i];
    res.push(t);
    if (t.text === 'dollars' && res.length > 1 && _speechIsInt(res[res.length - 2].text)) {
      const rest = out.slice(i + 1, i + 4).map((x) => x.text);
      if (rest.length >= 3 && rest[0] === 'and' && _speechIsInt(rest[1]) && rest[2] === 'cents') {
        res.push(_speechMerge(out.slice(i + 1, i + 4), rest[1]));
        i += 4;
        continue;
      }
      if (rest.length >= 2 && _speechIsInt(rest[0]) && rest[1] === 'cents') {
        res.push(_speechMerge(out.slice(i + 1, i + 3), rest[0]));
        i += 3;
        continue;
      }
    }
    i += 1;
  }
  return res;
}

function _speechIsLetter(text) {
  return _speechLen(text) === 1 && _speechIsAlpha(text);
}

function _speechContextFixes(toks) {
  const out = [];
  const n = toks.length;
  let i = 0;
  while (i < n) {
    let t = toks[i];
    // "it's been" is it HAS been
    if (
      t.text === 'is' &&
      t.orig.replace(_speechApostropheRe, "'").toLowerCase().endsWith("'s") &&
      i + 1 < n &&
      ['been', 'got', 'gotten'].includes(toks[i + 1].text)
    ) {
      t = _speechTok('has', t.orig, t.src);
    }
    // spelled letters next to "dot": "w w w dot" is www dot, "dot a i" is dot ai
    if (_speechIsLetter(t.text)) {
      let j = i;
      while (j < n && _speechIsLetter(toks[j].text)) j += 1;
      const before = out.length ? out[out.length - 1].text : '';
      const after = j < n ? toks[j].text : '';
      if (j - i >= 2 && (before === 'dot' || after === 'dot')) {
        const letters = toks.slice(i, j);
        out.push(_speechMerge(letters, letters.map((x) => x.text).join('')));
        i = j;
        continue;
      }
    }
    out.push(t);
    i += 1;
  }
  // a leading "www dot" in front of a domain ("www dot example dot com") is optional
  const res = [];
  i = 0;
  while (i < out.length) {
    if (out[i].text === 'www' && i + 3 < out.length && out[i + 1].text === 'dot' && out[i + 3].text === 'dot') {
      i += 2;
      continue;
    }
    res.push(out[i]);
    i += 1;
  }
  return res;
}

function _speechBaseTokens(text) {
  let toks = _speechRawTokens(text);
  toks = _speechSpellNumbers(toks);
  toks = _speechDecimalsAndMultipliers(toks);
  toks = _speechUnits(toks);
  return _speechContextFixes(toks);
}

// Quantities, units (after a quantity) and negations: what an alias may never rewrite.
function _speechProtected(toks) {
  return toks.filter((t) => _speechQuantityRe.test(t.text) || t.unit || _speechNegations.has(t.text)).map((t) => t.text);
}

function _speechAliasPairs(aliases) {
  if (!_speechTruthy(aliases)) return [];
  if (_speechIsDict(aliases) && !(aliases instanceof Set)) {
    const pairs = [];
    for (const [term, forms] of _speechDictEntries(aliases)) {
      const list = typeof forms === 'string' ? [forms] : _speechTruthy(forms) ? _speechToList(forms, 'alias forms') : [];
      for (const form of list) pairs.push([term, form]);
    }
    return pairs;
  }
  const pairs = [];
  for (const item of _speechToList(aliases, 'aliases')) {
    if (_speechIsDict(item) && !(item instanceof Set)) pairs.push([_speechDictGet(item, 'term'), _speechDictGet(item, 'say_as')]);
    else {
      const pair = _speechToList(item, 'an alias');
      if (pair.length !== 2) throw _speechValueError(`each alias must be a (term, spoken form) pair, got ${pair.length} values`);
      pairs.push([pair[0], pair[1]]);
    }
  }
  return pairs;
}

/**
 * Validate confirmed spoken aliases and compile them to [spokenForm, term] token
 * rules (arrays of canonical words), longest spoken form first.
 *
 * `aliases`: {term: say_as | [say_as, ...]}, [[term, say_as], ...] or
 * [{term, say_as}, ...] (the read_pronunciations.py `pronunciations` list).
 * An alias may respell a name, digits and number-like syllables included ("AG1"
 * said "A G one", "Tenzing" said "ten-zing"). It is refused when the written term
 * has a number, unit or negation the spoken form changes ("AG1" = "A G two"), when
 * the spoken form adds a strong negation, or when the spoken form is nothing but
 * numbers, units or negations ("Decagon" = "five"). Throws an Error named
 * ValueError on a bad alias.
 */
export function speechBuildAliases(aliases) {
  const rules = new Map();
  for (const [term, form] of _speechAliasPairs(aliases)) {
    if (typeof term !== 'string' || typeof form !== 'string' || !_speechPyStrip(term) || !_speechPyStrip(form)) {
      throw _speechValueError('each alias needs a written term and a confirmed spoken form');
    }
    const termT = _speechBaseTokens(term);
    const formT = _speechBaseTokens(form);
    const termW = termT.map((t) => t.text);
    const formW = formT.map((t) => t.text);
    if (!termW.length || !formW.length) throw _speechValueError(`alias "${term}" = "${form}" has no words to match`);
    const termP = _speechProtected(termT);
    const formP = _speechProtected(formT);
    if (termP.length && !_speechSameList(termP, formP)) {
      throw _speechValueError(`alias "${term}" = "${form}" would change a number, unit or negation; an alias may only respell a name`);
    }
    if (!termP.length && formW.some((w) => _speechAliasForbidden.has(w))) {
      throw _speechValueError(`alias "${term}" = "${form}": the spoken form adds a negation; an alias may only respell a name`);
    }
    if (!termP.length && formP.length === formW.length) {
      throw _speechValueError(
        `alias "${term}" = "${form}": the spoken form is only numbers, units or negations; an alias may only respell a name`,
      );
    }
    const candidates = [formW];
    // "goose works" is also heard as "gooseworks"
    if (formW.length > 1 && formW.every((w) => _speechIsAlpha(w))) candidates.push([formW.join('')]);
    for (const cand of candidates) {
      if (_speechSameList(cand, termW)) continue;
      const key = JSON.stringify(cand);
      if (rules.has(key) && !_speechSameList(rules.get(key)[1], termW)) {
        throw _speechValueError(`spoken form "${cand.join(' ')}" is confirmed for two different terms`);
      }
      rules.set(key, [cand, termW]);
    }
  }
  return [...rules.values()].sort((a, b) => b[0].length - a[0].length);
}

function _speechApplyAliases(toks, rules) {
  if (!rules.length) return toks;
  const texts = toks.map((t) => t.text);
  const out = [];
  let i = 0;
  while (i < toks.length) {
    let hit = null;
    for (const rule of rules) {
      if (_speechSameList(texts.slice(i, i + rule[0].length), rule[0])) {
        hit = rule;
        break;
      }
    }
    if (hit) {
      const [form, term] = hit;
      const orig = _speechOrigText(toks.slice(i, i + form.length));
      const src = {};
      for (const w of term) out.push(_speechTok(w, orig, src));
      i += form.length;
    } else {
      out.push(toks[i]);
      i += 1;
    }
  }
  return out;
}

/** Canonical spoken-form tokens ({text, orig, src, unit}) for `text`. */
export function speechCanonicalTokens(text, aliases) {
  return _speechApplyAliases(_speechBaseTokens(text), speechBuildAliases(aliases));
}

/** Canonical spoken-form words. 'human-vetted!' gives [human, vetted]; '5mg' gives [5, milligrams]. */
export function speechTokenize(text, aliases) {
  return speechCanonicalTokens(text, aliases).map((t) => t.text);
}

function _speechFusable(parts, whole) {
  if (parts.every((p) => _speechIsAlpha(p))) {
    // Letters spelled one by one ("a g") are NOT a fused word; that needs a confirmed alias.
    // A join may not swallow a negation: "no table" is not "notable" ("no thing" is "nothing").
    const negs = parts.filter((p) => _speechNegations.has(p)).length;
    return !parts.every((p) => _speechLen(p) === 1) && negs === (_speechNegations.has(whole) ? 1 : 0);
  }
  if (parts.length === 2 && parts.every((p) => _speechIsDigit(p))) {
    // years and prices read in pairs: "twenty twenty six" is 2026, "two forty-nine" is 249
    return _speechYearHeadRe.test(parts[0]) && _speechYearTailRe.test(parts[1]);
  }
  return false;
}

// Join 2-3 consecutive tokens whose exact concatenation is a token on the other side.
// A number written as a word joins by its spelling: "every one" is "everyone".
function _speechFuse(toks, other) {
  const out = [];
  let i = 0;
  while (i < toks.length) {
    let fused = false;
    for (const k of [3, 2]) {
      if (i + k > toks.length) continue;
      const win = toks.slice(i, i + k);
      let joined = null;
      const canon = win.map((t) => t.text);
      const spelled = win.map((t) => _speechSpelled(t) || t.text);
      for (const [pass, parts] of [canon, spelled].entries()) {
        const whole = parts.join('');
        if (!other.has(whole) || !_speechFusable(parts, whole)) continue;
        // "two forty-nine" is 249, but written digits never join: "2 20-minute" is not 220
        if (parts.every((p) => _speechIsDigit(p)) && !win.every((t) => _speechIsAlpha(_speechFirst(t.orig)))) continue;
        // a number word joins a word only with parts of 2+ letters: "g one" is not "gone"
        if (pass === 1 && !_speechSameList(parts, canon) && parts.some((p) => _speechLen(p) < 2)) continue;
        joined = whole;
        break;
      }
      if (joined) {
        out.push(_speechMerge(win, joined));
        i += k;
        fused = true;
        break;
      }
    }
    if (!fused) {
      out.push(toks[i]);
      i += 1;
    }
  }
  return out;
}

function _speechBrandPositions(sTexts, brandSeqs) {
  const pos = new Set();
  const mark = (from, to) => {
    for (let x = from; x < to; x++) pos.add(x);
  };
  for (const seq of brandSeqs) {
    const L = seq.length;
    for (let i = 0; i < sTexts.length - L + 1; i++) {
      if (_speechSameList(sTexts.slice(i, i + L), seq)) mark(i, i + L);
    }
    if (L === 1 && _speechIsAlpha(seq[0])) {
      // brand written split in the script: "Braxley Bands" for brand term Braxleybands
      for (const k of [2, 3]) {
        for (let i = 0; i < sTexts.length - k + 1; i++) {
          if (sTexts.slice(i, i + k).join('') === seq[0]) mark(i, i + k);
        }
      }
    }
  }
  return pos;
}

// "$9.99" read "nine ninety-nine" drops the currency word; cents still count.
const _speechCurrencyWords = new Set(['dollars', 'euros', 'pounds']);

// [severity, note, equivalent] for one differing span of the alignment.
function _speechClassify(tag, swT, hwT, brandHit, declared) {
  const sw = swT.map((x) => x.text);
  const hw = hwT.map((x) => x.text);
  const negs = (ws) => ws.filter((w) => _speechNegations.has(w)).length;
  if (negs(sw) !== negs(hw)) {
    return ['high', 'negation changed (not/never/no/without added or lost) \u{2014} the claim flips', false];
  }
  const sq = sw.filter((w) => _speechQuantityRe.test(w));
  const hq = hw.filter((w) => _speechQuantityRe.test(w));
  if (!_speechSameList(sq, hq)) {
    return ['high', 'number differs from the approved script \u{2014} a number is never a benign paraphrase', false];
  }
  // Units count only right after a quantity. Any unit added, dropped or changed is HIGH,
  // except a dropped or added dollars/euros/pounds alone ("$9.99" read "nine ninety-nine").
  const su = swT.filter((x) => x.unit).map((x) => x.text);
  const hu = hwT.filter((x) => x.unit).map((x) => x.text);
  if (!_speechSameList(su, hu) && ((su.length && hu.length) || [...su, ...hu].some((u) => !_speechCurrencyWords.has(u)))) {
    return ['high', 'unit differs from the approved script (added, dropped or changed)', false];
  }
  // Backward compatibility with callers that pass a brand term for the brand AND for each
  // word of its spoken form: a span of ONLY declared, alphabetic brand-term words on BOTH
  // sides that also sound alike (script "ak mee" vs heard "Acme") is the same brand.
  // Different declared names ("Hims" vs "Hers", "Body Pod" vs "Band") still fail.
  if (
    tag === 'replace' &&
    declared.size &&
    [...sw, ...hw].every((w) => declared.has(w) && _speechIsAlpha(w)) &&
    _speechCharSim(sw.join(''), hw.join('')) >= _speechBrandSwapMinCharSim
  ) {
    return ['low', 'declared brand terms on both sides (spoken form vs brand spelling) \u{2014} accepted', true];
  }
  if (brandHit) {
    return [
      'high',
      'brand name not heard as approved (mis-voiced or dropped) \u{2014} re-roll; if the audio is ' +
        'right and only the spelling differs, confirm the spoken form and pass it as an alias',
      false,
    ];
  }
  if (tag === 'replace') {
    if (sw.length === 1 && hw.length === 1) {
      const [a] = sw;
      const [b] = hw;
      const delta = _speechLen(a) - _speechLen(b);
      if ((delta < 0 ? -delta : delta) <= _speechMisvoiceMaxLenDelta && _speechCharSim(a, b) >= _speechMisvoiceMinCharSim) {
        return [
          'high',
          `audio likely mis-voices "${a}" as "${b}" (re-roll a new seed; if it is a ` +
            'brand token, spell it phonetically in the SPOKEN LINE)',
          false,
        ];
      }
    }
    return ['medium', 'spoken word differs from the approved script', false];
  }
  if (tag === 'delete') return ['medium', 'approved words not heard in the render', false];
  // Extra heard words are often benign (filler, a whisper tail); low severity.
  return ['low', 'extra words heard that are not in the script', false];
}

function _speechTermSeqs(terms, rules) {
  const seqs = [];
  for (const term of terms) {
    const seq = _speechApplyAliases(_speechBaseTokens(term), rules).map((x) => x.text);
    if (seq.length) {
      seqs.push(seq);
      if (seq.length > 1 && seq.every((w) => _speechIsAlpha(w))) seqs.push([seq.join('')]);
    }
  }
  return seqs;
}

function _speechIssue(kind, severity, scriptWords, heardWords, note, scriptText, heardText) {
  return {
    kind, // substitution | dropped | inserted | no_script
    severity, // high | medium | low
    script_words: scriptWords, // canonical tokens
    heard_words: heardWords, // canonical tokens
    note,
    script_text: scriptText, // original wording in the approved script
    heard_text: heardText, // original wording in the transcript
  };
}

/**
 * The verdict for an approved script vs the heard transcript. No I/O.
 *
 * options.min_ratio (or minRatio): similarity needed to pass (default 0.90).
 * options.brand_terms (or brandTerms): brand names. They are NEVER removed from the
 *   diff; a brand word not heard as approved is a HIGH failure. Fused/split spellings
 *   are equal, and a span made only of declared brand-term tokens on both sides is accepted.
 * options.aliases: confirmed spoken forms, e.g. {AG1: 'A G one'} or the
 *   read_pronunciations `pronunciations` list. Throws on a bad alias (see speechBuildAliases).
 *
 * Returns the Python Verdict as a plain object: {passed, ratio, issues, silent,
 * music_present, script_tokens, transcript_tokens, brand_terms, aliases}; each issue is
 * {kind, severity, script_words, heard_words, note, script_text, heard_text}.
 */
export function speechReview(script, transcript, options) {
  const opts = options || {};
  const minRatio = opts.min_ratio ?? opts.minRatio ?? SPEECH_DEFAULT_MIN_RATIO;
  const brandOpt = opts.brand_terms ?? opts.brandTerms;
  const terms = _speechTruthy(brandOpt) ? _speechToList(brandOpt, 'brand_terms') : [];
  const aliases = opts.aliases;

  const rules = speechBuildAliases(aliases);
  const pairs = _speechAliasPairs(aliases);
  let sToks = _speechApplyAliases(_speechBaseTokens(script), rules);
  let tToks = _speechApplyAliases(_speechBaseTokens(transcript), rules);
  if (sToks.some((x) => x.text === '2nd')) {
    // the script writes the ordinal "2nd", so a plain "second" is that ordinal
    const second = (toks) => toks.map((x) => (x.text === 'second' ? _speechTok('2nd', x.orig, x.src) : x));
    sToks = second(sToks);
    tToks = second(tToks);
  }
  const sSet = new Set(sToks.map((x) => x.text));
  const tSet = new Set(tToks.map((x) => x.text));
  sToks = _speechFuse(sToks, tSet);
  tToks = _speechFuse(tToks, sSet);
  const s = sToks.map((x) => x.text);
  const t = tToks.map((x) => x.text);

  const brandPos = _speechBrandPositions(s, _speechTermSeqs([...terms, ...pairs.map((p) => p[0])], rules));
  const declared = new Set(_speechTermSeqs(terms, rules).flat());

  const v = {
    passed: false,
    ratio: 0.0,
    issues: [],
    silent: false,
    music_present: null,
    script_tokens: s.length,
    transcript_tokens: t.length,
    brand_terms: [...terms],
    aliases: pairs.map(([a, b]) => ({ term: a, say_as: b })),
  };

  if (!s.length) {
    // No script to compare against: cannot gate on drift, treat as an advisory pass.
    v.passed = true;
    v.ratio = 1.0;
    v.issues.push(_speechIssue('no_script', 'low', [], [], 'no approved script supplied; drift check skipped', '', ''));
    return v;
  }

  const blocks = _speechMatchingBlocks(s, t, false);
  let matched = 0;
  for (const block of blocks) matched += block[2];
  matched *= 2;

  const kinds = { replace: 'substitution', delete: 'dropped', insert: 'inserted' };
  for (const [tag, i1, i2, j1, j2] of _speechOpcodes(blocks)) {
    if (tag === 'equal') continue;
    let brandHit = false;
    for (let x = i1; x < i2; x++) if (brandPos.has(x)) brandHit = true;
    const [severity, note, equivalent] = _speechClassify(tag, sToks.slice(i1, i2), tToks.slice(j1, j2), brandHit, declared);
    if (equivalent) matched += i2 - i1 + (j2 - j1);
    v.issues.push(
      _speechIssue(
        kinds[tag],
        severity,
        s.slice(i1, i2),
        t.slice(j1, j2),
        note,
        _speechOrigText(sToks.slice(i1, i2)),
        _speechOrigText(tToks.slice(j1, j2)),
      ),
    );
  }

  v.ratio = matched / (s.length + t.length);
  const hasHigh = v.issues.some((i) => i.severity === 'high');
  v.passed = v.ratio >= minRatio && !hasHigh;
  return v;
}

// ---- Confirmed pronunciations ----

/** 'AG1=A G one' gives ['AG1', 'A G one']. Throws an Error named ValueError otherwise. */
export function speechParseAlias(arg) {
  const s = arg || '';
  if (typeof s !== 'string') throw new TypeError('an alias argument must be a string');
  const at = s.indexOf('=');
  const term = at < 0 ? s : s.slice(0, at);
  const form = at < 0 ? '' : s.slice(at + 1);
  if (at < 0 || !_speechPyStrip(term) || !_speechPyStrip(form)) {
    throw _speechValueError(`--alias must look like "TERM=SPOKEN FORM", got: ${_speechRepr(arg)}`);
  }
  return [_speechPyStrip(term), _speechPyStrip(form)];
}

/**
 * The [term, say_as] pairs in already-parsed read_pronunciations.py output
 * ({brand_id, basis, pronunciations: [{term, say_as, fact_id}]}) or a
 * create-vo-elevenlabs brand-rules.json; a bare list also works.
 * Throws an Error named ValueError when the shape is wrong.
 */
export function speechPronunciationPairs(json) {
  const rows = _speechIsDict(json) ? _speechDictGet(json, 'pronunciations') : json;
  if (!Array.isArray(rows)) throw _speechValueError("expected a JSON object with a 'pronunciations' list");
  const pairs = [];
  for (const row of rows) {
    const term = _speechIsDict(row) ? _speechDictGet(row, 'term') : undefined;
    const sayAs = _speechIsDict(row) ? _speechDictGet(row, 'say_as') : undefined;
    if (typeof term !== 'string' || typeof sayAs !== 'string') {
      throw _speechValueError("every pronunciation needs a 'term' and a 'say_as'");
    }
    pairs.push([term, sayAs]);
  }
  return pairs;
}
