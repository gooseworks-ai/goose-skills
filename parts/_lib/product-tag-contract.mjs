// Opt-in scene routing and request evidence for product stills and their motion.
// Evidence comes from the producer part's actual request and returned file hash;
// the locked style binds this output to the motion step, never to plan prose.
import { createHash } from 'node:crypto';
import { kitNamedProducts, kitPickScenes, kitSceneTag, kitTagKey, kitWholeWordsRe } from './scene-match.mjs';

const KIT_PRODUCT_SHA = /^[0-9a-f]{64}$/;
const KIT_PRODUCT_EDIT = 'openai/gpt-image-2/edit';

/** Validate only styles that explicitly opt into strict by_tag routing. */
export function kitRequireSceneTags(tpl, scenes, options = {}) {
  const tags = Object.keys(tpl.by_tag || {});
  if (!tags.length) throw new Error('required scene tags need a template with by_tag rules');
  const keys = new Map(tags.map((tag) => [kitTagKey(tag), tag]));
  for (const { scene, index } of kitPickScenes(scenes, options.pick, options)) {
    const who = `scene ${scene.id ?? index + 1}`;
    const picture = typeof scene.picture === 'string' ? scene.picture.trim() : '';
    const prefix = kitSceneTag({ picture });
    const shot = scene.extra && scene.extra.shot;
    const structured = typeof shot === 'string' && shot.trim() ? shot.trim() : null;
    if (structured && !keys.has(kitTagKey(structured))) throw new Error(`${who} has unknown extra.shot "${structured}"; choose ${tags.join(', ')}`);
    if (prefix && !keys.has(kitTagKey(prefix))) throw new Error(`${who} has unknown picture tag "${prefix}"; choose ${tags.map((tag) => `${tag}:`).join(', ')}`);
    if (prefix && structured && kitTagKey(prefix) !== kitTagKey(structured)) throw new Error(`${who}'s picture tag "${prefix}" disagrees with extra.shot "${structured}"`);
    if (!prefix) {
      const missingColon = tags.find((tag) => {
        const re = kitWholeWordsRe(tag);
        const match = re && re.exec(picture);
        return match && match.index === 0;
      });
      if (missingColon) throw new Error(`${who}'s picture needs a colon after "${missingColon}": use "${missingColon}: ..."`);
    }
    if (!prefix && !structured) throw new Error(`${who} needs a scene tag: start the picture with ${tags.map((tag) => `${tag}:`).join(', ')} or set extra.shot`);
  }
}

/** Products the picture names, or the selected product for a product-reference rule. */
export function kitProductScenePhotos(tpl, scene, products = []) {
  const tag = kitSceneTag(scene);
  const key = Object.keys(tpl.by_tag || {}).find((value) => kitTagKey(value) === kitTagKey(tag));
  const rule = key == null ? null : tpl.by_tag[key];
  const refs = Array.isArray(rule && rule.refs) ? rule.refs : Array.isArray(tpl.refs) ? tpl.refs : [];
  const selectedText = ['scene', 'motion', 'prefix', 'suffix'].map((key) => rule && typeof rule[key] === 'string' ? rule[key] : tpl[key]).filter((value) => typeof value === 'string').join('\n');
  const picture = typeof scene.picture === 'string' ? scene.picture : '';
  const productPrefix = /^\s*(?:Product|Hold\s+[1-5])(?:\s|:)/i.test(picture);
  const needsProduct = refs.includes('product') || /\{product\.name\??\}/.test(selectedText) || productPrefix;
  let named = kitNamedProducts(scene, products);
  if (!named.length && needsProduct && products.length === 1) named = products;
  if (needsProduct && !named.length) throw new Error(`scene ${scene.id} needs a named product with a real photo`);
  return named.map((product) => {
    const photo = Array.isArray(product.images) && product.images[0];
    if (!photo || !KIT_PRODUCT_SHA.test(photo.sha256 || '')) throw new Error(`scene ${scene.id} needs the real photo of ${product.name || product.id}`);
    return { id: String(product.id), sha256: photo.sha256 };
  });
}

/** Check the files in the actual provider request, after reference selection/capping. */
export function kitRequireProductRequest(sceneId, required, refs, model) {
  const actual = (refs || []).map((file) => file && file.sha256).filter((sha) => KIT_PRODUCT_SHA.test(sha || ''));
  for (const photo of required || []) {
    if (model !== KIT_PRODUCT_EDIT || !actual.includes(photo.sha256)) throw new Error(`scene ${sceneId}'s actual still request omits its real product photo (${photo.id})`);
  }
  return actual;
}

function kitProductEvidenceDigest(row) {
  return createHash('sha256').update(JSON.stringify([row.version, row.scene_id, row.image_sha256,
    row.product_photos, row.request_image_sha256, row.model, row.piece])).digest('hex');
}

/** Bind a successful still's hash to the real product photos in its actual request. */
export function kitProductReferenceEvidence(sceneId, image, required, refs, model, piece) {
  if (!KIT_PRODUCT_SHA.test(image && image.sha256 || '')) throw new Error(`scene ${sceneId}'s generated still has no verified hash`);
  const row = { version: 1, scene_id: String(sceneId), image_sha256: image.sha256,
    product_photos: (required || []).map((photo) => ({ ...photo })),
    request_image_sha256: kitRequireProductRequest(sceneId, required, refs, model), model, piece };
  return { ...row, digest: kitProductEvidenceDigest(row) };
}

/** Refuse missing, altered or misbound evidence before any motion clip is ordered. */
export function kitRequireProductFrame(sceneId, still, required, evidence = []) {
  if (!(required || []).length) return;
  const found = evidence.filter((row) => row.scene_id === String(sceneId));
  if (found.length !== 1) throw new Error(`scene ${sceneId} needs one product-reference evidence record from its still step`);
  const row = found[0];
  if (row.version !== 1 || row.model !== KIT_PRODUCT_EDIT || row.image_sha256 !== (still && still.sha256)) throw new Error(`scene ${sceneId}'s product-reference evidence is not bound to this Veo start frame`);
  if (row.digest !== kitProductEvidenceDigest(row)) throw new Error(`scene ${sceneId}'s product-reference evidence was altered`);
  for (const photo of required) {
    const matched = row.product_photos.some((source) => source.id === photo.id && source.sha256 === photo.sha256);
    if (!matched || !row.request_image_sha256.includes(photo.sha256)) throw new Error(`scene ${sceneId}'s still request did not include its current real product photo (${photo.id})`);
  }
}
