# Verification

Run `python3 -m unittest discover -s tests -p "test_*.py"`. Use FFprobe and a full FFmpeg decode for streams, duration and frame count. Compare screenshots after out-of-order seeks, check visible content bounds every frame, inspect an encoded contact sheet, and measure final audio with `volumedetect`. Loop mode also compares first/last pixels.
