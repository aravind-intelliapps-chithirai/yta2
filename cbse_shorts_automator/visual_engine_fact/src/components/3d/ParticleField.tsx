import React, { useMemo, useRef } from 'react';
import { useVideoConfig, random } from 'remotion';
import { useFrame } from '@react-three/fiber'; 
import * as THREE from 'three';

interface ParticleFieldProps {
    color: string;
    count?: number;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ color, count = 200 }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    // Generate relative positions
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            // We create a "cube" of space around the camera
            const x = (random(i) - 0.5) * 30; 
            const y = (random(i + 1) - 0.5) * 20;
            const z = (random(i + 2) - 0.5) * 40; // Depth of the particle box
            const speed = 0.1 + random(i + 3) * 0.2;
            temp.push({ x, y, z, speed, offset: random(i + 4) * 10 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;
        
        const time = state.clock.getElapsedTime();
        const dummy = new THREE.Object3D();
        const camPos = state.camera.position;

        particles.forEach((p, i) => {
            // 1. POSITION LOGIC: 
            // We take the camera position and add the particle's relative offset.
            // This makes the particle field "travel" with the camera.
            dummy.position.set(
                camPos.x + p.x + Math.sin(time * p.speed + p.offset) * 0.5,
                camPos.y + p.y + Math.cos(time * p.speed + p.offset) * 0.5,
                camPos.z + p.z // Keeps particles relative to Camera Z
            );

            // 2. ANIMATION
            dummy.rotation.set(time * 0.1, time * 0.2, 0);
            const scale = 0.04 + Math.abs(Math.sin(time + p.offset)) * 0.03;
            dummy.scale.set(scale, scale, scale);

            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <dodecahedronGeometry args={[1, 0]} /> 
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.4} 
                blending={THREE.AdditiveBlending}
                depthWrite={false} // Prevents particles from clipping tunnel walls weirdly
            />
        </instancedMesh>
    );
};