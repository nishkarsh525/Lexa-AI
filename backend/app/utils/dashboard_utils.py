# app/utils/dashboard_utils.py

def prepare_dashboard_data(risk_data: dict):
    """
    Converts risk_data into frontend-ready dashboard info.
    """
    total_risks = risk_data.get("total_risks", 0)
    severity_counts = {"Low":0, "Medium":0, "High":0}

    for r in risk_data.get("risks", []):
        severity = r.get("severity", "Low")
        if severity in severity_counts:
            severity_counts[severity] += 1

    # Convert counts to percentages
    severity_percent = {k: round((v/total_risks*100), 2) if total_risks else 0
                        for k,v in severity_counts.items()}

    return {
        "overall_risk_level": risk_data.get("overall_risk_level"),
        "risk_score": risk_data.get("risk_score"),
        "confidence": risk_data.get("confidence"),
        "severity_percent": severity_percent,
        "total_risks": total_risks,
        "risk_distribution": risk_data.get("risk_distribution"),
        "risks": risk_data.get("risks")
    }