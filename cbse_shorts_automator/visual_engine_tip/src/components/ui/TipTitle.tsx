import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { ThemeColors } from "../../constants/Palette";

export const TipTitle = ({ text, startTime, exitTime, palette }: { text: string, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const delayFrame = startTime + (RELATIVE_TIMINGS.TITLE_DELAY * fps);
  const scale = spring({ frame: frame - delayFrame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  
  if (frame < startTime || frame > exitTime) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
       <div style={{
           position: 'absolute',
           top: `${SPATIAL_MAP.TIP_TITLE * 100}%`,
           width: '100%',
           display: 'flex',
           justifyContent: 'center',
           opacity,
           // FIX: Center vertically on the anchor line
           transform: 'translateY(-50%)'
       }}>
         <h2 style={{ 
             transform: `scale(${scale})`, 
             color: 'white', 
             fontSize: height * 0.035,
             borderBottom: `${height * 0.003}px solid ${palette.C3_PRIMARY}`,
             margin: 0
         }}>
           {text}
         </h2>
       </div>
    </AbsoluteFill>
  );
};