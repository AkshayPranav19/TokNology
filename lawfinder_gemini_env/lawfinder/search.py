
import concurrent.futures
from typing import List, Dict
def _ddgs_query(q:str,k:int)->List[Dict]:
    from ddgs import DDGS  # pip install ddgs
    out=[]
    with DDGS() as ddg:
        for r in ddg.text(q,max_results=k):
            out.append({
                "url": r.get("href") or r.get("url",""),
                "title": r.get("title",""),
                "snippet": r.get("body") or r.get("snippet","")
            })
    return out
def smart_search_parallel(queries:List[str],k:int=6,max_workers:int=6)->List[Dict]:
    def task(q:str)->List[Dict]:
        try: return _ddgs_query(q,k)
        except Exception: return []
    seen_q=set(); uniq=[q for q in queries if not(q in seen_q or seen_q.add(q))]
    results=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as ex:
        for batch in ex.map(task,uniq): results.extend(batch)
    return results
