# app/services/summary_service.py
from sqlalchemy.orm import Session
from app.models.contract import ContractChunk
from app.services.groq_service import generate_answer

CHUNK_SUMMARY_LIMIT = 15  # max number of chunks to summarize (safety limit)


def generate_contract_summary(db: Session, contract_id: int):
    """
    Multi-stage contract summary:
    1. Summarize individual chunks
    2. Combine summaries
    3. Generate structured executive summary
    """

    chunks = (
        db.query(ContractChunk)
        .filter(ContractChunk.contract_id == contract_id)
        .all()
    )

    if not chunks:
        return {"error": "No contract content found"}

    # Limit chunks for safety
    chunks = chunks[:CHUNK_SUMMARY_LIMIT]

    chunk_summaries = []

    # 🔹 Step 1: Summarize each chunk
    for chunk in chunks:
        prompt = f"""
Summarize the following contract section clearly and concisely:

{chunk.content}
"""
        summary = generate_answer(chunk.content, prompt)
        chunk_summaries.append(summary)

    # 🔹 Step 2: Combine summaries
    combined_summary_text = "\n\n".join(chunk_summaries)

    # 🔹 Step 3: Generate final structured summary
    final_prompt = f"""
You are a legal AI assistant.

Based on the contract summaries below, generate:

1. Executive Summary
2. Key Clauses
3. Payment Terms
4. Termination Conditions
5. Risks / Red Flags (if any)

Contract Summaries:
{combined_summary_text}
"""

    final_summary = generate_answer(combined_summary_text, final_prompt)

    return {
        "summary": final_summary
    }