import os

from fastapi import APIRouter, Depends, File, HTTPException, Path, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contract import Contract, ContractChunk
from app.models.user import User
from app.schemas.contract_schema import ContractResponse
from app.services.chunking import chunk_text
from app.services.embedding_service import generate_embedding
from app.services.risk_engine import analyze_contract_risk
from app.services.risk_service import generate_risk_analysis
from app.services.search_service import semantic_search
from app.services.summary_service import generate_contract_summary
from app.utils.dashboard_utils import prepare_dashboard_data
from app.utils.security import get_current_user

router = APIRouter(prefix="/contracts", tags=["Contracts"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_owned_contract(contract_id: int, db: Session, current_user: User) -> Contract:
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.owner_id == current_user.id,
    ).first()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    return contract


@router.get("", response_model=list[ContractResponse])
def list_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Contract)
        .filter(Contract.owner_id == current_user.id)
        .order_by(Contract.created_at.desc())
        .all()
    )


@router.get("/{contract_id}", response_model=ContractResponse)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_owned_contract(contract_id, db, current_user)


@router.post("/upload", response_model=ContractResponse)
def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.endswith((".pdf", ".docx")):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX allowed")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    new_contract = Contract(filename=file.filename, file_path=file_path, owner_id=current_user.id)
    db.add(new_contract)
    db.commit()
    db.refresh(new_contract)

    try:
        chunks = chunk_text(file_path)
        if not chunks:
            raise HTTPException(status_code=400, detail="No readable text found in file")

        for chunk in chunks:
            db.add(
                ContractChunk(
                    contract_id=new_contract.id,
                    content=chunk,
                    embedding=generate_embedding(chunk),
                )
            )

        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Processing error: {exc}")

    return new_contract


@router.get("/{contract_id}/search")
def search_contract(
    contract_id: int,
    question: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_contract(contract_id, db, current_user)
    return semantic_search(db, contract_id, question)


@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contract = get_owned_contract(contract_id, db, current_user)

    if os.path.exists(contract.file_path):
        os.remove(contract.file_path)

    db.delete(contract)
    db.commit()
    return {"message": "Contract deleted successfully"}


@router.get("/{contract_id}/summary")
def contract_summary(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_contract(contract_id, db, current_user)
    return generate_contract_summary(db, contract_id)


@router.get("/{contract_id}/risk-analysis")
def contract_risk_analysis(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_contract(contract_id, db, current_user)
    return generate_risk_analysis(db, contract_id)


@router.get("/{contract_id}/advanced-risk")
def advanced_risk_analysis(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_contract(contract_id, db, current_user)
    chunks = db.query(ContractChunk).filter(ContractChunk.contract_id == contract_id).all()
    if not chunks:
        return {"error": "No contract found"}
    return analyze_contract_risk(chunks)


@router.get("/{contract_id}/risk-summary")
def contract_risk_summary(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_owned_contract(contract_id, db, current_user)
    return prepare_dashboard_data(generate_risk_analysis(db, contract_id))
