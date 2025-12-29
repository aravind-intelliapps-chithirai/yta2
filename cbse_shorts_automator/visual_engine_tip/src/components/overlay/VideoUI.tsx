import { AbsoluteFill } from "remotion";
export const VideoUI = () => {
  return (
    <AbsoluteFill style={{ justifyContent: 'space-between', padding: 20, pointerEvents: 'none' }}>
        <div style={{ width: 50, height: 50, backgroundColor: 'white', opacity: 0.1, borderRadius: '50%' }} />
        <div style={{ width: 50, height: 50, backgroundColor: 'white', opacity: 0.1, borderRadius: '50%' }} />
    </AbsoluteFill>
  );
};
