// The iMessage skin: render-imessage-chat (and the create-imessage-mockup page it
// bundles) as one frame-stepped page. A DM or group thread inside a framed
// iPhone with an inset Dynamic Island, the original send/receive sounds, typed
// composer text equal to the sent text, reactions, attachments anywhere, and the
// newest row kept clear of the TikTok/Reels controls (QA-60). Movie time drives
// everything: the page draws the state at `seek(ms)` from one event timeline,
// so browser start-up or machine speed never changes a frame.
// Pure: no imports; every top-level name starts with `im`/`IM_`.

const IM_TIMING = {
  start: 0.4,
  received_gap: 0.75,
  emoji_gap: 0.55,
  typing_dwell: 1,
  self_pre: 0.3,
  send_hold: 0.1,
  attach_dwell: 3.6,
  tail_hold: 1,
  // When the chat opens on the owner typing, the first message is sent by then: typing in the composer
  // barely moves the picture, and the final check fails an opening still for over 1.5 s.
  first_send_by: 1.2,
  char_per_sec: 15,
  min_type: 0.5,
  max_type: 2,
  scroll_ms: 300,
};
// Phone geometry in unzoomed CSS px. `keep` is the conversation viewport.
const IM_PHONE = { width: 393, height: 852, keep: { left: 11, top: 131, right: 382, bottom: 781 } };
const IM_MARGIN = 16;
const IM_SAFE_GAP = 8;
const IM_AVATAR_COLORS = ['#FF9500', '#34C759', '#5AC8FA', '#AF52DE', '#FF2D55', '#5856D6'];
const IM_CUE_GAIN = 0.81;
const IM_SOFT_GAIN = 0.47;

const IM_COLOR = { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' };
const IM_ID = { type: 'string', pattern: '^[A-Za-z0-9_-]{1,40}$' };

export const IMESSAGE_THREAD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['mode', 'participants', 'messages'],
  properties: {
    mode: { enum: ['dm', 'group'] },
    title: { type: 'string', maxLength: 40 },
    clock: { type: 'string', pattern: '^[0-9]{1,2}:[0-9]{2}$' },
    dynamic_island: { type: 'boolean' },
    background_image: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
    zoom: { type: 'number', exclusiveMinimum: 0, maximum: 4 },
    header: {
      type: 'object',
      additionalProperties: false,
      properties: { style: { enum: ['conversation'] }, unread: { type: 'integer', minimum: 0, maximum: 999 } },
    },
    participants: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id'],
        properties: {
          id: IM_ID,
          name: { type: 'string', maxLength: 40 },
          self: { type: 'boolean' },
          color: IM_COLOR,
          initials: { type: 'string', maxLength: 3 },
        },
      },
    },
    messages: {
      type: 'array',
      minItems: 1,
      maxItems: 60,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type'],
        properties: {
          id: IM_ID,
          type: { enum: ['text', 'typing', 'attachment', 'timestamp', 'tapback'] },
          from: IM_ID,
          text: { type: 'string', maxLength: 400 },
          delivered: { type: 'boolean' },
          read: { type: 'boolean' },
          image: { type: 'string', pattern: '^[a-z0-9][a-z0-9_-]{0,39}$' },
          presentation: { enum: ['photo', 'rich-link'] },
          title: { type: 'string', maxLength: 80 },
          subtitle: { type: 'string', maxLength: 80 },
          dwell_sec: { type: 'number', minimum: 0.3, maximum: 10 },
          target: IM_ID,
          emoji: { type: 'string', minLength: 1, maxLength: 16 },
          label: { type: 'string', maxLength: 80 },
          bold: { type: 'string', maxLength: 60 },
          light: { type: 'string', maxLength: 60 },
        },
      },
    },
  },
};

const imEmojiOnly = (s) => /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u{FE0F}|\u{200D}|\s)+$/u.test(s || '');

function imGraphemes(text) {
  return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
}

/** Words as a reader counts them: whitespace-separated tokens. */
function imWords(text) {
  return String(text || '').trim().split(/\s+/u).filter(Boolean).length;
}

function imEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function imIcons(text) {
  if (typeof text !== 'string') throw new Error('The iMessage skin needs its icons.js asset.');
  const icons = {};
  for (const m of text.matchAll(/^\s*([A-Za-z0-9_]+):\s*`([^`]*)`/gm)) icons[m[1]] = m[2];
  for (const name of ['plus', 'mic', 'signal', 'wifi', 'battery', 'backArrow', 'chevron', 'facetime', 'sendArrow']) {
    if (!icons[name]) throw new Error(`The iMessage icons.js asset has no ${name} icon.`);
  }
  return icons;
}

function imValidate(thread, images) {
  const people = thread.participants;
  if (people.filter((p) => p.self).length !== 1) throw new Error('Supply exactly one self participant.');
  const ids = new Set();
  for (const p of people) {
    if (ids.has(p.id)) throw new Error('Participant ids must be unique.');
    ids.add(p.id);
    if (!p.self && !String(p.name || '').trim()) throw new Error(`Set a name for participant ${p.id}; there is no demo-name fallback.`);
  }
  if (thread.mode === 'dm' && people.length !== 2) throw new Error('A DM has two participants; use group for more.');
  if (thread.mode === 'group' && !String(thread.title || '').trim()) throw new Error('A group needs a title.');
  const messages = thread.messages;
  if (!messages.some((m) => m.type === 'text' || m.type === 'attachment')) throw new Error('Supply a conversation with at least one text or attachment.');
  const seen = new Set();
  messages.forEach((m, i) => {
    if (m.type === 'timestamp') return;
    if (!m.id || seen.has(m.id)) throw new Error('Every text, typing, attachment and tapback needs a unique id.');
    seen.add(m.id);
    if (!ids.has(m.from)) throw new Error(`Unknown participant ${m.from} in ${m.id}.`);
    if (m.type === 'text' && !String(m.text || '').trim()) throw new Error(`Message ${m.id} is empty.`);
    if (m.type === 'attachment') {
      if (!m.image) throw new Error(`Attachment ${m.id} needs an image.`);
      if (!images[m.image]) throw new Error(`Attachment ${m.id} names image ${m.image}, which was not supplied.`);
    }
    if (m.type === 'tapback') {
      if (!String(m.emoji || '').trim() || !messages.slice(0, i).some((x) => x.id === m.target && (x.type === 'text' || x.type === 'attachment'))) {
        throw new Error(`Tapback ${m.id} needs an emoji and an earlier message to react to.`);
      }
    }
    if (m.type === 'typing') {
      const next = messages[i + 1];
      if (people.find((p) => p.id === m.from).self || !next || !['text', 'attachment'].includes(next.type) || next.from !== m.from) {
        throw new Error(`Typing ${m.id} must come right before a received message from the same person.`);
      }
    }
  });
  if (thread.background_image && !images[thread.background_image]) throw new Error(`The background image ${thread.background_image} was not supplied.`);
}

function imTimeline(thread, overrides, fps) {
  const T = { ...IM_TIMING };
  for (const [key, value] of Object.entries(overrides || {})) {
    if (!(key in IM_TIMING)) throw new Error(`Unknown iMessage timing ${key}.`);
    T[key] = value;
  }
  for (const [key, value] of Object.entries(T)) if (!Number.isFinite(value) || value < 0) throw new Error(`Timing ${key} must be a finite number, at least 0.`);
  if (!T.char_per_sec || !T.scroll_ms || T.max_type < T.min_type || T.tail_hold < 0.5) {
    throw new Error('Typing and scroll speeds must be positive and the ending hold at least 0.5 s.');
  }
  const snap = (t) => Math.ceil((t - 1e-8) * fps) / fps;
  const self = thread.participants.find((p) => p.self).id;
  const events = [];
  const add = (time, event) => events.push({ t: snap(time), ...event });
  let t = T.start;
  let typing = null;
  for (const m of thread.messages) {
    if (m.type === 'timestamp') continue;
    if (m.type === 'tapback') {
      add(t, { kind: 'tapback', id: m.id, target: m.target, emoji: m.emoji, self: m.from === self, sfx: 'receive', soft: true });
      t += T.emoji_gap;
      continue;
    }
    if (m.type === 'typing') {
      add(t, { kind: 'typing-pop', id: m.id });
      typing = m.id;
      t += T.typing_dwell;
      continue;
    }
    const sent = m.from === self;
    const opening = !events.length;
    if (sent && m.type === 'text') {
      // The opening message starts typing at once and types fast enough to be sent by first_send_by.
      t = opening ? Math.min(t, 0.1) : t + T.self_pre;
      const chars = imGraphemes(m.text).length;
      const paced = Math.min(T.max_type, Math.max(T.min_type, chars / T.char_per_sec));
      const dur = opening && T.first_send_by ? Math.min(paced, Math.max(T.min_type, T.first_send_by - t - T.send_hold)) : paced;
      add(t, { kind: 'composer', text: m.text, dur });
      t += dur + T.send_hold;
    }
    add(t, { kind: typing ? 'typing-swap' : 'pop', id: m.id, typingId: typing, sfx: sent ? 'send' : 'receive', scroll_ms: T.scroll_ms });
    typing = null;
    if (sent) add(t, { kind: 'composer-clear' });
    t += m.type === 'attachment' ? m.dwell_sec ?? T.attach_dwell : imEmojiOnly(m.text) ? T.emoji_gap : T.received_gap;
  }
  const total = snap(Math.max(t + T.tail_hold, events.at(-1).t + T.scroll_ms / 1000 + 0.5));
  return { events, total };
}

/** The largest phone whose conversation viewport sits inside the safe zone (render-imessage-chat's phoneLayout). */
function imLayout(width, height, userZoom, safe) {
  const P = IM_PHONE;
  const K = IM_PHONE.keep;
  const m = IM_MARGIN;
  const fitZoom = Math.min(width / 514, height / 914);
  if (!safe) {
    const zoom = userZoom || fitZoom;
    return { zoom, left: (width - P.width * zoom) / 2, top: (height - P.height * zoom) / 2, zone: null };
  }
  const zone = { left: safe.left, top: safe.top, right: width - safe.right, bottom: height - safe.bottom };
  const g = IM_SAFE_GAP;
  const z = { left: zone.left ? zone.left + g : 0, top: zone.top + g, right: zone.right - g, bottom: zone.bottom - g };
  const limits = [
    (width - 2 * m) / P.width,
    (height - 2 * m) / P.height,
    (z.bottom - m) / K.bottom,
    (z.right - m) / K.right,
    (z.bottom - z.top) / (K.bottom - K.top),
    (height - m - z.top) / (P.height - K.top),
  ];
  if (z.left) limits.push((width - m - z.left) / (P.width - K.left), (z.right - z.left) / (K.right - K.left));
  const maxZoom = Math.min(...limits);
  if (!(maxZoom > 0)) throw new Error('The safe area leaves no room for the phone.');
  const zoom = Math.min(userZoom || fitZoom, maxZoom);
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const top = clamp((height - P.height * zoom) / 2, Math.max(m, z.top - K.top * zoom), Math.min(height - m - P.height * zoom, z.bottom - K.bottom * zoom));
  const left = clamp((width - P.width * zoom) / 2, Math.max(m, z.left - K.left * zoom), Math.min(width - m - P.width * zoom, z.right - K.right * zoom));
  return { zoom, left, top, zone };
}

function imParticipants(participants) {
  const map = new Map();
  let i = 0;
  for (const p of participants) {
    const color = p.color || IM_AVATAR_COLORS[i++ % IM_AVATAR_COLORS.length];
    const initials = p.initials || String(p.name || '?').trim().slice(0, 1).toUpperCase();
    map.set(p.id, { ...p, color, initials });
  }
  return map;
}

function imText(s) {
  return imEsc(s).replace(/\n/g, '<br>').replace(/\[\[link:([^\]]+)\]\]/g, '<span class="link-detector">$1</span>');
}

function imAvatar(p) {
  return p ? `<div class="avatar-slot"><div class="avatar" style="background:${p.color}">${imEsc(p.initials)}</div></div>` : '<div class="avatar-slot"></div>';
}

function imConversation(thread, people, images) {
  const isGroup = thread.mode === 'group';
  const real = thread.messages.filter((m) => m.type === 'text' || m.type === 'attachment');
  const out = [];
  for (const m of thread.messages) {
    const p = people.get(m.from);
    const idx = real.indexOf(m);
    const first = idx >= 0 && !(real[idx - 1] && real[idx - 1].from === m.from);
    const last = idx >= 0 && !(real[idx + 1] && real[idx + 1].from === m.from);
    const anim = m.id ? ` data-anim-id="${imEsc(m.id)}" data-pending="1"` : '';
    if (m.type === 'timestamp') {
      let bold = m.bold;
      let light = m.light;
      if (m.label && !bold && !light) {
        const lines = m.label.split('\n');
        bold = lines[0];
        light = lines.slice(1).join(' ');
      }
      out.push(`<div class="timestamp">${bold ? `<span class="label-bold">${imEsc(bold)}</span>` : ''}${light ? `<br><span class="label-light">${imEsc(light)}</span>` : ''}</div>`);
    } else if (m.type === 'text') {
      const sent = p.self;
      const side = sent ? 'sent' : 'received';
      let html = '';
      if (!sent && isGroup && first) html += `<div class="sender-name" data-label-id="${imEsc(m.id)}" data-pending="1">${imEsc(p.name)}</div>`;
      html += `<div class="row ${side}${first ? ' first-of-run' : ' tight'}"${anim}>`;
      if (!sent && isGroup) html += last ? imAvatar(p) : '<div class="avatar-slot"></div>';
      html += `<div class="bubble ${side} ${last ? 'has-tail' : ''} ${imEmojiOnly(m.text) ? 'emoji-only' : ''} pop-pending">${imText(m.text)}</div></div>`;
      if (sent && m.delivered !== false && last) {
        html += `<div class="delivered-caption pop-pending" data-pending="1" data-cap-id="${imEsc(m.id)}">${m.read ? '<span class="read">Read</span>' : 'Delivered'}</div>`;
      }
      out.push(html);
    } else if (m.type === 'attachment') {
      const side = p.self ? 'sent' : 'received';
      const label = !p.self && isGroup && first ? `<div class="sender-name" data-label-id="${imEsc(m.id)}" data-pending="1">${imEsc(p.name)}</div>` : '';
      const meta = m.title || m.subtitle ? `<div class="attachment-meta">${m.title ? `<div class="title">${imEsc(m.title)}</div>` : ''}${m.subtitle ? `<div class="subtitle">${imEsc(m.subtitle)}</div>` : ''}</div>` : '';
      out.push(`${label}<div class="row attachment ${side} pop-pending ${m.presentation === 'photo' ? 'photo' : 'rich-link'}"${anim}><div class="attachment-card"><img src="${images[m.image]}" alt=""></div>${meta}</div>`);
    } else if (m.type === 'typing') {
      out.push(`<div class="row received first-of-run"${anim}>${isGroup ? imAvatar(p) : ''}<div class="bubble received has-tail typing pop-pending"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>`);
    }
  }
  return `<div class="conversation"><div class="message-list">${out.join('\n')}</div></div>`;
}

function imHeader(thread, people, icons) {
  if (thread.mode === 'group') {
    const tiles = thread.participants.filter((p) => !p.self).slice(0, 4).map((p) => {
      const meta = people.get(p.id);
      return `<div class="avatar-tile" style="background:${meta.color}">${imEsc(meta.initials)}</div>`;
    });
    return `<div class="group-header"><div class="avatars">${tiles.join('')}</div><div class="group-title">${imEsc(thread.title)}<span class="chevron">${icons.chevron}</span></div></div>`;
  }
  const h = thread.header || { style: 'conversation' };
  const peer = people.get(thread.participants.find((p) => !p.self).id);
  return `<div class="conv-header"><div class="left"><div class="back-btn">${icons.backArrow}</div>${h.unread > 0 ? `<div class="badge-pill">${imEsc(String(h.unread))}</div>` : ''}</div>` +
    `<div class="center"><div class="avatar" style="background:${peer.color}">${imEsc(peer.initials)}</div><div class="name-pill">${imEsc(peer.name)} <span class="chev">${icons.chevron}</span></div></div>` +
    `<div class="right"><div class="facetime-btn">${icons.facetime}</div></div></div>`;
}

// The in-page driver: render-imessage-chat's chat-driver, with seek(ms) on top.
// Serialised into the page as source text, so it stays self-contained.
const IM_DRIVER = String.raw`(() => {
  const rows = [...document.querySelectorAll('[data-anim-id]')];
  const labels = [...document.querySelectorAll('[data-label-id], [data-cap-id]')];
  const find = (id) => rows.find((r) => r.dataset.animId === id);
  const input = document.querySelector('.keyboard .input');
  const emptyInput = input.innerHTML;
  const sc = document.querySelector('.conversation');
  const graphemes = (text) => [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
  const ease = (p) => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  const reveal = (id, time, now) => {
    const row = find(id);
    row.removeAttribute('data-pending');
    row.style.display = '';
    if (row.classList.contains('sent')) for (const label of labels.filter((l) => l.dataset.capId)) label.setAttribute('data-pending', '1');
    for (const label of labels) if ((label.dataset.labelId || label.dataset.capId) === id) { label.removeAttribute('data-pending'); label.classList.remove('pop-pending'); }
    const bubble = row.querySelector('.bubble') || row;
    bubble.classList.remove('pop-pending');
    row.classList.remove('pop-pending');
    const p = Math.max(0, Math.min(1, (now - time) / 0.24));
    const scale = p < 0.6 ? 0.6 + 0.44 * ease(p / 0.6) : 1.04 - 0.04 * ease((p - 0.6) / 0.4);
    bubble.style.opacity = Math.min(1, p / 0.12);
    bubble.style.transform = 'scale(' + scale + ') translateY(' + 8 * (1 - ease(p)) + 'px)';
    bubble.style.transformOrigin = row.classList.contains('sent') ? 'bottom right' : 'bottom left';
  };
  const renderAt = (now) => {
    document.querySelectorAll('.tapback').forEach((e) => e.remove());
    for (const row of rows) {
      row.style.marginTop = '';
      row.style.position = '';
      row.setAttribute('data-pending', '1');
      row.style.display = '';
      const b = row.querySelector('.bubble') || row;
      b.style.opacity = '';
      b.style.transform = '';
    }
    for (const label of labels) label.setAttribute('data-pending', '1');
    input.classList.remove('has-text');
    input.innerHTML = emptyInput;
    let scroll = null;
    let previousTarget = 0;
    for (const ev of CHAT_TIMELINE) {
      if (ev.t > now + 1e-8) break;
      if (ev.kind === 'pop' || ev.kind === 'typing-pop' || ev.kind === 'typing-swap') {
        if (ev.typingId) find(ev.typingId).style.display = 'none';
        reveal(ev.id, ev.t, now);
        const target = Math.max(0, sc.scrollHeight - sc.clientHeight);
        const current = scroll ? scroll.start + (scroll.target - scroll.start) * ease((ev.t - scroll.t) / scroll.dur) : previousTarget;
        scroll = { t: ev.t, start: current, target, dur: (ev.scroll_ms || 300) / 1000 };
        previousTarget = target;
      } else if (ev.kind === 'tapback') {
        const row = find(ev.target);
        const bubble = row.querySelector('.bubble') || row;
        row.style.marginTop = '32px';
        const badge = document.createElement('span');
        badge.className = 'tapback ' + (row.classList.contains('sent') ? 'on-sent' : 'on-received') + ' ' + (ev.self ? 'mine' : 'theirs');
        badge.textContent = ev.emoji;
        const card = row.querySelector('.bubble') ? null : row.querySelector('.attachment-card');
        if (card) {
          // An attachment clips its own corners, so its reaction hangs off the card from the row.
          row.style.position = 'relative';
          badge.style.top = card.offsetTop - 34 + 'px';
          badge.style.left = (row.classList.contains('sent') ? card.offsetLeft - 24 : card.offsetLeft + card.offsetWidth - 14) + 'px';
          badge.style.right = 'auto';
          row.append(badge);
        } else bubble.append(badge);
        const target = Math.max(0, sc.scrollHeight - sc.clientHeight);
        scroll = { t: ev.t, start: previousTarget, target, dur: 0.3 };
        previousTarget = target;
      } else if (ev.kind === 'composer') {
        input.classList.add('has-text');
        input.innerHTML = '<span class="composer-text" data-composer-text></span><span class="caret"></span><span class="send-btn">' + CHAT_SEND + '</span>';
        const chars = graphemes(ev.text);
        const count = Math.min(chars.length, Math.floor((chars.length * Math.max(0, now - ev.t)) / (ev.dur * 0.9)));
        input.querySelector('[data-composer-text]').textContent = chars.slice(0, count).join('');
        input.querySelector('.caret').style.opacity = Math.floor(now * 2) % 2 ? 0 : 1;
      } else if (ev.kind === 'composer-clear') {
        input.classList.remove('has-text');
        input.innerHTML = emptyInput;
      }
    }
    sc.scrollTop = scroll ? scroll.start + (scroll.target - scroll.start) * ease((now - scroll.t) / scroll.dur) : 0;
    document.querySelectorAll('.typing .dot').forEach((d, i) => { d.style.opacity = 0.45 + (0.5 * (1 + Math.sin(now * 7 - i * 1.5))) / 2; });
  };
  window.__renderAt = renderAt;
  window.seek = (ms) => renderAt(ms / 1000);
  window.__composerText = () => [...input.querySelectorAll('[data-composer-text]')].map((n) => n.textContent).join('');
  window.__safeAreaReport = () => {
    const zone = CHAT_LAYOUT.zone;
    const boxes = [];
    const view = sc.getBoundingClientRect();
    const newest = rows.filter((r) => !r.hasAttribute('data-pending') && r.style.display !== 'none').at(-1);
    if (newest) {
      const r = newest.getBoundingClientRect();
      const b = { left: Math.max(r.left, view.left), top: Math.max(r.top, view.top), right: Math.min(r.right, view.right), bottom: Math.min(r.bottom, view.bottom) };
      if (b.right > b.left && b.bottom > b.top) boxes.push({ kind: 'newest', id: newest.dataset.animId, ...b });
    }
    const outside = (b) => b.left < zone.left - 0.5 || b.top < zone.top - 0.5 || b.right > zone.right + 0.5 || b.bottom > zone.bottom + 0.5;
    return { enabled: !!zone, zone, boxes, violations: zone ? boxes.filter(outside) : [] };
  };
  renderAt(0);
})();`;

/**
 * The iMessage page for `thread`: { html, events, total_s, cues }.
 * `env` = { width, height, fps, theme, safe_area, assets, font_css, images, timing }.
 */
export function imessageBuild(thread, env) {
  const { width, height, fps } = env;
  const images = env.images || {};
  imValidate(thread, images);
  const css = env.assets && env.assets['chat.css'];
  if (typeof css !== 'string') throw new Error('The iMessage skin needs its chat.css asset.');
  const icons = imIcons(env.assets['icons.js']);
  const theme = env.theme === 'light' ? 'light' : 'dark';
  const requested = thread.zoom || Math.min(width / 514, height / 914);
  if (IM_PHONE.width * requested > width - 32 || IM_PHONE.height * requested > height - 32) {
    throw new Error('The phone does not fit the canvas at this zoom; lower it (a margin stays on every edge).');
  }
  const layout = imLayout(width, height, thread.zoom, env.safe_area || null);
  const zoom = layout.zoom;
  const people = imParticipants(thread.participants);
  const { events, total } = imTimeline(thread, env.timing, fps);
  const dark = theme === 'dark';
  const bg = thread.background_image
    ? `url('${images[thread.background_image]}') center/cover no-repeat`
    : dark ? 'radial-gradient(ellipse at top,#2a2a2e,#0d0d0f)' : 'radial-gradient(ellipse at top,#f3efe9,#d8cfc2)';
  const safeCss = layout.zone
    ? `body.framed { display:block; position:relative; } body.framed .iphone-frame { position:absolute; left:${layout.left / zoom}px; top:${layout.top / zoom}px; }`
    : '';
  const kitCss = css.replace(/font-family:[^;]*;/g, 'font-family: KitText, KitEmoji, sans-serif;');
  const style = `<style>${env.font_css || ''}
    html { zoom:${zoom}; height:${height / zoom}px; overflow:hidden; }
    body.framed { padding:0; margin:0; height:${height / zoom}px; min-height:0; background:${bg}; overflow:hidden; font-family: KitText, KitEmoji, sans-serif; }
    .iphone-frame { flex-shrink:0; }
    body.framed .stage { height:100%; min-height:0; }
    .status-bar,.conv-header,.group-header,.keyboard { flex-shrink:0; }
    .status-bar { color:var(--text-primary); }
    .conv-header { min-height:66px; }
    .conv-header .center { transform:translate(-50%,-50%); max-width:60%; }
    .conv-header .center .avatar { width:42px; height:42px; font-size:17px; }
    .conv-header .center .name-pill { font-size:13px; max-width:100%; white-space:nowrap; }
    .conv-header .left,.conv-header .right,.conv-header .left .back-btn,.conv-header .right .facetime-btn { color:var(--text-primary); }
    .conv-header .left .badge-pill,.conv-header .center .name-pill { background:${dark ? '#1c1c1e' : '#e9e9eb'}; color:var(--text-primary); }
    body.framed .conversation { flex:1; min-height:0; display:block; overflow:hidden; padding:6px 14px 10px; }
    .message-list { display:flex; flex-direction:column; justify-content:flex-start; min-height:100%; gap:2px; }
    .message-list > * { flex-shrink:0; }
    .bubble { overflow-wrap:anywhere; position:relative; }
    .sender-name { margin-left:38px; }
    .row.attachment { gap:0; }
    .row.attachment .attachment-card { width:62%; max-width:62%; border-radius:16px 16px 0 0; }
    .row.attachment .attachment-card img { display:block; width:100%; max-height:300px; object-fit:cover; }
    .row.attachment .attachment-meta { width:62%; max-width:62%; background:${dark ? '#2c2c2e' : '#e9e9eb'}; border-radius:0 0 16px 16px; padding:10px 32px 10px 12px; margin:0; text-align:left; position:relative; line-height:1.25; }
    .attachment-meta .title { font-size:13px; font-weight:600; color:var(--text-primary); }
    .attachment-meta .subtitle { font-size:11px; font-weight:400; color:var(--text-meta); margin-top:3px; }
    .row.rich-link .attachment-meta::after { content:'\\203A'; position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:22px; color:var(--text-meta); }
    .row.photo .attachment-card { border-radius:16px; }
    .row.photo .attachment-meta { background:transparent; padding:6px 0; }
    .tapback { position:absolute; top:-34px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:3; box-shadow:0 0 0 2.5px ${dark ? '#000' : '#fff'}; font-size:21px; }
    .tapback.on-sent { left:-24px; } .tapback.on-received { right:-24px; }
    .tapback.theirs { background:${dark ? '#3a3a3c' : '#e9e9eb'}; } .tapback.mine { background:#0a84ff; }
    .tapback::after { content:''; position:absolute; bottom:-5px; width:8px; height:8px; border-radius:50%; background:inherit; }
    .tapback.on-sent::after { right:0; } .tapback.on-received::after { left:0; }
    .bubble.pop-now,.delivered-caption.pop-now,.caret,.pop-pending { animation:none !important; transition:none !important; }
    ${safeCss}
  </style>`;
  const keyboard = `<div class="keyboard"><div class="left-btn">${icons.plus}</div><div class="input"><span class="placeholder">iMessage</span><span class="mic">${icons.mic}</span></div></div>`;
  const statusBar = `<div class="status-bar"><div class="time">${imEsc(thread.clock || '9:41')}</div><div class="right-cluster">${icons.signal}${icons.wifi}${icons.battery}</div></div>`;
  const island = thread.dynamic_island === false ? '' : '<div class="dynamic-island"></div>';
  const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
  const html = `<!DOCTYPE html>
<html${dark ? ' class="theme-dark"' : ''}><head><meta charset="utf-8"><style>${kitCss}</style>${style}</head>
<body class="framed${dark ? ' theme-dark' : ''}">
  <div class="iphone-frame"><div class="screen">${island}<div class="stage">${statusBar}${imHeader(thread, people, icons)}${imConversation(thread, people, images)}${keyboard}</div></div></div>
<script>const CHAT_TIMELINE=${json(events)};
const CHAT_LAYOUT=${json({ zone: layout.zone })};
const CHAT_SEND=${json(icons.sendArrow)};
${IM_DRIVER}</script>
</body></html>`;

  // One cue per real text, attachment or reaction, on the first visible frame
  // after its reveal; a receive chime followed quickly by another message is
  // shortened so its second note cannot mask the next one (stitch.sh).
  const snapCue = (t) => Math.ceil((t + 1 / fps - 1e-8) * fps) / fps;
  const sounding = events.filter((e) => e.sfx);
  const cues = sounding.map((e, n) => {
    const cue = { t: snapCue(e.t), sound: `imessage-${e.sfx}.mp3`, gain: e.soft ? IM_SOFT_GAIN : IM_CUE_GAIN };
    if (n + 1 < sounding.length) {
      let room = snapCue(sounding[n + 1].t) - cue.t - 0.005;
      if (e.sfx === 'receive' && room < 1.3) room = Math.min(room, 0.2);
      if (room > 0.05) cue.max_s = +room.toFixed(3);
    }
    return cue;
  });
  const shown = thread.messages.filter((m) => m.type === 'text' || m.type === 'attachment');
  const stats = {
    messages: shown.length,
    words: shown.reduce((n, m) => n + (m.type === 'text' ? imWords(m.text) : 0), 0),
    photos: shown.filter((m) => m.type === 'attachment').length,
  };
  return { html, events: events.map((e) => ({ t: e.t, kind: e.kind, ...(e.id ? { id: e.id } : {}), ...(e.kind === 'composer' ? { text: e.text, dur: e.dur } : {}) })), total_s: total, cues, stats };
}
