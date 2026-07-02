# Smoke test — remix-ugc-car-confessional-from-sample

Given a draft project with `format_key: ugc-car-confessional` and a researched brand, the recipe
fetches the sample + brand, derives refs + a Seedance prompt, gates for approval, and
(on go) renders one Seedance call via `create-ugc-car-confessional-video-from-refs` and publishes the master.
