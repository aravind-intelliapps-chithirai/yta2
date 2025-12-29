/// <reference types="@react-three/fiber" />
import { ThemeColors } from "../../constants/Palette";

export const SceneLighting = ({ palette }: { palette: ThemeColors }) => {
  return (
    <>
      {/* Global Ambient: Intensity 0.45, Color C1 (Void) [cite: 119] */}
      <ambientLight intensity={0.45} color={palette.C1_VOID} />

      {/* Top-Down Directional: Position [0, 10, 5], Intensity 1.1 [cite: 120] */}
      <directionalLight position={[0, 10, 5]} intensity={1.1} />

      {/* Spotlight: Position [5, 3, 2] - Adds definition to the scene */}
      <spotLight 
        position={[5, 3, 2]} 
        intensity={1} 
        penumbra={1} 
        color="#ffffff" 
      />
    </>
  );
};