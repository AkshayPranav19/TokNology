import os, json, math, hashlib, time
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Body
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# --- Load env / Gemini ---
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
USE_GEMINI = bool(GOOGLE_API_KEY)

try:
    import google.generativeai as genai  # type: ignore
    if USE_GEMINI:
        genai.configure(api_key=GOOGLE_API_KEY)
        GEMINI_MODEL = "models/gemini-1.5-pro"
except Exception:
    USE_GEMINI = False
    GEMINI_MODEL = ""

app = FastAPI(title="Agent 3 Demo (Risk Arbiter)", version="0.1.0")

# ------------------------
# Demo: Define (but don't use) Agent1 / Agent2 payloads
# ------------------------
AGENT1_PAYLOAD = {
    "regulations": [
        {
            "id": "UT_SMR_2023",
            "jurisdiction": "Utah",
            "version": "2023-12",
            "citations": ["Utah Code §13-63-3", "HB465 (2023)"],
            "obligations": [
                {"id": "AGE_VERIFICATION", "text": "Verify a user's age for social media access.", "severity": "high"},
                {"id": "PARENTAL_CONSENT", "text": "Obtain verifiable parental consent for <18.", "severity": "high"},
                {"id": "CURFEW_BLOCK", "text": "Nighttime restrictions for minors.", "severity": "medium"},
                {"id": "GEOFENCE_UT", "text": "Apply controls for Utah residents.", "severity": "medium"},
                {"id": "AUDIT_LOGS", "text": "Maintain logs for compliance review.", "severity": "low"},
            ],
            "sources": [
                {"title":"Utah Social Media Regulation Act PDF","url":"https://dcp.utah.gov/wp-content/uploads/2023/12/Social-Media-Regulation-PDF.pdf"}
            ]
        },
        {
            "id": "EU_DSA",
            "jurisdiction": "EU",
            "version": "2022-2024",
            "citations": ["Regulation (EU) 2022/2065 (DSA)"],
            "obligations": [
                {"id": "AGE_APPROPRIATE", "text": "Age-appropriate measures for minors.", "severity": "medium"},
                {"id": "ADS_TO_MINORS", "text": "Restrictions on profiling minors for ads.", "severity": "high"},
            ],
            "sources": [
                {"title":"EUR-Lex 2022/2065","url":"https://eur-lex.europa.eu/eli/reg/2022/2065/oj"}
            ]
        }
    ]
}

AGENT2_PAYLOAD = {
    "feature": {
        "id": "curfew_login_blocker_utah",
        "title": "Curfew login blocker with ASL/GH for Utah minors",
        "regions": ["Utah"],
        "mitigations_present": ["CURFEW_BLOCK","GEOFENCE_UT","AUDIT_LOGS"],
    },
    "user_overrides": {}
}
# ------------------------

# ----------- Schemas -----------
class DemoInput(BaseModel):
    law_agent_input: Optional[Dict[str, Any]] = Field(
        default={
            "index_id": "fc53f13c56d4",
            "sources": [
                {
                    "url": "https://socialmedia.utah.gov/",
                    "title": "Fetched",
                    "jurisdiction": "Utah",
                    "snippet": "Utah State Legislature passed HB 465 and SB 194 ... to protect minors ..."
                },
                {
                    "url": "https://dcp.utah.gov/wp-content/uploads/2023/12/Social-Media-Regulation-PDF.pdf",
                    "title": "Fetched",
                    "jurisdiction": "Utah",
                    "snippet": "Utah Social Media Regulation Act ... General Requirements ..."
                },
                {
                    "url": "https://eur-lex.europa.eu/eli/reg/2022/2065/oj",
                    "title": "Fetched",
                    "jurisdiction": "EU",
                    "snippet": "Regulation (EU) 2022/2065 (DSA) ..."
                }
            ]
        },
        description="What Agent 1 scraped."
    )
    user_policy: Optional[Dict[str, Any]] = Field(
        default={
            "topic": "Curfew login blocker with ASL and GH for Utah minors",
            "description": (
                "To comply with the Utah Social Media Regulation Act, we are implementing a curfew-based login restriction for users under 18. "
                "The system uses ASL to detect minor accounts and routes enforcement through GH to apply only within Utah boundaries. "
                "The feature activates during restricted night hours and logs activity using EchoTrace for auditability. "
                "This allows parental control to be enacted without user-facing alerts, operating in ShadowMode during initial rollout."
            ),
            "document_points": []
        },
        description="User input / processed doc from Agent 2 (demo)."
    )
    use_gemini: bool = Field(default=True, description="Set false to force heuristic only.")

# ----------- Risk logic -----------
SEV_W = {"low": 1, "medium": 2, "high": 3}
JURIS_W = {"Utah": 1.0, "EU": 0.9, "US": 0.9, "SG": 0.8}
K = 6.0  # normalization curvature

def heuristic_alignments(user_text: str) -> List[Dict[str, Any]]:
    user_text = user_text.lower()
    obligations = [
        ("AGE_VERIFICATION", "Age verification / assurance", "high", "Utah",
         ["asl", "age", "minor"], ["no age", "anonymous access"]),
        ("PARENTAL_CONSENT", "Parental consent for <18", "high", "Utah",
         ["parental", "consent"], ["no consent", "skip consent"]),
        ("CURFEW_BLOCK", "Night curfew enforcement", "medium", "Utah",
         ["curfew", "night", "restricted"], []),
        ("GEOFENCE_UT", "Utah geofencing accuracy", "medium", "Utah",
         ["gh", "utah", "geofence", "boundary"], ["global", "worldwide"]),
        ("AUDIT_LOGS", "Compliance audit logging/retention", "low", "Utah",
         ["log", "echotrace", "audit"], []),
        ("TRANSPARENCY_NOTICE", "User transparency/notice (avoid shadow enforcement)", "medium", "Utah",
         ["notice", "explain", "disclosure"], ["shadowmode", "no alerts", "silent"]),
        ("APPEALS_OVERRIDE", "Appeals / emancipated minor override", "medium", "Utah",
         ["appeal", "override", "verification exception"], []),
        ("DATA_MINIMIZATION", "Data minimization for age signals", "low", "Utah",
         ["minimize", "hashed", "no retention"], ["store everything", "broad collection"]),
    ]
    aligns = []
    for oid, title, sev, jhint, positives, negatives in obligations:
        has_pos = any(p in user_text for p in positives) if positives else False
        has_neg = any(n in user_text for n in negatives) if negatives else False
        if has_pos and not has_neg:
            coverage, reason = "sufficient", "Detected explicit control signals."
        elif has_pos and has_neg:
            coverage, reason = "partial", "Control present but conflicted by risk phrase."
        elif (not has_pos) and has_neg:
            coverage, reason = "none", "Found risk phrase without corresponding control."
        else:
            coverage, reason = "partial", "Control not explicit; assumed partial coverage."
        aligns.append({
            "regulation_id": "UT_SMR_2023",
            "obligation_id": oid,
            "title": title,
            "coverage": coverage,
            "severity": sev,
            "reason": reason
        })
    return aligns

def gemini_alignments(user_text: str, law_agent_input: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not USE_GEMINI:
        return heuristic_alignments(user_text)
    system_msg = (
        "You are Agent 3 (Risk Arbiter). Output STRICT JSON with this key: "
        "\"obligation_alignments\": [{\"regulation_id\":\"string\",\"obligation_id\":\"string\","
        "\"title\":\"string\",\"coverage\":\"none|partial|sufficient\",\"severity\":\"low|medium|high\",\"reason\":\"string\"}]. "
        "Only discuss obligations relevant to Utah Social Media Regulation Act (UT_SMR_2023) for minors."
    )
    obligation_catalog = [
        {"id":"AGE_VERIFICATION","title":"Age verification / assurance","severity":"high"},
        {"id":"PARENTAL_CONSENT","title":"Parental consent for <18","severity":"high"},
        {"id":"CURFEW_BLOCK","title":"Night curfew enforcement","severity":"medium"},
        {"id":"GEOFENCE_UT","title":"Utah geofencing accuracy","severity":"medium"},
        {"id":"AUDIT_LOGS","title":"Compliance audit logging/retention","severity":"low"},
        {"id":"TRANSPARENCY_NOTICE","title":"User transparency/notice","severity":"medium"},
        {"id":"APPEALS_OVERRIDE","title":"Appeals / emancipated minor override","severity":"medium"},
        {"id":"DATA_MINIMIZATION","title":"Data minimization for age signals","severity":"low"}
    ]
    user_msg = {
        "LAW_SOURCES": law_agent_input.get("sources", []),
        "OBLIGATION_CATALOG": obligation_catalog,
        "PRODUCT_TEXT": user_text,
        "RULES": [
            "Map each catalog item to coverage: sufficient/partial/none.",
            "Keep reasons concise (<= 30 words).",
            "regulation_id must be 'UT_SMR_2023'."
        ]
    }
    try:
        model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=system_msg)  # type: ignore
        resp = model.generate_content(
            json.dumps(user_msg),
            generation_config={"temperature": 0.2, "response_mime_type": "application/json"},
        )
        raw = resp.text or "{}"
        data = json.loads(raw)
        aligns = data.get("obligation_alignments")
        if not isinstance(aligns, list):
            raise ValueError("Missing obligation_alignments")
        cleaned = []
        for a in aligns:
            cleaned.append({
                "regulation_id": a.get("regulation_id", "UT_SMR_2023"),
                "obligation_id": a.get("obligation_id", ""),
                "title": a.get("title", ""),
                "coverage": a.get("coverage", "partial"),
                "severity": a.get("severity", "medium"),
                "reason": a.get("reason", "")[:200]
            })
        return cleaned
    except Exception:
        return heuristic_alignments(user_text)

def compute_score(alignments: List[Dict[str, Any]], region: str = "Utah") -> Dict[str, Any]:
    raw = 0.0
    SEV_W = {"low": 1, "medium": 2, "high": 3}
    JURIS_W = {"Utah": 1.0, "EU": 0.9, "US": 0.9, "SG": 0.8}
    K = 6.0
    for a in alignments:
        sev = a.get("severity", "low")
        cov = a.get("coverage", "partial")
        gap = 0 if cov == "sufficient" else 1
        raw += gap * SEV_W.get(sev, 1) * JURIS_W.get(region, 1.0)
    risk = round(100 * (1 - math.exp(-raw / K)))
    level = "LOW" if risk < 25 else "MODERATE" if risk < 50 else "HIGH" if risk < 75 else "CRITICAL"
    return {"risk_score": risk, "risk_level": level, "raw": raw}

@app.post("/agent3/assess-demo")
def assess_demo(payload: DemoInput = Body(...)):
    regions = ["Utah"]
    regulations_hit = ["Utah Social Media Regulation Act (2023)"]
    up = payload.user_policy or {}
    topic = up.get("topic", "")
    desc = up.get("description", "")
    doc_points = up.get("document_points", [])
    text = f"{topic} {desc} {' '.join(map(str, doc_points))}"
    use_gemini_flag = payload.use_gemini and USE_GEMINI
    aligns = gemini_alignments(text, payload.law_agent_input or {}) if use_gemini_flag else heuristic_alignments(text)
    scoring = compute_score(aligns, region="Utah")
    drivers = [a for a in aligns if a.get("coverage") != "sufficient"]
    SEV_W = {"low": 1, "medium": 2, "high": 3}
    drivers_sorted = sorted(drivers, key=lambda a: SEV_W.get(a.get("severity","low"),1), reverse=True)[:3]
    citations = [
        {"label":"Utah Social Media Regulation Act (PDF)","url":"https://dcp.utah.gov/wp-content/uploads/2023/12/Social-Media-Regulation-PDF.pdf"},
        {"label":"Utah program site","url":"https://socialmedia.utah.gov/"}
    ]
    out = {
        "run_id": hashlib.sha1(f"{time.time()}".encode()).hexdigest()[:12],
        "regions": "Utah",
        "regulations_hit": regulations_hit,
        "risk_score": scoring["risk_score"],
        "risk_level": scoring["risk_level"],
        "why": [
            {
                "issue": a.get("title",""),
                "severity": a.get("severity","low"),
                "coverage": a.get("coverage","partial"),
                "rationale": a.get("reason","")
            } for a in drivers_sorted
        ],
        "obligations": aligns,
        "audit_citations": citations,
        "as_of": datetime.utcnow().isoformat() + "Z",
        "agent1_defined": AGENT1_PAYLOAD,
        "agent2_defined": AGENT2_PAYLOAD,
        "used_gemini": use_gemini_flag
    }
    return out

@app.get("/")
def root():
    port = int(os.getenv("PORT", "18002"))
    return {"ok": True, "service": "Agent3 Demo", "gemini_enabled": USE_GEMINI, "port_default": port}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "18002"))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
