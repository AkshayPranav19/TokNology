
import re
from urllib.parse import urlparse

ALLOWED_DOMAINS = (".gov", ".gov.uk", ".eu", ".europa.eu", ".gc.ca", ".gov.sg")
ALLOWED_HOSTS = {
    "eur-lex.europa.eu", "ec.europa.eu", "edpb.europa.eu", "op.europa.eu",
    "law.cornell.edu",
    "www.missingkids.org", "missingkids.org",
    "en.wikipedia.org",
}
REGION_HOSTS = {
    "utah": {"le.utah.gov","dcp.utah.gov","socialmedia.utah.gov","utah.gov"},
    "florida": {"www.flsenate.gov","flsenate.gov","myfloridahouse.gov","fl.gov"},
    "california": {"leginfo.legislature.ca.gov","oag.ca.gov","ca.gov"},
    "eu": {"eur-lex.europa.eu","ec.europa.eu","op.europa.eu","europa.eu"},
    "european union": {"eur-lex.europa.eu","ec.europa.eu","op.europa.eu","europa.eu"},
}
def _host(url: str) -> str:
    return urlparse(url).netloc.lower()
def domain_allowed(url: str) -> bool:
    host = _host(url)
    return host in ALLOWED_HOSTS or any(host.endswith(d) for d in ALLOWED_DOMAINS)
def allowed_for_regions(url: str, regions: list[str]) -> bool:
    host = _host(url)
    if not regions:
        return domain_allowed(url)
    region_hosts = set()
    for r in regions:
        key = r.strip().lower()
        region_hosts |= REGION_HOSTS.get(key, set())
    if region_hosts and host in region_hosts:
        return True
    if any(r.lower() in ("eu","european union") for r in regions):
        if host.endswith(".europa.eu") or host in {"eur-lex.europa.eu","ec.europa.eu","op.europa.eu"}:
            return True
    if host.endswith(".senate.gov") and not any(r.lower() in ("us","united states","federal") for r in regions):
        return False
    return domain_allowed(url)
def year_present(text: str, min_year: int) -> bool:
    years = re.findall(r"\b(20\d{2})\b", text)
    return any(int(y) >= min_year for y in years)
def dedupe_by_url(items):
    seen, out = set(), []
    for it in items:
        u = it.get("url","")
        if not u or u in seen: continue
        seen.add(u); out.append(it)
    return out
PREFERRED_HOST_WEIGHT = {
    ".utah.gov": 120,"le.utah.gov":120,"dcp.utah.gov":115,"socialmedia.utah.gov":112,
    ".gov": 100, ".europa.eu": 95,
    "law.cornell.edu": 70,
    "en.wikipedia.org": 20,
}
def rank_key(url: str) -> int:
    host = _host(url)
    score = 0
    for k, w in PREFERRED_HOST_WEIGHT.items():
        if host == k or host.endswith(k):
            score = max(score, w)
    return score
