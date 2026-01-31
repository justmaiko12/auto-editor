import whisper
import tempfile
import os
from typing import List, Dict
from pathlib import Path


class Transcriber:
    """Handles video transcription using OpenAI Whisper."""
    
    def __init__(self, model_size: str = "tiny"):
        """
        Initialize transcriber with specified model size.
        Options: tiny, base, small, medium, large
        """
        self.model = None
        self.model_size = model_size
    
    def _load_model(self):
        """Lazy load the Whisper model."""
        if self.model is None:
            self.model = whisper.load_model(self.model_size)
    
    def transcribe(self, video_path: str) -> List[Dict]:
        """
        Transcribe video and return word-level timestamps.
        
        Returns list of dicts with:
        - text: the word/phrase
        - start: start time in seconds
        - end: end time in seconds
        """
        self._load_model()
        
        # Transcribe with word timestamps
        result = self.model.transcribe(
            video_path,
            word_timestamps=True,
            language="en"
        )
        
        # Extract word-level timestamps
        words = []
        
        for segment in result.get("segments", []):
            for word_info in segment.get("words", []):
                words.append({
                    "text": word_info["word"].strip(),
                    "start": round(word_info["start"], 3),
                    "end": round(word_info["end"], 3)
                })
        
        # If no word-level timestamps, fall back to segment level
        if not words:
            for segment in result.get("segments", []):
                words.append({
                    "text": segment["text"].strip(),
                    "start": round(segment["start"], 3),
                    "end": round(segment["end"], 3)
                })
        
        return words
    
    def transcribe_with_segments(self, video_path: str) -> Dict:
        """
        Transcribe video and return both segments and words.
        
        Returns dict with:
        - segments: list of sentence-level segments
        - words: list of word-level timestamps
        - full_text: complete transcript
        """
        self._load_model()
        
        result = self.model.transcribe(
            video_path,
            word_timestamps=True,
            language="en"
        )
        
        segments = []
        words = []
        
        for segment in result.get("segments", []):
            segments.append({
                "text": segment["text"].strip(),
                "start": round(segment["start"], 3),
                "end": round(segment["end"], 3)
            })
            
            for word_info in segment.get("words", []):
                words.append({
                    "text": word_info["word"].strip(),
                    "start": round(word_info["start"], 3),
                    "end": round(word_info["end"], 3)
                })
        
        return {
            "segments": segments,
            "words": words,
            "full_text": result.get("text", "").strip()
        }
