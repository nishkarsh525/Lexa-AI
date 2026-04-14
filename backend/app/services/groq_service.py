import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv(override=True)

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


def generate_answer(context: str, question: str):
    if client is None:
        return context[:1200] if context else "AI service is unavailable."

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
        return context[:1200] if context else "AI service is unavailable."
