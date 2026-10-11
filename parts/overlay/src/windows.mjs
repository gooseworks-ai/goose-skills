// overlay's pure planning: which picture shows when, where and how big. No
// ffmpeg here, so the tests check the arithmetic and the refusals directly.
// Bundled into part.mjs; every top-level name starts with `ovl` (the shared
// _lib modules use `kit`, parts/_tools/bundle.mjs).

/** The px values in an item are measured at a 1080-pixel short side and scaled to the video. */
export const OVL_REFERENCE_SHORT_SIDE = 1080;
/** The most windows one step draws, so a long plan can never build an endless filter graph. */
export const OVL_MAX_WINDOWS = 60;
/** A scale-in starts at this fraction of the full size and grows to it. */
export const OVL_SCALE_FROM = 0.85;
/** The size rule (GOOSE-4015, critic #38): the final encode's bitrate cap and the largest output kept. */
export const OVL_MAX_BYTES = 180 * 1024 * 1024;
export const OVL_RATE_CAP = ['-maxrate', '16M', '-bufsize', '32M'];

// The product matcher of phone-chat 1.2.0 (src/threads.mjs chatNames) and _lib/scene-match.mjs
// kitProductMatch, so a scene names the same product here as in every other part: its id or whole
// name, or at least two of its name's words (all of a one-word name), ignoring case; a word also
// matches its stem when both are at least four letters.
const OVL_PLAIN_WORDS = new Set(['a', 'an', 'the', 'of', 'its', 'it', 'this', 'that', 'these', 'those', 'them', 'one', 'my', 'our', 'your', 'their', 'his', 'her', 'show', 'shows', 'showing', 'send', 'sends', 'here', 'look', 'see', 'new', 'product', 'products', 'item', 'photo', 'photos', 'picture', 'pictures', 'pic', 'pics', 'image', 'images', 'shot', 'shots', 'snap', 'snaps', 'and', 'with', 'in', 'on', 'at', 'is']);
// A leading tag in a picture ("Product: the jar on a table"), as _lib/scene-match.mjs reads it.
const OVL_TAG_RE = /^\s*([A-Za-z][A-Za-z0-9_-]*(?: [A-Za-z0-9_-]+)?)\s*:(?:\s+(?=\S)|\s*$)/;

function ovlWords(text) {
  return String(text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function ovlSameWord(a, b) {
  return a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a)));
}

/** How strongly `text` names `product`: 0, Infinity for its id or whole name, else the count of its name's words used. */
export function ovlProductMatch(text, product) {
  if (!product || product.id == null) return 0;
  const want = String(text || '').trim().toLowerCase();
  if (!want) return 0;
  const id = String(product.id).toLowerCase();
  if (id === want || String(product.name || '').toLowerCase() === want) return Infinity;
  const said = ovlWords(want);
  if (said.includes(id)) return Infinity;
  const name = ovlWords(product.name).filter((w) => !OVL_PLAIN_WORDS.has(w) && (w.length >= 3 || /\d/.test(w)));
  const used = name.filter((w) => said.some((t) => ovlSameWord(t, w))).length;
  return name.length && used >= Math.min(2, name.length) ? used : 0;
}

/** The scene's tag, compared without case or spacing: extra.shot, else a leading "Tag:" of its picture text. */
export function ovlSceneTagKey(scene) {
  const shot = scene && scene.extra && scene.extra.shot;
  let tag = typeof shot === 'string' && shot.trim() ? shot : null;
  if (!tag && scene && typeof scene.picture === 'string') {
    const m = OVL_TAG_RE.exec(scene.picture);
    if (m) tag = m[1];
  }
  return tag ? tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
}

/**
 * The product a scene names, or null: the strongest match in its picture text (on a tie the longest
 * name, then plan order). A scene tagged Product ("Product: ..." or extra.shot "product") that names
 * none shows the plan's only product, so "Product: the box on a pedestal" still gets the real box.
 */
export function ovlSceneProduct(scene, products) {
  const list = Array.isArray(products) ? products.filter((p) => p && typeof p === 'object') : [];
  if (!scene || !list.length) return null;
  const text = typeof scene.picture === 'string' ? scene.picture : '';
  const named = list
    .map((p, i) => ({ p, i, n: ovlProductMatch(text, p), len: String(p.name || '').length }))
    .filter((m) => m.n > 0)
    .sort((a, b) => (b.n === a.n ? 0 : b.n > a.n ? 1 : -1) || b.len - a.len || a.i - b.i);
  if (named.length) return named[0].p;
  if (ovlSceneTagKey(scene) === 'product' && list.length === 1) return list[0];
  return null;
}

class OvlRefusal extends Error {}

/** A refusal the part turns into bad_input. */
export function ovlIsRefusal(err) {
  return err instanceof OvlRefusal;
}

function ovlRefuse(message) {
  return new OvlRefusal(message);
}

const ovlRound = (n) => +Number(n).toFixed(3);

/**
 * The windows to draw, as [{item, image, start_s, end_s}] in item order, then time order. Adjacent
 * windows of one item showing the same picture are merged, so a picture held across two scenes does
 * not scale in twice. Throws a refusal (bad_input) for an item that cannot be drawn; returns [] when
 * nothing applies (no scene names a product), and `notes` says why.
 *
 * duration_s: the video's length. timeline: its Timeline. scenes/products: plan.scenes, plan.products.
 */
export function ovlWindows({ items, duration_s, timeline, scenes, products }) {
  const notes = [];
  const out = [];
  const end = duration_s;
  const cardStart = timeline && timeline.end_card ? timeline.end_card.start_s : null;
  const spans = new Map(((timeline && timeline.scenes) || []).map((s) => [String(s.id), s]));
  items.forEach((item, k) => {
    const who = `items[${k}]`;
    // A binding to an optional file (brand.logo for a brand with no logo) resolves to nothing; the kit
    // drops the field, so the item is skipped rather than refusing the whole video.
    if (item.image == null) {
      notes.push(`${who} has no picture (the brand may have no logo), so it is skipped`);
      return;
    }
    const stop = item.until === 'end_card' && cardStart != null ? Math.min(cardStart, end) : end;
    const fromProduct = item.image === 'product_of_scene';
    if (fromProduct && item.scenes !== 'naming_product') throw ovlRefuse(`${who}: image "product_of_scene" needs scenes "naming_product", so each window knows its product`);
    if (item.scenes && (item.from_s != null || item.to_s != null)) throw ovlRefuse(`${who}: give either scenes or from_s/to_s, not both`);
    const windows = [];
    if (item.scenes === 'naming_product') {
      if (!Array.isArray(scenes) || !scenes.length) throw ovlRefuse(`${who}: scenes "naming_product" needs the plan's scenes`);
      if (!Array.isArray(products) || !products.length) throw ovlRefuse(`${who}: scenes "naming_product" needs the plan's products`);
      scenes.forEach((scene, i) => {
        const product = ovlSceneProduct(scene, products);
        if (!product) return;
        const id = scene.id == null ? String(i + 1) : String(scene.id);
        const span = spans.get(id);
        if (!span) {
          notes.push(`scene ${id} names ${product.name || product.id} but has no span on the timeline, so nothing is drawn for it`);
          return;
        }
        let image = item.image;
        if (fromProduct) {
          image = (product.images || [])[0];
          if (!image) throw ovlRefuse(`${who}: scene ${id} names the product "${product.name || product.id}", which has no photo to lay over it`);
        }
        windows.push({ image, start_s: span.start_s, end_s: span.end_s, scene_id: id });
      });
      if (!windows.length) notes.push(`${who}: no scene names a product, so nothing is drawn`);
    } else {
      const a = item.from_s == null ? 0 : item.from_s;
      const b = item.to_s == null ? stop : item.to_s;
      if (a >= end) throw ovlRefuse(`${who}: from_s (${a}) is at or past the video's end (${ovlRound(end)} s)`);
      if (b <= a) throw ovlRefuse(`${who}: the window ends (${ovlRound(b)} s) before it starts (from_s ${a} s)`);
      windows.push({ image: item.image, start_s: a, end_s: b });
    }
    // Clip to the video (and the end card when asked), then merge touching windows of one picture.
    const kept = [];
    for (const w of windows.sort((x, y) => x.start_s - y.start_s)) {
      const a = Math.max(0, w.start_s);
      const b = Math.min(stop, w.end_s);
      if (b - a < 1e-3) continue;
      const last = kept[kept.length - 1];
      if (last && last.image.sha256 === w.image.sha256 && a - last.end_s <= 0.05) last.end_s = Math.max(last.end_s, b);
      else kept.push({ item: k, image: w.image, start_s: a, end_s: b });
    }
    out.push(...kept);
  });
  if (out.length > OVL_MAX_WINDOWS) throw ovlRefuse(`the items draw ${out.length} windows; at most ${OVL_MAX_WINDOWS} are allowed`);
  return { windows: out.map((w) => ({ ...w, start_s: ovlRound(w.start_s), end_s: ovlRound(w.end_s) })), notes };
}

/**
 * Where an item's picture sits on a W x H video at full size: {w, h, x, y} in video pixels.
 * The picture keeps its aspect. width_px and margin_px are measured at a 1080-pixel short side.
 * Default width: 60% of the video's width in the centre (and no taller than half its height),
 * 15% in a corner. Never wider or taller than the video less its margins.
 */
export function ovlBox(item, picture, W, H) {
  const k = Math.min(W, H) / OVL_REFERENCE_SHORT_SIDE;
  const corner = item.corner || 'center';
  const margin = Math.round((item.margin_px == null ? 40 : item.margin_px) * k);
  const pw = picture.width;
  const ph = picture.height;
  if (!(pw > 0 && ph > 0)) throw ovlRefuse('a picture has no size; it may not be an image ffmpeg can read');
  const aspect = ph / pw;
  let w;
  if (item.width_px != null) w = item.width_px * k;
  else if (corner === 'center') w = Math.min(W * 0.6, (H * 0.5) / aspect);
  else w = W * 0.15;
  const maxW = Math.max(2, W - 2 * margin);
  const maxH = Math.max(2, H - 2 * margin);
  w = Math.min(w, maxW, maxH / aspect);
  w = Math.max(2, Math.round(w));
  const h = Math.max(2, Math.round(w * aspect));
  let x;
  let y;
  if (corner === 'center') {
    x = Math.round((W - w) / 2);
    y = Math.round((H - h) / 2);
  } else {
    x = corner.endsWith('left') ? margin : W - margin - w;
    y = corner.startsWith('top') ? margin : H - margin - h;
  }
  return { w, h, x, y };
}

function ovlNum(value) {
  return Number(value).toFixed(6).replace(/\.?0+$/, '') || '0';
}

/**
 * The filter graph that lays every window over input 0. `inputs` are the distinct pictures in the
 * order they are passed to ffmpeg after the video (input 1, 2, ...); each window names its picture by
 * `input`. A window with scale_in_s grows from OVL_SCALE_FROM to full size around its box's centre and
 * fades in over that time. Returns {graph, out} where out is the final video label.
 */
export function ovlFilterGraph(windows, { fps }) {
  const byInput = new Map();
  for (const w of windows) {
    if (!byInput.has(w.input)) byInput.set(w.input, []);
    byInput.get(w.input).push(w);
  }
  const chains = [];
  const label = new Map();
  for (const [input, list] of byInput) {
    const names = list.map((_, j) => `p${input}_${j}`);
    list.forEach((w, j) => label.set(w, names[j]));
    const split = list.length > 1 ? `,split=${list.length}${names.map((n) => `[${n}]`).join('')}` : `[${names[0]}]`;
    chains.push(`[${input}:v]fps=${ovlNum(fps)},format=rgba${split}`);
  }
  let base = '0:v';
  windows.forEach((w, i) => {
    const { box } = w;
    const a = ovlNum(w.start_s);
    const b = ovlNum(w.end_s);
    const steps = [];
    let x = String(box.x);
    let y = String(box.y);
    const d = w.scale_in_s || 0;
    if (d > 0) {
      const s = `(${OVL_SCALE_FROM}+${ovlNum(1 - OVL_SCALE_FROM)}*clip((t-${a})/${ovlNum(d)}\\,0\\,1))`;
      const sw = `max(2\\,trunc(${box.w}*${s}))`;
      const sh = `max(2\\,trunc(${box.h}*${s}))`;
      steps.push(`scale=w=${sw}:h=${sh}:eval=frame`, `fade=t=in:st=${a}:d=${ovlNum(d)}:alpha=1`);
      // The box grows around its centre; the position is worked out from the same size formula, so it
      // does not depend on how a given ffmpeg build reports the overlay's size per frame.
      x = `${ovlNum(box.x + box.w / 2)}-trunc(${box.w}*${s})/2`;
      y = `${ovlNum(box.y + box.h / 2)}-trunc(${box.h}*${s})/2`;
    } else {
      steps.push(`scale=w=${box.w}:h=${box.h}`);
    }
    if (w.opacity < 1) steps.push(`colorchannelmixer=aa=${ovlNum(w.opacity)}`);
    chains.push(`[${label.get(w)}]${steps.join(',')}[o${i}]`);
    const next = `v${i}`;
    chains.push(`[${base}][o${i}]overlay=x=${x}:y=${y}:enable=between(t\\,${a}\\,${b}):eof_action=pass:format=auto[${next}]`);
    base = next;
  });
  chains.push(`[${base}]format=yuv420p[vout]`);
  return { graph: chains.join(';'), out: 'vout' };
}
