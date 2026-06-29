'use strict';

/**
 * Shared helpers for the local skill-eval harness.
 *
 * - parseTrace:    Claude stream-json events -> { toolCalls, textOutput, finalResult, ... }
 * - buildManifest: trace + run workspace -> normalized artifact envelope (manifest.json)
 * - runAssertions: eval.json case.assertions -> deterministic pass/fail gate
 *
 * The manifest is the single normalized shape the UI renders, regardless of
 * whether a skill emits text, a table, files, images, HTML, or side effects.
 */

const fs = require('fs');
const path = require('path');

// ── stream-json trace parsing (shape mirrors evaluate-run.js) ────────────────

function parseTrace(events) {
  const toolCalls = [];
  const textChunks = [];
  let permissionDenials = [];
  let resultEvent = null;

  for (const evt of events) {
    if (!evt || !evt.type) continue;

    if (evt.type === 'assistant' && evt.message && Array.isArray(evt.message.content)) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_use') {
          toolCalls.push({
            name: block.name || '',
            input: block.input || {},
            id: block.id || '',
            output: '',
            isError: false,
          });
        } else if (block.type === 'text' && block.text) {
          textChunks.push(block.text);
        }
      }
      continue;
    }

    if (evt.type === 'user' && evt.message && Array.isArray(evt.message.content)) {
      for (const block of evt.message.content) {
        if (block.type === 'tool_result') {
          const content = typeof block.content === 'string'
            ? block.content
            : Array.isArray(block.content)
              ? block.content.map((c) => c.text || '').join('\n')
              : '';
          const tc = toolCalls.find((t) => t.id === block.tool_use_id);
          if (tc) {
            tc.output = content;
            tc.isError = !!block.is_error;
          }
        }
      }
      continue;
    }

    if (evt.type === 'result') {
      resultEvent = evt;
      if (typeof evt.result === 'string') textChunks.push(evt.result);
      if (Array.isArray(evt.permission_denials)) permissionDenials = evt.permission_denials;
      continue;
    }
  }

  return {
    toolCalls,
    textOutput: textChunks.join('\n'),
    finalResult: typeof resultEvent?.result === 'string' ? resultEvent.result : textChunks[textChunks.length - 1] || '',
    permissionDenials,
    costUsd: resultEvent?.total_cost_usd,
    resultEvent,
  };
}

// ── artifact classification ──────────────────────────────────────────────────

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif']);
const TEXT_EXT = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.log']);
const TABLE_EXT = new Set(['.csv', '.tsv']);
const HTML_EXT = new Set(['.html', '.htm']);

function classify(ext) {
  if (IMAGE_EXT.has(ext)) return 'image';
  if (HTML_EXT.has(ext)) return 'html';
  if (TABLE_EXT.has(ext)) return 'table';
  if (TEXT_EXT.has(ext)) return 'text';
  return 'file';
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full));
  }
  return out;
}

function parseCsvPreview(absPath, maxRows = 10) {
  try {
    const raw = fs.readFileSync(absPath, 'utf8').trim();
    const lines = raw.split(/\r?\n/);
    const split = (l) => l.split(',').map((c) => c.trim());
    return {
      columns: split(lines[0] || ''),
      rows: lines.slice(1, maxRows + 1).map(split),
      totalRows: Math.max(0, lines.length - 1),
    };
  } catch {
    return null;
  }
}

// Heuristic: which MCP/tool calls mutate external state.
const MUTATION_RE = /(create|update|delete|submit|set_|set[A-Z]|write|upsert|remove|send|post|patch|put)/i;

function detectSideEffects(toolCalls) {
  const effects = [];
  for (const t of toolCalls) {
    const isMcp = t.name.startsWith('mcp__');
    if (isMcp && MUTATION_RE.test(t.name)) {
      effects.push({ kind: 'mcp_mutation', tool: t.name, input: t.input, isError: t.isError });
    }
  }
  return effects;
}

/**
 * Build the normalized artifact envelope.
 * @param {object} opts
 * @param {object} opts.trace      result of parseTrace
 * @param {string} opts.workspace  absolute path to the run workspace
 * @param {string[]} opts.fixtures fixture basenames that were seeded (excluded from artifacts)
 */
function buildManifest({ trace, workspace, fixtures = [], skill, caseName }) {
  const fixtureSet = new Set(fixtures.map((f) => path.basename(f)));
  const artifacts = [];

  // Final assistant message is always a text artifact.
  if (trace.finalResult && trace.finalResult.trim()) {
    artifacts.push({
      type: 'text',
      label: 'final_message',
      source: 'assistant',
      format: 'markdown',
      bytes: Buffer.byteLength(trace.finalResult),
      preview: trace.finalResult.slice(0, 4000),
      content: trace.finalResult,
    });
  }

  // Files the skill wrote into the workspace (excluding seeded fixtures).
  if (workspace && fs.existsSync(workspace)) {
    for (const rel of walk(workspace)) {
      if (fixtureSet.has(path.basename(rel))) continue;
      const abs = path.join(workspace, rel);
      const ext = path.extname(rel).toLowerCase();
      const type = classify(ext);
      const stat = fs.statSync(abs);
      const artifact = { type, label: rel, source: 'workspace', path: rel, bytes: stat.size, ext };
      if (type === 'text' && stat.size < 200_000) {
        artifact.content = fs.readFileSync(abs, 'utf8');
        artifact.preview = artifact.content.slice(0, 4000);
        if (ext === '.md') artifact.format = 'markdown';
      } else if (type === 'table') {
        artifact.table = parseCsvPreview(abs);
      }
      artifacts.push(artifact);
    }
  }

  return {
    skill,
    case: caseName,
    messages: trace.textOutput ? [{ role: 'assistant', text: trace.textOutput }] : [],
    artifacts,
    side_effects: detectSideEffects(trace.toolCalls),
    tool_calls: trace.toolCalls.map((t) => ({
      name: t.name,
      input: t.input,
      isError: t.isError,
      outputPreview: (t.output || '').slice(0, 300),
    })),
    cost_usd: trace.costUsd,
    permission_denials: trace.permissionDenials.length,
  };
}

// ── deterministic assertions ─────────────────────────────────────────────────

function allText(manifest) {
  return manifest.artifacts
    .filter((a) => a.type === 'text' || a.type === 'html')
    .map((a) => a.content || a.preview || '')
    .join('\n')
    .toLowerCase();
}

function runAssertions(manifest, assertions = []) {
  const results = [];
  const text = allText(manifest);

  for (const a of assertions) {
    let pass = false;
    let detail = '';

    switch (a.type) {
      case 'artifact_produced': {
        const want = a.artifactType;
        const n = manifest.artifacts.filter((x) => !want || x.type === want).length;
        pass = n >= (a.min || 1);
        detail = `found ${n} ${want || 'any'} artifact(s), need >= ${a.min || 1}`;
        break;
      }
      case 'no_tool_errors': {
        const errs = manifest.tool_calls.filter((t) => t.isError);
        pass = errs.length === 0;
        detail = errs.length ? `${errs.length} tool error(s): ${errs.map((e) => e.name).join(', ')}` : 'no tool errors';
        break;
      }
      case 'no_external_mutations': {
        pass = manifest.side_effects.length === 0;
        detail = pass ? 'no external mutations' : `${manifest.side_effects.length} mutation(s): ${manifest.side_effects.map((s) => s.tool).join(', ')}`;
        break;
      }
      case 'output_contains_all': {
        const missing = (a.patterns || []).filter((p) => !text.includes(p.toLowerCase()));
        pass = missing.length === 0;
        detail = pass ? 'all patterns present' : `missing: ${missing.join(', ')}`;
        break;
      }
      case 'output_contains_any':
      case 'output_mentions': {
        const hit = (a.patterns || []).find((p) => text.includes(p.toLowerCase()));
        pass = !!hit;
        detail = pass ? `matched "${hit}"` : `none of: ${(a.patterns || []).join(', ')}`;
        break;
      }
      case 'tool_called_any': {
        const hit = (a.names || []).find((n) => manifest.tool_calls.some((t) => t.name.includes(n)));
        pass = !!hit;
        detail = pass ? `called ${hit}` : `none called: ${(a.names || []).join(', ')}`;
        break;
      }
      case 'max_cost_usd': {
        const cost = manifest.cost_usd || 0;
        pass = cost <= a.value;
        detail = `cost $${cost.toFixed(4)} <= $${a.value}`;
        break;
      }
      default:
        detail = `unknown assertion type: ${a.type}`;
    }

    results.push({ type: a.type, label: a.label || a.type, pass, detail });
  }

  return {
    results,
    passed: results.filter((r) => r.pass).length,
    total: results.length,
    allPassed: results.every((r) => r.pass),
  };
}

module.exports = { parseTrace, buildManifest, runAssertions, classify };
