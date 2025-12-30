import { useMemo } from 'react';

export const useFontFit = (
  text: string, 
  containerWidth: number, 
  containerHeight: number, 
  maxFontSize: number = 75
) => {
  return useMemo(() => {
    if (!text || containerWidth <= 0 || containerHeight <= 0) return 12;

    // 1. Find the longest word (to ensure it fits horizontally)
    const words = text.split(' ');
    const longestWordLength = Math.max(...words.map(w => w.length));
    
    // CONSTANTS for "Inter" font (approximate)
    const CHAR_ASPECT = 0.55; // Average Width vs Height
    const LINE_HEIGHT = 1.2;  // Standard leading
    const AREA_PER_CHAR = CHAR_ASPECT * LINE_HEIGHT; // 0.66 area unit

    // 2. CONSTRAINT A: AREA FILL
    // How big can the font be to fill the total W*H area?
    // Area = Count * (Size * Aspect) * (Size * LineHeight)
    // Area = Count * Size^2 * 0.66
    // Size = sqrt( Area / (Count * 0.66) )
    const totalChars = text.length;
    const areaSize = Math.sqrt((containerWidth * containerHeight) / (totalChars * AREA_PER_CHAR));

    // 3. CONSTRAINT B: WIDTH LIMIT
    // The longest word must not exceed the container width
    const widthSize = containerWidth / (longestWordLength * CHAR_ASPECT);

    // 4. PICK THE LIMITING FACTOR
    // usually 'areaSize' allows growth, but 'widthSize' stops overflow
    const bestFit = Math.min(areaSize, widthSize);

    // 5. Clamp
    return Math.min(Math.max(16, bestFit), maxFontSize);
  }, [text, containerWidth, containerHeight, maxFontSize]);
};