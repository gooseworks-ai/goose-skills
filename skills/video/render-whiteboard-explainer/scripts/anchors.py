#!/usr/bin/env python3
"""Resolve a word anchor against the voiceover. ONE implementation, shared.

There were briefly two: the solver preferred an exact match and refused an ambiguous anchor,
while the renderer kept the old lenient starts-with matcher. On the same `episode.json` they
disagreed — `"In"` with `anchor_n: 2` resolved to "In" at 22.48s in the solver and to
"**in**gredients" at 19.49s in the renderer. The solver validated a layout that the renderer
then drew differently, and reported no problems while doing it.

Any check that runs against a different implementation than the thing it checks is not a check.
"""
import sys

norm = lambda s: "".join(c for c in str(s).lower() if c.isalnum())


def candidates(words, anchor):
    """Words matching an anchor. An EXACT match wins outright: without that, "In" also collects
    "ingredients" and the nth match silently becomes a different word."""
    a = norm(anchor)
    exact = [w for w in words if norm(w["w"]) == a]
    return exact if exact else [w for w in words if norm(w["w"]).startswith(a)]


def resolve(words, anchor, n=None, strict=True):
    """Return (start_time, word). With strict, REFUSE an ambiguous anchor rather than guess.

    A fuzzy matcher feeding a sorting key is a silent reordering bug: an anchor that resolved
    0.72s instead of 22.48s once dragged a whole act to the front of a video, which then played
    its ending first with no error anywhere.
    """
    pool = candidates(words, anchor)
    if not pool:
        sys.exit(f'anchor "{anchor}" is not in the voiceover')
    if strict and len(pool) > 1 and n is None:
        opts = ", ".join(f'{w["w"]}@{w["s"]:.2f}' for w in pool)
        sys.exit(f'anchor "{anchor}" is ambiguous ({len(pool)} matches: {opts}). '
                 f'Give a count to pick one.')
    k = (n or 1) - 1
    if k >= len(pool):
        sys.exit(f'anchor "{anchor}" has {len(pool)} matches; {n} asked for more')
    return pool[k]["s"], pool[k]["w"]
