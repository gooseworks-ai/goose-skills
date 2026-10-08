// The plan's scenes, as each skin's thread. The plan writes a phone chat as
// scenes (the style's plan note says how): "Name: text" messages for iMessage
// and the notification cascade, question then answer for ChatGPT, a title
// then one list line per scene for Apple Notes. The style's answers set the
// theme, the phone's clock, a group's name and the resolution message.
// Every top-level name starts with `chat`.

const chatSenderRe = /^\s*([^:\n]{1,40}?)\s*:\s*([\s\S]*)$/;

/** What a scene shows: its on-screen text, else its line. */
export function chatSceneText(scene) {
  const shown = typeof scene.on_screen === 'string' ? scene.on_screen.trim() : '';
  return shown || (typeof scene.line === 'string' ? scene.line.trim() : '');
}

function chatSlug(s, used) {
  let id = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'p';
  let n = 2;
  const base = id;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function chatSceneId(scene, i) {
  const raw = scene.id == null ? '' : String(scene.id);
  return /^[A-Za-z0-9_-]{1,40}$/.test(raw) ? raw : `s${i + 1}`;
}

function chatClock(answers) {
  const m = /([0-9]{1,2}:[0-9]{2})/.exec(String((answers && answers.clock) || ''));
  return m ? m[1] : undefined;
}

function chatTruthy(v) {
  return v === true || /^(true|yes|on|1)$/i.test(String(v == null ? '' : v).trim());
}

/** The product photo a scene's picture asks for: the scene's own image file, or a chosen product's first photo. */
function chatPicture(scene, products) {
  const p = scene.picture;
  if (p && typeof p === 'object' && p.kind === 'file') return p;
  if (typeof p !== 'string' || !p.trim()) return null;
  const want = p.trim().toLowerCase();
  const withPhoto = (products || []).filter((x) => (x.images || []).length);
  const match = withPhoto.find((x) => String(x.id).toLowerCase() === want || String(x.name || '').toLowerCase() === want);
  const product = match || (withPhoto.length === 1 ? withPhoto[0] : null);
  if (!product) throw new Error(`A scene asks for the photo "${p}", but no chosen product with a photo matches it.`);
  return product.images[0];
}

function chatSenderLines(scenes, what) {
  return scenes.map((scene, i) => {
    const text = chatSceneText(scene);
    const m = chatSenderRe.exec(text);
    if (!m || !m[1].trim()) throw new Error(`Scene ${i + 1} must start with who sends it and a colon (Riya: ${what}).`);
    return { scene, index: i, id: chatSceneId(scene, i), sender: m[1].trim(), text: m[2].trim() };
  });
}

/**
 * The thread for `skin` from the plan. Returns { thread, images: [{key, file}], scene_ids }
 * where scene_ids maps each chat scene to the event id that reveals it.
 */
export function chatThreadFor(skin, { scenes, products, answers, brand_name, plate, pacing }) {
  const a = answers || {};
  if (!scenes.length) throw new Error('The chat needs at least one scene before the end card.');
  if (skin === 'imessage') {
    const lines = chatSenderLines(scenes, 'did you see this?');
    const used = new Set(['me']);
    const people = new Map();
    for (const l of lines) {
      if (l.sender.toLowerCase() === 'me') continue;
      const key = l.sender.toLowerCase();
      if (!people.has(key)) people.set(key, { id: chatSlug(l.sender, used), name: l.sender });
    }
    if (!people.size) throw new Error('The chat needs at least one message from someone other than Me.');
    const group = typeof a.group === 'string' && a.group.trim() ? a.group.trim() : '';
    if (!group && people.size > 1) throw new Error('More than one contact writes in this chat: set the answer group to the group\'s name.');
    const images = [];
    const messages = [];
    const sceneIds = [];
    for (const l of lines) {
      const from = l.sender.toLowerCase() === 'me' ? 'me' : people.get(l.sender.toLowerCase()).id;
      const picture = chatPicture(l.scene, products);
      if (!l.text && !picture) throw new Error(`Scene ${l.index + 1} has no message after "${l.sender}:".`);
      if (from !== 'me') messages.push({ id: `${l.id}-typing`, type: 'typing', from });
      if (l.text) messages.push({ id: l.id, type: 'text', from, text: l.text });
      if (picture) {
        const key = `scene-${images.length + 1}`;
        images.push({ key, file: picture });
        messages.push({ id: l.text ? `${l.id}-photo` : l.id, type: 'attachment', from, image: key, presentation: 'photo' });
      }
      sceneIds.push({ scene: l.id, event: l.id });
    }
    // Typing only before a received message that follows it directly.
    const thread = {
      mode: group ? 'group' : 'dm',
      participants: [{ id: 'me', name: 'Me', self: true }, ...people.values()],
      messages: messages.filter((m, i) => m.type !== 'typing' || (messages[i + 1] && messages[i + 1].from === m.from)),
    };
    if (group) thread.title = group;
    const clock = chatClock(a);
    if (clock) thread.clock = clock;
    return { thread, images, scene_ids: sceneIds, theme: a.theme === 'light' ? 'light' : 'dark' };
  }
  if (skin === 'chatgpt') {
    const messages = [];
    const sceneIds = [];
    scenes.forEach((scene, i) => {
      const id = chatSceneId(scene, i);
      const text = chatSceneText(scene);
      if (!text) throw new Error(`Scene ${i + 1} has no words.`);
      if (i % 2 === 0) messages.push({ id, type: 'user-text', text: text.replace(/\s*\n\s*/g, ' ') });
      else messages.push({ id: `${id}-dot`, type: 'loading-dot' }, { id, type: 'assistant', text });
      sceneIds.push({ scene: id, event: id });
    });
    const thread = { messages };
    const clock = chatClock(a);
    if (clock) thread.status_bar = { time: clock };
    return { thread, images: [], scene_ids: sceneIds };
  }
  if (skin === 'apple-notes') {
    const p = pacing || {};
    const cps = p.chars_per_second ?? 18;
    const minType = p.min_type_seconds ?? 1.4;
    const [first, ...rest] = scenes;
    const title = chatSceneText(first);
    if (!title) throw new Error('Scene 1 is the note\'s title and has no words.');
    if (!rest.length) throw new Error('The note needs at least one line after its title.');
    const lines = rest.map((scene, i) => {
      const text = chatSceneText(scene);
      if (!text) throw new Error(`Scene ${i + 2} has no words.`);
      const pause = i === 0 ? p.first_pause_seconds ?? 1.0 : i === rest.length - 1 ? p.last_pause_seconds ?? 0.9 : p.between_pause_seconds ?? 0.55;
      return { text, type_seconds: +Math.max(minType, [...text].length / cps).toFixed(3), pre_pause_seconds: pause };
    });
    const thread = { title, lines, post_hold_seconds: p.hold_seconds ?? 1.4 };
    const clock = chatClock(a);
    if (clock) thread.status_bar = { time: clock };
    return { thread, images: [], scene_ids: [] };
  }
  if (skin === 'notification-cascade') {
    if (!plate) throw new Error('The notification cascade needs its desk plate image.');
    if (!String(brand_name || '').trim()) throw new Error('The notification cascade shows the brand name on every banner.');
    const lines = chatSenderLines(scenes, 'can you send pricing?');
    const resolution = chatTruthy(a.resolution) && lines.length > 1 ? lines.pop() : null;
    const banner = (l) => ({ id: l.id, title: l.sender, body: l.text });
    const thread = {
      handle: String(brand_name).trim(),
      notifications: lines.map(banner),
      resolution: resolution ? banner(resolution) : null,
      plate: 'plate',
    };
    if (pacing && Object.keys(pacing).length) thread.pacing = { ...pacing };
    const sceneIds = [...lines, ...(resolution ? [resolution] : [])].map((l) => ({ scene: l.id, event: l.id }));
    return { thread, images: [{ key: 'plate', file: plate }], scene_ids: sceneIds };
  }
  throw new Error(`Unknown skin ${skin}.`);
}
