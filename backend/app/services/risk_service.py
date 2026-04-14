import json
import re
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.contract import ContractChunk
from app.services.groq_service import generate_answer
from app.services.risk_rules import RISK_RULES

CHUNK_LIMIT = 12
MAX_SCORE = 100

SEVERITY_WEIGHTS = {
    "Low": 10,
    "Medium": 25,
    "High": 40,
}

CRITICAL_KEYWORDS = [
    "termination",
    "penalty",
    "liability",
    "indemnity",
    "warranty",
    "breach",
]

TYPE_SUBCATEGORIES = {
    "Financial": ["Payment Delay", "Unforeseen Costs", "Taxes & Duties", "Claims/Compensation"],
    "Legal": ["Termination", "Liability", "Indemnity", "Dispute Resolution"],
    "Compliance": ["Labor", "Environmental", "Data Privacy", "Regulations"],
    "Operational": ["Service Delivery", "Supply Chain", "Resource Availability", "Project Delays"],
}


def normalize_severity(value: str) -> str:
    value = value.lower()
    if "high" in value:
        return "High"
    if "medium" in value:
        return "Medium"
    return "Low"


def deduplicate_risks(risks):
    seen = set()
    unique = []
    for risk in risks:
        key = re.sub(r"\s+", "", risk["explanation"].lower() + risk["clause_excerpt"].lower())
        if key not in seen:
            seen.add(key)
            unique.append(risk)
    return unique


def calculate_risk_score(risks):
    score = 0
    for risk in risks:
        severity = risk.get("severity", "Low")
        confidence = risk.get("confidence", 0.5)
        weight = SEVERITY_WEIGHTS.get(severity, 0)
        clause = risk.get("clause_excerpt", "").lower()
        critical_boost = 1.5 if any(keyword in clause for keyword in CRITICAL_KEYWORDS) else 1.0
        score += weight * critical_boost * confidence
    return min(int(score), MAX_SCORE)


def categorize_distribution(risks):
    distribution = defaultdict(int)
    for risk in risks:
        distribution[risk.get("type", "Other")] += 1
    return dict(distribution)


def assign_subcategory(risk):
    if "subcategory" not in risk or not risk["subcategory"]:
        risk_type = risk.get("type", "Other")
        subcategories = TYPE_SUBCATEGORIES.get(risk_type, [])
        risk["subcategory"] = subcategories[0] if subcategories else "General"
    return risk


def fallback_risk_analysis(chunks):
    risks = []
    for chunk in chunks:
        lowered = chunk.content.lower()
        for rule in RISK_RULES:
            matched_keyword = next((keyword for keyword in rule["keywords"] if keyword in lowered), None)
            if not matched_keyword:
                continue

            risks.append(
                {
                    "type": rule["category"],
                    "subcategory": rule["category"],
                    "severity": rule["risk_level"],
                    "confidence": 0.65,
                    "explanation": f"Detected '{matched_keyword}' language that may indicate {rule['category'].lower()} risk.",
                    "clause_excerpt": chunk.content[:400],
                }
            )

    if not risks:
        return {
            "overall_risk_level": "Low",
            "risk_score": 10,
            "risk_distribution": {},
            "total_risks": 0,
            "confidence": 0.3,
            "risks": [],
        }

    unique_risks = deduplicate_risks(risks)
    score = calculate_risk_score(unique_risks)
    overall = "High" if score >= 70 else "Medium" if score >= 35 else "Low"
    return {
        "overall_risk_level": overall,
        "risk_score": score,
        "risk_distribution": categorize_distribution(unique_risks),
        "total_risks": len(unique_risks),
        "confidence": round(min(1.0, len(unique_risks) / 10), 2),
        "risks": unique_risks,
    }


def generate_risk_analysis(db: Session, contract_id: int):
    chunks = db.query(ContractChunk).filter(ContractChunk.contract_id == contract_id).all()

    if not chunks:
        return {"error": "No contract content found"}

    chunks = chunks[:CHUNK_LIMIT]
    all_risks = []

    base_prompt = """
You are a legal contract risk analysis AI.

Analyze this contract section and extract potential risks.

Return STRICT JSON in this format:

{
  "risks": [
    {
      "type": "Legal/Financial/Compliance/Operational",
      "subcategory": "Payment Delay / Liability / Labor / Supply Chain",
      "severity": "Low/Medium/High",
      "confidence": 0.0-1.0,
      "explanation": "Short explanation",
      "clause_excerpt": "Exact clause"
    }
  ]
}
"""

    for chunk in chunks:
        response = generate_answer(chunk.content, base_prompt)
        try:
            parsed = json.loads(response)
            risks = parsed.get("risks", [])
            for risk in risks:
                risk["severity"] = normalize_severity(risk.get("severity", "Low"))
                risk["confidence"] = float(risk.get("confidence", 0.5))
                assign_subcategory(risk)
            all_risks.extend(risks)
        except json.JSONDecodeError:
            continue

    if not all_risks:
        return fallback_risk_analysis(chunks)

    unique_risks = deduplicate_risks(all_risks)
    score = calculate_risk_score(unique_risks)
    overall = "High" if score >= 70 else "Medium" if score >= 35 else "Low"
    distribution = categorize_distribution(unique_risks)
    confidence = round(min(1.0, len(unique_risks) / 10), 2)

    return {
        "overall_risk_level": overall,
        "risk_score": score,
        "risk_distribution": distribution,
        "total_risks": len(unique_risks),
        "confidence": confidence,
        "risks": unique_risks,
    }
