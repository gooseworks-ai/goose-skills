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
6. One garment that carries no print: a jumper, a cardigan, a wool coat, a shirt. Not a hoodie, a cap or sportswear.
7. One thing they carry that has no printed surface: a rucksack, an umbrella, a bunch of flowers. Not a shopping bag.

Thin:

> a man in his thirties, grey hoodie, with a plain rucksack

Full:

> a stocky Black man in his late thirties with a short greying beard and a shaved head, in a plain grey jumper, with a plain rucksack on one shoulder

## Rules that still hold

- Describe ordinary people. Do not list flaws to make someone look real: "eye bags", "blotchy" and similar words produced unwell-looking people and are banned vocabulary in `format_spec.py`.
- No real or famous person, and no one who could read as under eighteen.
- No logos and no lettering on anyone or anything they carry: generated lettering distorts, and a real brand's mark on a person blocks shipping. Calling a hoodie or a shopping bag "plain" did not keep them plain (see below), so do not name them.
- Vary the corner as a set: do not write four people of the same age, build and background.
- Do not copy a person from another brand's config. Write the brand's own cast, drawn from who its customers are.
- Never edit the `subject` of a config that already has a recorded take. That take was made with those words, and its prompt is pinned.

## The check

`python scripts/brandkit.py --brand <slug>` and the `single_gen.py` dry run both print a `CAST ADVISORY` line for each person who is missing hair, build, or skin tone or background, for each person copied from another brand's config, and for each person given a hoodie, a cap, sportswear or a shopping bag. It is advice, not a refusal: it does not stop a take.

## Skin and voice settings

All off by default, so every recorded prompt and its hash are unchanged. Judged once: on 2026-10-13 Apoorv watched seed 6222 (settings off) against seed 6225 (settings on) and found 6225 better. That is one pair of 8 second takes, and 6225 also had a different scene reference, so it is a good sign and not a proof.

| key | where | what it does |
|---|---|---|
| `skin_grammar` | `generation` | adds one clause asking for ordinary unretouched skin (no makeup, no smoothing, uneven tone and shine), and for each person's hands, wrists and neck to match their own face. It names no defect and no camera style |
| `interviewer_voice` | top level | a short phrase for the interviewer's voice |
| `voice` | any shot that has a `noun` | a short phrase for that person's voice, such as `"a low, dry voice that sounds his age"` |

A voice phrase is at most 90 characters, with no quote marks and no full stop at the end. Both options add words to an already long prompt (about 130 for a three-person cast), so judge a take for missed instructions as well as for the faces and voices.

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

Seed 6224 tested that fix: the same prompt as 6223 word for word, with the reference cropped to the microphone and the interviewer's hand. The man's holding hand then matched his face and the ring was gone.

It also showed what the old reference had been carrying for free. It had shown an upright bottle and a plain grey hoodie. Without them the first person held the bottle on a diagonal, low and close to the lens, and his top became a zip jacket with a sports logo and wordmark on the chest. So do not simply crop: choose a reference that shows the product upright with no cast hand in frame.

Seed 6225 tested that: the handover frame of an older take, cropped below the chest, where the interviewer's hand holds the bottle upright and the microphone is in view. Both people's holding hands matched their faces, and the bottle came back to near upright. This is the reference to copy: the interviewer's hand on the product, the microphone, the ground, and nobody else's hands.

It did not fix clothing. A sports brand's logo and wordmark appeared on the grey hoodie in three of the four takes, with the logo cropped out of the reference and banned in the prompt. "Grey hoodie" seems to bring sportswear with it, and "shopping bag" brings print. The rule since 2026-10-13: do not name them. Give the person a garment and an object that carry no print. Seed 6226 tested it once: the same take as 6225 with "plain grey jumper" for the hoodie and "a folded black umbrella" for the shopping bag. The sports logo and wordmark were gone and nothing carried had lettering. One tiny embroidered chest mark remained on the jumper, which came back as a quarter-zip. So the rule removes the large marks, in one take out of one, and does not yet guarantee a bare garment. Untried: "crew-neck". A real brand's mark on a person blocks shipping, so look for it on every take.

Read across the four takes: the cast description sets the face; the scene reference sets whatever it shows, hands and clothes included; a prompt sentence loses to the image.

Printed lettering appeared on the shopping bag in all four takes despite the plain-bag rule. The skin clause and the voice descriptions have been judged once, by one person, as better (see "Skin and voice settings").

## What is not proven

One take is one data point. It shows the model follows a full description; it does not show it will every time, or at fifteen seconds, or with four people. Whether these faces read as real is a human call that no check here makes. Record each new take's result in the project's take ledger.
