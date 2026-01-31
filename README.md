# Auto Editor

A mobile-first web application for automatically removing dead space and silence from videos. Upload one or multiple videos, and the app will:

- Automatically detect and mark silent segments
- Generate a transcript with word-level timestamps
- Allow you to remove segments by clicking in the timeline or highlighting transcript text
- Export a clean, edited video

## Features

- **Drag & Drop Upload** - Upload single or multiple videos
- **Automatic Silence Detection** - Configurable threshold (0.5s - 2s)
- **Transcript-Based Editing** - Highlight words to remove that portion of video
- **Visual Timeline** - See and toggle segments on a timeline
- **Mobile-First UI** - Clean, touch-friendly interface
- **No Login Required** - Simple, instant access

## Tech Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Lucide React icons

**Backend:**
- Python FastAPI
- OpenAI Whisper (transcription)
- FFmpeg (video processing)
- pydub (audio analysis)

---

## Deployment

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

#### Step 1: Deploy Backend to Railway

1. Go to [Railway](https://railway.app) and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `auto-editor` repository
4. Set the **Root Directory** to `backend`
5. Railway will auto-detect the Dockerfile and deploy
6. Once deployed, go to **Settings** → **Domains** → **Generate Domain**
7. Copy your backend URL (e.g., `https://auto-editor-backend-production.up.railway.app`)

#### Step 2: Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** → Import `auto-editor`
3. Set the **Root Directory** to `frontend`
4. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: Your Railway backend URL from Step 1
5. Click **Deploy**

#### Step 3: Update CORS (if needed)

If you get CORS errors, the backend already allows all origins. If you want to restrict it, edit `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-app.vercel.app"],
    ...
)
```

---

### Option 2: Railway (Both Frontend & Backend)

Deploy both services on Railway:

1. Create two services from the same repo
2. Service 1 (Backend): Root directory = `backend`
3. Service 2 (Frontend): Root directory = `frontend`, add `VITE_API_URL` env var pointing to backend

---

### Option 3: Docker (Self-hosted)

```bash
docker-compose up --build
```

---

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.10+
- FFmpeg installed on your system

#### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install ffmpeg
```

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at http://localhost:3000

---

## Usage

1. **Upload** - Tap the upload area or drag videos onto it
2. **Configure** - Adjust silence threshold (0.5s - 2.0s)
3. **Process** - Tap "Process" to analyze and transcribe
4. **Edit** - Use Timeline or Transcript view to toggle segments:
   - **Timeline**: Tap segments to toggle keep/remove
   - **Transcript**: Long-press and drag to select words to remove
5. **Export** - Tap "Export Video" to download the edited result

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload video files |
| POST | `/analyze/{project_id}` | Analyze video for silence and generate transcript |
| POST | `/edit` | Update segment selections |
| POST | `/export/{project_id}` | Export edited video |
| GET | `/project/{project_id}` | Get project status |
| GET | `/download/{project_id}` | Download exported video |
| DELETE | `/project/{project_id}` | Delete project |

---

## Configuration

### Silence Detection Threshold

The slider controls the minimum duration of silence to detect:
- **0.5s** - Aggressive (removes short pauses)
- **1.0s** - Balanced (default)
- **2.0s** - Conservative (only removes long pauses)

### Whisper Model

The default Whisper model is `base`. For better accuracy (slower), edit `backend/app/services/transcriber.py`:

```python
def __init__(self, model_size: str = "small"):  # or "medium", "large"
```

---

## License

MIT
