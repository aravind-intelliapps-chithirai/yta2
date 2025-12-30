import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { useMemo } from "react";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { ThemeColors } from "../../constants/Palette";

// Helper to measure text width
const measureTextWidth = (text: string, font: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
};

export const TipTitle = ({ text, startTime, exitTime, palette }: { text: string, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { fps, height,width } = useVideoConfig();

    // --- DYNAMIC FONT SIZE LOGIC ---
    const fontSize = useMemo(() => {
    const targetWidth = width * 0.85; // 80% of screen width
    const maxFontSize = height * 0.06; // Cap at 6% height (prevent huge text for short words)
    const minFontSize = height * 0.02; // Minimum readable size

    // Measure at a reference size (e.g., 100px) to determine aspect ratio
    const refSize = 100;
    const measuredW = measureTextWidth(text, `bold ${refSize}px Inter`);
    
    if (measuredW === 0) return height * 0.035; // Fallback

    // Calculate scale factor needed to reach target width
    const scaleFactor = targetWidth / measuredW;
    const calculatedSize = refSize * scaleFactor;

    // Clamp the result
    return Math.min(Math.max(calculatedSize, minFontSize), maxFontSize);
  }, [text, width, height]);
  // -------------------------------

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
             fontSize: fontSize,
             borderBottom: `${height * 0.003}px solid ${palette.C3_PRIMARY}`,
             margin: 0
         }}>
           {text}
         </h2>
       </div>
    </AbsoluteFill>
  );
};