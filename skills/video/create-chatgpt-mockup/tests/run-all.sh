#!/usr/bin/env bash
# Render every example into tests/output/ for visual review.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
OUT="$ROOT/tests/output"
rm -rf "$OUT"
mkdir -p "$OUT"

for ex in examples/*.json; do
  name="$(basename "$ex" .json)"
  echo ""
  echo "▶ $name"
  node "$ROOT/render.js" --thread "$ex" --output "$OUT" --name "$name"
done

echo ""
echo "✓ All examples rendered into $OUT"
