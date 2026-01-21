import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cloud, Sparkles, Stars } from '@react-three/drei';


const DigitalRain: React.FC<{ color: string }> = ({ color }) => {
    const particlesRef = useRef<any>();
    const particleCount = 150;
    
    // Initialize random positions and velocities
    const particles = useRef(
        Array.from({ length: particleCount }, () => ({
            x: (Math.random() - 0.5) * 20,
            y: Math.random() * 20 - 10,
            z: (Math.random() - 0.5) * 20,
            speed: 0.02 + Math.random() * 0.05
        }))
    ).current;

    useFrame(() => {
        if (particlesRef.current) {
            const positions = particlesRef.current.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = particles[i];
                
                // Move particle down
                particle.y -= particle.speed;
                
                // Reset to top when it goes below
                if (particle.y < -10) {
                    particle.y = 10;
                    particle.x = (Math.random() - 0.5) * 20;
                    particle.z = (Math.random() - 0.5) * 20;
                }
                
                // Update position in geometry
                positions[i * 3] = particle.x;
                positions[i * 3 + 1] = particle.y;
                positions[i * 3 + 2] = particle.z;
            }
            
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    const positions = new Float32Array(particleCount * 3);
    particles.forEach((p, i) => {
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={particleCount}
                    array={positions}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={0.10} color={color} transparent opacity={0.6} />
        </points>
    );
};

interface ParticleSystemProps {
    variant: number; // 0, 1, or 2
    color: string;
}


export const ParticleSystem: React.FC<ParticleSystemProps> = ({ variant, color }) => {
    const ref = useRef<any>();

    useFrame((state) => {
        if (ref.current && variant !== 1) {
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
                //<Sparkles 
                    //count={150} 
                    //scale={[10, 10, 10]}  // Give it volume, not a flat plane
                    //size={10} 
                    //speed={1}  // Positive speed for animation
                   //opacity={0.6}
                    //noise={[0.5, 0.1, 0]}  // Add vertical noise for falling effect
                   // color="#00ff00"  // Classic Matrix green
                ///>
                <DigitalRain color="#00ff00" />
            )}

            {/* Variant 2: Cosmic Dust (Stars + Clouds) */}
            {variant === 2 && (
                <>
                    <Stars radius={25} depth={10} count={500} factor={4} saturation={1} fade speed={0.5} />
                    <Cloud opacity={0.1} speed={0} bounds={[10, 2, 50]} volume={6} segments={4} color={color} fade={10} />
                </>
            )}
        </group>
    );
};