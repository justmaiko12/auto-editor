from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel

from app.services.video_processor import VideoProcessor
from app.services.transcriber import Transcriber
from app.services.silence_detector import SilenceDetector

app = FastAPI(title="Auto-Editor API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Mount static files for serving processed videos
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# In-memory project storage (in production, use a database)
projects = {}


class Segment(BaseModel):
    start: float
    end: float
    text: Optional[str] = None
    is_silence: bool = False
    keep: bool = True


class Project(BaseModel):
    id: str
    status: str
    videos: List[str]
    segments: List[Segment] = []
    transcript: List[dict] = []
    duration: float = 0
    output_path: Optional[str] = None


class EditRequest(BaseModel):
    project_id: str
    segments: List[Segment]


class ProcessRequest(BaseModel):
    project_id: str
    silence_threshold: float = 1.0  # seconds


@app.get("/")
async def root():
    return {"message": "Auto-Editor API", "status": "running"}


@app.post("/upload")
async def upload_videos(files: List[UploadFile] = File(...)):
    """Upload one or more videos and create a new project."""
    project_id = str(uuid.uuid4())
    project_dir = UPLOAD_DIR / project_id
    project_dir.mkdir(exist_ok=True)
    
    video_paths = []
    
    for i, file in enumerate(files):
        if not file.content_type or not file.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail=f"File {file.filename} is not a video")
        
        # Save file
        file_ext = Path(file.filename).suffix or ".mp4"
        file_path = project_dir / f"video_{i}{file_ext}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        video_paths.append(str(file_path))
    
    # Create project
    project = Project(
        id=project_id,
        status="uploaded",
        videos=video_paths
    )
    projects[project_id] = project
    
    return {"project_id": project_id, "videos_count": len(video_paths)}


@app.post("/analyze/{project_id}")
async def analyze_video(project_id: str, silence_threshold: float = 1.0):
    """Analyze video for silence and generate transcript."""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects[project_id]
    project.status = "analyzing"
    
    try:
        processor = VideoProcessor()
        transcriber = Transcriber()
        silence_detector = SilenceDetector()
        
        # Combine videos if multiple
        if len(project.videos) > 1:
            combined_path = str(UPLOAD_DIR / project_id / "combined.mp4")
            processor.combine_videos(project.videos, combined_path)
            video_path = combined_path
        else:
            video_path = project.videos[0]
        
        # Get video duration
        duration = processor.get_duration(video_path)
        project.duration = duration
        
        # Detect silence
        silent_segments = silence_detector.detect_silence(
            video_path, 
            min_silence_duration=silence_threshold
        )
        
        # Generate transcript with timestamps
        transcript = transcriber.transcribe(video_path)
        project.transcript = transcript
        
        # Create segments from transcript and silence detection
        segments = create_segments(transcript, silent_segments, duration, silence_threshold)
        project.segments = segments
        
        project.status = "analyzed"
        
        return {
            "project_id": project_id,
            "duration": duration,
            "segments": [s.dict() for s in segments],
            "transcript": transcript
        }
        
    except Exception as e:
        project.status = "error"
        raise HTTPException(status_code=500, detail=str(e))


def create_segments(transcript: List[dict], silent_segments: List[tuple], 
                    duration: float, silence_threshold: float) -> List[Segment]:
    """Create timeline segments from transcript and silence detection."""
    segments = []
    
    # Add transcript segments
    for word in transcript:
        segments.append(Segment(
            start=word["start"],
            end=word["end"],
            text=word["text"],
            is_silence=False,
            keep=True
        ))
    
    # Add silence segments
    for start, end in silent_segments:
        if end - start >= silence_threshold:
            segments.append(Segment(
                start=start,
                end=end,
                text="[silence]",
                is_silence=True,
                keep=False  # Mark silence as not kept by default
            ))
    
    # Sort by start time
    segments.sort(key=lambda x: x.start)
    
    return segments


@app.post("/edit")
async def update_segments(request: EditRequest):
    """Update segment selections (keep/remove)."""
    if request.project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects[request.project_id]
    project.segments = request.segments
    
    return {"status": "updated", "segments_count": len(request.segments)}


@app.post("/export/{project_id}")
async def export_video(project_id: str):
    """Export the final edited video."""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects[project_id]
    project.status = "exporting"
    
    try:
        processor = VideoProcessor()
        
        # Get source video
        if len(project.videos) > 1:
            video_path = str(UPLOAD_DIR / project_id / "combined.mp4")
        else:
            video_path = project.videos[0]
        
        # Get segments to keep
        keep_segments = [(s.start, s.end) for s in project.segments if s.keep]
        
        if not keep_segments:
            raise HTTPException(status_code=400, detail="No segments selected to keep")
        
        # Export
        output_path = str(OUTPUT_DIR / f"{project_id}_edited.mp4")
        processor.export_segments(video_path, keep_segments, output_path)
        
        project.output_path = output_path
        project.status = "completed"
        
        return {
            "status": "completed",
            "download_url": f"/outputs/{project_id}_edited.mp4"
        }
        
    except Exception as e:
        project.status = "error"
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/project/{project_id}")
async def get_project(project_id: str):
    """Get project status and data."""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects[project_id]
    return project.dict()


@app.get("/download/{project_id}")
async def download_video(project_id: str):
    """Download the exported video."""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects[project_id]
    
    if not project.output_path or not os.path.exists(project.output_path):
        raise HTTPException(status_code=404, detail="Video not ready for download")
    
    return FileResponse(
        project.output_path,
        media_type="video/mp4",
        filename=f"edited_video_{project_id[:8]}.mp4"
    )


@app.delete("/project/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and its files."""
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Clean up files
    project_dir = UPLOAD_DIR / project_id
    if project_dir.exists():
        shutil.rmtree(project_dir)
    
    output_file = OUTPUT_DIR / f"{project_id}_edited.mp4"
    if output_file.exists():
        output_file.unlink()
    
    del projects[project_id]
    
    return {"status": "deleted"}
