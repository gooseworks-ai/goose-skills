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
    coverage: {
      type: 'object', additionalProperties: false,
      required: ['video_watched', 'audio_listened', 'start_s', 'end_s'],
      properties: {
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
  required: ['provider', 'model', 'shot_type', 'configuration_sha256', 'status', 'accepted_source_sha256', 'reviewer', 'audio_listened', 'video_watched'],
  properties: {
    provider: { type: 'string', minLength: 1 }, model: { type: 'string', minLength: 1 },
    shot_type: { type: 'string', minLength: 1 }, status: { enum: ['qualified', 'experimental', 'suspended'] },
    accepted_source_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    configuration_sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' },
    reviewer: { type: 'string', minLength: 1 }, audio_listened: { type: 'boolean' }, video_watched: { type: 'boolean' },
    conditions: { type: 'string', minLength: 1 },
  },
};

export function kitMediaReviewProblem(review, source, scriptSha256, seconds, { speech = true, productActionRequired = false } = {}) {
  if (!review || review.status !== 'pass') return 'the source has no passing content review';
  if (review.source_sha256 !== source.sha256) return 'the content review names different source bytes';
  if (review.script_sha256 !== scriptSha256) return 'the content review names a different approved script';
  if (!String(review.reviewer || '').trim()) return 'the actual reviewer is missing';
  const coverage = review.coverage || {};
  if (coverage.video_watched !== true || (speech && coverage.audio_listened !== true)) return 'full playback with actual listening is required; frames or transcription alone do not qualify a speaking source';
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
  if (!/^[a-f0-9]{64}$/.test(q.accepted_source_sha256 || '') || !String(q.reviewer || '').trim() || q.video_watched !== true || (speech_mode !== 'none' && q.audio_listened !== true)) return 'qualification needs the actual accepted source checksum and audiovisual reviewer coverage';
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
