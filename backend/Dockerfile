FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Default port for Railway
ENV PORT 8000

# Set work directory
WORKDIR /app

# Install system dependencies (for psycopg2 if needed, though binary is used)
# RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY . .

# Expose the application port
EXPOSE 8000

# Start command using the PORT environment variable
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
