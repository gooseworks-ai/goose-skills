#!/usr/bin/env bash
# Run the full pipeline end-to-end against the canonical example.
# Output lands in tests/output/sample-run/.
#
# Usage: bash tests/run-all.sh

set -euo pipefail
cd "$(dirname "$0")/.."

MOLECULE_DIR="$(pwd)"
ATOM_NODE_MODULES="$(cd ../../atoms/messaging/create-apple-notes-mockup && pwd)/node_modules"
RUN_DIR="$MOLECULE_DIR/tests/output/sample-run"

# 1) Clean slate.
rm -rf "$RUN_DIR"
mkdir -p "$RUN_DIR"/{notes,clips,audio/sfx,edits,meta-upload}

# 2) Copy the canonical spec + scripts + sfx in.
cp examples/full-note.example.json    "$RUN_DIR/notes/note.json"
cp scripts/record-master.template.js  "$RUN_DIR/clips/record-master.js"
cp scripts/render-end-card.template.js "$RUN_DIR/clips/render-end-card.js"
cp scripts/end-card.template.html      "$RUN_DIR/clips/end-card.template.html"
cp scripts/stitch.template.sh          "$RUN_DIR/edits/stitch.sh"
chmod +x "$RUN_DIR/edits/stitch.sh"
cp assets/sfx/kb-tick.mp3 assets/sfx/kb-space.mp3 assets/sfx/kb-return.mp3 "$RUN_DIR/audio/sfx/"

# 3) Record + render + stitch.
( cd "$RUN_DIR/clips" && NODE_PATH="$ATOM_NODE_MODULES" node record-master.js )
( cd "$RUN_DIR/clips" && NODE_PATH="$ATOM_NODE_MODULES" node render-end-card.js )
( cd "$RUN_DIR" && bash edits/stitch.sh --export-9x16 )

echo
echo "Done. Inspect:"
echo "  $RUN_DIR/edits/master-final.mp4         (native 1180×2556)"
echo "  $RUN_DIR/meta-upload/master-9x16-1080.mp4 (9:16 social export)"
