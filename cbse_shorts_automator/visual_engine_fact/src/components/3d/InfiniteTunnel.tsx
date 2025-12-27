import React, { useMemo, useRef, useState } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../theme/palettes';
import { SCENE_1_CONFIG } from '../../constants';
import { Edges } from '@react-three/drei'
import { FactScenario } from '../../types/schema';

// --- 1. DETERMINISTIC RANDOM HELPER ---
// This ensures that "random" is exactly the same across all render threads.
function mulberry32(a: number) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const createSVGTexture = (brandColor: string, randVal: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 1. Data Pools
    const subjects = [
        { name: 'SCIENCE', emoji: '🔬' },
        { name: 'MATHS', emoji: '📐' },
        { name: 'ENGLISH', emoji: '📖' },
        { name: 'HISTORY', emoji: '🏺' },
        { name: 'PHYSICS', emoji: '⚡' },
        { name: 'GEOGRAPHY', emoji: '🌍' }
    ];
    const classes = ['CLASS 8', 'CLASS 9', 'CLASS 10', 'CLASS 12'];
    const chapters = ['CH-01', 'CH-05', 'CH-07', 'CH-12', 'CH-15'];

    const mode = Math.floor((randVal * 100) % 3);
    let topText = "";
    let emoji = "";
    const pick = (arr: any[], seedOffset: number) => {
        const idx = Math.floor(((randVal * seedOffset) % 1) * arr.length);
        return arr[idx];
    };

    if (mode === 0) {
        const item = pick(subjects, 7919);
        //const item = subjects[Math.floor(Math.random() * subjects.length)];
        topText = item.name; emoji = item.emoji;
    } else if (mode === 1) {
        topText = pick(classes, 5323);
        //topText = classes[Math.floor(Math.random() * classes.length)]; 
        emoji = '🏫';
    } else {
        topText = pick(chapters, 1237);
        //topText = chapters[Math.floor(Math.random() * chapters.length)];
        emoji = '📑';
    }

    // 2. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Emoji & Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '100px serif'; 
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 8;
    ctx.fillText(emoji, canvas.width * 0.35, canvas.height / 2 - 5);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(topText, canvas.width * 0.58, canvas.height / 2);

    // --- 4. YOUTUBE STYLE PROGRESS BAR ---
    const barPadding = 0; // Set to 0 to make it hit the edges like YT thumbnails
    const barHeight = 6;
    const barY = canvas.height - barHeight -10;
    
    // Grey Background Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(barPadding, barY, canvas.width - (barPadding * 2), barHeight);

    // Random Progress (25% to 65%)
    const progressPercent = ((randVal * 9973) % 1) * (0.65 - 0.25) + 0.25;
    const progressWidth = (canvas.width - (barPadding * 2)) * progressPercent;

    // Red Progress Bar
    ctx.fillStyle = brandColor; // YouTube Red
    ctx.fillRect(barPadding, barY, progressWidth, barHeight);

    // Optional: Scrubber (the little red dot)
    /* ctx.beginPath();
    ctx.arc(barPadding + progressWidth, barY + (barHeight/2), 5, 0, Math.PI * 2);
    ctx.fill();
    */

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
};

// The Environment: Infinite Library
export const InfiniteTunnel: React.FC<{ theme: Theme; 
                                        vp_width:number
                                        slateWidth:number
                                        opacity:number, scenario:FactScenario}> = 
                                        ({ theme, 
                                            vp_width, 
                                            slateWidth,opacity,scenario}) => {
    const {  TUNNEL_LENGTH, BOX_W_FACT, BOX_H_FACT} = SCENE_1_CONFIG;
    //const { GRID_X_COUNT,GRID_Y_COUNT,GRID_Z_COUNT, TUNNEL_LENGTH, BOX_W_FACT, BOX_H_FACT} = SCENE_1_CONFIG;

    //const vp_width=10;
    const vp_height=vp_width*1.777777;

    const GRID_X_COUNT = scenario.meta.config.grid_counts.x;
    const GRID_Y_COUNT = scenario.meta.config.grid_counts.y;
    const GRID_Z_COUNT = scenario.meta.config.grid_counts.z;
    const boxwidth_plus_gap = slateWidth/BOX_W_FACT;
    const boxwidth=slateWidth;
    const boxheight=boxwidth * 0.5625;
    const boxheight_plus_gap = boxheight / BOX_H_FACT;
    
    //const boxwidth_plus_gap = vp_width / GRID_X_COUNT;
    //const boxheight_plus_gap = vp_height / GRID_Y_COUNT;
    //const boxwidth = boxwidth_plus_gap*BOX_W_FACT;
    //const boxheight = boxwidth/1.7777;
    //const SPACING_X = boxwidth_plus_gap-boxwidth;
    //const SPACING_Y = boxheight_plus_gap-boxheight;
    const SPACING_Z =  TUNNEL_LENGTH/GRID_Z_COUNT;
    const brandColor = theme.brand_youtube;
    // --- SEEDING ---
    // Create a PRNG function seeded by the scenario data.
    // This function will return the SAME sequence of numbers on every render thread.
    const seed = scenario.meta.theme_seed || 12345;

    // Create a larger pool of unique textures
// We initialize texturePool ONLY ONCE using useState. 
    // But inside, we generate them deterministically.
    const [texturePool] = useState(() => {
        const rand = mulberry32(seed); // Initialize PRNG
        return Array.from({ length: 20 }, () => createSVGTexture(brandColor, rand()));
    });
    const gridData = useMemo(() => {
        // Initialize 20 empty arrays
        const groups: [number, number, number][][] = Array.from({ length: texturePool.length }, () => []);
        // Re-initialize a fresh PRNG for placement so it's independent of texture generation
        // using a slightly different seed to avoid correlation
        const rand = mulberry32(seed + 999);
        
        for (let z = 0; z < GRID_Z_COUNT; z++) {
            for (let y = 0; y < GRID_Y_COUNT; y++) {
                for (let x = 0; x < GRID_X_COUNT; x++) {
                    const textureIndex = Math.floor(rand() * texturePool.length);
                    
                    const pos: [number, number, number] = [
                        (x - (GRID_X_COUNT - 1) / 2) * boxwidth_plus_gap,
                        (y - (GRID_Y_COUNT - 1) / 2) * boxheight_plus_gap,
                        -z * SPACING_Z
                    ];
                    
                    groups[textureIndex].push(pos);
                }
            }
        }
        return groups;
    }, []);
//    }, [texturePool.length, GRID_X_COUNT, GRID_Y_COUNT, GRID_Z_COUNT, boxwidth_plus_gap, boxheight_plus_gap, SPACING_Z]);
    // Shared Material Props for the dark casing (Materials 0,1,2,3,5)
    const darkMaterialProps = {
        color: theme.accent_secondary,
        transparent: true,
        opacity: opacity * 0.4,
        emissive: "#000000",
        emissiveIntensity: 0.15,
        roughness: 0.2,
        metalness: 0.2,
        side: THREE.FrontSide // Optimization: Only render front faces
    };

    /* const gridItems = useMemo(() => {
        const items = [];
        for (let z = 0; z < GRID_Z_COUNT; z++) {
            for (let y = 0; y < GRID_Y_COUNT; y++) {
                for (let x = 0; x < GRID_X_COUNT; x++) {
                    items.push({
                        position: [
                            (x - (GRID_X_COUNT - 1) / 2) * boxwidth_plus_gap,
                            (y - (GRID_Y_COUNT - 1) / 2) * boxheight_plus_gap,
                            -z * (SPACING_Z )
                        ],
                        texture: texturePool[Math.floor(Math.random() * texturePool.length)]
                    });
                }
            }
        }
        return items;
    }, [texturePool]); */

    // Procedural generation of cube positions
    /* const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < CUBE_COUNT; i++) {
            const x = (Math.random() - 0.25) * 100;
            const y = (Math.random() - 0.75) * 100;
            const z = -Math.random() * TUNNEL_LENGTH/2;
            const scale = Math.random() * 2 + 0.5;
            temp.push({ x, y, z, scale });
        }
        return temp;
    }, [CUBE_COUNT, TUNNEL_LENGTH]); */

    return (
        <group >
            {/* Volumetric Fog matching BG */}
            <fog attach="fog" args={[theme.bg_gradient_outer, 5, TUNNEL_LENGTH]} />
            {/* Render one Instances group per Texture Type */}
            {texturePool.map((texture, i) => (
                <Instances
                    key={i}
                    range={gridData[i].length} // Limit buffer to exact count
                >
                    {/* DEFINE GEOMETRY & MATERIALS ONCE PER GROUP */}
                    <boxGeometry args={[boxwidth, boxheight, boxheight * 0.05]} />

                    {/* Materials 0-3: Sides (Dark) */}
                    <meshStandardMaterial attach="material-0" {...darkMaterialProps} />
                    <meshStandardMaterial attach="material-1" {...darkMaterialProps} />
                    <meshStandardMaterial attach="material-2" {...darkMaterialProps} />
                    <meshStandardMaterial attach="material-3" {...darkMaterialProps} />

                    {/* Material 4: The Unique Texture Face */}
                    <meshStandardMaterial 
                        attach="material-4" 
                        map={texture} 
                        roughness={0.4} 
                        metalness={0} 
                        transparent 
                        opacity={opacity} 
                    />

                    {/* Material 5: Back (Dark) */}
                    <meshStandardMaterial attach="material-5" {...darkMaterialProps} />

                    {/* LIGHTWEIGHT INSTANCES */}
                    {gridData[i].map((pos, j) => (
                        <Instance key={j} position={pos} />
                    ))}
                </Instances> 
            ))}
            
            
        </group>
    );
};
