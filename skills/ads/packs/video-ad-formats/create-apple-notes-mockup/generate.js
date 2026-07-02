// generate.js — turn a note JSON spec into a standalone HTML page that
// renders as a 1180×2556 Apple Notes screenshot.
//
// Schema (see SKILL.md for full details):
//
// {
//   "title": "Hello",
//   "body": [
//     { "type": "paragraph", "text": "..." },
//     { "type": "image",     "src": "...", "caption": "optional" },
//     { "type": "checklist", "items": [{ "text": "...", "checked": true }] },
//     { "type": "divider" }
//   ],
//   "cursor": "title" | "end" | null,
//   "autocorrect_underline": ["this", "how"],
//   "status_bar": { "time": "9:41", "battery_pct": 87, "battery_low": false,
//                   "show_focus_glyph": true, "show_island_dot": false },
//   "show_keyboard": false,
//   "keyboard_state": { "suggestions": ["see", "go", "do"], "shift": "lower" | "upper",
//                       "letters_row1": "qwertyuiop", ... },
//   "with_iphone_frame": false
// }

const fs = require('fs');
const path = require('path');

const ICONS = require('./templates/icons.js');

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Mimic iOS Smart Punctuation: convert straight quotes to curly, and triple
// dashes to em-dashes. Applied to paragraph and title text before HTML escaping.
function smartQuotes(s) {
  return String(s)
    .replace(/---/g, '—')               // --- → em-dash
    .replace(/--/g, '–')                // --  → en-dash
    .replace(/\.\.\./g, '…')            // ... → ellipsis
    .replace(/(^|[\s(\[{<—–])"/g, '$1“') // opening "
    .replace(/"/g, '”')                  // closing "
    .replace(/(^|[\s(\[{<—–])'/g, '$1‘') // opening '
    .replace(/'/g, '’');                 // closing '  (also handles apostrophes mid-word)
}

// Wrap any whole-word match of `word` in <span class="spell">…</span>
// for the autocorrect underline. Case-insensitive, word-boundary aware.
function applySpellMarks(text, words) {
  const smart = smartQuotes(text);
  if (!words || !words.length) return escapeHtml(smart);
  const escaped = escapeHtml(smart);
  let out = escaped;
  for (const w of words) {
    const re = new RegExp(`\\b(${w.replace(/[.*+?^${}()|[\\\]\\\\]/g, '\\$&')})\\b`, 'g');
    out = out.replace(re, '<span class="spell">$1</span>');
  }
  return out;
}

function renderStatusBar(sb = {}) {
  const time = sb.time || '9:41';
  const batteryPct = sb.battery_pct ?? 87;
  const batteryLow = !!sb.battery_low;
  const showFocus = sb.show_focus_glyph ?? false;
  return `
    <div class="status-bar">
      <div class="status-time">
        <span>${escapeHtml(time)}</span>
        ${showFocus ? `<span class="focus-glyph">${ICONS.focusBed}</span>` : ''}
      </div>
      <div class="status-right">
        ${ICONS.signal}
        ${ICONS.wifi}
        ${ICONS.battery({ pct: batteryPct, low: batteryLow })}
      </div>
    </div>
  `;
}

function renderToolbar() {
  return `
    <div class="toolbar">
      <div class="toolbar-pill toolbar-back">${ICONS.backChevron}</div>
      <div class="toolbar-right">
        <div class="toolbar-actions">
          ${ICONS.undo}
          ${ICONS.share}
          ${ICONS.more}
        </div>
        <div class="toolbar-done">${ICONS.done}</div>
      </div>
    </div>
  `;
}

function renderBody(spec) {
  const blocks = spec.body || [];
  const spellWords = spec.autocorrect_underline || [];
  const cursorMode = spec.cursor || null; // "title" | "end" | null
  const lastTextBlockIdx = (() => {
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].type === 'paragraph') return i;
    }
    return -1;
  })();
  const titleHtml = applySpellMarks(spec.title || '', spellWords) +
    (cursorMode === 'title' ? '<span class="cursor cursor--title"></span>' : '');
  const blocksHtml = blocks.map((b, i) => {
    if (b.type === 'paragraph') {
      const isCursorTarget = cursorMode === 'end' && i === lastTextBlockIdx;
      const inner = applySpellMarks(b.text || '', spellWords) +
        (isCursorTarget ? '<span class="cursor"></span>' : '');
      return `<p class="note-paragraph">${inner}</p>`;
    }
    if (b.type === 'image') {
      const cap = b.caption
        ? `<div class="note-image-caption">${escapeHtml(b.caption)}</div>`
        : '';
      return `<img class="note-image" src="${escapeHtml(b.src)}" alt="">${cap}`;
    }
    if (b.type === 'checklist') {
      const items = (b.items || []).map(it => {
        const cls = it.checked ? 'note-check-box note-check-box--checked' : 'note-check-box';
        const txtCls = it.checked ? 'note-check-text note-check-text--done' : 'note-check-text';
        return `<div class="note-check"><div class="${cls}"></div><div class="${txtCls}">${escapeHtml(it.text || '')}</div></div>`;
      }).join('');
      return `<div class="note-checklist">${items}</div>`;
    }
    if (b.type === 'divider') {
      return `<hr class="note-divider">`;
    }
    return '';
  }).join('\n');
  return `
    <div class="note">
      <h1 class="note-title">${titleHtml}</h1>
      <div class="note-body">
        ${blocksHtml}
      </div>
    </div>
  `;
}

function renderKeyboard(spec) {
  if (!spec.show_keyboard) return '';
  const kb = spec.keyboard_state || {};
  const sug = kb.suggestions || ['see', 'go', 'do'];
  const r1 = (kb.letters_row1 || 'qwertyuiop').split('');
  const r2 = (kb.letters_row2 || 'asdfghjkl').split('');
  const r3 = (kb.letters_row3 || 'zxcvbnm').split('');
  const upper = kb.shift === 'upper';
  const ltr = c => upper ? c.toUpperCase() : c;
  return `
    <div class="kbd">
      <div class="kbd-format">
        <div>${ICONS.formatAa}</div>
        <div>${ICONS.formatChecklist}</div>
        <div>${ICONS.formatTable}</div>
        <div>${ICONS.formatAttach}</div>
        <div>${ICONS.formatPen}</div>
        <div>${ICONS.formatAi}</div>
      </div>
      <div class="kbd-base">
        <div class="kbd-suggestions">
          ${sug.map(s => `<div class="kbd-suggestion">${escapeHtml(smartQuotes(s))}</div>`).join('')}
        </div>
        <div class="kbd-row">
          ${r1.map(c => `<div class="kbd-key">${ltr(c)}</div>`).join('')}
        </div>
        <div class="kbd-row kbd-row--abc">
          ${r2.map(c => `<div class="kbd-key">${ltr(c)}</div>`).join('')}
        </div>
        <div class="kbd-row kbd-row--zxc">
          <div class="kbd-key kbd-key--wide">${ICONS.shift}</div>
          ${r3.map(c => `<div class="kbd-key">${ltr(c)}</div>`).join('')}
          <div class="kbd-key kbd-key--wide">${ICONS.backspace}</div>
        </div>
        <div class="kbd-bottom">
          <div class="kbd-key kbd-key--num">123</div>
          <div class="kbd-key kbd-key--emoji">☻</div>
          <div class="kbd-key kbd-key--space">space</div>
          <div class="kbd-key kbd-key--return">${ICONS.returnArrow}</div>
        </div>
        <div class="kbd-footer">
          ${ICONS.globe}
          ${ICONS.mic}
        </div>
      </div>
    </div>
  `;
}

function generateHtml(spec) {
  const cssPath = path.join(__dirname, 'templates', 'note.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  const frame = spec.with_iphone_frame ? '<div class="iphone-frame"></div>' : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(spec.title || 'Apple Notes')}</title>
<style>${css}</style>
</head>
<body>
<div class="screen">
  ${renderStatusBar(spec.status_bar)}
  ${renderToolbar()}
  ${renderBody(spec)}
  ${renderKeyboard(spec)}
  ${frame}
</div>
</body>
</html>`;
}

module.exports = { generateHtml };

if (require.main === module) {
  // CLI: node generate.js <spec.json> [out.html]
  const inPath = process.argv[2];
  const outPath = process.argv[3] || inPath.replace(/\.json$/, '.html');
  const spec = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  fs.writeFileSync(outPath, generateHtml(spec));
  console.log('wrote', outPath);
}
