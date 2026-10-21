"""Parity tests for compose.py against ../references/composer.md.

Run from this folder: python3 -m unittest

Every fenced block in composer.md §5, §6, §8 and §10 has exactly one checker below (test_every_block_has_a_checker
fails if composer.md gains, loses or rewrites a block). Each checker fills the block's «placeholders» from a test ad,
asserts the result appears verbatim in compose.py's output when the block's condition holds, and asserts it is absent
when it does not.
"""

import copy
import json
import os
import re
import subprocess
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import compose  # noqa: E402

COMPOSER_MD = os.path.join(HERE, "..", "references", "composer.md")
SECTIONS = (5, 6, 8, 10)


def extract_blocks():
    """Fenced blocks of composer.md §5, §6, §8, §10 as dicts {section, line, lang, text}."""
    lines = open(COMPOSER_MD, encoding="utf-8").read().split("\n")
    blocks, section, inside, start, lang, body = [], None, False, 0, "", []
    for i, line in enumerate(lines, 1):
        m = re.match(r"^## (\d+)\.", line)
        if m and not inside:
            section = int(m.group(1))
        if line.startswith("```"):
            if not inside:
                inside, start, lang, body = True, i, line[3:], []
            else:
                inside = False
                if section in SECTIONS:
                    blocks.append({"section": section, "line": start, "lang": lang, "text": "\n".join(body)})
            continue
        if inside:
            body.append(line)
    return blocks


BLOCKS = extract_blocks()


def fill(text, mapping):
    for key, value in mapping.items():
        text = text.replace(key, value)
    assert "«" not in text, "unfilled placeholder in: " + text[:200]
    return text


# ---------------------------------------------------------------------------------------------------------------------
# Fixtures. A made-up brand; every value is literal so the expected text is derived independently of compose.py.
# ---------------------------------------------------------------------------------------------------------------------

LOGO = "https://cdn.test/logo.png"
TEMPLATE_URL = "https://cdn.test/template.jpg"


def base_ad():
    return {
        "brand_id": "brand_test",
        "kit": {
            "name": "brightloom",
            "description": "Brightloom sells washable wool rugs.",
            "audience": "First-time home owners.",
            "voice": "Calm and direct.",
            "brandType": "physical",
            "valueProps": ["Machine washable", "Made of wool"],
            "proofPoints": ["Wool from one farm", "Two-year warranty"],
            "websiteUrl": "https://brightloom.test",
            "messagingAngles": [{"name": "Easy clean", "statement": "Wash it at home."}],
            "primaryColor": "#224466",
            "accentColor": "#ee8833",
            "backgroundColor": "#faf7f0",
            "textColor": "#111111",
            "paletteRead": "Navy with warm orange.",
            "palette": ["#224466", "#faf7f0", "#ee8833"],
            "typography": {"heading": "Fraunces", "body": "Inter", "headingDescriptor": "soft serif",
                           "bodyDescriptor": "neutral sans", "source": "mapped"},
            "fonts": {"heading": "Fraunces", "body": "Inter", "families": ["Fraunces", "Inter"]},
            "products": [{"name": "Wool Rug", "adEligibility": "eligible", "aiCreativeNotes": "Lay it flat."}],
            "logoUrl": LOGO,
            "referenceImages": [
                {"url": "https://cdn.test/rug-1.jpg", "productName": "Wool Rug", "kind": None},
                {"url": "https://cdn.test/rug-2.jpg", "productName": "Wool Rug", "kind": None},
            ],
            "docs": {"Summary": "Brightloom makes rugs."},
            "instructions": "Never show shoes on the rug.",
        },
        "learnings": [],
        "template": {"id": "tpl", "title": "Rug hero", "description": "One rug, one headline.", "layout_type": "hero",
                     "style_tags": ["minimal", "warm"], "mood_tags": ["calm"], "text_complexity": "low",
                     "remix_spec": None, "ratio": "1:1", "source_kind": "upload", "source_image_url": TEMPLATE_URL,
                     "remix_engine": None},
        "product_name": None,
        "no_logo": False,
        "apply_brand_colors": True,
        "scheme": None,
        "font": "brand",
        "user_instructions": "Make it cosy.",
        "ratios": ["1:1"],
    }


SCHEME = {"background": "#faf7f0", "ink": "#111111", "accent": "#224466"}
SCHEME_ON_ACCENT = "#ffffff"  # readableInk("#224466"): white beats #111111 on navy
BLUEPRINT = "FUNCTIONAL BLUEPRINT:\n- One product hero.\n- One headline, top."


def ad_with(**changes):
    ad = base_ad()
    for key, value in changes.items():
        if key.startswith("kit_"):
            ad["kit"][key[4:]] = value
        elif key.startswith("template_"):
            ad["template"][key[9:]] = value
        else:
            ad[key] = value
    return ad


def structure_only(**changes):
    ad = ad_with(template_source_kind="competitor_scrape", **changes)
    ad["structure"] = {"blueprint_instruction": BLUEPRINT, "media_slot": "product"}
    return ad


def product_ad(**changes):
    """A selected product with a size reference and photos."""
    ad = ad_with(product_name="Wool Rug", **changes)
    ad["product"] = {"name": "Wool Rug", "description": "A 2x3 m wool rug.", "pricing": "$240", "offers": "10% off",
                     "notes": "Wash at 30.", "ai_creative_notes": "Lay it flat.",
                     "size_reference_urls": ["https://cdn.test/size-1.jpg"]}
    return ad


def multi_product(ad):
    ad["kit"]["products"] = ad["kit"]["products"] + [
        {"name": "Rug Pad", "adEligibility": "eligible", "aiCreativeNotes": "Under the rug."},
        {"name": "Gift Card", "adEligibility": "hidden", "aiCreativeNotes": "Never shown."},
    ]
    return ad


def inp(ad):
    return compose.build_compose_input(copy.deepcopy(ad))[0]


def instruction_lines(ad):
    """The §5 part of the input (everything before the context)."""
    text = inp(ad)
    return text.split(compose.COMPOSE_OUTPUT_INSTRUCTION)[0].split("\n")


def context(ad):
    return inp(ad).split(compose.COMPOSE_OUTPUT_INSTRUCTION + "\n\n", 1)[1]


def answer(prompt="Hero {{ref:product-1}}.", ids=("product-1",), target="product", source="product", **extra):
    a = {"prompt": prompt, "title": "Cosy Rug", "source_media": source, "target_media": target,
         "adapted_subject": "The rug lies flat.", "reference_ids": list(ids)}
    a.update(extra)
    return a


def fin(ad, ans):
    return compose.build_final(copy.deepcopy(ad), copy.deepcopy(ans))


# ---------------------------------------------------------------------------------------------------------------------
# Block checkers. Key = the start of the block's first non-empty line.
# ---------------------------------------------------------------------------------------------------------------------

class Checks(unittest.TestCase):
    """Each check_* method receives the block text."""

    # ---- §5 helpers
    def present_iff(self, block, yes_ads, no_ads, where=instruction_lines):
        for ad in yes_ads:
            self.assertIn(block, where(ad), "expected block missing")
        for ad in no_ads:
            self.assertNotIn(block, where(ad), "block present when its condition is false")

    def always(self, block):
        self.present_iff(block, [base_ad(), structure_only(), product_ad(no_logo=True)], [])

    # ---- §5
    def check_l1_structure(self, b):
        self.present_iff(b, [structure_only()], [base_ad()])

    def check_l1_normal(self, b):
        self.present_iff(b, [base_ad(), product_ad()], [structure_only()])

    def check_l2_structure(self, b):
        self.present_iff(b, [structure_only()], [base_ad()])
        self.assertIn(b + "\n" + BLUEPRINT + "\n" + compose.ADAPT_SUBJECT, inp(structure_only()))

    def check_l2_normal(self, b):
        self.present_iff(b, [base_ad()], [structure_only()])

    def check_scene(self, b):
        self.present_iff(b, [structure_only()], [base_ad()])

    def check_user_uploads(self, b):
        self.present_iff(b, [ad_with(user_uploads=["https://cdn.test/u1.jpg"])],
                         [base_ad(), ad_with(user_uploads=["ftp://not-http"])])

    def check_colors_by_role(self, b):
        filled = fill(b, {"«scheme.background»": SCHEME["background"], "«scheme.ink»": SCHEME["ink"],
                          "«scheme.accent»": SCHEME["accent"], "«scheme.on_accent»": SCHEME_ON_ACCENT})
        self.present_iff(filled, [ad_with(scheme=SCHEME)],
                         [base_ad(), ad_with(scheme=SCHEME, apply_brand_colors=False)])

    def check_colors_restyle(self, b):
        self.present_iff(b, [base_ad()], [ad_with(scheme=SCHEME), ad_with(apply_brand_colors=False)])

    def check_colors_keep(self, b):
        self.present_iff(b, [ad_with(apply_brand_colors=False)],
                         [base_ad(), ad_with(apply_brand_colors=False, template_source_kind="curated",
                                             structure={"blueprint_instruction": BLUEPRINT})])

    def check_typo_surgical(self, b):
        pairing = {"heading": "Playfair Display", "heading_descriptor": "high-contrast serif", "body": "Inter",
                   "body_descriptor": "neutral sans"}
        self.present_iff(b, [base_ad(), ad_with(font="pairing", font_pairing=pairing)],
                         [ad_with(font="template"), ad_with(font="none")])

    def check_typo_keep(self, b):
        self.present_iff(b, [ad_with(font="template")], [base_ad(), ad_with(font="none")])

    def check_always(self, b):
        self.always(b)

    def check_size_refs(self, b):
        self.present_iff(b, [product_ad()], [base_ad(), ad_with(product_name="Wool Rug")])

    def check_size_estimate(self, b):
        self.present_iff(b, [base_ad(), ad_with(product_name="Wool Rug")], [product_ad()])

    def check_no_logo(self, b):
        self.present_iff(b, [ad_with(no_logo=True)], [base_ad()])

    def check_logo_attached(self, b):
        self.present_iff(b, [base_ad(), ad_with(kit_logoUrl=None)], [ad_with(no_logo=True)])

    def check_logo_lettering(self, b):
        filled = fill(b, {"«scheme.ink»": SCHEME["ink"]})
        self.assertIn(compose.LOGO_ATTACHED + filled, instruction_lines(ad_with(scheme=SCHEME)))
        # The scheme drives this line even when the colours are kept (composer.md §3).
        self.assertIn(compose.LOGO_ATTACHED + filled,
                      instruction_lines(ad_with(scheme=SCHEME, apply_brand_colors=False)))
        self.assertNotIn(filled, inp(base_ad()))
        self.assertNotIn(filled, inp(ad_with(scheme=SCHEME, no_logo=True)))

    def check_no_photo_product(self, b):
        ad = ad_with(product_name="Wool Rug", kit_referenceImages=[])
        self.present_iff(fill(b, {"«selected.name»": "Wool Rug"}), [ad], [product_ad(), base_ad()])

    def check_product_led(self, b):
        self.present_iff(b, [multi_product(product_ad())], [product_ad(), multi_product(base_ad())])

    def check_output_instruction(self, b):
        self.present_iff(b, [base_ad(), structure_only(), product_ad(no_logo=True)], [], where=inp)
        self.assertIn(b + "\n\n## Source template\n", inp(base_ad()))
        self.assertIn(b + "\n\n\n## Brand\n", inp(structure_only()))

    # ---- §6.1
    def check_source_template(self, b):
        mapping = {"«template.title»": "Rug hero", "«template.description»": "One rug, one headline.",
                   "«template.layout_type»": "hero", '«template.style_tags joined ", "»': "minimal, warm",
                   '«template.mood_tags joined ", "»': "calm", "«template.text_complexity»": "low",
                   "«template.remix_spec.prompt»": "Keep the headline short."}
        full = fill(b, mapping)
        self.assertTrue(context(ad_with(template_remix_spec={"prompt": "Keep the headline short."}))
                        .startswith(full + "\n\n## Brand\n"))
        no_spec = full.split("\n\n## Template remix")[0]
        self.assertTrue(context(base_ad()).startswith(no_spec + "\n\n## Brand\n"))
        self.assertNotIn("## Template remix", inp(ad_with(template_remix_spec={"prompt": 5})))
        self.assertNotIn("Description:", context(ad_with(template_description=None)).split("## Brand")[0])
        self.assertNotIn("## Source template", inp(structure_only()))

    # ---- §6.2
    def brand_lines(self, b):
        mapping = {"«kit.name»": "brightloom", "«kit.description»": "Brightloom sells washable wool rugs.",
                   "«kit.audience»": "First-time home owners.", "«kit.voice»": "Calm and direct.",
                   "«kit.brandType»": "physical", '«kit.valueProps joined " | "»': "Machine washable | Made of wool",
                   '«kit.proofPoints joined " | "»': "Wool from one farm | Two-year warranty",
                   "«kit.websiteUrl»": "https://brightloom.test",
                   '«first 6 of kit.messagingAngles as "name — statement", joined " | "»': "Easy clean — Wash it at home."}
        return [(re.sub(r"\s+← .*$", "", line), "← omitted when productLed" in line)
                for line in fill(b, mapping).split("\n")]

    def check_brand(self, b):
        lines = self.brand_lines(b)
        self.assertIn("\n".join(l for l, _ in lines) + "\n", context(base_ad()))
        led = multi_product(product_ad())
        led_text = "\n".join(l for l, omit in lines if not omit)
        self.assertIn(led_text + "\n", context(led))
        for line, omit in lines:
            if omit:
                self.assertNotIn(line, context(led))
        # Departure 1: the featured product's usable facts come back on the product-led path.
        dep = dict(led, proof_points=["Washes at 30", "One farm"])
        self.assertIn("Voice: Calm and direct.\nProof points: Washes at 30 | One farm\nMessaging angles",
                      context(dep))
        self.assertIn(1, fin(dep, answer(ids=("product-1",)))["departures_used"])
        # Lines with no value are omitted.
        self.assertNotIn("Audience:", context(ad_with(kit_audience="")))

    def check_scheme_lines(self, b):
        filled = fill(b, {"«scheme.background»": SCHEME["background"], "«scheme.ink»": SCHEME["ink"],
                          "«scheme.accent»": SCHEME["accent"]})
        self.present_iff(filled, [ad_with(scheme=SCHEME)], [base_ad(), ad_with(scheme=SCHEME, apply_brand_colors=False)],
                         where=context)

    def check_palette_lines(self, b):
        filled = fill(b, {"«kit.primaryColor»": "#224466", "«kit.accentColor»": "#ee8833",
                          "«kit.backgroundColor»": "#faf7f0", "«kit.textColor»": "#111111",
                          "«kit.paletteRead»": "Navy with warm orange.",
                          '«kit.palette joined ", "»': "#224466, #faf7f0, #ee8833"})
        self.present_iff(filled, [base_ad()], [ad_with(scheme=SCHEME), ad_with(apply_brand_colors=False)],
                         where=context)
        partial = context(ad_with(kit_accentColor=None, kit_palette=["#224466"]))
        lines = filled.split("\n")
        self.assertIn("\n".join([lines[0], lines[2], lines[3], lines[4]]), partial)
        self.assertNotIn("Brand palette", partial)

    def check_ctx_colors_keep(self, b):
        self.present_iff(b, [ad_with(apply_brand_colors=False)], [base_ad()], where=context)

    def check_ctx_typo_keep(self, b):
        self.present_iff(b, [ad_with(font="template")], [base_ad()], where=context)

    def check_products_line(self, b):
        ad = multi_product(base_ad())
        filled = fill(b, {'«first 4 adProducts names joined ", "»': "Wool Rug, Rug Pad"})
        self.present_iff(filled, [ad], [multi_product(product_ad())], where=context)
        self.assertNotIn("Products:", context(multi_product(product_ad())))

    def check_ctx_no_logo(self, b):
        self.present_iff(b, [ad_with(no_logo=True)], [base_ad()], where=context)

    def check_ctx_logo(self, b):
        self.present_iff(b, [base_ad()], [ad_with(no_logo=True), ad_with(kit_logoUrl=None)], where=context)

    def check_typography_line(self, b):
        expected = fill(b, {"«heading»": "Fraunces", "«typo.headingDescriptor»": "soft serif", "«body»": "Inter",
                            "«typo.bodyDescriptor»": "neutral sans", "«accentPart»": ""})
        self.present_iff(expected, [base_ad()], [ad_with(font="template"), ad_with(font="none")], where=context)
        typo = dict(base_ad()["kit"]["typography"], accent="Caveat", accentDescriptor="handwritten")
        with_accent = fill(b, {"«heading»": "Fraunces", "«typo.headingDescriptor»": "soft serif", "«body»": "Inter",
                               "«typo.bodyDescriptor»": "neutral sans",
                               "«accentPart»": ", accent in Caveat (handwritten)"})
        self.assertIn(with_accent, context(ad_with(kit_typography=typo)))
        # composer.md §6.3's worked example (Graza, staging): the extracted name with the stand-in's descriptor.
        graza = ad_with(kit_fonts={"heading": "ITC Garamond Condensed"},
                        kit_typography={"heading": "Bebas Neue", "headingDescriptor": "tall condensed display sans",
                                        "bodyDescriptor": "tall condensed display sans", "source": "mapped"})
        graza["kit"]["fonts"]["body"] = "ITC Garamond Condensed"
        self.assertIn("Typography: headings in ITC Garamond Condensed (tall condensed display sans), body in ITC "
                      "Garamond Condensed (tall condensed display sans) — render text in this EXACT font family, in "
                      "its own letterforms.", context(graza))
        # sanitizeFontFamily: framework artefacts, vendor suffixes, generics.
        self.assertEqual(compose.sanitize_font_family("'__Inter_Fallback_3a0388', sans-serif"), "Inter")
        self.assertEqual(compose.sanitize_font_family("sofia-pro-soft-v2"), "Sofia Pro Soft")
        self.assertIsNone(compose.sanitize_font_family("sans-serif"))
        self.assertIsNone(compose.sanitize_font_family("var(--font)"))

    # ---- §6.4
    def check_featured(self, b):
        mapping = {"«selected.name»": "Wool Rug", "«selected.description»": "A 2x3 m wool rug.", "«price»": "$240",
                   "«selected.offers»": "10% off", "«selected.notes, first 1200 characters»": "Wash at 30.",
                   "«selected.aiCreativeNotes, first 1200 characters»": "Lay it flat."}
        self.present_iff(fill(b, mapping), [product_ad()], [base_ad()], where=context)
        free = product_ad()
        free["product"].update(pricing="$0.00", notes="x" * 1500)
        ctx = context(free)
        self.assertIn("Price: Free\n", ctx)
        self.assertIn("Product details:\n" + "x" * 1200 + "\nCreative", ctx)
        self.assertNotIn("x" * 1201, ctx)

    def check_ctx_size_ref(self, b):
        self.present_iff(b, [product_ad()], [ad_with(product_name="Wool Rug"), base_ad()], where=context)

    def check_ctx_size_est(self, b):
        self.present_iff(b, [ad_with(product_name="Wool Rug")], [product_ad(), base_ad()], where=context)

    def check_ctx_no_photo(self, b):
        self.present_iff(b, [ad_with(product_name="Wool Rug", kit_referenceImages=[])],
                         [product_ad(), base_ad(), ad_with(product_name="Wool Rug", kit_referenceImages=[],
                                                           user_uploads=["https://cdn.test/u.jpg"])], where=context)

    # ---- §6.5
    def check_learnings(self, b):
        rows = [{"kind": "must", "text": "Keep wool texture."}, {"kind": "dont", "text": "No shoes."},
                {"kind": "do", "text": "Use daylight."}, {"kind": "template_hint", "text": "Hero works."},
                {"kind": "insight", "text": "Navy wins."}]
        filled = fill(b, {"«must rows»": "Keep wool texture.", "«dont rows»": "No shoes.", "«do rows»": "Use daylight.",
                          "«template_hint rows»": "Hero works.", "«insight rows»": "Navy wins."})
        self.present_iff(filled, [ad_with(learnings=rows)], [base_ad()], where=context)
        partial = context(ad_with(learnings=[rows[1]]))
        self.assertIn(b.split("\n")[0] + "\nAVOID:\n- No shoes.\n", partial)
        self.assertNotIn("ALWAYS", partial)
        many = [{"kind": "do", "text": "rule %d" % i} for i in range(10)]
        ctx = context(ad_with(learnings=many))
        self.assertIn("- rule 7\n", ctx)
        self.assertNotIn("- rule 8", ctx)

    def feedback_ad(self, reasons):
        text = ("Recurring ad-feedback failure modes over the last 30 days (5 flagged ads): "
                + ", ".join("%s ×%d" % (r, 3) for r in reasons) + ". Generation is biased to correct these.")
        return ad_with(learnings=[{"kind": "insight", "text": text, "source": "feedback_reasons"}])

    def check_recurring(self, b):
        directive = compose.REASON_DIRECTIVES["too_busy"]
        filled = fill(b, {"«directive per reason»": directive})
        self.present_iff(filled, [self.feedback_ad(["too_busy"])], [base_ad()], where=context)
        self.assertIn("these.\n\n" + b.split("\n")[0],
                      context(ad_with(learnings=[{"kind": "insight", "text": "Navy."},
                                                 self.feedback_ad(["too_busy"])["learnings"][0]])))

    def check_directives(self, b):
        table = dict(line.split(": ", 1) for line in b.split("\n"))
        self.assertEqual(set(table), set(compose.REASON_DIRECTIVES))
        order = ["too_busy", "wrong_product", "off_brand", "text_garbled", "weak_copy", "ai_or_distorted",
                 "brand_or_logo_wrong"]
        ctx = context(self.feedback_ad(order))
        self.assertIn("\n".join("- " + table[r] for r in order) + "\n\n## User instructions", ctx)
        none = context(ad_with(learnings=[{"kind": "insight", "source": "feedback_reasons",
                                           "text": "No recurring ad-feedback failure mode in the last 30 days (2 flagged ads)."}]))
        self.assertNotIn("## Recurring rejection", none)

    # ---- §6.6
    def check_angle_line(self, b):
        line = fill(b, {"«angle»": "Easy clean"})
        self.assertIn("## User instructions (highest priority)\nMake it cosy.\n\n" + line,
                      context(ad_with(messaging_angle="Easy clean")))
        self.assertNotIn(line, context(ad_with(messaging_angle="COSY")))
        self.assertNotIn("Messaging angle for THIS", context(base_ad()))
        self.assertIn("## User instructions (highest priority)\n" + line,
                      context(ad_with(user_instructions="", messaging_angle="Easy clean")))

    # ---- §6.7
    def check_variant_directives(self, b):
        entries = json.loads(b)
        self.assertNotIn("## Variant directive", context(ad_with(variant={"index": 0})))
        for k in range(1, 7):
            self.assertTrue(context(ad_with(variant={"index": k})).endswith(
                "\n\n## Variant directive\n" + entries[(k - 1) % 3]["directive"]))

    def check_variant_brief(self, b):
        filled = fill(b, {"«angle directive»": compose.VARIANT_BRIEF_ANGLE_COPY["problem"],
                          "«message»": "For renters who hate stains."})
        ad = ad_with(variant={"brief": {"angle": "problem", "message": "  For renters who hate stains. "}})
        self.assertTrue(context(ad).endswith("\n\n## Variant directive\n" + filled))
        first = filled.split("\n")[0]
        self.assertTrue(context(ad_with(variant={"brief": {"angle": "problem"}})).endswith("\n" + first))

    def check_angle_copy(self, b):
        for key, text in json.loads(b).items():
            self.assertTrue(context(ad_with(variant={"brief": {"angle": key}})).endswith("Variant brief: " + text))
        with self.assertRaises(compose.ComposeError):
            inp(ad_with(variant={"brief": {"angle": "Problem"}}))

    # ---- §6.8
    def check_assembly(self, b):
        ad = product_ad(learnings=[{"kind": "do", "text": "Daylight."}], variant={"index": 1},
                        template_remix_spec={"prompt": "Short."})
        ctx = context(ad)
        order = ["## Source template", "## Template remix instructions", "\n\n## Brand\n", "\n\n## Featured product",
                 "\n\n## Available brand reference images (select by stable ID)\n", "\n\n## Brand research — Summary\n",
                 "\n\n## Brand instructions", "\n\n## What we've learned", "\n\n## User instructions",
                 "\n\n## Variant directive"]
        positions = [ctx.index(h) for h in order]
        self.assertEqual(positions, sorted(positions))
        led = context(multi_product(product_ad()))
        self.assertLess(led.index("## Featured product"), led.index("\n\n## Brand\n"))
        self.assertNotIn("## Brand research", led)
        self.assertIn("## Brand instructions", led)
        auto = context(multi_product(base_ad()))
        self.assertIn("## Per-product creative guidance (brand-authored — follow the guidance for whichever product "
                      "you feature)\n- Wool Rug: Lay it flat.\n- Rug Pad: Under the rug.\n\n## Brand research", auto)
        self.assertNotIn("Gift Card", auto)
        self.assertNotIn("## Per-product", context(product_ad()))
        self.assertTrue(context(structure_only()).startswith("\n## Brand\n"))
        # The headers named in this block, verbatim.
        for header in re.findall(r"(## (?:Per-product|Brand instructions|Available brand|User instructions|Variant)[^,\n]*)",
                                 b):
            if header.startswith("## Per-product"):
                self.assertIn(header + "\n", auto)
            else:
                self.assertIn("\n" + header + "\n", ctx)

    # ---- §6.9
    def check_manifest_source(self, b):
        header = "## Available brand reference images (select by stable ID)\n"
        self.assertIn(header + b + "\n", context(base_ad()))
        self.assertNotIn(b, context(structure_only()))

    def check_manifest_lines(self, b):
        lines = b.split("\n")
        ad = product_ad()
        ad["kit"]["referenceImages"] = [
            {"url": "https://cdn.test/own.jpg", "productName": None, "kind": "own_ad"},
            {"url": "https://cdn.test/rug-1.jpg", "productName": "Wool Rug", "kind": None},
            {"url": "https://cdn.test/site.png", "productName": "Wool Rug", "kind": "website_screenshot"},
            {"url": "https://cdn.test/own-2.jpg", "productName": "Wool Rug", "kind": "own_ad"},
        ]
        ctx = context(ad)
        expect = [
            lines[0],
            fill(lines[1], {"«id»": "size-reference-1", '«productName or "the selected product"»': "Wool Rug"}),
            fill(lines[5], {"«id»": "product-1", "«productName»": "Wool Rug"}),
            fill(lines[2], {"«id»": "screenshot-1"}),
            fill(lines[3], {"«id»": "own-ad-1"}),
        ]
        self.assertIn("\n".join(expect) + "\n", ctx)
        up = context(ad_with(user_uploads=["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"]))
        self.assertIn(fill(lines[4], {"«id»": "user-upload-2", "«userIndex»": "2"}), up)
        nameless = context(ad_with(kit_referenceImages=[{"url": "https://cdn.test/x.jpg", "productName": None,
                                                         "kind": None}]))
        self.assertIn(fill(lines[5].replace(" of «productName»", ""), {"«id»": "product-1"}), nameless)

    def check_manifest_empty(self, b):
        empty = ad_with(kit_logoUrl=None, kit_referenceImages=[])
        self.present_iff(b, [empty, dict(empty, no_logo=True)], [base_ad()], where=context)

    def check_manifest_footer(self, b):
        self.present_iff(b, [base_ad(), ad_with(kit_referenceImages=[])], [ad_with(kit_logoUrl=None,
                                                                                    kit_referenceImages=[])],
                         where=context)

    # ---- §8.2
    def check_override(self, b):
        instr = compose.UNAVAILABLE_INSTRUCTIONS["product"]
        filled = fill(b, {"«instruction per role»": instr})
        ad = ad_with(unavailable_reference_ids=["product-1"])
        prompt = fin(ad, answer())["renders"][0]["prompt"]
        self.assertIn("\n\n" + filled + "\n\nHero [unavailable product reference — omit it].", prompt)
        self.assertNotIn(b.split("\n")[0], fin(base_ad(), answer())["renders"][0]["prompt"])

    def check_unavailable_roles(self, b):
        table = dict(line.split(": ", 1) for line in b.split("\n"))
        self.assertEqual(set(table), compose.ROLES)
        ad = product_ad()
        ad["kit"]["referenceImages"] += [
            {"url": "https://cdn.test/own.jpg", "productName": "Wool Rug", "kind": "own_ad"}]
        cases = {
            "logo": (dict(ad, unavailable_reference_ids=["logo"]), "{{ref:logo}}", ["product-1"]),
            "product": (dict(ad, unavailable_reference_ids=["product-1"]), "{{ref:product-1}} {{ref:product-2}}",
                        ["product-1", "product-2"]),
            "size_reference": (dict(ad, unavailable_reference_ids=["size-reference-1"]), "{{ref:size-reference-1}}",
                               ["product-1", "size-reference-1"]),
            "own_ad": (dict(ad, unavailable_reference_ids=["own-ad-1"]), "{{ref:own-ad-1}}", ["own-ad-1", "product-1"]),
        }
        for role, (case_ad, prompt, ids) in cases.items():
            out = fin(case_ad, answer(prompt=prompt, ids=ids))["renders"][0]["prompt"]
            self.assertIn("- " + table[role] + "\n\n", out, role)
            self.assertIn("[unavailable %s reference — omit it]" % role.replace("_", " "), out, role)
        shot = ad_with(kit_referenceImages=[{"url": "https://cdn.test/s.png", "productName": None,
                                             "kind": "website_screenshot"}], unavailable_reference_ids=["screenshot-1"])
        out = fin(shot, answer(prompt="{{ref:screenshot-1}}", ids=["screenshot-1"], target="screen"))
        self.assertIn("- " + table["screenshot"] + "\n\n", out["renders"][0]["prompt"])
        up = ad_with(user_uploads=["https://cdn.test/u.jpg"], unavailable_reference_ids=["user-upload-1"])
        out = fin(up, answer(prompt="{{ref:user-upload-1}}", ids=["user-upload-1"]))
        self.assertIn("- " + table["user_upload"] + "\n\n", out["renders"][0]["prompt"])
        # No logo + a {{ref:logo}} placeholder: the same unavailable text (composer.md §8.2).
        out = fin(ad_with(no_logo=True), answer(prompt="{{ref:logo}} {{ref:product-1}}"))
        self.assertIn("- " + table["logo"] + "\n\n", out["renders"][0]["prompt"])

    # ---- §8.3
    def check_slots(self, b):
        out = fin(product_ad(), answer(prompt="{{ref:product-1}}", ids=["product-1"]))
        self.assertEqual(out["renders"][0]["image_urls"],
                         [TEMPLATE_URL, LOGO, "https://cdn.test/size-1.jpg", "https://cdn.test/rug-1.jpg"])
        so = structure_only(product_name="Wool Rug")
        out = fin(so, answer(prompt="{{ref:product-1}}", ids=["product-1"]))
        self.assertEqual(out["renders"][0]["image_urls"], [LOGO, "https://cdn.test/rug-1.jpg"])
        self.assertNotIn(TEMPLATE_URL, json.dumps(out))

    # ---- §8.4
    def check_final_manifest(self, b):
        lines = b.split("\n")
        by_role = {"template": lines[1], "logo": lines[2], "size_reference": lines[3], "screenshot": lines[4],
                   "own_ad": lines[5], "user_upload": lines[6], "font_reference": lines[7], "product": lines[8]}
        slots = [{"role": "template"}, {"id": "logo", "role": "logo"}, {"role": "font_reference"},
                 {"id": "size-reference-1", "role": "size_reference"}, {"id": "screenshot-1", "role": "screenshot"},
                 {"id": "own-ad-1", "role": "own_ad"},
                 {"id": "user-upload-1", "role": "user_upload", "userIndex": 1, "productName": "Wool Rug"},
                 {"id": "product-1", "role": "product", "productName": "Wool Rug"}]
        expected = [lines[0]] + [
            fill(by_role[s["role"]], {"«n»": str(i + 1), "«userIndex»": "1", "«productName»": "Wool Rug"})
            for i, s in enumerate(slots)]
        self.assertEqual(compose.final_image_manifest(slots), "\n".join(expected))
        bare = compose.final_image_manifest([{"role": "user_upload"}, {"role": "product"}])
        self.assertIn(fill(by_role["user_upload"].replace(" #«userIndex»", "").replace(" («productName»)", ""),
                           {"«n»": "1"}), bare)
        self.assertIn(fill(by_role["product"].replace(" of «productName»", ""), {"«n»": "2"}), bare)
        # The specimen goes in at index 1, and the font line sits between manifest and body (composer.md §9).
        ad = product_ad(font_specimen_url="https://cdn.test/spec.png")
        out = fin(ad, answer(prompt="{{ref:PRODUCT-1}} here."))
        p = out["renders"][0]["prompt"]
        self.assertEqual(out["renders"][0]["image_urls"][:2], [TEMPLATE_URL, "https://cdn.test/spec.png"])
        self.assertIn(fill(by_role["font_reference"], {"«n»": "2"}), p)
        self.assertIn("\n\n" + compose.FONT_REFERENCE_PROMPT_LINE + "\n\nImage 5 here.", p)
        # FONT_REFERENCE_PROMPT_LINE is quoted verbatim in font-specimen.md §6.
        spec_md = open(os.path.join(HERE, "..", "references", "font-specimen.md"), encoding="utf-8").read()
        self.assertIn("```text\n" + compose.FONT_REFERENCE_PROMPT_LINE + "\n```", spec_md)

    # ---- §8.5
    def check_final_prompt(self, b):
        out = fin(product_ad(), answer(prompt="Use {{ref:Product-1}} at the scale of {{ref:size-reference-1}}.",
                                       ids=["product-1", "size-reference-1"]))
        p = out["renders"][0]["prompt"]
        manifest, body = p.split("\n\n", 1)
        self.assertTrue(manifest.startswith("Input images, in order:\nImage 1: the source ad template"))
        self.assertEqual(body, "Use Image 4 at the scale of Image 3.")
        with self.assertRaises(compose.ComposeError):
            fin(product_ad(), answer(prompt="{{ref:product-2}}", ids=["product-2"], target="screen"))
        with self.assertRaises(compose.ComposeError):
            fin(product_ad(), answer(prompt="{{ref:product-2}}", ids=["product-1"]))

    # ---- §10
    def check_canvas(self, b):
        ad = ad_with(ratios=["1:1", "9:16", "4:5", "16:9", "3:4"])
        out = fin(ad, answer())
        base = out["renders"][0]["prompt"]
        orient = {"9:16": "vertical portrait", "4:5": "portrait", "16:9": "horizontal landscape", "3:4": "square"}
        for r in out["renders"][1:]:
            self.assertEqual(r["prompt"], base + fill(b, {"«ratio»": r["ratio"], "«orientation»": orient[r["ratio"]],
                                                          "«template.ratio»": "1:1"}))
        self.assertNotIn("CANVAS ADAPTATION", base)
        none = fin(ad_with(template_ratio=None, ratios=["9:16"]), answer())
        self.assertNotIn("CANVAS ADAPTATION", none["renders"][0]["prompt"])


ALWAYS_PREFIXES = ["Adapt the SUBJECT", "TARGET CONTRACT", "PHOTOREALISM", "Name the real product",
                   "PRODUCT FIDELITY", "ON-PRODUCT TEXT", "STAGING MUST FIT", "MIRROR the source", "SAFE MARGIN",
                   "COPY MUST READ", "Any text that belongs", "CLAIMS MUST BE", "LAYOUT & SIGNATURE",
                   "SOURCE/TARGET MEDIA", "DEVICE SCREENS"]

REGISTRY = [
    ("You write prompts for an image-editing model (it receives ONLY", "check_l1_structure"),
    ("You write prompts for an image-editing model (it receives the source", "check_l1_normal"),
    ("Write ONE prompt that builds", "check_l2_structure"),
    ("Write ONE prompt that recreates", "check_l2_normal"),
    ("SCENE — ", "check_scene"),
    ("THE USER UPLOADED", "check_user_uploads"),
    ("COLORS — RESTYLE TO BRAND, BY ROLE", "check_colors_by_role"),
    ("COLORS — RESTYLE TO BRAND: ", "check_colors_restyle"),
    ("COLORS — KEEP SOURCE", "check_colors_keep"),
    ("TYPOGRAPHY — SURGICAL", "check_typo_surgical"),
    ("TYPOGRAPHY — KEEP SOURCE", "check_typo_keep"),
    ("SIZE IS SET BY", "check_size_refs"),
    ("ESTIMATE THE PRODUCT'S", "check_size_estimate"),
    ("Render NO logo", "check_no_logo"),
    ("If a logo reference image is attached", "check_logo_attached"),
    (" If the brand name must be lettered", "check_logo_lettering"),
    ('The featured product "', "check_no_photo_product"),
    ("This brand sells MULTIPLE", "check_product_led"),
    ("Return a JSON object", "check_output_instruction"),
    ("## Source template", "check_source_template"),
    ("## Brand\n", "check_brand"),
    ("Background: «scheme.background»", "check_scheme_lines"),
    ("Primary color:", "check_palette_lines"),
    ("Colors: KEEP", "check_ctx_colors_keep"),
    ("Typography: KEEP", "check_ctx_typo_keep"),
    ("Products: ", "check_products_line"),
    ("Logo: render NO logo", "check_ctx_no_logo"),
    ("Logo: the brand's REAL logo", "check_ctx_logo"),
    ("Typography: headings in", "check_typography_line"),
    ("## Featured product", "check_featured"),
    ("Size: the attached", "check_ctx_size_ref"),
    ("Size: estimate", "check_ctx_size_est"),
    ("No reference photo is available", "check_ctx_no_photo"),
    ("## What we've learned", "check_learnings"),
    ("## Recurring rejection", "check_recurring"),
    ("wrong_product: ", "check_directives"),
    ("Messaging angle for THIS ad", "check_angle_line"),
    ('[\n  {"label"', "check_variant_directives"),
    ("Variant brief: ", "check_variant_brief"),
    ('{\n  "auto"', "check_angle_copy"),
    ("[§6.1 source lines", "check_assembly"),
    ("SOURCE TEMPLATE: visible", "check_manifest_source"),
    ("[ID: logo]", "check_manifest_lines"),
    ("NO brand reference assets", "check_manifest_empty"),
    ("In reference_ids, copy only", "check_manifest_footer"),
    ("REFERENCE AVAILABILITY OVERRIDE", "check_override"),
    ("logo: The logo reference", "check_unavailable_roles"),
    ("slots = [ template ]", "check_slots"),
    ("Input images, in order:", "check_final_manifest"),
    ("«manifest»", "check_final_prompt"),
    ("\n\nCANVAS ADAPTATION", "check_canvas"),
] + [(p, "check_always") for p in ALWAYS_PREFIXES]


def checker_for(block):
    matches = [name for prefix, name in REGISTRY if block["text"].startswith(prefix)]
    return matches


class TestBlocks(Checks):
    def test_every_block_has_a_checker(self):
        self.assertGreater(len(BLOCKS), 60)
        used = []
        for block in BLOCKS:
            matches = checker_for(block)
            self.assertEqual(len(matches), 1, "composer.md line %d needs exactly one checker, has %s"
                             % (block["line"], matches))
            used.append([p for p, n in REGISTRY if block["text"].startswith(p)][0])
        self.assertEqual(sorted(used), sorted(p for p, _ in REGISTRY), "a checker no longer matches any block")

    def test_blocks(self):
        for block in BLOCKS:
            with self.subTest(section=block["section"], line=block["line"]):
                getattr(self, checker_for(block)[0])(block["text"])

    def test_instruction_order(self):
        text = inp(ad_with(scheme=SCHEME))
        order = [compose.L1_NORMAL, compose.L2_NORMAL, compose.ADAPT_SUBJECT, compose.TARGET_CONTRACT,
                 compose.PHOTOREALISM, "COLORS — RESTYLE TO BRAND, BY ROLE", compose.TYPO_SURGICAL,
                 compose.NAME_PRODUCT, compose.PRODUCT_FIDELITY, compose.ON_PRODUCT_TEXT, compose.STAGING,
                 compose.SIZE_ESTIMATE, compose.LOGO_ATTACHED, compose.TEXT_DENSITY, compose.SAFE_MARGIN,
                 compose.COHERENT_COPY, compose.SOURCE_TEXT, compose.CLAIMS, compose.SIGNATURE, compose.MEDIA_RULE,
                 compose.DEVICE_SCREENS, compose.COMPOSE_OUTPUT_INSTRUCTION]
        positions = [text.index(x) for x in order]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(text.split("\n")[0], compose.L1_NORMAL)


class TestGate(unittest.TestCase):
    """composer.md §8.1 (prose, not a fenced block)."""

    def urls(self, ad, ans):
        return fin(ad, ans)["renders"][0]["image_urls"]

    def test_backfill_and_size_refs(self):
        ad = product_ad()
        # target product, nothing selected -> every fitting ref (size + both photos) is attached.
        self.assertEqual(self.urls(ad, answer(prompt="Rug.", ids=[])),
                         [TEMPLATE_URL, LOGO, "https://cdn.test/size-1.jpg", "https://cdn.test/rug-1.jpg",
                          "https://cdn.test/rug-2.jpg"])
        # a product photo selected keeps the size reference.
        self.assertIn("https://cdn.test/size-1.jpg", self.urls(ad, answer(prompt="Rug.", ids=["product-2"])))

    def test_target_none_and_legacy(self):
        ad = product_ad()
        self.assertEqual(self.urls(ad, answer(prompt="Text only.", ids=[], target="none")), [TEMPLATE_URL, LOGO])
        # target null -> legacy gate on source_media.
        self.assertEqual(self.urls(ad, answer(prompt="x", ids=[], target=None, source="none")), [TEMPLATE_URL, LOGO])
        # source not viewed and target null -> everything.
        ad["template"]["source_image_viewed"] = False
        self.assertEqual(len(self.urls(ad, answer(prompt="x", ids=[], target=None))), 5)

    def test_own_ad_any_target_and_uploads_mandatory(self):
        ad = ad_with(kit_referenceImages=[{"url": "https://cdn.test/own.jpg", "productName": None, "kind": "own_ad"}])
        self.assertIn("https://cdn.test/own.jpg", self.urls(ad, answer(prompt="{{ref:own-ad-1}}", ids=["own-ad-1"],
                                                                      target="none")))
        up = ad_with(user_uploads=["https://cdn.test/u.jpg"])
        self.assertIn("https://cdn.test/u.jpg", self.urls(up, answer(prompt="x", ids=[], target="none")))
        self.assertNotIn("https://cdn.test/u.jpg",
                         self.urls(dict(up, user_instructions=""), answer(prompt="x", ids=[], target="none")))

    def test_answer_checks(self):
        with self.assertRaises(compose.ComposeError):
            fin(base_ad(), answer(prompt="{{ref:product-1}}", ids=[]))  # placeholder not selected
        with self.assertRaises(compose.ComposeError):
            fin(base_ad(), dict(answer(), title="  "))
        out = fin(base_ad(), answer(prompt="{{ref:logo}} {{ref:product-1}}", ids=["Product-1", "product-1"]))
        self.assertEqual(out["reference_ids"], ["product-1"])

    def test_engine_cap(self):
        ad = product_ad(engine="nano_banana_pro")
        ad["product"]["size_reference_urls"] = ["https://cdn.test/s%d.jpg" % i for i in range(1, 5)]
        ad["kit"]["referenceImages"].append({"url": "https://cdn.test/rug-3.jpg", "productName": "Wool Rug", "kind": None})
        out = fin(ad, answer(prompt="{{ref:product-3}}", ids=["product-1", "product-2", "product-3"]))
        r = out["renders"][0]
        self.assertEqual(len(r["image_urls"]), 6)
        self.assertIn("[unavailable product reference — omit it]", r["prompt"])
        self.assertEqual(r["ads_render"]["engine"], "nano_banana_pro")
        self.assertFalse(out["font_specimen"]["eligible"])


class TestDepartures(unittest.TestCase):
    def test_departure_3_pairing(self):
        pairing = {"heading": "Playfair Display", "heading_descriptor": "high-contrast serif", "body": "Inter",
                   "body_descriptor": "neutral sans"}
        ctx = context(ad_with(font="pairing", font_pairing=pairing))
        self.assertIn("Typography: headings in Playfair Display (high-contrast serif), body in Inter (neutral sans) — "
                      "render text in this EXACT font family, in its own letterforms.", ctx)
        self.assertIn(3, fin(ad_with(font="pairing", font_pairing=pairing), answer())["departures_used"])

    def test_departure_4_no_font(self):
        ad = product_ad(font="none", font_specimen_url="https://cdn.test/spec.png")
        text = inp(ad)
        self.assertIn(compose.NO_FONT_INSTRUCTION, text)
        self.assertIn(compose.NO_FONT_CONTEXT, text)
        self.assertNotIn("Typography: headings in", text)
        out = fin(ad, answer())
        self.assertFalse(out["font_specimen"]["inserted"])
        self.assertNotIn("https://cdn.test/spec.png", out["renders"][0]["image_urls"])
        self.assertIn(4, out["departures_used"])

    def test_departure_5_ownership(self):
        ad = ad_with(template_brand_owned=False)
        with self.assertRaises(compose.ComposeError):
            inp(ad)
        ad["structure"] = {"blueprint_instruction": BLUEPRINT, "media_slot": "none"}
        self.assertIn(compose.L1_STRUCTURE, inp(ad))
        out = fin(ad, answer(prompt="Text.", ids=[], target="none"))
        self.assertTrue(out["structure_only"])
        self.assertEqual(out["source_media"], "none")
        self.assertNotIn(TEMPLATE_URL, out["renders"][0]["image_urls"])
        self.assertIn(5, out["departures_used"])

    def test_departures_2_and_6_recorded_and_no_fallback(self):
        ad = structure_only(content_policy_recompose="dropped the bath scene")
        ad["structure"]["reduced_mechanic"] = True
        out = fin(ad, answer(prompt="x", ids=[], target="none"))
        self.assertEqual(out["departures_used"], [2, 6])
        self.assertNotIn("engine", out["renders"][0]["ads_render"])

    def test_forced_brand_styling_for_curated(self):
        ad = ad_with(template_source_kind="curated", apply_brand_colors=False, font="template",
                     structure={"blueprint_instruction": BLUEPRINT})
        text = inp(ad)
        self.assertNotIn(compose.COLORS_KEEP, text)
        self.assertIn(compose.TYPO_SURGICAL, text)


class TestCli(unittest.TestCase):
    def test_example_end_to_end(self):
        script = os.path.join(HERE, "compose.py")
        ad, ans = os.path.join(HERE, "example-ad.json"), os.path.join(HERE, "example-answer.json")
        p = subprocess.run([sys.executable, script, "input", ad], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertTrue(p.stdout.startswith(compose.L1_NORMAL))
        p = subprocess.run([sys.executable, script, "final", ad, ans], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0, p.stderr)
        out = json.loads(p.stdout)
        with open(ad, encoding="utf-8") as f:
            ratios = json.load(f)["ratios"]
        self.assertEqual([r["ratio"] for r in out["renders"]], ratios)
        for r in out["renders"]:
            self.assertTrue(r["ads_render"]["dry_run"])
            self.assertEqual(r["ads_render"]["prompt"], r["prompt"])
            self.assertNotIn("{{ref:", r["prompt"])


if __name__ == "__main__":
    unittest.main()
