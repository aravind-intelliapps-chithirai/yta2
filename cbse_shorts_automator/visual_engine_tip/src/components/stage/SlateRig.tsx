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
