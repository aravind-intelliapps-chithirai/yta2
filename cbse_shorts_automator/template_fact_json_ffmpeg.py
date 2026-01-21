#!/usr/bin/env python3
"""
File: template_fact.py
Generates Fact JSON + Stitches Background Video using FFmpeg
UPDATED: Integrated USPContent for dynamic brand messaging.
"""

import os
import json
import glob
import random
import subprocess
import concurrent.futures
from moviepy.editor import CompositeAudioClip, AudioFileClip
from voice_manager import VoiceManager
from sfx_manager import SFXManager
from video_scheduler import VideoScheduler 
from remotion_renderer import render_remotion_video
import re  #

# --- NEW INTEGRATION ---
from usp_content_variations import USPContent

# --- CONFIG ---
WIDTH = 1080
HEIGHT = 1920
PUBLIC_DIR = "./visual_engine_fact/public"
AUDIO_SAMPLE_RATE = 44100 

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
       
        # NEW: Get source video FPS
        """ def get_video_fps(video_path):
            cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                '-show_entries', 'stream=r_frame_rate', '-of', 'default=noprint_wrappers=1:nokey=1',
                video_path]
            result = subprocess.run(cmd, capture_output=True, text=True)
            num, den = map(int, result.stdout.strip().split('/'))
            return num / den """

        #source_fps = get_video_fps(output_path)
        main_video_fps = 30  # Set this to your composition FPS

        # NEW: Extract frames
        
        frames_dir = os.path.join(PUBLIC_DIR, "assets/video_frames")
        if os.path.exists(frames_dir):
            import shutil
            shutil.rmtree(frames_dir)
        os.makedirs(frames_dir, exist_ok=True)

        extract_cmd = [
            'ffmpeg', '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_list_path,
            '-vf', f'fps={main_video_fps},scale=1080:-1',
            '-q:v', '5',
            f'{frames_dir}/frame_%05d.jpg'
        ]
        subprocess.call(extract_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        print(f"Extracted frames at {main_video_fps} fps to {frames_dir}")

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
        audio_files = [] 
        vid_id = os.path.basename(output_path).split('.')[0]
        

        BASE_PUBLIC_DIR = PUBLIC_DIR
        FINAL_ASSETS_DIR = f"{BASE_PUBLIC_DIR}/assets"
        
        # CORRECTED JSON OUTPUT PATH: directly in public folder
        JSON_OUTPUT_PATH = f"{BASE_PUBLIC_DIR}/scenario_data.json" 
        
        # Define asset file paths (relative to BASE_PUBLIC_DIR/assets)
        FINAL_AUDIO_FILENAME = f"{vid_id}_final_audio.mp3"
        FINAL_AUDIO_PATH = f"{FINAL_ASSETS_DIR}/{FINAL_AUDIO_FILENAME}"


        SOURCE_VIDEO_FILENAME = "source_video.mp4"

        SOURCE_VIDEO_PATH = f"{FINAL_ASSETS_DIR}/{SOURCE_VIDEO_FILENAME}"
        # Asset URLs (All relative to the public root)
        FINAL_AUDIO_URL = f"/assets/{FINAL_AUDIO_FILENAME}"
        SOURCE_VIDEO_URL = f"/assets/{SOURCE_VIDEO_FILENAME}" 

        # --- 2. AUDIO GENERATION ---
        print("   🎙️  Synthesizing Audio...")
        generated_audio_paths = {}
        
        audio_tasks = {
            'hook': script['hook_spoken'],
            'title': script['fact_title'],
            'cta': script['cta_spoken']
        }

        
        
        def generate_single_audio(key, text):
            path = f"{temp_dir}/{vid_id}_{key}.mp3"
            voice_mgr.generate_audio_with_specific_voice(text, path, selected_voice_key, provider='google')
            return key, path
        
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [executor.submit(generate_single_audio, k, t) for k, t in audio_tasks.items()]
            #futures = {executor.submit(voice_mgr.generate_audio_with_specific_voice, text, f"{temp_dir}/{k}.mp3", selected_voice_key): k for k, text in audio_tasks.items()}
            for future in concurrent.futures.as_completed(futures): 
                k, path = future.result()
                generated_audio_paths[k] = path
                audio_files.append(path)    

        aud_hook = AudioFileClip(generated_audio_paths['hook'])
        aud_title = AudioFileClip(generated_audio_paths['title'])
        aud_cta = AudioFileClip(generated_audio_paths['cta'])
        
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
        
        final_video_filename = SOURCE_VIDEO_FILENAME
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

        # FIX: Explicitly set the sampling frequency (fps)
        final_audio.fps = AUDIO_SAMPLE_RATE 
        
        # Write the final audio
        os.makedirs(os.path.dirname(FINAL_AUDIO_PATH), exist_ok=True)
        final_audio.write_audiofile(FINAL_AUDIO_PATH, logger=None)
        print(f"   ✅ Final audio saved to {FINAL_AUDIO_PATH}")
        #final_audio_path = os.path.join(assets_dir, "audio_track.mp3")
        #final_audio.write_audiofile(final_audio_path, fps=44100, verbose=False, logger=None)

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
        scenario_data = {
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
                "video_src": SOURCE_VIDEO_URL,
                "audio_track": FINAL_AUDIO_URL,
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

        # 6. WRITE JSON FILE TO TARGET PATH
        # Ensure the 'public' directory exists
        os.makedirs(os.path.dirname(JSON_OUTPUT_PATH), exist_ok=True)
        with open(JSON_OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(scenario_data, f, indent=4)

        # --- 8. WRITE JSON ---
        #json_path = os.path.join(PUBLIC_DIR, "scenario_data.json")
        #with open(json_path, 'w', encoding='utf-8') as f:
            #json.dump(data, f, indent=2)
            
        print(f"   ✅ JSON written to: {JSON_OUTPUT_PATH}")
        #return {'json_path': json_path}

        try:
            #self.engine.render_with_effects(final_raw, script, output_path)
            print(f"  Trying:")
                    # 1. Define your variables
     # Replace with your desired path

            project_dir = "visual_engine_fact"
            comp_id = "NCERT-Shorts-Fact"
    
            entry_point = "src/index.ts"
            

            # 2. Construct the command as a list (safer than a string)
            command = [
                "npx", 
                "remotion", 
                "render", 
                entry_point, 
                comp_id, 
                output_path, 
                "--enable-multiprocess-on-linux",                 
            ]  

            # 3. Execute
            try:
                success, duration = render_remotion_video(
                    project_dir=project_dir,
                    comp_id=comp_id,
                    output_path=output_path,
                    entry_point=entry_point,
                    scenario_json_path=JSON_OUTPUT_PATH,
                    start_frame=0,
                    end_frame=600
                )
                
                if success:
                    print(f"✅ Render completed successfully in {duration:.2f}s")
                    return {
                        'success': True,
                        'duration': total_dur, 
                        'json_path': JSON_OUTPUT_PATH,
                        'render_duration': duration
                    }
                else:
                    print(f"❌ Render failed")
                    return {
                        'success': False,
                        'error': 'Render process failed',
                        'duration': total_dur,
                        'json_path': JSON_OUTPUT_PATH
                    }
                    
            except subprocess.CalledProcessError as e:
                print(f"❌ Render failed with error code {e.returncode}")
                return {
                    'success': False,
                    'error': f'Render subprocess failed with code {e.returncode}',
                    'duration': total_dur,
                    'json_path': JSON_OUTPUT_PATH
                }
            except Exception as e:
                print(f"❌ Render failed with exception: {str(e)}")
                return {
                    'success': False,
                    'error': str(e),
                    'duration': total_dur,
                    'json_path': JSON_OUTPUT_PATH
                }
        finally:
            # --- CLEANUP LOGIC ---
            # This runs whether the render succeeded or failed
            if self.engine.config.get('DELETE_TEMP_FILES', True):
                print("🧹 Cleaning up temporary files...")
                
                # Clean specific audio files list
                if 'audio_files' in locals():
                    for f in audio_files:
                        if os.path.exists(f): 
                            try: os.remove(f)
                            except OSError: pass
                
                # Clean glob patterns (vid_id based)
                # Ensure vid_id and temp_dir are defined in this scope
                if 'vid_id' in locals() and 'temp_dir' in locals():
                    patterns = [
                        os.path.join(temp_dir, f'{vid_id}*'), 
                        f'{vid_id}*TEMP_*'
                    ]
                    for pattern in patterns:
                        for temp_file in glob.glob(pattern):
                            try: os.remove(temp_file)
                            except OSError: pass
        
        return {'duration': total_dur, 'json_path': JSON_OUTPUT_PATH}

        # 7. Cleanup (Clean intermediate voice tracks)
        if self.engine.config.get('DELETE_TEMP_FILES', True):
            for f in audio_files:
                if os.path.exists(f): os.remove(f)

        return {'duration': total_dur, 'json_path': JSON_OUTPUT_PATH}