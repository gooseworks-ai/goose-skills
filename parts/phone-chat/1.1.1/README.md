# phone-chat 1.1.1

One phone screen with skins, folded from today's phone-chat atoms (render-imessage-chat, render-chatgpt-chat,
render-apple-notes-chat, render-imessage-cascade, render-ios-keyboard and the create-*-mockup pages they
bundle). Free; needs the kit's browser.

- **From the plan** (`scenes`, `products`, `answers`, `brand_name`): iMessage and the cascade take one message
  per scene as "Name: text" (Me is the phone's owner; one contact is a DM, more need the answer `group`; a
  scene's `picture` shows a chosen product's photo); ChatGPT takes the question, then the answer; Apple Notes
  takes the title, then one list line per scene. The last `ending_scenes` scenes are the end card's. Answers:
  `theme` (iMessage dark or light), `clock` (the phone's time), `group`, `resolution` (the cascade's success
  message, the scene before the end card). `pacing` is the skin's named timing (Apple Notes and the cascade).
- **Skins**: `imessage` (typing dots before each received message, the composer types exactly the sent text,
  reactions, photos, inset Dynamic Island, the newest row clear of the TikTok/Reels controls), `chatgpt` (the
  typed question, a one-beat send, one grey dot, the answer streaming in word by word), `apple-notes` (the note
  typed character by character), `notification-cascade` (iMessage banners piling up from the bottom over the
  desk `plate`, cleared with a swipe).
- **Drawing**: each skin writes one self-contained page whose `window.seek(ms)` draws any movie time (no timers,
  clock or randomness; fonts only the bundled Inter (SIL Open Font License) or `fonts`). The part steps it frame
  by frame in the kit's Chromium (fixed output frames: start-up or machine speed never changes a frame),
  checking for iMessage that typed text equals sent text and the newest row stays in the safe zone.
- **Sound**: the skin's original sounds (iMessage send and receive, ChatGPT key and send taps, the cascade's
  pop and swoosh) on their reveal frames, leading silence stripped, a quick follow-up cue cut so it cannot mask
  the next, peak-limited. Apple Notes is silent. The music bed comes later, in audio-mix (`duck: true` ducks it
  under these sounds).
- **Ending**: crossfades (`crossfade_ms`, default 300, in whole frames; under one frame is a straight cut) into the `ending` clip (the style's html-frames end
  card), which holds in silence; the timeline marks it as `end_card`.
- **Outputs**: `video` (H.264 with the chat's sounds), `seconds`, `timeline` (each scene from the moment it
  shows, the end card scenes over the card).
- **Measure** (`measure_only: true`, new in 1.1.0): returns only `{seconds, messages, words, photos}` from the
  plan (for ChatGPT `words` counts only the answers' words as the page streams them, Markdown marks removed and each
  list bullet as one word; the question is timed by its characters), computed by the same code the render runs (scenes to thread, the skin's timeline and counters, the font
  check and every refusal), with no browser, no files written and nothing ordered. `seconds` is the chat's length
  before the end card: the rendered timeline's `end_card.start_s` plus the crossfade in whole frames, or its whole length when
  there is no ending. A style uses it to size or refuse a plan before anything is drawn.
- **Fonts**: every character on screen must be drawn by the bundled Inter or the given fonts (an emoji needs
  `fonts.emoji`); anything else is refused, so the browser never falls back to a font of the computer.

Source: `parts/phone-chat/src/part.mjs`, `src/threads.mjs` (scenes to threads), the skins in `src/skins/`,
and `src/manifest.mjs`.

Refused before anything is drawn: a typing rate of zero or any pacing that is not a finite number, and any chat
longer than 300 s. Each scene starts at its message's first reveal (never a later event of the same message).
