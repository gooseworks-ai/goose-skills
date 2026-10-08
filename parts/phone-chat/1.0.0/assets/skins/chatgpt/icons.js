// SVG icon snippets used by the ChatGPT chat templates.
// Goal: match the real ChatGPT mobile (iOS) chrome 1:1 — stroke weights,
// proportions, and corner radii are tuned to the reference screenshots.

const ICONS = {
  // Hamburger / sidebar toggle — two short stacked lines with the bottom one
  // recessed (matches ChatGPT iOS: the icon reads as "≡" with bottom line shorter).
  hamburger: `<svg width="30" height="22" viewBox="0 0 22 16" fill="none"><path d="M2 4 H20" stroke="#0D0D0D" stroke-width="2.2" stroke-linecap="round"/><path d="M2 12 H14" stroke="#0D0D0D" stroke-width="2.2" stroke-linecap="round"/></svg>`,

  // Down chevron next to "ChatGPT 5.1" model name.
  chevronDown: `<svg width="18" height="12" viewBox="0 0 13 8" fill="none"><path d="M1.5 1.5 L6.5 6 L11.5 1.5" stroke="#0D0D0D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  // Right chevron used when model name is just "ChatGPT >"
  chevronRight: `<svg width="11" height="17" viewBox="0 0 8 13" fill="none"><path d="M1.5 1.5 L6 6.5 L1.5 11.5" stroke="#9B9B9B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  // Top-right person-plus (invite/share-with-people).
  personPlus: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="8" r="3.5"/><path d="M3.5 19c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M18 6v6 M15 9h6"/></svg>`,

  // Top-right dotted circle (voice / siri-like indicator).
  dottedCircle: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 3"><circle cx="12" cy="12" r="9.5"/></svg>`,

  // Edit / new-chat (pencil-in-square) used in some references.
  editPencil: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z"/><path d="M14 7l3 3"/></svg>`,

  // Three-dot menu in upper-right.
  moreDots: `<svg width="30" height="30" viewBox="0 0 24 24" fill="#0D0D0D"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>`,

  // Composer "+" (left side).
  plus: `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,

  // Composer mic.
  mic: `<svg width="24" height="30" viewBox="0 0 24 28" fill="#0D0D0D"><path d="M12 16a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6.5A3.5 3.5 0 0 0 12 16z"/><path d="M19 12.5a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V22h-2.25a1 1 0 0 0 0 2h6.5a1 1 0 0 0 0-2H13v-2.57A7 7 0 0 0 19 12.5z"/></svg>`,

  // Composer send-arrow (up). Sits inside the round send button.
  sendArrow: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19 V5 M5 12 L12 5 L19 12"/></svg>`,

  // ChatGPT spiral logo (assistant icon next to a response).
  // Simplified geometric stand-in for the OpenAI mark — works at small sizes.
  openaiSpiral: `<svg width="22" height="22" viewBox="0 0 41 41" fill="none"><path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.49932C30.0864 3.63105 27.9098 3.40828 25.8244 3.86289C24.8842 2.80055 23.7288 1.95057 22.4347 1.36825C21.1407 0.785923 19.7373 0.484487 18.3174 0.485103C16.1825 0.480239 14.0995 1.1514 12.3672 2.40158C10.6349 3.65176 9.34433 5.41912 8.6795 7.44941C7.28685 7.73495 5.97032 8.31504 4.81725 9.15054C3.66417 9.98603 2.70047 11.0578 1.98744 12.2937C0.91691 14.1419 0.46128 16.2832 0.687283 18.4071C0.913286 20.5311 1.81051 22.528 3.24024 24.1101C2.79189 25.4566 2.63634 26.8833 2.78409 28.2948C2.93184 29.7063 3.37938 31.0699 4.09676 32.2945C5.16016 34.1467 6.78457 35.6131 8.73546 36.4814C10.6864 37.3496 12.8629 37.5724 14.9483 37.1178C15.8884 38.18 17.0438 39.0301 18.3379 39.6124C19.6319 40.1948 21.0355 40.4962 22.4554 40.4956C24.5917 40.4969 26.6753 39.8251 28.4082 38.5743C30.1411 37.3236 31.4316 35.5553 32.0953 33.5239C33.4879 33.2383 34.8044 32.6583 35.9575 31.8228C37.1105 30.9873 38.0743 29.9156 38.7873 28.6797C39.8564 26.8321 40.3105 24.6925 40.0838 22.5701C39.8571 20.4476 38.9611 18.4523 37.5324 16.8707ZM22.4567 37.8505C20.7027 37.853 19.0043 37.2389 17.6571 36.1147C17.7181 36.0814 17.8247 36.0234 17.8942 35.9805L25.1932 31.7672C25.3759 31.6633 25.5278 31.5126 25.6336 31.3305C25.7395 31.1485 25.7953 30.9416 25.7956 30.7308V20.4429L28.8796 22.2233C28.8961 22.2316 28.9105 22.2437 28.9214 22.2587C28.9323 22.2737 28.9395 22.2911 28.9425 22.3095V30.8264C28.9401 32.6797 28.2 34.4561 26.8849 35.7669C25.5698 37.0778 23.7891 37.8154 21.9329 37.8222L22.4567 37.8505ZM6.39281 30.9716C5.51307 29.4524 5.19639 27.6748 5.49989 25.9447C5.55891 25.9802 5.66258 26.0444 5.7359 26.0863L13.0349 30.2997C13.2168 30.4063 13.4242 30.4625 13.6354 30.4625C13.8465 30.4625 14.054 30.4063 14.2358 30.2997L23.1442 25.1551V28.7159C23.1453 28.7345 23.1419 28.7531 23.1342 28.7701C23.1265 28.7872 23.1148 28.8022 23.1 28.8138L15.7221 33.0758C14.1187 34.0008 12.2123 34.2515 10.4234 33.7732C8.63446 33.295 7.10978 32.1259 6.19785 30.5234L6.39281 30.9716ZM4.47084 14.8784C5.34741 13.3535 6.74305 12.1929 8.40554 11.6094C8.40554 11.679 8.40159 11.8004 8.40159 11.8854V20.3081C8.40044 20.5165 8.45487 20.7215 8.55925 20.9023C8.66362 21.0832 8.81434 21.2337 8.99632 21.3389L17.9078 26.4807L14.823 28.2611C14.8075 28.2706 14.7901 28.2761 14.7723 28.2772C14.7544 28.2782 14.7365 28.2748 14.7203 28.2671L7.34122 24.0014C5.74174 23.0791 4.57391 21.5535 4.09405 19.7621C3.61419 17.9707 3.86074 16.0641 4.79922 14.4543L4.47084 14.8784ZM30.7269 21.0157L21.8146 15.8854L24.8995 14.1061C24.915 14.0965 24.9324 14.0911 24.9502 14.0901C24.9681 14.0891 24.986 14.0925 25.0022 14.1001L32.3812 18.3617C33.5273 19.024 34.4666 19.9881 35.0974 21.1497C35.7283 22.3114 36.0258 23.6249 35.9568 24.9437C35.8879 26.2624 35.4552 27.5377 34.7066 28.6275C33.958 29.7174 32.9237 30.5825 31.7146 31.1289C31.7146 31.0588 31.7146 30.9379 31.7146 30.8533V22.4306C31.7164 22.2222 31.6627 22.0171 31.5588 21.836C31.4548 21.6549 31.3046 21.504 31.1228 21.3984L30.7269 21.0157ZM33.7965 16.5276C33.7378 16.4915 33.6342 16.4278 33.5605 16.3859L26.2615 12.1726C26.0793 12.066 25.8718 12.0098 25.6605 12.0098C25.4493 12.0098 25.2418 12.066 25.0596 12.1726L16.1591 17.3172V13.7563C16.1581 13.7378 16.1614 13.7193 16.1689 13.7022C16.1764 13.6852 16.1879 13.6702 16.2026 13.6585L23.5816 9.40149C24.7287 8.73987 26.0383 8.40868 27.366 8.44665C28.6937 8.48462 29.9818 8.89058 31.0884 9.61725C32.1949 10.3439 33.0772 11.3622 33.6394 12.5586C34.2017 13.755 34.4225 15.0824 34.2767 16.3941L33.7965 16.5276ZM14.4844 22.7795L11.3995 21.0014C11.383 20.9931 11.3686 20.9809 11.3577 20.9659C11.3469 20.951 11.3399 20.9335 11.337 20.9152V12.3984C11.3382 11.0394 11.7271 9.70991 12.4587 8.56559C13.1903 7.42128 14.2342 6.50777 15.4659 5.93343C16.6977 5.35908 18.0667 5.14736 19.4111 5.32274C20.7556 5.49813 22.0223 6.05331 23.0635 6.92265C23.0026 6.95591 22.8957 7.01396 22.8262 7.05591L15.5273 11.2692C15.3454 11.3741 15.1944 11.5249 15.0892 11.7065C14.9839 11.8881 14.928 12.094 14.928 12.3034L14.4844 22.7795ZM16.1593 19.1581L20.1262 16.8635L24.0928 19.1581V23.7459L20.1262 26.0406L16.1593 23.7459V19.1581Z" fill="#0D0D0D"/></svg>`,

  // Thumbs-up / down for assistant message feedback chips.
  thumbsUp: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11H4a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h3z"/><path d="M7 10l4-7c1.7 0 2.5 1 2.3 2.4L13 10h5.6a2 2 0 0 1 2 2.3l-1.2 6.4A2 2 0 0 1 17.4 21H7"/></svg>`,
  thumbsDown: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7A7A7A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3z"/><path d="M17 14l-4 7c-1.7 0-2.5-1-2.3-2.4L11 14H5.4a2 2 0 0 1-2-2.3l1.2-6.4A2 2 0 0 1 6.6 3H17"/></svg>`,

  // iPhone status bar icons (right cluster).
  signal: `<svg width="17" height="11" viewBox="0 0 17 11" fill="#0D0D0D"><rect x="0" y="7" width="3" height="4" rx="0.7"/><rect x="4.5" y="5" width="3" height="6" rx="0.7"/><rect x="9" y="3" width="3" height="8" rx="0.7"/><rect x="13.5" y="0" width="3" height="11" rx="0.7"/></svg>`,
  wifi: `<svg width="17" height="12" viewBox="0 0 17 12" fill="#0D0D0D"><path d="M8.5 0C5.4 0 2.55 1.13 .35 3 a.75.75 0 0 0-.05 1.05l1 1.07a.74.74 0 0 0 1.05.05A10 10 0 0 1 8.5 2.5a10 10 0 0 1 6.15 2.67.74.74 0 0 0 1.05-.05l1-1.07A.75.75 0 0 0 16.65 3 C 14.45 1.13 11.6 0 8.5 0z"/><path d="M8.5 4a8 8 0 0 0-5.4 2.07.74.74 0 0 0-.04 1.05l1.04 1.13a.74.74 0 0 0 1.05.04A6 6 0 0 1 8.5 6.5a6 6 0 0 1 3.35 1.79.74.74 0 0 0 1.05-.04l1.04-1.13a.74.74 0 0 0-.04-1.05A8 8 0 0 0 8.5 4z"/><path d="M8.5 8a3.5 3.5 0 0 0-2.4.95.74.74 0 0 0-.05 1.05l1.85 2 a.75.75 0 0 0 1.1 0l1.85-2a.74.74 0 0 0-.05-1.05A3.5 3.5 0 0 0 8.5 8z"/></svg>`,
  battery: `<svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="#0D0D0D" stroke-opacity="0.35"/><rect x="2" y="2" width="19" height="9" rx="2" fill="#0D0D0D"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#0D0D0D" fill-opacity="0.35"/></svg>`,

  // Moon glyph that shows next to the time when Focus / Do-Not-Disturb is on.
  // The reference Bioma screenshot shows "08:18 ☾" — render that subtle moon.
  moonDND: `<svg width="13" height="13" viewBox="0 0 13 13" fill="#0D0D0D"><path d="M11.5 8.2a4.7 4.7 0 1 1-6.7-5.7 5 5 0 1 0 6.7 5.7z"/></svg>`,

  // Stop / square icon shown inside the send button while a response is streaming.
  stopSquare: `<svg width="18" height="18" viewBox="0 0 14 14" fill="#FFFFFF"><rect x="2" y="2" width="10" height="10" rx="1.5"/></svg>`,

  // -------- Keyboard glyphs (ported from create-apple-notes-mockup) --------
  kbdShift: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#1c1c1e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 5 L5 16 H11 V26 H21 V16 H27 Z"/></svg>`,
  kbdBackspace: `<svg width="40" height="28" viewBox="0 0 40 28" fill="none" stroke="#1c1c1e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13 3 L3 14 L13 25 H35 V3 Z"/><path d="M19 9 L29 19 M29 9 L19 19"/></svg>`,
  kbdReturn: `<svg width="34" height="28" viewBox="0 0 34 28" fill="none" stroke="#1c1c1e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M28 5 V14 H8 M14 10 L8 14 L14 18"/></svg>`,
  kbdGlobe: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12 H21.5 M12 2.5 V21.5 M5 5.5 Q12 10 19 5.5 M5 18.5 Q12 14 19 18.5 M12 2.5 C7 7 7 17 12 21.5 M12 2.5 C17 7 17 17 12 21.5"/></svg>`,
  kbdMic: `<svg width="28" height="36" viewBox="0 0 24 28" fill="#1c1c1e"><path d="M12 16a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v6.5A3.5 3.5 0 0 0 12 16z"/><path d="M19 12.5a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V22h-2.25a1 1 0 0 0 0 2h6.5a1 1 0 0 0 0-2H13v-2.57A7 7 0 0 0 19 12.5z"/></svg>`,
  kbdEmoji: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1c1c1e" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><circle cx="9" cy="10" r="1" fill="#1c1c1e" stroke="none"/><circle cx="15" cy="10" r="1" fill="#1c1c1e" stroke="none"/><path d="M8 15 Q12 18 16 15"/></svg>`,
};

module.exports = ICONS;
