import json
import random
import os
import urllib.request
import ssl
import shutil

# Fix SSL issues in some environments
ssl._create_default_https_context = ssl._create_unverified_context

# Try to import USPContent
try:
    from usp_content_variations import USPContent
    print("✅ Loaded USPContent variations.")
except ImportError:
    class USPContent:
        HOOKS = ["⚡ 7-MINUTE CHAPTER MASTERY ⚡"]
        TIMER_LABELS = ["⚡ THINK FAST"]
        ANSWER_PREFIXES = ["🎯 PERFECT!"]
        CTA_SOCIAL = ["🔔 SUBSCRIBE FOR MORE"]
        CTA_LINKS = ["Full Chapter Below"]
        OUTRO_MESSAGES = [("🚀 7-MINUTE CHAPTERS", "📚 Zero Boredom")]
        @staticmethod
        def get_random_hook(): return random.choice(USPContent.HOOKS)
        @staticmethod
        def get_random_timer_label(): return random.choice(USPContent.TIMER_LABELS)
        @staticmethod
        def get_random_answer_prefix(): return random.choice(USPContent.ANSWER_PREFIXES)
        @staticmethod
        def get_random_cta(): return (random.choice(USPContent.CTA_SOCIAL), random.choice(USPContent.CTA_LINKS))
        @staticmethod
        def get_random_outro(): return random.choice(USPContent.OUTRO_MESSAGES)

def download_asset(url, filepath, description):
    if not os.path.exists(filepath):
        print(f"⬇️  Downloading {description}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
        except Exception as e:
            print(f"⚠️ Failed to download {description}: {e}")
            # Create dummy file to prevent crash
            with open(filepath, 'wb') as f: f.write(b'')
    else:
        print(f"✅ Found local {description}.")

def generate_mock_scenario():
    # 1. Setup Directory Structure
    root_dir = os.getcwd()
    public_dir = os.path.join(root_dir, "visual_engine_v3", "public")
    assets_dir = os.path.join(public_dir, "assets")
    
    os.makedirs(assets_dir, exist_ok=True)

    # 2. Define Assets (Remote URL -> Local Filename)
    assets = {
        "audio": {
            "url": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "path": os.path.join(assets_dir, "mock_audio.mp3"),
            "rel_path": "/assets/mock_audio.mp3"
        },
        "video": {
            "url": "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4",
            "path": os.path.join(assets_dir, "mock_video.mp4"),
            "rel_path": "/assets/mock_video.mp4"
        },
        "hdr": {
            "url": "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr",
            "path": os.path.join(assets_dir, "environment.hdr"),
            "rel_path": "/assets/environment.hdr"
        },
        "font": {
            "url": "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2",
            "path": os.path.join(assets_dir, "font.woff2"),
            "rel_path": "/assets/font.woff2"
        },
        "cloud": {
            "url": "https://raw.githubusercontent.com/pmndrs/drei-assets/456060a26bbeb8fdf9d32ff4d4804d7595209441/cloud.png",
            "path": os.path.join(assets_dir, "cloud.png"),
            "rel_path": "/assets/cloud.png"
        }
    }

    # 3. Download/Copy Assets
    # Special Check for Local Video Source
    user_source_path = os.path.join(root_dir, "temp", "test_source.mp4")
    if os.path.exists(user_source_path):
        print(f"📂 Found local source video. Copying...")
        shutil.copy2(user_source_path, assets["video"]["path"])
    else:
        download_asset(assets["video"]["url"], assets["video"]["path"], "Fallback Video")

    # Download others
    download_asset(assets["audio"]["url"], assets["audio"]["path"], "Audio")
    download_asset(assets["hdr"]["url"], assets["hdr"]["path"], "Studio Lighting (HDR)")
    download_asset(assets["font"]["url"], assets["font"]["path"], "Poppins Font")
    download_asset(assets["cloud"]["url"], assets["cloud"]["path"], "Cloud Texture")

    # 4. Generate JSON Payload (Strictly Local Paths)
    scenario = {
        "meta": {
            "version": "3.1",
            "resolution": { "w": 1080, "h": 1920 },
            "seed": random.randint(0, 999999),
            "duration_seconds": 10.0 
        },
        "assets": {
            "audio_url": assets["audio"]["rel_path"], 
            "video_source_url": assets["video"]["rel_path"],
            "thumbnail_url": "https://via.placeholder.com/1080x1920", # Placeholder is fine, usually skipped in mock
            "channel_logo_url": "https://via.placeholder.com/150",
            "font_url": assets["font"]["rel_path"],
            "env_map_url": assets["hdr"]["rel_path"], # New field for clarity
            "cloud_map_url": assets["cloud"]["rel_path"] # New field
        },
        "timeline": {
            "hook": { "start_time": 0.0, "text_content": USPContent.get_random_hook() },
            "quiz": {
                "question": { "text": "Orbital Shape Quantum No.?", "start_time": 1.5 },
                "options": [
                    { "id": "A", "text": "Principal (n)", "start_time": 3.0 },
                    { "id": "B", "text": "Azimuthal (l)", "start_time": 4.0 },
                    { "id": "C", "text": "Magnetic (m)", "start_time": 5.0 },
                    { "id": "D", "text": "Spin (s)", "start_time": 6.0 }
                ]
            },
            "timer": { "start_time": 7.0, "duration": 3.0, "label_text": USPContent.get_random_timer_label() },
            "answer": { "start_time": 8.5, "correct_option_id": "B", "explanation_text": "Determines Shape", "celebration_text": USPContent.get_random_answer_prefix() },
            "cta": { "start_time": 9.0, "social_text": "SUBSCRIBE", "link_text": "LINK IN BIO" },
            "outro": { "start_time": 9.5, "line_1": "THANKS", "line_2": "WATCH MORE" }
        },
        "yt_overlay": { "progress_start": 0.15, "progress_end": 0.25 }
    }
    
    output_path = os.path.join(public_dir, "scenario_mock.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(scenario, f, indent=4)
    
    print(f"✨ Mock Payload & Assets Ready at: {output_path}")

if __name__ == "__main__":
    generate_mock_scenario()