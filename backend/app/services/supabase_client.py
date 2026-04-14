# app/services/groq_client.py
import os
from groq import Client  # correct import for the latest Groq SDK

# ---------------------------
# Groq API Initialization
# ---------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Client(api_key=GROQ_API_KEY)

# ---------------------------
# Generate answer from context
# ---------------------------
def generate_answer(context: str, question: str) -> str:
    """
    Send context + question to Groq and get the answer.
    """
    prompt = (
        f"Answer the question based on the context below:\n\n"
        f"Context:\n{context}\n\n"
        f"Question: {question}\nAnswer:"
    )

    # Call Groq completions endpoint
    response = client.completions.create(
        model="gpt-3.5-mini",  # replace with your Groq model
        prompt=prompt,
        max_tokens=200
    )

    # Extract the text from response
    try:
        return response.choices[0].text
    except (AttributeError, IndexError):
        # fallback in case the response format changes
        return str(response)