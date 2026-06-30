# Sample input — remix-imessage-ad-from-sample

Paste-prompt shape (what the app generates):

> Use the ads-remix skill to finish video ad project `c2a7…` : read the project and its source
> template, make sure the brand is researched, then produce the final video ad and save it.

Backing rows the skill fetches:

- **Project**: `{ id: "c2a7…", brand_id: "b1…", source_sample_id: "s9d…", format_key: "imessage", status: "draft" }`
- **Sample** (`get_ad_template`): `recipe.thread` =
  ```json
  {
    "peer_persona": { "name": "Tyler", "monogram": "TY", "avatar_bg": "#6366f1" },
    "bubbles": [
      { "from": "peer", "text": "wait what is that??", "typing_before": true },
      { "from": "me", "text": "graded it with CatchBack lol" },
      { "from": "peer", "text": "ok sending one rn — what app?" },
      { "from": "me", "text": "CatchBack — code FREEPACK gets you one free" }
    ],
    "end_card": { "wordmark": "CatchBack", "code": "FREEPACK", "tagline": "Grade your first card free" }
  }
  ```
- **Brand**: researched pack for `acme-supps` (voice: dry, friendly; product shot in
  `brand-assets/`; code `ACME10`).
- **Optional `angle`**: "make the friend skeptical about pre-workouts".
