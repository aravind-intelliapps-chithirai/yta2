import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { ThemeColors } from "../../constants/Palette";

export const BonusPane = ({ text, startTime, exitTime, palette }: { text: string, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  if (frame < startTime || frame > exitTime) return null;
  
  const width = interpolate(frame - startTime, [0, 20], [0, 100], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ 
          position: 'absolute',
          top: `${SPATIAL_MAP.BONUS_Y * 100}%`, 
          right: '5%',
          width: `${width}%`, 
          maxWidth: '40%', 
          height: '10%',
          backgroundColor: palette.C4_HIGHLIGHT,
          overflow: 'hidden', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          opacity,
          // FIX: Center vertically on the anchor
          transform: 'translateY(-50%)'
      }}>
         <span style={{ color: 'black', fontWeight: 'bold' }}>{text}</span>
      </div>
    </AbsoluteFill>
  );
};