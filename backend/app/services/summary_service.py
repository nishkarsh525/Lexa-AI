# from collections import Counter
# import re

# from sqlalchemy.orm import Session

# from app.models.contract import ContractChunk
# from app.services.groq_service import generate_answer, is_ai_available


# THEME_KEYWORDS = {
#     "commercial": ["payment", "fee", "invoice", "charges", "pricing", "tax", "late fee"],
#     "scope": ["scope", "services", "deliverables", "obligations", "performance", "timeline"],
#     "term": ["term", "effective date", "renewal", "duration", "expiry"],
#     "legal": ["liability", "indemnity", "warranty", "breach", "damages", "limitation"],
#     "termination": ["termination", "terminate", "notice", "dispute", "governing law", "arbitration"],
#     "data": ["confidential", "data", "privacy", "security", "personal data"],
#     "ip": ["intellectual property", "ip", "ownership", "license", "work product"],
# }


# def _normalize_text(text: str) -> str:
#     return re.sub(r"\s+", " ", text).strip()


# def _fallback_narrative_summary(full_text: str) -> str:
#     lowered = full_text.lower()
#     scores = Counter(
#         theme
#         for theme, keywords in THEME_KEYWORDS.items()
#         for keyword in keywords
#         if keyword in lowered
#     )

#     ordered_themes = [theme for theme, _ in scores.most_common()]

#     if not ordered_themes:
#         return (
#             "This contract appears to define a formal relationship between parties, outlining responsibilities, "
#             "operational expectations, and the legal framework for how the relationship is managed over time. "
#             "The extracted text does not clearly reveal enough specifics to confidently summarize commercial, "
#             "legal, and risk details beyond that overall purpose."
#         )

#     theme_phrases = {
#         "commercial": "how money flows between parties, including pricing, invoicing, and payment obligations",
#         "scope": "what work is expected, how services are delivered, and who is responsible for performance",
#         "term": "when the agreement starts, how long it runs, and how continuation or renewal is handled",
#         "legal": "risk allocation through liability, indemnity, and warranty-related clauses",
#         "termination": "how the relationship can end and how disputes are expected to be handled",
#         "data": "how confidentiality, data protection, and security obligations are managed",
#         "ip": "ownership and licensing rules for intellectual property and work outputs",
#     }

#     top_descriptions = [theme_phrases[t] for t in ordered_themes[:5] if t in theme_phrases]

#     first_paragraph = (
#         "This contract is primarily about establishing a structured working relationship between the parties, "
#         "with clear operational and legal boundaries for how the engagement should run."
#     )

#     second_paragraph = (
#         "At a high level, it focuses on "
#         + "; ".join(top_descriptions[:-1])
#         + (", and " + top_descriptions[-1] if len(top_descriptions) > 1 else top_descriptions[0] if top_descriptions else "core obligations and risk controls")
#         + "."
#     )

#     third_paragraph = (
#         "Overall, the agreement looks like a business-operating contract designed to align day-to-day delivery "
#         "with commercial accountability and legal protection, so both sides know what must be delivered, "
#         "how compliance is maintained, and what happens if the relationship changes or breaks down."
#     )

#     return "\n\n".join([first_paragraph, second_paragraph, third_paragraph])


# def generate_contract_summary(db: Session, contract_id: int):
#     chunks = (
#         db.query(ContractChunk)
#         .filter(ContractChunk.contract_id == contract_id)
#         .order_by(ContractChunk.id.asc())
#         .all()
#     )

#     if not chunks:
#         return {"error": "No contract content found"}

#     full_text = _normalize_text("\n".join(chunk.content for chunk in chunks))
#     if not full_text:
#         return {"error": "No contract content found"}

#     if not is_ai_available():
#         return {"summary": _fallback_narrative_summary(full_text)}

#     prompt = """
# Read the full contract text and write an overall synthesized summary in natural paragraphs.

# Requirements:
# - Explain what the contract is fundamentally about.
# - Describe the overall business arrangement and relationship between the parties.
# - Cover how obligations, commercial terms, and legal risk allocation are structured at a high level.
# - Mention how the contract handles continuity and end-of-relationship mechanics.
# - Use paraphrased language only (do not quote or copy clauses).
# - Do NOT produce bullet points, lists, or clause-by-clause extraction.
# - Output should be cohesive prose (about 3-6 paragraphs).
# """

#     summary = generate_answer(
#         full_text,
#         prompt,
#         response_style="detailed",
#         max_tokens=1600,
#     )

#     cleaned = _normalize_text(summary or "")
#     if len(cleaned) < 350:
#         cleaned = _fallback_narrative_summary(full_text)

#     return {"summary": cleaned}



from collections import Counter
import re

from sqlalchemy.orm import Session

from app.models.contract import ContractChunk
from app.services.groq_service import generate_answer, is_ai_available


THEME_KEYWORDS = {
    "commercial": ["payment", "fee", "invoice", "charges", "pricing", "tax", "late fee"],
    "scope": ["scope", "services", "deliverables", "obligations", "performance", "timeline"],
    "term": ["term", "effective date", "renewal", "duration", "expiry"],
    "legal": ["liability", "indemnity", "warranty", "breach", "damages", "limitation"],
    "termination": ["termination", "terminate", "notice", "dispute", "governing law", "arbitration"],
    "data": ["confidential", "data", "privacy", "security", "personal data"],
    "ip": ["intellectual property", "ip", "ownership", "license", "work product"],
}


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _clean_summary_text(text: str) -> str:
    paragraphs = [
        re.sub(r"\s+", " ", para).strip()
        for para in re.split(r"\n\s*\n", text)
        if para.strip()
    ]
    return "\n\n".join(paragraphs)


def _fallback_narrative_summary(full_text: str) -> str:
    lowered = full_text.lower()
    scores = Counter(
        theme
        for theme, keywords in THEME_KEYWORDS.items()
        for keyword in keywords
        if keyword in lowered
    )

    ordered_themes = [theme for theme, _ in scores.most_common()]

    if not ordered_themes:
        return (
            "This contract appears to define a formal relationship between parties, outlining responsibilities, "
            "operational expectations, and the legal framework for how the relationship is managed over time. "
            "The extracted text does not clearly reveal enough specifics to confidently summarize commercial, "
            "legal, and risk details beyond that overall purpose."
        )

    theme_phrases = {
        "commercial": "how money flows between parties, including pricing, invoicing, and payment obligations",
        "scope": "what work is expected, how services are delivered, and who is responsible for performance",
        "term": "when the agreement starts, how long it runs, and how continuation or renewal is handled",
        "legal": "risk allocation through liability, indemnity, and warranty-related clauses",
        "termination": "how the relationship can end and how disputes are expected to be handled",
        "data": "how confidentiality, data protection, and security obligations are managed",
        "ip": "ownership and licensing rules for intellectual property and work outputs",
    }

    top_descriptions = [theme_phrases[t] for t in ordered_themes[:5] if t in theme_phrases]

    first_paragraph = (
        "This contract is primarily about establishing a structured working relationship between the parties, "
        "with clear operational and legal boundaries for how the engagement should run."
    )

    second_paragraph = (
        "At a high level, it focuses on "
        + "; ".join(top_descriptions[:-1])
        + (
            ", and " + top_descriptions[-1]
            if len(top_descriptions) > 1
            else top_descriptions[0]
            if top_descriptions
            else "core obligations and risk controls"
        )
        + "."
    )

    third_paragraph = (
        "Overall, the agreement looks like a business-operating contract designed to align day-to-day delivery "
        "with commercial accountability and legal protection, so both sides know what must be delivered, "
        "how compliance is maintained, and what happens if the relationship changes or breaks down."
    )

    return "\n\n".join([first_paragraph, second_paragraph, third_paragraph])


def generate_contract_summary(db: Session, contract_id: int):
    chunks = (
        db.query(ContractChunk)
        .filter(ContractChunk.contract_id == contract_id)
        .order_by(ContractChunk.id.asc())
        .all()
    )

    if not chunks:
        return {"error": "No contract content found"}

    full_text = _normalize_text("\n".join(chunk.content for chunk in chunks))
    if not full_text:
        return {"error": "No contract content found"}

    if not is_ai_available():
        return {"summary": _fallback_narrative_summary(full_text)}

    prompt = """
Read the full contract text carefully and write a proper narrative summary in natural paragraphs.

Requirements:
- First explain what the contract is broadly about and what kind of relationship it creates between the parties.
- Then describe the overall business arrangement, obligations, commercial structure, and legal risk allocation.
- Also explain how the agreement deals with duration, renewal, termination, continuity, and dispute-related mechanics if present.
- Write like someone has read the whole document and is describing it in a clear professional way.
- Use paraphrased language only. Do not quote the contract.
- Do NOT produce bullet points, headings, clause-by-clause extraction, or fragmented sentences.
- Output should be 3 to 5 well-formed paragraphs.
"""

    summary = generate_answer(
        full_text,
        prompt,
        response_style="detailed",
        max_tokens=1600,
    )

    cleaned = _clean_summary_text(summary or "")
    if len(re.sub(r"\s+", " ", cleaned)) < 350:
        cleaned = _fallback_narrative_summary(full_text)

    return {"summary": cleaned}