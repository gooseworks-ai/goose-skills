# Human version

Pick every shot's model, or its kit part on the kit path, from one table. Re-roll the cheapest layer that fixes the problem.

---

# Agent version

The two paths are defined in capabilities.md at the package root. Agent-built path (the default): use the fal model id column. Kit path only: the part column. Rows with no model, agent-built: `create-kinetic-typography` for type, `goose-graphics` for cards and stills, FFmpeg overlay for screenshots and logos.

Use this table in three places: the design brief writes one routing line per scene (`scene N → <row> → <fal model id>`, plus `part@version` on the kit path), create-clips makes each scene on its row, and edit-clip re-rolls on the same row. Then open the genre card for the brief:

- AI creator or UGC talking video: [ai-creator-ugc](genres/ai-creator-ugc.md)
- Kinetic type or designed motion cards: [motion-graphics](genres/motion-graphics.md)
- Fast product hero motion: [hypermotion](genres/hypermotion.md)
- Chat or app screen story: [chat-ui](genres/chat-ui.md)
- Product demo or proof points: [product-demo](genres/product-demo.md)

A shot with no row is an open decision for the operator, not a free model choice. For any shot with a person, also follow the avatar guide that ships with `create-image-fal`.

| Shot type | Kit part@version | fal model id | Prompt rules | Known tells | Cost | Check before keeping |
|---|---|---|---|---|---|---|
| Talking creator, exact script | `creator-h3@1.2.3` | `minimax/h3-max/reference-to-video` | One creator from the cast with an approved still; plan at most 3.2 words/s and 15 s per take; no square brackets in lines; hide take joins under a cutaway | Rushed or clipped last words; a join mid-sentence; face drifts from the still | $$$ | Listen to take 1 before ordering the rest; transcript matches the script |
| Narrated creator scene montage | `video-h3max@1.1.0` (stills mode) | `minimax/h3-max/reference-to-video` | One still per scene is the first frame; write motion only; clips 4-15 s timed to the voice; drop native sound when the voice comes from another step | Animated black bars; product redrawn | $$$ | Each clip covers its scene; product matches its photo |
| Two-person dialogue / street interview | `video-h3max@1.1.0` (take mode) | `minimax/h3-max/reference-to-video` | Native dialogue with a speaker per beat; at most 4 takes of 8 beats; a spoken beat needs words ÷ pace + 0.5 s. Never send a photoreal person still to Seedance | A line from the wrong mouth; drift at take ends | $$$ | Each line comes from the right speaker; transcript matches |
| Seated two-person talk | `cast-plate@1.1.0` → `lipsync-veed@1.0.0` → `dialogue-cut@1.0.1` | `openai/gpt-image-2/edit`, `veed/fabric-1.0` | One plate for the room (one still per person puts them in different rooms); faces neutral, mouths closed; 2-3 people with different looks | Twins; mouth smear | $$ | Singles differ; each clip within 0.5 s of its audio |
| Creator B-roll, no speech | `video-kling@1.0.0` | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` | Motion only, the still carries the look; one camera move; "steady locked camera, no shake"; Kling makes only 5 s or 10 s clips; trim in the edit | Morphing hands or faces; content the prompt never asked for | $$ | Watch the whole clip against its still; drop or mask invented content |
| Lipsync onto an existing take or still | `lipsync-veed@1.0.0` | `veed/fabric-1.0` | Neutral, closed-mouth, head-and-shoulders still; one approved audio line per clip; 720p | Mouth smear on hard consonants | $$ | Length within 0.5 s of the audio; watch the mouth |
| Cast anchor portrait | `image-gpt-image-2@1.1.2` (one person); `cast-plate@1.1.0` (2-3 in one room) | `openai/gpt-image-2`, `openai/gpt-image-2/edit` | Matte natural skin, frontal gaze, plain background, deep focus; state each person's ethnicity in group shots | Waxy skin; blurred background; face under 300 px | $ | Crop the face, enlarge 2× and inspect |
| Set / world reference still | `image-gpt-image-2@1.1.2` | `openai/gpt-image-2` | Empty set, no people; even light, deep focus; the reference for every shot there | The room changes between scenes | $ | Compare each scene's background with it |
| Presenter or UI still | `image-gpt-image-2@1.1.2` + `overlay@1.0.0` | `openai/gpt-image-2/edit` | Leave screens blank or turned away; put the real screenshot on with overlay; no words in the prompt | Garbled labels; a border or letterbox | $ | Read every string on the frame |
| Photoreal keyframe / product hero | `image-gpt-image-2@1.1.2` | `openai/gpt-image-2/edit` | Send the real product photo in the edit request; describe the action and set, not the product; one colourway | Product redrawn (logo, shape, colour); extra hands | $ | Product matches its photo at 2× |
| Product photo overlay | `overlay@1.0.0` | — | Real product photo or logo (PNG, JPEG, WebP) over the scenes that name it; up to 8 items | SVG logo skipped; covers a face | free | Watch every window |
| Cartoon keyframe | `image-nano-banana@1.2.3` | `fal-ai/nano-banana`, `fal-ai/nano-banana/edit` | One style anchor as reference; the reference's brightness beats a hex code; no text | Colours lighter or darker than locked; garbled text | $ | Compare with the style anchor |
| Product in hand / motion from a keyframe | `video-veo-3@1.0.1` | `fal-ai/veo3.1/fast/image-to-video` | Start frame from the product still; one governing camera idea; both hands already on the object, no tap or twist; say "stationary" for still scenes | Dark plates fail; floating object; background moves | $$ | Sample 8 fps; last second shows the right product |
| Complex product motion | `video-seedance-2@1.2.0` | `bytedance/seedance-2.0/image-to-video` | Product photo as start frame; say whether the camera or the subject moves; 4-15 s | Camera and subject motion swapped; morph between impossible angles | $$$ | Watch for morphs; use an FFmpeg cut when no real camera path exists |
| Hypermotion product | `video-seedance-2@1.2.0` (reference mode) + `html-frames@1.2.1` cards | `bytedance/seedance-2.0/reference-to-video` | Product photos as references; no person references; fast hero moves; all words on HTML cards | Product redrawn; text in the clip | $$$ | Product matches its photo; no AI text |
| UI / screen insert | `cut-footage@1.2.1` or `overlay@1.0.0` | — | Real screen recording or screenshot; cut the window that shows the feature being said | Wrong screen for the line; a flash cut | free | The feature is visible while it is said |
| Chat screen | `phone-chat@1.3.0` | — | One message per scene as "Name: text"; skins: iMessage, ChatGPT, notes, notification stack | Text past the screen; typing out of sync | free | Every message readable at phone size |
| Kinetic type / motion card | `html-frames@1.2.1` (seed frames only) + `overlay@1.0.0` for real screenshots | — | Words mirror the voice; each card holds for its reading time | Words that differ from the voice | free | Read every card at phone size |
| End card | `end-card@1.1.1` | — | Real logo, never redrawn; up to 3 rows of 60 characters; hold at least 1.5 s | Logo stretched; CTA missing | free | Readable at phone size for 1.5 s |
| Voiceover | `voice-elevenlabs@1.1.0` | `eleven_v3` | Approved voice only; brand pronunciations; one line per scene | Mispronounced brand words | $ | Listen to every line |
| Music | `music-elevenlabs@1.0.2` | `music_v1` | Mood from the plan; ask for a continuous bed with no quiet sections | A silent gap mid-bed | $ | Measure the level over the whole bed |
| Captions | `captions-layer@1.4.0` | `fal-ai/whisper` | Word timings from the voice step; keep captions off the product | Captions across a cut or over the product | $ | Read each caption against the audio |

**Cost ladder.** Use, and re-roll, the cheapest layer that does the job: HTML, text or FFmpeg (free) → a still ($) → a still with image-to-video ($$) → premium video only for physics, fluids, particles, talking or native audio ($$$). Words never go into a generated picture. Pick one governing camera idea per ad before the scene table; every camera move serves it.

**Models seen in older runs with no part.** Move them to a row: `fal-ai/flux/dev` → `openai/gpt-image-2`; Seedance text-to-video with a separate lipsync → `creator-h3@1.2.3` (one creator) or `video-h3max@1.1.0` (two speakers); `fal-ai/nano-banana-pro` → `fal-ai/nano-banana`; Veo 3.1 Lite → `fal-ai/veo3.1/fast/image-to-video`.
