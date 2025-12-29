import React from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export const SceneContent: React.FC<any> = () => {
    // 🔍 LOG: Verify component mounting
    console.log("[Frame 0] 🟥 Mounting Red Box Test");

    return (
        <>
            {/* 1. Force Background to Blue (Verify Canvas is opaque) */}
            <color attach="background" args={['#122A4E']} />

            {/* 2. Red Box at Center */}
            <mesh position={[0, 3, 0]}>
                <boxGeometry args={[3, 3, 3]} />
                <meshBasicMaterial color="red" side={THREE.DoubleSide} />
            </mesh>

            {/* 3. Camera positioned 10 units back */}
            <PerspectiveCamera 
                makeDefault 
                position={[0, 0, 10]} 
                fov={50}
                onUpdate={c => c.lookAt(0, 0, 0)}
            />
            
            {/* 4. Light */}
            <ambientLight intensity={1} />
        </>
    );
};