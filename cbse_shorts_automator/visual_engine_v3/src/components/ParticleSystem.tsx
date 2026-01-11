import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Sparkles, Stars } from '@react-three/drei';

interface ParticleSystemProps {
    variant: number; // 0, 1, or 2
    color: string;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ variant, color }) => {
    const ref = useRef<any>();

    useFrame((state) => {
        if (ref.current) {
             // Slowly rotate the entire system
             ref.current.rotation.y += 0.001;
        }
    });

    return (
        <group ref={ref}>
            {/* Variant 0: Rising Bubbles (Sparkles) */}
            {variant === 0 && (
                <Sparkles 
                    count={100} 
                    scale={12} 
                    size={4} 
                    speed={0.4} 
                    opacity={0.5} 
                    color={color}
                    noise={0.2}
                />
            )}
            
            {/* Variant 1: Digital Rain (Downward Sparkles) */}
            {variant === 1 && (
                <Sparkles 
                    count={150} 
                    scale={[10, 10, 10]}  // Give it volume, not a flat plane
                    size={2} 
                    speed={1}  // Positive speed for animation
                    opacity={0.6}
                    noise={[0, 2, 0]}  // Add vertical noise for falling effect
                    color="#00ff00"  // Classic Matrix green
                />
            )}

            {/* Variant 2: Cosmic Dust (Stars + Clouds) */}
            {variant === 2 && (
                <>
                    <Stars radius={25} depth={10} count={500} factor={4} saturation={0} fade speed={0.5} />
                    <Cloud opacity={0.1} speed={0} bounds={[10, 2, 50]} volume={6} segments={4} color={color} fade={10} />
                </>
            )}
        </group>
    );
};