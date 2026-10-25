import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, useCurrentFrame } from "remotion";
import { Scene01 } from "./scenes/Scene01";
import { Scene02 } from "./scenes/Scene02";
import { Scene03 } from "./scenes/Scene03";
import { Scene04 } from "./scenes/Scene04";
import { OfferAdProps, beatLayout } from "./props";
import "./fonts"; // ensure fonts are loaded

// The 4-beat spine. Scene boundaries are derived from props.beat_split_sec so
// the hard cuts land on the beat downbeats (the slams hit with the kick). The
// music bed volume ramps to 0 over the last props.music.fade_out_frames.
export const Main: React.FC<OfferAdProps> = (p) => {
  const { starts, durs, total } = beatLayout(p.beat_split_sec);
  const scenes = [Scene01, Scene02, Scene03, Scene04];

  return (
    <AbsoluteFill style={{ background: p.palette.ink }}>
      {scenes.map((Comp, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={durs[i]}>
          <Comp p={p} />
        </Sequence>
      ))}
      {p.music.src && <AudioBed src={p.music.src} total={total} fade={p.music.fade_out_frames} />}
    </AbsoluteFill>
  );
};

const AudioBed: React.FC<{ src: string; total: number; fade: number }> = ({ src, total, fade }) => {
  const frame = useCurrentFrame();
  const vol = interpolate(frame, [total - fade, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <Audio src={staticFile(src)} volume={vol} endAt={total} />;
};
