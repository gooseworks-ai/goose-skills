// SVG icon snippets used by the chat templates.

const ICONS = {
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  camera: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 5l-1.2 1.6a1.4 1.4 0 0 1-1.1.55H4.6A2.6 2.6 0 0 0 2 9.75v8.4A2.6 2.6 0 0 0 4.6 20.75h14.8A2.6 2.6 0 0 0 22 18.15v-8.4a2.6 2.6 0 0 0-2.6-2.6h-2.5a1.4 1.4 0 0 1-1.1-.55L14.6 5z"/><circle cx="12" cy="13.5" r="3.6" fill="#D1D3D9"/></svg>`,
  mic: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/><path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.08A7 7 0 0 0 19 11z"/></svg>`,
  signal: `<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.7"/><rect x="4.5" y="5" width="3" height="6" rx="0.7"/><rect x="9" y="3" width="3" height="8" rx="0.7"/><rect x="13.5" y="0" width="3" height="11" rx="0.7"/></svg>`,
  wifi: `<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor"><path d="M8.5 0C5.4 0 2.55 1.13 .35 3 a.75.75 0 0 0-.05 1.05l1 1.07a.74.74 0 0 0 1.05.05A10 10 0 0 1 8.5 2.5a10 10 0 0 1 6.15 2.67.74.74 0 0 0 1.05-.05l1-1.07A.75.75 0 0 0 16.65 3 C 14.45 1.13 11.6 0 8.5 0z"/><path d="M8.5 4a8 8 0 0 0-5.4 2.07.74.74 0 0 0-.04 1.05l1.04 1.13a.74.74 0 0 0 1.05.04A6 6 0 0 1 8.5 6.5a6 6 0 0 1 3.35 1.79.74.74 0 0 0 1.05-.04l1.04-1.13a.74.74 0 0 0-.04-1.05A8 8 0 0 0 8.5 4z"/><path d="M8.5 8a3.5 3.5 0 0 0-2.4.95.74.74 0 0 0-.05 1.05l1.85 2 a.75.75 0 0 0 1.1 0l1.85-2a.74.74 0 0 0-.05-1.05A3.5 3.5 0 0 0 8.5 8z"/></svg>`,
  battery: `<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#000" stroke-opacity="0.35"/><rect x="2" y="2" width="19" height="9" rx="2" fill="#000"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#000" fill-opacity="0.35"/></svg>`,
  chevron: `<svg width="6" height="9" viewBox="0 0 6 9" fill="none"><path d="M1 1l3.5 3.5L1 8" stroke="#C7C7CC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  videoCall: `<svg width="22" height="14" viewBox="0 0 22 14" fill="#0B84FE"><rect x="0" y="0" width="15" height="14" rx="2.5"/><path d="M16 4 L22 1 V13 L16 10 Z"/></svg>`,
  // Back chevron (pointing left) used in the iMessage conversation header.
  backArrow: `<svg width="14" height="22" viewBox="0 0 14 22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2 L2 11 L11 20"/></svg>`,
  // FaceTime camera glyph for the right side of the conversation header.
  facetime: `<svg width="26" height="20" viewBox="0 0 26 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="16" height="14" rx="3.5"/><path d="M18 8 L24 4 V16 L18 12 Z" fill="currentColor"/></svg>`,
  // Send-button up-arrow used inside the composer when text is present.
  sendArrow: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19 V5 M5 12 L12 5 L19 12"/></svg>`,
};

module.exports = ICONS;
