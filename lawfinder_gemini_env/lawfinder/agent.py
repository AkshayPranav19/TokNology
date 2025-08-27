
import os
from urllib.parse import urlparse
from .schemas import LawFinderInput,LawFinderOutput,Source
from .guardrails import allowed_for_regions,year_present,rank_key
from .search import smart_search_parallel
from .fetch import fetch_html_bulk
from .clean import html_to_clean_text
from .chunk import chunk_text
from .embed_store import build_index,make_index_id
from .seeds import seeds_for_regions
from .llm_rank import score_sources

CURATED=["https://www.missingkids.org/"]

def infer_jurisdiction(url:str,regions:list[str])->str:
    h=urlparse(url).netloc.lower()
    if "europa.eu" in h: return "EU"
    if "flsenate" in h or "myfloridahouse" in h: return "Florida"
    if "utah.gov" in h: return "Utah"
    if "ca.gov" in h: return "California"
    if "law.cornell.edu" in h: return "US Federal (Cornell)"
    if "wikipedia.org" in h: return "General (Wikipedia)"
    return regions[0] if regions else "Unknown"

class LawFinderAgent:
    def __init__(self,index_root:str="./indices"):
        self.index_root=index_root; os.makedirs(self.index_root,exist_ok=True)
    def _queries(self,feature_summary:str,regions:list[str]):
        qs=[]
        for r in regions:
            key=r.lower()
            if key=="utah":
                qs+= [f"{feature_summary} site:le.utah.gov",
                      f"{feature_summary} site:dcp.utah.gov",
                      f"{feature_summary} site:socialmedia.utah.gov"]
            elif key=="florida":
                qs+= [f"{feature_summary} site:flsenate.gov",
                      f"{feature_summary} site:myfloridahouse.gov"]
            elif key in ("eu","european union"):
                qs+= [f"{feature_summary} site:eur-lex.europa.eu",
                      f"{feature_summary} site:ec.europa.eu",
                      f"{feature_summary} site:op.europa.eu"]
            elif key=="california":
                qs+= [f"{feature_summary} site:leginfo.legislature.ca.gov",
                      f"{feature_summary} site:oag.ca.gov"]
            qs+=[f"{feature_summary} {r} regulation site:.gov"]
        qs.append(f"{feature_summary} minors site:ncmec.org")
        return qs
    
    def _crawl_urls(self, urls, min_year: int | None, allow_wikipedia_without_year=False):
        fetched = fetch_html_bulk(urls)  # now returns (url, text, mime)
        out = []
        for url, text, mime in fetched:
            if not text:
                continue
            # If not a PDF, clean HTML; PDFs already have extracted plain text
            if "pdf" not in (mime or "").lower():
                text = html_to_clean_text(text)
            if min_year:
                if ("wikipedia.org" in url and allow_wikipedia_without_year) or year_present(text, min_year):
                    out.append(({"url": url, "title": "Fetched", "snippet": text[:220]}, text))
            else:
                out.append(({"url": url, "title": "Fetched", "snippet": text[:220]}, text))
        return out
    
        return out
    def run(self,params:LawFinderInput)->LawFinderOutput:
        seed_urls=[u for u in seeds_for_regions(params.regions) if allowed_for_regions(u,params.regions)]
        crawled=self._crawl_urls(seed_urls,params.min_year,allow_wikipedia_without_year=True)
        if not any("wikipedia.org" not in h["url"] for (h,_) in crawled):
            hits=smart_search_parallel(self._queries(params.feature_summary,params.regions),k=6)
            urls=[]; seen=set()
            for h in hits:
                u=h.get("url","")
                if not u or u in seen: continue
                if not allowed_for_regions(u,params.regions): continue
                seen.add(u); urls.append(u)
                if len(urls)>=6: break
            crawled+=self._crawl_urls(urls,params.min_year)
        if not crawled:
            crawled+=self._crawl_urls(CURATED,params.min_year)
        index_id=make_index_id(params.feature_summary,params.regions)
        docs=[]
        for h,text in crawled:
            for d in chunk_text(text):
                d.metadata.update({"url":h["url"],"title":h.get("title",""),
                                   "jurisdiction":infer_jurisdiction(h["url"],params.regions)})
                docs.append(d)
        if docs: build_index(self.index_root,index_id,docs)
        candidates=[]; seen=set()
        for h,text in crawled:
            u=h["url"]
            if u in seen: continue
            seen.add(u)
            candidates.append({
                "url":u,"title":h.get("title","") or "Untitled",
                "jurisdiction":infer_jurisdiction(u,params.regions),
                "snippet":(h.get("snippet") or text[:220]).strip(),
                "host_score":rank_key(u)
            })
        llm_scores = score_sources(params.feature_summary, params.regions, candidates) if candidates else []
        for c, s in zip(candidates, llm_scores):
            c["llm_score"] = s
            c["final_score"] = c["host_score"] + 10.0 * s
        ranked = sorted(candidates, key=lambda x: x.get("final_score", x["host_score"]), reverse=True)
        if any("wikipedia.org" not in s["url"] for s in ranked):
            ranked = [s for s in ranked if "wikipedia.org" not in s["url"]]
        sources=[Source(url=s["url"],title=s["title"],jurisdiction=s["jurisdiction"],snippet=s["snippet"]) for s in ranked[:10]]
        return LawFinderOutput(index_id=index_id,sources=sources)
