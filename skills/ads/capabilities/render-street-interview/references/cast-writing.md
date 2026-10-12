# Human version

**Summary.** Write each person on the corner in full: age, sex, skin tone or background, hair, build, one garment and one thing they carry. A person written thinly comes back as the model's default face, and the same five faces then appear in every brand's video.

---

# Agent version

## What was measured

On 2026-10-13 a face detector was run over 21 generated takes across three brands (Liquid Death, Olipop, Graza) and three real street clips. The generated takes kept returning the same people:

| Recurring face | Seen in |
| --- | --- |
| Young woman, long brown hair | five Olipop takes |
| Young man, dark curly hair, hoodie | Olipop, Graza and Liquid Death |
| Older man in a flat cap | Olipop, Graza and Liquid Death |
| Grey-haired man in his fifties, dark jacket | most takes, all three brands |
| Older woman, grey or auburn bob | Olipop and Graza |

Every generated person was white. The real clips were not. This was judged by eye on a contact sheet, not by a face-matching score.

## Why it happens

The configs described each person as an age decade, a sex, one garment and one prop: "a man in his thirties, grey hoodie, with a plain rucksack". Hair, build and skin tone were left to the model, and the model fills each gap with its default for that slot. 16 of the 60 descriptions across the bundled configs were also word-for-word copies of one another.

A different seed does not fix this. The seed changes the take; the description decides the face.

The realism formula (`create-creator-takes-h3/scripts/character-prompt.json`) makes the same point about stills: "age + ethnicity + sex, stated explicitly. Models drift to an ambiguous composite face without this." This format cannot use that formula directly, because it builds a close-up still and the video model refuses images of people. Its identity rule still applies.

## What to write for each person

One `subject` string per person, in this order, as plain description:

1. Age, as a decade or "early / late" within one.
2. Sex.
3. Skin tone or background, stated plainly ("a Black man", "a South Asian woman", "pale and freckled").
4. Hair: colour, length, how it is worn, and how it is untidy. Or bald, or covered.
5. Build ("stocky", "tall and thin", "small and round-shouldered").
6. One garment, plain and unbranded.
7. One thing they carry.

Thin:

> a man in his thirties, grey hoodie, with a plain rucksack

Full:

> a stocky Black man in his late thirties with a short greying beard and a shaved head, in a plain grey hoodie, with a plain rucksack on one shoulder

## Rules that still hold

- Describe ordinary people. Do not list flaws to make someone look real: "eye bags", "blotchy" and similar words produced unwell-looking people and are banned vocabulary in `format_spec.py`.
- No real or famous person, and no one who could read as under eighteen.
- Clothes and bags stay plain and unbranded; generated lettering garbles.
- Vary the corner as a set: do not write four people of the same age, build and background.
- Do not copy a person from another brand's config. Write the brand's own cast, drawn from who its customers are.
- Never edit the `subject` of a config that already has a recorded take. That take was made with those words, and its prompt is pinned.

## The check

`python scripts/brandkit.py --brand <slug>` and the `single_gen.py` dry run both print a `CAST ADVISORY` line for each person who is missing hair, build, or skin tone or background, and for each person copied from another brand's config. It is advice, not a refusal: it does not stop a take.

## What is not proven

No paid take has been generated with a fully written cast yet. Whether it removes the repeat faces, and whether it changes how real the people look, is untested. Judge the first take by eye against an older one, and record the result in the project's take ledger.
