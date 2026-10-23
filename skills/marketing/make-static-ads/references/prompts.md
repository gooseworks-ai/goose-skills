# Prompts — writing the render prompt yourself

`gooseworks:ads_render` sends your prompt and images to the image model word for word. Nothing is added: no template, no brand kit, no rewriting. So the prompt is the whole art direction. Write one prompt per ad. Never ask one call for a collage of several ads.

The idea survives generation only if the prompt **describes the event concretely**. "Her one life-size hand extends out of the phone toward the saucepan, one finger hovering over the pot" carries the idea. "Striking, premium, creative" carries nothing.

## 1. Images, in a fixed order

`image_urls` holds only images the brand owns or may use: official product photos, the logo file, the brand's own past ads. Other brands' ads never go in, in any role. Their device or craft goes into the prompt as words.

Name every attached image's job in the prompt, in the same order:

1. **Product identity** (always first): "Image 1 is the official product. Reproduce this exact pouch: yellow top, dark teal bottom, black KOLKATA CHAI CO. wordmark, label layout and proportions. Never substitute another package."
2. **More product angles or the logo**, if needed for fidelity.
3. **The template**, only at **close** and only when the brand owns it (its own past ad): "Image 3 is the layout to follow: keep its composition, block positions and text slots; replace its product, words and colours with ours." At every other level, or for any other brand's template, describe the layout in words (§3).

Describe the product's identity in words too (colours, shape, label wording, cap). The model drifts on labels; words and pixels together hold it better than either alone.

## 2. The shared foundation (same for every ad in the batch)

Write it once, reuse it word for word at the top of each prompt:

- Format: one finished static ad, the ratio, portrait/square/landscape.
- Product: recognisable, label facing camera, part of the scene, never a packshot pasted in a corner.
- Finish: real materials, believable cast shadows, a deliberately built and photographed set.
- Look: from `profile.md` (how the brand's ads actually look: colours, type, recurring devices). Where the ads and the kit differ, the ads win unless the marketer said otherwise.
- Typography: the font family by name and its look ("a heavy condensed serif, black"); exact spelling; type inside a safe margin.
- Text control: "Render only the text given below, plus the real packaging label." The model invents badges, stars and prices when you don't forbid them.
- Exclusions: no discount, rating, testimonial, seal or claim unless the board has it as a usable fact; no watermark; plus every brand `dont` rule.
- One premise per image; the idea must read at thumbnail size.

## 3. The scene (different for every ad)

Write these, in this order, as plain sentences:

1. **The layout** (close and balanced): the template described exactly, as the find-references step recorded it: block positions and rough sizes, background, product position and scale, each text slot's position, length and weight.
2. **The event:** what physically happens. Use the board's visual-idea line, expanded. At close, this is the template's own scene with our product in it.
3. **Setting and camera:** where, from what height or angle, what surface and backdrop.
4. **Props that explain the situation**, and only those. "No generic spice piles."
5. **Where the product sits and how big** ("standing right foreground, about a third of the image height, label facing camera").
6. **People**, if any: age range, look, expression, what they are doing. A generated person is never presented as a customer.
7. **Exact copy, in its slots:** each line in quotes, placed where its slot is: the template's text slots at close and balanced, the brand's own text style at bold (`levels.md`). Only the slots the source has: no support line if the source has none. Never the default "headline on top, explaining line at the bottom".
8. **Tone:** affectionate humour, dry humour, warmth. Say what it must not become ("not an angry caricature").
9. **The protected choice**, word for word from the board: "The hand must visibly cross the screen boundary."

## 4. Ratios

Each ratio is its own prompt and its own priced image. For 9:16, move the headline below the top ~14% and keep the bottom ~25% and right edge clear of anything important. Re-lay the scene out; never describe a crop.

## 5. Before you quote

Read the finished prompt once as the image model would. Check:
- the protected choice is in it, word for word;
- every word you want drawn is in quotes, and nothing else is asked to be drawn;
- each attached image's role is named, in order;
- it is under 12,000 characters.

Then run the claims check on the exact prompt (the claims-extract step, Pass A).
