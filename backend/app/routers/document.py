from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pypdf import PdfReader
import io

from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    # Read PDF
    pdf_bytes = file.file.read()
    pdf_reader = PdfReader(io.BytesIO(pdf_bytes))

    extracted_text = ""
    for page in pdf_reader.pages:
        extracted_text += page.extract_text() or ""

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text")

    # Save to DB
    new_doc = Document(
        filename=file.filename,
        content=extracted_text,
        user_id=current_user.id
    )

    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "message": "Document uploaded successfully",
        "document_id": new_doc.id
    }