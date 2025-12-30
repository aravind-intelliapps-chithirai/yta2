import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from "remotion";
import { OutroContent } from "../../schema";
import { ThemeColors, getOutroColor } from "../../constants/Palette";

// 1. DEFINE BOTH FONT FACES
const fontFace = `
  @font-face {
    font-family: 'InterBold';
    src: url('${staticFile("assets/fonts/Inter-Bold.ttf")}') format('truetype');
    font-weight: bold;
    font-style: normal;
  }
  @font-face {
    font-family: 'InterRegular';
    src: url('${staticFile("assets/fonts/Inter-Regular.ttf")}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const Outro = ({ 
  content, 
  copyrightText, 
  logoSrc, 
  startTime, 
  palette 
}: { 
  content: OutroContent, 
  copyrightText: string, 
  logoSrc: string, 
  startTime: number, 
  palette: ThemeColors 
}) => {
  const frame = useCurrentFrame();
  const { height, width, fps } = useVideoConfig();

  if (frame < startTime) return null;

  const relFrame = frame - startTime;
  const opacity = interpolate(relFrame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const floatY = Math.sin((frame / fps) * 2) * (height * 0.015);

  const slideLeft = spring({ frame: relFrame - 10, fps, config: { damping: 15 } }); 
  const slideRight = spring({ frame: relFrame - 20, fps, config: { damping: 15 } }); 
  
  const usp1_X = interpolate(slideLeft, [0, 1], [-width, 0]);
  const usp2_X = interpolate(slideRight, [0, 1], [width, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: 'white', opacity }}>
      {/* Inject Fonts */}
      <style>{fontFace}</style>

      {/* --- LOGO --- */}
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: `translateX(-50%) translateY(${floatY}px)`,
        width: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}>
         <img 
            src={staticFile(logoSrc.startsWith('/') ? logoSrc.slice(1) : logoSrc)} 
            style={{ width: '20%' }} 
         />
      </div>

      {/* --- USP LINES --- */}
      <div style={{
          position: 'absolute',
          top: '55%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: height * 0.02,
      }}>
        {/* USP 1: Bold (Unchanged) */}
        <div style={{ 
            color: getOutroColor(palette.C3_PRIMARY, 25), 
            fontSize: height * 0.04,
            transform: `translateX(${usp1_X}px)`,
            width: width * 0.9,
            textAlign: 'center',
            fontFamily: 'InterBold' 
        }}>
          {content.usp_line_1}
        </div>
        
        {/* USP 2: Regular (Changed) */}
        <div style={{ 
            color: getOutroColor(palette.C8_OUTRO_ACC, 35), 
            fontSize: height * 0.04,
            transform: `translateX(${usp2_X}px)`,
            width: width * 0.8,  
            textAlign: 'center', 
            // FIX: Using Regular font here
            fontFamily: 'InterRegular', 
            fontWeight: 'normal'
        }}>
          {content.usp_line_2}
        </div>
      </div>

      {/* --- COPYRIGHT --- */}
      <div style={{ 
          position: 'absolute', 
          top: '90%', 
          width: '100%',
          textAlign: 'center',
          color: '#666666', 
          fontSize: height * 0.015,
          fontFamily: 'InterBold' 
      }}>
         {copyrightText}
      </div>
    </AbsoluteFill>
  );
};