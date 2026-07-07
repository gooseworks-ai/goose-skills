#!/usr/bin/env node
/**
 * generate.js — Convert a thread JSON into an iMessage-mockup HTML page.
 *
 * Usage (programmatic):
 *   const { renderHTML } = require('./generate');
 *   const html = renderHTML(thread, { mode: 'with-keyboard' });
 *
 * Usage (CLI):
 *   node generate.js --thread examples/dm-with-keyboard.json --mode with-keyboard --out /tmp/index.html
 */

const fs = require('fs');
const path = require('path');
const ICONS = require('./templates/icons');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Trims trailing whitespace; preserves newlines for multi-line bubbles.
// Recognizes inline `[[link:...]]` markers and converts them into iOS-style
// link-detector underlines (matches the way iOS underlines auto-detected codes
// like FREEPACK in the reference ad).
function formatMessageText(s) {
  const escaped = escapeHTML(s).replace(/\n/g, '<br>');
  return escaped.replace(/\[\[link:([^\]]+)\]\]/g, '<span class="link-detector">$1</span>');
}

// Detect a message that's emoji-only (1–3 emoji glyphs) so we can render larger.
function isEmojiOnly(text) {
  if (!text) return false;
  const stripped = text.trim();
  if (!stripped) return false;
  const emojiRe = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍|\s)+$/u;
  return emojiRe.test(stripped) && [...stripped.replace(/\s/g, '')].length <= 6;
}

// ---------------------------------------------------------------------------
// Default participant palette — used when a participant has no explicit color.
// ---------------------------------------------------------------------------

const DEFAULT_AVATAR_COLORS = [
  '#FF9500', // orange
  '#34C759', // green
  '#5AC8FA', // sky
  '#AF52DE', // purple
  '#FF2D55', // pink
  '#5856D6', // indigo
];

function buildParticipantMap(participants = []) {
  const map = new Map();
  let colorIdx = 0;
  for (const p of participants) {
    const color = p.color || DEFAULT_AVATAR_COLORS[colorIdx++ % DEFAULT_AVATAR_COLORS.length];
    const initials = p.initials || (p.name || '?').trim().slice(0, 1).toUpperCase();
    map.set(p.id, { ...p, color, initials });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Header rendering
// ---------------------------------------------------------------------------

function renderDMHeader(thread) {
  // DM: simple title (often "iMessage") + subtitle (timestamp). For the look
  // in CleanShot reference, the chat-header timestamp pill is its own message
  // entry, so the standard header is empty in DM mode (matches the reference).
  // If the thread provides an explicit `header.style: "conversation"`, render
  // the iOS conversation top bar (back, badge, avatar+name, facetime).
  if (thread.header && thread.header.style === 'conversation') {
    return renderConversationHeader(thread);
  }
  return '';
}

function renderConversationHeader(thread) {
  const h = thread.header || {};
  const badge = h.unread != null ? String(h.unread) : '';
  const peer = (thread.participants || []).find(p => !p.self) || {};
  const avatarColor = peer.color || '#6E6E73';
  const avatarInitials = peer.initials || (peer.name || '?').trim().slice(0, 2).toUpperCase();
  const peerName = peer.name || 'Contact';

  return `
    <div class="conv-header">
      <div class="left">
        <div class="back-btn">${ICONS.backArrow}</div>
        ${badge ? `<div class="badge-pill">${escapeHTML(badge)}</div>` : ''}
      </div>
      <div class="center">
        <div class="avatar" style="background:${avatarColor}">${escapeHTML(avatarInitials)}</div>
        <div class="name-pill">${escapeHTML(peerName)} <span class="chev">${ICONS.chevron}</span></div>
      </div>
      <div class="right">
        <div class="facetime-btn">${ICONS.facetime}</div>
      </div>
    </div>
  `;
}

function renderGroupHeader(thread, participantMap) {
  const others = (thread.participants || []).filter(p => !p.self);
  const tilesHTML = others.slice(0, 4).map(p => {
    const meta = participantMap.get(p.id);
    return `<div class="avatar-tile" style="background:${meta.color}">${escapeHTML(meta.initials)}</div>`;
  }).join('');
  return `
    <div class="group-header">
      <div class="avatars">${tilesHTML}</div>
      <div class="group-title">
        ${escapeHTML(thread.title || 'Group')}
        <span class="chevron">${ICONS.chevron}</span>
      </div>
    </div>
  `;
}

// Status bar (only shown when framed)
function renderStatusBar() {
  return `
    <div class="status-bar">
      <div class="time">9:41</div>
      <div class="right-cluster">
        ${ICONS.signal}
        ${ICONS.wifi}
        ${ICONS.battery}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Conversation rendering
// ---------------------------------------------------------------------------

function renderTimestamp(msg) {
  // Accept either: { label: "iMessage\nToday 9:41 AM" }
  // or: { bold: "iMessage", light: "Today 9:41 AM" }
  let bold = msg.bold;
  let light = msg.light;
  if (msg.label && (!bold && !light)) {
    const lines = msg.label.split('\n');
    bold = lines[0];
    light = lines.slice(1).join(' ');
  }
  return `
    <div class="timestamp">
      ${bold ? `<span class="label-bold">${escapeHTML(bold)}</span>` : ''}
      ${light ? `<br><span class="label-light">${escapeHTML(light)}</span>` : ''}
    </div>
  `;
}

function renderAvatar(participant) {
  if (!participant) return `<div class="avatar-slot"></div>`;
  return `<div class="avatar-slot"><div class="avatar" style="background:${participant.color}">${escapeHTML(participant.initials)}</div></div>`;
}

function renderTextBubble(msg, participant, opts) {
  const { isLastOfRun, mode, showAvatar, showSenderName, isFirstOfRun } = opts;
  const isSent = participant && participant.self;
  const tailClass = isLastOfRun ? 'has-tail' : '';
  const sideClass = isSent ? 'sent' : 'received';
  const emojiClass = isEmojiOnly(msg.text) ? 'emoji-only' : '';
  const rowClass = `row ${sideClass}${isFirstOfRun ? ' first-of-run' : ' tight'}`;
  const animClass = msg.popState === 'pending' ? 'pop-pending'
                  : msg.popState === 'now' ? 'pop-now' : '';
  const dataAnim = msg.id ? ` data-anim-id="${escapeHTML(msg.id)}"` : '';
  const pendingAttr = msg.popState === 'pending' ? ' data-pending="1"' : '';

  let html = '';

  if (!isSent && showSenderName && isFirstOfRun) {
    html += `<div class="sender-name">${escapeHTML(participant.name)}</div>`;
  }

  html += `<div class="${rowClass}"${dataAnim}${pendingAttr}>`;
  if (!isSent && showAvatar) {
    if (isLastOfRun) {
      html += renderAvatar(participant);
    } else {
      html += `<div class="avatar-slot"></div>`;
    }
  }
  html += `<div class="bubble ${sideClass} ${tailClass} ${emojiClass} ${animClass}">${formatMessageText(msg.text)}</div>`;
  html += `</div>`;

  if (isSent && msg.delivered && isLastOfRun) {
    const capAnim = msg.popState === 'pending' ? 'pop-pending'
                  : msg.popState === 'now' ? 'pop-now' : '';
    const capPending = msg.popState === 'pending' ? ' data-pending="1"' : '';
    const capId = msg.id ? ` data-cap-id="${escapeHTML(msg.id)}"` : '';
    html += `<div class="delivered-caption ${capAnim}"${capPending}${capId}>${msg.read ? '<span class="read">Read</span>' : 'Delivered'}</div>`;
  }

  return html;
}

function renderAttachment(msg, participant, opts) {
  const isSent = participant && participant.self;
  const sideClass = isSent ? 'sent' : 'received';
  const animClass = msg.popState === 'pending' ? 'pop-pending'
                  : msg.popState === 'now' ? 'pop-now' : '';
  const dataAnim = msg.id ? ` data-anim-id="${escapeHTML(msg.id)}"` : '';
  const pendingAttr = msg.popState === 'pending' ? ' data-pending="1"' : '';
  const src = msg.src || '';
  const title = msg.title || '';
  const subtitle = msg.subtitle || '';
  return `
    <div class="row attachment ${sideClass} ${animClass}"${dataAnim}${pendingAttr}>
      <div class="attachment-card">
        ${src ? `<img src="${escapeHTML(src)}" alt="">` : ''}
      </div>
      ${(title || subtitle) ? `<div class="attachment-meta">
        ${title ? `<div class="title">${escapeHTML(title)}</div>` : ''}
        ${subtitle ? `<div class="subtitle">${escapeHTML(subtitle)}</div>` : ''}
      </div>` : ''}
    </div>
  `;
}

function renderTypingBubble(msg, participant, opts) {
  const { mode, showAvatar } = opts;
  msg = msg || {};
  const animClass = msg.popState === 'pending' ? 'pop-pending'
                  : msg.popState === 'now' ? 'pop-now' : '';
  const dataAnim = msg.id ? ` data-anim-id="${escapeHTML(msg.id)}"` : '';
  const pendingAttr = msg.popState === 'pending' ? ' data-pending="1"' : '';
  let html = `<div class="row received first-of-run"${dataAnim}${pendingAttr}>`;
  if (showAvatar) html += renderAvatar(participant);
  html += `
    <div class="bubble received has-tail typing ${animClass}">
      <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    </div>
  </div>`;
  return html;
}

function renderConversation(thread, participantMap, mode) {
  const isGroup = thread.mode === 'group';
  const messages = thread.messages || [];

  // Pre-compute "last of run" by walking forward.
  // A "run" is a contiguous sequence of text/typing messages from the same sender.
  const runFlags = messages.map((m, i) => {
    if (m.type !== 'text' && m.type !== 'typing') return { isFirstOfRun: false, isLastOfRun: false };
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const samePrev = prev && (prev.type === 'text' || prev.type === 'typing') && prev.from === m.from;
    const sameNext = next && (next.type === 'text' || next.type === 'typing') && next.from === m.from;
    return { isFirstOfRun: !samePrev, isLastOfRun: !sameNext };
  });

  const out = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.type === 'timestamp') {
      out.push(renderTimestamp(m));
    } else if (m.type === 'text') {
      const participant = participantMap.get(m.from);
      out.push(renderTextBubble(m, participant, {
        ...runFlags[i],
        mode,
        showAvatar: isGroup && participant && !participant.self,
        showSenderName: isGroup && participant && !participant.self,
      }));
    } else if (m.type === 'typing') {
      const participant = participantMap.get(m.from);
      out.push(renderTypingBubble(m, participant, {
        mode,
        showAvatar: isGroup && participant && !participant.self,
      }));
    } else if (m.type === 'attachment') {
      const participant = participantMap.get(m.from);
      out.push(renderAttachment(m, participant, { mode }));
    }
  }
  return `<div class="conversation">${out.join('\n')}</div>`;
}

// ---------------------------------------------------------------------------
// Keyboard
// ---------------------------------------------------------------------------

function renderKeyboard(thread) {
  const leftIcon = (thread.keyboard && thread.keyboard.leftIcon) || 'plus';
  const iconSVG = ICONS[leftIcon] || ICONS.plus;
  const composer = (thread.composer || {});
  const hasText = composer.text != null && composer.text !== '';
  const showCaret = composer.cursor !== false; // default true when there is text
  const inputClass = hasText ? 'input has-text' : 'input';
  const composerInner = hasText
    ? `<span class="composer-text" data-composer-text>${escapeHTML(composer.text)}</span>${showCaret ? '<span class="caret"></span>' : ''}<span class="send-btn">${ICONS.sendArrow}</span>`
    : `<span class="placeholder">iMessage</span><span class="mic">${ICONS.mic}</span>`;
  return `
    <div class="keyboard">
      <div class="left-btn">${iconSVG}</div>
      <div class="${inputClass}">
        ${composerInner}
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

function renderHTML(thread, options = {}) {
  const mode = options.mode || 'with-keyboard'; // minimal | with-keyboard | with-iphone-frame
  const participantMap = buildParticipantMap(thread.participants || []);
  const isGroup = thread.mode === 'group';
  const css = loadCSS();

  const headerHTML = isGroup
    ? renderGroupHeader(thread, participantMap)
    : renderDMHeader(thread);

  const conversationHTML = renderConversation(thread, participantMap, mode);
  const keyboardHTML = (mode === 'with-keyboard' || mode === 'with-iphone-frame') ? '' : '';
  // ^ We render the keyboard only for `with-keyboard` mode and as an internal
  // element in `with-iphone-frame`. Hold for now; assigned per branch below.

  if (mode === 'with-iphone-frame') {
    const keyboard = renderKeyboard(thread);
    // Honor a dark thread theme natively (frame mode used to hard-code light,
    // forcing consumers to string-replace `theme-dark` onto <html>/<body>).
    // Light mode remains the default when theme !== 'dark' (backward compatible).
    const isDark = thread.theme === 'dark';
    const htmlClass = isDark ? ' class="theme-dark"' : '';
    const bodyClass = isDark ? 'framed theme-dark' : 'framed';
    return `<!DOCTYPE html>
<html${htmlClass}><head><meta charset="utf-8"><style>${css}</style></head>
<body class="${bodyClass}">
  <div class="iphone-frame">
    <div class="dynamic-island"></div>
    <div class="screen">
      <div class="stage">
        ${renderStatusBar()}
        ${headerHTML}
        ${conversationHTML}
        ${keyboard}
      </div>
    </div>
  </div>
</body></html>`;
  }

  if (mode === 'with-keyboard') {
    return `<!DOCTYPE html>
<html class="${thread.theme === 'dark' ? 'theme-dark' : ''}"><head><meta charset="utf-8"><style>${css}</style></head>
<body class="with-keyboard fill-viewport ${thread.theme === 'dark' ? 'theme-dark' : ''}">
  <div class="stage">
    ${headerHTML}
    ${conversationHTML}
    ${renderKeyboard(thread)}
  </div>
</body></html>`;
  }

  // minimal
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${css}</style></head>
<body class="minimal ${thread.theme === 'dark' ? 'theme-dark' : ''}">
  <div class="stage">
    ${conversationHTML}
  </div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--thread') args.thread = argv[++i];
    else if (argv[i] === '--mode') args.mode = argv[++i];
    else if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.thread || !args.out) {
    console.error('Usage: node generate.js --thread path.json --mode <minimal|with-keyboard|with-iphone-frame> --out path.html');
    process.exit(1);
  }
  const thread = JSON.parse(fs.readFileSync(args.thread, 'utf-8'));
  const html = renderHTML(thread, { mode: args.mode || 'with-keyboard' });
  fs.mkdirSync(path.dirname(args.out), { recursive: true });
  fs.writeFileSync(args.out, html);
  console.log(`Wrote ${args.out}`);
}

if (require.main === module) main();

module.exports = { renderHTML, buildParticipantMap };
