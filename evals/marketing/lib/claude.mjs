// Thin wrapper around the `claude` CLI (headless, -p). No dependencies.
//
// Why a clean env: a nested `claude` inherits the parent's CLAUDECODE,
// CLAUDE_CODE_SIMPLE (= --bare, which disables OAuth), ANTHROPIC_BASE_URL and
// friends, and then fails or talks to the wrong endpoint. We pass only the
// basics and let the child read auth from the keychain like a fresh terminal.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KEEP_ENV = ['HOME', 'PATH', 'USER', 'LOGNAME', 'SHELL', 'TMPDIR', 'LANG', 'LC_ALL'];

export function cleanEnv(home) {
  const env = {};
  for (const k of KEEP_ENV) if (process.env[k]) env[k] = process.env[k];
  if (home) env.HOME = home;
  env.TERM = 'dumb';
  if (!env.LANG) env.LANG = 'en_US.UTF-8';
  return env;
}

/**
 * Run `claude` with args, feeding `input` on stdin.
 * Calls onLine(line) for each stdout line (used to stream-save stream-json).
 * Resolves { code, stdout, stderr, timedOut, ms }.
 */
export function runClaude({ args, input = '', cwd, timeoutMs = 10 * 60_000, onLine, home }) {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('claude', args, { cwd, env: cleanEnv(home), stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let buf = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 10_000).unref();
    }, timeoutMs);
    child.stdout.on('data', (d) => {
      const s = d.toString();
      stdout += s;
      if (onLine) {
        buf += s;
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i);
          buf = buf.slice(i + 1);
          if (line.trim()) onLine(line);
        }
      }
    });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (onLine && buf.trim()) onLine(buf);
      resolve({ code, stdout, stderr, timedOut, ms: Date.now() - started });
    });
    child.stdin.end(input);
  });
}

let neutralDir;
/** An empty folder so helper calls pick up no project CLAUDE.md, skills or memory. */
export function neutralCwd() {
  if (!neutralDir) neutralDir = fs.mkdtempSync(path.join(os.tmpdir(), 'goose-evals-neutral-'));
  return neutralDir;
}

/**
 * One-shot model call with no tools (simulator, judge, routing picker).
 * Returns { text, costUsd, ms }. Retries once on a CLI error.
 */
export async function ask({ model, system, prompt, timeoutMs = 10 * 60_000 }) {
  const args = [
    '-p', '--model', model, '--output-format', 'json',
    '--system-prompt', system,
    '--tools', '',
    '--strict-mcp-config',
    '--disable-slash-commands',
    '--no-session-persistence',
  ];
  let last;
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await runClaude({ args, input: prompt, cwd: neutralCwd(), timeoutMs });
    last = r;
    try {
      const j = JSON.parse(r.stdout.trim().split('\n').pop());
      if (!j.is_error) return { text: j.result ?? '', costUsd: j.total_cost_usd ?? 0, ms: r.ms };
      last = { ...r, stderr: r.stderr + '\n' + (j.result ?? '') };
    } catch { /* fall through and retry */ }
  }
  throw new Error(`claude ask failed (code ${last.code}${last.timedOut ? ', timed out' : ''}): ${last.stderr.slice(0, 800) || last.stdout.slice(0, 800)}`);
}

/** Pull the first JSON object or array out of a model reply (tolerates ```json fences and prose). */
export function parseJsonLoose(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  const firstObj = text.indexOf('{');
  const lastObj = text.lastIndexOf('}');
  if (firstObj >= 0 && lastObj > firstObj) candidates.push(text.slice(firstObj, lastObj + 1));
  candidates.push(text);
  for (const c of candidates) {
    try { return JSON.parse(c.trim()); } catch { /* next */ }
  }
  throw new Error('No JSON found in model reply: ' + text.slice(0, 300));
}

/** Run async jobs with a concurrency cap, preserving order. */
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}
