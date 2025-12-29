import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { SceneTiming } from "../../schema";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { ThemeColors } from "../../constants/Palette";

export const MonumentalHook = ({ text, timing, palette }: { text: string, timing: SceneTiming, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  if (frame < timing.start_time || frame > timing.start_time + timing.duration) return null;

  const yOffset = interpolate(
    frame - timing.start_time, 
    [timing.duration * RELATIVE_TIMINGS.HOOK_EXIT, timing.duration], 
    [0, -height], 
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill>
      <div style={{
          position: 'absolute',
          top: `${SPATIAL_MAP.HOOK_STACK * 100}%`,
          left: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // CRITICAL FIX: Center the element on the anchor point, then apply animation
          transform: `translateY(calc(-50% + ${yOffset}px))`
      }}>
        {text.split(' ').map((word, i) => (
            <h1 key={i} style={{ 
                fontSize: height * 0.08, 
                color: palette.C3_PRIMARY, 
                margin: 0,
                // Jitter
                transform: `translate(
                    ${Math.sin(frame * 0.8 + i) * (height * 0.005)}px, 
                    ${Math.cos(frame * 0.8 + i) * (height * 0.005)}px
                )`
            }}>
              {word}
            </h1>
        ))}
      </div>
    </AbsoluteFill>
  );
};