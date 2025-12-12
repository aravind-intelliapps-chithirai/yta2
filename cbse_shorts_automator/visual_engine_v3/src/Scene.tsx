import React, { Suspense } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Audio, staticFile } from 'remotion';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { AbsoluteFill } from 'remotion';
import { VisualScenario } from './types/schema';
import { getTheme, getVariant } from './utils/theme';
import { ZONES } from './utils/animation';
import { ThreeStage } from './components/ThreeStage';
import { ParticleSystem } from './components/ParticleSystem';
import { NanoText } from './components/Typography';

interface SceneProps {
    scenario: VisualScenario;
}

const SceneContent: React.FC<SceneProps> = ({ scenario }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { height } = useThree((state) => state.viewport); 
    const currentTime = frame / fps;

    const nvuToWorld = (nvu: number) => (nvu - 0.5) * height;

    const theme = getTheme(scenario.meta.seed);
    const variant = getVariant(scenario.meta.seed);
    const { timeline } = scenario;

    // Positions
    const stageY = nvuToWorld((ZONES.STAGE_TOP + ZONES.STAGE_BOTTOM) / 2);
    const questionY = nvuToWorld(ZONES.BRIDGE_BOTTOM + 0.03); 
    const optionsStartY = nvuToWorld(ZONES.INTERACTION_TOP - 0.05);

    const showHook = currentTime < timeline.quiz.question.start_time;
    const showQuestion = currentTime >= timeline.quiz.question.start_time;
    const showOptions = currentTime >= timeline.quiz.options[0].start_time;

    const camZ = interpolate(frame, [0, 50], [6, 5], { extrapolateRight: 'clamp' });

    // ASSET PATHS (Strict Local)
    // Note: The python script puts them in /assets/..., staticFile needs relative path inside public
    const videoSrc = staticFile(scenario.assets.video_source_url);
    const envMapSrc = staticFile('/assets/environment.hdr'); 

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, camZ]} fov={50} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

            <ParticleSystem variant={variant} color={theme.primary} />

            <group position={[0, stageY, 0]}>
                <Suspense fallback={null}>
                     <ThreeStage videoUrl={videoSrc} overlayProgress={0.2} />
                </Suspense>
            </group>

            {showQuestion && (
                <NanoText 
                    text={timeline.quiz.question.text}
                    position={[0, questionY, 0]} 
                    fontSize={height * 0.035} 
                    color="#ffffff"
                    fontUrl={scenario.assets.font_url}
                />
            )}

            {showOptions && timeline.quiz.options.map((opt, i) => {
                const entryTime = opt.start_time * fps;
                const opacity = interpolate(frame, [entryTime, entryTime + 10], [0, 1], { extrapolateRight: 'clamp' });
                const yPos = optionsStartY - (i * (height * 0.11)); 
                
                return (
                    <group key={opt.id} position={[0, yPos, 0]}>
                        <mesh scale={[opacity, opacity, 1]}>
                            <boxGeometry args={[3, height * 0.08, 0.1]} />
                            <meshStandardMaterial color="#222222" transparent opacity={0.9} />
                        </mesh>
                        <NanoText text={opt.text} position={[0, 0, 0.06]} fontSize={height * 0.025} color="white" />
                    </group>
                )
            })}

            {showHook && <NanoText text={timeline.hook.text_content} position={[0, 0, 1]} fontSize={height * 0.06} color={theme.primary} />}
            
            {/* LOCAL ENVIRONMENT ONLY - NO NETWORK */}
            <Suspense fallback={null}>
                <Environment files={envMapSrc} />
            </Suspense>
        </>
    );
};

export const Scene: React.FC<SceneProps> = ({ scenario }) => {
    const theme = getTheme(scenario.meta.seed);
    const audioSrc = staticFile(scenario.assets.audio_url);

    return (
        <AbsoluteFill style={{ background: `radial-gradient(circle, ${theme.bg[0]}, ${theme.bg[1]})` }}>
            <Audio src={audioSrc} />
            <Canvas shadows dpr={[1, 2]}>
                <SceneContent scenario={scenario} />
            </Canvas>
        </AbsoluteFill>
    );
};