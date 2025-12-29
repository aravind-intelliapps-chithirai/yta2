import { useState, useEffect } from 'react';
export const useFontFit = (text: string, maxWidth: number, maxHeight: number, startSize: number) => {
  const [fontSize, setFontSize] = useState(startSize);
  useEffect(() => {
    const estimatedArea = text.length * (startSize * 0.6) * startSize;
    const targetArea = maxWidth * maxHeight;
    if (estimatedArea > targetArea) {
      setFontSize(Math.max(12, startSize * Math.sqrt(targetArea / estimatedArea)));
    } else {
      setFontSize(startSize);
    }
  }, [text, maxWidth, maxHeight, startSize]);
  return fontSize;
};
