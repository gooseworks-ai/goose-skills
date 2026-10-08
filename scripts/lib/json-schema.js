'use strict';

/**
 * A small JSON Schema (draft 2020-12) checker for the parts files: part.json
 * manifests (schemas/part-manifest.schema.json) and the parts registry files.
 * No dependencies, so CI needs no install.
 *
 * Keywords: type, const, enum, properties, required, additionalProperties,
 * patternProperties, propertyNames, minProperties, items, contains, minItems,
 * maxItems, uniqueItems, minLength, maxLength, pattern, minimum, maximum,
 * exclusiveMinimum, exclusiveMaximum, multipleOf, allOf, anyOf, oneOf, not,
 * if/then/else and local $ref ("#/..."). title, description, $schema, $id,
 * $comment, $defs and x-* are annotations. Any other keyword throws, so a
 * schema this checker does not understand is never passed silently.
 */

const ANNOTATIONS = new Set(['title', 'description', '$schema', '$id', '$comment', '$defs', 'default', 'examples']);
const KNOWN = new Set([
  'type', 'const', 'enum', 'properties', 'required', 'additionalProperties', 'patternProperties',
  'propertyNames', 'minProperties', 'maxProperties', 'items', 'contains', 'minItems', 'maxItems',
  'uniqueItems', 'minLength', 'maxLength', 'pattern', 'minimum', 'maximum', 'exclusiveMinimum',
  'exclusiveMaximum', 'multipleOf', 'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else', '$ref',
]);

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function typeMatches(value, type) {
  const actual = typeOf(value);
  return actual === type || (type === 'number' && actual === 'integer');
}

function equal(a, b) {
  if (a === b) return true;
  if (typeOf(a) !== typeOf(b) || typeof a !== 'object' || a === null) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
  const ka = Object.keys(a).sort();
  const kb = Object.keys(b).sort();
  return ka.length === kb.length && ka.every((k, i) => k === kb[i] && equal(a[k], b[k]));
}

function resolveRef(root, ref) {
  if (!ref.startsWith('#')) throw new Error(`only local $ref is supported (${ref})`);
  let node = root;
  for (const raw of ref.slice(1).split('/').filter(Boolean)) {
    const part = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (!node || typeof node !== 'object' || !(part in node)) throw new Error(`$ref ${ref} does not resolve`);
    node = node[part];
  }
  return node;
}

const patternCache = new Map();
function regex(pattern) {
  if (!patternCache.has(pattern)) patternCache.set(pattern, new RegExp(pattern, 'u'));
  return patternCache.get(pattern);
}

/** Errors as "<json path>: <what>", empty when the value fits the schema. */
function validate(schema, value, root = schema, at = '$') {
  if (schema === true) return [];
  if (schema === false) return [`${at}: is not allowed`];
  const errors = [];
  for (const key of Object.keys(schema)) {
    if (!KNOWN.has(key) && !ANNOTATIONS.has(key) && !key.startsWith('x-')) {
      throw new Error(`schema keyword "${key}" is not supported (at ${at})`);
    }
  }
  const t = typeOf(value);

  if (schema.$ref !== undefined) errors.push(...validate(resolveRef(root, schema.$ref), value, root, at));
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(value, type))) errors.push(`${at}: must be ${types.join(' or ')}`);
  }
  if (schema.const !== undefined && !equal(value, schema.const)) errors.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.enum !== undefined && !schema.enum.some((v) => equal(value, v))) {
    errors.push(`${at}: must be one of ${schema.enum.map((v) => JSON.stringify(v)).join(', ')}`);
  }

  if (t === 'string') {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) errors.push(`${at}: shorter than ${schema.minLength}`);
    if (schema.maxLength !== undefined && length > schema.maxLength) errors.push(`${at}: longer than ${schema.maxLength}`);
    if (schema.pattern !== undefined && !regex(schema.pattern).test(value)) errors.push(`${at}: does not match ${schema.pattern}`);
  }

  if (t === 'number' || t === 'integer') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: below ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: above ${schema.maximum}`);
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) errors.push(`${at}: must be above ${schema.exclusiveMinimum}`);
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) errors.push(`${at}: must be below ${schema.exclusiveMaximum}`);
    if (schema.multipleOf !== undefined && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-9) {
      errors.push(`${at}: not a multiple of ${schema.multipleOf}`);
    }
  }

  if (t === 'array') {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.uniqueItems && value.some((v, i) => value.findIndex((w) => equal(v, w)) !== i)) errors.push(`${at}: items must be unique`);
    if (schema.items !== undefined) value.forEach((v, i) => errors.push(...validate(schema.items, v, root, `${at}[${i}]`)));
    if (schema.contains !== undefined && !value.some((v) => validate(schema.contains, v, root, at).length === 0)) {
      errors.push(`${at}: has no item that fits "contains"`);
    }
  }

  if (t === 'object') {
    const keys = Object.keys(value);
    for (const key of schema.required || []) if (!(key in value)) errors.push(`${at}: ${key} is required`);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) errors.push(`${at}: fewer than ${schema.minProperties} fields`);
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) errors.push(`${at}: more than ${schema.maxProperties} fields`);
    const props = schema.properties || {};
    const patterns = Object.entries(schema.patternProperties || {});
    for (const key of keys) {
      const child = `${at}.${key}`;
      let matched = false;
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        matched = true;
        errors.push(...validate(props[key], value[key], root, child));
      }
      for (const [pattern, sub] of patterns) {
        if (regex(pattern).test(key)) {
          matched = true;
          errors.push(...validate(sub, value[key], root, child));
        }
      }
      if (!matched && schema.additionalProperties !== undefined) {
        if (schema.additionalProperties === false) errors.push(`${child}: is not an allowed field`);
        else errors.push(...validate(schema.additionalProperties, value[key], root, child));
      }
      if (schema.propertyNames !== undefined) {
        errors.push(...validate(schema.propertyNames, key, root, `${at} key "${key}"`));
      }
    }
  }

  for (const sub of schema.allOf || []) errors.push(...validate(sub, value, root, at));
  if (schema.anyOf && !schema.anyOf.some((sub) => validate(sub, value, root, at).length === 0)) {
    errors.push(`${at}: fits none of anyOf`);
  }
  if (schema.oneOf) {
    const fits = schema.oneOf.filter((sub) => validate(sub, value, root, at).length === 0).length;
    if (fits !== 1) errors.push(`${at}: must fit exactly one of oneOf (fits ${fits})`);
  }
  if (schema.not !== undefined && validate(schema.not, value, root, at).length === 0) errors.push(`${at}: fits "not"`);
  if (schema.if !== undefined) {
    const branch = validate(schema.if, value, root, at).length === 0 ? schema.then : schema.else;
    if (branch !== undefined) errors.push(...validate(branch, value, root, at));
  }
  return errors;
}

// ── checking a schema itself (draft 2020-12 metaschema, the keywords part
// input and output schemas can use) ─────────────────────────────────────

const TYPES = new Set(['null', 'boolean', 'object', 'array', 'number', 'integer', 'string']);
const SCHEMA_KEYS = new Set(['additionalProperties', 'items', 'contains', 'not', 'if', 'then', 'else', 'propertyNames', 'unevaluatedItems', 'unevaluatedProperties']);
const SCHEMA_MAPS = new Set(['properties', 'patternProperties', '$defs', 'dependentSchemas']);
const SCHEMA_LISTS = new Set(['allOf', 'anyOf', 'oneOf', 'prefixItems']);
const COUNTS = new Set(['minLength', 'maxLength', 'minItems', 'maxItems', 'minProperties', 'maxProperties', 'minContains', 'maxContains']);
const NUMBERS = new Set(['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum']);
const STRINGS = new Set(['title', 'description', '$comment', '$id', '$schema', '$anchor', '$ref', '$dynamicRef', '$dynamicAnchor', 'format', 'contentEncoding', 'contentMediaType']);
const BOOLEANS = new Set(['uniqueItems', 'readOnly', 'writeOnly', 'deprecated']);
const ANY = new Set(['const', 'default', 'examples', 'enum', 'required', 'dependentRequired', 'multipleOf', 'pattern', 'contentSchema', '$vocabulary']);

function isCount(v) {
  return Number.isInteger(v) && v >= 0;
}

function validRegex(source) {
  try {
    new RegExp(source, 'u');
    return true;
  } catch {
    return false;
  }
}

/**
 * Problems with a schema as a declaration, as "<path>: <what>": a type that
 * is not a JSON type, an enum that is not a list, a pattern that does not
 * compile, a sub-schema that is neither an object nor a boolean, a keyword
 * nobody defines. x-* keywords are extensions and are left alone.
 */
function schemaProblems(schema, at = '$') {
  const problems = [];
  if (typeof schema === 'boolean') return problems;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return [`${at}: a schema must be an object or a boolean`];
  for (const [key, v] of Object.entries(schema)) {
    const here = `${at}.${key}`;
    if (key.startsWith('x-')) continue;
    if (key === 'type') {
      const list = Array.isArray(v) ? v : [v];
      if (!list.length || list.some((t) => !TYPES.has(t)) || new Set(list).size !== list.length) {
        problems.push(`${here}: must be a JSON type or a list of distinct JSON types`);
      }
    } else if (SCHEMA_KEYS.has(key) || key === 'contentSchema') {
      problems.push(...schemaProblems(v, here));
    } else if (SCHEMA_MAPS.has(key)) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) problems.push(`${here}: must be an object of schemas`);
      else {
        for (const [name, sub] of Object.entries(v)) {
          if (key === 'patternProperties' && !validRegex(name)) problems.push(`${here}: "${name}" is not a valid pattern`);
          problems.push(...schemaProblems(sub, `${here}.${name}`));
        }
      }
    } else if (SCHEMA_LISTS.has(key)) {
      if (!Array.isArray(v) || !v.length) problems.push(`${here}: must be a non-empty list of schemas`);
      else v.forEach((sub, i) => problems.push(...schemaProblems(sub, `${here}[${i}]`)));
    } else if (COUNTS.has(key)) {
      if (!isCount(v)) problems.push(`${here}: must be a whole number, 0 or more`);
    } else if (NUMBERS.has(key)) {
      if (typeof v !== 'number') problems.push(`${here}: must be a number`);
    } else if (STRINGS.has(key)) {
      if (typeof v !== 'string') problems.push(`${here}: must be a string`);
    } else if (BOOLEANS.has(key)) {
      if (typeof v !== 'boolean') problems.push(`${here}: must be true or false`);
    } else if (ANY.has(key)) {
      if (key === 'enum' && !Array.isArray(v)) problems.push(`${here}: must be a list`);
      if (key === 'examples' && !Array.isArray(v)) problems.push(`${here}: must be a list`);
      if (key === 'required' && (!Array.isArray(v) || v.some((n) => typeof n !== 'string') || new Set(v).size !== v.length)) {
        problems.push(`${here}: must be a list of distinct field names`);
      }
      if (key === 'dependentRequired' && (!v || typeof v !== 'object' || Array.isArray(v) || Object.values(v).some((l) => !Array.isArray(l) || l.some((n) => typeof n !== 'string')))) {
        problems.push(`${here}: must map field names to lists of field names`);
      }
      if (key === 'multipleOf' && !(typeof v === 'number' && v > 0)) problems.push(`${here}: must be a number above 0`);
      if (key === 'pattern' && (typeof v !== 'string' || !validRegex(v))) problems.push(`${here}: must be a valid pattern`);
      if (key === '$vocabulary' && (!v || typeof v !== 'object')) problems.push(`${here}: must be an object`);
    } else {
      problems.push(`${here}: "${key}" is not a JSON Schema keyword (extensions start with x-)`);
    }
  }
  return problems;
}

module.exports = { validate, schemaProblems };
