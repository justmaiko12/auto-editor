from faster_whisper import WhisperModel
from typing import List, Dict


class Transcriber:
    """Handles video transcription using faster-whisper (lightweight)."""
    
    def __init__(self, model_size: str = "tiny"):
        """
        Initialize transcriber with specified model size.
        Options: tiny, base, small, medium, large-v2
        """
        self.model = None
        self.model_size = model_size
    
    def _load_model(self):
        """Lazy load the Whisper model."""
        if self.model is None:
            self.model = WhisperModel(
                self.model_size, 
                device="cpu",
                compute_type="int8"
            )
    
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
        segments, info = self.model.transcribe(
            video_path,
            word_timestamps=True,
            language="en"
        )
        
        # Extract word-level timestamps
        words = []
        
        for segment in segments:
            if segment.words:
                for word_info in segment.words:
                    words.append({
                        "text": word_info.word.strip(),
                        "start": round(word_info.start, 3),
                        "end": round(word_info.end, 3)
                    })
            else:
                # Fallback to segment level
                words.append({
                    "text": segment.text.strip(),
                    "start": round(segment.start, 3),
                    "end": round(segment.end, 3)
                })
        
        return words
    
    def transcribe_with_segments(self, video_path: str) -> Dict:
        """
        Transcribe video and return both segments and words.
        """
        self._load_model()
        
        segments_list, info = self.model.transcribe(
            video_path,
            word_timestamps=True,
            language="en"
        )
        
        segments = []
        words = []
        full_text = []
        
        for segment in segments_list:
            segments.append({
                "text": segment.text.strip(),
                "start": round(segment.start, 3),
                "end": round(segment.end, 3)
            })
            full_text.append(segment.text.strip())
            
            if segment.words:
                for word_info in segment.words:
                    words.append({
                        "text": word_info.word.strip(),
                        "start": round(word_info.start, 3),
                        "end": round(word_info.end, 3)
                    })
        
        return {
            "segments": segments,
            "words": words,
            "full_text": " ".join(full_text)
        }
