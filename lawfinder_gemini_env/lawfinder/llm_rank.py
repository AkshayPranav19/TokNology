
from typing import List, Dict
from langchain_google_genai import ChatGoogleGenerativeAI
_llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
GLOSSARY = {
    "NR": "Not recommended",
    "PF": "Personalized feed",
    "GH": "Geo-handler; module for routing features by user region",
    "CDS": "Compliance Detection System",
    "DRT": "Data retention threshold; duration for which logs can be stored",
    "LCP": "Local compliance policy",
    "Redline": "Flag for legal review (internal meaning; not 'financial loss')",
    "Softblock": "User-level limitation applied silently without notifications",
    "Spanner": "Synthetic name for a rule engine (not Google Spanner)",
    "ShadowMode": "Deploy feature in non-user-impact way to collect analytics only",
    "T5": "Tier 5 sensitivity data; more critical than T1–T4 internally",
    "ASL": "Age-sensitive logic (detects minor accounts)",
    "Glow": "Compliance-flagging status used to indicate geo-based alerts",
    "NSP": "Non-shareable policy (content should not be shared externally)",
    "Jellybean": "Internal parental control system codename",
    "EchoTrace": "Log tracing mode to verify compliance routing",
    "BB": "Baseline Behavior; standard user behavior used for anomaly detection",
    "Snowcap": "Synthetic codename for child safety policy framework",
    "FR": "Feature rollout status",
    "IMT": "Internal monitoring trigger",
}

SYSTEM = (
    "You are ranking legal/government web pages for a compliance feature.\n"
    "Prefer official legislature or regulator pages over Wikipedia or media.\n"
    "Score 0-10: 0=irrelevant, 10=directly authoritative for the jurisdiction and topic.\n"
    "Use the glossary to interpret acronyms."
)
def score_sources(feature_summary: str, regions: List[str], items: List[Dict]) -> List[float]:
    glossary_text = "\n".join(f"{k} = {v}" for k,v in GLOSSARY.items())
    region_text = ", ".join(regions) if regions else "Unknown"
    rows = []
    for i, it in enumerate(items):
        rows.append(f"{i+1}. {it['url']}\nTitle: {it.get('title','')}\nSnippet: {it.get('snippet','')[:350]}")
    prompt = (
        f"{SYSTEM}\n\nGlossary:\n{glossary_text}\n\n"
        f"Feature:\n{feature_summary}\n\nJurisdiction(s): {region_text}\n\n"
        f"Pages:\n" + "\n\n".join(rows) +
        "\n\nReturn a JSON array of numbers (scores 0-10), one per page, no extra text."
    )
    resp = _llm.invoke(prompt).content.strip()
    try:
        import json
        scores = json.loads(resp)
        if not isinstance(scores, list):
            return [0.0]*len(items)
        out = []
        for i in range(len(items)):
            try:
                s = float(scores[i])
                out.append(max(0.0, min(10.0, s)))
            except Exception:
                out.append(0.0)
        return out
    except Exception:
        return [0.0]*len(items)
