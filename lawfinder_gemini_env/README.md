
# LawFinder A1 (Gemini, .env-ready)
- Region guardrails (.utah.gov, etc.) + parallel fetch + Gemini embeddings
- Auto-loads `.env` via python-dotenv (see .env.example)

## Quickstart
```
python -m venv venv
venv\Scripts\Activate.ps1     # or source venv/bin/activate
pip install -e .
# create .env from template and set GOOGLE_API_KEY
copy .env.example .env
# edit .env and paste your key
python -m lawfinder.cli "Curfew login blocker with ASL/GH for Utah minors" "Utah"
```
API:
```
uvicorn lawfinder.service:app --host 0.0.0.0 --port 8000
```
