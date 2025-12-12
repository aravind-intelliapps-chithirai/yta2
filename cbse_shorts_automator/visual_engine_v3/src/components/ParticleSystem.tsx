import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Cloud, Sparkles, Stars } from '@react-three/drei';
import { staticFile } from 'remotion';

interface ParticleSystemProps {
    variant: number;
    color: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ variant, color }) => {
    const ref = useRef<Group>(null);

    useFrame(() => {
        if (ref.current) {
             ref.current.rotation.y += 0.001;
        }
    });

    return (
        <group ref={ref}>
            {variant === 0 && <Sparkles count={100} scale={12} size={4} speed={0.4} opacity={0.5} color={color} noise={0.2} />}
            {variant === 1 && <Sparkles count={150} scale={[10, 10, 10]} size={3} speed={-0.5} opacity={0.6} color="#ffffff" />}
            {variant === 2 && (
                <>
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    {/* LOCAL TEXTURE LOAD */}
                    <Cloud 
                        texture={staticFile('/assets/cloud.png')} 
                        opacity={0.2} 
                        speed={0.4} 
                        width={10} 
                        depth={1.5} 
                        segments={20} 
                        color={color} 
                    />
                </>
            )}
        </group>
    );
};