#!/usr/bin/env node
'use strict';

/**
 * Render a self-contained HTML report from an eval run directory.
 *
 * Left = INPUT (task prompt + fixtures). Right = OUTPUT (the normalized artifact
 * envelope rendered by type: markdown/text, tables, images inline, files,
 * HTML in an iframe), plus assertions, the LLM judge verdict, and a
 * human-in-the-loop label panel (👍/👎 + notes) with one-click Export.
 *
 * Usage:
 *   node test/report.js .eval-runs/meta-ads-analyzer/2026-06-25-1200
 *   node test/report.js .eval-runs/meta-ads-analyzer/2026-06-25-1200 --open
 */

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const runDirArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
const open = process.argv.includes('--open');
if (!runDirArg) {
  console.error('Usage: node test/report.js <run-dir> [--open]');
  process.exit(1);
}
const runDir = path.resolve(process.cwd(), runDirArg);
if (!fs.existsSync(runDir)) {
  console.error(`Run dir not found: ${runDir}`);
  process.exit(1);
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const readJson = (p) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

const summary = readJson(path.join(runDir, '_summary.json')) || { skill: path.basename(path.dirname(runDir)), results: [] };

// Collect per-case data.
const caseDirs = fs.readdirSync(runDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

function imgDataUri(absPath, ext) {
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`;
}

// Minimal, safe-ish markdown -> HTML (headings, bold, code, lists, tables-ish, paragraphs).
function mdToHtml(md) {
  const lines = esc(md).split('\n');
  let html = '';
  let inCode = false;
  let inList = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      if (!inCode) { html += '<pre><code>'; inCode = true; } else { html += '</code></pre>'; inCode = false; }
      continue;
    }
    if (inCode) { html += line + '\n'; continue; }
    let l = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    if (/^#{1,6}\s/.test(l)) {
      const lvl = l.match(/^(#{1,6})/)[1].length;
      if (inList) { html += '</ul>'; inList = false; }
      html += `<h${lvl}>${l.replace(/^#{1,6}\s/, '')}</h${lvl}>`;
    } else if (/^\s*[-*]\s+/.test(l)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${l.replace(/^\s*[-*]\s+/, '')}</li>`;
    } else if (l.trim() === '') {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${l}</p>`;
    }
  }
  if (inList) html += '</ul>';
  if (inCode) html += '</code></pre>';
  return html;
}

function renderArtifact(caseName, a, caseDir) {
  if (a.type === 'image') {
    const abs = path.join(caseDir, 'workspace', a.path);
    const uri = fs.existsSync(abs) ? imgDataUri(abs, a.ext) : '';
    return `<div class="art"><div class="art-h">🖼 ${esc(a.label)}</div><img src="${uri}" alt="${esc(a.label)}"/></div>`;
  }
  if (a.type === 'table' && a.table) {
    const head = (a.table.columns || []).map((c) => `<th>${esc(c)}</th>`).join('');
    const body = (a.table.rows || []).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="art"><div class="art-h">▦ ${esc(a.label)} <span class="muted">(${a.table.totalRows} rows)</span></div><div class="tbl-wrap"><table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
  }
  if (a.type === 'html') {
    const content = a.content || '';
    return `<div class="art"><div class="art-h">⌗ ${esc(a.label)}</div><iframe sandbox srcdoc="${esc(content)}"></iframe></div>`;
  }
  if (a.type === 'text') {
    const content = a.content || a.preview || '';
    const body = a.format === 'markdown' ? mdToHtml(content) : `<pre>${esc(content)}</pre>`;
    return `<div class="art"><div class="art-h">📄 ${esc(a.label)} <span class="muted">(${a.bytes} bytes)</span></div><div class="doc">${body}</div></div>`;
  }
  return `<div class="art"><div class="art-h">📎 ${esc(a.label)}</div><div class="muted">${esc(a.type)} — ${a.bytes || 0} bytes</div></div>`;
}

function statusPill(s) {
  const cls = { PASS: 'ok', FAIL: 'bad', PARTIAL: 'warn', SKIPPED: 'muted', ERROR: 'bad' }[s] || 'muted';
  return `<span class="pill ${cls}">${esc(s)}</span>`;
}

// Render an input fixture inline (the actual data the skill was given), not just its name.
function renderFixture(caseDir, fname) {
  const abs = path.join(caseDir, 'workspace', fname);
  if (!fs.existsSync(abs)) return `<div class="art"><div class="art-h">📎 ${esc(fname)} <span class="muted">(not found)</span></div></div>`;
  const ext = path.extname(fname).toLowerCase();
  const stat = fs.statSync(abs);

  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) {
    return `<div class="art"><div class="art-h">🖼 ${esc(fname)}</div><img src="${imgDataUri(abs, ext)}" alt="${esc(fname)}"/></div>`;
  }
  if (['.csv', '.tsv'].includes(ext)) {
    const sep = ext === '.tsv' ? '\t' : ',';
    const lines = fs.readFileSync(abs, 'utf8').trim().split(/\r?\n/);
    const cells = (l) => l.split(sep).map((c) => c.trim());
    const head = cells(lines[0] || '').map((c) => `<th>${esc(c)}</th>`).join('');
    const body = lines.slice(1).map((l) => `<tr>${cells(l).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return `<div class="art"><div class="art-h">▦ ${esc(fname)} <span class="muted">(${lines.length - 1} rows)</span></div><div class="tbl-wrap"><table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
  }
  if (stat.size < 200_000) {
    const content = fs.readFileSync(abs, 'utf8');
    const body = ext === '.md' ? mdToHtml(content) : `<pre>${esc(content)}</pre>`;
    return `<div class="art"><div class="art-h">📄 ${esc(fname)} <span class="muted">(${stat.size} bytes)</span></div><div class="doc">${body}</div></div>`;
  }
  return `<div class="art"><div class="art-h">📎 ${esc(fname)} <span class="muted">(${stat.size} bytes — too large to inline)</span></div></div>`;
}

const caseSections = caseDirs.map((name) => {
  const caseDir = path.join(runDir, name);
  const input = readJson(path.join(caseDir, 'input.json'));
  const manifest = readJson(path.join(caseDir, 'manifest.json'));
  const assertions = readJson(path.join(caseDir, 'assertions.json'));
  const judgment = readJson(path.join(caseDir, 'judgment.json'));
  const result = readJson(path.join(caseDir, 'result.json'));
  const status = result?.status || 'ERROR';

  if (status === 'SKIPPED') {
    return `<section class="case" id="case-${esc(name)}"><h2>${esc(name)} ${statusPill(status)}</h2><p class="muted">Skipped — ${esc(result?.reason || '')}</p></section>`;
  }

  const fixturesHtml = (input?.fixtures || []).length
    ? input.fixtures.map((f) => renderFixture(caseDir, f)).join('')
    : '<p class="muted">none</p>';

  const assertHtml = (assertions?.results || []).map((r) =>
    `<li class="${r.pass ? 'ok' : 'bad'}">${r.pass ? '✓' : '✗'} <code>${esc(r.type)}</code> — ${esc(r.detail)}</li>`).join('');

  const criteriaHtml = (judgment?.criteria || []).map((c) =>
    `<li class="${c.met ? 'ok' : 'bad'}">${c.met ? '✓' : '✗'} ${esc(c.name)} — <span class="muted">${esc(c.note || '')}</span></li>`).join('');

  const artHtml = (manifest?.artifacts || []).map((a) => renderArtifact(name, a, caseDir)).join('');

  const sideFx = (manifest?.side_effects || []).length
    ? `<div class="warnbox">⚠ ${manifest.side_effects.length} external mutation(s): ${manifest.side_effects.map((s) => esc(s.tool)).join(', ')}</div>`
    : '';

  return `
  <section class="case" id="case-${esc(name)}">
    <h2>${esc(name)} ${statusPill(status)}
      <span class="muted small">${result?.elapsedSeconds ?? '?'}s · $${(result?.costUsd ?? 0).toFixed?.(4) ?? result?.costUsd ?? '?'} · ${manifest?.tool_calls?.length ?? 0} tool calls</span>
    </h2>
    ${sideFx}
    <div class="grid">
      <div class="col">
        <h3>Input</h3>
        <div class="box"><div class="lbl">Task</div><div class="doc">${mdToHtml(input?.taskPrompt || '')}</div></div>
        <div class="box"><div class="lbl">Fixtures</div>${fixturesHtml}</div>

        <h3>Assertions <span class="muted small">${assertions?.passed ?? 0}/${assertions?.total ?? 0}</span></h3>
        <ul class="checks">${assertHtml || '<li class="muted">none</li>'}</ul>

        <h3>LLM Judge <span class="pill ${judgment?.verdict === 'pass' ? 'ok' : judgment?.verdict === 'fail' ? 'bad' : 'muted'}">${esc(judgment?.verdict || 'n/a')}${judgment?.score != null ? ` ${judgment.score}/5` : ''}</span></h3>
        <p class="reason">${esc(judgment?.reasoning || '')}</p>
        <ul class="checks">${criteriaHtml}</ul>
        ${(judgment?.failTriggers || []).length ? `<div class="warnbox">Fail triggers: ${judgment.failTriggers.map(esc).join('; ')}</div>` : ''}

        <h3>Human label</h3>
        <div class="label-panel" data-case="${esc(name)}">
          <button class="thumb up">👍 Pass</button>
          <button class="thumb down">👎 Fail</button>
          <textarea placeholder="Notes (why? what's wrong? calibration vs judge)…"></textarea>
        </div>
      </div>
      <div class="col">
        <h3>Output artifacts <span class="muted small">${(manifest?.artifacts || []).length}</span></h3>
        ${artHtml || '<p class="muted">No artifacts produced.</p>'}
      </div>
    </div>
  </section>`;
}).join('\n');

const html = `<!doctype html>
<html><head><meta charset="utf-8"/><title>Skill Eval — ${esc(summary.skill)}</title>
<style>
  :root { --stone:#78716c; --line:#e7e5e4; --bg:#fafaf9; }
  * { box-sizing:border-box; }
  body { margin:0; font:14px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1c1917; background:var(--bg); }
  header { padding:18px 28px; border-bottom:1px solid var(--line); background:#fff; position:sticky; top:0; z-index:5; }
  header h1 { margin:0; font-size:16px; font-weight:600; }
  header .sub { color:var(--stone); font-size:12px; margin-top:4px; }
  main { padding:24px 28px; max-width:1400px; margin:0 auto; }
  .case { background:#fff; border:1px solid var(--line); border-radius:10px; padding:20px 22px; margin-bottom:22px; }
  .case h2 { font-size:15px; margin:0 0 14px; font-weight:600; }
  h3 { font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--stone); margin:18px 0 8px; }
  .grid { display:grid; grid-template-columns:minmax(320px,420px) 1fr; gap:26px; }
  @media (max-width:900px){ .grid { grid-template-columns:1fr; } }
  .box { border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin-bottom:10px; }
  .lbl { font-size:11px; text-transform:uppercase; color:var(--stone); margin-bottom:4px; }
  .doc { font-size:13px; }
  .doc h1,.doc h2,.doc h3 { font-size:13px; margin:10px 0 4px; text-transform:none; letter-spacing:0; color:#1c1917; }
  .doc p { margin:6px 0; } .doc ul { margin:6px 0 6px 18px; } .doc code { background:#f5f5f4; padding:1px 4px; border-radius:3px; font-size:12px; }
  .doc pre { background:#f5f5f4; padding:10px; border-radius:6px; overflow:auto; font-size:12px; }
  .art { border:1px solid var(--line); border-radius:8px; margin-bottom:14px; overflow:hidden; }
  .art-h { background:#fafaf9; border-bottom:1px solid var(--line); padding:7px 11px; font-size:12px; font-weight:600; }
  .art .doc { padding:12px 14px; max-height:640px; overflow:auto; }
  .art img { max-width:100%; display:block; } .art iframe { width:100%; height:520px; border:0; }
  .tbl-wrap { overflow:auto; max-height:420px; }
  table.data { border-collapse:collapse; width:100%; font-size:12px; }
  table.data th,table.data td { border:1px solid var(--line); padding:5px 8px; text-align:left; white-space:nowrap; }
  table.data th { background:#fafaf9; position:sticky; top:0; }
  .checks { list-style:none; margin:0; padding:0; font-size:12.5px; } .checks li { padding:3px 0; }
  .checks .ok, .pill.ok { color:#15803d; } .checks .bad, .pill.bad { color:#b91c1c; }
  .pill { display:inline-block; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; border:1px solid var(--line); }
  .pill.ok { background:#f0fdf4; border-color:#bbf7d0; } .pill.bad { background:#fef2f2; border-color:#fecaca; }
  .pill.warn { background:#fffbeb; border-color:#fde68a; color:#b45309; } .pill.muted { color:var(--stone); }
  .muted { color:var(--stone); } .small { font-size:11px; font-weight:400; }
  .reason { font-size:12.5px; background:#fafaf9; border:1px solid var(--line); border-radius:6px; padding:8px 10px; }
  .warnbox { background:#fffbeb; border:1px solid #fde68a; color:#92400e; padding:8px 10px; border-radius:6px; font-size:12.5px; margin:8px 0; }
  .files { list-style:none; margin:0; padding:0; font-size:12.5px; }
  .label-panel { border:1px dashed var(--line); border-radius:8px; padding:10px; }
  .thumb { font:inherit; font-size:12px; padding:5px 12px; border:1px solid var(--line); background:#fff; border-radius:6px; cursor:pointer; margin-right:6px; }
  .thumb.sel-up { background:#f0fdf4; border-color:#bbf7d0; } .thumb.sel-down { background:#fef2f2; border-color:#fecaca; }
  .label-panel textarea { width:100%; min-height:54px; margin-top:8px; border:1px solid var(--line); border-radius:6px; padding:7px; font:inherit; font-size:12.5px; resize:vertical; }
  .exportbar { position:fixed; bottom:18px; right:22px; }
  .exportbar button { font:inherit; font-size:13px; font-weight:600; padding:9px 16px; border:1px solid var(--line); background:#1c1917; color:#fff; border-radius:8px; cursor:pointer; }
</style></head>
<body>
<header>
  <h1>Skill Eval — ${esc(summary.skill)}</h1>
  <div class="sub">run ${esc(summary.runId || path.basename(runDir))} ·
    ${summary.pass || 0} pass · ${summary.fail || 0} fail · ${summary.partial || 0} partial · ${summary.skipped || 0} skipped · ${summary.error || 0} error</div>
</header>
<main>${caseSections}</main>
<div class="exportbar"><button id="export">⬇ Export labels</button></div>
<script>
  const labels = {};
  document.querySelectorAll('.label-panel').forEach((panel) => {
    const cas = panel.dataset.case;
    const up = panel.querySelector('.up'), down = panel.querySelector('.down'), notes = panel.querySelector('textarea');
    const save = () => { labels[cas] = { verdict: panel.dataset.verdict || null, notes: notes.value }; };
    up.onclick = () => { panel.dataset.verdict='pass'; up.classList.add('sel-up'); down.classList.remove('sel-down'); save(); };
    down.onclick = () => { panel.dataset.verdict='fail'; down.classList.add('sel-down'); up.classList.remove('sel-up'); save(); };
    notes.oninput = save;
  });
  document.getElementById('export').onclick = () => {
    const blob = new Blob([JSON.stringify({ skill: ${JSON.stringify(summary.skill)}, run: ${JSON.stringify(summary.runId || path.basename(runDir))}, labels }, null, 2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'labels.json'; a.click();
  };
</script>
</body></html>`;

const outPath = path.join(runDir, 'report.html');
fs.writeFileSync(outPath, html);
console.log(`Report: ${outPath}`);

if (open) {
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  execFile(opener, [outPath], () => {});
}
