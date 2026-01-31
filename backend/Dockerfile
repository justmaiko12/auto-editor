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

# Expose port
EXPOSE 8000

# Run the application - Railway sets PORT env var
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
