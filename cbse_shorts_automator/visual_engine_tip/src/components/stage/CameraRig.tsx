import { useFrame, useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { createNoise2D } from 'simplex-noise';
import { useMemo } from 'react';
import { RELATIVE_TIMINGS } from '../../constants/Timings';
import { SPATIAL_MAP, toThreeY } from '../../constants/Config';
import * as THREE from 'three';

export const CameraRig = ({ totalDuration, scene2Start, scene3Start, 
    baseZ }: { totalDuration: number, scene2Start: number, scene3Start: number, baseZ: number }) => {
  const { camera, viewport } = useThree();
  const { height } = viewport;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const noise2D = useMemo(() => createNoise2D(), []);

  // Targets converted to Three.js Y-coordinates
  const targetScene1 = toThreeY(SPATIAL_MAP.HOOK_STACK, height); // 0.50H
  const targetScene2 = toThreeY(0.5, height); // 0.19H
  const targetScene3 = toThreeY(SPATIAL_MAP.CTA_THUMB_Y, height); // 0.50H

  useFrame(() => {
    // 1. Dolly Zoom (Z Position)
    const camZFactor=0.9
    const camStartZ=camZFactor * height;
    const camEndZ=camZFactor * height;
    const zPos = interpolate(
      frame,
      [0, totalDuration],
      [baseZ, baseZ * 0.85],
      { extrapolateRight: "clamp" }
    );
    
    // 2. Dynamic LookAt (Y Position)
    // Interpolate focus point based on scene progression
    const lookAtY = interpolate(
      frame,
      [0, scene2Start, scene3Start],
      [targetScene1, targetScene2, targetScene3],
      { extrapolateRight: "clamp" }
    );

    // 3. Impact Shake
    const shakeStart = 0.8 * fps;
    let shakeX = 0; let shakeY = 0;
    
    if (frame >= shakeStart && frame < shakeStart + (RELATIVE_TIMINGS.SHAKE_DURATION * fps)) {
        const shakeIntensity = 0.015 * height ;
        const time = (frame - shakeStart) * 0.5;
        shakeX = noise2D(time, 0) * shakeIntensity;
        shakeY = noise2D(0, time) * shakeIntensity;
    }

    camera.position.set(shakeX, shakeY, zPos);
    camera.lookAt(0, lookAtY, 0); 
  });
  return null;
};