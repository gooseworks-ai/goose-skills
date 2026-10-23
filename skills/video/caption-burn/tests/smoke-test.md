# Smoke Test

1. `transcribe.py --media reel.mp4 --out reel.words.json` uploads the audio through the fal-storage-proxy and transcribes through the fal-proxy (bills the Ads agent). It writes word timings in the reel's time.
2. `captions.py --video reel.mp4 --beats cutlist.aligned.json --words reel.words.json --out final.mp4` burns one to three words at a time.

Pass when every spoken line has captions, the plate straddles the seam (25% above, 75% below) on split beats, the last caption holds to the final frame, and the audio is copied untouched. Without `--words` it still renders (estimated timing) and says so.
