// Derive visual state from movie time. No timers, random typing or capture-offset
// guesses. Seeking backwards is supported for previews and regression checks.
(() => {
  const rows = [...document.querySelectorAll('[data-anim-id]')];
  const labels = [...document.querySelectorAll('[data-label-id], [data-cap-id]')];
  const find = id => rows.find(r => r.dataset.animId === id);
  const input = document.querySelector('.keyboard .input');
  const emptyInput = input.innerHTML;
  const sc = document.querySelector('.conversation');
  const graphemes = text => [...new Intl.Segmenter(undefined, { granularity:'grapheme' }).segment(text)].map(s => s.segment);
  let emojiMap={};
  const decorate = el => {
    for (const node of [...el.childNodes]) {
      if (node.nodeType!==Node.TEXT_NODE) continue;
      const fragment=document.createDocumentFragment();
      for (const g of graphemes(node.textContent)) {
        if (emojiMap[g]) { const img=document.createElement('img'); img.className='ae'; img.alt=g; img.src=emojiMap[g]; fragment.append(img); }
        else fragment.append(document.createTextNode(g));
      }
      node.replaceWith(fragment);
    }
  };
  window.__setEmojiMap=map=>{ emojiMap=map; for (const el of document.querySelectorAll('.bubble')) decorate(el); };
  const ease = p => 1 - Math.pow(1 - Math.max(0, Math.min(1, p)), 3);
  const reveal = (id, time, now) => {
    const row = find(id); row.removeAttribute('data-pending'); row.style.display = '';
    if (row.classList.contains('sent')) for (const label of labels.filter(l=>l.dataset.capId)) label.setAttribute('data-pending','1');
    for (const label of labels) if ((label.dataset.labelId || label.dataset.capId) === id) {
      label.removeAttribute('data-pending'); label.classList.remove('pop-pending');
    }
    const bubble = row.querySelector('.bubble') || row;
    bubble.classList.remove('pop-pending');
    const p = Math.max(0, Math.min(1, (now - time) / 0.24));
    const scale = p < 0.6 ? 0.6 + 0.44 * ease(p / 0.6) : 1.04 - 0.04 * ease((p - 0.6) / 0.4);
    bubble.style.opacity = Math.min(1, p / 0.12);
    bubble.style.transform = `scale(${scale}) translateY(${8 * (1 - ease(p))}px)`;
    bubble.style.transformOrigin = row.classList.contains('sent') ? 'bottom right' : 'bottom left';
  };
  window.__renderAt = now => {
    document.querySelectorAll('.tapback').forEach(e=>e.remove());
    for (const row of rows) {
      row.style.marginTop='';
      row.setAttribute('data-pending', '1'); row.style.display = '';
      const b = row.querySelector('.bubble') || row; b.style.opacity = ''; b.style.transform = '';
    }
    for (const label of labels) label.setAttribute('data-pending', '1');
    input.classList.remove('has-text'); input.innerHTML = emptyInput;
    let scroll = null, previousTarget = 0;
    for (const ev of CHAT_TIMELINE) {
      if (ev.t > now + 1e-8) break;
      if (['pop', 'typing-pop', 'typing-swap'].includes(ev.kind)) {
        if (ev.typingId) find(ev.typingId).style.display = 'none';
        reveal(ev.id, ev.t, now);
        const target = Math.max(0, sc.scrollHeight - sc.clientHeight);
        const current = scroll ? scroll.start + (scroll.target - scroll.start) * ease((ev.t - scroll.t) / scroll.dur) : previousTarget;
        scroll = { t:ev.t, start:current, target, dur:(ev.scroll_ms || 300) / 1000 };
        previousTarget = target;
      } else if (ev.kind === 'tapback') {
        const row=find(ev.target),bubble=row.querySelector('.bubble') || row;
        row.style.marginTop='32px';
        const badge=document.createElement('span');
        badge.className=`tapback ${row.classList.contains('sent') ? 'on-sent':'on-received'} ${ev.self ? 'mine':'theirs'}`;
        badge.dataset.reactionId=ev.id; badge.textContent=ev.emoji; decorate(badge); bubble.append(badge);
        const target=Math.max(0,sc.scrollHeight-sc.clientHeight);
        scroll={t:ev.t,start:previousTarget,target,dur:0.3}; previousTarget=target;
      } else if (ev.kind === 'composer') {
        input.classList.add('has-text');
        input.innerHTML = '<span class="composer-text" data-composer-text></span><span class="caret"></span><span class="send-btn">↑</span>';
        const chars = graphemes(ev.text);
        const count = Math.min(chars.length, Math.floor(chars.length * Math.max(0, now - ev.t) / (ev.dur * 0.9)));
        const text=input.querySelector('[data-composer-text]'); text.textContent=chars.slice(0,count).join(''); decorate(text);
        input.querySelector('.caret').style.opacity = Math.floor(now * 2) % 2 ? 0 : 1;
      } else if (ev.kind === 'composer-clear') {
        input.classList.remove('has-text'); input.innerHTML = emptyInput;
      }
    }
    sc.scrollTop = scroll ? scroll.start + (scroll.target - scroll.start) * ease((now - scroll.t) / scroll.dur) : 0;
    document.querySelectorAll('.typing .dot').forEach((d, i) => {
      d.style.opacity = 0.45 + 0.5 * (1 + Math.sin(now * 7 - i * 1.5)) / 2;
    });
  };
  // Platform-safe zone report (QA-60), in output-canvas pixels: the visible part
  // of the newest row (rows clip to the conversation) and every shown sheet or
  // dialog. A skin that adds sheets marks them data-safe-keep.
  const box = r => ({ left:r.left, top:r.top, right:r.right, bottom:r.bottom });
  window.__safeAreaReport = () => {
    const zone = CHAT_LAYOUT.zone, boxes = [], view = sc.getBoundingClientRect();
    const newest = rows.filter(r => !r.hasAttribute('data-pending') && r.style.display !== 'none').at(-1);
    if (newest) {
      const r = newest.getBoundingClientRect();
      const b = { left:Math.max(r.left,view.left), top:Math.max(r.top,view.top), right:Math.min(r.right,view.right), bottom:Math.min(r.bottom,view.bottom) };
      if (b.right > b.left && b.bottom > b.top) boxes.push({ kind:'newest', id:newest.dataset.animId, ...b });
    }
    for (const el of document.querySelectorAll('[data-safe-keep],[role="dialog"],[role="alertdialog"]')) {
      const r = el.getBoundingClientRect();
      if (el.closest('[data-pending="1"]') || !r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue;
      boxes.push({ kind:'sheet', id:el.dataset.safeKeep || el.id || el.className, ...box(r) });
    }
    const outside = b => b.left < zone.left-0.5 || b.top < zone.top-0.5 || b.right > zone.right+0.5 || b.bottom > zone.bottom+0.5;
    return { enabled:!!zone, zone, boxes, violations:zone ? boxes.filter(outside) : [] };
  };
  window.__renderAt(0);
})();
