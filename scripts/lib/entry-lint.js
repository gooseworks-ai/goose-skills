'use strict';

/**
 * The skill lint (GV-43, with the rulebook's lint rules). Each problem starts
 * with the rule it breaks:
 *
 *   action.real_names_only  a snake_case name that is not one of the contract's actions
 *   money.credits_only      a currency sign, or a currency word not under a bound negation
 *   setup.no_install        an install command, or an install request not under a bound negation
 *   GV-43 recipe            a video recipe slug
 *   GV-43 render atom       a render-<format> atom
 *   author.size_limits      longer than the skill's limit
 *
 * Each check reads the text as written, as rendered (HTML entities and
 * Markdown escapes decoded) and NFKC-folded, so &#36;8 or a fullwidth npm is
 * caught too.
 *
 * Ported from the gooseworks CLI (tests/skills/skill-lint.ts) when the entry
 * skills moved here. Fixtures: test/fixtures/entry-lint/. Action names: ./action-names.json,
 * the list atom-lint.js reads too.
 */
const { readFileSync } = require('fs');
const { join } = require('path');

const fixture = (name) => JSON.parse(readFileSync(join(__dirname, '..', '..', 'test', 'fixtures', 'entry-lint', name), 'utf8'));

const ACTION_NAMES = require('./action-names.json').actions;
const RECIPE_SLUGS = fixture('video-recipe-slugs.json').recipes;

/** Documented request/answer fields, entry metadata and reference-viewing enum values. */
const ANSWER_FIELDS = [
  'next_step', 'display_hint', 'plan_note',
  'brand_id', 'idempotency_key', 'reference_url', 'plan_revision', 'custom_review',
  'brand_context', 'production_manifest', 'asset_id', 'analysis_revision', 'user_quote',
  'reference_observation', 'source_url', 'duration_s', 'evidence_mode', 'frames_and_audio',
  'observed_through_s', 'expected_revision', 'brand_context_digest', 'preview_estimate',
  'render_estimate', 'approval_surface', 'script_approved', 'ingredients_approved',
  'harness_binding', 'requires_skills',
  // make-custom-video since gooseworks-app #2007: reference upload/attach and the server-added spend.
  'video_project', 'media_confirm', 'media_analyze', 'current_revision', 'committed_credits',
  // make-custom-video in the custom one-run work (gooseworks-app #2019, #2022-#2027): template demo
  // reference, free price check, redo allowance, clip checks, progress notes and the rebuild recipe.
  'media_url', 'estimate_only', 'reroll_allowance', 'progress_note', 'clip_check', 'clip_checks',
  'suggest_kill', 'reroll_scene', 'output_url', 'pack_recipe', 'check_recipe', 'production_source',
  // make-custom-video 3.6.1 (gooseworks-app #2086): the read-only price check, a catalog tool outside the action contract.
  'data_price_provider', 'price_unknown',
  // Custom chat approval fields backported from the current server entry.
  'approval_quote', 'review_token', 'total_credits',
  // Standard and Best script prices (gooseworks-app #2084).
  'shot_list', 'upgrade_allowance', 'tier_quotes', 'quality_tier', 'seedance_addons',
  // Custom quality release: source identity, creative intent and final review fields.
  'media_id', 'media_revision', 'audio_perception', 'motion_perception',
  'creative_contract', 'speech_mode', 'soundtrack_modes', 'required_features',
  'reference_map', 'product_grounding', 'voice_plan', 'assembly_timeline',
  'quality_report', 'content_review', 'creative_contract_revision',
  // goose-video 4.5.0: a found reference ad is picked by its candidate id (video_references pick).
  'candidate_id',
  // make-custom-video 3.8.0 (gooseworks-app #2076, carrying the 3.7.x server text): the reviewed changes from the
  // reference, the character step and the measured final check.
  'changes_from_reference', 'make_character', 'final_measure',
  // make-custom-video 3.8.2 (server text): the reference_shots.py study saved as frame_study.
  'reference_shots', 'frame_study',
];

/** author.size_limits: an entry skill is at most 5,000 characters. */
const ENTRY_SKILL_MAX_CHARS = 5000;
/**
 * The `gooseworks` router also carries the terminal data commands the
 * research and lead skills rely on, so it has its own, larger budget. Taking
 * it to 3,000 means moving those commands into the skills that use them.
 * Raised to 7,500 for the Marketing Brain steps (read brain_map first, save brand facts with
 * brain_save), the description that loads the router when the user talks about their brand, and
 * the rulebook 1.5.3 rules block.
 */
const ROUTER_MAX_CHARS = 7500;
/**
 * make-custom-video carries the whole custom contract (reference viewing, two owner
 * reviews, local execution and the stored rebuild recipe), and the server text
 * passed 5,000 on dev on 2026-10-12. Its own budget; other entry skills keep 5,000.
 * Raised to 6,200 for the Standard/Best script prices (gooseworks-app #2084).
 */
const CUSTOM_VIDEO_MAX_CHARS = 6200;

const SNAKE_NAME = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/gi;
const SERVER_PREFIX = /\bmcp__[a-z0-9_-]+?__/gi;
const CURRENCY_SIGN = /\p{Sc}/u;
const CURRENCY_WORDS = new Set(['usd', 'dollar', 'dollars', 'cent', 'cents', 'eur', 'euro', 'euros', 'gbp']);
// An install request: "install", "installs", "installing", "installation"; not "installed".
const INSTALL_WORDS = new Set(['install', 'installs', 'installing', 'installation']);
const INSTALL_COMMANDS = [
  /\b(?:npm|pnpm|yarn|bun)\s+(?:i|install|add|ci)\b/i,
  /\bnpx\b/i,
  /\b(?:brew|apt|apt-get|pip3?|gem|cargo)\s+install\b/i,
  /\b(?:curl|wget)\b[^\n]*\|\s*(?:ba|z)?sh\b/i,
  /\bgooseworks\s+(?:install|update)\b/i,
];
// Each answer hands over its own exact kit command and version; a skill copy would go stale under a video.
const KIT_COMMAND = /\bgooseworks@[0-9A-Za-z.<>-]+|\bvideo\s+make\b/i;
const KEBAB = /(?<![a-z0-9-])[a-z0-9]+(?:-[a-z0-9]+)+(?![a-z0-9-])/g;
const RENDER_ATOM = /(?<![a-z0-9-])render-[a-z0-9]+(?:-[a-z0-9]+)*/g;

const NEGATIONS = new Set(['never', 'not', 'no', 'cannot', 'without', 'nor']);
const isNegation = (word) => NEGATIONS.has(word) || word.endsWith("n't");
/**
 * Words that may stand between a negation and the phrase it governs, as in
 * "never ask for a CLI, a slash command, another app or an install" or
 * "never ask the customer to install anything". Any other word ends the
 * negation, so "No discount: pay 8 dollars" is not a negated price.
 */
const BRIDGE = new Set([
  'ask', 'asks', 'asking', 'tell', 'say', 'mention', 'use', 'need', 'needs', 'require', 'requires',
  'for', 'to', 'a', 'an', 'the', 'any', 'anything', 'ever', 'or', 'and', 'them', 'you', 'your',
  'customer', 'customers', 'user', 'users', 'another', 'other', 'app', 'apps', 'cli', 'slash', 'command', 'commands',
  'must', 'should', 'can', 'will', 'do', 'does', 'be',
]);
const MAX_BRIDGE = 12;

/** Whether the word at `index` sits under a negation bound to it. */
function negated(words, index) {
  for (let i = index - 1; i >= 0 && index - i <= MAX_BRIDGE + 1; i--) {
    if (isNegation(words[i])) return true;
    if (!BRIDGE.has(words[i])) return false;
  }
  return false;
}

const HTML = fixture('html-named-entities.json');
const LEGACY = new Set(HTML.legacy);

/** One named reference: `&name;`, or a legacy name a browser decodes without the semicolon. */
function namedEntity(match, name, semicolon) {
  if (semicolon && Object.prototype.hasOwnProperty.call(HTML.entities, name)) return HTML.entities[name];
  // Without a semicolon a browser takes the longest legacy name and keeps the rest.
  for (let end = name.length; end > 0; end--) {
    const head = name.slice(0, end);
    if (LEGACY.has(head)) return HTML.entities[head] + name.slice(end) + semicolon;
  }
  return match;
}

const codePoint = (value) => (value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : '�');

/** What a reader sees: every HTML character reference and Markdown escape decoded. */
function rendered(text) {
  return text
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex) => codePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_m, dec) => codePoint(Number(dec)))
    .replace(/&([A-Za-z][A-Za-z0-9]*)(;?)/g, namedEntity)
    .replace(/\\([!-/:-@[-`{-~])/g, '$1');
}

/**
 * The text as written, as rendered, and rendered then NFKC-folded with every
 * default-ignorable character (zero-width spaces, joiners, direction marks,
 * soft hyphens, variation selectors, …) removed.
 */
function views(text) {
  const shown = rendered(text);
  const folded = shown.normalize('NFKC').replace(/\p{Default_Ignorable_Code_Point}/gu, '');
  return [...new Set([text, shown, folded])];
}

function lintView(text, actions, recipes) {
  const problems = [];
  for (const [name] of text.replace(SERVER_PREFIX, '').matchAll(SNAKE_NAME)) {
    if (!actions.has(name.toLowerCase())) problems.push(`action.real_names_only: ${name} is not an action`);
  }

  const sign = CURRENCY_SIGN.exec(text);
  if (sign) problems.push(`money.credits_only: a currency sign (${sign[0]})`);
  const kit = KIT_COMMAND.exec(text);
  if (kit) problems.push(`setup.no_install: spells out the kit command (${kit[0]})`);
  for (const command of INSTALL_COMMANDS) {
    const found = command.exec(text);
    if (found) problems.push(`setup.no_install: an install command (${found[0]})`);
  }
  for (const sentence of text.split(/[.!?\n]/)) {
    const words = sentence.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
    words.forEach((word, index) => {
      if (CURRENCY_WORDS.has(word) && !negated(words, index)) problems.push(`money.credits_only: a currency word (${word})`);
      if (INSTALL_WORDS.has(word) && !negated(words, index)) problems.push(`setup.no_install: asks for an install (${sentence.trim()})`);
    });
  }

  for (const [slug] of text.toLowerCase().matchAll(KEBAB)) {
    if (recipes.has(slug)) problems.push(`GV-43 recipe: names the video recipe ${slug}`);
  }
  for (const [atom] of text.toLowerCase().matchAll(RENDER_ATOM)) problems.push(`GV-43 render atom: names ${atom}`);
  return problems;
}

function lintSkill(text, options = {}) {
  const actions = new Set([...(options.actions ?? ACTION_NAMES), ...ANSWER_FIELDS]);
  const recipes = new Set(options.recipes ?? RECIPE_SLUGS);
  const maxChars = options.maxChars ?? ENTRY_SKILL_MAX_CHARS;
  const problems = new Set(views(text).flatMap((view) => lintView(view, actions, recipes)));
  if (text.length > maxChars) problems.add(`author.size_limits: ${text.length} characters, over ${maxChars}`);
  return [...problems];
}

module.exports = {
  ACTION_NAMES,
  ANSWER_FIELDS,
  CUSTOM_VIDEO_MAX_CHARS,
  ENTRY_SKILL_MAX_CHARS,
  RECIPE_SLUGS,
  ROUTER_MAX_CHARS,
  lintSkill,
};
