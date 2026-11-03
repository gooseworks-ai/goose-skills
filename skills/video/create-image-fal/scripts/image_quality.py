"""GPT Image 2 quality from the customer's tier (custom videos, 16 Oct 2026).

Standard (the default) is medium, Best is high. Every GPT Image 2 request says its quality,
because the server prices a request with no quality as high. A quality above the tier's is a
one-shot upgrade: it needs a failed check at the cheaper setting, or the customer's ask, and
the caller records why (make_character.py does, through create-creator-takes-h3's tiers.py).
"""
TIER_QUALITY = {"standard": "medium", "best": "high"}
QUALITIES = ("low", "medium", "high")


def is_gpt_image_2(model):
    return model.startswith("openai/gpt-image-2")


def with_quality(model, payload, tier="standard", quality=None):
    """The payload with an explicit quality for a GPT Image 2 model, else unchanged. A quality
    already in the payload wins over the tier; one that disagrees with --quality is refused."""
    if not is_gpt_image_2(model):
        if quality:
            raise SystemExit("--quality is for openai/gpt-image-2 models")
        return payload
    if tier not in TIER_QUALITY:
        raise SystemExit("--tier must be one of %s" % ", ".join(TIER_QUALITY))
    given = payload.get("quality")
    if given and quality and given != quality:
        raise SystemExit("the payload says quality %s but --quality says %s" % (given, quality))
    chosen = given or quality or TIER_QUALITY[tier]
    if chosen not in QUALITIES:
        raise SystemExit("quality must be one of %s" % ", ".join(QUALITIES))
    return {**payload, "quality": chosen}
