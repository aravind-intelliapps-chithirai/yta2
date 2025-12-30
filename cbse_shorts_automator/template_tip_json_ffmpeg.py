#!/usr/bin/env python3
"""
File: template_tip.py
Purpose: "Director" script. 
Generates assets (Audio/Video) and creates the 'scenario_data.json' 
that drives the Remotion Engine.
"""

import os
import json
import random
import subprocess
import concurrent.futures
from moviepy.editor import AudioFileClip, CompositeAudioClip, VideoFileClip
from voice_manager import VoiceManager
from sfx_manager import SFXManager
from video_scheduler import VideoScheduler 
import re  #
# Import the USP helper
from usp_content_variations import USPContent

PUBLIC_DIR = "./visual_engine_tip/public"

class TipTemplate:
    def __init__(self, engine):
        self.engine = engine
        self.config = engine.config
        

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
        """
        Generates the assets and the JSON payload.
        output_path: Path where the final JSON should be saved (e.g., .../scenario_data.json)
        """
        WIDTH=config.get('width',1080)
        HEIGHT=config.get('height',1920)
        print("📝 Directing Tip Scenario (JSON Generation)...")
        
        # 1. Setup Directories & IDs
        # ---------------------------------------------------------------------
        vid_id = os.path.basename(output_path).split('.')[0]
        temp_dir = self.engine.config['DIRS']['TEMP']
        assets_dir = os.path.join(PUBLIC_DIR, "assets")
        
        # Ensure assets folder exists
        os.makedirs(assets_dir, exist_ok=True)

        voice_name = config.get('voice', 'NeeraNeural2')
        voice_mgr = self.engine.voice_manager
        sfx_mgr = SFXManager()
        
        # Select Voice
        selected_voice_key = voice_name if voice_name else voice_mgr.get_random_voice_name()
        print(f"   🎤 Using voice: {selected_voice_key}")

        # 2. Audio Generation (Parallel TTS)
        # ---------------------------------------------------------------------
        print("   🎙️  Synthesizing voiceover tracks...")
        audio_tasks = {
            'hook': script.get('hook_spoken', script.get('hook_text', '')), 
            'title': script['tip_title'],
            'content': script['tip_spoken'],
            'bonus': script['bonus'],
            'cta': script['cta_spoken']
        }
        
        generated_audio_paths = {}
        audio_files_to_cleanup = []

        def generate_single_audio(key, text):
            path = f"{temp_dir}/{vid_id}_{key}.mp3"
            voice_mgr.generate_audio_with_specific_voice(text, path, selected_voice_key, provider='google')
            return key, path

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(generate_single_audio, k, t) for k, t in audio_tasks.items()]
            for future in concurrent.futures.as_completed(futures):
                k, path = future.result()
                generated_audio_paths[k] = path
                audio_files_to_cleanup.append(path)

        # Load Audio Clips for Duration Calculation
        aud_hook = AudioFileClip(generated_audio_paths['hook'])
        aud_title = AudioFileClip(generated_audio_paths['title'])
        aud_content = AudioFileClip(generated_audio_paths['content'])
        aud_bonus = AudioFileClip(generated_audio_paths['bonus'])
        aud_cta = AudioFileClip(generated_audio_paths['cta'])

        # 3. Calculate Timings
        # ---------------------------------------------------------------------
        # We calculate precise start times for the timeline
        t_hook = 0.0
        t_title = t_hook + aud_hook.duration
        t_content = t_title + aud_title.duration
        t_bonus = t_content + aud_content.duration
        t_cta = t_bonus + aud_bonus.duration
        t_outro = t_cta + aud_cta.duration
        
        OUTRO_DURATION = 4.0
        total_dur = t_outro + OUTRO_DURATION

        # 4. Audio Mixing (Voice + SFX + BGM)
        # ---------------------------------------------------------------------
        print("   🔊 Engineering Master Audio Mix...")
        
        # A. Voice Layer
        voice_clips = [
            aud_hook.set_start(t_hook),
            aud_title.set_start(t_title),
            aud_content.set_start(t_content),
            aud_bonus.set_start(t_bonus),
            aud_cta.set_start(t_cta)
        ]

        # B. SFX Layer (Using SFXManager)
        sfx_timings = {
            'title': t_title,
            'content': t_content,
            'bonus': t_bonus,
            'cta': t_cta,
            'outro': t_outro
        }
        # Assuming sfx_mgr returns AudioFileClips positioned at correct times
        sfx_clips = sfx_mgr.generate_tip_sfx(sfx_timings) 

        # C. Background Music Layer
        # Assuming engine has a BGM helper, if not, simple load:
        # bgm = AudioFileClip("path/to/bgm.mp3").volumex(0.1).set_duration(total_dur)
        # We'll use the composite first to get length, then add BGM via engine helper if available
        composite_voice_sfx = CompositeAudioClip(voice_clips + sfx_clips)
        
        # Use engine helper to add BGM and duck volume under voice
        final_audio = self.engine.add_background_music(composite_voice_sfx, total_dur)

        # D. Export Master Audio Asset
        master_audio_filename = "audio_track.mp3"
        master_audio_path = os.path.join(assets_dir, master_audio_filename)
        final_audio.write_audiofile(master_audio_path, fps=44100, verbose=False, logger=None)

        # 5. Video Asset Preparation
        # ---------------------------------------------------------------------
        print(f"   📼 Preparing Video Asset ({int(total_dur)}s)...")
        # We cut the source video to match exact audio length
        # This prevents the Remotion engine from handling massive files

        # --- 4. VIDEO PROCESSING (FFMPEG) ---
        print("   🧠 Scheduling Video Cuts...")
        scheduler = VideoScheduler(temp_dir=temp_dir)
        schedule = scheduler.schedule_clips(video_path, total_dur, script)
        
        final_video_filename = "source_vid.mp4"
        final_video_path = os.path.join(assets_dir, final_video_filename)
        
        self.process_video_ffmpeg(video_path, schedule, final_video_path, temp_dir)

        # 6. JSON Data Construction
        # ---------------------------------------------------------------------
        print("   🧠 assembling ExamScenario JSON...")

        # A. Randomize Content via USPContent
        social_txt, link_txt = USPContent.get_random_cta()
        outro_line1, outro_line2 = USPContent.get_random_outro()
        
        # Determine Hook Text: Use visual script if available, else random USP hook
        hook_display_text = script.get('hook_visual', USPContent.get_random_hook())

        # 2. Remove extra spaces and strip
        clean_hook = " ".join(hook_display_text.split())
        
        # 3. Replace spaces with newlines for vertical stacking
        formatted_hook = clean_hook.replace(" ", "\n")
        
        # B. Construct the Object (Matching schema.ts)
        scenario_data = {
            "meta": {
                "theme_seed": random.randint(10000, 99999),
                "config": {
                    "resolution": {"w": WIDTH, "h": HEIGHT},
                    "fps": 30
                }
            },
            "assets": {
                # In Remotion, staticFile() wraps paths relative to the public folder
                "video_src": f"/assets/source_vid.mp4", # [cite: 54]
                "thumb_src": "/assets/thumbnail.jpg",    # [cite: 55] (Placeholder/Static)
                "logo_src": "/assets/logo.png",# [cite: 56]
                "audio_track": f"/assets/audio_track.mp3"# [cite: 57]
            },
            "timings": {
                "hook": {
                    "start_time": t_hook,
                    "duration": aud_hook.duration
                },
                "tip_title": {
                    "start_time": t_title,
                    "duration": aud_title.duration
                },
                "tip_details": {
                    "start_time": t_content,
                    "duration": aud_content.duration
                },
                "bonus": {
                    "start_time": t_bonus,
                    "duration": aud_bonus.duration
                },
                "cta_social": {
                    "start_time": t_cta,
                    "duration": aud_cta.duration / 2  # Split CTA duration logic if needed
                },
                "cta_link": {
                    "start_time": t_cta + (aud_cta.duration / 2),
                    "duration": aud_cta.duration / 2
                },
                "outro": {
                    "start_time": t_outro,
                    "duration": OUTRO_DURATION
                },
                "total_duration": total_dur
            },
            "content": {
                "hook_text": formatted_hook,              # [cite: 76]
                "tip_title": script['tip_title'],            # [cite: 77]
                "tip_details": script['tip_visual'],         # [cite: 78] (Visual text for screen)
                "bonus_visual": script.get('bonus_visual', f"⭐ {script['bonus']}"), # [cite: 79]
                "cta_content": {
                    "social_text": social_txt,               # [cite: 73] (From USP)
                    "link_text": link_txt                    # [cite: 73] (From USP)
                },
                "outro_content": {
                    "usp_line_1": outro_line1,               # [cite: 74] (From USP)
                    "usp_line_2": outro_line2                # [cite: 74] (From USP)
                },
                "usp_badge_text": USPContent.get_random_timer_label(), # [cite: 82]
                "watermark_text": "@NCERT_QuickPrep",        # [cite: 83]
                "copyright_text": "© 2025 NCERT QuickPrep"   # [cite: 84]
            }
        }

        # 7. Write JSON Output
        # ---------------------------------------------------------------------
        # --- 8. WRITE JSON ---
        json_path = os.path.join(PUBLIC_DIR, "scenario_data.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(scenario_data, f, indent=2, ensure_ascii=False)

        print(f"✅ Scenario generated: {output_path}")

        # 8. Cleanup Temp Files
        # ---------------------------------------------------------------------
        if self.engine.config.get('DELETE_TEMP_FILES', True):
            for f in audio_files_to_cleanup:
                try: os.remove(f)
                except: pass

        return {'duration': total_dur, 'json_path': output_path}