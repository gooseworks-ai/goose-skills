# overlay

## 1.0.1

- A file path may be a Windows path (`C:\...` or `C:/...`). Every file going in or out was refused on Windows before, because a path had to start with `/`. Nothing else changed from 1.0.0.

## 1.0.0

- First version: lays pictures over a video at time windows (a corner logo for the whole video or until the end card; a product's real photo over each scene that names it, with an optional scale-in). Re-encodes once with the size rule's bitrate cap and refuses an output over 180 MB; copies the sound; passes the timeline through.
