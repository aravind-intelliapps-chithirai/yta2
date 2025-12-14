import React, { useMemo, useRef } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { MeshPhysicalMaterial, Color } from 'three';
import { NanoText } from './Typography';

interface CTAContainerProps {
    ctaSocial: string;
    ctaLink: string;
    width: number;
    height: number;
    finalY: number;
    startTime: number;
    themeColor: string;
}

export const CTAContainer: React.FC<CTAContainerProps> = ({
    ctaSocial,
    ctaLink,
    width,
    height,
    finalY,
    startTime,
    themeColor
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const materialRef = useRef<MeshPhysicalMaterial>(null!);

    // --- 1. LAYOUT CALCULATIONS ---
    const layout = useMemo(() => {
        const padding = height * 0.25; // Vertical padding for centered text
        const fontSize = height * 0.5; // Fixed at 50% of the pill height
        const textWidth = width - (height * 0.1); // Ensure left/right padding
        
        // Pill height must be fixed for the text percentage to work
        // Height is passed via props: height * 0.15 (example)

        return { padding, fontSize, textWidth };
    }, [width, height]);

    // --- 2. TIME-BASED TEXT WIPE LOGIC (High Precision) ---
    const t_social_start = startTime; // 0.8s
    const t_social_end_wipe = startTime + 1.0; // 1.8s
    const t_link_start_wipe = startTime + 1.5; // 2.3s
    const t_link_end = startTime + 2.0; // 2.8s

    // Calculate the current text being displayed
    const currentText = frame / fps < t_link_start_wipe ? ctaSocial : ctaLink;
    const textIsSocial = currentText === ctaSocial;

    // --- WIPE PROGRESS CALCULATION (0 to 1) ---

    let wipeProgress = 0; // 0 = Fully Visible / Fully Invisible (depending on direction)
    let isAppearing = false;

    if (frame / fps >= t_social_end_wipe && textIsSocial) {
        // Phase 2: Wipe Down Social (Disappear) - Duration 0.5s
        wipeProgress = interpolate(
            frame / fps,
            [t_social_end_wipe, t_link_start_wipe],
            [0, 1], // 0% hidden to 100% hidden
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        isAppearing = false;

    } else if (frame / fps >= t_link_start_wipe) {
        // Phase 3: Wipe Down Link (Appear) - Duration 0.5s
        wipeProgress = interpolate(
            frame / fps,
            [t_link_start_wipe, t_link_end],
            [1, 0], // 100% hidden to 0% hidden (Appearing)
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        isAppearing = true;
    } else {
         // Phase 1: Static Display (Social)
         wipeProgress = 0;
         isAppearing = true;
    }

    // --- TEXT CLIPPING / MASKING LOGIC ---
    // The wipe effect is achieved by adjusting the scale or Y position of the text's container
    // or by using custom shaders/clipping. Here we use an interpolated scale/Y approach for simplicity.
    const textHeight = layout.fontSize * 1.2; // Approximate text height with line spacing

    // 1. Vertical Scale (The wipe effect): 1 to 0 (Disappear), 0 to 1 (Appear)
    // For a wipe down effect:
    // Disappear: Scale 1 -> 0, anchor Y moves from center to bottom
    // Appear: Scale 0 -> 1, anchor Y moves from top to center
    
    // We will use a group scale and position adjustment to simulate the wipe.
    const wipeFactor = isAppearing ? (1 - wipeProgress) : (1 - wipeProgress); // 1 -> 0 (hide), 0 -> 1 (reveal)
    const currentScaleY = textIsSocial ? (1 - wipeProgress) : (1 - wipeProgress);
    
    // Y-Position correction (for a center-anchored wipe)
    // The movement should simulate the text being wiped from the top down.
    // If it's disappearing (Social), the text's top edge should move to the center of the clip.
    // If it's appearing (Link), the text's top edge should move from the center of the clip.
    const yCorrection = textIsSocial 
        ? (textHeight / 2) * wipeProgress // Moves the social text up as it vanishes
        : (-textHeight / 2) * wipeProgress; // Moves the link text down as it appears

    // Final visibility check
    if (frame / fps < t_social_start) return null; // Wait for the instantaneous reveal

    return (
        <group position={[0, finalY, 0.5]}>
            {/* 1. THE GLASS PILL GEOMETRY */}
            <RoundedBox 
                args={[width, height, 0.05]} 
                radius={height * 0.5} // High radius for pill shape
                smoothness={4}
            >
                <meshPhysicalMaterial
                    ref={materialRef}
                    color={new Color(themeColor).multiplyScalar(0.5)} // Slightly darker base
                    transparent={true}
                    opacity={0.3} // Glassmorphism transparency
                    roughness={0.1}
                    metalness={0.9}
                    clearcoat={1.0}
                    clearcoatRoughness={0.1}
                    reflectivity={0.9}
                    envMapIntensity={0.8}
                />
            </RoundedBox>

            {/* 2. TEXT CONTENT: Wipe effect is applied to a containing group */}
            <group 
                position={[0, 0 + yCorrection, 0.06]} 
                scale={[1, currentScaleY, 1]}
                // The CTA is BOLD and centered as required
            >
                <NanoText 
                    text={currentText}
                    position={[0, 0, 0]} // <--- ADDED REQUIRED PROP
                    fontSize={layout.fontSize}
                    color="#ffffff" 
                    maxWidth={layout.textWidth}
                    textAlign="center"
                    anchorX="center"  
                    anchorY="middle"
                    outlineWidth={0}
                    //bold={true} // All CTA text must be BOLD
                />
            </group>
        </group>
    );
};