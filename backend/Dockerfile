FROM python:3.11-slim

# Install FFmpeg and other dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Whisper model during build to speed up runtime
RUN python -c "import whisper; whisper.load_model('base')"

# Copy application code
COPY . .

# Create upload and output directories
RUN mkdir -p uploads outputs

# Use PORT env variable (Railway sets this)
ENV PORT=8000

# Expose port
EXPOSE $PORT

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
