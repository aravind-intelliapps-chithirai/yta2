import tinycolor from "tinycolor2";

export interface ThemeColors {
  C1_VOID: string;
  C3_PRIMARY: string;
  C4_HIGHLIGHT: string;
  C6_SOCIAL: string;
  C7_LINK: string;
  C8_OUTRO_ACC: string;
}

const THEMES: ThemeColors[] = [
  // 0: Midnight
  { C1_VOID: "#050B1A", C3_PRIMARY: "#4D9FFF", C4_HIGHLIGHT: "#00F2FF", C6_SOCIAL: "#7000FF", C7_LINK: "#00D1FF", C8_OUTRO_ACC: "#1A3A6D" },
  // 1: Obsidian
  { C1_VOID: "#06120C", C3_PRIMARY: "#52FFB8", C4_HIGHLIGHT: "#00FF41", C6_SOCIAL: "#00A3FF", C7_LINK: "#00FF90", C8_OUTRO_ACC: "#144D2F" },
  // 2: Amethyst
  { C1_VOID: "#0F0514", C3_PRIMARY: "#D480FF", C4_HIGHLIGHT: "#FF00E5", C6_SOCIAL: "#9D00FF", C7_LINK: "#FF70DC", C8_OUTRO_ACC: "#4D1A45" },
  // 3: Charcoal
  { C1_VOID: "#120D0B", C3_PRIMARY: "#FF9F4D", C4_HIGHLIGHT: "#FFD600", C6_SOCIAL: "#FF005C", C7_LINK: "#FFA200", C8_OUTRO_ACC: "#5C2A14" },
  // 4: Crimson
  { C1_VOID: "#140505", C3_PRIMARY: "#FF4D4D", C4_HIGHLIGHT: "#FF0000", C6_SOCIAL: "#FF8A00", C7_LINK: "#FF0055", C8_OUTRO_ACC: "#5C1414" },
];

export const resolveTheme = (seed: number): ThemeColors => {
  return THEMES[seed % 5];
};

// Helper for Outro Logic: "Darkened to 25% Lightness"
export const setLightness = (hex: string, lightness: number) => {
  return tinycolor(hex).toHsl().l > lightness 
    ? tinycolor(hex).lighten(0).setAlpha(1).toHexString() // fallback mock, real logic below
    : tinycolor(hex).toHexString(); 
};
// Correct implementation using HSL override
export const getOutroColor = (hex: string, lPercent: number) => {
    const color = tinycolor(hex).toHsl();
    color.l = lPercent / 100;
    return tinycolor(color).toHexString();
};
