import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { ThemeColors } from "../../constants/Palette";
import { useFontFit } from "../../logic/useFontFit";

const fontFace = `
  @font-face {
    font-family: 'InterBold';
    src: url('${staticFile("assets/fonts/Inter-Bold.ttf")}') format('truetype');
    font-weight: bold;
    font-style: normal;
  }
`;

export const BonusPane = ({ text, startTime, exitTime, palette }: { text: string, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  
  // 1. ANIMATION
  const progress = interpolate(frame - startTime, [0, 30], [0, 100], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });
  
  // 2. GEOMETRY
  const PADDING_PX = 16;
  const maxPanelW = width * 0.45; 
  const panelH = height * 0.20; 
  
  // 3. FONT SIZING (Dynamic & Multi-line capable)
  const fontSize = useFontFit(text, maxPanelW - (PADDING_PX * 2), panelH - (PADDING_PX * 2), 70);


  if (frame < startTime || frame > exitTime) return null;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <style>{fontFace}</style>
      
      <div style={{ 
          position: 'absolute',
          top: `${SPATIAL_MAP.BONUS_Y * 100}%`, 
          right: '5%',
          
          width: `${progress}%`, 
          maxWidth: '45%', 
          height: `${panelH}px`,
          backgroundColor: palette.C4_HIGHLIGHT, 
          
          overflow: 'hidden', 
          display: 'flex',
          alignItems: 'center', 
          justifyContent: 'center',
          opacity,
          transform: 'translateY(-50%)',
          
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          borderRadius: '38px', 
          padding: `0 ${PADDING_PX}px`
      }}>
         {/* Render text only when panel is wide enough */}
         {progress > 15 && (
           <span style={{ 
               color: 'black', 
               fontFamily: 'InterBold', 
               fontWeight: 'bold',
               fontSize: `${fontSize}px`,
               
               // WRAP LOGIC ENABLED
               whiteSpace: 'normal',       // Allow wrapping
               textAlign: 'center',        // Center multi-line text
               lineHeight: 1.1,
               width: '100%',              // Fill container width
               wordBreak: 'normal',
               overflowWrap: 'break-word'  // Break long words if necessary
           }}>
             {text}
           </span>
         )}
      </div>
    </AbsoluteFill>
  );
};