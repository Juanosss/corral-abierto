FROM python:3.10-slim

# Install system dependencies (ffmpeg and curl)
RUN apt-get update && apt-get install -y ffmpeg curl && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port (Render Free Web Service expects a bound port)
EXPOSE 10000

# Start Flask app and background transcriber loop
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "audio_transcriber:app"]
