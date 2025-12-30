import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate,staticFile } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { useFontFit } from "../../logic/useFontFit";

// Define the font face relative to the public/assets folder
const fontFace = `
  @font-face {
    font-family: 'InterRegular';
    src: url('${staticFile("assets/fonts/Inter-Regular.ttf")}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;

export const TipDetails = ({ text, startTime, exitTime }: { text: string, startTime: number, exitTime: number }) => {
const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  
  // 1. CALCULATE PANEL GEOMETRY
  const PADDING_PX = 40; 
  const panelW = width * 0.90; // 90% Width
  const panelH = height * (SPATIAL_MAP.TIP_DETAILS_END - SPATIAL_MAP.TIP_DETAILS_START);
  
  // 2. CALCULATE FONT SIZE (Math Only)
  // We reduce the container dimensions by padding to get the "Safe Zone"
  const fontSize = useFontFit(text, panelW - (PADDING_PX * 2), panelH - (PADDING_PX * 2), 250);

  const delayFrame = startTime + (RELATIVE_TIMINGS.DETAILS_DELAY * fps);
  const enterOpacity = interpolate(frame - delayFrame, [0, 20], [0, 1], { extrapolateLeft: 'clamp' });
  const blur = interpolate(frame - delayFrame, [0, 20], [0, 15], { extrapolateLeft: 'clamp' });
  const exitOpacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

 if (frame < startTime || frame > exitTime) return null;

  return (
    <AbsoluteFill style={{ 
        top: `${SPATIAL_MAP.TIP_DETAILS_START * 100}%`,
        height: `${panelH}px`,
        
        // CENTERED 90% PANEL
        width: '90%', 
        left: '5%', 
        
        opacity: Math.min(enterOpacity, exitOpacity),
        backdropFilter: `blur(${blur}px)`,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: `${PADDING_PX}px`,
        
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'center',
        boxSizing: 'border-box',
        borderRadius: '24px',
        border: '1.5px solid rgba(255,255,255,0.15)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
    }}>
       <p style={{ 
           color: 'white', 
           fontSize: `${fontSize}px`, 
           lineHeight: '1.2',
           textAlign: 'center',
           margin: 0,
// Use the exact name defined in @font-face
           fontFamily: 'InterRegular', 
           fontWeight: 'normal',
                    // CRITICAL FOR WRAPPING
           width: '100%',             // Force p to take full width
           overflowWrap: 'break-word', // Allow breaking long words
           wordBreak: 'normal',       // Keep normal word breaks
           hyphens: 'auto'            // Optional: nice for very large tex
        }}>
           {text}
       </p>
    </AbsoluteFill>
  );
};
