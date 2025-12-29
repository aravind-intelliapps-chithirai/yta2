export const SPATIAL_MAP = {
  SLATE_TOP_PAD: 0.05,
  SLATE_W: 0.90,
  SLATE_H: 0.285,
  SLATE_BTM_Y: 0.335,
  SLATE_INST_Y: 0.19,
  HOOK_STACK: 0.50,
  TIP_TITLE: 0.40,
  TIP_DETAILS_START: 0.47,
  TIP_DETAILS_END: 0.75,
  BONUS_Y: 0.45,
  CTA_SOC_Y: 0.20,
  CTA_THUMB_Y: 0.50,
  CTA_LNK_Y: 0.80,
  SAFE_ZONE: 0.22,
  VISUALIZER_Y: 0.96,
};

export const toThreeY = (fraction: number, viewHeight: number) => (0.5 - fraction) * viewHeight;
export const toThreeX = (fraction: number, viewWidth: number) => (fraction - 0.5) * viewWidth;
