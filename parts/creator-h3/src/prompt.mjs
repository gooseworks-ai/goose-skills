// Native creator directions follow the approved capture and reference.
// Delivery stays outside spoken copy; prompt requests require actual review.

export const H3_CAPTURE = {
  "phone_counter": "An ordinary phone recording from a phone supported outside the frame at eye level. Static chest-up shot, complete face and both shoulders visible with headroom. Both hands are free; gestures are small and serve the words. No automatic zoom or reframing.",
  "phone_selfie": "An ordinary handheld phone selfie at eye level. One hand supports the phone outside the frame; only the other hand is free. Small movement follows the supporting arm, without artificial drift or automatic zoom. Keep the complete face visible.",
  "studio": "An approved studio recording at eye level, matching the reference composition and motivated lighting. Static medium framing with the complete face visible. Natural posture and restrained gestures; no automatic zoom or reframing."
};

export const H3_TEMPLATE = "A single continuous live-action shot of <Subject 1>, matching the approved creator reference.\n\n[Shot 1] {capture}\nThe person looks toward the lens while addressing one viewer, with natural blinks and a relaxed face. Do not force a fixed grin or busy repeated gestures. Keep the same identity, wardrobe, setting, lighting and props throughout the take.\n\nTHE SUBJECT AND SET FROM <Picture 1>: {identity}\n{environment}\nSkin detail matches the reference at this viewing distance: no waxy finish, beauty filter or sharpening halos. Background focus follows the approved reference; do not invent portrait-mode blur or demand universal deep focus.\n{mannerism}\nDELIVERY: {delivery}\nDelivery and action directions are outside the dialogue block. Only the approved words inside it are spoken, once and in order. No added hook, filler or invented sentence. A wanted hesitation such as 'uh' is part of the approved spoken words, not an automatic effect.\n\n<Subject 1> (S1) says, <d>[English] {dialogue}</d>\n\noverall_soundscape: The creator's voice and quiet natural room tone. No second voice or additional speech.\nnon_diegetic_music: N/A\n";

export const H3_MANNERISM = "\n<Video 1> is a filmed reference person recorded the same way. Take from it ONLY the rhythm of natural speech, where the pauses fall and where the pace speeds up, and the small involuntary movement while talking: the head settling, the blink rate, the eyebrow lifts, the hands coming up and dropping back. Do NOT take the face, hair, clothes, room, lighting, framing or eyeline. The person is <Subject 1> from <Picture 1> and nobody else.\n";

export const H3_DEFAULT_DELIVERY = "natural and conversational, speaking directly to one viewer. Not presenting, not announcing, not reading. Connected sentences at a brisk comfortable pace, with short meaningful pauses. Clear complete word endings, modest pitch variation and restrained expression; do not rush or shout.";

