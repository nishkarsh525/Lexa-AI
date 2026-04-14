from sqlalchemy.orm import Session

from app.models.contract import ContractChunk
from app.services.embedding_service import generate_embedding
from app.services.groq_service import generate_answer

SIMILARITY_THRESHOLD = 0.4
TOP_K = 5


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0

    numerator = sum(x * y for x, y in zip(a, b))
    a_norm = sum(x * x for x in a) ** 0.5
    b_norm = sum(y * y for y in b) ** 0.5
    if not a_norm or not b_norm:
        return 0.0

    return numerator / (a_norm * b_norm)


def semantic_search(db: Session, contract_id: int, question: str):
    if not question or not question.strip():
        return {"answer": "Please enter a question first.", "confidence": 0.0}

    query_embedding = generate_embedding(question)
    chunks = db.query(ContractChunk).filter(ContractChunk.contract_id == contract_id).all()

    ranked_chunks = sorted(
        (
            (chunk.content, cosine_similarity(query_embedding, chunk.embedding or []))
            for chunk in chunks
        ),
        key=lambda item: item[1],
        reverse=True,
    )[:TOP_K]

    if not ranked_chunks:
        return {"answer": "No relevant content found in this contract.", "confidence": 0.0}

    strong_chunks = []
    fallback_chunks = []
    similarity_scores = []
    for content, similarity in ranked_chunks:
        similarity_scores.append(similarity)
        fallback_chunks.append(content)
        if similarity >= SIMILARITY_THRESHOLD:
            strong_chunks.append(content)

    # Always attempt an answer from the best retrieved chunks.
    context_chunks = strong_chunks if strong_chunks else fallback_chunks
    context = "\n\n".join(context_chunks)
    answer = generate_answer(context, question)
    raw_confidence = sum(similarity_scores) / len(similarity_scores)
    avg_confidence = round(max(0.0, min(1.0, raw_confidence)), 2)
    return {"answer": answer, "confidence": avg_confidence}
