import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { OfferAdProps, DEFAULT_PROPS, beatLayout, FPS } from "./props";

// The composition. Duration is derived from the beat_split_sec passed via
// input props (`--props config.json`), so a different beat split re-times the
// whole ad with no code change. 9:16 master @ 1080x1920, 30fps. The 1:1 crop is
// produced downstream by the driver (render.sh) with ffmpeg, not a 2nd comp.
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="offer-ad"
      component={Main as React.FC<Record<string, unknown>>}
      durationInFrames={beatLayout(DEFAULT_PROPS.beat_split_sec).total}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={DEFAULT_PROPS as unknown as Record<string, unknown>}
      calculateMetadata={({ props }) => {
        const p = props as unknown as OfferAdProps;
        return { durationInFrames: beatLayout(p.beat_split_sec).total };
      }}
    />
  );
};
