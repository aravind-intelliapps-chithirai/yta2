import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { CtaContent } from "../../schema";
import { ThemeColors } from "../../constants/Palette";

export const CTA_Scene = ({ content, startTime, exitTime, palette }: { content: CtaContent, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();

  if (frame < startTime || frame > exitTime) return null;

  const relFrame = frame - startTime;
  const socialStart = 0.75 * fps;
  const linkStart = 1.25 * fps;

  const socialScale = interpolate(relFrame - socialStart, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.elastic(1) });
  const linkY = interpolate(relFrame - linkStart, [0, 15], [height * 1.5, height * SPATIAL_MAP.CTA_LNK_Y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bounce = Math.sin((frame / fps) * Math.PI * 6) * (height * 0.01); // Bounce ~1% of height
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  const pillPadding = `${height * 0.01}px ${width * 0.04}px`;
  // --- MANUAL SHEEN CALCULATION (Frame-Perfect) ---
  // Spec: "sweeps across both pills every 2.0s" [cite: 151]
  const loopDurationInFrames = fps * 4; 
  
  // Progress 0 -> 1 loops every 2 seconds
  const sheenProgress = (frame % loopDurationInFrames) / loopDurationInFrames;
  
  // Map progress to background position (200% -> -200% mimics the original keyframes)
  const sheenPosValue = interpolate(sheenProgress, [0, 1], [200, -200]);

  const sheenStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.6) 50%, transparent 70%)',
    backgroundSize: '200% 100%',
    pointerEvents: 'none',
    borderRadius: 'inherit',
    // FIX: Drive position with frame data, not CSS time
    backgroundPosition: `${sheenPosValue}% 0`, 
  };

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* 2. INJECT KEYFRAMES */}
      <style>
        {`
          @keyframes sheen {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
      {/* Social Pill */}
      <div style={{
          position: 'absolute', top: `${SPATIAL_MAP.CTA_SOC_Y * 100}%`, left: '50%',
          transform: `translate(-50%, -50%) scale(${socialScale})`,
          backgroundColor: palette.C6_SOCIAL, 
          color: 'white', 
          borderRadius: height * 0.05, 
          fontWeight: 'bold', 
          fontSize: height * 0.035, 
          boxShadow: `0 0 ${height * 0.02}px ${palette.C6_SOCIAL}`,
          overflow: 'hidden', 
          display: 'flex',    
          alignItems: 'center',
          padding: pillPadding,

          // --- ADJUSTMENTS HERE ---
          // 1. WIDTH: Set a fixed % of screen (e.g., 0.5 = 50% width)
          //    Use 'minWidth' if you want it to grow with text but have a minimum size.
          width: width * 0.75, 

          // 2. ALIGNMENT: 'center', 'flex-start' (Left), 'flex-end' (Right)
          justifyContent: 'center', 
      }}>
       {/* INSERT SHEEN ELEMENT HERE */}
        <div style={sheenStyle} />
        
        {/* Text Content (Relative z-index ensures it stays sharp if needed, usually fine as is) */}
        <span style={{position: 'relative', zIndex: 1,textAlign: 'center', 
            width: '100%'}}>{content.social_text}</span>
      </div>
      

      {/* Link Pill */}
 <div style={{
          position: 'absolute', top: linkY, left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: palette.C7_LINK, 
          color: 'black', 
          borderRadius: height * 0.05, 
          fontWeight: 'bold', 
          fontSize: height * 0.03, 
          display: 'flex', alignItems: 'center', gap: width * 0.01,
          overflow: 'hidden',
          padding: pillPadding,

          // --- ADJUSTMENTS HERE ---
          // 1. WIDTH: Wider for the link (e.g., 0.8 = 80% width)
          width: width * 0.80, 

          // 2. ALIGNMENT: usually 'center' for links
          justifyContent: 'center', 
      }}>
      {/* INSERT SHEEN ELEMENT HERE */}
        <div style={sheenStyle} />
        
        <span style={{position: 'relative', zIndex: 1,textAlign: 'center', 
            width: '100%'}}>{content.link_text}</span>
      </div>

      <div style={{
          position: 'absolute', top: `${0.80 * 100}%`, left: '50%', 
          fontSize: height * 0.05,
          transform: `translateY(${-bounce}px)`
      }}>
        👇🏻
      </div>
    </AbsoluteFill>
  );
};