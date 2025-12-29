import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig, staticFile, Audio } from "remotion";
import { useMemo } from "react"; // Added useMemo
import { ExamScenario } from "./schema";
import { NeuralWorkspace } from "./components/stage/NeuralWorkspace";
import { SlateRig } from "./components/stage/SlateRig";
import { CameraRig } from "./components/stage/CameraRig";
import { SceneLighting } from "./components/stage/SceneLighting"; // Import New Module
import { AudioVisualizer } from "./components/overlay/AudioVisualizer";
import { resolveTheme } from "./constants/Palette";
import { secondsToFrames } from "./logic/timeConversion";
import { MonumentalHook } from "./components/ui/MonumentalHook";
import { TipTitle } from "./components/ui/TipTitle";
import { TipDetails } from "./components/ui/TipDetails";
import { BonusPane } from "./components/ui/BonusPane";
import { CTA_Scene } from "./components/ui/CTA_Scene";
import { Outro } from "./components/ui/Outro";
import { VideoUI } from "./components/overlay/VideoUI";

const FOV_FACTOR = 0.9326;
export const Main = ({ data }: { data: ExamScenario }) => {
  // 1. Data Destructuring (No fetching here)
  const { content, assets, meta } = data;
  const { fps } = useVideoConfig(); // Get FPS from context
  console.log("Canvas Resolution:", meta.config.resolution);
  // CHANGE: Convert Input Seconds -> Engine Frames
  const timings = useMemo(() => {
    return secondsToFrames(data.timings, fps);
  }, [data.timings, fps]);
  const palette = resolveTheme(meta.theme_seed);

  const scene2Exit = timings.cta_social.start_time; 
  const scene3Exit = timings.outro.start_time;      
  // Explicit dimensions to force layout
  const width = meta.config.resolution.w;
  const height = meta.config.resolution.h;
  const cameraDistance = height / FOV_FACTOR;
  const hookDurationFrames = timings.hook.duration;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.C1_VOID }}>

      {/* 2. ADD AUDIO PLAYER HERE */}
      {/* This ensures audio plays regardless of visualizer visibility */}
      <Audio src={staticFile(assets.audio_track)} />
      
      {/* LAYER 1: 3D WORLD */}
      <AbsoluteFill>
        <ThreeCanvas
            width={width}
            height={height}
            style={{ background: 'transparent' }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, depth: true }}
            // Fixed FOV 50, Dynamic Z
            camera={{ fov: 50, position: [0, 0, cameraDistance], near: 10, far: 200000 }}
        >
            <SceneLighting palette={palette} baseZ={cameraDistance} scene3Start={timings.cta_social.start_time}
            outroStart={timings.outro.start_time} />
            {/* <NeuralWorkspace audioSrc={staticFile(assets.audio_track)} outroStart={timings.outro.start_time} palette={palette} 
            baseZ={cameraDistance} width={width}
            height={height}
            /> */}
            {/* 2. PASS VIDEO SOURCE TO RIG */}
            <SlateRig 
                scene3Start={timings.cta_social.start_time} 
                outroStart={timings.outro.start_time} 
                thumbSrc={staticFile(assets.thumb_src)}
                videoSrc={staticFile(assets.video_src)} // <--- NEW PROP
                hookDuration={hookDurationFrames}
                
            />
            {/* <AudioVisualizer audioSrc={staticFile(assets.audio_track)} palette={palette} /> */}
            <CameraRig totalDuration={timings.total_duration} scene2Start={timings.tip_title.start_time} 
                scene3Start={timings.cta_social.start_time}
                baseZ={cameraDistance}
                /> 
        </ThreeCanvas>
      </AbsoluteFill>

      {/* LAYER 2: UI ELEMENTS */}
      <MonumentalHook text={content.hook_text} timing={timings.hook} palette={palette} />
      <TipTitle text={content.tip_title} startTime={timings.tip_title.start_time} exitTime={scene2Exit} palette={palette} />
      <TipDetails text={content.tip_details} startTime={timings.tip_details.start_time} exitTime={scene2Exit} />
      <BonusPane text={content.bonus_visual} startTime={timings.bonus.start_time} exitTime={scene2Exit} palette={palette} />
      <CTA_Scene content={content.cta_content} startTime={timings.cta_social.start_time} exitTime={scene3Exit} palette={palette} />
      <Outro content={content.outro_content} startTime={timings.outro.start_time} palette={palette} />

      <VideoUI />

    </AbsoluteFill>
  );
};