import { Line } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { Line2 } from 'three-stdlib';
import { SPATIAL_MAP, toThreeY } from '../../constants/Config';
import { ThemeColors } from '../../constants/Palette';
import { useAudioProcessor } from '../../logic/useAudioProcessor';

export const AudioVisualizer = ({ audioSrc, palette }: { audioSrc: string, palette: ThemeColors }) => {
  const { height, width } = useThree().viewport;
  const lineRef = useRef<Line2>(null);
  
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { spectrum } = useAudioProcessor(audioSrc);
  
  // --- TUNING KNOBS ---
  
  // 1. TIME SMOOTHNESS (0.1 = Jittery, 0.9 = Liquid Slow)
  // Recommended: 0.6 for music, 0.4 for voice
  const DAMPING = 0.1; 
  
  // 2. SHAPE TENSION (0.0 = Round/Loose, 1.0 = Tight/Sharp)
  // Standard Catmull-Rom is 0.5
  const TENSION = 8.8; 

  // 3. RESOLUTION (Number of segments drawn)
  // Higher = Smoother looking line, slightly more CPU
  const DRAW_RESOLUTION = 150;

  // --------------------
  
  const POINT_COUNT = 128; 
  const ANCHOR_Y = toThreeY(SPATIAL_MAP.VISUALIZER_Y, height); 
  
  const currentAmplitudes = useRef(new Float32Array(POINT_COUNT).fill(0));
  const currentOpacity = useRef(0.5); 

  // Initialize Curve with TENSION parameter
  const curve = useMemo(() => {
    const points = new Array(POINT_COUNT).fill(0).map((_, i) => {
      const x = (i / (POINT_COUNT - 1)) * width - width / 2;
      return new THREE.Vector3(x, ANCHOR_Y, 0);
    });
    // Constructor: points, closed, type, tension
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', TENSION);
  }, [width, ANCHOR_Y, TENSION]);

  useFrame(() => {
    if (!lineRef.current) return;

    const time = frame / fps;
    
    // Convert Damping to Lerp Factor
    // Logic: If Damping is 0.9, we only move 10% (0.1) towards target per frame.
    const lerpFactor = 1.0 - DAMPING; 

    let totalVolume = 0;
    let activeCount = 0;

    for (let i = 0; i < POINT_COUNT; i++) {
        const center = POINT_COUNT / 2;
        const distFromCenter = Math.abs(i - center) / center; 
        const spectrumIndex = Math.floor(distFromCenter * 35); 
        const rawAudio = spectrum[spectrumIndex] || 0;

        if (i > 40 && i < 88) {
             totalVolume += rawAudio;
             activeCount++;
        }

        const w1 = Math.sin(i * 0.1 - time * 1.5);
        const w2 = Math.cos(i * 0.3 + time * 4.0) * 0.5;
        const w3 = Math.sin(i * 0.7 - time * 8.0) * 0.3;
        const noise = (w1 + w2 + w3); 

        const syntheticSignal = noise * 0.05 * height;
        const realSignal = rawAudio * 0.35 * height;
        const targetMag = realSignal + syntheticSignal;

        // Apply DAMPING
        currentAmplitudes.current[i] = THREE.MathUtils.lerp(
            currentAmplitudes.current[i], 
            targetMag, 
            lerpFactor // Uses the tuning knob
        );

        curve.points[i].y = ANCHOR_Y + currentAmplitudes.current[i];
    }

    const avgVolume = activeCount > 0 ? totalVolume / activeCount : 0;
    const targetOpacity = 0.05 + (avgVolume * 3.5);
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, Math.min(1.0, targetOpacity), 0.1);

    if (lineRef.current.material) {
        lineRef.current.material.opacity = currentOpacity.current;
        lineRef.current.material.color.set(palette.C4_HIGHLIGHT);
    }

    // Apply RESOLUTION
    const smoothPoints = curve.getPoints(DRAW_RESOLUTION);
    
    const positions = new Float32Array(smoothPoints.length * 3);
    for (let j = 0; j < smoothPoints.length; j++) {
        positions[j * 3] = smoothPoints[j].x;
        positions[j * 3 + 1] = smoothPoints[j].y;
        positions[j * 3 + 2] = smoothPoints[j].z;
    }
    lineRef.current.geometry.setPositions(positions);
  });

  return (
    <Line 
        ref={lineRef} 
        points={curve.getPoints(DRAW_RESOLUTION)} 
        color={palette.C4_HIGHLIGHT} 
        lineWidth={width * 0.015}    
        toneMapped={false}
        transparent={true} 
        opacity={0.5}      
        
    />
  );
};