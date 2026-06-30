#!/usr/bin/env node
/**
 * generate.js — Static iOS QWERTY keyboard as inline HTML+CSS.
 */

const fs = require('fs');
const path = require('path');

const ROWS = {
  'qwerty-lower': [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
  ],
  'qwerty-upper': [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M'],
  ],
  'numbers': [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['-','/',':',';','(',')','$','&','@','"'],
    ['.',',','?','!',"'"],
  ],
};

const SHIFT_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 L4 12 H8 V20 H16 V12 H20 Z"/></svg>`;
const BACKSPACE_SVG = `<svg width="32" height="22" viewBox="0 0 32 22" fill="none" stroke="#0D0D0D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 L2 11 L10 20 H28 V2 Z"/><path d="M16 7 L24 15 M24 7 L16 15"/></svg>`;
const RETURN_SVG = `<svg width="28" height="24" viewBox="0 0 28 24" fill="none" stroke="#0D0D0D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 5 V12 H6 M10 8 L6 12 L10 16"/></svg>`;
const GLOBE_SVG = `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12 H21.5 M12 2.5 V21.5 M5 5.5 Q12 10 19 5.5 M5 18.5 Q12 14 19 18.5 M12 2.5 C7 7 7 17 12 21.5 M12 2.5 C17 7 17 17 12 21.5"/></svg>`;
const MIC_SVG = `<svg width="26" height="34" viewBox="0 0 24 28" fill="#0D0D0D"><path d="M12 16a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6.5A3.5 3.5 0 0 0 12 16z"/><path d="M19 12.5a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V22h-2.25a1 1 0 0 0 0 2h6.5a1 1 0 0 0 0-2H13v-2.57A7 7 0 0 0 19 12.5z"/></svg>`;
const EMOJI_SVG = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10" r="1" fill="#0D0D0D" stroke="none"/><circle cx="15" cy="10" r="1" fill="#0D0D0D" stroke="none"/><path d="M8 15 Q12 18 16 15"/></svg>`;

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderKeyboardCSS() {
  return fs.readFileSync(path.join(__dirname, 'templates', 'keyboard.css'), 'utf-8');
}

function renderKeyboardHTML(opts = {}) {
  const suggestions = opts.suggestions || ['I', 'The', "I'm"];
  const layout = opts.layout || 'qwerty-lower';
  const rows = ROWS[layout] || ROWS['qwerty-lower'];

  const sugHTML = suggestions
    .map(s => `<span class="kb-suggestion">${escapeHTML(s)}</span>`)
    .join('');

  // Row 1 (10 keys), Row 2 (9 keys, indented by ~half-key), Row 3 (shift + 7 keys + backspace)
  const row1 = rows[0]
    .map(k => `<div class="kb-key">${escapeHTML(k)}</div>`)
    .join('');
  const row2 = rows[1]
    .map(k => `<div class="kb-key">${escapeHTML(k)}</div>`)
    .join('');
  const row3Keys = rows[2]
    .map(k => `<div class="kb-key">${escapeHTML(k)}</div>`)
    .join('');

  const shiftKey = layout === 'numbers'
    ? `<div class="kb-key modifier">#+=</div>`
    : `<div class="kb-key modifier">${SHIFT_SVG}</div>`;
  const backspaceKey = `<div class="kb-key modifier">${BACKSPACE_SVG}</div>`;

  const switchKey = layout === 'numbers'
    ? `<div class="kb-key special-123">ABC</div>`
    : `<div class="kb-key special-123">123</div>`;

  return `<div class="ios-keyboard" data-layout="${layout}">
  <div class="kb-suggestions">${sugHTML}</div>
  <div class="kb-row row-1">${row1}</div>
  <div class="kb-row row-2"><div style="flex:0 0 18px"></div>${row2}<div style="flex:0 0 18px"></div></div>
  <div class="kb-row row-3">${shiftKey}${row3Keys}${backspaceKey}</div>
  <div class="kb-row row-bottom">
    ${switchKey}
    <div class="kb-key special-emoji">${EMOJI_SVG}</div>
    <div class="kb-key special-space">space</div>
    <div class="kb-key special-return">${RETURN_SVG}</div>
  </div>
  <div class="kb-system-row">
    ${GLOBE_SVG}
    ${MIC_SVG}
  </div>
</div>`;
}

module.exports = { renderKeyboardHTML, renderKeyboardCSS };
