import os
import re

from dotenv import load_dotenv
from groq import Groq

load_dotenv(override=True)

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


def is_ai_available() -> bool:
    return client is not None


def _extractive_fallback_answer(context: str, question: str, max_chars: int = 900) -> str:
    if not context:
        return "I could not find enough contract text to answer that yet."

    question_terms = {
        term
        for term in re.findall(r"[a-zA-Z0-9]+", question.lower())
        if len(term) > 2
    }
    sentences = [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?])\s+|\n+", context)
        if sentence.strip()
    ]

    if not sentences:
        return context[:500]

    ranked = []
    for sentence in sentences:
        sentence_terms = set(re.findall(r"[a-zA-Z0-9]+", sentence.lower()))
        overlap = len(question_terms.intersection(sentence_terms))
        ranked.append((overlap, len(sentence), sentence))

    ranked.sort(key=lambda item: (item[0], item[1]), reverse=True)
    top_sentences = [item[2] for item in ranked[:3] if item[0] > 0]

    if not top_sentences:
        top_sentences = [item[2] for item in ranked[:2]]

    answer = " ".join(top_sentences).strip()
    return answer[:max_chars] if answer else context[: min(500, max_chars)]


def generate_answer(
    context: str,
    question: str,
    response_style: str = "concise",
    max_tokens: int = 800,
):
    if client is None:
        max_chars = 1800 if response_style == "detailed" else 900
        return _extractive_fallback_answer(context, question, max_chars=max_chars)

    style_instruction = (
        "Provide a detailed, well-structured response with clear section headings and specific points."
        if response_style == "detailed"
        else "Answer clearly and concisely."
    )

    prompt = f"""
You are a legal AI assistant.

Answer the question using only the contract text provided below.

Contract Text:
{context}

Question:
{question}

{style_instruction}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a legal contract analysis expert."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception:
        max_chars = 1800 if response_style == "detailed" else 900
        return _extractive_fallback_answer(context, question, max_chars=max_chars)
