import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { NanoText } from './Typography';

const ANIMATION_DURATION_SEC = 0.4;

// --- EXPORTED TYPES (Fixes the Error) ---
export type OptionState = 'neutral' | 'correct' | 'wrong' | 'dimmed';
export type AnimationMode = 'intro' | 'dock' | 'drop'; 

interface OptionCardProps {
    text: string;
    state: OptionState;
    theme: { primary: string; secondary: string; [key: string]: any };
    width: number;
    height: number;
    // Positioning
    finalY: number;      // Normal resting position
    dockY: number;       // Target position for docking
    positionZ: number;
    // Timing
    landingTime: number; 
    sequenceStartTime: number; // When the Dock/Drop happens
    // Logic
    seed: number;
    index: number;
    mode: AnimationMode; // Controls physics behavior
}

export const OptionCard: React.FC<OptionCardProps> = ({
    text,
    state,
    theme,
    width,
    height,
    finalY,
    dockY,
    landingTime,
    sequenceStartTime,
    positionZ,
    seed,
    index,
    mode,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // --- 1. INTRO ANIMATION (Existing Logic) ---
    const landingFrame = landingTime * fps;
    const introTriggerFrame = landingFrame - (ANIMATION_DURATION_SEC * fps);
    
    const introDriver = spring({
        frame: frame - introTriggerFrame,
        fps,
        config: { mass: 0.5, stiffness: 280, damping: 20 },
    });

    // --- 2. SEQUENCE ANIMATION (Dock or Drop) ---
    const sequenceTriggerFrame = sequenceStartTime * fps;
    
    // Physics: Heavy Drop (Wrong Answers)
    const dropDriver = spring({
        frame: frame - sequenceTriggerFrame,
        fps,
        config: { mass: 20, stiffness: 20, damping: 20 }, // Heavy, no bounce
    });

    // Physics: Mechanical Slide (Correct Answer)
    const dockDriver = spring({
        frame: frame - sequenceTriggerFrame,
        fps,
        config: { mass: 0.5, stiffness: 280, damping: 25 }, // Smooth, mechanical
    });

    // --- 3. POSITION SOLVER ---
    const { startX, startY } = useMemo(() => {
        const variantIndex = seed % 4;
        let sX = 0;
        let sY = finalY;
        const VERTICAL_OFFSET = height * 5; 
        const HORIZONTAL_OFFSET = width * 1.5;

        switch (variantIndex) {
            case 0: sY = finalY - VERTICAL_OFFSET; break;
            case 1: sX = -HORIZONTAL_OFFSET; break;
            case 2: sX = HORIZONTAL_OFFSET; break;
            case 3: 
                const isLeft = index % 2 === 0;
                sX = isLeft ? -HORIZONTAL_OFFSET : HORIZONTAL_OFFSET;
                break;
            default: sY = finalY - VERTICAL_OFFSET;
        }
        return { startX: sX, startY: sY };
    }, [seed, index, finalY, height, width]);

    // Initial Interpolation (Intro)
    // Note: We use `let` because we might add offsets
    let currentY = interpolate(introDriver, [0, 1], [startY, finalY]);
    let currentX = interpolate(introDriver, [0, 1], [startX, 0]);
    let currentScale = interpolate(introDriver, [0, 1], [0.8, 1.0]);

    // --- 4. MODE OVERRIDES ---
    if (mode === 'drop') {
        // Gravity Fall to off-screen (approx -5 units down)
        // We add this offset to the currentY
        const dropOffset = interpolate(dropDriver, [0, 1], [0, -5]);
        currentY += dropOffset;
    } else if (mode === 'dock') {
        // Slide Up to Dock Y
        // We calculate the delta between where we are (finalY) and where we want to be (dockY)
        const dockOffset = interpolate(dockDriver, [0, 1], [0, dockY - finalY]);
        currentY += dockOffset;
    }

    // --- 5. STYLE & PULSE ---
    const styles = useMemo(() => {
        switch (state) {
            case 'correct':
                return {
                    isCorrect: true, rimColor: theme.primary, rimEmissiveIntensity: 2.0,
                    faceColor: theme.primary, faceMetalness: 0.8, faceRoughness: 0.2,
                    textColor: '#a0af4eff', opacity: 1, zOffset: 0.3
                };
            case 'wrong':
                return {
                    isCorrect: false, rimColor: '#330000', rimEmissiveIntensity: 0,
                    faceColor: '#1a1a1a', faceMetalness: 0.2, faceRoughness: 0.8,
                    textColor: '#555555', opacity: 0.9, zOffset: 0
                };
            default:
                return {
                    isCorrect: false, rimColor: theme.secondary, rimEmissiveIntensity: 0.2,
                    faceColor: '#000000', faceMetalness: 0.1, faceRoughness: 0.2,
                    textColor: '#FFFFFF', opacity: 0.7, zOffset: 0
                };
        }
    }, [state, theme]);

    // Pulse only happens before the docking sequence starts
    const pulse = (state === 'correct' && frame < sequenceTriggerFrame) 
        ? Math.sin(frame / 8) * 0.01 + 1.01 
        : 1;

    // --- 6. RENDER ---
    if (frame < introTriggerFrame) return null;

    return (
        <group 
            position={[currentX, currentY, positionZ + styles.zOffset]} 
            scale={[currentScale * pulse, currentScale * pulse, 1]}
        >
            {/* RIM */}
            <RoundedBox args={[width + 0.02, height + 0.02, 0.04]} radius={0.06} smoothness={4}>
                <meshStandardMaterial 
                    color={styles.rimColor}
                    emissive={styles.rimColor}
                    emissiveIntensity={styles.rimEmissiveIntensity}
                    transparent={styles.opacity < 1}
                    opacity={styles.opacity}
                />
            </RoundedBox>

            {/* FACE */}
            <group position={[0, 0, 0.025]}> 
                <RoundedBox args={[width, height, 0.04]} radius={0.05} smoothness={4}>
                    {styles.isCorrect ? (
                        <meshPhysicalMaterial 
                            color={styles.faceColor}
                            metalness={styles.faceMetalness}
                            roughness={styles.faceRoughness}
                            clearcoat={1}
                        />
                    ) : (
                        <meshStandardMaterial 
                            color={styles.faceColor} 
                            transparent 
                            opacity={styles.opacity}
                            roughness={styles.faceRoughness}
                        />
                    )}
                </RoundedBox>
            </group>

            {/* TEXT */}
            <NanoText 
                text={text}
                position={[0, 0, 0.08]}
                fontSize={height * 0.4}
                color={styles.textColor}
                maxWidth={width * 0.9}
                textAlign="center"
            />
        </group>
    );
};