import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const useAudioProcessor = (source: string) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(source);

  if (!audioData) return { subBass: 0, spectrum: new Array(128).fill(0) };

  const subBass = visualizeAudio({
    fps, frame, audioData,
    numberOfSamples: 16,
    smoothing: true,
  });

  const spectrum = visualizeAudio({
    fps, frame, audioData,
    numberOfSamples: 128, 
    smoothing: true,
  });

  return { subBass: subBass[0], spectrum };
};
