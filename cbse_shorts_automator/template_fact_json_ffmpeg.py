#!/usr/bin/env python3
"""
File: template_fact.py
Generates Fact JSON + Stitches Background Video using FFmpeg
UPDATED: Integrated USPContent for dynamic brand messaging.
"""

import os
import json
import random
import subprocess
import concurrent.futures
from moviepy.editor import CompositeAudioClip, AudioFileClip
from voice_manager import VoiceManager
from sfx_manager import SFXManager
from video_scheduler import VideoScheduler 
import re  #

# --- NEW INTEGRATION ---
from usp_content_variations import USPContent

# --- CONFIG ---
WIDTH = 1080
HEIGHT = 1920
PUBLIC_DIR = "./visual_engine_fact/public"

class FactTemplate:
    def __init__(self, engine):
        self.engine = engine
    
    def process_video_ffmpeg(self, video_path, schedule, output_path, temp_dir):
        """
        1. Cuts segments using FFmpeg.
        2. Crops to 9:16 (1080x1920).
        3. Stitches them into one file.
        """
        chunk_files = []
        concat_list_path = os.path.join(temp_dir, "concat_list.txt")

        print(f"   🎞️  Processing {len(schedule)} video segments with FFmpeg...")

        # 1. EXTRACT & CROP CHUNKS
        for i, item in enumerate(schedule):
            chunk_name = f"chunk_{i}.mp4"
            chunk_path = os.path.join(temp_dir, chunk_name)
            
            # --- CHANGED: NO FILTERS ---
            # We removed the '-vf' argument entirely.
            # This preserves the source resolution, aspect ratio, and framing exactly.
            cmd = [
                'ffmpeg', '-y',
                '-ss', str(item['start']),
                '-t', str(item['duration']),
                '-i', video_path,
                # Removed '-vf' scale/crop/pad filters
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', # Re-encode for clean cuts
                '-an', # Remove audio
                chunk_path
            ]
            
            subprocess.call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            chunk_files.append(chunk_path)

        # 2. CREATE CONCAT LIST
        with open(concat_list_path, 'w') as f:
            for chunk in chunk_files:
                f.write(f"file '{os.path.abspath(chunk)}'\n")

        # 3. CONCATENATE
        print(f"   🎞️  Stitching final video -> {os.path.basename(output_path)}")
        concat_cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_list_path,
            '-c', 'copy', 
            output_path
        ]
        subprocess.call(concat_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 4. CLEANUP CHUNKS
        if os.path.exists(concat_list_path): os.remove(concat_list_path)
        for chunk in chunk_files:
            if os.path.exists(chunk): os.remove(chunk)

    def generate(self, video_path, script, config, output_path):
        # Define Paths
        assets_dir = os.path.join(PUBLIC_DIR, "assets")
        
        # Ensure directories exist
        os.makedirs(PUBLIC_DIR, exist_ok=True)
        os.makedirs(assets_dir, exist_ok=True)
        
        print(f"📝 Generating Fact Video & Data -> {PUBLIC_DIR}")

        # --- 1. SETUP ---
        theme_seed = random.randint(10000, 99999); 
        voice_mgr = self.engine.voice_manager
        sfx_mgr = SFXManager()
        selected_voice_key = config.get('voice') or voice_mgr.get_random_voice_name()
        temp_dir = self.engine.config['DIRS']['TEMP']

        # --- 2. AUDIO GENERATION ---
        print("   🎙️  Synthesizing Audio...")
        
        audio_tasks = {
            'hook': script['hook_spoken'],
            'title': script['fact_title'],
            'cta': script['cta_spoken']
        }
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = {executor.submit(voice_mgr.generate_audio_with_specific_voice, text, f"{temp_dir}/{k}.mp3", selected_voice_key): k for k, text in audio_tasks.items()}
            for f in concurrent.futures.as_completed(futures): pass

        aud_hook = AudioFileClip(f"{temp_dir}/hook.mp3")
        aud_title = AudioFileClip(f"{temp_dir}/title.mp3")
        aud_cta = AudioFileClip(f"{temp_dir}/cta.mp3")
        
        voice_mgr.generate_audio_with_specific_voice(script['fact_spoken'], f"{temp_dir}/details.mp3", selected_voice_key)
        aud_details = AudioFileClip(f"{temp_dir}/details.mp3")

        # --- 3. TIMINGS ---
        t_hook = 0
        t_title = t_hook + aud_hook.duration
        t_details = t_title + aud_title.duration
        t_cta = t_details + aud_details.duration
        t_outro = t_cta + aud_cta.duration
        total_dur = t_outro + 4.0 # +4s Outro

        # --- 4. VIDEO PROCESSING (FFMPEG) ---
        print("   🧠 Scheduling Video Cuts...")
        scheduler = VideoScheduler(temp_dir=temp_dir)
        schedule = scheduler.schedule_clips(video_path, total_dur, script)
        
        final_video_filename = "source_vid.mp4"
        final_video_path = os.path.join(assets_dir, final_video_filename)
        
        self.process_video_ffmpeg(video_path, schedule, final_video_path, temp_dir)

        # --- 5. AUDIO MASTERING ---
        print("   🔊 Mastering Audio...")
        sfx_clips = sfx_mgr.generate_fact_sfx({'title': t_title, 'details': t_details, 'cta': t_cta, 'outro': t_outro})
        full_stack = [
            aud_hook.set_start(t_hook), aud_title.set_start(t_title), 
            aud_details.set_start(t_details), aud_cta.set_start(t_cta)
        ] + sfx_clips
        
        final_audio = self.engine.add_background_music(CompositeAudioClip(full_stack), total_dur)
        
        final_audio_path = os.path.join(assets_dir, "audio_track.mp3")
        final_audio.write_audiofile(final_audio_path, fps=44100, verbose=False, logger=None)

       # --- 6. USP CONTENT & FORMATTING ---
        usp_hook = script['hook_visual']
        
        # CLEANING LOGIC:
        # 1. Remove non-ASCII characters (Strips emojis like ⚡, 🚀)
        clean_hook = re.sub(r'[^\x00-\x7F]+', '', usp_hook)
        
        # 2. Remove extra spaces and strip
        clean_hook = " ".join(clean_hook.split())
        
        # 3. Replace spaces with newlines for vertical stacking
        formatted_hook = clean_hook.replace(" ", "\n")

        cta_social, cta_link = USPContent.get_random_cta()
        outro_line1, outro_line2 = USPContent.get_random_outro()

        # --- 1. GET GRID COUNTS FROM CONFIG ---
        # These are passed into the script from your main execution loop
        grid_x = config.get('grid_x_count', 5)
        grid_y = config.get('grid_y_count', 9)
        grid_z = config.get('grid_z_count', 20)

        # --- 2. DETERMINISTIC TARGET SELECTION ---
        # Use a fresh seed-based instance to avoid interfering with other random calls
        rng_target = random.Random(theme_seed)
        
        target_item = {
            "x": rng_target.randint(0, grid_x - 1),
            "y": rng_target.randint(0, grid_y - 1),
            "z": rng_target.randint(int(grid_z * 0.5), grid_z - 1) # Back 50%
        }

        # --- 3. UPDATED JSON DATA CONTRACT ---
        data = {
            "meta": {
                "theme_seed": theme_seed,
                "target_item": target_item, # The selected index
                "config": {
                    "resolution": {"w": WIDTH, "h": HEIGHT},
                    "fps": 30,
                    # Storing counts here so React doesn't need constants.ts
                    "grid_counts": {
                        "x": grid_x,
                        "y": grid_y,
                        "z": grid_z
                    }
                }
            },
            "assets": {
                "video_src": "assets/source_vid.mp4",
                "audio_track": "assets/audio_track.mp3",
                "thumb_src": "assets/thumbnail.jpg",
                "logo_src": "assets/logo.png"
            },
            "timings": {
                "t_title": t_title, "t_details": t_details,
                "detailsAudioDuration": aud_details.duration,
                "t_cta": t_cta, "t_outro": t_outro,
                "total_duration": total_dur
            },
            "content": {
                # Mapped to USP Content
                "hook_3d": formatted_hook,
                
                "fact_title": script['fact_title'],
                "fact_body_html": script['fact_visual'],
                
                "cta_content": {
                    "social_text": cta_social, # From USP Content
                    "link_text": cta_link      # From USP Content
                },
                
                "outro_content": {
                    "usp_line_1": outro_line1, # From USP Content
                    "usp_line_2": outro_line2  # From USP Content
                },
                
                "usp_badge_text": "NEW", 
                "watermark_text": "@NCERTQuickPrep", 
                "copyright_text": "© 2025 NCERT QuickPrep"
            }
        }

        # --- 8. WRITE JSON ---
        json_path = os.path.join(PUBLIC_DIR, "scenario_data.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        print(f"   ✅ JSON written to: {json_path}")
        return {'json_path': json_path}