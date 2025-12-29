import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { RELATIVE_TIMINGS } from "../constants/Timings";

export const useCentripetalExit = (outroStartTime: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const triggerFrame = outroStartTime - (RELATIVE_TIMINGS.CENTRIPETAL_PRE * fps);

  const scale = interpolate(
    frame,
    [triggerFrame, outroStartTime],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.exp }
  );

  return { scale };
};
