# cast-plate

## 1.1.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. A template that cannot be read is named by its file name on Windows too (the whole path was shown). Nothing else changed from 1.1.0.

## 1.1.0

- `plate` and `crops` inputs: a plate already made (a preview approved before the yes) is used as is, nothing is ordered, and its singles are cut at the given crops (0..1 of the plate, in seat order), else at the layout's seats. `crops` without `plate` is refused. Without `plate` nothing changes.

## 1.0.0

- First version, from create-podcast-skit-video-from-refs (`gen_paid.py plate` and `crop_singles.py`): one GPT Image 2 plate of two or three cast members in one room, cast images as /edit references, and free full-height singles cut at fixed seats (two_shot 30% / 70%, three_shot 20% / 50% / 80%).
