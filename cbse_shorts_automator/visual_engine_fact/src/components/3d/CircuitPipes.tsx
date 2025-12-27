import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCurrentFrame,interpolate,spring,useVideoConfig } from 'remotion';
import { Theme } from '../../theme/palettes';
import { LAYOUT, TIMING } from '../../constants';
import { FactScenario } from '../../types/schema';

interface CircuitPipesProps {
    theme: Theme;
    progress: number;
    startY: number;    // Bottom of the Knowledge Slate
    endY: number;      // Top of the Title text
    originX: number;   // Center X coordinate
    slateZ: number;    // Depth of the Slate
    titleZ: number;    // Depth of the Title (now locked to slateZ)
    scale: number;     // The responsive scale from the layout logic
    scenario: FactScenario; // Needed for exit timing
    cardTopY: number;    // The new target: Top of the HTML Card
}

export const CircuitPipes: React.FC<CircuitPipesProps> = ({ 
    theme, 
    progress, 
    startY, 
    endY, 
    originX, 
    slateZ, 
    titleZ,
    scale, scenario, cardTopY 
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const pipeZ=titleZ-0.1;

    // --- EXIT TIMING LOGIC ---
    const audioEndFrame = (scenario.timings.t_details + scenario.timings.detailsAudioDuration) * fps;
    const exitStartFrame = audioEndFrame + (TIMING.S2_HANG_DURATION * fps);
    const exitEndFrame = exitStartFrame + TIMING.S2_EXIT_DURATION* fps;

    const exitProgress = interpolate(
            frame,
            [exitStartFrame, exitEndFrame],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

    // The pipe now extends all the way to the cardTopY
    // Combined progress: Entrance (0 to 1) minus Exit (0 to 1)
    const activeProgress = Math.max(0, progress - exitProgress);

    

    // 1. DISTRIBUTION LOGIC
    // We ensure the pipes don't touch by using a fixed minimum spread 
    // that only scales slightly, keeping them proportional to the text.
    const pipeOffsets = useMemo(() => {
        const spread = Math.max(0.25, 0.3 * scale); 
        return [-spread, 0, spread];
    }, [scale]);

    // 2. PATH GENERATION
 /*    const pipes = useMemo(() => {
        // We define the logic for each of the 3 pipes
        return pipeOffsets.map((offset) => {
            // Start point is fixed at the bottom of the Slate
            const p1 = new THREE.Vector3(originX + offset, startY, pipeZ);
            
            // The tip of the pipe (p2) moves based on progress
            // At 0: currentY = startY (Pipe is length 0)
            // At 1: currentY = endY (Pipe is full length)
            const currentY = interpolate(
                activeProgress, 
                [0, 1], 
                [startY, cardTopY], 
                { extrapolateRight: "clamp" }
            );

            const p2 = new THREE.Vector3(originX + offset, currentY, pipeZ);
            
            return new THREE.LineCurve3(p1, p2);
        });
    }, [originX, startY, endY, slateZ, titleZ, pipeOffsets, activeProgress]);
 */

    // Optimization: Create one static unit cylinder. We will scale it linearly.
        const sharedGeometry = useMemo(() => {
            // args: [radiusTop, radiusBottom, height, radialSegments, heightSegments]
            return new THREE.CylinderGeometry(LAYOUT.S2_PIPES.RADIUS, LAYOUT.S2_PIPES.RADIUS, 1, 6, 1);
        }, []);

        // Loop configuration
        const loopDuration = 60; // How many frames for one photon to travel top-to-bottom
        const loopProgress = (frame % loopDuration) / loopDuration;

        // We only show flow if pipes have started growing
        const isPipesGrowing = activeProgress > 0.05;
    return (
            <group>
            {pipeOffsets.map((offset, index) => {
                // A. Calculate the current Tip Y position
                const currentTipY = interpolate(
                    activeProgress, 
                    [0, 1], 
                    [startY, cardTopY], 
                    { extrapolateRight: "clamp" }
                );

                // B. Calculate Linear Transforms (No Trig)
                const length = Math.max(0.0001, Math.abs(currentTipY - startY)); // Prevent 0 scale
                const midPointY = startY - (length / 2);

                return (
                    <mesh 
                        key={`pipe-${index}`}
                        geometry={sharedGeometry}
                        // Move to Midpoint, Shift X by offset
                        position={[originX + offset, midPointY, pipeZ]}
                        // Scale Y to match the calculated length
                        scale={[1, length, 1]}
                    >
                        <meshPhysicalMaterial 
                            color={theme.accent_secondary} 
                            transmission={0.6}
                            opacity={0.3}
                            transparent={true}
                            roughness={0.2}
                            metalness={0.1}
                            clearcoat={1.0}
                            emissive={theme.accent_primary} 
                            emissiveIntensity={0.6}
                        />
                    </mesh>
                );
            })}
                {/* 2. THE CONTINUOUS DATA FLOW */}
                {isPipesGrowing && pipeOffsets.map((offset, index) => {
                    // Photon travels from startY down to the current tip of the growing pipe
                    const currentTipY = interpolate(activeProgress, [0, 1], [startY, cardTopY]);
                    const photonY = interpolate(loopProgress, [0, 1], [startY, currentTipY]);

                    return (
                        <group key={`photon-${index}`}>
                            {/* The physical "bit" of data */}
                            <mesh position={[originX + offset, photonY, pipeZ]}>
                                <sphereGeometry args={[LAYOUT.S2_PIPES.RADIUS * 1.1, 16, 16]} />
                                <meshBasicMaterial 
                                    color={theme.accent_primary} // Pure color, unaffected by lighting
                                    // Emissive property isn't needed on BasicMaterial, but color acts as emission
                                />
                            </mesh>
                            
                            {/* Local light to illuminate the pipe as it passes */}
                            <pointLight 
                                position={[originX + offset, photonY, slateZ + 0.1]} 
                                color={theme.accent_primary}
                                intensity={2}
                                distance={0.5}
                                decay={2}
                            />
                        </group>
                    );
                })}
            </group>
        );
};