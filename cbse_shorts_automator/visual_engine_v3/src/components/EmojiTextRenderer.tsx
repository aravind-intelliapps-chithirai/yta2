// src/components/EmojiTextRenderer.tsx

import React, { useMemo } from 'react';
// FIX: Using Image from drei, which is a more common/stable component for 2D planes
import { Image, useTexture } from '@react-three/drei'; 
import { staticFile } from 'remotion';
import { getEmojiData } from '../utils/emojiData'; 
// !!! ACTION REQUIRED: Correct the path and component name below
import { NanoText } from './Typography'; // <-- CHECK THIS PATH AND EXPORTED NAME

// Define the Props needed for the renderer
interface EmojiTextRendererProps {
    text: string;
    position: [number, number, number];
    fontSize: number; 
    color: string;
    [key: string]: any; 
}

export const EmojiTextRenderer: React.FC<EmojiTextRendererProps> = ({ 
    text, 
    position, 
    fontSize, 
    ...rest 
}) => {
    
    const { map: EMOJI_MAP, regex: EMOJI_REGEX } = getEmojiData();
    const segments = useMemo(() => {
        const parts: { type: 'text' | 'emoji', content: string }[] = [];
        let lastIndex = 0;
        const matches = [...text.matchAll(EMOJI_REGEX)];

        matches.forEach(match => {
            const emoji = match[0];
            const startIndex = match.index!;
            if (startIndex > lastIndex) {
                parts.push({ type: 'text', content: text.substring(lastIndex, startIndex) });
            }
            parts.push({ type: 'emoji', content: emoji });
            lastIndex = startIndex + emoji.length;
        });

        if (lastIndex < text.length) {
            parts.push({ type: 'text', content: text.substring(lastIndex) });
        }
        return parts;
    }, [text, EMOJI_REGEX]);

    const startX = position[0]; 
    let currentX = startX;
    
    // CALIBRATION: These values must be tuned once
    const EMOJI_SIZE_WORLD = fontSize * 1.5; 
    const CHAR_WIDTH_APPROX = fontSize * 0.7; 

    return (
        <group position={[0, position[1], position[2]]}>
            {segments.map((segment, index) => {
                
                if (segment.type === 'text') {
                    if (segment.content.trim().length === 0) return null;
                    
                    const textPosition: [number, number, number] = [currentX, 0, 0];
                    
                    const element = (
                        <NanoText
                            key={index}
                            text={segment.content}
                            position={textPosition}
                            fontSize={fontSize}
                            {...rest} 
                        />
                    );
                    currentX += segment.content.length * CHAR_WIDTH_APPROX;

                    return element;

                } else if (segment.type === 'emoji') {
                    const rawUrl = EMOJI_MAP.get(segment.content);
                    if (!rawUrl) return null;

                        // --- CRITICAL FIX: Wrap the path in staticFile ---
                    const emojiUrl = staticFile(rawUrl);                   
                    // FIX: Use Image component from drei
                    // Position: Shifted by half the emoji size to center it
                    const emojiPosition: [number, number, number] = [currentX + EMOJI_SIZE_WORLD / 2, 0, 0];
                    
                    const element = (
                        <Image 
                            key={index}
                            url={emojiUrl} 
                            position={emojiPosition}
                            scale={[EMOJI_SIZE_WORLD, EMOJI_SIZE_WORLD]}
                            transparent 
                            renderOrder={10} 
                        />
                    );

                    currentX += EMOJI_SIZE_WORLD;

                    return element;
                }
                return null;
            })}
        </group>
    );
};