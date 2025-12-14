import React, { useMemo, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, spring, Easing, interpolate } from 'remotion';
import { useLoader } from '@react-three/fiber';
import { TextureLoader, MeshPhysicalMaterial, Color } from 'three';
import { RoundedBox } from '@react-three/drei';

interface ThumbnailProps {
    url: string;
    width: number;
    height: number;
    finalY: number;
    startTime: number;
    fps: number;
}

export const Thumbnail: React.FC<ThumbnailProps> = ({
    url,
    width,
    height,
    finalY,
    startTime,
    fps
}) => {
    const frame = useCurrentFrame();
    
    // Load the image texture
    const texture = useLoader(TextureLoader, url);

    // --- ELASTIC SPRING SLIDE UP ANIMATION ---
    const startFrame = startTime * fps;
    const durationFrames = 0.6 * fps; // 0.6s duration

    const progress = spring({
        frame: frame - startFrame,
        fps,
        config: { mass: 1, stiffness: 200, damping: 18 }, // Elastic Spring
        durationInFrames: durationFrames,
    });

    // The initial position is far below the screen to slide up
    const initialY = finalY - height - 5; // Start well below the final Y position
    
    const currentY = interpolate(
        progress,
        [0, 1],
        [initialY, finalY],
        { extrapolateLeft: 'clamp' }
    );

    // Fade in the thumbnail slightly during the slide
    const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 1], { extrapolateRight: 'clamp' });

    if (frame < startFrame) return null;

    return (
        <group position={[0, currentY, 0]}>
            <RoundedBox 
                args={[width, height, 0.05]} 
                radius={0.05} 
                smoothness={4}
            >
                {/* Standard Material with Texture and Opacity */}
                <meshStandardMaterial 
                    map={texture} 
                    roughness={0.7} 
                    metalness={0.1}
                    transparent={true}
                    opacity={opacity}
                />
            </RoundedBox>
        </group>
    );
};