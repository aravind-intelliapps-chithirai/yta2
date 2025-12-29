#!/bin/bash

# ==============================================================================
# NCERT QuickPrep: Visual Engine (v14.1) - FINAL MASTER
# Features: Continuous Shot, Dynamic Theme Seeds, Strict Protocol Compliance
# ==============================================================================

ROOT_DIR="visual_engine_tip"
echo "Initializing Engine Root: $ROOT_DIR..."

mkdir -p "$ROOT_DIR"
cd "$ROOT_DIR" || exit

# 1. Directory Structure [cite: 7-42]
mkdir -p public/assets/fonts
mkdir -p src/constants
mkdir -p src/components/stage
mkdir -p src/components/ui
mkdir -p src/components/overlay
mkdir -p src/logic

# 2. Placeholder Assets [cite: 9-16]
touch public/assets/audio_track.mp3
touch public/assets/source_vid.mp4
touch public/assets/thumbnail.jpg
touch public/assets/logo.png
touch public/assets/fonts/Inter-Bold.ttf
touch public/assets/fonts/Inter-Regular.ttf

# ==============================================================================
# 3. Configuration & Schema
# ==============================================================================

echo "Generating Config & Schema..."

cat << 'EOF' > package.json
{
  "name": "ncert-quickprep-visual-engine",
  "version": "14.1.0",
  "private": true,
  "dependencies": {
    "remotion": "4.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "three": "^0.160.0",
    "@types/three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.96.0",
    "zod": "^3.22.0",
    "simplex-noise": "^4.0.0",
    "tinycolor2": "^1.6.0"
  },
  "devDependencies": {
     "@types/tinycolor2": "^1.4.0"
  }
}
EOF

cat << 'EOF' > tsconfig.json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
EOF

# src/schema.ts [cite: 46-97]
cat << 'EOF' > src/schema.ts
import { z } from "zod";

export interface Resolution { w: number; h: number; }
export interface Config { resolution: Resolution; fps: number; }
export interface Meta { theme_seed: number; config: Config; }

export interface Assets {
  video_src: string;
  thumb_src: string;
  logo_src: string;
  audio_track: string;
}

export interface SceneTiming { start_time: number; duration: number; }
export interface Timings {
  hook: SceneTiming;
  tip_title: SceneTiming;
  tip_details: SceneTiming;
  bonus: SceneTiming;
  cta_social: SceneTiming;
  cta_link: SceneTiming;
  outro: SceneTiming;
  total_duration: number;
}

export interface CtaContent { social_text: string; link_text: string; }
export interface OutroContent { usp_line_1: string; usp_line_2: string; }

export interface Content {
  hook_text: string;
  tip_title: string;
  tip_details: string;
  bonus_visual: string;
  cta_content: CtaContent;
  outro_content: OutroContent;
  usp_badge_text: string;
  watermark_text: string;
  copyright_text: string;
}

export interface VisualOverrides {
  padding_x_fraction: number;
  safe_zone_b_fraction: number;
  bonus_pos_fraction: { x: number; y: number; };
}

export interface ExamScenario {
  meta: Meta;
  assets: Assets;
  timings: Timings;
  content: Content;
  overrides?: VisualOverrides;
}

export const examScenarioSchema = z.object({
  meta: z.object({
    theme_seed: z.number(),
    config: z.object({
      resolution: z.object({ w: z.number(), h: z.number() }),
      fps: z.number(),
    }),
  }),
  assets: z.object({
    video_src: z.string(),
    thumb_src: z.string(),
    logo_src: z.string(),
    audio_track: z.string(),
  }),
  timings: z.any(),
  content: z.any(),
  overrides: z.optional(z.any()),
});
EOF

# src/constants/Config.ts [cite: 126]
cat << 'EOF' > src/constants/Config.ts
export const SPATIAL_MAP = {
  SLATE_TOP_PAD: 0.05,
  SLATE_W: 0.90,
  SLATE_H: 0.285,
  SLATE_BTM_Y: 0.335,
  SLATE_INST_Y: 0.19,
  HOOK_STACK: 0.50,
  TIP_TITLE: 0.40,
  TIP_DETAILS_START: 0.47,
  TIP_DETAILS_END: 0.75,
  BONUS_Y: 0.45,
  CTA_SOC_Y: 0.20,
  CTA_THUMB_Y: 0.50,
  CTA_LNK_Y: 0.80,
  SAFE_ZONE: 0.22,
  VISUALIZER_Y: 0.96,
};

export const toThreeY = (fraction: number, viewHeight: number) => (0.5 - fraction) * viewHeight;
export const toThreeX = (fraction: number, viewWidth: number) => (fraction - 0.5) * viewWidth;
EOF

# src/constants/Timings.ts [cite: 135-159]
cat << 'EOF' > src/constants/Timings.ts
export const RELATIVE_TIMINGS = {
  TITLE_DELAY: 0.3,
  DETAILS_DELAY: 0.6,
  SLATE_SLAM_HIT: 0.25,
  HOOK_EXIT: 0.95,
  SHAKE_DURATION: 0.4,
  CENTRIPETAL_PRE: 0.5,
};
EOF

# src/constants/Palette.ts [cite: 161-169] - THEME ENGINE
cat << 'EOF' > src/constants/Palette.ts
import tinycolor from "tinycolor2";

export interface ThemeColors {
  C1_VOID: string;
  C3_PRIMARY: string;
  C4_HIGHLIGHT: string;
  C6_SOCIAL: string;
  C7_LINK: string;
  C8_OUTRO_ACC: string;
}

const THEMES: ThemeColors[] = [
  // 0: Midnight
  { C1_VOID: "#050B1A", C3_PRIMARY: "#4D9FFF", C4_HIGHLIGHT: "#00F2FF", C6_SOCIAL: "#7000FF", C7_LINK: "#00D1FF", C8_OUTRO_ACC: "#1A3A6D" },
  // 1: Obsidian
  { C1_VOID: "#06120C", C3_PRIMARY: "#52FFB8", C4_HIGHLIGHT: "#00FF41", C6_SOCIAL: "#00A3FF", C7_LINK: "#00FF90", C8_OUTRO_ACC: "#144D2F" },
  // 2: Amethyst
  { C1_VOID: "#0F0514", C3_PRIMARY: "#D480FF", C4_HIGHLIGHT: "#FF00E5", C6_SOCIAL: "#9D00FF", C7_LINK: "#FF70DC", C8_OUTRO_ACC: "#4D1A45" },
  // 3: Charcoal
  { C1_VOID: "#120D0B", C3_PRIMARY: "#FF9F4D", C4_HIGHLIGHT: "#FFD600", C6_SOCIAL: "#FF005C", C7_LINK: "#FFA200", C8_OUTRO_ACC: "#5C2A14" },
  // 4: Crimson
  { C1_VOID: "#140505", C3_PRIMARY: "#FF4D4D", C4_HIGHLIGHT: "#FF0000", C6_SOCIAL: "#FF8A00", C7_LINK: "#FF0055", C8_OUTRO_ACC: "#5C1414" },
];

export const resolveTheme = (seed: number): ThemeColors => {
  return THEMES[seed % 5];
};

// Helper for Outro Logic: "Darkened to 25% Lightness"
export const setLightness = (hex: string, lightness: number) => {
  return tinycolor(hex).toHsl().l > lightness 
    ? tinycolor(hex).lighten(0).setAlpha(1).toHexString() // fallback mock, real logic below
    : tinycolor(hex).toHexString(); 
};
// Correct implementation using HSL override
export const getOutroColor = (hex: string, lPercent: number) => {
    const color = tinycolor(hex).toHsl();
    color.l = lPercent / 100;
    return tinycolor(color).toHexString();
};
EOF

# ==============================================================================
# 4. Logic Hooks
# ==============================================================================

echo "Generating Logic..."

# src/logic/useAudioProcessor.ts
cat << 'EOF' > src/logic/useAudioProcessor.ts
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const useAudioProcessor = (source: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(source);

  if (!audioData) return { subBass: 0, spectrum: new Array(128).fill(0) };

  const subBass = visualizeAudio({
    fps, frame, audioData,
    numberOfSamples: 16,
    smoothing: true,
  });

  const spectrum = visualizeAudio({
    fps, frame, audioData,
    numberOfSamples: 128, 
    smoothing: true,
  });

  return { subBass: subBass[0], spectrum };
};
EOF

# src/logic/useFontFit.ts [cite: 44]
cat << 'EOF' > src/logic/useFontFit.ts
import { useState, useEffect } from 'react';
export const useFontFit = (text: string, maxWidth: number, maxHeight: number, startSize: number) => {
  const [fontSize, setFontSize] = useState(startSize);
  useEffect(() => {
    const estimatedArea = text.length * (startSize * 0.6) * startSize;
    const targetArea = maxWidth * maxHeight;
    if (estimatedArea > targetArea) {
      setFontSize(Math.max(12, startSize * Math.sqrt(targetArea / estimatedArea)));
    } else {
      setFontSize(startSize);
    }
  }, [text, maxWidth, maxHeight, startSize]);
  return fontSize;
};
EOF

# src/logic/useCentripetalExit.ts [cite: 153]
cat << 'EOF' > src/logic/useCentripetalExit.ts
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { RELATIVE_TIMINGS } from "../constants/Timings";

export const useCentripetalExit = (outroStartTime: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const triggerFrame = outroStartTime - (RELATIVE_TIMINGS.CENTRIPETAL_PRE * fps);

  const scale = interpolate(
    frame,
    [triggerFrame, outroStartTime],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.exp }
  );

  return { scale };
};
EOF

# ==============================================================================
# 5. Stage Components (3D) - THEME AWARE
# ==============================================================================

echo "Generating 3D Stage..."

# src/components/stage/NeuralWorkspace.tsx [cite: 165, 167]
cat << 'EOF' > src/components/stage/NeuralWorkspace.tsx
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { ThemeColors } from '../../constants/Palette';
import { useAudioProcessor } from '../../logic/useAudioProcessor';
import { useCentripetalExit } from '../../logic/useCentripetalExit';

const EQ_L1 = ["d/dx", "∫ f(x)", "lim", "∑", "√-1"];
const EQ_L2 = ["H₂O", "C-C", "NaCl", "O₂", "ΔH"];
const EQ_L3 = ["1+1", "x²", "a+b", "sin(θ)", "π"];

const EquationLayer = ({ equations, z, speed, opacity, color, height }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((_, delta) => {
        if(groupRef.current) groupRef.current.position.z += (speed * height) * delta;
    });
    return (
        <group ref={groupRef} position={[0, 0, z]}>
            {equations.map((eq: string, i: number) => (
                <Text key={i} position={[Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 5]}
                    fontSize={0.5} color={color} fillOpacity={opacity} font="/assets/fonts/Inter-Bold.ttf">
                    {eq}
                </Text>
            ))}
        </group>
    );
};

export const NeuralWorkspace = ({ audioSrc, outroStart, palette }: { audioSrc: string, outroStart: number, palette: ThemeColors }) => {
  const { height } = useThree().viewport;
  const containerRef = useRef<THREE.Group>(null);
  const { subBass } = useAudioProcessor(audioSrc);
  const { scale } = useCentripetalExit(outroStart);

  const pulseOpacity = 0.05 + (subBass * 0.15);

  useFrame((_, delta) => {
    if(containerRef.current) {
        containerRef.current.rotation.y += 0.05 * delta;
        containerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={containerRef}>
      {/* C1 (Void) used for Fog [cite: 165] */}
      <fogExp2 attach="fog" args={[palette.C1_VOID, 0.0025]} /> 
      
      {/* C4 (Highlight) used for Equations [cite: 167] */}
      <EquationLayer equations={EQ_L1} z={-5.0 * height} speed={0.08} opacity={pulseOpacity} color={palette.C4_HIGHLIGHT} height={height} />
      <EquationLayer equations={EQ_L2} z={-15.0 * height} speed={0.03} opacity={pulseOpacity * 0.7} color={palette.C4_HIGHLIGHT} height={height} />
      <EquationLayer equations={EQ_L3} z={-40.0 * height} speed={0.01} opacity={pulseOpacity * 0.5} color={palette.C4_HIGHLIGHT} height={height} />
      
      {/* Particles also use C4 [cite: 109] */}
      <Points positions={new Float32Array(500 * 3).map(() => (Math.random() - 0.5) * 20)}>
         <PointMaterial transparent color={palette.C4_HIGHLIGHT} size={0.03} opacity={0.4} />
      </Points>
    </group>
  );
};
EOF

# src/components/stage/SlateRig.tsx
cat << 'EOF' > src/components/stage/SlateRig.tsx
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { SPATIAL_MAP, toThreeY } from '../../constants/Config';
import { useCentripetalExit } from '../../logic/useCentripetalExit';
import * as THREE from 'three';

export const SlateRig = ({ scene3Start, outroStart, thumbSrc }: { scene3Start: number, outroStart: number, thumbSrc: string }) => {
  const { height, width } = useThree().viewport;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const groupRef = useRef<THREE.Group>(null);
  const texture = new THREE.TextureLoader().load(thumbSrc);

  const pivotY = toThreeY(SPATIAL_MAP.SLATE_BTM_Y, height);
  const slateVisualY = toThreeY(SPATIAL_MAP.SLATE_INST_Y, height);
  const yOffset = slateVisualY - pivotY;

  const { scale } = useCentripetalExit(outroStart);

  useFrame(() => {
    if (!groupRef.current) return;
    const rotationProgress = interpolate(
      frame,
      [scene3Start, scene3Start + (fps * 1.5)], 
      [0, -Math.PI], 
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    groupRef.current.rotation.x = rotationProgress;
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef} position={[0, pivotY, 0]}>
      <mesh position={[0, yOffset, 0]}>
        <boxGeometry args={[width * SPATIAL_MAP.SLATE_W, height * SPATIAL_MAP.SLATE_H, 0.05]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </group>
  );
};
EOF

# src/components/stage/CameraRig.tsx
cat << 'EOF' > src/components/stage/CameraRig.tsx
import { useFrame, useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createNoise2D } from 'simplex-noise';
import { RELATIVE_TIMINGS } from '../../constants/Timings';

export const CameraRig = ({ totalDuration }: { totalDuration: number }) => {
  const { camera, height } = useThree();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const noise2D = createNoise2D();

  useFrame(() => {
    const zPos = interpolate(
      frame,
      [0, totalDuration],
      [5.0 * height, 4.3 * height],
      { extrapolateRight: "clamp" }
    );
    const shakeStart = 0.8 * fps;
    let shakeX = 0; let shakeY = 0;
    if (frame >= shakeStart && frame < shakeStart + (RELATIVE_TIMINGS.SHAKE_DURATION * fps)) {
        const shakeIntensity = 0.015 * height;
        const time = (frame - shakeStart) * 0.5;
        shakeX = noise2D(time, 0) * shakeIntensity;
        shakeY = noise2D(0, time) * shakeIntensity;
    }
    camera.position.set(shakeX, shakeY, zPos);
    camera.lookAt(0, 0, 0); 
  });
  return null;
};
EOF

# ==============================================================================
# 6. UI Components (Continuous) - THEME AWARE
# ==============================================================================

echo "Generating UI..."

# src/components/ui/MonumentalHook.tsx [cite: 166]
cat << 'EOF' > src/components/ui/MonumentalHook.tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { SceneTiming } from "../../schema";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { ThemeColors } from "../../constants/Palette";

export const MonumentalHook = ({ text, timing, palette }: { text: string, timing: SceneTiming, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  if (frame < timing.start_time || frame > timing.start_time + timing.duration) return null;

  const yOffset = interpolate(
    frame - timing.start_time, 
    [timing.duration * RELATIVE_TIMINGS.HOOK_EXIT, timing.duration], 
    [0, -1000], 
    { extrapolateLeft: "clamp" }
  );

  return (
    <AbsoluteFill style={{ 
        top: `${SPATIAL_MAP.HOOK_STACK * 100}%`, 
        transform: `translateY(${yOffset}px)`,
        justifyContent: 'center', alignItems: 'center', flexDirection: 'column' 
    }}>
      {text.split(' ').map((word, i) => (
          <h1 key={i} style={{ 
              fontSize: 120, 
              color: palette.C3_PRIMARY, // C3 Primary for Hook [cite: 166]
              margin: 0,
              transform: `translate(${Math.sin(frame * 0.8 + i) * 5}px, ${Math.cos(frame * 0.8 + i) * 5}px)`
          }}>
            {word}
          </h1>
      ))}
    </AbsoluteFill>
  );
};
EOF

# src/components/ui/TipTitle.tsx [cite: 166]
cat << 'EOF' > src/components/ui/TipTitle.tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { ThemeColors } from "../../constants/Palette";

export const TipTitle = ({ text, startTime, exitTime, palette }: { text: string, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  if (frame < startTime || frame > exitTime) return null;

  const delayFrame = startTime + (RELATIVE_TIMINGS.TITLE_DELAY * fps);
  const scale = spring({ frame: frame - delayFrame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ top: `${SPATIAL_MAP.TIP_TITLE * 100}%`, alignItems: 'center', width: '100%', opacity }}>
       <h2 style={{ 
           transform: `scale(${scale})`, 
           color: 'white', 
           fontSize: 60, 
           borderBottom: `4px solid ${palette.C3_PRIMARY}` // C3 Underline [cite: 166]
       }}>
         {text}
       </h2>
    </AbsoluteFill>
  );
};
EOF

# src/components/ui/TipDetails.tsx
cat << 'EOF' > src/components/ui/TipDetails.tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { RELATIVE_TIMINGS } from "../../constants/Timings";
import { useFontFit } from "../../logic/useFontFit";

export const TipDetails = ({ text, startTime, exitTime }: { text: string, startTime: number, exitTime: number }) => {
  const frame = useCurrentFrame();
  const { fps, height, width } = useVideoConfig();
  
  if (frame < startTime || frame > exitTime) return null;
  const delayFrame = startTime + (RELATIVE_TIMINGS.DETAILS_DELAY * fps);
  const enterOpacity = interpolate(frame - delayFrame, [0, 20], [0, 1], { extrapolateLeft: 'clamp' });
  const blur = interpolate(frame - delayFrame, [0, 20], [0, 15], { extrapolateLeft: 'clamp' });
  const exitOpacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });
  const fontSize = useFontFit(text, width * 0.8, height * 0.3, 40);

  return (
    <AbsoluteFill style={{ 
        top: `${SPATIAL_MAP.TIP_DETAILS_START * 100}%`,
        height: `${(SPATIAL_MAP.TIP_DETAILS_END - SPATIAL_MAP.TIP_DETAILS_START) * 100}%`,
        opacity: Math.min(enterOpacity, exitOpacity),
        backdropFilter: `blur(${blur}px)`,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '2rem', alignItems: 'center', justifyContent: 'center'
    }}>
       <p style={{ color: 'white', fontSize, textAlign: 'center' }}>{text}</p>
    </AbsoluteFill>
  );
};
EOF

# src/components/ui/BonusPane.tsx
cat << 'EOF' > src/components/ui/BonusPane.tsx
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { ThemeColors } from "../../constants/Palette";

export const BonusPane = ({ text, startTime, exitTime, palette }: { text: string, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  if (frame < startTime || frame > exitTime) return null;
  const width = interpolate(frame - startTime, [0, 20], [0, 100], { extrapolateRight: "clamp" });
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ 
        top: `${SPATIAL_MAP.BONUS_Y * 100}%`, right: '5%',
        width: `${width}%`, maxWidth: '40%', height: '10%',
        backgroundColor: palette.C4_HIGHLIGHT, // Uses Glow color
        overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        opacity
    }}>
       <span style={{ color: 'black', fontWeight: 'bold' }}>{text}</span>
    </AbsoluteFill>
  );
};
EOF

# src/components/ui/CTA_Scene.tsx [cite: 168]
cat << 'EOF' > src/components/ui/CTA_Scene.tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { SPATIAL_MAP } from "../../constants/Config";
import { CtaContent } from "../../schema";
import { ThemeColors } from "../../constants/Palette";

export const CTA_Scene = ({ content, startTime, exitTime, palette }: { content: CtaContent, startTime: number, exitTime: number, palette: ThemeColors }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  if (frame < startTime || frame > exitTime) return null;

  const relFrame = frame - startTime;
  const socialStart = 0.75 * fps;
  const linkStart = 1.25 * fps;

  const socialScale = interpolate(relFrame - socialStart, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.elastic(1) });
  const linkY = interpolate(relFrame - linkStart, [0, 15], [height * 1.0, height * SPATIAL_MAP.CTA_LNK_Y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const bounce = Math.sin((frame / fps) * Math.PI * 6) * 10;
  const opacity = interpolate(frame, [exitTime - 10, exitTime], [1, 0], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Social Pill: uses C6 [cite: 168] */}
      <div style={{
          position: 'absolute', top: `${SPATIAL_MAP.CTA_SOC_Y * 100}%`, left: '50%',
          transform: `translate(-50%, -50%) scale(${socialScale})`,
          backgroundColor: palette.C6_SOCIAL, 
          color: 'white', padding: '10px 30px', borderRadius: 50,
          fontWeight: 'bold', fontSize: 40, boxShadow: `0 0 20px ${palette.C6_SOCIAL}`
      }}>
        {content.social_text}
      </div>

      {/* Link Pill: uses C7 [cite: 168] */}
      <div style={{
          position: 'absolute', top: linkY, left: '50%', transform: 'translate(-50%, -50%)',
          backgroundColor: palette.C7_LINK, 
          color: 'black', padding: '15px 40px', borderRadius: 50,
          fontWeight: 'bold', fontSize: 50, display: 'flex', alignItems: 'center', gap: 10
      }}>
        {content.link_text}
      </div>

      <div style={{
          position: 'absolute', top: `${0.86 * 100}%`, left: '70%', fontSize: 80,
          transform: `translateY(${-bounce}px)`
      }}>
        👆
      </div>
    </AbsoluteFill>
  );
};
EOF

# src/components/ui/Outro.tsx [cite: 169]
cat << 'EOF' > src/components/ui/Outro.tsx
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
      <img src="/assets/logo.png" style={{ width: '20%', transform: `translateY(${Math.sin(frame/10)*20}px)` }} />
      
      {/* USP 1: C3 darkened to 25%L [cite: 169] */}
      <div style={{ 
          color: getOutroColor(palette.C3_PRIMARY, 25), 
          fontSize: 60, fontFamily: 'Inter-Bold', marginTop: 20 
      }}>
        {content.usp_line_1}
      </div>
      
      {/* USP 2: C8 darkened to 35%L [cite: 169] */}
      <div style={{ 
          color: getOutroColor(palette.C8_OUTRO_ACC, 35), 
          fontSize: 60, fontFamily: 'Inter-Bold' 
      }}>
        {content.usp_line_2}
      </div>

      <div style={{ position: 'absolute', bottom: height * 0.10, color: '#666666', fontSize: 24 }}>
         © 2025 NCERT QuickPrep
      </div>
    </AbsoluteFill>
  );
};
EOF

# src/components/overlay/AudioVisualizer.tsx [cite: 167]
cat << 'EOF' > src/components/overlay/AudioVisualizer.tsx
import { Line } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SPATIAL_MAP, toThreeY } from '../../constants/Config';
import { ThemeColors } from '../../constants/Palette';
import { useAudioProcessor } from '../../logic/useAudioProcessor';

export const AudioVisualizer = ({ audioSrc, palette }: { audioSrc: string, palette: ThemeColors }) => {
  const { height, width } = useThree().viewport;
  const lineRef = useRef<any>(null);
  const { spectrum } = useAudioProcessor(audioSrc);
  const anchorY = toThreeY(SPATIAL_MAP.VISUALIZER_Y, height);
  const points = useMemo(() => new Array(128).fill(0).map((_, i) => new THREE.Vector3((i/128)*width - width/2, anchorY, 0)), [width, anchorY]);

  useFrame(() => {
    if (!lineRef.current) return;
    const positions = lineRef.current.geometry.attributes.position.array;
    for (let i = 0; i < 128; i++) {
        const magnitude = spectrum[i] * 0.1 * height;
        positions[i * 3 + 1] = anchorY + magnitude; 
    }
    lineRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return <Line ref={lineRef} points={points} color={palette.C4_HIGHLIGHT} lineWidth={width * 0.002} />;
};
EOF

# src/components/overlay/VideoUI.tsx
cat << 'EOF' > src/components/overlay/VideoUI.tsx
import { AbsoluteFill } from "remotion";
export const VideoUI = () => {
  return (
    <AbsoluteFill style={{ justifyContent: 'space-between', padding: 20, pointerEvents: 'none' }}>
        <div style={{ width: 50, height: 50, backgroundColor: 'white', opacity: 0.1, borderRadius: '50%' }} />
        <div style={{ width: 50, height: 50, backgroundColor: 'white', opacity: 0.1, borderRadius: '50%' }} />
    </AbsoluteFill>
  );
};
EOF

# ==============================================================================
# 7. Main Composition (FLAT & THEME ENABLED)
# ==============================================================================

echo "Assembling Main..."

# src/Main.tsx
cat << 'EOF' > src/Main.tsx
import { Canvas } from "@react-three/fiber";
import { AbsoluteFill } from "remotion";
import { ExamScenario } from "./schema";
import { NeuralWorkspace } from "./components/stage/NeuralWorkspace";
import { SlateRig } from "./components/stage/SlateRig";
import { CameraRig } from "./components/stage/CameraRig";
import { AudioVisualizer } from "./components/overlay/AudioVisualizer";
import { resolveTheme } from "./constants/Palette";

import { MonumentalHook } from "./components/ui/MonumentalHook";
import { TipTitle } from "./components/ui/TipTitle";
import { TipDetails } from "./components/ui/TipDetails";
import { BonusPane } from "./components/ui/BonusPane";
import { CTA_Scene } from "./components/ui/CTA_Scene";
import { Outro } from "./components/ui/Outro";
import { VideoUI } from "./components/overlay/VideoUI";

export const Main = ({ data }: { data: ExamScenario }) => {
  const { timings, content, assets, meta } = data;
  
  // Resolve Theme based on Seed [cite: 161]
  const palette = resolveTheme(meta.theme_seed);

  // Define Exit Times for Continuity
  const scene2Exit = timings.cta_social.start_time; 
  const scene3Exit = timings.outro.start_time;      

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      
      <AbsoluteFill>
        <Canvas dpr={[1, 2]} gl={{ antialias: true }} camera={{ fov: 75, position: [0, 0, 5] }}>
            {/* Ambient Lighting uses C1 Void [cite: 165] */}
            <ambientLight intensity={0.45} color={palette.C1_VOID} />
            <directionalLight position={[0, 10, 5]} intensity={1.1} />
            <spotLight position={[5, 3, 2]} intensity={1} penumbra={1} color="#ffffff" />

            <NeuralWorkspace audioSrc={assets.audio_track} outroStart={timings.outro.start_time} palette={palette} />
            <SlateRig scene3Start={timings.cta_social.start_time} outroStart={timings.outro.start_time} thumbSrc={assets.thumb_src} />
            <AudioVisualizer audioSrc={assets.audio_track} palette={palette} />
            <CameraRig totalDuration={timings.total_duration} />
        </Canvas>
      </AbsoluteFill>

      <MonumentalHook text={content.hook_text} timing={timings.hook} palette={palette} />
      <TipTitle text={content.tip_title} startTime={timings.tip_title.start_time} exitTime={scene2Exit} palette={palette} />
      <TipDetails text={content.tip_details} startTime={timings.tip_details.start_time} exitTime={scene2Exit} />
      <BonusPane text={content.bonus_visual} startTime={timings.bonus.start_time} exitTime={scene2Exit} palette={palette} />
      <CTA_Scene content={content.cta_content} startTime={timings.cta_social.start_time} exitTime={scene3Exit} palette={palette} />
      <Outro content={content.outro_content} startTime={timings.outro.start_time} palette={palette} />

      <VideoUI />

    </AbsoluteFill>
  );
};
EOF

# src/Root.tsx
cat << 'EOF' > src/Root.tsx
import { Composition } from "remotion";
import { Main } from "./Main";
import { examScenarioSchema } from "./schema";
import json from "../scenario_data.json";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
        id="ExamTip"
        component={Main}
        durationInFrames={json.timings.total_duration}
        fps={json.meta.config.fps}
        width={json.meta.config.resolution.w}
        height={json.meta.config.resolution.h}
        schema={examScenarioSchema}
        defaultProps={{ data: json as any }}
    />
  );
};
EOF

# src/index.ts
cat << 'EOF' > src/index.ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
EOF

# 8. Data Injection
cat << 'EOF' > scenario_data.json
{
  "meta": {
    "theme_seed": 12345,
    "config": { "resolution": { "w": 1080, "h": 1920 }, "fps": 30 }
  },
  "assets": {
    "video_src": "/assets/source_vid.mp4",
    "thumb_src": "/assets/thumbnail.jpg",
    "logo_src": "/assets/logo.png",
    "audio_track": "/assets/audio_track.mp3"
  },
  "timings": {
    "hook": { "start_time": 0, "duration": 90 },
    "tip_title": { "start_time": 90, "duration": 60 },
    "tip_details": { "start_time": 150, "duration": 300 },
    "bonus": { "start_time": 350, "duration": 100 },
    "cta_social": { "start_time": 450, "duration": 60 },
    "cta_link": { "start_time": 510, "duration": 60 },
    "outro": { "start_time": 1200, "duration": 60 },
    "total_duration": 1260
  },
  "content": {
    "hook_text": "STOP MEMORIZING\nDERIVATIONS",
    "tip_title": "Visual Proof Method",
    "tip_details": "Visualize the slope as a physical tangent...",
    "bonus_visual": "dy/dx = limit",
    "cta_content": { "social_text": "@NCERTQuickPrep", "link_text": "Download Full Guide" },
    "outro_content": { "usp_line_1": "Master Engineering", "usp_line_2": "In 60 Seconds" },
    "usp_badge_text": "100% Free",
    "watermark_text": "QuickPrep",
    "copyright_text": "© 2025 NCERT QuickPrep"
  }
}
EOF

echo "Visual Engine v14.1 Deployed."