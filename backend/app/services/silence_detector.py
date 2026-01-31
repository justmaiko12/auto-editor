import subprocess
import json
import tempfile
import os
from typing import List, Tuple
from pydub import AudioSegment
from pydub.silence import detect_silence, detect_nonsilent
import numpy as np


class SilenceDetector:
    """Detects silence/dead space in videos."""
    
    def detect_silence(self, video_path: str, min_silence_duration: float = 1.0,
                       silence_thresh_db: int = -40) -> List[Tuple[float, float]]:
        """
        Detect silent segments in video.
        
        Args:
            video_path: Path to video file
            min_silence_duration: Minimum silence duration in seconds (0.5-2.0)
            silence_thresh_db: Silence threshold in dB (default -40)
            
        Returns:
            List of (start, end) tuples for silent segments in seconds
        """
        # Extract audio to temp file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            audio_path = f.name
        
        try:
            # Extract audio using FFmpeg
            self._extract_audio(video_path, audio_path)
            
            # Load audio with pydub
            audio = AudioSegment.from_wav(audio_path)
            
            # Detect silence (returns milliseconds)
            min_silence_ms = int(min_silence_duration * 1000)
            
            silent_ranges = detect_silence(
                audio,
                min_silence_len=min_silence_ms,
                silence_thresh=silence_thresh_db
            )
            
            # Convert to seconds
            silent_segments = [
                (start / 1000.0, end / 1000.0)
                for start, end in silent_ranges
            ]
            
            return silent_segments
            
        finally:
            if os.path.exists(audio_path):
                os.unlink(audio_path)
    
    def detect_nonsilent_segments(self, video_path: str, min_silence_duration: float = 1.0,
                                   silence_thresh_db: int = -40) -> List[Tuple[float, float]]:
        """
        Detect non-silent (speaking) segments in video.
        
        Returns:
            List of (start, end) tuples for non-silent segments in seconds
        """
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            audio_path = f.name
        
        try:
            self._extract_audio(video_path, audio_path)
            audio = AudioSegment.from_wav(audio_path)
            
            min_silence_ms = int(min_silence_duration * 1000)
            
            nonsilent_ranges = detect_nonsilent(
                audio,
                min_silence_len=min_silence_ms,
                silence_thresh=silence_thresh_db
            )
            
            nonsilent_segments = [
                (start / 1000.0, end / 1000.0)
                for start, end in nonsilent_ranges
            ]
            
            return nonsilent_segments
            
        finally:
            if os.path.exists(audio_path):
                os.unlink(audio_path)
    
    def _extract_audio(self, video_path: str, audio_path: str):
        """Extract audio from video file."""
        cmd = [
            "ffmpeg",
            "-y",
            "-i", video_path,
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            audio_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True, text=True)
    
    def get_audio_levels(self, video_path: str, segment_duration: float = 0.1) -> List[dict]:
        """
        Get audio levels over time for visualization.
        
        Returns list of {time, level} dicts for waveform display.
        """
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            audio_path = f.name
        
        try:
            self._extract_audio(video_path, audio_path)
            audio = AudioSegment.from_wav(audio_path)
            
            duration_ms = len(audio)
            segment_ms = int(segment_duration * 1000)
            
            levels = []
            for i in range(0, duration_ms, segment_ms):
                segment = audio[i:i + segment_ms]
                if len(segment) > 0:
                    levels.append({
                        "time": i / 1000.0,
                        "level": segment.dBFS if segment.dBFS > -float('inf') else -60
                    })
            
            return levels
            
        finally:
            if os.path.exists(audio_path):
                os.unlink(audio_path)
