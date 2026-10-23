# Smoke test — iMessage reference repair

Run the fictional example without external images, network generation or paid
calls. Then change its contact name and theme and confirm the output follows.

```bash
cd scripts
npm ci
# Check this script's own Chromium before starting.
node record-chat.js --config config.example.json --out-dir /tmp/imsg-preview --preview-only
bash render.sh --config config.example.json --out /tmp/imsg-smoke/master-final.mp4
```

Expect a proportional phone, inset island, Maya in the header, natural texts,
original receive/send sounds and Sample Goods on the end card. Stars are absent.
The final message remains visible before the end card. Output is 1080×1920.
The newest message sits above the bottom 400 px and left of the right 140 px
(`master-chat.safe-area.json`; check-render prints the measured range).
Change participant name to Akhil and theme to light; check the header/initial,
visible black header controls, hardware inset and frame margins again.

Repeat from a copied package without `assets/`: the embedded original sounds
must work. Never repair it with substitute audio. The runnable example is
fictional; these creative values are never customer defaults.

From the capability root:

```bash
node --test tests/test_chat.js
node --test tests/test_safe_area.js
python3 -m pytest tests/test_stitch.py
```

Review the actual finished MP4, including its audio. Technical metadata and a
still frame do not establish creative acceptance. No 1:1 crop in this recipe.
