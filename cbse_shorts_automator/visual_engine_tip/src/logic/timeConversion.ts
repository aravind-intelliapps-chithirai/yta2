import { Timings, SceneTiming } from "../schema";

export const secondsToFrames = (timings: Timings, fps: number): Timings => {
  // Helper to convert individual timing blocks
  const convert = (t: SceneTiming): SceneTiming => ({
    start_time: Math.round(t.start_time * fps),
    duration: Math.round(t.duration * fps)
  });

  // Return a new Timings object with frame values
  return {
    hook: convert(timings.hook),
    tip_title: convert(timings.tip_title),
    tip_details: convert(timings.tip_details),
    bonus: convert(timings.bonus),
    cta_social: convert(timings.cta_social),
    cta_link: convert(timings.cta_link),
    outro: convert(timings.outro),
    // Total Duration is a raw number in the schema
    total_duration: Math.round(timings.total_duration * fps)
  };
};