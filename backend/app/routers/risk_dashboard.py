# app/routers/risk_dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contract import Contract
from app.models.user import User
from app.services.risk_service import generate_risk_analysis
from app.utils.security import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Risk Dashboard"]
)

@router.get("/contracts/{contract_id}")
def risk_dashboard(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns advanced risk metrics for a contract.
    """
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.owner_id == current_user.id
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    analysis = generate_risk_analysis(db, contract_id)

    # If no risks found
    if "error" in analysis:
        return analysis

    risks = analysis.get("risks", [])

    # Distribution by subcategory
    subcategory_dist = {}
    for risk in risks:
        sub = risk.get("subcategory", "General")
        subcategory_dist[sub] = subcategory_dist.get(sub, 0) + 1

    return {
        "contract_id": contract_id,
        "overall_risk_level": analysis["overall_risk_level"],
        "risk_score": analysis["risk_score"],
        "total_risks": analysis["total_risks"],
        "confidence": analysis["confidence"],
        "risk_distribution": analysis["risk_distribution"],
        "risk_subcategory_distribution": subcategory_dist,
        "top_risks": risks[:5]  # top 5 risks for quick reference
    }
