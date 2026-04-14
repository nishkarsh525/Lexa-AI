import os
from typing import List

from pypdf import PdfReader

try:
    import docx2txt
except Exception:
    docx2txt = None

MAX_CHUNK_SIZE = 500
OVERLAP_SIZE = 50


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, "rb") as pdf_file:
        reader = PdfReader(pdf_file)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_text_from_docx(file_path: str) -> str:
    if docx2txt is None:
        raise ValueError("DOCX support is unavailable because docx2txt is not installed")
    return docx2txt.process(file_path)


def chunk_text(file_path: str) -> List[str]:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        text = extract_text_from_pdf(file_path)
    elif ext == ".docx":
        text = extract_text_from_docx(file_path)
    else:
        raise ValueError("Unsupported file type: " + ext)

    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + MAX_CHUNK_SIZE
        chunk_words = words[start:end]
        chunks.append(" ".join(chunk_words))
        start += MAX_CHUNK_SIZE - OVERLAP_SIZE

    return chunks
