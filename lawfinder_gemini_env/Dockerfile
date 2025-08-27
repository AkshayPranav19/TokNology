# # Use a slim Python base
# FROM python:3.11-slim

# # Set environment variables
# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1

# # Install system deps
# RUN apt-get update && apt-get install -y \
#     build-essential \
#     poppler-utils \
#     && rm -rf /var/lib/apt/lists/*

# # Create working directory
# WORKDIR /app

# # Copy pyproject.toml and project files
# COPY pyproject.toml ./
# COPY lawfinder ./lawfinder
# COPY indices ./indices
# COPY .env ./.env

# # Install pip & deps
# RUN pip install --upgrade pip setuptools wheel \
#     && pip install -e .

# # Expose port for uvicorn
# EXPOSE 8000

# # Default command: run FastAPI server
# CMD ["uvicorn", "lawfinder.service:app", "--host", "0.0.0.0", "--port", "8000"]
# Use a slim Python base
FROM python:3.11-slim

# Environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System deps (add curl for healthcheck if you switch compose to curl)
RUN apt-get update && apt-get install -y \
    build-essential \
    poppler-utils \
    curl \
 && rm -rf /var/lib/apt/lists/*

# Workdir
WORKDIR /app

# Copy only what’s needed to build/install
COPY pyproject.toml ./
COPY lawfinder/ ./lawfinder/

# Ensure indices path exists (will be bind-mounted at runtime)
RUN mkdir -p /app/indices

# Install deps
RUN python -m pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir .

# Expose port
EXPOSE 8000

# Start FastAPI (adjust module if your app path differs)
CMD ["uvicorn", "lawfinder.service:app", "--host", "0.0.0.0", "--port", "8000"]
