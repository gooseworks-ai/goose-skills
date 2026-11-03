// The /v1/music/detailed answer the kit receives ({json, file_url}), copied verbatim from the
// W0-62 contract fixture (contracts/replies/elevenlabs-music-detailed.json, made 2026-10-12 from
// the public ElevenLabs OpenAPI; no paid call). Words are in `json.words_timestamps`, in ms.
export const musicDetailedAnswer = {
  "json": {
    "composition_plan": {
      "positive_global_styles": [
        "upbeat pop",
        "female vocal",
        "bright synths"
      ],
      "negative_global_styles": [
        "metal"
      ],
      "sections": [
        {
          "section_name": "Verse",
          "positive_local_styles": [
            "light drums"
          ],
          "negative_local_styles": [],
          "duration_ms": 8000,
          "lines": [
            "Pack it small",
            "take it all"
          ]
        },
        {
          "section_name": "Chorus",
          "positive_local_styles": [
            "big drums"
          ],
          "negative_local_styles": [],
          "duration_ms": 8000,
          "lines": [
            "One jacket, every trip"
          ]
        }
      ]
    },
    "song_metadata": {
      "title": "Pack It Small",
      "description": "An upbeat pop jingle.",
      "genres": [
        "pop"
      ],
      "languages": [
        "en"
      ],
      "is_explicit": false
    },
    "words_timestamps": [
      {
        "word": "Pack",
        "start_ms": 420,
        "end_ms": 780
      },
      {
        "word": "it",
        "start_ms": 780,
        "end_ms": 960
      },
      {
        "word": "small",
        "start_ms": 960,
        "end_ms": 1620
      },
      {
        "word": "take",
        "start_ms": 2100,
        "end_ms": 2400
      },
      {
        "word": "it",
        "start_ms": 2400,
        "end_ms": 2560
      },
      {
        "word": "all",
        "start_ms": 2560,
        "end_ms": 3300
      },
      {
        "word": "One",
        "start_ms": 8200,
        "end_ms": 8500
      },
      {
        "word": "jacket,",
        "start_ms": 8500,
        "end_ms": 9100
      },
      {
        "word": "every",
        "start_ms": 9300,
        "end_ms": 9700
      },
      {
        "word": "trip",
        "start_ms": 9700,
        "end_ms": 10600
      }
    ]
  },
  "file_url": "https://line.example.invalid/files/fixture/audio.mp3"
};

// The request that answer belongs to (music_v1, a composition plan, with_timestamps).
export const musicDetailedRequest = {
  "composition_plan": {
    "positive_global_styles": [
      "upbeat pop",
      "female vocal",
      "bright synths"
    ],
    "negative_global_styles": [
      "metal"
    ],
    "sections": [
      {
        "section_name": "Verse",
        "positive_local_styles": [
          "light drums"
        ],
        "negative_local_styles": [],
        "duration_ms": 8000,
        "lines": [
          "Pack it small",
          "take it all"
        ]
      },
      {
        "section_name": "Chorus",
        "positive_local_styles": [
          "big drums"
        ],
        "negative_local_styles": [],
        "duration_ms": 8000,
        "lines": [
          "One jacket, every trip"
        ]
      }
    ]
  },
  "model_id": "music_v1",
  "with_timestamps": true,
  "respect_sections_durations": true
};
