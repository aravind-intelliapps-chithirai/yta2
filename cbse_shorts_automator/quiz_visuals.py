"""
File: quiz_visuals.py
Handles the visual composition for the Quiz Template.
STEP 2: Implements Glass Panel for QUESTION element ONLY.
FIXED: NameError by correctly initializing p_theme and PREMIUM_THEMES dependency.
"""

from moviepy.editor import TextClip, ColorClip, vfx, VideoFileClip 
import os # Required for internal helpers/cleanup
import glob # Required for internal helpers/cleanup

# --- REQUIRED IMPORTS FOR PREMIUM VISUALS ---
from visual_fx_utils import PREMIUM_THEMES, create_glass_panel 
# --------------------------------------------

WIDTH = 1080
HEIGHT = 1920

def force_rgb(clip):
    """Helper to ensure clips are in RGB mode to prevent rendering errors."""
    try:
        if hasattr(clip, 'img') and clip.img is not None and clip.img.ndim == 2:
            return clip.fx(vfx.to_RGB)
    except: pass
    return clip

def filter_and_trim_clips(clips, limit):
    # ... (Trimming/Filtering logic remains unchanged) ...
    if not limit or limit <= 0: return clips
    valid_clips = []
    
    for i, clip in enumerate(clips):
        
        if not hasattr(clip, 'start') or clip.start is None:
            clip.start = 0
            
        current_dur = clip.duration if clip.duration is not None else (limit * 2)
            
        if clip.start >= limit:
            continue
            
        if clip.start + current_dur > limit:
            new_dur = limit - clip.start
            clip = clip.set_duration(new_dur)
            
        valid_clips.append(clip)
    
    return valid_clips

def build_quiz_visuals(engine, video_proc, video_path, script, timings, total_dur, config):
    """
    Constructs the visual layers for the quiz.
    STEP 2: Implements Glass Panel for QUESTION.
    """
    
    # 0. Check for Test Render Limit
    render_limit = config.get('test_render_limit')
    original_total_dur = total_dur 
    if render_limit and isinstance(render_limit, (int, float)) and render_limit > 0:
        total_dur = min(total_dur, render_limit)
    
    # --- FIX: INITIALIZE PREMIUM THEME FOR GLASS PANEL STYLING ---
    p_theme_key = config.get('theme', 'midnight_gold') # Use config theme or default
    p_theme = PREMIUM_THEMES.get(p_theme_key, PREMIUM_THEMES['midnight_gold'])
    # -------------------------------------------------------------
    
    # 1. VISUAL LAYERING: CINEMA STACK LAYERS (Scene Synced)
    print(f"    🧠 Building Cinema Stack Layers...")

    # --- MASTER CLIP CREATION ---
    master_scene_clip = video_proc.prepare_video_for_short(video_path, original_total_dur, script=script, width=WIDTH)

    # --- LAYER 1: AMBIENCE (Background) ---
    ambience_raw = master_scene_clip.copy()
    ambience_raw = ambience_raw.resize(height=HEIGHT)
    ambience_raw = ambience_raw.crop(x1=(ambience_raw.w - WIDTH) // 2, width=WIDTH, height=HEIGHT)
    
    bg = engine.create_background(config.get('theme'), original_total_dur, video_clip=ambience_raw)
    clips = [bg]

    # --- LAYER 2: THE STAGE (Synchronized Content View) ---
    STAGE_W = 1000
    
    # FIX: Use the scene-cut master clip copy instead of loading the raw file. 
    # This guarantees scene sync. 
    stage_video = master_scene_clip.copy() 
    
    # We apply the sizing for the Stage frame to the synchronized clip
    stage_video = stage_video.resize(width=STAGE_W) 
    
    STAGE_X = (WIDTH - STAGE_W) // 2
    STAGE_Y = 400 
    
    stage_border = ColorClip(size=(STAGE_W + 10, stage_video.h + 10), color=(255,255,255)).set_duration(original_total_dur)
    stage_border = stage_border.set_position((STAGE_X - 5, STAGE_Y - 5))
    
    stage_video = stage_video.set_position((STAGE_X, STAGE_Y)).set_duration(original_total_dur)
    clips.extend([stage_border, stage_video])

    # 2. Get Theme Data (Legacy colors still needed for Timer/Options)
    theme = engine.get_theme(config.get('theme', 'energetic_yellow'))
    
    # 3. UI OVERLAYS (Question Glass Panel Implemented)
    print("    > Building UI Overlays...")
    
    # A. Hook (WATCH TILL END) - UNCHANGED
    CARD_START_Y = 100 
    hook_box = theme['highlight']; hook_txt = engine.get_contrast_color(hook_box)
    hook_clip = TextClip("🔥 WATCH TILL END 🔥", fontsize=45, color=hook_txt, bg_color=hook_box, font='Arial-Bold', method='label', size=(WIDTH, 110))
    hook_clip = hook_clip.set_position(('center', CARD_START_Y)).set_start(0).set_duration(2)
    clips.append(force_rgb(hook_clip))
    
    # B. Question - IMPLEMENTING GLASS PANEL
    print("      -> Building Question Glass Panel")
    
    Q_W, Q_H = 960, 220 
    Q_X = (WIDTH - Q_W) // 2
    Q_Y = 150 
    
    # 1. Create Glass Panel (Background)
    q_panel_img = create_glass_panel(
        Q_W, Q_H, 
        color=p_theme['glass_fill'], 
        border_color=p_theme['glass_border']
    )
    
    # FIX: Apply force_rgb to the ImageClip output 
    q_panel_clip = force_rgb(q_panel_img)
    
    q_panel_clip = q_panel_clip.set_position((Q_X, Q_Y)).set_start(timings['t_q']).set_duration(original_total_dur - timings['t_q'])
    clips.append(q_panel_clip) # Add Panel first
    
    # 2. Create Text (Foreground)
    QUESTION_Y = CARD_START_Y + 130
    q_clip = engine.create_text_clip(
        script['question_visual'], 
        fontsize=55, 
        color=p_theme['text_main'], 
        bold=True, 
        wrap_width=25, 
        align='center',
        bg_color=None # Removed solid background
    )
    # Position text relative to the panel center
    q_clip = q_clip.set_position(('center', Q_Y + 40)).set_start(timings['t_q']).set_duration(original_total_dur - timings['t_q'])
    clips.append(force_rgb(q_clip)) # Add Text second
    
    # C. Options - UNCHANGED (Legacy Layout)
    OPT_START_Y = STAGE_Y + stage_video.h + 50 
    GAP = 110
    opt_bg = theme['bg_color']
    
    if isinstance(opt_bg, str):
         if opt_bg.startswith('#'):
            opt_bg = opt_bg.lstrip('#')
            opt_bg = tuple(int(opt_bg[i:i+2], 16) for i in (0, 2, 4))
    
    options = [
        (f"A) {script['opt_a_visual']}", timings['t_a']), 
        (f"B) {script['opt_b_visual']}", timings['t_b']), 
        (f"C) {script['opt_c_visual']}", timings['t_c']), 
        (f"D) {script['opt_d_visual']}", timings['t_d'])
    ]
    
    for i, (txt, t) in enumerate(options):
        # Keeps legacy text clip with solid color background
        o_clip = engine.create_text_clip(txt, fontsize=45, color='white', bg_color=opt_bg, wrap_width=30, align='West')
        o_clip = o_clip.set_position(('center', OPT_START_Y + GAP * i)).set_start(t).set_duration(original_total_dur - t)
        clips.append(force_rgb(o_clip))

    # D. Timer (Segments + Big Number) - UNCHANGED
    THINK_TIME = 3.0
    timer_base_y = OPT_START_Y + GAP * 4 + 30 
    timer_bar_y = timer_base_y + 160
    
    bar_color = theme['correct']
    if isinstance(bar_color, str) and bar_color.startswith('#'):
         bar_color = tuple(int(bar_color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
         
    segments = 10
    seg_w = WIDTH // segments
    for i in range(segments):
        seg = ColorClip(size=(seg_w - 2, 40), color=bar_color).set_position((i * seg_w, timer_bar_y))
        dt = timings['t_think'] + (THINK_TIME * (i + 1) / segments)
        seg = seg.set_start(timings['t_think']).set_end(dt)
        clips.append(seg) 

    for i in range(int(THINK_TIME)):
        num = int(THINK_TIME) - i
        n_clip = TextClip(str(num), fontsize=140, color='white', font='Arial-Bold', stroke_color='black', stroke_width=5)
        n_clip = n_clip.set_position(('center', timer_base_y)).set_start(timings['t_think'] + i).set_duration(1)
        clips.append(force_rgb(n_clip))
    
    # E. Answer Reveal - UNCHANGED
    ans_bg = theme['correct']; ans_txt = engine.get_contrast_color(ans_bg)
    stroke_col = 'black' if ans_txt == 'white' else None; stroke_wid = 3 if ans_txt == 'white' else 0

    visual_content = script.get('explanation_visual', script.get('explanation_spoken', ''))
    visual_display = f"✅ {script['correct_opt']}: {visual_content}"
    
    summary_clip = engine.create_text_clip(visual_display, fontsize=50, color=ans_txt, bg_color=ans_bg, stroke_color=stroke_col, stroke_width=stroke_wid, bold=True, wrap_width=25, align='center')
    summary_clip = summary_clip.set_position(('center', OPT_START_Y)).set_start(timings['t_ans']).set_duration(timings['expl_duration'])
    clips.append(force_rgb(summary_clip))

    # F. CTA
    cta_bg = theme['highlight']; cta_txt_color = 'black'; cta_display = f"🚀 {script['cta_spoken']}"
    
    clips.append(engine.create_text_clip(cta_display, fontsize=65, color=cta_txt_color, bg_color=cta_bg, bold=True, wrap_width=20).set_position(('center', HEIGHT - 350)).set_start(timings['t_cta']).set_duration(timings['cta_duration']))

    # G. Outro
    outro = engine.create_outro(duration=4.0, cta_text="SUBSCRIBE FOR MORE!").set_start(timings['t_outro'])
    clips.append(outro)
    
    # 4. FILTER & TRIM (Provision for Render Limit)
    final_clips = filter_and_trim_clips(clips, render_limit)
        
    return final_clips