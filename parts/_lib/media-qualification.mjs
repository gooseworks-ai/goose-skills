import { createHash } from 'node:crypto';

// Content eligibility is separate from transport success. These helpers consume
// reviews of actual source bytes; they never invent a reviewer or a passing check.
export const kitMediaSpeechModes = ['native_dialogue', 'audio_driven_lipsync', 'narration', 'singing', 'mixed', 'none'];
export const kitMediaSoundtrackModes = ['source_ambience', 'music', 'sfx', 'intentional_silence'];
export const kitMediaSourceReviewSchema = {
  type: 'object', additionalProperties: false,
  required: ['source_sha256', 'script_sha256', 'status', 'reviewer', 'coverage', 'checks'],
  properties: {
    source_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    script_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    status: { enum: ['pass', 'fail', 'incomplete'] },
    reviewer: { type: 'string', minLength: 1, maxLength: 200 },
    // How the whole source was covered: watched/listened when a person or a capable model really
    // did, or measured (full-resolution frames plus word timing against the line). Measured is
    // enough; the older video_watched/audio_listened booleans still read as watched/listened.
    coverage: {
      type: 'object', additionalProperties: false,
      required: ['start_s', 'end_s'],
      properties: {
        motion: { enum: ['watched', 'measured'] }, audio: { enum: ['listened', 'measured'] },
        video_watched: { type: 'boolean' }, audio_listened: { type: 'boolean' },
        start_s: { type: 'number', minimum: 0 }, end_s: { type: 'number', exclusiveMinimum: 0 },
      },
    },
    checks: {
      type: 'object', additionalProperties: false,
      required: ['script', 'voice', 'lipsync', 'identity', 'framing', 'performance', 'product_action'],
      properties: Object.fromEntries(['script', 'voice', 'lipsync', 'identity', 'framing', 'performance', 'product_action'].map((key) => [key, { enum: ['pass', 'fail', 'incomplete', 'not_applicable'] }])),
    },
    evidence: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
  },
};

export const kitMediaQualificationSchema = {
  type: 'object', additionalProperties: false,
  required: ['provider', 'model', 'shot_type', 'configuration_sha256', 'status', 'accepted_source_sha256', 'reviewer'],
  properties: {
    provider: { type: 'string', minLength: 1 }, model: { type: 'string', minLength: 1 },
    shot_type: { type: 'string', minLength: 1 }, status: { enum: ['qualified', 'experimental', 'suspended'] },
    accepted_source_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    configuration_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    reviewer: { type: 'string', minLength: 1 }, audio_listened: { type: 'boolean' }, video_watched: { type: 'boolean' },
    motion: { enum: ['watched', 'measured'] }, audio: { enum: ['listened', 'measured'] },
    conditions: { type: 'string', minLength: 1 },
  },
};

// The review's coverage as { motion, audio }: watched/listened, measured, or null when it doesn't say.
export function kitMediaCoverage(coverage) {
  const c = coverage || {};
  return {
    motion: ['watched', 'measured'].includes(c.motion) ? c.motion : c.video_watched === true ? 'watched' : null,
    audio: ['listened', 'measured'].includes(c.audio) ? c.audio : c.audio_listened === true ? 'listened' : null,
  };
}

export function kitMediaReviewProblem(review, source, scriptSha256, seconds, { speech = true, productActionRequired = false } = {}) {
  if (!review || review.status !== 'pass') return 'the source has no passing content review';
  if (review.source_sha256 !== source.sha256) return 'the content review names different source bytes';
  if (review.script_sha256 !== scriptSha256) return 'the content review names a different approved script';
  if (!String(review.reviewer || '').trim()) return 'the actual reviewer is missing';
  const coverage = review.coverage || {};
  const covered = kitMediaCoverage(coverage);
  if (!covered.motion || (speech && !covered.audio)) return 'the content review must say how the whole source was covered: coverage.motion watched or measured, and for speech coverage.audio listened or measured';
  if ((covered.motion === 'measured' || (speech && covered.audio === 'measured')) && !(review.evidence || []).some((e) => String(e).trim())) return 'a measured review lists its evidence: the frames inspected and the word timing checked against the line';
  if (!(coverage.start_s <= 0 && coverage.end_s >= seconds - 0.02)) return 'the content review does not cover the complete source';
  for (const key of ['identity', 'framing', 'performance', ...(speech ? ['script', 'voice', 'lipsync'] : [])]) {
    if (review.checks?.[key] !== 'pass') return `the source content check ${key} has not passed`;
  }
  if (!['pass', 'not_applicable'].includes(review.checks?.product_action)) return 'the product/action check is unresolved';
  if (productActionRequired && review.checks?.product_action !== 'pass') return 'a required product action cannot be marked not_applicable';
  return null;
}

export function kitMediaConfigurationSha256(configuration) {
  const canonical = (value) => {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(canonical);
    if (value.kind === 'file') return { media: value.media, sha256: value.sha256 };
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, canonical(value[key])]));
  };
  return createHash('sha256').update(JSON.stringify(canonical(configuration))).digest('hex');
}

// Restrictions concern the audited use, not a provider-wide ban. A newer model
// is a candidate until its actual endpoint, shot and reviewed conditions qualify.
export function kitMediaRouteProblem({ provider, model, shot_type, configuration_sha256, accepted_source_sha256, speech_mode, required_features = [], qualification, model_support, trial = false }) {
  if (!kitMediaSpeechModes.includes(speech_mode)) return 'choose an explicit speech_mode';
  const exactAction = ['precise_product_action', 'dispensing', 'application', 'stateful_demo'].includes(shot_type);
  if (model === 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video' && exactAction) return 'Kling 2.5 Turbo is excluded from exact product-action routes; select a qualified action route';
  const omni = model === 'gemini-omni-1.1-flash' || model === 'google/gemini-omni-flash';
  const seedanceCandidate = /seedance-2\.5/.test(model);
  if ((omni || seedanceCandidate) && (!model_support || model_support.status !== 'verified' || model_support.provider !== provider || model_support.model !== model || !model_support.schema_sha256 || !model_support.evidence || !model_support.quote_id)) return 'a candidate route needs the actual managed endpoint schema, evidence and quote before even a qualification trial';
  if (omni && required_features.some((feature) => ['audio_reference', 'exact_audio_reuse', 'voice_editing'].includes(feature))) return 'this Omni API does not support uploaded audio references, exact audio reuse or voice editing';
  if (seedanceCandidate && required_features.includes('exact_audio_reuse')) return 'Seedance audio-reference guidance is not a documented exact-audio-reuse contract';
  if (trial) return null;
  const q = qualification;
  if (!q || q.status !== 'qualified' || q.provider !== provider || q.model !== model || q.shot_type !== shot_type) return 'the exact provider, endpoint and shot type need a qualified source example; API success alone is insufficient';
  if (!configuration_sha256 || q.configuration_sha256 !== configuration_sha256) return 'qualification names different capture, references, delivery or model settings';
  if (accepted_source_sha256 && q.accepted_source_sha256 !== accepted_source_sha256) return 'qualification names an unrelated first take';
  const covered = kitMediaCoverage(q);
  if (!/^[a-f0-9]{64}$/.test(q.accepted_source_sha256 || '') || !String(q.reviewer || '').trim() || !covered.motion || (speech_mode !== 'none' && !covered.audio)) return 'qualification needs the actual accepted source checksum and how the reviewer covered it (motion watched or measured, audio listened or measured)';
  return null;
}

// Extend existing cast / voice / music / SFX stores with these fields. This is
// an asset contract, not a second catalog and not permission to clone a person.
export function kitMediaLibraryAssetProblem(asset, kind) {
  if (!['character', 'voice', 'music', 'sfx'].includes(kind)) return 'unknown library asset kind';
  if (!asset || !String(asset.id || asset.key || '').trim()) return 'reuse the existing library asset ID';
  if (asset.status !== 'approved' || !String(asset.provenance || '').trim() || !String(asset.rights || '').trim()) return 'the library choice needs approval, provenance and usage rights';
  if (kind === 'voice' && (!asset.voice_id || !asset.model || !asset.audition_sha256)) return 'a voice needs its stable voice_id, model and approved audition checksum';
  if (kind === 'character' && (!asset.image?.sha256 || !asset.capture || !asset.framing || !(asset.image.width > 0 && asset.image.height > 0))) return 'a character needs its approved anchor checksum, capture/framing brief and actual source geometry';
  if ((kind === 'music' || kind === 'sfx') && !asset.audio?.sha256) return 'a soundtrack asset needs its actual audio checksum';
  return null;
}
