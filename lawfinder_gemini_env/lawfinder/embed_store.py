
import os, time, hashlib
from langchain.schema import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings  # Gemini embeddings

EMBED_MODEL = "models/text-embedding-004"
_EMB = None

def _get_embedder():
    global _EMB
    if _EMB is None:
        # Requires GOOGLE_API_KEY in environment (loaded from .env via __init__)
        _EMB = GoogleGenerativeAIEmbeddings(model=EMBED_MODEL)
    return _EMB

def make_index_id(feature_summary: str, regions: list[str]) -> str:
    raw = f"{feature_summary}|{','.join(sorted(regions))}|{int(time.time())}"
    return hashlib.sha1(raw.encode()).hexdigest()[:12]

def build_index(index_root: str, index_id: str, docs: list[Document]) -> None:
    from langchain_community.vectorstores import Chroma
    persist_dir = os.path.join(index_root, index_id)
    Chroma.from_documents(docs, embedding=_get_embedder(), persist_directory=persist_dir)
