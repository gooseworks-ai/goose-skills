# overlay 1.0.0

Lays pictures over a video at time windows. Free. Built for GOOSE-4015: the podcast skit's corner logo and the
3D character explainer's real product box over its box-free product plate.

- **`items`** (1 to 8, drawn bottom first). Each item is one picture and when it shows:
  - `image`: a PNG, JPEG or WebP file (PNG transparency is kept), or `"product_of_scene"`: the first photo of
    the product each window's scene names.
  - **When**: `from_s` / `to_s` (default the whole video), or `scenes: "naming_product"`: one window per plan
    scene that names a product, timed by the timeline's scene of the same id. Touching windows of one picture
    merge, so a product held across two scenes scales in once. `until: "end_card"` stops every window at the
    timeline's end card (a video with no end card runs to its end).
  - **Where**: `corner` (`top_left`, `top_right`, `bottom_left`, `bottom_right`, `center`; default `center`),
    `width_px` and `margin_px` (default 40), measured at a 1080-pixel short side and scaled to the video. The
    picture keeps its aspect. Default width: 60% of the video's width in the centre (no taller than half its
    height), 15% in a corner. Never larger than the video less its margins.
  - `opacity` (default 1). `scale_in_s` (0 to 2): grow from 85% to full size around the box's centre, fading
    in, at the start of each window.
- **A scene names a product** by the phone-chat rule (its id, its whole name, or two of its name's words, in
  the picture text), or when it is tagged Product (`"Product: ..."` or `extra.shot: "product"`) and the plan has
  exactly one product. Scenes with a `null` line, on_screen or picture are fine.
- **Refused** (`bad_input`): `product_of_scene` without `scenes: "naming_product"`; `scenes` together with
  `from_s`/`to_s`; `naming_product` without the plan's scenes or products; a named product with no photo; a
  window that ends before it starts or starts past the video's end; a picture that is not PNG, JPEG or WebP;
  more than 60 windows in all.
- **An item with no picture** (a `brand.logo` binding for a brand with no logo, which the kit drops) is skipped
  with a warning, not refused.
- **Nothing to draw** (no scene names a product, or no item has a picture): the cut passes through unchanged,
  with a warning. The 180 MB limit still applies to it.
- **Size rule**: one re-encode with the kit's `h264-master` preset plus `-maxrate 16M -bufsize 32M`; an output
  over 180 MB is refused (`output_invalid`). The sound is copied unchanged.
- **Outputs**: `video`, `timeline` (passed through unchanged).

Source: `parts/overlay/src/part.mjs`, `src/windows.mjs` and `src/manifest.mjs`.
