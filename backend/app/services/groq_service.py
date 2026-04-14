import os
import re

from dotenv import load_dotenv
from groq import Groq

load_dotenv(override=True)

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


def _extractive_fallback_answer(context: str, question: str) -> str:
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
    return answer[:900] if answer else context[:500]


def generate_answer(context: str, question: str):
    if client is None:
        return _extractive_fallback_answer(context, question)

    prompt = f"""
You are a legal AI assistant.

Answer the question using only the contract text provided below.

Contract Text:
{context}

Question:
{question}

Answer clearly and concisely.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a legal contract analysis expert."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )
        return response.choices[0].message.content
    except Exception:
        return _extractive_fallback_answer(context, question)
