
from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class LawFinderInput(BaseModel):
    feature_summary: str
    regions: List[str]
    min_year: Optional[int] = 2023

class Source(BaseModel):
    url: HttpUrl
    title: str
    jurisdiction: str
    snippet: str

class LawFinderOutput(BaseModel):
    index_id: str
    sources: List[Source]
