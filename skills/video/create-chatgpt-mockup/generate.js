#!/usr/bin/env node
/**
 * generate.js — Convert a ChatGPT thread JSON into a single HTML page that
 * mimics the ChatGPT mobile (iOS) app in light mode.
 *
 * Usage:
 *   const { renderHTML } = require('./generate');
 *   const html = renderHTML(thread);
 *   node generate.js --thread examples/text-only.json --out /tmp/index.html
 */

const fs = require('fs');
const path = require('path');
const ICONS = require('./templates/icons');

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Tiny markdown-ish renderer for assistant prose. Intentional scope:
//   **bold**, *italic*, # H1, ## H2, ### H3, * / - list items,
//   blank-line paragraph breaks, `---` horizontal rule, [[cite:Source]] chip,
//   [[icon:💡]] inline-icon prefix.
function renderMarkdown(src) {
  if (!src) return '';
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let buf = [];
  let inList = false;
  let inOrdered = false;

  const flushParagraph = () => {
    if (!buf.length) return;
    // Format each line through inline-markdown first (escaping happens there),
    // then join with <br> so single-newline line breaks (e.g. inside a poem
    // stanza or under a bold "Section:" header) are preserved. Real ChatGPT
    // renders single newlines as soft breaks too.
    const joined = buf.map(l => formatInline(l)).join('<br>').replace(/^(<br>)+|(<br>)+$/g, '');
    if (joined) out.push(`<p>${joined}</p>`);
    buf = [];
  };
  const flushList = () => {
    if (inList) { out.push('</ul>'); inList = false; }
    if (inOrdered) { out.push('</ol>'); inOrdered = false; }
  };

  for (let raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) { flushParagraph(); flushList(); continue; }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) { flushParagraph(); flushList(); out.push('<hr>'); continue; }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      flushParagraph(); flushList();
      const level = h[1].length;
      out.push(`<h${level}>${formatInline(h[2])}</h${level}>`);
      continue;
    }

    // Bullet item
    const li = /^[\*\-]\s+(.*)$/.exec(line);
    if (li) {
      flushParagraph();
      if (inOrdered) { out.push('</ol>'); inOrdered = false; }
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${formatInline(li[1])}</li>`);
      continue;
    }

    // Ordered item
    const oli = /^(\d+)\.\s+(.*)$/.exec(line);
    if (oli) {
      flushParagraph();
      if (inList) { out.push('</ul>'); inList = false; }
      if (!inOrdered) { out.push('<ol>'); inOrdered = true; }
      out.push(`<li>${formatInline(oli[2])}</li>`);
      continue;
    }

    // Bolded "Section title:" pattern → make it visually a section header
    const sec = /^\*\*(.+?)\*\*:?\s*$/.exec(line);
    if (sec) {
      flushParagraph(); flushList();
      out.push(`<p class="section-title">${formatInline(sec[1])}</p>`);
      continue;
    }

    buf.push(line);
  }
  flushParagraph(); flushList();
  return out.join('\n');
}

function formatInline(s) {
  let out = escapeHTML(s);
  // Inline icon prefix (kept un-escaped because emoji is a glyph, not markup).
  out = out.replace(/\[\[icon:(.+?)\]\]/g, (_, ico) => `<span class="icon-prefix">${ico}</span>`);
  // Cite chip
  out = out.replace(/\[\[cite:(.+?)\]\]/g, (_, c) => `<span class="cite">${c}</span>`);
  // Bold **text**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic *text* — must come AFTER bold so we don't eat ** markers
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  return out;
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function renderStatusBar(thread) {
  const sb = thread.statusBar || {};
  const time = sb.time || '9:41';
  const dnd = sb.dnd === true; // moon glyph next to time
  // Default: full cluster (signal + wifi + battery)
  return `
    <div class="status-bar">
      <div class="time">${escapeHTML(time)} ${dnd ? ICONS.moonDND : ''}</div>
      <div class="right-cluster">
        ${ICONS.signal}
        ${ICONS.wifi}
        ${ICONS.battery}
      </div>
    </div>
  `;
}

function renderHeader(thread) {
  const h = thread.header || {};
  const style = h.style || 'model-tag'; // model-tag | title-only
  const title = h.title || 'ChatGPT';
  const model = h.model || ''; // e.g. "5.1"
  const rightIcons = h.rightIcons || (style === 'title-only' ? ['edit'] : ['personPlus', 'dottedCircle']);
  // Optional alternate right-icon set, faded-in by the driver when the chat
  // transitions from "empty" to "active". Render both sets stacked when both
  // are provided — the driver toggles `data-active` between "primary"/"alt".
  const rightIconsAlt = h.rightIconsAlt || null;

  // Center cluster
  let center = '';
  if (style === 'title-only') {
    // "ChatGPT >"  hard-left actually but iOS centers — match reference.
    center = `<div class="center"><span>${escapeHTML(title)}</span><span class="chev-right">${ICONS.chevronRight}</span></div>`;
  } else if (style === 'plain-title') {
    center = `<div class="center"><span>${escapeHTML(title)}</span></div>`;
  } else {
    // model-tag default → "ChatGPT 5.1 v"
    center = `<div class="center"><span>${escapeHTML(title)}</span>${model ? `<span class="model-tag">${escapeHTML(model)}</span>` : ''}<span class="chev-down">${ICONS.chevronDown}</span></div>`;
  }

  const iconMap = {
    personPlus: ICONS.personPlus,
    dottedCircle: ICONS.dottedCircle,
    edit: ICONS.editPencil,
    more: ICONS.moreDots,
  };
  const renderCluster = (keys) => keys.map(k => iconMap[k] || '').join('');
  const rightHTML = rightIconsAlt
    ? `<div class="cluster primary" data-cluster="primary">${renderCluster(rightIcons)}</div>
       <div class="cluster alt" data-cluster="alt">${renderCluster(rightIconsAlt)}</div>`
    : renderCluster(rightIcons);

  const rightAttrs = rightIconsAlt ? ' data-active="primary"' : '';

  return `
    <div class="gpt-header ${style === 'title-only' ? 'title-center' : ''}">
      <div class="left">
        <div class="hamburger">${ICONS.hamburger}</div>
      </div>
      ${center}
      <div class="right"${rightAttrs}>${rightHTML}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function animAttrs(msg) {
  // In animation mode every row gets a stable id (assigned upstream) and may
  // start in a hidden state. data-pending="1" hides via display:none in CSS.
  const id = msg.id ? ` data-anim-id="${escapeHTML(msg.id)}"` : '';
  const pending = msg.popState === 'pending' ? ' data-pending="1"' : '';
  const animClass = msg.popState === 'pending' ? 'pop-pending'
                  : msg.popState === 'now' ? 'pop-now' : '';
  return { id, pending, animClass };
}

function renderUserText(msg) {
  const a = animAttrs(msg);
  return `<div class="row user ${a.animClass}"${a.id}${a.pending}><div class="bubble">${escapeHTML(msg.text || '').replace(/\n/g, '<br>')}</div></div>`;
}

function renderUserImage(msg) {
  const a = animAttrs(msg);
  const src = msg.src || '';
  const cls = msg.aspect === 'square' ? 'attachment square' : 'attachment';
  return `<div class="row user-image ${a.animClass}"${a.id}${a.pending}><div class="${cls}"><img src="${escapeHTML(src)}" alt=""></div></div>`;
}

// Wrap visible text nodes in <span class="word" data-stream="0">word</span>
// without touching tags or already-wrapped content. Whitespace is preserved
// outside the spans so word gaps are real spaces (CSS doesn't have to fake
// them with padding).
function wrapWordsForStreaming(html) {
  const out = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      // Pass tags through unchanged
      const end = html.indexOf('>', i);
      if (end === -1) { out.push(html.slice(i)); break; }
      out.push(html.slice(i, end + 1));
      i = end + 1;
      continue;
    }
    // Read a text run up to the next tag
    const nextTag = html.indexOf('<', i);
    const run = nextTag === -1 ? html.slice(i) : html.slice(i, nextTag);
    // Tokenize the run into words + whitespace
    run.split(/(\s+)/).forEach(tok => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) out.push(tok);
      else out.push(`<span class="word" data-stream="0">${tok}</span>`);
    });
    i = nextTag === -1 ? html.length : nextTag;
  }
  return out.join('');
}

// Browser-rendered list markers (the bullet glyphs on `<li>`) can't be
// hidden by the word-stream wrapper because they're CSS-painted, not text.
// So when streaming, convert `<ul><li>X</li></ul>` to a div tree whose
// items begin with "• " as literal text — that bullet then becomes a
// streamable word and arrives with its line.
function inlineListBulletsForStreaming(html) {
  return html
    .replace(/<ul[^>]*>/g, '<div class="md-list">')
    .replace(/<\/ul>/g, '</div>')
    .replace(/<ol[^>]*>/g, '<div class="md-list ordered">')
    .replace(/<\/ol>/g, '</div>')
    .replace(/<li>/g, '<div class="md-li">• ')
    .replace(/<\/li>/g, '</div>');
}

function renderAssistant(msg) {
  const a = animAttrs(msg);
  // Real ChatGPT renders the assistant title as plain bold text — no spiral
  // logo. (The logo only appears in the empty-state hero, not before each
  // message.)
  const titleRaw = msg.title
    ? `<div class="title-row"><span class="title-text">${escapeHTML(msg.title)}</span></div>`
    : '';
  let body = renderMarkdown(msg.text || '');
  let title = titleRaw;
  if (msg.stream === true) {
    body = inlineListBulletsForStreaming(body);
    body = wrapWordsForStreaming(body);
    if (title) title = wrapWordsForStreaming(title);
  }
  const feedback = msg.feedback === false ? '' :
    `<div class="feedback">${ICONS.thumbsUp}${ICONS.thumbsDown}</div>`;
  const streamCls = msg.stream === true ? ' streaming-body' : '';
  return `
    <div class="row assistant ${a.animClass}"${a.id}${a.pending}>
      ${title}
      <div class="assistant-body${streamCls}">${body}</div>
      ${feedback}
    </div>
  `;
}

function renderLoadingDot(msg) {
  const a = animAttrs(msg);
  return `<div class="row loading-dot ${a.animClass}"${a.id}${a.pending}><div class="dot"></div></div>`;
}

function renderEmptyState() {
  return `<div class="empty-state"><div class="big-logo">${ICONS.openaiSpiral}</div></div>`;
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function renderComposer(thread) {
  const c = thread.composer || {};
  const placeholder = c.placeholder || 'Ask anything';
  const hasText = c.text != null && c.text !== '';
  const streaming = c.streaming === true;
  const showCaret = c.cursor !== false && hasText;
  const sendCls = streaming ? 'streaming' : (hasText ? 'active' : '');
  const sendIcon = streaming ? ICONS.stopSquare : ICONS.sendArrow;

  // Optional Apps-SDK GPT chip
  if (c.chip) {
    const name = c.chip.name || 'GPT';
    return `
      <div class="composer-wrap">
        <div class="composer with-chip">
          <div class="gpt-chip">
            <span>${escapeHTML(name)}</span>
            <span class="x">×</span>
          </div>
          <div class="input-row">
            <div class="plus-btn">${ICONS.plus}</div>
            <div class="input">${hasText ? `<span class="composer-text">${escapeHTML(c.text)}</span>` : `<span class="placeholder">${escapeHTML(placeholder)}</span>`}${showCaret ? '<span class="caret"></span>' : ''}</div>
            <div class="mic-btn">${ICONS.mic}</div>
            <div class="send-btn ${sendCls}">${sendIcon}</div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="composer-wrap">
      <div class="composer">
        <div class="plus-btn">${ICONS.plus}</div>
        <div class="input">${hasText ? `<span class="composer-text">${escapeHTML(c.text)}</span>` : `<span class="placeholder">${escapeHTML(placeholder)}</span>`}${showCaret ? '<span class="caret"></span>' : ''}</div>
        <div class="mic-btn">${ICONS.mic}</div>
        <div class="send-btn ${sendCls}">${sendIcon}</div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------

function loadCSS() {
  return fs.readFileSync(path.join(__dirname, 'templates', 'chat.css'), 'utf-8');
}

function renderMessages(messages) {
  return (messages || []).map(m => {
    if (m.type === 'user-text') return renderUserText(m);
    if (m.type === 'user-image') return renderUserImage(m);
    if (m.type === 'assistant') return renderAssistant(m);
    if (m.type === 'loading-dot') return renderLoadingDot(m);
    return '';
  }).join('\n');
}

function renderHTML(thread) {
  const css = loadCSS();
  const messages = thread.messages || [];
  const hasMessages = messages.length > 0;
  const inner = hasMessages
    ? `<div class="conversation">${renderMessages(messages)}</div>`
    : renderEmptyState();

  // Inline keyboard (no external atom). Same structure as the apple-notes
  // mockup's .kbd block, scaled to fit a 750-wide stage. Driver toggles
  // data-state and the stage's data-keyboard-shown to swap layouts.
  const kbHTML = thread.keyboard ? renderKeyboard(thread.keyboard) : '';
  const stageAttrs = thread.keyboard && thread.keyboard.state === 'shown'
    ? ' data-keyboard-shown="1"' : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body>
  <div class="stage"${stageAttrs}>
    ${renderStatusBar(thread)}
    ${renderHeader(thread)}
    ${inner}
    ${renderComposer(thread)}
    ${kbHTML}
  </div>
</body></html>`;
}

// Inline iOS QWERTY keyboard — modeled on create-apple-notes-mockup's .kbd
// block. The chatgpt variant has no formatting toolbar (apple-notes' Aa /
// checklist / etc.) because the composer pill sits above instead.
function renderKeyboard(kb) {
  if (!kb) return '';
  const id = kb.id || 'kb';
  const state = kb.state || 'hidden';
  const upper = kb.shift === 'upper';
  const ltr = c => upper ? c.toUpperCase() : c;
  const r1 = (kb.letters_row1 || 'qwertyuiop').split('');
  const r2 = (kb.letters_row2 || 'asdfghjkl').split('');
  const r3 = (kb.letters_row3 || 'zxcvbnm').split('');
  const sug = kb.suggestions || ['I', 'The', "I'm"];
  return `
    <div class="kbd" data-anim-id="${escapeHTML(id)}" data-state="${escapeHTML(state)}">
      <div class="kbd-suggestions">
        ${sug.map(s => `<div class="kbd-suggestion">${escapeHTML(s)}</div>`).join('')}
      </div>
      <div class="kbd-row">
        ${r1.map(c => `<div class="kbd-key">${escapeHTML(ltr(c))}</div>`).join('')}
      </div>
      <div class="kbd-row kbd-row--abc">
        ${r2.map(c => `<div class="kbd-key">${escapeHTML(ltr(c))}</div>`).join('')}
      </div>
      <div class="kbd-row kbd-row--zxc">
        <div class="kbd-key kbd-key--wide">${ICONS.kbdShift || '⇧'}</div>
        ${r3.map(c => `<div class="kbd-key">${escapeHTML(ltr(c))}</div>`).join('')}
        <div class="kbd-key kbd-key--wide">${ICONS.kbdBackspace || '⌫'}</div>
      </div>
      <div class="kbd-bottom">
        <div class="kbd-key kbd-key--num">123</div>
        <div class="kbd-key kbd-key--emoji">${ICONS.kbdEmoji || '☻'}</div>
        <div class="kbd-key kbd-key--space">space</div>
        <div class="kbd-key kbd-key--return">${ICONS.kbdReturn || '⏎'}</div>
      </div>
      <div class="kbd-footer">
        ${ICONS.kbdGlobe || ''}
        ${ICONS.kbdMic || ''}
      </div>
    </div>
  `;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--thread') args.thread = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.thread || !args.out) {
    console.error('Usage: node generate.js --thread path.json --out path.html');
    process.exit(1);
  }
  const thread = JSON.parse(fs.readFileSync(args.thread, 'utf-8'));
  const html = renderHTML(thread);
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, html);
  console.log(`Wrote ${args.out}`);
}

if (require.main === module) main();

module.exports = { renderHTML };
