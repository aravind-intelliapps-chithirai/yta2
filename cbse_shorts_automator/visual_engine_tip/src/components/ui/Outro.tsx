import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { OutroContent } from "../../schema";
import { ThemeColors, getOutroColor } from "../../constants/Palette";

export const Outro = ({ content, startTime, palette }: { content: OutroContent, startTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  if (frame < startTime) return null;
  const relFrame = frame - startTime;
  const opacity = interpolate(relFrame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'white', opacity, justifyContent: 'center', alignItems: 'center' }}>
      <img src="/assets/logo.png" style={{ width: '20%', transform: `translateY(${Math.sin(frame/10) * (height * 0.02)}px)` }} />
      
      <div style={{ 
          color: getOutroColor(palette.C3_PRIMARY, 25), 
          fontSize: height * 0.04, 
          fontFamily: 'Inter-Bold', 
          marginTop: height * 0.02 
      }}>
        {content.usp_line_1}
      </div>
      
      <div style={{ 
          color: getOutroColor(palette.C8_OUTRO_ACC, 35), 
          fontSize: height * 0.04, 
          fontFamily: 'Inter-Bold' 
      }}>
        {content.usp_line_2}
      </div>

      <div style={{ position: 'absolute', bottom: height * 0.10, color: '#666666', fontSize: height * 0.015 }}>
         © 2025 NCERT QuickPrep
      </div>
    </AbsoluteFill>
  );
};