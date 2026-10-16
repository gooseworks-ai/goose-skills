# Voice: sound like a person, in the brand's voice

**Summary.** Read this before writing any line. The brand's own voice and its customers'
real words decide tone and word choice. The rules below only strip what makes copy sound
machine-made; they never replace a brand's voice. The rule check flags the worst habits.

## The brand's voice comes first

Read the voice from the brand context you already loaded: the brand record (brand_read),
or the digest's voice and the buyer brief's customer words. Write the way that brand
talks and the way its buyers describe the problem and the product. When the brand's voice
and a rule below disagree, keep the brand's voice and drop only the machine-made habit.

## The rules

**Sound like a person, not an ad.** Use the brand's voice from the digest and real customer words from the buyer brief; these rules only strip what sounds machine-made.
- Write what the speaker would say out loud to a friend: whole sentences that run on with "and", "so", "because", with contractions and one concrete detail.
- Vary rhythm and connect the thought. Reject disconnected spoken headings/bullet stamps such as "Rich. Creamy. Ready." Short natural replies remain valid in an actual exchange. Caption chunks and scene boundaries do not define sentence length.
- A spoken sentence may run across two scenes; not every scene ends on a full stop.
- Don't narrate the picture ("Look at that sauce") or read steps aloud ("Boil water. Stir."). Show the steps; say what they mean for the viewer.
- No ad-speak: "game-changer", "elevate", "say goodbye to", "meet your new", "it's not just X, it's Y", "that's the night I wanted", stacked adjectives.
- The hook is something a person would really say: a confession, a surprise, a specific moment or an opinion. Never a mood ("Tonight I want something cozy") or a generic question ("Craving pasta?"). Say it in one breath.
- Read every line aloud as the person on screen. If it sounds strange, rewrite it.

Made-up brand, to show the difference:
Bad: "Mornings are hard. Coffee helps. Meet Hollow Oak. Smooth. Bold. Ready in seconds."
Good: "I used to queue for an iced latte every morning before work. Now I pour this straight from the fridge and still get out the door on time."

## Hooks: draft three, keep one

For each script, draft 3 hooks from different moves and keep the one a stranger would
stop for. The moves:

- **A confession with stakes:** what the speaker risks or hides.
- **A contrarian claim:** an opinion the viewer may push back on.
- **A surprising fact from the brief:** only a fact the brief backs.
- **A specific moment:** one time, place and action.

Never a status update ("It's a work night and I'm…", "Home late and…", "Just got
home…"); it is a mood with a clock on it.

## What the rule check flags

`lint_scripts.py` reads spoken lines across beats in order, so a sentence can run across
two scenes. Scenes are numbered from 1. These are warnings, never a price block.

| Code | Fires when | Line it adds |
|---|---|---|
| W_FRAGMENT_CHAIN | 3 or more spoken sentences in a row of 5 words or fewer | "Scenes N-M read as clipped fragments; join them into sentences a person would say." |
| W_STEPS_ALOUD | 3 or more spoken sentences in a row that start with a how-to verb (boil, cook, add, stir, heat, pour, mix, remove, turn, open, serve, put, place, fold, spread, shake, blend, chop, cut, microwave, bake) | "Scenes N-M read steps aloud; show them on screen and say what they mean for the viewer." |
| W_MOOD_OPENER | Scene 1's spoken line (or its on-screen words when it has no spoken line) or a hook states a mood, a craving or a status update ("Tonight, I want…", "Craving…", "In the mood for…", "Want pasta?", "It's a work night…", "Home late…", "Just got home…", "So here I am…") | "Scene 1 states a mood; open on a confession, a surprise, a specific moment or an opinion instead." |
| W_AD_SPEAK | Any line, hook or on-screen text uses ad-speak (game-changer, elevate, say goodbye to, meet your new, it's not just, isn't just, that's the night (or evening, morning, day) I wanted, look at that or those, this is what I'm craving, indulgent, mouthwatering, irresistible, effortless, level up, transform your, and the older AI-vocabulary list), or a spoken sentence narrates the picture ("look at", "check out", "here's the", "see that", "see how") | "Scene N uses ad-speak ('…'); say it the way a customer would." |

W_FRAGMENT_CHAIN and W_STEPS_ALOUD are skipped when a concept is silent (the shape's
`speech: "none"`, or no spoken lines); W_MOOD_OPENER then reads beat 1's on-screen words.
Before review, fix W_FRAGMENT_CHAIN, W_MOOD_OPENER and W_AD_SPEAK or say in one line why
the brand's voice needs the line; W_STEPS_ALOUD is advice.

## Performance handoff

Preserve exact words separately from supported energy/emotion/emphasis/pause direction.
Record difficult brand/product/ingredient pronunciations beside real caption spelling.
Model-specific tags/settings are not portable; do not add literal hesitation/laughter
unless wanted. Ordinary UGC starts brisk and conversational, with reference/accepted
performance resolving the actual pace. Listen to the whole actual performance and
joins/endings; transcript similarity cannot establish voice naturalness or fine sync.
