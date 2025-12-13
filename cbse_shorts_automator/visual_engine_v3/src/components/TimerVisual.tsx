import React, { useMemo } from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { NanoText } from './Typography'; // Assuming this is the correct path
import * as THREE from 'three'; 
import { RingGeometry } from 'three'; // Explicit import for clarity

interface TimerVisualProps {
    startTime: number; // Time in seconds when the countdown starts
    endTime: number; // Time in seconds when the countdown ends (0 remaining)
    theme: { primary: string; secondary: string; [key: string]: any };
    fps: number;
    height: number;
    positionY: number; // World Y position
}

const TIMER_RADIUS = 0.8; // World units
const RIM_THICKNESS = 0.08; 

export const TimerVisual: React.FC<TimerVisualProps> = ({
    startTime,
    endTime,
    theme,
    fps,
    height,
    positionY,
}) => {
    const frame = useCurrentFrame();
    const currentTime = frame / fps;

    // --- 1. TIME LOGIC ---
    const totalDuration = endTime - startTime;
    const timeElapsed = currentTime - startTime;
    const rawTimeRemaining = Math.max(0, totalDuration - timeElapsed);
    
    const currentSecond = Math.ceil(rawTimeRemaining);
    const timeRatio = Math.min(1, Math.max(0, rawTimeRemaining / totalDuration));

    // --- 2. NUMERIC COUNTDOWN ANIMATION ---
    
    const secondFraction = rawTimeRemaining - Math.floor(rawTimeRemaining);
    const transitionProgress = interpolate(
        secondFraction,
        [0.8, 0.9999, 1.0], 
        [0, 1.0, 1.0]
    );

    // Use a single number for scale since we are scaling uniformly
    const scaleFactor = interpolate(transitionProgress, [0, 1], [1.3, 1.0]); 
    const opacity = interpolate(transitionProgress, [0, 0.5], [0.3, 1.0], { extrapolateRight: 'clamp' });
    
    const displayTime = Math.max(0, currentSecond).toString();


    // --- 3. CIRCULAR PROGRESS BAR (Procedural Geometry) ---
    
    // The angle in radians for the arc. Full circle is $2\pi$.
    const maxAngle = Math.PI * 2;
    const startAngle = Math.PI / 2; // Start from the top (90 degrees)
    const thetaLength = timeRatio * maxAngle; 

    // FIX for Error 1: Use useMemo to create the geometry and let R3F manage it.
    // The mesh will use this geometry object directly.
    const proceduralRingGeometry = useMemo(() => {
        // parameters: innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength
        return new RingGeometry(
            TIMER_RADIUS - RIM_THICKNESS, 
            TIMER_RADIUS, 
            64, // High segments for smoothness
            1,  // Vertical segments
            startAngle,
            thetaLength 
        );
    }, [thetaLength, startAngle]); // Recreate geometry when thetaLength changes

    // The scale of the entire visual block
    const finalScale = height * 0.1; 

    return (
        <group 
            position={[0, positionY, 1]} 
            scale={[finalScale, finalScale, finalScale]}
            rotation={[0, 0, 0]} 
        >
            {/* A. The Circular Progress Bar Track (RingGeometry) */}
            <mesh rotation={[0, 0, 0 ]}> 
                {/* FIX: Attach geometry as a child element */}
                <primitive object={proceduralRingGeometry} attach="geometry" />
                
                <meshStandardMaterial
                    color={theme.primary}
                    emissive={theme.primary}
                    emissiveIntensity={0.5 + timeRatio * 0.5} 
                    metalness={0.5}
                    roughness={0.1}
                    transparent={true}
                    opacity={0.8}
                    side={THREE.DoubleSide} 
                />
            </mesh>
            
            {/* B. The Numeric Countdown (Centered) */}
            <NanoText
                text={displayTime}
                position={[0, 0, 0.05]} 
                fontSize={TIMER_RADIUS * 1.5} 
                color={theme.primary}
                // FIX for Error 2: scale must be passed to the component, not directly to R3F elements via attribute
                //scale={[scaleFactor, scaleFactor, 1]} 
                material-opacity={opacity}
                material-transparent={true}
            />
        </group>
    );
};