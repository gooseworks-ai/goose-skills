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

## What one take showed

Seed 6222 (2026-10-13, Graza, 8 seconds, fast endpoint) described both people in full and kept the settings, street and reference images of the older take it was compared with (seed 6214). It was shorter, 8 seconds against 15, with shorter lines, so compare faces and not timing. Both people came out as described: a stocky Black man with a shaved head and a greying beard, and a South Asian woman in her sixties with long grey hair. Neither is one of the recurring faces. All three lines were spoken as written.

It also showed what a description does not cover:

- **Hands.** The man's face followed the description and the hand holding the bottle did not: it was pale, and wore a ring. See "The scene reference carries a hand" below; a prompt clause did not fix it.
- **Counts.** "A long grey plait" came back as two plaits. Say "one" when one matters.
- **Bags.** The shopping bag carried printed lettering although the prompt asks for plain bags.
- **Place.** The background differed between the two people.

## The scene reference carries a hand

Seed 6223 repeated seed 6222 with `skin_grammar` on, including its rule that each person's hands match their own face. The woman's hands matched. The man's did not: the same pale hand, with the same ring, held the bottle.

The cause is the scene reference, not the wording. `--scene-ref` was a still from an older take, cropped below the face, and it shows that take's person holding the bottle: a pale hand with a ring, in a grey hoodie. The model copied the hand it was shown. An image outranks a sentence.

So, for any take with a scene reference:

- Open the scene reference and look at it before the take. If it shows a hand, an arm or clothing of a previous cast member, the new cast inherits them.
- Use a reference that shows only what must carry over: the microphone, the interviewer's hand and the street. Crop the old cast out, or take the still from a frame where nobody is holding the product.
- A person whose skin tone differs from the reference's hand is the case that exposes it. A cast that matches the old hand hides the fault; it does not remove it.

Also seen on seed 6223 and not on 6222, so treat as take-to-take variation until repeated: a sports logo on the hoodie, and the bottle held on a diagonal by the second person. Neither the skin clause nor the voice descriptions has been judged by a person yet, and the audio of neither take has been listened to.

## What is not proven

One take is one data point. It shows the model follows a full description; it does not show it will every time, or at fifteen seconds, or with four people. Whether these faces read as real is a human call that no check here makes. Record each new take's result in the project's take ledger.
