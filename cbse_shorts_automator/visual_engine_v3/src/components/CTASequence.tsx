import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate, spring, Easing, staticFile } from 'remotion';
import { Image, RoundedBox, Text } from '@react-three/drei';
import { VisualScenario } from '../types/schema';

// --- SUGAR GLASS BURST ---
interface SugarGlassBurstProps {
    position: [number, number, number];
    color: string;
    triggerTime: number;
    fps: number;
}

export const SugarGlassBurst: React.FC<SugarGlassBurstProps> = ({ position, color, triggerTime, fps }) => {
    const frame = useCurrentFrame();
    const startFrame = triggerTime * fps;
    const progress = frame - startFrame;

    const shreds = useMemo(() => {
        return new Array(80).fill(0).map(() => ({
            offset: [
                (Math.random() - 0.5) * 2.0,  
                (Math.random() - 0.8) * 1.1, 
                (Math.random() - 0.5) * 0.5  
            ],
            velocity: [
                (Math.random() - 0.5) * 0.3,  
                (Math.random() * 0.1) + 0.02, 
                (Math.random() - 0.5) * 0.3   
            ],
            scale: [
                Math.random() * 0.04 + 0.02, 
                Math.random() * 0.04 + 0.02, 
                0.02                       
            ],
            rotationSpeed: [Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2]
        }));
    }, []);

    if (progress < 0) return null;

    return (
        <group position={position}>
            {shreds.map((shred, i) => {
                const t = progress * 0.5; 
                const gravity = -0.02 * t * t; 
                
                const x = shred.velocity[0] * t;
                const y = (shred.velocity[1] * t) + gravity;
                const z = shred.velocity[2] * t;

                const opacity = interpolate(progress, [0, 50], [1, 0], { extrapolateRight: 'clamp' });
                if (opacity <= 0) return null;

                return (
                    <mesh 
                        key={i} 
                        position={[shred.offset[0] + x, shred.offset[1] + y, shred.offset[2] + z]}
                        rotation={[shred.rotationSpeed[0] * t, shred.rotationSpeed[1] * t, shred.rotationSpeed[2] * t]}
                    >
                        <boxGeometry args={[shred.scale[0], shred.scale[1], 0.02]} />
                        <meshStandardMaterial 
                            color={color} 
                            roughness={0.8} 
                            transparent 
                            opacity={opacity}
                            side={2}
                        />
                    </mesh>
                );
            })}
        </group>
    );
};

// --- CTA LAYER ---
interface CTALayerProps {
    scenario: VisualScenario;
    topBound: number;
    bottomBound: number;
    width: number;
    startTime: number;
    fps: number;
    theme: any;
}

export const CTALayer: React.FC<CTALayerProps> = ({ scenario, topBound, bottomBound, width, startTime, fps, theme }) => {
    const frame = useCurrentFrame();
    const startFrame = startTime * fps;
    
    const thumbnailUrl = staticFile(scenario.assets.thumbnail_url);
    const fontUrl = staticFile(scenario.assets.font_url); // <--- ADDED
    // 1. Layout & Safety Checks
    // Protect against NaN crashing the layout
    const safeTop = Number.isFinite(topBound) ? topBound : 5;
    const safeBottom = Number.isFinite(bottomBound) ? bottomBound : -5;
    const safeWidth = Number.isFinite(width) ? width : 10;

    const availableHeight = safeTop - safeBottom;
    const centerY = safeBottom + (availableHeight / 2) ;
    
    // Dimension Logic
    const thumbWidth = safeWidth * 1;
    const thumbHeight = thumbWidth * (9/16);

    // --- NEW PILL GEOMETRY & LAYOUT ---
    const PILL_WIDTH = thumbWidth * 0.99; // 90% of screen width
    const PILL_HEIGHT = 0.5; // Fixed height in R3F units (roughly 7% of viewport height)
    const PILL_RADIUS = PILL_HEIGHT / 2; // Radius is 50% of height (0.35)
    // CALCULATED FONT SIZE: Calculate based on Pill Width to fit text
    // The fontSize is roughly proportional to the world units of the text bounding box.
    // 0.08 is a safe visual factor relative to the width for a full line of text.
    const MAX_FONT_SIZE = PILL_WIDTH * 0.03; 
    const FONT_SIZE = Math.min(MAX_FONT_SIZE, PILL_HEIGHT * 0.50); // Use 50% of height as ceiling
    // Calculate final resting position for the CTA Group
    // CenterY - (Half Thumb Height) - 0.5 (padding)
  const GAP_THUMB_PILL = 0.2; 

  // FONT CALCULATION CONSTANTS
    const CHAR_WIDTH_RATIO = 0.65;
    const HORIZONTAL_PADDING_FACTOR = 0.90; // Use 90% of pill width for text area
    const MAX_TEXT_AREA_WIDTH = PILL_WIDTH * HORIZONTAL_PADDING_FACTOR;
    const FONT_SIZE_CEILING = PILL_HEIGHT * 0.50; // Max allowed by height

    // Calculate required font size for Text A (Social Text)
    const textA_length = scenario.timeline.cta.social_text.length;
    const calculated_size_A = (textA_length > 0)
        ? MAX_TEXT_AREA_WIDTH / (textA_length * CHAR_WIDTH_RATIO)
        : FONT_SIZE_CEILING;
    
    // Final Font Size for A: Limited by the height constraint
    const FONT_SIZE_A = Math.min(calculated_size_A, FONT_SIZE_CEILING); // <--- NEW VARIABLE

    // Calculate required font size for Text B (Link Text)
    const textB_length = scenario.timeline.cta.link_text.length;
    const calculated_size_B = (textB_length > 0)
        ? MAX_TEXT_AREA_WIDTH / (textB_length * CHAR_WIDTH_RATIO)
        : FONT_SIZE_CEILING;

    // Final Font Size for B: Limited by the height constraint
    const FONT_SIZE_B = Math.min(calculated_size_B, FONT_SIZE_CEILING); // <--- NEW VARIABLE
    
    // CORRECTION: Positioning the CTA Group near the top of the available space.
    const TOP_PADDING = 0.2; // Small offset from the absolute top boundary.
    
    // 1. Calculate the position of the Thumbnail's Top Edge.
    const THUMB_TOP_EDGE_Y = safeTop - TOP_PADDING;
    
    // 2. Calculate the Group Origin (Y=0) based on the Thumbnail's Top Edge.
    // Origin = Top Edge - (Half Thumbnail Height)
    const CTA_GROUP_Y = THUMB_TOP_EDGE_Y - (thumbHeight / 2); // <-- CORRECT TOP ALIGNMENT
    // 2. Animation
    const rawScale = spring({
        frame: frame - startFrame,
        fps,
        config: { mass: 1, stiffness: 200, damping: 15 } 
    });
    // FIX 1: Prevent absolute zero scale (causes Matrix singularity crashes)
    const scale = Math.max(0.0001, rawScale);

    const localTime = frame - startFrame;
    const PHASE_DURATION = 90; // ~1.5 seconds per text phase (30fps * 1.5s)
    const FADE_DURATION = 5;
    const TRANSITION_DURATION = 30; // 10 frames for the wipe
// Distance the text travels vertically (must be large enough to clear PILL_HEIGHT/2)
    const TRAVEL_DISTANCE = PILL_HEIGHT/2 * 0.75; 

    // Vertical Wipe Interpolation
    const textOpacityA = interpolate(localTime, [PHASE_DURATION - TRANSITION_DURATION, PHASE_DURATION], [1, 0]);
    
    // CORRECTION 1: Text A must stay at Y=0 (Pill center) until the transition starts.
    const textYA = interpolate(localTime, 
        [0, PHASE_DURATION - TRANSITION_DURATION, PHASE_DURATION], 
        [0, 0, -TRAVEL_DISTANCE], 
        { 
            extrapolateLeft: 'clamp', 
            easing: Easing.in(Easing.cubic) 
        }
    );
    
    const textOpacityB = interpolate(localTime, 
        [PHASE_DURATION, PHASE_DURATION + FADE_DURATION],
        [0, 1], 
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } // <-- ADDED extrapolateLeft
    );
    const textYB = interpolate(localTime, 
    [PHASE_DURATION, PHASE_DURATION + TRANSITION_DURATION], 
    [TRAVEL_DISTANCE, 0], 
    { extrapolateLeft: 'clamp', easing: Easing.out(Easing.cubic) } // <-- Ensures Position is Off-Screen before PHASE_DURATION
        );
    

    return (
        <group position={[0, CTA_GROUP_Y, 0.8]}>
                <Image 
                    url={thumbnailUrl}
                    // CRITICAL FIX: Z must be '1' to be a valid 3D object.
                    // We do NOT multiply Z by scale, preserving your requirement 
                    // that it doesn't "scale up" in depth, but it exists.
                    scale={[thumbWidth * scale, thumbHeight * scale]}
                    transparent
                    radius={0.1}
                />
            

            {/* UNCOMMENTED PILL WITH SAFETY FIXES */}
            {localTime > 10 && (
                <group position={[0, -(PILL_HEIGHT / 2) - (thumbHeight / 2) - 0.1, 0.05]} scale={scale}>
                    <RoundedBox args={[PILL_WIDTH, PILL_HEIGHT, PILL_HEIGHT/1.05]} radius={PILL_RADIUS}>
                        <meshPhysicalMaterial 
                            color="#ffffff"
                            transmission={0.9} 
                            roughness={0.0} 
                            thickness={0.2}
                            //transparent
                            opacity={0.9}
                        />
                    </RoundedBox>
                    
                    {/* FIX 3: Removed 'font' prop to prevent loading crashes */}
                    <Text 
                        position={[0, textYA+0.05, 0.4]} 
                        fontSize={FONT_SIZE_A} 
                        color="#000000" 
                        font={fontUrl} //<--- REMOVED
                        anchorX="center" 
                        anchorY="bottom-baseline"
                        // @ts-ignore
                        fillOpacity={textOpacityA}
                    >
                        {scenario.timeline.cta.social_text}
                    </Text>

                    <Text 
                        position={[0, textYB, 0.4]} 
                        fontSize={FONT_SIZE_B} 
                        color="#000000"
                        strokeWidth={0.2} // Add a small stroke width
                        strokeColor="#000000"
                        font={fontUrl} //<--- REMOVED
                        anchorX="center" 
                        anchorY="bottom-baseline"
                         // @ts-ignore
                        fillOpacity={textOpacityB}
                    >
                        {scenario.timeline.cta.link_text}
                    </Text>
                </group>
            )}
        </group>
    );
};