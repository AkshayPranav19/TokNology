
from fastapi import FastAPI
from .schemas import LawFinderInput, LawFinderOutput
from .agent import LawFinderAgent
app = FastAPI(title="LawFinder A1 (Gemini + .env)", version="0.3.1")
_agent = LawFinderAgent(index_root="./indices")
@app.get("/healthz")
def healthz(): return {"status":"ok"}
@app.post("/v1/run", response_model=LawFinderOutput)
def run(input: LawFinderInput) -> LawFinderOutput:
    return _agent.run(input)
