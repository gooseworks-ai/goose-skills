// The paid requests a part version sends for a fixture: what `reuses_pieces_of` promises stays the
// same. Each order is reduced to what the private line's "already made" digest reads (piece,
// provider, path and body, files as their sha256), so two versions that give equal lists here
// order exactly the same pieces and the server can hand the old version's pieces to the new one.
// Tests only; parts never import it.
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PARTS_ROOT, canonicalJson, loadPart, makeCtx } from './kit-harness.mjs';

/** Where a part's fixture for the declaration lives. */
export const PIECES_FIXTURE = join('tests', 'pieces.fixture.mjs');

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** Every published version that declares `reuses_pieces_of`: [{ id, version, reuses }]. */
export function declaredReuses(root = PARTS_ROOT) {
  const out = [];
  for (const id of readdirSync(root).filter((name) => /^[a-z]/.test(name))) {
    const dir = join(root, id);
    let versions;
    try {
      versions = readdirSync(dir).filter((v) => SEMVER.test(v));
    } catch {
      continue;
    }
    for (const version of versions) {
      const file = join(dir, version, 'part.json');
      if (!existsSync(file)) continue;
      const manifest = JSON.parse(readFileSync(file, 'utf8'));
      if (manifest.reuses_pieces_of !== undefined) out.push({ id, version, reuses: manifest.reuses_pieces_of });
    }
  }
  return out;
}

/** The part's fixture cases: [{ name, inputs(dir), line(order, ctx) }]. */
export async function piecesFixture(id, root = PARTS_ROOT) {
  const file = join(root, id, PIECES_FIXTURE);
  if (!existsSync(file)) return null;
  const { cases } = await import(pathToFileURL(file).href);
  return Array.isArray(cases) ? cases : null;
}

/**
 * The orders one version sends for one case, as the line's digest sees them, in order, and what it
 * returned. The case's inputs are made once by the caller and shared, so both versions read the same bytes.
 */
export async function pieceBodies(id, version, kase, inputs) {
  const { dir, mod } = await loadPart(id, version);
  const workDir = mkdtempSync(join(tmpdir(), `pieces-${id}-${version}-`));
  const { ctx, orders } = makeCtx({ partDir: dir, workDir, stepId: kase.step ?? 'step', line: kase.line });
  const outputs = await mod.run(structuredClone(inputs), ctx);
  return {
    orders: orders.map((order) => canonicalJson({ piece: order.piece, provider: order.provider, path: order.path, body: order.body })),
    outputs: outputs && typeof outputs === 'object' ? outputs : {},
  };
}

/** A fresh folder for a case's shared inputs. */
export function inputsDir(id, name) {
  return mkdtempSync(join(tmpdir(), `pieces-${id}-${name.replace(/[^a-z0-9]+/gi, '-')}-`));
}
