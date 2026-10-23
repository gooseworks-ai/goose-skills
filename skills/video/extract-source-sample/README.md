# extract-source-sample

Turn a finished content-goose ad run into a `source-sample.json` — the same
JSON shape the `upload-ad-sample` skill writes when it publishes an ad to
the Goose Ads library.

This skill is **agent-executed** (no Python scripts). The agent reads the
run folder, builds the JSON, links every character + voice to the central
character library at `/Users/akhil/projects/content-goose/assets/character-library/`,
and **adds any missing characters to the library before linking**.

## How it fits

```
existing ad run                    →  [extract-source-sample]  →  source-sample.json
                                                                      │
              user's script-rewrite + character-swap agent  ←  ──────┘
                                       │
                                       ▼
                                  [remix-ad]  →  remix video
```

Step 1 (this skill) just makes the source JSON. The next agent step rewrites
the script + swaps characters / voices / world. `remix-ad` renders.

## Quickstart

```
Read ./gooseworks-ads-video/skills/templates/extract-source-sample/SKILL.md
and extract the source-sample.json for <path to ad run>.
```

That's it — no install, no env, no flags beyond `--run-dir`.

See [`examples/`](./examples) for a worked run on Ladder run-02. The output
schema is in [`references/source-sample-schema.md`](./references/source-sample-schema.md).

## Part of

[gooseworks-ads-skills](../../../README.md) — GooseWorks' internal ad-production skills.
