
import re
from bs4 import BeautifulSoup
def html_to_clean_text(html: str, cap:int=80000) -> str:
    soup=BeautifulSoup(html,"html.parser")
    for t in soup(["script","style","noscript","nav","header","footer","form"]): t.decompose()
    text=soup.get_text(" ",strip=True)
    text=re.sub(r"\s+"," ",text)
    return text[:cap]
