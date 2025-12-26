#!/usr/bin/env python3
"""
File: video_scheduler.py
Logic only. Analyzes audio/transcript to decide visual timings.
"""

import os
import json
import random
import whisper
import warnings
import gc

# Suppress Whisper warnings
warnings.filterwarnings("ignore")

class VideoScheduler:
    def __init__(self, temp_dir="temp", debug=True):
        self.debug = debug
        self.temp_dir = temp_dir
        self.model = None
        os.makedirs(self.temp_dir, exist_ok=True)

    def _load_model(self):
        if self.model is None:
            if self.debug: print("⏳ Loading Whisper Model (tiny)...")
            self.model = whisper.load_model("tiny")

    def get_transcript(self, video_path):
        """Generates or loads cached transcript."""
        filename = os.path.basename(video_path)
        cache_path = os.path.join(self.temp_dir, f"{filename}.json")
        
        if os.path.exists(cache_path):
            if self.debug: print(f"⚡ Using cached transcript: {filename}")
            with open(cache_path, 'r') as f:
                return json.load(f)

        self._load_model()
        if self.debug: print(f"🎙️ Transcribing: {filename}")
        result = self.model.transcribe(video_path)
        
        with open(cache_path, 'w') as f:
            json.dump(result['segments'], f)
        
        # Cleanup
        del self.model
        self.model = None
        gc.collect()
        
        return result['segments']

    def find_best_timestamp(self, segments, keyword, min_time):
        """Scans transcript for keyword after min_time."""
        # 1. Semantic Search
        if keyword and len(keyword) > 3:
            for seg in segments:
                if seg['start'] >= min_time and keyword.lower() in seg['text'].lower():
                    print(f"   ✅ Found slide for '{keyword}' at {seg['start']:.2f}s")
                    return seg['start']
        
        # 2. Fallback: Just move forward a bit
        return min_time + 4.0 

    def extract_keywords(self, script):
        """Extracts significant words from script to match slides."""
        text = f"{script.get('fact_title', '')} {script.get('fact_spoken', '')}"
        ignore = {'the', 'a', 'is', 'of', 'to', 'in', 'and', 'for', 'did', 'you', 'know'}
        
        words = []
        for w in text.split():
            clean = w.lower().strip(".,?!")
            if len(clean) > 4 and clean not in ignore:
                words.append(clean)
        
        return list(dict.fromkeys(words)) # Unique ordered list

    def schedule_clips(self, video_path, total_duration, script):
        """
        Returns a list of: {'start': float, 'duration': float}
        """
        segments = self.get_transcript(video_path)
        keywords = self.extract_keywords(script)
        
        schedule = []
        current_cursor = 0.0 # Where we are in the source video
        generated_duration = 0.0
        
        while generated_duration < total_duration:
            
            # 1. Determine Clip Duration (Fast Pacing)
            clip_dur = random.uniform(2.0, 3.5)
            remaining = total_duration - generated_duration
            if remaining < clip_dur: clip_dur = remaining
            
            # 2. Determine Start Time (Content Matching)
            keyword = keywords.pop(0) if keywords else None
            start_time = self.find_best_timestamp(segments, keyword, current_cursor)
            
            schedule.append({
                "start": start_time,
                "duration": clip_dur
            })
            
            # Advance cursor so next clip is from a later part of video
            current_cursor = start_time + clip_dur 
            generated_duration += clip_dur
            
        return schedule