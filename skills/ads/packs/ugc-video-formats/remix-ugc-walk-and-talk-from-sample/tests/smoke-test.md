# Smoke test — remix-ugc-walk-and-talk-from-sample

Given a draft project with `format_key: ugc-walk-and-talk` and a researched brand, the recipe
fetches the sample + brand, derives refs + a Seedance prompt, gates for approval, and
(on go) renders one Seedance call via `create-ugc-walk-and-talk-video-from-refs` and publishes the master.
