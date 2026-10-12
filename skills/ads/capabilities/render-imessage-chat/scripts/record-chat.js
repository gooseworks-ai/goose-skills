#!/usr/bin/env node
// Frame-by-frame iMessage capture. Movie time is independent of browser startup
// and machine speed. One timeline supplies picture and send/receive SFX.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { renderHTML } = require('./mockup/generate.js');
const FPS = 30;
const TIMING = {
  start:0.4, received_gap:0.75, emoji_gap:0.55, typing_dwell:1,
  self_pre:0.3, send_hold:0.1, attach_dwell:3.6, tail_hold:2,
  char_per_sec:15, min_type:0.5, max_type:2, scroll_ms:300,
};
const snap = t => Math.ceil((t - 1e-8) * FPS) / FPS;
// Platform-safe layout (QA-60). TikTok/Reels draw tabs over the top of a 9:16
// video, caption/composer UI over the bottom and buttons down the right. These
// are review-finished-ad's bands at 1080×1920; they scale with the canvas.
const SAFE_BANDS = { top:220, bottom:400, right:140, left:0 };
// Phone geometry in unzoomed CSS px (chat.css + the framed overrides below).
// `keep` is the conversation viewport: every chat row is clipped to it, so a
// layout that keeps this box in the safe zone keeps the newest row there on
// every frame. top = the shortest (DM) header; bottom = above the composer.
// A skin that adds bottom sheets must extend keep.bottom to the screen (841).
const PHONE = { width:393, height:852, keep:{ left:11, top:131, right:382, bottom:761 } };
const MARGIN = 16, SAFE_GAP = 8;
const emojiOnly = s => /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|️|‍|\s)+$/u.test(s || '');

function validateThread(thread) {
  if (!thread || !['dm','group'].includes(thread.mode)) throw Error('thread.mode must be dm or group');
  const people = thread.participants || [];
  if (people.length < 2 || people.filter(p => p.self).length !== 1) throw Error('Supply at least two participants and exactly one self participant');
  const ids = new Set();
  for (const p of people) {
    if (!p.id || ids.has(p.id)) throw Error('Participant IDs must be nonempty and unique');
    ids.add(p.id);
    if (!p.self && !String(p.name || '').trim()) throw Error(`Set thread.participants name for ${p.id}; there is no demo-name fallback`);
  }
  if (thread.mode === 'dm' && people.length !== 2) throw Error('DM needs two participants; use group for more');
  if (thread.mode === 'group' && !String(thread.title || '').trim()) throw Error('Set thread.title for a group');
  const messages = thread.messages || [];
  if (!messages.some(m => m.type === 'text' || m.type === 'attachment')) throw Error('Supply a nonempty conversation');
  const msgIds = new Set();
  messages.forEach((m,i) => {
    if (!['text','typing','attachment','timestamp','tapback'].includes(m.type)) throw Error(`Unsupported message type ${m.type}`);
    if (m.type === 'timestamp') return;
    if (!m.id || msgIds.has(m.id)) throw Error('Every text, typing and attachment needs a unique id');
    msgIds.add(m.id);
    if (!ids.has(m.from)) throw Error(`Unknown participant ${m.from} in ${m.id}`);
    if (m.type === 'text' && !String(m.text || '').trim()) throw Error(`Empty message ${m.id}`);
    if (m.type === 'attachment' && !m.src) throw Error(`Missing attachment image in ${m.id}`);
    if (m.type === 'tapback') {
      if (!String(m.emoji || '').trim() || !messages.slice(0,i).some(x => x.id === m.target && ['text','attachment'].includes(x.type)))
        throw Error(`Tapback ${m.id} needs an emoji and an earlier message target`);
    }
    if (m.type === 'typing') {
      const next = messages[i+1];
      if (people.find(p => p.id === m.from).self || !next || !['text','attachment'].includes(next.type) || next.from !== m.from)
        throw Error(`Typing ${m.id} must immediately precede a received message from the same participant`);
    }
  });
}

function buildTimeline(thread, overrides = {}) {
  const T = { ...TIMING, ...overrides };
  for (const [key,value] of Object.entries(T)) if (!Number.isFinite(value) || value < 0) throw Error(`Invalid timing.${key}`);
  if (!T.char_per_sec || !T.scroll_ms || T.max_type < T.min_type || T.tail_hold < 0.5) throw Error('Typing/scroll speeds must be positive and tail_hold at least 0.5s');
  const self = thread.participants.find(p => p.self).id, timeline = [];
  const add = (time,event) => timeline.push({ t:snap(time), ...event });
  let t = T.start, typing = null;
  for (const m of thread.messages) {
    if (m.type === 'timestamp') continue;
    if (m.type === 'tapback') { add(t,{ kind:'tapback',id:m.id,target:m.target,emoji:m.emoji,from:m.from,self:m.from===self,sfx:'receive',soft:true }); t+=T.emoji_gap; continue; }
    if (m.type === 'typing') { add(t,{ kind:'typing-pop',id:m.id }); typing=m.id; t+=T.typing_dwell; continue; }
    const sent = m.from === self;
    if (sent && m.type === 'text') {
      t += T.self_pre;
      const chars = [...new Intl.Segmenter(undefined,{ granularity:'grapheme' }).segment(m.text)].length;
      const dur = Math.min(T.max_type,Math.max(T.min_type,chars/T.char_per_sec));
      add(t,{ kind:'composer',text:m.text,dur }); t += dur + T.send_hold;
    }
    add(t,{ kind:typing ? 'typing-swap':'pop',id:m.id,typingId:typing,sfx:sent ? 'send':'receive',scroll_ms:T.scroll_ms });
    typing=null;
    if (sent) add(t,{ kind:'composer-clear' });
    t += m.type === 'attachment' ? (m.dwell_sec ?? T.attach_dwell) : emojiOnly(m.text) ? T.emoji_gap : T.received_gap;
  }
  const total = snap(Math.max(t+T.tail_hold,timeline.at(-1).t+T.scroll_ms/1000+0.5));
  return { timeline,total };
}

// safe_area: omitted = on for 9:16 canvases, off otherwise. true = the platform
// bands scaled to the canvas. An object overrides individual bands in output px.
function resolveSafeArea(option,width,height) {
  if (option == null) option = width*16 === height*9;
  if (option === false) return null;
  const bands = { top:SAFE_BANDS.top*height/1920, bottom:SAFE_BANDS.bottom*height/1920, right:SAFE_BANDS.right*width/1080, left:SAFE_BANDS.left };
  if (option !== true) {
    if (typeof option !== 'object' || Array.isArray(option)) throw Error('safe_area must be true, false or {top,bottom,right,left} in output pixels');
    for (const [key,value] of Object.entries(option)) {
      if (!(key in bands)) throw Error(`Unknown safe_area band ${key}; use top, bottom, right or left`);
      if (!Number.isFinite(value) || value < 0) throw Error(`safe_area.${key} must be a non-negative number of output pixels`);
      bands[key] = value;
    }
  }
  if (bands.top+bands.bottom >= height || bands.left+bands.right >= width) throw Error('safe_area bands leave no safe zone');
  return bands;
}

// Largest proportional phone whose conversation viewport sits inside the safe
// zone while the whole phone keeps a margin on every edge. Each constraint is
// linear in zoom, so the limit is the smallest of the per-constraint limits.
// With the safe area on, an explicit zoom is a ceiling: kept when it is safe,
// lowered to the safe maximum when not (recipes seed zoom 2.1, the old fill).
// safe_area:false keeps an explicit zoom exactly.
function phoneLayout(width,height,userZoom,safe,fit='centred') {
  const P = PHONE, K = PHONE.keep, m = MARGIN;
  const fitZoom = Math.min(width/514,height/914);
  if (!safe) {
    const zoom = userZoom || fitZoom;
    return { zoom,left:(width-P.width*zoom)/2,top:(height-P.height*zoom)/2,safe:null,zone:null };
  }
  const zone = { left:safe.left,top:safe.top,right:width-safe.right,bottom:height-safe.bottom };
  // Solve against a zone inset by SAFE_GAP: a row clipped mid-scroll reaches the
  // conversation edge, which must sit strictly inside the band, not on it.
  const g = SAFE_GAP, z = { left:zone.left ? zone.left+g : 0,top:zone.top+g,right:zone.right-g,bottom:zone.bottom-g };
  const limits = [(width-2*m)/P.width,(height-2*m)/P.height,(z.bottom-m)/K.bottom,(z.right-m)/K.right,
    (z.bottom-z.top)/(K.bottom-K.top),(height-m-z.top)/(P.height-K.top)];
  if (z.left) limits.push((width-m-z.left)/(P.width-K.left),(z.right-z.left)/(K.right-K.left));
  // 'centred' (default): the largest phone that is safe while it sits in the
  // middle of the canvas. The largest safe phone overall has to be pushed up
  // against the top margin (16 px above it, 273 below at 1080x1920), which
  // reads as a layout mistake. 'largest' keeps that bigger, off-centre phone.
  if (fit !== 'largest') {
    const mid = { x:width/2,y:height/2 }, c = { x:P.width/2,y:P.height/2 };
    limits.push((z.bottom-mid.y)/(K.bottom-c.y),(mid.y-z.top)/(c.y-K.top),(z.right-mid.x)/(K.right-c.x));
    if (z.left) limits.push((mid.x-z.left)/(c.x-K.left));
  }
  const maxZoom = Math.min(...limits);
  if (!(maxZoom > 0)) throw Error('safe_area bands leave no room for the phone');
  const zoom = Math.min(userZoom || fitZoom,maxZoom);
  const lowered = userZoom && userZoom > maxZoom ? userZoom : null;
  const clamp = (value,low,high) => Math.min(Math.max(value,low),high);
  // Stay centred when that is already safe; otherwise move only as far as needed.
  const top = clamp((height-P.height*zoom)/2,Math.max(m,z.top-K.top*zoom),Math.min(height-m-P.height*zoom,z.bottom-K.bottom*zoom));
  const left = clamp((width-P.width*zoom)/2,Math.max(m,z.left-K.left*zoom),Math.min(width-m-P.width*zoom,z.right-K.right*zoom));
  return { zoom,left,top,safe,zone,maxZoom,lowered };
}

function dataURI(file) {
  const data = fs.readFileSync(file);
  if (data.subarray(0,80).toString().includes('version https://git-lfs')) throw Error(`Fetch the real LFS asset: ${file}`);
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = { jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',svg:'image/svg+xml' }[ext];
  if (!mime) throw Error(`Unsupported image type: ${file}`);
  return `data:${mime};base64,${data.toString('base64')}`;
}

function buildDocument(cfg,baseDir) {
  const thread = cfg.thread ? structuredClone(cfg.thread) : JSON.parse(fs.readFileSync(path.resolve(baseDir,cfg.thread_path),'utf8'));
  validateThread(thread);
  if (cfg.theme && !['light','dark'].includes(cfg.theme)) throw Error('theme must be dark or light');
  thread.theme = cfg.theme || thread.theme || 'dark';
  if (!['light','dark'].includes(thread.theme)) throw Error('thread.theme must be dark or light');
  const width=cfg.width || 1080, height=cfg.height || 1920;
  const requested=cfg.zoom || Math.min(width/514,height/914);
  if (![width,height,requested].every(Number.isFinite) || width<320 || height<568 || requested<=0 || width%2 || height%2) throw Error('Use even output dimensions and a positive zoom');
  if (393*requested>width-32 || 852*requested>height-32) throw Error('Phone does not fit the canvas; reduce zoom (keep a margin on every edge)');
  if (cfg.phone_fit !== undefined && !['centred','largest'].includes(cfg.phone_fit)) throw Error('phone_fit must be "centred" or "largest"');
  const layout=phoneLayout(width,height,cfg.zoom,resolveSafeArea(cfg.safe_area,width,height),cfg.phone_fit),zoom=layout.zoom;
  // Safe layout only: pin the phone where phoneLayout put it (legacy CSS stays byte-identical when off).
  const safeCSS=layout.safe ? `\n    body.framed { display:block; position:relative; }\n    body.framed .iphone-frame { position:absolute; left:${layout.left/zoom}px; top:${layout.top/zoom}px; }` : '';
  if (!thread.clock) {
    const ts=thread.messages.find(m => m.type==='timestamp');
    const time=ts && /(\d{1,2}:\d{2})/.exec(`${ts.light || ''} ${ts.label || ''}`);
    thread.clock=thread.status_time || (time && time[1]) || '9:41';
  }
  thread.dynamic_island = cfg.dynamic_island ?? thread.dynamic_island ?? true;
  if (thread.mode !== 'group' && !thread.header) thread.header = { style:'conversation' };
  for (const m of thread.messages) {
    if (m.type === 'attachment') {
      if (!m.src.startsWith('data:')) m.src=dataURI(path.resolve(baseDir,m.src));
      if (m.dwell_sec != null && (!Number.isFinite(m.dwell_sec) || m.dwell_sec<0.3)) throw Error(`Invalid attachment dwell in ${m.id}`);
    }
    if (m.type !== 'timestamp') m.popState='pending';
    if (m.from===thread.participants.find(p=>p.self).id && ['text','attachment'].includes(m.type) && m.delivered!==false) m.delivered=true;
  }
  thread.composer={ text:'' };
  const { timeline,total }=buildTimeline(thread,cfg.timing);
  const dark=thread.theme === 'dark';
  const bg=cfg.background_image ? `url('${dataURI(path.resolve(baseDir,cfg.background_image))}') center/cover no-repeat`
    : dark ? 'radial-gradient(ellipse at top,#2a2a2e,#0d0d0f)' : 'radial-gradient(ellipse at top,#f3efe9,#d8cfc2)';
  const style=`<style>
    html { zoom:${zoom}; height:${height/zoom}px; }
    body.framed { padding:0; margin:0; height:${height/zoom}px; min-height:0; background:${bg}; overflow:hidden; }
    .iphone-frame { flex-shrink:0; }
    body.framed .stage { height:100%; min-height:0; }
    .status-bar,.conv-header,.group-header,.keyboard { flex-shrink:0; }
    .status-bar { color:var(--text-primary); }
    .conv-header { min-height:66px; }
    .conv-header .center { transform:translate(-50%,-50%); max-width:60%; }
    .conv-header .center .avatar { width:42px; height:42px; font-size:17px; }
    .conv-header .center .name-pill { font-size:13px; max-width:100%; white-space:nowrap; }
    .conv-header .left,.conv-header .right,.conv-header .left .back-btn,.conv-header .right .facetime-btn { color:var(--text-primary); }
    .conv-header .left .badge-pill,.conv-header .center .name-pill { background:${dark ? '#1c1c1e':'#e9e9eb'}; color:var(--text-primary); }
    body.framed .conversation { flex:1; min-height:0; display:block; overflow:hidden; padding:6px 14px 10px; }
    .message-list { display:flex; flex-direction:column; justify-content:flex-start; min-height:100%; gap:2px; }
    .message-list > * { flex-shrink:0; }
    .bubble { overflow-wrap:anywhere; }
    .sender-name { margin-left:38px; }
    .row.attachment { gap:0; }
    .row.attachment .attachment-card { width:62%; max-width:62%; border-radius:16px 16px 0 0; }
    .row.attachment .attachment-card img { display:block; width:100%; max-height:300px; object-fit:cover; }
    .row.attachment .attachment-meta { width:62%; max-width:62%; background:${dark ? '#2c2c2e':'#e9e9eb'}; border-radius:0 0 16px 16px;
      padding:10px 32px 10px 12px; margin:0; text-align:left; position:relative; line-height:1.25; }
    .attachment-meta .title { font-size:13px; font-weight:600; color:var(--text-primary); }
    .attachment-meta .subtitle { font-size:11px; font-weight:400; color:var(--text-meta); margin-top:3px; }
    .row.rich-link .attachment-meta::after { content:'›'; position:absolute; right:12px; top:50%; transform:translateY(-50%); font-size:22px; color:var(--text-meta); }
    .row.photo .attachment-card { border-radius:16px; }
    .row.photo .attachment-meta { background:transparent; padding:6px 0; }
    .bubble { position:relative; }
    .tapback { position:absolute; top:-34px; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; z-index:3; box-shadow:0 0 0 2.5px ${dark ? '#000':'#fff'}; font-size:21px; }
    .tapback.on-sent { left:-24px; } .tapback.on-received { right:-24px; }
    .tapback.theirs { background:${dark ? '#3a3a3c':'#e9e9eb'}; } .tapback.mine { background:#0a84ff; }
    .tapback::after { content:''; position:absolute; bottom:-5px; width:8px; height:8px; border-radius:50%; background:inherit; }
    .tapback.on-sent::after { right:0; } .tapback.on-received::after { left:0; }
    .bubble.pop-now,.delivered-caption.pop-now,.caret { animation:none; }${safeCSS}
  </style>`;
  const script=fs.readFileSync(path.join(__dirname,'chat-driver.js'),'utf8');
  const timelineJSON=JSON.stringify(timeline).replace(/</g,'\\u003c');
  const layoutJSON=JSON.stringify({ zone:layout.zone });
  let html=renderHTML(thread,{ mode:'with-iphone-frame' });
  html=html.replace('</head>',`${style}</head>`).replace('</body>',`<script>const CHAT_TIMELINE=${timelineJSON};\nconst CHAT_LAYOUT=${layoutJSON};\n${script}</script></body>`);
  return { html,thread,timeline,total,width,height,layout };
}

async function checkLayout(page) {
  return page.evaluate(() => {
    const errors=[],screen=document.querySelector('.screen').getBoundingClientRect();
    const island=document.querySelector('.dynamic-island');
    if (island && island.getBoundingClientRect().top<=screen.top+2) errors.push('Dynamic Island must float inside the screen');
    for (const el of document.querySelectorAll('.bubble,.name-pill,.attachment-meta')) {
      if (el.closest('[data-pending="1"]')) continue;
      const box=el.getBoundingClientRect(),r=document.createRange();
      const children=[...el.childNodes].filter(n=>!n.classList?.contains('tapback'));
      if (!children.length) continue;
      r.setStartBefore(children[0]); r.setEndAfter(children.at(-1)); const text=r.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (text.width && (text.left<box.left-1 || text.right>box.right+1 || text.bottom>box.bottom+1)) errors.push(`Text overflow: ${el.closest('[data-anim-id]')?.dataset.animId || el.textContent}`);
      if (box.left<screen.left || box.right>screen.right) errors.push(`Outside phone: ${el.textContent}`);
    }
    const keyboard=document.querySelector('.keyboard').getBoundingClientRect();
    if (Math.abs(keyboard.bottom-screen.bottom)>2) errors.push('Text input must remain at the bottom of the phone');
    const {zone,violations}=window.__safeAreaReport(),n=Math.round;
    for (const b of violations) errors.push(`Outside the platform safe area: ${b.kind} ${b.id} box [${n(b.left)},${n(b.top)} to ${n(b.right)},${n(b.bottom)}], safe zone [${n(zone.left)},${n(zone.top)} to ${n(zone.right)},${n(zone.bottom)}]. Lower zoom or set safe_area:false`);
    return errors;
  });
}

// Union of every checked box per kind, with the movie times that set the bottom
// and right extremes. Written beside the master so check-render.py re-verifies it.
function safeAreaTracker(doc) {
  const extent={},final={},violations=[],L=doc.layout;
  return {
    add(report,t) {
      for (const b of report.boxes) {
        const e=extent[b.kind] ||= { left:b.left,top:b.top,right:b.right,bottom:b.bottom,right_t:t,bottom_t:t };
        e.left=Math.min(e.left,b.left); e.top=Math.min(e.top,b.top);
        if (b.right>e.right) { e.right=b.right; e.right_t=t; }
        if (b.bottom>e.bottom) { e.bottom=b.bottom; e.bottom_t=t; }
      }
      violations.push(...report.violations.map(b=>({ t,...b })));
      final.t=t; final.boxes=report.boxes;
    },
    json:checked => ({ enabled:!!L.zone,canvas:{ width:doc.width,height:doc.height },bands:L.safe,zone:L.zone,zoom:L.zoom,zoom_requested:L.lowered,
      phone:{ left:L.left,top:L.top,right:L.left+PHONE.width*L.zoom,bottom:L.top+PHONE.height*L.zoom },
      checked,extent,final,violations:violations.slice(0,20) }),
  };
}

function checkLayoutUnsafe(report,frame) {
  const b=report.violations[0],z=report.zone,n=Math.round;
  return `Outside the platform safe area at frame ${frame}: ${b.kind} ${b.id} box [${n(b.left)},${n(b.top)} to ${n(b.right)},${n(b.bottom)}], safe zone [${n(z.left)},${n(z.top)} to ${n(z.right)},${n(z.bottom)}]. Lower zoom or set safe_area:false`;
}

function safeSummary(report) {
  const e=report.extent.newest,n=Math.round;
  if (!report.enabled || !e) return `chat: safe area ${report.enabled ? 'on' : 'off'} (zoom ${report.zoom.toFixed(3)})`;
  return `chat: safe area on (zoom ${report.zoom.toFixed(3)}); newest row stays within x ${n(e.left)}-${n(e.right)} < ${n(report.zone.right)}, y ${n(e.top)}-${n(e.bottom)} < ${n(report.zone.bottom)}`;
}

const EMOJI_CDN = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/';
const isPictographic = g => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g);
async function appleEmojiMap(texts) {
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  const cacheDir = path.join(os.tmpdir(), 'imsg-apple-emoji');
  fs.mkdirSync(cacheDir, { recursive: true });
  const map = {};
  for (const t of texts) for (const { segment: g } of seg.segment(t || '')) {
    if (map[g] || !isPictographic(g)) continue;
    const full = [...g].map(c => c.codePointAt(0).toString(16)).join('-');
    const names = [full, full.replace(/-fe0f/g, '')];
    for (const n of names) {
      const file = path.join(cacheDir, n + '.png');
      if (!fs.existsSync(file)) {
        const r = await fetch(EMOJI_CDN + n + '.png');
        if (!r.ok) continue;
        fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
      }
      map[g] = dataURI(file);
      break;
    }
    if (!map[g]) console.warn(`emoji  ${g} (${full}): no Apple glyph found, system font used`);
  }
  return map;
}


async function record(cfgPath,outDir,previewOnly=false) {
  const cfg=JSON.parse(fs.readFileSync(cfgPath,'utf8')),doc=buildDocument(cfg,path.dirname(cfgPath));
  fs.mkdirSync(outDir,{ recursive:true }); fs.writeFileSync(path.join(outDir,'chat.html'),doc.html);
  if (doc.layout.lowered) console.log(`chat: zoom ${doc.layout.lowered} lowered to ${doc.layout.zoom.toFixed(3)} to keep the chat above the platform controls; set safe_area:false to keep it`);
  const browser=await chromium.launch({ timeout:15000 }); let encoder;
  try {
    const page=await browser.newPage({ viewport:{ width:doc.width,height:doc.height },deviceScaleFactor:1 });
    await page.setContent(doc.html,{ waitUntil:'load' });
    const emojiMap=await appleEmojiMap(doc.thread.messages.map(m=>m.text || m.emoji || ''));
    await page.evaluate(map=>window.__setEmojiMap(map),emojiMap);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i=>i.decode())); });
    const safe=safeAreaTracker(doc),sidecar=path.join(outDir,'master-chat.safe-area.json');
    const saveSafe=checked=>fs.writeFileSync(sidecar,JSON.stringify(safe.json(checked),null,2));
    for (const ev of doc.timeline) {
      const at=ev.t+(ev.kind==='composer' ? ev.dur*0.95:0.3);
      await page.evaluate(t=>window.__renderAt(t),at);
      if (ev.kind==='composer') {
        const typed=await page.locator('[data-composer-text]').evaluate(el=>[...el.childNodes].map(n=>n.nodeType===3 ? n.textContent : n.alt || n.textContent).join(''));
        if (typed!==ev.text) throw Error(`TYPED != SENT: ${typed} / ${ev.text}`);
      }
      safe.add(await page.evaluate(()=>window.__safeAreaReport()),at);
      const errors=await checkLayout(page); if (errors.length) { saveSafe('timeline events (failed)'); throw Error(errors.join('\n')); }
    }
    await page.evaluate(t=>window.__renderAt(t),doc.total);
    safe.add(await page.evaluate(()=>window.__safeAreaReport()),doc.total);
    await page.screenshot({ path:path.join(outDir,'chat-preview.png') });
    if (previewOnly) { saveSafe(`${doc.timeline.length} timeline events + final frame`); console.log(safeSummary(safe.json())); return doc; }
    const out=path.join(outDir,'master-chat.mp4');
    encoder=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',String(FPS),'-i','-',
      '-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',out]);
    let log=''; encoder.stderr.on('data',b=>{ log=(log+b).slice(-5000); }); encoder.stdin.on('error',()=>{});
    const done=new Promise((resolve,reject)=>{ encoder.on('error',reject); encoder.on('close',c=>c===0 ? resolve():reject(Error(`ffmpeg failed: ${log}`))); });
    done.catch(()=>{});
    const frames=Math.round(doc.total*FPS);
    for (let frame=0;frame<frames;frame++) {
      const report=await page.evaluate(t=>{ window.__renderAt(t); return window.__safeAreaReport(); },frame/FPS);
      safe.add(report,frame/FPS);
      if (report.violations.length) { saveSafe(`frames 0-${frame} (failed)`); throw Error(checkLayoutUnsafe(report,frame)); }
      const png=await page.screenshot({ type:'png' });
      if (encoder.exitCode!=null) throw Error(`ffmpeg failed: ${log}`);
      if (!encoder.stdin.write(png)) await Promise.race([
        once(encoder.stdin,'drain'),
        done.then(() => { throw Error('ffmpeg ended before all frames were written'); }),
      ]);
      if (frame%150===0) console.log(`chat: ${frame}/${frames} frames`);
    }
    encoder.stdin.end(); await done;
    fs.writeFileSync(path.join(outDir,'master-chat.timeline.json'),JSON.stringify({ fps:FPS,total:doc.total,timeline:doc.timeline },null,2));
    fs.writeFileSync(path.join(outDir,'master-chat.sfx.json'),JSON.stringify(doc.timeline.filter(e=>e.sfx).map(e=>({ t:snap(e.t+1/FPS),name:e.sfx,id:e.id,soft:!!e.soft })),null,2));
    saveSafe(`${doc.timeline.length} timeline events + all ${frames} frames`); console.log(safeSummary(safe.json()));
    console.log(`chat: ${frames} frames, ${doc.total}s, ${doc.width}×${doc.height}; no startup trim`); return doc;
  } finally { if (encoder && encoder.exitCode==null) encoder.kill(); await browser.close(); }
}
if (require.main===module) {
  const args=process.argv.slice(2); let config='config.json',out='.',preview=false;
  for (let i=0;i<args.length;i++) {
    if (args[i]==='--config') config=args[++i]; else if (args[i]==='--out-dir') out=args[++i];
    else if (args[i]==='--preview-only') preview=true; else throw Error(`Unknown argument ${args[i]}`);
  }
  record(path.resolve(config),path.resolve(out),preview).catch(e=>{ console.error(e.message); process.exitCode=1; });
}
module.exports={ buildDocument,buildTimeline,validateThread,checkLayout,record,resolveSafeArea,phoneLayout,FPS,PHONE,SAFE_BANDS };
