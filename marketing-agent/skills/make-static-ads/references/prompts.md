# Prompts — writing the render prompt yourself

`gooseworks:ads_render` sends your prompt and images to the image model word for word. Nothing is added: no template, no brand kit, no rewriting. So the prompt is the whole art direction. Write one prompt per ad. Never ask one call for a collage of several ads.

The idea survives generation only if the prompt **describes the event concretely**. "Her one life-size hand extends out of the phone toward the saucepan, one finger hovering over the pot" carries the idea. "Striking, premium, creative" carries nothing.

## 1. Images, in a fixed order

`image_urls` holds only images the brand owns or may use (rights: the `make-static-ads-find-references` skill (`../../make-static-ads-find-references/SKILL.md`) §4). Another brand's ad from an ad library goes into the prompt as words.

Name every attached image's job in the prompt, numbered by its position in `image_urls` ("Image 1", "Image 2"…), in this order:

1. **Product identity** (first whenever the ad shows the product; for software, the real UI screenshot or the mascot; a type-led ad with neither attaches none; never the logo file): "Image 1 is the official product. Reproduce this exact pouch: yellow top, dark teal bottom, black KOLKATA CHAI CO. wordmark, label layout and proportions. Never substitute another package."
2. **The logo:** the image model redraws logos even when the file is attached, so on a shell host it never draws one. Don't attach the logo file; write "Leave a clear, quiet area in the <corner> about <N>% of the width for a logo added later; draw no logo, wordmark or brand name there or anywhere except the real product label." (A graphic request's exact text may name the brand, in plain type: the `make-static-ads-graphic-request` skill (`../../make-static-ads-graphic-request/SKILL.md`) step 4.) After the render, place the real file with `scripts/place_logo.py` (`scripts/README.md`). On a host with no shell, follow the marketer's logo choice (playbook Step 2, or graphic-request step 3): the clear corner, or attach the file ("Image 2 is our logo: copy it exactly at <position>; never redraw or recolour it"). More product angles follow if needed.
3. **The template**, when `levels.md` allows its image (close and balanced). Close: "Image <N> is the ad to follow: keep its composition, block positions and text slots; replace every product, word, logo, person and colour with ours." Balanced: "Image <N> is the layout only: keep its block and text-slot positions and background treatment; the scene, product, words and colours are ours." At bold, describe only its device or look in words; for an ad-library ad at close or balanced, describe the layout in words (§3.2).

Describe the product's identity in words too (colours, shape, label wording, cap). The model drifts on labels; words and pixels together hold it better than either alone.

## 2. The shared foundation (same for every ad in the batch)

Write it once, reuse it word for word at the top of each prompt; only the Product line follows whether this ad shows the product:

- Format: one finished static ad, the ratio, portrait/square/landscape.
- Product, when the ad shows it: recognisable, label facing camera, part of the scene, never a packshot pasted in a corner. When it doesn't: "No product, package or device appears in this image."
- Anything shown inside the ad (an ad, a phone screen, a page) looks finished: real-looking words or a clear product, never blank pills, grey bars or placeholder boxes.
- Look: from `profile.md` (how the brand's ads actually look: colours, type, recurring devices; the ads win over the kit, `brand-profile.md` §3).
- Typography: the font family by name and its look ("a heavy condensed serif, black"); exact spelling; type inside a safe margin. Never name a font the model can't know (describe its look); never Inter, Arial, Helvetica or Roboto as a designed headline unless the marketer chose it; at most two families; no light weights for the headline. Only when the brand's font is a system face, a guess or a paid font the model won't know: free pairings and matches in `fonts-and-color.md`.
- Text control: "Render only the text given below, plus the real packaging label." The model invents badges, stars and prices when you don't forbid them.
- Exclusions: no discount, rating, testimonial, seal or claim unless the board has it as a usable fact; no watermark; plus every brand `dont` rule.
- One premise per image; the idea must read at thumbnail size.

## 3. The scene (different for every ad)

Write these, in this order, as plain sentences:

1. **The style:** this ad's own style from its board row (`levels.md`, Style), described concretely: medium, lighting, finish ("glossy 3D render, soft studio light, glass and chrome"; "phone photo, daylight, slightly off-centre"). Never carried over from another ad.
2. **The layout** (close and balanced): the template described exactly, as the `make-static-ads-find-references` skill (`../../make-static-ads-find-references/SKILL.md`) recorded it: block positions and rough sizes, background, product position and scale, each text slot's position, length and weight. Every area does a job (`levels.md`, Text and fullness).
3. **The event:** what physically happens. Use the board's visual-idea line, expanded. At close, this is the template's own scene with our product in it.
4. **Setting and camera**, as the style needs: where, from what angle, what surface or background.
5. **Props that explain the situation**, if the style uses any, and only those. "No generic spice piles."
6. **Where the product sits and how big**, when it is shown ("standing right foreground, about a third of the image height, label facing camera").
7. **People**, if any: age range, look, expression, what they are doing. A generated person is never presented as a customer.
8. **Exact copy, in its slots:** each line in quotes, placed where its slot is: the template's text slots at close and balanced, the brand's own text style at bold (`levels.md`). Only the slots the source has.
9. **Tone:** affectionate humour, dry humour, warmth. Say what it must not become ("not an angry caricature").
10. **The protected choice**, word for word from the board: "The hand must visibly cross the screen boundary."

## 4. Ratios

Each ratio is its own prompt and its own priced image. For 9:16, keep text and product out of the top ~14%, the bottom ~35% and the right edge (Reels; Stories need only the bottom ~20%). Re-lay the scene out; never describe a crop.

## 5. Before you quote

Read the finished prompt once as the image model would. Check:
- the protected choice is in it, word for word;
- every word you want drawn is in quotes, and nothing else is asked to be drawn;
- each attached image's role is named, in order;
- every text slot can hold its words at the size asked (a 15-word line will not fit two lines at 4% of the image height: shorten it or move it to the post text);
- at close and balanced, the template is attached as its numbered image when it is the brand's own ad or a library template; an ad-library ad is in words only;
- it is under 12,000 characters.

Then run the claims check on the exact prompt (the `make-static-ads-claims-extract` skill (`../../make-static-ads-claims-extract/SKILL.md`), Pass A).
