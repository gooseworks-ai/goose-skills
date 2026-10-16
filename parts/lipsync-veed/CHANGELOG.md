# lipsync-veed

## 1.1.0

- `quality_tier` (`standard`, the default, or `best`) sets the default resolution: 480p for Standard, 720p for Best. An explicit `resolution` still wins for the whole step. 1.0.0 always defaulted to 720p.
- The manifest's cost basis stays the 720p rate, the most a second can cost.
- The lip-sync body changed, so no `reuses_pieces_of`.

## 1.0.0

- First version, from create-lipsync-veed-fal and the podcast skit's clips and idle steps: one Veed Fabric 1.0 piece per spoken line on its speaker's face, optional silent listening clips per face, and a price cap checked before anything is ordered.
