#!/usr/bin/env python3
"""
File: template_fact.py
Fact template for YouTube Shorts
UPDATED: Imports text variations & exports 'source_vid.mp4'
"""

import imagemagick_setup
import os
import json
import random
import concurrent.futures
from moviepy.editor import CompositeAudioClip, AudioFileClip
from voice_manager import VoiceManager
from karaoke_manager import KaraokeManager
from video_processor import VideoProcessor
from sfx_manager import SFXManager
import re  #

# --- NEW IMPORT ---
# Please ensure these variable names match your constants file
from usp_content_variations import USPContent

WIDTH = 1080
HEIGHT = 1920

PUBLIC_DIR = "./visual_engine_fact/public"

def hex_to_rgb(hex_color):
    if isinstance(hex_color, str) and hex_color.startswith('#'):
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return hex_color

class FactTemplate:
    def __init__(self, engine):
        self.engine = engine
    
    def generate(self, video_path, script, config, output_path):
        assets_dir = os.path.join(PUBLIC_DIR, "assets")
        
        # Ensure directories exist
        os.makedirs(PUBLIC_DIR, exist_ok=True)
        os.makedirs(assets_dir, exist_ok=True)
        print("📝 Generating Fact JSON Data (Parallel Audio Processing)...")
        
        # --- 1. SETUP ---
        theme_seed = 12345 # Can be dynamic based on requirements
        
        # Initialize Random Generator with SEED for consistency
        rng = random.Random(theme_seed)
        
        theme = self.engine.get_theme(config.get('theme', 'vibrant_purple'))
        voice_name = config.get('voice', 'NeeraNeural2')
        voice_mgr = self.engine.voice_manager
        
        selected_voice_key = voice_name if voice_name else voice_mgr.get_random_voice_name()
        print(f"   🎤 Using voice: {selected_voice_key}")        
        
        video_proc = VideoProcessor(temp_dir=self.engine.config['DIRS']['TEMP'])
        sfx_mgr = SFXManager()
        
        
        output_dir = os.path.dirname(output_path)
        vid_id = os.path.basename(output_path).split('.')[0]
        temp_dir = self.engine.config['DIRS']['TEMP']
        audio_files = []
        
        # --- 2. AUDIO GENERATION ---
        print("   🎙️  Synthesizing voiceover tracks...")
        audio_tasks = {
            'hook': script['hook_spoken'],
            'title': script['fact_title'],
            'cta': script['cta_spoken']
        }
        
        generated_audio_paths = {}

        def generate_single_audio(key, text):
            path = f"{temp_dir}/{vid_id}_{key}.mp3"
            voice_mgr.generate_audio_with_specific_voice(text, path, selected_voice_key, provider='google')
            return key, path

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(generate_single_audio, k, t) for k, t in audio_tasks.items()]
            for future in concurrent.futures.as_completed(futures):
                k, path = future.result()
                generated_audio_paths[k] = path
                audio_files.append(path)
        
        aud_hook = AudioFileClip(generated_audio_paths['hook'])
        aud_title = AudioFileClip(generated_audio_paths['title'])
        aud_cta = AudioFileClip(generated_audio_paths['cta'])
        
        print("   🎵 Generating Fact Detail Audio...")
        details_path = f"{temp_dir}/{vid_id}_details.mp3"
        voice_mgr.generate_audio_with_specific_voice(script['fact_spoken'], details_path, selected_voice_key, provider='google')
        audio_files.append(details_path)
        aud_details = AudioFileClip(details_path)
        
        # --- 3. TIMING ---
        t_hook = 0
        t_title = t_hook + aud_hook.duration
        t_details = t_title + aud_title.duration
        t_cta = t_details + aud_details.duration + 1.5
        t_outro = t_cta + aud_cta.duration
        
        OUTRO_DURATION = 4.0
        total_dur = t_outro + OUTRO_DURATION
        
        # --- 4. VIDEO EXPORT ---
        print(f"   🧠 AI Watching video to find relevant clips ({int(total_dur)}s)...")
        src_vid_clip = video_proc.prepare_video_for_short(video_path, total_dur, script=script, width=WIDTH)
        
        # UPDATED: Hardcoded filename as requested
        #processed_video_filename = "source_vid.mp4"
        #processed_video_path = os.path.join(output_dir, processed_video_filename)
        final_video_filename = "source_vid.mp4"
        final_video_path = os.path.join(assets_dir, final_video_filename)
        
        print(f"   🎞️  Rendering processed background video...")
        src_vid_clip.write_videofile(
            final_video_path, 
            fps=30, 
            codec='libx264', 
            audio=False, 
            preset='ultrafast',
            verbose=False,
            logger=None
        )

        # --- 5. AUDIO MASTERING ---
        print("   🔊 Engineering Master Audio...")
        sfx_timings = {
            'title': t_title,
            'details': t_details,
            'cta': t_cta,
            'outro': t_outro
        }
        sfx_clips = sfx_mgr.generate_fact_sfx(sfx_timings)

        audio_list = [
            aud_hook.set_start(t_hook), 
            aud_title.set_start(t_title), 
            aud_details.set_start(t_details), 
            aud_cta.set_start(t_cta)
        ]
        full_audio_stack = audio_list + sfx_clips
        final_audio = self.engine.add_background_music(CompositeAudioClip(full_audio_stack), total_dur)
        
        final_audio_path = os.path.join(assets_dir, "audio_track.mp3")
        final_audio.write_audiofile(final_audio_path, fps=44100, verbose=False, logger=None)

        #final_audio.write_audiofile(final_audio_path, fps=44100, verbose=False, logger=None)

        # --- 6. DATA GENERATION ---
        
        # --- 6. USP CONTENT FETCHING ---
        # Fetch dynamic variations from the new" file
        usp_hook = "DID YOU KNOW?"
        clean_hook = re.sub(r'[^\x00-\x7F]+', '', usp_hook)
        clean_hook = " ".join(clean_hook.split())

        cta_social, cta_link = USPContent.get_random_cta()
        outro_line1, outro_line2 = USPContent.get_random_outro()
        formatted_hook = clean_hook.replace(" ", "\n")
        
        scenario_data = {
            "meta": {
                "theme_seed": theme_seed,
                "config": {
                    "resolution": {"w": WIDTH, "h": HEIGHT},
                    "fps": 30
                }
            },
            "assets": {
                "video_src": "assets/source_vid.mp4",
                "thumb_src": "assets/thumbnail.jpg",
                "logo_src": "assets/logo.png",
                "audio_track": "assets/audio_track.mp3"
            },
            "timings": {
                "t_title": float(t_title),
                "t_details": float(t_details),
                "detailsAudioDuration": float(aud_details.duration),
                "t_cta": float(t_cta),
                "t_outro": float(t_outro),
                "total_duration": float(total_dur)
            },
            "content": {
                "hook_3d": formatted_hook,
                "fact_title": script['fact_title'],
                "fact_body_html": script['fact_visual'],
                "cta_content": {
                    "social_text": cta_social,
                    "link_text": cta_link
                },
                "outro_content": {
                    "usp_line_1": outro_line1,
                    "usp_line_2": outro_line2
                },
                "usp_badge_text": "NEW",
                "watermark_text": "@NCERTQuickPrep",
                "copyright_text": "© 2025 NCERT QuickPrep"
            }
        }

        # --- 7. EXPORT JSON ---
        # --- 8. WRITE JSON ---
        json_path = os.path.join(PUBLIC_DIR, "scenario_data.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(scenario_data, f, indent=2)
            
        print(f"   ✅ JSON written to: {json_path}")
        return {'json_path': json_path}
        # CLEANUP
        try:
            if self.engine.config.get('DELETE_TEMP_FILES', True):
                import glob
                for f in audio_files:
                    if os.path.exists(f): os.remove(f)
                for pattern in [f'{temp_dir}/{vid_id}*', f'{vid_id}*TEMP_*']:
                    for temp_file in glob.glob(pattern):
                        try: os.remove(temp_file)
                        except: pass
        except Exception as e:
            print(f"Warning during cleanup: {e}")

        return {'duration': total_dur, 'json_path': json_output_path}