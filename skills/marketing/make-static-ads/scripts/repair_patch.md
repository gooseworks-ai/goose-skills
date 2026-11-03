# repair_patch.py — free official-label pixel repair

`repair_patch.py` copies a real label into a manually verified compatible label band. It makes no model or network call. It does not remove backgrounds, match poses, reconstruct a product, invent lettering or fix a wrong silhouette. Review the actual source and candidate by eye; a passed numerical invariant is not an image-quality verdict.

Write a manifest with distinct new paths and explicit confirmations based on the brand's media rights and your visual inspection:

```json
{
  "source_image": "official-product.jpg",
  "base_image": "failed-render.png",
  "output_image": "repair/candidate.png",
  "mask_image": "repair/mask.png",
  "evidence_json": "repair/evidence.json",
  "source_rights_confirmed": true,
  "compatible_pose_reviewed": true,
  "source_band": {"left": [120, 120], "right": [360, 360], "top": [200, 205, 200], "bottom": [600, 605, 600]},
  "target_band": {"left": [80, 75], "right": [200, 195], "top": [150, 153, 150], "bottom": [350, 353, 350]},
  "feather_px": 1.5
}
```

Coordinates are pixels in the full source/base image. `left`/`right` are x coordinates at the top and bottom ends. `top`/`bottom` are y coordinates across the label at left, center and right. The three y guides define each curved boundary; inspect them against the real label edges. The example numbers are illustrative, not a usable brand preset. Use near-front-facing, unoccluded labels with compatible shape and lighting; a severely oblique or differently wrapped label needs another approach.

```bash
python3 repair_patch.py repair-manifest.json
```

The helper validates finite in-bounds, non-crossing geometry and inverse convergence, anti-aliases the source before remapping, feathers within the target boundary and saves a lossless candidate, mask and provenance. It refuses to overwrite the original/source/manifest paths. Every pixel outside the saved mask must remain identical. RGB inputs only; transparent-cutout handling is outside this helper. The agent still checks lettering, edge seams, geometry and lighting at full size.

After a fresh judge passes the full image, upload and save it through the existing GooseWorks tools with its failed creative as parent. Keep both versions and the repair evidence; verify saved media bytes and lineage. This is free local processing plus a free save. Any paid extraction/edit/generation still needs its own applicable quote and approval. An exhausted generation ceiling does not authorize another paid attempt.
