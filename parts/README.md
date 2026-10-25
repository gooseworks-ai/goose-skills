# Parts

**In short**
- A part is a versioned video building block the GooseWorks kit loads: a cut, a voice, a caption layer, a check.
- Each version lives in `parts/<id>/<x.y.z>/` and **never changes once published**. Approved videos pin exact versions.
- You edit `parts/<id>/src/` (and the shared `parts/_lib/`), then **cut a new version**. CI refuses an edit to a published version, and a `src/` change with no new version.

## Layout

| Path | What it is |
|---|---|
| `parts/<id>/src/` | The source you edit. `src/part.mjs` is the entry. |
| `parts/<id>/<x.y.z>/` | One published version: `part.json` (the manifest), `part.mjs` (one bundled file), `README.md`. Frozen. |
| `parts/<id>/tests/` | The part's tests (`*.test.mjs`), run by `npm run test:parts`. |
| `parts/<id>/CHANGELOG.md` | One entry per version, newest first. |
| `parts/_lib/` | Code shared by parts. The bundler copies what a part imports into its `part.mjs`, so a `_lib` change reaches a part only through its next version. |
| `parts/_tools/` | The bundler, the part lint and the kit harness the tests use. |
| `parts/_contract/` | The part manifest schema. |
| `parts/index.json` | Every published version. Generated. |
| `parts/layers.json` | Which version fills each layer slot for new quotes. |
| `parts/withdrawn.json` | Versions that must not be used, each with a reason. |

## Cut a new version

1. Change `parts/<id>/src/` (or `parts/_lib/`) and the part's tests. Run `npm run test:parts`.
2. Pick the number. **Patch** for a fix that orders the same paid pieces; **minor** for a new check, option or output; **major** for a changed input or a new requirement.
3. Make the folder: copy the newest version's `part.json` and `README.md` into `parts/<id>/<x.y.z>/`, set `version` in `part.json`, and update its `summary`, `needs` and `files` if they changed.
4. Build the bundle: `node parts/_tools/bundle.mjs <id> <x.y.z>`. It writes `parts/<id>/<x.y.z>/part.mjs` from `src/`.
5. Add the `CHANGELOG.md` entry. Say what changed and why, in plain words.
6. Rebuild the index: `node scripts/build-parts-index.js`.
7. If new quotes should use it, point its slot in `parts/layers.json` at the new version.
8. Check: `node parts/_tools/bundle.mjs --check`, `node scripts/check-parts.js --base origin/dev`, `node parts/_tools/lint.mjs`, `npm run test:parts`.

A paid part reaches already-approved videos only when the new version lists the older ones in `reuses_pieces_of` and orders exactly the same pieces. CONTRIBUTING.md ("Moving approved videos to a fix") says how that is tested.

## Rules the lint enforces

- No network, child processes, clock or money inside a part (`node parts/_tools/lint.mjs`).
- A part never carries or imports the billing helper. It orders paid pieces only through `ctx.line.order`.
- No client names in new `src/` or `_lib/` text. Older frozen versions are exempt only because they cannot change.
