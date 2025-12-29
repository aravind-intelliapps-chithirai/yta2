import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { useFontFit } from "../../logic/useFontFit";

export const TipDetails = ({ text, startTime, exitTime }: { text: string, startTime: number, exitTime: number }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  
  const delayFrame = startTime + (RELATIVE_TIMINGS.DETAILS_DELAY * fps);
  const enterOpacity = interpolate(frame - delayFrame, [0, 20], [0, 1], { extrapolateLeft: 'clamp' });
  const blur = interpolate(frame - delayFrame, [0, 20], [0, 15], { extrapolateLeft: 'clamp' });
  const exitOpacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });
  const fontSize = useFontFit(text, width * 0.8, height * 0.3, 40);


  if (frame < startTime || frame > exitTime) return null;

  return (
    <AbsoluteFill style={{ 
        top: `${SPATIAL_MAP.TIP_DETAILS_START * 100}%`,
        height: `${(SPATIAL_MAP.TIP_DETAILS_END - SPATIAL_MAP.TIP_DETAILS_START) * 100}%`,
        opacity: Math.min(enterOpacity, exitOpacity),
        backdropFilter: `blur(${blur}px)`,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '2rem', alignItems: 'center', justifyContent: 'center'
    }}>
       <p style={{ color: 'white', fontSize, textAlign: 'center' }}>{text}</p>
    </AbsoluteFill>
  );
};
