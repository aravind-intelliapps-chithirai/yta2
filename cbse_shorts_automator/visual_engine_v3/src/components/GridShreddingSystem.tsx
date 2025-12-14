import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import { Color } from 'three';

// Props match the original component
interface GridShreddingSystemProps {
    startTime: number;
    cardCenterY: number;
    cardWidth: number;
    cardHeight: number;
    color: string;
    fps: number;
}

// Define the size of individual grid fragments
// Smaller = more particles, denser grid. Larger = fewer, blockier particles.
const GRID_FRAGMENT_SIZE = 0.08; 
// --- PHYSICS CONSTANTS ---
// Tune this value to change how heavy the pieces feel.
// A larger negative number means stronger gravity.
const GRAVITY = -15; // World units per second squared

export const GridShreddingSystem: React.FC<GridShreddingSystemProps> = ({
    startTime,
    cardCenterY,
    cardWidth,
    cardHeight,
    color,
    fps,
}) => {
    const frame = useCurrentFrame();
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new Color(color), [color]);

    // 1. Calculate Grid Dimensions
    // We ceil values to ensure the entire card area is covered, even if it doesn't divide perfectly.
    const cols = Math.ceil(cardWidth / GRID_FRAGMENT_SIZE);
    const rows = Math.ceil(cardHeight / GRID_FRAGMENT_SIZE);
    const particleCount = cols * rows;

 // CHANGE: Increase duration to allow pieces to fall
    const EXPLOSION_DURATION_SECONDS = 2.0; 
    const EXPLOSION_START_FRAME = (startTime + 0.03) * fps;
    const EXPLOSION_END_FRAME = EXPLOSION_START_FRAME + EXPLOSION_DURATION_SECONDS * fps;
    // 2. Initialize Grid Positions and Radial Vectors
    // 2. Initialize Grid Positions and Initial Velocities
    const initialData = useMemo(() => {
        // CHANGE: Rename vectorX/Y to velocityX/Y in the type definition
        const data: { initialX: number; initialY: number; velocityX: number; velocityY: number; rotationAxis: THREE.Vector3, rotationSpeed: number }[] = [];
        
        const startX = -(cols * GRID_FRAGMENT_SIZE) / 2 + GRID_FRAGMENT_SIZE / 2;
        const startY = (rows * GRID_FRAGMENT_SIZE) / 2 - GRID_FRAGMENT_SIZE / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // A. Grid Position
                const jitter = GRID_FRAGMENT_SIZE * 0.1; 
                const initialX = startX + c * GRID_FRAGMENT_SIZE + (Math.random() - 0.5) * jitter;
                const initialY = startY - r * GRID_FRAGMENT_SIZE + (Math.random() - 0.5) * jitter;

                // B. Initial Radial Velocity (Explosive Force)
                const angle = Math.atan2(initialY, initialX);
                
                // CHANGE: Use higher magnitude for velocity (units per second)
                const speedVariation = 0.5 + Math.random() * 0.8; 
                const explosionSpeed = 1.5 * speedVariation; 

                // CHANGE: Calculate Velocity
                const velocityX = Math.cos(angle) * explosionSpeed;
                // Add a slight upward bias (+ 0.5) so pieces arc up before falling
                const velocityY = Math.sin(angle) * explosionSpeed + (Math.random() * 0.5);

                // C. Rotation Physics
                const rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
                const rotationSpeed = Math.random() * Math.PI * 2; 

                // CHANGE: Push velocityX/Y instead of vectorX/Y
                data.push({ initialX, initialY, velocityX, velocityY, rotationAxis, rotationSpeed });
            }
        }
        return data;
    }, [cols, rows]);


 useFrame(() => {
        if (!meshRef.current) return;

        const currentFrame = frame;

        // CHANGE: Calculate Time Elapsed in Seconds
        const timeElapsed = Math.max(0, (currentFrame - EXPLOSION_START_FRAME) / fps);

        // CHANGE: Calculate Gravity Drop (0.5 * g * t^2)
        const gravityDrop = 0.5 * GRAVITY * (timeElapsed * timeElapsed);

        for (let i = 0; i < particleCount; i++) {
            const { initialX, initialY, velocityX, velocityY, rotationAxis, rotationSpeed } = initialData[i];

            // 1. Position Update (Physics Formula)
            // X = Initial + Velocity * time
            const x = initialX + velocityX * timeElapsed;
            
            // Y = Initial + Velocity * time + GravityDrop
            const y = initialY + (velocityY * timeElapsed) + gravityDrop;

            // 2. Rotation Update: Continuous rotation based on time
            tempObject.rotation.set(0,0,0); 
            tempObject.rotateOnAxis(rotationAxis, rotationSpeed * timeElapsed);

            // 3. Scale Update: Fade out at the very end
            const scale = interpolate(
                currentFrame,
                [EXPLOSION_END_FRAME - fps * 0.3, EXPLOSION_END_FRAME],
                [1, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) }
            );
            tempObject.scale.setScalar(scale);

            // 4. Set Final Matrix
            tempObject.position.set(x, y + cardCenterY, 0.02);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (frame < EXPLOSION_START_FRAME || frame > EXPLOSION_END_FRAME) {
        return null;
    }

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
            {/* Geometry matches the grid fragment size */}
            <planeGeometry args={[GRID_FRAGMENT_SIZE * 0.95, GRID_FRAGMENT_SIZE * 0.95]} />
            {/* Use double sided material so pieces don't disappear when tumbling */}
            <meshBasicMaterial color={tempColor} side={THREE.DoubleSide} />
        </instancedMesh>
    );
};