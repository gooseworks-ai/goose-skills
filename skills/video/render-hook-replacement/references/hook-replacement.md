# Human version

A hook test changes the opening of an exact original version. It does not remake
the body. A shorter opening shortens the finished ad; a longer opening lengthens
it. Separate captions shift with that change, and burned captions stay untouched.

Supply a finished hook for free assembly, use a short free text card, or approve
a separately priced generation route. Watch the final complete video before saving
it as the chosen final.

---

# Agent version

## Freeze source before creating the opening

Bind the exact selected source/render identity, fetch its real bytes, and compute
SHA256. Record project/render IDs when the caller has them. Never replace that
source with the project's newest render, a template demo or a similar concept.
The renderer only handles local media; the integration adapter owns downloading,
access control, durable upload, saving and project/batch membership.

## Plan the cut

Watch the original opening and its transition into the body. Suggest an editable
boundary from the actual video, not a fixed three-second rule. Confirm how the new
opening leads into the first retained sentence/shot. Supply measured words when
available; a boundary inside a measured word blocks. A word list without a matching
source hash must not be reused across versions. Without measured words, the
manifest explicitly says speech was not measured and the listening review remains required.

Video is discrete frames. A boundary between frames keeps the first original frame
at/after that time and discloses the offset. Source audio is cut at the requested
time. Typical offset is under 33ms at 30fps. If this is unacceptable for a specific
join, ask for a frame-aligned boundary; do not silently alter the user's boundary.

## Choose only the needed route

| Treatment | Required new work | Paid generation |
|---|---|---|
| Supplied finished clip | Normalize hook dimensions/fps and assemble locally | None |
| Existing footage | Select/trim approved footage, then bind a finished hook | None, unless a separate paid service is chosen |
| Kinetic text | Approved short copy + licensed font; local fade/slide | None; Pillow draws the text |
| Voice over footage/text | New opening voice track using the chosen voice capability; local mux | Only the new voice track |
| Generated creator/video | New opening via chosen generation capability and usable references | Only the new opening calls |

Use published `create-vo-elevenlabs` for new narration and
`create-video-seedance-2-fal` for requested generated video after reading their
current entry points and quoting their current price. These capabilities are
optional, not requirements for supplied clips. Do not assume face/voice identity
matching without usable references. Do not auto-switch provider, add a narrator,
generate product images/music, or pay for retranscribing the entire original.
Retries which change paid behavior require an updated estimate and approval.

## Retain body and captions

The generic renderer uses a hard cut with no transition across retained body
frames. Browser-compatible High-profile libx264 CRF 12 retains original frame order/content
with every decoded frame checked at PSNR ≥45dB. Compressed bytes and some pixels
differ within this measured encode tolerance. Audio is re-encoded at AAC 256k with measured
sample-position error/correlation limits. No body gain, grading, crop, speed change
or new bed is applied. The exact original end card stays inside the retained body.

Separate SRT/JSON cues wholly before the cut are removed. Cues wholly after it shift
by `replacement_duration_sec - hook_end_sec`. Cues crossing the cut need original
measured words; only retained complete words remain. JSON per-cue styling fields
are preserved. ASS/VTT require a deliberate format adapter; do not strip styles by
pretending they are SRT. This operation does not burn a second caption layer.

## Review and failure

Read the manifest preservation results, then watch the actual complete output and
listen to the join. Decoded checks do not assess whether a new hook is persuasive,
brand-safe, readable or semantically connected. The review report must identify
the finished output hash and its frozen source. A failed/unreviewed result remains
a candidate and does not replace the chosen final or source file.

The renderer seeds `review.status: needs_review`, both SHA256 identities and
`checked_at: null`. Only after actual full-output viewing/audio/caption review,
set `review.status:'passed'`, keep `source_sha256` and `output_sha256` bound to
that manifest and record `checked_at` as an ISO datetime. Preserve the helper's
verification results and attach the actual passing quality report. A prior
generic report without these exact identities does not approve a new output.

For a pack, repeat against the **same frozen source** for every named opening.
Return one complete ad plus manifest per candidate. Project-version/batch saving
is a host decision handled by its integration adapter, never hidden in this script.
