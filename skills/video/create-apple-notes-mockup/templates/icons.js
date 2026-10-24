// SVG icon snippets used by the Apple Notes template.

const ICONS = {
  // Back chevron — thin, dark, used inside the white circle pill at top-left.
  backChevron: `<svg width="22" height="36" viewBox="0 0 22 36" fill="none" stroke="#1c1c1e" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4 L4 18 L16 32"/></svg>`,

  // Undo (curved-arrow-left) in the toolbar capsule.
  undo: `<svg width="56" height="56" viewBox="0 0 40 40" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18 C 9 11 14 6 21 6 C 28 6 33 11 33 18 C 33 25 28 30 21 30"/><path d="M9 18 L4 13 M9 18 L14 13"/></svg>`,

  // Share — square with up-arrow exiting the top.
  share: `<svg width="50" height="58" viewBox="0 0 36 42" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4 L18 27"/><path d="M11 10 L18 4 L25 10"/><path d="M7 19 L7 36 H29 V19" /></svg>`,

  // More (three horizontal dots).
  more: `<svg width="60" height="20" viewBox="0 0 44 14" fill="#1c1c1e"><circle cx="6" cy="7" r="3.6"/><circle cx="22" cy="7" r="3.6"/><circle cx="38" cy="7" r="3.6"/></svg>`,

  // Done checkmark — solid white on yellow circle.
  done: `<svg width="44" height="32" viewBox="0 0 44 32" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17 L17 28 L39 5"/></svg>`,

  // Status-bar signal bars.
  signal: `<svg width="46" height="30" viewBox="0 0 34 22" fill="#000"><rect x="0" y="14" width="6" height="8" rx="1.2"/><rect x="9" y="10" width="6" height="12" rx="1.2"/><rect x="18" y="6" width="6" height="16" rx="1.2"/><rect x="27" y="2" width="6" height="20" rx="1.2"/></svg>`,

  // Status-bar wifi.
  wifi: `<svg width="50" height="34" viewBox="0 0 36 24" fill="#000"><path d="M18 0 C 11.4 0 5.3 2.4 .6 6.4 c -.6 .5 -.7 1.4 -.1 2 l 2 2.2 c .5 .6 1.4 .6 2 .1 A 19 19 0 0 1 18 5 a 19 19 0 0 1 13.5 5.7 c .6 .5 1.5 .5 2 -.1 l 2 -2.2 c .6 -.6 .5 -1.5 -.1 -2 C 30.7 2.4 24.6 0 18 0 Z"/><path d="M18 8.5 a 14 14 0 0 0 -10 4.1 c -.6 .5 -.6 1.4 -.1 2 l 2.1 2.3 c .5 .6 1.4 .6 2 .1 A 8.5 8.5 0 0 1 18 14 a 8.5 8.5 0 0 1 6 2.9 c .6 .5 1.5 .5 2 -.1 l 2.1 -2.3 c .5 -.6 .5 -1.5 -.1 -2 A 14 14 0 0 0 18 8.5 z"/><path d="M18 16.5 a 6 6 0 0 0 -4.2 1.7 c -.6 .5 -.6 1.4 -.1 2 l 3.5 3.8 a 1.1 1.1 0 0 0 1.6 0 l 3.5 -3.8 c .6 -.6 .5 -1.5 -.1 -2 A 6 6 0 0 0 18 16.5 z"/></svg>`,

  // Status-bar battery — accepts a `pct` and `low` flag to colorize fill.
  battery: ({ pct = 87, low = false } = {}) => {
    const fillColor = low ? '#FF3B30' : '#000';
    const innerMaxW = 46;
    const innerW = Math.max(2, Math.round((pct / 100) * innerMaxW));
    return `<svg width="82" height="36" viewBox="0 0 60 26" fill="none"><rect x="1" y="1" width="50" height="24" rx="7" stroke="#000" stroke-opacity="0.4" stroke-width="2" fill="none"/><rect x="3" y="3" width="${innerW}" height="20" rx="4.5" fill="${fillColor}"/><rect x="53" y="9" width="4" height="10" rx="1.4" fill="#000" fill-opacity="0.4"/></svg>`;
  },

  // Car-mode indicator (the little bed-shaped glyph next to time in the reference).
  // Reference shows what looks like a "do not disturb / focus" mode glyph.
  focusBed: `<svg width="34" height="22" viewBox="0 0 34 22" fill="#000"><path d="M3 14 V19 H5 V17 H29 V19 H31 V14 a4 4 0 0 0 -4 -4 H14 V6 a2 2 0 0 0 -2 -2 H5 a2 2 0 0 0 -2 2 z M5 6 H12 V10 H5 z"/></svg>`,

  // ---- Keyboard formatting toolbar icons (above the keys) ----
  formatAa: `<svg width="74" height="50" viewBox="0 0 56 38" fill="#1c1c1e"><text x="0" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="600">A</text><text x="26" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="22" font-weight="400">a</text></svg>`,
  formatChecklist: `<svg width="64" height="58" viewBox="0 0 48 44" fill="none" stroke="#1c1c1e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="10" r="6"/><path d="M5 10 L7.5 12.5 L11 8" stroke-width="2"/><circle cx="8" cy="32" r="6"/><path d="M20 10 L44 10 M20 32 L44 32"/></svg>`,
  formatTable: `<svg width="64" height="50" viewBox="0 0 48 38" fill="none" stroke="#1c1c1e" stroke-width="2.4"><rect x="2" y="4" width="44" height="30" rx="3"/><path d="M2 14 L46 14 M2 24 L46 24 M16 4 L16 34 M32 4 L32 34"/></svg>`,
  formatAttach: `<svg width="48" height="58" viewBox="0 0 36 44" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round"><path d="M28 14 L28 32 a10 10 0 0 1 -20 0 L8 12 a6 6 0 0 1 12 0 L20 30 a3 3 0 0 1 -6 0 L14 14"/></svg>`,
  formatPen: `<svg width="58" height="58" viewBox="0 0 44 44" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="22" cy="22" r="18"/><path d="M16 30 L18 24 L28 14 L32 18 L22 28 L16 30 Z" fill="#1c1c1e"/></svg>`,
  formatAi: `<svg width="64" height="58" viewBox="0 0 48 44" fill="none" stroke="#1c1c1e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="24" cy="22" rx="20" ry="9"/><ellipse cx="24" cy="22" rx="9" ry="20"/><ellipse cx="24" cy="22" rx="20" ry="9" transform="rotate(45 24 22)"/></svg>`,

  // ---- Keyboard bottom-row icons ----
  globe: `<svg width="46" height="46" viewBox="0 0 46 46" fill="none" stroke="#1c1c1e" stroke-width="2.4"><circle cx="23" cy="23" r="20"/><ellipse cx="23" cy="23" rx="20" ry="8"/><ellipse cx="23" cy="23" rx="8" ry="20"/><path d="M3 23 L43 23 M23 3 L23 43"/></svg>`,
  mic: `<svg width="40" height="48" viewBox="0 0 40 48" fill="#1c1c1e"><rect x="13" y="2" width="14" height="24" rx="7"/><path d="M6 22 a14 14 0 0 0 28 0" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round"/><path d="M20 36 L20 44 M12 44 L28 44" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  shift: `<svg width="40" height="36" viewBox="0 0 40 36" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 4 L4 18 L12 18 L12 32 L28 32 L28 18 L36 18 Z"/></svg>`,
  backspace: `<svg width="48" height="36" viewBox="0 0 48 36" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4 L44 4 L44 32 L14 32 L2 18 Z"/><path d="M22 12 L34 24 M34 12 L22 24"/></svg>`,
  returnArrow: `<svg width="48" height="40" viewBox="0 0 48 40" fill="none" stroke="#1c1c1e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M42 8 L42 20 L10 20"/><path d="M18 12 L10 20 L18 28"/></svg>`,
};

module.exports = ICONS;
