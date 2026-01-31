import subprocess
import json
from pathlib import Path
from typing import List, Tuple
import tempfile
import os


class VideoProcessor:
    """Handles video processing operations using FFmpeg."""
    
    def get_duration(self, video_path: str) -> float:
        """Get video duration in seconds."""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        
        return float(data["format"]["duration"])
    
    def combine_videos(self, video_paths: List[str], output_path: str) -> str:
        """Combine multiple videos into one."""
        # Create a temporary file list for FFmpeg concat
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            for path in video_paths:
                # Escape single quotes in path
                escaped_path = path.replace("'", "'\\''")
                f.write(f"file '{escaped_path}'\n")
            concat_file = f.name
        
        try:
            # First, re-encode all videos to same format for safe concatenation
            normalized_paths = []
            for i, path in enumerate(video_paths):
                normalized_path = str(Path(output_path).parent / f"normalized_{i}.mp4")
                self._normalize_video(path, normalized_path)
                normalized_paths.append(normalized_path)
            
            # Create new concat file with normalized videos
            with open(concat_file, 'w') as f:
                for path in normalized_paths:
                    escaped_path = path.replace("'", "'\\''")
                    f.write(f"file '{escaped_path}'\n")
            
            # Concatenate
            cmd = [
                "ffmpeg",
                "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c", "copy",
                output_path
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Clean up normalized files
            for path in normalized_paths:
                if os.path.exists(path):
                    os.remove(path)
            
            return output_path
            
        finally:
            os.unlink(concat_file)
    
    def _normalize_video(self, input_path: str, output_path: str):
        """Normalize video to standard format for concatenation."""
        cmd = [
            "ffmpeg",
            "-y",
            "-i", input_path,
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            "-ar", "44100",
            "-ac", "2",
            "-r", "30",
            "-s", "1920x1080",
            "-pix_fmt", "yuv420p",
            output_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
    
    def export_segments(self, video_path: str, segments: List[Tuple[float, float]], 
                       output_path: str) -> str:
        """Export video with only the specified segments."""
        if not segments:
            raise ValueError("No segments to export")
        
        # Merge overlapping/adjacent segments
        merged_segments = self._merge_segments(segments)
        
        # Create filter complex for segment extraction
        filter_parts = []
        concat_inputs = []
        
        for i, (start, end) in enumerate(merged_segments):
            duration = end - start
            # Video filter
            filter_parts.append(
                f"[0:v]trim=start={start}:duration={duration},setpts=PTS-STARTPTS[v{i}]"
            )
            # Audio filter
            filter_parts.append(
                f"[0:a]atrim=start={start}:duration={duration},asetpts=PTS-STARTPTS[a{i}]"
            )
            concat_inputs.append(f"[v{i}][a{i}]")
        
        # Concatenate all segments
        filter_complex = ";".join(filter_parts)
        filter_complex += f";{''.join(concat_inputs)}concat=n={len(merged_segments)}:v=1:a=1[outv][outa]"
        
        cmd = [
            "ffmpeg",
            "-y",
            "-i", video_path,
            "-filter_complex", filter_complex,
            "-map", "[outv]",
            "-map", "[outa]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "128k",
            output_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        return output_path
    
    def _merge_segments(self, segments: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Merge overlapping or adjacent segments."""
        if not segments:
            return []
        
        # Sort by start time
        sorted_segments = sorted(segments, key=lambda x: x[0])
        merged = [sorted_segments[0]]
        
        for start, end in sorted_segments[1:]:
            last_start, last_end = merged[-1]
            
            # If overlapping or adjacent (within 0.1s), merge
            if start <= last_end + 0.1:
                merged[-1] = (last_start, max(last_end, end))
            else:
                merged.append((start, end))
        
        return merged
    
    def extract_audio(self, video_path: str, audio_path: str) -> str:
        """Extract audio from video for analysis."""
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
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        return audio_path
    
    def get_video_info(self, video_path: str) -> dict:
        """Get detailed video information."""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        return json.loads(result.stdout)
