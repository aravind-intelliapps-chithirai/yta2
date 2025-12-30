import { Text } from '@react-three/drei';
import { staticFile } from 'remotion';
import React from 'react';
import * as THREE from 'three';

interface PlayerUIProps {
  width: number;
  height: number;
  depth: number;
}

export const PlayerUI: React.FC<PlayerUIProps> = ({ width, height, depth }) => {
  const BAR_HEIGHT = height * 0.015;
  const PADDING_X = width * 0.05;
  const Y_POS = -height * 0.42; 
  const PROGRESS = 0.42;       
  const BG_HEIGHT = height * 0.16;
  
  // FIX: Z-offsets as fractions of DEPTH
  // Since depth is roughly ~2% of width, these are robust physical offsets.
  const Z_LAYER_1 = depth * 0.15; // Track sits 15% of depth forward
  const Z_LAYER_2 = depth * 0.30; // Fill sits 30% of depth forward
  const Z_LAYER_3 = depth * 0.45; // Knob sits 45% of depth forward

  const usableWidth = width - (PADDING_X * 2);
  const progressWidth = usableWidth * PROGRESS;
  const knobX = -(usableWidth / 2) + progressWidth;

  return (
    // Base Group is already at 1.0 * depth (Surface of slate)
    <group position={[0, Y_POS, 1.0 * depth]}> 
        
        {/* Background Shade: Pushed slightly INTO the slate (-20% depth) */}
        {/* This effectively "embeds" the shadow while keeping it above the video */}
        <mesh position={[0, -height * 0.04, -depth * 0.2]}>
            <planeGeometry args={[width, BG_HEIGHT]} />
            <meshBasicMaterial color="#000000" opacity={0.5} transparent side={THREE.DoubleSide} />
        </mesh>

        {/* 1. Progress Bar Track */}
        <mesh position={[0, 0, Z_LAYER_1]}>
            <planeGeometry args={[usableWidth, BAR_HEIGHT]} />
            <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>

        {/* 2. Progress Bar Fill */}
        <mesh position={[-(usableWidth / 2) + (progressWidth / 2), 0, Z_LAYER_2]}>
            <planeGeometry args={[progressWidth, BAR_HEIGHT]} />
            <meshBasicMaterial color="#ff0000" />
        </mesh>

        {/* 3. Scrubber Knob */}
        <mesh position={[knobX, 0, Z_LAYER_3]}>
            <circleGeometry args={[BAR_HEIGHT * 2.5, 32]} />
            <meshBasicMaterial color="#ff0000" />
        </mesh>

        {/* 4. Left Controls */}
        <group position={[-(usableWidth / 2), -height * 0.08, Z_LAYER_1]}>
             <mesh rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[BAR_HEIGHT * 2, BAR_HEIGHT * 3, 3]} /> 
                 <meshBasicMaterial color="white" />
             </mesh>
             
             <Text
                position={[width * 0.06, 0, 0]} 
                fontSize={height * 0.05}
                color="white"
                anchorX="left"
                anchorY="middle"
                font={staticFile("assets/fonts/Inter-Regular.ttf")} 
             >
                2:56 / 7:00
             </Text>
        </group>

        {/* 5. Right Controls */}
        <group position={[(usableWidth / 2), -height * 0.08, Z_LAYER_1]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[BAR_HEIGHT * 3, BAR_HEIGHT * 2.5, 0.001]} />
                <meshBasicMaterial color="white" wireframe />
            </mesh>
            
             <mesh position={[-width * 0.06, 0, 0]}>
                <ringGeometry args={[BAR_HEIGHT * 1.2, BAR_HEIGHT * 1.8, 32]} />
                <meshBasicMaterial color="white" />
            </mesh>
        </group>

    </group>
  );
};