# Sample input — remix-chatgpt-ad-from-sample

Paste-prompt shape (what the app generates):

> Use the ads-remix skill to finish video ad project `c2a7…` : read the project and its source
> template, make sure the brand is researched, then produce the final video ad and save it.

Backing rows the skill fetches:

- **Project**: `{ id: "c2a7…", brand_id: "b1…", source_sample_id: "s9d…", format_key: "chatgpt", status: "draft" }`
- **Sample** (`get_ad_template`): `recipe.conversation` (grounded in the Bioma run-15 reference
  build's `thread.json` — single question → one loading dot → one streamed answer) =
  ```json
  {
    "statusBar": { "time": "11:42", "dnd": true },
    "header": {
      "style": "plain-title",
      "title": "ChatGPT",
      "rightIcons":    ["personPlus", "dottedCircle"],
      "rightIconsAlt": ["edit", "more"]
    },
    "keyboard": { "suggestions": ["Why", "My", "I'm"], "state": "hidden", "id": "kb" },
    "messages": [
      { "type": "user-text", "id": "msg-user-1", "text": "Why is my stomach so bloated all of a sudden at 47?", "popState": "pending" },
      { "type": "loading-dot", "id": "dot-1", "popState": "pending" },
      {
        "type": "assistant",
        "id": "msg-assistant-1",
        "stream": true,
        "popState": "pending",
        "feedback": false,
        "text": "You're not imagining it. As estrogen drops in perimenopause, your gut microbiome shifts — which often shows up as bloating, sluggish digestion, and weight that sits differently than before.\n\nIt's hormonal, not willpower.\n\nThings that tend to help:\n\n* A daily synbiotic — probiotic + prebiotic + postbiotic, not just one of the three\n* Strains researched for the hormonal shift\n* A delayed-release capsule so it survives stomach acid"
      }
    ],
    "composer": { "placeholder": "Ask anything" }
  }
  ```
  - `extracted_script`: the user question ("Why is my stomach so bloated all of a sudden at 47?")
    + the streamed assistant answer above.
  - `media_url`: the published source MP4 (watch it if the streaming pace is unclear).
- **Brand**: researched pack for `acme-gut` (voice: calm, de-shaming; product = a daily synbiotic;
  code `ACME10`).
- **Optional `angle`**: "ask about late-night bloating, weave in code ACME10".
