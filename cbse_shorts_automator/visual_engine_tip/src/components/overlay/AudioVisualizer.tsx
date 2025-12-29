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
