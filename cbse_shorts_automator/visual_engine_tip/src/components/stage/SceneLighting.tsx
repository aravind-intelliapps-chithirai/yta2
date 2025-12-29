import { useThree, useFrame } from "@react-three/fiber";
import { SpotLight } from "@react-three/drei";
import { ThemeColors } from "../../constants/Palette";
import { useRef } from "react";
import * as THREE from "three";
import { SPATIAL_MAP, toThreeY,toThreeX } from '../../constants/Config';
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const SceneLighting = ({ palette, baseZ, scene3Start, outroStart }: { palette: ThemeColors, baseZ: number, scene3Start: number, outroStart:number }) => {
  const { width, height } = useThree().viewport;
  //const targetRef = useRef<THREE.Object3D>(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Create two separate targets for independent sweeping
  const targetLeftRef = useRef<THREE.Object3D>(null);
  const targetRightRef = useRef<THREE.Object3D>(null);
  // Calculate Dynamic Positions based on Spec 4.2
  // Directional: [0.5W, 1.0H, 0.5H] 
  const dirLightPos: [number, number, number] = [width * 0.5, height * 1.0, height * 0.5];

  // Spotlights: [±0.45W, 0.30H, 0.20H] 
  const spotY = -toThreeY(0.3, height);
  const spotZ = height * 0.020;
  const spotX = (0.45*width);

  // Target: The Thumbnail Plane at 0.50H [cite: 123]
  const targetY = toThreeY(0.5, height);;
  // Inside SceneLighting component
  const lightPos = new THREE.Vector3(spotX, spotY, spotZ);
  const targetPos = new THREE.Vector3(0, targetY, 0);

  // Calculate exact distance so the beam "ends" at the target
  const exactDistance = lightPos.distanceTo(targetPos);

  // 2. ANIMATION TIMING
  // --- TIMING LOGIC ---
  // 1. Start AFTER the flip (Flip takes ~1.5s per Spec) [cite: 146]
  const flipDuration = fps * 1.5;
  const sweepStartTime = scene3Start + flipDuration;
  // The Spotlights belong to the "CTA Reveal". They should fade in when Scene 3 starts.
  const spotOpacity = interpolate(
    frame,
    [sweepStartTime, sweepStartTime + (fps * 0.5), outroStart - (fps * 0.5), outroStart], // 0.5s fade-in
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- SWEEP ANIMATION ---
  useFrame(() => {
    // Only calculate if visible to save resources
    if (frame < sweepStartTime || frame > outroStart) return;

    if (targetLeftRef.current && targetRightRef.current) {
        // "Fox Style" Crossing Motion
        // We use a slow sine wave to sway the targets left and right
        const time = (frame - sweepStartTime) / fps;
        
        // Amplitude: How far they sweep (40% of screen width)
        const sweepAmp = width * 0.4;
        
        // Frequency: Speed of the sweep (0.5 Hz = 2 seconds per sway)
        const sway = Math.sin(time * 2.0) * sweepAmp;

        // Apply Opposite Sway (Crossing Effect)
        // Left Light Target moves Right (+)
        targetLeftRef.current.position.x = sway;
        // Right Light Target moves Left (-)
        targetRightRef.current.position.x = -sway;
    }
  });

  return (
    <>
      {/* 1. Global Ambient: Intensity 0.45, Color C1 [cite: 119] */}
      <ambientLight intensity={0.5} color={palette.C1_VOID} />

      {/* 2. Top-Down Directional: Intensity 1.1  */}
      <directionalLight position={dirLightPos} intensity={5.5} color="white" />

      {/* 3. CTA Spotlight Pair  */}
      {/* INVISIBLE MOVING TARGETS */}
      <object3D ref={targetLeftRef} position={[0, targetY, 0]} />
      <object3D ref={targetRightRef} position={[0, targetY, 0]} />

      {/* Left Spotlight */}
      <SpotLight
        position={[-spotX, spotY, spotZ]}
        target={targetLeftRef.current || undefined}
        penumbra={0.5}
        radiusTop={width * 0.001}
        radiusBottom={width * 0.06}
        distance={exactDistance}
        angle={0.6}
        attenuation={exactDistance*2.5}
        anglePower={0.9}
        intensity={2.0} // Boosted to be visible with volumetrics
        opacity={spotOpacity * 0.6}   // Volumetric Opacity
        volumetric              // Explicitly enable volumetric shader
        debug={false}           // Set true to see the wireframe cone if still invisible
        color={palette.C4_HIGHLIGHT} // Using Highlight color for rays
      />

      {/* Right Spotlight */}
      <SpotLight
        position={[spotX, spotY, spotZ]}
        target={targetRightRef.current || undefined}
        penumbra={0.5}
        radiusTop={width * 0.001}
        radiusBottom={width * 0.06}
        distance={exactDistance}
        angle={0.6}
        attenuation={exactDistance*2.5}
        anglePower={0.9}
        intensity={2.0} // Boosted to be visible with volumetrics
        opacity={spotOpacity * 0.6}   // Volumetric Opacity
        volumetric              // Explicitly enable volumetric shader
        debug={false}           // Set true to see the wireframe cone if still invisible
        color={palette.C4_HIGHLIGHT} // Using Highlight color for rays
      />
    </>
  );
};