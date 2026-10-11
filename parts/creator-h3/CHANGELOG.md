# creator-h3

## 1.1.0

- `cast`: the creator from the plan cast (the speaker's member, else the first with a picture), with the identity written from age, gender and look. `character` is optional when `cast` is given.
- `delivery` (wins over the member's or character's own), and `pronunciations` swapped into the spoken dialogue only.
- `split_before: cutaways`: a take starts only at a cutaway (`extra.shot` not `creator`, a `footage` entry's `scene_id`, or a scene `image`); an on-camera run longer than one take is refused before ordering.
- `takes[].joins_s` on every take after the first. Scene lines may be null.

## 1.0.2

- The take prompt follows create-creator-takes-h3 2.1.0: a natural front-camera look with the recording device and its support outside the frame, instead of a phone propped on a stand.

## 1.0.1

- Shared library fixes: piece names stay unique when an id and a fallback collide, and the loudness meter no longer logs every frame.

## 1.0.0

- First version, from create-creator-takes-h3: takes, voice chain and join through the private line.
