import { z } from "zod";

export interface Resolution { w: number; h: number; }
export interface Config { resolution: Resolution; fps: number; }
export interface Meta { theme_seed: number; config: Config; }

export interface Assets {
  video_src: string;
  thumb_src: string;
  logo_src: string;
  audio_track: string;
}

export interface SceneTiming { start_time: number; duration: number; }
export interface Timings {
  hook: SceneTiming;
  tip_title: SceneTiming;
  tip_details: SceneTiming;
  bonus: SceneTiming;
  cta_social: SceneTiming;
  cta_link: SceneTiming;
  outro: SceneTiming;
  total_duration: number;
}

export interface CtaContent { social_text: string; link_text: string; }
export interface OutroContent { usp_line_1: string; usp_line_2: string; }

export interface Content {
  hook_text: string;
  tip_title: string;
  tip_details: string;
  bonus_visual: string;
  cta_content: CtaContent;
  outro_content: OutroContent;
  usp_badge_text: string;
  watermark_text: string;
  copyright_text: string;
}

export interface VisualOverrides {
  padding_x_fraction: number;
  safe_zone_b_fraction: number;
  bonus_pos_fraction: { x: number; y: number; };
}

export interface ExamScenario {
  meta: Meta;
  assets: Assets;
  timings: Timings;
  content: Content;
  overrides?: VisualOverrides;
}

export const examScenarioSchema = z.object({
  meta: z.object({
    theme_seed: z.number(),
    config: z.object({
      resolution: z.object({ w: z.number(), h: z.number() }),
      fps: z.number(),
    }),
  }),
  assets: z.object({
    video_src: z.string(),
    thumb_src: z.string(),
    logo_src: z.string(),
    audio_track: z.string(),
  }),
  timings: z.any(),
  content: z.any(),
  overrides: z.optional(z.any()),
});
// NEW: Add this wrapper schema to match the props passed to Main ({ data: ... })
export const mainCompositionSchema = z.object({
  data: examScenarioSchema
});