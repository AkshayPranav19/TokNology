# TikTok Hackathon – AI Agents Orchestrator

This project runs **2 AI agents (LawFinder & Risk Evaluator)** plus a backend orchestrator and frontend dashboard.

---

## 🚀 Quick Start (Docker)

```bash
docker compose build
docker compose up
```

- **LawFinder Agent** → http://localhost:8000  
- **Risk Evaluator Agent** → http://localhost:18002  
- **Backend Orchestrator** → http://localhost:5050  

---

## 🖥️ Run Backend (without Docker)

```bash
cd backend
npm install
npm run dev   # or: node server.js
```

Backend available at → http://localhost:5050  

---

## 🌐 Run Frontend (without Docker)

```bash
cd frontend
npm install
npm run dev
```

Frontend available at → http://localhost:5173  

---

## 🔑 Notes

- Create `.env` files with your Supabase keys and API configuration.  
- Useful test endpoints for backend:  
  - `http://localhost:5050/healthz`  
  - `http://localhost:5050/a1-test`  
  - `http://localhost:5050/a2-test`  
  - `http://localhost:5050/analyze`  
