#!/usr/bin/env bash
# Render every example in examples/ into tests/output/<date>-<slug>/.
# Usage: bash tests/run-all.sh

set -euo pipefail

cd "$(dirname "$0")/.."

for f in examples/*.json; do
  name=$(basename "$f" .json)
  echo "==> rendering $name"
  node render.js --note "$f" --output ./tests/output --name "$name"
done

echo
echo "done. open tests/output/<date>-<slug>/screenshot.png"
