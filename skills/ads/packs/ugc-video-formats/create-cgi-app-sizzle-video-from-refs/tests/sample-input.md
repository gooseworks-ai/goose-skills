# Sample Input

## Brief
A "3D-CGI app sizzle" for **MasterClass** — a gold-trimmed phone floats in a smoky-black
studio and six app features demo one per beat; each beat bursts REAL App Store UI elements
out of the phone in 3D (instructor portraits, a fanning deck of course cards, a video tile
+ Up-Next pills, orbiting devices, glass audio/download icons), then a climax collapses
everything back into the screen on "Two hundred plus classes. One app.", closing on a PIL
brand end card. Single Eryn VO, premium-tech music bed, restrained captions. Vertical 9:16,
~22.6s, sped 1.15x with an anti-AI grain pass.

## Assets (git-LFS — fetch+checkout first)
- app screens (the on-screen UI, composited via PIL — never AI-rendered):
  `brand-assets/app-screens/main/screen-01..06.png`
  (For You, Library, Lesson player, My Learning, Audio player, Brand poster)
- app icon: `brand-assets/app-screens/main/app-icon-512.jpg` (side-element on beats 1 + climax)
- wordmark (PIL end card, never AI): `brand-assets/masterclass-wordmark.svg`
- reference pin (palette source): `brand-assets/reference-ads/pinterest-3dcgi-sneaker-app.jpg`
  (Pinterest pin 1119566788643692467, re-paletted champagne → smoky-black + amaranth)

## Beats (one feature each)
1. Discovery / For You — 3 instructor portrait tiles pop out — "Two hundred world-class instructors. One feed."
2. Library — deck of course cards fans out — "Cooking. Writing. Photography. Business. Strategy."
3. Bite-size / Up Next — video tile + pills cascade — "Lessons that fit a coffee break."
4. Cross-device — iPad / TV remote / MacBook orbit — "Mobile. Tablet. Web. TV."
5. Audio + Offline — glass headphone + download icons eject — "Listen on the run. Download for the flight."
6. The pitch (CLIMAX) — everything collapses back in — "Two hundred plus classes. One app."

## Look + audio
- studio: smoky-black `#0A0A0A`, amaranth `#E32652` rim-light upper-left, gold phone, warm bokeh
- VO: Eryn (`dMyQqiVXTU80dDl2eNK8`), eleven_v3, spec-sheet declarative — locked to measured audio
- music: premium-tech cinematic underscore, instrumental, slow build, no artist names

Full config: `scripts/config.example.json`. Reference render:
`demo/finals/masterclass-cgi-app-sizzle.mp4`.
