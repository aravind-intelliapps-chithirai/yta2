import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RoundedBox, Text, useTexture } from '@react-three/drei';
import { Group, VideoTexture, LinearFilter, DoubleSide } from 'three';
import { useFrame } from '@react-three/fiber';
import { staticFile, useCurrentFrame, useVideoConfig } from 'remotion'; 
import * as THREE from 'three';

interface ThreeStageProps {
    videoUrl: string;
    progressEnd?: number;
    overlayProgress?: number;
    width?: number; // <--- CHANGED: Now accepts a target Width in World Units
    totalDuration?: number; 
    useGPU: boolean;
    onVideoReady?: () => void;
}

export const ThreeStage: React.FC<ThreeStageProps> = ({ 
    videoUrl, 
    progressEnd = 0.5, 
    overlayProgress,
    width = 1.0, // Default to 1 unit wide if not specified
    totalDuration = 420 ,
    useGPU,
    onVideoReady
}) => {
    const currentProgress = overlayProgress ?? progressEnd;
    const groupRef = useRef<Group>(null);
    const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);

    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // --- DIMENSIONS & SCALING LOGIC ---
    const BOX_WIDTH = 1.0; // The "Base" width of our geometry
    const BOX_HEIGHT = 0.5625; // 16:9 Aspect Ratio
    const BOX_DEPTH = 0.05;
    
    // Calculate the Scale Factor to achieve the requested 'width'
    // Logic: Target / Base = Scale
    const scaleFactor = width / BOX_WIDTH;

    // --- HELPER: TIME FORMATTER ---
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const timeString = useMemo(() => {
        const currentSeconds = Math.floor(totalDuration * currentProgress);
        return `${formatTime(currentSeconds)} / ${formatTime(totalDuration)}`;
    }, [currentProgress, totalDuration]);

    // --- VIDEO LOADING ---
    useEffect(() => {
        //console.log("UnResolved:",{videoUrl})
        if (!useGPU) {
            // CPU mode: No video to load, immediately ready
            onVideoReady?.();
            return;
        }
    
        if (!videoUrl) return;
        //const resolvedSrc = staticFile(videoUrl);
        const resolvedSrc = videoUrl;
        const vid = document.createElement('video');
        vid.src = resolvedSrc;
        vid.crossOrigin = 'Anonymous';
        vid.muted = true;
        vid.playsInline = true;
        //console.log("Resolved1:",{resolvedSrc})
        const texture = new VideoTexture(vid);
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        // Wait for video to be ready
        const handleCanPlay = () => {
            console.log('[ThreeStage] 🎥 Video Ready');
            setVideoTexture(texture);
            onVideoReady?.(); // Notify parent
        };
        
        if (vid.readyState >= 2) {
            handleCanPlay();
        } else {
            vid.addEventListener('canplay', handleCanPlay, { once: true });
        }

        return () => {
            vid.pause();
            vid.removeAttribute('src');
            vid.load();
            texture.dispose();
        };
    }, [useGPU,videoUrl, onVideoReady]);

    // --- IMAGE SEQUENCE (CPU Path) ---
const currentFramePath = useMemo(() => {
    if (useGPU) return null;
    const frameNumber = Math.floor(frame) + 1;
    return staticFile(`/assets/video_frames/frame_${String(frameNumber).padStart(5, '0')}.jpg`);
}, [useGPU, frame]);

const imageTexture = currentFramePath ? useTexture(currentFramePath) : null;
// --- SELECT APPROPRIATE TEXTURE ---
const screenTexture = useGPU ? videoTexture : imageTexture;

    // --- SYNC & ANIMATION ---
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.05;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.08) * 0.02;
        }
        if (useGPU &&videoTexture && videoTexture.image) {
            const vid = videoTexture.image as HTMLVideoElement;
            const targetTime = frame / fps;
            if (Math.abs(vid.currentTime - targetTime) > 0.1) vid.currentTime = targetTime;
            videoTexture.needsUpdate = true;
        }
    });

    // Helper Constants
    const SAFE_RADIUS = 0.02; 
    const SCREEN_OFFSET = BOX_DEPTH / 2 + 0.002; 
    const UI_Z = SCREEN_OFFSET + 0.005;
    const IconMaterial = <meshBasicMaterial color="#ffffff" />;

    return (
        // APPLY THE CALCULATED SCALE HERE
        <group ref={groupRef} scale={[scaleFactor, scaleFactor, scaleFactor]}>
            
            {/* 1. CASING */}
            <RoundedBox args={[BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH]} radius={SAFE_RADIUS} smoothness={8}>
                <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.3} envMapIntensity={1.5}/>
            </RoundedBox>

            {/* 2. SCREEN */}
            <group position={[0, 0, SCREEN_OFFSET]}>
                <mesh position={[0, 0, -0.001]}>
                     <planeGeometry args={[BOX_WIDTH - 0.03, BOX_HEIGHT - 0.03]} />
                     <meshBasicMaterial color="#000000" />
                </mesh>
                {screenTexture && (
                    <mesh>
                        <planeGeometry args={[BOX_WIDTH - 0.04, BOX_HEIGHT - 0.04]} />
                        <meshBasicMaterial map={screenTexture} toneMapped={false} side={DoubleSide}/>
                    </mesh>
                )}
            </group>

            {/* 3. YOUTUBE UI OVERLAY */}
            <group position={[0, 0, UI_Z]}>
                
                {/* A. BOTTOM GRADIENT */}
                <mesh position={[0, -BOX_HEIGHT/2 + 0.08, -0.001]}>
                    <planeGeometry args={[BOX_WIDTH - 0.05, 0.16]} />
                    <meshBasicMaterial color="black" transparent opacity={0.6} />
                </mesh>

                {/* B. PROGRESS BAR */}
                <group position={[0, -BOX_HEIGHT / 2 + 0.035, 0]}>
                    <mesh>
                        <planeGeometry args={[BOX_WIDTH * 0.9, 0.008]} />
                        <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
                    </mesh>
                    <mesh position={[-(BOX_WIDTH * 0.9) / 2 + ((BOX_WIDTH * 0.9) * currentProgress) / 2, 0, 0.001]}>
                        <planeGeometry args={[BOX_WIDTH * 0.9 * currentProgress, 0.008]} />
                        <meshBasicMaterial color="#ff0000" />
                    </mesh>
                    <mesh position={[-(BOX_WIDTH * 0.9) / 2 + ((BOX_WIDTH * 0.9) * currentProgress), 0, 0.002]}>
                        <circleGeometry args={[0.012, 16]} />
                        <meshBasicMaterial color="#ff0000" />
                    </mesh>
                </group>

                {/* C. CONTROLS ROW */}
                <group position={[0, -BOX_HEIGHT / 2 + 0.08, 0]}>
                    
                    {/* LEFT ICONS */}
                    <group position={[-0.42, 0, 0]}>
                        <mesh rotation={[0,0,0]}>
                            <circleGeometry args={[0.018, 3]} />
                            {IconMaterial}
                        </mesh>
                    </group>

                    <group position={[-0.37, 0, 0]}>
                        <mesh rotation={[0,0,0]} position={[0,0,0]}>
                            <circleGeometry args={[0.012, 3]} />
                            {IconMaterial}
                        </mesh>
                        <mesh position={[0.015, 0, 0]}>
                            <planeGeometry args={[0.005, 0.024]} />
                            {IconMaterial}
                        </mesh>
                    </group>

                    <group position={[-0.32, 0, 0]}>
                        <mesh position={[-0.01, 0, 0]}>
                            <planeGeometry args={[0.01, 0.015]} />
                            {IconMaterial}
                        </mesh>
                        <mesh position={[0.005, 0, 0]} rotation={[0,0,-Math.PI/4]}>
                            <planeGeometry args={[0.015, 0.015]} />
                            {IconMaterial}
                        </mesh>
                    </group>

                    {/* DYNAMIC TIMESTAMP */}
                    <Text
                        position={[-0.20, 0, 0]}
                        fontSize={0.025}
                        color="white"
                        anchorX="left"
                        anchorY="middle"
                        font={staticFile("assets/font.woff")}
                    >
                        {timeString}
                    </Text>

                    {/* RIGHT ICONS */}
                    <group position={[0.35, 0, 0]}>
                         <mesh>
                            <ringGeometry args={[0.009, 0.014, 16]} />
                            {IconMaterial}
                        </mesh>
                         <mesh>
                            <circleGeometry args={[0.005, 8]} />
                            {IconMaterial}
                        </mesh>
                    </group>

                    {/* FULLSCREEN ICON (Fixed with RingGeometry) */}
                    <group position={[0.42, 0, 0]}>
                        <mesh rotation={[0, 0, Math.PI / 4]}> 
                            <ringGeometry args={[0.013, 0.016, 4]} />
                            <meshBasicMaterial color="white" />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
};