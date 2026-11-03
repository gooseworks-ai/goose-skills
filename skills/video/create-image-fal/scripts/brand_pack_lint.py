#!/usr/bin/env python3
"""Refuse an image request that would show the brand's own product as a blank pack.

A 15 Oct test video asked GPT Image 2 for a food pouch with "its unprinted back facing the
camera" and "no printed words", and sent no product photo. The pack in the hands read as a
different product. The rule "no brand text in a prompt" bans TYPING label text; it never means
removing the product's real label.

  lint_brand_pack(prompt, use, model, image_urls) -> list of problems ([] when it passes)

`use` says where the brand's product is in the picture:
  - "static": on a surface or flat. The words below are refused; the real photo is usually
    composited on afterwards (overlay).
  - "held":   held, opened, poured or used on screen. The words below are refused, the model
    must be openai/gpt-image-2/edit, and the real product photo must be image 1, its front
    facing the camera.

  python brand_pack_lint.py --use held --model openai/gpt-image-2/edit \
      --image https://.../pack-front.jpg --prompt "..."     exit 1 with the problems
"""
import argparse
import json
import re
import sys

HELD_MODEL = "openai/gpt-image-2/edit"
PACK = (r"(?:pack|packet|package|packaging|pouch|box|bag|bottle|jar|tube|tub|carton|sachet|can|tin|"
        r"wrapper|sleeve|label|front|side|back|lid|cap)s?")
# Words that ask for the advertised product without its real print.
BLANK_WORDS = [
    (re.compile(r"\bun-?printed\b", re.I), "unprinted"),
    (re.compile(r"\bun-?label(?:l)?ed\b|\blabel-?less\b|\blabel-?free\b", re.I), "unlabeled"),
    (re.compile(r"\bblank\b(?:\W+\w+){0,3}?\W+" + PACK + r"\b|\b" + PACK + r"\W+(?:\w+\W+){0,2}?blank\b", re.I), "blank"),
    (re.compile(r"\bno (?:printed )?(?:words|text|lettering|writing|print|label|logo|branding)\b(?:\W+\w+){0,2}?\W+(?:on|of)\b"
                r"|\bno printed (?:words|text|lettering|writing)\b|\bwithout (?:a |any |its )?(?:label|print|printing|branding)\b", re.I),
     "no printed words"),
    (re.compile(r"\bback (?:of the \w+ )?(?:is |)(?:facing|faces|turned to(?:wards)?) (?:the )?(?:camera|lens|viewer)\b"
                r"|\b(?:its|the) back (?:to|towards) the camera\b", re.I), "back facing the camera"),
]
FRONT = "Image 1 is the real product photo: keep its exact shape, colours and printed label, with its front facing the camera."


def blank_words(prompt):
    """The blank-pack words a prompt uses: [(label, matched text)]."""
    found = []
    for rx, label in BLANK_WORDS:
        m = rx.search(prompt or "")
        if m:
            found.append((label, m.group(0)))
    return found


def lint_brand_pack(prompt, use, model, image_urls, product_image=None):
    """Problems with an image request whose object is the brand's own product ([] when it passes)."""
    if use not in ("static", "held"):
        return ["--brand-product is static or held, not %r" % use]
    problems = ["the prompt asks for the brand's product %s (%r). Show its real label from the real photo; "
                "never ask for an unprinted, blank, unlabeled or back-facing pack. If the label garbles, reframe "
                "so the hands cover it, or cut to the real photo." % (label, text) for label, text in blank_words(prompt)]
    if use == "held":
        if model != HELD_MODEL:
            problems.append("a pack held or used on screen is made with %s (the real photo as image 1), not %s"
                            % (HELD_MODEL, model))
        if not product_image:
            problems.append("a pack held or used on screen needs --product-image, the real product photo, sent as image 1")
        elif image_urls and image_urls[0] != product_image:
            problems.append("the real product photo must be image 1; it is not first in image_urls")
    return problems


def with_front_line(prompt):
    """The prompt with the front-facing line added once."""
    return prompt if FRONT in prompt else (prompt.rstrip() + "\n\n" + FRONT)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--use", required=True, choices=["static", "held"])
    ap.add_argument("--model", required=True)
    ap.add_argument("--image", action="append", default=[], help="image_urls in order")
    a = ap.parse_args()
    problems = lint_brand_pack(a.prompt, a.use, a.model, a.image, a.image[0] if a.image else None)
    print(json.dumps({"pass": not problems, "problems": problems}, indent=1))
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
