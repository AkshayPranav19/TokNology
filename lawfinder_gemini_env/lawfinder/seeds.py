
from typing import List, Dict
GLOBAL_SEEDS: List[str] = [
  "https://www.law.cornell.edu/uscode/text/18/2258A",
  "https://eur-lex.europa.eu/eli/reg/2022/2065/oj",
]
REGION_SEEDS: Dict[str, List[str]] = {
  "california": ["https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202320240SB976"],
  "florida": ["https://www.flsenate.gov/Session/Bill/2024/3"],
  "utah": [
      "https://socialmedia.utah.gov/",
      "https://dcp.utah.gov/wp-content/uploads/2023/12/Social-Media-Regulation-PDF.pdf"
  ],
  "eu": ["https://eur-lex.europa.eu/eli/reg/2022/2065/oj"],
  "european union": ["https://eur-lex.europa.eu/eli/reg/2022/2065/oj"],
}
def seeds_for_regions(regions: List[str]) -> List[str]:
    urls = list(GLOBAL_SEEDS)
    for r in regions:
        urls += REGION_SEEDS.get(r.lower().strip(), [])
    seen, out = set(), []
    for u in urls:
        if u in seen: continue
        seen.add(u); out.append(u)
    return out
