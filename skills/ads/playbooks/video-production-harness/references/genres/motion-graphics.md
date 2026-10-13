# Motion graphics

Kinetic type and designed cards, often over real product screenshots. Routing rows are named as in the shot-routing guide.

## Shot list skeleton
1. 0-3 s hook line on flat brand colour, moving from frame one.
2. 3-6 s the problem, one idea.
3. 6-10 s a real product screenshot floats in; up to 3 callouts pop after; hold 2 s or more.
4. 10-13 s proof: a number counts up (brand-stated only).
5. 13-16 s benefit line or a second screenshot.
6. 16-19 s CTA naming the brand, with the logo, 3 s or more.

## Routing rows
Kinetic type / motion card · Presenter or UI still · UI / screen insert · Voiceover · Music · End card.

## How it's made
Agent-built path: motion with `create-kinetic-typography`, designed stills or cards with `goose-graphics`, real screenshots with FFmpeg overlay. html-frames is kit path only.

## Pacing
- About 3 s per card (1.5-10 s); at most 10 words or 60 characters a card; 8-30 s total.
- Voice-led: about 5 cuts per 10 s, on the phrase. Music-led: faster, on the beat. Don't mix the two.

## Nearest template
`kinetic-text`

## Top 5 failures and fixes
- Garbled letters from a model → draw every word and logo in HTML; models draw only scenes.
- Spring overshoot pushes text off frame → size text so the peak fits 88% of the frame.
- Long copy squeezed small → split it into more cards; never shrink the text.
- Captions collide with on-screen type → drop captions while a card carries words.
- A screenshot looks fake or soft when zoomed → capture the real UI at 2-3× density; keep its layout, colours and type.
