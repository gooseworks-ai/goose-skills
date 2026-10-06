# Smoke Test

Structural: SKILL + scripts parse.

Pass when the script runs to a valid output and (for paid caps) the call is proxy-routed (bills the agent, no direct provider host).

Policy rejections (free, no provider call): `python -m pytest skills/ads/capabilities/media-proxy/tests` runs `_fal_run` against a local mock proxy. Pass when every rejection body shape (fal `detail` with msg and/or type, the GooseWorks `provider_validation_failed` wrapper) raises `FalPolicyRejection`, an identical request is then refused with no submit (also with `new_take=True`), a changed input is sent, and a non-policy 422 stays a plain `RuntimeError` that is not recorded.
