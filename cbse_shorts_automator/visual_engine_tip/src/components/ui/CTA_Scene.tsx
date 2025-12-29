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
  const linkY = interpolate(relFrame - linkStart, [0, 15], [height * 1.0, height * SPATIAL_MAP.CTA_LNK_Y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bounce = Math.sin((frame / fps) * Math.PI * 6) * (height * 0.01); // Bounce ~1% of height
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  const pillPadding = `${height * 0.01}px ${width * 0.04}px`;

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Social Pill */}
      <div style={{
          position: 'absolute', top: `${SPATIAL_MAP.CTA_SOC_Y * 100}%`, left: '50%',
          transform: `translate(-50%, -50%) scale(${socialScale})`,
          backgroundColor: palette.C6_SOCIAL, 
          color: 'white', 
          padding: pillPadding,
          borderRadius: height * 0.05,
          fontWeight: 'bold', 
          fontSize: height * 0.025, 
          boxShadow: `0 0 ${height * 0.02}px ${palette.C6_SOCIAL}`
      }}>
        {content.social_text}
      </div>

      {/* Link Pill */}
      <div style={{
          position: 'absolute', top: linkY, left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: palette.C7_LINK, 
          color: 'black', 
          padding: pillPadding,
          borderRadius: height * 0.05,
          fontWeight: 'bold', 
          fontSize: height * 0.03, 
          display: 'flex', alignItems: 'center', gap: width * 0.01
      }}>
        {content.link_text}
      </div>

      <div style={{
          position: 'absolute', top: `${0.86 * 100}%`, left: '70%', 
          fontSize: height * 0.05,
          transform: `translateY(${-bounce}px)`
      }}>
        👆
      </div>
    </AbsoluteFill>
  );
};