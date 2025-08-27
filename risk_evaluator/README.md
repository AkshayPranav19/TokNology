# Agent 3 Demo (Risk Arbiter) — Port 18002

**Note on ports:** TCP ports must be 0–65535. `80002` is invalid, so this demo binds to **18002** by default.
You can override with `PORT` env var (e.g., `PORT=18002` or `PORT=8002`).

## Setup
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` with:
```
GOOGLE_API_KEY=YOUR_KEY
PORT=18002
```

## Run
```bash
uvicorn app:app --host 0.0.0.0 --port 18002 --reload
# or simply:
python app.py
```

## Test
```bash
curl -s -X POST http://localhost:18002/agent3/assess-demo -H "Content-Type: application/json" -d '{}'
```
