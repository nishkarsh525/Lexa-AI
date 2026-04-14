from app.services.risk_rules import RISK_RULES


def analyze_contract_risk(chunks):

    clause_results = []
    total_score = 0

    for chunk in chunks:
        text = chunk.content.lower()
        clause_score = 0
        matched_rules = []

        for rule in RISK_RULES:
            for keyword in rule["keywords"]:
                if keyword in text:
                    clause_score += rule["weight"]
                    matched_rules.append({
                        "category": rule["category"],
                        "risk_level": rule["risk_level"],
                        "keyword": keyword
                    })

        if clause_score > 0:
            total_score += clause_score

            clause_results.append({
                "clause_text": chunk.content[:500],
                "clause_risk_score": clause_score,
                "matched_rules": matched_rules
            })

    # 🔥 Overall Risk Rating
    if total_score >= 15:
        overall_risk = "High"
    elif total_score >= 7:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"

    return {
        "overall_risk": overall_risk,
        "total_risk_score": total_score,
        "risky_clauses_count": len(clause_results),
        "clause_analysis": clause_results
    }