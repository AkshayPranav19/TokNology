
# TokNology: Geo-Regulation & Risk Orchestrator

A lightweight system that helps teams spot **region-specific legal requirements** and **risk hot-spots** for any product feature.

It runs two AI agents (LawFinder & Risk Evaluator), a Node backend that orchestrates them, and a Vite frontend dashboard. Built for the TikTok TechJam context, but general enough for any product org.

---

## Table of contents
- [Why this exists](#why-this-exists)
- [What it does](#what-it-does)
- [Architecture](#architecture)
- [Quick start (Docker)](#quick-start-docker)
- [Run locally (without Docker)](#run-locally-without-docker)
- [Environment variables](#environment-variables)
- [API (backend)](#api-backend)
- [Frontend usage](#frontend-usage)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Security & secrets hygiene](#security--secrets-hygiene)
- [Roadmap](#roadmap)
- [License](#license)
- [Maintainers](#maintainers)

---

## Why this exists

- Product features often need **different logic per region** (e.g., GDPR, data localization, youth safety, copyright).
- Teams want a **traceable, auditable** way to answer: _Does this feature trigger geo-specific obligations?_ and _What is the risk level, and why?_

## What it does

- **LawFinder Agent** – extracts likely regulatory obligations and citations/keywords by region.
- **Risk Evaluator Agent** – scores impact × likelihood, explains the score, and highlights unknowns.
- **Backend Orchestrator** – calls both agents, merges results, and exposes a small HTTP API.
- **Frontend (Vite)** – a simple dashboard to submit a feature and view results.

## Architecture

```
[Frontend (Vite, :5173)]
        |
        v
[Backend Orchestrator (Node, :5050)]
   |------------------> [LawFinder Agent (:8000)]
   |------------------> [Risk Evaluator Agent (:18002)]
```

---

## Quick start (Docker)

```bash
git clone https://github.com/AkshayPranav19/TokNology.git
cd TokNology

docker compose build && docker compose up -d
```

Smoke tests:

```bash
# Backend
curl http://localhost:5050/healthz

# Optional quick hooks (if enabled)
curl http://localhost:5050/a1-test
curl http://localhost:5050/a2-test
```

Open in browser:

- Backend: http://localhost:5050  
- LawFinder: http://localhost:8000  
- Risk Evaluator: http://localhost:18002  
- Frontend: http://localhost:5173

---

## Run locally (without Docker)

### Backend
```bash
cd backend
npm install
npm run dev     # or: node server.js
# → http://localhost:5050
```

### Frontend
```bash
cd toknology-frontend
npm install
npm run dev
# → http://localhost:5173
```

> Make sure both agents are running and the backend can reach them (see env below).

---

## Environment variables

Create `.env` files with your keys and configuration. Keep real secrets **out of Git**.  
If you commit a template, name it `.env.example` with dummy values.

### Backend `.env` (example)
```ini
PORT=5050
LAW_FINDER_URL=http://localhost:8000
RISK_EVALUATOR_URL=http://localhost:18002

# Optional providers (use what your agents need)
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Optional storage/telemetry
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=public_anon_key
```

### Frontend `.env` (Vite requires `VITE_` prefix)
```ini
VITE_BACKEND_URL=http://localhost:5050
```

---

## API (backend)

### `GET /healthz`
Simple liveness check.

### `GET /a1-test` and `GET /a2-test`
Agent smoke checks (if enabled).

### `POST /analyze`
Analyze a single feature and get merged results.

**Request body (example)**

```json
{
  "feature_id": "F123",
  "title": "FR copyright download blocking",
  "text": "Feature reads user location to enforce France copyright download blocking.",
  "region": "EU"
}
```

**Response (example)**

```json
{
  "feature_id": "F123",
  "inputs": { "feature_id": "F123", "title": "...", "text": "...", "region": "EU" },
  "law_finder": {
    "regions": [
      {
        "region": "EU/France",
        "obligations": [
          "Location processing must have lawful basis",
          "Show consent for geoblocking if applicable"
        ],
        "notes": "GDPR, DSM Copyright Directive",
        "keywords": ["GDPR", "geolocation", "copyright"]
      }
    ]
  },
  "risk_evaluator": {
    "score": 7.5,
    "level": "High",
    "rationale": "Personal data + access restriction -> legal/reputation risk",
    "assumptions": ["No cross-border transfer outside EU"]
  },
  "timestamp": "2025-08-30T09:30:00Z"
}
```

---

## Frontend usage

1. Start the frontend (`npm run dev`) and open `http://localhost:5173`.
2. Fill in **feature title / description / region** and submit.
3. Review:
   - Extracted **obligations** by region
   - **Risk score** with rationale
   - **Keywords** for further investigation

---

## Project structure

```
TokNology/
├─ backend/                 # Node API (orchestrator)
│  ├─ server.js
│  ├─ routes/               # /analyze, /healthz, test hooks
│  └─ utils/                # merging, validation, (optional) CSV export
├─ toknology-frontend/      # Vite + React UI
│  └─ src/
│     ├─ components/
│     └─ pages/
├─ lawfinder_agent/         # Python service (name may differ)
├─ risk_evaluator/          # Python service (name may differ)
├─ docker-compose.yml
└─ README.md
```

> If your agent folders have different names, keep the mapping consistent in `docker-compose.yml` and the backend env (`LAW_FINDER_URL`, `RISK_EVALUATOR_URL`).

---

## Troubleshooting

- **Port already in use**  
  Change the port or kill the existing process. On macOS/Linux: `lsof -i :5050` then `kill -9 <pid>`.

- **Frontend loads but API fails (CORS or 404)**  
  Check `VITE_BACKEND_URL` and confirm the backend printed `Listening on :5050`.

- **Backend can't reach agents**  
  Verify `LAW_FINDER_URL` and `RISK_EVALUATOR_URL`. From the backend container/shell, `curl` those URLs.

- **Missing env**  
  If an API key is required by your agent, the service will usually log a clear startup error.

- **Docker builds but nothing shows**  
  `docker compose logs -f backend` (or `frontend`, `lawfinder`, `risk_evaluator`) to see live logs.

---

## Security & secrets hygiene

- Never commit real keys. Use `.env` locally and `.env.example` for templates.
- Rotate any key that was ever pushed to Git history.
- Keep provider logs and prompts free of personal data in demo mode.

---

## Roadmap

- Bulk analyze: upload a CSV of features and batch results.
- Saved runs + filtering (by product area, region, risk band).
- Side-by-side diff to compare two revisions of the same feature.
- Pluggable policy packs (e.g., EU youth safety, India IT Rules).

---

## License

MIT.

---

## Maintainers

Team TokNology — TikTok TechJam
