# --- Base ---
FROM python:3.11-slim

# Keep runtime neat and deterministic
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# For healthchecks (wget) and TLS roots
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# --- Workdir ---
WORKDIR /app

# Copy only the app file
COPY app.py ./app.py

# --- Python deps ---
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install \
      fastapi \
      "uvicorn[standard]" \
      python-dotenv \
      google-generativeai \
      pydantic

# Default port & expose
ENV PORT=18002
EXPOSE 18002

# --- Start server ---
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "18002"]
