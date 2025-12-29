import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneTiming } from "../../schema";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { ThemeColors } from "../../constants/Palette";

// A deterministic noise function to ensure it looks random 
// but renders identically on every pass (prevents hydration mismatch).
const chaoticNoise = (seed: number) => {
    return Math.sin(seed * 9999.9) * Math.cos(seed * 432.1);
};

export const MonumentalHook = ({ text, timing, palette }: { text: string, timing: SceneTiming, palette: ThemeColors }) => {
  // 1. HOOKS FIRST (Unconditional)
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  // 2. DATA PROCESSING
  const words = text.split('\n'); // Split by Newline
  
  // Calculate Layout Constants
  // 5% Padding on each side = 90% usable width
  const usableWidth = width * 0.90; 

  // Animation: Exit Slide Up
  const yOffset = interpolate(
    frame - timing.start_time, 
    [timing.duration * RELATIVE_TIMINGS.HOOK_EXIT, timing.duration], 
    [0, -height], 
    { extrapolateLeft: "clamp" }
  );

  // 3. EARLY RETURN (Safe now)
  if (frame < timing.start_time || frame > timing.start_time + timing.duration) return null;

  return (
    <AbsoluteFill>
      <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          
          // Layout: Spread vertically with 10% padding
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${height * 0.25}px 0`, // 10% Vertical Padding
          boxSizing: 'border-box',
          
          // Animation
          transform: `translateY(${yOffset}px)`
      }}>
        {words.map((word, i) => {
            // FONT SIZE MAXIMIZATION LOGIC
            // Heuristic: Average Bold Character width is approx 0.6em
            // Formula: FontSize = AvailableWidth / (CharCount * 0.6)
            const charCount = Math.max(word.length, 2); // Prevent div/0 or huge single chars
            const estimatedSize = usableWidth / (charCount * 0.7);
            
            // Cap the size so short words don't become taller than the screen
            // Max height per word = (80% of screen height) / word count
            const maxVerticalSize = (height * 0.8) / words.length;
            const finalSize = Math.min(estimatedSize, maxVerticalSize);

            // CHAOS LOGIC
            // Use 'frame + i * 100' to decouple the words completely.
            // Frequency is high (no multipliers < 1).
            const seed = frame + (i * 135); 
            
            // X-Shake: Rapid, small horizontal twitching
            const shakeX = chaoticNoise(seed) * (height * 0.003);
            
            // Y-Shake: Slightly smaller vertical twitch
            const shakeY = chaoticNoise(seed + 100) * (height * 0.002);
            
            // Rotation: The "Nervous" Factor. 
            // Twitching between -2deg and +2deg
            const rot = chaoticNoise(seed + 200) * 0.5;

            return (
                <h1 key={i} style={{ 
                    fontSize: finalSize, 
                    lineHeight: 1, // Tight line height for packing
                    color: palette.C3_PRIMARY, 
                    margin: 0,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    width: '90%', // Ensure it respects the horizontal padding
                    
                    // Jitter Effect
                    transform:  `translate(${shakeX}px, ${shakeY}px) rotate(${rot}deg)`
                }}>
                  {word}
                </h1>
            );
        })}
      </div>
    </AbsoluteFill>
  );
};