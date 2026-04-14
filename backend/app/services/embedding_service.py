import hashlib
from functools import lru_cache

VECTOR_SIZE = 384


@lru_cache(maxsize=1)
def get_model():
    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    except Exception:
        return None


def _fallback_embedding(text: str) -> list[float]:
    vector = [0.0] * VECTOR_SIZE
    for token in text.lower().split():
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        index = int(digest[:8], 16) % VECTOR_SIZE
        vector[index] += 1.0

    norm = sum(value * value for value in vector) ** 0.5 or 1.0
    return [value / norm for value in vector]


def generate_embedding(text: str) -> list[float]:
    model = get_model()
    if model is None:
        return _fallback_embedding(text)
    return model.encode(text).tolist()
