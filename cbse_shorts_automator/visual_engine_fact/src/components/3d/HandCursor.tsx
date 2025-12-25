import React from 'react';
import { RoundedBox } from '@react-three/drei';
import { interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { Theme } from '../../theme/palettes';
import { S3_CTA_CONFIG } from '../../constants';

// --- GLOBAL TRANSFORM CONTROLS ---
// Adjust these to change the hand's overall "vibe" without touching the path logic
const GLOBAL_HAND_CONFIG = {
    SCALE: 0.3,           // Overall size of the hand
    ROTATION_X: -0.2,     // Tilt forward/back
    ROTATION_Y: 0.3,      // Side-to-side angle
    ROTATION_Z: 0.3,      // Clockwise/Anti-clockwise lean
};

export const HandCursor: React.FC<{ 
    theme: Theme; 
    tCtaFrame: number; 
    slateWidth: number 
}> = ({ theme, tCtaFrame, slateWidth }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Timing: Offset by the entry delay defined in your constants
    const entryFrame = tCtaFrame + (S3_CTA_CONFIG.HAND_ENTRY_DELAY * fps);
    const clickFrame = tCtaFrame + (S3_CTA_CONFIG.CLICK_TIME_OFFSET * fps);
    
    // 1. Flight: The entrance arc
    const flight = spring({ 
        frame: frame - entryFrame, 
        fps, 
        config: { damping: 14, stiffness: 80 } 
    });

    // 2. Click: The "Z-Thrust" toward the glass
    const click = spring({ 
        frame: frame - clickFrame, 
        fps, 
        config: { stiffness: 400, damping: 20 } 
    });

    // --- COORDINATE MATH ---
    // Start from bottom-right (0.7 of width) and land at center (0)
    const posX = interpolate(flight, [0, 1], [slateWidth * 0.7, 0]);
    const posY = interpolate(flight, [0, 1], [-slateWidth * 0.5, 0]);
    
    // The "Z" moves from hover distance (0.4) to contact (0.15)
    const posZ = 0.4 - (click * 0.25);

    return (
        /* MASTER TRANSFORM GROUP: This is your global scaling and rotation handle */
        <group 
            scale={GLOBAL_HAND_CONFIG.SCALE} 
            rotation={[
                GLOBAL_HAND_CONFIG.ROTATION_X, 
                GLOBAL_HAND_CONFIG.ROTATION_Y, 
                GLOBAL_HAND_CONFIG.ROTATION_Z
            ]}
        >
            {/* ANIMATION GROUP: Handles the flight and the specific click rotation/scaling */}
            <group 
                position={[posX, posY, posZ]} 
                scale={1 - (click * 0.1)} 
                rotation={[0, 0, -click * 0.2]}
            >
                {/* Palm: Using theme.text_3d_face for the "Skin" */}
                <RoundedBox 
                    args={[S3_CTA_CONFIG.HAND_PALM_WIDTH, S3_CTA_CONFIG.HAND_PALM_WIDTH * 1.2, 0.05]} 
                    radius={0.03}
                >
                    <meshStandardMaterial 
                        color={theme.text_3d_face} 
                        roughness={0.4} 
                        metalness={0.1}
                    />
                </RoundedBox>

                {/* Pointing Finger: Offset so the tip aligns with the center during click */}
                <mesh position={[
                    -0.25 * S3_CTA_CONFIG.HAND_PALM_WIDTH, 
                    S3_CTA_CONFIG.HAND_FINGER_LENGTH * 0.9, 
                    0
                ]}>
                    <capsuleGeometry args={[0.022, S3_CTA_CONFIG.HAND_FINGER_LENGTH, 4, 8]} />
                    <meshStandardMaterial color={theme.text_3d_face} />
                </mesh>

                {/* Thumb Detail: Angled for a natural pointing silhouette */}
                <mesh position={[-0.07, 0.02, 0]} rotation={[0, 0, Math.PI / 4]}>
                    <capsuleGeometry args={[0.018, S3_CTA_CONFIG.HAND_FINGER_LENGTH*.8, 4, 8]} />
                    <meshStandardMaterial color={theme.text_3d_face} />
                </mesh>
            </group>
        </group>
    );
};