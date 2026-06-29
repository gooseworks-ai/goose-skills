'use strict';

/**
 * Dependency resolution for the eval harness.
 *
 * A skill's eval.json can declare external dependencies (CLI bins, env vars,
 * MCP servers). Before running a case we make sure they're satisfied:
 *
 *   - cli/env: cheap local checks.
 *   - mcp: check `claude mcp list`. If a needed MCP is missing and its mode is
 *     "subagent-auto", spawn a setup subagent (`claude --print`) that tries to
 *     provision/authenticate it, then re-check. If still unmet, the case is
 *     skipped with a reason (never silently passed).
 *
 * This is the "use a subagent and auto-resolve external MCP dependencies" step.
 */

const { execFileSync } = require('child_process');

function whichOk(bin) {
  try {
    execFileSync('which', [bin], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function listMcpServers() {
  try {
    const out = execFileSync('claude', ['mcp', 'list'], { encoding: 'utf8', timeout: 30_000 });
    return out;
  } catch (e) {
    // `claude mcp list` may exit non-zero with no servers — fall back to stdout.
    return (e.stdout && e.stdout.toString()) || '';
  }
}

function mcpPresent(name, listing) {
  // Match "name:" or "name " at a line start, tolerant of the CLI's formatting.
  const re = new RegExp(`(^|\\n)\\s*${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
  return re.test(listing) && !/no mcp servers/i.test(listing);
}

/**
 * Spawn a setup subagent to try to bring an MCP online.
 * Returns true if, after the subagent runs, the MCP shows up in `claude mcp list`.
 */
function autoResolveMcp(dep, { spawnClaude, log }) {
  log(`    ↳ auto-resolving MCP "${dep.name}" via setup subagent…`);
  const prompt = dep.setupPrompt ||
    `Ensure an MCP server named "${dep.name}" is connected and authenticated for this Claude session. ` +
    `If it cannot be configured, reply exactly: UNAVAILABLE.`;
  try {
    const { stdout } = spawnClaude({
      prompt,
      // setup subagents may need to run config commands
      extraArgs: ['--permission-mode', 'bypassPermissions'],
      timeoutMs: 3 * 60 * 1000,
    });
    if (/UNAVAILABLE/i.test(stdout)) {
      log(`    ↳ subagent reported UNAVAILABLE for "${dep.name}"`);
      return false;
    }
  } catch (e) {
    log(`    ↳ setup subagent failed: ${e.message}`);
    return false;
  }
  return mcpPresent(dep.name, listMcpServers());
}

/**
 * Resolve all dependencies needed for a given case.
 * @returns {{ ok: boolean, reason?: string, satisfied: string[] }}
 */
function resolveDependencies(evalSpec, caseObj, ctx) {
  const log = ctx.log || (() => {});
  const deps = evalSpec.dependencies || {};
  const satisfied = [];

  // CLI bins
  for (const bin of deps.cli || []) {
    if (!whichOk(bin)) return { ok: false, reason: `missing CLI dependency: ${bin}`, satisfied };
    satisfied.push(`cli:${bin}`);
  }

  // Env vars
  for (const name of deps.env || []) {
    if (!process.env[name]) return { ok: false, reason: `missing env var: ${name}`, satisfied };
    satisfied.push(`env:${name}`);
  }

  // MCP servers — only those this case needs.
  const neededMcp = (deps.mcp || []).filter((m) =>
    m.required ||
    (caseObj.dependsOn || []).includes(m.name) ||
    (m.neededForCases || []).includes(caseObj.name),
  );

  if (neededMcp.length === 0) return { ok: true, satisfied };

  const listing = listMcpServers();
  for (const dep of neededMcp) {
    if (mcpPresent(dep.name, listing)) {
      satisfied.push(`mcp:${dep.name}`);
      continue;
    }
    if (dep.mode === 'subagent-auto') {
      if (autoResolveMcp(dep, ctx)) {
        satisfied.push(`mcp:${dep.name}(auto)`);
        continue;
      }
    }
    return { ok: false, reason: `MCP dependency unmet: ${dep.name}`, satisfied };
  }

  return { ok: true, satisfied };
}

module.exports = { resolveDependencies, listMcpServers, mcpPresent };
