import httpx, asyncio
from typing import List, Tuple
from io import BytesIO

def _is_pdf(url: str, content_type: str) -> bool:
    if content_type and "application/pdf" in content_type.lower():
        return True
    return url.lower().endswith(".pdf")

def _extract_pdf_text(pdf_bytes: bytes, cap: int = 500_000) -> str:
    """Extract text from PDF bytes using pdfminer.six. Cap to avoid huge files."""
    from pdfminer.high_level import extract_text
    data = pdf_bytes[:cap]
    try:
        return extract_text(BytesIO(data)) or ""
    except Exception:
        return ""

async def _fetch_one(client: httpx.AsyncClient, url: str, timeout: float) -> Tuple[str, str, str]:
    try:
        r = await client.get(url, timeout=timeout)
        r.raise_for_status()
        ct = r.headers.get("content-type", "") or ""
        if _is_pdf(url, ct):
            text = _extract_pdf_text(r.content)
            return url, text, "application/pdf"
        else:
            return url, r.text, (ct or "text/html")
    except Exception:
        return url, "", ""

async def _fetch_all(urls: List[str], timeout: float = 10.0):
    limits = httpx.Limits(max_keepalive_connections=10, max_connections=20)
    headers = {"User-Agent": "Mozilla/5.0"}
    async with httpx.AsyncClient(follow_redirects=True, limits=limits, headers=headers) as client:
        tasks = [_fetch_one(client, u, timeout) for u in urls]
        return await asyncio.gather(*tasks)

def fetch_html_bulk(urls: List[str], timeout: float = 10.0) -> List[Tuple[str, str, str]]:
    """Return list of (url, text, mime). If PDF, text is already extracted."""
    if not urls:
        return []
    return asyncio.run(_fetch_all(urls, timeout=timeout))
