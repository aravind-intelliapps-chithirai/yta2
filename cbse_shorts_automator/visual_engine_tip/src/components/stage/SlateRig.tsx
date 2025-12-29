import { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { SPATIAL_MAP, toThreeY } from '../../constants/Config';
import { useCentripetalExit } from '../../logic/useCentripetalExit';
import * as THREE from 'three';

interface SlateRigProps {
    scene3Start: number;
    outroStart: number;
    thumbSrc: string;
    videoSrc: string;
    hookDuration: number; // NEW PROP
}

export const SlateRig = ({ scene3Start, outroStart, thumbSrc, videoSrc, hookDuration }: SlateRigProps) => {
  const { height, width } = useThree().viewport;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const groupRef = useRef<THREE.Group>(null);
  
  // --- VIDEO & TEXTURE SETUP (Preserved) ---
  const [videoElement] = useState(() => {
    const vid = document.createElement('video');
    vid.src = videoSrc;
    vid.crossOrigin = 'Anonymous';
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    return vid;
  });

  const videoTexture = useMemo(() => {
    const tex = new THREE.VideoTexture(videoElement);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.format = THREE.RGBAFormat;
    return tex;
  }, [videoElement]);

  const thumbTexture = useMemo(() => new THREE.TextureLoader().load(thumbSrc), [thumbSrc]);

  // --- GEOMETRY CONSTANTS ---
  const SLATE_W = width * SPATIAL_MAP.SLATE_W;
  const SLATE_H = height * SPATIAL_MAP.SLATE_H;
  const BOX_DEPTH = SLATE_H/25;
  const FACE_OFFSET = (BOX_DEPTH / 2) + 0.01*BOX_DEPTH; // Slight offset to prevent z-fighting

  // --- POSITIONING LOGIC ---
  // 1. Pivot Point (The Fixed Hinge)
  const pivotY = toThreeY(SPATIAL_MAP.SLATE_BTM_Y, height); // 0.335H
  
  // 2. Visual Center for Scene 2 (Instructional)
  const visualY_Scene2 = toThreeY(SPATIAL_MAP.SLATE_INST_Y, height); // 0.19H
  
  // 3. Visual Center for Scene 1 (Hook Slam)
  // Spec 7.1: "reaching Y: 0.50H"
  const visualY_Scene1 = toThreeY(0.50, height); 

  // Calculate the offsets relative to the Pivot
  // When we move the Group, we move the pivot. 
  // We need to shift the mesh so its visual center aligns with target Y.
  const meshOffset = visualY_Scene2 - pivotY;

  // --- ANIMATION LOGIC ---
  const { scale: exitScale } = useCentripetalExit(outroStart);

  // 1. Z-AXIS SLAM (Spec 7.1)
  // "Slams from Z: -1000 to 0 reaching... at 25% of hook.duration"
  const slamDuration = hookDuration * 0.25;
  const entranceZ = interpolate(
      frame,
      [0, slamDuration],
      [-2000*BOX_DEPTH, 0],
      { 
          easing: Easing.out(Easing.exp), // Fast Slam
          extrapolateRight: "clamp" 
      }
  );

  // 2. Y-AXIS SLIDE (Spec 7.1 -> 7.2)
  // Scene 1: Y = 0.50H
  // Scene 2: Y = 0.19H
  // We slide the slate UP during the last 20% of Scene 1 to be ready for Scene 2
  const slideStart = hookDuration * 0.80;
  const slideEnd = hookDuration;
  
  // Interpolate the VISUAL center Y
  const currentVisualY = interpolate(
      frame,
      [0, slideStart, slideEnd],
      [visualY_Scene1, visualY_Scene1, visualY_Scene2], // Hold 0.5H then slide to 0.19H
      { extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
  );

  // Calculate Group Y needed to place Visual Center at CurrentVisualY
  // GroupY + MeshOffset = CurrentVisualY
  // GroupY = CurrentVisualY - MeshOffset
  const currentGroupY = currentVisualY - meshOffset;

  useFrame(() => {
    if (!groupRef.current) return;

    // Video Sync
    const targetTime = frame / fps;
    if (videoElement.duration && Math.abs(videoElement.currentTime - (targetTime % videoElement.duration)) > 3/fps) {
         videoElement.currentTime = targetTime % videoElement.duration;
    }

    // Scene 3 Flip Logic (Preserved)
    const rotationProgress = interpolate(
      frame,
      [scene3Start, scene3Start + (fps * 1.5)], 
      [0, -Math.PI], 
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    
    // Apply Transforms
    groupRef.current.rotation.x = rotationProgress;
    groupRef.current.position.z = entranceZ; // Z Slam
    groupRef.current.position.y = currentGroupY; // Y Slide
    groupRef.current.scale.setScalar(exitScale);
  });

  return (
    // Group moves to position the Pivot/Hinge correctly in space
    <group ref={groupRef} position={[0, currentGroupY, 0]}>
      
      {/* Mesh is offset so the pivot point is at (0,0,0) relative to group */}
      <group position={[0, meshOffset, 0]}>
        
        {/* Body */}
        <mesh>
            <boxGeometry args={[SLATE_W, SLATE_H, BOX_DEPTH]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} emissive="#1a1a1a" emissiveIntensity={0.9}/>
        </mesh>

        {/* Front Face (Video) */}
        <mesh position={[0, 0, FACE_OFFSET]}>
            <planeGeometry args={[SLATE_W, SLATE_H]} />
            <meshStandardMaterial 
                map={videoTexture} 
                emissiveMap={videoTexture} 
                emissive="white" 
                emissiveIntensity={0.2} 
                toneMapped={false} 
            />
        </mesh>

        {/* Back Face (Thumb) */}
        <mesh position={[0, 0, -FACE_OFFSET]} rotation={[Math.PI,0,  0]}>
            <planeGeometry args={[SLATE_W, SLATE_H]} />
            <meshStandardMaterial 
                map={thumbTexture} 
                emissiveMap={thumbTexture} // Use texture as its own light source
                emissive="white"           // Base glow color
                emissiveIntensity={0.6}    // Intensity: Visible in dark, but not washed out
                toneMapped={false}         // Preserves original colors
            />
        </mesh>

      </group>
    </group>
  );
};