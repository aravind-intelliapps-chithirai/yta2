import React from 'react';
import { Text, Cylinder, Torus } from '@react-three/drei';
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { Theme } from '../../theme/palettes';
import { S3_CTA_CONFIG } from '../../constants';

export const USPBadge: React.FC<{ 
    theme: Theme; 
    seed: number; 
    tCtaFrame: number; 
    slateWidth: number 
}> = ({ theme, seed, tCtaFrame, slateWidth }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const localFrame = frame - tCtaFrame;
    const slateHeight = slateWidth * 0.5625;
    
    // Geometry from Constants
    const radius = slateHeight * S3_CTA_CONFIG.BADGE_RADIUS_PCT;
    const posX = slateWidth * S3_CTA_CONFIG.BADGE_X_OFFSET_PCT;
    const posY = slateHeight * S3_CTA_CONFIG.BADGE_Y_OFFSET_PCT;

    const entry = spring({
        frame: localFrame - 15, // Staggered entry
        fps,
        config: { stiffness: 100, damping: 12 }
    });

    const spin = interpolate(entry, [0, 1], [0, Math.PI * 4]);
    const text = S3_CTA_CONFIG.BADGE_TEXT_BANK[seed % S3_CTA_CONFIG.BADGE_TEXT_BANK.length];

    return (
        <group position={[posX, posY, 0.06]} scale={entry} rotation={[spin, spin, 0]}>
            {/* Outer Premium Rim */}
            <Cylinder args={[radius, radius, 0.04, 32]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial 
                    color={theme.accent_primary} 
                    metalness={1} 
                    roughness={0.1} 
                />
            </Cylinder>

            {/* Inset Face */}
            <Cylinder args={[radius * 0.88, radius * 0.88, 0.045, 32]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial 
                    color={theme.accent_secondary} 
                    metalness={0.7} 
                    roughness={0.3} 
                />
            </Cylinder>

            {/* Circumference Decoration */}
            <Torus args={[radius * 0.95, 0.006, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="gold" metalness={1} />
            </Torus>

            <Text 
                fontSize={radius * 0.28} 
                color="white" 
                position={[0, 0, 0.03]} 
                maxWidth={radius * 1.5}
                textAlign="center"
                font={undefined} // Uses default or link your bold font here
                outlineWidth={0.002}
                outlineColor={theme.accent_primary}
            >
                {text.toUpperCase()}
            </Text>
        </group>
    );
};