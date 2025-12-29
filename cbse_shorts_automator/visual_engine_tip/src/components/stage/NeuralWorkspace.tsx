import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Points, PointMaterial, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useCurrentFrame,staticFile } from 'remotion';
import { ThemeColors } from '../../constants/Palette';
import { useAudioProcessor } from '../../logic/useAudioProcessor';
import { useCentripetalExit } from '../../logic/useCentripetalExit';

const EQ_L1 = ["d/dx", "∫ f(x)", "lim", "∑", "√-1"];
const EQ_L2 = ["H₂O", "C-C", "NaCl", "O₂", "ΔH"];
const EQ_L3 = ["1+1", "x²", "a+b", "sin(θ)", "π"];
const fontUrl = staticFile("assets/fonts/Inter-Bold.ttf");
//preloadFont(FONT_URL);

const EquationLayer = ({ equations, startZ, speedFactor, opacity, color,  width, height, baseZ }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    //const { width, height } = viewport;
    const frame = useCurrentFrame();
    //const fontUrl = staticFile("assets/fonts/Inter-Bold.ttf");

    // 1. FIX: Stable Random Generation
    // We generate positions once on mount, so they don't jitter on re-render
    const equationData = useMemo(() => {
        return equations.map((eq: string) => ({
            text: eq,
            // Spread relative to viewport size
            x: (Math.random() - 0.5) * width * 1.2,
            y: (Math.random() - 0.5) * height * 1.2,
            zOffset: (Math.random()) * (baseZ * 0.5)
        }));
    }, [equations, width, height, baseZ]);
    
    useFrame(() => {
        if (!groupRef.current) return;
        
        // Speed is relative to the depth of the scene
        // e.g. cross the entire scene depth in X frames
        const movement = speedFactor * baseZ * frame; 
        
        // Loop Logic:
        // Range = Distance from StartZ to Camera (baseZ) + Buffer (0.5 * baseZ)
        // This ensures it wraps cleanly well behind the camera
        const totalTravel = Math.abs(startZ) + (baseZ * 1.5);
        
        const currentZ = (movement % totalTravel);
        
        // Apply position relative to startZ
        groupRef.current.position.z = currentZ; 
    });

    return (
        <group ref={groupRef} position={[0, 0, startZ]}>
            {equationData.map((item: any, i: number) => (
               
                <Text
                    key={i}
                    position={[item.x, item.y, item.zOffset]}
                    fontSize={height * 0.03}
                    color={color}
                    fillOpacity={opacity}
                    font={fontUrl}
                    //transparent // Required for opacity to work
                >
                    {item.text}
                </Text> 
                
            ))}
        </group>
    );
};
 {/* <Text
                    key={i}
                    position={[item.x, item.y, item.zOffset]}
                    fontSize={height * 0.05 *100}
                    color={'red'}
                    fillOpacity={opacity}
                    font={fontUrl}
                    //transparent // Required for opacity to work
                >
                    {item.text}
                </Text> */}
export const NeuralWorkspace = ({ audioSrc, outroStart, palette, width, height, baseZ }: { audioSrc: string, outroStart: number, palette: ThemeColors, width: number, height: number, baseZ: number }) => {
  //const viewport = useThree().viewport;
  const containerRef = useRef<THREE.Group>(null);
  const { subBass } = useAudioProcessor(audioSrc);
  const { scale } = useCentripetalExit(outroStart);
  const frame = useCurrentFrame();
  
  // Audio Reactive Opacity 
  const pulseOpacity = 0+(0.2 + (subBass * 0.15));
  // DYNAMIC FOG CALCULATION:
  // We want ~95% fog opacity at the deepest layer (40 * height)
  // Formula: density = 1.73 / (Depth_in_Units)
  const depthLimit = 5.0 * (baseZ *2);
  const fogDensity = 1.8 / depthLimit;

  // 3. FIX: Stable Points Generation
  const particlePositions = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * width * 1.2;     // X
        pos[i * 3 + 1] = (Math.random() - 0.5) * height * 1.2; // Y
        pos[i * 3 + 2] = baseZ - (Math.random() - 0.5) * 1 * depthLimit;                  // Z
    }
    return pos;
  }, [width, height, baseZ, depthLimit]);

useFrame(() => {
    
    if(containerRef.current) {
        containerRef.current.rotation.y = frame * 0.0005; 
        containerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={containerRef}>
      <fogExp2 attach="fog" args={[palette.C1_VOID, fogDensity]} /> 
      <Box args={[width * 0.5, width * 0.5, width * 0.1]} position={[0, 0, 0]}>
         <meshBasicMaterial color="red" wireframe={true} />
      </Box>
      <EquationLayer equations={EQ_L1} startZ={-0.25 * baseZ} 
        speedFactor={0.000000005 * baseZ} opacity={pulseOpacity} color={palette.C4_HIGHLIGHT} width={width} height={height} baseZ={baseZ}/>
      <EquationLayer equations={EQ_L2} startZ={-0.5 * baseZ} 
        speedFactor={0.00000001 * baseZ} opacity={pulseOpacity * 0.7} color={palette.C4_HIGHLIGHT} width={width} height={height} baseZ={baseZ}/>
      <EquationLayer equations={EQ_L3} startZ={-1.0 * baseZ} 
        speedFactor={0.00000002 * baseZ} opacity={pulseOpacity * 0.5} color={palette.C4_HIGHLIGHT} width={width} height={height} baseZ={baseZ}/>
      
      {/* 4. FIX: Use 'positions' prop correctly for Points */}
      <Points positions={particlePositions}>
         <PointMaterial 
            transparent 
            //color={'red'} 
            color={palette.C4_HIGHLIGHT} 
            size={width * 0.025} 
            opacity={pulseOpacity} 
            sizeAttenuation={true}
            depthWrite={false}
         />
      </Points>
    </group>
  );
};