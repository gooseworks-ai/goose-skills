# Fit and honesty

Load at Step 1 (fit) and Step 4 (honesty).

## 1. Which products the studio can photograph honestly

The engine's categories are `apparel`, `beauty`, `cpg`.

| Type | Fit | What to do |
|---|---|---|
| DTC apparel (clothing, footwear, bags, accessories) | Core | `apparel`; on-model with the human's attestation; never a size/fit line beside a generated model |
| Beauty, personal care | Core | `beauty`; packshots and lifestyle are strong; **no on-skin results, before/after or shade-on-skin swatches** unless from a real reference |
| CPG (food & drink, household, pet, supplements) | Core | `cpg`; label and regulatory text is the main risk; food shown exactly as sold |
| Hard goods (drinkware, kitchen, small home, sports gear) | Partial | `cpg` is nearest — say so: "best for studio and lifestyle; I'll check shape and parts closely"; stricter part-count and scale checks |
| Electronics, furniture, large home, jewellery, eyewear | Poor | Lifestyle only with the risk stated, no hero; or recommend a real shoot / 3D render. Jewellery and eyewear: real photography for hero and detail |
| B2B physical goods (components, industrial) | Edge | Accuracy beats mood; studio hero only if the `cpg` mapping is acceptable to the marketer, otherwise decline |
| Food service, restaurants, delivery menus | Decline | The customer compares plate to photo; recommend a real phone shoot |
| Hospitality, travel, real estate | Decline | A generated room or property misrepresents it |
| Software, apps, services, agencies | Out of scope | Keyed on `kit.brandType` / product type. One line: "this makes photos of physical products"; ask once whether there is a physical item (device, packaging, merch). Screens and device mockups are not made here. |
| Pre-launch product with only a render | Partial | The render is the honest studio hero, unaltered; lifestyle only, at the render's angle; no screens or app UI; label "pre-production, render-based"; CAD exports unlock other angles. A smart device matches the hard-goods row for the body and is never shown with invented UI |
| Creator merch | Core | As apparel / CPG |

Never silently force an unfit product into a category.

## 2. The honest-representation rule (the one list — other files point here)

A product photo is a claim about the product. Consumer-protection law in the US (FTC Act §5), the UK and EU (unfair commercial practices rules) and India (Consumer Protection Act 2019) treats images as representations. **A scene may show only what the product physically is and does: its size, contents, finish, colour and how it is used** — taken from the product record's plain facts, the curated real photos and the human's confirmation. Marketing copy in the description ("visibly healthier with every use") is not support; results come only from learn-my-brand's signed-off claims (`gooseworks:knowledge_search` `source_types: ["learning"]`, query "Claims sign-off", and the Brand record it names; no sign-off → no results shown at all). Check before writing prompts and again on every output.

**Skincare and beauty default:** lifestyle shows the product (shelf, hand, bathroom, bag); faces only with visible natural skin texture and no before/after framing. A perfected, airbrushed face beside a skincare product implies a result — reject it as `misleading`, not as a taste issue.

**Host devices** (watch bands, phone cases, chargers): the device is shown accurately — the right model, crown or port on the correct side, a neutral screen, no invented logos or UI — and only devices the product really fits.

Never show:
- a **different size** than real (oversized in hand, impossibly small in a pocket);
- **contents not included** (extra lids, straws, accessories, bundle items);
- a **finish, colour or material** the product does not have (gloss for matte, brushed metal for powder-coat);
- a **feature** it lacks (condensation beads on an insulated bottle imply it sweats; a splash scene implies waterproof);
- a **result** it does not deliver (flawless skin from a moisturiser; a sculpted body in compression wear);
- **food not as sold** (garnish, extra toppings, a portion larger than the pack) — where a pairing is shown, the human should caption it "serving suggestion";
- **regulated label text or certification marks** that differ from the real label — never let the engine add an organic, vegan, halal or award mark the product does not hold.

## 3. People in photos

- Any shot with a person **or a body part (hands included)** needs the attestation. `attestation_accepted` is the human's act every time: ask in plain words what they confirm (the right to use a generated person; no real, identifiable person depicted). Never set it yourself.
- No real person's likeness ("make her look like <influencer>", a customer's photo as the model reference) — refuse.
- No size/fit facts for generated models ("model is 5'10" and wears S" would be fabricated); tell the human not to add one.
- Casting is a deliberate choice from the house style, not the engine's default.
- No children as models; kidswear needs real photography.

## 4. Platform rules on AI imagery (flag, do not decide)

- Marketplace main images: generally must be photographs of the actual product on pure white; generated main images risk suppression. Secondary images are more permissive. Check the marketplace's current rule.
- Google Merchant Center: AI-generated product images must keep their AI metadata and represent the product accurately — tell the human not to strip metadata.
- Ad platforms may auto-label AI-generated images — not a blocker; the human should know.
- Synthetic-content disclosure rules (e.g. the EU AI Act's transparency obligations) are evolving; one line to the human: "check disclosure needs for your market".

Always describe outputs as "generated from your product photos", never as photographs of the product.
