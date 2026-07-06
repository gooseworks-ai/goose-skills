# Smoke Test

gen_video.py --model fal-ai/kling-video/v2.1/standard/image-to-video --payload '{...}' --out clip.mp4 — bills the agent; host-swaps the FAL queue URLs; downloads the result.

Pass when the script runs to a valid output and (for paid caps) the call is proxy-routed (bills the agent, no direct provider host).
