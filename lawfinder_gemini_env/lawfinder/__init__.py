
# Auto-load environment variables from .env at package import
try:
    from dotenv import load_dotenv
    load_dotenv()  # loads GOOGLE_API_KEY, etc.
except Exception:
    pass

__all__ = ["schemas", "guardrails", "seeds", "search", "fetch", "clean", "chunk", "embed_store", "llm_rank", "agent", "service", "cli"]
