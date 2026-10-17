# Outliers and trends

Load at step 6.

## Outliers — what overperformed, honestly

Raw views reward big accounts. Judge each post against its own author.

- **Outlier multiple** = the post's views ÷ the median views of the author's last 10–20 posts. Flag at ≥3×. Require at least 5 posts of history; otherwise say "no baseline".
- **Age:** only posts at least 48 hours old (early views mislead); compare views per day if ages differ a lot.
- **Engagement rate** (likes + comments + shares ÷ views) is compared with the same account's median, not with cross-platform "norms".
- **Candidates:** the category's top posts from keyword/hashtag pulls, rivals' posts from `brand_read` `organic`, and the research runs' discovered posts (`social_inspiration_search` `source: "research"`). Read author baselines (their last 10–20 posts) on the author's public profile page in the host browser for the top ~10 candidates; where the page won't show view counts, say "baseline not read" and don't call it an outlier — a paid baseline read is part of the top-up.
- **Exclude** the brand's own posts and its founder's or execs' posts (analyze-performance reads those), and negative or risk-routed posts about the brand.

For each keeper record the **one-line why** in three parts:
- **Hook** — what happens in the first 1–2 seconds or the first line ("POV: the vet says 'just try another food' for the fifth time").
- **Format** — talking head, green-screen reaction, before/after, GRWM, day-in-the-life, list, demo, street interview, meme/text-on-screen, carousel, long-form review.
- **Topic** — the subject in buyer words.

Save with `gooseworks:social_inspiration_save` (the live schema lists its fields) — this playbook's conventions:
- the post's own link, platform (one the tool accepts; otherwise `other` with the platform in the tags), creator handle, caption, posted date, the stats as returned, the platform post id (so the same post is never saved twice), and thumbnail or media links when the pull returned them;
- `note`: "<multiple>× vs median of <n> posts · hook: … · format: … · topic: …";
- `tags`: `listen-social`, `outlier` or `competitor-winner`, the format, `week:<yyyy-www>` (the counting week's ISO week, lower-case, e.g. `week:2026-w41`).
Check `gooseworks:social_inspiration_library` first so the same post is not saved twice.

## Trends

A trend is a sound, format, meme, topic or hashtag whose use is rising across unrelated accounts this week. One viral post is not a trend.

For each trend record:
| Field | How |
|---|---|
| first seen | the earliest date you have evidence of it (run-organic-social reads it) |
| platform | where it lives |
| evidence | 3–5 sample posts with dates and links; use this week vs last (sound use counts, hashtag post counts, how many unrelated accounts). First run: estimate from the dates of the sampled uses and say "no prior snapshot" |
| stage | emerging (few accounts, rising fast) · peaking (everywhere, brands arriving) · saturated (brands everywhere, parodies of the format) |
| fit | does it fit the brand, the voice and the buyer? one line |
| brand safety | the origin of the meme or sound — offensive roots, tragedy, a political moment → skip |
| audio rights | business accounts may only use commercially licensed sounds. Say "commercial use allowed" only if the pull returned a commercial-use flag; otherwise "unverified — check the platform's commercial music library before posting" |
| effort vs time left | production effort against the stage; recommend a **post-by date** (run-organic-social reads it) |
| confidence | low / medium / high — "how long it has left" is an estimate from stage and evidence, never a fact |

Rejected trends get one line: "skip — <reason>". A week with no fitting trend says so.

## What makes a senior reject this section

Raw view counts as "outliers"; a trend backed by one post; no dates; no audio-rights line; "this will last two weeks" stated as fact; the brand's own posts in the outlier list; saving the same post twice.
