# Human version

Verify the installed podcast package runs independently, preserves completed
voiceovers and uses real character timings. The free preview checks packaging
and edit mechanics. A paid cold run and review of the finished video check
creative quality separately.

---

# Agent version

Run these from the installed capability folder, with the prerequisites in the
scripts README available. They require no credentials and spend nothing:

```bash
python3 -m unittest discover -s scripts -p test_distribution.py -v
python3 scripts/selftest.py
```

For an install smoke test, copy only the files listed in the public index into
an empty skill collection with its declared dependency packages. Copy the
example config and script into a brand project. Supply the optional product
panel and corner logo, or disable those layers. Then run:

```bash
python3 scripts/one_shot.py --config <brand-config> --script <brand-script> --run-dir <run> --no-paid
```

Pass when the driver renders a 1080x1920 preview and its checks report zero
failures. Paid commands without execution approval must make zero calls. The
self-test must report all 65 falsification cases clean on good input and fail
on their corresponding bad input.

With approved paid assets, repeat without the preview flag and watch the whole
master. Require the intended conversation structure, matching host voices,
lip-sync, stable room and identities, white captions within the configured safe
zone timed from the actual voiceover, and the real brand end card. A re-cut
must reuse the paid assets. Motion inserts are unsupported and must fail
explicitly if enabled.
