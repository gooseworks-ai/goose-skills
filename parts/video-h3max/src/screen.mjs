// Did H3 draw a phone screen over the take? Some takes come back as a picture of a phone's recording screen:
// a near-black band on all four edges with rounded corners, sometimes with recording icons (2026-10-15,
// Brightland: 3 of 8 takes, in 15 s takes from the first cut on and once in a single 5 s shot). The picture
// inside is fine, so the fix is to crop to the largest box of the take's own aspect that clears the band and
// the rounded corners, and scale it back. Pure functions on grey pixel arrays (mirGrey images).

const SCR_DARK = 24; // luma at or under this is the band
const SCR_EDGE_SHARE = 0.97; // share of an edge line that must be dark
const SCR_MIN_BAND = 4; // pixels of the measured image (540 wide: about 8 at 1080)
const SCR_FRAME_SHARE = 0.34; // share of frames that must show the band on all four sides (a 15 s take shows it from its first cut on)

/** How many lines from one edge are band: lines whose middle 60% is almost all dark. */
function scrBand(img, side) {
  const { w, h, px } = img;
  const along = side === 'top' || side === 'bottom' ? w : h;
  const depth = side === 'top' || side === 'bottom' ? h : w;
  const from = Math.floor(along * 0.2);
  const to = Math.ceil(along * 0.8);
  let n = 0;
  for (; n < depth / 4; n++) {
    let dark = 0;
    for (let a = from; a < to; a++) {
      const x = side === 'left' ? n : side === 'right' ? w - 1 - n : a;
      const y = side === 'top' ? n : side === 'bottom' ? h - 1 - n : a;
      if (px[y * w + x] <= SCR_DARK) dark++;
    }
    if (dark < SCR_EDGE_SHARE * (to - from)) break;
  }
  return n;
}

/** Dark run along the diagonal from one corner, in pixels along the diagonal. */
function scrCornerRun(img, cx, cy) {
  const { w, h, px } = img;
  const max = Math.min(w, h) / 3;
  let k = 0;
  for (; k < max; k++) {
    const x = cx ? w - 1 - k : k;
    const y = cy ? h - 1 - k : k;
    if (px[y * w + x] > SCR_DARK) break;
  }
  return k * Math.SQRT2;
}

function scrMedian(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
}

/**
 * Measures the band on each frame. Returns { drawn, bands: {top,right,bottom,left}, radius, share } in the
 * measured images' pixels. drawn is true when at least SCR_FRAME_SHARE of the frames have a band of at least
 * SCR_MIN_BAND on all four sides.
 */
export function scrMeasure(frames) {
  const per = frames.map((f) => {
    const b = { top: scrBand(f, 'top'), right: scrBand(f, 'right'), bottom: scrBand(f, 'bottom'), left: scrBand(f, 'left') };
    const on = Object.values(b).every((v) => v >= SCR_MIN_BAND);
    let radius = 0;
    if (on) {
      // A rounded corner of radius R inside a band b has a dark diagonal of b*sqrt2 + R*(sqrt2 - 1).
      const runs = [
        [scrCornerRun(f, 0, 0), Math.min(b.top, b.left)],
        [scrCornerRun(f, 1, 0), Math.min(b.top, b.right)],
        [scrCornerRun(f, 0, 1), Math.min(b.bottom, b.left)],
        [scrCornerRun(f, 1, 1), Math.min(b.bottom, b.right)],
      ].map(([d, band]) => Math.max(0, (d - band * Math.SQRT2) / (Math.SQRT2 - 1)));
      radius = scrMedian(runs);
    }
    return { b, on, radius };
  });
  const hits = per.filter((p) => p.on);
  const share = frames.length ? hits.length / frames.length : 0;
  const drawn = share >= SCR_FRAME_SHARE;
  const bands = {};
  for (const side of ['top', 'right', 'bottom', 'left']) bands[side] = drawn ? scrMedian(hits.map((p) => p.b[side])) : 0;
  return { drawn, bands, radius: drawn ? scrMedian(hits.map((p) => p.radius)) : 0, share };
}

/**
 * The crop that clears the band and the rounded corners, at the take's own aspect, centred in what is clear,
 * in the take's pixels (even numbers). `scale` = take width / measured width.
 */
export function scrCrop(m, takeW, takeH, scale) {
  const pad = 2;
  // A corner of radius R reaches R*(1 - 1/sqrt2) in from the band along the diagonal; clear it on every side.
  const corner = m.radius * (1 - Math.SQRT1_2);
  const inset = (side) => Math.ceil((m.bands[side] + corner + pad) * scale);
  const l = inset('left');
  const r = inset('right');
  const t = inset('top');
  const b = inset('bottom');
  const freeW = takeW - l - r;
  const freeH = takeH - t - b;
  const aspect = takeW / takeH;
  let w = freeW;
  let h = Math.floor(w / aspect);
  if (h > freeH) {
    h = freeH;
    w = Math.floor(h * aspect);
  }
  w -= w % 2;
  h -= h % 2;
  const x = l + Math.floor((freeW - w) / 4) * 2;
  const y = t + Math.floor((freeH - h) / 4) * 2;
  return { x, y, w, h };
}
