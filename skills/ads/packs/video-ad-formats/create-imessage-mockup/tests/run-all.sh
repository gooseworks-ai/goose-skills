#!/usr/bin/env bash
# Render all example fixtures and dump PNGs into tests/output/
set -e
cd "$(dirname "$0")/.."

OUT_DIR="tests/output"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

declare -a CASES=(
  "dm-minimal:examples/dm-minimal.json:--minimal"
  "dm-with-keyboard:examples/dm-with-keyboard.json:--with-keyboard"
  "dm-with-typing:examples/dm-with-typing.json:--with-keyboard"
  "dm-with-frame:examples/dm-with-frame.json:--with-iphone-frame"
  "group-with-frame:examples/group-with-frame.json:--with-iphone-frame"
  "group-minimal:examples/group-minimal.json:--minimal"
)

for c in "${CASES[@]}"; do
  IFS=":" read -r name thread mode <<<"$c"
  echo "=== $name ==="
  node render.js --thread "$thread" $mode --output "$OUT_DIR/$name" --name "$name"
done

echo
echo "All renders complete. Outputs:"
find "$OUT_DIR" -name screenshot.png | sort
