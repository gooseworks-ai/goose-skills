// Minimal MCP client (streamable HTTP, JSON-RPC) for the GooseWorks STAGING server, so the
// harness can snapshot and clean brand state deterministically without an LLM.
// Auth: the gooseworks-staging entry in ~/.claude.json (read in memory, never written anywhere).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SERVER = process.env.GOOSE_EVAL_MCP_SERVER || 'gooseworks-staging';

function serverConfig() {
  const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
  const s = cfg.mcpServers?.[SERVER];
  if (!s?.url) throw new Error(`MCP server "${SERVER}" not found in ~/.claude.json`);
  if (!/staging/.test(s.url)) throw new Error(`Refusing: "${SERVER}" (${s.url}) is not a staging URL`);
  return s;
}

async function readBody(res) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/event-stream')) return text ? JSON.parse(text) : null;
  // SSE: take the last `data:` JSON-RPC message.
  let last = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('data:')) {
      try { last = JSON.parse(line.slice(5).trim()); } catch { /* keep going */ }
    }
  }
  return last;
}

export class StagingMcp {
  constructor() {
    const s = serverConfig();
    this.url = s.url;
    this.headers = { ...(s.headers || {}), 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };
    this.session = null;
    this.id = 0;
  }

  async rpc(method, params, { notify = false } = {}) {
    const body = notify ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: ++this.id, method, params };
    const headers = { ...this.headers };
    if (this.session) headers['mcp-session-id'] = this.session;
    const res = await fetch(this.url, { method: 'POST', headers, body: JSON.stringify(body) });
    const sid = res.headers.get('mcp-session-id');
    if (sid) this.session = sid;
    if (notify) return null;
    if (!res.ok) throw new Error(`${method}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
    const msg = await readBody(res);
    if (msg?.error) throw new Error(`${method}: ${JSON.stringify(msg.error).slice(0, 300)}`);
    return msg?.result;
  }

  async connect() {
    await this.rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'marketing-agent-evals', version: '0.1.0' } });
    await this.rpc('notifications/initialized', {}, { notify: true });
    return this;
  }

  /** Call a tool; returns parsed JSON from its text content when possible. */
  async call(name, args = {}) {
    const r = await this.rpc('tools/call', { name, arguments: args });
    const text = (r?.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('\n');
    if (r?.isError) throw new Error(`${name}: ${text.slice(0, 400)}`);
    if (r?.structuredContent) return r.structuredContent;
    try { return JSON.parse(text); } catch { return text; }
  }

  async listTools() {
    const r = await this.rpc('tools/list', {});
    return r?.tools ?? [];
  }
}
