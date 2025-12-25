import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../theme/palettes';

export const TravelingBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
    const { camera } = useThree();
    const meshRef = useRef<THREE.Mesh>(null);

    // This ensures the background is always centered on the camera
    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.position.copy(camera.position);
        }
    });

    // Custom Shader to create a vertical gradient
    const uniforms = {
        topColor: { value: new THREE.Color(theme.bg_gradient[1]) }, // Light/Accent
        bottomColor: { value: new THREE.Color(theme.bg_gradient[0]) }, // Dark/Base
        offset: { value: 0 },
        exponent: { value: 0.6 }
    };

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[100, 32, 32]} />
            <shaderMaterial
                uniforms={uniforms}
                vertexShader={`
                    varying vec3 vWorldPosition;
                    void main() {
                        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
                        vWorldPosition = worldPosition.xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                    }
                `}
                fragmentShader={`
                    uniform vec3 topColor;
                    uniform vec3 bottomColor;
                    uniform float offset;
                    uniform float exponent;
                    varying vec3 vWorldPosition;
                    void main() {
                        float h = normalize( vWorldPosition + offset ).y;
                        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
                    }
                `}
                side={THREE.BackSide}
            />
        </mesh>
    );
};