import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Points, PointMaterial, Box } from '@react-three/drei';
import * as THREE from 'three';
import { useCurrentFrame,staticFile, random } from 'remotion';
import { ThemeColors } from '../../constants/Palette';
import { useAudioProcessor } from '../../logic/useAudioProcessor';
import { useCentripetalExit } from '../../logic/useCentripetalExit';

// 1. EXPANDED EDU-TECH TOKENS
const RAW_TOKENS = [
  // Math & Physics
  "d/dx", "∫ f(x)", "∑", "1+1", "x²", "a+b","√-1", "π", "E=mc²", "sin(θ)", "ΔH", "λ", "Ω", "∞", "lim",
  // Chemistry & Bio
  "H₂O", "DNA", "ATP", "pH", "CO₂", "C-C", "O₂", "RNA", "Fe", "mitosis", "cell",
  // Comp Sci & Logic
  "if()", "&&", "||", "0x00", "{}", "Array", "O(n)", "SQL", "div", "API", "git",
  // Economics & Social
  "$", "GDP", "Supply", "Demand", "Law", "Vote", "Map", "Civic", "Tax", "Trade",
  // Grammar & Lit
  "Noun", "Verb", "?", "!", " Prose", "Poet", "Act I", "Edit", "Draft"
];

// Utility: Fisher-Yates Shuffle with Seed
// We use a deterministic seed so the background stays constant for a specific render
const shuffle = (array: string[], seed: number) => {
  const m = array.length;
  const t = array.slice(); // Copy
  let i = 0;
  while (i < m) {
    const r = Math.floor(random(seed + i) * m);
    const tmp = t[i];
    t[i] = t[r];
    t[r] = tmp;
    i++;
  }
  return t;
};

const EQ_L1 = ["d/dx", "∫ f(x)", "lim", "∑", "√-1"];
const EQ_L2 = ["H₂O", "C-C", "NaCl", "O₂", "ΔH"];
const EQ_L3 = ["1+1", "x²", "a+b", "sin(θ)", "π"];
const fontUrl = staticFile("assets/fonts/Inter-Bold.ttf");
//preloadFont(FONT_URL);

const EquationLayer = ({ equations, startZ, speedFactor, opacity, color,  width, height, baseZ, seed }: any) => {
    const groupRef = useRef<THREE.Group>(null);
    //const { width, height } = viewport;
    const frame = useCurrentFrame();
    //const fontUrl = staticFile("assets/fonts/Inter-Bold.ttf");

    // 1. FIX: Stable Random Generation
    // We generate positions once on mount, so they don't jitter on re-render
 const equationData = useMemo(() => {
        return equations.map((eq: string, i: number) => {
            // FIX: Use Deterministic Randomness (Remotion 'random')
            // Using 'seed + i' ensures each item gets a unique but FIXED position.
            // Even if the component re-renders, these numbers will be identical.
            
            // Generate unique seeds for each property
            const rngX = random(seed + i * 11.1);
            const rngY = random(seed + i * 22.2);
            const rngZ = random(seed + i * 33.3);
            const rngS = random(seed + i * 44.4);

            return {
                text: eq,
                x: (rngX - 0.5) * width * 1.1,
                y: (rngY - 0.5) * height * 1.1,
                zOffset: rngZ * (baseZ * 0.5),
                scale: 0.3 + (rngS * 0.7) 
            };
        });
    }, [equations, width, height, baseZ, seed]); // Depend on stable seed
    
    useFrame(() => {
        if (!groupRef.current) return;
        
        // Speed is relative to the depth of the scene
        // e.g. cross the entire scene depth in X frames
        const movement = speedFactor * baseZ * frame; 
        
        // Loop Logic:
        // Range = Distance from StartZ to Camera (baseZ) + Buffer (0.5 * baseZ)
        // This ensures it wraps cleanly well behind the camera
        const totalTravel = Math.abs(startZ) + (baseZ * 1.0);
        
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
                    fontSize={height * 0.03 * item.scale}
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
export const NeuralWorkspace = ({ audioSrc, outroStart, palette, width, height, baseZ,seed }: { audioSrc: string, outroStart: number, palette: ThemeColors, width: number, height: number, baseZ: number, seed:number }) => {
  //const viewport = useThree().viewport;
  const containerRef = useRef<THREE.Group>(null);
  const { subBass } = useAudioProcessor(audioSrc);
  const { scale } = useCentripetalExit(outroStart);
  const frame = useCurrentFrame();
  // 2. SHUFFLE LAYERS
  // We use a seed based on the palette color to ensure consistency per video
  // but variety across different themes.
  //const seed = palette.C3_PRIMARY.length; // Simple numeric seed
  const shuffled = useMemo(() => shuffle(RAW_TOKENS, seed), [seed]);
  
  // Slice the shuffled array into 3 layers
 // FIX: MEMOIZE LAYERS to prevent array reference changes
  const { layer1, layer2, layer3 } = useMemo(() => {
      const s = shuffle(RAW_TOKENS, seed);
      return {
          layer1: s.slice(0, 15),
          layer2: s.slice(15, 30),
          layer3: s.slice(30, 45)
      };
  }, [seed]); // Only re-run if global seed changes
  const initialRotationY = useMemo(() => {
    return random(seed) * Math.PI / 4;
  }, [seed]);
  // Audio Reactive Opacity 
  const pulseOpacity = 0+(0.15 + (subBass * 0.15));
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
        // Use deterministic random based on seed for particles too
        const r1 = random(seed + i * 0.1);
        const r2 = random(seed + i * 0.2);
        const r3 = random(seed + i * 0.3);

        pos[i * 3] = (r1 - 0.5) * width * 1.2;     
        pos[i * 3 + 1] = (r2 - 0.5) * height * 1.2; 
        pos[i * 3 + 2] = baseZ - (r3 - 0.5) * 1 * depthLimit;
    }
    return pos;
  }, [width, height, baseZ, depthLimit]);

useFrame(() => {
    
    if(containerRef.current) {
        containerRef.current.rotation.y = initialRotationY+frame * 0.005; 
        containerRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={containerRef}>
      <fogExp2 attach="fog" args={[palette.C1_VOID, fogDensity]} /> 
      {/* <Box args={[width * 0.5, width * 0.5, width * 0.1]} position={[0, 0, 0]}>
         <meshBasicMaterial color="red" wireframe={true} />
      </Box> */}
      <EquationLayer equations={layer1} startZ={-0.25 * baseZ} seed={seed + 1}
        speedFactor={0.000000005 * baseZ} opacity={pulseOpacity} color={palette.C4_HIGHLIGHT} width={width} height={height} baseZ={baseZ}/>
      <EquationLayer equations={layer2} startZ={-0.5 * baseZ} seed={seed + 2} 
        speedFactor={0.00000001 * baseZ} opacity={pulseOpacity * 0.7} color={palette.C4_HIGHLIGHT} width={width} height={height} baseZ={baseZ}/>
      <EquationLayer equations={layer3} startZ={-1.0 * baseZ} seed={seed + 3} 
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